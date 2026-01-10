import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock, AlertCircle, Calendar } from 'lucide-react';

export default function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    financialYear: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Admin user with all access
  const adminUser = {
    username: 'admin',
    password: 'admin123',
    role: 'Admin',
    name: 'Admin User',
    accessPermissions: {
      clientMaster: true,
      cityMaster: true,
      vehicleMaster: true,
      driverMaster: true,
      staffMaster: true,
      branchMaster: true,
      marketVehicleVendor: true,
      otherVendor: true,
      operations: true,
      lrBooking: true,
      reports: true,
      settings: true
    }
  };

  // Generate financial year options (current year and next 2 years)
  const getFinancialYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 3; i++) {
      const year = currentYear + i;
      years.push({
        value: `${year}-${year + 1}`,
        label: `${year}-${year + 1}`
      });
    }
    return years;
  };

  // Set default financial year on mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const defaultFY = `${currentYear}-${currentYear + 1}`;
    setFormData(prev => ({ ...prev, financialYear: defaultFY }));
    
    // Also set in localStorage as default
    if (!localStorage.getItem('financialYear')) {
      localStorage.setItem('financialYear', defaultFY);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate financial year
    if (!formData.financialYear) {
      setError('Please select a Financial Year');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      // Check admin credentials first
      const isAdmin = formData.username === adminUser.username && formData.password === adminUser.password;
      
      // Check against users created in User Master
      const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const systemUser = systemUsers.find(u => 
        u.username === formData.username && u.password === formData.password && u.status === 'Active'
      );

      if (isAdmin || systemUser) {
        let authenticatedUser;
        
        if (isAdmin) {
          // Use admin user with all permissions
          authenticatedUser = {
            ...adminUser,
            branch: null // Admin can select branch after login
          };
        } else {
          // Use system user
          authenticatedUser = {
            username: systemUser.username,
            role: systemUser.userRole || systemUser.role, // Use userRole if available
            name: systemUser.username, // Use username as name if name not available
            branch: systemUser.branch || null,
            accessPermissions: systemUser.accessPermissions || {}, // Include access permissions
            code: systemUser.code || null,
            email: systemUser.email || null,
            mobile: systemUser.mobile || null,
            linkedStaff: systemUser.linkedStaff || null
          };
        }

        // Store session
        localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
        localStorage.setItem('isLoggedIn', 'true');
        
        // Store financial year
        localStorage.setItem('financialYear', formData.financialYear);
        
        onLogin(authenticatedUser);
      } else {
        setError('Invalid username or password');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .login-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.3);
          padding: 48px;
          max-width: 450px;
          width: 100%;
        }
        
        .login-header {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .login-logo {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
        }
        
        .login-title {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .login-subtitle {
          color: #64748b;
          font-size: 1rem;
        }
        
        .input-group {
          margin-bottom: 24px;
        }
        
        .input-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 8px;
        }
        
        .input-wrapper {
          position: relative;
        }
        
        .input-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .input-field {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        
        .input-field:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102,126,234,0.1);
        }
        
        .error-message {
          background: #fee2e2;
          border: 2px solid #fecaca;
          color: #991b1b;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.875rem;
        }
        
        .login-button {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        
        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102,126,234,0.4);
        }
        
        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
      `}</style>

      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <User size={40} />
          </div>
          <h1 className="login-title">Welcome Back</h1>
          <p className="login-subtitle">Transport Management System</p>
        </div>

        {error && (
          <div className="error-message">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label className="input-label">Username</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <User size={20} />
              </div>
              <input
                type="text"
                className="input-field"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter your username"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Lock size={20} />
              </div>
              <input
                type="password"
                className="input-field"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Financial Year *</label>
            <div className="input-wrapper">
              <div className="input-icon">
                <Calendar size={20} />
              </div>
              <select
                className="input-field"
                value={formData.financialYear}
                onChange={(e) => setFormData(prev => ({ ...prev, financialYear: e.target.value }))}
                required
                style={{ paddingLeft: '44px', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
              >
                <option value="">-- Select Financial Year --</option>
                {getFinancialYears().map(fy => (
                  <option key={fy.value} value={fy.value}>{fy.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="login-button"
            disabled={loading}
          >
            {loading ? (
              'Logging in...'
            ) : (
              <>
                <LogIn size={20} />
                Sign In
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
