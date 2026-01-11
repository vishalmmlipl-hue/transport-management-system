import React, { useState, useEffect } from 'react';
import { useFTLLRBookings, usePTLLRBookings } from '../hooks/useDataSync';

const SearchLR = () => {
  const { data: ftlBookings, loading: ftlLoading } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading } = usePTLLRBookings();
  const [searchTerm, setSearchTerm] = useState('');

  // Combine bookings from both sources
  const bookings = [...(ftlBookings || []), ...(ptlBookings || [])];
  const loading = ftlLoading || ptlLoading;

  useEffect(() => {
    const handleBookingCreated = () => {
      // Data will auto-reload via hooks
    };
    window.addEventListener('lrBookingCreated', handleBookingCreated);
    return () => {
      window.removeEventListener('lrBookingCreated', handleBookingCreated);
    };
  }, []);

  const filteredBookings = searchTerm.trim()
    ? bookings.filter(booking =>
        booking.lrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.lrReferenceNumber && booking.lrReferenceNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
        booking.fromLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.toLocation.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : bookings;

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>Loading bookings from Render.com...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Search LR</h2>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search by LR Number, Reference Number, From Location, or To Location..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '16px'
          }}
        />
      </div>

      <div>
        <h3>Results ({filteredBookings.length})</h3>
        {filteredBookings.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            {searchTerm ? 'No bookings found matching your search.' : 'No bookings available. Create bookings to see them here.'}
          </p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {filteredBookings.map(booking => (
              <div
                key={booking.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>LR #{booking.lrNumber}</h4>
                  <span style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    backgroundColor: booking.type === 'FTL' ? '#007bff' : '#28a745',
                    color: 'white',
                    fontSize: '12px'
                  }}>
                    {booking.type || 'FTL'}
                  </span>
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  {booking.lrReferenceNumber && <div><strong>LR Ref:</strong> {booking.lrReferenceNumber}</div>}
                  <div><strong>From:</strong> {booking.fromLocation}</div>
                  <div><strong>To:</strong> {booking.toLocation}</div>
                  {booking.branch && <div><strong>Branch:</strong> {booking.branch}</div>}
                  {booking.invoiceNumber && <div><strong>Invoice:</strong> {booking.invoiceNumber}</div>}
                  {booking.ewaybillNumber && <div><strong>Ewaybill:</strong> {booking.ewaybillNumber}</div>}
                  <div><strong>Created:</strong> {new Date(booking.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchLR;

