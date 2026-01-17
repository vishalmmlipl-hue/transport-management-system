import React, { useState } from 'react';
import { Save } from 'lucide-react';

export default function OtherVendorForm() {
  const [formData, setFormData] = useState({
    vendorCode: '',
    vendorType: 'Other Vendor',
    vendorCategory: '',
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
    productServices: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    paymentTerms: {
      creditDays: '',
      creditLimit: '',
      terms: 'Net 30'
    },
    tdsApplicable: false,
    tdsPercentage: '',
    status: 'Active',
    remarks: ''
  });

  const vendorCategories = [
    'Office Supplies',
    'Fuel Supplier',
    'Maintenance & Repair',
    'IT & Software',
    'Insurance Provider',
    'Packaging Material',
    'Stationery',
    'Cleaning Services',
    'Security Services',
    'Warehouse Services',
    'Legal Services',
    'Accounting Services',
    'Marketing Services',
    'Equipment Rental',
    'Spare Parts',
    'Tyre Supplier',
    'Lubricants & Oil',
    'Others'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingVendors = JSON.parse(localStorage.getItem('otherVendors') || '[]');
    
    const newVendor = {
      id: Date.now(),
      code: formData.vendorCode || `OV${String(existingVendors.length + 1).padStart(3, '0')}`,
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    existingVendors.push(newVendor);
    localStorage.setItem('otherVendors', JSON.stringify(existingVendors));
    
    alert(`Other Vendor "${formData.companyName}" created successfully!\n\nVendor Code: ${newVendor.code}`);
    window.location.reload();
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
          border-left: 4px solid #a855f7;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(168,85,247,0.1);
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
          border-color: #a855f7;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.1);
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
          background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(168,85,247,0.3);
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Other Vendor
          </h1>
          <p className="text-slate-600 text-lg">General Supplier & Service Provider Management</p>
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
                <label>Vendor Category *</label>
                <select
                  value={formData.vendorCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, vendorCategory: e.target.value }))}
                  required
                >
                  <option value="">-- Select Category --</option>
                  {vendorCategories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
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
                  <option value="Blacklisted">Blacklisted</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
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

            <div className="grid-2">
              <div className="checkbox-container">
                <input
                  type="checkbox"
                  id="tdsCheckbox"
                  checked={formData.tdsApplicable}
                  onChange={(e) => setFormData(prev => ({ ...prev, tdsApplicable: e.target.checked }))}
                />
                <label htmlFor="tdsCheckbox">
                  TDS Applicable
                </label>
              </div>
              
              {formData.tdsApplicable && (
                <div className="input-group">
                  <label>TDS Percentage (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.tdsPercentage}
                    onChange={(e) => setFormData(prev => ({ ...prev, tdsPercentage: e.target.value }))}
                    placeholder="e.g., 2, 10"
                    min="0"
                    max="100"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Products/Services */}
          <div className="form-section">
            <h2 className="section-title">Products / Services Offered</h2>
            
            <div className="input-group">
              <label>Description</label>
              <textarea
                value={formData.productServices}
                onChange={(e) => setFormData(prev => ({ ...prev, productServices: e.target.value }))}
                placeholder="Describe the products or services this vendor provides..."
                rows="4"
              />
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
                <label>Credit Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.paymentTerms.creditLimit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paymentTerms: { ...prev.paymentTerms, creditLimit: e.target.value }
                  }))}
                  min="0"
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
                  <option value="Net 60">Net 60 Days</option>
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
              <Save size={20} /> Save Other Vendor
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
