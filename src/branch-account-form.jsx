import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Building2, Wallet, DollarSign, Edit2, X } from 'lucide-react';

export default function BranchAccountForm() {
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);
  
  const [formData, setFormData] = useState({
    accountType: 'Bank Account', // Bank Account or Cashier Account
    branch: '', // Branch ID or 'HO' for Head Office
    accountName: '',
    accountNumber: '',
    bankName: '',
    ifscCode: '',
    branchAddress: '',
    openingBalance: '0',
    currentBalance: '0',
    accountHolderName: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    remarks: '',
    status: 'Active'
  });

  useEffect(() => {
    const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    setBranches(allBranches.filter(b => b.status === 'Active'));
    
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const allAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
    setAccounts(allAccounts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.accountName || !formData.accountNumber) {
      alert('⚠️ Please enter account name and account number!');
      return;
    }
    
    if (formData.accountType === 'Bank Account' && !formData.bankName) {
      alert('⚠️ Please enter bank name for bank account!');
      return;
    }
    
    if (!formData.branch) {
      alert('⚠️ Please select branch or Head Office!');
      return;
    }

    const branchName = formData.branch === 'HO' 
      ? 'Head Office' 
      : branches.find(b => b.id.toString() === formData.branch.toString())?.branchName || 'N/A';
    
    const branchCode = formData.branch === 'HO' 
      ? 'HO' 
      : branches.find(b => b.id.toString() === formData.branch.toString())?.branchCode || '';

    if (editingAccount) {
      // Update existing account
      const updatedAccounts = accounts.map(acc => 
        acc.id === editingAccount.id 
          ? {
              ...acc,
              ...formData,
              branchName: branchName,
              branchCode: branchCode,
              updatedAt: new Date().toISOString()
            }
          : acc
      );
      localStorage.setItem('branchAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
      alert(`✅ Account updated successfully!`);
    } else {
      // Create new account
      const branchAccountId = Date.now();
      
      // Create account master entry with branch account ID
      const accountMasterId = updateAccountMaster(formData, branchName, branchCode, null, branchAccountId);
      
      const newAccount = {
        id: branchAccountId,
        ...formData,
        branchName: branchName,
        branchCode: branchCode,
        accountMasterId: accountMasterId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      const updatedAccounts = [...accounts, newAccount];
      localStorage.setItem('branchAccounts', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
      alert(`✅ ${formData.accountType} created successfully!\n\nAccount: ${formData.accountName}\nBranch: ${branchName}`);
    }

    // For editing, update account master
    if (editingAccount) {
      updateAccountMaster(formData, branchName, branchCode, editingAccount, editingAccount.id);
    }

    // Reset form
    resetForm();
  };

  const updateAccountMaster = (accountData, branchName, branchCode, editingAccount, branchAccountId) => {
    const allAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    
    const accountCode = accountData.accountType === 'Bank Account'
      ? `BANK-${branchCode}-${accountData.accountNumber.slice(-4)}`
      : `CASH-${branchCode}-${accountData.accountNumber || 'CASH'}`;
    
    const accountName = accountData.accountType === 'Bank Account'
      ? `${branchName} - ${accountData.bankName} - ${accountData.accountNumber.slice(-4)}`
      : `${branchName} - Cashier Account`;
    
    if (editingAccount && editingAccount.accountMasterId) {
      // Update existing account master entry
      const updatedAccounts = allAccounts.map(acc => 
        acc.id.toString() === editingAccount.accountMasterId.toString()
          ? {
              ...acc,
              accountName: accountName,
              accountCode: accountCode,
              openingBalance: accountData.openingBalance,
              currentBalance: accountData.currentBalance,
              lastUpdated: new Date().toISOString()
            }
          : acc
      );
      localStorage.setItem('accountMaster', JSON.stringify(updatedAccounts));
      return editingAccount.accountMasterId;
    } else {
      // Create new account master entry
      const accountMasterId = Date.now();
      const accountMasterEntry = {
        id: accountMasterId,
        accountName: accountName,
        accountCode: accountCode,
        category: 'Assets',
        group: 'Current Assets',
        subGroup: accountData.accountType === 'Bank Account' ? 'Bank Accounts' : 'Cash in Hand',
        openingBalance: accountData.openingBalance || '0',
        currentBalance: accountData.currentBalance || accountData.openingBalance || '0',
        balanceType: 'Debit',
        linkedEntity: accountData.branch === 'HO' ? 'HO' : accountData.branch.toString(),
        linkedEntityType: accountData.branch === 'HO' ? 'Head Office' : 'Branch',
        linkedAccountId: branchAccountId || (editingAccount ? editingAccount.id : Date.now()),
        status: accountData.status,
        description: `${accountData.accountType} for ${branchName}`,
        createdAt: new Date().toISOString()
      };
      
      const updatedAccounts = [...allAccounts, accountMasterEntry];
      localStorage.setItem('accountMaster', JSON.stringify(updatedAccounts));
      
      return accountMasterId;
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      accountType: account.accountType,
      branch: account.branch,
      accountName: account.accountName,
      accountNumber: account.accountNumber,
      bankName: account.bankName || '',
      ifscCode: account.ifscCode || '',
      branchAddress: account.branchAddress || '',
      openingBalance: account.openingBalance || '0',
      currentBalance: account.currentBalance || account.openingBalance || '0',
      accountHolderName: account.accountHolderName || '',
      contactPerson: account.contactPerson || '',
      contactNumber: account.contactNumber || '',
      email: account.email || '',
      remarks: account.remarks || '',
      status: account.status || 'Active'
    });
  };

  const handleDelete = (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return;
    }
    
    const updatedAccounts = accounts.filter(acc => acc.id !== accountId);
    localStorage.setItem('branchAccounts', JSON.stringify(updatedAccounts));
    setAccounts(updatedAccounts);
    alert('✅ Account deleted successfully!');
  };

  const resetForm = () => {
    setFormData({
      accountType: 'Bank Account',
      branch: '',
      accountName: '',
      accountNumber: '',
      bankName: '',
      ifscCode: '',
      branchAddress: '',
      openingBalance: '0',
      currentBalance: '0',
      accountHolderName: '',
      contactPerson: '',
      contactNumber: '',
      email: '',
      remarks: '',
      status: 'Active'
    });
    setEditingAccount(null);
  };

  const filteredAccounts = accounts.filter(acc => acc.status === 'Active');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
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
          border-left: 4px solid #6366f1;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.1);
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
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
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
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 0.85rem;
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
        
        .account-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        
        .account-card:hover {
          border-color: #6366f1;
          box-shadow: 0 4px 12px rgba(99,102,241,0.1);
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Branch Account Management
          </h1>
          <p className="text-slate-600 text-lg">Create and manage bank accounts and cashier accounts for branches and Head Office</p>
        </div>

        {/* Account Form */}
        <div className="form-section">
          <h2 className="section-title">
            {editingAccount ? 'Edit Account' : 'Create New Account'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="input-group">
                <label>Account Type *</label>
                <select
                  value={formData.accountType}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountType: e.target.value }))}
                  required
                >
                  <option value="Bank Account">Bank Account</option>
                  <option value="Cashier Account">Cashier Account</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Branch / Head Office *</label>
                <select
                  value={formData.branch}
                  onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                  required
                >
                  <option value="">-- Select Branch or H.O. --</option>
                  <option value="HO">Head Office (H.O.)</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Account Name *</label>
                <input
                  type="text"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  required
                  placeholder="e.g., Main Current Account"
                />
              </div>
              
              <div className="input-group">
                <label>Account Number *</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                  required
                  placeholder="Account number"
                />
              </div>
            </div>

            {formData.accountType === 'Bank Account' && (
              <>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      value={formData.bankName}
                      onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                      required
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>IFSC Code</label>
                    <input
                      type="text"
                      className="mono"
                      value={formData.ifscCode}
                      onChange={(e) => setFormData(prev => ({ ...prev, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g., SBIN0001234"
                      maxLength="11"
                    />
                  </div>
                </div>
                
                <div className="input-group">
                  <label>Bank Branch Address</label>
                  <textarea
                    value={formData.branchAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, branchAddress: e.target.value }))}
                    rows="2"
                    placeholder="Bank branch address"
                  />
                </div>
              </>
            )}

            <div className="grid-3">
              <div className="input-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    openingBalance: e.target.value,
                    currentBalance: editingAccount ? prev.currentBalance : e.target.value
                  }))}
                  placeholder="0.00"
                />
              </div>
              
              {editingAccount && (
                <div className="input-group">
                  <label>Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.currentBalance}
                    onChange={(e) => setFormData(prev => ({ ...prev, currentBalance: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
              )}
              
              <div className="input-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  value={formData.accountHolderName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                  placeholder="Name on account"
                />
              </div>
              
              <div className="input-group">
                <label>Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                  placeholder="Contact person name"
                />
              </div>
              
              <div className="input-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                  placeholder="Phone number"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="email@example.com"
              />
            </div>

            <div className="input-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows="2"
                placeholder="Any additional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
              {editingAccount && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={resetForm}
                >
                  <X size={16} />
                  Cancel
                </button>
              )}
              <button
                type="submit"
                className="btn btn-primary"
              >
                <Save size={16} />
                {editingAccount ? 'Update Account' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>

        {/* Accounts List */}
        <div className="form-section">
          <h2 className="section-title">All Accounts ({filteredAccounts.length})</h2>
          
          {filteredAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <Wallet size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p>No accounts created yet</p>
            </div>
          ) : (
            <div>
              {filteredAccounts.map(account => (
                <div key={account.id} className="account-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        {account.accountType === 'Bank Account' ? (
                          <Wallet size={20} style={{ color: '#6366f1' }} />
                        ) : (
                          <DollarSign size={20} style={{ color: '#10b981' }} />
                        )}
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                          {account.accountName}
                        </h3>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: account.status === 'Active' ? '#d1fae5' : '#f3f4f6',
                          color: account.status === 'Active' ? '#065f46' : '#64748b'
                        }}>
                          {account.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '32px' }}>
                        <div><strong>Branch:</strong> {account.branchName} ({account.branchCode})</div>
                        <div><strong>Account Number:</strong> <span className="mono">{account.accountNumber}</span></div>
                        {account.accountType === 'Bank Account' && account.bankName && (
                          <div><strong>Bank:</strong> {account.bankName}</div>
                        )}
                        {account.ifscCode && (
                          <div><strong>IFSC:</strong> <span className="mono">{account.ifscCode}</span></div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-small"
                        onClick={() => handleEdit(account)}
                      >
                        <Edit2 size={14} />
                        Edit
                      </button>
                      <button
                        className="btn btn-danger btn-small"
                        onClick={() => handleDelete(account.id)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div style={{ 
                    marginTop: '12px', 
                    padding: '12px', 
                    background: '#f8fafc', 
                    borderRadius: '6px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Current Balance</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b' }}>
                        ₹{parseFloat(account.currentBalance || account.openingBalance || 0).toFixed(2)}
                      </div>
                    </div>
                    {account.accountHolderName && (
                      <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        <div><strong>Holder:</strong> {account.accountHolderName}</div>
                        {account.contactNumber && (
                          <div><strong>Contact:</strong> {account.contactNumber}</div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

