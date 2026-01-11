import React, { useState } from 'react';
import { useFTLLRBookings, usePTLLRBookings, usePODs } from '../hooks/useDataSync';

const CreatePOD = () => {
  const { data: ftlBookings, loading: ftlLoading } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading } = usePTLLRBookings();
  const { create: createPOD } = usePODs();
  
  const [formData, setFormData] = useState({
    lrNumber: '',
    podFile: null,
    podFileName: '',
    idType: '',
    idNumber: '',
    mobileNumber: '',
    vehicleNumber: '',
    deliveryDate: '',
    remarks: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Combine bookings from both sources
  const bookings = [...(ftlBookings || []), ...(ptlBookings || [])];
  const loading = ftlLoading || ptlLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({
        ...prev,
        podFile: file,
        podFileName: file.name
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.lrNumber.trim()) {
      newErrors.lrNumber = 'LR Number is required';
    }
    if (!formData.podFile) {
      newErrors.podFile = 'POD file is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const podData = {
        lrNumber: formData.lrNumber,
        podFile: reader.result,
        podFileName: formData.podFileName,
        idType: formData.idType || '',
        idNumber: formData.idNumber || '',
        mobileNumber: formData.mobileNumber || '',
        vehicleNumber: formData.vehicleNumber || '',
        deliveryDate: formData.deliveryDate || '',
        remarks: formData.remarks || '',
        createdAt: new Date().toISOString()
      };

      try {
        setSaving(true);
        await createPOD(podData);
        alert('✅ POD created successfully on Render.com server!');

        window.dispatchEvent(new CustomEvent('podCreated', { detail: podData }));
        window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'pod', data: podData } }));
        
        setFormData({
          lrNumber: '',
          podFile: null,
          podFileName: '',
          idType: '',
          idNumber: '',
          mobileNumber: '',
          vehicleNumber: '',
          deliveryDate: '',
          remarks: '',
        });
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = '';
      } catch (error) {
        console.error('Error saving POD:', error);
        alert('❌ Error saving POD: ' + error.message);
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(formData.podFile);
  };

  if (loading) {
    return <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>Loading bookings from Render.com...</div>;
  }

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h2>Create POD</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            LR Number <span style={{ color: 'red' }}>*</span>
            <select
              name="lrNumber"
              value={formData.lrNumber}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.lrNumber ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">-- Select LR Number --</option>
              {bookings.map(booking => (
                <option key={booking.id} value={booking.lrNumber}>
                  LR #{booking.lrNumber} {booking.lrReferenceNumber ? `(Ref: ${booking.lrReferenceNumber})` : ''} | {booking.fromLocation} → {booking.toLocation}
                </option>
              ))}
            </select>
            {errors.lrNumber && <span style={{ color: 'red', fontSize: '12px' }}>{errors.lrNumber}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            POD File <span style={{ color: 'red' }}>*</span>
            <input
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.podFile ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            {formData.podFileName && <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>Selected: {formData.podFileName}</div>}
            {errors.podFile && <span style={{ color: 'red', fontSize: '12px' }}>{errors.podFile}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            ID Type (Optional)
            <select
              name="idType"
              value={formData.idType}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">-- Select ID Type --</option>
              <option value="Aadhar">Aadhar</option>
              <option value="PAN">PAN</option>
              <option value="Driving License">Driving License</option>
              <option value="Other">Other</option>
            </select>
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            ID Number (Optional)
            <input
              type="text"
              name="idNumber"
              value={formData.idNumber}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Mobile Number (Optional)
            <input
              type="text"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Vehicle Number (Optional)
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Delivery Date (Optional)
            <input
              type="date"
              name="deliveryDate"
              value={formData.deliveryDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Remarks (Optional)
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              rows="3"
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: saving ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Saving...' : 'Submit POD'}
        </button>
      </form>
    </div>
  );
};

export default CreatePOD;

