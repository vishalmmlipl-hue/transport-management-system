import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';

export default function BillingForm() {
  const [allClients, setAllClients] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  
  useEffect(() => {
    // Load all clients (TBB, Cash, ToPay)
    const clients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    setAllClients(clients);
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
  }, []);

  const [formData, setFormData] = useState({
    invoiceNumber: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    client: '',
    billingPeriod: 'Monthly',
    periodFrom: '',
    periodTo: '',
    selectedLRs: [],
    subtotal: 0,
    gstPercent: 18,
    gstAmount: 0,
    tdsPercent: 0,
    tdsAmount: 0,
    discount: 0,
    totalAmount: 0,
    dueDate: '',
    paymentTerms: '',
    remarks: '',
    status: 'Pending'
  });

  // Auto-generate invoice number
  useEffect(() => {
    const invNo = `INV${String(invoices.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, invoiceNumber: invNo }));
  }, [invoices.length]);

  // Calculate totals
  useEffect(() => {
    const selectedLRDetails = lrBookings.filter(lr => 
      formData.selectedLRs.includes(lr.id)
    );

    const subtotal = selectedLRDetails.reduce((sum, lr) => 
      sum + (parseFloat(lr.totalAmount) || 0), 0
    );

    const gst = (subtotal * formData.gstPercent) / 100;
    const tds = (subtotal * formData.tdsPercent) / 100;
    const discount = parseFloat(formData.discount) || 0;
    const total = subtotal + gst - tds - discount;

    setFormData(prev => ({
      ...prev,
      subtotal: subtotal,
      gstAmount: gst,
      tdsAmount: tds,
      totalAmount: total
    }));
  }, [formData.selectedLRs, formData.gstPercent, formData.tdsPercent, formData.discount, lrBookings]);

  // Load payment terms when client selected
  useEffect(() => {
    if (formData.client) {
      const client = allClients.find(c => c.id.toString() === formData.client);
      if (client && client.billing && client.billing.paymentTerms) {
        setFormData(prev => ({
          ...prev,
          paymentTerms: client.billing.paymentTerms
        }));
      } else if (client) {
        // If client exists but no billing info, set empty string
        setFormData(prev => ({
          ...prev,
          paymentTerms: ''
        }));
      }
    }
  }, [formData.client, allClients]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.selectedLRs.length === 0) {
      alert('⚠️ Please select at least one LR!');
      return;
    }

    const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    
    const selectedLRDetails = lrBookings.filter(lr => 
      formData.selectedLRs.includes(lr.id)
    );

    const newInvoice = {
      id: Date.now(),
      ...formData,
      lrDetails: selectedLRDetails,
      createdAt: new Date().toISOString()
    };

    existingInvoices.push(newInvoice);
    localStorage.setItem('invoices', JSON.stringify(existingInvoices));
    setInvoices(existingInvoices);

    alert(`✅ Invoice "${formData.invoiceNumber}" created successfully!\n\nClient: ${allClients.find(c => c.id.toString() === formData.client)?.companyName}\nTotal LRs: ${selectedLRDetails.length}\nAmount: ₹${formData.totalAmount.toFixed(2)}`);
    
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const handleLRToggle = (lrId) => {
    setFormData(prev => ({
      ...prev,
      selectedLRs: prev.selectedLRs.includes(lrId)
        ? prev.selectedLRs.filter(id => id !== lrId)
        : [...prev.selectedLRs, lrId]
    }));
  };

  const getClientName = (clientId) => {
    const client = allClients.find(c => c.id.toString() === clientId);
    return client ? client.companyName : 'N/A';
  };

  const getClientType = (clientId) => {
    const client = allClients.find(c => c.id.toString() === clientId);
    return client ? client.clientType : 'N/A';
  };

  // Filter LRs by selected client
  const clientLRs = formData.client 
    ? lrBookings.filter(lr => {
        const client = allClients.find(c => c.id.toString() === formData.client);
        if (!client) return false;
        
        if (client.clientType === 'TBB') {
          // For TBB clients, match tbbClient field
          return (lr.tbbClient === formData.client || 
                  lr.tbbClient?.toString() === formData.client.toString()) &&
                 lr.paymentMode === 'TBB';
        } else if (client.clientType === 'Cash') {
          // For Cash clients, show all Cash payment mode LRs
          // User can manually select which ones belong to this client
          return lr.paymentMode === 'Cash';
        } else if (client.clientType === 'ToPay') {
          // For ToPay clients, show all ToPay payment mode LRs
          // User can manually select which ones belong to this client
          return lr.paymentMode === 'ToPay';
        }
        return false;
      })
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .mono {
          font-family: 'Space Mono', monospace;
        }
        
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #a855f7;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(168,85,247,0.1);
          transform: translateY(-2px);
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .input-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 6px;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(168,85,247,0.3);
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        .lr-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .lr-card:hover {
          border-color: #a855f7;
          background: #faf5ff;
        }
        
        .lr-card.selected {
          background: #a855f7;
          color: white;
          border-color: #a855f7;
        }
        
        .summary-box {
          background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 16px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .summary-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        .invoice-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        
        .invoice-table th {
          background: #f1f5f9;
          padding: 12px 8px;
          text-align: left;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        
        .invoice-table td {
          padding: 10px 8px;
          font-size: 0.85rem;
          border: 1px solid #e2e8f0;
        }
        
        @media print {
          .no-print {
            display: none !important;
          }
          
          .print-area {
            display: block !important;
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 no-print">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Billing & Invoice
          </h1>
          <p className="text-slate-600 text-lg">Generate Invoices for Any Client (TBB, Cash, or ToPay)</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Invoice Details */}
          <div className="form-section no-print">
            <h2 className="section-title">Invoice Details</h2>
            
            <div className="grid-4">
              <div className="input-group">
                <label>Invoice Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.invoiceNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="Pending">Pending</option>
                  <option value="Partially Paid">Partially Paid</option>
                  <option value="Paid">Paid</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Client *</label>
                <select
                  value={formData.client}
                  onChange={(e) => setFormData(prev => ({ ...prev, client: e.target.value, selectedLRs: [] }))}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {allClients.filter(c => c.status === 'Active').map(client => (
                    <option key={client.id} value={client.id}>
                      {client.companyName} ({client.code}) - {client.clientType || 'TBB'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Billing Period *</label>
                <select
                  value={formData.billingPeriod}
                  onChange={(e) => setFormData(prev => ({ ...prev, billingPeriod: e.target.value }))}
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Weekly">Weekly</option>
                  <option value="Fortnightly">Fortnightly</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Period From</label>
                <input
                  type="date"
                  value={formData.periodFrom}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodFrom: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Period To</label>
                <input
                  type="date"
                  value={formData.periodTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, periodTo: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* LR Selection */}
          {formData.client && (
            <div className="form-section no-print">
              <h2 className="section-title">
                Select LR Bookings ({getClientType(formData.client)} Client)
              </h2>
              
              {clientLRs.length === 0 ? (
                <div style={{
                  padding: '20px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px solid #fbbf24',
                  color: '#92400e',
                  textAlign: 'center'
                }}>
                  ⚠️ No LRs found for this {getClientType(formData.client)} client
                </div>
              ) : (
                <div>
                  <p style={{ marginBottom: '16px', color: '#64748b' }}>
                    Click on LR cards to select/deselect them
                  </p>
                  
                  {clientLRs.map(lr => (
                    <div
                      key={lr.id}
                      className={`lr-card ${formData.selectedLRs.includes(lr.id) ? 'selected' : ''}`}
                      onClick={() => handleLRToggle(lr.id)}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong className="mono">{lr.lrNumber}</strong>
                          <span style={{ marginLeft: '12px', opacity: 0.8 }}>
                            {lr.bookingDate}
                          </span>
                        </div>
                        <div>
                          <strong>₹{lr.totalAmount}</strong>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '0.9rem', opacity: 0.9 }}>
                        {lr.consignor.name} → {lr.consignee.name}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Calculation Summary */}
          {formData.selectedLRs.length > 0 && (
            <div className="summary-box no-print">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
                Invoice Summary
              </h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-value">{formData.selectedLRs.length}</div>
                  <div className="summary-label">Total LRs</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{formData.subtotal.toFixed(2)}</div>
                  <div className="summary-label">Subtotal</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{formData.gstAmount.toFixed(2)}</div>
                  <div className="summary-label">GST ({formData.gstPercent}%)</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{formData.totalAmount.toFixed(2)}</div>
                  <div className="summary-label">Total Amount</div>
                </div>
              </div>
            </div>
          )}

          {/* Tax & Discount */}
          <div className="form-section no-print">
            <h2 className="section-title">Tax & Discount</h2>
            
            <div className="grid-4">
              <div className="input-group">
                <label>GST % *</label>
                <select
                  value={formData.gstPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstPercent: parseFloat(e.target.value) }))}
                  required
                >
                  <option value="0">0% (Exempt)</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>GST Amount (₹)</label>
                <input
                  type="number"
                  value={formData.gstAmount.toFixed(2)}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>TDS %</label>
                <input
                  type="number"
                  value={formData.tdsPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, tdsPercent: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  step="0.01"
                />
              </div>
              
              <div className="input-group">
                <label>Discount (₹)</label>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount: e.target.value }))}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="form-section no-print">
            <h2 className="section-title">Payment Terms & Remarks</h2>
            
            <div className="input-group">
              <label>Payment Terms</label>
              <textarea
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder="Payment terms and conditions..."
                rows="2"
              />
            </div>
            
            <div className="input-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any additional notes..."
                rows="2"
              />
            </div>
          </div>

          {/* Print Preview */}
          {formData.selectedLRs.length > 0 && (
            <div className="form-section" style={{ display: 'none', '@media print': { display: 'block' } }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>TAX INVOICE</h1>
                <div className="mono" style={{ fontSize: '1.2rem' }}>{formData.invoiceNumber}</div>
                <div style={{ marginTop: '8px' }}>Date: {formData.invoiceDate}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <strong>Bill To:</strong><br/>
                  {getClientName(formData.client)}<br/>
                  Period: {formData.periodFrom} to {formData.periodTo}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <strong>Due Date:</strong> {formData.dueDate}<br/>
                  <strong>Status:</strong> {formData.status}
                </div>
              </div>

              <table className="invoice-table">
                <thead>
                  <tr>
                    <th>S.No</th>
                    <th>LR Number</th>
                    <th>Date</th>
                    <th>From</th>
                    <th>To</th>
                    <th style={{ textAlign: 'right' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {lrBookings.filter(lr => formData.selectedLRs.includes(lr.id)).map((lr, index) => (
                    <tr key={lr.id}>
                      <td>{index + 1}</td>
                      <td className="mono">{lr.lrNumber}</td>
                      <td>{lr.bookingDate}</td>
                      <td>{lr.consignor.name}</td>
                      <td>{lr.consignee.name}</td>
                      <td style={{ textAlign: 'right' }}>{parseFloat(lr.totalAmount).toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600, background: '#f1f5f9' }}>
                    <td colSpan="5" style={{ textAlign: 'right' }}>Subtotal:</td>
                    <td style={{ textAlign: 'right' }}>₹{formData.subtotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'right' }}>GST ({formData.gstPercent}%):</td>
                    <td style={{ textAlign: 'right' }}>₹{formData.gstAmount.toFixed(2)}</td>
                  </tr>
                  {formData.tdsAmount > 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'right' }}>TDS ({formData.tdsPercent}%):</td>
                      <td style={{ textAlign: 'right' }}>-₹{formData.tdsAmount.toFixed(2)}</td>
                    </tr>
                  )}
                  {formData.discount > 0 && (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'right' }}>Discount:</td>
                      <td style={{ textAlign: 'right' }}>-₹{parseFloat(formData.discount).toFixed(2)}</td>
                    </tr>
                  )}
                  <tr style={{ fontWeight: 700, background: '#f1f5f9', fontSize: '1.1rem' }}>
                    <td colSpan="5" style={{ textAlign: 'right' }}>TOTAL AMOUNT:</td>
                    <td style={{ textAlign: 'right' }}>₹{formData.totalAmount.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>

              {formData.paymentTerms && (
                <div style={{ marginTop: '24px' }}>
                  <strong>Payment Terms:</strong> {formData.paymentTerms}
                </div>
              )}

              <div style={{ marginTop: '48px', textAlign: 'right' }}>
                <div style={{ borderTop: '2px solid #000', paddingTop: '8px', display: 'inline-block', minWidth: '200px' }}>
                  Authorized Signature
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ textAlign: 'center', marginTop: '30px' }} className="no-print">
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Create Invoice & Print
            </button>
          </div>
        </form>

        {/* Invoice List */}
        {invoices.length > 0 && (
          <div className="form-section no-print" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Recent Invoices</h2>
            
            {invoices.slice().reverse().slice(0, 10).map(invoice => (
              <div key={invoice.id} style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 className="mono" style={{ fontSize: '1.2rem' }}>{invoice.invoiceNumber}</h3>
                    <p style={{ color: '#64748b' }}>{invoice.invoiceDate}</p>
                  </div>
                  <div style={{
                    padding: '4px 12px',
                    background: invoice.status === 'Paid' ? '#d1fae5' : '#fef3c7',
                    color: invoice.status === 'Paid' ? '#065f46' : '#92400e',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    fontWeight: 600
                  }}>
                    {invoice.status}
                  </div>
                </div>
                <div style={{ marginTop: '12px', fontSize: '0.9rem' }}>
                  <strong>Client:</strong> {getClientName(invoice.client)}<br/>
                  <strong>LRs:</strong> {(invoice.selectedLRs?.length || invoice.lrDetails?.length || invoice.lrNumbers?.length || 0)} | 
                  <strong> Amount:</strong> ₹{(invoice.totalAmount || 0).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
