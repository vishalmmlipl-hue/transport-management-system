import React, { useState, useEffect } from 'react';
import { Save, Truck, Plus, Trash2, Eye, Edit2, X, Search } from 'lucide-react';

export default function MarketVehicleVendorForm() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [activeTab, setActiveTab] = useState('form'); // 'form' or 'list'
  const [searchTerm, setSearchTerm] = useState('');

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

  // Load vendors from server
  useEffect(() => {
    const loadVendors = async () => {
      try {
        setLoading(true);
        const syncService = (await import('./utils/sync-service')).default;
        const vendorsResult = await syncService.load('marketVehicleVendors');
        const allVendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
        
        // Parse data column and merge fields back into vendor object
        const parsedVendors = allVendors.map(vendor => {
          const parsed = { ...vendor };
          
          // Parse data column if it exists
          if (parsed.data && typeof parsed.data === 'string') {
            try {
              const dataObj = JSON.parse(parsed.data);
              // Merge data fields back into vendor object
              Object.assign(parsed, dataObj);
            } catch (e) {
              // Keep as is if parsing fails
            }
          }
          
          // Also parse individual JSON fields if they're strings (for backward compatibility)
          ['address', 'primaryContact', 'bankDetails', 'paymentTerms', 'rateDetails', 'vehicleTypes', 'serviceAreas'].forEach(field => {
            if (parsed[field] && typeof parsed[field] === 'string') {
              try {
                parsed[field] = JSON.parse(parsed[field]);
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
          });
          
          return parsed;
        });
        
        setVendors(parsedVendors);
      } catch (error) {
        console.error('Error loading vendors:', error);
        setVendors([]);
      } finally {
        setLoading(false);
      }
    };
    loadVendors();
    
    // Listen for data sync events to reload vendors
    const handleDataSync = () => {
      loadVendors();
    };
    
    window.addEventListener('dataSyncedFromServer', handleDataSync);
    window.addEventListener('vendorCreated', handleDataSync);
    window.addEventListener('vendorUpdated', handleDataSync);
    
    return () => {
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
      window.removeEventListener('vendorCreated', handleDataSync);
      window.removeEventListener('vendorUpdated', handleDataSync);
    };
  }, []);

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

  const resetForm = () => {
    setFormData({
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
    setEditingId(null);
  };

  const handleEdit = (vendor) => {
    setEditingId(vendor.id);
    setFormData({
      vendorCode: vendor.vendorCode || vendor.code || '',
      vendorType: vendor.vendorType || 'Market Vehicle Vendor',
      companyName: vendor.companyName || '',
      tradeName: vendor.tradeName || '',
      address: vendor.address || {
        line1: '',
        line2: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      },
      primaryContact: vendor.primaryContact || {
        name: '',
        designation: '',
        mobile: '',
        phone: '',
        email: ''
      },
      gstNumber: vendor.gstNumber || '',
      panNumber: vendor.panNumber || '',
      vehicleTypes: Array.isArray(vendor.vehicleTypes) ? vendor.vehicleTypes : [],
      serviceAreas: Array.isArray(vendor.serviceAreas) ? vendor.serviceAreas : [],
      rateDetails: vendor.rateDetails || {
        perKmRate: '',
        perTonRate: '',
        fixedRates: ''
      },
      bankDetails: vendor.bankDetails || {
        accountName: '',
        accountNumber: '',
        bankName: '',
        branch: '',
        ifscCode: ''
      },
      paymentTerms: vendor.paymentTerms || {
        creditDays: '',
        advancePercentage: '',
        terms: 'Net 30'
      },
      status: vendor.status || 'Active',
      remarks: vendor.remarks || ''
    });
    setActiveTab('form');
  };

  const handleView = (vendor) => {
    setViewingId(vendor.id);
  };

  const handleDelete = async (vendorId) => {
    if (!window.confirm('Are you sure you want to delete this vendor? This action cannot be undone.')) {
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const databaseAPI = (await import('./utils/database-api')).default;
      
      // Delete from server
      await databaseAPI.delete('marketVehicleVendors', vendorId);
      
      // Reload vendors
      const vendorsResult = await syncService.load('marketVehicleVendors');
      const allVendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
      const parsedVendors = allVendors.map(vendor => {
        const parsed = { ...vendor };
        
        // Parse data column if it exists
        if (parsed.data && typeof parsed.data === 'string') {
          try {
            const dataObj = JSON.parse(parsed.data);
            // Merge data fields back into vendor object
            Object.assign(parsed, dataObj);
          } catch (e) {}
        }
        
        // Also parse individual JSON fields if they're strings (for backward compatibility)
        ['address', 'primaryContact', 'bankDetails', 'paymentTerms', 'rateDetails', 'vehicleTypes', 'serviceAreas'].forEach(field => {
          if (parsed[field] && typeof parsed[field] === 'string') {
            try {
              parsed[field] = JSON.parse(parsed[field]);
            } catch (e) {}
          }
        });
        
        return parsed;
      });
      setVendors(parsedVendors);
      
      alert('✅ Vendor deleted successfully!');
    } catch (error) {
      console.error('Error deleting vendor:', error);
      alert(`❌ Error deleting vendor: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const syncService = (await import('./utils/sync-service')).default;
      
      // Filter vendor data - only send basic schema fields, store rest in data column
      const filterVendorData = (vendorData) => {
        // Only these basic fields should be direct columns in the database
        // Based on error pattern, the table likely only has: id, code, status, createdAt, updatedAt, data
        const allowedDirectColumns = ['id', 'code', 'status', 'createdAt', 'updatedAt', 'data'];
        
        // All other fields should be stored in 'data' column as JSON
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(vendorData).forEach(key => {
          // Exclude undefined values
          if (vendorData[key] === undefined) return;
          
          // Exclude null values for optional fields (except id and code)
          if (vendorData[key] === null && !['id', 'code'].includes(key)) return;
          
          // Only allow basic schema fields as direct columns
          if (!allowedDirectColumns.includes(key)) {
            // Store everything else in data column
            dataColumn[key] = vendorData[key];
            return;
          }
          
          // Include only allowed direct columns
          filtered[key] = vendorData[key];
        });
        
        // If we have complex data, store it in 'data' column
        if (Object.keys(dataColumn).length > 0) {
          // Merge with existing data column if present
          let existingData = {};
          if (filtered.data) {
            if (typeof filtered.data === 'string') {
              try {
                existingData = JSON.parse(filtered.data);
              } catch (e) {
                existingData = {};
              }
            } else if (typeof filtered.data === 'object') {
              existingData = filtered.data;
            }
          }
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const vendorData = {
        ...formData,
        code: formData.vendorCode || `MVV${String(vendors.length + 1).padStart(3, '0')}`,
        updatedAt: new Date().toISOString()
      };

      // Filter vendor data before saving
      const filteredVendorData = filterVendorData(vendorData);

      let saveResult;
      if (editingId) {
        // Update existing vendor
        saveResult = await syncService.save('marketVehicleVendors', filteredVendorData, true, editingId);
        alert(`✅ Vendor "${formData.companyName}" updated successfully!`);
        // Dispatch event for vendor update
        window.dispatchEvent(new CustomEvent('vendorUpdated', { detail: { vendor: filteredVendorData } }));
      } else {
        // Create new vendor
        saveResult = await syncService.save('marketVehicleVendors', filteredVendorData);
        alert(`✅ Vendor "${formData.companyName}" created successfully!`);
        // Dispatch event for vendor creation
        window.dispatchEvent(new CustomEvent('vendorCreated', { detail: { vendor: filteredVendorData } }));
      }
      
      // Reload vendors - check both API and localStorage
      try {
        const vendorsResult = await syncService.load('marketVehicleVendors');
        let allVendors = [];
        
        if (Array.isArray(vendorsResult)) {
          allVendors = vendorsResult;
        } else if (vendorsResult?.data) {
          allVendors = vendorsResult.data;
        }
        
        // If API returned empty but we saved to localStorage, also check localStorage
        if (allVendors.length === 0 && saveResult?.fallback) {
          const localData = JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]');
          if (localData.length > 0) {
            allVendors = localData;
          }
        }
        
        // Parse vendors
        const parsedVendors = allVendors.map(vendor => {
          const parsed = { ...vendor };
          
          // Parse data column if it exists
          if (parsed.data && typeof parsed.data === 'string') {
            try {
              const dataObj = JSON.parse(parsed.data);
              // Merge data fields back into vendor object
              Object.assign(parsed, dataObj);
            } catch (e) {
              console.warn('Error parsing vendor data column:', e);
            }
          }
          
          // Also parse individual JSON fields if they're strings (for backward compatibility)
          ['address', 'primaryContact', 'bankDetails', 'paymentTerms', 'rateDetails', 'vehicleTypes', 'serviceAreas'].forEach(field => {
            if (parsed[field] && typeof parsed[field] === 'string') {
              try {
                parsed[field] = JSON.parse(parsed[field]);
              } catch (e) {
                // Keep as is if parsing fails
              }
            }
          });
          
          return parsed;
        });
        
        setVendors(parsedVendors);
        console.log(`✅ Loaded ${parsedVendors.length} vendors`);
      } catch (error) {
        console.error('Error reloading vendors:', error);
        // Try to load from localStorage as fallback
        try {
          const localData = JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]');
          setVendors(localData);
        } catch (e) {
          console.error('Error loading from localStorage:', e);
        }
      }
      
      resetForm();
      
      // Switch to View Vendors tab to show the newly created vendor
      setActiveTab('list');
    } catch (error) {
      console.error('Error saving vendor:', error);
      alert(`❌ Error saving vendor: ${error.message || 'Unknown error'}`);
    }
  };

  // Filter vendors based on search term
  const filteredVendors = vendors.filter(vendor => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (vendor.companyName || '').toLowerCase().includes(searchLower) ||
      (vendor.tradeName || '').toLowerCase().includes(searchLower) ||
      (vendor.vendorCode || vendor.code || '').toLowerCase().includes(searchLower) ||
      (vendor.gstNumber || '').toLowerCase().includes(searchLower)
    );
  });

  const viewingVendor = vendors.find(v => v.id === viewingId);

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
        
        .btn-success {
          background: #10b981;
          color: white;
          padding: 6px 12px;
          font-size: 0.85rem;
        }
        
        .btn-success:hover {
          background: #059669;
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
        
        .tab-container {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .tab {
          padding: 12px 24px;
          background: transparent;
          border: none;
          border-bottom: 3px solid transparent;
          cursor: pointer;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
        }
        
        .tab:hover {
          color: #3b82f6;
        }
        
        .vendor-list {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .vendor-item {
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .vendor-item:hover {
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        
        .vendor-info {
          flex: 1;
        }
        
        .vendor-actions {
          display: flex;
          gap: 8px;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 800px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
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

        {/* Tabs */}
        <div className="tab-container">
          <button
            type="button"
            className={`tab ${activeTab === 'form' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('form');
              resetForm();
            }}
          >
            {editingId ? 'Edit Vendor' : 'Add Vendor'}
          </button>
          <button
            type="button"
            className={`tab ${activeTab === 'list' ? 'active' : ''}`}
            onClick={() => setActiveTab('list')}
          >
            View Vendors ({vendors.length})
          </button>
        </div>

        {activeTab === 'form' ? (
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
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    value={formData.address.line1}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value }
                    }))}
                    placeholder="Building/Flat No., Street Name"
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
                  <label>City</label>
                  <input
                    type="text"
                    value={formData.address.city}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, city: e.target.value }
                    }))}
                  />
                </div>
                
                <div className="input-group">
                  <label>State</label>
                  <input
                    type="text"
                    value={formData.address.state}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, state: e.target.value }
                    }))}
                  />
                </div>
                
                <div className="input-group">
                  <label>Pincode</label>
                  <input
                    type="text"
                    value={formData.address.pincode}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      address: { ...prev.address, pincode: e.target.value }
                    }))}
                    maxLength="6"
                    pattern="[0-9]{6}"
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
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="form-section">
              <h2 className="section-title">Primary Contact Person</h2>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>Contact Person Name</label>
                  <input
                    type="text"
                    value={formData.primaryContact.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, name: e.target.value }
                    }))}
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
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    value={formData.primaryContact.mobile}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, mobile: e.target.value }
                    }))}
                    maxLength="10"
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
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={formData.primaryContact.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      primaryContact: { ...prev.primaryContact, email: e.target.value }
                    }))}
                  />
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div className="form-section">
              <h2 className="section-title">Tax & Legal Information</h2>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>GST Number</label>
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
              
              <label>Select Vehicle Types Provided</label>
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
            <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
                <Save size={20} /> {editingId ? 'Update Vendor' : 'Save Vendor'}
              </button>
              {editingId && (
                <button type="button" className="btn btn-secondary" onClick={resetForm} style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        ) : (
          <div className="vendor-list">
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
                <input
                  type="text"
                  placeholder="Search vendors by name, code, or GST..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px', width: '100%' }}
                />
              </div>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>Loading vendors...</div>
            ) : filteredVendors.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                {searchTerm ? 'No vendors found matching your search.' : 'No vendors found. Create your first vendor!'}
              </div>
            ) : (
              filteredVendors.map(vendor => (
                <div key={vendor.id} className="vendor-item">
                  <div className="vendor-info">
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', marginBottom: '4px' }}>
                      {vendor.companyName || 'N/A'}
                      {vendor.tradeName && <span style={{ color: '#64748b', fontWeight: '400' }}> ({vendor.tradeName})</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      Code: {vendor.vendorCode || vendor.code || 'N/A'} | 
                      GST: {vendor.gstNumber || 'N/A'} | 
                      Status: <span style={{ 
                        color: vendor.status === 'Active' ? '#10b981' : vendor.status === 'Inactive' ? '#f59e0b' : '#ef4444',
                        fontWeight: '500'
                      }}>{vendor.status || 'Active'}</span>
                    </div>
                    {vendor.address && (
                      <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
                        {vendor.address.city || ''} {vendor.address.state ? `, ${vendor.address.state}` : ''}
                      </div>
                    )}
                  </div>
                  <div className="vendor-actions">
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={() => handleView(vendor)}
                      title="View Details"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEdit(vendor)}
                      title="Edit Vendor"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => handleDelete(vendor.id)}
                      title="Delete Vendor"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* View Modal */}
        {viewingId && viewingVendor && (
          <div className="modal-overlay" onClick={() => setViewingId(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>Vendor Details</h2>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingId(null)}
                  style={{ padding: '8px' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="form-section" style={{ marginBottom: '16px' }}>
                <h3 className="section-title">Basic Information</h3>
                <div className="grid-3">
                  <div>
                    <label>Vendor Code</label>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {viewingVendor.vendorCode || viewingVendor.code || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label>Company Name</label>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {viewingVendor.companyName || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label>Trade Name</label>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {viewingVendor.tradeName || 'N/A'}
                    </div>
                  </div>
                </div>
                <div style={{ marginTop: '16px' }}>
                  <label>Status</label>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', display: 'inline-block' }}>
                    <span style={{ 
                      color: viewingVendor.status === 'Active' ? '#10b981' : viewingVendor.status === 'Inactive' ? '#f59e0b' : '#ef4444',
                      fontWeight: '500'
                    }}>{viewingVendor.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              {viewingVendor.address && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Address</h3>
                  <div>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px' }}>
                      {viewingVendor.address.line1 || 'N/A'}
                    </div>
                    {viewingVendor.address.line2 && (
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px', marginBottom: '8px' }}>
                        {viewingVendor.address.line2}
                      </div>
                    )}
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {[
                        viewingVendor.address.city,
                        viewingVendor.address.state,
                        viewingVendor.address.pincode,
                        viewingVendor.address.country
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </div>
                  </div>
                </div>
              )}

              {viewingVendor.primaryContact && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Contact Details</h3>
                  <div className="grid-2">
                    <div>
                      <label>Contact Person</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.primaryContact.name || 'N/A'}
                        {viewingVendor.primaryContact.designation && ` (${viewingVendor.primaryContact.designation})`}
                      </div>
                    </div>
                    <div>
                      <label>Mobile</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.primaryContact.mobile || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Phone</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.primaryContact.phone || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Email</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.primaryContact.email || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="form-section" style={{ marginBottom: '16px' }}>
                <h3 className="section-title">Tax Information</h3>
                <div className="grid-2">
                  <div>
                    <label>GST Number</label>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {viewingVendor.gstNumber || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <label>PAN Number</label>
                    <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                      {viewingVendor.panNumber || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>

              {viewingVendor.vehicleTypes && viewingVendor.vehicleTypes.length > 0 && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Vehicle Types</h3>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    {Array.isArray(viewingVendor.vehicleTypes) ? viewingVendor.vehicleTypes.join(', ') : 'N/A'}
                  </div>
                </div>
              )}

              {viewingVendor.serviceAreas && viewingVendor.serviceAreas.length > 0 && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Service Areas</h3>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    {Array.isArray(viewingVendor.serviceAreas) ? viewingVendor.serviceAreas.join(', ') : 'N/A'}
                  </div>
                </div>
              )}

              {viewingVendor.rateDetails && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Rate Details</h3>
                  <div className="grid-3">
                    <div>
                      <label>Per KM Rate</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        ₹{viewingVendor.rateDetails.perKmRate || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label>Per Ton Rate</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        ₹{viewingVendor.rateDetails.perTonRate || '0.00'}
                      </div>
                    </div>
                    <div>
                      <label>Fixed Rate</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        ₹{viewingVendor.rateDetails.fixedRates || '0.00'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewingVendor.bankDetails && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Bank Details</h3>
                  <div className="grid-2">
                    <div>
                      <label>Account Name</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.bankDetails.accountName || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Account Number</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.bankDetails.accountNumber || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Bank Name</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.bankDetails.bankName || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>IFSC Code</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.bankDetails.ifscCode || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewingVendor.paymentTerms && (
                <div className="form-section" style={{ marginBottom: '16px' }}>
                  <h3 className="section-title">Payment Terms</h3>
                  <div className="grid-3">
                    <div>
                      <label>Credit Days</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.paymentTerms.creditDays || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Advance Percentage</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.paymentTerms.advancePercentage ? `${viewingVendor.paymentTerms.advancePercentage}%` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <label>Payment Terms</label>
                      <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                        {viewingVendor.paymentTerms.terms || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {viewingVendor.remarks && (
                <div className="form-section">
                  <h3 className="section-title">Remarks</h3>
                  <div style={{ padding: '8px', background: '#f8fafc', borderRadius: '6px' }}>
                    {viewingVendor.remarks}
                  </div>
                </div>
              )}

              <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setViewingId(null);
                    handleEdit(viewingVendor);
                  }}
                >
                  <Edit2 size={16} /> Edit
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewingId(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
