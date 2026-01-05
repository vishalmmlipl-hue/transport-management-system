import React, { useState } from 'react';
import { LogIn, User, Lock, AlertCircle, Database } from 'lucide-react';
import initSampleData from './init-sample-data';

export default function LoginForm({ onLogin }) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Demo users with different roles
  const demoUsers = [
    { username: 'admin', password: 'admin123', role: 'Admin', name: 'Admin User' },
    { username: 'manager', password: 'manager123', role: 'Manager', name: 'Branch Manager' },
    { username: 'operator', password: 'operator123', role: 'Operator', name: 'LR Operator' },
    { username: 'accountant', password: 'accountant123', role: 'Accountant', name: 'Accountant' },
    { username: 'driver', password: 'driver123', role: 'Driver', name: 'Driver User' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      // Check credentials against demo users
      const user = demoUsers.find(u => 
        u.username === formData.username && u.password === formData.password
      );

      // Also check against users created in User Master
      const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const systemUser = systemUsers.find(u => 
        u.username === formData.username && u.password === formData.password && u.status === 'Active'
      );

      if (user || systemUser) {
        const authenticatedUser = user || {
          username: systemUser.username,
          role: systemUser.role,
          name: systemUser.name,
          branch: systemUser.branch || null // Include branch from system user
        };

        // Store session
        localStorage.setItem('currentUser', JSON.stringify(authenticatedUser));
        localStorage.setItem('isLoggedIn', 'true');
        
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
        
        .demo-credentials {
          margin-top: 32px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px dashed #cbd5e1;
        }
        
        .demo-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 12px;
        }
        
        .demo-user {
          background: white;
          padding: 10px 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          font-size: 0.8rem;
          display: flex;
          justify-content: space-between;
          border: 1px solid #e2e8f0;
        }
        
        .demo-user:last-child {
          margin-bottom: 0;
        }
        
        .demo-role {
          font-weight: 600;
          color: #667eea;
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

        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#fef3c7',
          border: '2px solid #fbbf24',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              if (window.confirm('⚠️ This will replace all existing data with sample data. Are you sure you want to continue?')) {
                // Clear existing data
                localStorage.clear();
                // Initialize sample data
                initSampleData();
                // Show success message
                alert('✅ Sample data loaded successfully!\n\nYou can now login with:\n- admin / admin123\n- manager / manager123\n- operator / operator123\n- accountant / accountant123\n- driver / driver123');
                // Reload the page
                window.location.reload();
              }
            }}
            style={{
              width: '100%',
              padding: '12px 20px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '0.95rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 4px 12px rgba(245,158,11,0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            <Database size={20} />
            Initialize Sample Data
          </button>
          <p style={{ 
            marginTop: '12px', 
            fontSize: '0.8rem', 
            color: '#78350f',
            marginBottom: 0
          }}>
            Click to load sample data for testing and demonstration
          </p>
        </div>

        <div className="demo-credentials">
          <div className="demo-title">🔐 Demo Credentials (Click to copy)</div>
          
          <div className="demo-user" onClick={() => {
            setFormData({ username: 'admin', password: 'admin123' });
          }} style={{ cursor: 'pointer' }}>
            <span><strong>admin</strong> / admin123</span>
            <span className="demo-role">Admin</span>
          </div>
          
          <div className="demo-user" onClick={() => {
            setFormData({ username: 'manager', password: 'manager123' });
          }} style={{ cursor: 'pointer' }}>
            <span><strong>manager</strong> / manager123</span>
            <span className="demo-role">Manager</span>
          </div>
          
          <div className="demo-user" onClick={() => {
            setFormData({ username: 'operator', password: 'operator123' });
          }} style={{ cursor: 'pointer' }}>
            <span><strong>operator</strong> / operator123</span>
            <span className="demo-role">Operator</span>
          </div>
          
          <div className="demo-user" onClick={() => {
            setFormData({ username: 'accountant', password: 'accountant123' });
          }} style={{ cursor: 'pointer' }}>
            <span><strong>accountant</strong> / accountant123</span>
            <span className="demo-role">Accountant</span>
          </div>
          
          <div className="demo-user" onClick={() => {
            setFormData({ username: 'driver', password: 'driver123' });
          }} style={{ cursor: 'pointer' }}>
            <span><strong>driver</strong> / driver123</span>
            <span className="demo-role">Driver</span>
          </div>
        </div>
      </div>
    </div>
  );
}
