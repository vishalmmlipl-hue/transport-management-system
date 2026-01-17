import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Edit2, DollarSign, FileText, BookOpen, X } from 'lucide-react';

export default function ExpenseMasterForm() {
  const [expenseMaster, setExpenseMaster] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');

  const [formData, setFormData] = useState({
    category: '',
    expenseType: '',
    expenseHead: '', // Account ID from Account Master
    description: '',
    status: 'Active'
  });

  useEffect(() => {
    initializeDefaultExpenseTypes();
    loadData();
  }, []);

  const initializeDefaultExpenseTypes = () => {
    const storedMaster = JSON.parse(localStorage.getItem('expenseMaster') || '[]');
    
    // Only initialize if no expense types exist
    if (storedMaster.length > 0) return;
    
    const allAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    
    // Default expense types with their categories
    const defaultExpenseTypes = [
      // Operating Expenses
      { category: 'Operating', expenseType: 'Diesel & Fuel', subGroup: 'Diesel & Fuel' },
      { category: 'Operating', expenseType: 'Vehicle Maintenance', subGroup: 'Vehicle Maintenance' },
      { category: 'Operating', expenseType: 'Office Expenses', subGroup: 'Office Expenses' },
      { category: 'Operating', expenseType: 'Rent', subGroup: 'Rent' },
      { category: 'Operating', expenseType: 'Loading/Unloading', subGroup: 'Office Expenses' },
      { category: 'Operating', expenseType: 'Toll Charges', subGroup: 'Office Expenses' },
      
      // Administrative Expenses
      { category: 'Administrative', expenseType: 'Salary & Wages', subGroup: 'Salary & Wages' },
      { category: 'Administrative', expenseType: 'Professional Fees', subGroup: 'Professional Fees' },
      { category: 'Administrative', expenseType: 'Telephone', subGroup: 'Telephone' },
      { category: 'Administrative', expenseType: 'Printing & Stationery', subGroup: 'Printing & Stationery' },
      { category: 'Administrative', expenseType: 'Internet', subGroup: 'Telephone' },
      { category: 'Administrative', expenseType: 'Electricity', subGroup: 'Office Expenses' },
      { category: 'Administrative', expenseType: 'Water', subGroup: 'Office Expenses' },
      
      // Financial Expenses
      { category: 'Financial', expenseType: 'Interest', subGroup: 'Interest' },
      { category: 'Financial', expenseType: 'Bank Charges', subGroup: 'Bank Charges' },
      { category: 'Financial', expenseType: 'Penalties', subGroup: 'Penalties' },
      { category: 'Financial', expenseType: 'Late Fees', subGroup: 'Penalties' },
      
      // Other Expenses
      { category: 'Other', expenseType: 'Miscellaneous', subGroup: 'Miscellaneous' },
      { category: 'Other', expenseType: 'Donations', subGroup: 'Miscellaneous' },
      { category: 'Other', expenseType: 'Entertainment', subGroup: 'Miscellaneous' },
      { category: 'Other', expenseType: 'Travel', subGroup: 'Miscellaneous' }
    ];
    
    const newExpenseTypes = [];
    
    defaultExpenseTypes.forEach((expense, index) => {
      // Try to find matching expense account
      let expenseAccount = allAccounts.find(acc => 
        acc.category === 'Expenses' &&
        (acc.subGroup === expense.subGroup || 
         acc.accountName.toLowerCase().includes(expense.expenseType.toLowerCase()) ||
         acc.group === `${expense.category} Expenses`)
      );
      
      // If no matching account found, create one
      if (!expenseAccount) {
        const accountCode = `EXP-${expense.expenseType.replace(/\s+/g, '-').toUpperCase().substring(0, 10)}`;
        expenseAccount = {
          id: Date.now() + index * 1000,
          accountName: expense.expenseType,
          accountCode: accountCode,
          category: 'Expenses',
          group: expense.category === 'Operating' ? 'Operating Expenses' :
                 expense.category === 'Administrative' ? 'Administrative Expenses' :
                 expense.category === 'Financial' ? 'Financial Expenses' : 'Other Expenses',
          subGroup: expense.subGroup,
          openingBalance: '0',
          currentBalance: '0',
          balanceType: 'Debit',
          status: 'Active',
          createdAt: new Date().toISOString()
        };
        allAccounts.push(expenseAccount);
      }
      
      newExpenseTypes.push({
        id: Date.now() + index,
        category: expense.category,
        expenseType: expense.expenseType,
        expenseHead: expenseAccount.id,
        description: `Default expense type for ${expense.expenseType}`,
        status: 'Active',
        createdAt: new Date().toISOString()
      });
    });
    
    // Save accounts if new ones were created
    if (allAccounts.length > JSON.parse(localStorage.getItem('accountMaster') || '[]').length) {
      localStorage.setItem('accountMaster', JSON.stringify(allAccounts));
    }
    
    // Save expense master
    localStorage.setItem('expenseMaster', JSON.stringify(newExpenseTypes));
  };

  const loadData = () => {
    const storedMaster = JSON.parse(localStorage.getItem('expenseMaster') || '[]');
    setExpenseMaster(storedMaster);
    
    const allAccounts = JSON.parse(localStorage.getItem('accountMaster') || '[]');
    // Filter only expense accounts (category = 'Expenses')
    const expenseAccounts = allAccounts.filter(acc => 
      acc.category === 'Expenses' && acc.status === 'Active'
    );
    setAccounts(expenseAccounts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.category || !formData.expenseType || !formData.expenseHead) {
      alert('⚠️ Please fill all required fields (Category, Expense Type, and Expense Head)!');
      return;
    }

    // Check if expense type already exists in the same category
    const existingMaster = JSON.parse(localStorage.getItem('expenseMaster') || '[]');
    const duplicate = existingMaster.find(
      item => 
        item.category === formData.category && 
        item.expenseType.toLowerCase() === formData.expenseType.toLowerCase() &&
        item.id !== editingId
    );

    if (duplicate) {
      alert('⚠️ This expense type already exists in the selected category!');
      return;
    }

    if (editingId) {
      // Update existing
      const updated = expenseMaster.map(item =>
        item.id === editingId ? { ...formData, id: editingId } : item
      );
      localStorage.setItem('expenseMaster', JSON.stringify(updated));
      setExpenseMaster(updated);
      setEditingId(null);
      alert('✅ Expense type updated successfully!');
    } else {
      // Create new
      const newItem = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString()
      };
      
      const updated = [...expenseMaster, newItem];
      localStorage.setItem('expenseMaster', JSON.stringify(updated));
      setExpenseMaster(updated);
      alert('✅ Expense type added successfully!');
    }

    // Reset form
    setFormData({
      category: '',
      expenseType: '',
      expenseHead: '',
      description: '',
      status: 'Active'
    });
    setShowForm(false);
    setSelectedCategory('');
  };

  const editItem = (item) => {
    setFormData(item);
    setEditingId(item.id);
    setSelectedCategory(item.category);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteItem = (id) => {
    if (window.confirm('Are you sure you want to delete this expense type?')) {
      const updated = expenseMaster.filter(item => item.id !== id);
      localStorage.setItem('expenseMaster', JSON.stringify(updated));
      setExpenseMaster(updated);
      alert('✅ Expense type deleted successfully!');
    }
  };

  const getExpenseHeadName = (accountId) => {
    const account = accounts.find(acc => acc.id.toString() === accountId.toString());
    return account ? `${account.accountName} (${account.accountCode})` : 'N/A';
  };

  const categories = ['Operating', 'Administrative', 'Financial', 'Other'];
  
  const filteredMaster = expenseMaster.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.expenseType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getExpenseHeadName(item.expenseHead).toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || item.category === filterCategory;
    
    return matchesSearch && matchesCategory && item.status === 'Active';
  });

  const groupedByCategory = categories.reduce((acc, cat) => {
    acc[cat] = filteredMaster.filter(item => item.category === cat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100 p-6">
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
          border-left: 4px solid #ef4444;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(239,68,68,0.1);
          transform: translateY(-2px);
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          letter-spacing: 0.02em;
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
          letter-spacing: 0.01em;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          background: white;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239,68,68,0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
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
          background: #ef4444;
          color: white;
        }
        
        .btn-primary:hover {
          background: #dc2626;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        .btn-danger {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .btn-danger:hover {
          background: #fecaca;
        }
        
        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 24px;
        }
        
        .filters-section {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          display: flex;
          gap: 16px;
          align-items: center;
          flex-wrap: wrap;
        }
        
        .search-bar {
          flex: 1;
          min-width: 300px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }
        
        .search-bar input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 0;
        }
        
        .search-bar input:focus {
          box-shadow: none;
        }
        
        .filter-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .filter-group label {
          margin: 0;
          font-weight: 500;
          color: #475569;
        }
        
        .filter-group select {
          padding: 8px 12px;
          min-width: 200px;
        }
        
        .form-hint {
          display: block;
          margin-top: 6px;
          font-size: 0.75rem;
          color: #64748b;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        @media (max-width: 768px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
        
        table {
          width: 100%;
          border-collapse: collapse;
        }
        
        table th {
          background: #f8fafc;
          font-weight: 600;
          text-align: left;
          padding: 12px 16px;
          border-bottom: 2px solid #e2e8f0;
          color: #475569;
          font-size: 0.875rem;
        }
        
        table td {
          padding: 14px 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        table tbody tr:hover {
          background: #f8fafc;
        }
        
        table tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>

      <div className="form-section">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <BookOpen size={28} style={{ color: '#ef4444' }} />
              Expense Master
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
              Manage expense categories, types, and expense heads for accounting
            </p>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) {
                setFormData({
                  category: '',
                  expenseType: '',
                  expenseHead: '',
                  description: '',
                  status: 'Active'
                });
                setEditingId(null);
                setSelectedCategory('');
              }
            }}
          >
            {showForm ? <X size={20} /> : <Plus size={20} />}
            {showForm ? 'Cancel' : 'Add Expense Type'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="form-section" style={{ marginTop: '20px' }}>
            <h2 className="section-title">
              {editingId ? 'Edit Expense Type' : 'Add New Expense Type'}
            </h2>

          <div className="grid-2">
            <div className="input-group">
              <label>Expense Category *</label>
              <select
                value={formData.category}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, category: e.target.value }));
                  setSelectedCategory(e.target.value);
                }}
                required
              >
                <option value="">-- Select Category --</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>
                    {cat} Expenses
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Expense Type *</label>
              <input
                type="text"
                value={formData.expenseType}
                onChange={(e) => setFormData(prev => ({ ...prev, expenseType: e.target.value }))}
                placeholder="e.g., Diesel & Fuel, Vehicle Maintenance"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label>Expense Head (Account) *</label>
            <select
              value={formData.expenseHead}
              onChange={(e) => setFormData(prev => ({ ...prev, expenseHead: e.target.value }))}
              required
            >
              <option value="">-- Select Expense Head from Account Master --</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountName} ({acc.accountCode}) - {acc.group} {acc.subGroup ? `- ${acc.subGroup}` : ''}
                </option>
              ))}
            </select>
            <small className="form-hint">
              Select an expense account from Account Master. This will be used for booking expenses in accounts.
            </small>
          </div>

          <div className="input-group">
            <label>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional description for this expense type"
              rows="3"
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

          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              <Save size={20} />
              {editingId ? 'Update Expense Type' : 'Add Expense Type'}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowForm(false);
                setFormData({
                  category: '',
                  expenseType: '',
                  expenseHead: '',
                  description: '',
                  status: 'Active'
                });
                setEditingId(null);
                setSelectedCategory('');
              }}
            >
              Cancel
            </button>
          </div>
          </form>
        )}

        {/* Filters */}
        <div className="filters-section" style={{ marginTop: '20px' }}>
        <div className="search-bar">
          <FileText size={20} />
          <input
            type="text"
            placeholder="Search by expense type, category, or expense head..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="All">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat} Expenses</option>
            ))}
          </select>
        </div>
      </div>

        {/* Expense Master List */}
        <div className="form-section" style={{ marginTop: '20px' }}>
        <h2 className="section-title">
          <DollarSign size={20} />
          Expense Types ({filteredMaster.length})
        </h2>

        {filteredMaster.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b'
          }}>
            <FileText size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem' }}>No expense types found. Add your first expense type above.</p>
          </div>
        ) : (
          <div>
            {categories.map(category => {
              const items = groupedByCategory[category] || [];
              if (items.length === 0 && filterCategory !== 'All') return null;

              return (
                <div key={category} style={{ marginBottom: '30px' }}>
                  <h3 style={{
                    fontSize: '1.1rem',
                    fontWeight: 600,
                    color: '#1e293b',
                    marginBottom: '16px',
                    paddingBottom: '8px',
                    borderBottom: '2px solid #e2e8f0'
                  }}>
                    {category} Expenses ({items.length})
                  </h3>
                  
                  {items.length === 0 ? (
                    <p style={{ color: '#64748b', fontStyle: 'italic', padding: '20px' }}>
                      No expense types in this category
                    </p>
                  ) : (
                    <div style={{
                      background: 'white',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: '1px solid #e2e8f0'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                              Expense Type
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                              Expense Head (Account)
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                              Description
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>
                              Status
                            </th>
                            <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.875rem', width: '120px' }}>
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, index) => (
                            <tr 
                              key={item.id}
                              style={{
                                borderBottom: index < items.length - 1 ? '1px solid #e2e8f0' : 'none',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                            >
                              <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 500 }}>
                                {item.expenseType}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontSize: '0.9rem' }}>
                                {getExpenseHeadName(item.expenseHead)}
                              </td>
                              <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.875rem' }}>
                                {item.description || <span style={{ fontStyle: 'italic', color: '#94a3b8' }}>No description</span>}
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 12px',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: 500,
                                  background: item.status === 'Active' ? '#10b98120' : '#f59e0b20',
                                  color: item.status === 'Active' ? '#10b981' : '#f59e0b'
                                }}>
                                  {item.status}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                  <button
                                    className="btn btn-secondary"
                                    onClick={() => editItem(item)}
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    title="Edit"
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    className="btn btn-danger"
                                    onClick={() => deleteItem(item.id)}
                                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                    title="Delete"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}

