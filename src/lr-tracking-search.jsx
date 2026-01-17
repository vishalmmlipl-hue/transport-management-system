import React, { useState, useEffect } from 'react';
import { Search, FileText, Eye, Edit, Trash2, X, Printer } from 'lucide-react';
import LRPrintView from './lr-print-view.jsx';
import { apiService } from './utils/apiService';

const monoStyle = {
  fontFamily: "'Space Mono', monospace"
};

export default function LRTrackingSearch({ onLRSelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [lrBookings, setLrBookings] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [cities, setCities] = useState([]);
  const [filteredLRs, setFilteredLRs] = useState([]);
  const [selectedLR, setSelectedLR] = useState(null);
  const [showPrintView, setShowPrintView] = useState(false);
  const [printLRId, setPrintLRId] = useState(null);
  const [printLRTable, setPrintLRTable] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allLRsResult, allPTLResult, allFTLResult, allManifestsResult, allInvoicesResult, allCitiesResult] = await Promise.all([
          apiService.getLRBookings().catch(() => ({ data: [] })),
          apiService.getPTLLRBookings().catch(() => ({ data: [] })),
          apiService.getFTLLRBookings().catch(() => ({ data: [] })),
          apiService.getManifests().catch(() => ({ data: [] })),
          apiService.getInvoices().catch(() => ({ data: [] })),
          apiService.getCities().catch(() => ({ data: [] }))
        ]);
        
        // Extract data from API responses
        const baseLRs = Array.isArray(allLRsResult) ? allLRsResult : (allLRsResult?.data || []);
        const ptlLRs = Array.isArray(allPTLResult) ? allPTLResult : (allPTLResult?.data || []);
        const ftlLRs = Array.isArray(allFTLResult) ? allFTLResult : (allFTLResult?.data || []);
        const allManifests = Array.isArray(allManifestsResult) ? allManifestsResult : (allManifestsResult?.data || []);
        const allInvoices = Array.isArray(allInvoicesResult) ? allInvoicesResult : (allInvoicesResult?.data || []);
        const allCities = Array.isArray(allCitiesResult) ? allCitiesResult : (allCitiesResult?.data || []);
        
        // Combine LR tables (ids can collide across tables, so keep __key)
        const combined = [
          ...baseLRs.map(lr => ({ ...lr, __table: 'lrBookings', bookingMode: lr.bookingMode || 'PTL', __key: `lrBookings:${lr.id}` })),
          ...ptlLRs.map(lr => ({ ...lr, __table: 'ptlLRBookings', bookingMode: 'PTL', __key: `ptlLRBookings:${lr.id}` })),
          ...ftlLRs.map(lr => ({ ...lr, __table: 'ftlLRBookings', bookingMode: 'FTL', __key: `ftlLRBookings:${lr.id}` })),
        ];

        setLrBookings(combined);
        setManifests(allManifests);
        setInvoices(allInvoices);
        setCities(allCities);
      } catch (error) {
        console.error('Error loading LR tracking data:', error);
        setLrBookings([]);
        setManifests([]);
        setInvoices([]);
        setCities([]);
      }
    };
    fetchData();
  }, []);

  // Helper function to get city name from ID or code
  const getCityName = (cityValue) => {
    if (!cityValue) return '';
    if (!cities || cities.length === 0) return cityValue;
    
    const city = cities.find(c => {
      if (!c) return false;
      if (c.id?.toString() === cityValue.toString()) return true;
      if (c.code === cityValue || c.code?.toString() === cityValue.toString()) return true;
      if (c.cityName === cityValue) return true;
      return false;
    });
    
    return city ? city.cityName : cityValue;
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredLRs([]);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = (lrBookings || []).filter(lr => {
      if (!lr) return false;
      const originName = getCityName(lr.origin || lr.fromLocation).toLowerCase();
      const destName = getCityName(lr.destination || lr.toLocation).toLowerCase();
      const tbb = (lr.tbbClient ?? '').toString().toLowerCase();
      return (
        lr.lrNumber?.toLowerCase().includes(term) ||
        lr.consignor?.name?.toLowerCase().includes(term) ||
        lr.consignee?.name?.toLowerCase().includes(term) ||
        originName.includes(term) ||
        destName.includes(term) ||
        tbb.includes(term) ||
        lr.referenceNumber?.toLowerCase().includes(term)
      );
    });
    setFilteredLRs(filtered);
  }, [searchTerm, lrBookings, cities]);

  const getLRStatus = (lr) => {
    // Check if LR is in any manifest
    const inManifest = manifests.some(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lr.id || (lr.lrNumber && mlr?.lrNumber === lr.lrNumber);
      })
    );
    
    // Check if LR is billed
    const isBilled = invoices.some(inv => 
      inv.lrNumbers?.includes(lr.lrNumber) || 
      inv.lrNumbers?.some(ln => ln === lr.lrNumber)
    );

    if (isBilled) return { status: 'Billed', color: '#10b981', canEdit: false, canDelete: false, canEditCharges: false };
    if (inManifest) return { status: 'Manifested', color: '#3b82f6', canEdit: false, canDelete: false, canEditCharges: true };
    return { status: 'Booked', color: '#f59e0b', canEdit: true, canDelete: true, canEditCharges: true };
  };

  const handleViewLR = (lr) => {
    setSelectedLR(lr);
  };

  const handleEditLR = (lr) => {
    if (onLRSelect) {
      onLRSelect(lr.__key || lr.id.toString());
    } else {
      // Fallback: navigate directly if callback not provided
      if (lr.__table && lr.id != null) {
        sessionStorage.setItem('editLRKey', `${lr.__table}:${lr.id}`);
      } else {
        sessionStorage.setItem('editLRId', lr.id.toString());
      }
      window.location.hash = '#lr-modify';
    }
  };

  const handleDeleteLR = async (lr) => {
    const status = getLRStatus(lr);
    if (!status.canDelete) {
      alert('⚠️ Cannot delete this LR. It has been manifested or billed.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this LR? This action cannot be undone.')) {
      try {
        if (lr?.__table === 'ftlLRBookings') {
          await apiService.deleteFTLLRBooking(lr.id);
        } else if (lr?.__table === 'ptlLRBookings') {
          await apiService.deletePTLLRBooking(lr.id);
        } else {
          await apiService.deleteLRBooking(lr.id);
        }

        // Reload combined list
        const [baseLRs, ptlLRs, ftlLRs] = await Promise.all([
          apiService.getLRBookings().catch(() => []),
          apiService.getPTLLRBookings().catch(() => []),
          apiService.getFTLLRBookings().catch(() => []),
        ]);
        const combined = [
          ...(baseLRs || []).map(x => ({ ...x, __table: 'lrBookings', bookingMode: x.bookingMode || 'PTL', __key: `lrBookings:${x.id}` })),
          ...(ptlLRs || []).map(x => ({ ...x, __table: 'ptlLRBookings', bookingMode: 'PTL', __key: `ptlLRBookings:${x.id}` })),
          ...(ftlLRs || []).map(x => ({ ...x, __table: 'ftlLRBookings', bookingMode: 'FTL', __key: `ftlLRBookings:${x.id}` })),
        ];
        setLrBookings(combined);
        setSearchTerm('');
        setFilteredLRs([]);
        alert('✅ LR deleted successfully!');
      } catch (error) {
        console.error('Error deleting LR:', error);
        alert('❌ Error deleting LR: ' + (error.message || 'Unknown error'));
      }
    }
  };

  return (
    <div>
      <style>{`
        .search-container {
          position: relative;
          margin-bottom: '20px';
        }
        
        .search-input-wrapper {
          position: relative;
        }
        
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          color: #94a3b8;
        }
        
        .search-input {
          width: 100%;
          padding: 12px 12px 12px 44px;
          border: 2px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          background: rgba(255,255,255,0.1);
          color: white;
          font-size: 1rem;
          transition: all 0.2s ease;
        }
        
        .search-input::placeholder {
          color: rgba(255,255,255,0.6);
        }
        
        .search-input:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(255,255,255,0.15);
          box-shadow: 0 0 0 3px rgba(59,130,246,0.2);
        }
        
        .lr-results {
          margin-top: '16px';
          max-height: '400px';
          overflow-y: 'auto';
        }
        
        .lr-result-card {
          background: rgba(255,255,255,0.1);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .lr-result-card:hover {
          background: rgba(255,255,255,0.15);
          border-color: #3b82f6;
          transform: translateY(-2px);
        }
        
        .lr-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 12px;
        }
        
        .lr-number {
          font-family: 'Space Mono', monospace;
          font-size: 1.1rem;
          font-weight: 700;
          color: white;
        }
        
        .status-badge {
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .lr-details {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
          font-size: 0.85rem;
          color: rgba(255,255,255,0.8);
          margin-bottom: 12px;
        }
        
        .lr-actions {
          display: flex;
          gap: 8px;
        }
        
        .action-btn {
          padding: 6px 12px;
          border-radius: 6px;
          border: none;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          transition: all 0.2s ease;
        }
        
        .btn-view {
          background: rgba(59,130,246,0.2);
          color: #93c5fd;
          border: 1px solid rgba(59,130,246,0.3);
        }
        
        .btn-view:hover {
          background: rgba(59,130,246,0.3);
        }
        
        .btn-edit {
          background: rgba(245,158,11,0.2);
          color: #fcd34d;
          border: 1px solid rgba(245,158,11,0.3);
        }
        
        .btn-edit:hover {
          background: rgba(245,158,11,0.3);
        }
        
        .btn-delete {
          background: rgba(239,68,68,0.2);
          color: #fca5a5;
          border: 1px solid rgba(239,68,68,0.3);
        }
        
        .btn-delete:hover {
          background: rgba(239,68,68,0.3);
        }
        
        .btn-disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
        }
      `}</style>

      <div className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by LR Number, Consignor, Consignee, Origin, Destination..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {filteredLRs.length > 0 && (
          <div className="lr-results" style={{ marginTop: '16px' }}>
            {filteredLRs.map(lr => {
              const lrStatus = getLRStatus(lr);
              return (
                <div key={lr.__key || `${lr.__table || 'lrBookings'}:${lr.id}`} className="lr-result-card">
                  <div className="lr-header">
                    <div>
                      <div className="lr-number" style={monoStyle}>{lr.lrNumber || 'N/A'}</div>
                      {lr.referenceNumber && (
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                          Ref: {lr.referenceNumber}
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px' }}>
                        {lr.bookingDate || 'N/A'}
                      </div>
                    </div>
                    <span className="status-badge" style={{ background: lrStatus.color + '40', color: lrStatus.color }}>
                      {lrStatus.status}
                    </span>
                  </div>
                  
                  <div className="lr-details">
                    <div><strong>From:</strong> {getCityName(lr.origin || lr.fromLocation) || 'N/A'}</div>
                    <div><strong>To:</strong> {getCityName(lr.destination || lr.toLocation) || 'N/A'}</div>
                    <div><strong>Consignor:</strong> {lr.consignor?.name || 'N/A'}</div>
                    <div><strong>Consignee:</strong> {lr.consignee?.name || 'N/A'}</div>
                    <div><strong>Pieces:</strong> {lr.pieces || '0'}</div>
                    <div><strong>Weight:</strong> {lr.weight || '0'} Kg</div>
                  </div>

                  <div className="lr-actions">
                    <button
                      className="action-btn btn-view"
                      onClick={() => handleViewLR(lr)}
                    >
                      <Eye size={14} />
                      View
                    </button>
                    <button
                      className="action-btn btn-view"
                      onClick={() => {
                        setPrintLRId(lr.id);
                        setPrintLRTable(lr.__table || null);
                        setShowPrintView(true);
                      }}
                    >
                      <Printer size={14} />
                      Print
                    </button>
                    <button
                      className={`action-btn btn-edit ${!lrStatus.canEdit && !lrStatus.canEditCharges ? 'btn-disabled' : ''}`}
                      onClick={() => {
                        if (lrStatus.canEdit || lrStatus.canEditCharges) {
                          handleEditLR(lr);
                        } else {
                          alert('⚠️ This LR cannot be edited. It has been billed.');
                        }
                      }}
                      disabled={!lrStatus.canEdit && !lrStatus.canEditCharges}
                    >
                      <Edit size={14} />
                      {lrStatus.canEditCharges && !lrStatus.canEdit ? 'Edit Charges' : 'Edit'}
                    </button>
                    <button
                      className={`action-btn btn-delete ${!lrStatus.canDelete ? 'btn-disabled' : ''}`}
                      onClick={() => handleDeleteLR(lr)}
                      disabled={!lrStatus.canDelete}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchTerm && filteredLRs.length === 0 && (
          <div style={{ 
            padding: '20px', 
            textAlign: 'center', 
            color: 'rgba(255,255,255,0.6)',
            marginTop: '16px'
          }}>
            No LRs found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* LR View Modal */}
      {selectedLR && (
        <div className="modal-overlay" onClick={() => setSelectedLR(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>LR Details</h2>
              <button
                onClick={() => setSelectedLR(null)}
                style={{
                  padding: '8px',
                  background: '#e2e8f0',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ fontSize: '0.9rem' }}>
              <div style={{ marginBottom: '12px' }}>
                <strong>LR Number:</strong> <span style={monoStyle}>{selectedLR.lrNumber}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Booking Date:</strong> {selectedLR.bookingDate}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>From:</strong> {getCityName(selectedLR.origin) || 'N/A'} → <strong>To:</strong> {getCityName(selectedLR.destination) || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Consignor:</strong> {selectedLR.consignor?.name || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Consignee:</strong> {selectedLR.consignee?.name || 'N/A'}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Pieces:</strong> {selectedLR.pieces} | <strong>Weight:</strong> {selectedLR.weight} Kg
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Total Amount:</strong> ₹{selectedLR.totalAmount || 0}
              </div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Status:</strong> {getLRStatus(selectedLR).status}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && printLRId && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          zIndex: 9999,
          overflow: 'auto',
          padding: '20px'
        }}>
          <LRPrintView 
            lrId={printLRId} 
            lrTable={printLRTable}
            onClose={() => {
              setShowPrintView(false);
              setPrintLRId(null);
              setPrintLRTable(null);
            }} 
          />
        </div>
      )}
    </div>
  );
}

