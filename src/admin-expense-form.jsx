import React, { useState, useEffect } from 'react';
import { Save, DollarSign, Wallet } from 'lucide-react';

export default function AdminExpenseForm() {
  const [branches, setBranches] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  
  const [formData, setFormData] = useState({
    allocationNumber: '',
    allocationDate: new Date().toISOString().split('T')[0],
    branch: '',
    sourceType: 'Account', // Account or Cash
    sourceAccount: '',
    amount: '',
    paymentMode: 'Bank Transfer', // Bank Transfer, Cash, Cheque
    upiId: '',
    referenceNumber: '',
    description: '',
    remarks: ''
  });

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    setBranches(allBranches.filter(b => b.status === 'Active'));
    
    // Load bank accounts from branch accounts (created in Branch Account form)
    const branchAccounts = JSON.parse(localStorage.getItem('branchAccounts') || '[]');
    // Filter for Bank Accounts only (not Cashier Accounts) and active status
    const bankAccounts = branchAccounts.filter(acc => 
      acc.status === 'Active' && acc.accountType === 'Bank Account'
    );
    setAccounts(bankAccounts);
    
    const allAllocations = JSON.parse(localStorage.getItem('branchFundAllocations') || '[]');
    setAllocations(allAllocations);
    
    // Auto-generate allocation number
    const allocNo = `ALLOC${String(allAllocations.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, allocationNumber: allocNo }));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.branch) {
      alert('⚠️ Please select a branch!');
      return;
    }
    
    if (formData.sourceType === 'Account' && !formData.sourceAccount) {
      alert('⚠️ Please select a source account!');
      return;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    if (formData.paymentMode === 'UPI' && !String(formData.upiId || '').trim()) {
      alert('⚠️ Please enter UPI ID / Mobile Number for this payment!');
      return;
    }

    const selectedBranch = branches.find(b => b.id.toString() === formData.branch);
    const selectedAccount = formData.sourceAccount 
      ? accounts.find(a => a.id.toString() === formData.sourceAccount)
      : null;

    const newAllocation = {
      id: Date.now(),
      allocationNumber: formData.allocationNumber,
      allocationDate: formData.allocationDate,
      branch: formData.branch,
      branchName: selectedBranch?.branchName || 'N/A',
      branchCode: selectedBranch?.branchCode || 'N/A',
      sourceType: formData.sourceType,
      sourceAccount: formData.sourceAccount,
      sourceAccountName: selectedAccount?.accountName || (formData.sourceType === 'Cash' ? 'Cash' : 'N/A'),
      sourceAccountCode: selectedAccount?.accountNumber || selectedAccount?.accountCode || '',
      sourceBankName: selectedAccount?.bankName || '',
      sourceBranchName: selectedAccount?.branchName || '',
      amount: parseFloat(formData.amount),
      paymentMode: formData.paymentMode,
      upiId: formData.paymentMode === 'UPI' ? String(formData.upiId || '').trim() : '',
      referenceNumber: formData.referenceNumber,
      description: formData.description,
      remarks: formData.remarks,
      allocatedBy: currentUser?.name || currentUser?.username || 'Unknown',
      createdAt: new Date().toISOString(),
      status: 'Active'
    };

    const updatedAllocations = [...allocations, newAllocation];
    localStorage.setItem('branchFundAllocations', JSON.stringify(updatedAllocations));
    setAllocations(updatedAllocations);

    alert(`✅ Funds allocated successfully!\n\nAllocation: ${formData.allocationNumber}\nBranch: ${newAllocation.branchName}\nAmount: ₹${newAllocation.amount.toFixed(2)}\nSource: ${newAllocation.sourceAccountName}`);

    // Reset form
    const allocNo = `ALLOC${String(updatedAllocations.length + 1).padStart(6, '0')}`;
    setFormData({
      allocationNumber: allocNo,
      allocationDate: new Date().toISOString().split('T')[0],
      branch: '',
      sourceType: 'Account',
      sourceAccount: '',
      amount: '',
      paymentMode: 'Bank Transfer',
      upiId: '',
      referenceNumber: '',
      description: '',
      remarks: ''
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
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
          border-left: 4px solid #3b82f6;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(59,130,246,0.1);
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
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
        
        .source-card {
          padding: 16px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: white;
        }
        
        .source-card:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .source-card.selected {
          border-color: #3b82f6;
          background: #dbeafe;
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
            Branch Fund Allocation
          </h1>
          <p className="text-slate-600 text-lg">Allocate funds to branches from company accounts or cash</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Allocation Details */}
          <div className="form-section">
            <h2 className="section-title">Allocation Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Allocation Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.allocationNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Allocation Date *</label>
                <input
                  type="date"
                  value={formData.allocationDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, allocationDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Branch *</label>
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
              </div>
            </div>
          </div>

          {/* Source Selection */}
          <div className="form-section">
            <h2 className="section-title">Source of Funds</h2>
            
            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div
                className={`source-card ${formData.sourceType === 'Account' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'Account', sourceAccount: '' }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Wallet size={24} style={{ color: '#3b82f6' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Company Account</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Transfer from bank account</div>
                  </div>
                </div>
              </div>
              
              <div
                className={`source-card ${formData.sourceType === 'Cash' ? 'selected' : ''}`}
                onClick={() => setFormData(prev => ({ ...prev, sourceType: 'Cash', sourceAccount: '' }))}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <DollarSign size={24} style={{ color: '#10b981' }} />
                  <div>
                    <div style={{ fontWeight: 600, color: '#1e293b' }}>Cash</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Physical cash allocation</div>
                  </div>
                </div>
              </div>
            </div>

            {formData.sourceType === 'Account' && (
              <div className="input-group">
                <label>Source Account *</label>
                <select
                  value={formData.sourceAccount}
                  onChange={(e) => setFormData(prev => ({ ...prev, sourceAccount: e.target.value }))}
                  required
                >
                  <option value="">-- Select Bank Account --</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.accountName} - {account.bankName || 'N/A'} 
                      {account.accountNumber && ` (A/c: ${account.accountNumber})`}
                      {account.branchName && ` [${account.branchName}]`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.sourceType === 'Cash' && (
              <div style={{ 
                padding: '12px', 
                background: '#f0fdf4', 
                borderRadius: '8px',
                border: '1px solid #86efac',
                color: '#166534',
                fontSize: '0.9rem'
              }}>
                💵 Cash allocation will be recorded from company cash account
              </div>
            )}
          </div>

          {/* Amount & Payment Details */}
          <div className="form-section">
            <h2 className="section-title">Amount & Payment Details</h2>
            
            <div className="grid-3">
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
              
              <div className="input-group">
                <label>Payment Mode *</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value, upiId: '' }))}
                  required
                >
                  {formData.sourceType === 'Cash' ? (
                    <>
                      <option value="Cash">Cash</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                    </>
                  ) : (
                    <>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="NEFT">NEFT</option>
                      <option value="RTGS">RTGS</option>
                      <option value="IMPS">IMPS</option>
                      <option value="Cheque">Cheque</option>
                      <option value="UPI">UPI</option>
                    </>
                  )}
                </select>
              </div>

              {formData.paymentMode === 'UPI' && (
                <div className="input-group">
                  <label>UPI ID / Mobile No. *</label>
                  <input
                    type="text"
                    value={formData.upiId}
                    onChange={(e) => setFormData(prev => ({ ...prev, upiId: e.target.value }))}
                    placeholder="example@upi or 9876543210"
                    required
                  />
                </div>
              )}
              
              <div className="input-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={formData.referenceNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="Transaction/Cheque number"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                placeholder="Enter allocation description/purpose..."
              />
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
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.9rem', opacity: 0.9, marginBottom: '4px' }}>Allocation Amount</div>
                <div style={{ fontSize: '2rem', fontWeight: 700 }}>
                  ₹{(parseFloat(formData.amount) || 0).toFixed(2)}
                </div>
                {formData.branch && (
                  <div style={{ fontSize: '0.85rem', opacity: 0.9, marginTop: '4px' }}>
                    To: {branches.find(b => b.id.toString() === formData.branch)?.branchName || 'N/A'}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="btn"
                style={{ 
                  background: 'white', 
                  color: '#3b82f6',
                  fontSize: '1rem',
                  padding: '12px 32px'
                }}
              >
                <Save size={20} />
                Allocate Funds
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

