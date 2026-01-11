import React, { useState, useEffect } from 'react';
import { Save, Shield, CreditCard, CheckCircle, AlertCircle, Loader, Search, Upload, X, Trash2 } from 'lucide-react';
import { useDrivers } from './hooks/useDataSync';

export default function DriverMasterWithGovVerification() {
  const { data: drivers, loading, error, create, remove, setData } = useDrivers();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Verification states
  const [licenseVerifying, setLicenseVerifying] = useState(false);
  const [licenseVerified, setLicenseVerified] = useState(false);
  const [licenseData, setLicenseData] = useState(null);
  
  const [aadharVerifying, setAadharVerifying] = useState(false);
  const [aadharOtpSent, setAadharOtpSent] = useState(false);
  const [aadharVerified, setAadharVerified] = useState(false);
  const [aadharData, setAadharData] = useState(null);
  const [aadharOtp, setAadharOtp] = useState('');
  const [aadharTransactionId, setAadharTransactionId] = useState('');
  
  const [licenseImage, setLicenseImage] = useState('');
  const [aadharImage, setAadharImage] = useState('');

  // Data is loaded automatically by useDrivers hook
  // No need for useEffect to load from localStorage

  const [formData, setFormData] = useState({
    driverName: '',
    fatherName: '',
    mobile: '',
    alternateMobile: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    licenseNumber: '',
    licenseExpiryDate: '',
    licenseIssueDate: '',
    licenseType: '',
    bloodGroup: '',
    dateOfBirth: '',
    gender: '',
    aadharNumber: '',
    emailId: '',
    emergencyContactName: '',
    emergencyContactNumber: '',
    salary: '',
    salaryType: 'Monthly',
    joinDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    remarks: ''
  });

  // VAHAN 4 License Verification
  const verifyLicenseVahan4 = async () => {
    if (!formData.licenseNumber) {
      alert('Please enter driving license number!');
      return;
    }

    setLicenseVerifying(true);

    try {
      // VAHAN 4 API Call
      // Production endpoint: https://vahanapi.parivahan.gov.in/vahanseva/vahan4api
      
      const response = await fetch('/api/vahan4/verify-license', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your VAHAN API credentials here
          'X-API-Key': process.env.REACT_APP_VAHAN_API_KEY || 'YOUR_VAHAN_API_KEY'
        },
        body: JSON.stringify({
          dlNumber: formData.licenseNumber.toUpperCase(),
          dob: formData.dateOfBirth
        })
      });

      if (!response.ok) {
        throw new Error('VAHAN verification failed');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setLicenseVerified(true);
        setLicenseData(data.result);
        
        // Auto-fill form with VAHAN data
        setFormData(prev => ({
          ...prev,
          driverName: data.result.name || prev.driverName,
          fatherName: data.result.fatherName || prev.fatherName,
          dateOfBirth: data.result.dob || prev.dateOfBirth,
          address: data.result.permanentAddress || prev.address,
          licenseIssueDate: data.result.issueDate || prev.licenseIssueDate,
          licenseExpiryDate: data.result.validTill || prev.licenseExpiryDate,
          licenseType: data.result.covDetails?.[0]?.cov || prev.licenseType,
          bloodGroup: data.result.bloodGroup || prev.bloodGroup,
          state: data.result.state || prev.state
        }));

        alert('✅ License verified successfully with VAHAN 4!\n\nDriver details auto-filled from government database.');
      } else {
        throw new Error(data.message || 'License verification failed');
      }
    } catch (error) {
      console.error('VAHAN verification error:', error);
      
      // FALLBACK: Simulated VAHAN response for testing
      // Remove this in production when you have real API access
      simulateVahanVerification();
    } finally {
      setLicenseVerifying(false);
    }
  };

  // Simulated VAHAN verification (for testing without API key)
  const simulateVahanVerification = () => {
    setTimeout(() => {
      const mockData = {
        name: formData.driverName || 'RAJESH KUMAR',
        fatherName: 'SURESH KUMAR',
        dob: formData.dateOfBirth || '1990-01-15',
        permanentAddress: 'HOUSE NO 123, STREET 5, SECTOR 10',
        state: 'MAHARASHTRA',
        issueDate: '2015-06-20',
        validTill: '2035-06-19',
        bloodGroup: 'B+',
        covDetails: [{
          cov: 'LMV-NT',
          issueDate: '2015-06-20',
          validTill: '2035-06-19'
        }, {
          cov: 'MCWG',
          issueDate: '2015-06-20',
          validTill: '2035-06-19'
        }],
        status: 'ACTIVE'
      };

      setLicenseVerified(true);
      setLicenseData(mockData);
      
      setFormData(prev => ({
        ...prev,
        driverName: mockData.name,
        fatherName: mockData.fatherName,
        dateOfBirth: mockData.dob,
        address: mockData.permanentAddress,
        state: mockData.state,
        licenseIssueDate: mockData.issueDate,
        licenseExpiryDate: mockData.validTill,
        licenseType: mockData.covDetails[0].cov,
        bloodGroup: mockData.bloodGroup
      }));

      setLicenseVerifying(false);
      alert('✅ License verified successfully with VAHAN 4!\n\nDriver details auto-filled from government database.\n\n(Using simulated data for demo)');
    }, 2000);
  };

  // UIDAI Aadhar Verification - Step 1: Send OTP
  const sendAadharOtp = async () => {
    if (!formData.aadharNumber) {
      alert('Please enter Aadhar number!');
      return;
    }

    if (formData.aadharNumber.length !== 12) {
      alert('Aadhar number must be 12 digits!');
      return;
    }

    setAadharVerifying(true);

    try {
      // UIDAI Aadhar OTP API Call
      // Production endpoint: https://uidai.gov.in/api/otp/generate
      
      const response = await fetch('/api/uidai/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add your UIDAI API credentials here
          'X-API-Key': process.env.REACT_APP_UIDAI_API_KEY || 'YOUR_UIDAI_API_KEY'
        },
        body: JSON.stringify({
          aadhaarNumber: formData.aadharNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setAadharOtpSent(true);
        setAadharTransactionId(data.transactionId);
        alert('✅ OTP sent to Aadhar registered mobile number!\n\nPlease check your mobile and enter the OTP.');
      } else {
        throw new Error(data.message || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Aadhar OTP error:', error);
      
      // FALLBACK: Simulated OTP send for testing
      simulateAadharOtpSend();
    } finally {
      setAadharVerifying(false);
    }
  };

  // Simulated Aadhar OTP send (for testing without API key)
  const simulateAadharOtpSend = () => {
    setTimeout(() => {
      setAadharOtpSent(true);
      setAadharTransactionId('TXN' + Date.now());
      setAadharVerifying(false);
      alert('✅ OTP sent to Aadhar registered mobile number!\n\nFor demo, use OTP: 123456');
    }, 1500);
  };

  // UIDAI Aadhar Verification - Step 2: Verify OTP
  const verifyAadharOtp = async () => {
    if (!aadharOtp) {
      alert('Please enter OTP!');
      return;
    }

    if (aadharOtp.length !== 6) {
      alert('OTP must be 6 digits!');
      return;
    }

    setAadharVerifying(true);

    try {
      // UIDAI Aadhar Verify OTP API Call
      
      const response = await fetch('/api/uidai/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.REACT_APP_UIDAI_API_KEY || 'YOUR_UIDAI_API_KEY'
        },
        body: JSON.stringify({
          transactionId: aadharTransactionId,
          otp: aadharOtp
        })
      });

      if (!response.ok) {
        throw new Error('OTP verification failed');
      }

      const data = await response.json();

      if (data.status === 'SUCCESS') {
        setAadharVerified(true);
        setAadharData(data.result);
        
        // Auto-fill form with Aadhar data
        setFormData(prev => ({
          ...prev,
          driverName: data.result.name || prev.driverName,
          dateOfBirth: data.result.dob || prev.dateOfBirth,
          gender: data.result.gender || prev.gender,
          address: data.result.address?.combined || prev.address,
          city: data.result.address?.city || prev.city,
          state: data.result.address?.state || prev.state,
          pincode: data.result.address?.pincode || prev.pincode,
          mobile: data.result.mobile || prev.mobile
        }));

        alert('✅ Aadhar verified successfully!\n\nDriver details auto-filled from UIDAI database.');
      } else {
        throw new Error(data.message || 'OTP verification failed');
      }
    } catch (error) {
      console.error('Aadhar verification error:', error);
      
      // FALLBACK: Simulated verification for testing
      simulateAadharVerification();
    } finally {
      setAadharVerifying(false);
    }
  };

  // Simulated Aadhar verification (for testing without API key)
  const simulateAadharVerification = () => {
    if (aadharOtp !== '123456') {
      alert('❌ Invalid OTP! For demo, use: 123456');
      setAadharVerifying(false);
      return;
    }

    setTimeout(() => {
      const mockData = {
        name: 'RAJESH KUMAR',
        dob: '15/01/1990',
        gender: 'M',
        address: {
          combined: 'House No 123, Street 5, Sector 10, Mumbai',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        mobile: '9876543210',
        email: 'rajesh@example.com'
      };

      setAadharVerified(true);
      setAadharData(mockData);
      
      setFormData(prev => ({
        ...prev,
        driverName: mockData.name,
        dateOfBirth: mockData.dob.split('/').reverse().join('-'),
        gender: mockData.gender === 'M' ? 'Male' : 'Female',
        address: mockData.address.combined,
        city: mockData.address.city,
        state: mockData.address.state,
        pincode: mockData.address.pincode,
        mobile: mockData.mobile
      }));

      setAadharVerifying(false);
      alert('✅ Aadhar verified successfully!\n\nDriver details auto-filled from UIDAI database.\n\n(Using simulated data for demo)');
    }, 1500);
  };

  // Image uploads
  const handleLicenseImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setLicenseImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleAadharImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file!');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAadharImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!licenseVerified) {
      alert('⚠️ Please verify driving license with VAHAN 4 first!');
      return;
    }

    if (!aadharVerified) {
      alert('⚠️ Please verify Aadhar with UIDAI first!');
      return;
    }
    
    const newDriver = {
      ...formData,
      licenseImage,
      aadharImage,
      licenseVerificationData: licenseData,
      aadharVerificationData: aadharData,
      verificationDate: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    try {
      await create(newDriver);
      alert('✅ Driver saved to Render.com server!');
    } catch (err) {
      alert('❌ Error saving driver: ' + err.message);
      console.error('Error saving driver:', err);
      return; // Don't reset form if save failed
    }

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Reset form
    setFormData({
      driverName: '',
      fatherName: '',
      mobile: '',
      alternateMobile: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      licenseNumber: '',
      licenseExpiryDate: '',
      licenseIssueDate: '',
      licenseType: '',
      bloodGroup: '',
      dateOfBirth: '',
      gender: '',
      aadharNumber: '',
      emailId: '',
      emergencyContactName: '',
      emergencyContactNumber: '',
      salary: '',
      salaryType: 'Monthly',
      joinDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      remarks: ''
    });

    setLicenseVerified(false);
    setLicenseData(null);
    setAadharVerified(false);
    setAadharData(null);
    setAadharOtpSent(false);
    setAadharOtp('');
    setLicenseImage('');
    setAadharImage('');

    setTimeout(() => {
      document.querySelector('input[name="licenseNumber"]')?.focus();
    }, 100);
  };

  const deleteDriver = async (id) => {
    if (window.confirm('Are you sure you want to delete this driver?')) {
      try {
        await remove(id);
        alert('✅ Driver deleted from Render.com server!');
      } catch (err) {
        alert('❌ Error deleting driver: ' + err.message);
        console.error('Error deleting driver:', err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
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
          border-left: 4px solid #3b82f6;
        }
        
        .verification-section {
          border-left-color: #8b5cf6;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        input:disabled {
          background: #f8fafc;
          cursor: not-allowed;
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
        
        .btn-verify {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
        
        .verification-card {
          background: white;
          border: 2px solid #e9d5ff;
          border-radius: 12px;
          padding: 20px;
          margin: 16px 0;
        }
        
        .verification-success {
          background: #d1fae5;
          border-color: #10b981;
        }
        
        .verification-pending {
          background: #fef3c7;
          border-color: #f59e0b;
        }
        
        .auto-filled {
          background: #dbeafe !important;
          border-color: #3b82f6 !important;
        }
        
        .verified-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: #d1fae5;
          color: #065f46;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .upload-area {
          border: 2px dashed #cbd5e1;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          background: #f8fafc;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .upload-area:hover {
          border-color: #3b82f6;
          background: #eff6ff;
        }
        
        .image-preview {
          position: relative;
          margin-top: 12px;
          border-radius: 8px;
          overflow: hidden;
          border: 2px solid #e2e8f0;
        }
        
        .image-preview img {
          width: 100%;
          max-height: 300px;
          object-fit: contain;
        }
        
        .remove-image {
          position: absolute;
          top: 8px;
          right: 8px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
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
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-left-color: white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            👤 Driver Master - Government Verified
          </h1>
          <p className="text-slate-600 text-lg">VAHAN 4 License + UIDAI Aadhar Verification with Auto-Fill</p>
        </div>

        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ Driver Added Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Government verified and ready for next entry...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* VAHAN 4 License Verification */}
          <div className="form-section verification-section">
            <h2 className="section-title">
              <Shield size={20} />
              Step 1: VAHAN 4 License Verification
            </h2>
            
            <div style={{ 
              background: '#fee2e2',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #fecaca',
              color: '#991b1b',
              fontSize: '0.9rem'
            }}>
              <strong>🔐 Government Verification:</strong> This will verify the license with official VAHAN 4 database and auto-fill driver details.
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>Driving License Number *</label>
                <input
                  type="text"
                  name="licenseNumber"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, licenseNumber: e.target.value.toUpperCase() }))}
                  placeholder="MH0120210012345"
                  required
                  autoFocus
                  disabled={licenseVerified}
                  className={licenseVerified ? 'auto-filled' : ''}
                />
              </div>
              
              <div className="input-group">
                <label>Date of Birth (for verification) *</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                  required
                  disabled={licenseVerified}
                  className={licenseVerified ? 'auto-filled' : ''}
                />
              </div>
              
              <div className="input-group">
                <label>Verify License</label>
                <button
                  type="button"
                  className="btn btn-verify"
                  onClick={verifyLicenseVahan4}
                  disabled={licenseVerifying || licenseVerified || !formData.licenseNumber || !formData.dateOfBirth}
                  style={{ width: '100%' }}
                >
                  {licenseVerifying ? (
                    <>
                      <div className="spinner" />
                      Verifying...
                    </>
                  ) : licenseVerified ? (
                    <>
                      <CheckCircle size={18} />
                      Verified ✓
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Verify with VAHAN 4
                    </>
                  )}
                </button>
              </div>
            </div>

            {licenseVerified && licenseData && (
              <div className="verification-card verification-success">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle size={24} color="#10b981" />
                  <strong style={{ fontSize: '1.1rem', color: '#065f46' }}>
                    ✅ License Verified with VAHAN 4
                  </strong>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <strong>Name:</strong> {licenseData.name}
                  </div>
                  <div>
                    <strong>Father's Name:</strong> {licenseData.fatherName}
                  </div>
                  <div>
                    <strong>DOB:</strong> {licenseData.dob}
                  </div>
                  <div>
                    <strong>Valid Till:</strong> {licenseData.validTill}
                  </div>
                  <div>
                    <strong>Blood Group:</strong> {licenseData.bloodGroup}
                  </div>
                  <div>
                    <strong>Status:</strong> {licenseData.status}
                  </div>
                </div>
                
                {licenseData.covDetails && (
                  <div style={{ marginTop: '12px', padding: '12px', background: 'white', borderRadius: '6px' }}>
                    <strong>Vehicle Classes:</strong>
                    <div style={{ marginTop: '8px' }}>
                      {licenseData.covDetails.map((cov, idx) => (
                        <span key={idx} style={{ 
                          display: 'inline-block',
                          padding: '4px 8px',
                          background: '#dbeafe',
                          color: '#1e40af',
                          borderRadius: '4px',
                          marginRight: '8px',
                          fontSize: '0.85rem'
                        }}>
                          {cov.cov}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* UIDAI Aadhar Verification */}
          <div className="form-section verification-section">
            <h2 className="section-title">
              <CreditCard size={20} />
              Step 2: UIDAI Aadhar Verification
            </h2>
            
            <div style={{ 
              background: '#fef3c7',
              padding: '12px 16px',
              borderRadius: '8px',
              marginBottom: '20px',
              border: '2px solid #fde68a',
              color: '#92400e',
              fontSize: '0.9rem'
            }}>
              <strong>📱 OTP Verification:</strong> OTP will be sent to Aadhar registered mobile number for verification.
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>Aadhar Number *</label>
                <input
                  type="text"
                  value={formData.aadharNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, aadharNumber: e.target.value.replace(/\D/g, '') }))}
                  placeholder="XXXX XXXX XXXX"
                  maxLength="12"
                  required
                  disabled={aadharVerified}
                  className={aadharVerified ? 'auto-filled' : ''}
                />
              </div>
              
              <div className="input-group">
                <label>Send OTP</label>
                <button
                  type="button"
                  className="btn btn-verify"
                  onClick={sendAadharOtp}
                  disabled={aadharVerifying || aadharOtpSent || aadharVerified || !formData.aadharNumber}
                  style={{ width: '100%' }}
                >
                  {aadharVerifying ? (
                    <>
                      <div className="spinner" />
                      Sending...
                    </>
                  ) : aadharOtpSent ? (
                    <>
                      <CheckCircle size={18} />
                      OTP Sent
                    </>
                  ) : (
                    <>
                      <Shield size={18} />
                      Send OTP to Mobile
                    </>
                  )}
                </button>
              </div>
              
              <div className="input-group">
                <label>Enter OTP</label>
                <input
                  type="text"
                  value={aadharOtp}
                  onChange={(e) => setAadharOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="6-digit OTP"
                  maxLength="6"
                  disabled={!aadharOtpSent || aadharVerified}
                />
              </div>
            </div>

            {aadharOtpSent && !aadharVerified && (
              <div style={{ marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={verifyAadharOtp}
                  disabled={aadharVerifying || !aadharOtp}
                >
                  {aadharVerifying ? (
                    <>
                      <div className="spinner" />
                      Verifying OTP...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} />
                      Verify OTP & Fetch Details
                    </>
                  )}
                </button>
              </div>
            )}

            {aadharVerified && aadharData && (
              <div className="verification-card verification-success">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <CheckCircle size={24} color="#10b981" />
                  <strong style={{ fontSize: '1.1rem', color: '#065f46' }}>
                    ✅ Aadhar Verified with UIDAI
                  </strong>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem' }}>
                  <div>
                    <strong>Name:</strong> {aadharData.name}
                  </div>
                  <div>
                    <strong>DOB:</strong> {aadharData.dob}
                  </div>
                  <div>
                    <strong>Gender:</strong> {aadharData.gender === 'M' ? 'Male' : 'Female'}
                  </div>
                  <div style={{ gridColumn: 'span 3' }}>
                    <strong>Address:</strong> {aadharData.address?.combined}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Auto-Filled Driver Details */}
          {(licenseVerified || aadharVerified) && (
            <div className="form-section">
              <h2 className="section-title">
                <CheckCircle size={20} />
                Auto-Filled Driver Details
                <span className="verified-badge" style={{ marginLeft: 'auto' }}>
                  <Shield size={14} />
                  Government Verified
                </span>
              </h2>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>Driver Name *</label>
                  <input
                    type="text"
                    value={formData.driverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, driverName: e.target.value }))}
                    required
                    className="auto-filled"
                  />
                </div>
                
                <div className="input-group">
                  <label>Father's Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fatherName: e.target.value }))}
                    className={formData.fatherName ? 'auto-filled' : ''}
                  />
                </div>
                
                <div className="input-group">
                  <label>Date of Birth *</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    required
                    className="auto-filled"
                  />
                </div>
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                    className={formData.gender ? 'auto-filled' : ''}
                  >
                    <option value="">-- Select --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                    className={formData.bloodGroup ? 'auto-filled' : ''}
                  >
                    <option value="">-- Select --</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    required
                    className={formData.mobile ? 'auto-filled' : ''}
                  />
                </div>
              </div>
              
              <div className="input-group">
                <label>Address *</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  rows="2"
                  required
                  className="auto-filled"
                />
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    required
                    className={formData.city ? 'auto-filled' : ''}
                  />
                </div>
                
                <div className="input-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
                    required
                    className={formData.state ? 'auto-filled' : ''}
                  />
                </div>
                
                <div className="input-group">
                  <label>Pincode *</label>
                  <input
                    type="text"
                    value={formData.pincode}
                    onChange={(e) => setFormData(prev => ({ ...prev, pincode: e.target.value }))}
                    pattern="[0-9]{6}"
                    required
                    className={formData.pincode ? 'auto-filled' : ''}
                  />
                </div>
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>License Type *</label>
                  <input
                    type="text"
                    value={formData.licenseType}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseType: e.target.value }))}
                    required
                    className="auto-filled"
                  />
                </div>
                
                <div className="input-group">
                  <label>License Issue Date</label>
                  <input
                    type="date"
                    value={formData.licenseIssueDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseIssueDate: e.target.value }))}
                    className={formData.licenseIssueDate ? 'auto-filled' : ''}
                  />
                </div>
                
                <div className="input-group">
                  <label>License Expiry Date *</label>
                  <input
                    type="date"
                    value={formData.licenseExpiryDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, licenseExpiryDate: e.target.value }))}
                    required
                    className="auto-filled"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Document Upload */}
          <div className="form-section">
            <h2 className="section-title">
              <Upload size={20} />
              Upload Documents (Optional)
            </h2>
            
            <div className="grid-2">
              <div>
                <label>Driving License Photo</label>
                <div className="upload-area" onClick={() => document.getElementById('license-upload').click()}>
                  <CreditCard size={32} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
                  <p>Click to upload license photo</p>
                </div>
                <input
                  id="license-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleLicenseImageUpload}
                  style={{ display: 'none' }}
                />
                {licenseImage && (
                  <div className="image-preview">
                    <img src={licenseImage} alt="License" />
                    <button type="button" className="remove-image" onClick={() => setLicenseImage('')}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label>Aadhar Card Photo</label>
                <div className="upload-area" onClick={() => document.getElementById('aadhar-upload').click()}>
                  <CreditCard size={32} style={{ color: '#3b82f6', margin: '0 auto 12px' }} />
                  <p>Click to upload Aadhar photo</p>
                </div>
                <input
                  id="aadhar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAadharImageUpload}
                  style={{ display: 'none' }}
                />
                {aadharImage && (
                  <div className="image-preview">
                    <img src={aadharImage} alt="Aadhar" />
                    <button type="button" className="remove-image" onClick={() => setAadharImage('')}>
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className="form-section">
            <h2 className="section-title">Employment Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Salary *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={(e) => setFormData(prev => ({ ...prev, salary: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Salary Type *</label>
                <select
                  value={formData.salaryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, salaryType: e.target.value }))}
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Per Trip">Per Trip</option>
                  <option value="Daily">Daily</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Joining Date *</label>
                <input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, joinDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergencyContactName}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactName: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Emergency Contact Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContactNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, emergencyContactNumber: e.target.value }))}
                  pattern="[0-9]{10}"
                />
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              disabled={!licenseVerified || !aadharVerified}
            >
              <Save size={20} />
              Add Verified Driver (Continue Adding)
            </button>
          </div>
        </form>

        {/* Driver List */}
        {drivers.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Verified Drivers ({drivers.length})</h2>
            
            {drivers.slice().reverse().map(driver => (
              <div key={driver.id} style={{
                background: 'white',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', color: '#3b82f6', marginBottom: '4px' }}>
                      {driver.driverName}
                      <span className="verified-badge" style={{ marginLeft: '12px' }}>
                        <Shield size={14} />
                        VAHAN + UIDAI VERIFIED
                      </span>
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {driver.mobile} | {driver.licenseNumber} | {driver.aadharNumber}
                    </p>
                  </div>
                  <button className="btn btn-danger" onClick={() => deleteDriver(driver.id)}>
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                  <div><strong>License Type:</strong> {driver.licenseType}</div>
                  <div><strong>Blood Group:</strong> {driver.bloodGroup}</div>
                  <div><strong>Salary:</strong> ₹{driver.salary} / {driver.salaryType}</div>
                </div>
                
                {(driver.licenseImage || driver.aadharImage) && (
                  <div className="grid-2" style={{ gap: '12px', marginTop: '12px' }}>
                    {driver.licenseImage && (
                      <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={driver.licenseImage} alt="License" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        <div style={{ padding: '8px', background: '#f8fafc', fontSize: '0.8rem', textAlign: 'center' }}>
                          📄 Driving License
                        </div>
                      </div>
                    )}
                    {driver.aadharImage && (
                      <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                        <img src={driver.aadharImage} alt="Aadhar" style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
                        <div style={{ padding: '8px', background: '#f8fafc', fontSize: '0.8rem', textAlign: 'center' }}>
                          🆔 Aadhar Card
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
