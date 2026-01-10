import React, { useState, useEffect } from 'react';
import { Package, Truck, Calendar, MapPin, Search, Filter, CheckCircle, Clock, AlertCircle, Upload, Save, X, Edit2 } from 'lucide-react';

export default function PendingShipmentsBranch() {
  const [lrBookings, setLrBookings] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [pods, setPods] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('All'); // Pending Dispatch, Manifested, In Transit, Delivered, All
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLR, setExpandedLR] = useState(null); // Track which LR has POD form expanded
  const [podFormData, setPodFormData] = useState({}); // Store POD form data for each LR

  const loadData = () => {
    // Load data
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setManifests(JSON.parse(localStorage.getItem('manifests') || '[]'));
    setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
    setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]'));
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]'));
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
    setPods(JSON.parse(localStorage.getItem('pods') || '[]'));
  };

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
          setSelectedBranch(branch);
        }
      }
    }

    // Listen for storage changes for real-time sync
    const handleStorageChange = () => {
      loadData();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also poll for changes every 2 seconds for real-time sync
    const pollInterval = setInterval(() => {
      loadData();
    }, 2000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  // Get destination branch from manifest
  const getDestinationBranch = (manifest) => {
    if (manifest.destinationBranch) {
      const branch = branches.find(b => 
        b.id.toString() === manifest.destinationBranch.toString() || 
        b.branchCode === manifest.destinationBranch
      );
      if (branch) return branch;
    }

    // Try to determine from LR destinations
    if (manifest.selectedLRs && manifest.selectedLRs.length > 0) {
      const firstLR = manifest.selectedLRs[0];
      const lrData = typeof firstLR === 'object' ? firstLR : 
                     lrBookings.find(lr => lr.id.toString() === firstLR.toString());
      
      if (lrData && lrData.destination) {
        const destinationCity = cities.find(c => 
          c.code === lrData.destination || 
          c.cityName === lrData.destination ||
          c.id.toString() === lrData.destination.toString()
        );
        
        if (destinationCity) {
          const destBranch = branches.find(b => 
            b.city === destinationCity.cityName || 
            b.state === destinationCity.state
          );
          if (destBranch) return destBranch;
        }
      }
    }
    return null;
  };

  // Check if POD exists for LR
  const getPODForLR = (lr) => {
    return pods.find(pod => {
      const podLRId = typeof pod.lrNumber === 'object' ? pod.lrNumber.id : pod.lrNumber;
      return podLRId === lr.id || podLRId === lr.lrNumber || pod.lrNumber === lr.lrNumber;
    });
  };

  // Get vehicle number from trip
  const getVehicleNumberFromTrip = (trip) => {
    if (!trip) return null;
    
    // Try vehicleNumber field first
    if (trip.vehicleNumber) return trip.vehicleNumber;
    
    // Try vehicleId
    if (trip.vehicleId) {
      const vehicle = vehicles.find(v => v.id.toString() === trip.vehicleId.toString());
      if (vehicle) return vehicle.vehicleNumber;
    }
    
    return null;
  };

  // Get LR status for pending shipments with real-time sync
  const getLRStatus = (lr) => {
    const discrepancies = [];
    
    // First check if POD exists - if POD exists, it's delivered
    const pod = getPODForLR(lr);
    if (pod) {
      // Check for discrepancies
      if (pod.piecesDelivered && lr.pieces && parseInt(pod.piecesDelivered) !== parseInt(lr.pieces)) {
        discrepancies.push(`Pieces mismatch: Expected ${lr.pieces}, Delivered ${pod.piecesDelivered}`);
      }
      
      return { 
        status: 'Delivered - POD Uploaded', 
        color: '#10b981', 
        icon: CheckCircle, 
        pod: pod,
        discrepancies: discrepancies.length > 0 ? discrepancies : null
      };
    }

    // Check if LR is in any manifest
    const manifest = manifests.find(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lr.id;
      })
    );

    if (!manifest) {
      // Check if LR belongs to selected branch (pending for dispatch)
      const lrBranch = branches.find(b => 
        b.id.toString() === lr.branch?.toString() || 
        b.branchCode === lr.branch
      );
      
      if (selectedBranch && lrBranch && (
        lrBranch.id.toString() === selectedBranch.id.toString() ||
        lrBranch.branchCode === selectedBranch.branchCode
      )) {
        return { status: 'Pending for Dispatch', color: '#f59e0b', icon: Clock };
      }
      
      return { status: 'Not Manifested', color: '#94a3b8', icon: AlertCircle };
    }

    // Check if trip exists for this manifest
    const trip = trips.find(t => 
      t.manifestId?.toString() === manifest.id?.toString() ||
      t.manifestNumber === manifest.manifestNumber ||
      t.selectedManifest?.toString() === manifest.id?.toString()
    );

    if (trip) {
      const vehicleNumber = getVehicleNumberFromTrip(trip);
      return { 
        status: 'In Transit - Trip Created', 
        color: '#3b82f6', 
        icon: Truck,
        vehicleNumber: vehicleNumber,
        trip: trip
      };
    }

    // Manifested but no trip created
    const destBranch = getDestinationBranch(manifest);
    const isForSelectedBranch = selectedBranch && destBranch && (
      destBranch.id.toString() === selectedBranch.id.toString() ||
      destBranch.branchCode === selectedBranch.branchCode
    );

    if (!isForSelectedBranch) {
      return { status: 'Manifested - Other Branch', color: '#94a3b8', icon: AlertCircle };
    }

    // Check if manifest is received
    if (manifest.receivedAt || manifest.status === 'Received') {
      const lrReceipt = manifest.lrReceipts?.[lr.id];
      if (lrReceipt?.received) {
        return { status: 'Pending Delivery', color: '#f59e0b', icon: Clock };
      }
    }

    // Manifested but no trip
    return { status: 'Manifested', color: '#8b5cf6', icon: Package };
  };

  // Helper function to check if LR is accessible to current branch
  const isLRAccessible = (lr) => {
    // Admin can see all LRs
    if (isAdmin) {
      // If admin has selected a branch, filter by that branch
      if (selectedBranch) {
        const lrBranch = branches.find(b => 
          b.id.toString() === lr.branch?.toString() || 
          b.branchCode === lr.branch
        );
        const isLRFromBranch = lrBranch && (
          lrBranch.id.toString() === selectedBranch.id.toString() ||
          lrBranch.branchCode === selectedBranch.branchCode
        );
        
        // Find manifest containing this LR
        const manifest = manifests.find(m => 
          m.selectedLRs?.some(mlr => {
            const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
            return mlrId === lr.id;
          })
        );
        
        if (manifest) {
          // If manifested, only show if destined for selected branch
          const destBranch = getDestinationBranch(manifest);
          const isForSelectedBranch = destBranch && (
            destBranch.id.toString() === selectedBranch.id.toString() ||
            destBranch.branchCode === selectedBranch.branchCode
          );
          return isForSelectedBranch;
        } else {
          // If not manifested, show if booked by selected branch
          return isLRFromBranch;
        }
      }
      // Admin with no branch selected sees all
      return true;
    }
    
    // Non-admin users: only see LRs booked by their branch OR received by their branch
    if (!selectedBranch) return false;
    
    // Check if LR was booked by user's branch
    const lrBranch = branches.find(b => 
      b.id.toString() === lr.branch?.toString() || 
      b.branchCode === lr.branch
    );
    const isLRFromBranch = lrBranch && (
      lrBranch.id.toString() === selectedBranch.id.toString() ||
      lrBranch.branchCode === selectedBranch.branchCode
    );
    
    // Check if LR is in a manifest
    const manifest = manifests.find(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lr.id;
      })
    );
    
    if (manifest) {
      // If manifested, only show if destined for this branch (received by this branch)
      const destBranch = getDestinationBranch(manifest);
      const isForSelectedBranch = destBranch && (
        destBranch.id.toString() === selectedBranch.id.toString() ||
        destBranch.branchCode === selectedBranch.branchCode
      );
      return isForSelectedBranch;
    } else {
      // If not manifested, only show if booked by this branch (pending dispatch)
      return isLRFromBranch;
    }
  };

  // Get pending shipments for selected branch
  const getPendingShipments = () => {
    if (!selectedBranch && !isAdmin) return [];

    let filteredLRs = lrBookings.filter(lr => {
      // First check if LR is accessible to current branch/user
      if (!isLRAccessible(lr)) return false;
      
      // Get LR status
      const lrStatus = getLRStatus(lr);
      
      // Check if LR belongs to selected branch (for pending dispatch)
      const lrBranch = branches.find(b => 
        b.id.toString() === lr.branch?.toString() || 
        b.branchCode === lr.branch
      );
      
      const isLRFromBranch = selectedBranch && lrBranch && (
        lrBranch.id.toString() === selectedBranch.id.toString() ||
        lrBranch.branchCode === selectedBranch.branchCode
      );

      // Find manifest containing this LR
      const manifest = manifests.find(m => 
        m.selectedLRs?.some(mlr => {
          const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
          return mlrId === lr.id;
        })
      );

      // Include if:
      // 1. Pending for dispatch (not manifested, from this branch)
      // 2. Manifested and destination is this branch (received by this branch)
      // 3. Delivered (POD exists) - if booked by or received by this branch
      
      if (!manifest) {
        // Not manifested - show if pending for dispatch from this branch
        if (isLRFromBranch && lrStatus.status === 'Pending for Dispatch') {
          // Filter by status
          if (filterStatus === 'Pending Dispatch') return true;
          if (filterStatus === 'All') return true;
          return false;
        }
        return false;
      }

      const destBranch = getDestinationBranch(manifest);
      const isForSelectedBranch = selectedBranch && destBranch && (
        destBranch.id.toString() === selectedBranch.id.toString() ||
        destBranch.branchCode === selectedBranch.branchCode
      );

      // For admin: filter by selected branch or show all
      if (isAdmin) {
        if (selectedBranch) {
          // Admin with branch selected: show if booked by OR received by selected branch
          if (!isForSelectedBranch && !isLRFromBranch) return false;
        }
        // Admin with no branch selected: show all (already filtered by isLRAccessible)
      } else {
        // For branch users: only show their branch (destination or origin)
        // This is already handled by isLRAccessible, but double-check
        if (!isForSelectedBranch && !isLRFromBranch) return false;
      }

      // Filter by status
      if (filterStatus === 'Pending Dispatch') {
        return lrStatus.status === 'Pending for Dispatch';
      } else if (filterStatus === 'Manifested') {
        return lrStatus.status === 'Manifested';
      } else if (filterStatus === 'In Transit') {
        return lrStatus.status === 'In Transit - Trip Created';
      } else if (filterStatus === 'Delivered') {
        return lrStatus.status === 'Delivered - POD Uploaded' || lrStatus.status === 'Delivered';
      }
      return true; // All
    });

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredLRs = filteredLRs.filter(lr => 
        lr.lrNumber?.toLowerCase().includes(term) ||
        lr.consignee?.name?.toLowerCase().includes(term) ||
        lr.consignor?.name?.toLowerCase().includes(term) ||
        lr.consignee?.contact?.includes(term) ||
        lr.consignor?.contact?.includes(term)
      );
    }

    return filteredLRs;
  };

  const getCityName = (cityId) => {
    if (!cityId) return 'N/A';
    const city = cities.find(c => 
      c.id.toString() === cityId.toString() || 
      c.code === cityId ||
      c.cityName === cityId
    );
    return city ? city.cityName : cityId;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Handle POD Save
  const handleSavePOD = (lr) => {
    const formData = podFormData[lr.id];
    if (!formData) {
      alert('⚠️ Please fill in POD details');
      return;
    }

    const existingPODs = JSON.parse(localStorage.getItem('pods') || '[]');
    
    // Check if POD already exists
    const existingPODIndex = existingPODs.findIndex(pod => {
      const podLRId = typeof pod.lrNumber === 'object' ? pod.lrNumber.id : pod.lrNumber;
      return podLRId === lr.id || podLRId === lr.lrNumber || pod.lrNumber === lr.lrNumber;
    });

    const podNumber = existingPODIndex >= 0 
      ? existingPODs[existingPODIndex].podNumber 
      : `POD${String(existingPODs.length + 1).padStart(6, '0')}`;

    const newPOD = {
      id: existingPODIndex >= 0 ? existingPODs[existingPODIndex].id : Date.now(),
      podNumber: podNumber,
      lrNumber: lr.id,
      lrNumberDisplay: lr.lrNumber,
      deliveryDate: formData.deliveryDate,
      deliveryTime: formData.deliveryTime,
      receiverName: formData.receiverName,
      receiverMobile: formData.receiverMobile,
      receiverIDNumber: formData.receiverIDNumber || '',
      piecesDelivered: formData.piecesDelivered,
      condition: formData.condition || 'Good',
      damageRemarks: formData.damageRemarks || '',
      deliveryLocation: lr.consignee?.address || '',
      deliveryType: lr.deliveryType || 'Godown',
      podDispatchStatus: formData.podDispatchStatus || 'Pending',
      podDispatchMode: formData.podDispatchMode || (lr.bookingMode === 'FTL' ? '' : null),
      courierName: formData.courierName || '',
      trackingNumber: formData.trackingNumber || '',
      remarks: formData.remarks || '',
      status: 'Delivered',
      createdAt: existingPODIndex >= 0 ? existingPODs[existingPODIndex].createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingPODIndex >= 0) {
      existingPODs[existingPODIndex] = newPOD;
    } else {
      existingPODs.push(newPOD);
    }

    localStorage.setItem('pods', JSON.stringify(existingPODs));
    setPods(existingPODs);
    
    // Update LR status to delivered
    const updatedLRs = lrBookings.map(l => {
      if (l.id === lr.id) {
        return { ...l, status: 'Delivered', podUploaded: true };
      }
      return l;
    });
    localStorage.setItem('lrBookings', JSON.stringify(updatedLRs));
    setLrBookings(updatedLRs);

    alert(`✅ POD "${podNumber}" ${existingPODIndex >= 0 ? 'updated' : 'created'} successfully!\n\nLR: ${lr.lrNumber}\nReceiver: ${formData.receiverName}\nPieces: ${formData.piecesDelivered}`);
    
    setExpandedLR(null);
    setPodFormData(prev => {
      const newData = { ...prev };
      delete newData[lr.id];
      return newData;
    });
  };

  const pendingShipments = getPendingShipments();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #3b82f6;
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
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
        
        .lr-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        
        .lr-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
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
        
        @media (max-width: 768px) {
          .grid-2, .grid-3 {
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
                Pending Shipments at Branch
              </h1>
              <p style={{ color: '#64748b', fontSize: '1rem' }}>
                View and manage pending LR deliveries at branch
              </p>
            </div>
            <Package size={48} style={{ color: '#3b82f6', opacity: 0.2 }} />
          </div>

          {/* Branch Selection (Admin only) */}
          {isAdmin && (
            <div className="input-group">
              <label>Select Branch</label>
              <select
                value={selectedBranch ? selectedBranch.id.toString() : 'all'}
                onChange={(e) => {
                  if (e.target.value === 'all') {
                    setSelectedBranch(null);
                  } else {
                    const branch = branches.find(b => b.id.toString() === e.target.value);
                    setSelectedBranch(branch);
                  }
                }}
              >
                <option value="all">All Branches</option>
                {branches.filter(b => b.status === 'Active').map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.branchName} - {branch.city}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Branch Display (Non-admin) */}
          {!isAdmin && selectedBranch && (
            <div style={{
              padding: '12px 16px',
              background: '#dbeafe',
              borderRadius: '8px',
              border: '2px solid #3b82f6',
              marginBottom: '16px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} style={{ color: '#3b82f6' }} />
                <div>
                  <strong style={{ color: '#1e40af' }}>Current Branch:</strong>
                  <span style={{ marginLeft: '8px', color: '#1e3a8a' }}>
                    {selectedBranch.branchName} - {selectedBranch.city}, {selectedBranch.state}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="grid-3" style={{ marginTop: '20px' }}>
            <div className="input-group">
              <label>Filter by Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending Dispatch">Pending for Dispatch</option>
                <option value="Manifested">Manifested</option>
                <option value="In Transit">In Transit - Trip Created</option>
                <option value="Delivered">Delivered - POD Uploaded</option>
              </select>
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
                  placeholder="Search by LR Number, Consignee, Consignor..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
              <div style={{ 
                padding: '10px 16px', 
                background: '#f1f5f9', 
                borderRadius: '8px',
                width: '100%',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Total Shipments</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>
                  {pendingShipments.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipments List */}
        <div className="form-section">
          {!selectedBranch && isAdmin ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Filter size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '1.1rem' }}>Please select a branch to view pending shipments</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>Or select "All Branches" to view all shipments</p>
            </div>
          ) : pendingShipments.length === 0 ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center',
              color: '#64748b'
            }}>
              <Package size={48} style={{ marginBottom: '16px', opacity: 0.3 }} />
              <p style={{ fontSize: '1.1rem' }}>No shipments found</p>
              <p style={{ fontSize: '0.9rem', marginTop: '8px' }}>
                {filterStatus !== 'All' 
                  ? `No shipments with status "${filterStatus}"` 
                  : 'No shipments available for this branch'}
              </p>
            </div>
          ) : (
            <div>
              <h2 className="section-title">Shipment Details</h2>
              {pendingShipments.map((lr) => {
                const status = getLRStatus(lr);
                const manifest = manifests.find(m => 
                  m.selectedLRs?.some(mlr => {
                    const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
                    return mlrId === lr.id;
                  })
                );
                const lrReceipt = manifest?.lrReceipts?.[lr.id];

                return (
                  <div key={lr.id} className="lr-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                            LR Number: {lr.lrNumber || 'N/A'}
                          </h3>
                          <span className="status-badge" style={{ background: `${status.color}20`, color: status.color }}>
                            {React.createElement(status.icon, { size: 14 })}
                            {status.status}
                          </span>
                        </div>
                        {status.vehicleNumber && (
                          <div style={{ fontSize: '0.85rem', color: '#3b82f6', marginBottom: '4px', fontWeight: 600 }}>
                            Vehicle: {status.vehicleNumber}
                          </div>
                        )}
                        {manifest && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>
                            Manifest: {manifest.manifestNumber || `#${manifest.id}`} | 
                            Date: {formatDate(manifest.manifestDate)}
                          </div>
                        )}
                        {status.discrepancies && status.discrepancies.length > 0 && (
                          <div style={{ 
                            fontSize: '0.85rem', 
                            color: '#dc2626', 
                            marginBottom: '4px',
                            padding: '8px',
                            background: '#fee2e2',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5'
                          }}>
                            <strong>⚠️ Discrepancies:</strong>
                            <ul style={{ margin: '4px 0 0 0', paddingLeft: '20px' }}>
                              {status.discrepancies.map((disc, idx) => (
                                <li key={idx}>{disc}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid-3" style={{ marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Consignor</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{lr.consignor?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lr.consignor?.contact || ''}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Consignee</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{lr.consignee?.name || 'N/A'}</div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{lr.consignee?.contact || ''}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Route</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {getCityName(lr.origin)} → {getCityName(lr.destination)}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                          Expected: {formatDate(lr.expectedDeliveryDate)}
                        </div>
                      </div>
                    </div>

                    <div className="grid-3" style={{ marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Pieces</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{lr.pieces || '0'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Weight (kg)</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{lr.weight || '0'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>Amount</div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>
                          {lr.totalAmount ? `₹${parseFloat(lr.totalAmount).toFixed(2)}` : 'N/A'}
                        </div>
                      </div>
                    </div>

                    {lrReceipt?.received && (
                      <div style={{
                        marginTop: '12px',
                        padding: '12px',
                        background: '#d1fae5',
                        borderRadius: '6px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{ fontSize: '0.85rem', color: '#065f46', fontWeight: 600, marginBottom: '4px' }}>
                          ✓ Received at Branch
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#047857' }}>
                          Received: {lrReceipt.receivedPieces} pieces | 
                          Received By: {lrReceipt.receivedBy || 'N/A'} | 
                          Date: {formatDate(lrReceipt.receivedAt)}
                        </div>
                        {lrReceipt.discrepancy && (
                          <div style={{ fontSize: '0.8rem', color: '#dc2626', marginTop: '4px' }}>
                            ⚠️ Discrepancy: {lrReceipt.discrepancy}
                          </div>
                        )}
                        {lrReceipt.remarks && (
                          <div style={{ fontSize: '0.8rem', color: '#475569', marginTop: '4px' }}>
                            Remarks: {lrReceipt.remarks}
                          </div>
                        )}
                      </div>
                    )}

                    <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Payment: <span style={{ fontWeight: 600 }}>{lr.paymentMode || 'N/A'}</span>
                        </div>
                        {lr.deliveryType && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Delivery: <span style={{ fontWeight: 600 }}>{lr.deliveryType}</span>
                          </div>
                        )}
                        {lr.bookingMode && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Mode: <span style={{ fontWeight: 600 }}>{lr.bookingMode}</span>
                          </div>
                        )}
                      </div>
                      {status.status !== 'Delivered' && (
                        <button
                          className="btn btn-primary"
                          onClick={() => setExpandedLR(expandedLR === lr.id ? null : lr.id)}
                          style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                        >
                          {expandedLR === lr.id ? (
                            <>
                              <X size={14} />
                              Close POD Form
                            </>
                          ) : (
                            <>
                              <Upload size={14} />
                              Upload POD
                            </>
                          )}
                        </button>
                      )}
                    </div>

                    {/* POD Form - Expandable */}
                    {expandedLR === lr.id && status.status !== 'Delivered' && (
                      <div style={{
                        marginTop: '16px',
                        padding: '20px',
                        background: '#f8fafc',
                        borderRadius: '8px',
                        border: '2px solid #3b82f6'
                      }}>
                        <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>
                          Proof of Delivery (POD) Form
                        </h4>

                        {/* Shipment Details Summary */}
                        <div style={{
                          marginBottom: '20px',
                          padding: '16px',
                          background: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}>
                          <h5 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#475569', marginBottom: '12px' }}>
                            Shipment Details
                          </h5>
                          <div className="grid-3" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            <div>
                              <strong style={{ color: '#1e293b' }}>LR Number:</strong> {lr.lrNumber || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Booking Date:</strong> {formatDate(lr.bookingDate)}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Expected Delivery:</strong> {formatDate(lr.expectedDeliveryDate)}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Consignor:</strong> {lr.consignor?.name || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Consignee:</strong> {lr.consignee?.name || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Route:</strong> {getCityName(lr.origin)} → {getCityName(lr.destination)}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Pieces:</strong> {lr.pieces || '0'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Weight:</strong> {lr.weight || '0'} kg
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Amount:</strong> ₹{lr.totalAmount ? parseFloat(lr.totalAmount).toFixed(2) : '0.00'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Payment Mode:</strong> {lr.paymentMode || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Delivery Type:</strong> {lr.deliveryType || 'N/A'}
                            </div>
                            <div>
                              <strong style={{ color: '#1e293b' }}>Booking Mode:</strong> {lr.bookingMode || 'Standard'}
                            </div>
                            {lr.consignee?.address && (
                              <div style={{ gridColumn: '1 / -1' }}>
                                <strong style={{ color: '#1e293b' }}>Delivery Address:</strong> {lr.consignee.address}
                              </div>
                            )}
                            {lr.consignee?.contact && (
                              <div>
                                <strong style={{ color: '#1e293b' }}>Consignee Contact:</strong> {lr.consignee.contact}
                              </div>
                            )}
                            {lr.consignor?.contact && (
                              <div>
                                <strong style={{ color: '#1e293b' }}>Consignor Contact:</strong> {lr.consignor.contact}
                              </div>
                            )}
                          </div>
                        </div>

                        <form onSubmit={(e) => {
                          e.preventDefault();
                          handleSavePOD(lr);
                        }}>
                          {/* Delivery Details */}
                          <div className="grid-3" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Delivery Date *</label>
                              <input
                                type="date"
                                value={podFormData[lr.id]?.deliveryDate || new Date().toISOString().split('T')[0]}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], deliveryDate: e.target.value }
                                }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Delivery Time *</label>
                              <input
                                type="time"
                                value={podFormData[lr.id]?.deliveryTime || new Date().toTimeString().slice(0, 5)}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], deliveryTime: e.target.value }
                                }))}
                                required
                              />
                            </div>
                            <div className="input-group">
                              <label>Pieces Delivered *</label>
                              <input
                                type="number"
                                value={podFormData[lr.id]?.piecesDelivered || lr.pieces || ''}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], piecesDelivered: e.target.value }
                                }))}
                                required
                                min="0"
                              />
                            </div>
                          </div>

                          {/* Receiver Details */}
                          <div className="grid-3" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Receiver Name *</label>
                              <input
                                type="text"
                                value={podFormData[lr.id]?.receiverName || ''}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], receiverName: e.target.value }
                                }))}
                                required
                                placeholder="Name of person who received"
                              />
                            </div>
                            <div className="input-group">
                              <label>Receiver Contact *</label>
                              <input
                                type="tel"
                                value={podFormData[lr.id]?.receiverMobile || ''}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], receiverMobile: e.target.value }
                                }))}
                                required
                                placeholder="Mobile number"
                              />
                            </div>
                            <div className="input-group">
                              <label>Receiver ID Number</label>
                              <input
                                type="text"
                                value={podFormData[lr.id]?.receiverIDNumber || ''}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], receiverIDNumber: e.target.value }
                                }))}
                                placeholder="Aadhar/PAN/Other ID"
                              />
                            </div>
                          </div>

                          {/* FTL Mode: POD Dispatch Details */}
                          {lr.bookingMode === 'FTL' && (
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
                                    value={podFormData[lr.id]?.podDispatchMode || ''}
                                    onChange={(e) => setPodFormData(prev => ({
                                      ...prev,
                                      [lr.id]: { 
                                        ...prev[lr.id], 
                                        podDispatchMode: e.target.value,
                                        courierName: e.target.value === 'courier' ? prev[lr.id]?.courierName : '',
                                        trackingNumber: e.target.value === 'courier' ? prev[lr.id]?.trackingNumber : ''
                                      }
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
                                    value={podFormData[lr.id]?.podDispatchStatus || 'Pending'}
                                    onChange={(e) => setPodFormData(prev => ({
                                      ...prev,
                                      [lr.id]: { ...prev[lr.id], podDispatchStatus: e.target.value }
                                    }))}
                                  >
                                    <option value="Pending">Pending</option>
                                    <option value="Dispatched">Dispatched</option>
                                    <option value="Delivered to Client">Delivered to Client</option>
                                  </select>
                                </div>
                              </div>
                              {podFormData[lr.id]?.podDispatchMode === 'courier' && (
                                <div className="grid-2">
                                  <div className="input-group">
                                    <label>Courier Name *</label>
                                    <input
                                      type="text"
                                      value={podFormData[lr.id]?.courierName || ''}
                                      onChange={(e) => setPodFormData(prev => ({
                                        ...prev,
                                        [lr.id]: { ...prev[lr.id], courierName: e.target.value }
                                      }))}
                                      required={podFormData[lr.id]?.podDispatchMode === 'courier'}
                                      placeholder="e.g., Blue Dart, DTDC, etc."
                                    />
                                  </div>
                                  <div className="input-group">
                                    <label>Tracking Number *</label>
                                    <input
                                      type="text"
                                      value={podFormData[lr.id]?.trackingNumber || ''}
                                      onChange={(e) => setPodFormData(prev => ({
                                        ...prev,
                                        [lr.id]: { ...prev[lr.id], trackingNumber: e.target.value }
                                      }))}
                                      required={podFormData[lr.id]?.podDispatchMode === 'courier'}
                                      placeholder="Courier tracking number"
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* POD Dispatch Status (for non-FTL) */}
                          {lr.bookingMode !== 'FTL' && (
                            <div className="input-group" style={{ marginBottom: '16px' }}>
                              <label>POD Dispatch Status</label>
                              <select
                                value={podFormData[lr.id]?.podDispatchStatus || 'Pending'}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], podDispatchStatus: e.target.value }
                                }))}
                              >
                                <option value="Pending">Pending</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered to Client">Delivered to Client</option>
                              </select>
                            </div>
                          )}

                          {/* Condition & Remarks */}
                          <div className="grid-2" style={{ marginBottom: '16px' }}>
                            <div className="input-group">
                              <label>Condition</label>
                              <select
                                value={podFormData[lr.id]?.condition || 'Good'}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], condition: e.target.value }
                                }))}
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
                                value={podFormData[lr.id]?.damageRemarks || ''}
                                onChange={(e) => setPodFormData(prev => ({
                                  ...prev,
                                  [lr.id]: { ...prev[lr.id], damageRemarks: e.target.value }
                                }))}
                                placeholder="If damaged or short delivery"
                              />
                            </div>
                          </div>

                          {/* Remarks */}
                          <div className="input-group" style={{ marginBottom: '16px' }}>
                            <label>Remarks</label>
                            <textarea
                              value={podFormData[lr.id]?.remarks || ''}
                              onChange={(e) => setPodFormData(prev => ({
                                ...prev,
                                [lr.id]: { ...prev[lr.id], remarks: e.target.value }
                              }))}
                              placeholder="Additional remarks or notes..."
                              rows="3"
                              style={{ resize: 'vertical' }}
                            />
                          </div>

                          {/* Submit Button */}
                          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                            <button
                              type="button"
                              className="btn btn-secondary"
                              onClick={() => {
                                setExpandedLR(null);
                                setPodFormData(prev => {
                                  const newData = { ...prev };
                                  delete newData[lr.id];
                                  return newData;
                                });
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="btn btn-primary"
                            >
                              <Save size={16} />
                              Save POD
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* POD Details Display (if POD exists) */}
                    {status.pod && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        background: '#d1fae5',
                        borderRadius: '8px',
                        border: '2px solid #10b981'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '0.9rem', color: '#065f46', fontWeight: 600, marginBottom: '8px' }}>
                              ✓ POD Uploaded - Delivered
                            </div>
                            <div className="grid-3" style={{ fontSize: '0.85rem', color: '#047857' }}>
                              <div>
                                <strong>POD Number:</strong> {status.pod.podNumber || 'N/A'}
                              </div>
                              <div>
                                <strong>Delivery Date:</strong> {formatDate(status.pod.deliveryDate)} {status.pod.deliveryTime}
                              </div>
                              <div>
                                <strong>Receiver:</strong> {status.pod.receiverName || 'N/A'}
                              </div>
                              <div>
                                <strong>Pieces Delivered:</strong> {status.pod.piecesDelivered || 'N/A'}
                              </div>
                              <div>
                                <strong>Condition:</strong> {status.pod.condition || 'Good'}
                              </div>
                              <div>
                                <strong>Dispatch Status:</strong> {status.pod.podDispatchStatus || 'Pending'}
                              </div>
                            </div>
                            {status.pod.podDispatchMode === 'courier' && (
                              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#047857' }}>
                                <strong>Courier:</strong> {status.pod.courierName || 'N/A'} | 
                                <strong> Tracking:</strong> {status.pod.trackingNumber || 'N/A'}
                              </div>
                            )}
                            {status.pod.podDispatchMode === 'hand' && (
                              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#047857' }}>
                                <strong>Dispatch Mode:</strong> By Hand
                              </div>
                            )}
                            {status.pod.remarks && (
                              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#047857' }}>
                                <strong>Remarks:</strong> {status.pod.remarks}
                              </div>
                            )}
                            {status.pod.damageRemarks && (
                              <div style={{ marginTop: '8px', fontSize: '0.85rem', color: '#dc2626' }}>
                                <strong>Damage Remarks:</strong> {status.pod.damageRemarks}
                              </div>
                            )}
                          </div>
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setExpandedLR(lr.id);
                              setPodFormData(prev => ({
                                ...prev,
                                [lr.id]: {
                                  deliveryDate: status.pod.deliveryDate || new Date().toISOString().split('T')[0],
                                  deliveryTime: status.pod.deliveryTime || new Date().toTimeString().slice(0, 5),
                                  piecesDelivered: status.pod.piecesDelivered || '',
                                  receiverName: status.pod.receiverName || '',
                                  receiverMobile: status.pod.receiverMobile || '',
                                  receiverIDNumber: status.pod.receiverIDNumber || '',
                                  podDispatchMode: status.pod.podDispatchMode || '',
                                  podDispatchStatus: status.pod.podDispatchStatus || 'Pending',
                                  courierName: status.pod.courierName || '',
                                  trackingNumber: status.pod.trackingNumber || '',
                                  condition: status.pod.condition || 'Good',
                                  damageRemarks: status.pod.damageRemarks || '',
                                  remarks: status.pod.remarks || ''
                                }
                              }));
                            }}
                            style={{ fontSize: '0.85rem', padding: '6px 12px' }}
                          >
                            <Edit2 size={14} />
                            Edit POD
                          </button>
                        </div>
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

