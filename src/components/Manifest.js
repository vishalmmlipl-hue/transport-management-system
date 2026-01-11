import React, { useState, useEffect } from 'react';
import { useFTLLRBookings, usePTLLRBookings, useManifests } from '../hooks/useDataSync';

const Manifest = () => {
  const { data: ftlBookings, loading: ftlLoading } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading } = usePTLLRBookings();
  const { create: createManifest } = useManifests();
  
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [manifestData, setManifestData] = useState({
    manifestNumber: '',
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    driverName: '',
  });
  const [saving, setSaving] = useState(false);

  // Combine bookings from both sources
  const bookings = [...(ftlBookings || []), ...(ptlBookings || [])];
  const loading = ftlLoading || ptlLoading;

  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedBookings.length === 0) {
      alert('Please select at least one LR booking');
      return;
    }

    const selectedLRs = bookings.filter(b => selectedBookings.includes(b.id));
    const manifest = {
      manifestNumber: manifestData.manifestNumber || `MAN-${Date.now()}`,
      date: manifestData.date,
      vehicleNumber: manifestData.vehicleNumber,
      driverName: manifestData.driverName,
      lrBookings: selectedLRs,
      createdAt: new Date().toISOString()
    };

    try {
      setSaving(true);
      await createManifest(manifest);
      alert('✅ Manifest created successfully on Render.com server!');

      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'manifest', data: manifest } }));
      
      setSelectedBookings([]);
      setManifestData({
        manifestNumber: '',
        date: new Date().toISOString().split('T')[0],
        vehicleNumber: '',
        driverName: '',
      });
    } catch (error) {
      console.error('Error saving manifest:', error);
      alert('❌ Error saving manifest: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>Loading bookings from Render.com...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Create Manifest</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Manifest Number
              <input
                type="text"
                value={manifestData.manifestNumber}
                onChange={(e) => setManifestData({ ...manifestData, manifestNumber: e.target.value })}
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
              Date
              <input
                type="date"
                value={manifestData.date}
                onChange={(e) => setManifestData({ ...manifestData, date: e.target.value })}
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
              Vehicle Number
              <input
                type="text"
                value={manifestData.vehicleNumber}
                onChange={(e) => setManifestData({ ...manifestData, vehicleNumber: e.target.value })}
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
              Driver Name
              <input
                type="text"
                value={manifestData.driverName}
                onChange={(e) => setManifestData({ ...manifestData, driverName: e.target.value })}
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
        <button
          type="submit"
          disabled={saving}
          style={{
            padding: '10px 20px',
            backgroundColor: saving ? '#6c757d' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            opacity: saving ? 0.6 : 1
          }}
        >
          {saving ? 'Creating...' : 'Create Manifest'}
        </button>
      </form>

      <div>
        <h3>Select LR Bookings ({selectedBookings.length} selected)</h3>
        {bookings.length === 0 ? (
          <p>No bookings available</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {bookings.map(booking => (
              <div
                key={booking.id}
                onClick={() => handleSelectBooking(booking.id)}
                style={{
                  border: selectedBookings.includes(booking.id) ? '2px solid #007bff' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: selectedBookings.includes(booking.id) ? '#e7f3ff' : '#fff',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>LR #{booking.lrNumber}</strong>
                    {booking.lrReferenceNumber && <span> (Ref: {booking.lrReferenceNumber})</span>}
                    <div style={{ marginTop: '5px', fontSize: '14px' }}>
                      {booking.fromLocation} → {booking.toLocation}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedBookings.includes(booking.id)}
                    onChange={() => handleSelectBooking(booking.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Manifest;

