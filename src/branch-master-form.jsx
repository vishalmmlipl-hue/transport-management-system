import React, { useState, useEffect } from 'react';
import { Save, Building2, MapPin, Phone, Mail, Plus, Trash2, X, Edit2 } from 'lucide-react';
import { useBranches, useCities } from './hooks/useDataSync';

export default function BranchMasterForm() {
  // Use hooks for branches - this prevents localStorage conflicts
  const { data: allBranches, loading: branchesLoading, create: createBranch, update: updateBranch, remove: removeBranch, loadData: loadBranches } = useBranches();
  
  // Filter active branches
  const branches = (allBranches || []).filter(b => 
    b.status === 'Active' || !b.status || b.status === undefined
  );
  
  // Use hooks for cities - ensures data from Render.com
  const { data: cities, loading: citiesLoading } = useCities();
  
  const [selectedCity, setSelectedCity] = useState(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editingBranchId, setEditingBranchId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    gstNumber: '',
    isHeadOffice: false,
    managerName: '',
    managerMobile: '',
    lrSeriesStart: '',
    lrSeriesEnd: '',
    lrSeriesCurrent: '',
    lrPrefix: '',
    status: 'Active',
    nearbyCities: [], // Array of city IDs
    odaLocations: [] // Array of city IDs for ODA locations
  });
  
  const [selectedNearbyCity, setSelectedNearbyCity] = useState('');
  const [selectedODALocation, setSelectedODALocation] = useState('');

  useEffect(() => {
    // Clear localStorage to prevent conflicts
    localStorage.removeItem('branches');
    localStorage.removeItem('cities');
  }, [allBranches]);

  // Sync selectedCity when formData.city changes (for edit mode or external updates)
  useEffect(() => {
    if (formData.city && cities.length > 0) {
      const city = cities.find(c => c.cityName === formData.city);
      if (city) {
        setSelectedCity(city);
      }
    } else if (!formData.city && selectedCity) {
      setSelectedCity(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.city, cities]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      
      if (editingBranchId) {
        // Update existing branch
        const branchToUpdate = allBranches.find(b => b.id === editingBranchId);
        if (branchToUpdate) {
          const updatedBranch = {
            ...formData,
            updatedAt: new Date().toISOString()
          };
          
          const updated = await updateBranch(editingBranchId, updatedBranch);
          console.log('✅ Branch updated on Render.com:', updated);
          
          // Clear localStorage to prevent conflicts
          localStorage.removeItem('branches');
          
          // Reload branches from server
          await loadBranches();
          
          alert(`✅ Branch "${formData.branchName}" updated successfully on Render.com server!`);
          resetForm();
        }
      } else {
        // Create new branch
        const newBranch = {
          ...formData,
          createdAt: new Date().toISOString()
        };

        const savedBranch = await createBranch(newBranch);
        console.log('✅ Branch saved to Render.com:', savedBranch);
        
        // Clear localStorage to prevent conflicts
        localStorage.removeItem('branches');
        
        // Reload branches from server to ensure fresh data
        await loadBranches();
        
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        // Reset form but KEEP IT OPEN for next entry
        resetForm(true);

        // Focus on first field for quick next entry
        setTimeout(() => {
          document.querySelector('input[name="branchName"]')?.focus();
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error saving branch:', error);
      alert('❌ Error saving branch: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = (keepOpen = false) => {
    setFormData({
      branchName: '',
      branchCode: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      phone: '',
      email: '',
      gstNumber: '',
      isHeadOffice: false,
      managerName: '',
      managerMobile: '',
      lrSeriesStart: '',
      lrSeriesEnd: '',
      lrSeriesCurrent: '',
      lrPrefix: '',
      status: 'Active',
      nearbyCities: [],
      odaLocations: []
    });
    setSelectedCity(null);
    setSelectedNearbyCity('');
    setSelectedODALocation('');
    setEditingBranchId(null);
    
    if (!keepOpen) {
      // Scroll to top when editing is done
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleEdit = (branch) => {
    setEditingBranchId(branch.id);
    
    // Find the city object
    const branchCity = cities.find(c => 
      c.cityName === branch.city || 
      c.id.toString() === branch.city?.toString()
    );
    
    setFormData({
      branchName: branch.branchName || '',
      branchCode: branch.branchCode || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      pincode: branch.pincode || '',
      phone: branch.phone || '',
      email: branch.email || '',
      gstNumber: branch.gstNumber || '',
      isHeadOffice: branch.isHeadOffice || false,
      managerName: branch.managerName || '',
      managerMobile: branch.managerMobile || '',
      lrSeriesStart: branch.lrSeriesStart || '',
      lrSeriesEnd: branch.lrSeriesEnd || '',
      lrSeriesCurrent: branch.lrSeriesCurrent || '',
      lrPrefix: branch.lrPrefix || '',
      status: branch.status || 'Active',
      nearbyCities: branch.nearbyCities || [],
      odaLocations: branch.odaLocations || []
    });
    
    setSelectedCity(branchCity || null);
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteBranch = async (id) => {
    if (window.confirm('Are you sure you want to delete this branch? This will remove it from all systems.')) {
      try {
        await removeBranch(id);
        
        // Clear localStorage to prevent conflicts
        localStorage.removeItem('branches');
        
        alert('✅ Branch deleted successfully from Render.com server!');
      } catch (error) {
        console.error('❌ Error deleting branch:', error);
        alert('❌ Error deleting branch: ' + error.message);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-6">
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
          border-left: 4px solid #f59e0b;
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
          border-color: #f59e0b;
          box-shadow: 0 0 0 3px rgba(245,158,11,0.1);
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
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
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
        
        .checkbox-wrapper {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 2px solid #e2e8f0;
        }
        
        .checkbox-wrapper input[type="checkbox"] {
          width: auto;
        }
        
        .branch-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .branch-card:hover {
          border-color: #f59e0b;
          box-shadow: 0 4px 12px rgba(245,158,11,0.1);
        }
        
        .lr-series-box {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          padding: 16px;
          border-radius: 8px;
          border: 2px solid #f59e0b;
          margin-top: 12px;
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
        {branchesLoading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading branches from Render.com...
          </div>
        )}
        
        {!branchesLoading && (
          <>
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            🏢 Branch Master {editingBranchId && <span style={{ fontSize: '1.5rem', color: '#3b82f6' }}>(Editing)</span>}
          </h1>
          <p className="text-slate-600 text-lg">
            {editingBranchId ? 'Update branch details, nearby cities, and ODA locations' : 'Manage branch network with LR series allocation'}
          </p>
        </div>

        {/* Success Message */}
        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ Branch Added Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Ready for next entry...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Basic Details */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Branch Name *</label>
                <input
                  type="text"
                  name="branchName"
                  value={formData.branchName}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchName: e.target.value }))}
                  placeholder="Mumbai Branch"
                  required
                  autoFocus
                />
              </div>
              
              <div className="input-group">
                <label>Branch Code *</label>
                <input
                  type="text"
                  value={formData.branchCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchCode: e.target.value.toUpperCase() }))}
                  placeholder="MUM001"
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
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
            </div>
            
            <div className="checkbox-wrapper">
              <input
                type="checkbox"
                checked={formData.isHeadOffice}
                onChange={(e) => setFormData(prev => ({ ...prev, isHeadOffice: e.target.checked }))}
              />
              <label style={{ marginBottom: 0 }}>Mark as Head Office</label>
            </div>
          </div>

          {/* Address Details */}
          <div className="form-section">
            <h2 className="section-title">Address Details</h2>
            
            <div className="input-group">
              <label>Full Address *</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Complete address with landmark"
                rows="2"
                required
              />
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>City *</label>
                {cities.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No cities available. Please add cities in City Master first.
                  </div>
                ) : (
                  <>
                    <select
                      value={selectedCity ? selectedCity.id.toString() : formData.city ? cities.find(c => c.cityName === formData.city)?.id?.toString() || '' : ''}
                      onChange={(e) => {
                        const cityId = e.target.value;
                        const city = cities.find(c => c.id.toString() === cityId);
                        setSelectedCity(city);
                        setFormData(prev => ({ 
                          ...prev, 
                          city: city ? city.cityName : '',
                          state: city ? city.state : prev.state
                        }));
                      }}
                      required
                    >
                      <option value="">-- Select City --</option>
                      {cities.map(city => (
                        <option key={city.id} value={city.id}>
                          {city.cityName}, {city.state} {city.code ? `(${city.code})` : ''}
                        </option>
                      ))}
                    </select>
                    {selectedCity && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        {selectedCity.zone && <span>{selectedCity.zone} Zone • </span>}
                        {selectedCity.state}
                        {selectedCity.isODA && <span style={{ color: '#f59e0b', fontWeight: 600 }}> • ODA</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="input-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                  placeholder="Maharashtra"
                  required
                  readOnly={selectedCity ? true : false}
                  style={selectedCity ? { background: '#f1f5f9', cursor: 'not-allowed' } : {}}
                />
                {selectedCity && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                    Auto-filled from City Master
                  </small>
                )}
              </div>
              
              <div className="input-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  value={formData.pincode}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                  placeholder="400001"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h2 className="section-title">Contact Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Phone Number *</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="022-12345678"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="mumbai@company.com"
                />
              </div>
              
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
            </div>
          </div>

          {/* Manager Details */}
          <div className="form-section">
            <h2 className="section-title">Branch Manager</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Manager Name</label>
                <input
                  type="text"
                  value={formData.managerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, managerName: e.target.value }))}
                  placeholder="Manager Full Name"
                />
              </div>
              
              <div className="input-group">
                <label>Manager Mobile</label>
                <input
                  type="tel"
                  value={formData.managerMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, managerMobile: e.target.value }))}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          {/* Service Coverage */}
          <div className="form-section">
            <h2 className="section-title">Service Coverage</h2>
            
            {/* Nearby Cities */}
            <div className="input-group" style={{ marginBottom: '24px' }}>
              <label>Nearby Cities</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={selectedNearbyCity}
                  onChange={(e) => setSelectedNearbyCity(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select City to Add --</option>
                  {cities
                    .filter(city => 
                      city.status === 'Active' && 
                      !formData.nearbyCities.includes(city.id.toString()) &&
                      city.id.toString() !== (selectedCity?.id?.toString() || '')
                    )
                    .map(city => (
                      <option key={city.id} value={city.id}>
                        {city.cityName}, {city.state} {city.code ? `(${city.code})` : ''}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (selectedNearbyCity && !formData.nearbyCities.includes(selectedNearbyCity)) {
                      setFormData(prev => ({
                        ...prev,
                        nearbyCities: [...prev.nearbyCities, selectedNearbyCity]
                      }));
                      setSelectedNearbyCity('');
                    }
                  }}
                  disabled={!selectedNearbyCity}
                  style={{ padding: '10px 20px' }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              {formData.nearbyCities.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  minHeight: '50px'
                }}>
                  {formData.nearbyCities.map(cityId => {
                    const city = cities.find(c => c.id.toString() === cityId.toString());
                    if (!city) return null;
                    return (
                      <div
                        key={cityId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'white',
                          border: '2px solid #3b82f6',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          color: '#1e293b'
                        }}
                      >
                        <span>{city.cityName}, {city.state}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              nearbyCities: prev.nearbyCities.filter(id => id !== cityId)
                            }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ef4444'
                          }}
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {formData.nearbyCities.length === 0 && (
                <div style={{
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '2px dashed #cbd5e1',
                  textAlign: 'center',
                  color: '#64748b',
                  fontSize: '0.9rem'
                }}>
                  No nearby cities added. Select a city and click "Add" to include it.
                </div>
              )}
            </div>

            {/* ODA Locations */}
            <div className="input-group">
              <label>ODA Locations</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={selectedODALocation}
                  onChange={(e) => setSelectedODALocation(e.target.value)}
                  style={{ flex: 1 }}
                >
                  <option value="">-- Select ODA Location to Add --</option>
                  {cities
                    .filter(city => 
                      city.status === 'Active' && 
                      !formData.odaLocations.includes(city.id.toString()) &&
                      city.id.toString() !== (selectedCity?.id?.toString() || '')
                    )
                    .map(city => (
                      <option key={city.id} value={city.id}>
                        {city.cityName}, {city.state} {city.code ? `(${city.code})` : ''}
                        {city.isODA && <span> - ODA</span>}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    if (selectedODALocation && !formData.odaLocations.includes(selectedODALocation)) {
                      setFormData(prev => ({
                        ...prev,
                        odaLocations: [...prev.odaLocations, selectedODALocation]
                      }));
                      setSelectedODALocation('');
                    }
                  }}
                  disabled={!selectedODALocation}
                  style={{ padding: '10px 20px' }}
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
              
              {formData.odaLocations.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px solid #fbbf24',
                  minHeight: '50px'
                }}>
                  {formData.odaLocations.map(cityId => {
                    const city = cities.find(c => c.id.toString() === cityId.toString());
                    if (!city) return null;
                    return (
                      <div
                        key={cityId}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 12px',
                          background: 'white',
                          border: '2px solid #f59e0b',
                          borderRadius: '20px',
                          fontSize: '0.85rem',
                          color: '#1e293b'
                        }}
                      >
                        <span>{city.cityName}, {city.state}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              odaLocations: prev.odaLocations.filter(id => id !== cityId)
                            }));
                          }}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0',
                            display: 'flex',
                            alignItems: 'center',
                            color: '#ef4444'
                          }}
                          title="Remove"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
              {formData.odaLocations.length === 0 && (
                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px dashed #fbbf24',
                  textAlign: 'center',
                  color: '#92400e',
                  fontSize: '0.9rem'
                }}>
                  No ODA locations added. Select a city and click "Add" to include it.
                </div>
              )}
            </div>
          </div>

          {/* LR Series Allocation (ADMIN FEATURE) */}
          <div className="form-section" style={{ borderLeftColor: '#dc2626' }}>
            <h2 className="section-title">🔐 LR Series Allocation (Admin Only)</h2>
            
            <div style={{ 
              background: '#fee2e2',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              <strong>⚠️ Important:</strong> Assign unique LR number series to this branch. Each branch should have non-overlapping ranges.
            </div>
            
            <div className="grid-4">
              <div className="input-group">
                <label>LR Prefix</label>
                <input
                  type="text"
                  value={formData.lrPrefix}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrPrefix: e.target.value.toUpperCase() }))}
                  placeholder="MUM (optional)"
                  maxLength="5"
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Example: MUM, DEL, BLR
                </small>
              </div>
              
              <div className="input-group">
                <label>Series Start Number *</label>
                <input
                  type="number"
                  value={formData.lrSeriesStart}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrSeriesStart: e.target.value }))}
                  placeholder="1000000001"
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Starting LR number
                </small>
              </div>
              
              <div className="input-group">
                <label>Series End Number *</label>
                <input
                  type="number"
                  value={formData.lrSeriesEnd}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrSeriesEnd: e.target.value }))}
                  placeholder="1000099999"
                  required
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Last LR number
                </small>
              </div>
              
              <div className="input-group">
                <label>Current Number</label>
                <input
                  type="number"
                  value={formData.lrSeriesCurrent}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrSeriesCurrent: e.target.value }))}
                  placeholder="1000000001"
                />
                <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                  Next LR to be issued
                </small>
              </div>
            </div>
            
            {formData.lrSeriesStart && formData.lrSeriesEnd && (
              <div className="lr-series-box">
                <h3 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '12px', color: '#92400e' }}>
                  📋 LR Series Summary
                </h3>
                <div className="grid-3" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <strong>Range:</strong><br/>
                    {formData.lrPrefix && `${formData.lrPrefix}-`}{formData.lrSeriesStart} to {formData.lrPrefix && `${formData.lrPrefix}-`}{formData.lrSeriesEnd}
                  </div>
                  <div>
                    <strong>Total Numbers:</strong><br/>
                    {parseInt(formData.lrSeriesEnd) - parseInt(formData.lrSeriesStart) + 1} LRs
                  </div>
                  <div>
                    <strong>Next LR:</strong><br/>
                    {formData.lrPrefix && `${formData.lrPrefix}-`}{formData.lrSeriesCurrent || formData.lrSeriesStart}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            {editingBranchId ? (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ fontSize: '1.1rem', padding: '14px 40px' }}
                  disabled={saving || branchesLoading}
                >
                  <Save size={20} />
                  {saving ? 'Updating...' : 'Update Branch'}
                </button>
                <button 
                  type="button" 
                  className="btn" 
                  onClick={resetForm}
                  style={{ 
                    fontSize: '1.1rem', 
                    padding: '14px 40px',
                    background: '#64748b',
                    color: 'white'
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
                disabled={saving || branchesLoading}
              >
                <Save size={20} />
                {saving ? 'Saving...' : 'Add Branch (Continue Adding)'}
              </button>
            )}
          </div>
        </form>

        {/* Branch List */}
        {branches.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Branch List ({branches.length})</h2>
            
            {branches.map(branch => (
              <div key={branch.id} className="branch-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', marginBottom: '4px', color: '#f59e0b' }}>
                      {branch.branchName}
                      {branch.isHeadOffice && (
                        <span style={{ 
                          marginLeft: '12px',
                          fontSize: '0.75rem',
                          background: '#dc2626',
                          color: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }}>
                          HEAD OFFICE
                        </span>
                      )}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      Code: {branch.branchCode} | {branch.status}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      className="btn" 
                      onClick={() => handleEdit(branch)}
                      style={{ background: '#3b82f6', color: 'white' }}
                    >
                      <Edit2 size={16} />
                      Edit
                    </button>
                    <button className="btn btn-danger" onClick={() => deleteBranch(branch.id)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                  <div>
                    <strong>Location:</strong><br/>
                    {branch.city}, {branch.state}
                  </div>
                  <div>
                    <strong>Phone:</strong><br/>
                    {branch.phone}
                  </div>
                  <div>
                    <strong>Manager:</strong><br/>
                    {branch.managerName || 'Not assigned'}
                  </div>
                </div>
                
                {/* Nearby Cities */}
                {(branch.nearbyCities && branch.nearbyCities.length > 0) && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#1e293b' }}>
                      📍 Nearby Cities:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {branch.nearbyCities.map(cityId => {
                        const city = cities.find(c => c.id.toString() === cityId.toString());
                        if (!city) return null;
                        return (
                          <span
                            key={cityId}
                            style={{
                              padding: '4px 10px',
                              background: 'white',
                              border: '1px solid #3b82f6',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              color: '#1e293b'
                            }}
                          >
                            {city.cityName}, {city.state}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ODA Locations */}
                {(branch.odaLocations && branch.odaLocations.length > 0) && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24'
                  }}>
                    <strong style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', color: '#92400e' }}>
                      🚚 ODA Locations:
                    </strong>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {branch.odaLocations.map(cityId => {
                        const city = cities.find(c => c.id.toString() === cityId.toString());
                        if (!city) return null;
                        return (
                          <span
                            key={cityId}
                            style={{
                              padding: '4px 10px',
                              background: 'white',
                              border: '1px solid #f59e0b',
                              borderRadius: '12px',
                              fontSize: '0.8rem',
                              color: '#92400e'
                            }}
                          >
                            {city.cityName}, {city.state}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {branch.lrSeriesStart && (
                  <div className="lr-series-box" style={{ marginTop: '12px' }}>
                    <strong>📋 LR Series:</strong> {branch.lrPrefix && `${branch.lrPrefix}-`}{branch.lrSeriesStart} to {branch.lrPrefix && `${branch.lrPrefix}-`}{branch.lrSeriesEnd}
                    <br/>
                    <small>
                      Current: {branch.lrPrefix && `${branch.lrPrefix}-`}{branch.lrSeriesCurrent || branch.lrSeriesStart} | 
                      Remaining: {parseInt(branch.lrSeriesEnd) - parseInt(branch.lrSeriesCurrent || branch.lrSeriesStart) + 1} numbers
                    </small>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
}
