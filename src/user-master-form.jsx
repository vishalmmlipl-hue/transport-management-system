import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';

export default function UserMasterForm() {
  const [branches, setBranches] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  
  // Load branches and staff from localStorage
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const storedStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    const activeBranches = storedBranches.filter(b => b.status === 'Active');
    setBranches(activeBranches);
    
    const activeStaff = storedStaff.filter(s => s.status === 'Active');
    setStaff(activeStaff);
  }, []);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    
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
    
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    
    // Check for duplicate username
    if (existingUsers.some(u => u.username.toLowerCase() === formData.username.toLowerCase())) {
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
    
    const selectedBranch = branches.find(b => b.id.toString() === formData.branch);
    const branchInfo = selectedBranch ? `\nBranch: ${selectedBranch.branchName}` : '';
    
    const permissionCount = Object.values(formData.accessPermissions).filter(p => p).length;
    
    alert(`User "${formData.username}" created successfully!\n\nUser Code: ${newUser.code}\nRole: ${formData.userRole}${branchInfo}\nPermissions: ${permissionCount}/${permissionGroups.length} modules\n\n⚠️ Note: Please save the login credentials securely!`);
    window.location.reload();
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

        <form onSubmit={handleSubmit}>
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
                <label>Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Minimum 6 characters"
                    minLength="6"
                    required
                  />
                  <div className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </div>
                </div>
              </div>
              
              <div className="input-group">
                <label>Confirm Password *</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Re-enter password"
                    minLength="6"
                    required
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
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Create User Account
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
