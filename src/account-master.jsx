import React, { useState, useEffect } from 'react';
import { Save, BookOpen, TrendingUp, DollarSign, Trash2, Edit2 } from 'lucide-react';

export default function AccountMaster() {
  const [accounts, setAccounts] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Account Groups as per Indian Accounting Standards
  const accountGroups = [
    { category: 'Assets', groups: ['Current Assets', 'Fixed Assets', 'Investments', 'Loans & Advances'] },
    { category: 'Liabilities', groups: ['Current Liabilities', 'Secured Loans', 'Unsecured Loans', 'Provisions'] },
    { category: 'Capital', groups: ['Capital Account', 'Reserves & Surplus', 'Retained Earnings'] },
    { category: 'Income', groups: ['Freight Income', 'Other Income', 'Interest Income'] },
    { category: 'Expenses', groups: ['Operating Expenses', 'Administrative Expenses', 'Financial Expenses', 'Salary & Wages'] }
  ];

  const subGroups = {
    'Current Assets': ['Cash in Hand', 'Bank Accounts', 'Sundry Debtors', 'Advances', 'Stock'],
    'Fixed Assets': ['Land & Building', 'Vehicles', 'Furniture & Fixtures', 'Office Equipment'],
    'Current Liabilities': ['Sundry Creditors', 'Outstanding Expenses', 'Duties & Taxes'],
    'Operating Expenses': ['Diesel & Fuel', 'Vehicle Maintenance', 'Office Expenses', 'Rent'],
    'Administrative Expenses': ['Salary & Wages', 'Professional Fees', 'Telephone', 'Printing & Stationery'],
    'Duties & Taxes': ['GST Input', 'GST Output', 'TDS Payable', 'TDS Receivable'],
    'Sundry Debtors': ['TBB Clients', 'Cash Customers'],
    'Sundry Creditors': ['Vendors', 'Market Vehicle Vendors', 'Other Vendors'],
    'Salary & Wages': ['Staff Salary', 'Driver Salary', 'Daily Wages'],
    'Freight Income': ['FTL Income', 'PTL Income', 'Express Delivery Income'],
    'Cash in Hand': ['Branch Cash Book', 'Petty Cash'],
    'Bank Accounts': ['Current Account', 'Savings Account', 'Cash Credit Account']
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = () => {
    const storedAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    setAccounts(storedAccounts);
  };

  const [formData, setFormData] = useState({
    accountName: '',
    accountCode: '',
    category: '',
    group: '',
    subGroup: '',
    openingBalance: '0',
    balanceType: 'Debit',
    gstNumber: '',
    panNumber: '',
    linkedEntity: '',
    linkedEntityType: '',
    autoCreated: false,
    description: '',
    status: 'Active'
  });

  // Auto-create ledgers when entities are created
  useEffect(() => {
    createAutoLedgers();
  }, []);

  const createAutoLedgers = () => {
    const existingAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    const autoAccounts = [];

    // Auto-create for TBB Clients
    const tbbClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    tbbClients.forEach(client => {
      const exists = existingAccounts.find(acc => 
        acc.linkedEntityType === 'TBB Client' && acc.linkedEntity === client.id.toString()
      );
      
      if (!exists && client.status === 'Active') {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          accountName: client.companyName,
          accountCode: 'TBB-' + client.code,
          category: 'Assets',
          group: 'Current Assets',
          subGroup: 'Sundry Debtors',
          openingBalance: '0',
          balanceType: 'Debit',
          gstNumber: client.gstNumber,
          panNumber: client.panNumber,
          linkedEntity: client.id.toString(),
          linkedEntityType: 'TBB Client',
          autoCreated: true,
          description: 'Auto-created from TBB Client Master',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create for Staff
    const staff = JSON.parse(localStorage.getItem('staff') || '[]');
    staff.forEach(emp => {
      const exists = existingAccounts.find(acc => 
        acc.linkedEntityType === 'Staff' && acc.linkedEntity === emp.id.toString()
      );
      
      if (!exists && emp.status === 'Active') {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          accountName: emp.staffName + ' - Salary',
          accountCode: 'STAFF-' + emp.staffCode,
          category: 'Expenses',
          group: 'Administrative Expenses',
          subGroup: 'Salary & Wages',
          openingBalance: '0',
          balanceType: 'Debit',
          linkedEntity: emp.id.toString(),
          linkedEntityType: 'Staff',
          autoCreated: true,
          description: 'Auto-created from Staff Master',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create for Drivers
    const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    drivers.forEach(driver => {
      const exists = existingAccounts.find(acc => 
        acc.linkedEntityType === 'Driver' && acc.linkedEntity === driver.id.toString()
      );
      
      if (!exists && driver.status === 'Active') {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          accountName: driver.driverName + ' - Salary',
          accountCode: 'DRV-' + driver.id,
          category: 'Expenses',
          group: 'Administrative Expenses',
          subGroup: 'Salary & Wages',
          openingBalance: '0',
          balanceType: 'Debit',
          linkedEntity: driver.id.toString(),
          linkedEntityType: 'Driver',
          autoCreated: true,
          description: 'Auto-created from Driver Master',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create for Vendors
    const vendors = JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]');
    vendors.forEach(vendor => {
      const exists = existingAccounts.find(acc => 
        acc.linkedEntityType === 'Vendor' && acc.linkedEntity === vendor.id.toString()
      );
      
      if (!exists && vendor.status === 'Active') {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          accountName: vendor.vendorName,
          accountCode: 'VND-' + vendor.vendorCode,
          category: 'Liabilities',
          group: 'Current Liabilities',
          subGroup: 'Sundry Creditors',
          openingBalance: '0',
          balanceType: 'Credit',
          gstNumber: vendor.gstNumber,
          panNumber: vendor.panNumber,
          linkedEntity: vendor.id.toString(),
          linkedEntityType: 'Vendor',
          autoCreated: true,
          description: 'Auto-created from Vendor Master',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create Branch Cash Books
    const branches = JSON.parse(localStorage.getItem('branches') || '[]');
    branches.forEach(branch => {
      const exists = existingAccounts.find(acc => 
        acc.linkedEntityType === 'Branch Cash Book' && acc.linkedEntity === branch.id.toString()
      );
      
      if (!exists && branch.status === 'Active') {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          accountName: branch.branchName + ' - Cash Book',
          accountCode: 'CASH-' + branch.branchCode,
          category: 'Assets',
          group: 'Current Assets',
          subGroup: 'Cash in Hand',
          openingBalance: '0',
          balanceType: 'Debit',
          linkedEntity: branch.id.toString(),
          linkedEntityType: 'Branch Cash Book',
          autoCreated: true,
          description: 'Auto-created Cash Book for ' + branch.branchName,
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create GST Ledgers if not exist
    const gstLedgers = [
      {
        accountName: 'GST Input (CGST)',
        accountCode: 'GST-IN-CGST',
        category: 'Assets',
        group: 'Current Assets',
        subGroup: 'Sundry Debtors',
        balanceType: 'Debit',
        linkedEntityType: 'GST Account'
      },
      {
        accountName: 'GST Input (SGST)',
        accountCode: 'GST-IN-SGST',
        category: 'Assets',
        group: 'Current Assets',
        subGroup: 'Sundry Debtors',
        balanceType: 'Debit',
        linkedEntityType: 'GST Account'
      },
      {
        accountName: 'GST Input (IGST)',
        accountCode: 'GST-IN-IGST',
        category: 'Assets',
        group: 'Current Assets',
        subGroup: 'Sundry Debtors',
        balanceType: 'Debit',
        linkedEntityType: 'GST Account'
      },
      {
        accountName: 'GST Output (CGST)',
        accountCode: 'GST-OUT-CGST',
        category: 'Liabilities',
        group: 'Current Liabilities',
        subGroup: 'Duties & Taxes',
        balanceType: 'Credit',
        linkedEntityType: 'GST Account'
      },
      {
        accountName: 'GST Output (SGST)',
        accountCode: 'GST-OUT-SGST',
        category: 'Liabilities',
        group: 'Current Liabilities',
        subGroup: 'Duties & Taxes',
        balanceType: 'Credit',
        linkedEntityType: 'GST Account'
      },
      {
        accountName: 'GST Output (IGST)',
        accountCode: 'GST-OUT-IGST',
        category: 'Liabilities',
        group: 'Current Liabilities',
        subGroup: 'Duties & Taxes',
        balanceType: 'Credit',
        linkedEntityType: 'GST Account'
      }
    ];

    gstLedgers.forEach(gst => {
      const exists = existingAccounts.find(acc => acc.accountCode === gst.accountCode);
      if (!exists) {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          ...gst,
          openingBalance: '0',
          autoCreated: true,
          description: 'Auto-created GST Account',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Auto-create TDS Ledgers
    const tdsLedgers = [
      {
        accountName: 'TDS Payable',
        accountCode: 'TDS-PAY',
        category: 'Liabilities',
        group: 'Current Liabilities',
        subGroup: 'Duties & Taxes',
        balanceType: 'Credit',
        linkedEntityType: 'TDS Account'
      },
      {
        accountName: 'TDS Receivable',
        accountCode: 'TDS-REC',
        category: 'Assets',
        group: 'Current Assets',
        subGroup: 'Sundry Debtors',
        balanceType: 'Debit',
        linkedEntityType: 'TDS Account'
      }
    ];

    tdsLedgers.forEach(tds => {
      const exists = existingAccounts.find(acc => acc.accountCode === tds.accountCode);
      if (!exists) {
        autoAccounts.push({
          id: Date.now() + Math.random(),
          ...tds,
          openingBalance: '0',
          autoCreated: true,
          description: 'Auto-created TDS Account',
          status: 'Active',
          createdAt: new Date().toISOString()
        });
      }
    });

    // Save auto-created accounts
    if (autoAccounts.length > 0) {
      const updatedAccounts = [...existingAccounts, ...autoAccounts];
      localStorage.setItem('accountMaster', JSON.stringify(updatedAccounts));
      setAccounts(updatedAccounts);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    
    if (editingId) {
      // Update existing
      const updated = existingAccounts.map(acc => 
        acc.id === editingId ? { ...formData, id: editingId } : acc
      );
      localStorage.setItem('accountMaster', JSON.stringify(updated));
      setAccounts(updated);
      setEditingId(null);
    } else {
      // Create new
      const newAccount = {
        id: Date.now(),
        ...formData,
        autoCreated: false,
        createdAt: new Date().toISOString()
      };
      
      existingAccounts.push(newAccount);
      localStorage.setItem('accountMaster', JSON.stringify(existingAccounts));
      setAccounts(existingAccounts);
    }

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Reset form
    setFormData({
      accountName: '',
      accountCode: '',
      category: '',
      group: '',
      subGroup: '',
      openingBalance: '0',
      balanceType: 'Debit',
      gstNumber: '',
      panNumber: '',
      linkedEntity: '',
      linkedEntityType: '',
      autoCreated: false,
      description: '',
      status: 'Active'
    });

    setTimeout(() => {
      document.querySelector('input[name="accountName"]')?.focus();
    }, 100);
  };

  const editAccount = (account) => {
    setFormData(account);
    setEditingId(account.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAccount = (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      const updated = accounts.filter(acc => acc.id !== id);
      localStorage.setItem('accountMaster', JSON.stringify(updated));
      setAccounts(updated);
    }
  };

  const getAvailableGroups = () => {
    const category = accountGroups.find(c => c.category === formData.category);
    return category ? category.groups : [];
  };

  const getAvailableSubGroups = () => {
    return subGroups[formData.group] || [];
  };

  // Group accounts by category
  const groupedAccounts = accounts.reduce((acc, account) => {
    if (!acc[account.category]) {
      acc[account.category] = [];
    }
    acc[account.category].push(account);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #3b82f6;
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
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
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .account-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        
        .account-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
        }
        
        .auto-badge {
          display: inline-block;
          padding: 4px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .balance-debit {
          color: #059669;
          font-weight: 600;
        }
        
        .balance-credit {
          color: #dc2626;
          font-weight: 600;
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
            📒 Account Master (Ledger Master)
          </h1>
          <p className="text-slate-600 text-lg">Indian Standard Business Accounting - Chart of Accounts</p>
        </div>

        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ Account {editingId ? 'Updated' : 'Created'} Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Ready for next entry...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="form-section">
            <h2 className="section-title">
              <BookOpen size={20} />
              Account Details
            </h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Account Name *</label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountName: e.target.value }))}
                  placeholder="e.g., ABC Transport Ltd"
                  required
                  autoFocus
                />
              </div>
              
              <div className="input-group">
                <label>Account Code *</label>
                <input
                  type="text"
                  value={formData.accountCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, accountCode: e.target.value.toUpperCase() }))}
                  placeholder="e.g., TBB-001"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          {/* Account Classification */}
          <div className="form-section">
            <h2 className="section-title">
              <TrendingUp size={20} />
              Account Classification
            </h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    category: e.target.value,
                    group: '',
                    subGroup: ''
                  }))}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {accountGroups.map(cat => (
                    <option key={cat.category} value={cat.category}>{cat.category}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Group *</label>
                <select
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    group: e.target.value,
                    subGroup: ''
                  }))}
                  required
                  disabled={!formData.category}
                >
                  <option value="">-- Select Group --</option>
                  {getAvailableGroups().map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Sub-Group</label>
                <select
                  value={formData.subGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, subGroup: e.target.value }))}
                  disabled={!formData.group}
                >
                  <option value="">-- Select Sub-Group --</option>
                  {getAvailableSubGroups().map(subGroup => (
                    <option key={subGroup} value={subGroup}>{subGroup}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Opening Balance */}
          <div className="form-section">
            <h2 className="section-title">
              <DollarSign size={20} />
              Opening Balance
            </h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Opening Balance (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.openingBalance}
                  onChange={(e) => setFormData(prev => ({ ...prev, openingBalance: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Balance Type</label>
                <select
                  value={formData.balanceType}
                  onChange={(e) => setFormData(prev => ({ ...prev, balanceType: e.target.value }))}
                >
                  <option value="Debit">Debit (Dr.)</option>
                  <option value="Credit">Credit (Cr.)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Tax Details */}
          <div className="form-section">
            <h2 className="section-title">
              Tax & Regulatory Details (Optional)
            </h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>GST Number</label>
                <input
                  type="text"
                  value={formData.gstNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData(prev => ({ ...prev, gstNumber: value }));
                  }}
                  placeholder="15 characters or URP"
                  maxLength={formData.gstNumber === 'URP' ? 3 : 15}
                />
              </div>
              
              <div className="input-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  value={formData.panNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }))}
                  placeholder="10 characters"
                  maxLength="10"
                />
              </div>
            </div>
          </div>

          {/* Additional Info */}
          <div className="form-section">
            <h2 className="section-title">
              Additional Information
            </h2>
            
            <div className="input-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ fontSize: '1.1rem', padding: '14px 40px' }}
            >
              <Save size={20} />
              {editingId ? 'Update Account' : 'Create Account (Continue Adding)'}
            </button>
            
            {editingId && (
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: '12px', fontSize: '1.1rem', padding: '14px 40px' }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    accountName: '',
                    accountCode: '',
                    category: '',
                    group: '',
                    subGroup: '',
                    openingBalance: '0',
                    balanceType: 'Debit',
                    gstNumber: '',
                    panNumber: '',
                    linkedEntity: '',
                    linkedEntityType: '',
                    autoCreated: false,
                    description: '',
                    status: 'Active'
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {/* Accounts List */}
        {accounts.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Chart of Accounts ({accounts.length})</h2>
            
            {Object.keys(groupedAccounts).sort().map(category => (
              <div key={category} style={{ marginBottom: '30px' }}>
                <h3 style={{
                  fontSize: '1.3rem',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3b82f6'
                }}>
                  {category === 'Assets' && '📈 '}
                  {category === 'Liabilities' && '📉 '}
                  {category === 'Capital' && '💰 '}
                  {category === 'Income' && '💵 '}
                  {category === 'Expenses' && '💸 '}
                  {category} ({groupedAccounts[category].length})
                </h3>
                
                {groupedAccounts[category].map(account => (
                  <div key={account.id} className="account-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                            {account.accountName}
                          </h4>
                          {account.autoCreated && (
                            <span className="auto-badge">🤖 AUTO</span>
                          )}
                        </div>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.85rem', color: '#64748b' }}>
                          <div><strong>Code:</strong> {account.accountCode}</div>
                          <div><strong>Group:</strong> {account.group}</div>
                          {account.subGroup && <div><strong>Sub-Group:</strong> {account.subGroup}</div>}
                          <div>
                            <strong>Balance:</strong>{' '}
                            <span className={account.balanceType === 'Debit' ? 'balance-debit' : 'balance-credit'}>
                              ₹{parseFloat(account.openingBalance || 0).toFixed(2)} {account.balanceType === 'Debit' ? 'Dr.' : 'Cr.'}
                            </span>
                          </div>
                          {account.linkedEntityType && (
                            <div><strong>Linked:</strong> {account.linkedEntityType}</div>
                          )}
                        </div>
                        
                        {account.description && (
                          <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic' }}>
                            {account.description}
                          </div>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                        <button
                          className="btn btn-secondary"
                          onClick={() => editAccount(account)}
                          style={{ padding: '8px 12px' }}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={() => deleteAccount(account.id)}
                          style={{ padding: '8px 12px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
