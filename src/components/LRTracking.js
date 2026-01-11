import React, { useState, useEffect } from 'react';
import { useFTLLRBookings, usePTLLRBookings, usePODs } from '../hooks/useDataSync';

const LRTracking = () => {
  const { data: ftlBookings, loading: ftlLoading } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading } = usePTLLRBookings();
  const { data: pods, loading: podsLoading } = usePODs();
  
  const [selectedLR, setSelectedLR] = useState(null);

  // Combine bookings from both sources
  const bookings = [...(ftlBookings || []), ...(ptlBookings || [])];
  const loading = ftlLoading || ptlLoading || podsLoading;

  useEffect(() => {
    const handlePodCreated = () => {
      // Data will auto-reload via hooks
    };
    window.addEventListener('podCreated', handlePodCreated);
    return () => {
      window.removeEventListener('podCreated', handlePodCreated);
    };
  }, []);

  const handleLRSelect = (lrNumber) => {
    const booking = bookings.find(b => b.lrNumber === lrNumber);
    setSelectedLR(booking);
  };

  const getPODForLR = (lrNumber) => {
    return pods.find(pod => pod.lrNumber === lrNumber);
  };

  const handleDownloadPOD = (pod) => {
    const link = document.createElement('a');
    link.href = pod.podFile;
    link.download = pod.podFileName || 'pod.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>Loading data from Render.com...</div>;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>LR Tracking</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label>
          Select LR Number:
          <select
            value={selectedLR?.lrNumber || ''}
            onChange={(e) => handleLRSelect(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '5px',
              border: '1px solid #ccc',
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
        </label>
      </div>

      {selectedLR && (
        <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
          <h3>LR Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
            <div>
              <strong>LR Number:</strong> {selectedLR.lrNumber}
            </div>
            {selectedLR.lrReferenceNumber && (
              <div>
                <strong>LR Reference Number:</strong> {selectedLR.lrReferenceNumber}
              </div>
            )}
            <div>
              <strong>Type:</strong> {selectedLR.type || 'FTL'}
            </div>
            <div>
              <strong>Branch:</strong> {selectedLR.branch || 'N/A'}
            </div>
            <div>
              <strong>From:</strong> {selectedLR.fromLocation}
            </div>
            <div>
              <strong>To:</strong> {selectedLR.toLocation}
            </div>
            {selectedLR.invoiceNumber && (
              <div>
                <strong>Invoice Number:</strong> {selectedLR.invoiceNumber}
              </div>
            )}
            {selectedLR.ewaybillNumber && (
              <div>
                <strong>Ewaybill Number:</strong> {selectedLR.ewaybillNumber}
              </div>
            )}
            <div>
              <strong>Created:</strong> {new Date(selectedLR.createdAt).toLocaleString()}
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
            <h4>POD Status</h4>
            {(() => {
              const pod = getPODForLR(selectedLR.lrNumber);
              if (pod) {
                return (
                  <div>
                    <div style={{ marginBottom: '10px', color: '#28a745', fontWeight: 'bold' }}>
                      ✓ POD Uploaded
                    </div>
                    <div style={{ fontSize: '14px', marginBottom: '10px' }}>
                      <div><strong>File Name:</strong> {pod.podFileName}</div>
                      {pod.deliveryDate && <div><strong>Delivery Date:</strong> {pod.deliveryDate}</div>}
                      {pod.idType && <div><strong>ID Type:</strong> {pod.idType}</div>}
                      {pod.idNumber && <div><strong>ID Number:</strong> {pod.idNumber}</div>}
                      {pod.mobileNumber && <div><strong>Mobile Number:</strong> {pod.mobileNumber}</div>}
                      {pod.vehicleNumber && <div><strong>Vehicle Number:</strong> {pod.vehicleNumber}</div>}
                      {pod.remarks && <div><strong>Remarks:</strong> {pod.remarks}</div>}
                      <div><strong>Uploaded:</strong> {new Date(pod.createdAt).toLocaleString()}</div>
                    </div>
                    <button
                      onClick={() => handleDownloadPOD(pod)}
                      style={{
                        padding: '8px 15px',
                        backgroundColor: '#007bff',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      📥 Download POD
                    </button>
                    {pod.podFile && pod.podFile.startsWith('data:image') && (
                      <div style={{ marginTop: '15px' }}>
                        <img
                          src={pod.podFile}
                          alt="POD Preview"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '400px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              } else {
                return (
                  <div style={{ color: '#dc3545' }}>
                    ⚠ No POD uploaded for this LR
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}

      {!selectedLR && (
        <div style={{ textAlign: 'center', color: '#666', padding: '40px' }}>
          Select an LR number to view tracking details and POD information
        </div>
      )}
    </div>
  );
};

export default LRTracking;

