import React, { useState, useEffect } from 'react';
import { Save, Plus, FileText, DollarSign, Fuel, X, Edit2, CheckCircle } from 'lucide-react';
import syncService from './services/syncService';

export default function TripManagementForm() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [fuelVendors, setFuelVendors] = useState([]);
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [selectedTripForExpense, setSelectedTripForExpense] = useState(null);
  
  // City search states for Origin
  const [originSearch, setOriginSearch] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [originDropdownIndex, setOriginDropdownIndex] = useState(-1);
  
  // City search states for Destination
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [destinationDropdownIndex, setDestinationDropdownIndex] = useState(-1);
  
  // Load data from localStorage
  useEffect(() => {
    setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]'));
    setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]'));
    setManifests(JSON.parse(localStorage.getItem('manifests') || '[]'));
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setVendors(JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]'));
    // Load fuel vendors (Other Vendors with Fuel Supplier category)
    const allOtherVendors = JSON.parse(localStorage.getItem('otherVendors') || '[]');
    const fuelSuppliers = allOtherVendors.filter(v => 
      v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
    );
    setFuelVendors(fuelSuppliers);
    setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
  }, []);

  const [formData, setFormData] = useState({
    tripNumber: '',
    tripDate: new Date().toISOString().split('T')[0],
    tripType: 'PTL', // PTL or FTL
    vehicleType: 'Owned', // Owned or Market
    isReturnTrip: false, // Whether this is a return trip
    parentTripNumber: '', // Trip number of the original trip (for return trips)
    parentTripId: null, // ID of the original trip
    
    // Owned Vehicle
    ownedVehicle: '',
    ownedDriver: '',
    
    // Market Vehicle
    marketVehicleNumber: '',
    marketDriverName: '',
    marketDriverMobile: '',
    marketDriverLicense: '',
    vendor: '',
    freightAmount: '',
    advanceToVendor: '',
    balanceToVendor: '',
    
    // Trip Selection
    selectedManifest: '', // For PTL
    selectedLRs: [], // For FTL (multiple LRs)
    
    // For Owned Vehicle
    advanceToDriver: '',
    fuelIssued: '',
    fuelAmount: '',
    
    // Trip Details
    origin: '',
    destination: '',
    expectedDepartureDate: '',
    expectedDepartureTime: '',
    expectedArrivalDate: '',
    expectedArrivalTime: '',
    
    // Driver Salary (for daily wages)
    driverSalaryType: '', // Monthly or Daily
    dailyWagesAmount: '',
    tripStartDate: '',
    tripStartTime: '',
    tripEndDate: '',
    tripEndTime: '',
    totalDays: 0,
    totalWages: 0,
    manualWagesEdit: false,
    
    remarks: '',
    status: 'In Progress' // In Progress, Completed, Closed
  });

  const [expenseData, setExpenseData] = useState({
    expenseType: 'Fuel', // Fuel, Toll, Loading, Unloading, Detention, Repair, Food, Other
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidTo: '',
    receiptNumber: '',
    fuelLiters: '', // Liters of fuel (only for Fuel type)
    fuelVendor: '' // Fuel vendor ID (only for Fuel type)
  });

  // Auto-generate trip number or use parent trip number for return trips
  useEffect(() => {
    if (formData.isReturnTrip && formData.parentTripNumber) {
      // Use the same trip number for return trip
      setFormData(prev => ({ ...prev, tripNumber: prev.parentTripNumber }));
    } else if (!formData.isReturnTrip) {
      // Generate new trip number only if not a return trip
      const tripNo = `TRIP${String(trips.length + 1).padStart(6, '0')}`;
      setFormData(prev => ({ ...prev, tripNumber: tripNo }));
    }
  }, [trips.length, formData.isReturnTrip, formData.parentTripNumber]);

  // Calculate balance for market vehicle
  useEffect(() => {
    if (formData.vehicleType === 'Market') {
      const freight = parseFloat(formData.freightAmount) || 0;
      const advance = parseFloat(formData.advanceToVendor) || 0;
      const balance = freight - advance;
      setFormData(prev => ({ ...prev, balanceToVendor: balance.toFixed(2) }));
    }
  }, [formData.freightAmount, formData.advanceToVendor, formData.vehicleType]);

  // Load driver salary type when driver selected
  useEffect(() => {
    if (formData.ownedDriver) {
      const driver = drivers.find(d => d.id.toString() === formData.ownedDriver);
      if (driver) {
        setFormData(prev => ({
          ...prev,
          driverSalaryType: driver.salaryType || 'Monthly',
          dailyWagesAmount: driver.salaryType === 'Daily' ? (driver.salary || '0') : ''
        }));
      }
    }
  }, [formData.ownedDriver, drivers]);

  // Calculate trip days and wages for daily wages drivers
  useEffect(() => {
    if (formData.driverSalaryType === 'Daily' && formData.tripStartDate && formData.tripEndDate) {
      const start = new Date(`${formData.tripStartDate}T${formData.tripStartTime || '00:00'}`);
      const end = new Date(`${formData.tripEndDate}T${formData.tripEndTime || '00:00'}`);
      
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      const dailyRate = parseFloat(formData.dailyWagesAmount) || 0;
      const totalWages = diffDays * dailyRate;
      
      if (!formData.manualWagesEdit) {
        setFormData(prev => ({
          ...prev,
          totalDays: diffDays,
          totalWages: totalWages
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          totalDays: diffDays
        }));
      }
    }
  }, [formData.tripStartDate, formData.tripEndDate, formData.tripStartTime, formData.tripEndTime, formData.dailyWagesAmount, formData.manualWagesEdit, formData.driverSalaryType]);

  // Sync selectedOrigin with formData.origin when formData.origin changes (for editing)
  useEffect(() => {
    if (formData.origin && cities.length > 0) {
      const city = cities.find(c => c.id?.toString() === formData.origin?.toString());
      if (city && (!selectedOrigin || selectedOrigin.id !== city.id)) {
        setSelectedOrigin(city);
        setOriginSearch('');
      }
    } else if (!formData.origin) {
      setSelectedOrigin(null);
      setOriginSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.origin, cities]);

  // Sync selectedDestination with formData.destination when formData.destination changes (for editing)
  useEffect(() => {
    if (formData.destination && cities.length > 0) {
      const city = cities.find(c => c.id?.toString() === formData.destination?.toString());
      if (city && (!selectedDestination || selectedDestination.id !== city.id)) {
        setSelectedDestination(city);
        setDestinationSearch('');
      }
    } else if (!formData.destination) {
      setSelectedDestination(null);
      setDestinationSearch('');
    }
  }, [formData.destination, cities, selectedDestination]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.vehicleType === 'Owned') {
      if (!formData.ownedVehicle) {
        alert('⚠️ Please select a vehicle!');
        return;
      }
      if (!formData.ownedDriver) {
        alert('⚠️ Please select a driver!');
        return;
      }
    }
    
    if (formData.vehicleType === 'Market') {
      if (!formData.marketVehicleNumber) {
        alert('⚠️ Please enter vehicle number!');
        return;
      }
      if (!formData.marketDriverName) {
        alert('⚠️ Please enter driver name!');
        return;
      }
      if (!formData.vendor) {
        alert('⚠️ Please select a vendor!');
        return;
      }
      if (!formData.freightAmount) {
        alert('⚠️ Please enter freight amount!');
        return;
      }
    }
    
    if (formData.tripType === 'PTL' && !formData.selectedManifest) {
      alert('⚠️ Please select a manifest for PTL trip!');
      return;
    }
    
    if (formData.tripType === 'FTL' && (!formData.selectedLRs || formData.selectedLRs.length === 0)) {
      alert('⚠️ Please select at least one LR for FTL trip!');
      return;
    }
    
    try {
      const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');

      const newTrip = {
        id: Date.now(),
        ...formData,
        expenses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save using sync service (saves to localStorage AND syncs to backend)
      await syncService.create('trips', newTrip);
      existingTrips.push(newTrip);
      setTrips(existingTrips);

      alert(`✅ Trip "${formData.tripNumber}" created successfully!\n\nTrip Type: ${formData.tripType}\nVehicle: ${formData.vehicleType}\nStatus: ${formData.status}`);
      
      // Reset form
      window.location.reload();
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('❌ Error creating trip. Please check the console for details.');
    }
  };

  const handleAddExpense = async () => {
    if (!selectedTripForExpense) return;

    // Validation for fuel expenses
    if (expenseData.expenseType === 'Fuel') {
      if (!expenseData.fuelLiters || parseFloat(expenseData.fuelLiters) <= 0) {
        alert('⚠️ Please enter valid fuel liters!');
        return;
      }
      if (!expenseData.fuelVendor) {
        alert('⚠️ Please select a fuel vendor!');
        return;
      }
    }

    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id === selectedTripForExpense.id);

    if (tripIndex !== -1) {
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        addedAt: new Date().toISOString()
      };

      if (!existingTrips[tripIndex].expenses) {
        existingTrips[tripIndex].expenses = [];
      }

      existingTrips[tripIndex].expenses.push(newExpense);
      existingTrips[tripIndex].updatedAt = new Date().toISOString();

      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);

      // Sync update to backend
      await syncService.update('trips', selectedTripForExpense.id, existingTrips[tripIndex]);

      const fuelInfo = expenseData.expenseType === 'Fuel' && expenseData.fuelLiters
        ? `\nFuel: ${expenseData.fuelLiters} Liters`
        : '';
      const vendorInfo = expenseData.expenseType === 'Fuel' && expenseData.fuelVendor
        ? `\nVendor: ${fuelVendors.find(v => v.id.toString() === expenseData.fuelVendor)?.tradeName || 'N/A'}`
        : '';

      alert(`✅ Expense added to Trip ${selectedTripForExpense.tripNumber}!\n\nType: ${expenseData.expenseType}\nAmount: ₹${expenseData.amount}${fuelInfo}${vendorInfo}`);

      setExpenseData({
        expenseType: 'Fuel',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paidTo: '',
        receiptNumber: '',
        fuelLiters: '',
        fuelVendor: ''
      });
      
      setShowExpenseModal(false);
      setSelectedTripForExpense(null);
    }
  };

  const handleCloseTrip = async (tripId) => {
    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id === tripId);

    if (tripIndex !== -1) {
      existingTrips[tripIndex].status = 'Closed';
      existingTrips[tripIndex].closedAt = new Date().toISOString();
      existingTrips[tripIndex].updatedAt = new Date().toISOString();

      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);

      // Sync update to backend
      await syncService.update('trips', tripId, existingTrips[tripIndex]);

      alert(`✅ Trip ${existingTrips[tripIndex].tripNumber} has been closed!`);
    }
  };

  const getVehicleDetails = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
    return vehicle ? `${vehicle.vehicleNumber} - ${vehicle.vehicleType}` : 'N/A';
  };

  const getDriverDetails = (driverId) => {
    const driver = drivers.find(d => d.id.toString() === driverId);
    return driver ? `${driver.driverName} (${driver.licenseNumber || driver.mobile})` : 'N/A';
  };

  const calculateTotalExpenses = (trip) => {
    if (!trip.expenses || trip.expenses.length === 0) return 0;
    return trip.expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  // Calculate total expenses for all trips with the same trip number (round trip)
  const calculateTotalExpensesForTripNumber = (tripNumber) => {
    const tripsWithSameNumber = trips.filter(t => t.tripNumber === tripNumber);
    return tripsWithSameNumber.reduce((sum, trip) => sum + calculateTotalExpenses(trip), 0);
  };

  // Calculate total revenue for a trip (from freight amount for market vehicles or LR bookings)
  const calculateTripRevenue = (trip) => {
    let revenue = 0;
    
    // For market vehicles, revenue is the freight amount
    if (trip.vehicleType === 'Market' && trip.freightAmount) {
      revenue += parseFloat(trip.freightAmount) || 0;
    }
    
    // For owned vehicles, calculate revenue from LR bookings
    if (trip.vehicleType === 'Owned' && trip.selectedLRs && trip.selectedLRs.length > 0) {
      trip.selectedLRs.forEach(lrId => {
        const lr = lrBookings.find(l => l.id.toString() === lrId.toString());
        if (lr && lr.totalAmount) {
          revenue += parseFloat(lr.totalAmount) || 0;
        }
      });
    }
    
    // For PTL trips, calculate revenue from manifest
    if (trip.tripType === 'PTL' && trip.selectedManifest) {
      const manifest = manifests.find(m => m.id.toString() === trip.selectedManifest.toString());
      if (manifest && manifest.lrNumbers && manifest.lrNumbers.length > 0) {
        manifest.lrNumbers.forEach(lrNumber => {
          const lr = lrBookings.find(l => l.lrNumber === lrNumber);
          if (lr && lr.totalAmount) {
            revenue += parseFloat(lr.totalAmount) || 0;
          }
        });
      }
    }
    
    return revenue;
  };

  // Calculate total revenue for all trips with the same trip number (round trip)
  const calculateTotalRevenueForTripNumber = (tripNumber) => {
    const tripsWithSameNumber = trips.filter(t => t.tripNumber === tripNumber);
    return tripsWithSameNumber.reduce((sum, trip) => sum + calculateTripRevenue(trip), 0);
  };

  // Get all trips with the same trip number (for round trips)
  const getTripsWithSameNumber = (tripNumber) => {
    return trips.filter(t => t.tripNumber === tripNumber);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
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
          border-left: 4px solid #3b82f6;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(59,130,246,0.1);
          transform: translateY(-2px);
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
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
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
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
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
        
        .radio-group {
          display: flex;
          gap: 20px;
          margin-top: 8px;
        }
        
        .radio-item {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .radio-item input[type="radio"] {
          width: auto;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
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
        
        .trip-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .trip-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
        }
        
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-in-progress {
          background: #dbeafe;
          color: #1e40af;
        }
        
        .status-completed {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-closed {
          background: #e5e7eb;
          color: #374151;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Trip Management
          </h1>
          <p className="text-slate-600 text-lg">Create & Manage Trips with Complete Expense Tracking</p>
        </div>

        {/* Create Trip Form */}
        <form onSubmit={handleSubmit}>
          {/* Trip Basic Details */}
          <div className="form-section">
            <h2 className="section-title">Trip Details</h2>
            
            <div className="grid-4">
              <div className="input-group">
                <label>Trip Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.tripNumber}
                  readOnly
                  style={{ background: '#f8fafc' }}
                />
              </div>
              
              <div className="input-group">
                <label>Trip Date *</label>
                <input
                  type="date"
                  value={formData.tripDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Trip Type *</label>
                <select
                  value={formData.tripType}
                  onChange={(e) => setFormData(prev => ({ ...prev, tripType: e.target.value }))}
                  required
                >
                  <option value="PTL">PTL (Part Truck Load)</option>
                  <option value="FTL">FTL (Full Truck Load)</option>
                </select>
              </div>
            </div>
            
            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isReturnTrip}
                    onChange={(e) => {
                      const isReturn = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        isReturnTrip: isReturn,
                        parentTripNumber: isReturn ? prev.parentTripNumber : '',
                        parentTripId: isReturn ? prev.parentTripId : null
                      }));
                    }}
                    style={{ marginRight: '8px', width: 'auto' }}
                  />
                  Return Trip (Use same trip number as original)
                </label>
                {formData.isReturnTrip && (
                  <select
                    value={formData.parentTripNumber}
                    onChange={(e) => {
                      const selectedTrip = trips.find(t => t.tripNumber === e.target.value);
                      if (selectedTrip) {
                        // Auto-fill vehicle and driver from parent trip
                        setFormData(prev => ({
                          ...prev,
                          parentTripNumber: e.target.value,
                          parentTripId: selectedTrip.id,
                          tripNumber: e.target.value, // Use same trip number
                          vehicleType: selectedTrip.vehicleType, // Same vehicle type
                          // For Owned Vehicle
                          ownedVehicle: selectedTrip.ownedVehicle || prev.ownedVehicle,
                          ownedDriver: selectedTrip.ownedDriver || prev.ownedDriver,
                          // For Market Vehicle
                          marketVehicleNumber: selectedTrip.marketVehicleNumber || prev.marketVehicleNumber,
                          marketDriverName: selectedTrip.marketDriverName || prev.marketDriverName,
                          marketDriverMobile: selectedTrip.marketDriverMobile || prev.marketDriverMobile,
                          marketDriverLicense: selectedTrip.marketDriverLicense || prev.marketDriverLicense,
                          vendor: selectedTrip.vendor || prev.vendor,
                          freightAmount: selectedTrip.freightAmount || prev.freightAmount,
                          advanceToVendor: selectedTrip.advanceToVendor || prev.advanceToVendor,
                          balanceToVendor: selectedTrip.balanceToVendor || prev.balanceToVendor
                        }));
                      } else {
                        setFormData(prev => ({
                          ...prev,
                          parentTripNumber: e.target.value,
                          parentTripId: null,
                          tripNumber: e.target.value
                        }));
                      }
                    }}
                    required={formData.isReturnTrip}
                    style={{ marginTop: '8px' }}
                  >
                    <option value="">-- Select Original Trip --</option>
                    {trips
                      .filter(t => !t.isReturnTrip) // Only show non-return trips
                      .map(trip => (
                        <option key={trip.id} value={trip.tripNumber}>
                          {trip.tripNumber} - {trip.origin} → {trip.destination} ({trip.tripDate})
                        </option>
                      ))}
                  </select>
                )}
              </div>
            </div>
            
            <div className="grid-4" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Vehicle Type *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                  required
                >
                  <option value="Owned">Owned Vehicle</option>
                  <option value="Market">Market Vehicle</option>
                </select>
              </div>
            </div>
          </div>

          {/* Owned Vehicle Section */}
          {formData.vehicleType === 'Owned' && (
            <div className="form-section">
              <h2 className="section-title">Owned Vehicle Details</h2>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>Select Vehicle *</label>
                  <select
                    value={formData.ownedVehicle}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownedVehicle: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Vehicle --</option>
                    {vehicles.filter(v => v.status === 'Active').map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} - {vehicle.vehicleType} ({vehicle.capacity} {vehicle.capacityUnit})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Select Driver *</label>
                  <select
                    value={formData.ownedDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, ownedDriver: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Driver --</option>
                    {drivers.filter(d => d.status === 'Active').map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.driverName} - {driver.licenseNumber || driver.mobile} ({driver.salaryType || 'Monthly'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>Advance to Driver (₹)</label>
                  <input
                    type="number"
                    value={formData.advanceToDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceToDriver: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="input-group">
                  <label>Fuel Issued (Liters)</label>
                  <input
                    type="number"
                    value={formData.fuelIssued}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelIssued: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="input-group">
                  <label>Fuel Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.fuelAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelAmount: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Market Vehicle Section */}
          {formData.vehicleType === 'Market' && (
            <div className="form-section">
              <h2 className="section-title">Market Vehicle Details</h2>
              
              <div className="grid-2">
                <div className="input-group">
                  <label>Vehicle Number *</label>
                  <input
                    type="text"
                    value={formData.marketVehicleNumber}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketVehicleNumber: e.target.value.toUpperCase() }))}
                    placeholder="MH12AB1234"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Select Vendor *</label>
                  <select
                    value={formData.vendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.filter(v => v.status === 'Active').map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.vendorName} - {vendor.vendorCode || vendor.id}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>Driver Name *</label>
                  <input
                    type="text"
                    value={formData.marketDriverName}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketDriverName: e.target.value }))}
                    placeholder="Driver Name"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Driver Mobile *</label>
                  <input
                    type="tel"
                    value={formData.marketDriverMobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketDriverMobile: e.target.value }))}
                    placeholder="9876543210"
                    pattern="[0-9]{10}"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Driver License</label>
                  <input
                    type="text"
                    value={formData.marketDriverLicense}
                    onChange={(e) => setFormData(prev => ({ ...prev, marketDriverLicense: e.target.value }))}
                    placeholder="License Number"
                  />
                </div>
              </div>
              
              <div className="grid-3">
                <div className="input-group">
                  <label>Freight Amount (₹) *</label>
                  <input
                    type="number"
                    value={formData.freightAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, freightAmount: e.target.value }))}
                    placeholder="0"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Advance to Vendor (₹)</label>
                  <input
                    type="number"
                    value={formData.advanceToVendor}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceToVendor: e.target.value }))}
                    placeholder="0"
                  />
                </div>
                
                <div className="input-group">
                  <label>Balance Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.balanceToVendor}
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Trip Selection - PTL */}
          {formData.tripType === 'PTL' && (
            <div className="form-section">
              <h2 className="section-title">Select Manifest (PTL)</h2>
              
              {manifests.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                  ⚠️ No manifests available. Please create a manifest first from the Manifest module.
                </div>
              ) : (
                <div className="input-group">
                  <label>Manifest *</label>
                  <select
                    value={formData.selectedManifest}
                    onChange={(e) => setFormData(prev => ({ ...prev, selectedManifest: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Manifest --</option>
                    {manifests.map(manifest => (
                      <option key={manifest.id} value={manifest.id}>
                        {manifest.manifestNumber} - {manifest.manifestDate} ({manifest.summary?.lrCount || manifest.selectedLRs?.length || 0} LRs, {manifest.summary?.totalPieces || 0} Pieces)
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Trip Selection - FTL */}
          {formData.tripType === 'FTL' && (
            <div className="form-section">
              <h2 className="section-title">Select LR Bookings (FTL)</h2>
              
              {lrBookings.filter(lr => lr.bookingMode === 'FTL').length === 0 ? (
                <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                  ⚠️ No FTL LR bookings available. Please create FTL bookings first from the LR Booking module.
                </div>
              ) : (
                <div>
                  {lrBookings.filter(lr => lr.bookingMode === 'FTL').map(lr => (
                  <div key={lr.id} style={{
                    padding: '12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    background: formData.selectedLRs.includes(lr.id) ? '#dbeafe' : 'white'
                  }}
                  onClick={() => {
                    if (formData.selectedLRs.includes(lr.id)) {
                      setFormData(prev => ({
                        ...prev,
                        selectedLRs: prev.selectedLRs.filter(id => id !== lr.id)
                      }));
                    } else {
                      setFormData(prev => ({
                        ...prev,
                        selectedLRs: [...prev.selectedLRs, lr.id]
                      }));
                    }
                  }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong className="mono">{lr.lrNumber}</strong>
                        <span style={{ marginLeft: '12px' }}>{lr.bookingDate}</span>
                      </div>
                      <div>
                        <span style={{ marginRight: '12px' }}>{lr.pieces} Pcs, {lr.weight} Kg</span>
                        <span style={{
                          padding: '4px 8px',
                          background: '#f1f5f9',
                          borderRadius: '6px',
                          fontSize: '0.85rem'
                        }}>
                          {lr.paymentMode}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

          {/* Driver Salary Section (for Daily Wages) */}
          {formData.vehicleType === 'Owned' && formData.driverSalaryType === 'Daily' && (
            <div className="form-section">
              <h2 className="section-title">Driver Daily Wages</h2>
              
              <div className="grid-4">
                <div className="input-group">
                  <label>Trip Start Date *</label>
                  <input
                    type="date"
                    value={formData.tripStartDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripStartDate: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Trip Start Time</label>
                  <input
                    type="time"
                    value={formData.tripStartTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripStartTime: e.target.value }))}
                  />
                </div>
                
                <div className="input-group">
                  <label>Trip End Date</label>
                  <input
                    type="date"
                    value={formData.tripEndDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripEndDate: e.target.value }))}
                  />
                </div>
                
                <div className="input-group">
                  <label>Trip End Time</label>
                  <input
                    type="time"
                    value={formData.tripEndTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, tripEndTime: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="grid-4">
                <div className="input-group">
                  <label>Daily Rate (₹)</label>
                  <input
                    type="number"
                    value={formData.dailyWagesAmount}
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>
                
                <div className="input-group">
                  <label>Total Days</label>
                  <input
                    type="number"
                    value={formData.totalDays}
                    readOnly
                    style={{ background: '#f8fafc' }}
                  />
                </div>
                
                <div className="input-group">
                  <label>Total Wages (₹)</label>
                  <input
                    type="number"
                    value={formData.totalWages}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        totalWages: e.target.value,
                        manualWagesEdit: true
                      }));
                    }}
                    style={{ background: formData.manualWagesEdit ? '#fef3c7' : '#f8fafc' }}
                  />
                </div>
                
                <div className="input-group">
                  <label style={{ opacity: 0 }}>Action</label>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setFormData(prev => ({ ...prev, manualWagesEdit: !prev.manualWagesEdit }))}
                    style={{ width: '100%' }}
                  >
                    <Edit2 size={16} />
                    {formData.manualWagesEdit ? 'Auto Calculate' : 'Manual Edit'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Route Details */}
          <div className="form-section">
            <h2 className="section-title">Route & Schedule</h2>
            
            <div className="grid-2">
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Origin</label>
                {cities.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No cities available. Please add cities in City Master.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={originSearch || (selectedOrigin ? `${selectedOrigin.cityName}, ${selectedOrigin.state}` : '')}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setOriginSearch(searchTerm);
                        setShowOriginDropdown(true);
                        setOriginDropdownIndex(-1);
                        
                        // If search term is cleared, clear selection
                        if (!searchTerm) {
                          setSelectedOrigin(null);
                          setFormData(prev => ({ ...prev, origin: '' }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' && showOriginDropdown && originSearch && originSearch.length >= 3) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities.length > 0) {
                            const nextIndex = originDropdownIndex < filteredCities.length - 1 ? originDropdownIndex + 1 : 0;
                            setOriginDropdownIndex(nextIndex);
                          }
                        } else if (e.key === 'ArrowUp' && showOriginDropdown && originSearch && originSearch.length >= 3) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities.length > 0) {
                            const prevIndex = originDropdownIndex > 0 ? originDropdownIndex - 1 : filteredCities.length - 1;
                            setOriginDropdownIndex(prevIndex);
                          }
                        } else if (e.key === 'Enter' && originDropdownIndex >= 0 && showOriginDropdown) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities[originDropdownIndex]) {
                            const city = filteredCities[originDropdownIndex];
                            setSelectedOrigin(city);
                            setFormData(prev => ({ ...prev, origin: city.id.toString() }));
                            setOriginSearch('');
                            setShowOriginDropdown(false);
                            setOriginDropdownIndex(-1);
                          }
                        }
                      }}
                      onFocus={() => {
                        setShowOriginDropdown(true);
                        setOriginDropdownIndex(-1);
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowOriginDropdown(false);
                        setOriginDropdownIndex(-1);
                      }, 200)}
                      placeholder="Type first 3 letters to search city..."
                      style={{ width: '100%' }}
                    />
                    {showOriginDropdown && originSearch && originSearch.length >= 3 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        marginTop: '4px'
                      }}>
                        {cities
                          .filter(city => 
                            city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                          )
                          .slice(0, 10)
                          .map((city, index) => (
                            <div
                              key={city.id}
                              onClick={() => {
                                setSelectedOrigin(city);
                                setFormData(prev => ({ ...prev, origin: city.id.toString() }));
                                setOriginSearch('');
                                setShowOriginDropdown(false);
                                setOriginDropdownIndex(-1);
                              }}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                background: originDropdownIndex === index ? '#f8fafc' : 'white'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#f8fafc';
                                setOriginDropdownIndex(index);
                              }}
                              onMouseLeave={(e) => {
                                if (originDropdownIndex !== index) {
                                  e.target.style.background = 'white';
                                }
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{city.cityName}, {city.state}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {city.zone} Zone {city.isODA && <span style={{ color: '#f59e0b' }}>• ODA</span>}
                              </div>
                            </div>
                          ))}
                        {cities.filter(city => 
                          city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                        ).length === 0 && (
                          <div style={{ padding: '10px', color: '#64748b', textAlign: 'center' }}>
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Destination</label>
                {cities.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No cities available. Please add cities in City Master.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={destinationSearch || (selectedDestination ? `${selectedDestination.cityName}, ${selectedDestination.state}` : '')}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        setDestinationSearch(searchTerm);
                        setShowDestinationDropdown(true);
                        setDestinationDropdownIndex(-1);
                        
                        // If search term is cleared, clear selection
                        if (!searchTerm) {
                          setSelectedDestination(null);
                          setFormData(prev => ({ ...prev, destination: '' }));
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'ArrowDown' && showDestinationDropdown && destinationSearch && destinationSearch.length >= 3) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities.length > 0) {
                            const nextIndex = destinationDropdownIndex < filteredCities.length - 1 ? destinationDropdownIndex + 1 : 0;
                            setDestinationDropdownIndex(nextIndex);
                          }
                        } else if (e.key === 'ArrowUp' && showDestinationDropdown && destinationSearch && destinationSearch.length >= 3) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities.length > 0) {
                            const prevIndex = destinationDropdownIndex > 0 ? destinationDropdownIndex - 1 : filteredCities.length - 1;
                            setDestinationDropdownIndex(prevIndex);
                          }
                        } else if (e.key === 'Enter' && destinationDropdownIndex >= 0 && showDestinationDropdown) {
                          e.preventDefault();
                          const filteredCities = cities.filter(city => 
                            city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                          ).slice(0, 10);
                          if (filteredCities[destinationDropdownIndex]) {
                            const city = filteredCities[destinationDropdownIndex];
                            setSelectedDestination(city);
                            setFormData(prev => ({ ...prev, destination: city.id.toString() }));
                            setDestinationSearch('');
                            setShowDestinationDropdown(false);
                            setDestinationDropdownIndex(-1);
                          }
                        }
                      }}
                      onFocus={() => {
                        setShowDestinationDropdown(true);
                        setDestinationDropdownIndex(-1);
                      }}
                      onBlur={() => setTimeout(() => {
                        setShowDestinationDropdown(false);
                        setDestinationDropdownIndex(-1);
                      }, 200)}
                      placeholder="Type first 3 letters to search city..."
                      style={{ width: '100%' }}
                    />
                    {showDestinationDropdown && destinationSearch && destinationSearch.length >= 3 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        marginTop: '4px'
                      }}>
                        {cities
                          .filter(city => 
                            city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                          )
                          .slice(0, 10)
                          .map((city, index) => (
                            <div
                              key={city.id}
                              onClick={() => {
                                setSelectedDestination(city);
                                setFormData(prev => ({ ...prev, destination: city.id.toString() }));
                                setDestinationSearch('');
                                setShowDestinationDropdown(false);
                                setDestinationDropdownIndex(-1);
                              }}
                              style={{
                                padding: '10px',
                                cursor: 'pointer',
                                borderBottom: '1px solid #f1f5f9',
                                background: destinationDropdownIndex === index ? '#f8fafc' : 'white'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.background = '#f8fafc';
                                setDestinationDropdownIndex(index);
                              }}
                              onMouseLeave={(e) => {
                                if (destinationDropdownIndex !== index) {
                                  e.target.style.background = 'white';
                                }
                              }}
                            >
                              <div style={{ fontWeight: 600 }}>{city.cityName}, {city.state}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                {city.zone} Zone {city.isODA && <span style={{ color: '#f59e0b' }}>• ODA</span>}
                              </div>
                            </div>
                          ))}
                        {cities.filter(city => 
                          city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                        ).length === 0 && (
                          <div style={{ padding: '10px', color: '#64748b', textAlign: 'center' }}>
                            No cities found
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
            
            <div className="grid-4">
              <div className="input-group">
                <label>Expected Departure Date</label>
                <input
                  type="date"
                  value={formData.expectedDepartureDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDepartureDate: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Expected Departure Time</label>
                <input
                  type="time"
                  value={formData.expectedDepartureTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDepartureTime: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Expected Arrival Date</label>
                <input
                  type="date"
                  value={formData.expectedArrivalDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedArrivalDate: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Expected Arrival Time</label>
                <input
                  type="time"
                  value={formData.expectedArrivalTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedArrivalTime: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Remarks</h2>
            <div className="input-group">
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special instructions or notes..."
                rows="3"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> Create Trip
            </button>
          </div>
        </form>

        {/* Existing Trips List */}
        {trips.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Active & Recent Trips</h2>
            
            {trips.slice().reverse().map(trip => {
              const tripsWithSameNumber = getTripsWithSameNumber(trip.tripNumber);
              const isRoundTrip = tripsWithSameNumber.length > 1;
              const isFirstTrip = tripsWithSameNumber[0]?.id === trip.id;
              
              return (
              <div key={trip.id} className="trip-card" style={{
                borderLeft: isRoundTrip ? '4px solid #10b981' : '2px solid #e2e8f0',
                position: 'relative'
              }}>
                {isRoundTrip && isFirstTrip && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: '#10b981',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Round Trip ({tripsWithSameNumber.length} legs)
                  </div>
                )}
                {trip.isReturnTrip && (
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: isRoundTrip && isFirstTrip ? '120px' : '12px',
                    background: '#06b6d4',
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 600
                  }}>
                    Return Trip
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 className="mono" style={{ fontSize: '1.2rem', marginBottom: '4px' }}>
                      {trip.tripNumber}
                    </h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>{trip.tripDate}</p>
                  </div>
                  <span className={`status-badge status-${trip.status.toLowerCase().replace(' ', '-')}`}>
                    {trip.status}
                  </span>
                </div>
                
                <div className="grid-3" style={{ marginBottom: '12px', fontSize: '0.9rem' }}>
                  <div>
                    <strong>Type:</strong> {trip.tripType}
                  </div>
                  <div>
                    <strong>Vehicle:</strong> {trip.vehicleType}
                  </div>
                  <div>
                    <strong>Route:</strong> {trip.origin} → {trip.destination}
                  </div>
                </div>
                
                {/* Vehicle and Driver Information - Always show for all trips including return trips */}
                {trip.vehicleType === 'Owned' && (
                  <div style={{ 
                    fontSize: '0.9rem', 
                    marginBottom: '12px',
                    padding: '12px',
                    background: trip.isReturnTrip ? '#eff6ff' : '#f8fafc',
                    borderRadius: '8px',
                    border: trip.isReturnTrip ? '1px solid #06b6d4' : '1px solid #e2e8f0'
                  }}>
                    {trip.isReturnTrip && (
                      <div style={{ 
                        color: '#06b6d4', 
                        fontWeight: 600, 
                        marginBottom: '8px',
                        fontSize: '0.85rem'
                      }}>
                        🔄 Return Trip - Same Vehicle & Driver as Original
                      </div>
                    )}
                    <div><strong>Vehicle Number:</strong> {getVehicleDetails(trip.ownedVehicle)}</div>
                    <div style={{ marginTop: '4px' }}><strong>Driver:</strong> {getDriverDetails(trip.ownedDriver)}</div>
                  </div>
                )}
                
                {trip.vehicleType === 'Market' && (
                  <div style={{ 
                    fontSize: '0.9rem', 
                    marginBottom: '12px',
                    padding: '12px',
                    background: trip.isReturnTrip ? '#eff6ff' : '#f8fafc',
                    borderRadius: '8px',
                    border: trip.isReturnTrip ? '1px solid #06b6d4' : '1px solid #e2e8f0'
                  }}>
                    {trip.isReturnTrip && (
                      <div style={{ 
                        color: '#06b6d4', 
                        fontWeight: 600, 
                        marginBottom: '8px',
                        fontSize: '0.85rem'
                      }}>
                        🔄 Return Trip - Same Vehicle & Driver as Original
                      </div>
                    )}
                    <div><strong>Vehicle Number:</strong> {trip.marketVehicleNumber || 'N/A'}</div>
                    <div style={{ marginTop: '4px' }}>
                      <strong>Driver:</strong> {trip.marketDriverName || 'N/A'} 
                      {trip.marketDriverMobile && ` (${trip.marketDriverMobile})`}
                    </div>
                    {trip.marketDriverLicense && (
                      <div style={{ marginTop: '4px', fontSize: '0.85rem', color: '#64748b' }}>
                        <strong>License:</strong> {trip.marketDriverLicense}
                      </div>
                    )}
                    {trip.freightAmount && (
                      <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                        <strong>Freight:</strong> ₹{trip.freightAmount} 
                        {trip.advanceToVendor && ` (Adv: ₹${trip.advanceToVendor}, Bal: ₹${trip.balanceToVendor})`}
                      </div>
                    )}
                  </div>
                )}
                
                {trip.expenses && trip.expenses.length > 0 && (
                  <div style={{
                    background: '#f8fafc',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong>This Trip Expenses:</strong> ₹{calculateTotalExpenses(trip).toFixed(2)}
                      <span style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        ({trip.expenses.length} entries)
                      </span>
                    </div>
                    {isRoundTrip && isFirstTrip && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        background: '#d1fae5',
                        borderRadius: '6px',
                        border: '1px solid #10b981'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: '#065f46' }}>Round Trip Total Expenses:</strong>
                          <strong style={{ color: '#065f46' }}>₹{calculateTotalExpensesForTripNumber(trip.tripNumber).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <strong style={{ color: '#065f46' }}>Round Trip Total Revenue:</strong>
                          <strong style={{ color: '#065f46' }}>₹{calculateTotalRevenueForTripNumber(trip.tripNumber).toFixed(2)}</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #10b981' }}>
                          <strong style={{ color: '#065f46' }}>Round Trip Profit:</strong>
                          <strong style={{ 
                            color: (calculateTotalRevenueForTripNumber(trip.tripNumber) - calculateTotalExpensesForTripNumber(trip.tripNumber)) >= 0 ? '#065f46' : '#dc2626'
                          }}>
                            ₹{(calculateTotalRevenueForTripNumber(trip.tripNumber) - calculateTotalExpensesForTripNumber(trip.tripNumber)).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    )}
                    <div style={{ marginTop: '8px', fontSize: '0.85rem' }}>
                      {trip.expenses.map((exp, idx) => (
                        <div key={idx} style={{ 
                          padding: '6px 8px', 
                          background: 'white', 
                          borderRadius: '4px', 
                          marginBottom: '4px',
                          borderLeft: '3px solid #3b82f6'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>
                              <strong>{exp.expenseType}</strong>
                              {exp.expenseType === 'Fuel' && exp.fuelLiters && (
                                <span style={{ marginLeft: '8px', color: '#059669' }}>
                                  ({exp.fuelLiters} L)
                                </span>
                              )}
                              {exp.expenseType === 'Fuel' && exp.fuelVendor && (
                                <span style={{ marginLeft: '8px', color: '#64748b', fontSize: '0.8rem' }}>
                                  - {fuelVendors.find(v => v.id.toString() === exp.fuelVendor)?.tradeName || 'N/A'}
                                </span>
                              )}
                            </span>
                            <span style={{ fontWeight: 600 }}>₹{parseFloat(exp.amount || 0).toFixed(2)}</span>
                          </div>
                          {exp.description && (
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                              {exp.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                  {trip.status !== 'Closed' && (
                    <>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setSelectedTripForExpense(trip);
                          setShowExpenseModal(true);
                        }}
                        style={{ flex: 1 }}
                      >
                        <Plus size={16} /> Add Expense
                      </button>
                      
                      <button
                        className="btn btn-success"
                        onClick={() => handleCloseTrip(trip.id)}
                        style={{ flex: 1 }}
                      >
                        <CheckCircle size={16} /> Close Trip
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showExpenseModal && (
        <div className="modal-overlay" onClick={() => setShowExpenseModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                Add Expense to {selectedTripForExpense?.tripNumber}
              </h2>
              <button
                className="btn btn-secondary"
                onClick={() => setShowExpenseModal(false)}
                style={{ padding: '8px' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="input-group">
              <label>Expense Type *</label>
              <select
                value={expenseData.expenseType}
                onChange={(e) => {
                  setExpenseData(prev => ({ 
                    ...prev, 
                    expenseType: e.target.value,
                    // Clear fuel-specific fields when changing type
                    fuelLiters: e.target.value !== 'Fuel' ? '' : prev.fuelLiters,
                    fuelVendor: e.target.value !== 'Fuel' ? '' : prev.fuelVendor
                  }));
                }}
              >
                <option value="Fuel">Fuel</option>
                <option value="Toll">Toll</option>
                <option value="Loading">Loading</option>
                <option value="Unloading">Unloading</option>
                <option value="Detention">Detention</option>
                <option value="Repair">Repair</option>
                <option value="Food">Food</option>
                <option value="Other">Other</option>
              </select>
            </div>
            
            {/* Fuel-specific fields */}
            {expenseData.expenseType === 'Fuel' && (
              <div className="grid-2" style={{ 
                padding: '16px', 
                background: '#f0f9ff', 
                borderRadius: '8px', 
                marginBottom: '16px',
                border: '2px solid #bae6fd'
              }}>
                <div className="input-group">
                  <label>Fuel Liters *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseData.fuelLiters}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, fuelLiters: e.target.value }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Fuel Vendor *</label>
                  <select
                    value={expenseData.fuelVendor}
                    onChange={(e) => setExpenseData(prev => ({ ...prev, fuelVendor: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Fuel Vendor --</option>
                    {fuelVendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.tradeName || vendor.companyName} - {vendor.code || vendor.vendorCode}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            <div className="grid-2">
              <div className="input-group">
                <label>Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseData.amount}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Expense Date *</label>
                <input
                  type="date"
                  value={expenseData.expenseDate}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, expenseDate: e.target.value }))}
                  required
                />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Paid To</label>
                <input
                  type="text"
                  value={expenseData.paidTo}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, paidTo: e.target.value }))}
                  placeholder="Vendor/Person name"
                />
              </div>
              
              <div className="input-group">
                <label>Receipt Number</label>
                <input
                  type="text"
                  value={expenseData.receiptNumber}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                  placeholder="Receipt/Bill number"
                />
              </div>
            </div>
            
            <div className="input-group">
              <label>Description</label>
              <textarea
                value={expenseData.description}
                onChange={(e) => setExpenseData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Additional details..."
                rows="2"
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                className="btn btn-primary"
                onClick={handleAddExpense}
                style={{ flex: 1 }}
              >
                <Save size={16} /> Add Expense
              </button>
              
              <button
                className="btn btn-secondary"
                onClick={() => setShowExpenseModal(false)}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
