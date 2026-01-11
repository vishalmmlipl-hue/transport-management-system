import React, { useState, useEffect } from 'react';
import { Save, User, Eye, EyeOff, Edit2, Trash2, Ban, CheckCircle, Search, Plus, X } from 'lucide-react';

export default function UserMasterForm() {
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'view'
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Load branches and staff from localStorage
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const storedStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    const activeBranches = storedBranches.filter(b => b.status === 'Active');
    setBranches(activeBranches);
    
    const activeStaff = storedStaff.filter(s => s.status === 'Active');
    setStaff(activeStaff);
    
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      // Try to load from server first
      const syncService = (await import('./utils/sync-service')).default;
      const result = await syncService.load('users');
      if (result.synced && result.data) {
        setUsers(result.data);
        // Update localStorage with server data
        localStorage.setItem('users', JSON.stringify(result.data));
      } else {
        // Fallback to localStorage
        const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
        setUsers(storedUsers);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      // Fallback to localStorage
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      setUsers(storedUsers);
    }
  };

  const [formData, setFormData] = useState({
    userCode: '',
    username: '',
    password: '',
    confirmPassword: '',
    userRole: 'Operator',
    linkedStaff: '',
    branch: '',
    accessPermissions: {
      clientMaster: false,
      cityMaster: false,
      vehicleMaster: false,
      driverMaster: false,
      staffMaster: false,
      branchMaster: false,
      marketVehicleVendor: false,
      otherVendor: false,
      operations: false,
      lrBooking: false,
      reports: false,
      settings: false
    },
    email: '',
    mobile: '',
    lastLogin: '',
    status: 'Active',
    remarks: ''
  });

  const userRoles = [
    'Super Admin',
    'Admin',
    'Branch Manager',
    'Accountant',
    'Operator',
    'Data Entry',
    'Viewer'
  ];

  const permissionGroups = [
    { key: 'clientMaster', label: 'Client Master' },
    { key: 'cityMaster', label: 'City Master' },
    { key: 'vehicleMaster', label: 'Vehicle Master' },
    { key: 'driverMaster', label: 'Driver Master' },
    { key: 'staffMaster', label: 'Staff Master' },
    { key: 'branchMaster', label: 'Branch Master' },
    { key: 'marketVehicleVendor', label: 'Market Vehicle Vendor' },
    { key: 'otherVendor', label: 'Other Vendor' },
    { key: 'operations', label: 'Operations' },
    { key: 'lrBooking', label: 'LR Booking' },
    { key: 'reports', label: 'Reports & Analytics' },
    { key: 'settings', label: 'System Settings' }
  ];

  const handlePermissionToggle = (permission) => {
    setFormData(prev => ({
      ...prev,
      accessPermissions: {
        ...prev.accessPermissions,
        [permission]: !prev.accessPermissions[permission]
      }
    }));
  };

  const handleSelectAllPermissions = () => {
    const allSelected = Object.values(formData.accessPermissions).every(val => val);
    const newPermissions = {};
    permissionGroups.forEach(perm => {
      newPermissions[perm.key] = !allSelected;
    });
    setFormData(prev => ({
      ...prev,
      accessPermissions: newPermissions
    }));
  };

  const handleRoleChange = (role) => {
    let defaultPermissions = {};
    
    // Set default permissions based on role
    switch(role) {
      case 'Super Admin':
        permissionGroups.forEach(perm => {
          defaultPermissions[perm.key] = true;
        });
        break;
      case 'Admin':
        permissionGroups.forEach(perm => {
          defaultPermissions[perm.key] = perm.key !== 'settings';
        });
        break;
      case 'Branch Manager':
        defaultPermissions = {
          clientMaster: true,
          cityMaster: false,
          vehicleMaster: false,
          driverMaster: true,
          staffMaster: true,
          branchMaster: false,
          marketVehicleVendor: false,
          otherVendor: false,
          operations: true,
          lrBooking: true,
          reports: true,
          settings: false
        };
        break;
      case 'Accountant':
        defaultPermissions = {
          clientMaster: true,
          cityMaster: false,
          vehicleMaster: false,
          driverMaster: false,
          staffMaster: false,
          branchMaster: false,
          marketVehicleVendor: true,
          otherVendor: true,
          operations: false,
          lrBooking: true,
          reports: true,
          settings: false
        };
        break;
      case 'Operator':
        defaultPermissions = {
          clientMaster: true,
          cityMaster: true,
          vehicleMaster: true,
          driverMaster: true,
          staffMaster: false,
          branchMaster: false,
          marketVehicleVendor: true,
          otherVendor: true,
          operations: true,
          lrBooking: true,
          reports: false,
          settings: false
        };
        break;
      case 'Data Entry':
        defaultPermissions = {
          clientMaster: true,
          cityMaster: true,
          vehicleMaster: true,
          driverMaster: true,
          staffMaster: false,
          branchMaster: false,
          marketVehicleVendor: true,
          otherVendor: true,
          operations: true,
          lrBooking: true,
          reports: false,
          settings: false
        };
        break;
      case 'Viewer':
        permissionGroups.forEach(perm => {
          defaultPermissions[perm.key] = false;
        });
        defaultPermissions.reports = true;
        break;
      default:
        permissionGroups.forEach(perm => {
          defaultPermissions[perm.key] = false;
        });
    }
    
    setFormData(prev => ({
      ...prev,
      userRole: role,
      accessPermissions: defaultPermissions
    }));
  };

  const resetForm = () => {
    setFormData({
      userCode: '',
      username: '',
      password: '',
      confirmPassword: '',
      userRole: 'Operator',
      linkedStaff: '',
      branch: '',
      accessPermissions: {
        clientMaster: false,
        cityMaster: false,
        vehicleMaster: false,
        driverMaster: false,
        staffMaster: false,
        branchMaster: false,
        marketVehicleVendor: false,
        otherVendor: false,
        operations: false,
        lrBooking: false,
        reports: false,
        settings: false
      },
      email: '',
      mobile: '',
      lastLogin: '',
      status: 'Active',
      remarks: ''
    });
    setEditingUserId(null);
    setShowPassword(false);
  };

  const handleEdit = (user) => {
    setEditingUserId(user.id);
    setFormData({
      userCode: user.code || '',
      username: user.username,
      password: '', // Don't show existing password
      confirmPassword: '',
      userRole: user.userRole,
      linkedStaff: user.linkedStaff || '',
      branch: user.branch || '',
      accessPermissions: user.accessPermissions || {},
      email: user.email || '',
      mobile: user.mobile || '',
      lastLogin: user.lastLogin || '',
      status: user.status || 'Active',
      remarks: user.remarks || ''
    });
    setActiveTab('create');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    if (window.confirm(`Are you sure you want to delete user "${user.username}"?\n\nThis action cannot be undone!`)) {
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      loadUsers();
      alert(`User "${user.username}" has been deleted successfully.`);
    }
  };

  const handleSuspend = (userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    const newStatus = user.status === 'Suspended' ? 'Active' : 'Suspended';
    const action = newStatus === 'Suspended' ? 'suspend' : 'activate';
    
    if (window.confirm(`Are you sure you want to ${action} user "${user.username}"?`)) {
      const updatedUsers = users.map(u => 
        u.id === userId ? { ...u, status: newStatus } : u
      );
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      loadUsers();
      alert(`User "${user.username}" has been ${action}d successfully.`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    if (editingUserId) {
      // Update existing user
      if (formData.password && formData.password.length > 0) {
        // Validate password match if password is being changed
        if (formData.password !== formData.confirmPassword) {
          alert('❌ Passwords do not match! Please check and try again.');
          return;
        }
        
        // Validate password strength
        if (formData.password.length < 6) {
          alert('❌ Password must be at least 6 characters long!');
          return;
        }
      }
      
      const updatedUsers = existingUsers.map(u => {
        if (u.id === editingUserId) {
          const updatedUser = {
            ...u,
            code: formData.userCode || u.code,
            username: formData.username,
            userRole: formData.userRole,
            linkedStaff: formData.linkedStaff,
            branch: formData.branch,
            accessPermissions: formData.accessPermissions,
            email: formData.email,
            mobile: formData.mobile,
            status: formData.status,
            remarks: formData.remarks,
            updatedAt: new Date().toISOString()
          };
          
          // Only update password if provided
          if (formData.password && formData.password.length > 0) {
            updatedUser.password = formData.password;
          }
          
          // Save to server
          (async () => {
            try {
              const syncService = (await import('./utils/sync-service')).default;
              const result = await syncService.save('users', updatedUser, true, editingUserId);
              if (result.synced) {
                console.log('✅ User updated on server');
              } else {
                console.warn('⚠️ User updated locally only (server unavailable)');
              }
            } catch (error) {
              console.error('Error updating user on server:', error);
            }
          })();
          
          return updatedUser;
        }
        return u;
      });
      
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      loadUsers();
      resetForm();
      alert(`User "${formData.username}" has been updated successfully!`);
      setActiveTab('view');
    } else {
      // Create new user
      // Validate password match
      if (formData.password !== formData.confirmPassword) {
        alert('❌ Passwords do not match! Please check and try again.');
        return;
      }
      
      // Validate password strength
      if (formData.password.length < 6) {
        alert('❌ Password must be at least 6 characters long!');
        return;
      }
      
      // Check for duplicate username
      if (existingUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase() && u.id !== editingUserId)) {
        alert('❌ Username already exists! Please choose a different username.');
        return;
      }
      
      const newUser = {
        id: Date.now(),
        code: formData.userCode || `USR${String(existingUsers.length + 1).padStart(3, '0')}`,
        username: formData.username,
        password: formData.password, // In production, this should be hashed
        userRole: formData.userRole,
        linkedStaff: formData.linkedStaff,
        branch: formData.branch,
        accessPermissions: formData.accessPermissions,
        email: formData.email,
        mobile: formData.mobile,
        lastLogin: '',
        status: formData.status,
        remarks: formData.remarks,
        createdAt: new Date().toISOString()
      };
      
      existingUsers.push(newUser);
      localStorage.setItem('users', JSON.stringify(existingUsers));
      
      // Save to server
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const result = await syncService.save('users', newUser);
        if (result.synced) {
          console.log('✅ User saved to server');
        } else {
          console.warn('⚠️ User saved locally only (server unavailable)');
        }
      } catch (error) {
        console.error('Error saving user to server:', error);
      }
      
      const selectedBranch = branches.find(b => b.id.toString() === formData.branch);
      const branchInfo = selectedBranch ? `\nBranch: ${selectedBranch.branchName}` : '';
      
      const permissionCount = Object.values(formData.accessPermissions).filter(p => p).length;
      
      alert(`User "${formData.username}" created successfully!\n\nUser Code: ${newUser.code}\nRole: ${formData.userRole}${branchInfo}\nPermissions: ${permissionCount}/${permissionGroups.length} modules\n\n⚠️ Note: Please save the login credentials securely!`);
      resetForm();
      setActiveTab('view');
      loadUsers();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50 to-slate-100 p-6">
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
          border-left: 4px solid #8b5cf6;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(139,92,246,0.1);
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
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
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
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139,92,246,0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #8b5cf6;
          border: 2px solid #8b5cf6;
          padding: 8px 16px;
          font-size: 0.85rem;
        }
        
        .btn-secondary:hover {
          background: #8b5cf6;
          color: white;
        }
        
        .password-input-wrapper {
          position: relative;
        }
        
        .password-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          color: #64748b;
        }
        
        .password-toggle:hover {
          color: #8b5cf6;
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
        
        .permissions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        
        .permission-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .permission-checkbox:hover {
          border-color: #8b5cf6;
          background: #f5f3ff;
        }
        
        .permission-checkbox.checked {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }
        
        .permission-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .permission-checkbox label {
          margin: 0;
          cursor: pointer;
          font-size: 0.9rem;
        }
        
        .role-badge {
          display: inline-block;
          padding: 6px 12px;
          background: #f5f3ff;
          color: #8b5cf6;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-top: 8px;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            User Master
          </h1>
          <p className="text-slate-600 text-lg">System User Management & Access Control</p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              resetForm();
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'create' ? '3px solid #8b5cf6' : '3px solid transparent',
              color: activeTab === 'create' ? '#8b5cf6' : '#64748b',
              fontWeight: activeTab === 'create' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            {editingUserId ? 'Edit User' : 'Create User'}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('view');
              loadUsers();
            }}
            style={{
              padding: '12px 24px',
              border: 'none',
              background: 'transparent',
              borderBottom: activeTab === 'view' ? '3px solid #8b5cf6' : '3px solid transparent',
              color: activeTab === 'view' ? '#8b5cf6' : '#64748b',
              fontWeight: activeTab === 'view' ? 600 : 500,
              cursor: 'pointer',
              fontSize: '1rem',
              transition: 'all 0.2s ease'
            }}
          >
            <User size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            View Users ({users.length})
          </button>
        </div>

        {/* View Users Tab */}
        {activeTab === 'view' && (
          <div className="form-section">
            <h2 className="section-title">Users List</h2>
            
            {/* Search and Filter */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label>Search Users</label>
                <div style={{ position: 'relative' }}>
                  <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by username, code, role, email..."
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
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>
            </div>

            {/* Users Table */}
            {users.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748b' }}>
                <User size={64} style={{ marginBottom: '16px', opacity: 0.3 }} />
                <h3 style={{ marginBottom: '8px' }}>No Users Found</h3>
                <p>Create your first user account to get started.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  background: 'white',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>User Code</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Username</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Role</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Branch</th>
                      <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Email</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'center', fontWeight: 600, color: '#475569', fontSize: '0.875rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => {
                        const matchesSearch = !searchTerm || 
                          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.code && user.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          user.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                        
                        const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                        
                        return matchesSearch && matchesStatus;
                      })
                      .map(user => {
                        const userBranch = branches.find(b => b.id.toString() === user.branch);
                        
                        return (
                          <tr key={user.id} style={{
                            borderBottom: '1px solid #e2e8f0',
                            transition: 'background 0.2s ease'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = '#f8fafc'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                          >
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem' }}>
                              <span className="mono" style={{ fontWeight: 600, color: '#1e293b' }}>
                                {user.code || 'N/A'}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#1e293b', fontWeight: 500 }}>
                              {user.username}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#64748b' }}>
                              {user.userRole}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#64748b' }}>
                              {userBranch ? `${userBranch.branchName}` : 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.9rem', color: '#64748b' }}>
                              {user.email || 'N/A'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '4px 12px',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: 500,
                                background: user.status === 'Active' ? '#10b98120' : 
                                          user.status === 'Suspended' ? '#f59e0b20' :
                                          user.status === 'Locked' ? '#ef444420' : '#64748b20',
                                color: user.status === 'Active' ? '#10b981' : 
                                      user.status === 'Suspended' ? '#f59e0b' :
                                      user.status === 'Locked' ? '#ef4444' : '#64748b'
                              }}>
                                {user.status}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                <button
                                  type="button"
                                  className="btn btn-secondary"
                                  onClick={() => handleEdit(user)}
                                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                                  title="Edit User"
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleSuspend(user.id)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.8rem',
                                    background: user.status === 'Suspended' ? '#10b981' : '#f59e0b',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title={user.status === 'Suspended' ? 'Activate User' : 'Suspend User'}
                                >
                                  {user.status === 'Suspended' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(user.id)}
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.8rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    transition: 'all 0.2s ease'
                                  }}
                                  title="Delete User"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
                
                {users.filter(user => {
                  const matchesSearch = !searchTerm || 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.code && user.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    user.userRole.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()));
                  
                  const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
                  
                  return matchesSearch && matchesStatus;
                }).length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <p>No users match your search criteria.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Create/Edit User Form */}
        {activeTab === 'create' && (
        <form onSubmit={handleSubmit}>
          {editingUserId && (
            <div style={{
              padding: '12px 16px',
              background: '#fef3c7',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #fbbf24',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <strong style={{ color: '#92400e' }}>⚠️ Editing User</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#92400e' }}>
                  You are editing an existing user. Leave password fields empty to keep the current password.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setActiveTab('view');
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#92400e',
                  padding: '4px'
                }}
                title="Cancel Edit"
              >
                <X size={20} />
              </button>
            </div>
          )}
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>User Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.userCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, userCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Username *</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Login username"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>User Role *</label>
                <select
                  value={formData.userRole}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  required
                >
                  {userRoles.map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
                <div className="role-badge">
                  Role: {formData.userRole}
                </div>
              </div>
            </div>
          </div>

          {/* Login Credentials */}
          <div className="form-section">
            <h2 className="section-title">Login Credentials</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Password {editingUserId ? '(Leave empty to keep current)' : '*'}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder={editingUserId ? "Leave empty to keep current password" : "Minimum 6 characters"}
                    minLength={editingUserId ? "0" : "6"}
                    required={!editingUserId}
                  />
                  <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>
              
              <div className="input-group">
                <label>Confirm Password {editingUserId ? '(Leave empty to keep current)' : '*'}</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder={editingUserId ? "Leave empty to keep current password" : "Re-enter password"}
                    minLength={editingUserId ? "0" : "6"}
                    required={!editingUserId}
                  />
                  <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>
            </div>
            
            {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
              <div style={{
                padding: '10px',
                background: '#fee2e2',
                borderRadius: '6px',
                color: '#991b1b',
                fontSize: '0.9rem',
                marginTop: '8px'
              }}>
                ❌ Passwords do not match!
              </div>
            )}
          </div>

          {/* User Assignment */}
          <div className="form-section">
            <h2 className="section-title">User Assignment</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Link to Staff</label>
                {staff.length === 0 ? (
                  <div style={{
                    padding: '10px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}>
                    ⚠️ No staff available. You can create user without linking.
                  </div>
                ) : (
                  <select
                    value={formData.linkedStaff}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkedStaff: e.target.value }))}
                  >
                    <option value="">-- Not Linked to Staff --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.staffName} - {s.designation} ({s.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="input-group">
                <label>Assigned Branch *</label>
                {branches.length === 0 ? (
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
                        {branch.branchName} - {branch.address.city}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h2 className="section-title">Contact Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="user@example.com"
                />
              </div>
              
              <div className="input-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                  placeholder="10 digits"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Access Permissions */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Access Permissions
              </h2>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={handleSelectAllPermissions}
              >
                {Object.values(formData.accessPermissions).every(val => val) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="permissions-grid">
              {permissionGroups.map(permission => (
                <div
                  key={permission.key}
                  className={`permission-checkbox ${formData.accessPermissions[permission.key] ? 'checked' : ''}`}
                  onClick={() => handlePermissionToggle(permission.key)}
                >
                  <input
                    type="checkbox"
                    checked={formData.accessPermissions[permission.key]}
                    onChange={() => handlePermissionToggle(permission.key)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label onClick={(e) => e.stopPropagation()}>
                    {permission.label}
                  </label>
                </div>
              ))}
            </div>
            
            <div style={{
              marginTop: '16px',
              padding: '12px',
              background: '#f5f3ff',
              borderRadius: '6px',
              fontSize: '0.9rem',
              color: '#6d28d9'
            }}>
              <strong>Permissions Summary:</strong> {Object.values(formData.accessPermissions).filter(p => p).length} out of {permissionGroups.length} modules accessible
            </div>
          </div>

          {/* Status & Remarks */}
          <div className="form-section">
            <h2 className="section-title">Status & Remarks</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>User Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Locked">Locked</option>
                </select>
              </div>
            </div>
            
            <div className="input-group">
              <label>Remarks / Notes</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special notes about this user..."
                rows="3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> {editingUserId ? 'Update User' : 'Create User Account'}
            </button>
            {editingUserId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setActiveTab('view');
                }}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
