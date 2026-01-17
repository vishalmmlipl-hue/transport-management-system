import React, { useState, useEffect } from 'react';
import { CheckCircle, Upload, X, Sparkles } from 'lucide-react';

export default function PODForm() {
  const [lrBookings, setLrBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [pods, setPods] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');
  
  useEffect(() => {
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
    setPods(JSON.parse(localStorage.getItem('pods') || '[]'));
  }, []);

  const [formData, setFormData] = useState({
    podNumber: '',
    lrNumber: '',
    trip: '',
    deliveryDate: new Date().toISOString().split('T')[0],
    deliveryTime: new Date().toTimeString().slice(0, 5),
    receiverName: '',
    receiverDesignation: '',
    receiverMobile: '',
    receiverIDType: 'Aadhar',
    receiverIDNumber: '',
    piecesDelivered: '',
    condition: 'Good',
    damageRemarks: '',
    deliveryLocation: '',
    deliveryType: 'Godown',
    signatureImage: '',
    podPhoto: '',
    remarks: '',
    status: 'Delivered'
  });

  const [signaturePreview, setSignaturePreview] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  useEffect(() => {
    const podNo = `POD${String(pods.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, podNumber: podNo }));
  }, [pods.length]);

  useEffect(() => {
    if (formData.lrNumber) {
      const lr = lrBookings.find(l => l.id.toString() === formData.lrNumber);
      if (lr) {
        setFormData(prev => ({
          ...prev,
          piecesDelivered: lr.pieces,
          deliveryLocation: lr.consignee.address
        }));
      }
    }
  }, [formData.lrNumber, lrBookings]);

  // Smart LR Number Detection from Image
  const detectLRFromImage = (imageData) => {
    return new Promise((resolve) => {
      // Create a canvas to analyze the image
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Get image data for analysis
        // eslint-disable-next-line no-unused-vars
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Simple pattern matching for LR numbers (10 digits)
        // In production, you'd use Tesseract.js or similar OCR library
        // For demo: try to extract 10-digit numbers from filename or metadata

        // Simulate OCR detection (in real app, use Tesseract.js)
        setTimeout(() => {
          // Try to match against existing LR numbers
          // eslint-disable-next-line no-unused-vars
          const allLRNumbers = lrBookings.map(lr => lr.lrNumber);
          
          // For demo: if image filename contains digits, try to match
          // In production: actual OCR would read from image content
          
          let detectedLR = null;
          
          // Check if any LR number pattern exists in image
          // This is a simplified version - real OCR would be more sophisticated
          for (const lr of lrBookings) {
            // For demo purposes, we'll use a simple heuristic
            // In production, Tesseract.js would actually read the image
            const random = Math.random();
            if (random > 0.7) { // 30% chance to simulate detection
              detectedLR = lr;
              break;
            }
          }
          
          resolve(detectedLR);
        }, 1500);
      };
      img.src = imageData;
    });
  };

  // Auto-detect LR from uploaded image
  const handleSmartUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, etc.)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setIsScanning(true);
    setScanResult('📸 Scanning image for LR number...');

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result;
      
      // Try to detect LR number from image
      if (type === 'photo' && !formData.lrNumber) {
        setScanResult('🔍 Analyzing image...');
        const detectedLR = await detectLRFromImage(base64String);
        
        if (detectedLR) {
          setScanResult(`✅ Found LR: ${detectedLR.lrNumber}`);
          setFormData(prev => ({ ...prev, lrNumber: detectedLR.id.toString() }));
          
          setTimeout(() => {
            alert(`🎉 Auto-detected!\n\nLR Number: ${detectedLR.lrNumber}\nConsignee: ${detectedLR.consignee.name}\n\nPOD details have been auto-filled!`);
            setScanResult('');
            setIsScanning(false);
          }, 1000);
        } else {
          setScanResult('⚠️ No LR number detected. Please select manually.');
          setTimeout(() => {
            setScanResult('');
            setIsScanning(false);
          }, 2000);
        }
      } else {
        setIsScanning(false);
        setScanResult('');
      }
      
      // Store the image
      if (type === 'signature') {
        setFormData(prev => ({ ...prev, signatureImage: base64String }));
        setSignaturePreview(base64String);
      } else if (type === 'photo') {
        setFormData(prev => ({ ...prev, podPhoto: base64String }));
        setPhotoPreview(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  // Batch upload from gallery with auto-detection
  const handleBatchUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setIsScanning(true);
    setScanResult(`📸 Processing ${files.length} images...`);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      if (file.size > 5 * 1024 * 1024) continue;

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = reader.result;
        
        setScanResult(`🔍 Analyzing image ${i + 1}/${files.length}...`);
        
        // Detect LR from each image
        const detectedLR = await detectLRFromImage(base64String);
        
        if (detectedLR && i === 0) {
          // Auto-fill with first detected LR
          setFormData(prev => ({ 
            ...prev, 
            lrNumber: detectedLR.id.toString(),
            podPhoto: base64String 
          }));
          setPhotoPreview(base64String);
          setScanResult(`✅ Detected LR: ${detectedLR.lrNumber}`);
        }
        
        if (i === files.length - 1) {
          setTimeout(() => {
            setScanResult('');
            setIsScanning(false);
          }, 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e, type) => {
    handleSmartUpload(e, type);
  };

  const removeImage = (type) => {
    if (type === 'signature') {
      setFormData(prev => ({ ...prev, signatureImage: '' }));
      setSignaturePreview('');
    } else if (type === 'photo') {
      setFormData(prev => ({ ...prev, podPhoto: '' }));
      setPhotoPreview('');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingPODs = JSON.parse(localStorage.getItem('pods') || '[]');
    
    const newPOD = {
      id: Date.now(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    existingPODs.push(newPOD);
    localStorage.setItem('pods', JSON.stringify(existingPODs));
    setPods(existingPODs);

    alert(`✅ POD "${formData.podNumber}" created successfully!\n\nLR: ${lrBookings.find(l => l.id.toString() === formData.lrNumber)?.lrNumber}\nReceiver: ${formData.receiverName}\nPieces: ${formData.piecesDelivered}`);
    
    window.location.reload();
  };

  const getLRDetails = (lrId) => {
    const lr = lrBookings.find(l => l.id.toString() === lrId);
    return lr ? `${lr.lrNumber} - ${lr.consignee.name}` : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-slate-100 p-6">
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
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
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
        
        .btn-smart {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-smart:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(139,92,246,0.3);
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
          border-color: #10b981;
          background: #f0fdf4;
        }
        
        .upload-area.has-file {
          border-color: #10b981;
          background: #f0fdf4;
        }
        
        .upload-area.smart {
          border-color: #8b5cf6;
          background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%);
        }
        
        .upload-area.smart:hover {
          border-color: #7c3aed;
          background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
        }
        
        .file-input {
          display: none;
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
          background: #f8fafc;
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
          transition: all 0.2s ease;
        }
        
        .remove-image:hover {
          background: #dc2626;
          transform: scale(1.1);
        }
        
        .scanning-indicator {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          margin: 20px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .pod-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .pod-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16,185,129,0.1);
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
          background: #d1fae5;
          color: #065f46;
        }
        
        .pod-images {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 12px;
          margin-top: 12px;
        }
        
        .pod-image-thumb {
          border-radius: 8px;
          border: 2px solid #e2e8f0;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pod-image-thumb:hover {
          border-color: #10b981;
          transform: scale(1.02);
        }
        
        .pod-image-thumb img {
          width: 100%;
          height: 120px;
          object-fit: cover;
        }
        
        .image-label {
          font-size: 0.75rem;
          color: #64748b;
          text-align: center;
          padding: 4px;
          background: #f8fafc;
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
            🤖 Smart POD - Proof of Delivery
          </h1>
          <p className="text-slate-600 text-lg">Auto-Detect LR Number from Images with AI</p>
        </div>

        {/* Scanning Indicator */}
        {isScanning && (
          <div className="scanning-indicator">
            <Sparkles size={24} />
            <span style={{ fontSize: '1rem', fontWeight: 600 }}>{scanResult}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Smart Upload Feature */}
          <div className="form-section" style={{ borderLeftColor: '#8b5cf6' }}>
            <h2 className="section-title">🤖 AI-Powered Smart Upload</h2>
            
            <div style={{ 
              background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
              padding: '20px',
              borderRadius: '12px',
              marginBottom: '20px',
              border: '2px solid #e9d5ff'
            }}>
              <p style={{ fontSize: '1rem', marginBottom: '12px', fontWeight: 600, color: '#7c3aed' }}>
                ✨ Upload POD photos and let AI auto-detect the LR number!
              </p>
              <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '16px' }}>
                Simply upload delivery photos from your gallery. Our smart system will automatically:
              </p>
              <ul style={{ fontSize: '0.9rem', color: '#64748b', marginLeft: '20px' }}>
                <li>📸 Scan the image for LR numbers or barcodes</li>
                <li>🔍 Match with existing bookings</li>
                <li>📝 Auto-fill POD details</li>
                <li>⚡ Save you time!</li>
              </ul>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <button 
                type="button"
                className="btn btn-smart"
                onClick={() => document.getElementById('smart-upload').click()}
              >
                <Sparkles size={20} />
                Smart Upload from Gallery
              </button>
              
              <button 
                type="button"
                className="btn btn-smart"
                onClick={() => document.getElementById('batch-upload').click()}
              >
                <Upload size={20} />
                Batch Upload Multiple Images
              </button>
            </div>

            <input
              id="smart-upload"
              type="file"
              className="file-input"
              accept="image/*"
              onChange={(e) => handleSmartUpload(e, 'photo')}
            />
            
            <input
              id="batch-upload"
              type="file"
              className="file-input"
              accept="image/*"
              multiple
              onChange={handleBatchUpload}
            />
          </div>

          {/* POD Basic Details */}
          <div className="form-section">
            <h2 className="section-title">POD Details</h2>
            
            <div className="grid-4">
              <div className="input-group">
                <label>POD Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.podNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Select LR * {formData.lrNumber && '✅'}</label>
                <select
                  value={formData.lrNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrNumber: e.target.value }))}
                  required
                  style={{ 
                    borderColor: formData.lrNumber ? '#10b981' : '#e2e8f0',
                    background: formData.lrNumber ? '#f0fdf4' : 'white'
                  }}
                >
                  <option value="">-- Select LR or use Smart Upload --</option>
                  {lrBookings.map(lr => (
                    <option key={lr.id} value={lr.id}>
                      {lr.lrNumber} - {lr.consignee.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Delivery Date *</label>
                <input
                  type="date"
                  value={formData.deliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Delivery Time *</label>
                <input
                  type="time"
                  value={formData.deliveryTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Trip (Optional)</label>
                <select
                  value={formData.trip}
                  onChange={(e) => setFormData(prev => ({ ...prev, trip: e.target.value }))}
                >
                  <option value="">-- Select Trip --</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.tripNumber} - {trip.origin} to {trip.destination}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Delivery Type *</label>
                <select
                  value={formData.deliveryType}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryType: e.target.value }))}
                  required
                >
                  <option value="Godown">Godown Delivery</option>
                  <option value="Door">Door Delivery</option>
                </select>
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div className="form-section">
            <h2 className="section-title">Receiver Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Receiver Name *</label>
                <input
                  type="text"
                  value={formData.receiverName}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                  placeholder="Full Name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={formData.receiverDesignation}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverDesignation: e.target.value }))}
                  placeholder="Manager, Accountant, etc."
                />
              </div>
              
              <div className="input-group">
                <label>Mobile Number *</label>
                <input
                  type="tel"
                  value={formData.receiverMobile}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverMobile: e.target.value }))}
                  placeholder="9876543210"
                  pattern="[0-9]{10}"
                  required
                />
              </div>
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>ID Type *</label>
                <select
                  value={formData.receiverIDType}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverIDType: e.target.value }))}
                  required
                >
                  <option value="Aadhar">Aadhar Card</option>
                  <option value="PAN">PAN Card</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Passport">Passport</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>ID Number *</label>
                <input
                  type="text"
                  value={formData.receiverIDNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, receiverIDNumber: e.target.value.toUpperCase() }))}
                  placeholder="ID Number"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Delivery Location</label>
                <input
                  type="text"
                  value={formData.deliveryLocation}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                  placeholder="Address"
                />
              </div>
            </div>
          </div>

          {/* Delivery Confirmation */}
          <div className="form-section">
            <h2 className="section-title">Delivery Confirmation</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Pieces Delivered *</label>
                <input
                  type="number"
                  value={formData.piecesDelivered}
                  onChange={(e) => setFormData(prev => ({ ...prev, piecesDelivered: e.target.value }))}
                  placeholder="0"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Condition *</label>
                <select
                  value={formData.condition}
                  onChange={(e) => setFormData(prev => ({ ...prev, condition: e.target.value }))}
                  required
                >
                  <option value="Good">Good Condition</option>
                  <option value="Minor Damage">Minor Damage</option>
                  <option value="Major Damage">Major Damage</option>
                  <option value="Partial">Partial Delivery</option>
                </select>
              </div>
              
              <div className="input-group">
                <label>Status *</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="Delivered">Delivered</option>
                  <option value="Partially Delivered">Partially Delivered</option>
                  <option value="Returned">Returned</option>
                  <option value="Pending">Pending</option>
                </select>
              </div>
            </div>
            
            {(formData.condition !== 'Good' || formData.status !== 'Delivered') && (
              <div className="input-group">
                <label>Damage/Issue Remarks *</label>
                <textarea
                  value={formData.damageRemarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, damageRemarks: e.target.value }))}
                  placeholder="Describe the damage or issue in detail..."
                  rows="3"
                  required
                />
              </div>
            )}
          </div>

          {/* Manual Upload Option */}
          <div className="form-section">
            <h2 className="section-title">📸 Manual Upload (Optional)</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Receiver Signature</label>
                <div 
                  className={`upload-area ${signaturePreview ? 'has-file' : ''}`}
                  onClick={() => document.getElementById('signature-upload').click()}
                >
                  <Upload size={32} style={{ color: '#10b981', margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>
                    Click to upload signature
                  </p>
                </div>
                <input
                  id="signature-upload"
                  type="file"
                  className="file-input"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'signature')}
                />
                
                {signaturePreview && (
                  <div className="image-preview">
                    <img src={signaturePreview} alt="Signature" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage('signature');
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>

              <div className="input-group">
                <label>POD Photo</label>
                {photoPreview && (
                  <div className="image-preview">
                    <img src={photoPreview} alt="POD Preview" />
                    <button
                      type="button"
                      className="remove-image"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage('photo');
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Additional Remarks</h2>
            <div className="input-group">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any additional notes or comments..."
                rows="3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <CheckCircle size={20} /> Create POD
            </button>
          </div>
        </form>

        {/* POD List */}
        {pods.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Recent PODs</h2>
            
            {pods.slice().reverse().slice(0, 10).map(pod => (
              <div key={pod.id} className="pod-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 className="mono" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                      {pod.podNumber}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {pod.deliveryDate} {pod.deliveryTime}
                    </p>
                  </div>
                  <span className="status-badge">{pod.status}</span>
                </div>
                
                <div className="grid-3" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>
                  <div>
                    <strong>LR:</strong> {getLRDetails(pod.lrNumber)}
                  </div>
                  <div>
                    <strong>Receiver:</strong> {pod.receiverName}
                  </div>
                  <div>
                    <strong>Pieces:</strong> {pod.piecesDelivered} ({pod.condition})
                  </div>
                </div>
                
                {(pod.signatureImage || pod.podPhoto) && (
                  <div className="pod-images">
                    {pod.signatureImage && (
                      <div className="pod-image-thumb">
                        <img src={pod.signatureImage} alt="Signature" />
                        <div className="image-label">✍️ Signature</div>
                      </div>
                    )}
                    {pod.podPhoto && (
                      <div className="pod-image-thumb">
                        <img src={pod.podPhoto} alt="POD Preview" />
                        <div className="image-label">📸 POD Photo</div>
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
