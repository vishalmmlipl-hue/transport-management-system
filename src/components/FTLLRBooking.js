import React, { useState } from 'react';
import { useFTLLRBookings } from '../hooks/useDataSync';

const FTLLRBooking = () => {
  const { create: createFTLBooking } = useFTLLRBookings();
  const [formData, setFormData] = useState({
    lrNumber: '',
    lrReferenceNumber: '',
    fromLocation: '',
    toLocation: '',
    invoiceNumber: '',
    ewaybillNumber: '',
    ewaybillDate: '',
    branch: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.lrNumber.trim()) {
      newErrors.lrNumber = 'LR Number is required';
    }
    if (!formData.fromLocation.trim()) {
      newErrors.fromLocation = 'From Location is required';
    }
    if (!formData.toLocation.trim()) {
      newErrors.toLocation = 'To Location is required';
    }
    if (!formData.branch.trim()) {
      newErrors.branch = 'Branch is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const bookingData = {
      type: 'FTL',
      ...formData,
      createdAt: new Date().toISOString()
    };
    
    try {
      setSaving(true);
      await createFTLBooking(bookingData);
      alert('✅ FTL Booking saved to Render.com server!');
      
      window.dispatchEvent(new CustomEvent('lrBookingCreated', { detail: bookingData }));
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'ftlBooking', data: bookingData } }));
      
      setFormData({
        lrNumber: '',
        lrReferenceNumber: '',
        fromLocation: '',
        toLocation: '',
        invoiceNumber: '',
        ewaybillNumber: '',
        ewaybillDate: '',
        branch: '',
      });
    } catch (error) {
      console.error('Error saving FTL booking:', error);
      alert('❌ Error saving booking: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto', padding: '20px' }}>
      <h2>FTL LR Booking</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>
            LR Number <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
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
            />
            {errors.lrNumber && <span style={{ color: 'red', fontSize: '12px' }}>{errors.lrNumber}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            LR Reference Number
            <input
              type="text"
              name="lrReferenceNumber"
              value={formData.lrReferenceNumber}
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
            From Location <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              name="fromLocation"
              value={formData.fromLocation}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.fromLocation ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            {errors.fromLocation && <span style={{ color: 'red', fontSize: '12px' }}>{errors.fromLocation}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            To Location <span style={{ color: 'red' }}>*</span>
            <input
              type="text"
              name="toLocation"
              value={formData.toLocation}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.toLocation ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
            {errors.toLocation && <span style={{ color: 'red', fontSize: '12px' }}>{errors.toLocation}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Branch <span style={{ color: 'red' }}>*</span>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '8px',
                marginTop: '5px',
                border: errors.branch ? '1px solid red' : '1px solid #ccc',
                borderRadius: '4px'
              }}
            >
              <option value="">-- Select Branch --</option>
              <option value="Branch 1">Branch 1</option>
              <option value="Branch 2">Branch 2</option>
              <option value="Branch 3">Branch 3</option>
            </select>
            {errors.branch && <span style={{ color: 'red', fontSize: '12px' }}>{errors.branch}</span>}
          </label>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Invoice Number (Optional)
            <input
              type="text"
              name="invoiceNumber"
              value={formData.invoiceNumber}
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
            Ewaybill Number (Optional)
            <input
              type="text"
              name="ewaybillNumber"
              value={formData.ewaybillNumber}
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
            Ewaybill Date (Optional)
            <input
              type="date"
              name="ewaybillDate"
              value={formData.ewaybillDate}
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
          {saving ? 'Saving...' : 'Submit Booking'}
        </button>
      </form>
    </div>
  );
};

export default FTLLRBooking;

