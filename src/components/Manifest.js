import React, { useState, useEffect } from 'react';

const Manifest = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [manifestData, setManifestData] = useState({
    manifestNumber: '',
    date: new Date().toISOString().split('T')[0],
    vehicleNumber: '',
    driverName: '',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = () => {
    const ftlBookings = JSON.parse(localStorage.getItem('ftlLRBookings') || '[]');
    const ptlBookings = JSON.parse(localStorage.getItem('ptlLRBookings') || '[]');
    setBookings([...ftlBookings, ...ptlBookings]);
  };

  const handleSelectBooking = (bookingId) => {
    setSelectedBookings(prev => {
      if (prev.includes(bookingId)) {
        return prev.filter(id => id !== bookingId);
      } else {
        return [...prev, bookingId];
      }
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedBookings.length === 0) {
      alert('Please select at least one LR booking');
      return;
    }

    const selectedLRs = bookings.filter(b => selectedBookings.includes(b.id));
    const manifest = {
      id: Date.now().toString(),
      manifestNumber: manifestData.manifestNumber || `MAN-${Date.now()}`,
      date: manifestData.date,
      vehicleNumber: manifestData.vehicleNumber,
      driverName: manifestData.driverName,
      lrBookings: selectedLRs,
      createdAt: new Date().toISOString()
    };

    const manifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    manifests.push(manifest);
    localStorage.setItem('manifests', JSON.stringify(manifests));

    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'manifest', data: manifest } }));
    alert('Manifest created successfully!');
    
    setSelectedBookings([]);
    setManifestData({
      manifestNumber: '',
      date: new Date().toISOString().split('T')[0],
      vehicleNumber: '',
      driverName: '',
    });
  };

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
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Create Manifest
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

