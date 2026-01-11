import React, { useState, useEffect } from 'react';
import { Save, Plus, Truck, User, FileText, DollarSign, Fuel, X, Calendar, Clock, Edit2, CheckCircle, Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

// Utility function to format date as DD/MM/YYYY
const formatDateDDMMYYYY = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      // If it's already in DD/MM/YYYY format, return as is
      if (dateString.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
        return dateString;
      }
      // If it's in DDMMYYYY format (without slashes), convert it
      if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
        const day = dateString.substring(0, 2);
        const month = dateString.substring(2, 4);
        const year = dateString.substring(4, 8);
        return `${day}/${month}/${year}`;
      }
      return dateString;
    }
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch (error) {
    return dateString;
  }
};

// Utility function to convert DDMMYYYY to YYYY-MM-DD for input fields
const convertDDMMYYYYToInput = (dateString) => {
  if (!dateString) return '';
  try {
    // If already in YYYY-MM-DD format, return as is
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return dateString;
    }
    // If in DDMMYYYY format, convert
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      const day = dateString.substring(0, 2);
      const month = dateString.substring(2, 4);
      const year = dateString.substring(4, 8);
      return `${year}-${month}-${day}`;
    }
    // Try parsing as date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    return dateString;
  } catch (error) {
    return dateString;
  }
};

// Utility function to convert YYYY-MM-DD to DDMMYYYY for storage
const convertInputToDDMMYYYY = (dateString) => {
  if (!dateString) return '';
  try {
    // If already in DDMMYYYY format, return as is
    if (dateString.length === 8 && /^\d{8}$/.test(dateString)) {
      return dateString;
    }
    // If in YYYY-MM-DD format, convert
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const parts = dateString.split('-');
      return `${parts[2]}${parts[1]}${parts[0]}`;
    }
    // Try parsing as date
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}${month}${year}`;
    }
    return dateString;
  } catch (error) {
    return dateString;
  }
};

export default function TripManagementForm() {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'addExpense', 'viewExpenses'
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [lrBookings, setLrBookings] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [fuelVendors, setFuelVendors] = useState([]);
  const [trips, setTrips] = useState([]);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [fuelRates, setFuelRates] = useState({});
  
  // Current user and branch info
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  
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
  
  // Load fuel rates
  useEffect(() => {
    const cachedRates = localStorage.getItem('fuelRates');
    if (cachedRates) {
      const parsed = JSON.parse(cachedRates);
      setFuelRates(parsed.rates || {});
    } else {
      // Default rates
      setFuelRates({
        'MP': { diesel: 94.14, cng: 75.61 },
        'Delhi': { diesel: 89.62, cng: 73.59 },
        'Haryana': { diesel: 90.11, cng: 74.09 },
        'UP': { diesel: 89.76, cng: 73.64 },
        'Maharashtra': { diesel: 94.27, cng: 75.74 },
        'Rajasthan': { diesel: 92.08, cng: 74.50 }
      });
    }
  }, []);
  
  // Load data from localStorage
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    setBranches(storedBranches.filter(b => b.status === 'Active'));
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
    
    // Get current user and branch info
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (user) {
      setCurrentUser(user);
      
      // Check if admin
      const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const systemUser = systemUsers.find(u => u.username === user.username);
      const userRole = systemUser?.userRole || user?.role || '';
      const adminStatus = userRole === 'Admin' || userRole === 'admin';
      setIsAdmin(adminStatus);
      
      // Get user's branch
      if (adminStatus) {
        // Admin: use selected branch from localStorage or null (all branches)
        const adminBranchId = localStorage.getItem('adminSelectedBranch');
        if (adminBranchId && adminBranchId !== 'all') {
          const branch = storedBranches.find(b => b.id.toString() === adminBranchId);
          setUserBranch(branch || null);
        } else {
          setUserBranch(null); // Admin can see all branches
        }
      } else {
        // Non-admin: use their assigned branch
        const userBranchId = systemUser?.branch || user?.branch;
        if (userBranchId) {
          const branch = storedBranches.find(b => 
            b.id.toString() === userBranchId.toString() || 
            b.branchCode === userBranchId.toString()
          );
          setUserBranch(branch || null);
        } else {
          setUserBranch(null);
        }
      }
    }
  }, []);

  const [formData, setFormData] = useState({
    tripNumber: '',
    tripDate: new Date().toISOString().split('T')[0],
    tripType: 'PTL', // PTL or FTL
    vehicleType: 'Owned', // Owned or Market
    isReturnTrip: false, // Whether this is a return trip
    parentTripNumber: '', // Trip number of the original trip (for return trips)
    parentTripId: null, // ID of the original trip
    originBranch: '', // Branch from which trip originates
    
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
    fuelState: '', // State for fuel rate calculation
    dieselRate: '', // Auto-calculated diesel rate based on state
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

  // Auto-calculate diesel rate based on state
  useEffect(() => {
    if (formData.fuelState && fuelRates[formData.fuelState]) {
      const rate = fuelRates[formData.fuelState].diesel || 0;
      setFormData(prev => ({
        ...prev,
        dieselRate: rate.toFixed(2)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        dieselRate: ''
      }));
    }
  }, [formData.fuelState, fuelRates]);

  // Auto-calculate fuel amount when diesel rate or fuel issued changes
  useEffect(() => {
    if (formData.dieselRate && formData.fuelIssued) {
      const rate = parseFloat(formData.dieselRate) || 0;
      const liters = parseFloat(formData.fuelIssued) || 0;
      const amount = (rate * liters).toFixed(2);
      setFormData(prev => ({
        ...prev,
        fuelAmount: amount
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        fuelAmount: ''
      }));
    }
  }, [formData.dieselRate, formData.fuelIssued]);

  // Auto-set origin branch to logged-in user's branch
  useEffect(() => {
    if (userBranch) {
      setFormData(prev => ({
        ...prev,
        originBranch: userBranch.id.toString()
      }));
    } else if (isAdmin) {
      // For admin, check if they have a selected branch
      const adminBranchId = localStorage.getItem('adminSelectedBranch');
      if (adminBranchId && adminBranchId !== 'all') {
        const adminBranch = branches.find(b => b.id.toString() === adminBranchId);
        if (adminBranch) {
          setFormData(prev => ({
            ...prev,
            originBranch: adminBranch.id.toString()
          }));
        }
      }
    }
  }, [userBranch, isAdmin, branches]);

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
  }, [formData.destination, cities]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation - Origin Branch must be set
    if (!formData.originBranch) {
      alert('⚠️ Origin Branch is required! Please select a branch.');
      return;
    }
    
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

      existingTrips.push(newTrip);
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);

      alert(`✅ Trip "${formData.tripNumber}" created successfully!\n\nTrip Type: ${formData.tripType}\nVehicle: ${formData.vehicleType}\nStatus: ${formData.status}`);
      
      // Reset form
      window.location.reload();
    } catch (error) {
      console.error('Error creating trip:', error);
      alert('❌ Error creating trip. Please check the console for details.');
    }
  };

  const handleAddExpense = () => {
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

  const handleCloseTrip = (tripId) => {
    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id === tripId);
    
    if (tripIndex !== -1) {
      existingTrips[tripIndex].status = 'Closed';
      existingTrips[tripIndex].closedAt = new Date().toISOString();
      existingTrips[tripIndex].updatedAt = new Date().toISOString();
      
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      
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

        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: '10px', 
          marginBottom: '30px',
          borderBottom: '2px solid #e2e8f0',
          paddingBottom: '10px'
        }}>
          <button
            onClick={() => setActiveTab('create')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'create' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'create' ? 'white' : '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'create' ? 'bold' : 'normal',
              borderBottom: activeTab === 'create' ? '3px solid #7c3aed' : '3px solid transparent',
              transition: 'all 0.3s',
              borderRadius: '4px 4px 0 0'
            }}
          >
            ➕ Create Trip
          </button>
          <button
            onClick={() => setActiveTab('addExpense')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'addExpense' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'addExpense' ? 'white' : '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'addExpense' ? 'bold' : 'normal',
              borderBottom: activeTab === 'addExpense' ? '3px solid #7c3aed' : '3px solid transparent',
              transition: 'all 0.3s',
              borderRadius: '4px 4px 0 0'
            }}
          >
            💰 Add Trip Expense
          </button>
          <button
            onClick={() => setActiveTab('viewExpenses')}
            style={{
              padding: '12px 24px',
              border: 'none',
              backgroundColor: activeTab === 'viewExpenses' ? '#8b5cf6' : 'transparent',
              color: activeTab === 'viewExpenses' ? 'white' : '#64748b',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: activeTab === 'viewExpenses' ? 'bold' : 'normal',
              borderBottom: activeTab === 'viewExpenses' ? '3px solid #7c3aed' : '3px solid transparent',
              transition: 'all 0.3s',
              borderRadius: '4px 4px 0 0'
            }}
          >
            📊 View/Edit/Finalize Expenses
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'create' && (
        <>
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
                <label>Origin Branch *</label>
                {isAdmin ? (
                  <select
                    value={formData.originBranch}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, originBranch: e.target.value }));
                      // Save admin's branch selection
                      if (e.target.value) {
                        localStorage.setItem('adminSelectedBranch', e.target.value);
                      }
                    }}
                    required
                  >
                    <option value="">-- Select Origin Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName} ({branch.branchCode})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem',
                    color: '#1e293b',
                    fontWeight: 500
                  }}>
                    {userBranch ? `${userBranch.branchName} (${userBranch.branchCode})` : 'No Branch Assigned'}
                  </div>
                )}
                {!isAdmin && userBranch && (
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Your assigned branch (cannot be changed)
                  </small>
                )}
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
                      if (isReturn && formData.parentTripNumber) {
                        // If return trip is checked and parent trip is already selected, copy vehicle type
                        const parentTrip = trips.find(t => t.tripNumber === formData.parentTripNumber);
                        if (parentTrip) {
                          setFormData(prev => ({
                            ...prev,
                            isReturnTrip: isReturn,
                            vehicleType: parentTrip.vehicleType, // Set vehicle type from parent
                            parentTripNumber: prev.parentTripNumber,
                            parentTripId: parentTrip.id
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            isReturnTrip: isReturn,
                            parentTripNumber: prev.parentTripNumber,
                            parentTripId: prev.parentTripId
                          }));
                        }
                      } else {
                      setFormData(prev => ({
                        ...prev,
                        isReturnTrip: isReturn,
                        parentTripNumber: isReturn ? prev.parentTripNumber : '',
                        parentTripId: isReturn ? prev.parentTripId : null
                      }));
                      }
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
                  onChange={(e) => {
                    // Prevent changing vehicle type for return trips
                    if (formData.isReturnTrip) {
                      return;
                    }
                    setFormData(prev => ({ ...prev, vehicleType: e.target.value }));
                  }}
                  required
                  disabled={formData.isReturnTrip}
                  style={{
                    backgroundColor: formData.isReturnTrip ? '#f3f4f6' : 'white',
                    cursor: formData.isReturnTrip ? 'not-allowed' : 'pointer'
                  }}
                >
                  <option value="Owned">Owned Vehicle</option>
                  <option value="Market">Market Vehicle</option>
                </select>
                {formData.isReturnTrip && (
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                    Vehicle type matches the original trip and cannot be changed
                  </small>
                )}
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
              
              <div className="grid-4">
                <div className="input-group">
                  <label>Advance to Driver (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.advanceToDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, advanceToDriver: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                
                <div className="input-group">
                  <label>State for Fuel Rate *</label>
                  <select
                    value={formData.fuelState}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelState: e.target.value }))}
                    required
                  >
                    <option value="">-- Select State --</option>
                    <option value="MP">Madhya Pradesh</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                    <option value="UP">Uttar Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Rajasthan">Rajasthan</option>
                  </select>
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Select state to auto-calculate diesel rate
                  </small>
                </div>
                
                <div className="input-group">
                  <label>Diesel Rate (₹/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dieselRate}
                    readOnly
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    placeholder="Auto-calculated"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Auto-filled from state
                  </small>
                </div>
                
                <div className="input-group">
                  <label>Fuel Issued (Liters)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fuelIssued}
                    onChange={(e) => setFormData(prev => ({ ...prev, fuelIssued: e.target.value }))}
                    placeholder="0.00"
                  />
                </div>
                </div>
                
              <div className="grid-2" style={{ marginTop: '16px' }}>
                <div className="input-group">
                  <label>Fuel Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fuelAmount}
                    readOnly
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '16px', color: '#059669' }}
                    placeholder="Auto-calculated"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Diesel Rate × Fuel Issued (Liters)
                  </small>
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
              
              {(() => {
                // Get manifests already assigned to trips (excluding current trip if editing)
                const assignedManifestIds = trips
                  .filter(trip => trip.id !== formData.id && trip.selectedManifest)
                  .map(trip => trip.selectedManifest.toString());
                
                // Filter out assigned manifests
                const availableManifests = manifests.filter(manifest => 
                  !assignedManifestIds.includes(manifest.id.toString())
                );
                
                return availableManifests.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                    ⚠️ No available manifests. All manifests have been assigned to trips. Please create a new manifest from the Manifest module.
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
                      {availableManifests.map(manifest => (
                      <option key={manifest.id} value={manifest.id}>
                        {manifest.manifestNumber} - {manifest.manifestDate} ({manifest.summary?.lrCount || manifest.selectedLRs?.length || 0} LRs, {manifest.summary?.totalPieces || 0} Pieces)
                      </option>
                    ))}
                  </select>
                    {assignedManifestIds.length > 0 && (
                      <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                        {assignedManifestIds.length} manifest(s) already assigned to other trips
                      </small>
              )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* Trip Selection - FTL */}
          {formData.tripType === 'FTL' && (
            <div className="form-section">
              <h2 className="section-title">Select LR Bookings (FTL)</h2>
              
              {(() => {
                // Get LRs already assigned to trips (excluding current trip if editing)
                const assignedLRIds = trips
                  .filter(trip => trip.id !== formData.id && trip.selectedLRs && trip.selectedLRs.length > 0)
                  .flatMap(trip => trip.selectedLRs.map(id => id.toString()));
                
                // Filter out assigned LRs
                const availableLRs = lrBookings.filter(lr => 
                  lr.bookingMode === 'FTL' && !assignedLRIds.includes(lr.id.toString())
                );
                
                return availableLRs.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                    ⚠️ No available FTL LR bookings. All FTL LRs have been assigned to trips. Please create new FTL bookings from the LR Booking module.
                </div>
              ) : (
                <div>
                    {assignedLRIds.length > 0 && (
                      <div style={{ marginBottom: '12px', padding: '8px', background: '#f0f9ff', borderRadius: '6px', fontSize: '0.875rem', color: '#64748b' }}>
                        {assignedLRIds.length} LR(s) already assigned to other trips
                      </div>
                    )}
                    {availableLRs.map(lr => (
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
                );
              })()}
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

        </>
        )}

        {activeTab === 'addExpense' && (
          <AddTripExpenseForm 
            trips={trips} 
            setTrips={setTrips}
            fuelVendors={fuelVendors}
            setShowExpenseModal={setShowExpenseModal}
            setSelectedTripForExpense={setSelectedTripForExpense}
            expenseData={expenseData}
            setExpenseData={setExpenseData}
            handleAddExpense={handleAddExpense}
          />
        )}

        {activeTab === 'viewExpenses' && (
          <ViewEditFinalizeExpenses 
            trips={trips} 
            setTrips={setTrips}
            fuelVendors={fuelVendors}
          />
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

// Form 2: Add Trip Expense
function AddTripExpenseForm({ trips, setTrips, fuelVendors, setShowExpenseModal, setSelectedTripForExpense, expenseData, setExpenseData, handleAddExpense }) {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [cities, setCities] = useState([]);

  // Load cities
  useEffect(() => {
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
  }, []);

  // Helper function to get city name from city ID
  const getCityName = (cityId) => {
    if (!cityId) return 'N/A';
    const city = cities.find(c => c.id?.toString() === cityId.toString());
    if (city) {
      return `${city.cityName}, ${city.state}`;
    }
    // If not found, return the ID (for backward compatibility)
    return cityId;
  };
  const [expenseEntryType, setExpenseEntryType] = useState('fuel'); // 'fuel' or 'advance'
  const [fuelRates, setFuelRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);
  const [fuelEntry, setFuelEntry] = useState({
    fuelLiters: '',
    fuelVendor: '',
    fuelDate: new Date().toISOString().split('T')[0],
    description: '',
    state: '',
    fuelType: 'diesel', // 'diesel' or 'cng'
    fuelRate: '',
    fuelAmount: ''
  });
  const [advanceEntry, setAdvanceEntry] = useState({
    amount: '',
    paymentMode: 'Cash', // Cash, UPI, In Bank
    advanceDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Fetch fuel rates from web
  const fetchFuelRates = async () => {
    setLoadingRates(true);
    try {
      // Try to fetch from a public API or use default rates
      // For now, using default rates that can be updated
      const defaultRates = {
        'MP': { diesel: 94.14, cng: 75.61 },
        'Delhi': { diesel: 89.62, cng: 73.59 },
        'Haryana': { diesel: 90.11, cng: 74.09 },
        'UP': { diesel: 89.76, cng: 73.64 },
        'Maharashtra': { diesel: 94.27, cng: 75.74 },
        'Rajasthan': { diesel: 92.08, cng: 74.50 }
      };

      // Try to fetch from an API (you can replace this with actual API endpoint)
      try {
        // Example: const response = await fetch('https://api.example.com/fuel-rates');
        // const data = await response.json();
        // setFuelRates(data);
        // For now, using localStorage to cache rates
        const cachedRates = localStorage.getItem('fuelRates');
        if (cachedRates) {
          const parsed = JSON.parse(cachedRates);
          const cacheDate = new Date(parsed.lastUpdated);
          const now = new Date();
          // Update rates if cache is older than 1 day
          if (now - cacheDate < 24 * 60 * 60 * 1000) {
            setFuelRates(parsed.rates);
            setLoadingRates(false);
            return;
          }
        }
      } catch (error) {
        console.log('API fetch failed, using default rates');
      }

      // Use default rates and cache them
      setFuelRates(defaultRates);
      localStorage.setItem('fuelRates', JSON.stringify({
        rates: defaultRates,
        lastUpdated: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error fetching fuel rates:', error);
      // Fallback to default rates
      setFuelRates({
        'MP': { diesel: 94.14, cng: 75.61 },
        'Delhi': { diesel: 89.62, cng: 73.59 },
        'Haryana': { diesel: 90.11, cng: 74.09 },
        'UP': { diesel: 89.76, cng: 73.64 },
        'Maharashtra': { diesel: 94.27, cng: 75.74 },
        'Rajasthan': { diesel: 92.08, cng: 74.50 }
      });
    } finally {
      setLoadingRates(false);
    }
  };

  useEffect(() => {
    fetchFuelRates();
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      setSelectedTrip(trip);
    } else {
      setSelectedTrip(null);
    }
  }, [selectedTripId, trips]);

  // Auto-calculate fuel amount when state, fuel type, or liters change
  useEffect(() => {
    if (fuelEntry.state && fuelEntry.fuelType && fuelEntry.fuelLiters && fuelRates[fuelEntry.state]) {
      const rate = fuelRates[fuelEntry.state][fuelEntry.fuelType] || 0;
      const amount = (rate * parseFloat(fuelEntry.fuelLiters)).toFixed(2);
      setFuelEntry(prev => ({
        ...prev,
        fuelRate: rate.toFixed(2),
        fuelAmount: amount
      }));
    } else {
      setFuelEntry(prev => ({
        ...prev,
        fuelRate: '',
        fuelAmount: ''
      }));
    }
  }, [fuelEntry.state, fuelEntry.fuelType, fuelEntry.fuelLiters, fuelRates]);

  const handleTripChange = (e) => {
    setSelectedTripId(e.target.value);
  };

  const handleFuelEntryChange = (e) => {
    const { name, value } = e.target;
    setFuelEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAdvanceEntryChange = (e) => {
    const { name, value } = e.target;
    setAdvanceEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddFuel = (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('⚠️ Please select a trip!');
      return;
    }

    if (!fuelEntry.fuelLiters || parseFloat(fuelEntry.fuelLiters) <= 0) {
      alert('⚠️ Please enter valid fuel liters!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      if (!existingTrips[tripIndex].fuelEntries) {
        existingTrips[tripIndex].fuelEntries = [];
      }

      const newFuelEntry = {
        id: Date.now(),
        fuelLiters: parseFloat(fuelEntry.fuelLiters),
        fuelVendor: fuelEntry.fuelVendor,
        fuelDate: fuelEntry.fuelDate,
        description: fuelEntry.description,
        state: fuelEntry.state,
        fuelType: fuelEntry.fuelType,
        fuelRate: parseFloat(fuelEntry.fuelRate) || 0,
        fuelAmount: parseFloat(fuelEntry.fuelAmount) || 0,
        addedAt: new Date().toISOString()
      };

      existingTrips[tripIndex].fuelEntries.push(newFuelEntry);
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);

      alert(`✅ Fuel entry added to Trip ${selectedTrip.tripNumber}!\n\nFuel: ${fuelEntry.fuelLiters} L (${fuelEntry.fuelType.toUpperCase()})\nState: ${fuelEntry.state}\nRate: ₹${fuelEntry.fuelRate}/L\nAmount: ₹${fuelEntry.fuelAmount}`);
      
      // Reset form
      setFuelEntry({
        fuelLiters: '',
        fuelVendor: '',
        fuelDate: new Date().toISOString().split('T')[0],
        description: '',
        state: '',
        fuelType: 'diesel',
        fuelRate: '',
        fuelAmount: ''
      });
    }
  };

  const handleAddAdvance = (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('⚠️ Please select a trip!');
      return;
    }

    if (!advanceEntry.amount || parseFloat(advanceEntry.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      if (!existingTrips[tripIndex].advanceEntries) {
        existingTrips[tripIndex].advanceEntries = [];
      }

      const newAdvanceEntry = {
        id: Date.now(),
        amount: parseFloat(advanceEntry.amount),
        paymentMode: advanceEntry.paymentMode,
        advanceDate: advanceEntry.advanceDate,
        description: advanceEntry.description,
        addedAt: new Date().toISOString()
      };

      existingTrips[tripIndex].advanceEntries.push(newAdvanceEntry);
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);

      alert(`✅ Advance entry added to Trip ${selectedTrip.tripNumber}!\n\nAmount: ₹${advanceEntry.amount}\nMode: ${advanceEntry.paymentMode}`);
      
      // Reset form
      setAdvanceEntry({
        amount: '',
        paymentMode: 'Cash',
        advanceDate: new Date().toISOString().split('T')[0],
        description: ''
      });
    }
  };

  // Calculate totals
  const initialAdvanceFuel = selectedTrip?.fuelIssued ? parseFloat(selectedTrip.fuelIssued) : 0;
  const initialAdvanceAmount = selectedTrip?.advanceToDriver ? parseFloat(selectedTrip.advanceToDriver) : 0;
  const totalFuelEntries = selectedTrip?.fuelEntries?.reduce((sum, entry) => sum + (parseFloat(entry.fuelLiters) || 0), 0) || 0;
  const totalAdvanceEntries = selectedTrip?.advanceEntries?.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) || 0;
  const totalFuel = initialAdvanceFuel + totalFuelEntries;
  const totalAdvance = initialAdvanceAmount + totalAdvanceEntries;

  return (
    <div className="form-section">
      <h2 className="section-title">Add Trip Expense</h2>
      
      <div className="input-group">
        <label>Select Trip *</label>
        <select
          value={selectedTripId}
          onChange={handleTripChange}
          required
          style={{ width: '100%', padding: '12px', fontSize: '15px' }}
        >
          <option value="">-- Select a Trip --</option>
          {trips.filter(t => t.status !== 'Closed').map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.tripNumber} - {trip.origin || 'N/A'} → {trip.destination || 'N/A'} ({trip.vehicleType === 'Owned' ? 'Owned' : trip.marketVehicleNumber || 'Market'})
            </option>
          ))}
        </select>
      </div>

      {selectedTrip && (
        <>
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#3b82f6' }}>Trip Details & Advance Summary</h4>
            <div className="grid-3" style={{ marginBottom: '15px' }}>
              <div>
                <strong style={{ color: '#666' }}>Trip Number:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.tripNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Route:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📍 {getCityName(selectedTrip.origin)} → {getCityName(selectedTrip.destination)}
                </div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Trip Date:</strong>
                <div style={{ fontSize: '16px' }}>{formatDateDDMMYYYY(selectedTrip.tripDate)}</div>
              </div>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: '#dbeafe', 
              borderRadius: '6px',
              border: '1px solid #3b82f6'
            }}>
              <h5 style={{ marginTop: 0, marginBottom: '10px', color: '#1e40af' }}>Advance Given During Trip Creation:</h5>
              <div className="grid-2">
                <div>
                  <strong>Advance Fuel:</strong> {initialAdvanceFuel} Liters
                </div>
                <div>
                  <strong>Advance Amount:</strong> ₹{initialAdvanceAmount.toFixed(2)}
                </div>
              </div>
            </div>

            <div style={{ 
              marginTop: '15px',
              padding: '15px', 
              backgroundColor: '#fef3c7', 
              borderRadius: '6px',
              border: '1px solid #f59e0b'
            }}>
              <h5 style={{ marginTop: 0, marginBottom: '10px', color: '#92400e' }}>Total After Additional Entries:</h5>
              <div className="grid-2">
                <div>
                  <strong>Total Fuel:</strong> {totalFuel.toFixed(2)} Liters
                  {totalFuelEntries > 0 && (
                    <span style={{ fontSize: '0.9rem', color: '#059669', marginLeft: '8px' }}>
                      (+{totalFuelEntries.toFixed(2)} L added)
                    </span>
                  )}
                </div>
                <div>
                  <strong>Total Advance:</strong> ₹{totalAdvance.toFixed(2)}
                  {totalAdvanceEntries > 0 && (
                    <span style={{ fontSize: '0.9rem', color: '#059669', marginLeft: '8px' }}>
                      (+₹{totalAdvanceEntries.toFixed(2)} added)
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Entry Type Toggle */}
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
            <button
              type="button"
              onClick={() => setExpenseEntryType('fuel')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: expenseEntryType === 'fuel' ? '#3b82f6' : '#e5e7eb',
                color: expenseEntryType === 'fuel' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              ⛽ Add Fuel Entry
            </button>
            <button
              type="button"
              onClick={() => setExpenseEntryType('advance')}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: expenseEntryType === 'advance' ? '#3b82f6' : '#e5e7eb',
                color: expenseEntryType === 'advance' ? 'white' : '#374151',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              💰 Add Advance Entry
            </button>
          </div>

          {/* Fuel Rates Banner */}
          {expenseEntryType === 'fuel' && (
            <div style={{
              marginBottom: '25px',
              padding: '20px',
              backgroundColor: '#f0fdf4',
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h4 style={{ margin: 0, color: '#059669' }}>⛽ Current Fuel Rates (₹/L)</h4>
                <button
                  type="button"
                  onClick={fetchFuelRates}
                  disabled={loadingRates}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loadingRates ? 'not-allowed' : 'pointer',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}
                >
                  {loadingRates ? '🔄 Updating...' : '🔄 Refresh Rates'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px' }}>
                {['MP', 'Delhi', 'Haryana', 'UP', 'Maharashtra', 'Rajasthan'].map(state => (
                  <div key={state} style={{
                    padding: '12px',
                    backgroundColor: '#fff',
                    borderRadius: '6px',
                    border: '1px solid #10b981',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '8px', color: '#059669' }}>
                      {state}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                      Diesel: <strong style={{ color: '#dc2626' }}>₹{fuelRates[state]?.diesel?.toFixed(2) || 'N/A'}</strong>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      CNG: <strong style={{ color: '#059669' }}>₹{fuelRates[state]?.cng?.toFixed(2) || 'N/A'}</strong>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '12px', fontSize: '11px', color: '#64748b', fontStyle: 'italic' }}>
                * Rates are updated daily. Click "Refresh Rates" to get latest prices.
              </div>
            </div>
          )}

          {/* Fuel Entry Form */}
          {expenseEntryType === 'fuel' && (
            <form onSubmit={handleAddFuel}>
              <h4 style={{ marginBottom: '15px' }}>Add Fuel Entry</h4>
              <div className="grid-3">
                <div className="input-group">
                  <label>State/Location *</label>
                  <select
                    name="state"
                    value={fuelEntry.state}
                    onChange={handleFuelEntryChange}
                    required
                  >
                    <option value="">-- Select State --</option>
                    <option value="MP">Madhya Pradesh</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Haryana">Haryana</option>
                    <option value="UP">Uttar Pradesh</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Rajasthan">Rajasthan</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Fuel Type *</label>
                  <select
                    name="fuelType"
                    value={fuelEntry.fuelType}
                    onChange={handleFuelEntryChange}
                    required
                  >
                    <option value="diesel">Diesel</option>
                    <option value="cng">CNG</option>
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Fuel Liters *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fuelLiters"
                    value={fuelEntry.fuelLiters}
                    onChange={handleFuelEntryChange}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid-3">
                <div className="input-group">
                  <label>Fuel Rate (₹/L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fuelRate"
                    value={fuelEntry.fuelRate}
                    readOnly
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed' }}
                    placeholder="Auto-calculated"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Auto-filled from state & fuel type
                  </small>
                </div>
                
                <div className="input-group">
                  <label>Fuel Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="fuelAmount"
                    value={fuelEntry.fuelAmount}
                    readOnly
                    style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', fontWeight: 'bold', fontSize: '16px', color: '#059669' }}
                    placeholder="Auto-calculated"
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Rate × Liters
                  </small>
                </div>
                
                <div className="input-group">
                  <label>Fuel Vendor *</label>
                  <select
                    name="fuelVendor"
                    value={fuelEntry.fuelVendor}
                    onChange={handleFuelEntryChange}
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

              <div className="grid-2">
                <div className="input-group">
                  <label>Fuel Date *</label>
                  <input
                    type="date"
                    name="fuelDate"
                    value={fuelEntry.fuelDate}
                    onChange={handleFuelEntryChange}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    name="description"
                    value={fuelEntry.description}
                    onChange={handleFuelEntryChange}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '15px' }}
              >
                <Save size={16} /> Add Fuel Entry
              </button>
            </form>
          )}

          {/* Advance Entry Form */}
          {expenseEntryType === 'advance' && (
            <form onSubmit={handleAddAdvance}>
              <h4 style={{ marginBottom: '15px' }}>Add Advance Entry</h4>
              <div className="grid-2">
                <div className="input-group">
                  <label>Advance Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="amount"
                    value={advanceEntry.amount}
                    onChange={handleAdvanceEntryChange}
                    placeholder="0.00"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Payment Mode *</label>
                  <select
                    name="paymentMode"
                    value={advanceEntry.paymentMode}
                    onChange={handleAdvanceEntryChange}
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="In Bank">In Bank</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="input-group">
                  <label>Advance Date *</label>
                  <input
                    type="date"
                    name="advanceDate"
                    value={advanceEntry.advanceDate}
                    onChange={handleAdvanceEntryChange}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Description</label>
                  <input
                    type="text"
                    name="description"
                    value={advanceEntry.description}
                    onChange={handleAdvanceEntryChange}
                    placeholder="Additional details..."
                  />
                </div>
              </div>
              
              <button
                type="submit"
                className="btn btn-primary"
                style={{ marginTop: '15px' }}
              >
                <Save size={16} /> Add Advance Entry
              </button>
            </form>
          )}

          {/* Show Existing Entries */}
          {(selectedTrip?.fuelEntries?.length > 0 || selectedTrip?.advanceEntries?.length > 0) && (
            <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0 }}>Existing Entries</h4>
              
              {selectedTrip?.fuelEntries?.length > 0 && (
                <div style={{ marginBottom: '20px' }}>
                  <h5>Fuel Entries ({selectedTrip.fuelEntries.length})</h5>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>State</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Type</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Liters</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Rate (₹/L)</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Amount (₹)</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Vendor</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrip.fuelEntries.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '8px' }}>{formatDateDDMMYYYY(entry.fuelDate)}</td>
                            <td style={{ padding: '8px' }}>{entry.state || 'N/A'}</td>
                            <td style={{ padding: '8px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {entry.fuelType || 'Diesel'}
                            </td>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>{entry.fuelLiters} L</td>
                            <td style={{ padding: '8px' }}>₹{entry.fuelRate?.toFixed(2) || 'N/A'}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold', color: '#059669' }}>
                              ₹{entry.fuelAmount?.toFixed(2) || 'N/A'}
                            </td>
                            <td style={{ padding: '8px' }}>
                              {fuelVendors.find(v => v.id.toString() === entry.fuelVendor.toString())?.tradeName || 'N/A'}
                            </td>
                            <td style={{ padding: '8px' }}>{entry.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {selectedTrip?.advanceEntries?.length > 0 && (
                <div>
                  <h5>Advance Entries ({selectedTrip.advanceEntries.length})</h5>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#10b981', color: 'white' }}>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Amount</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Payment Mode</th>
                          <th style={{ padding: '8px', textAlign: 'left' }}>Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedTrip.advanceEntries.map(entry => (
                          <tr key={entry.id} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={{ padding: '8px' }}>{formatDateDDMMYYYY(entry.advanceDate)}</td>
                            <td style={{ padding: '8px', fontWeight: 'bold' }}>₹{entry.amount.toFixed(2)}</td>
                            <td style={{ padding: '8px' }}>{entry.paymentMode}</td>
                            <td style={{ padding: '8px' }}>{entry.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Form 3: View/Edit/Finalize Trip Expenses
function ViewEditFinalizeExpenses({ trips, setTrips, fuelVendors }) {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [fuelRates, setFuelRates] = useState({});
  const [cities, setCities] = useState([]);

  // Load cities
  useEffect(() => {
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
  }, []);

  // Helper function to get city name from city ID
  const getCityName = (cityId) => {
    if (!cityId) return 'N/A';
    const city = cities.find(c => c.id?.toString() === cityId.toString());
    if (city) {
      return `${city.cityName}, ${city.state}`;
    }
    // If not found, return the ID (for backward compatibility)
    return cityId;
  };
  const [finalizeData, setFinalizeData] = useState({
    totalKM: '',
    desiredAverage: '',
    dieselAmount: '',
    dieselRate: '', // Rate per liter for extra diesel calculation
    otherExpensesMatrix: {
      bhatta: {
        fromDate: '',
        toDate: '',
        amount: ''
      },
      salary: {
        fromDate: '',
        toDate: '',
        amount: ''
      },
      secondDriver: {
        fromDate: '',
        toDate: '',
        amount: ''
      }
    }
  });
  const [editForm, setEditForm] = useState({
    expenseType: 'Toll',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidTo: '',
    receiptNumber: ''
  });
  const [editingFuelEntry, setEditingFuelEntry] = useState(null);
  const [editingAdvanceEntry, setEditingAdvanceEntry] = useState(null);
  const [fuelEditForm, setFuelEditForm] = useState({
    fuelLiters: '',
    fuelVendor: '',
    fuelDate: new Date().toISOString().split('T')[0],
    description: '',
    state: '',
    fuelType: 'diesel',
    fuelRate: '',
    fuelAmount: ''
  });
  const [advanceEditForm, setAdvanceEditForm] = useState({
    amount: '',
    paymentMode: 'Cash',
    advanceDate: new Date().toISOString().split('T')[0],
    description: ''
  });

  // Load fuel rates
  useEffect(() => {
    const cachedRates = localStorage.getItem('fuelRates');
    if (cachedRates) {
      const parsed = JSON.parse(cachedRates);
      setFuelRates(parsed.rates || {});
    } else {
      // Default rates
      setFuelRates({
        'MP': { diesel: 94.14, cng: 75.61 },
        'Delhi': { diesel: 89.62, cng: 73.59 },
        'Haryana': { diesel: 90.11, cng: 74.09 },
        'UP': { diesel: 89.76, cng: 73.64 },
        'Maharashtra': { diesel: 94.27, cng: 75.74 },
        'Rajasthan': { diesel: 92.08, cng: 74.50 }
      });
    }
  }, []);

  // Auto-calculate fuel amount when editing
  useEffect(() => {
    if (editingFuelEntry && fuelEditForm.state && fuelEditForm.fuelType && fuelEditForm.fuelLiters && fuelRates[fuelEditForm.state]) {
      const rate = fuelRates[fuelEditForm.state][fuelEditForm.fuelType] || parseFloat(fuelEditForm.fuelRate) || 0;
      const amount = (rate * parseFloat(fuelEditForm.fuelLiters)).toFixed(2);
      setFuelEditForm(prev => ({
        ...prev,
        fuelRate: rate.toFixed(2),
        fuelAmount: amount
      }));
    }
  }, [fuelEditForm.state, fuelEditForm.fuelType, fuelEditForm.fuelLiters, fuelEditForm.fuelRate, editingFuelEntry, fuelRates]);

  useEffect(() => {
    if (selectedTripId) {
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      setSelectedTrip(trip);
      setOtherExpenses(trip?.otherExpenses || []);
      
      // Get trip dates for bhatta initialization
      const tripStartDate = trip?.tripStartDate || trip?.tripDate || '';
      const tripEndDate = trip?.tripEndDate || trip?.tripDate || '';
      
      if (trip?.finalizedData) {
        setFinalizeData({
          totalKM: trip.finalizedData.totalKM || '',
          desiredAverage: trip.finalizedData.desiredAverage || '',
          dieselAmount: trip.finalizedData.dieselAmount || '',
          dieselRate: trip.finalizedData.dieselRate || '',
          otherExpensesMatrix: trip.finalizedData.otherExpensesMatrix || {
            bhatta: { fromDate: tripStartDate, toDate: tripEndDate, amount: '' },
            salary: { fromDate: '', toDate: '', amount: '' },
            secondDriver: { fromDate: '', toDate: '', amount: '' }
          }
        });
      } else {
        // Initialize with trip dates for bhatta
        setFinalizeData({
          totalKM: '',
          desiredAverage: '',
          dieselAmount: '',
          dieselRate: '',
          otherExpensesMatrix: {
            bhatta: {
              fromDate: tripStartDate,
              toDate: tripEndDate,
              amount: ''
            },
            salary: {
              fromDate: '',
              toDate: '',
              amount: ''
            },
            secondDriver: {
              fromDate: '',
              toDate: '',
              amount: ''
            }
          }
        });
      }
    } else {
      setSelectedTrip(null);
      setOtherExpenses([]);
      setFinalizeData({
        totalKM: '',
        desiredAverage: '',
        dieselAmount: '',
        dieselRate: '',
        otherExpensesMatrix: {
          bhatta: { fromDate: '', toDate: '', amount: '' },
          salary: { fromDate: '', toDate: '', amount: '' },
          secondDriver: { fromDate: '', toDate: '', amount: '' }
        }
      });
    }
  }, [selectedTripId, trips]);

  const handleTripChange = (e) => {
    setSelectedTripId(e.target.value);
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense.id);
    setEditForm({
      expenseType: expense.expenseType || 'Fuel',
      amount: expense.amount?.toString() || '',
      description: expense.description || '',
      expenseDate: expense.expenseDate || expense.addedAt?.split('T')[0] || new Date().toISOString().split('T')[0],
      paidTo: expense.paidTo || '',
      receiptNumber: expense.receiptNumber || '',
      fuelLiters: expense.fuelLiters || '',
      fuelVendor: expense.fuelVendor || ''
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedExpenses = (existingTrips[tripIndex].expenses || []).map(exp => 
        exp.id === editingExpense 
          ? {
              ...exp,
              ...editForm,
              amount: parseFloat(editForm.amount),
              updatedAt: new Date().toISOString()
            }
          : exp
      );

      existingTrips[tripIndex].otherExpenses = updatedExpenses;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setOtherExpenses(updatedExpenses);
      setEditingExpense(null);
      alert('✅ Expense updated successfully!');
    }
  };

  const handleDelete = (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedExpenses = (existingTrips[tripIndex].otherExpenses || []).filter(exp => exp.id !== expenseId);
      existingTrips[tripIndex].otherExpenses = updatedExpenses;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setOtherExpenses(updatedExpenses);
      alert('✅ Expense deleted successfully!');
    }
  };

  // Fuel Entry handlers
  const handleEditFuelEntry = (entry) => {
    setEditingFuelEntry(entry.id);
    setFuelEditForm({
      fuelLiters: entry.fuelLiters?.toString() || '',
      fuelVendor: entry.fuelVendor?.toString() || '',
      fuelDate: entry.fuelDate || new Date().toISOString().split('T')[0],
      description: entry.description || '',
      state: entry.state || '',
      fuelType: entry.fuelType || 'diesel',
      fuelRate: entry.fuelRate?.toString() || '',
      fuelAmount: entry.fuelAmount?.toString() || ''
    });
  };

  const handleSaveFuelEdit = () => {
    if (!fuelEditForm.fuelLiters || parseFloat(fuelEditForm.fuelLiters) <= 0) {
      alert('⚠️ Please enter valid fuel liters!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedFuelEntries = (existingTrips[tripIndex].fuelEntries || []).map(entry =>
        entry.id === editingFuelEntry
          ? {
              ...entry,
              fuelLiters: parseFloat(fuelEditForm.fuelLiters),
              fuelVendor: fuelEditForm.fuelVendor,
              fuelDate: fuelEditForm.fuelDate,
              description: fuelEditForm.description,
              state: fuelEditForm.state,
              fuelType: fuelEditForm.fuelType,
              fuelRate: parseFloat(fuelEditForm.fuelRate) || 0,
              fuelAmount: parseFloat(fuelEditForm.fuelAmount) || 0,
              updatedAt: new Date().toISOString()
            }
          : entry
      );

      existingTrips[tripIndex].fuelEntries = updatedFuelEntries;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setSelectedTrip(existingTrips[tripIndex]);
      setEditingFuelEntry(null);
      alert('✅ Fuel entry updated successfully!');
    }
  };

  const handleDeleteFuelEntry = (entryId) => {
    if (!window.confirm('Are you sure you want to delete this fuel entry?')) return;

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedFuelEntries = (existingTrips[tripIndex].fuelEntries || []).filter(entry => entry.id !== entryId);
      existingTrips[tripIndex].fuelEntries = updatedFuelEntries;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setSelectedTrip(existingTrips[tripIndex]);
      alert('✅ Fuel entry deleted successfully!');
    }
  };

  // Advance Entry handlers
  const handleEditAdvanceEntry = (entry) => {
    setEditingAdvanceEntry(entry.id);
    setAdvanceEditForm({
      amount: entry.amount?.toString() || '',
      paymentMode: entry.paymentMode || 'Cash',
      advanceDate: entry.advanceDate || new Date().toISOString().split('T')[0],
      description: entry.description || ''
    });
  };

  const handleSaveAdvanceEdit = () => {
    if (!advanceEditForm.amount || parseFloat(advanceEditForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedAdvanceEntries = (existingTrips[tripIndex].advanceEntries || []).map(entry =>
        entry.id === editingAdvanceEntry
          ? {
              ...entry,
              amount: parseFloat(advanceEditForm.amount),
              paymentMode: advanceEditForm.paymentMode,
              advanceDate: advanceEditForm.advanceDate,
              description: advanceEditForm.description,
              updatedAt: new Date().toISOString()
            }
          : entry
      );

      existingTrips[tripIndex].advanceEntries = updatedAdvanceEntries;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setSelectedTrip(existingTrips[tripIndex]);
      setEditingAdvanceEntry(null);
      alert('✅ Advance entry updated successfully!');
    }
  };

  const handleDeleteAdvanceEntry = (entryId) => {
    if (!window.confirm('Are you sure you want to delete this advance entry?')) return;

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      const updatedAdvanceEntries = (existingTrips[tripIndex].advanceEntries || []).filter(entry => entry.id !== entryId);
      existingTrips[tripIndex].advanceEntries = updatedAdvanceEntries;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setSelectedTrip(existingTrips[tripIndex]);
      alert('✅ Advance entry deleted successfully!');
    }
  };

  const handleAddOtherExpense = (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('⚠️ Please select a trip!');
      return;
    }

    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      if (!existingTrips[tripIndex].otherExpenses) {
        existingTrips[tripIndex].otherExpenses = [];
      }

      const newExpense = {
        id: Date.now(),
        ...editForm,
        amount: parseFloat(editForm.amount),
        addedAt: new Date().toISOString()
      };

      existingTrips[tripIndex].otherExpenses.push(newExpense);
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      setOtherExpenses(existingTrips[tripIndex].otherExpenses);

      alert(`✅ Expense added to Trip ${selectedTrip.tripNumber}!`);
      
      // Reset form
      setEditForm({
        expenseType: 'Toll',
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paidTo: '',
        receiptNumber: ''
      });
    }
  };

  const handleFinalize = () => {
    if (!finalizeData.totalKM || !finalizeData.desiredAverage || !finalizeData.dieselAmount || !finalizeData.dieselRate) {
      alert('⚠️ Please enter Total KM, Desired Average, Diesel Amount, and Diesel Rate to finalize!');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this trip? This will mark the trip as completed and expenses cannot be edited.')) {
      return;
    }

    const existingTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    const tripIndex = existingTrips.findIndex(t => t.id.toString() === selectedTripId.toString());
    
    if (tripIndex !== -1) {
      // Calculate total from matrix expenses
      const matrixTotal = 
        (parseFloat(finalizeData.otherExpensesMatrix.bhatta.amount) || 0) +
        (parseFloat(finalizeData.otherExpensesMatrix.salary.amount) || 0) +
        (parseFloat(finalizeData.otherExpensesMatrix.secondDriver.amount) || 0);
      
      const finalizedData = {
        totalKM: finalizeData.totalKM,
        desiredAverage: finalizeData.desiredAverage,
        dieselAmount: finalizeData.dieselAmount,
        dieselRate: finalizeData.dieselRate,
        totalFuel: totalFuel,
        totalAdvance: totalAdvance,
        totalOtherExpenses: totalOtherExpenses + matrixTotal,
        otherExpensesMatrix: finalizeData.otherExpensesMatrix,
        matrixExpensesTotal: matrixTotal,
        actualAverage: actualAverage,
        expectedFuel: expectedFuel,
        extraDiesel: extraDiesel,
        extraDieselCost: extraDieselCost,
        finalBalance: (totalAdvance + dieselAmount) - (totalOtherExpenses + matrixTotal + parseFloat(extraDieselCost)),
        finalizedAt: new Date().toISOString()
      };

      existingTrips[tripIndex].status = 'Closed';
      existingTrips[tripIndex].finalized = true;
      existingTrips[tripIndex].finalizedData = finalizedData;
      localStorage.setItem('trips', JSON.stringify(existingTrips));
      setTrips(existingTrips);
      alert('✅ Trip expenses finalized successfully!');
    }
  };

  const handleDownloadExcel = () => {
    if (!selectedTrip) {
      alert('⚠️ Please select a trip');
      return;
    }

    const excelData = [
      ['TRIP EXPENSES REPORT'],
      ['Trip Number:', selectedTrip.tripNumber],
      ['Route:', `${getCityName(selectedTrip.origin)} → ${getCityName(selectedTrip.destination)}`],
      ['Trip Date:', formatDateDDMMYYYY(selectedTrip.tripDate) || 'N/A'],
      ['Vehicle Type:', selectedTrip.vehicleType || 'N/A'],
      ['Status:', selectedTrip.status || 'N/A'],
      ['Generated Date:', new Date().toLocaleString()],
      [],
      ['EXPENSES DETAILS'],
      ['Date', 'Type', 'Description', 'Amount (₹)', 'Paid To', 'Receipt']
    ];

    (otherExpenses || []).forEach(exp => {
      excelData.push([
        formatDateDDMMYYYY(exp.expenseDate || exp.addedAt?.split('T')[0]) || 'N/A',
        exp.expenseType || 'N/A',
        exp.description || '',
        exp.amount || 0,
        exp.paidTo || '',
        exp.receiptNumber || ''
      ]);
    });

    excelData.push([]);
    const totalExpenses = (otherExpenses || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
    excelData.push(['SUMMARY']);
    excelData.push(['Total Expenses:', totalExpenses]);

    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trip Expenses');

    ws['!cols'] = [
      { wch: 15 },
      { wch: 15 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 },
      { wch: 12 },
      { wch: 20 }
    ];

    const filename = `Trip_Expenses_${selectedTrip.tripNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    alert('✅ Excel file downloaded successfully!');
  };

  const isFinalized = selectedTrip?.finalized || selectedTrip?.status === 'Closed';
  
  // Calculate totals
  const initialAdvanceFuel = selectedTrip?.fuelIssued ? parseFloat(selectedTrip.fuelIssued) : 0;
  const initialAdvanceAmount = selectedTrip?.advanceToDriver ? parseFloat(selectedTrip.advanceToDriver) : 0;
  const totalFuelEntries = selectedTrip?.fuelEntries?.reduce((sum, entry) => sum + (parseFloat(entry.fuelLiters) || 0), 0) || 0;
  const totalAdvanceEntries = selectedTrip?.advanceEntries?.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) || 0;
  const totalFuel = initialAdvanceFuel + totalFuelEntries;
  const totalAdvance = initialAdvanceAmount + totalAdvanceEntries;
  const totalOtherExpenses = (otherExpenses || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  
  // Finalization calculations
  const totalKM = parseFloat(finalizeData.totalKM) || 0;
  const desiredAvg = parseFloat(finalizeData.desiredAverage) || 0;
  const dieselAmount = parseFloat(finalizeData.dieselAmount) || 0;
  const actualAverage = totalKM > 0 && totalFuel > 0 ? (totalKM / totalFuel).toFixed(2) : 0;
  const expectedFuel = desiredAvg > 0 && totalKM > 0 ? (totalKM / desiredAvg).toFixed(2) : 0;
  const extraDiesel = totalFuel > expectedFuel ? (totalFuel - expectedFuel).toFixed(2) : 0;
  const dieselRate = parseFloat(finalizeData.dieselRate) || 0;
  const extraDieselCost = extraDiesel > 0 && dieselRate > 0 ? (dieselRate * parseFloat(extraDiesel)).toFixed(2) : 0;
  
  // Calculate matrix expenses total
  const matrixTotal = 
    (parseFloat(finalizeData.otherExpensesMatrix?.bhatta?.amount) || 0) +
    (parseFloat(finalizeData.otherExpensesMatrix?.salary?.amount) || 0) +
    (parseFloat(finalizeData.otherExpensesMatrix?.secondDriver?.amount) || 0);
  
  const finalBalance = (totalAdvance + dieselAmount) - (totalOtherExpenses + matrixTotal + parseFloat(extraDieselCost));

  return (
    <div className="form-section">
      <h2 className="section-title">View/Edit/Finalize Trip Expenses</h2>
      
      <div className="input-group">
        <label>Select Trip</label>
        <select
          value={selectedTripId}
          onChange={handleTripChange}
          style={{ width: '100%', padding: '12px', fontSize: '15px' }}
        >
          <option value="">-- Select a Trip --</option>
          {trips.map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.tripNumber} - {trip.origin || 'N/A'} → {trip.destination || 'N/A'} ({trip.status})
            </option>
          ))}
        </select>
      </div>

      {selectedTrip && (
        <>
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#3b82f6' }}>Trip Details</h4>
              {isFinalized && (
                <span style={{
                  padding: '5px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✅ FINALIZED
                </span>
              )}
            </div>
            <div className="grid-4">
              <div>
                <strong style={{ color: '#666' }}>Trip Number:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.tripNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>From City:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📍 {getCityName(selectedTrip.origin)}
                </div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>To City:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📍 {getCityName(selectedTrip.destination)}
                </div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Trip Start Date:</strong>
                <div style={{ fontSize: '16px' }}>{formatDateDDMMYYYY(selectedTrip.tripStartDate || selectedTrip.tripDate)}</div>
              </div>
            </div>
            <div className="grid-2" style={{ marginTop: '10px' }}>
              <div>
                <strong style={{ color: '#666' }}>Status:</strong>
                <div style={{ fontSize: '16px' }}>{selectedTrip.status || 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Advance Summary */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#fef3c7', 
            borderRadius: '8px',
            border: '2px solid #f59e0b'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#92400e' }}>Advance Summary</h4>
            <div className="grid-2">
              <div>
                <strong>Initial Advance Fuel:</strong> {initialAdvanceFuel} Liters
              </div>
              <div>
                <strong>Initial Advance Amount:</strong> ₹{initialAdvanceAmount.toFixed(2)}
              </div>
              <div>
                <strong>Additional Fuel Entries:</strong> {totalFuelEntries.toFixed(2)} Liters ({selectedTrip?.fuelEntries?.length || 0} entries)
              </div>
              <div>
                <strong>Additional Advance Entries:</strong> ₹{totalAdvanceEntries.toFixed(2)} ({selectedTrip?.advanceEntries?.length || 0} entries)
              </div>
              <div style={{ gridColumn: '1 / -1', paddingTop: '10px', borderTop: '1px solid #f59e0b', marginTop: '10px' }}>
                <strong style={{ fontSize: '18px' }}>Total Fuel:</strong> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{totalFuel.toFixed(2)} Liters</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <strong style={{ fontSize: '18px' }}>Total Advance:</strong> <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>₹{totalAdvance.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Fuel Entries List */}
          {selectedTrip?.fuelEntries && selectedTrip.fuelEntries.length > 0 && (
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>⛽ Fuel Entries ({selectedTrip.fuelEntries.length})</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#3b82f6', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>State</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Liters</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Rate (₹/L)</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Vendor</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #2563eb' }}>Description</th>
                      {!isFinalized && (
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #2563eb' }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTrip.fuelEntries.map(entry => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #ddd' }}>
                        {editingFuelEntry === entry.id ? (
                          <>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="date"
                                value={fuelEditForm.fuelDate}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelDate: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <select
                                value={fuelEditForm.state}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, state: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              >
                                <option value="">-- Select State --</option>
                                <option value="MP">Madhya Pradesh</option>
                                <option value="Delhi">Delhi</option>
                                <option value="Haryana">Haryana</option>
                                <option value="UP">Uttar Pradesh</option>
                                <option value="Maharashtra">Maharashtra</option>
                                <option value="Rajasthan">Rajasthan</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <select
                                value={fuelEditForm.fuelType}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelType: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              >
                                <option value="diesel">Diesel</option>
                                <option value="cng">CNG</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={fuelEditForm.fuelLiters}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelLiters: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={fuelEditForm.fuelRate}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelRate: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={fuelEditForm.fuelAmount}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelAmount: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <select
                                value={fuelEditForm.fuelVendor}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, fuelVendor: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              >
                                <option value="">-- Select Vendor --</option>
                                {fuelVendors.map(vendor => (
                                  <option key={vendor.id} value={vendor.id}>
                                    {vendor.tradeName || vendor.companyName}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={fuelEditForm.description}
                                onChange={(e) => setFuelEditForm({ ...fuelEditForm, description: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <button
                                onClick={handleSaveFuelEdit}
                                className="btn btn-success"
                                style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                              >
                                <CheckCircle size={14} /> Save
                              </button>
                              <button
                                onClick={() => setEditingFuelEntry(null)}
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                <X size={14} /> Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDateDDMMYYYY(entry.fuelDate)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.state || 'N/A'}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', textTransform: 'uppercase', fontWeight: 'bold' }}>
                              {entry.fuelType || 'Diesel'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{entry.fuelLiters} L</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{entry.fuelRate?.toFixed(2) || 'N/A'}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold', color: '#059669' }}>
                              ₹{entry.fuelAmount?.toFixed(2) || 'N/A'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              {fuelVendors.find(v => v.id.toString() === entry.fuelVendor?.toString())?.tradeName || 'N/A'}
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.description || '-'}</td>
                            {!isFinalized && (
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleEditFuelEntry(entry)}
                                  className="btn btn-primary"
                                  style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteFuelEntry(entry.id)}
                                  className="btn btn-danger"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Advance Entries List */}
          {selectedTrip?.advanceEntries && selectedTrip.advanceEntries.length > 0 && (
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>💰 Advance Entries ({selectedTrip.advanceEntries.length})</h4>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#10b981', color: 'white' }}>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #059669' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #059669' }}>Amount (₹)</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #059669' }}>Payment Mode</th>
                      <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #059669' }}>Description</th>
                      {!isFinalized && (
                        <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #059669' }}>Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTrip.advanceEntries.map(entry => (
                      <tr key={entry.id} style={{ borderBottom: '1px solid #ddd' }}>
                        {editingAdvanceEntry === entry.id ? (
                          <>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="date"
                                value={advanceEditForm.advanceDate}
                                onChange={(e) => setAdvanceEditForm({ ...advanceEditForm, advanceDate: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="number"
                                step="0.01"
                                value={advanceEditForm.amount}
                                onChange={(e) => setAdvanceEditForm({ ...advanceEditForm, amount: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <select
                                value={advanceEditForm.paymentMode}
                                onChange={(e) => setAdvanceEditForm({ ...advanceEditForm, paymentMode: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              >
                                <option value="Cash">Cash</option>
                                <option value="UPI">UPI</option>
                                <option value="In Bank">In Bank</option>
                              </select>
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                              <input
                                type="text"
                                value={advanceEditForm.description}
                                onChange={(e) => setAdvanceEditForm({ ...advanceEditForm, description: e.target.value })}
                                style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                              />
                            </td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                              <button
                                onClick={handleSaveAdvanceEdit}
                                className="btn btn-success"
                                style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                              >
                                <CheckCircle size={14} /> Save
                              </button>
                              <button
                                onClick={() => setEditingAdvanceEntry(null)}
                                className="btn btn-secondary"
                                style={{ padding: '5px 10px', fontSize: '12px' }}
                              >
                                <X size={14} /> Cancel
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{formatDateDDMMYYYY(entry.advanceDate)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>₹{entry.amount?.toFixed(2)}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.paymentMode}</td>
                            <td style={{ padding: '10px', border: '1px solid #ddd' }}>{entry.description || '-'}</td>
                            {!isFinalized && (
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <button
                                  onClick={() => handleEditAdvanceEntry(entry)}
                                  className="btn btn-primary"
                                  style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                                >
                                  <Edit2 size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteAdvanceEntry(entry.id)}
                                  className="btn btn-danger"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Add Other Expenses */}
          {!isFinalized && (
            <div style={{ marginBottom: '25px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Add Other Expenses (Toll, Loading, etc.)</h4>
              <form onSubmit={handleAddOtherExpense}>
                <div className="grid-3">
                  <div className="input-group">
                    <label>Expense Type *</label>
                    <select
                      name="expenseType"
                      value={editForm.expenseType}
                      onChange={(e) => setEditForm({ ...editForm, expenseType: e.target.value })}
                      required
                    >
                      <option value="Toll">Toll</option>
                      <option value="Loading">Loading</option>
                      <option value="Unloading">Unloading</option>
                      <option value="Detention">Detention</option>
                      <option value="Repair">Repair</option>
                      <option value="Food">Food</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Amount (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="amount"
                      value={editForm.amount}
                      onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Date *</label>
                    <input
                      type="date"
                      name="expenseDate"
                      value={editForm.expenseDate}
                      onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="grid-2">
                  <div className="input-group">
                    <label>Paid To</label>
                    <input
                      type="text"
                      name="paidTo"
                      value={editForm.paidTo}
                      onChange={(e) => setEditForm({ ...editForm, paidTo: e.target.value })}
                      placeholder="Vendor/Person name"
                    />
                  </div>
                  <div className="input-group">
                    <label>Receipt Number</label>
                    <input
                      type="text"
                      name="receiptNumber"
                      value={editForm.receiptNumber}
                      onChange={(e) => setEditForm({ ...editForm, receiptNumber: e.target.value })}
                      placeholder="Receipt/Bill number"
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Additional details..."
                    rows="2"
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ marginTop: '10px' }}>
                  <Save size={16} /> Add Expense
                </button>
              </form>
            </div>
          )}

          {/* Other Expenses List */}
          <div>
            <h4 style={{ marginBottom: '15px' }}>Other Expenses List</h4>
            {(otherExpenses || []).length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                No other expenses added for this trip yet
              </p>
            ) : (
              <>
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#8b5cf6', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #7c3aed' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #7c3aed' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #7c3aed' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #7c3aed' }}>Amount (₹)</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #7c3aed' }}>Paid To</th>
                        {!isFinalized && (
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #7c3aed' }}>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {(otherExpenses || []).map(expense => (
                        <tr key={expense.id} style={{ borderBottom: '1px solid #ddd' }}>
                          {editingExpense === expense.id ? (
                            <>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="date"
                                  value={editForm.expenseDate}
                                  onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <select
                                  value={editForm.expenseType}
                                  onChange={(e) => setEditForm({ ...editForm, expenseType: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
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
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                  step="0.01"
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="text"
                                  value={editForm.paidTo}
                                  onChange={(e) => setEditForm({ ...editForm, paidTo: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <button
                                  onClick={handleSaveEdit}
                                  className="btn btn-success"
                                  style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingExpense(null)}
                                  className="btn btn-secondary"
                                  style={{ padding: '5px 10px', fontSize: '12px' }}
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {formatDateDDMMYYYY(expense.expenseDate || expense.addedAt?.split('T')[0])}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {expense.expenseType || 'N/A'}
                                {expense.expenseType === 'Fuel' && expense.fuelLiters && (
                                  <span style={{ marginLeft: '8px', color: '#059669', fontSize: '0.85rem' }}>
                                    ({expense.fuelLiters} L)
                                  </span>
                                )}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.description || ''}</td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                ₹{parseFloat(expense.amount || 0).toFixed(2)}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.paidTo || ''}</td>
                              {!isFinalized && (
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleEdit(expense)}
                                    className="btn btn-secondary"
                                    style={{ padding: '5px 10px', fontSize: '12px', marginRight: '5px' }}
                                  >
                                    <Edit2 size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDelete(expense.id)}
                                    className="btn btn-danger"
                                    style={{ padding: '5px 10px', fontSize: '12px' }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '2px solid #8b5cf6',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Other Expenses Summary</h4>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8b5cf6' }}>
                    Total Other Expenses: ₹{totalOtherExpenses.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                    {(otherExpenses || []).length} expense entries
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Finalization Section */}
          {!isFinalized && (
            <div style={{ 
              marginTop: '30px', 
              padding: '25px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#059669' }}>Finalize Trip</h3>
              
              <div className="grid-4" style={{ marginBottom: '20px' }}>
                <div className="input-group">
                  <label>Total Running KM *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalizeData.totalKM}
                    onChange={(e) => setFinalizeData({ ...finalizeData, totalKM: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Desired Average (KM/L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalizeData.desiredAverage}
                    onChange={(e) => setFinalizeData({ ...finalizeData, desiredAverage: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Diesel Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalizeData.dieselAmount}
                    onChange={(e) => setFinalizeData({ ...finalizeData, dieselAmount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Diesel Rate (₹/L) *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalizeData.dieselRate}
                    onChange={(e) => setFinalizeData({ ...finalizeData, dieselRate: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Rate per liter for extra diesel calculation
                  </small>
                </div>
              </div>

              {/* Other Expenses Matrix */}
              <div style={{ 
                marginBottom: '20px', 
                padding: '20px', 
                backgroundColor: '#fff', 
                borderRadius: '8px',
                border: '1px solid #10b981'
              }}>
                <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#059669' }}>Other Expenses Matrix</h4>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f0fdf4', borderBottom: '2px solid #10b981' }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#059669' }}>Expense Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#059669' }}>From Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#059669' }}>To Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#059669' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Bhatta Row */}
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 500, color: '#1e293b' }}>
                          Bhatta
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                            (Trip Start: {selectedTrip?.tripStartDate || selectedTrip?.tripDate || 'N/A'} → Trip End: {selectedTrip?.tripEndDate || selectedTrip?.tripDate || 'N/A'})
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.bhatta?.fromDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                bhatta: {
                                  ...finalizeData.otherExpensesMatrix?.bhatta,
                                  fromDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.bhatta?.toDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                bhatta: {
                                  ...finalizeData.otherExpensesMatrix?.bhatta,
                                  toDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={finalizeData.otherExpensesMatrix?.bhatta?.amount || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                bhatta: {
                                  ...finalizeData.otherExpensesMatrix?.bhatta,
                                  amount: e.target.value
                                }
                              }
                            })}
                            placeholder="0.00"
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                      </tr>
                      
                      {/* Salary Row */}
                      <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '12px', fontWeight: 500, color: '#1e293b' }}>Salary</td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.salary?.fromDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                salary: {
                                  ...finalizeData.otherExpensesMatrix?.salary,
                                  fromDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.salary?.toDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                salary: {
                                  ...finalizeData.otherExpensesMatrix?.salary,
                                  toDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={finalizeData.otherExpensesMatrix?.salary?.amount || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                salary: {
                                  ...finalizeData.otherExpensesMatrix?.salary,
                                  amount: e.target.value
                                }
                              }
                            })}
                            placeholder="0.00"
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                      </tr>
                      
                      {/* Second Driver Row */}
                      <tr>
                        <td style={{ padding: '12px', fontWeight: 500, color: '#1e293b' }}>Second Driver</td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.secondDriver?.fromDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                secondDriver: {
                                  ...finalizeData.otherExpensesMatrix?.secondDriver,
                                  fromDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="date"
                            value={finalizeData.otherExpensesMatrix?.secondDriver?.toDate || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                secondDriver: {
                                  ...finalizeData.otherExpensesMatrix?.secondDriver,
                                  toDate: e.target.value
                                }
                              }
                            })}
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                        <td style={{ padding: '12px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={finalizeData.otherExpensesMatrix?.secondDriver?.amount || ''}
                            onChange={(e) => setFinalizeData({
                              ...finalizeData,
                              otherExpensesMatrix: {
                                ...finalizeData.otherExpensesMatrix,
                                secondDriver: {
                                  ...finalizeData.otherExpensesMatrix?.secondDriver,
                                  amount: e.target.value
                                }
                              }
                            })}
                            placeholder="0.00"
                            style={{ width: '100%', padding: '8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f0fdf4', borderRadius: '6px', fontSize: '0.875rem', color: '#059669' }}>
                  <strong>Note:</strong> Bhatta dates are pre-filled with trip start and end dates. You can manually adjust them. All amounts will be included in the final expense calculation.
                </div>
              </div>

              {/* Calculations Display */}
              {totalKM > 0 && totalFuel > 0 && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px',
                  border: '1px solid #10b981',
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Calculations</h4>
                  <div className="grid-2" style={{ gap: '15px' }}>
                    <div>
                      <strong>Total Fuel:</strong> {totalFuel.toFixed(2)} Liters
                    </div>
                    <div>
                      <strong>Total KM:</strong> {totalKM.toFixed(2)} KM
                    </div>
                    <div>
                      <strong>Actual Average:</strong> {actualAverage} KM/L
                    </div>
                    <div>
                      <strong>Desired Average:</strong> {desiredAvg} KM/L
                    </div>
                    <div>
                      <strong>Expected Fuel:</strong> {expectedFuel} Liters
                    </div>
                    <div>
                      <strong>Extra Diesel Taken:</strong> 
                      <span style={{ color: extraDiesel > 0 ? '#dc3545' : '#059669', fontWeight: 'bold', marginLeft: '8px' }}>
                        {extraDiesel} Liters
                      </span>
                    </div>
                    {extraDiesel > 0 && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <strong>Extra Diesel Cost:</strong> 
                        <span style={{ color: '#dc3545', fontWeight: 'bold', marginLeft: '8px' }}>
                          ₹{extraDieselCost}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Final Balance */}
              {totalKM > 0 && (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: finalBalance >= 0 ? '#d1fae5' : '#fee2e2', 
                  borderRadius: '8px',
                  border: `2px solid ${finalBalance >= 0 ? '#10b981' : '#ef4444'}`,
                  marginBottom: '20px'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Final Balance</h4>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    <strong>Total Advance + Diesel Amount:</strong> ₹{(totalAdvance + dieselAmount).toFixed(2)}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    <strong>Total Other Expenses:</strong> ₹{totalOtherExpenses.toFixed(2)}
                  </div>
                  {matrixTotal > 0 && (
                    <div style={{ fontSize: '18px', marginBottom: '10px', color: '#059669' }}>
                      <strong>Matrix Expenses (Bhatta + Salary + Second Driver):</strong> ₹{matrixTotal.toFixed(2)}
                    </div>
                  )}
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    <strong>Total Expenses + Matrix + Extra Diesel Cost:</strong> ₹{(totalOtherExpenses + matrixTotal + parseFloat(extraDieselCost)).toFixed(2)}
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: finalBalance >= 0 ? '#059669' : '#dc3545',
                    paddingTop: '10px',
                    borderTop: `2px solid ${finalBalance >= 0 ? '#10b981' : '#ef4444'}`
                  }}>
                    {finalBalance >= 0 ? 'Balance of Driver:' : 'To Recover from Driver:'} 
                    <span style={{ marginLeft: '10px' }}>
                      ₹{Math.abs(finalBalance).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleFinalize}
                  className="btn btn-danger"
                  disabled={!totalKM || !desiredAvg || !dieselAmount || !dieselRate}
                  style={{ flex: 1 }}
                >
                  ✅ Finalize Trip
                </button>
                <button
                  onClick={handleDownloadExcel}
                  className="btn btn-success"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Download size={16} /> Download Excel
                </button>
              </div>
            </div>
          )}

          {/* Finalized Summary */}
          {isFinalized && selectedTrip?.finalizedData && (
            <div style={{ 
              marginTop: '30px', 
              padding: '25px', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '8px',
              border: '2px solid #10b981'
            }}>
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#059669' }}>Finalized Trip Summary</h3>
              <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                <div className="grid-2" style={{ gap: '15px', marginBottom: '15px' }}>
                  <div><strong>Total KM:</strong> {selectedTrip.finalizedData.totalKM}</div>
                  <div><strong>Desired Average:</strong> {selectedTrip.finalizedData.desiredAverage} KM/L</div>
                  <div><strong>Actual Average:</strong> {selectedTrip.finalizedData.actualAverage} KM/L</div>
                  <div><strong>Extra Diesel:</strong> {selectedTrip.finalizedData.extraDiesel} Liters</div>
                </div>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: selectedTrip.finalizedData.finalBalance >= 0 ? '#d1fae5' : '#fee2e2',
                  borderRadius: '6px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: selectedTrip.finalizedData.finalBalance >= 0 ? '#059669' : '#dc3545'
                }}>
                  {selectedTrip.finalizedData.finalBalance >= 0 ? 'Balance of Driver:' : 'To Recover from Driver:'} 
                  ₹{Math.abs(selectedTrip.finalizedData.finalBalance).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
