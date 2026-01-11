import React, { useState } from 'react';
import { useFTLLRBookings, usePTLLRBookings } from '../hooks/useDataSync';

const ModifyLR = () => {
  const { data: ftlBookings, loading: ftlLoading, update: updateFTL } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading, update: updatePTL } = usePTLLRBookings();
  
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Combine bookings from both sources
  const bookings = [...(ftlBookings || []), ...(ptlBookings || [])];
  const loading = ftlLoading || ptlLoading;

  const handleSelectBooking = (booking) => {
    setSelectedBooking(booking);
    setFormData({
      lrNumber: booking.lrNumber || '',
      lrReferenceNumber: booking.lrReferenceNumber || '',
      fromLocation: booking.fromLocation || '',
      toLocation: booking.toLocation || '',
      invoiceNumber: booking.invoiceNumber || '',
      ewaybillNumber: booking.ewaybillNumber || '',
      ewaybillDate: booking.ewaybillDate || '',
      branch: booking.branch || '',
    });
    setErrors({});
  };

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
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) {
      alert('Please select a booking to modify');
      return;
    }
    if (!validateForm()) return;

    const updatedBooking = {
      ...formData,
      updatedAt: new Date().toISOString()
    };

    try {
      setSaving(true);
      const isPTL = selectedBooking.type === 'PTL';
      if (isPTL) {
        await updatePTL(selectedBooking.id, updatedBooking);
      } else {
        await updateFTL(selectedBooking.id, updatedBooking);
      }
      
      alert('✅ Booking updated successfully on Render.com server!');

      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: isPTL ? 'ptlBooking' : 'ftlBooking', data: updatedBooking } }));
      setSelectedBooking(null);
      setFormData({});
    } catch (error) {
      console.error('Error updating booking:', error);
      alert('❌ Error updating booking: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>Loading bookings from Render.com...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Modify LR</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Select LR to Modify:
          <select
            value={selectedBooking?.id || ''}
            onChange={(e) => {
              const booking = bookings.find(b => b.id === e.target.value);
              if (booking) handleSelectBooking(booking);
            }}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              border: '1px solid #ccc',
              borderRadius: '4px'
            }}
          >
            <option value="">-- Select LR Booking --</option>
            {bookings.map(booking => (
              <option key={booking.id} value={booking.id}>
                LR: {booking.lrNumber} {booking.lrReferenceNumber ? `(Ref: ${booking.lrReferenceNumber})` : ''} | {booking.fromLocation} → {booking.toLocation}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedBooking && (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
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

            <div>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
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

            <div>
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
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div>
              <label>
                Branch
                <input
                  type="text"
                  name="branch"
                  value={formData.branch}
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

            <div>
              <label>
                Invoice Number
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

            <div>
              <label>
                Ewaybill Number
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
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              Ewaybill Date
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
              padding: '10px 20px',
              backgroundColor: saving ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              opacity: saving ? 0.6 : 1
            }}
          >
            {saving ? 'Updating...' : 'Update Booking'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ModifyLR;

