import React, { useState } from 'react';
import { Save, Search, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { vehiclesService, dataService } from './services/dataService';

export default function VehicleMasterForm() {
  const [loadingVahan, setLoadingVahan] = useState(false);
  const [vahanStatus, setVahanStatus] = useState(null); // 'success', 'error', null
  const [vahanMessage, setVahanMessage] = useState('');

  const [formData, setFormData] = useState({
    vehicleNumber: '',
    vehicleType: '',
    ownershipType: '', // 'Own' or 'Market'
    capacity: '',
    capacityUnit: 'Tons',
    owner: {
      name: '',
      address: ''
    },
    insurance: {
      policyNumber: '',
      provider: '',
      expiryDate: ''
    },
    tp: {
      state: '',
      expiryDate: '',
      permitNumber: ''
    },
    fitness: {
      certificateNumber: '',
      expiryDate: ''
    },
    permit: {
      permitNumber: '',
      permitType: 'National',
      expiryDate: ''
    },
    rcBook: '',
    status: 'Active',
    remarks: ''
  });

  // Function to fetch vehicle details from Vahan portal
  const fetchVahanDetails = async (vehicleNumber) => {
    if (!vehicleNumber || vehicleNumber.length < 10) {
      alert('⚠️ Please enter a valid vehicle number (e.g., MH12AB1234)');
      return;
    }

    setLoadingVahan(true);
    setVahanStatus(null);
    setVahanMessage('');

    try {
      // Vahan Portal API endpoint (Note: This requires API credentials in production)
      // The actual Vahan API endpoint and authentication will need to be configured
      const vahanApiUrl = process.env.REACT_APP_VAHAN_API_URL || 'https://vahan.parivahan.gov.in/vahan4/vahan/v4/view/rcdetails';
      
      // Format vehicle number (remove spaces, convert to uppercase)
      const formattedNumber = vehicleNumber.replace(/\s+/g, '').toUpperCase();
      
      // Note: Actual Vahan API requires authentication and specific parameters
      // This is a placeholder structure that can be updated with real API credentials
      const response = await fetch(`${vahanApiUrl}?regn_no=${formattedNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // Add API key/authentication headers here when available
          // 'Authorization': `Bearer ${process.env.REACT_APP_VAHAN_API_KEY}`,
        },
        mode: 'cors' // Note: CORS might need to be handled via backend proxy
      });

      if (!response.ok) {
        throw new Error(`Vahan API error: ${response.status}`);
      }

      const data = await response.json();
      
      // Parse Vahan API response and populate form fields
      // Note: The actual response structure may vary - adjust based on real API response
      if (data && data.rcDetails) {
        const rcDetails = data.rcDetails;
        
        setFormData(prev => ({
          ...prev,
          vehicleType: rcDetails.vehicleClass || rcDetails.classOfVehicle || prev.vehicleType,
          rcBook: rcDetails.rcNumber || rcDetails.regnNo || prev.rcBook,
          owner: {
            name: rcDetails.ownerName || rcDetails.owner || prev.owner.name,
            address: rcDetails.ownerAddress || rcDetails.address || prev.owner.address
          },
          insurance: {
            ...prev.insurance,
            policyNumber: rcDetails.insurancePolicyNo || prev.insurance.policyNumber,
            provider: rcDetails.insuranceCompany || prev.insurance.provider,
            expiryDate: rcDetails.insuranceExpiry || prev.insurance.expiryDate
          },
          fitness: {
            ...prev.fitness,
            certificateNumber: rcDetails.fitnessCertNo || prev.fitness.certificateNumber,
            expiryDate: rcDetails.fitnessExpiry || prev.fitness.expiryDate
          },
          permit: {
            ...prev.permit,
            permitNumber: rcDetails.permitNo || prev.permit.permitNumber,
            permitType: rcDetails.permitType || prev.permit.permitType,
            expiryDate: rcDetails.permitExpiry || prev.permit.expiryDate
          }
        }));

        setVahanStatus('success');
        setVahanMessage('✅ Vehicle details fetched successfully from Vahan portal!');
        
        // Clear message after 5 seconds
        setTimeout(() => {
          setVahanStatus(null);
          setVahanMessage('');
        }, 5000);
      } else {
        throw new Error('No vehicle details found in Vahan portal');
      }
    } catch (error) {
      console.error('Vahan API Error:', error);
      
      // For development/demo: Show a message that API integration is needed
      setVahanStatus('error');
      setVahanMessage('⚠️ Vahan portal integration requires API credentials. Please enter vehicle details manually or configure Vahan API access.');
      
      // Alternative: You can use a mock/fallback API or backend proxy here
      // For now, we'll show a helpful message
      alert('ℹ️ Vahan Portal Integration\n\nTo enable automatic vehicle details fetching:\n1. Obtain Vahan API credentials\n2. Configure API endpoint in environment variables (REACT_APP_VAHAN_API_URL)\n3. Set up backend proxy if CORS is required\n4. Add API key in environment variables (REACT_APP_VAHAN_API_KEY)\n\nFor now, please enter vehicle details manually.');
    } finally {
      setLoadingVahan(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Check for duplicate vehicle number
      const existingVehicles = await vehiclesService.getAll();
      const duplicate = existingVehicles.find(
        v => v.vehicle_number?.toUpperCase() === formData.vehicleNumber.toUpperCase() ||
             v.vehicleNumber?.toUpperCase() === formData.vehicleNumber.toUpperCase()
      );
      
      if (duplicate) {
        alert(`⚠️ Vehicle number "${formData.vehicleNumber}" already exists!`);
        return;
      }
      
      // Prepare vehicle data (compatible with both database and localStorage)
      const newVehicle = {
        vehicleNumber: formData.vehicleNumber,
        vehicleType: formData.vehicleType,
        ownershipType: formData.ownershipType,
        capacity: parseFloat(formData.capacity) || 0,
        capacityUnit: formData.capacityUnit,
        owner: formData.owner,
        insurance: formData.insurance,
        tp: formData.tp,
        fitness: formData.fitness,
        permit: formData.permit,
        rcBook: formData.rcBook,
        status: formData.status,
        remarks: formData.remarks
      };
      
      // Create vehicle using data service (works with database or localStorage)
      await vehiclesService.create(newVehicle);
      
      const storageMode = dataService.getStorageMode();
      alert(`✅ Vehicle "${formData.vehicleNumber}" created successfully!\n\nStorage: ${storageMode === 'database' ? 'Cloud Database' : 'Local Storage'}\n\nThis vehicle is now available for selection in FTL bookings.`);
      
      // Reset form
      setFormData({
        vehicleNumber: '',
        vehicleType: '',
        ownershipType: '',
        capacity: '',
        capacityUnit: 'Tons',
        owner: { name: '', address: '' },
        insurance: { policyNumber: '', provider: '', expiryDate: '' },
        tp: { state: '', expiryDate: '', permitNumber: '' },
        fitness: { certificateNumber: '', expiryDate: '' },
        permit: { permitNumber: '', permitType: 'National', expiryDate: '' },
        rcBook: '',
        status: 'Active',
        remarks: ''
      });
      
      // Reload to show updated list
      window.location.reload();
    } catch (error) {
      console.error('Error creating vehicle:', error);
      alert(`❌ Error creating vehicle: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-6">
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
          border-left: 4px solid #f97316;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(249,115,22,0.1);
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
          border-color: #f97316;
          box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
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
          background: linear-gradient(135deg, #f97316 0%, #ea580c 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(249,115,22,0.3);
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
        
        .expiry-warning {
          background: #fef3c7;
          border: 2px solid #fbbf24;
          border-radius: 8px;
          padding: 8px 12px;
          margin-top: 8px;
          font-size: 0.85rem;
          color: #92400e;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Vehicle Master
          </h1>
          <p className="text-slate-600 text-lg">Fleet Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Vehicle Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Vehicle Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Vehicle Number *</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="mono"
                    value={formData.vehicleNumber}
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setFormData(prev => ({ ...prev, vehicleNumber: value }));
                      // Reset Vahan status when vehicle number changes
                      if (vahanStatus) {
                        setVahanStatus(null);
                        setVahanMessage('');
                      }
                    }}
                    onBlur={(e) => {
                      // Auto-fetch when vehicle number is entered and has valid format
                      const value = e.target.value.trim().toUpperCase();
                      if (value.length >= 10 && /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/.test(value)) {
                        // Optional: Auto-fetch on blur (uncomment if desired)
                        // fetchVahanDetails(value);
                      }
                    }}
                    placeholder="e.g., MH12AB1234"
                    style={{ textTransform: 'uppercase', flex: 1 }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => fetchVahanDetails(formData.vehicleNumber)}
                    disabled={loadingVahan || !formData.vehicleNumber || formData.vehicleNumber.length < 10}
                    style={{
                      padding: '10px 16px',
                      background: loadingVahan ? '#94a3b8' : '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: loadingVahan ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
                    }}
                    title="Fetch vehicle details from Vahan portal"
                  >
                    {loadingVahan ? (
                      <>
                        <Loader size={16} className="animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      <>
                        <Search size={16} />
                        Fetch from Vahan
                      </>
                    )}
                  </button>
                </div>
                {vahanStatus && (
                  <div style={{
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: vahanStatus === 'success' ? '#d1fae5' : '#fee2e2',
                    color: vahanStatus === 'success' ? '#065f46' : '#991b1b',
                    border: `1px solid ${vahanStatus === 'success' ? '#10b981' : '#ef4444'}`
                  }}>
                    {vahanStatus === 'success' ? (
                      <CheckCircle size={16} />
                    ) : (
                      <AlertCircle size={16} />
                    )}
                    <span>{vahanMessage}</span>
                  </div>
                )}
                <small style={{ 
                  display: 'block', 
                  marginTop: '4px', 
                  color: '#64748b', 
                  fontSize: '0.75rem' 
                }}>
                  Enter vehicle number and click "Fetch from Vahan" to auto-populate details
                </small>
              </div>
              
              <div className="input-group">
                <label>Vehicle Type *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                  required
                >
                  <option value="">-- Select Vehicle Type --</option>
                  <option value="TATA ACE">TATA ACE</option>
                  <option value="PICKUP">PICKUP</option>
                  <option value="14 FEET">14 FEET</option>
                  <option value="17 FEET">17 FEET</option>
                  <option value="19 FEET">19 FEET</option>
                  <option value="20 FEET">20 FEET</option>
                  <option value="22 FEET">22 FEET</option>
                  <option value="24 FEET">24 FEET</option>
                  <option value="32 FEET EXL">32 FEET EXL</option>
                  <option value="32 FEET MXL">32 FEET MXL</option>
                  <option value="20 FEET TRAILER">20 FEET TRAILER</option>
                  <option value="40 FEET TRAILER">40 FEET TRAILER</option>
                  <option value="Truck">Truck (General)</option>
                  <option value="Mini Truck">Mini Truck</option>
                  <option value="Tempo">Tempo</option>
                  <option value="Container 20ft">Container 20ft</option>
                  <option value="Container 40ft">Container 40ft</option>
                  <option value="Trailer">Trailer (General)</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Ownership Type *</label>
                <select
                  value={formData.ownershipType}
                  onChange={(e) => {
                    const ownershipType = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      ownershipType: ownershipType,
                      // Auto-fill owner name if Own Vehicle is selected
                      owner: {
                        ...prev.owner,
                        name: ownershipType === 'Own' 
                          ? 'Multimode Logistics India Pvt Ltd' 
                          : (ownershipType === 'Market' 
                              ? (prev.owner.name === 'Multimode Logistics India Pvt Ltd' ? '' : prev.owner.name)
                              : prev.owner.name)
                      }
                    }));
                  }}
                  required
                >
                  <option value="">-- Select Ownership Type --</option>
                  <option value="Own">Own Vehicle</option>
                  <option value="Market">Market Vehicle</option>
                </select>
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
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Sold">Sold</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Capacity *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
                  placeholder="Vehicle capacity"
                  min="0"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Capacity Unit</label>
                <select
                  value={formData.capacityUnit}
                  onChange={(e) => setFormData(prev => ({ ...prev, capacityUnit: e.target.value }))}
                  required
                >
                  <option value="Tons">Tons</option>
                  <option value="CFT">CFT (Cubic Feet)</option>
                  <option value="Kg">Kilograms</option>
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>RC Book Number</label>
              <input
                type="text"
                className="mono"
                value={formData.rcBook}
                onChange={(e) => setFormData(prev => ({ ...prev, rcBook: e.target.value.toUpperCase() }))}
                placeholder="Registration Certificate Number"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
          </div>

          {/* Owner Details */}
          <div className="form-section">
            <h2 className="section-title">Owner Details</h2>
            
            <div className="input-group">
              <label>Owner Name *</label>
              <input
                type="text"
                value={formData.owner.name}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  owner: { ...prev.owner, name: e.target.value }
                }))}
                placeholder="Full name of vehicle owner"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Owner Address</label>
              <textarea
                value={formData.owner.address}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  owner: { ...prev.owner, address: e.target.value }
                }))}
                placeholder="Complete address"
                rows="2"
              />
            </div>
          </div>

          {/* Insurance Details */}
          <div className="form-section">
            <h2 className="section-title">Insurance Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Insurance Policy Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.insurance.policyNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    insurance: { ...prev.insurance, policyNumber: e.target.value.toUpperCase() }
                  }))}
                  placeholder="Policy number"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Insurance Provider</label>
                <input
                  type="text"
                  value={formData.insurance.provider}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    insurance: { ...prev.insurance, provider: e.target.value }
                  }))}
                  placeholder="Company name"
                />
              </div>
            </div>
            
            <div className="input-group">
              <label>Insurance Expiry Date</label>
              <input
                type="date"
                value={formData.insurance.expiryDate}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  insurance: { ...prev.insurance, expiryDate: e.target.value }
                }))}
              />
              {formData.insurance.expiryDate && new Date(formData.insurance.expiryDate) < new Date() && (
                <div className="expiry-warning">
                  ⚠️ Insurance has expired! Renew to continue operations.
                </div>
              )}
            </div>
          </div>

          {/* Temporary Permit (TP) Details */}
          <div className="form-section">
            <h2 className="section-title">Temporary Permit (TP) Details</h2>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '16px', fontStyle: 'italic' }}>
              Required when vehicle does not have National Permit. TP allows operation in a specific state.
            </p>
            
            <div className="grid-3">
              <div className="input-group">
                <label>TP Permit Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.tp.permitNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tp: { ...prev.tp, permitNumber: e.target.value.toUpperCase() }
                  }))}
                  placeholder="TP permit number"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>TP State *</label>
                <select
                  value={formData.tp.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tp: { ...prev.tp, state: e.target.value }
                  }))}
                  required
                >
                  <option value="">-- Select State --</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">Andaman and Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra and Nagar Haveli and Daman and Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>TP Expiry Date *</label>
                <input
                  type="date"
                  value={formData.tp.expiryDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    tp: { ...prev.tp, expiryDate: e.target.value }
                  }))}
                  required
                />
                {formData.tp.expiryDate && new Date(formData.tp.expiryDate) < new Date() && (
                  <div className="expiry-warning">
                    ⚠️ Temporary Permit has expired! Renew to continue operations.
                  </div>
                )}
                {formData.tp.expiryDate && new Date(formData.tp.expiryDate) >= new Date() && new Date(formData.tp.expiryDate) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) && (
                  <div style={{ 
                    marginTop: '8px', 
                    padding: '8px 12px', 
                    background: '#fef3c7', 
                    borderRadius: '6px', 
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}>
                    ⚠️ Temporary Permit expires within 30 days! Renew soon.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fitness Certificate */}
          <div className="form-section">
            <h2 className="section-title">Fitness Certificate</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Fitness Certificate Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.fitness.certificateNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    fitness: { ...prev.fitness, certificateNumber: e.target.value.toUpperCase() }
                  }))}
                  placeholder="Certificate number"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Fitness Expiry Date</label>
                <input
                  type="date"
                  value={formData.fitness.expiryDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    fitness: { ...prev.fitness, expiryDate: e.target.value }
                  }))}
                />
                {formData.fitness.expiryDate && new Date(formData.fitness.expiryDate) < new Date() && (
                  <div className="expiry-warning">
                    ⚠️ Fitness certificate has expired!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Permit Details */}
          <div className="form-section">
            <h2 className="section-title">Permit Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Permit Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.permit.permitNumber}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    permit: { ...prev.permit, permitNumber: e.target.value.toUpperCase() }
                  }))}
                  placeholder="Permit number"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Permit Type</label>
                <select
                  value={formData.permit.permitType}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    permit: { ...prev.permit, permitType: e.target.value }
                  }))}
                >
                  <option value="National">National Permit</option>
                  <option value="State">State Permit</option>
                  <option value="Regional">Regional Permit</option>
                  <option value="All India">All India Permit</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Permit Expiry Date</label>
                <input
                  type="date"
                  value={formData.permit.expiryDate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    permit: { ...prev.permit, expiryDate: e.target.value }
                  }))}
                />
                {formData.permit.expiryDate && new Date(formData.permit.expiryDate) < new Date() && (
                  <div className="expiry-warning">
                    ⚠️ Permit has expired!
                  </div>
                )}
              </div>
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
                placeholder="Any special notes about the vehicle, maintenance history, or other relevant information..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Save Vehicle Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
