import React, { useState, useEffect, useRef } from 'react';
import { Save, MapPin, Search, RefreshCw, Database, AlertCircle, X } from 'lucide-react';
import initSampleData from './init-sample-data';

export default function CityMasterForm() {
  const [cities, setCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterState, setFilterState] = useState('');
  const [cityNameSuggestions, setCityNameSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState('');
  const cityInputRef = useRef(null);
  const suggestionsRef = useRef(null);
  
  const [formData, setFormData] = useState({
    cityCode: '',
    cityName: '',
    state: '',
    region: '',
    zone: 'North',
    pincodeRanges: '',
    isODA: false,
    distanceFromHub: '',
    transitDays: '',
    status: 'Active',
    remarks: '',
    editingCityId: undefined
  });

  useEffect(() => {
    loadCities();
  }, []);

  useEffect(() => {
    filterCities();
  }, [searchTerm, filterState, cities]);

  useEffect(() => {
    // Handle click outside to close suggestions
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        cityInputRef.current &&
        !cityInputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadCities = () => {
    const allCities = JSON.parse(localStorage.getItem('cities') || '[]');
    setCities(allCities);
    setFilteredCities(allCities);
  };

  const filterCities = () => {
    let filtered = [...cities];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(city => 
        city.cityName.toLowerCase().includes(term) ||
        city.code.toLowerCase().includes(term) ||
        (city.state && city.state.toLowerCase().includes(term)) ||
        (city.region && city.region.toLowerCase().includes(term))
      );
    }
    
    if (filterState) {
      filtered = filtered.filter(city => city.state === filterState);
    }
    
    setFilteredCities(filtered);
  };

  const handleReloadSampleData = () => {
    if (window.confirm('⚠️ This will reload all sample data including cities. Existing data will be replaced. Are you sure?')) {
      localStorage.clear();
      initSampleData();
      loadCities();
      alert('✅ Sample data reloaded successfully! All cities including Madhya Pradesh districts, Mumbai region, and Delhi NCR are now available.');
    }
  };

  const handleCityNameChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, cityName: value }));
    setDuplicateWarning('');

    // Show suggestions if there's input
    if (value.length > 0) {
      const filtered = cities.filter(city => 
        city.cityName.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10); // Limit to 10 suggestions
      setCityNameSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setCityNameSuggestions([]);
      setShowSuggestions(false);
    }

    // Check for duplicate when state is also selected
    if (formData.state && value) {
      const isDuplicate = cities.some(city => 
        city.cityName.toLowerCase() === value.toLowerCase() &&
        city.state === formData.state
      );
      if (isDuplicate) {
        setDuplicateWarning(`⚠️ City "${value}" already exists in ${formData.state}`);
      }
    }
  };

  const handleStateChange = (e) => {
    const state = e.target.value;
    setFormData(prev => ({ ...prev, state }));

    // Check for duplicate when city name is also entered
    if (formData.cityName && state) {
      const isDuplicate = cities.some(city => 
        city.cityName.toLowerCase() === formData.cityName.toLowerCase() &&
        city.state === state
      );
      if (isDuplicate) {
        setDuplicateWarning(`⚠️ City "${formData.cityName}" already exists in ${state}`);
      } else {
        setDuplicateWarning('');
      }
    }
  };

  const handleSelectSuggestion = (city) => {
    setFormData(prev => ({
      ...prev,
      cityName: city.cityName,
      state: city.state || prev.state,
      region: city.region || prev.region,
      zone: city.zone || prev.zone,
      cityCode: city.code || prev.cityCode,
      pincodeRanges: city.pincodeRanges || prev.pincodeRanges,
      isODA: city.isODA || prev.isODA,
      distanceFromHub: city.distanceFromHub || prev.distanceFromHub,
      transitDays: city.transitDays || prev.transitDays
    }));
    setShowSuggestions(false);
    setDuplicateWarning(`ℹ️ City "${city.cityName}" already exists. Editing will update the existing entry.`);
  };

  const indianStates = [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
    'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
    'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
    'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
    'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
    'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
    'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingCities = JSON.parse(localStorage.getItem('cities') || '[]');
    
    // Check for duplicate (same city name + same state)
    const isDuplicate = existingCities.some(city => 
      city.cityName.toLowerCase() === formData.cityName.toLowerCase() &&
      city.state === formData.state &&
      city.id !== formData.editingCityId // Exclude current city if editing
    );

    if (isDuplicate) {
      const duplicateCity = existingCities.find(city => 
        city.cityName.toLowerCase() === formData.cityName.toLowerCase() &&
        city.state === formData.state
      );
      alert(`❌ Duplicate Entry!\n\nCity "${formData.cityName}" already exists in ${formData.state}.\n\nCity Code: ${duplicateCity.code}\n\nPlease use a different city name or state.`);
      return;
    }

    // Check if city code already exists
    if (formData.cityCode) {
      const codeExists = existingCities.some(city => 
        city.code.toLowerCase() === formData.cityCode.toLowerCase() &&
        city.id !== formData.editingCityId
      );
      if (codeExists) {
        alert(`❌ City Code "${formData.cityCode}" already exists. Please use a different code.`);
        return;
      }
    }
    
    const newCity = {
      id: formData.editingCityId || Date.now(),
      code: formData.cityCode || `CITY${String(existingCities.length + 1).padStart(3, '0')}`,
      cityName: formData.cityName.trim(),
      state: formData.state,
      region: formData.region.trim(),
      zone: formData.zone,
      pincodeRanges: formData.pincodeRanges.trim(),
      isODA: formData.isODA,
      distanceFromHub: formData.distanceFromHub,
      transitDays: formData.transitDays,
      status: formData.status,
      remarks: formData.remarks.trim(),
      createdAt: formData.editingCityId 
        ? existingCities.find(c => c.id === formData.editingCityId)?.createdAt 
        : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (formData.editingCityId) {
      // Update existing city
      const index = existingCities.findIndex(c => c.id === formData.editingCityId);
      if (index !== -1) {
        existingCities[index] = newCity;
        alert(`✅ City "${formData.cityName}" updated successfully!`);
      }
    } else {
      // Add new city
      existingCities.push(newCity);
      alert(`✅ City "${formData.cityName}" created successfully!\n\nCity Code: ${newCity.code}\n\nThis city is now available for selection in LR booking forms.`);
    }
    
    localStorage.setItem('cities', JSON.stringify(existingCities));
    loadCities(); // Reload cities list
    
    // Reset form
    setFormData({
      cityCode: '',
      cityName: '',
      state: '',
      region: '',
      zone: 'North',
      pincodeRanges: '',
      isODA: false,
      distanceFromHub: '',
      transitDays: '',
      status: 'Active',
      remarks: '',
      editingCityId: undefined
    });
    setDuplicateWarning('');
    setShowSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 p-6">
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
          border-left: 4px solid #10b981;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(16,185,129,0.1);
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
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
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        
        .checkbox-container {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
        }
        
        .checkbox-container input[type="checkbox"] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
        
        .checkbox-container label {
          margin-bottom: 0;
          cursor: pointer;
        }
        
        .oda-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #fef3c7;
          color: #92400e;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          margin-left: 8px;
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }

        .autocomplete-suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          margin-top: 4px;
        }

        .autocomplete-suggestion-item {
          padding: 12px;
          cursor: pointer;
          border-bottom: 1px solid #f1f5f9;
          transition: background-color 0.2s;
        }

        .autocomplete-suggestion-item:hover {
          background: #f8fafc;
        }

        .duplicate-warning {
          margin-top: 8px;
          padding: 10px 12px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          color: #991b1b;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            City Master
          </h1>
          <p className="text-slate-600 text-lg">City & Route Management System</p>
          <p className="text-sm text-slate-500 mt-2">
            Total Cities: <strong>{cities.length}</strong> | Showing: <strong>{filteredCities.length}</strong>
          </p>
        </div>

        {/* Cities List View */}
        <div className="form-section" style={{ marginBottom: '30px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 className="section-title" style={{ marginBottom: 0 }}>All Cities ({filteredCities.length})</h2>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleReloadSampleData}
                className="btn"
                style={{ 
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  fontSize: '0.85rem',
                  padding: '8px 16px'
                }}
              >
                <Database size={16} /> Reload Sample Data
              </button>
              <button
                type="button"
                onClick={loadCities}
                className="btn"
                style={{ 
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  fontSize: '0.85rem',
                  padding: '8px 16px'
                }}
              >
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search by city name, code, state, or region..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '40px' }}
              />
            </div>
            <select
              value={filterState}
              onChange={(e) => setFilterState(e.target.value)}
            >
              <option value="">All States</option>
              {[...new Set(cities.map(c => c.state).filter(Boolean))].sort().map(state => (
                <option key={state} value={state}>{state}</option>
              ))}
            </select>
          </div>

          {/* Cities Table */}
          {filteredCities.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '40px', 
              background: '#f8fafc', 
              borderRadius: '8px',
              color: '#64748b'
            }}>
              <MapPin size={48} style={{ margin: '0 auto 15px', opacity: 0.5 }} />
              <p style={{ fontSize: '1.1rem', marginBottom: '10px' }}>No cities found</p>
              <p style={{ fontSize: '0.9rem' }}>
                {cities.length === 0 
                  ? 'No cities in the system. Add a city below or reload sample data.'
                  : 'Try adjusting your search or filter criteria.'}
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Code</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>City Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>State</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Region</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Zone</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Status</th>
                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>ODA</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCities.map((city, index) => (
                    <tr 
                      key={city.id} 
                      style={{ 
                        borderBottom: '1px solid #e2e8f0',
                        background: index % 2 === 0 ? 'white' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '12px', fontFamily: 'monospace', color: '#3b82f6', fontWeight: 600 }}>
                        {city.code || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontWeight: 500, color: '#1e293b' }}>
                        {city.cityName}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {city.state || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b', fontSize: '0.85rem' }}>
                        {city.region || '-'}
                      </td>
                      <td style={{ padding: '12px', color: '#64748b' }}>
                        {city.zone || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: city.status === 'Active' ? '#d1fae5' : '#fee2e2',
                          color: city.status === 'Active' ? '#065f46' : '#991b1b'
                        }}>
                          {city.status || 'Active'}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {city.isODA ? (
                          <span style={{
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: '#fef3c7',
                            color: '#92400e'
                          }}>
                            ODA
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8' }}>-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>City Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.cityCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, cityCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <label>City Name *</label>
                <input
                  ref={cityInputRef}
                  type="text"
                  value={formData.cityName}
                  onChange={handleCityNameChange}
                  onFocus={() => {
                    if (formData.cityName.length > 0 && cityNameSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Type to search existing cities or enter new city name"
                  required
                  style={{ 
                    paddingRight: duplicateWarning ? '40px' : '12px',
                    borderColor: duplicateWarning ? '#ef4444' : undefined
                  }}
                />
                {duplicateWarning && (
                  <AlertCircle 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      right: '12px', 
                      top: '38px', 
                      color: '#ef4444',
                      cursor: 'pointer'
                    }} 
                    title={duplicateWarning}
                  />
                )}
                
                {/* Autocomplete Suggestions Dropdown */}
                {showSuggestions && cityNameSuggestions.length > 0 && (
                  <div
                    ref={suggestionsRef}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      zIndex: 1000,
                      maxHeight: '300px',
                      overflowY: 'auto',
                      marginTop: '4px'
                    }}
                  >
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#f1f5f9', 
                      borderBottom: '1px solid #e2e8f0',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: '#64748b'
                    }}>
                      Existing Cities (Click to select)
                    </div>
                    {cityNameSuggestions.map((city) => (
                      <div
                        key={city.id}
                        onClick={() => handleSelectSuggestion(city)}
                        style={{
                          padding: '12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f1f5f9',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f8fafc';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'white';
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                              {city.cityName}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              {city.state} {city.region ? `• ${city.region}` : ''} {city.isODA ? '• ODA' : ''}
                            </div>
                          </div>
                          <div style={{ 
                            fontFamily: 'monospace', 
                            fontSize: '0.75rem', 
                            color: '#3b82f6',
                            fontWeight: 600
                          }}>
                            {city.code}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {duplicateWarning && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '6px',
                    color: '#991b1b',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={16} />
                    <span>{duplicateWarning}</span>
                  </div>
                )}
              </div>
              
              <div className="input-group">
                <label>Status</label>
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

            <div className="grid-2">
              <div className="input-group">
                <label>State *</label>
                <select
                  value={formData.state}
                  onChange={handleStateChange}
                  required
                  style={{
                    borderColor: duplicateWarning && formData.cityName ? '#ef4444' : undefined
                  }}
                >
                  <option value="">-- Select State --</option>
                  {indianStates.map(state => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Region/Area</label>
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                  placeholder="e.g., Mumbai Metropolitan, NCR"
                />
              </div>
            </div>
          </div>

          {/* Zone & Location Details */}
          <div className="form-section">
            <h2 className="section-title">Zone & Location Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Zone</label>
                <select
                  value={formData.zone}
                  onChange={(e) => setFormData(prev => ({ ...prev, zone: e.target.value }))}
                  required
                >
                  <option value="North">North</option>
                  <option value="South">South</option>
                  <option value="East">East</option>
                  <option value="West">West</option>
                  <option value="Central">Central</option>
                  <option value="North-East">North-East</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Pincode Ranges</label>
                <input
                  type="text"
                  value={formData.pincodeRanges}
                  onChange={(e) => setFormData(prev => ({ ...prev, pincodeRanges: e.target.value }))}
                  placeholder="e.g., 400001-400099, 421201"
                />
              </div>
              
              <div className="input-group">
                <label>Distance from Hub (km)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.distanceFromHub}
                  onChange={(e) => setFormData(prev => ({ ...prev, distanceFromHub: e.target.value }))}
                  placeholder="Distance in kilometers"
                  min="0"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Standard Transit Days</label>
                <input
                  type="number"
                  value={formData.transitDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, transitDays: e.target.value }))}
                  placeholder="Expected delivery days"
                  min="0"
                />
              </div>
              
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="odaCheckbox"
                  checked={formData.isODA}
                  onChange={(e) => setFormData(prev => ({ ...prev, isODA: e.target.checked }))}
                />
                <label htmlFor="odaCheckbox">
                  Mark as ODA (Out of Delivery Area)
                  {formData.isODA && <span className="oda-badge">ODA</span>}
                </label>
              </div>
            </div>

            {formData.isODA && (
              <div style={{
                background: '#fef3c7',
                border: '2px solid #fbbf24',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '12px',
                fontSize: '0.9rem',
                color: '#92400e'
              }}>
                <strong>⚠️ ODA City:</strong> Additional ODA charges will be applicable for deliveries to this location.
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Remarks / Notes</h2>
            
            <div className="input-group">
              <label>Additional Information</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special notes, delivery restrictions, or route information..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Save City Master
            </button>
          </div>
        </form>

        {/* Add New City Section */}
        <div style={{ marginTop: '30px', padding: '20px', background: '#f8fafc', borderRadius: '12px', border: '2px dashed #cbd5e1' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', marginBottom: '15px', textAlign: 'center' }}>
            Add New City
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '20px', fontSize: '0.9rem' }}>
            Use the form above to add a new city to the system
          </p>
        </div>
      </div>
    </div>
  );
}
