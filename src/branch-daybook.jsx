import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Plus, Image, X } from 'lucide-react';
import { createBranchExpenseLedger } from './utils/ledgerService';

export default function BranchDayBook() {
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [dayBookData, setDayBookData] = useState({
    openingBalance: 0,
    receipts: [],
    payments: [],
    closingBalance: 0
  });

  const [expenseForm, setExpenseForm] = useState({
    expenseDate: new Date().toISOString().split('T')[0],
    expenseCategory: '',
    expenseType: '',
    account: '',
    amount: '',
    paymentMode: 'Cash',
    paidTo: '',
    description: '',
    billNumber: '',
    gstAmount: '',
    remarks: '',
    paymentScreenshot: null // Base64 string or file reference
  });
  const [screenshotPreview, setScreenshotPreview] = useState(null);

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [branchAccounts, setBranchAccounts] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [expenseMaster, setExpenseMaster] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showScreenshotModal, setShowScreenshotModal] = useState(false);
  const [viewingScreenshot, setViewingScreenshot] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    setBranches(allBranches.filter(b => b.status === 'Active'));
    
    const allBranchAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
    setBranchAccounts(allBranchAccounts.filter(a => a.status === 'Active'));
    
    const allExpenses = JSON.parse(localStorage.getItem('branchExpenses') || '[]');
    setExpenses(allExpenses);
    
    const allExpenseMaster = JSON.parse(localStorage.getItem('expenseMaster') || '[]');
    setExpenseMaster(allExpenseMaster.filter(em => em.status === 'Active'));
    
    const allAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    setAccounts(allAccounts.filter(a => a.status === 'Active'));
    
    // Check if admin
    const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const systemUser = systemUsers.find(u => u.username === user?.username);
    const userRole = systemUser?.userRole || user?.role || '';
    const adminStatus = userRole === 'Admin' || userRole === 'admin';
    setIsAdmin(adminStatus);
    
    // Auto-select branch for non-admin users
    if (user && !adminStatus) {
      if (user.branch) {
        const branch = allBranches.find(b => 
          b.id.toString() === user.branch.toString() || 
          b.branchCode === user.branch
        );
        if (branch) {
          setSelectedBranch(branch);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (selectedBranch && selectedDate) {
      loadDayBookData();
      // Update expense form date when selected date changes
      setExpenseForm(prev => ({ ...prev, expenseDate: selectedDate }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch, selectedDate, branchAccounts]);

  const loadDayBookData = () => {
    if (!selectedBranch) return;

    const branchId = selectedBranch.id.toString();
    
    // Get opening balance (previous day's closing balance or branch account balance)
    let openingBalance = 0;
    
    // Try to get from previous day
    const previousDate = new Date(selectedDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const prevDateStr = previousDate.toISOString().split('T')[0];
    
    const prevDayBook = calculateDayBook(branchId, prevDateStr);
    openingBalance = prevDayBook.closingBalance;
    
    // If no previous day data, get from branch account balance
    if (openingBalance === 0) {
      const branchAccount = branchAccounts.find(a => 
        a.branch?.toString() === branchId && 
        a.status === 'Active'
      );
      if (branchAccount) {
        openingBalance = parseFloat(branchAccount.currentBalance || branchAccount.openingBalance || 0);
      }
    }
    
    // Calculate current day's data
    const currentDayBook = calculateDayBook(branchId, selectedDate);
    
    setDayBookData({
      openingBalance: openingBalance,
      receipts: currentDayBook.receipts,
      payments: currentDayBook.payments,
      closingBalance: openingBalance + currentDayBook.totalReceipts - currentDayBook.totalPayments
    });
  };

  const calculateDayBook = (branchId, date) => {
    const receipts = [];
    const payments = [];
    
    // Get payments received (from payment collection)
    const allPayments = JSON.parse(localStorage.getItem('payments') || '[]');
    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    const lrBookings = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    
    const dayPayments = allPayments.filter(pay => {
      if (pay.paymentDate !== date) return false;
      
      // Check if payment is for this branch's LRs
      const invoice = invoices.find(inv => inv.id.toString() === pay.invoiceId?.toString());
      if (invoice) {
        const lr = lrBookings.find(l => l.id.toString() === invoice.lrId?.toString());
        if (lr && lr.branch?.toString() === branchId) {
          return true;
        }
      }
      return false;
    });
    
    dayPayments.forEach(pay => {
      receipts.push({
        id: `pay-${pay.id}`,
        date: pay.paymentDate,
        type: 'Payment Received',
        description: `Payment from ${pay.clientName || 'Client'}`,
        reference: pay.paymentNumber || pay.invoiceNumber || '',
        amount: parseFloat(pay.amount) || 0,
        mode: pay.paymentMode || 'Cash'
      });
    });
    
    // Get To Pay received (LR bookings with ToPay mode that were paid)
    const toPayLRs = lrBookings.filter(lr => {
      if (lr.branch?.toString() !== branchId) return false;
      if (lr.paymentMode !== 'ToPay') return false;
      
      // Check if payment was received on this date
      const payments = JSON.parse(localStorage.getItem('payments') || '[]');
      const lrPayment = payments.find(p => {
        const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const invoice = invoices.find(inv => inv.lrId?.toString() === lr.id.toString());
        return invoice && invoice.id.toString() === p.invoiceId?.toString() && p.paymentDate === date;
      });
      return !!lrPayment;
    });
    
    toPayLRs.forEach(lr => {
      const invoice = invoices.find(inv => inv.lrId?.toString() === lr.id.toString());
      const payment = invoice ? allPayments.find(p => p.invoiceId?.toString() === invoice.id.toString() && p.paymentDate === date) : null;
      
      if (payment) {
        receipts.push({
          id: `topay-${lr.id}`,
          date: date,
          type: 'To Pay Received',
          description: `To Pay received for LR ${lr.lrNumber}`,
          reference: lr.lrNumber,
          amount: parseFloat(payment.amount) || parseFloat(lr.totalAmount) || 0,
          mode: payment.paymentMode || 'Cash'
        });
      }
    });
    
    // Get Paid booking amounts (LR bookings with Paid mode on booking date)
    const paidLRs = lrBookings.filter(lr => {
      if (lr.branch?.toString() !== branchId) return false;
      if (lr.paymentMode !== 'Paid') return false;
      return lr.bookingDate === date;
    });
    
    paidLRs.forEach(lr => {
      receipts.push({
        id: `paid-lr-${lr.id}`,
        date: lr.bookingDate,
        type: 'Paid Booking',
        description: `LR Booking - ${lr.consignor?.name || 'N/A'}`,
        reference: lr.lrNumber,
        amount: parseFloat(lr.totalAmount) || 0,
        mode: 'Paid'
      });
    });
    
    // Get fund allocations
    const allocations = JSON.parse(localStorage.getItem('branchFundAllocations') || '[]');
    const dayAllocations = allocations.filter(alloc => 
      alloc.branch?.toString() === branchId && alloc.allocationDate === date
    );
    
    dayAllocations.forEach(alloc => {
      receipts.push({
        id: `alloc-${alloc.id}`,
        date: alloc.allocationDate,
        type: 'Fund Allocation',
        description: `Funds allocated from ${alloc.sourceAccountName || 'Company'}`,
        reference: alloc.allocationNumber,
        amount: parseFloat(alloc.amount) || 0,
        mode: alloc.paymentMode || 'Bank Transfer'
      });
    });
    
    // Get expenses
    const allExpenses = JSON.parse(localStorage.getItem('branchExpenses') || '[]');
    const dayExpenses = allExpenses.filter(exp => 
      exp.branch?.toString() === branchId && exp.expenseDate === date
    );
    
    dayExpenses.forEach(exp => {
      payments.push({
        id: `exp-${exp.id}`,
        date: exp.expenseDate,
        type: 'Expense',
        description: `${exp.expenseType || 'Expense'}: ${exp.description || ''}`,
        reference: exp.expenseNumber,
        account: exp.accountName || 'N/A',
        amount: parseFloat(exp.totalAmount) || 0,
        mode: exp.paymentMode || 'Cash',
        paidTo: exp.paidTo || '',
        paymentScreenshot: exp.paymentScreenshot || null
      });
    });
    
    const totalReceipts = receipts.reduce((sum, r) => sum + r.amount, 0);
    const totalPayments = payments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      receipts: receipts.sort((a, b) => a.date.localeCompare(b.date)),
      payments: payments.sort((a, b) => a.date.localeCompare(b.date)),
      totalReceipts,
      totalPayments,
      closingBalance: 0 // Will be calculated by parent
    };
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    
    if (!expenseForm.expenseCategory || !expenseForm.expenseType) {
      alert('⚠️ Please select expense category and type!');
      return;
    }
    
    if (!expenseForm.account) {
      alert('⚠️ Please select a payment account!');
      return;
    }
    
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }
    
    const expenseAmount = parseFloat(expenseForm.amount) + (parseFloat(expenseForm.gstAmount) || 0);
    const availableBalance = dayBookData.openingBalance + dayBookData.receipts.reduce((sum, r) => sum + r.amount, 0) - dayBookData.payments.reduce((sum, p) => sum + p.amount, 0);
    
    if (expenseAmount > availableBalance) {
      alert(`⚠️ Insufficient Balance!\n\nAvailable Balance: ₹${availableBalance.toFixed(2)}\nExpense Amount: ₹${expenseAmount.toFixed(2)}\n\nExpense cannot be greater than available balance.`);
      return;
    }

    // Get expense head from Expense Master
    const getExpenseHead = () => {
      if (!expenseForm.expenseCategory || !expenseForm.expenseType) return null;
      const expenseType = expenseMaster.find(
        em => em.category === expenseForm.expenseCategory && 
              em.expenseType === expenseForm.expenseType &&
              em.status === 'Active'
      );
      return expenseType ? expenseType.expenseHead : null;
    };

    const allExpenses = JSON.parse(localStorage.getItem('branchExpenses') || '[]');
    const expenseNo = `EXP${String(allExpenses.length + 1).padStart(6, '0')}`;
    
    const newExpense = {
      id: Date.now(),
      expenseNumber: expenseNo,
      expenseDate: expenseForm.expenseDate,
      branch: selectedBranch.id.toString(),
      branchName: selectedBranch.branchName,
      expenseCategory: expenseForm.expenseCategory,
      expenseType: expenseForm.expenseType,
      expenseHead: getExpenseHead(), // Account ID from Expense Master for ledger entry
      account: expenseForm.account, // Branch account for payment
      accountName: branchAccounts.find(a => a.id.toString() === expenseForm.account.toString())?.accountName || 'N/A',
      accountType: branchAccounts.find(a => a.id.toString() === expenseForm.account.toString())?.accountType || 'N/A',
      amount: parseFloat(expenseForm.amount),
      gstAmount: parseFloat(expenseForm.gstAmount) || 0,
      totalAmount: expenseAmount,
      paymentMode: expenseForm.paymentMode,
      paidTo: expenseForm.paidTo,
      description: expenseForm.description,
      billNumber: expenseForm.billNumber,
      remarks: expenseForm.remarks,
      paymentScreenshot: expenseForm.paymentScreenshot, // Store base64 screenshot
      createdBy: currentUser?.name || currentUser?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      status: 'Active'
    };

    const updatedExpenses = [...expenses, newExpense];
    localStorage.setItem('branchExpenses', JSON.stringify(updatedExpenses));
    setExpenses(updatedExpenses);

    // Create ledger entries
    try {
      createBranchExpenseLedger(newExpense);
    } catch (error) {
      console.error('Error creating ledger entries:', error);
    }

    // Reload day book
    loadDayBookData();

    // Reset form
    setExpenseForm({
      expenseDate: selectedDate,
      expenseCategory: '',
      expenseType: '',
      account: '',
      amount: '',
      paymentMode: 'Cash',
      paidTo: '',
      description: '',
      billNumber: '',
      gstAmount: '',
      remarks: ''
    });
    setShowExpenseForm(false);

    alert(`✅ Expense added successfully!\n\nAmount: ₹${expenseAmount.toFixed(2)}\nRemaining Balance: ₹${(availableBalance - expenseAmount).toFixed(2)}`);
  };

  // Get expense categories and types from Expense Master
  const getExpenseCategories = () => {
    const categories = ['Operating', 'Administrative', 'Financial', 'Other'];
    return categories.map(cat => {
      const types = expenseMaster
        .filter(em => em.category === cat)
        .map(em => ({
          value: em.expenseType,
          label: em.expenseType,
          expenseHead: em.expenseHead
        }));
      return {
        value: cat,
        label: `${cat} Expenses`,
        types: types
      };
    });
  };

  const expenseCategories = getExpenseCategories();

  // Get expense head for selected expense type
  const getExpenseHeadForDisplay = () => {
    if (!expenseForm.expenseCategory || !expenseForm.expenseType) return null;
    const expenseType = expenseMaster.find(
      em => em.category === expenseForm.expenseCategory && 
            em.expenseType === expenseForm.expenseType &&
            em.status === 'Active'
    );
    return expenseType ? expenseType.expenseHead : null;
  };

  const availableBranchAccounts = branchAccounts.filter(acc => 
    acc.status === 'Active' && 
    acc.branch?.toString() === selectedBranch?.id.toString()
  );

  const totalReceipts = dayBookData.receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalPayments = dayBookData.payments.reduce((sum, p) => sum + p.amount, 0);
  const currentBalance = dayBookData.openingBalance + totalReceipts - totalPayments;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 p-6">
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
          border-left: 4px solid #14b8a6;
          transition: all 0.3s ease;
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .balance-card {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .balance-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .balance-row:last-child {
          border-bottom: none;
          font-size: 1.3rem;
          font-weight: 700;
          padding-top: 16px;
        }
        
        .table-container {
          overflow-x: auto;
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        
        th {
          background: #f1f5f9;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 0.85rem;
          color: #475569;
          border-bottom: 2px solid #e2e8f0;
        }
        
        td {
          padding: 10px 12px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
        }
        
        tr:hover {
          background: #f8fafc;
        }
        
        .receipt-row {
          background: #f0fdf4;
        }
        
        .payment-row {
          background: #fef2f2;
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
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.1);
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
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20,184,166,0.3);
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Branch Day Book
          </h1>
          <p className="text-slate-600 text-lg">Daily cash book with receipts and payments</p>
        </div>

        {/* Filters */}
        <div className="form-section">
          <div className="grid-3">
            <div className="input-group">
              <label>Branch {isAdmin ? '(Select Branch)' : ''}</label>
              {isAdmin ? (
                <select
                  value={selectedBranch ? selectedBranch.id.toString() : ''}
                  onChange={(e) => {
                    const branch = branches.find(b => b.id.toString() === e.target.value);
                    setSelectedBranch(branch || null);
                  }}
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedBranch ? `${selectedBranch.branchName} (${selectedBranch.branchCode})` : 'N/A'}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              )}
            </div>
            
            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            
            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-primary"
                onClick={() => setShowExpenseForm(!showExpenseForm)}
                style={{ width: '100%' }}
                disabled={!selectedBranch}
              >
                <Plus size={18} />
                {showExpenseForm ? 'Cancel Add Expense' : 'Add Expense'}
              </button>
            </div>
          </div>
        </div>

        {/* Balance Summary */}
        {selectedBranch && (
          <div className="balance-card">
            <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '20px' }}>
              Day Book Summary - {selectedBranch.branchName}
            </h2>
            <div className="balance-row">
              <span>Opening Balance</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                ₹{dayBookData.openingBalance.toFixed(2)}
              </span>
            </div>
            <div className="balance-row">
              <span>Total Receipts</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#d1fae5' }}>
                + ₹{totalReceipts.toFixed(2)}
              </span>
            </div>
            <div className="balance-row">
              <span>Total Payments</span>
              <span className="mono" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#fecaca' }}>
                - ₹{totalPayments.toFixed(2)}
              </span>
            </div>
            <div className="balance-row">
              <span>Closing Balance</span>
              <span className="mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                ₹{currentBalance.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Add Expense Form */}
        {showExpenseForm && selectedBranch && (
          <div className="form-section" style={{ borderLeftColor: '#f97316' }}>
            <h2 className="section-title">Add Expense</h2>
            <form onSubmit={handleAddExpense}>
              <div className="grid-2">
                <div className="input-group">
                  <label>Expense Date *</label>
                  <input
                    type="date"
                    value={expenseForm.expenseDate}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Payment Account *</label>
                  {availableBranchAccounts.length === 0 ? (
                    <div style={{
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      border: '2px solid #fbbf24',
                      color: '#92400e',
                      fontSize: '0.9rem'
                    }}>
                      ⚠️ No accounts found. Please create accounts first.
                    </div>
                  ) : (
                    <select
                      value={expenseForm.account}
                      onChange={(e) => setExpenseForm(prev => ({ ...prev, account: e.target.value }))}
                      required
                    >
                      <option value="">-- Select Account --</option>
                      {availableBranchAccounts.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.accountName} - {account.accountType}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Expense Category *</label>
                  <select
                    value={expenseForm.expenseCategory}
                    onChange={(e) => setExpenseForm(prev => ({ 
                      ...prev, 
                      expenseCategory: e.target.value,
                      expenseType: ''
                    }))}
                    required
                  >
                    <option value="">-- Select Category --</option>
                    {expenseCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Expense Type *</label>
                  <select
                    value={expenseForm.expenseType}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, expenseType: e.target.value }))}
                    required
                    disabled={!expenseForm.expenseCategory}
                  >
                    <option value="">-- Select Type --</option>
                    {expenseForm.expenseCategory && expenseCategories
                      .find(cat => cat.value === expenseForm.expenseCategory)
                      ?.types.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                  </select>
                  {expenseForm.expenseType && getExpenseHeadForDisplay() && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: '#f0f9ff',
                      borderRadius: '6px',
                      border: '1px solid #bae6fd',
                      fontSize: '0.875rem',
                      color: '#0369a1'
                    }}>
                      <strong>Expense Head:</strong> {
                        accounts.find(acc => acc.id.toString() === getExpenseHeadForDisplay()?.toString())?.accountName || 'N/A'
                      } ({accounts.find(acc => acc.id.toString() === getExpenseHeadForDisplay()?.toString())?.accountCode || 'N/A'})
                    </div>
                  )}
                  {expenseForm.expenseCategory && expenseCategories.find(cat => cat.value === expenseForm.expenseCategory)?.types.length === 0 && (
                    <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                      ⚠️ No expense types found for this category. Please add expense types in Expense Master.
                    </small>
                  )}
                </div>
              </div>

              <div className="grid-3">
                <div className="input-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.amount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: e.target.value }))}
                    required
                    placeholder="0.00"
                  />
                </div>
                
                <div className="input-group">
                  <label>GST Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={expenseForm.gstAmount}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, gstAmount: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="input-group">
                  <label>Payment Mode *</label>
                  <select
                    value={expenseForm.paymentMode}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Paid To</label>
                  <input
                    type="text"
                    value={expenseForm.paidTo}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, paidTo: e.target.value }))}
                    placeholder="Name of payee"
                  />
                </div>
                
                <div className="input-group">
                  <label>Bill Number</label>
                  <input
                    type="text"
                    value={expenseForm.billNumber}
                    onChange={(e) => setExpenseForm(prev => ({ ...prev, billNumber: e.target.value }))}
                    placeholder="Bill/Invoice number"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  placeholder="Enter expense description..."
                />
              </div>

              <div className="input-group">
                <label>Payment Screenshot (Optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      // Check file size (max 5MB)
                      if (file.size > 5 * 1024 * 1024) {
                        alert('⚠️ File size should be less than 5MB');
                        e.target.value = '';
                        return;
                      }
                      
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        const base64String = reader.result;
                        setExpenseForm(prev => ({ ...prev, paymentScreenshot: base64String }));
                        setScreenshotPreview(base64String);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  style={{
                    padding: '8px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.9rem'
                  }}
                />
                {screenshotPreview && (
                  <div style={{ marginTop: '12px' }}>
                    <div style={{
                      display: 'inline-block',
                      position: 'relative',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '8px',
                      background: '#f8fafc'
                    }}>
                      <img
                        src={screenshotPreview}
                        alt="Payment Screenshot Preview"
                        style={{
                          maxWidth: '200px',
                          maxHeight: '150px',
                          borderRadius: '4px',
                          display: 'block'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setExpenseForm(prev => ({ ...prev, paymentScreenshot: null }));
                          setScreenshotPreview(null);
                        }}
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          fontSize: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Remove screenshot"
                      >
                        ×
                      </button>
                    </div>
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      Screenshot uploaded. Click to view full size.
                    </small>
                  </div>
                )}
              </div>

              <div style={{ 
                padding: '12px', 
                background: currentBalance < (parseFloat(expenseForm.amount) || 0) + (parseFloat(expenseForm.gstAmount) || 0) ? '#fef2f2' : '#f0fdf4',
                borderRadius: '8px',
                border: `2px solid ${currentBalance < (parseFloat(expenseForm.amount) || 0) + (parseFloat(expenseForm.gstAmount) || 0) ? '#fecaca' : '#86efac'}`,
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '4px' }}>
                  Available Balance: ₹{currentBalance.toFixed(2)}
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  Expense Amount: ₹{((parseFloat(expenseForm.amount) || 0) + (parseFloat(expenseForm.gstAmount) || 0)).toFixed(2)}
                </div>
                {currentBalance < (parseFloat(expenseForm.amount) || 0) + (parseFloat(expenseForm.gstAmount) || 0) && (
                  <div style={{ fontSize: '0.85rem', color: '#dc2626', marginTop: '4px', fontWeight: 600 }}>
                    ⚠️ Insufficient Balance! Expense cannot be greater than available balance.
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowExpenseForm(false);
                    setExpenseForm({
                      expenseDate: selectedDate,
                      expenseCategory: '',
                      expenseType: '',
                      account: '',
                      amount: '',
                      paymentMode: 'Cash',
                      paidTo: '',
                      description: '',
                      billNumber: '',
                      gstAmount: '',
                      remarks: '',
                      paymentScreenshot: null
                    });
                    setScreenshotPreview(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={currentBalance < (parseFloat(expenseForm.amount) || 0) + (parseFloat(expenseForm.gstAmount) || 0)}
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Receipts Table */}
        {selectedBranch && (
          <div className="form-section">
            <h2 className="section-title">
              <TrendingUp size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Receipts ({dayBookData.receipts.length})
            </h2>
            
            {dayBookData.receipts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No receipts for this date
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Mode</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBookData.receipts.map((receipt, index) => {
                      // Calculate running balance: opening + receipts up to this point - payments up to this point
                      const receiptsBefore = dayBookData.receipts.slice(0, index).reduce((sum, r) => sum + r.amount, 0);
                      const paymentsBefore = dayBookData.payments.reduce((sum, p) => sum + p.amount, 0);
                      const runningBalance = dayBookData.openingBalance + receiptsBefore + receipt.amount - paymentsBefore;
                      
                      return (
                        <tr key={receipt.id} className="receipt-row">
                          <td>{receipt.date}</td>
                          <td>{receipt.type}</td>
                          <td>{receipt.description}</td>
                          <td className="mono">{receipt.reference}</td>
                          <td>{receipt.mode}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#10b981' }}>
                            + ₹{receipt.amount.toFixed(2)}
                          </td>
                          <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                            ₹{runningBalance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                      <td colSpan="6" style={{ textAlign: 'right', padding: '12px' }}>Total Receipts:</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '1.1rem' }}>
                        ₹{totalReceipts.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Payments Table */}
        {selectedBranch && (
          <div className="form-section">
            <h2 className="section-title">
              <TrendingDown size={20} style={{ display: 'inline', marginRight: '8px' }} />
              Payments/Expenses ({dayBookData.payments.length})
            </h2>
            
            {dayBookData.payments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No payments/expenses for this date
              </div>
            ) : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Type</th>
                      <th>Description</th>
                      <th>Reference</th>
                      <th>Account</th>
                      <th>Paid To</th>
                      <th>Mode</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                      <th style={{ textAlign: 'right' }}>Balance</th>
                      <th style={{ textAlign: 'center', width: '100px' }}>Screenshot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBookData.payments.map((payment, index) => {
                      // Calculate running balance: opening + all receipts - payments up to this point
                      const receiptsTotal = dayBookData.receipts.reduce((sum, r) => sum + r.amount, 0);
                      const paymentsBefore = dayBookData.payments.slice(0, index).reduce((sum, p) => sum + p.amount, 0);
                      const runningBalance = dayBookData.openingBalance + receiptsTotal - paymentsBefore - payment.amount;
                      
                      return (
                        <tr key={payment.id} className="payment-row">
                          <td>{payment.date}</td>
                          <td>{payment.type}</td>
                          <td>{payment.description}</td>
                          <td className="mono">{payment.reference}</td>
                          <td>{payment.account}</td>
                          <td>{payment.paidTo || '-'}</td>
                          <td>{payment.mode}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600, color: '#ef4444' }}>
                            - ₹{payment.amount.toFixed(2)}
                          </td>
                          <td className="mono" style={{ textAlign: 'right', fontWeight: 600 }}>
                            ₹{runningBalance.toFixed(2)}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {payment.paymentScreenshot ? (
                              <button
                                onClick={() => {
                                  setViewingScreenshot(payment.paymentScreenshot);
                                  setShowScreenshotModal(true);
                                }}
                                style={{
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '6px 12px',
                                  cursor: 'pointer',
                                  fontSize: '0.8rem',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                                title="View Payment Screenshot"
                              >
                                <Image size={14} />
                                View
                              </button>
                            ) : (
                              <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr style={{ background: '#f1f5f9', fontWeight: 700 }}>
                      <td colSpan="9" style={{ textAlign: 'right', padding: '12px' }}>Total Payments:</td>
                      <td style={{ textAlign: 'right', padding: '12px', fontSize: '1.1rem' }}>
                        ₹{totalPayments.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Screenshot Modal */}
        {showScreenshotModal && viewingScreenshot && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '20px'
            }}
            onClick={() => {
              setShowScreenshotModal(false);
              setViewingScreenshot(null);
            }}
          >
            <div
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '20px',
                maxWidth: '90%',
                maxHeight: '90%',
                position: 'relative',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => {
                  setShowScreenshotModal(false);
                  setViewingScreenshot(null);
                }}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  zIndex: 1001
                }}
                title="Close"
              >
                <X size={18} />
              </button>
              <h3 style={{ marginBottom: '16px', color: '#1e293b', fontSize: '1.2rem' }}>
                Payment Screenshot
              </h3>
              <img
                src={viewingScreenshot}
                alt="Payment Screenshot"
                style={{
                  maxWidth: '100%',
                  maxHeight: '70vh',
                  borderRadius: '8px',
                  display: 'block',
                  margin: '0 auto'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

