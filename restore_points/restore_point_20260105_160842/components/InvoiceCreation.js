import React, { useState, useEffect } from 'react';

const InvoiceCreation = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBookings, setSelectedBookings] = useState([]);
  const [invoiceData, setInvoiceData] = useState({
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    customerName: '',
    amount: '',
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
    const invoice = {
      id: Date.now().toString(),
      invoiceNumber: invoiceData.invoiceNumber || `INV-${Date.now()}`,
      date: invoiceData.date,
      customerName: invoiceData.customerName,
      amount: invoiceData.amount,
      lrBookings: selectedLRs,
      createdAt: new Date().toISOString()
    };

    const invoices = JSON.parse(localStorage.getItem('invoices') || '[]');
    invoices.push(invoice);
    localStorage.setItem('invoices', JSON.stringify(invoices));

    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'invoice', data: invoice } }));
    alert('Invoice created successfully!');
    
    setSelectedBookings([]);
    setInvoiceData({
      invoiceNumber: '',
      date: new Date().toISOString().split('T')[0],
      customerName: '',
      amount: '',
    });
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Create Invoice</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Invoice Number
              <input
                type="text"
                value={invoiceData.invoiceNumber}
                onChange={(e) => setInvoiceData({ ...invoiceData, invoiceNumber: e.target.value })}
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
                value={invoiceData.date}
                onChange={(e) => setInvoiceData({ ...invoiceData, date: e.target.value })}
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
              Customer Name
              <input
                type="text"
                value={invoiceData.customerName}
                onChange={(e) => setInvoiceData({ ...invoiceData, customerName: e.target.value })}
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
              Amount
              <input
                type="number"
                value={invoiceData.amount}
                onChange={(e) => setInvoiceData({ ...invoiceData, amount: e.target.value })}
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
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Create Invoice
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
                  border: selectedBookings.includes(booking.id) ? '2px solid #28a745' : '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: selectedBookings.includes(booking.id) ? '#e7f3e7' : '#fff',
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

export default InvoiceCreation;

