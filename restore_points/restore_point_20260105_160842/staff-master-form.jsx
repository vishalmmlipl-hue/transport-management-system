import React, { useState, useEffect } from 'react';
import { Save, Users } from 'lucide-react';

export default function StaffMasterForm() {
  const [branches, setBranches] = useState([]);
  
  // Load branches from localStorage
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const activeBranches = storedBranches.filter(b => b.status === 'Active');
    setBranches(activeBranches);
  }, []);

  const [formData, setFormData] = useState({
    staffCode: '',
    staffName: '',
    fatherName: '',
    dateOfBirth: '',
    bloodGroup: '',
    branch: '',
    designation: '',
    department: '',
    contactDetails: {
      mobile: '',
      alternateMobile: '',
      email: '',
      emergencyContact: '',
      emergencyContactName: ''
    },
    address: {
      currentAddress: '',
      permanentAddress: '',
      city: '',
      state: '',
      pincode: ''
    },
    aadharNumber: '',
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    salaryType: 'Monthly',
    salaryDetails: {
      monthlySalary: '',
      dailyWages: ''
    },
    joiningDate: '',
    status: 'Active',
    remarks: ''
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const departments = [
    'Operations',
    'Administration',
    'Accounts',
    'HR',
    'Sales',
    'Marketing',
    'IT',
    'Warehouse',
    'Loading/Unloading',
    'Security',
    'Cleaning',
    'Maintenance',
    'Others'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingStaff = JSON.parse(localStorage.getItem('staff') || '[]');
    
    const newStaff = {
      id: Date.now(),
      code: formData.staffCode || `STF${String(existingStaff.length + 1).padStart(3, '0')}`,
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    existingStaff.push(newStaff);
    localStorage.setItem('staff', JSON.stringify(existingStaff));
    
    const salaryInfo = formData.salaryType === 'Monthly' 
      ? `Monthly Salary: ₹${formData.salaryDetails.monthlySalary}`
      : `Daily Wages: ₹${formData.salaryDetails.dailyWages}`;
    
    const selectedBranch = branches.find(b => b.id.toString() === formData.branch);
    const branchInfo = selectedBranch ? `\nBranch: ${selectedBranch.branchName} (${selectedBranch.address.city})` : '';
    
    alert(`Staff "${formData.staffName}" onboarded successfully!\n\nStaff Code: ${newStaff.code}\nDepartment: ${formData.department}${branchInfo}\n${salaryInfo}`);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-pink-50 to-slate-100 p-6">
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
          border-left: 4px solid #ec4899;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(236,72,153,0.1);
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
          border-color: #ec4899;
          box-shadow: 0 0 0 3px rgba(236,72,153,0.1);
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
          background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(236,72,153,0.3);
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
          background: #ec4899;
          color: white;
          border-color: #ec4899;
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
            Staff Master
          </h1>
          <p className="text-slate-600 text-lg">Staff Onboarding & Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Staff Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.staffCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Staff Name *</label>
                <input
                  type="text"
                  value={formData.staffName}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                  placeholder="Full name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Father's Name *</label>
                <input
                  type="text"
                  value={formData.fatherName}
                  onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                  placeholder="Father's name"
                  required
                />
              </div>
            </div>

            <div className="grid-4">
              <div className="input-group">
                <label>Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                >
                  <option value="">-- Select --</option>
                  {bloodGroups.map(group => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Branch *</label>
                {branches.length === 0 ? (
                  <div style={{
                    padding: '10px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.85rem'
                  }}>
                    ⚠️ No branches available. Please add branches first.
                  </div>
                ) : (
                  <select
                    value={formData.branch}
                    onChange={(e) => setFormData(prev => ({ ...prev, branch: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName} ({branch.address.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="input-group">
                <label>Designation *</label>
                <input
                  type="text"
                  value={formData.designation}
                  onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                  placeholder="e.g., Manager, Clerk"
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Department *</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  required
                >
                  <option value="">-- Select --</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                required
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Suspended">Suspended</option>
                <option value="Resigned">Resigned</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-section">
            <h2 className="section-title">Contact Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.contactDetails.mobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, mobile: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Alternate Mobile</label>
                <input
                  type="tel"
                  value={formData.contactDetails.alternateMobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, alternateMobile: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                />
              </div>
              
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.contactDetails.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, email: e.target.value }
                  }))}
                  placeholder="email@example.com"
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Emergency Contact Name *</label>
                <input
                  type="text"
                  value={formData.contactDetails.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, emergencyContactName: e.target.value }
                  }))}
                  placeholder="Name of emergency contact person"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Emergency Contact Number *</label>
                <input
                  type="tel"
                  value={formData.contactDetails.emergencyContact}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    contactDetails: { ...prev.contactDetails, emergencyContact: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                  required
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="form-section">
            <h2 className="section-title">Address Details</h2>
            
            <div className="input-group">
              <label>Current Address *</label>
              <textarea
                value={formData.address.currentAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, currentAddress: e.target.value }
                }))}
                placeholder="Complete current address"
                rows="2"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Permanent Address *</label>
              <textarea
                value={formData.address.permanentAddress}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, permanentAddress: e.target.value }
                }))}
                placeholder="Complete permanent address"
                rows="2"
                required
              />
            </div>
            
            <div className="grid-3">
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
            </div>
          </div>

          {/* Identity Documents */}
          <div className="form-section">
            <h2 className="section-title">Identity Documents</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Aadhar Number *</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value }))}
                  placeholder="12 digits"
                  maxLength="12"
                  pattern="[0-9]{12}"
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
                  placeholder="10 characters"
                  maxLength="10"
                  style={{ textTransform: 'uppercase' }}
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
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Salary Details */}
          <div className="form-section">
            <h2 className="section-title">Salary Details</h2>
            
            <div>
              <label style={{ marginBottom: '8px' }}>Salary Type *</label>
              <div className="toggle-group">
                <button
                  type="button"
                  className={`toggle-btn ${formData.salaryType === 'Monthly' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    salaryType: 'Monthly',
                    salaryDetails: { ...prev.salaryDetails, dailyWages: '' }
                  }))}
                >
                  Monthly Salary
                </button>
                <button
                  type="button"
                  className={`toggle-btn ${formData.salaryType === 'Daily' ? 'active' : ''}`}
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    salaryType: 'Daily',
                    salaryDetails: { ...prev.salaryDetails, monthlySalary: '' }
                  }))}
                >
                  Daily Wages
                </button>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  value={formData.joiningDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joiningDate: e.target.value }))}
                  required
                />
              </div>
              
              {formData.salaryType === 'Monthly' ? (
                <div className="input-group">
                  <label>Monthly Salary (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salaryDetails.monthlySalary}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salaryDetails: { ...prev.salaryDetails, monthlySalary: e.target.value }
                    }))}
                    placeholder="Monthly salary amount"
                    min="0"
                    required
                  />
                </div>
              ) : (
                <div className="input-group">
                  <label>Daily Wages (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.salaryDetails.dailyWages}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      salaryDetails: { ...prev.salaryDetails, dailyWages: e.target.value }
                    }))}
                    placeholder="Daily wages amount"
                    min="0"
                    required
                  />
                </div>
              )}
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
                placeholder="Any special notes, skills, or other relevant information..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Save Staff Master
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
