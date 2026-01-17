import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Trash2 } from 'lucide-react';

export default function LRSeriesMaster() {
  const [lrSeries, setLrSeries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  useEffect(() => {
    setLrSeries(JSON.parse(localStorage.getItem('lrSeries') || '[]'));
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]'));
  }, []);

  const [formData, setFormData] = useState({
    seriesId: '',
    branchId: '',
    branchName: '',
    prefix: '',
    startNumber: '',
    endNumber: '',
    currentNumber: '',
    totalNumbers: '',
    usedNumbers: '0',
    remainingNumbers: '',
    status: 'Active',
    issuedDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });

  // Auto-generate Series ID
  useEffect(() => {
    const seriesId = `SER${String(lrSeries.length + 1).padStart(5, '0')}`;
    setFormData(prev => ({ ...prev, seriesId: seriesId }));
  }, [lrSeries.length]);

  // Auto-fill branch name when branch selected
  useEffect(() => {
    if (formData.branchId) {
      const branch = branches.find(b => b.id.toString() === formData.branchId);
      if (branch) {
        setFormData(prev => ({
          ...prev,
          branchName: branch.branchName,
          prefix: branch.branchCode || ''
        }));
      }
    }
  }, [formData.branchId, branches]);

  // Calculate totals when start/end numbers change
  useEffect(() => {
    if (formData.startNumber && formData.endNumber) {
      const start = parseInt(formData.startNumber);
      const end = parseInt(formData.endNumber);
      
      if (start && end && end > start) {
        const total = end - start + 1;
        const used = parseInt(formData.usedNumbers) || 0;
        const remaining = total - used;
        
        setFormData(prev => ({
          ...prev,
          totalNumbers: total.toString(),
          remainingNumbers: remaining.toString(),
          currentNumber: formData.currentNumber || start.toString()
        }));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.startNumber, formData.endNumber, formData.usedNumbers]);

  const validateSeries = () => {
    const start = parseInt(formData.startNumber);
    const end = parseInt(formData.endNumber);
    
    // Check if numbers are 10 digits
    if (start.toString().length !== 10 || end.toString().length !== 10) {
      alert('❌ LR numbers must be exactly 10 digits!');
      return false;
    }
    
    // Check if end > start
    if (end <= start) {
      alert('❌ End number must be greater than start number!');
      return false;
    }
    
    // Check for overlapping series in same branch
    const overlapping = lrSeries.find(series => 
      series.branchId === formData.branchId &&
      series.status === 'Active' &&
      (
        (start >= parseInt(series.startNumber) && start <= parseInt(series.endNumber)) ||
        (end >= parseInt(series.startNumber) && end <= parseInt(series.endNumber)) ||
        (start <= parseInt(series.startNumber) && end >= parseInt(series.endNumber))
      )
    );
    
    if (overlapping) {
      alert(`❌ Series overlaps with existing series:\n${overlapping.prefix ? overlapping.prefix + '-' : ''}${overlapping.startNumber} to ${overlapping.endNumber}`);
      return false;
    }
    
    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateSeries()) {
      return;
    }
    
    const existingSeries = JSON.parse(localStorage.getItem('lrSeries') || '[]');
    
    const newSeries = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    existingSeries.push(newSeries);
    localStorage.setItem('lrSeries', JSON.stringify(existingSeries));
    setLrSeries(existingSeries);

    // Show success message
    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Reset form but KEEP IT OPEN
    setFormData({
      seriesId: `SER${String(existingSeries.length + 1).padStart(5, '0')}`,
      branchId: '',
      branchName: '',
      prefix: '',
      startNumber: '',
      endNumber: '',
      currentNumber: '',
      totalNumbers: '',
      usedNumbers: '0',
      remainingNumbers: '',
      status: 'Active',
      issuedDate: new Date().toISOString().split('T')[0],
      remarks: ''
    });

    // Focus on branch selection
    setTimeout(() => {
      document.querySelector('select[name="branchId"]')?.focus();
    }, 100);
  };

  const deleteSeries = (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this LR series?\n\nThis action cannot be undone!')) {
      const updated = lrSeries.filter(s => s.id !== id);
      localStorage.setItem('lrSeries', JSON.stringify(updated));
      setLrSeries(updated);
    }
  };

  const deactivateSeries = (id) => {
    if (window.confirm('Deactivate this LR series? No more LRs can be issued from this series.')) {
      const updated = lrSeries.map(s => 
        s.id === id ? { ...s, status: 'Inactive' } : s
      );
      localStorage.setItem('lrSeries', JSON.stringify(updated));
      setLrSeries(updated);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
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
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
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
        
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        
        .btn-warning {
          background: #f59e0b;
          color: white;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
        
        .series-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .series-card:hover {
          border-color: #8b5cf6;
          box-shadow: 0 4px 12px rgba(139,92,246,0.1);
        }
        
        .series-preview {
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
          padding: 20px;
          border-radius: 12px;
          border: 2px solid #e9d5ff;
          margin-top: 16px;
        }
        
        .stat-box {
          background: white;
          padding: 16px;
          border-radius: 8px;
          text-align: center;
          border: 2px solid #e2e8f0;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #8b5cf6;
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 4px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-active {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-inactive {
          background: #fee2e2;
          color: #991b1b;
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
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🔢 LR Series Master
          </h1>
          <p className="text-slate-600 text-lg">Issue 10-digit LR number series to branches</p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ LR Series Created Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Ready for next series...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="form-section">
            <h2 className="section-title">Series Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Series ID</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.seriesId}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Select Branch *</label>
                <select
                  name="branchId"
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  required
                  autoFocus
                >
                  <option value="">-- Select Branch --</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Issue Date *</label>
                <input
                  type="date"
                  value={formData.issuedDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, issuedDate: e.target.value }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Number Range */}
          <div className="form-section">
            <h2 className="section-title">10-Digit LR Number Range</h2>
            
            <div style={{ 
              background: '#fef3c7',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #fde68a',
              color: '#92400e',
              fontSize: '0.9rem'
            }}>
              <strong>📌 Important:</strong> LR numbers must be exactly 10 digits. Example: 1000000001 to 1000099999
            </div>
            
            <div className="grid-4">
              <div className="input-group">
                <label>Prefix (Optional)</label>
                <input
                  type="text"
                  value={formData.prefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, prefix: e.target.value.toUpperCase() }))}
                  placeholder="MUM, DEL, etc."
                  maxLength="5"
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Branch code prefix
                </small>
              </div>
              
              <div className="input-group">
                <label>Start Number (10 digits) *</label>
                <input
                  type="number"
                  className="mono"
                  value={formData.startNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, startNumber: e.target.value }))}
                  placeholder="1000000001"
                  required
                  style={{ fontSize: '1.1rem' }}
                />
              </div>
              
              <div className="input-group">
                <label>End Number (10 digits) *</label>
                <input
                  type="number"
                  className="mono"
                  value={formData.endNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, endNumber: e.target.value }))}
                  placeholder="1000099999"
                  required
                  style={{ fontSize: '1.1rem' }}
                />
              </div>
              
              <div className="input-group">
                <label>Current Number</label>
                <input
                  type="number"
                  className="mono"
                  value={formData.currentNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, currentNumber: e.target.value }))}
                  placeholder="Auto-set to start"
                  style={{ fontSize: '1.1rem', background: '#f8fafc' }}
                />
              </div>
            </div>
          </div>

          {/* Series Preview */}
          {formData.startNumber && formData.endNumber && formData.totalNumbers && (
            <div className="series-preview">
              <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '16px', color: '#6b21a8' }}>
                📊 Series Summary
              </h3>
              
              <div className="grid-4" style={{ marginBottom: '16px' }}>
                <div className="stat-box">
                  <div className="stat-value">{formData.totalNumbers}</div>
                  <div className="stat-label">Total Numbers</div>
                </div>
                
                <div className="stat-box">
                  <div className="stat-value">{formData.usedNumbers}</div>
                  <div className="stat-label">Used</div>
                </div>
                
                <div className="stat-box">
                  <div className="stat-value">{formData.remainingNumbers}</div>
                  <div className="stat-label">Remaining</div>
                </div>
                
                <div className="stat-box">
                  <div className="stat-value" style={{ fontSize: '1.2rem' }}>
                    {formData.currentNumber}
                  </div>
                  <div className="stat-label">Next LR</div>
                </div>
              </div>
              
              <div style={{ 
                background: 'white',
                padding: '16px',
                borderRadius: '8px',
                border: '2px solid #e9d5ff'
              }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>
                  LR Number Format:
                </div>
                <div className="mono" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                  {formData.prefix && `${formData.prefix}-`}{formData.startNumber} to {formData.prefix && `${formData.prefix}-`}{formData.endNumber}
                </div>
              </div>
            </div>
          )}

          {/* Status & Remarks */}
          <div className="form-section">
            <h2 className="section-title">Additional Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Remarks</label>
                <input
                  type="text"
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Any notes about this series..."
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} />
              Issue LR Series (Continue Adding)
            </button>
          </div>
        </form>

        {/* Series List */}
        {lrSeries.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Issued LR Series ({lrSeries.length})</h2>
            
            {lrSeries.slice().reverse().map(series => {
              const usagePercent = ((parseInt(series.usedNumbers) / parseInt(series.totalNumbers)) * 100).toFixed(1);
              
              return (
                <div key={series.id} className="series-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h3 className="mono" style={{ fontSize: '1.3rem', color: '#8b5cf6' }}>
                          {series.prefix && `${series.prefix}-`}{series.startNumber} to {series.prefix && `${series.prefix}-`}{series.endNumber}
                        </h3>
                        <span className={`status-badge status-${series.status.toLowerCase()}`}>
                          {series.status}
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {series.branchName} | Series ID: {series.seriesId} | Issued: {series.issuedDate}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {series.status === 'Active' && (
                        <button className="btn btn-warning" onClick={() => deactivateSeries(series.id)}>
                          Deactivate
                        </button>
                      )}
                      <button className="btn btn-danger" onClick={() => deleteSeries(series.id)}>
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid-4" style={{ marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Total Numbers</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>{series.totalNumbers}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Used</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f59e0b' }}>{series.usedNumbers}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Remaining</div>
                      <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#10b981' }}>{series.remainingNumbers}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Next LR</div>
                      <div className="mono" style={{ fontSize: '1.1rem', fontWeight: '700', color: '#8b5cf6' }}>
                        {series.prefix && `${series.prefix}-`}{series.currentNumber}
                      </div>
                    </div>
                  </div>
                  
                  {/* Usage Progress Bar */}
                  <div style={{ 
                    background: '#e2e8f0',
                    height: '8px',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    marginTop: '12px'
                  }}>
                    <div style={{ 
                      background: usagePercent > 80 ? '#ef4444' : usagePercent > 50 ? '#f59e0b' : '#10b981',
                      height: '100%',
                      width: `${usagePercent}%`,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px', textAlign: 'right' }}>
                    {usagePercent}% used
                  </div>
                  
                  {series.remarks && (
                    <div style={{ 
                      marginTop: '12px',
                      padding: '8px 12px',
                      background: '#f8fafc',
                      borderRadius: '6px',
                      fontSize: '0.85rem',
                      color: '#475569'
                    }}>
                      <strong>Remarks:</strong> {series.remarks}
                    </div>
                  )}
                  
                  {parseFloat(usagePercent) > 90 && series.status === 'Active' && (
                    <div style={{ 
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fef3c7',
                      borderRadius: '8px',
                      border: '2px solid #fde68a',
                      color: '#92400e',
                      fontSize: '0.9rem'
                    }}>
                      <strong>⚠️ Warning:</strong> Series is {usagePercent}% used. Consider issuing a new series!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
