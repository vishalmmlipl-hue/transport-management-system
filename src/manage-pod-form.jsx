import React, { useState, useEffect } from 'react';
import { Search, Edit2, Save, X, CheckCircle, Package, Calendar } from 'lucide-react';

export default function ManagePODForm() {
  const [pods, setPods] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [staff, setStaff] = useState([]);
  const [, setCurrentUser] = useState(null);
  const [, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState('All'); // Single branch selection - default to "All"
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterDispatchStatus, setFilterDispatchStatus] = useState('All');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [editingPod, setEditingPod] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    loadData();
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);

    // Check if admin
    const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const systemUser = systemUsers.find(u => u.username === user?.username);
    const userRole = systemUser?.userRole || user?.role || '';
    const adminStatus = userRole === 'Admin' || userRole === 'admin';
    setIsAdmin(adminStatus);

    // Auto-select branch for non-admin users
    if (user && !adminStatus) {
      let userBranchId = null;
      if (systemUser && systemUser.branch) {
        userBranchId = systemUser.branch;
      } else if (user.branch) {
        userBranchId = user.branch;
      }

      if (userBranchId) {
        const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        const branch = allBranches.find(b => 
          b.id.toString() === userBranchId.toString() || 
          b.branchCode === userBranchId
        );
        if (branch) {
          setSelectedBranch(branch.id.toString());
        } else {
          setSelectedBranch('All');
        }
      } else {
        setSelectedBranch('All');
      }
    } else {
      // Admin or no user - default to "All Branches"
      setSelectedBranch('All');
    }

    // Set default period to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const loadData = () => {
    setPods(JSON.parse(localStorage.getItem('pods') || '[]'));
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]'));
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
    setManifests(JSON.parse(localStorage.getItem('manifests') || '[]'));
    setStaff(JSON.parse(localStorage.getItem('staff') || '[]'));
  };

  const getLRDetails = (lrId) => {
    if (!lrId) return { lrNumber: 'N/A', consignee: { name: 'N/A' }, branch: null, destination: null, bookingMode: null };
    const lr = lrBookings.find(l => 
      l.id.toString() === lrId.toString() || 
      l.lrNumber === lrId ||
      l.id === lrId
    );
    return lr || { lrNumber: lrId, consignee: { name: 'N/A' }, branch: null, destination: null, bookingMode: null };
  };

  // Check if POD is for FTL booking
  const isFTLPOD = (pod) => {
    const lrDetails = getLRDetails(pod.lrNumber);
    return lrDetails.bookingMode === 'FTL';
  };

  // Get branch for a POD based on LR's destination branch
  const getPODBranch = (pod) => {
    const lrDetails = getLRDetails(pod.lrNumber);
    
    // Check if LR has a branch field
    if (lrDetails.branch) {
      const branch = branches.find(b => b.id.toString() === lrDetails.branch.toString());
      if (branch) return branch;
    }

    // Try to find branch from manifest destination
    const manifest = manifests.find(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lrDetails.id || mlrId === pod.lrNumber;
      })
    );

    if (manifest && manifest.destinationBranch) {
      const branch = branches.find(b => 
        b.id.toString() === manifest.destinationBranch.toString() || 
        b.branchCode === manifest.destinationBranch
      );
      if (branch) return branch;
    }

    // Try to find branch from destination city
    if (lrDetails.destination) {
      const destinationCity = cities.find(c => 
        c.code === lrDetails.destination || 
        c.cityName === lrDetails.destination ||
        c.id.toString() === lrDetails.destination.toString()
      );
      
      if (destinationCity) {
        const branch = branches.find(b => 
          b.city === destinationCity.cityName || 
          b.state === destinationCity.state
        );
        if (branch) return branch;
      }
    }

    return null;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleEdit = (pod) => {
    const isFTL = isFTLPOD(pod);
    setEditingPod(pod.id);
    setEditFormData({
      deliveryDate: pod.deliveryDate || new Date().toISOString().split('T')[0],
      deliveryTime: pod.deliveryTime || new Date().toTimeString().slice(0, 5),
      receiverName: pod.receiverName || '',
      receiverMobile: pod.receiverMobile || '',
      receiverIDNumber: pod.receiverIDNumber || '',
      piecesDelivered: pod.piecesDelivered || '',
      condition: pod.condition || 'Good',
      damageRemarks: pod.damageRemarks || '',
      podDispatchStatus: pod.podDispatchStatus || 'Pending',
      podDispatchMode: pod.podDispatchMode || (isFTL ? '' : null),
      courierName: pod.courierName || '',
      trackingNumber: pod.trackingNumber || '',
      staffName: pod.staffName || '',
      staffId: pod.staffId || '',
      courierReceiverName: pod.courierReceiverName || '',
      courierReceiverNumber: pod.courierReceiverNumber || '',
      remarks: pod.remarks || ''
    });
  };

  const handleSave = (podId) => {
    const updatedPODs = pods.map(pod => {
      if (pod.id === podId) {
        return {
          ...pod,
          ...editFormData,
          updatedAt: new Date().toISOString()
        };
      }
      return pod;
    });

    localStorage.setItem('pods', JSON.stringify(updatedPODs));
    setPods(updatedPODs);
    setEditingPod(null);
    setEditFormData({});
    alert('✅ POD updated successfully!');
  };

  const handleCancel = () => {
    setEditingPod(null);
    setEditFormData({});
  };

  const filteredPODs = pods.filter(pod => {
    const lrDetails = getLRDetails(pod.lrNumber);
    const podBranch = getPODBranch(pod);
    
    // Branch filter - only filter if a specific branch is selected (not "All" or null)
    if (selectedBranch && selectedBranch !== 'All' && selectedBranch !== '') {
      if (!podBranch) return false; // POD without branch doesn't match specific branch
      const branchMatches = podBranch.id.toString() === selectedBranch.toString();
      if (!branchMatches) return false;
    }
    
    // Period filter
    if (startDate && pod.deliveryDate) {
      if (pod.deliveryDate < startDate) return false;
    }
    if (endDate && pod.deliveryDate) {
      if (pod.deliveryDate > endDate) return false;
    }
    
    // Search filter
    const matchesSearch = !searchTerm || 
      pod.podNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lrDetails.lrNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.receiverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pod.receiverMobile?.includes(searchTerm);
    
    // Status filters - handle "All" case properly
    const matchesStatus = !filterStatus || filterStatus === 'All' || pod.status === filterStatus;
    const matchesDispatchStatus = !filterDispatchStatus || filterDispatchStatus === 'All' || (pod.podDispatchStatus || 'Pending') === filterDispatchStatus;

    return matchesSearch && matchesStatus && matchesDispatchStatus;
  });

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
          font-family: inherit;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        
        .btn-small {
          padding: 6px 12px;
          font-size: 0.85rem;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        
        .pod-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .pod-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16,185,129,0.1);
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="form-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
                Manage PODs
              </h1>
              <p style={{ color: '#64748b', fontSize: '1rem' }}>
                View, search, and edit all Proof of Delivery records
              </p>
            </div>
            <Package size={48} style={{ color: '#10b981', opacity: 0.2 }} />
          </div>

          {/* Filters */}
          <div className="grid-4" style={{ marginTop: '20px' }}>
            <div className="input-group">
              <label>Branch</label>
              <select
                value={selectedBranch || 'All'}
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <option value="All">All Branches</option>
                {branches.filter(b => b.status === 'Active').map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} ({branch.branchCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Period - From Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Period - To Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            <div className="input-group">
              <label>Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={18} style={{ 
                  position: 'absolute', 
                  left: '12px', 
                  top: '50%', 
                  transform: 'translateY(-50%)',
                  color: '#94a3b8'
                }} />
                <input
                  type="text"
                  placeholder="POD Number, LR Number, Receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>
          </div>

          <div className="grid-4" style={{ marginTop: '16px' }}>
            <div className="input-group">
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Delivered">Delivered</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            <div className="input-group">
              <label>Dispatch Status</label>
              <select
                value={filterDispatchStatus}
                onChange={(e) => setFilterDispatchStatus(e.target.value)}
              >
                <option value="All">All</option>
                <option value="Pending">Pending</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Delivered to Client">Delivered to Client</option>
              </select>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ 
                padding: '10px 16px', 
                background: '#f1f5f9', 
                borderRadius: '8px',
                width: '100%',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total PODs</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  {filteredPODs.length}
                </div>
              </div>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  const today = new Date();
                  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                  setStartDate(firstDay.toISOString().split('T')[0]);
                  setEndDate(lastDay.toISOString().split('T')[0]);
                }}
                style={{ width: '100%' }}
              >
                <Calendar size={16} />
                Current Month
              </button>
            </div>
          </div>
        </div>

        {/* PODs List */}
        <div className="form-section">
          {filteredPODs.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '1.1rem' }}>No PODs found</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                {searchTerm || filterStatus !== 'All' || filterDispatchStatus !== 'All'
                  ? 'Try adjusting your filters' 
                  : 'No PODs have been created yet'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="section-title">All PODs ({filteredPODs.length})</h2>
              {filteredPODs.map((pod) => {
                const lrDetails = getLRDetails(pod.lrNumber);
                const isEditing = editingPod === pod.id;

                return (
                  <div key={pod.id} className="pod-card">
                    {!isEditing ? (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                              <h3 className="mono" style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                                {pod.podNumber || 'N/A'}
                              </h3>
                              <span className="status-badge" style={{ background: '#10b98120', color: '#10b981' }}>
                                <CheckCircle size={14} />
                                {pod.status || 'Delivered'}
                              </span>
                              {pod.podDispatchStatus && (
                                <span className="status-badge" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                                  {pod.podDispatchStatus}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                              <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                              {formatDate(pod.deliveryDate)} {pod.deliveryTime}
                            </div>
                          </div>
                          <button
                            className="btn btn-primary btn-small"
                            onClick={() => handleEdit(pod)}
                          >
                            <Edit2 size={14} />
                            Edit
                          </button>
                        </div>

                        <div className="grid-3" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>LR Number</div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {lrDetails.lrNumber || pod.lrNumberDisplay || 'N/A'}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Consignee</div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {lrDetails.consignee?.name || 'N/A'}
                            </div>
                          </div>
                          {getPODBranch(pod) && (
                            <div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Branch</div>
                              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                {getPODBranch(pod).branchName} ({getPODBranch(pod).branchCode})
                              </div>
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Receiver</div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>
                              {pod.receiverName || 'N/A'}
                            </div>
                            {pod.receiverMobile && (
                              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{pod.receiverMobile}</div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Pieces Delivered</div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{pod.piecesDelivered || '0'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Condition</div>
                            <div style={{ fontWeight: 600, color: '#1e293b' }}>{pod.condition || 'Good'}</div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Delivery Location</div>
                            <div style={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                              {pod.deliveryLocation || 'N/A'}
                            </div>
                          </div>
                        </div>

                        {/* FTL POD Dispatch Details */}
                        {isFTLPOD(pod) && pod.podDispatchMode && (
                          <div style={{
                            marginBottom: '16px',
                            padding: '12px',
                            background: '#fef3c7',
                            borderRadius: '6px',
                            border: '1px solid #fbbf24'
                          }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#92400e', marginBottom: '8px' }}>
                              POD Dispatch Details (FTL Mode)
                            </div>
                            <div className="grid-3" style={{ fontSize: '0.85rem', color: '#92400e' }}>
                              <div>
                                <strong>Mode:</strong> {pod.podDispatchMode === 'courier' ? 'By Courier' : pod.podDispatchMode === 'hand' ? 'By Hand' : 'N/A'}
                              </div>
                              {pod.podDispatchMode === 'courier' && (
                                <>
                                  <div>
                                    <strong>Courier:</strong> {pod.courierName || 'N/A'}
                                  </div>
                                  <div>
                                    <strong>Tracking:</strong> {pod.trackingNumber || 'N/A'}
                                  </div>
                                  {pod.courierReceiverName && (
                                    <>
                                      <div>
                                        <strong>Receiver Name:</strong> {pod.courierReceiverName}
                                      </div>
                                      <div>
                                        <strong>Receiver Number:</strong> {pod.courierReceiverNumber || 'N/A'}
                                      </div>
                                    </>
                                  )}
                                </>
                              )}
                              {pod.podDispatchMode === 'hand' && (
                                <>
                                  {pod.staffName && (
                                    <div>
                                      <strong>Staff:</strong> {pod.staffName}
                                    </div>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Remarks */}
                        {(pod.remarks || pod.damageRemarks) && (
                          <div style={{
                            marginTop: '12px',
                            padding: '12px',
                            background: '#f8fafc',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0'
                          }}>
                            {pod.remarks && (
                              <div style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '8px' }}>
                                <strong>Remarks:</strong> {pod.remarks}
                              </div>
                            )}
                            {pod.damageRemarks && (
                              <div style={{ fontSize: '0.85rem', color: '#dc2626' }}>
                                <strong>Damage Remarks:</strong> {pod.damageRemarks}
                              </div>
                            )}
                          </div>
                        )}

                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', fontSize: '0.75rem', color: '#64748b' }}>
                          Created: {formatDate(pod.createdAt)} {pod.updatedAt && pod.updatedAt !== pod.createdAt && `| Updated: ${formatDate(pod.updatedAt)}`}
                        </div>
                      </>
                    ) : (
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>
                          Edit POD: {pod.podNumber}
                        </h4>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleSave(pod.id);
                        }}>
                          <div className="grid-3" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Delivery Date *</label>
                              <input
                                type="date"
                                value={editFormData.deliveryDate}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryDate: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Delivery Time *</label>
                              <input
                                type="time"
                                value={editFormData.deliveryTime}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, deliveryTime: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Pieces Delivered *</label>
                              <input
                                type="number"
                                value={editFormData.piecesDelivered}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, piecesDelivered: e.target.value }))}
                                required
                                min="0"
                              />
                            </div>
                          </div>

                          <div className="grid-3" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Receiver Name *</label>
                              <input
                                type="text"
                                value={editFormData.receiverName}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, receiverName: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Receiver Contact *</label>
                              <input
                                type="tel"
                                value={editFormData.receiverMobile}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, receiverMobile: e.target.value }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Receiver ID Number</label>
                              <input
                                type="text"
                                value={editFormData.receiverIDNumber}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, receiverIDNumber: e.target.value }))}
                              />
                            </div>
                          </div>

                          {/* FTL POD Dispatch */}
                          {isFTLPOD(pod) && (
                            <div style={{
                              marginBottom: '16px',
                              padding: '16px',
                              background: '#fef3c7',
                              borderRadius: '8px',
                              border: '2px solid #fbbf24'
                            }}>
                              <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#92400e', marginBottom: '12px' }}>
                                POD Dispatch Details (FTL Mode)
                              </h5>
                              <div className="grid-2" style={{ marginBottom: '12px' }}>
                                <div className="input-group">
                                  <label>POD Dispatch Mode *</label>
                                  <select
                                    value={editFormData.podDispatchMode || ''}
                                    onChange={(e) => setEditFormData(prev => ({
                                      ...prev,
                                      podDispatchMode: e.target.value,
                                      // Clear fields when mode changes
                                      courierName: e.target.value === 'courier' ? prev.courierName : '',
                                      trackingNumber: e.target.value === 'courier' ? prev.trackingNumber : '',
                                      courierReceiverName: e.target.value === 'courier' ? prev.courierReceiverName : '',
                                      courierReceiverNumber: e.target.value === 'courier' ? prev.courierReceiverNumber : '',
                                      staffName: e.target.value === 'hand' ? prev.staffName : '',
                                      staffId: e.target.value === 'hand' ? prev.staffId : ''
                                    }))}
                                    required
                                  >
                                    <option value="">-- Select Mode --</option>
                                    <option value="courier">By Courier</option>
                                    <option value="hand">By Hand</option>
                                  </select>
                                </div>
                                <div className="input-group">
                                  <label>POD Dispatch Status</label>
                                  <select
                                    value={editFormData.podDispatchStatus}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, podDispatchStatus: e.target.value }))}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Delivered to Client">Delivered to Client</option>
                                  </select>
                                </div>
                              </div>
                              
                              {/* Courier Mode Fields */}
                              {editFormData.podDispatchMode === 'courier' && (
                                <div>
                                  <div className="grid-2" style={{ marginBottom: '12px' }}>
                                    <div className="input-group">
                                      <label>Courier Name *</label>
                                      <input
                                        type="text"
                                        value={editFormData.courierName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, courierName: e.target.value }))}
                                        required
                                        placeholder="Enter courier company name"
                                      />
                                    </div>
                                    <div className="input-group">
                                      <label>Tracking Number *</label>
                                      <input
                                        type="text"
                                        value={editFormData.trackingNumber || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, trackingNumber: e.target.value }))}
                                        required
                                        placeholder="Enter tracking number"
                                      />
                                    </div>
                                  </div>
                                  <div className="grid-2">
                                    <div className="input-group">
                                      <label>Receiver Name (at Courier) *</label>
                                      <input
                                        type="text"
                                        value={editFormData.courierReceiverName || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, courierReceiverName: e.target.value }))}
                                        required
                                        placeholder="Name of person receiving POD"
                                      />
                                    </div>
                                    <div className="input-group">
                                      <label>Receiver Number (at Courier) *</label>
                                      <input
                                        type="tel"
                                        value={editFormData.courierReceiverNumber || ''}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, courierReceiverNumber: e.target.value }))}
                                        required
                                        placeholder="Contact number"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* Hand Mode Fields */}
                              {editFormData.podDispatchMode === 'hand' && (
                                <div className="input-group">
                                  <label>Staff Name *</label>
                                  <select
                                    value={editFormData.staffId || ''}
                                    onChange={(e) => {
                                      const selectedStaff = staff.find(s => s.id.toString() === e.target.value);
                                      setEditFormData(prev => ({
                                        ...prev,
                                        staffId: e.target.value,
                                        staffName: selectedStaff ? selectedStaff.staffName : ''
                                      }));
                                    }}
                                    required
                                  >
                                    <option value="">-- Select Staff --</option>
                                    {staff.filter(s => s.status === 'Active').map(staffMember => (
                                      <option key={staffMember.id} value={staffMember.id}>
                                        {staffMember.staffName} - {staffMember.designation || 'Staff'}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              )}
                            </div>
                          )}

                          {!pod.podDispatchMode && (
                            <div className="input-group" style={{ marginBottom: '16px' }}>
                              <label>POD Dispatch Status</label>
                              <select
                                value={editFormData.podDispatchStatus}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, podDispatchStatus: e.target.value }))}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered to Client">Delivered to Client</option>
                              </select>
                            </div>
                          )}

                          <div className="grid-2" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Condition</label>
                              <select
                                value={editFormData.condition}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, condition: e.target.value }))}
                              >
                                <option value="Good">Good</option>
                                <option value="Damaged">Damaged</option>
                                <option value="Short Delivery">Short Delivery</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>
                            <div className="input-group">
                              <label>Damage Remarks</label>
                              <input
                                type="text"
                                value={editFormData.damageRemarks}
                                onChange={(e) => setEditFormData(prev => ({ ...prev, damageRemarks: e.target.value }))}
                              />
                            </div>
                          </div>

                          <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Remarks</label>
                            <textarea
                              value={editFormData.remarks}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, remarks: e.target.value }))}
                              rows="3"
                            />
                          </div>

                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={handleCancel}
                            >
                              <X size={16} />
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                            >
                              <Save size={16} />
                              Save Changes
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

