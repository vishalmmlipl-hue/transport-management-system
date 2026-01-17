import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { createBranchExpenseLedger } from './utils/ledgerService';

export default function BranchExpenseForm() {
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branchAccounts, setBranchAccounts] = useState([]);
  const [trips, setTrips] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseMaster, setExpenseMaster] = useState([]);
  
  const [formData, setFormData] = useState({
    expenseNumber: '',
    expenseDate: new Date().toISOString().split('T')[0],
    branch: '',
    tripId: '', // Link to trip if applicable
    expenseCategory: '',
    expenseType: '',
    account: '',
    amount: '',
    paymentMode: 'Cash', // Cash, Bank Transfer, Cheque
    paidTo: '',
    description: '',
    billNumber: '',
    billDate: '',
    gstAmount: '',
    remarks: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    setBranches(allBranches.filter(b => b.status === 'Active'));
    
    const allAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    setAccounts(allAccounts.filter(a => a.status === 'Active'));
    
    const allBranchAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
    setBranchAccounts(allBranchAccounts.filter(a => a.status === 'Active'));
    
    const allTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    setTrips(allTrips);
    
    const allExpenses = JSON.parse(localStorage.getItem('branchExpenses') || '[]');
    setExpenses(allExpenses);
    
    const allExpenseMaster = JSON.parse(localStorage.getItem('expenseMaster') || '[]');
    setExpenseMaster(allExpenseMaster.filter(em => em.status === 'Active'));
    
    // Auto-select branch for non-admin users
    if (user && user.role !== 'Admin' && user.role !== 'admin') {
      if (user.branch) {
        const branch = allBranches.find(b => 
          b.id.toString() === user.branch.toString() || 
          b.branchCode === user.branch
        );
        if (branch) {
          setFormData(prev => ({ ...prev, branch: branch.id.toString() }));
        }
      }
    }
    
    // Auto-generate expense number
    const expenseNo = `EXP${String(allExpenses.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, expenseNumber: expenseNo }));
  }, []);

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
  const getExpenseHead = () => {
    if (!formData.expenseCategory || !formData.expenseType) return null;
    const expenseType = expenseMaster.find(
      em => em.category === formData.expenseCategory && 
            em.expenseType === formData.expenseType &&
            em.status === 'Active'
    );
    return expenseType ? expenseType.expenseHead : null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.branch) {
      alert('⚠️ Please select a branch!');
      return;
    }
    
    if (!formData.expenseCategory || !formData.expenseType) {
      alert('⚠️ Please select expense category and type!');
      return;
    }
    
    if (!formData.account) {
      alert('⚠️ Please select a payment account!');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const newExpense = {
      id: Date.now(),
      expenseNumber: formData.expenseNumber,
      expenseDate: formData.expenseDate,
      branch: formData.branch,
      branchName: branches.find(b => b.id.toString() === formData.branch)?.branchName || 'N/A',
      tripId: formData.tripId || null,
      expenseCategory: formData.expenseCategory,
      expenseType: formData.expenseType,
      expenseHead: getExpenseHead(), // Account ID from Expense Master for ledger entry
      account: formData.account, // Branch account for payment
      accountName: availableBranchAccounts.find(a => a.id.toString() === formData.account.toString())?.accountName || 'N/A',
      accountType: availableBranchAccounts.find(a => a.id.toString() === formData.account.toString())?.accountType || 'N/A',
      amount: parseFloat(formData.amount),
      gstAmount: parseFloat(formData.gstAmount) || 0,
      totalAmount: parseFloat(formData.amount) + (parseFloat(formData.gstAmount) || 0),
      paymentMode: formData.paymentMode,
      paidTo: formData.paidTo,
      description: formData.description,
      billNumber: formData.billNumber,
      billDate: formData.billDate,
      remarks: formData.remarks,
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

    alert(`✅ Expense "${formData.expenseNumber}" added successfully!\n\nAmount: ₹${newExpense.totalAmount.toFixed(2)}\nBranch: ${newExpense.branchName}${newExpense.tripId ? '\nLinked to Trip' : ''}\n\nLedger entries created automatically.`);

    // Reset form
    const expenseNo = `EXP${String(updatedExpenses.length + 1).padStart(6, '0')}`;
    setFormData({
      expenseNumber: expenseNo,
      expenseDate: new Date().toISOString().split('T')[0],
      branch: formData.branch, // Keep branch selected
      tripId: formData.tripId || '',
      expenseCategory: '',
      expenseType: '',
      account: '',
      amount: '',
      paymentMode: 'Cash',
      paidTo: '',
      description: '',
      billNumber: '',
      billDate: '',
      gstAmount: '',
      remarks: ''
    });
  };

  // Get branch accounts (bank accounts and cashier accounts) for the selected branch
  const getBranchAccounts = () => {
    if (!formData.branch) return [];
    
    return branchAccounts.filter(acc => 
      acc.status === 'Active' && 
      acc.branch.toString() === formData.branch.toString()
    );
  };

  const availableBranchAccounts = getBranchAccounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-6">
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
          border-left: 4px solid #f97316;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(249,115,22,0.1);
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
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
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
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249,115,22,0.3);
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

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Branch Expense Entry
          </h1>
          <p className="text-slate-600 text-lg">Record branch expenses and track spending</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Expense Details */}
          <div className="form-section">
            <h2 className="section-title">Expense Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Expense Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.expenseNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  value={formData.expenseDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenseDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Branch *</label>
                {currentUser && (currentUser.role === 'Admin' || currentUser.role === 'admin') ? (
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
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
                    value={branches.find(b => b.id.toString() === formData.branch)?.branchName || 'N/A'}
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                )}
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Link to Trip (Optional)</label>
                <select
                  value={formData.tripId}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripId: e.target.value }))}
                >
                  <option value="">-- Not linked to trip --</option>
                  {trips
                    .filter(trip => {
                      if (!formData.branch) return true;
                      // Try to find trip's branch from manifest
                      const manifests = JSON.parse(localStorage.getItem('manifests') || '[]');
                      const manifest = manifests.find(m => m.id === trip.manifestId);
                      if (manifest && manifest.branch) {
                        return manifest.branch.toString() === formData.branch.toString();
                      }
                      return true;
                    })
                    .map(trip => (
                      <option key={trip.id} value={trip.id}>
                        {trip.tripNumber || `Trip-${trip.id}`} - {trip.tripDate || 'N/A'}
                      </option>
                    ))}
                </select>
                {formData.tripId && (
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    This expense will be added to the trip expenses
                  </small>
                )}
              </div>
              
              <div className="input-group">
                <label>Expense Category *</label>
                <select
                  value={formData.expenseCategory}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    expenseCategory: e.target.value,
                    expenseType: '' // Reset type when category changes
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
            </div>

            <div className="input-group">
              <label>Expense Type *</label>
              <select
                value={formData.expenseType}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseType: e.target.value }))}
                required
                disabled={!formData.expenseCategory}
              >
                <option value="">-- Select Type --</option>
                {formData.expenseCategory && expenseCategories
                  .find(cat => cat.value === formData.expenseCategory)
                  ?.types.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
              </select>
              {formData.expenseType && getExpenseHead() && (
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
                    accounts.find(acc => acc.id.toString() === getExpenseHead()?.toString())?.accountName || 'N/A'
                  } ({accounts.find(acc => acc.id.toString() === getExpenseHead()?.toString())?.accountCode || 'N/A'})
                </div>
              )}
              {formData.expenseCategory && expenseCategories.find(cat => cat.value === formData.expenseCategory)?.types.length === 0 && (
                <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  ⚠️ No expense types found for this category. Please add expense types in Expense Master.
                </small>
              )}
            </div>

            <div className="grid-2">
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
                    ⚠️ No bank/cashier accounts found for this branch. Please create accounts first from Branch Account Management.
                  </div>
                ) : (
                  <select
                    value={formData.account}
                    onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Payment Account --</option>
                    {availableBranchAccounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountName} - {account.accountType}
                        {account.accountNumber && ` (${account.accountNumber.slice(-4)})`}
                        {account.bankName && ` - ${account.bankName}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="input-group">
                <label>Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                placeholder="Enter expense description..."
              />
            </div>
          </div>

          {/* Payment Details */}
          <div className="form-section">
            <h2 className="section-title">Payment Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Payment Mode *</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Paid To</label>
                <input
                  type="text"
                  value={formData.paidTo}
                  onChange={(e) => setFormData(prev => ({ ...prev, paidTo: e.target.value }))}
                  placeholder="Name of payee"
                />
              </div>
              
              <div className="input-group">
                <label>GST Amount</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.gstAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstAmount: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Bill Number</label>
                <input
                  type="text"
                  value={formData.billNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, billNumber: e.target.value }))}
                  placeholder="Bill/Invoice number"
                />
              </div>
              
              <div className="input-group">
                <label>Bill Date</label>
                <input
                  type="date"
                  value={formData.billDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, billDate: e.target.value }))}
                />
              </div>
            </div>

            <div className="input-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows="2"
                placeholder="Any additional remarks..."
              />
            </div>
          </div>

          {/* Summary */}
          <div className="form-section" style={{ 
            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                  ₹{((parseFloat(formData.amount) || 0) + (parseFloat(formData.gstAmount) || 0)).toFixed(2)}
                </div>
              </div>
              <button
                type="submit"
                className="btn"
                style={{ 
                  background: 'white', 
                  color: '#f97316',
                  fontSize: '1rem',
                  padding: '12px 32px'
                }}
              >
                <Save size={20} />
                Save Expense
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

