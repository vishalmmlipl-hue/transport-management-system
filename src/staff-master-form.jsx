import React, { useState, useEffect } from 'react';
import { Save, Users, Edit2, Trash2, Ban, CheckCircle, Search, X, Plus } from 'lucide-react';
import { apiService } from './utils/apiService';

export default function StaffMasterForm() {
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'view'
  const [editingStaffId, setEditingStaffId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Load branches from API
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const result = await apiService.getBranches();
        const branchesData = result?.data || result || [];
        // Filter active branches and clean branch names
        const activeBranches = branchesData
          .filter(b => b.status === 'Active' || !b.status || b.status === undefined)
          .map(branch => ({
            ...branch,
            branchName: branch.branchName ? branch.branchName.trim().replace(/0+$/, '').trim() : branch.branchName
          }));
        setBranches(activeBranches);
      } catch (error) {
        console.error('Error loading branches:', error);
        setBranches([]);
      } finally {
        setLoading(false);
      }
    };

    loadBranches();
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const result = await apiService.getStaff();
      const staffData = result?.data || result || [];
      setStaff(staffData);
    } catch (error) {
      console.error('Error loading staff:', error);
      setStaff([]);
    }
  };

  const [formData, setFormData] = useState({
    staffCode: '',
    staffName: '',
    fatherName: '',
    dateOfBirth: '',
    bloodGroup: '',
    branch: '',
    designation: '',
    department: '',
    contactDetails: {
      mobile: '',
      alternateMobile: '',
      email: '',
      emergencyContact: '',
      emergencyContactName: ''
    },
    address: {
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      pincode: ''
    },
    aadharNumber: '',
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    salaryType: 'Monthly',
    salaryDetails: {
      monthlySalary: '',
      dailyWages: ''
    },
    joiningDate: '',
    status: 'Active',
    remarks: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const departments = [
    'Operations',
    'Administration',
    'Accounts',
    'HR',
    'Sales',
    'Marketing',
    'IT',
    'Warehouse',
    'Loading/Unloading',
    'Security',
    'Cleaning',
    'Maintenance',
    'Others'
  ];

  const resetForm = () => {
    setFormData({
      staffCode: '',
      staffName: '',
      fatherName: '',
      dateOfBirth: '',
      bloodGroup: '',
      branch: '',
      designation: '',
      department: '',
      contactDetails: {
        mobile: '',
        alternateMobile: '',
        email: '',
        emergencyContact: '',
        emergencyContactName: ''
      },
      address: {
        currentAddress: '',
        permanentAddress: '',
        city: '',
        state: '',
        pincode: ''
      },
      aadharNumber: '',
      panNumber: '',
      bankDetails: {
        accountName: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifscCode: ''
      },
      salaryType: 'Monthly',
      salaryDetails: {
        monthlySalary: '',
        dailyWages: ''
      },
      joiningDate: '',
      status: 'Active',
      remarks: ''
    });
    setEditingStaffId(null);
  };

  const handleEdit = (staffMember) => {
    setFormData({
      ...staffMember,
      contactDetails: typeof staffMember.contactDetails === 'string' 
        ? JSON.parse(staffMember.contactDetails || '{}') 
        : (staffMember.contactDetails || {}),
      address: typeof staffMember.address === 'string' 
        ? JSON.parse(staffMember.address || '{}') 
        : (staffMember.address || {}),
      bankDetails: typeof staffMember.bankDetails === 'string' 
        ? JSON.parse(staffMember.bankDetails || '{}') 
        : (staffMember.bankDetails || {}),
      salaryDetails: typeof staffMember.salaryDetails === 'string' 
        ? JSON.parse(staffMember.salaryDetails || '{}') 
        : (staffMember.salaryDetails || {})
    });
    setEditingStaffId(staffMember.id);
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this staff member?\n\nThis action cannot be undone!')) {
      try {
        await apiService.deleteStaff(id);
        alert('✅ Staff member deleted successfully!');
        loadStaff();
      } catch (error) {
        console.error('Error deleting staff:', error);
        alert('❌ Error deleting staff member: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleSuspend = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to suspend this staff member?')) {
      try {
        const staffMember = staff.find(s => s.id === id);
        if (staffMember) {
          await apiService.updateStaff(id, { ...staffMember, status: 'Suspended' });
          alert('✅ Staff member suspended successfully!');
          loadStaff();
        }
      } catch (error) {
        console.error('Error suspending staff:', error);
        alert('❌ Error suspending staff member: ' + (error.message || 'Unknown error'));
      }
    }
  };

  const handleActivate = async (id) => {
    try {
      const staffMember = staff.find(s => s.id === id);
      if (staffMember) {
        await apiService.updateStaff(id, { ...staffMember, status: 'Active' });
        alert('✅ Staff member activated successfully!');
        loadStaff();
      }
    } catch (error) {
      console.error('Error activating staff:', error);
      alert('❌ Error activating staff member: ' + (error.message || 'Unknown error'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const staffData = {
        ...formData,
        contactDetails: JSON.stringify(formData.contactDetails),
        address: JSON.stringify(formData.address),
        bankDetails: JSON.stringify(formData.bankDetails),
        salaryDetails: JSON.stringify(formData.salaryDetails),
        staffCode: formData.staffCode || `STF${String(staff.length + 1).padStart(3, '0')}`,
        updatedAt: new Date().toISOString()
      };

      if (editingStaffId) {
        // Update existing staff
        await apiService.updateStaff(editingStaffId, staffData);
        alert('✅ Staff member updated successfully!');
      } else {
        // Create new staff
        staffData.createdAt = new Date().toISOString();
        await apiService.createStaff(staffData);
        alert('✅ Staff member created successfully!');
      }

      resetForm();
      loadStaff();
      setActiveTab('view');
    } catch (error) {
      console.error('Error saving staff:', error);
      alert('❌ Error saving staff: ' + (error.message || 'Unknown error'));
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = !searchTerm || 
      s.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.staffCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.department?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 p-6">
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
          border-left: 4px solid #ec4899;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(236,72,153,0.1);
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
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.1);
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
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
          color: white;
        }
        
        .btn-secondary {
          background: #64748b;
          color: white;
        }
        
        .btn-success {
          background: #10b981;
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        
        .btn-primary:hover, .btn-secondary:hover, .btn-success:hover, .btn-danger:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .toggle-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #64748b;
        }
        
        .toggle-btn.active {
          background: #ec4899;
          color: white;
          border-color: #ec4899;
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Staff Master
          </h1>
          <p className="text-slate-600 text-lg">Staff Onboarding & Management System</p>
        </div>

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0'
        }}>
          <button
            type="button"
            onClick={() => { setActiveTab('create'); resetForm(); }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'create' ? '3px solid #ec4899' : '3px solid transparent',
              color: activeTab === 'create' ? '#ec4899' : '#64748b',
              fontWeight: activeTab === 'create' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} />
            {editingStaffId ? 'Edit Staff' : 'Add Staff'}
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('view'); loadStaff(); }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'view' ? '3px solid #ec4899' : '3px solid transparent',
              color: activeTab === 'view' ? '#ec4899' : '#64748b',
              fontWeight: activeTab === 'view' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Users size={18} />
            View Staff ({staff.length})
          </button>
        </div>

        {/* Create/Edit Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Staff Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.staffCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Staff Name *</label>
                <input
                  type="text"
                  value={formData.staffName}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Father's Name *</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                  placeholder="Father's name"
                  required
                />
              </div>
            </div>

            <div className="grid-4">
              <div className="input-group">
                <label>Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Branch *</label>
                {loading ? (
                  <select disabled style={{ background: '#f8fafc' }}>
                    <option>Loading branches...</option>
                  </select>
                ) : branches.length === 0 ? (
                  <div style={{
                    padding: '10px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}>
                    ⚠️ No branches available. Please add branches first.
                  </div>
                ) : (
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName || 'Unnamed Branch'} {branch.address?.city ? `(${branch.address.city})` : branch.branchCode ? `(${branch.branchCode})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="input-group">
                <label>Designation *</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g., Manager, Clerk"
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  required
                >
                  <option value="">-- Select --</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h2 className="section-title">Contact Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.contactDetails.mobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, mobile: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Alternate Mobile</label>
                <input
                  type="tel"
                  value={formData.contactDetails.alternateMobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, alternateMobile: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                />
              </div>
              
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.contactDetails.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, email: e.target.value }
                  }))}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Emergency Contact Name *</label>
                <input
                  type="text"
                  value={formData.contactDetails.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, emergencyContactName: e.target.value }
                  }))}
                  placeholder="Name of emergency contact person"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Emergency Contact Number *</label>
                <input
                  type="tel"
                  value={formData.contactDetails.emergencyContact}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, emergencyContact: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="form-section">
            <h2 className="section-title">Address Details</h2>
            
            <div className="input-group">
              <label>Current Address</label>
              <textarea
                value={formData.address.currentAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, currentAddress: e.target.value }
                }))}
                placeholder="Complete current address (optional)"
                rows="2"
              />
            </div>
            
            <div className="input-group">
              <label>Permanent Address</label>
              <textarea
                value={formData.address.permanentAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, permanentAddress: e.target.value }
                }))}
                placeholder="Complete permanent address (optional)"
                rows="2"
              />
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>City</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="City (optional)"
                />
              </div>
              
              <div className="input-group">
                <label>State</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="State (optional)"
                />
              </div>
              
              <div className="input-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, pincode: e.target.value }
                  }))}
                  placeholder="6 digits (optional)"
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
              </div>
            </div>
          </div>

          {/* Identity Documents */}
          <div className="form-section">
            <h2 className="section-title">Identity Documents</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Aadhar Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                  placeholder="12 digits (optional)"
                  maxLength="12"
                  pattern="[0-9]{12}"
                />
              </div>
              
              <div className="input-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.panNumber}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    panNumber: e.target.value.toUpperCase() 
                  }))}
                  placeholder="10 characters"
                  maxLength="10"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="form-section">
            <h2 className="section-title">Bank Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Account Holder Name</label>
                <input
                  type="text"
                  value={formData.bankDetails.accountName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountName: e.target.value }
                  }))}
                  placeholder="As per bank records"
                />
              </div>
              
              <div className="input-group">
                <label>Account Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, accountNumber: e.target.value }
                  }))}
                  placeholder="Bank account number"
                />
              </div>
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Bank Name</label>
                <input
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, bankName: e.target.value }
                  }))}
                  placeholder="Bank name"
                />
              </div>
              
              <div className="input-group">
                <label>Branch</label>
                <input
                  type="text"
                  value={formData.bankDetails.branch}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, branch: e.target.value }
                  }))}
                  placeholder="Branch name"
                />
              </div>
              
              <div className="input-group">
                <label>IFSC Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.bankDetails.ifscCode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    bankDetails: { ...prev.bankDetails, ifscCode: e.target.value.toUpperCase() }
                  }))}
                  placeholder="11 characters"
                  maxLength="11"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="form-section">
            <h2 className="section-title">Salary Details</h2>
            
            <div>
              <label style={{ marginBottom: '8px' }}>Salary Type *</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.salaryType === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    salaryType: 'Monthly',
                    salaryDetails: { ...prev.salaryDetails, dailyWages: '' }
                  }))}
                >
                  Monthly Salary
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.salaryType === 'Daily' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    salaryType: 'Daily',
                    salaryDetails: { ...prev.salaryDetails, monthlySalary: '' }
                  }))}
                >
                  Daily Wages
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  required
                />
              </div>
              
              {formData.salaryType === 'Monthly' ? (
                <div className="input-group">
                  <label>Monthly Salary (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salaryDetails.monthlySalary}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salaryDetails: { ...prev.salaryDetails, monthlySalary: e.target.value }
                    }))}
                    placeholder="Monthly salary amount (optional)"
                    min="0"
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label>Daily Wages (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salaryDetails.dailyWages}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salaryDetails: { ...prev.salaryDetails, dailyWages: e.target.value }
                    }))}
                    placeholder="Daily wages amount (optional)"
                    min="0"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Remarks / Notes</h2>
            
            <div className="input-group">
              <label>Additional Information</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special notes, skills, or other relevant information..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> {editingStaffId ? 'Update Staff' : 'Save Staff'}
            </button>
            {editingStaffId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => { resetForm(); setActiveTab('view'); }}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        )}

        {/* View Staff List */}
        {activeTab === 'view' && (
          <div className="form-section">
            <h2 className="section-title">Staff List</h2>
            
            {/* Search and Filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Search Staff</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name, code, designation, department..."
                    style={{ paddingLeft: '40px' }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b'
                      }}
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Active">Active</option>
                  <option value="On Leave">On Leave</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Resigned">Resigned</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>

            {/* Staff List */}
            {filteredStaff.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <Users size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <h3 style={{ marginBottom: '8px' }}>No Staff Found</h3>
                <p>Create your first staff member to get started.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '16px' }}>
                {filteredStaff.map(staffMember => {
                  const staffBranch = branches.find(b => b.id?.toString() === staffMember.branch?.toString());
                  const contactDetails = typeof staffMember.contactDetails === 'string' 
                    ? JSON.parse(staffMember.contactDetails || '{}') 
                    : (staffMember.contactDetails || {});
                  const salaryDetails = typeof staffMember.salaryDetails === 'string' 
                    ? JSON.parse(staffMember.salaryDetails || '{}') 
                    : (staffMember.salaryDetails || {});
                  
                  return (
                    <div key={staffMember.id} style={{
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      padding: '20px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#ec4899';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(236,72,153,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#e2e8f0';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>
                              {staffMember.staffName || 'Unnamed Staff'}
                            </h3>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 12px',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: staffMember.status === 'Active' ? '#d1fae5' : 
                                         staffMember.status === 'Suspended' ? '#fee2e2' :
                                         staffMember.status === 'On Leave' ? '#fef3c7' : '#e2e8f0',
                              color: staffMember.status === 'Active' ? '#065f46' :
                                    staffMember.status === 'Suspended' ? '#991b1b' :
                                    staffMember.status === 'On Leave' ? '#92400e' : '#475569'
                            }}>
                              {staffMember.status || 'Active'}
                            </span>
                          </div>
                          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                            Code: <span className="mono">{staffMember.staffCode || staffMember.code || 'N/A'}</span> | 
                            {staffMember.designation && ` ${staffMember.designation}`} | 
                            {staffMember.department && ` ${staffMember.department}`}
                            {staffBranch && ` | Branch: ${staffBranch.branchName || 'N/A'}`}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            className="btn btn-secondary"
                            onClick={() => handleEdit(staffMember)}
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          >
                            <Edit2 size={16} /> Edit
                          </button>
                          {staffMember.status === 'Active' ? (
                            <button
                              className="btn"
                              onClick={() => handleSuspend(staffMember.id)}
                              style={{ 
                                padding: '8px 16px', 
                                fontSize: '0.85rem',
                                background: '#f59e0b',
                                color: 'white'
                              }}
                            >
                              <Ban size={16} /> Suspend
                            </button>
                          ) : (
                            <button
                              className="btn btn-success"
                              onClick={() => handleActivate(staffMember.id)}
                              style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                            >
                              <CheckCircle size={16} /> Activate
                            </button>
                          )}
                          <button
                            className="btn btn-danger"
                            onClick={() => handleDelete(staffMember.id)}
                            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                          >
                            <Trash2 size={16} /> Delete
                          </button>
                        </div>
                      </div>
                      
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                        gap: '12px',
                        paddingTop: '12px',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        {contactDetails.mobile && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Mobile</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{contactDetails.mobile}</div>
                          </div>
                        )}
                        {contactDetails.email && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Email</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{contactDetails.email}</div>
                          </div>
                        )}
                        {staffMember.joiningDate && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Joining Date</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>{staffMember.joiningDate}</div>
                          </div>
                        )}
                        {(salaryDetails.monthlySalary || salaryDetails.dailyWages) && (
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Salary</div>
                            <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                              {salaryDetails.monthlySalary ? `₹${salaryDetails.monthlySalary}/month` : 
                               salaryDetails.dailyWages ? `₹${salaryDetails.dailyWages}/day` : 'Not set'}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
