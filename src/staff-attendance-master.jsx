import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, CheckCircle, XCircle, AlertCircle, Download, Filter, Search } from 'lucide-react';
import { apiService } from './utils/apiService';

export default function StaffAttendanceMaster() {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [staff, setStaff] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterBranch, setFilterBranch] = useState('');
  const [filterStaff, setFilterStaff] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    staffId: '',
    staffName: '',
    branchId: '',
    branchName: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'Present', // Present, Absent, HalfDay
    checkInTime: '',
    checkOutTime: '',
    location: {
      latitude: '',
      longitude: '',
      address: '',
      city: '',
      state: ''
    },
    remarks: '',
    isMobileApp: false,
    deviceInfo: {
      deviceId: '',
      platform: '',
      appVersion: ''
    }
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [staffResult, branchesResult, attendanceResult] = await Promise.all([
        apiService.getStaff().catch(() => ({ data: [] })),
        apiService.getBranches().catch(() => ({ data: [] })),
        apiService.getStaffAttendance ? apiService.getStaffAttendance().catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
      ]);

      const staffData = staffResult?.data || staffResult || [];
      const branchesData = branchesResult?.data || branchesResult || [];
      const attendanceData = attendanceResult?.data || attendanceResult || [];

      setStaff(staffData.filter(s => s.status === 'Active'));
      setBranches(branchesData.filter(b => b.status === 'Active' || !b.status));
      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill staff and branch when staff selected
  useEffect(() => {
    if (formData.staffId) {
      const selectedStaff = staff.find(s => s.id?.toString() === formData.staffId.toString());
      if (selectedStaff) {
        setFormData(prev => ({
          ...prev,
          staffName: selectedStaff.staffName || '',
          branchId: selectedStaff.branch || '',
          branchName: branches.find(b => b.id?.toString() === selectedStaff.branch?.toString())?.branchName || ''
        }));
      }
    }
  }, [formData.staffId, staff, branches]);

  // Set current time for check-in/check-out
  const setCurrentTime = (field) => {
    const now = new Date();
    const timeString = now.toTimeString().slice(0, 5);
    setFormData(prev => ({ ...prev, [field]: timeString }));
  };

  // Get current location (for web)
  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString()
            }
          }));
          // Reverse geocode to get address (simplified - in production use a geocoding service)
          setFormData(prev => ({
            ...prev,
            location: {
              ...prev.location,
              address: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`
            }
          }));
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Unable to get location. Please enter manually.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const attendanceData = {
        ...formData,
        location: JSON.stringify(formData.location),
        deviceInfo: JSON.stringify(formData.deviceInfo),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (formData.id) {
        // Update existing
        await apiService.updateStaffAttendance(formData.id, attendanceData);
      } else {
        // Create new
        await apiService.createStaffAttendance(attendanceData);
      }

      alert('✅ Attendance record saved successfully!');
      setShowForm(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('❌ Error saving attendance: ' + (error.message || 'Unknown error'));
    }
  };

  const resetForm = () => {
    setFormData({
      staffId: '',
      staffName: '',
      branchId: '',
      branchName: '',
      attendanceDate: new Date().toISOString().split('T')[0],
      status: 'Present',
      checkInTime: '',
      checkOutTime: '',
      location: {
        latitude: '',
        longitude: '',
        address: '',
        city: '',
        state: ''
      },
      remarks: '',
      isMobileApp: false,
      deviceInfo: {
        deviceId: '',
        platform: '',
        appVersion: ''
      }
    });
  };

  const handleEdit = (record) => {
    setFormData({
      ...record,
      location: typeof record.location === 'string' ? JSON.parse(record.location || '{}') : (record.location || {}),
      deviceInfo: typeof record.deviceInfo === 'string' ? JSON.parse(record.deviceInfo || '{}') : (record.deviceInfo || {})
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('⚠️ Are you sure you want to delete this attendance record?')) {
      try {
        await apiService.deleteStaffAttendance(id);
        loadData();
      } catch (error) {
        console.error('Error deleting attendance:', error);
        alert('❌ Error deleting attendance record');
      }
    }
  };

  // Filter records
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesBranch = !filterBranch || record.branchId?.toString() === filterBranch.toString();
    const matchesStaff = !filterStaff || record.staffId?.toString() === filterStaff.toString();
    const matchesDate = !selectedDate || record.attendanceDate === selectedDate;
    const matchesSearch = !searchTerm || 
      record.staffName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.branchName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.status?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesBranch && matchesStaff && matchesDate && matchesSearch;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Present':
        return <CheckCircle size={20} style={{ color: '#10b981' }} />;
      case 'Absent':
        return <XCircle size={20} style={{ color: '#ef4444' }} />;
      case 'HalfDay':
        return <AlertCircle size={20} style={{ color: '#f59e0b' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Present':
        return '#10b981';
      case 'Absent':
        return '#ef4444';
      case 'HalfDay':
        return '#f59e0b';
      default:
        return '#64748b';
    }
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
          background: white;
          color: #1e293b;
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
        
        .btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
        
        .attendance-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .attendance-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
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
            📅 Staff Attendance Master
          </h1>
          <p className="text-slate-600 text-lg">Track staff attendance with time and location</p>
        </div>

        {/* Filters */}
        <div className="form-section">
          <div className="grid-4">
            <div className="input-group">
              <label>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search staff, branch..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
            
            <div className="input-group">
              <label>Date</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label>Branch</label>
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
              >
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName || 'Unnamed Branch'}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="input-group">
              <label>Staff</label>
              <select
                value={filterStaff}
                onChange={(e) => setFilterStaff(e.target.value)}
              >
                <option value="">All Staff</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.staffName || s.code}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
            + Add Attendance
          </button>
        </div>

        {/* Attendance Form */}
        {showForm && (
          <div className="form-section">
            <h2 className="section-title">{formData.id ? 'Edit' : 'Add'} Attendance Record</h2>
            
            <form onSubmit={handleSubmit}>
              <div className="grid-3">
                <div className="input-group">
                  <label>Staff *</label>
                  <select
                    value={formData.staffId}
                    onChange={(e) => setFormData(prev => ({ ...prev, staffId: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Staff --</option>
                    {staff.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.staffName || s.code} {s.designation ? `- ${s.designation}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    value={formData.attendanceDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, attendanceDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    required
                  >
                    <option value="Present">Present</option>
                    <option value="Absent">Absent</option>
                    <option value="HalfDay">Half Day</option>
                  </select>
                </div>
              </div>

              {formData.status === 'Present' && (
                <div className="grid-2" style={{ marginTop: '16px' }}>
                  <div className="input-group">
                    <label>Check-In Time</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="time"
                        value={formData.checkInTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, checkInTime: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCurrentTime('checkInTime')}
                        style={{ padding: '10px 16px' }}
                      >
                        <Clock size={16} />
                        Now
                      </button>
                    </div>
                  </div>
                  
                  <div className="input-group">
                    <label>Check-Out Time</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="time"
                        value={formData.checkOutTime}
                        onChange={(e) => setFormData(prev => ({ ...prev, checkOutTime: e.target.value }))}
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setCurrentTime('checkOutTime')}
                        style={{ padding: '10px 16px' }}
                      >
                        <Clock size={16} />
                        Now
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div style={{ marginTop: '16px' }}>
                <div className="input-group">
                  <label>Location</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={getCurrentLocation}
                      style={{ padding: '10px 16px' }}
                    >
                      <MapPin size={16} />
                      Get Current Location
                    </button>
                  </div>
                  
                  <div className="grid-2">
                    <input
                      type="text"
                      placeholder="Latitude"
                      value={formData.location.latitude}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, latitude: e.target.value }
                      }))}
                    />
                    <input
                      type="text"
                      placeholder="Longitude"
                      value={formData.location.longitude}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        location: { ...prev.location, longitude: e.target.value }
                      }))}
                    />
                  </div>
                  
                  <input
                    type="text"
                    placeholder="Address"
                    value={formData.location.address}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      location: { ...prev.location, address: e.target.value }
                    }))}
                    style={{ marginTop: '8px' }}
                  />
                </div>
              </div>

              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Remarks</label>
                <textarea
                  value={formData.remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                  rows="3"
                  placeholder="Any additional notes..."
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={18} />
                  Save Attendance
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => { setShowForm(false); resetForm(); }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Attendance Records List */}
        <div className="form-section">
          <h2 className="section-title">
            Attendance Records ({filteredRecords.length})
          </h2>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              Loading attendance records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No attendance records found
            </div>
          ) : (
            filteredRecords.map(record => {
              const location = typeof record.location === 'string' 
                ? JSON.parse(record.location || '{}') 
                : (record.location || {});
              
              return (
                <div key={record.id} className="attendance-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e293b' }}>
                          {record.staffName || 'Unknown Staff'}
                        </h3>
                        <span 
                          className="status-badge"
                          style={{ 
                            background: getStatusColor(record.status) + '20',
                            color: getStatusColor(record.status)
                          }}
                        >
                          {getStatusIcon(record.status)}
                          {record.status}
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        {record.branchName || 'Unknown Branch'} | {record.attendanceDate}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => handleEdit(record)}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDelete(record.id)}
                        style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  {record.status === 'Present' && (
                    <div className="grid-2" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Check-In</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                          {record.checkInTime || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>Check-Out</div>
                        <div style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b' }}>
                          {record.checkOutTime || 'N/A'}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {location.address && (
                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                      <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '4px' }}>
                        <MapPin size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        Location
                      </div>
                      <div style={{ fontSize: '0.9rem', color: '#1e293b' }}>
                        {location.address}
                        {location.latitude && location.longitude && (
                          <span style={{ color: '#64748b', marginLeft: '8px' }}>
                            ({location.latitude}, {location.longitude})
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {record.remarks && (
                    <div style={{ marginTop: '12px', padding: '8px 12px', background: '#f8fafc', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#475569' }}>
                        <strong>Remarks:</strong> {record.remarks}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
