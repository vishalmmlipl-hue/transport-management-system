import React, { useState } from 'react';
import { Save, Plus, Trash2, User } from 'lucide-react';
import syncService from './services/syncService';

export default function ClientMasterForm() {
  const [formData, setFormData] = useState({
    clientCode: '',
    clientType: 'TBB',
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
    additionalContacts: [],
    gstNumber: '',
    isUnregisteredPerson: false,
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    billingDetails: {
      creditLimit: '',
      creditDays: '',
      paymentTerms: 'Net 30'
    },
    deliveryType: 'Godown', // Default delivery type for TBB clients: 'Godown' or 'Door'
    status: 'Active',
    remarks: ''
  });

  const [, setShowAdditionalContact] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Get existing clients from localStorage
    const existingClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');

    // Create new client object
    const newClient = {
      id: Date.now(), // Simple ID generation
      code: formData.clientCode || `TBB${String(existingClients.length + 1).padStart(3, '0')}`,
      companyName: formData.companyName,
      tradeName: formData.tradeName,
      address: formData.address,
      primaryContact: formData.primaryContact,
      additionalContacts: formData.additionalContacts,
      gstNumber: formData.gstNumber,
      panNumber: formData.panNumber,
      bankDetails: formData.bankDetails,
      billingDetails: formData.billingDetails,
      clientType: formData.clientType,
      deliveryType: formData.deliveryType || 'Godown',
      status: formData.status,
      remarks: formData.remarks,
      createdAt: new Date().toISOString()
    };

    // Save using sync service (saves to localStorage AND syncs to backend)
    await syncService.create('tbbClients', newClient);

    // Also save to clients storage for sundry creditors
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const clientExists = allClients.find(c => c.id === newClient.id);
    if (!clientExists) {
      allClients.push(newClient);
      localStorage.setItem('clients', JSON.stringify(allClients));
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(new Event('clientDataUpdated'));

    console.log('Client Master Data:', newClient);
    alert(`Client "${formData.companyName}" created successfully!\n\nClient Code: ${newClient.code}\n\nThis client is now available for selection in LR booking forms.`);

    // Reset form
    window.location.reload();
  };

  const addAdditionalContact = () => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        { name: '', designation: '', mobile: '', email: '' }
      ]
    }));
    setShowAdditionalContact(true);
  };

  const removeAdditionalContact = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalContact = (index, field, value) => {
    const newContacts = [...formData.additionalContacts];
    newContacts[index][field] = value;
    setFormData(prev => ({ ...prev, additionalContacts: newContacts }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
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
          border-left: 4px solid #6366f1;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.1);
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
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
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
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #6366f1;
        }
        
        .btn-secondary:hover {
          background: #6366f1;
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        
        .btn-danger:hover {
          background: #dc2626;
        }
        
        .toggle-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #64748b;
        }
        
        .toggle-btn.active {
          background: #6366f1;
          color: white;
          border-color: #6366f1;
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
        
        .contact-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-active {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-inactive {
          background: #fee2e2;
          color: #991b1b;
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
            Client Master
          </h1>
          <p className="text-slate-600 text-lg">TBB Client Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Client Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.clientCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Client Type</label>
                <select
                  value={formData.clientType}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientType: e.target.value }))}
                  required
                >
                  <option value="TBB">TBB (To Be Billed) - Sundry Creditor</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit - Sundry Creditor</option>
                </select>
                {(formData.clientType === 'TBB' || formData.clientType === 'Credit') && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    fontWeight: 600
                  }}>
                    📋 Sundry Creditor
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
                  <option value="Suspended">Suspended</option>
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
                  placeholder="Enter registered company name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Trade Name / DBA</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                  placeholder="Doing Business As (Optional)"
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
                  placeholder="City"
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
                  placeholder="State"
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
                  placeholder="6 digits"
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

          {/* Primary Contact Person */}
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
                  placeholder="Full Name"
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
                  placeholder="Manager, Director, etc."
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
                  placeholder="10 digits"
                  maxLength="10"
                  pattern="[0-9]{10}"
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
                  placeholder="Landline with STD code"
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
                  placeholder="email@example.com"
                  required
                />
              </div>
            </div>
          </div>

          {/* Additional Contacts */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Additional Contacts
              </h2>
              <button type="button" className="btn btn-secondary" onClick={addAdditionalContact}>
                <Plus size={16} /> Add Contact
              </button>
            </div>
            
            {formData.additionalContacts.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>No additional contacts added</p>
            ) : (
              formData.additionalContacts.map((contact, index) => (
                <div key={index} className="contact-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
                      <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Contact {index + 1}
                    </h4>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeAdditionalContact(index)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  
                  <div className="grid-2" style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={contact.name}
                      onChange={(e) => updateAdditionalContact(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Designation"
                      value={contact.designation}
                      onChange={(e) => updateAdditionalContact(index, 'designation', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid-2">
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={contact.mobile}
                      onChange={(e) => updateAdditionalContact(index, 'mobile', e.target.value)}
                      maxLength="10"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contact.email}
                      onChange={(e) => updateAdditionalContact(index, 'email', e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tax & Legal Information */}
          <div className="form-section">
            <h2 className="section-title">Tax & Legal Information</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>GST Number *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="isUnregisteredPerson"
                    checked={formData.isUnregisteredPerson}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        isUnregisteredPerson: e.target.checked,
                        gstNumber: e.target.checked ? 'URP' : ''
                      }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isUnregisteredPerson" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                    Unregistered Person (URP)
                  </label>
                </div>
                <input
                  type="text"
                  className="mono"
                  value={formData.gstNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    // Allow URP or regular GST format
                    if (value === 'URP' || value.startsWith('URP')) {
                      setFormData(prev => ({ ...prev, gstNumber: 'URP', isUnregisteredPerson: true }));
                    } else {
                      setFormData(prev => ({ ...prev, gstNumber: value, isUnregisteredPerson: false }));
                    }
                  }}
                  placeholder={formData.isUnregisteredPerson ? "URP" : "15 characters or URP"}
                  maxLength={formData.isUnregisteredPerson ? 3 : 15}
                  pattern={formData.isUnregisteredPerson ? undefined : "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"}
                  style={{ textTransform: 'uppercase' }}
                  required
                  readOnly={formData.isUnregisteredPerson}
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
                  placeholder="10 characters"
                  maxLength="10"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Bank Details */}
          <div className="form-section">
            <h2 className="section-title">Bank Details (Optional)</h2>
            
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
                  placeholder="As per bank records"
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
                  placeholder="Bank account number"
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
                  placeholder="Bank name"
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
                  placeholder="Branch name"
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
                  placeholder="11 characters"
                  maxLength="11"
                  pattern="[A-Z]{4}0[A-Z0-9]{6}"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Billing & Credit Details */}
          <div className="form-section">
            <h2 className="section-title">Billing & Credit Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Credit Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.billingDetails.creditLimit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, creditLimit: e.target.value }
                  }))}
                  placeholder="Maximum credit allowed"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Credit Days</label>
                <input
                  type="number"
                  value={formData.billingDetails.creditDays}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, creditDays: e.target.value }
                  }))}
                  placeholder="Number of days"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Payment Terms</label>
                <select
                  value={formData.billingDetails.paymentTerms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, paymentTerms: e.target.value }
                  }))}
                >
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Net 90">Net 90 Days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="Advance">Advance Payment</option>
                </select>
              </div>
            </div>
            
            {/* Delivery Type - Only for TBB clients */}
            {(formData.clientType === 'TBB') && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Default Delivery Type *</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.deliveryType === 'Godown' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Godown' }))}
                  >
                    Godown Delivery
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.deliveryType === 'Door' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Door' }))}
                  >
                    Door Delivery
                  </button>
                </div>
                <small style={{ 
                  display: 'block', 
                  marginTop: '4px', 
                  color: '#64748b', 
                  fontSize: '0.75rem' 
                }}>
                  This will be the default delivery type when booking LRs for this client. Can be changed per LR.
                </small>
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
                placeholder="Any special instructions, preferences, or notes about this client..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Save Client Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
