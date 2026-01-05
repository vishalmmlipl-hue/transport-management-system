import React, { useState } from 'react';
import { Save, Truck, Plus, Trash2 } from 'lucide-react';

export default function MarketVehicleVendorForm() {
  const [formData, setFormData] = useState({
    vendorCode: '',
    vendorType: 'Market Vehicle Vendor',
    companyName: '',
    tradeName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    primaryContact: {
      name: '',
      designation: '',
      mobile: '',
      phone: '',
      email: ''
    },
    gstNumber: '',
    panNumber: '',
    vehicleTypes: [],
    serviceAreas: [],
    rateDetails: {
      perKmRate: '',
      perTonRate: '',
      fixedRates: ''
    },
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    paymentTerms: {
      creditDays: '',
      advancePercentage: '',
      terms: 'Net 30'
    },
    status: 'Active',
    remarks: ''
  });

  const vehicleTypeOptions = [
    'TATA ACE', 'PICKUP', '14 FEET', '17 FEET', '19 FEET', '20 FEET',
    '22 FEET', '24 FEET', '32 FEET EXL', '32 FEET MXL',
    '20 FEET TRAILER', '40 FEET TRAILER', 'Others'
  ];

  const handleVehicleTypeToggle = (type) => {
    const current = formData.vehicleTypes;
    if (current.includes(type)) {
      setFormData(prev => ({
        ...prev,
        vehicleTypes: current.filter(t => t !== type)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        vehicleTypes: [...current, type]
      }));
    }
  };

  const addServiceArea = () => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: [...prev.serviceAreas, '']
    }));
  };

  const updateServiceArea = (index, value) => {
    const newAreas = [...formData.serviceAreas];
    newAreas[index] = value;
    setFormData(prev => ({ ...prev, serviceAreas: newAreas }));
  };

  const removeServiceArea = (index) => {
    setFormData(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingVendors = JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]');
    
    const newVendor = {
      id: Date.now(),
      code: formData.vendorCode || `MVV${String(existingVendors.length + 1).padStart(3, '0')}`,
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    existingVendors.push(newVendor);
    localStorage.setItem('marketVehicleVendors', JSON.stringify(existingVendors));
    
    alert(`Market Vehicle Vendor "${formData.companyName}" created successfully!\n\nVendor Code: ${newVendor.code}`);
    window.location.reload();
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
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(59,130,246,0.1);
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }
        
        .btn-secondary:hover {
          background: #3b82f6;
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
          font-size: 0.85rem;
        }
        
        .btn-danger:hover {
          background: #dc2626;
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
        
        .vehicle-types-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 10px;
          margin-top: 12px;
        }
        
        .vehicle-type-chip {
          padding: 10px 14px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
          font-size: 0.85rem;
          font-weight: 500;
          color: #64748b;
        }
        
        .vehicle-type-chip:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .vehicle-type-chip.selected {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .service-area-item {
          background: #f8fafc;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 10px;
          border: 1px solid #e2e8f0;
          display: flex;
          gap: 10px;
          align-items: center;
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
            Market Vehicle Vendor
          </h1>
          <p className="text-slate-600 text-lg">Transport & Vehicle Vendor Management</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Vendor Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.vendorCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Trade Name / DBA</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                  placeholder="Doing Business As"
                />
              </div>
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
                <option value="Blacklisted">Blacklisted</option>
              </select>
            </div>
          </div>

          {/* Address Details */}
          <div className="form-section">
            <h2 className="section-title">Address Details</h2>
            
            <div className="input-group">
              <label>Address Line 1 *</label>
              <input
                type="text"
                value={formData.address.line1}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value }
                }))}
                placeholder="Building/Flat No., Street Name"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Address Line 2</label>
              <input
                type="text"
                value={formData.address.line2}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, line2: e.target.value }
                }))}
                placeholder="Locality, Landmark"
              />
            </div>
            
            <div className="grid-4">
              <div className="input-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Pincode *</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, pincode: e.target.value }
                  }))}
                  maxLength="6"
                  pattern="[0-9]{6}"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h2 className="section-title">Primary Contact Person</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Contact Person Name *</label>
                <input
                  type="text"
                  value={formData.primaryContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, name: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={formData.primaryContact.designation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, designation: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.primaryContact.mobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, mobile: e.target.value }
                  }))}
                  maxLength="10"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.primaryContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, phone: e.target.value }
                  }))}
                />
              </div>
              
              <div className="input-group">
                <label>Email Address *</label>
                <input
                  type="email"
                  value={formData.primaryContact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, email: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Tax Information */}
          <div className="form-section">
            <h2 className="section-title">Tax & Legal Information</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>GST Number *</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.gstNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData(prev => ({ 
                      ...prev, 
                      gstNumber: value 
                    }));
                  }}
                  maxLength={formData.gstNumber === 'URP' ? 3 : 15}
                  placeholder="15 characters or URP"
                  style={{ textTransform: 'uppercase' }}
                  required
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
                  maxLength="10"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Vehicle Types & Service Areas */}
          <div className="form-section">
            <h2 className="section-title">Vehicle Types Available</h2>
            
            <label>Select Vehicle Types Provided *</label>
            <div className="vehicle-types-grid">
              {vehicleTypeOptions.map(type => (
                <div
                  key={type}
                  className={`vehicle-type-chip ${formData.vehicleTypes.includes(type) ? 'selected' : ''}`}
                  onClick={() => handleVehicleTypeToggle(type)}
                >
                  {type}
                </div>
              ))}
            </div>
            
            {formData.vehicleTypes.length > 0 && (
              <div style={{
                marginTop: '12px',
                padding: '10px',
                background: '#eff6ff',
                borderRadius: '6px',
                fontSize: '0.9rem',
                color: '#1e40af'
              }}>
                <strong>Selected:</strong> {formData.vehicleTypes.join(', ')}
              </div>
            )}
          </div>

          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Service Areas / Routes
              </h2>
              <button type="button" className="btn btn-secondary" onClick={addServiceArea}>
                <Plus size={16} /> Add Area
              </button>
            </div>
            
            {formData.serviceAreas.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>No service areas added</p>
            ) : (
              formData.serviceAreas.map((area, index) => (
                <div key={index} className="service-area-item">
                  <input
                    type="text"
                    placeholder="e.g., Mumbai to Delhi, Pan India, North Zone"
                    value={area}
                    onChange={(e) => updateServiceArea(index, e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => removeServiceArea(index)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Rate Details */}
          <div className="form-section">
            <h2 className="section-title">Rate Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Per KM Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rateDetails.perKmRate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rateDetails: { ...prev.rateDetails, perKmRate: e.target.value }
                  }))}
                  placeholder="Rate per kilometer"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Per Ton Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rateDetails.perTonRate}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rateDetails: { ...prev.rateDetails, perTonRate: e.target.value }
                  }))}
                  placeholder="Rate per ton"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Fixed Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rateDetails.fixedRates}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    rateDetails: { ...prev.rateDetails, fixedRates: e.target.value }
                  }))}
                  placeholder="Fixed contract rate"
                  min="0"
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
                  maxLength="11"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Payment Terms */}
          <div className="form-section">
            <h2 className="section-title">Payment Terms</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Credit Days</label>
                <input
                  type="number"
                  value={formData.paymentTerms.creditDays}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentTerms: { ...prev.paymentTerms, creditDays: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Advance Percentage (%)</label>
                <input
                  type="number"
                  value={formData.paymentTerms.advancePercentage}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentTerms: { ...prev.paymentTerms, advancePercentage: e.target.value }
                  }))}
                  min="0"
                  max="100"
                />
              </div>
              
              <div className="input-group">
                <label>Payment Terms</label>
                <select
                  value={formData.paymentTerms.terms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentTerms: { ...prev.paymentTerms, terms: e.target.value }
                  }))}
                >
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="Advance">Advance Payment</option>
                </select>
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
                placeholder="Any special notes, terms, or conditions..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Save Market Vehicle Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
