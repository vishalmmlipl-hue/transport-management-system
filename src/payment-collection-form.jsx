import React, { useState, useEffect } from 'react';
import { Save, Receipt, FileText, Wallet } from 'lucide-react';

export default function PaymentCollectionFormEnhanced() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [tbbClients, setTbbClients] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    setPayments(JSON.parse(localStorage.getItem('payments') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setTbbClients(JSON.parse(localStorage.getItem('tbbClients') || '[]'));
  }, []);

  const [formData, setFormData] = useState({
    receiptNumber: '',
    receiptDate: new Date().toISOString().split('T')[0],
    paymentType: 'Invoice', // 'Invoice', 'LR', or 'OnAccount'
    invoiceNumber: '',
    lrNumber: '',
    clientId: '',
    clientName: '',
    amount: '',
    paymentMode: 'Cash',
    chequeNumber: '',
    chequeDate: '',
    bankName: '',
    transactionId: '',
    upiId: '',
    cardLast4: '',
    remarks: ''
  });

  // Auto-generate Receipt Number
  useEffect(() => {
    const receiptNo = `RCP${String(payments.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, receiptNumber: receiptNo }));
  }, [payments.length]);

  // Auto-fill when invoice/LR/client selected
  useEffect(() => {
    if (formData.paymentType === 'Invoice' && formData.invoiceNumber) {
      const invoice = invoices.find(inv => inv.id.toString() === formData.invoiceNumber);
      if (invoice) {
        setFormData(prev => ({
          ...prev,
          clientName: invoice.clientName,
          amount: invoice.balanceAmount || invoice.totalAmount
        }));
      }
    } else if (formData.paymentType === 'LR' && formData.lrNumber) {
      const lr = lrBookings.find(l => l.id.toString() === formData.lrNumber);
      if (lr) {
        const client = lr.paymentMode === 'TBB' ? lr.tbbClient : lr.consignor.name;
        setFormData(prev => ({
          ...prev,
          clientName: client,
          amount: lr.totalAmount
        }));
      }
    } else if (formData.paymentType === 'OnAccount' && formData.clientId) {
      const client = tbbClients.find(c => c.id.toString() === formData.clientId);
      if (client) {
        setFormData(prev => ({
          ...prev,
          clientName: client.companyName
        }));
      }
    }
  }, [formData.paymentType, formData.invoiceNumber, formData.lrNumber, formData.clientId, invoices, lrBookings, tbbClients]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    
    const newPayment = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    existingPayments.push(newPayment);
    localStorage.setItem('payments', JSON.stringify(existingPayments));
    setPayments(existingPayments);

    // Update invoice status if payment is for invoice
    if (formData.paymentType === 'Invoice' && formData.invoiceNumber) {
      const invoicesList = JSON.parse(localStorage.getItem('invoices') || '[]');
      const invoice = invoicesList.find(inv => inv.id.toString() === formData.invoiceNumber);
      
      if (invoice) {
        const previousPayments = existingPayments
          .filter(p => p.invoiceNumber === formData.invoiceNumber && p.id !== newPayment.id)
          .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
        
        const totalPaid = previousPayments + parseFloat(formData.amount);
        const invoiceAmount = parseFloat(invoice.totalAmount);
        
        if (totalPaid >= invoiceAmount) {
          invoice.status = 'Paid';
          invoice.balanceAmount = '0';
        } else {
          invoice.status = 'Partially Paid';
          invoice.balanceAmount = (invoiceAmount - totalPaid).toFixed(2);
        }
        
        const updatedInvoices = invoicesList.map(inv => 
          inv.id === invoice.id ? invoice : inv
        );
        localStorage.setItem('invoices', JSON.stringify(updatedInvoices));
        setInvoices(updatedInvoices);
      }
    }

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Reset form but KEEP IT OPEN
    setFormData({
      receiptNumber: `RCP${String(existingPayments.length + 1).padStart(6, '0')}`,
      receiptDate: new Date().toISOString().split('T')[0],
      paymentType: 'Invoice',
      invoiceNumber: '',
      lrNumber: '',
      clientId: '',
      clientName: '',
      amount: '',
      paymentMode: 'Cash',
      chequeNumber: '',
      chequeDate: '',
      bankName: '',
      transactionId: '',
      upiId: '',
      cardLast4: '',
      remarks: ''
    });

    // Focus on payment type for quick next entry
    setTimeout(() => {
      document.querySelector('.payment-type-btn')?.focus();
    }, 100);
  };

  const getInvoiceDetails = (invoiceId) => {
    const invoice = invoices.find(inv => inv.id.toString() === invoiceId);
    if (!invoice) return '';
    
    const previousPayments = payments
      .filter(p => p.invoiceNumber === invoiceId)
      .reduce((sum, p) => sum + parseFloat(p.amount || 0), 0);
    
    const balance = parseFloat(invoice.totalAmount) - previousPayments;
    
    return `${invoice.invoiceNumber} | ${invoice.clientName} | Total: ₹${invoice.totalAmount} | Paid: ₹${previousPayments.toFixed(2)} | Balance: ₹${balance.toFixed(2)}`;
  };

  const getLRDetails = (lrId) => {
    const lr = lrBookings.find(l => l.id.toString() === lrId);
    return lr ? `${lr.lrNumber} | ${lr.consignee.name} | Amount: ₹${lr.totalAmount}` : '';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 p-6">
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
          border-left: 4px solid #10b981;
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
        
        .payment-type-selector {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .payment-type-btn {
          padding: 20px;
          border: 3px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          text-align: center;
          transition: all 0.2s ease;
          background: white;
        }
        
        .payment-type-btn:hover {
          border-color: #10b981;
          background: #f0fdf4;
          transform: translateY(-2px);
        }
        
        .payment-type-btn.active {
          border-color: #10b981;
          background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
          font-weight: 700;
          color: #065f46;
        }
        
        .payment-type-icon {
          margin: 0 auto 12px;
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f8fafc;
          border-radius: 50%;
        }
        
        .payment-type-btn.active .payment-type-icon {
          background: #10b981;
          color: white;
        }
        
        .success-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(16,185,129,0.3);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .payment-type-selector {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            💰 Payment Collection
          </h1>
          <p className="text-slate-600 text-lg">Record payments: Invoice, LR, or On Account</p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ Payment Recorded Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Ready for next payment...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Receipt Details */}
          <div className="form-section">
            <h2 className="section-title">Receipt Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Receipt Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.receiptNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Receipt Date *</label>
                <input
                  type="date"
                  value={formData.receiptDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiptDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                  style={{ 
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#10b981'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Payment Type Selector */}
          <div className="form-section">
            <h2 className="section-title">💳 Payment Type</h2>
            
            <div className="payment-type-selector">
              <div 
                className={`payment-type-btn ${formData.paymentType === 'Invoice' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  paymentType: 'Invoice',
                  lrNumber: '',
                  clientId: '',
                  invoiceNumber: '',
                  clientName: '',
                  amount: ''
                }))}
              >
                <div className="payment-type-icon">
                  <Receipt size={24} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>Invoice Payment</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Against TBB invoice</div>
              </div>
              
              <div 
                className={`payment-type-btn ${formData.paymentType === 'LR' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  paymentType: 'LR',
                  invoiceNumber: '',
                  clientId: '',
                  lrNumber: '',
                  clientName: '',
                  amount: ''
                }))}
              >
                <div className="payment-type-icon">
                  <FileText size={24} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>LR Payment</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Direct LR payment</div>
              </div>
              
              <div 
                className={`payment-type-btn ${formData.paymentType === 'OnAccount' ? 'active' : ''}`}
                onClick={() => setFormData(prev => ({ 
                  ...prev, 
                  paymentType: 'OnAccount',
                  invoiceNumber: '',
                  lrNumber: '',
                  clientId: '',
                  clientName: '',
                  amount: ''
                }))}
              >
                <div className="payment-type-icon">
                  <Wallet size={24} />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>On Account</div>
                <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Advance payment</div>
              </div>
            </div>

            {/* Invoice Selection */}
            {formData.paymentType === 'Invoice' && (
              <div className="input-group">
                <label>Select Invoice *</label>
                <select
                  value={formData.invoiceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                  required
                  autoFocus
                >
                  <option value="">-- Select Invoice --</option>
                  {invoices.filter(inv => inv.status !== 'Paid').map(invoice => (
                    <option key={invoice.id} value={invoice.id}>
                      {getInvoiceDetails(invoice.id)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* LR Selection */}
            {formData.paymentType === 'LR' && (
              <div className="input-group">
                <label>Select LR *</label>
                <select
                  value={formData.lrNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrNumber: e.target.value }))}
                  required
                  autoFocus
                >
                  <option value="">-- Select LR --</option>
                  {lrBookings.map(lr => (
                    <option key={lr.id} value={lr.id}>
                      {getLRDetails(lr.id)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* On Account - Client Selection */}
            {formData.paymentType === 'OnAccount' && (
              <>
                <div className="input-group">
                  <label>Select Client *</label>
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    required
                    autoFocus
                  >
                    <option value="">-- Select Client --</option>
                    {tbbClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.companyName} | GST: {client.gstNumber}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div style={{ 
                  background: '#fef3c7',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: '2px solid #fde68a',
                  color: '#92400e',
                  fontSize: '0.9rem'
                }}>
                  <strong>📌 On Account Payment:</strong> This payment will be recorded as advance/credit for the client. It can be adjusted against future invoices.
                </div>
              </>
            )}

            <div className="input-group">
              <label>Client/Payer Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="Auto-filled from selection"
                style={{ background: '#f8fafc' }}
              />
            </div>
          </div>

          {/* Payment Mode (same as before) */}
          <div className="form-section">
            <h2 className="section-title">Payment Mode</h2>
            
            <div className="input-group">
              <label>Payment Mode *</label>
              <select
                value={formData.paymentMode}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  paymentMode: e.target.value,
                  chequeNumber: '',
                  chequeDate: '',
                  bankName: '',
                  transactionId: '',
                  upiId: '',
                  cardLast4: ''
                }))}
                required
              >
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="NEFT">NEFT/RTGS</option>
                <option value="UPI">UPI</option>
                <option value="Card">Credit/Debit Card</option>
              </select>
            </div>

            {/* Cheque Details */}
            {formData.paymentMode === 'Cheque' && (
              <div className="grid-3">
                <div className="input-group">
                  <label>Cheque Number *</label>
                  <input
                    type="text"
                    value={formData.chequeNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, chequeNumber: e.target.value }))}
                    placeholder="Cheque No."
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Cheque Date *</label>
                  <input
                    type="date"
                    value={formData.chequeDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, chequeDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Bank Name *</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bank Name"
                    required
                  />
                </div>
              </div>
            )}

            {/* NEFT/RTGS Details */}
            {formData.paymentMode === 'NEFT' && (
              <div className="grid-2">
                <div className="input-group">
                  <label>Transaction ID *</label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Transaction/Reference No."
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Bank Name</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="Bank Name"
                  />
                </div>
              </div>
            )}

            {/* UPI Details */}
            {formData.paymentMode === 'UPI' && (
              <div className="grid-2">
                <div className="input-group">
                  <label>UPI Transaction ID *</label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="UPI Transaction ID"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>UPI ID/Address</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="example@paytm"
                  />
                </div>
              </div>
            )}

            {/* Card Details */}
            {formData.paymentMode === 'Card' && (
              <div className="grid-2">
                <div className="input-group">
                  <label>Transaction ID *</label>
                  <input
                    type="text"
                    value={formData.transactionId}
                    onChange={(e) => setFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Transaction ID"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Card Last 4 Digits</label>
                  <input
                    type="text"
                    value={formData.cardLast4}
                    onChange={(e) => setFormData(prev => ({ ...prev, cardLast4: e.target.value }))}
                    placeholder="XXXX"
                    maxLength="4"
                    pattern="[0-9]{4}"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Additional Notes</h2>
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

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} />
              Record Payment (Continue Adding)
            </button>
          </div>
        </form>

        {/* Recent Payments */}
        {payments.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Recent Payments ({payments.length})</h2>
            
            {payments.slice().reverse().slice(0, 10).map(payment => (
              <div key={payment.id} style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <h3 className="mono" style={{ fontSize: '1.2rem', color: '#10b981' }}>
                      {payment.receiptNumber}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {payment.receiptDate} | {payment.paymentMode}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                      ₹{parseFloat(payment.amount).toFixed(2)}
                    </div>
                    <span style={{ 
                      fontSize: '0.75rem',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: payment.paymentType === 'OnAccount' ? '#fef3c7' : payment.paymentType === 'Invoice' ? '#dbeafe' : '#fce7f3',
                      color: payment.paymentType === 'OnAccount' ? '#92400e' : payment.paymentType === 'Invoice' ? '#1e40af' : '#831843'
                    }}>
                      {payment.paymentType === 'OnAccount' ? 'On Account' : payment.paymentType}
                    </span>
                  </div>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <strong>Type:</strong> {payment.paymentType}
                  </div>
                  <div>
                    <strong>Reference:</strong> {
                      payment.paymentType === 'Invoice' 
                        ? invoices.find(inv => inv.id.toString() === payment.invoiceNumber)?.invoiceNumber 
                        : payment.paymentType === 'LR'
                        ? lrBookings.find(lr => lr.id.toString() === payment.lrNumber)?.lrNumber
                        : 'Advance'
                    }
                  </div>
                  <div>
                    <strong>Client:</strong> {payment.clientName}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
