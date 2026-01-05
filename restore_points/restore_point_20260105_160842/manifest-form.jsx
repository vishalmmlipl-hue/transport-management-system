import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, Printer, Truck, User, Search, X, Edit2 } from 'lucide-react';

export default function ManifestForm() {
  const [lrBookings, setLrBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [trips, setTrips] = useState([]);
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // Tab state: 'create' or 'search'
  const [activeTab, setActiveTab] = useState('create');
  
  // Search state
  const [searchFilters, setSearchFilters] = useState({
    manifestNumber: '',
    fromDate: '',
    toDate: '',
    vehicleNumber: '',
    driverName: '',
    branch: '',
    status: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedManifestForPrint, setSelectedManifestForPrint] = useState(null);
  const [editingManifestId, setEditingManifestId] = useState(null);
  
  // Load data from localStorage
  useEffect(() => {
    const storedLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const storedDrivers = JSON.parse(localStorage.getItem('drivers') || '[]');
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
    const storedManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    const storedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    
    setLrBookings(storedLRs);
    setVehicles(storedVehicles.filter(v => v.status === 'Active'));
    setDrivers(storedDrivers.filter(d => d.status === 'Active'));
    setBranches(storedBranches.filter(b => b.status === 'Active'));
    setCities(storedCities);
    setManifests(storedManifests);
    setTrips(storedTrips);
  }, []);

  const [formData, setFormData] = useState({
    manifestNumber: '',
    manifestDate: new Date().toISOString().split('T')[0],
    branch: '',
    destinationBranch: '',
    vehicleNumber: '',
    driverName: '',
    route: '',
    selectedLRs: [],
    departureDate: '',
    departureTime: '',
    loadingBy: '',
    vehicleKms: '',
    remarks: ''
  });

  const [manifestSummary, setManifestSummary] = useState({
    totalPieces: 0,
    totalWeight: 0,
    totalPaid: 0,
    totalToPay: 0,
    totalTBB: 0,
    lrCount: 0
  });

  // Auto-generate manifest number
  useEffect(() => {
    const existingManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    const manifestNo = `MNF${String(existingManifests.length + 1).padStart(6, '0')}`;
    setFormData(prev => ({ ...prev, manifestNumber: manifestNo }));
  }, []);

  // Calculate summary when LRs are selected
  useEffect(() => {
    try {
      const selectedLRDetails = lrBookings.filter(lr => 
        lr && lr.id && formData.selectedLRs.includes(lr.id)
      );

      const summary = selectedLRDetails.reduce((acc, lr) => {
        if (!lr) return acc;
        
        acc.totalPieces += parseInt(lr.pieces) || 0;
        acc.totalWeight += parseFloat(lr.weight) || 0;
        
        if (lr.paymentMode === 'Paid') {
          acc.totalPaid += parseFloat(lr.totalAmount) || 0;
        } else if (lr.paymentMode === 'ToPay') {
          acc.totalToPay += parseFloat(lr.totalAmount) || 0;
        } else if (lr.paymentMode === 'TBB') {
          acc.totalTBB += parseFloat(lr.totalAmount) || 0;
        }
        
        return acc;
      }, {
        totalPieces: 0,
        totalWeight: 0,
        totalPaid: 0,
        totalToPay: 0,
        totalTBB: 0,
        lrCount: selectedLRDetails.length
      });

      setManifestSummary(summary);
    } catch (error) {
      console.error('Error calculating manifest summary:', error);
      setManifestSummary({
        totalPieces: 0,
        totalWeight: 0,
        totalPaid: 0,
        totalToPay: 0,
        totalTBB: 0,
        lrCount: 0
      });
    }
  }, [formData.selectedLRs, lrBookings]);

  // Get available LRs for selection (not in any manifest, or in the manifest being edited)
  const getAvailableLRs = () => {
    if (!lrBookings.length) return [];
    
    // Get all LRs that are in manifests (excluding the one being edited)
    const manifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    const lrsInManifests = new Set();
    
    manifests.forEach(manifest => {
      // Skip the manifest being edited
      if (editingManifestId && manifest.id === editingManifestId) return;
      
      // Collect LR IDs from this manifest
      if (manifest.selectedLRs && Array.isArray(manifest.selectedLRs)) {
        manifest.selectedLRs.forEach(lr => {
          // Handle both object and ID formats
          const lrId = typeof lr === 'object' && lr.id ? lr.id : lr;
          if (lrId) lrsInManifests.add(lrId.toString());
        });
      }
    });
    
    // Return LRs that are either:
    // 1. Not in any manifest, OR
    // 2. In the manifest being edited (so they can be shown and removed)
    return lrBookings.filter(lr => {
      if (!lr || !lr.id) return false;
      const lrIdStr = lr.id.toString();
      
      // If editing, include LRs that are in the current manifest
      if (editingManifestId && formData.selectedLRs.includes(lr.id)) {
        return true;
      }
      
      // Otherwise, only include LRs not in any manifest
      return !lrsInManifests.has(lrIdStr);
    });
  };

  const handleLRToggle = (lrId) => {
    if (!lrId) return;
    
    setFormData(prev => ({
      ...prev,
      selectedLRs: prev.selectedLRs.includes(lrId)
        ? prev.selectedLRs.filter(id => id !== lrId)
        : [...prev.selectedLRs, lrId]
    }));
  };

  const getCityName = (cityId) => {
    if (!cityId) return '';
    
    // Try to find by ID
    let city = cities.find(c => {
      if (!c) return false;
      if (c.id !== null && c.id !== undefined && String(c.id).trim() === String(cityId).trim()) return true;
      if (c.code && String(c.code).trim() === String(cityId).trim()) return true;
      if (c.cityName && String(c.cityName).trim() === String(cityId).trim()) return true;
      return false;
    });
    
    if (city && city.cityName) {
      return city.cityName;
    }
    
    // If not found, return the value as-is (might already be a city name)
    return String(cityId);
  };

  // Format date as DD-MMM-YYYY (e.g., 01-Jan-2026)
  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Format date as DD/MM/YY (e.g., 30/12/25)
  const formatDateShort = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format time as HH:MM am/pm (e.g., 11:32 am)
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'pm' : 'am';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format number with commas (e.g., 2520.00 -> 2,520.00)
  const formatNumber = (num) => {
    if (!num && num !== 0) return '0.00';
    const numValue = parseFloat(num) || 0;
    return numValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Get LR Type display (TBB, Paid, ToPay)
  const getLRType = (paymentMode) => {
    if (paymentMode === 'TBB') return 'TBB';
    if (paymentMode === 'Paid') return 'Paid';
    if (paymentMode === 'ToPay') return 'ToPay';
    return paymentMode || 'N/A';
  };

  const handlePrint = (manifest = null) => {
    if (manifest) {
      setSelectedManifestForPrint(manifest);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  // Check if a trip exists for a manifest
  const hasTrip = (manifestId) => {
    return trips.some(trip => 
      trip.manifestId?.toString() === manifestId?.toString() || 
      trip.manifestNumber === manifestId?.toString() ||
      trip.selectedManifest?.toString() === manifestId?.toString()
    );
  };

  // Handle edit manifest
  const handleEdit = (manifest) => {
    if (hasTrip(manifest.id)) {
      alert('⚠️ This manifest cannot be edited. A trip has already been created for it.');
      return;
    }
    
    // Set editing manifest ID
    setEditingManifestId(manifest.id);
    
    // Load manifest data into form
    setFormData({
      manifestNumber: manifest.manifestNumber,
      manifestDate: manifest.manifestDate,
      branch: manifest.branch,
      destinationBranch: manifest.destinationBranch,
      vehicleNumber: manifest.vehicleNumber,
      driverName: manifest.driverName,
      route: manifest.route,
      selectedLRs: manifest.selectedLRs?.map(lr => {
        // Handle both object and ID formats
        if (typeof lr === 'object' && lr.id) return lr.id;
        return lr;
      }) || [],
      departureDate: manifest.departureDate,
      departureTime: manifest.departureTime,
      loadingBy: manifest.loadingBy || '',
      vehicleKms: manifest.vehicleKms || '',
      remarks: manifest.remarks || ''
    });

    // Set selected vehicle and driver
    if (manifest.vehicleNumber) {
      const vehicle = vehicles.find(v => v.id.toString() === manifest.vehicleNumber.toString());
      if (vehicle) setSelectedVehicle(vehicle);
    }
    if (manifest.driverName) {
      const driver = drivers.find(d => d.id.toString() === manifest.driverName.toString());
      if (driver) setSelectedDriver(driver);
    }
    if (manifest.branch) {
      const branch = branches.find(b => b.id.toString() === manifest.branch.toString());
      if (branch) setSelectedBranch(branch);
    }

    // Switch to create tab
    setActiveTab('create');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle delete manifest
  const handleDelete = (manifest) => {
    if (hasTrip(manifest.id)) {
      alert('⚠️ This manifest cannot be deleted. A trip has already been created for it.');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete manifest ${manifest.manifestNumber}? This action cannot be undone.`)) {
      return;
    }

    // Remove manifest from localStorage
    const updatedManifests = manifests.filter(m => m.id !== manifest.id);
    setManifests(updatedManifests);
    localStorage.setItem('manifests', JSON.stringify(updatedManifests));

    // Update search results
    setSearchResults(searchResults.filter(m => m.id !== manifest.id));

    alert('✅ Manifest deleted successfully!');
  };

  const handleSearch = () => {
    let filtered = [...manifests];

    if (searchFilters.manifestNumber) {
      filtered = filtered.filter(m => 
        m.manifestNumber?.toLowerCase().includes(searchFilters.manifestNumber.toLowerCase())
      );
    }

    if (searchFilters.fromDate) {
      filtered = filtered.filter(m => 
        m.manifestDate >= searchFilters.fromDate
      );
    }

    if (searchFilters.toDate) {
      filtered = filtered.filter(m => 
        m.manifestDate <= searchFilters.toDate
      );
    }

    if (searchFilters.vehicleNumber) {
      const vehicle = vehicles.find(v => 
        v.id.toString() === searchFilters.vehicleNumber
      );
      if (vehicle) {
        filtered = filtered.filter(m => 
          m.vehicleNumber === vehicle.id.toString() ||
          m.vehicleNumber === vehicle.vehicleNumber
        );
      }
    }

    if (searchFilters.driverName) {
      const driver = drivers.find(d => 
        d.id.toString() === searchFilters.driverName
      );
      if (driver) {
        filtered = filtered.filter(m => 
          m.driverName === driver.id.toString() ||
          m.driverName === driver.driverName
        );
      }
    }

    if (searchFilters.branch) {
      filtered = filtered.filter(m => 
        m.branch === searchFilters.branch
      );
    }

    if (searchFilters.status) {
      filtered = filtered.filter(m => 
        m.status === searchFilters.status
      );
    }

    setSearchResults(filtered);
  };

  const clearSearch = () => {
    setSearchFilters({
      manifestNumber: '',
      fromDate: '',
      toDate: '',
      vehicleNumber: '',
      driverName: '',
      branch: '',
      status: ''
    });
    setSearchResults([]);
  };

  const getBranchName = (branchId) => {
    if (!branchId) return 'N/A';
    const branch = branches.find(b => b.id.toString() === branchId.toString());
    return branch ? branch.branchName : 'N/A';
  };

  const getVehicleNumber = (vehicleId) => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId.toString());
    return vehicle ? vehicle.vehicleNumber : vehicleId;
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id.toString() === driverId.toString());
    return driver ? driver.driverName : driverId;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (formData.selectedLRs.length === 0) {
      alert('⚠️ Please select at least one LR for the manifest!');
      return;
    }

    const existingManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    
    const selectedLRDetails = lrBookings.filter(lr => 
      formData.selectedLRs.includes(lr.id)
    );

    // Determine destination branch from LR destinations
    let destinationBranch = formData.destinationBranch;
    if (!destinationBranch && selectedLRDetails.length > 0) {
      const firstLR = selectedLRDetails[0];
      if (firstLR.destination) {
        const destinationCity = cities.find(c => c.code === firstLR.destination || c.cityName === firstLR.destination);
        if (destinationCity) {
          const destBranch = branches.find(b => 
            b.address.city === destinationCity.cityName || 
            b.address.state === destinationCity.state
          );
          if (destBranch) {
            destinationBranch = destBranch.id.toString();
          }
        }
      }
    }

    if (editingManifestId) {
      // Update existing manifest
      const manifestIndex = existingManifests.findIndex(m => m.id === editingManifestId);
      if (manifestIndex !== -1) {
        const existingManifest = existingManifests[manifestIndex];
        existingManifests[manifestIndex] = {
          ...existingManifest,
          manifestDate: formData.manifestDate,
          branch: formData.branch,
          destinationBranch: destinationBranch,
          vehicleNumber: formData.vehicleNumber,
          driverName: formData.driverName,
          route: formData.route,
          selectedLRs: selectedLRDetails,
          departureDate: formData.departureDate,
          departureTime: formData.departureTime,
          loadingBy: formData.loadingBy,
          vehicleKms: formData.vehicleKms,
          summary: manifestSummary,
          remarks: formData.remarks
        };
        localStorage.setItem('manifests', JSON.stringify(existingManifests));
        setManifests(existingManifests);
        
        const updatedManifestNumber = formData.manifestNumber;
        
        // Reset form completely
        const existingManifestsForReset = JSON.parse(localStorage.getItem('manifests') || '[]');
        const manifestNo = `MNF${String(existingManifestsForReset.length + 1).padStart(6, '0')}`;
        setFormData({
          manifestNumber: manifestNo,
          manifestDate: new Date().toISOString().split('T')[0],
          branch: '',
          destinationBranch: '',
          vehicleNumber: '',
          driverName: '',
          route: '',
          selectedLRs: [],
          departureDate: '',
          departureTime: '',
          loadingBy: '',
          vehicleKms: '',
          remarks: ''
        });
        setSelectedVehicle(null);
        setSelectedDriver(null);
        setSelectedBranch(null);
        setEditingManifestId(null);
        
        alert(`Manifest "${updatedManifestNumber}" updated successfully!`);
        
        // Switch back to search tab
        setActiveTab('search');
        handleSearch(); // Refresh search results
      }
    } else {
      // Create new manifest
      const newManifest = {
        id: Date.now(),
        manifestNumber: formData.manifestNumber,
        manifestDate: formData.manifestDate,
        branch: formData.branch,
        destinationBranch: destinationBranch,
        vehicleNumber: formData.vehicleNumber,
        driverName: formData.driverName,
        route: formData.route,
        selectedLRs: selectedLRDetails,
        departureDate: formData.departureDate,
        departureTime: formData.departureTime,
        loadingBy: formData.loadingBy,
        vehicleKms: formData.vehicleKms,
        summary: manifestSummary,
        remarks: formData.remarks,
        status: 'In Transit',
        createdAt: new Date().toISOString()
      };

      existingManifests.push(newManifest);
      localStorage.setItem('manifests', JSON.stringify(existingManifests));
      setManifests(existingManifests);

      alert(`Manifest "${formData.manifestNumber}" created successfully!\n\nTotal LRs: ${manifestSummary.lrCount}\nTotal Pieces: ${manifestSummary.totalPieces}\nTotal Weight: ${manifestSummary.totalWeight} Kg\n\nYou can now print the manifest.`);
      
      // Auto-print after creation
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const selectedLRDetails = lrBookings.filter(lr => 
    formData.selectedLRs.includes(lr.id)
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-slate-100 p-6">
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
          border-left: 4px solid #14b8a6;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(20,184,166,0.1);
          transform: translateY(-2px);
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          letter-spacing: 0.02em;
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
          letter-spacing: 0.01em;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
          background: white;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #14b8a6;
          box-shadow: 0 0 0 3px rgba(20,184,166,0.1);
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(20,184,166,0.3);
        }
        
        .btn-print {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
          margin-left: 12px;
        }
        
        .btn-print:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
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
        
        .lr-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .lr-card:hover {
          border-color: #14b8a6;
          background: #f0fdfa;
        }
        
        .lr-card.selected {
          background: #14b8a6;
          color: white;
          border-color: #14b8a6;
        }
        
        .lr-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .lr-details-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 8px;
          font-size: 0.85rem;
        }
        
        .summary-box {
          background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-bottom: 20px;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-top: 16px;
        }
        
        .summary-item {
          text-align: center;
        }
        
        .summary-value {
          font-size: 2rem;
          font-weight: 700;
          margin-bottom: 4px;
        }
        
        .summary-label {
          font-size: 0.9rem;
          opacity: 0.9;
        }
        
        /* Print Styles */
        @media print {
          body * {
            visibility: hidden;
          }
          
          .print-area, .print-area * {
            visibility: visible;
          }
          
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          
          .no-print {
            display: none !important;
          }
          
          .form-section {
            box-shadow: none;
            border: 1px solid #000;
            page-break-inside: avoid;
          }
          
          #manifest-print-view {
            display: block !important;
            visibility: visible !important;
          }
          
          #manifest-print-view .no-print {
            display: none !important;
          }
          
          table {
            width: 100%;
            border-collapse: collapse;
          }
          
          table th, table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
          }
          
          table th {
            background: #f3f4f6;
            font-weight: bold;
          }
        }
        
        .manifest-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 16px;
        }
        
        .manifest-table th {
          background: #f1f5f9;
          padding: 12px 8px;
          text-align: left;
          font-size: 0.85rem;
          font-weight: 600;
          border: 1px solid #e2e8f0;
        }
        
        .manifest-table td {
          padding: 10px 8px;
          font-size: 0.85rem;
          border: 1px solid #e2e8f0;
        }
        
        .manifest-table tr:hover {
          background: #f8fafc;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto print-area">
        <div className="text-center mb-8 no-print">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Manifest Management
          </h1>
          <p className="text-slate-600 text-lg">Create and Search Manifests</p>
        </div>

        {/* Tabs */}
        <div className="no-print" style={{ 
          display: 'flex', 
          gap: '8px', 
          marginBottom: '24px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '0'
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('create');
              setSelectedManifestForPrint(null);
            }}
            style={{
              padding: '12px 24px',
              background: activeTab === 'create' ? '#14b8a6' : 'transparent',
              color: activeTab === 'create' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'create' ? '3px solid #14b8a6' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            Create Manifest
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('search');
              setSelectedManifestForPrint(null);
            }}
            style={{
              padding: '12px 24px',
              background: activeTab === 'search' ? '#14b8a6' : 'transparent',
              color: activeTab === 'search' ? 'white' : '#64748b',
              border: 'none',
              borderBottom: activeTab === 'search' ? '3px solid #14b8a6' : '3px solid transparent',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.2s ease',
              borderRadius: '8px 8px 0 0'
            }}
          >
            Search & Print Manifest
          </button>
        </div>

        {/* Search Section */}
        {activeTab === 'search' && (
          <div className="form-section no-print">
            <h2 className="section-title">Search Manifests</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Manifest Number</label>
                <input
                  type="text"
                  value={searchFilters.manifestNumber}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, manifestNumber: e.target.value }))}
                  placeholder="Enter manifest number"
                />
              </div>
              
              <div className="input-group">
                <label>From Date</label>
                <input
                  type="date"
                  value={searchFilters.fromDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>To Date</label>
                <input
                  type="date"
                  value={searchFilters.toDate}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, toDate: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Vehicle</label>
                <select
                  value={searchFilters.vehicleNumber}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                >
                  <option value="">All Vehicles</option>
                  {vehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.vehicleNumber} - {vehicle.vehicleType}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Driver</label>
                <select
                  value={searchFilters.driverName}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, driverName: e.target.value }))}
                >
                  <option value="">All Drivers</option>
                  {drivers.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.driverName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Branch</label>
                <select
                  value={searchFilters.branch}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, branch: e.target.value }))}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} - {branch.address.city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Status</label>
                <select
                  value={searchFilters.status}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="">All Status</option>
                  <option value="In Transit">In Transit</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Created">Created</option>
                </select>
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                onClick={handleSearch}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Search size={18} /> Search
              </button>
              <button
                type="button"
                onClick={clearSearch}
                className="btn"
                style={{ 
                  background: '#e2e8f0', 
                  color: '#475569',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <X size={18} /> Clear
              </button>
            </div>
          </div>
        )}

        {/* Search Results */}
        {activeTab === 'search' && searchResults.length > 0 && (
          <div className="form-section no-print">
            <h2 className="section-title">Search Results ({searchResults.length})</h2>
            
            <div style={{ overflowX: 'auto' }}>
              <table className="manifest-table">
                <thead>
                  <tr>
                    <th>Manifest No.</th>
                    <th>Date</th>
                    <th>Branch</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>LRs</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.map((manifest) => (
                    <tr key={manifest.id}>
                      <td className="mono">{manifest.manifestNumber}</td>
                      <td>{manifest.manifestDate}</td>
                      <td>{getBranchName(manifest.branch)}</td>
                      <td>{getVehicleNumber(manifest.vehicleNumber)}</td>
                      <td>{getDriverName(manifest.driverName)}</td>
                      <td style={{ textAlign: 'center' }}>
                        {manifest.selectedLRs?.length || manifest.summary?.lrCount || 0}
                      </td>
                      <td>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          background: manifest.status === 'Delivered' ? '#d1fae5' : 
                                     manifest.status === 'In Transit' ? '#dbeafe' : '#f3f4f6',
                          color: manifest.status === 'Delivered' ? '#065f46' : 
                                manifest.status === 'In Transit' ? '#1e40af' : '#374151'
                        }}>
                          {manifest.status || 'Created'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handlePrint(manifest)}
                            className="btn btn-print"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            <Printer size={16} /> Print
                          </button>
                          {!hasTrip(manifest.id) && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleEdit(manifest)}
                                className="btn"
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '0.85rem',
                                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                  color: 'white'
                                }}
                                title="Edit Manifest"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(manifest)}
                                className="btn"
                                style={{ 
                                  padding: '6px 12px', 
                                  fontSize: '0.85rem',
                                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                  color: 'white'
                                }}
                                title="Delete Manifest"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'search' && searchResults.length === 0 && Object.values(searchFilters).some(v => v) && (
          <div className="form-section no-print">
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No manifests found matching your search criteria.
            </div>
          </div>
        )}

        {/* Print View for Selected Manifest */}
        {activeTab === 'search' && selectedManifestForPrint && (
          <div className="form-section" id="manifest-print-view" style={{ fontFamily: 'Arial, sans-serif' }}>
            <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ margin: 0 }}>Print Preview</h2>
              <button
                type="button"
                onClick={() => setSelectedManifestForPrint(null)}
                style={{
                  padding: '6px 12px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                <X size={16} /> Close Preview
              </button>
            </div>

            {/* Company Header */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                Multimode Logistics (India) Private Limited
              </div>
              <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px' }}>
                Loading Sheet
              </div>
            </div>

            {/* Header Information */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr 1fr 1fr', 
              gap: '12px',
              marginBottom: '20px',
              fontSize: '11px'
            }}>
              <div>
                <div style={{ fontWeight: 600 }}>Driver Name</div>
                <div>{getDriverName(selectedManifestForPrint.driverName)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Driver MNo</div>
                <div>
                  {(() => {
                    const driver = drivers.find(d => d.id.toString() === selectedManifestForPrint.driverName?.toString());
                    return driver ? (driver.mobile || driver.contactDetails?.mobile || 'N/A') : 'N/A';
                  })()}
                </div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Loading By</div>
                <div>{selectedManifestForPrint.loadingBy || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Date:</div>
                <div>{formatDateLong(selectedManifestForPrint.departureDate || selectedManifestForPrint.manifestDate)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Time:</div>
                <div>{selectedManifestForPrint.departureTime ? formatTime(selectedManifestForPrint.departureTime) : 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Loading No</div>
                <div className="mono" style={{ fontSize: '12px' }}>{selectedManifestForPrint.manifestNumber || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Data</div>
                <div>{formatDateLong(selectedManifestForPrint.manifestDate)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>From Location</div>
                <div>{getBranchName(selectedManifestForPrint.branch) || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Route</div>
                <div>{selectedManifestForPrint.route || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Vehicle No</div>
                <div>{getVehicleNumber(selectedManifestForPrint.vehicleNumber)}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Vehicle KM's</div>
                <div>{selectedManifestForPrint.vehicleKms || '0'}</div>
              </div>
            </div>

            {/* LR Table */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse', 
              fontSize: '10px',
              marginBottom: '20px'
            }}>
              <thead>
                <tr style={{ background: '#f0f0f0', border: '1px solid #000' }}>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>SNo.</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>LRNo</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>LR Date</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>LR Type</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>City</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>Consignor Name</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'left', fontWeight: 600 }}>Consignee Name</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 600 }}>Pkgs</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 600 }}>Weight</th>
                  <th style={{ border: '1px solid #000', padding: '6px', textAlign: 'right', fontWeight: 600 }}>Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {selectedManifestForPrint.selectedLRs?.map((lr, index) => {
                  const originCity = getCityName(lr.origin);
                  const destCity = getCityName(lr.destination);
                  const cityDisplay = `${originCity}-${destCity}`;
                  
                  // Calculate total amount from charges if not directly available
                  let totalAmount = lr.totalAmount || 0;
                  if (!totalAmount && lr.charges) {
                    const subtotal = (parseFloat(lr.charges.freightRate) || 0) +
                                   (parseFloat(lr.charges.lrCharges) || 0) +
                                   (parseFloat(lr.charges.hamali) || 0) +
                                   (parseFloat(lr.charges.pickupCharges) || 0) +
                                   (parseFloat(lr.charges.deliveryCharges) || 0) +
                                   (parseFloat(lr.charges.odaCharges) || 0) +
                                   (parseFloat(lr.charges.other) || 0) +
                                   (parseFloat(lr.charges.waraiUnion) || 0);
                    
                    const gstPercent = lr.charges.gstPercent || '5-rcm';
                    let gstRate = 0;
                    if (gstPercent === 'exempted') {
                      gstRate = 0;
                    } else if (gstPercent === '5-rcm') {
                      gstRate = 5;
                    } else {
                      gstRate = parseFloat(gstPercent) || 0;
                    }
                    
                    const gstAmount = (subtotal * gstRate) / 100;
                    totalAmount = subtotal + gstAmount;
                  }
                  
                  return (
                    <tr key={lr.id || index} style={{ border: '1px solid #000' }}>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{index + 1}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', fontFamily: 'monospace' }}>{lr.lrNumber || 'N/A'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{formatDateShort(lr.bookingDate || lr.createdAt)}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{getLRType(lr.paymentMode)}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{cityDisplay}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{lr.consignor?.name || 'N/A'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px' }}>{lr.consignee?.name || 'N/A'}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{lr.pieces || 0}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{formatNumber(lr.weight || 0)}</td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>{formatNumber(totalAmount)}</td>
                    </tr>
                  );
                })}
                {selectedManifestForPrint.summary && (
                  <tr style={{ border: '1px solid #000', fontWeight: 600, background: '#f0f0f0' }}>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }} colSpan="7">
                      {selectedManifestForPrint.selectedLRs?.length || 0}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                      {selectedManifestForPrint.summary.totalPieces || 0}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                      {formatNumber(selectedManifestForPrint.summary.totalWeight || 0)}
                    </td>
                    <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                      {formatNumber(
                        (selectedManifestForPrint.summary.totalPaid || 0) + 
                        (selectedManifestForPrint.summary.totalToPay || 0) + 
                        (selectedManifestForPrint.summary.totalTBB || 0)
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Footer Totals */}
            {selectedManifestForPrint.summary && (
              <div style={{ 
                marginTop: '20px',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr',
                gap: '12px',
                fontSize: '11px',
                fontWeight: 600
              }}>
                <div>
                  <div>NO OF PKGS:</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{selectedManifestForPrint.summary.totalPieces || 0}</div>
                </div>
                <div>
                  <div>ACTUAL WEIGHT</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(selectedManifestForPrint.summary.totalWeight || 0)}</div>
                </div>
                <div>
                  <div>TO PAY AMOUNT</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(selectedManifestForPrint.summary.totalToPay || 0)}</div>
                </div>
                <div>
                  <div>PAID AMOUNT</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(selectedManifestForPrint.summary.totalPaid || 0)}</div>
                </div>
                <div>
                  <div>TBB AMOUNT</div>
                  <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(selectedManifestForPrint.summary.totalTBB || 0)}</div>
                </div>
              </div>
            )}

            {/* Signatures */}
            <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
              <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '11px' }}>
                Prepared By
              </div>
              <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '11px' }}>
                Checked By
              </div>
              <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center', fontSize: '11px' }}>
                Driver Signature
              </div>
            </div>
          </div>
        )}

        {/* Create Manifest Form */}
        {activeTab === 'create' && (

        <form onSubmit={handleSubmit}>
          {/* Edit Mode Indicator */}
          {editingManifestId && (
            <div style={{
              padding: '12px 16px',
              background: '#fef3c7',
              border: '2px solid #fbbf24',
              borderRadius: '8px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <Edit2 size={20} style={{ color: '#92400e' }} />
              <div style={{ flex: 1 }}>
                <strong style={{ color: '#92400e', display: 'block', marginBottom: '4px' }}>
                  Editing Manifest: {formData.manifestNumber}
                </strong>
                <div style={{ color: '#78350f', fontSize: '0.9rem' }}>
                  You can remove LRs from this manifest (they will become available for other manifests) or add new available LRs.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingManifestId(null);
                  setFormData({
                    manifestNumber: '',
                    manifestDate: new Date().toISOString().split('T')[0],
                    branch: '',
                    destinationBranch: '',
                    vehicleNumber: '',
                    driverName: '',
                    route: '',
                    selectedLRs: [],
                    departureDate: '',
                    departureTime: '',
                    loadingBy: '',
                    vehicleKms: '',
                    remarks: ''
                  });
                  setSelectedVehicle(null);
                  setSelectedDriver(null);
                  setSelectedBranch(null);
                  // Regenerate manifest number
                  const existingManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
                  const manifestNo = `MNF${String(existingManifests.length + 1).padStart(6, '0')}`;
                  setFormData(prev => ({ ...prev, manifestNumber: manifestNo }));
                }}
                style={{
                  padding: '6px 12px',
                  background: '#92400e',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.85rem',
                  fontWeight: 600
                }}
              >
                Cancel Edit
              </button>
            </div>
          )}
          
          {/* Manifest Details */}
          <div className="form-section">
            <h2 className="section-title">{editingManifestId ? 'Edit Manifest Details' : 'Manifest Details'}</h2>
            
            <div className="grid-4">
              <div className="input-group">
                <label>Manifest Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.manifestNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Manifest Date *</label>
                <input
                  type="date"
                  value={formData.manifestDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, manifestDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Departure Date *</label>
                <input
                  type="date"
                  value={formData.departureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Departure Time</label>
                <input
                  type="time"
                  value={formData.departureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, departureTime: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Origin Branch *</label>
                <select
                  value={formData.branch}
                  onChange={(e) => {
                    const branchId = e.target.value;
                    const branch = branches.find(b => b.id.toString() === branchId);
                    setSelectedBranch(branch);
                    setFormData(prev => ({ ...prev, branch: branchId }));
                  }}
                  required
                >
                  <option value="">-- Select Origin Branch --</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} - {branch.address.city}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Destination Branch</label>
                <select
                  value={formData.destinationBranch}
                  onChange={(e) => setFormData(prev => ({ ...prev, destinationBranch: e.target.value }))}
                >
                  <option value="">-- Auto-detect from LRs --</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} - {branch.address.city}
                    </option>
                  ))}
                </select>
                <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                  Will be auto-detected from LR destinations if not selected
                </small>
              </div>
            </div>
            
            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Route</label>
                <input
                  type="text"
                  value={formData.route}
                  onChange={(e) => setFormData(prev => ({ ...prev, route: e.target.value }))}
                  placeholder="e.g., Idr-Del"
                />
              </div>
              
              <div className="input-group">
                <label>Loading By</label>
                <input
                  type="text"
                  value={formData.loadingBy}
                  onChange={(e) => setFormData(prev => ({ ...prev, loadingBy: e.target.value }))}
                  placeholder="e.g., DINESH"
                />
              </div>
            </div>
          </div>

          {/* Vehicle & Driver */}
          <div className="form-section no-print">
            <h2 className="section-title">Vehicle & Driver Assignment</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Vehicle Number *</label>
                {vehicles.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No vehicles available
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.vehicleNumber}
                      onChange={(e) => {
                        const vehicleId = e.target.value;
                        const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
                        setSelectedVehicle(vehicle);
                        setFormData(prev => ({ ...prev, vehicleNumber: vehicleId }));
                      }}
                      required
                    >
                      <option value="">-- Select Vehicle --</option>
                      {vehicles.map(vehicle => (
                        <option key={vehicle.id} value={vehicle.id}>
                          {vehicle.vehicleNumber} - {vehicle.vehicleType}
                        </option>
                      ))}
                    </select>
                    {selectedVehicle && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        Capacity: {selectedVehicle.capacity} {selectedVehicle.capacityUnit}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="input-group">
                <label>Driver Name *</label>
                {drivers.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No drivers available
                  </div>
                ) : (
                  <>
                    <select
                      value={formData.driverName}
                      onChange={(e) => {
                        const driverId = e.target.value;
                        const driver = drivers.find(d => d.id.toString() === driverId);
                        setSelectedDriver(driver);
                        setFormData(prev => ({ ...prev, driverName: driverId }));
                      }}
                      required
                    >
                      <option value="">-- Select Driver --</option>
                      {drivers.map(driver => (
                        <option key={driver.id} value={driver.id}>
                          {driver.driverName} - {driver.licenseNumber || driver.mobile || driver.id}
                        </option>
                      ))}
                    </select>
                    {selectedDriver && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        Mobile: {selectedDriver.mobile || selectedDriver.contactDetails?.mobile || 'N/A'} | License: {selectedDriver.licenseNumber || selectedDriver.license?.licenseNumber || 'N/A'}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Vehicle KM's</label>
                <input
                  type="number"
                  value={formData.vehicleKms}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleKms: e.target.value }))}
                  placeholder="0"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* LR Selection */}
          <div className="form-section no-print">
            <h2 className="section-title">Select LR Bookings for Manifest</h2>
            
            {lrBookings.length === 0 ? (
              <div style={{
                padding: '20px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '2px solid #fbbf24',
                color: '#92400e',
                textAlign: 'center'
              }}>
                ⚠️ No LR bookings available. Please create LR bookings first.
              </div>
            ) : getAvailableLRs().length === 0 && !editingManifestId ? (
              <div style={{
                padding: '20px',
                background: '#fee2e2',
                borderRadius: '8px',
                border: '2px solid #ef4444',
                color: '#991b1b',
                textAlign: 'center'
              }}>
                ⚠️ No available LR bookings. All LRs are already manifested.
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <p style={{ color: '#64748b', margin: 0 }}>
                    Select LRs using checkboxes or click on cards to select/deselect them for this manifest
                  </p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {formData.selectedLRs.length > 0 && (
                      <span style={{
                        padding: '6px 12px',
                        background: '#14b8a6',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {formData.selectedLRs.length} LR{formData.selectedLRs.length !== 1 ? 's' : ''} selected
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        const availableLRIds = getAvailableLRs().map(lr => lr.id);
                        setFormData(prev => ({
                          ...prev,
                          selectedLRs: prev.selectedLRs.length === availableLRIds.length ? [] : availableLRIds
                        }));
                      }}
                      style={{
                        padding: '6px 12px',
                        background: '#e2e8f0',
                        color: '#475569',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.background = '#cbd5e1'}
                      onMouseOut={(e) => e.target.style.background = '#e2e8f0'}
                    >
                      {formData.selectedLRs.length === getAvailableLRs().length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
                
                {getAvailableLRs().map(lr => (
                  <div
                    key={lr.id}
                    className={`lr-card ${formData.selectedLRs.includes(lr.id) ? 'selected' : ''}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => handleLRToggle(lr.id)}
                  >
                    <div className="lr-card-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <input
                        type="checkbox"
                        checked={formData.selectedLRs.includes(lr.id)}
                        onChange={() => handleLRToggle(lr.id)}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          width: '20px',
                          height: '20px',
                          cursor: 'pointer',
                          accentColor: '#14b8a6',
                          flexShrink: 0
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong className="mono">LR: {lr.lrNumber || 'N/A'}</strong>
                        <span style={{ marginLeft: '12px', opacity: 0.8 }}>
                          {lr.bookingDate || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span style={{
                          padding: '4px 10px',
                          background: formData.selectedLRs.includes(lr.id) ? 'rgba(255,255,255,0.2)' : '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '0.85rem',
                          fontWeight: 600
                        }}>
                          {lr.paymentMode || 'N/A'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="lr-details-grid">
                      <div>
                        <strong>From:</strong> {getCityName(lr.origin || '')}
                      </div>
                      <div>
                        <strong>To:</strong> {getCityName(lr.destination || '')}
                      </div>
                      <div>
                        <strong>Pieces:</strong> {lr.pieces || '0'}
                      </div>
                      <div>
                        <strong>Weight:</strong> {lr.weight || '0'} Kg
                      </div>
                    </div>
                    
                    <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                      <div><strong>Consignor:</strong> {lr.consignor?.name || 'N/A'}</div>
                      <div><strong>Consignee:</strong> {lr.consignee?.name || 'N/A'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          {manifestSummary.lrCount > 0 && (
            <div className="summary-box no-print">
              <h2 style={{ fontSize: '1.3rem', fontWeight: 600, marginBottom: '8px' }}>
                Manifest Summary
              </h2>
              <div className="summary-grid">
                <div className="summary-item">
                  <div className="summary-value">{manifestSummary.lrCount}</div>
                  <div className="summary-label">Total LRs</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">{manifestSummary.totalPieces}</div>
                  <div className="summary-label">Total Pieces</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">{manifestSummary.totalWeight.toFixed(2)}</div>
                  <div className="summary-label">Total Weight (Kg)</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{manifestSummary.totalPaid.toFixed(2)}</div>
                  <div className="summary-label">Paid Amount</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{manifestSummary.totalToPay.toFixed(2)}</div>
                  <div className="summary-label">To Pay Amount</div>
                </div>
                <div className="summary-item">
                  <div className="summary-value">₹{manifestSummary.totalTBB.toFixed(2)}</div>
                  <div className="summary-label">TBB Amount</div>
                </div>
              </div>
            </div>
          )}

          {/* Remarks */}
          <div className="form-section no-print">
            <h2 className="section-title">Remarks</h2>
            <div className="input-group">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special instructions or notes for this manifest..."
                rows="3"
              />
            </div>
          </div>

          {/* Print Preview */}
          {selectedLRDetails.length > 0 && (
            <div className="form-section" style={{ display: 'none', '@media print': { display: 'block' } }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>MANIFEST</h1>
                <div className="mono" style={{ fontSize: '1.2rem' }}>{formData.manifestNumber}</div>
                <div style={{ marginTop: '8px' }}>Date: {formData.manifestDate}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div>
                  <strong>Vehicle:</strong> {selectedVehicle?.vehicleNumber || 'N/A'}<br/>
                  <strong>Driver:</strong> {selectedDriver?.driverName || 'N/A'}<br/>
                  <strong>Mobile:</strong> {selectedDriver?.mobile || selectedDriver?.contactDetails?.mobile || 'N/A'}
                </div>
                <div>
                  <strong>Route:</strong> {formData.route || 'N/A'}<br/>
                  <strong>Departure:</strong> {formData.departureDate} {formData.departureTime}<br/>
                  <strong>Branch:</strong> {selectedBranch?.branchName || 'N/A'}
                </div>
              </div>

              <table className="manifest-table">
                <thead>
                  <tr>
                    <th style={{ width: '8%' }}>S.No</th>
                    <th style={{ width: '12%' }}>LR No.</th>
                    <th style={{ width: '18%' }}>Consignor</th>
                    <th style={{ width: '18%' }}>Consignee</th>
                    <th style={{ width: '8%' }}>Pieces</th>
                    <th style={{ width: '10%' }}>Weight (Kg)</th>
                    <th style={{ width: '10%' }}>From</th>
                    <th style={{ width: '10%' }}>To</th>
                    <th style={{ width: '6%' }}>Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLRDetails.map((lr, index) => (
                    <tr key={lr.id}>
                      <td>{index + 1}</td>
                      <td className="mono">{lr.lrNumber}</td>
                      <td>{lr.consignor.name}</td>
                      <td>{lr.consignee.name}</td>
                      <td style={{ textAlign: 'center' }}>{lr.pieces}</td>
                      <td style={{ textAlign: 'right' }}>{lr.weight}</td>
                      <td>{getCityName(lr.origin)}</td>
                      <td>{getCityName(lr.destination)}</td>
                      <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{lr.paymentMode}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 600, background: '#f1f5f9' }}>
                    <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL:</td>
                    <td style={{ textAlign: 'center' }}>{manifestSummary.totalPieces}</td>
                    <td style={{ textAlign: 'right' }}>{manifestSummary.totalWeight.toFixed(2)}</td>
                    <td colSpan="3"></td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>Paid:</strong> ₹{manifestSummary.totalPaid.toFixed(2)}
                </div>
                <div>
                  <strong>To Pay:</strong> ₹{manifestSummary.totalToPay.toFixed(2)}
                </div>
                <div>
                  <strong>TBB:</strong> ₹{manifestSummary.totalTBB.toFixed(2)}
                </div>
              </div>

              {formData.remarks && (
                <div style={{ marginTop: '16px' }}>
                  <strong>Remarks:</strong> {formData.remarks}
                </div>
              )}

              <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
                <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
                  Prepared By
                </div>
                <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
                  Checked By
                </div>
                <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
                  Driver Signature
                </div>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div style={{ textAlign: 'center', marginTop: '30px' }} className="no-print">
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Create Manifest
            </button>
            {manifestSummary.lrCount > 0 && (
              <button 
                type="button" 
                className="btn btn-print" 
                onClick={handlePrint}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                <Printer size={20} /> Print Preview
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
