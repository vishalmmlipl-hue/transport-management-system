import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Receipt, FileText, Wallet } from 'lucide-react';
import syncService from './utils/sync-service';
import databaseAPI from './utils/database-api';

export default function PaymentCollectionFormEnhanced() {
  const [payments, setPayments] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [tbbClients, setTbbClients] = useState([]);
  const [allClients, setAllClients] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    const parseMaybeJson = (value) => {
      if (value == null) return value;
      if (typeof value === 'object') return value;
      if (typeof value !== 'string') return value;
      const t = value.trim();
      if (!t) return value;
      try { return JSON.parse(t); } catch { return value; }
    };

    const normalizeClient = (c) => {
      if (!c) return null;
      const data = parseMaybeJson(c.data);
      const merged = (data && typeof data === 'object') ? { ...c, ...data } : { ...c };
      const clientType = (merged.clientType || merged.client_type || 'TBB').toString();
      return {
        ...merged,
        clientType,
        code: merged.code || merged.clientCode || merged.client_code,
        clientCode: merged.clientCode || merged.code || merged.client_code,
        companyName: merged.companyName || merged.clientName || merged.client_name || merged.tradeName,
        clientName: merged.clientName || merged.companyName || merged.client_name || merged.tradeName,
      };
    };

    const normalizeLR = (lr, table) => {
      if (!lr) return null;
      const data = parseMaybeJson(lr.data);
      const merged = (data && typeof data === 'object') ? { ...lr, ...data } : { ...lr };
      return {
        ...merged,
        __table: table,
        __key: `${table}:${lr.id}`,
        consignor: typeof merged.consignor === 'string' ? parseMaybeJson(merged.consignor) : (merged.consignor || {}),
        consignee: typeof merged.consignee === 'string' ? parseMaybeJson(merged.consignee) : (merged.consignee || {}),
        charges: typeof merged.charges === 'string' ? parseMaybeJson(merged.charges) : (merged.charges || {}),
      };
    };

    const loadAll = async () => {
      // Payments from server (shared)
      const paymentsRes = await syncService.load('payments').catch(() => ({ data: [] }));
      const paymentsData = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);
      const normalizedPayments = (paymentsData || []).map(p => {
        const d = parseMaybeJson(p?.data);
        const merged = (d && typeof d === 'object') ? { ...p, ...d } : { ...p };
        return {
          ...merged,
          receiptNumber: merged.receiptNumber || p.paymentNumber || '',
          receiptDate: merged.receiptDate || p.paymentDate || '',
          paymentType: merged.paymentType || 'Invoice',
        };
      });
      setPayments(normalizedPayments);

      // Invoices: try server first, fallback to localStorage (Billing form may still be local)
      const invoicesRes = await syncService.load('invoices').catch(() => ({ data: [] }));
      const serverInvoices = Array.isArray(invoicesRes) ? invoicesRes : (invoicesRes?.data || []);
      const localInvoices = (() => {
        try { return JSON.parse(localStorage.getItem('invoices') || '[]'); } catch { return []; }
      })();
      const invoiceMap = new Map();
      [...localInvoices, ...(serverInvoices || [])].forEach(inv => {
        if (!inv) return;
        const key = (inv.id ?? inv.invoiceNumber ?? '').toString();
        if (!key) return;
        invoiceMap.set(key, inv);
      });
      setInvoices(Array.from(invoiceMap.values()));

      // Clients from server so Cash/ToPay clients created during booking are visible everywhere
      const clientsRes = await syncService.load('clients').catch(() => ({ data: [] }));
      const rawClients = Array.isArray(clientsRes) ? clientsRes : (clientsRes?.data || []);
      const normalized = (rawClients || []).map(normalizeClient).filter(Boolean).filter(c => (c.status === 'Active' || !c.status));
      setAllClients(normalized);
      setTbbClients((normalized || []).filter(c => (c.clientType || '').toString().toUpperCase() === 'TBB'));

      // LRs from server (all tables)
      const [baseRes, ptlRes, ftlRes] = await Promise.all([
        syncService.load('lrBookings').catch(() => ({ data: [] })),
        syncService.load('ptlLRBookings').catch(() => ({ data: [] })),
        syncService.load('ftlLRBookings').catch(() => ({ data: [] })),
      ]);
      const base = (Array.isArray(baseRes) ? baseRes : (baseRes?.data || [])).map(r => normalizeLR(r, 'lrBookings')).filter(Boolean);
      const ptl = (Array.isArray(ptlRes) ? ptlRes : (ptlRes?.data || [])).map(r => normalizeLR(r, 'ptlLRBookings')).filter(Boolean);
      const ftl = (Array.isArray(ftlRes) ? ftlRes : (ftlRes?.data || [])).map(r => normalizeLR(r, 'ftlLRBookings')).filter(Boolean);
      setLrBookings([...(base || []), ...(ptl || []), ...(ftl || [])]);
    };

    loadAll();
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
    const receiptNo = `RCP${String((payments?.length || 0) + 1).padStart(6, '0')}`;
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
      const lr = lrBookings.find(l => l.__key?.toString() === formData.lrNumber?.toString());
      if (lr) {
        let clientLabel = '';
        if (lr.paymentMode === 'TBB' && lr.tbbClient) {
          const c = allClients.find(x => x.id?.toString() === lr.tbbClient?.toString());
          clientLabel = c ? (c.companyName || c.clientName || '') : '';
        } else {
          clientLabel = lr.cashToPayClientName || lr.customerClientName || lr.consignor?.name || '';
        }
        setFormData(prev => ({
          ...prev,
          clientName: clientLabel,
          amount: lr.totalAmount || lr.charges?.grandTotal || ''
        }));
      }
    } else if (formData.paymentType === 'OnAccount' && formData.clientId) {
      const client = allClients.find(c => c.id?.toString() === formData.clientId?.toString());
      if (client) {
        setFormData(prev => ({
          ...prev,
          clientName: client.companyName || client.clientName || ''
        }));
      }
    }
  }, [formData.paymentType, formData.invoiceNumber, formData.lrNumber, formData.clientId, invoices, lrBookings, allClients]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Map UI fields → DB fields
    const paymentNumber = formData.receiptNumber;
    const paymentDate = formData.receiptDate;
    const amount = String(formData.amount || '');

    let invoiceNumbers = '';
    let lrMeta = null;
    if (formData.paymentType === 'Invoice' && formData.invoiceNumber) {
      const inv = invoices.find(i => i.id?.toString() === formData.invoiceNumber?.toString());
      invoiceNumbers = inv?.invoiceNumber || '';
    }
    if (formData.paymentType === 'LR' && formData.lrNumber) {
      lrMeta = lrBookings.find(l => l.__key?.toString() === formData.lrNumber?.toString()) || null;
      invoiceNumbers = lrMeta?.lrNumber || '';
    }

    const paymentPayload = {
      paymentNumber,
      paymentDate,
      clientId: formData.clientId || '',
      clientName: formData.clientName || '',
      amount,
      paymentMode: formData.paymentMode || '',
      invoiceNumbers,
      data: {
        ...formData,
        paymentType: formData.paymentType,
        lrKey: formData.paymentType === 'LR' ? formData.lrNumber : '',
        lrTable: lrMeta?.__table || '',
        lrId: lrMeta?.id || '',
        lrNumber: lrMeta?.lrNumber || '',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await syncService.save('payments', paymentPayload, false, null);
    if (!saved?.success) {
      alert(`❌ Failed to save payment.\n\n${saved?.error || 'Unknown error'}`);
      return;
    }

    // If this is an LR payment, also update that LR record so advance/payment is stored against it.
    if (formData.paymentType === 'LR' && lrMeta?.__table && lrMeta?.id) {
      try {
        const row = await databaseAPI.getById(lrMeta.__table, lrMeta.id);
        const parsedData = (() => {
          if (!row?.data) return {};
          if (typeof row.data === 'object') return row.data;
          try { return JSON.parse(row.data); } catch { return {}; }
        })();
        const existingPayments = Array.isArray(parsedData.receivedPayments) ? parsedData.receivedPayments : [];
        const newEntry = {
          paymentNumber,
          paymentDate,
          amount: parseFloat(amount) || 0,
          paymentMode: formData.paymentMode || '',
          remarks: formData.remarks || '',
          createdAt: new Date().toISOString(),
        };
        const updatedPayments = [...existingPayments, newEntry];
        const paidTotal = updatedPayments.reduce((s, p) => s + (parseFloat(p?.amount) || 0), 0);
        const lrTotal = parseFloat(lrMeta.totalAmount || row.totalAmount || 0) || 0;
        const balance = Math.max(0, lrTotal - paidTotal);

        const nextData = {
          ...parsedData,
          receivedPayments: updatedPayments,
          paidAmount: paidTotal,
          balanceAmount: balance,
          paymentReceived: balance <= 0 ? true : (parsedData.paymentReceived ?? false),
        };
        await databaseAPI.update(lrMeta.__table, lrMeta.id, { data: nextData });
      } catch (err) {
        console.error('Failed updating LR with payment info:', err);
      }
    }

    // Reload payments list from server (so it shows on other systems too)
    const paymentsRes = await syncService.load('payments', true).catch(() => ({ data: [] }));
    const paymentsData = Array.isArray(paymentsRes) ? paymentsRes : (paymentsRes?.data || []);
    const normalizedPayments = (paymentsData || []).map(p => {
      const d = (() => {
        if (!p?.data) return null;
        if (typeof p.data === 'object') return p.data;
        try { return JSON.parse(p.data); } catch { return null; }
      })();
      const merged = (d && typeof d === 'object') ? { ...p, ...d } : { ...p };
      return {
        ...merged,
        receiptNumber: merged.receiptNumber || p.paymentNumber || '',
        receiptDate: merged.receiptDate || p.paymentDate || '',
        paymentType: merged.paymentType || 'Invoice',
      };
    });
    setPayments(normalizedPayments);

    // Update invoice status if payment is for invoice
    if (formData.paymentType === 'Invoice' && formData.invoiceNumber) {
      const invoicesList = JSON.parse(localStorage.getItem('invoices') || '[]');
      const invoice = invoicesList.find(inv => inv.id.toString() === formData.invoiceNumber);
      
      if (invoice) {
        const previousPayments = (paymentsData || [])
          .filter(p => (p?.data && (typeof p.data === 'string' ? p.data.includes(`\"invoiceNumber\":\"${formData.invoiceNumber}\"`) : (p.data.invoiceNumber === formData.invoiceNumber))) )
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
      receiptNumber: `RCP${String((paymentsData?.length || 0) + 1).padStart(6, '0')}`,
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
    const lr = lrBookings.find(l => l.__key?.toString() === lrId?.toString());
    const mode = lr?.__table === 'ftlLRBookings' ? 'FTL' : (lr?.__table === 'ptlLRBookings' ? 'PTL' : 'PTL');
    return lr ? `${lr.lrNumber} | ${mode} | ${lr.consignee?.name || ''} | Amount: ₹${lr.totalAmount || 0}` : '';
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
                    <option key={lr.__key || lr.id} value={lr.__key || lr.id}>
                      {getLRDetails(lr.__key || lr.id)}
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
                    {allClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {(client.companyName || client.clientName)} | {(client.clientType || '').toString().toUpperCase()}
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
                        ? (payment.lrNumber || payment.invoiceNumbers || '')
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
