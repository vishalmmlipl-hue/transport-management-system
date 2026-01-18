import React, { useState, useEffect } from 'react';
import { Save, Trash2, Wallet, DollarSign, Edit2, X } from 'lucide-react';
import syncService from './utils/sync-service';

export default function BranchAccountForm() {
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingAccount, setEditingAccount] = useState(null);

  const normalizeBranchAccount = (acc) => {
    if (!acc) return acc;
    let dataObj = {};
    const raw = acc.data;
    if (raw && typeof raw === 'string') {
      try { dataObj = JSON.parse(raw); } catch { dataObj = {}; }
    } else if (raw && typeof raw === 'object') {
      dataObj = raw;
    }
    // Merge parsed data into the row so UI fields (branchName/accountHolderName/etc.) work even if stored in data.
    return { ...acc, ...dataObj };
  };
  
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
    const loadInitial = async () => {
      try {
        const [branchesRes, branchAccRes] = await Promise.all([
          syncService.load('branches'),
          syncService.load('branchAccounts'),
        ]);
        const allBranches = Array.isArray(branchesRes) ? branchesRes : (branchesRes?.data || []);
        const allBranchAccounts = Array.isArray(branchAccRes) ? branchAccRes : (branchAccRes?.data || []);
        const activeBranches = (allBranches || []).filter(b => !b.status || b.status === 'Active');
        const activeAccounts = (allBranchAccounts || [])
          .map(normalizeBranchAccount)
          .filter(a => !a.status || a.status === 'Active');
        setBranches(activeBranches);
        setAccounts(activeAccounts);
        localStorage.setItem('branches', JSON.stringify(activeBranches));
        localStorage.setItem('branchAccounts', JSON.stringify(activeAccounts));
      } catch (e) {
        const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        setBranches(allBranches.filter(b => b.status === 'Active'));
        const allAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
        setAccounts(allAccounts);
      }
    };
    loadInitial();
  }, []);

  const reloadBranchAccounts = async () => {
    try {
      const res = await syncService.load('branchAccounts');
      const list = Array.isArray(res) ? res : (res?.data || []);
      const active = (list || [])
        .map(normalizeBranchAccount)
        .filter(a => !a.status || a.status === 'Active');
      setAccounts(active);
      localStorage.setItem('branchAccounts', JSON.stringify(active));
    } catch (e) {
      const allAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
      setAccounts(allAccounts);
    }
  };

  const handleSubmit = async (e) => {
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

    const accountCode = formData.accountType === 'Bank Account'
      ? `BANK-${branchCode}-${String(formData.accountNumber || '').slice(-4) || 'XXXX'}`
      : `CASH-${branchCode}-${String(formData.accountNumber || 'CASH').slice(-4) || 'CASH'}`;
    const ledgerName = formData.accountType === 'Bank Account'
      ? `${branchName} - ${formData.bankName || 'Bank'} - ${String(formData.accountNumber || '').slice(-4) || ''}`
      : `${branchName} - Cashier Account`;

    // Ensure there is an Account Master ledger in server accounts
    let linkedAccountId = editingAccount?.accountId || '';
    try {
      const accRes = await syncService.load('accounts');
      const accList = Array.isArray(accRes) ? accRes : (accRes?.data || []);
      const existing = (accList || []).find(a => String(a.accountCode || '').toUpperCase() === String(accountCode).toUpperCase());
      if (existing?.id) {
        linkedAccountId = String(existing.id);
      } else {
        const payload = {
          accountCode,
          accountName: ledgerName,
          accountType: 'Assets',
          parentAccount: 'Current Assets',
          balance: String(formData.currentBalance || formData.openingBalance || '0'),
          status: formData.status || 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: JSON.stringify({
            category: 'Assets',
            group: 'Current Assets',
            subGroup: formData.accountType === 'Bank Account' ? 'Bank Accounts' : 'Cash in Hand',
            openingBalance: formData.openingBalance || '0',
            balanceType: 'Debit',
            linkedEntityType: 'Branch Account',
            linkedBranch: formData.branch,
            branchName,
            branchCode,
          })
        };
        const created = await syncService.save('accounts', payload);
        if (created?.data?.id) linkedAccountId = String(created.data.id);
      }
    } catch (err) {
      console.warn('Account Master ledger create failed:', err);
    }

    const branchAccountPayload = {
      accountType: formData.accountType,
      branch: formData.branch,
      accountName: formData.accountName,
      accountNumber: formData.accountNumber || '',
      bankName: formData.bankName || '',
      ifscCode: formData.ifscCode || '',
      openingBalance: String(formData.openingBalance || '0'),
      currentBalance: String(formData.currentBalance || formData.openingBalance || '0'),
      accountId: linkedAccountId || '',
      status: formData.status || 'Active',
      updatedAt: new Date().toISOString(),
      // IMPORTANT: backend column `data` is stored as TEXT; always send JSON string so it persists.
      data: JSON.stringify({
        branchName,
        branchCode,
        branchAddress: formData.branchAddress || '',
        // store account number in data as well for backward compatibility if server schema lacks column
        accountNumber: formData.accountNumber || '',
        accountHolderName: formData.accountHolderName || '',
        contactPerson: formData.contactPerson || '',
        contactNumber: formData.contactNumber || '',
        email: formData.email || '',
        remarks: formData.remarks || ''
      })
    };

    if (editingAccount) {
      const res = await syncService.save('branchAccounts', branchAccountPayload, true, editingAccount.id);
      if (res && res.success === false) throw new Error(res.error || 'Update failed');
      alert('✅ Account updated successfully!');
    } else {
      const res = await syncService.save('branchAccounts', branchAccountPayload);
      if (res && res.success === false) throw new Error(res.error || 'Create failed');
      alert(`✅ ${formData.accountType} created successfully!\n\nAccount: ${formData.accountName}\nBranch: ${branchName}`);
    }

    await reloadBranchAccounts();
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));

    // Reset form
    resetForm();
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

