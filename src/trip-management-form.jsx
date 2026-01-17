import React, { useState, useEffect } from 'react';
import { Save, Plus, Truck, User, FileText, DollarSign, Fuel, X, Calendar, Clock, Edit2, CheckCircle, Download, Trash2, Printer } from 'lucide-react';
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
  const [expenseTypes, setExpenseTypes] = useState([]); // Expense Master (SQL: expenseTypes)
  
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

  const normalizeExpenseType = (t) => String(t || '').trim().toLowerCase();
  const isFuelExpenseType = (t) => {
    const n = normalizeExpenseType(t);
    return n === 'fuel' || n.includes('fuel') || n.includes('diesel') || n.includes('cng');
  };
  const isSalaryExpenseType = (t) => {
    const n = normalizeExpenseType(t);
    return n === 'salary' || n.includes('salary') || n.includes('wages');
  };
  const isBhattaExpenseType = (t) => {
    const n = normalizeExpenseType(t);
    return n === 'bhatta' || n.includes('bhatta') || n.includes('allowance');
  };

  const getTripExpenseTypeOptions = () => {
    // Strict: only types present in Expense Master
    const fromMaster = (expenseTypes || [])
      .map(et => et?.expenseType)
      .filter(Boolean)
      .map(t => String(t).trim())
      .filter(Boolean);

    const seen = new Set();
    const out = [];
    fromMaster.forEach(t => {
      const norm = normalizeExpenseType(t);
      if (!norm) return;
      if (seen.has(norm)) return;
      seen.add(norm);
      out.push(t);
    });
    return out;
  };

  // Ensure selected expense type is valid against Expense Master
  useEffect(() => {
    const opts = getTripExpenseTypeOptions();
    if (opts.length === 0) return;
    const current = expenseData?.expenseType;
    const isValid = opts.some(t => normalizeExpenseType(t) === normalizeExpenseType(current));
    if (!current || !isValid) {
      setExpenseData(prev => ({ ...prev, expenseType: opts[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseTypes]);
  
  // Load data from API (only once on mount)
  useEffect(() => {
    let isMounted = true;
    let isLoading = false;
    
    const loadData = async () => {
      // Prevent multiple simultaneous loads
      if (isLoading) return;
      isLoading = true;
      
      try {
        const syncService = (await import('./utils/sync-service')).default;
        
        // Load from API server
        const [branchesResult, vehiclesResult, driversResult, manifestsResult, ftlLRBookingsResult, vendorsResult, otherVendorsResult, tripsResult, citiesResult, expenseTypesResult] = await Promise.all([
          syncService.load('branches'),
          syncService.load('vehicles'),
          syncService.load('drivers'),
          syncService.load('manifests'),
          // FTL LRs are stored in ftlLRBookings table (server)
          syncService.load('ftlLRBookings'),
          syncService.load('marketVehicleVendors'),
          syncService.load('otherVendors'),
          syncService.load('trips'),
          syncService.load('cities'),
          syncService.load('expenseTypes')
        ]);
        
        if (!isMounted) return;
        
        // Set branches (filter active)
        const allBranches = Array.isArray(branchesResult) ? branchesResult : (branchesResult?.data || []);
        setBranches(allBranches.filter(b => b.status === 'Active'));
        
        // Set vehicles
        const allVehicles = Array.isArray(vehiclesResult) ? vehiclesResult : (vehiclesResult?.data || []);
        setVehicles(allVehicles);
        
        // Set drivers
        const allDrivers = Array.isArray(driversResult) ? driversResult : (driversResult?.data || []);
        setDrivers(allDrivers);
        
        // Set manifests
        const allManifests = Array.isArray(manifestsResult) ? manifestsResult : (manifestsResult?.data || []);
        setManifests(allManifests);
        
        // Also update localStorage for fallback
        localStorage.setItem('manifests', JSON.stringify(allManifests));
        
        // FTL LRs for FTL trip creation
        const ftlLRs = Array.isArray(ftlLRBookingsResult) ? ftlLRBookingsResult : (ftlLRBookingsResult?.data || []);
        setLrBookings(ftlLRs || []);
        localStorage.setItem('ftlLRBookings', JSON.stringify(ftlLRs || []));
        
        // Set vendors
        const allVendors = Array.isArray(vendorsResult) ? vendorsResult : (vendorsResult?.data || []);
        setVendors(allVendors);
        
        // Load fuel vendors (Other Vendors with Fuel Supplier category)
        const allOtherVendors = Array.isArray(otherVendorsResult) ? otherVendorsResult : (otherVendorsResult?.data || []);
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
        
        // Set trips and parse data column
        const allTrips = Array.isArray(tripsResult) ? tripsResult : (tripsResult?.data || []);
        // Parse data column for each trip to extract origin, destination, etc.
        const parsedTrips = allTrips.map(trip => {
          if (trip.data && typeof trip.data === 'string') {
            try {
              const parsedData = JSON.parse(trip.data);
              return { ...trip, ...parsedData };
            } catch (e) {
              // If parsing fails, return trip as is
              return trip;
            }
          }
          return trip;
        });
        setTrips(parsedTrips);
        
        // Set cities
        const allCities = Array.isArray(citiesResult) ? citiesResult : (citiesResult?.data || []);
        setCities(allCities);

        // Expense Types (Expense Master)
        const allExpenseTypes = Array.isArray(expenseTypesResult) ? expenseTypesResult : (expenseTypesResult?.data || []);
        setExpenseTypes(allExpenseTypes);
        localStorage.setItem('expenseTypes', JSON.stringify(allExpenseTypes));
      } catch (error) {
        console.error('Error loading data:', error);
        if (!isMounted) return;
        // Fallback to localStorage
        const fallbackBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        setBranches(fallbackBranches.filter(b => b.status === 'Active'));
        setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]'));
        setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]'));
        setManifests(JSON.parse(localStorage.getItem('manifests') || '[]'));
        setLrBookings(JSON.parse(localStorage.getItem('ftlLRBookings') || '[]'));
        setVendors(JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]'));
        const allOtherVendors = JSON.parse(localStorage.getItem('otherVendors') || '[]');
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
        setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
        setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
        setExpenseTypes(JSON.parse(localStorage.getItem('expenseTypes') || '[]'));
      } finally {
        isLoading = false;
      }
    };
    
    loadData();
    
    // Listen for manifest creation/update events
    const handleManifestCreated = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const manifestsResult = await syncService.load('manifests');
        const allManifests = Array.isArray(manifestsResult) ? manifestsResult : (manifestsResult?.data || []);
        if (isMounted) {
          setManifests(allManifests);
          localStorage.setItem('manifests', JSON.stringify(allManifests));
        }
      } catch (error) {
        console.error('Error reloading manifests:', error);
      }
    };
    
    const handleManifestUpdated = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const manifestsResult = await syncService.load('manifests');
        const allManifests = Array.isArray(manifestsResult) ? manifestsResult : (manifestsResult?.data || []);
        if (isMounted) {
          setManifests(allManifests);
          localStorage.setItem('manifests', JSON.stringify(allManifests));
        }
      } catch (error) {
        console.error('Error reloading manifests:', error);
      }
    };
    
    const handleDataSync = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const manifestsResult = await syncService.load('manifests');
        const allManifests = Array.isArray(manifestsResult) ? manifestsResult : (manifestsResult?.data || []);
        if (isMounted) {
          setManifests(allManifests);
          localStorage.setItem('manifests', JSON.stringify(allManifests));
        }
      } catch (error) {
        console.error('Error reloading manifests:', error);
      }
    };

    const handleExpenseTypesUpdated = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const res = await syncService.load('expenseTypes');
        const allExpenseTypes = Array.isArray(res) ? res : (res?.data || []);
        if (isMounted) {
          setExpenseTypes(allExpenseTypes);
          localStorage.setItem('expenseTypes', JSON.stringify(allExpenseTypes));
        }
      } catch (error) {
        console.error('Error reloading expense types:', error);
      }
    };
    
    window.addEventListener('manifestCreated', handleManifestCreated);
    window.addEventListener('manifestUpdated', handleManifestUpdated);
    window.addEventListener('dataSyncedFromServer', handleDataSync);
    window.addEventListener('expenseTypesUpdated', handleExpenseTypesUpdated);
    
    return () => {
      isMounted = false;
      window.removeEventListener('manifestCreated', handleManifestCreated);
      window.removeEventListener('manifestUpdated', handleManifestUpdated);
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
      window.removeEventListener('expenseTypesUpdated', handleExpenseTypesUpdated);
    };
  }, []); // Empty dependency array - only run once on mount
  
  // Load user info when branches are available
  useEffect(() => {
    if (branches.length === 0) return;
    
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
          const branch = branches.find(b => b.id.toString() === adminBranchId);
          setUserBranch(branch || null);
        } else {
          setUserBranch(null); // Admin can see all branches
        }
      } else {
        // Non-admin: use their assigned branch
        const userBranchId = systemUser?.branch || user?.branch;
        if (userBranchId) {
          const branch = branches.find(b => 
            b.id.toString() === userBranchId.toString() || 
            b.branchCode === userBranchId.toString()
          );
          setUserBranch(branch || null);
        } else {
          setUserBranch(null);
        }
      }
    }
  }, [branches]);

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
    secondDriver: '', // Optional second driver
    
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

  // Admin branch context: react to Admin changing branch in dashboard/topbar
  useEffect(() => {
    if (!isAdmin) return;
    const onChanged = (e) => {
      const id = e?.detail?.branchId ? String(e.detail.branchId) : '';
      if (!id) return; // ALL branches -> do not force
      setFormData(prev => ({ ...prev, originBranch: id }));
    };
    window.addEventListener('adminBranchChanged', onChanged);
    return () => window.removeEventListener('adminBranchChanged', onChanged);
  }, [isAdmin]);

  const [expenseData, setExpenseData] = useState({
    expenseType: '', // must exist in Expense Master (expenseTypes)
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidFromBranch: '', // Branch from which money is paid (for Day Book)
    paymentMode: 'Cash', // Cash, UPI, Bank, On Account
    paidTo: '',
    receiptNumber: '',
    fuelLiters: '', // Liters of fuel (only for Fuel type)
    fuelVendor: '', // Fuel vendor ID (only for Fuel type)
    driverId: '' // Driver ID (only for Salary/Bhatta)
  });

  // Auto-generate trip number (must update after trips load from server)
  useEffect(() => {
    // Return trip: use the same trip number as parent
    if (formData.isReturnTrip && formData.parentTripNumber) {
      if (formData.tripNumber !== formData.parentTripNumber) {
        setFormData(prev => ({ ...prev, tripNumber: prev.parentTripNumber }));
      }
      return;
    }

    if (formData.isReturnTrip) return;

    // New trip: always compute next number from loaded trips
    let maxTripNumber = 0;
    (trips || []).forEach(trip => {
      if (trip?.tripNumber && String(trip.tripNumber).startsWith('TRIP')) {
        const numStr = String(trip.tripNumber).replace('TRIP', '');
        const num = parseInt(numStr, 10);
        if (!Number.isNaN(num) && num > maxTripNumber) {
          maxTripNumber = num;
        }
      }
    });
    const nextTripNumber = maxTripNumber + 1;
    const nextTripNo = `TRIP${String(nextTripNumber).padStart(6, '0')}`;
    if (formData.tripNumber !== nextTripNo) {
      setFormData(prev => ({ ...prev, tripNumber: nextTripNo }));
    }
  }, [trips, formData.isReturnTrip, formData.parentTripNumber]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - Origin Branch must be set
    if (!formData.originBranch) {
      alert('⚠️ Origin Branch is required! Please select a branch.');
      return;
    }

    // Validation - Route must be set
    if (!formData.origin || !formData.destination) {
      alert('⚠️ Route is required!\n\nPlease select both Origin and Destination cities.');
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
      const syncService = (await import('./utils/sync-service')).default;
      const getNextTripNoFromList = (tripList) => {
        let maxTripNumber = 0;
        (tripList || []).forEach(t => {
          if (t?.tripNumber && String(t.tripNumber).startsWith('TRIP')) {
            const numStr = String(t.tripNumber).replace('TRIP', '');
            const num = parseInt(numStr, 10);
            if (!Number.isNaN(num) && num > maxTripNumber) maxTripNumber = num;
          }
        });
        return `TRIP${String(maxTripNumber + 1).padStart(6, '0')}`;
      };
      const normalizeTrips = (allTrips) => (allTrips || []).map(trip => {
        if (trip?.data && typeof trip.data === 'string') {
          try {
            const parsedData = JSON.parse(trip.data);
            return { ...trip, ...parsedData };
          } catch (_) {
            return trip;
          }
        }
        return trip;
      });
      
      // Filter trip data - only send basic schema fields, store rest in data column
      const filterTripData = (tripData) => {
        // Only these basic fields should be direct columns in the database
        // tripType and vehicleType are required (NOT NULL) so they must be direct columns
        // For CREATE we should NOT send id (server DB should assign it)
        const allowedDirectColumns = ['tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        
        // Fields that should be stored in 'data' column as JSON
        const fieldsToStoreInData = [
          'isReturnTrip',
          'parentTripNumber',
          'parentTripId',
          'originBranch',
          'ownedVehicle',
          'ownedDriver',
          'secondDriver',
          'marketVehicleNumber',
          'marketDriverName',
          'marketDriverMobile',
          'marketDriverLicense',
          'vendor',
          'freightAmount',
          'advanceToVendor',
          'balanceToVendor',
          'selectedManifest',
          'selectedLRs',
          'origin',
          'destination',
          'expectedDepartureDate',
          'expectedDepartureTime',
          'expectedArrivalDate',
          'expectedArrivalTime',
          'expenses',
          'fuelEntries',
          'advanceEntries',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(tripData).forEach(key => {
          // Exclude undefined values
          if (tripData[key] === undefined) return;
          
          // Exclude null values for optional fields (except tripNumber)
          if (tripData[key] === null && !['tripNumber'].includes(key)) return;
          
          // Only allow basic schema fields as direct columns
          if (!allowedDirectColumns.includes(key)) {
            // Store everything else in data column
            if (fieldsToStoreInData.includes(key) || 
                (typeof tripData[key] === 'object' && tripData[key] !== null && !Array.isArray(tripData[key]) && !(tripData[key] instanceof Date) && !(tripData[key] instanceof String))) {
              dataColumn[key] = tripData[key];
            } else {
              // Even simple fields that aren't in the basic schema go to data column
              dataColumn[key] = tripData[key];
            }
            return;
          }
          
          // Include only allowed direct columns
          filtered[key] = tripData[key];
        });
        
        // If we have complex data, store it in 'data' column
        if (Object.keys(dataColumn).length > 0) {
          // Merge with existing data column if present
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const newTrip = {
        ...formData,
        expenses: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      // Safety: never send id on CREATE (can linger from edit mode / old state)
      delete newTrip.id;

      // Filter trip data before saving
      let filteredTrip = filterTripData(newTrip);

      // Always compute next trip number from server right before creating (avoid UNIQUE conflicts)
      const tripsRes = await syncService.load('trips');
      const serverTrips = normalizeTrips(Array.isArray(tripsRes) ? tripsRes : (tripsRes?.data || []));
      const existingNumbers = new Set(serverTrips.map(t => t.tripNumber).filter(Boolean));
      if (!filteredTrip.tripNumber || existingNumbers.has(filteredTrip.tripNumber)) {
        filteredTrip.tripNumber = getNextTripNoFromList(serverTrips);
        setFormData(prev => ({ ...prev, tripNumber: filteredTrip.tripNumber }));
      }

      // Save to server
      const savedTrip = await syncService.save('trips', filteredTrip);
      if (savedTrip && savedTrip.success === false) {
        // If UNIQUE constraint hit, retry once with the next number
        if (String(savedTrip.error || '').toLowerCase().includes('unique') && String(savedTrip.error || '').includes('trips.tripNumber')) {
          const retryTripsRes = await syncService.load('trips');
          const retryServerTrips = normalizeTrips(Array.isArray(retryTripsRes) ? retryTripsRes : (retryTripsRes?.data || []));
          filteredTrip.tripNumber = getNextTripNoFromList(retryServerTrips);
          setFormData(prev => ({ ...prev, tripNumber: filteredTrip.tripNumber }));
          const retry = await syncService.save('trips', filteredTrip);
          if (retry && retry.success === false) throw new Error(retry.error || 'Trip create failed');
        } else {
          throw new Error(savedTrip.error || 'Trip create failed');
        }
      }
      
      // Reload trips from server to get the latest data (including the newly created trip)
      const syncService2 = (await import('./utils/sync-service')).default;
      const tripsResult = await syncService2.load('trips');
      const allTrips = Array.isArray(tripsResult) ? tripsResult : (tripsResult?.data || []);
      const parsedTrips = normalizeTrips(allTrips);
      
      setTrips(parsedTrips);
      localStorage.setItem('trips', JSON.stringify(parsedTrips));

      alert(`✅ Trip "${formData.tripNumber}" created successfully!\n\nTrip Type: ${formData.tripType}\nVehicle: ${formData.vehicleType}\nStatus: ${formData.status}\n\nSaved to server!`);
      
      // Trigger refresh event for other components
      window.dispatchEvent(new CustomEvent('tripCreated'));
      window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
      
      // Generate next trip number based on updated trips list from server
      let maxTripNumber = 0;
      parsedTrips.forEach(trip => {
        if (trip.tripNumber && trip.tripNumber.startsWith('TRIP')) {
          const numStr = trip.tripNumber.replace('TRIP', '');
          const num = parseInt(numStr, 10);
          if (!isNaN(num) && num > maxTripNumber) {
            maxTripNumber = num;
          }
        }
      });
      const nextTripNumber = maxTripNumber + 1;
      const nextTripNo = `TRIP${String(nextTripNumber).padStart(6, '0')}`;
      
      // Reset form after trips are reloaded (so trip number generation works correctly)
      setFormData({
        tripNumber: nextTripNo, // Auto-generated next trip number
        tripDate: new Date().toISOString().split('T')[0],
        tripType: 'PTL',
        vehicleType: 'Owned',
        isReturnTrip: false,
        parentTripNumber: '',
        parentTripId: null,
        originBranch: formData.originBranch, // Keep origin branch
        ownedVehicle: '',
        ownedDriver: '',
        secondDriver: '',
        marketVehicleNumber: '',
        marketDriverName: '',
        marketDriverMobile: '',
        marketDriverLicense: '',
        vendor: '',
        freightAmount: '',
        advanceToVendor: '',
        balanceToVendor: '',
        selectedManifest: '',
        selectedLRs: [],
        origin: '',
        destination: '',
        expectedDepartureDate: '',
        expectedDepartureTime: '',
        expectedArrivalDate: '',
        expectedArrivalTime: '',
        status: 'Scheduled'
      });
      
      // Reset city selections
      setSelectedOrigin(null);
      setSelectedDestination(null);
      setOriginSearch('');
      setDestinationSearch('');
      
      // Trip number will be auto-generated on next form use via useEffect (which depends on trips)
    } catch (error) {
      console.error('Error creating trip:', error);
      
      // If trip creation failed (especially UNIQUE constraint), reload trips from server and regenerate trip number
      try {
        const syncService2 = (await import('./utils/sync-service')).default;
        const tripsResult = await syncService2.load('trips');
        const allTrips = Array.isArray(tripsResult) ? tripsResult : (tripsResult?.data || []);
        
        // Parse data column for each trip
        const parsedTrips = allTrips.map(trip => {
          if (trip.data && typeof trip.data === 'string') {
            try {
              const parsedData = JSON.parse(trip.data);
              return { ...trip, ...parsedData };
            } catch (e) {
              return trip;
            }
          }
          return trip;
        });
        
        setTrips(parsedTrips);
        
        // Generate next trip number based on server data
        let maxTripNumber = 0;
        parsedTrips.forEach(trip => {
          if (trip.tripNumber && trip.tripNumber.startsWith('TRIP')) {
            const numStr = trip.tripNumber.replace('TRIP', '');
            const num = parseInt(numStr, 10);
            if (!isNaN(num) && num > maxTripNumber) {
              maxTripNumber = num;
            }
          }
        });
        const nextTripNumber = maxTripNumber + 1;
        const nextTripNo = `TRIP${String(nextTripNumber).padStart(6, '0')}`;
        
        // Update form with new trip number
        setFormData(prev => ({ ...prev, tripNumber: nextTripNo }));
        
        alert(`❌ Error creating trip: ${error.message || 'Unknown error'}\n\nTrip number has been updated to ${nextTripNo}. Please try again.`);
      } catch (reloadError) {
        console.error('Error reloading trips:', reloadError);
        alert(`❌ Error creating trip: ${error.message || 'Unknown error'}\n\nPlease try again.`);
      }
    }
  };

  const handleAddExpense = async () => {
    if (!selectedTripForExpense) return;
    
    // Validation for fuel expenses
    if (isFuelExpenseType(expenseData.expenseType)) {
      if (!expenseData.fuelLiters || parseFloat(expenseData.fuelLiters) <= 0) {
        alert('⚠️ Please enter valid fuel liters!');
        return;
      }
      if (!expenseData.fuelVendor) {
        alert('⚠️ Please select a fuel vendor!');
        return;
      }
    }

    // Validation for salary/bhatta expenses
    if ((isSalaryExpenseType(expenseData.expenseType) || isBhattaExpenseType(expenseData.expenseType)) && !expenseData.driverId) {
      alert('⚠️ Please select a driver for Salary/Bhatta!');
      return;
    }
    
    if (!expenseData.amount || parseFloat(expenseData.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    if (!expenseData.paidFromBranch) {
      alert('⚠️ Please select Paid From Branch!');
      return;
    }
    
    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id === selectedTripForExpense.id);
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }
      
      const newExpense = {
        id: Date.now(),
        ...expenseData,
        addedAt: new Date().toISOString()
      };
      
      const amountNum = parseFloat(expenseData.amount) || 0;
      const isFuelExpense = isFuelExpenseType(expenseData.expenseType);

      // If Fuel is added via "Add Trip Expense", also record it as a Fuel Entry so liters/amount reflect everywhere
      const maybeNewFuelEntry = isFuelExpense ? {
        id: Date.now() + 1,
        fuelLiters: parseFloat(expenseData.fuelLiters) || 0,
        fuelVendor: expenseData.fuelVendor,
        fuelDate: expenseData.expenseDate,
        description: expenseData.description || 'Fuel (via Trip Expense)',
        // We don't have state/type on this modal; keep defaults
        state: '',
        fuelType: 'diesel',
        fuelRate: (parseFloat(expenseData.fuelLiters) || 0) > 0 ? (amountNum / (parseFloat(expenseData.fuelLiters) || 1)) : 0,
        fuelAmount: amountNum,
        paymentMode: expenseData.paymentMode || 'Cash',
        paidFromBranch: expenseData.paidFromBranch || '',
        addedAt: new Date().toISOString()
      } : null;

      const updatedFuelEntries = maybeNewFuelEntry
        ? [...(trip.fuelEntries || []), maybeNewFuelEntry]
        : (trip.fuelEntries || []);

      // Add non-fuel expenses to trip.expenses (fuel is handled via fuelEntries)
      const updatedExpenses = isFuelExpense
        ? (trip.expenses || [])
        : [...(trip.expenses || []), newExpense];
      
      // Filter trip data before saving (same filter as in handleSubmit)
      const filterTripData = (tripData) => {
        const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        const fieldsToStoreInData = [
          'isReturnTrip', 'parentTripNumber', 'parentTripId', 'originBranch',
          'ownedVehicle', 'ownedDriver', 'secondDriver', 'marketVehicleNumber', 'marketDriverName',
          'marketDriverMobile', 'marketDriverLicense', 'vendor', 'freightAmount', 'advanceToVendor',
          'balanceToVendor', 'selectedManifest', 'selectedLRs', 'origin', 'destination',
          'expectedDepartureDate', 'expectedDepartureTime', 'expectedArrivalDate', 'expectedArrivalTime',
          'expenses', 'fuelEntries', 'advanceEntries',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(tripData).forEach(key => {
          if (tripData[key] === undefined) return;
          if (tripData[key] === null && !['id', 'tripNumber'].includes(key)) return;
          
          if (!allowedDirectColumns.includes(key)) {
            if (fieldsToStoreInData.includes(key) || 
                (typeof tripData[key] === 'object' && tripData[key] !== null && !Array.isArray(tripData[key]) && !(tripData[key] instanceof Date) && !(tripData[key] instanceof String))) {
              dataColumn[key] = tripData[key];
            } else {
              dataColumn[key] = tripData[key];
            }
            return;
          }
          filtered[key] = tripData[key];
        });
        
        if (Object.keys(dataColumn).length > 0) {
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const updatedTrip = {
        ...trip,
        expenses: updatedExpenses,
        fuelEntries: updatedFuelEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Filter trip data before saving
      const filteredTrip = filterTripData(updatedTrip);
      
      // Update on server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', filteredTrip, true, trip.id);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTripWithData = { ...updatedTrip, data: filteredTrip.data };
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTripWithData : t);
      setTrips(updatedTrips);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));

      // =========================
      // Accounting / Day Book hooks
      // =========================
      try {
        const branchId = expenseData.paidFromBranch;
        const branchName =
          branches.find(b => b.id?.toString() === branchId?.toString())?.branchName ||
          branches.find(b => b.branchCode?.toString() === branchId?.toString())?.branchName ||
          'N/A';

        // 1) Branch Day Book entry (save to server branchExpenses)
        // Use timestamp-based number to avoid UNIQUE collisions across users/browsers.
        const expenseNo = `TEXP${Date.now()}`;

        const dayBookExpense = {
          id: Date.now(),
          expenseNumber: expenseNo,
          expenseDate: expenseData.expenseDate,
          branch: branchId,
          branchName,
          tripId: trip.id,
          expenseCategory: 'Operating',
          expenseType: `Trip ${expenseData.expenseType}`,
          amount: amountNum,
          gstAmount: 0,
          totalAmount: amountNum,
          paymentMode: expenseData.paymentMode || 'Cash',
          paidTo: expenseData.paidTo || '',
          description: `Trip ${trip.tripNumber}: ${expenseData.expenseType}${expenseData.description ? ` - ${expenseData.description}` : ''}`,
          receiptNumber: expenseData.receiptNumber || '',
          createdAt: new Date().toISOString(),
          status: 'Active',
          data: {
            source: 'TripManagement',
            tripNumber: trip.tripNumber,
            fuelVendor: expenseData.fuelVendor || '',
            fuelLiters: expenseData.fuelLiters || '',
            driverId: expenseData.driverId || ''
          }
        };
        await syncService.save('branchExpenses', dayBookExpense);
        window.dispatchEvent(new CustomEvent('branchExpenseCreated', { detail: { expense: dayBookExpense } }));
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));

        // 2) Fuel vendor ledger (simple tracking)
        if (isFuelExpenseType(expenseData.expenseType) && expenseData.fuelVendor) {
          const vendor = fuelVendors.find(v => v.id?.toString() === expenseData.fuelVendor?.toString());
          const vendorLedger = JSON.parse(localStorage.getItem('vendorLedgerEntries') || '[]');
          vendorLedger.push({
            id: Date.now() + Math.random(),
            date: expenseData.expenseDate,
            vendorId: expenseData.fuelVendor,
            vendorName: vendor?.tradeName || vendor?.companyName || vendor?.vendorName || 'Fuel Vendor',
            tripId: trip.id,
            tripNumber: trip.tripNumber,
            branchId,
            type: 'Credit',
            amount: amountNum,
            narration: `Fuel for Trip ${trip.tripNumber} (${expenseData.fuelLiters || 0} L)`,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('vendorLedgerEntries', JSON.stringify(vendorLedger));
        }

        // 3) Driver ledger (simple tracking for Salary/Bhatta)
        if ((isSalaryExpenseType(expenseData.expenseType) || isBhattaExpenseType(expenseData.expenseType)) && expenseData.driverId) {
          const driver = drivers.find(d => d.id?.toString() === expenseData.driverId?.toString());
          const driverLedger = JSON.parse(localStorage.getItem('driverLedgerEntries') || '[]');
          driverLedger.push({
            id: Date.now() + Math.random(),
            date: expenseData.expenseDate,
            driverId: expenseData.driverId,
            driverName: driver?.driverName || 'Driver',
            tripId: trip.id,
            tripNumber: trip.tripNumber,
            branchId,
            type: 'Credit',
            amount: amountNum,
            narration: `${expenseData.expenseType} for Trip ${trip.tripNumber}`,
            paymentMode: expenseData.paymentMode || 'Cash',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('driverLedgerEntries', JSON.stringify(driverLedger));
        }
      } catch (e) {
        console.warn('Day book / ledger hook failed:', e);
      }
      
      const fuelInfo = isFuelExpenseType(expenseData.expenseType) && expenseData.fuelLiters 
        ? `\nFuel: ${expenseData.fuelLiters} Liters` 
        : '';
      const vendorInfo = isFuelExpenseType(expenseData.expenseType) && expenseData.fuelVendor 
        ? `\nVendor: ${fuelVendors.find(v => v.id.toString() === expenseData.fuelVendor)?.tradeName || 'N/A'}` 
        : '';
      
      alert(`✅ Expense added to Trip ${selectedTripForExpense.tripNumber}!\n\nType: ${expenseData.expenseType}\nAmount: ₹${expenseData.amount}${fuelInfo}${vendorInfo}\n\nSaved to server!`);
      
      const nextType = (getTripExpenseTypeOptions()[0] || '');
      setExpenseData({
        expenseType: nextType,
        amount: '',
        description: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paidFromBranch: '',
        paymentMode: 'Cash',
        paidTo: '',
        receiptNumber: '',
        fuelLiters: '',
        fuelVendor: '',
        driverId: ''
      });
      
      setShowExpenseModal(false);
      setSelectedTripForExpense(null);
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error adding expense:', error);
      alert(`❌ Error adding expense: ${error.message || 'Unknown error'}`);
    }
  };

  const handleCloseTrip = async (tripId) => {
    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id === tripId);
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }
      
      // Filter trip data before saving (same filter as in handleSubmit)
      const filterTripData = (tripData) => {
        const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        const fieldsToStoreInData = [
          'isReturnTrip', 'parentTripNumber', 'parentTripId', 'originBranch',
          'ownedVehicle', 'ownedDriver', 'secondDriver', 'marketVehicleNumber', 'marketDriverName',
          'marketDriverMobile', 'marketDriverLicense', 'vendor', 'freightAmount', 'advanceToVendor',
          'balanceToVendor', 'selectedManifest', 'selectedLRs', 'origin', 'destination',
          'expectedDepartureDate', 'expectedDepartureTime', 'expectedArrivalDate', 'expectedArrivalTime',
          'expenses', 'fuelEntries', 'advanceEntries', 'closedAt',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(tripData).forEach(key => {
          if (tripData[key] === undefined) return;
          if (tripData[key] === null && !['id', 'tripNumber'].includes(key)) return;
          
          if (!allowedDirectColumns.includes(key)) {
            dataColumn[key] = tripData[key];
            return;
          }
          filtered[key] = tripData[key];
        });
        
        if (Object.keys(dataColumn).length > 0) {
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const updatedTrip = {
        ...trip,
        status: 'Closed',
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Filter trip data before saving
      const filteredTrip = filterTripData(updatedTrip);
      
      // Update on server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', filteredTrip, true, tripId);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === tripId ? updatedTrip : t);
      setTrips(updatedTrips);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      
      alert(`✅ Trip ${updatedTrip.tripNumber} has been closed!\n\nSaved to server!`);
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error closing trip:', error);
      alert(`❌ Error closing trip: ${error.message || 'Unknown error'}`);
    }
  };

  const getVehicleDetails = (vehicleId) => {
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId);
    return vehicle ? `${vehicle.vehicleNumber} - ${vehicle.vehicleType}` : 'N/A';
  };

  const getDriverDetails = (driverId) => {
    const driver = drivers.find(d => d.id.toString() === driverId);
    if (!driver) return 'N/A';
    const nameDisplay = driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName;
    return `${nameDisplay} (${driver.licenseNumber || driver.mobile || 'No License'})`;
  };

  const calculateTotalExpenses = (trip) => {
    if (!trip) return 0;
    const other = Array.isArray(trip.expenses)
      ? trip.expenses.reduce((sum, exp) => sum + (parseFloat(exp?.amount) || 0), 0)
      : 0;
    const fuel = Array.isArray(trip.fuelEntries)
      ? trip.fuelEntries.reduce((sum, e) => sum + (parseFloat(e?.fuelAmount) || 0), 0)
      : 0;
    const advance = Array.isArray(trip.advanceEntries)
      ? trip.advanceEntries.reduce((sum, e) => sum + (parseFloat(e?.amount) || 0), 0)
      : 0;
    return other + fuel + advance;
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
                    }}
                    required
                    disabled={!!localStorage.getItem('adminSelectedBranch')}
                    style={!!localStorage.getItem('adminSelectedBranch')
                      ? { background: '#f3f4f6', cursor: 'not-allowed' }
                      : {}}
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
                          secondDriver: selectedTrip.secondDriver || prev.secondDriver,
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
                        {driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName} - {driver.licenseNumber || driver.mobile || 'No License'} ({driver.salaryType || 'Monthly'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Second Driver (Optional)</label>
                  <select
                    value={formData.secondDriver}
                    onChange={(e) => setFormData(prev => ({ ...prev, secondDriver: e.target.value }))}
                  >
                    <option value="">-- Select Second Driver (Optional) --</option>
                    {drivers.filter(d => d.status === 'Active' && d.id.toString() !== formData.ownedDriver).map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName} - {driver.licenseNumber || driver.mobile || 'No License'} ({driver.salaryType || 'Monthly'})
                      </option>
                    ))}
                  </select>
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ margin: 0 }}>Select Manifest (PTL)</h2>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const syncService = (await import('./utils/sync-service')).default;
                      const manifestsResult = await syncService.load('manifests');
                      const allManifests = Array.isArray(manifestsResult) 
                        ? manifestsResult 
                        : (manifestsResult?.data || []);
                      setManifests(allManifests);
                      localStorage.setItem('manifests', JSON.stringify(allManifests));
                      console.log('🔄 Manifests refreshed in trip form:', allManifests.length);
                      alert(`✅ Manifests refreshed! Found ${allManifests.length} manifest(s).`);
                    } catch (error) {
                      console.error('Error refreshing manifests:', error);
                      alert('❌ Error refreshing manifests. Please try again.');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '2px solid #10b981',
                    background: 'white',
                    color: '#10b981',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="Reload manifests from server"
                >
                  🔄 Refresh Manifests
                </button>
              </div>
              
              {(() => {
                // Get manifests already assigned to trips (excluding current trip if editing)
                // Only filter if we have trips data loaded
                const assignedManifestIds = trips && trips.length > 0
                  ? trips
                      .filter(trip => {
                        // Exclude current trip if editing
                        if (formData.id && trip.id === formData.id) return false;
                        // Only include trips with selectedManifest
                        return trip.selectedManifest;
                      })
                      .map(trip => {
                        // Handle both string and number IDs
                        const manifestId = trip.selectedManifest;
                        return manifestId ? manifestId.toString() : null;
                      })
                      .filter(id => id !== null)
                  : [];
                
                // Show all manifests
                const allManifests = manifests.length > 0 ? manifests : [];
                
                // Filter manifests by status (only show active/created manifests)
                const availableManifests = allManifests.filter(manifest => {
                  const status = manifest.status || manifest.manifestStatus || 'Created';
                  return status !== 'Delivered' && status !== 'Completed';
                });

                // Do NOT allow manifests already assigned to another trip.
                // If editing, keep the currently selected manifest visible.
                const selectableManifests = availableManifests.filter(manifest => {
                  const idStr = manifest?.id?.toString?.() || '';
                  if (!idStr) return false;
                  const isAssignedElsewhere = assignedManifestIds.includes(idStr);
                  if (!isAssignedElsewhere) return true;
                  return formData.selectedManifest && idStr === formData.selectedManifest.toString();
                });
                
                return selectableManifests.length === 0 ? (
                <div style={{ padding: '20px', background: '#fef3c7', borderRadius: '8px', color: '#92400e' }}>
                    ⚠️ No available manifests found. Please create a new manifest from the Manifest module.
                    {manifests.length === 0 && (
                      <div style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                        (Manifests are loading from server...)
                      </div>
                    )}
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
                      {selectableManifests.map(manifest => {
                        const isAssigned = assignedManifestIds.includes(manifest.id.toString());
                        return (
                          <option key={manifest.id} value={manifest.id}>
                            {manifest.manifestNumber} - {manifest.manifestDate} ({manifest.summary?.lrCount || manifest.selectedLRs?.length || 0} LRs, {manifest.summary?.totalPieces || 0} Pieces){isAssigned ? ' [Already in Trip]' : ''}
                          </option>
                        );
                      })}
                  </select>
                    {assignedManifestIds.length > 0 && (
                      <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                        Note: {assignedManifestIds.length} manifest(s) are already assigned to other trips and are hidden from this list.
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
                <label>Origin *</label>
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
                      value={selectedOrigin ? `${selectedOrigin.cityName}, ${selectedOrigin.state}` : originSearch}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        // If user is typing and it doesn't match the selected city, clear selection
                        if (selectedOrigin && searchTerm !== `${selectedOrigin.cityName}, ${selectedOrigin.state}`) {
                          setSelectedOrigin(null);
                          setFormData(prev => ({ ...prev, origin: '' }));
                        }
                        setOriginSearch(searchTerm);
                        setShowOriginDropdown(true);
                        setOriginDropdownIndex(-1);
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
                            setOriginSearch(''); // Clear search to show selected city name
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
                                setOriginSearch(''); // Clear search to show selected city name
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
                <label>Destination *</label>
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
                      value={selectedDestination ? `${selectedDestination.cityName}, ${selectedDestination.state}` : destinationSearch}
                      onChange={(e) => {
                        const searchTerm = e.target.value;
                        // If user is typing and it doesn't match the selected city, clear selection
                        if (selectedDestination && searchTerm !== `${selectedDestination.cityName}, ${selectedDestination.state}`) {
                          setSelectedDestination(null);
                          setFormData(prev => ({ ...prev, destination: '' }));
                        }
                        setDestinationSearch(searchTerm);
                        setShowDestinationDropdown(true);
                        setDestinationDropdownIndex(-1);
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
                            setDestinationSearch(''); // Clear search to show selected city name
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
                                setDestinationSearch(''); // Clear search to show selected city name
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
            drivers={drivers}
          />
        )}

        {activeTab === 'viewExpenses' && (
          <ViewEditFinalizeExpenses 
            drivers={drivers}
            trips={trips} 
            setTrips={setTrips}
            fuelVendors={fuelVendors}
            expenseTypes={expenseTypes}
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
                  const nextType = e.target.value;
                  setExpenseData(prev => ({ 
                    ...prev, 
                    expenseType: nextType,
                    // Clear fuel-specific fields when changing away from fuel-like types
                    fuelLiters: !isFuelExpenseType(nextType) ? '' : prev.fuelLiters,
                    fuelVendor: !isFuelExpenseType(nextType) ? '' : prev.fuelVendor,
                    // Clear driver when changing away from Salary/Bhatta-like types
                    driverId: !(isSalaryExpenseType(nextType) || isBhattaExpenseType(nextType)) ? '' : prev.driverId
                  }));
                }}
              >
                {getTripExpenseTypeOptions().map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Paid From Branch *</label>
                <select
                  value={expenseData.paidFromBranch}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, paidFromBranch: e.target.value }))}
                  required
                >
                  <option value="">-- Select Branch --</option>
                  {branches.filter(b => b.status === 'Active').map(b => (
                    <option key={b.id} value={b.id}>
                      {b.branchName} ({b.branchCode || b.id})
                    </option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Payment Mode *</label>
                <select
                  value={expenseData.paymentMode}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  required
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                  <option value="On Account">On Account</option>
                </select>
              </div>
            </div>

            {/* Driver selection for Salary/Bhatta */}
            {(isSalaryExpenseType(expenseData.expenseType) || isBhattaExpenseType(expenseData.expenseType)) && (
              <div className="input-group">
                <label>Driver *</label>
                <select
                  value={expenseData.driverId}
                  onChange={(e) => setExpenseData(prev => ({ ...prev, driverId: e.target.value }))}
                  required
                >
                  <option value="">-- Select Driver --</option>
                  {drivers.filter(d => d.status === 'Active').map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nickName ? `${d.driverName} (${d.nickName})` : d.driverName} - {d.licenseNumber || d.mobile || 'No License'}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Fuel-specific fields */}
            {isFuelExpenseType(expenseData.expenseType) && (
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
                        {(vendor.vendorName || vendor.tradeName || vendor.companyName || 'Fuel Vendor')}
                        {(vendor.vendorCode || vendor.code) ? ` (${vendor.vendorCode || vendor.code})` : ''}
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
function AddTripExpenseForm({ trips, setTrips, fuelVendors: propFuelVendors, setShowExpenseModal, setSelectedTripForExpense, expenseData, setExpenseData, handleAddExpense, drivers = [] }) {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [cities, setCities] = useState([]);
  const [fuelVendors, setFuelVendors] = useState(propFuelVendors || []);

  // Load cities from API
  useEffect(() => {
    const loadCities = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const citiesResult = await syncService.load('cities');
        const allCities = Array.isArray(citiesResult) ? citiesResult : (citiesResult?.data || []);
        setCities(allCities);
      } catch (error) {
        console.error('Error loading cities:', error);
        // Fallback to localStorage
        setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
      }
    };
    loadCities();
  }, []);

  // Load fuel vendors if not provided as prop
  useEffect(() => {
    const loadFuelVendors = async () => {
      if (propFuelVendors && propFuelVendors.length > 0) {
        setFuelVendors(propFuelVendors);
        return;
      }
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const otherVendorsResult = await syncService.load('otherVendors');
        const allOtherVendors = Array.isArray(otherVendorsResult) ? otherVendorsResult : (otherVendorsResult?.data || []);
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
      } catch (error) {
        console.error('Error loading fuel vendors:', error);
        // Fallback to localStorage
        const allOtherVendors = JSON.parse(localStorage.getItem('otherVendors') || '[]');
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
      }
    };
    loadFuelVendors();
  }, [propFuelVendors]);
  
  // Reload trips when component mounts or when tripCreated event fires
  useEffect(() => {
    const loadTrips = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const tripsResult = await syncService.load('trips');
        const allTrips = Array.isArray(tripsResult) ? tripsResult : (tripsResult?.data || []);
        // Parse data column for each trip to extract origin, destination, etc.
        const parsedTrips = allTrips.map(trip => {
          if (trip.data && typeof trip.data === 'string') {
            try {
              const parsedData = JSON.parse(trip.data);
              return { ...trip, ...parsedData };
            } catch (e) {
              // If parsing fails, return trip as is
              return trip;
            }
          }
          return trip;
        });
        setTrips(parsedTrips);
      } catch (error) {
        console.error('Error loading trips:', error);
      }
    };
    
    // Load trips on mount
    loadTrips();
    
    // Listen for trip creation/update events
    const handleTripCreated = () => {
      loadTrips();
    };
    
    const handleDataSync = () => {
      loadTrips();
    };
    
    window.addEventListener('tripCreated', handleTripCreated);
    window.addEventListener('dataSyncedFromServer', handleDataSync);
    
    return () => {
      window.removeEventListener('tripCreated', handleTripCreated);
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
    };
  }, []); // Only run once on mount

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

  // Helper function to get driver details
  const getDriverDetails = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id?.toString() === driverId.toString());
    if (!driver) return 'N/A';
    const nameDisplay = driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName;
    return `${nameDisplay} (${driver.licenseNumber || driver.mobile || 'No License'})`;
  };
  const [expenseEntryType, setExpenseEntryType] = useState('fuel'); // 'fuel' or 'advance'
  const [fuelRates, setFuelRates] = useState({});
  const [loadingRates, setLoadingRates] = useState(false);
  const [fuelEntry, setFuelEntry] = useState({
    fuelLiters: '',
    fuelVendor: '',
    fuelDate: new Date().toISOString().split('T')[0],
    description: '',
    paidFromBranch: '', // Branch that paid (for Day Book)
    paymentMode: 'Cash',
    state: '',
    fuelType: 'diesel', // 'diesel' or 'cng'
    fuelRate: '',
    fuelAmount: ''
  });
  const [advanceEntry, setAdvanceEntry] = useState({
    amount: '',
    paymentMode: 'Cash', // Cash, UPI, In Bank
    paidFromBranch: '', // Branch that paid (for Day Book)
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

  // Parse trip data when selectedTripId changes
  useEffect(() => {
    if (selectedTripId) {
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      // Parse data column if present
      let parsedTrip = trip;
      if (trip && trip.data && typeof trip.data === 'string') {
        try {
          const parsedData = JSON.parse(trip.data);
          parsedTrip = { ...trip, ...parsedData };
        } catch (e) {
          // If parsing fails, use trip as is
          parsedTrip = trip;
        }
      }
      setSelectedTrip(parsedTrip);

      // Default "paid from branch" to trip originBranch if available
      const originBranchId = parsedTrip?.originBranch?.toString?.() || '';
      setFuelEntry(prev => ({ ...prev, paidFromBranch: prev.paidFromBranch || originBranchId }));
      setAdvanceEntry(prev => ({ ...prev, paidFromBranch: prev.paidFromBranch || originBranchId }));
    } else {
      setSelectedTrip(null);
    }
  }, [selectedTripId, trips]);

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

  const handleAddFuel = async (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('⚠️ Please select a trip!');
      return;
    }

    if (!fuelEntry.fuelLiters || parseFloat(fuelEntry.fuelLiters) <= 0) {
      alert('⚠️ Please enter valid fuel liters!');
      return;
    }

    if (!fuelEntry.paidFromBranch) {
      alert('⚠️ Please select Paid From Branch!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
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

      const updatedFuelEntries = [...(trip.fuelEntries || []), newFuelEntry];
      
      // Filter trip data before saving
      const filterTripData = (tripData) => {
        const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        const fieldsToStoreInData = [
          'isReturnTrip', 'parentTripNumber', 'parentTripId', 'originBranch',
          'ownedVehicle', 'ownedDriver', 'secondDriver', 'marketVehicleNumber', 'marketDriverName',
          'marketDriverMobile', 'marketDriverLicense', 'vendor', 'freightAmount', 'advanceToVendor',
          'balanceToVendor', 'selectedManifest', 'selectedLRs', 'origin', 'destination',
          'expectedDepartureDate', 'expectedDepartureTime', 'expectedArrivalDate', 'expectedArrivalTime',
          'expenses', 'fuelEntries', 'advanceEntries',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(tripData).forEach(key => {
          if (tripData[key] === undefined) return;
          if (tripData[key] === null && !['id', 'tripNumber'].includes(key)) return;
          
          if (!allowedDirectColumns.includes(key)) {
            dataColumn[key] = tripData[key];
            return;
          }
          filtered[key] = tripData[key];
        });
        
        if (Object.keys(dataColumn).length > 0) {
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const updatedTrip = {
        ...trip,
        fuelEntries: updatedFuelEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Filter trip data before saving
      const filteredTrip = filterTripData(updatedTrip);
      
      // Save to server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', filteredTrip, true, trip.id);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTripWithData = { ...updatedTrip, data: filteredTrip.data };
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTripWithData : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);

      // Branch Day Book entry + Vendor credit (simple tracking)
      try {
        const expenseNo = `TEXP${Date.now()}`;
        const amountNum = parseFloat(fuelEntry.fuelAmount) || 0;
        const branchName =
          JSON.parse(localStorage.getItem('branches') || '[]').find(b => b.id?.toString() === fuelEntry.paidFromBranch?.toString())?.branchName ||
          'N/A';
        const vendor = fuelVendors.find(v => v.id?.toString() === fuelEntry.fuelVendor?.toString());
        const dayBookExpense = {
          id: Date.now(),
          expenseNumber: expenseNo,
          expenseDate: fuelEntry.fuelDate,
          branch: fuelEntry.paidFromBranch,
          branchName,
          tripId: trip.id,
          expenseCategory: 'Operating',
          expenseType: 'Trip Fuel',
          amount: amountNum,
          gstAmount: 0,
          totalAmount: amountNum,
          paymentMode: fuelEntry.paymentMode || 'Cash',
          paidTo: vendor?.tradeName || vendor?.companyName || vendor?.vendorName || '',
          description: `Fuel (${fuelEntry.fuelType}) for Trip ${trip.tripNumber} - ${fuelEntry.fuelLiters} L`,
          receiptNumber: '',
          createdAt: new Date().toISOString(),
          status: 'Active',
          data: { source: 'TripManagement', tripNumber: trip.tripNumber, fuelVendor: fuelEntry.fuelVendor }
        };
        await syncService.save('branchExpenses', dayBookExpense);
        window.dispatchEvent(new CustomEvent('branchExpenseCreated', { detail: { expense: dayBookExpense } }));
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));

        const vendorLedger = JSON.parse(localStorage.getItem('vendorLedgerEntries') || '[]');
        vendorLedger.push({
          id: Date.now() + Math.random(),
          date: fuelEntry.fuelDate,
          vendorId: fuelEntry.fuelVendor,
          vendorName: vendor?.tradeName || vendor?.companyName || vendor?.vendorName || 'Fuel Vendor',
          tripId: trip.id,
          tripNumber: trip.tripNumber,
          branchId: fuelEntry.paidFromBranch,
          type: 'Credit',
          amount: amountNum,
          narration: `Fuel (${fuelEntry.fuelType}) ${fuelEntry.fuelLiters} L for Trip ${trip.tripNumber}`,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('vendorLedgerEntries', JSON.stringify(vendorLedger));
      } catch (e2) {
        console.warn('Fuel daybook/vendor posting failed:', e2);
      }

      alert(`✅ Fuel entry added to Trip ${selectedTrip.tripNumber}!\n\nFuel: ${fuelEntry.fuelLiters} L (${fuelEntry.fuelType.toUpperCase()})\nState: ${fuelEntry.state}\nRate: ₹${fuelEntry.fuelRate}/L\nAmount: ₹${fuelEntry.fuelAmount}\n\nSaved to server!`);
      
      // Reset form
      setFuelEntry({
        fuelLiters: '',
        fuelVendor: '',
        fuelDate: new Date().toISOString().split('T')[0],
        description: '',
        paidFromBranch: fuelEntry.paidFromBranch || '',
        paymentMode: 'Cash',
        state: '',
        fuelType: 'diesel',
        fuelRate: '',
        fuelAmount: ''
      });
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error adding fuel entry:', error);
      alert(`❌ Error adding fuel entry: ${error.message || 'Unknown error'}`);
    }
  };

  const handleAddAdvance = async (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('⚠️ Please select a trip!');
      return;
    }

    if (!advanceEntry.amount || parseFloat(advanceEntry.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    if (!advanceEntry.paidFromBranch) {
      alert('⚠️ Please select Paid From Branch!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const newAdvanceEntry = {
        id: Date.now(),
        amount: parseFloat(advanceEntry.amount),
        paymentMode: advanceEntry.paymentMode,
        advanceDate: advanceEntry.advanceDate,
        description: advanceEntry.description,
        addedAt: new Date().toISOString()
      };

      const updatedAdvanceEntries = [...(trip.advanceEntries || []), newAdvanceEntry];
      
      // Filter trip data before saving
      const filterTripData = (tripData) => {
        const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        const fieldsToStoreInData = [
          'isReturnTrip', 'parentTripNumber', 'parentTripId', 'originBranch',
          'ownedVehicle', 'ownedDriver', 'secondDriver', 'marketVehicleNumber', 'marketDriverName',
          'marketDriverMobile', 'marketDriverLicense', 'vendor', 'freightAmount', 'advanceToVendor',
          'balanceToVendor', 'selectedManifest', 'selectedLRs', 'origin', 'destination',
          'expectedDepartureDate', 'expectedDepartureTime', 'expectedArrivalDate', 'expectedArrivalTime',
          'expenses', 'fuelEntries', 'advanceEntries',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        Object.keys(tripData).forEach(key => {
          if (tripData[key] === undefined) return;
          if (tripData[key] === null && !['id', 'tripNumber'].includes(key)) return;
          
          if (!allowedDirectColumns.includes(key)) {
            dataColumn[key] = tripData[key];
            return;
          }
          filtered[key] = tripData[key];
        });
        
        if (Object.keys(dataColumn).length > 0) {
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      const updatedTrip = {
        ...trip,
        advanceEntries: updatedAdvanceEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Filter trip data before saving
      const filteredTrip = filterTripData(updatedTrip);
      
      // Save to server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', filteredTrip, true, trip.id);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTripWithData = { ...updatedTrip, data: filteredTrip.data };
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTripWithData : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);

      // Branch Day Book entry + Driver/Vendor credit (simple tracking)
      try {
        const expenseNo = `TEXP${Date.now()}`;
        const amountNum = parseFloat(advanceEntry.amount) || 0;
        const branchesLocal = JSON.parse(localStorage.getItem('branches') || '[]');
        const branchName = branchesLocal.find(b => b.id?.toString() === advanceEntry.paidFromBranch?.toString())?.branchName || 'N/A';

        // Decide who advance is paid to
        const paidToName =
          trip.vehicleType === 'Market'
            ? (trip.vendor ? `Vendor #${trip.vendor}` : 'Vendor')
            : (trip.ownedDriver ? (drivers.find(d => d.id?.toString() === trip.ownedDriver?.toString())?.driverName || 'Driver') : 'Driver');

        const dayBookExpense = {
          id: Date.now(),
          expenseNumber: expenseNo,
          expenseDate: advanceEntry.advanceDate,
          branch: advanceEntry.paidFromBranch,
          branchName,
          tripId: trip.id,
          expenseCategory: 'Operating',
          expenseType: 'Trip Advance',
          amount: amountNum,
          gstAmount: 0,
          totalAmount: amountNum,
          paymentMode: advanceEntry.paymentMode || 'Cash',
          paidTo: paidToName,
          description: `Advance for Trip ${trip.tripNumber}${advanceEntry.description ? ` - ${advanceEntry.description}` : ''}`,
          receiptNumber: '',
          createdAt: new Date().toISOString(),
          status: 'Active',
          data: { source: 'TripManagement', tripNumber: trip.tripNumber }
        };
        await syncService.save('branchExpenses', dayBookExpense);
        window.dispatchEvent(new CustomEvent('branchExpenseCreated', { detail: { expense: dayBookExpense } }));
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));

        if (trip.vehicleType !== 'Market' && trip.ownedDriver) {
          const driver = drivers.find(d => d.id?.toString() === trip.ownedDriver?.toString());
          const driverLedger = JSON.parse(localStorage.getItem('driverLedgerEntries') || '[]');
          driverLedger.push({
            id: Date.now() + Math.random(),
            date: advanceEntry.advanceDate,
            driverId: trip.ownedDriver,
            driverName: driver?.driverName || 'Driver',
            tripId: trip.id,
            tripNumber: trip.tripNumber,
            branchId: advanceEntry.paidFromBranch,
            type: 'Credit',
            amount: amountNum,
            narration: `Advance for Trip ${trip.tripNumber}`,
            paymentMode: advanceEntry.paymentMode || 'Cash',
            createdAt: new Date().toISOString()
          });
          localStorage.setItem('driverLedgerEntries', JSON.stringify(driverLedger));
        }
      } catch (e2) {
        console.warn('Advance daybook/driver posting failed:', e2);
      }

      alert(`✅ Advance entry added to Trip ${selectedTrip.tripNumber}!\n\nAmount: ₹${advanceEntry.amount}\nMode: ${advanceEntry.paymentMode}\n\nSaved to server!`);
      
      // Reset form
      setAdvanceEntry({
        amount: '',
        paymentMode: 'Cash',
        paidFromBranch: advanceEntry.paidFromBranch || '',
        advanceDate: new Date().toISOString().split('T')[0],
        description: ''
      });
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error adding advance entry:', error);
      alert(`❌ Error adding advance entry: ${error.message || 'Unknown error'}`);
    }
  };

  // Calculate totals (advance/fuel is added via entries only)
  const initialAdvanceFuel = 0;
  const initialAdvanceAmount = 0;
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
          {trips && trips.length > 0 ? trips.filter(t => t.status !== 'Closed').map(trip => (
            <option key={trip.id} value={trip.id}>
              {trip.tripNumber} - {getCityName(trip.origin)} → {getCityName(trip.destination)} ({trip.vehicleType === 'Owned' ? `Owned - ${trip.ownedDriver ? getDriverDetails(trip.ownedDriver) : 'No Driver'}` : trip.marketVehicleNumber || 'Market'})
            </option>
          )) : (
            <option value="" disabled>No trips available. Please create a trip first.</option>
          )}
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
                        {(vendor.vendorName || vendor.tradeName || vendor.companyName || 'Fuel Vendor')}
                        {(vendor.vendorCode || vendor.code) ? ` (${vendor.vendorCode || vendor.code})` : ''}
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
                              {(() => {
                                const v = fuelVendors.find(v => v.id.toString() === entry.fuelVendor.toString());
                                return v?.vendorName || v?.tradeName || v?.companyName || v?.vendorCode || v?.code || 'N/A';
                              })()}
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
function ViewEditFinalizeExpenses({ trips, setTrips, fuelVendors: propFuelVendors, drivers = [], expenseTypes = [] }) {
  const [fuelVendors, setFuelVendors] = useState(propFuelVendors || []);
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [otherExpenses, setOtherExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [fuelRates, setFuelRates] = useState({});
  const [cities, setCities] = useState([]);

  const parseMaybeJson = (v) => {
    if (v === null || v === undefined) return null;
    if (typeof v === 'object') return v;
    if (typeof v !== 'string') return null;
    const s = v.trim();
    if (!s) return null;
    try { return JSON.parse(s); } catch { return null; }
  };

  const escapeHtml = (v) => String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const getFuelVendorLabel = (vendorId) => {
    if (!vendorId) return 'N/A';
    const v = (fuelVendors || []).find(x => String(x.id) === String(vendorId));
    if (!v) return String(vendorId);
    const name = v.vendorName || v.tradeName || v.companyName || 'Fuel Vendor';
    const code = v.vendorCode || v.code;
    return code ? `${name} (${code})` : name;
  };

  const normalizeExpenseType = (t) => String(t || '').trim().toLowerCase();
  const isFuelLike = (t) => {
    const n = normalizeExpenseType(t);
    return n === 'fuel' || n.includes('fuel') || n.includes('diesel') || n.includes('cng');
  };
  const isDriverPayLike = (t) => {
    const n = normalizeExpenseType(t);
    return n === 'salary' || n.includes('salary') || n.includes('wages') || n === 'bhatta' || n.includes('bhatta') || n.includes('allowance');
  };

  const getOtherExpenseTypeOptions = () => {
    // Strict: only types present in Expense Master (exclude fuel + salary/bhatta here)
    const fromMaster = (expenseTypes || [])
      .map(et => et?.expenseType)
      .filter(Boolean)
      .map(t => String(t).trim())
      .filter(Boolean);

    const seen = new Set();
    const out = [];
    fromMaster.forEach(t => {
      const norm = normalizeExpenseType(t);
      if (!norm) return;
      if (isFuelLike(t) || isDriverPayLike(t)) return;
      if (seen.has(norm)) return;
      seen.add(norm);
      out.push(t);
    });
    return out;
  };

  // Load cities from API
  useEffect(() => {
    const loadCities = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const citiesResult = await syncService.load('cities');
        const allCities = Array.isArray(citiesResult) ? citiesResult : (citiesResult?.data || []);
        setCities(allCities);
      } catch (error) {
        console.error('Error loading cities:', error);
        // Fallback to localStorage
        setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
      }
    };
    loadCities();
  }, []);

  // Load fuel vendors if not provided as prop
  useEffect(() => {
    const loadFuelVendors = async () => {
      if (propFuelVendors && propFuelVendors.length > 0) {
        setFuelVendors(propFuelVendors);
        return;
      }
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const otherVendorsResult = await syncService.load('otherVendors');
        const allOtherVendors = Array.isArray(otherVendorsResult) ? otherVendorsResult : (otherVendorsResult?.data || []);
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
      } catch (error) {
        console.error('Error loading fuel vendors:', error);
        // Fallback to localStorage
        const allOtherVendors = JSON.parse(localStorage.getItem('otherVendors') || '[]');
        const fuelSuppliers = allOtherVendors.filter(v => 
          v.vendorCategory === 'Fuel Supplier' && v.status === 'Active'
        );
        setFuelVendors(fuelSuppliers);
      }
    };
    loadFuelVendors();
  }, [propFuelVendors]);

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

  // Helper function to get driver details
  const getDriverDetails = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id?.toString() === driverId.toString());
    if (!driver) return 'N/A';
    const nameDisplay = driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName;
    return `${nameDisplay} (${driver.licenseNumber || driver.mobile || 'No License'})`;
  };
  const [finalizeData, setFinalizeData] = useState({
    totalKM: '',
    desiredAverage: '',
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
    expenseType: '',
    amount: '',
    description: '',
    expenseDate: new Date().toISOString().split('T')[0],
    paidTo: '',
    receiptNumber: ''
  });

  // Default the "Other Expense" type to the first master option
  useEffect(() => {
    const opts = getOtherExpenseTypeOptions();
    if (!opts.length) return;
    const current = editForm.expenseType;
    const isValid = opts.some(t => normalizeExpenseType(t) === normalizeExpenseType(current));
    if (!current || !isValid) {
      setEditForm(prev => ({ ...prev, expenseType: opts[0] }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseTypes]);
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
      // Parse data column if present
      let parsedTrip = trip;
      if (trip && trip.data && typeof trip.data === 'string') {
        try {
          const parsedData = JSON.parse(trip.data);
          parsedTrip = { ...trip, ...parsedData };
        } catch (e) {
          // If parsing fails, use trip as is
          parsedTrip = trip;
        }
      }
      setSelectedTrip(parsedTrip);
      // Backward compatible: prefer server-saved trip.expenses, fallback to legacy trip.otherExpenses
      setOtherExpenses(parsedTrip?.expenses || parsedTrip?.otherExpenses || []);
      
      // Get trip dates for bhatta initialization
      const tripStartDate = trip?.tripStartDate || trip?.tripDate || '';
      const tripEndDate = trip?.tripEndDate || trip?.tripDate || '';
      
      if (trip?.finalizedData) {
        setFinalizeData({
          totalKM: trip.finalizedData.totalKM || '',
          desiredAverage: trip.finalizedData.desiredAverage || '',
          dieselRate: trip.finalizedData.mpDieselRate || trip.finalizedData.dieselRate || '',
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

  const handleSaveEdit = async () => {
    if (!editForm.amount || parseFloat(editForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedExpenses = (trip.expenses || []).map(exp => 
        exp.id === editingExpense 
          ? {
              ...exp,
              ...editForm,
              amount: parseFloat(editForm.amount),
              updatedAt: new Date().toISOString()
            }
          : exp
      );

      const updatedTrip = {
        ...trip,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', updatedTrip, true, trip.id);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setOtherExpenses(updatedExpenses);
      setEditingExpense(null);
      alert('✅ Expense updated successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error updating expense:', error);
      alert(`❌ Error updating expense: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedExpenses = (trip.expenses || []).filter(exp => exp.id !== expenseId);
      const updatedTrip = {
        ...trip,
        expenses: updatedExpenses,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server (MUST be PUT, not POST)
      {
        const saveResult = await syncService.save('trips', updatedTrip, true, trip.id);
        if (saveResult && saveResult.success === false) {
          throw new Error(saveResult.error || 'Trip update failed');
        }
      }
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setOtherExpenses(updatedExpenses);
      alert('✅ Expense deleted successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert(`❌ Error deleting expense: ${error.message || 'Unknown error'}`);
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

  const handleSaveFuelEdit = async () => {
    if (!fuelEditForm.fuelLiters || parseFloat(fuelEditForm.fuelLiters) <= 0) {
      alert('⚠️ Please enter valid fuel liters!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedFuelEntries = (trip.fuelEntries || []).map(entry =>
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

      const updatedTrip = {
        ...trip,
        fuelEntries: updatedFuelEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server
      await syncService.save('trips', updatedTrip);
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setSelectedTrip(updatedTrip);
      setEditingFuelEntry(null);
      alert('✅ Fuel entry updated successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error updating fuel entry:', error);
      alert(`❌ Error updating fuel entry: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteFuelEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this fuel entry?')) return;

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedFuelEntries = (trip.fuelEntries || []).filter(entry => entry.id !== entryId);
      const updatedTrip = {
        ...trip,
        fuelEntries: updatedFuelEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server
      await syncService.save('trips', updatedTrip);
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setSelectedTrip(updatedTrip);
      alert('✅ Fuel entry deleted successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error deleting fuel entry:', error);
      alert(`❌ Error deleting fuel entry: ${error.message || 'Unknown error'}`);
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

  const handleSaveAdvanceEdit = async () => {
    if (!advanceEditForm.amount || parseFloat(advanceEditForm.amount) <= 0) {
      alert('⚠️ Please enter a valid amount!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedAdvanceEntries = (trip.advanceEntries || []).map(entry =>
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

      const updatedTrip = {
        ...trip,
        advanceEntries: updatedAdvanceEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server
      await syncService.save('trips', updatedTrip);
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setSelectedTrip(updatedTrip);
      setEditingAdvanceEntry(null);
      alert('✅ Advance entry updated successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error updating advance entry:', error);
      alert(`❌ Error updating advance entry: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDeleteAdvanceEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this advance entry?')) return;

    try {
      const syncService = (await import('./utils/sync-service')).default;
      const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
      
      if (!trip) {
        alert('⚠️ Trip not found!');
        return;
      }

      const updatedAdvanceEntries = (trip.advanceEntries || []).filter(entry => entry.id !== entryId);
      const updatedTrip = {
        ...trip,
        advanceEntries: updatedAdvanceEntries,
        updatedAt: new Date().toISOString()
      };
      
      // Save to server
      await syncService.save('trips', updatedTrip);
      
      // Update local state
      const updatedTrips = trips.map(t => t.id === trip.id ? updatedTrip : t);
      localStorage.setItem('trips', JSON.stringify(updatedTrips));
      setTrips(updatedTrips);
      setSelectedTrip(updatedTrip);
      alert('✅ Advance entry deleted successfully!\n\nSaved to server!');
      
      // Trigger refresh event
      window.dispatchEvent(new CustomEvent('tripUpdated'));
    } catch (error) {
      console.error('Error deleting advance entry:', error);
      alert(`❌ Error deleting advance entry: ${error.message || 'Unknown error'}`);
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

    const saveTripUpdate = async (updatedTrip) => {
      const syncService = (await import('./utils/sync-service')).default;
      // Store most fields in data JSON for schema safety
      const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
      const filtered = {};
      const dataColumn = {};
      Object.keys(updatedTrip || {}).forEach(k => {
        if (updatedTrip[k] === undefined) return;
        if (!allowedDirectColumns.includes(k)) {
          dataColumn[k] = updatedTrip[k];
          return;
        }
        filtered[k] = updatedTrip[k];
      });
      if (Object.keys(dataColumn).length > 0) {
        let existing = {};
        if (filtered.data && typeof filtered.data === 'string') {
          try { existing = JSON.parse(filtered.data); } catch (_) { existing = {}; }
        } else if (filtered.data && typeof filtered.data === 'object') {
          existing = filtered.data;
        }
        filtered.data = JSON.stringify({ ...existing, ...dataColumn });
      }

      const res = await syncService.save('trips', filtered, true, updatedTrip.id);
      if (res && res.success === false) throw new Error(res.error || 'Trip update failed');
      return { filtered };
    };

    (async () => {
      try {
        const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
        if (!trip) {
          alert('⚠️ Trip not found!');
          return;
        }

        const current = selectedTrip || trip;
        const currentExpenses = Array.isArray(current.expenses) ? current.expenses : (Array.isArray(otherExpenses) ? otherExpenses : []);
        const newExpense = {
          id: Date.now(),
          ...editForm,
          amount: parseFloat(editForm.amount),
          addedAt: new Date().toISOString()
        };
        const updatedExpenses = [...currentExpenses, newExpense];

        const updatedTrip = {
          ...current,
          expenses: updatedExpenses,
          updatedAt: new Date().toISOString()
        };

        const { filtered } = await saveTripUpdate(updatedTrip);

        // Update local UI state (keep data in sync)
        const updatedTripWithData = { ...updatedTrip, data: filtered.data };
        const updatedTrips = trips.map(t => t.id === trip.id ? updatedTripWithData : t);
        setTrips(updatedTrips);
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        setOtherExpenses(updatedExpenses);

        alert(`✅ Expense added to Trip ${current.tripNumber}!\n\nSaved to server!`);

        const nextType = (getOtherExpenseTypeOptions()[0] || '');
        setEditForm({
          expenseType: nextType,
          amount: '',
          description: '',
          expenseDate: new Date().toISOString().split('T')[0],
          paidTo: '',
          receiptNumber: ''
        });
      } catch (err) {
        console.error('Error adding other expense:', err);
        alert(`❌ Error adding expense: ${err.message || 'Unknown error'}`);
      }
    })();
  };

  const handleFinalize = () => {
    if (!finalizeData.totalKM || !finalizeData.desiredAverage) {
      alert('⚠️ Please enter Total KM and Desired Average to finalize!');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this trip? This will mark the trip as completed and expenses cannot be edited.')) {
      return;
    }

    (async () => {
      try {
        const trip = trips.find(t => t.id.toString() === selectedTripId.toString());
        if (!trip) {
          alert('⚠️ Trip not found!');
          return;
        }

        const totalKM = parseFloat(finalizeData.totalKM) || 0;
        const desiredAvg = parseFloat(finalizeData.desiredAverage) || 0;
        const mpDieselRate = parseFloat(fuelRates?.MP?.diesel) || parseFloat(finalizeData.dieselRate) || 94.14;

        // Fuel issued = total fuel entries (initial fuel removed from create-trip)
        const initialFuelIssued = selectedTrip?.fuelIssued ? (parseFloat(selectedTrip.fuelIssued) || 0) : 0;
        const totalFuelIssued = initialFuelIssued + (selectedTrip?.fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelLiters) || 0), 0);
        const totalFuelAmount = (selectedTrip?.fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelAmount) || 0), 0);
        const expectedFuel = (desiredAvg > 0 && totalKM > 0) ? (totalKM / desiredAvg) : 0;
        const extraFuelLiters = totalFuelIssued - expectedFuel; // can be negative (short)
        const extraFuelAmount = extraFuelLiters * mpDieselRate;
        const actualAverage = (totalFuelIssued > 0 && totalKM > 0) ? (totalKM / totalFuelIssued) : 0;

        // Advance total
        const initialAdvancePaid = selectedTrip?.advanceToDriver ? (parseFloat(selectedTrip.advanceToDriver) || 0) : 0;
        const totalAdvancePaid = initialAdvancePaid + (selectedTrip?.advanceEntries || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);

        // Other expenses + matrix
        const listExpensesTotal = (otherExpenses || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);
        const matrixTotal =
          (parseFloat(finalizeData.otherExpensesMatrix?.bhatta?.amount) || 0) +
          (parseFloat(finalizeData.otherExpensesMatrix?.salary?.amount) || 0) +
          (parseFloat(finalizeData.otherExpensesMatrix?.secondDriver?.amount) || 0);
        const totalOtherExpenses = listExpensesTotal + matrixTotal;
        // Trip cost (avoid double-counting advances): Fuel Amount + (Other list + Matrix)
        const totalTripCost = totalFuelAmount + totalOtherExpenses;

        // Driver balance (Credit if positive, Debit if negative)
        const driverBalance = totalAdvancePaid - totalOtherExpenses - extraFuelAmount;
        const balanceType = driverBalance >= 0 ? 'Credit' : 'Debit';

        const finalizedData = {
          tripNumber: selectedTrip?.tripNumber,
          totalKM: totalKM,
          desiredAverage: desiredAvg,
          mpDieselRate: mpDieselRate,
          totalFuelIssued: totalFuelIssued,
          totalFuelAmount: totalFuelAmount,
          expectedFuel: expectedFuel,
          extraFuelLiters: extraFuelLiters,
          extraFuelAmount: extraFuelAmount,
          actualAverage: actualAverage,
          totalAdvance: totalAdvancePaid,
          totalOtherExpenses: totalOtherExpenses,
          totalTripCost: totalTripCost,
          otherExpensesListTotal: listExpensesTotal,
          matrixExpensesTotal: matrixTotal,
          otherExpensesMatrix: finalizeData.otherExpensesMatrix,
          driverBalance: driverBalance,
          driverBalanceType: balanceType,
          finalizedAt: new Date().toISOString(),
        };

        // Save finalized status to server
        const updatedTrip = {
          ...selectedTrip,
          status: 'Closed',
          finalized: true,
          finalizedData,
          updatedAt: new Date().toISOString(),
        };

        // Reuse same safe updater as handleAddOtherExpense
        const syncService = (await import('./utils/sync-service')).default;
        const allowedDirectColumns = ['id', 'tripNumber', 'tripDate', 'tripType', 'vehicleType', 'status', 'createdAt', 'updatedAt', 'data'];
        const filtered = {};
        const dataColumn = {};
        Object.keys(updatedTrip || {}).forEach(k => {
          if (updatedTrip[k] === undefined) return;
          if (!allowedDirectColumns.includes(k)) {
            dataColumn[k] = updatedTrip[k];
            return;
          }
          filtered[k] = updatedTrip[k];
        });
        if (Object.keys(dataColumn).length > 0) {
          let existing = {};
          if (filtered.data && typeof filtered.data === 'string') {
            try { existing = JSON.parse(filtered.data); } catch (_) { existing = {}; }
          } else if (filtered.data && typeof filtered.data === 'object') {
            existing = filtered.data;
          }
          filtered.data = JSON.stringify({ ...existing, ...dataColumn });
        }

        const saveRes = await syncService.save('trips', filtered, true, updatedTrip.id);
        if (saveRes && saveRes.success === false) throw new Error(saveRes.error || 'Finalize save failed');

        const updatedTripWithData = { ...updatedTrip, data: filtered.data };
        const updatedTrips = trips.map(t => t.id === trip.id ? updatedTripWithData : t);
        setTrips(updatedTrips);
        localStorage.setItem('trips', JSON.stringify(updatedTrips));
        setSelectedTrip(updatedTripWithData);

        alert('✅ Trip finalized successfully!\n\nSaved to server!');
      } catch (err) {
        console.error('Finalize failed:', err);
        alert(`❌ Finalize failed: ${err.message || 'Unknown error'}`);
      }
    })();
  };

  const handleDownloadExcel = () => {
    if (!selectedTrip) {
      alert('⚠️ Please select a trip');
      return;
    }

    // Normalize possible stringified arrays from DB
    const fuelEntries = Array.isArray(selectedTrip?.fuelEntries)
      ? selectedTrip.fuelEntries
      : (parseMaybeJson(selectedTrip?.fuelEntries) || []);
    const advanceEntries = Array.isArray(selectedTrip?.advanceEntries)
      ? selectedTrip.advanceEntries
      : (parseMaybeJson(selectedTrip?.advanceEntries) || []);

    const initialFuelIssued = selectedTrip?.fuelIssued ? (parseFloat(selectedTrip.fuelIssued) || 0) : 0;
    const totalFuelIssued = initialFuelIssued + (fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelLiters) || 0), 0);
    const totalFuelAmount = (fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelAmount) || 0), 0);

    const initialAdvancePaid = selectedTrip?.advanceToDriver ? (parseFloat(selectedTrip.advanceToDriver) || 0) : 0;
    const totalAdvancePaid = initialAdvancePaid + (advanceEntries || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);

    const listExpensesTotal = (otherExpenses || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);
    const matrix = (selectedTrip?.finalizedData?.otherExpensesMatrix || finalizeData?.otherExpensesMatrix || {});
    const matrixTotalPrint =
      (parseFloat(matrix?.bhatta?.amount) || 0) +
      (parseFloat(matrix?.salary?.amount) || 0) +
      (parseFloat(matrix?.secondDriver?.amount) || 0);

    // Calculations (prefer finalizedData if available)
    const fd = selectedTrip?.finalizedData || {};
    const km = parseFloat(fd.totalKM ?? finalizeData.totalKM) || 0;
    const desired = parseFloat(fd.desiredAverage ?? finalizeData.desiredAverage) || 0;
    const mpRate = parseFloat(fd.mpDieselRate ?? fuelRates?.MP?.diesel ?? finalizeData.dieselRate) || 94.14;
    const expectedFuel = Number.isFinite(parseFloat(fd.expectedFuel)) ? parseFloat(fd.expectedFuel) : (desired > 0 && km > 0 ? (km / desired) : 0);
    const extraFuelLiters = Number.isFinite(parseFloat(fd.extraFuelLiters)) ? parseFloat(fd.extraFuelLiters) : (totalFuelIssued - expectedFuel);
    const extraFuelAmount = Number.isFinite(parseFloat(fd.extraFuelAmount)) ? parseFloat(fd.extraFuelAmount) : (extraFuelLiters * mpRate);
    const actualAvg = Number.isFinite(parseFloat(fd.actualAverage)) ? parseFloat(fd.actualAverage) : (totalFuelIssued > 0 && km > 0 ? (km / totalFuelIssued) : 0);
    const totalOtherExpensesAll = Number.isFinite(parseFloat(fd.totalOtherExpenses)) ? parseFloat(fd.totalOtherExpenses) : (listExpensesTotal + matrixTotalPrint);
    const totalTripCost = Number.isFinite(parseFloat(fd.totalTripCost))
      ? parseFloat(fd.totalTripCost)
      : (totalFuelAmount + totalOtherExpensesAll);
    const driverBalance = Number.isFinite(parseFloat(fd.driverBalance)) ? parseFloat(fd.driverBalance) : (totalAdvancePaid - totalOtherExpensesAll - extraFuelAmount);
    const driverBalanceType = fd.driverBalanceType || (driverBalance >= 0 ? 'Credit' : 'Debit');

    const excelData = [
      ['TRIP EXPENSES REPORT'],
      ['Trip Number:', selectedTrip.tripNumber],
      ['Route:', `${getCityName(selectedTrip.origin)} → ${getCityName(selectedTrip.destination)}`],
      ['Trip Date:', formatDateDDMMYYYY(selectedTrip.tripDate) || 'N/A'],
      ['Vehicle Type:', selectedTrip.vehicleType || 'N/A'],
      ['Status:', selectedTrip.status || 'N/A'],
      ['Driver:', selectedTrip.vehicleType === 'Owned' && selectedTrip.ownedDriver 
        ? getDriverDetails(selectedTrip.ownedDriver) 
        : selectedTrip.vehicleType === 'Market' && selectedTrip.marketDriverName
        ? `${selectedTrip.marketDriverName} (${selectedTrip.marketDriverMobile || 'N/A'})`
        : 'N/A'],
      ['Second Driver:', selectedTrip.vehicleType === 'Owned' && selectedTrip.secondDriver 
        ? getDriverDetails(selectedTrip.secondDriver) 
        : 'N/A'],
      ['Generated Date:', new Date().toLocaleString()],
      [],
      ['CALCULATIONS'],
      ['Total KM', km],
      ['Desired Average (KM/L)', desired],
      ['Actual Average (KM/L)', actualAvg],
      ['Total Fuel Issued (L)', totalFuelIssued],
      ['Expected Consumption (L)', expectedFuel],
      ['Fuel Difference (L)', extraFuelLiters],
      ['MP Diesel Rate (₹/L)', mpRate],
      ['Extra Fuel Amount (₹)', extraFuelAmount],
      ['Total Advance (₹)', totalAdvancePaid],
      ['Total Fuel Amount (₹)', totalFuelAmount],
      ['Total Other Expenses (₹)', totalOtherExpensesAll],
      ['Total Trip Cost (₹)', totalTripCost],
      ['Driver Balance Type', driverBalanceType],
      ['Driver Balance (₹)', driverBalance],
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
    excelData.push(['ADVANCE / PAYMENTS']);
    excelData.push(['Date', 'Amount (₹)', 'Mode', 'Narration']);
    (advanceEntries || []).forEach(a => {
      excelData.push([
        formatDateDDMMYYYY(a.advanceDate) || 'N/A',
        a.amount || 0,
        a.paymentMode || '',
        a.description || ''
      ]);
    });

    excelData.push([]);
    excelData.push(['FUEL ENTRIES']);
    excelData.push(['Date', 'State', 'Type', 'Liters', 'Rate', 'Amount', 'Vendor', 'Narration']);
    (fuelEntries || []).forEach(f => {
      excelData.push([
        formatDateDDMMYYYY(f.fuelDate) || 'N/A',
        f.state || '',
        f.fuelType || '',
        f.fuelLiters || 0,
        f.fuelRate || 0,
        f.fuelAmount || 0,
        getFuelVendorLabel(f.fuelVendor),
        f.description || ''
      ]);
    });

    excelData.push([]);
    excelData.push(['MATRIX EXPENSES']);
    excelData.push(['Head', 'From', 'To', 'Amount (₹)']);
    ['bhatta','salary','secondDriver'].forEach(k => {
      excelData.push([
        k === 'secondDriver' ? 'Second Driver' : (k.charAt(0).toUpperCase() + k.slice(1)),
        matrix?.[k]?.fromDate || '',
        matrix?.[k]?.toDate || '',
        matrix?.[k]?.amount || 0,
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

  const handlePrintTripExpenseDetails = () => {
    if (!selectedTrip) {
      alert('⚠️ Please select a trip first');
      return;
    }

    // Normalize possible stringified arrays from DB
    const fuelEntries = Array.isArray(selectedTrip?.fuelEntries)
      ? selectedTrip.fuelEntries
      : (parseMaybeJson(selectedTrip?.fuelEntries) || []);
    const advanceEntries = Array.isArray(selectedTrip?.advanceEntries)
      ? selectedTrip.advanceEntries
      : (parseMaybeJson(selectedTrip?.advanceEntries) || []);
    const otherExp = Array.isArray(otherExpenses)
      ? otherExpenses
      : (parseMaybeJson(otherExpenses) || []);

    const isFinalizedLocal = selectedTrip?.finalized || selectedTrip?.status === 'Closed';
    const matrix = (isFinalizedLocal ? selectedTrip?.finalizedData?.otherExpensesMatrix : finalizeData?.otherExpensesMatrix) || {};

    const initialFuelIssued = selectedTrip?.fuelIssued ? (parseFloat(selectedTrip.fuelIssued) || 0) : 0;
    const initialAdvancePaid = selectedTrip?.advanceToDriver ? (parseFloat(selectedTrip.advanceToDriver) || 0) : 0;

    const totalFuelLitersEntries = (fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelLiters) || 0), 0);
    const totalFuelLiters = initialFuelIssued + totalFuelLitersEntries;
    const totalFuelAmount = (fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelAmount) || 0), 0);

    const totalAdvanceAmountEntries = (advanceEntries || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);
    const totalAdvanceAmount = initialAdvancePaid + totalAdvanceAmountEntries;
    const totalOtherAmount = (otherExp || []).reduce((s, e) => s + (parseFloat(e?.amount) || 0), 0);
    const matrixTotalPrint =
      (parseFloat(matrix?.bhatta?.amount) || 0) +
      (parseFloat(matrix?.salary?.amount) || 0) +
      (parseFloat(matrix?.secondDriver?.amount) || 0);

    const tripRemarks = selectedTrip?.remarks || selectedTrip?.finalizedData?.remarks || '';

    // Calculations (prefer finalizedData if available)
    const fd = selectedTrip?.finalizedData || {};
    const km = parseFloat(fd.totalKM ?? finalizeData.totalKM) || 0;
    const desired = parseFloat(fd.desiredAverage ?? finalizeData.desiredAverage) || 0;
    const mpRate = parseFloat(fd.mpDieselRate ?? fuelRates?.MP?.diesel ?? finalizeData.dieselRate) || 94.14;
    const expectedFuel = Number.isFinite(parseFloat(fd.expectedFuel)) ? parseFloat(fd.expectedFuel) : (desired > 0 && km > 0 ? (km / desired) : 0);
    const extraFuelLiters = Number.isFinite(parseFloat(fd.extraFuelLiters)) ? parseFloat(fd.extraFuelLiters) : (totalFuelLiters - expectedFuel);
    const extraFuelAmount = Number.isFinite(parseFloat(fd.extraFuelAmount)) ? parseFloat(fd.extraFuelAmount) : (extraFuelLiters * mpRate);
    const actualAvg = Number.isFinite(parseFloat(fd.actualAverage)) ? parseFloat(fd.actualAverage) : (totalFuelLiters > 0 && km > 0 ? (km / totalFuelLiters) : 0);
    const totalOtherExpensesAll = Number.isFinite(parseFloat(fd.totalOtherExpenses)) ? parseFloat(fd.totalOtherExpenses) : (totalOtherAmount + matrixTotalPrint);
    const totalTripCost = Number.isFinite(parseFloat(fd.totalTripCost))
      ? parseFloat(fd.totalTripCost)
      : (totalFuelAmount + totalOtherExpensesAll);
    const driverBalance = Number.isFinite(parseFloat(fd.driverBalance)) ? parseFloat(fd.driverBalance) : (totalAdvanceAmount - totalOtherExpensesAll - extraFuelAmount);
    const driverBalanceType = fd.driverBalanceType || (driverBalance >= 0 ? 'Credit' : 'Debit');

    // about:blank has no base URL; use absolute URLs for assets
    const logoUrl = `${window.location.origin}/brand-logo.png`;
    const fallbackLogoUrl = `${window.location.origin}/logo192.png`;

    const headerRows = [
      ['Trip Number', selectedTrip.tripNumber],
      ['Trip Date', formatDateDDMMYYYY(selectedTrip.tripDate)],
      ['From', getCityName(selectedTrip.origin)],
      ['To', getCityName(selectedTrip.destination)],
      ['Vehicle Type', selectedTrip.vehicleType || 'N/A'],
      ['Vehicle', selectedTrip.vehicleType === 'Owned' ? (selectedTrip.vehicleNumber || selectedTrip.ownedVehicle || 'N/A') : (selectedTrip.marketVehicleNumber || 'N/A')],
      ['Driver', selectedTrip.vehicleType === 'Owned' && selectedTrip.ownedDriver ? getDriverDetails(selectedTrip.ownedDriver)
        : selectedTrip.vehicleType === 'Market' && selectedTrip.marketDriverName ? `${selectedTrip.marketDriverName} (${selectedTrip.marketDriverMobile || 'N/A'})` : 'N/A'],
      ['Second Driver', selectedTrip.vehicleType === 'Owned' && selectedTrip.secondDriver ? getDriverDetails(selectedTrip.secondDriver) : 'N/A'],
      ['Status', selectedTrip.status || 'N/A'],
      ['Printed At', new Date().toLocaleString()],
    ];

    const tripDetailsRows = headerRows.filter(([k]) => !['Trip Number', 'Printed At'].includes(k));

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Trip Expense Details - ${escapeHtml(selectedTrip.tripNumber || '')}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #111827; padding: 18px; }
    .header { display: flex; align-items: center; gap: 12px; margin: 0 0 10px; }
    .logo { height: 44px; width: auto; object-fit: contain; }
    h1 { font-size: 18px; margin: 0; }
    h2 { font-size: 14px; margin: 18px 0 8px; }
    .muted { color: #6b7280; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-top: 6px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; vertical-align: top; }
    th { background: #f3f4f6; text-align: left; }
    .right { text-align: right; }
    .summary { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
    .badge-green { background: #d1fae5; color: #065f46; border: 1px solid #10b981; }
    .badge-amber { background: #fef3c7; color: #92400e; border: 1px solid #f59e0b; }
    @media print { .no-print { display: none; } body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <img class="logo" src="${escapeHtml(logoUrl)}" alt="Company Logo" onerror="this.onerror=null;this.src='${escapeHtml(fallbackLogoUrl)}';" />
    <h1>Trip Management - Finalize & Expense Print</h1>
  </div>
  <div class="muted">Print format matches the Trip Finalize flow (Fuel → Advance → Other → Matrix → Final Summary).</div>

  <h2>1) Trip Number</h2>
  <table>
    <tbody>
      <tr>
        <th style="width:180px">Trip Number</th>
        <td>
          <strong>${escapeHtml(selectedTrip.tripNumber || '')}</strong>
          ${isFinalizedLocal ? ` <span class="badge badge-green">FINALIZED</span>` : ` <span class="badge badge-amber">NOT FINALIZED</span>`}
        </td>
      </tr>
      <tr><th>Status</th><td>${escapeHtml(selectedTrip.status || 'N/A')}</td></tr>
      <tr><th>Printed At</th><td>${escapeHtml(new Date().toLocaleString())}</td></tr>
    </tbody>
  </table>

  <h2>2) Trip Details</h2>
  <table>
    <tbody>
      ${tripDetailsRows.map(([k, v]) => `<tr><th style="width:180px">${escapeHtml(k)}</th><td>${escapeHtml(v || 'N/A')}</td></tr>`).join('')}
      ${tripRemarks ? `<tr><th>Remarks</th><td>${escapeHtml(tripRemarks)}</td></tr>` : ''}
    </tbody>
  </table>

  <h2>3) Fuel Issued</h2>
  <div class="summary">
    <div class="card"><strong>Initial Fuel Issued</strong><div>${escapeHtml(initialFuelIssued.toFixed(2))} Liters</div></div>
    <div class="card"><strong>Fuel Entries</strong><div>${escapeHtml(totalFuelLitersEntries.toFixed(2))} Liters (${escapeHtml(String((fuelEntries || []).length))} entries)</div></div>
    <div class="card"><strong>Total Fuel Issued</strong><div>${escapeHtml(totalFuelLiters.toFixed(2))} Liters</div></div>
    <div class="card"><strong>Total Fuel Amount</strong><div>₹ ${escapeHtml(totalFuelAmount.toFixed(2))}</div></div>
  </div>

  <h2>⛽ Fuel Entries</h2>
  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th style="width:80px">State</th>
        <th style="width:70px">Type</th>
        <th style="width:80px" class="right">Liters</th>
        <th style="width:90px" class="right">Rate</th>
        <th style="width:110px" class="right">Amount</th>
        <th style="width:170px">Vendor</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
      ${(fuelEntries || []).length ? (fuelEntries || []).map(e => `
        <tr>
          <td>${escapeHtml(formatDateDDMMYYYY(e?.fuelDate))}</td>
          <td>${escapeHtml(e?.state || '')}</td>
          <td>${escapeHtml(e?.fuelType || '')}</td>
          <td class="right">${escapeHtml((parseFloat(e?.fuelLiters) || 0).toFixed(2))}</td>
          <td class="right">${escapeHtml((parseFloat(e?.fuelRate) || 0).toFixed(2))}</td>
          <td class="right">${escapeHtml((parseFloat(e?.fuelAmount) || 0).toFixed(2))}</td>
          <td>${escapeHtml(getFuelVendorLabel(e?.fuelVendor))}</td>
          <td>${escapeHtml(e?.description || e?.remarks || '')}</td>
        </tr>
      `).join('') : `<tr><td colspan="8" class="muted">No fuel entries</td></tr>`}
    </tbody>
  </table>

  <h2>4) Advance</h2>
  <div class="summary">
    <div class="card"><strong>Initial Advance</strong><div>₹ ${escapeHtml(initialAdvancePaid.toFixed(2))}</div></div>
    <div class="card"><strong>Advance Entries</strong><div>₹ ${escapeHtml(totalAdvanceAmountEntries.toFixed(2))} (${escapeHtml(String((advanceEntries || []).length))} entries)</div></div>
    <div class="card"><strong>Total Advance</strong><div>₹ ${escapeHtml(totalAdvanceAmount.toFixed(2))}</div></div>
  </div>

  <h2>💰 Advance Entries</h2>
  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th style="width:120px">Amount (₹)</th>
        <th style="width:110px">Mode</th>
        <th>Narration / Remark</th>
      </tr>
    </thead>
    <tbody>
      ${(advanceEntries || []).length ? (advanceEntries || []).map(e => `
        <tr>
          <td>${escapeHtml(formatDateDDMMYYYY(e?.advanceDate))}</td>
          <td class="right">${escapeHtml((parseFloat(e?.amount) || 0).toFixed(2))}</td>
          <td>${escapeHtml(e?.paymentMode || '')}</td>
          <td>${escapeHtml(e?.description || e?.remarks || '')}</td>
        </tr>
      `).join('') : `<tr><td colspan="4" class="muted">No advance entries</td></tr>`}
    </tbody>
  </table>

  <h2>5) Other Expenses List</h2>
  <div class="summary">
    <div class="card"><strong>Total Other Expenses</strong><div>₹ ${escapeHtml(totalOtherAmount.toFixed(2))}</div><div class="muted">${escapeHtml(String((otherExp || []).length))} entries</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:110px">Date</th>
        <th style="width:160px">Type</th>
        <th>Narration / Remark</th>
        <th style="width:120px" class="right">Amount (₹)</th>
        <th style="width:160px">Paid To</th>
        <th style="width:140px">Receipt</th>
      </tr>
    </thead>
    <tbody>
      ${(otherExp || []).length ? (otherExp || []).map(e => `
        <tr>
          <td>${escapeHtml(formatDateDDMMYYYY(e?.expenseDate || e?.addedAt?.split?.('T')?.[0]))}</td>
          <td>${escapeHtml(e?.expenseType || e?.type || 'Other')}</td>
          <td>${escapeHtml(e?.description || e?.remarks || '')}</td>
          <td class="right">${escapeHtml((parseFloat(e?.amount) || 0).toFixed(2))}</td>
          <td>${escapeHtml(e?.paidTo || '')}</td>
          <td>${escapeHtml(e?.receiptNumber || '')}</td>
        </tr>
      `).join('') : `<tr><td colspan="6" class="muted">No other expenses</td></tr>`}
    </tbody>
  </table>

  <h2>6) Other Expenses Matrix</h2>
  <div class="summary">
    <div class="card"><strong>Matrix Total (Bhatta + Salary + Second Driver)</strong><div>₹ ${escapeHtml(matrixTotalPrint.toFixed(2))}</div></div>
  </div>
  <table>
    <thead>
      <tr>
        <th style="width:160px">Head</th>
        <th style="width:120px">From</th>
        <th style="width:120px">To</th>
        <th class="right" style="width:120px">Amount (₹)</th>
      </tr>
    </thead>
    <tbody>
      ${['bhatta','salary','secondDriver'].map(k => `
        <tr>
          <td>${escapeHtml(k === 'secondDriver' ? 'Second Driver' : (k.charAt(0).toUpperCase() + k.slice(1)))}</td>
          <td>${escapeHtml(formatDateDDMMYYYY(matrix?.[k]?.fromDate || ''))}</td>
          <td>${escapeHtml(formatDateDDMMYYYY(matrix?.[k]?.toDate || ''))}</td>
          <td class="right">${escapeHtml((parseFloat(matrix?.[k]?.amount) || 0).toFixed(2))}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>Finalized Trip Summary</h2>
  <div class="summary">
    <div class="card"><strong>Total KM</strong><div>${escapeHtml(km.toFixed(2))}</div></div>
    <div class="card"><strong>Desired Average</strong><div>${escapeHtml(desired.toFixed(2))} KM/L</div></div>
    <div class="card"><strong>Actual Average</strong><div>${escapeHtml(actualAvg.toFixed(2))} KM/L</div></div>
    <div class="card"><strong>Fuel Issued</strong><div>${escapeHtml(totalFuelLiters.toFixed(2))} Liters</div></div>
    <div class="card"><strong>Expected Consumption</strong><div>${escapeHtml(expectedFuel.toFixed(2))} Liters</div></div>
    <div class="card"><strong>Fuel Difference</strong><div>${escapeHtml(extraFuelLiters.toFixed(2))} Liters</div></div>
    <div class="card"><strong>MP Diesel Rate</strong><div>₹ ${escapeHtml(mpRate.toFixed(2))}/L</div></div>
    <div class="card"><strong>Extra Fuel Amount</strong><div>₹ ${escapeHtml(extraFuelAmount.toFixed(2))}</div></div>
    <div class="card"><strong>Total Other Expenses (List + Matrix)</strong><div>₹ ${escapeHtml(totalOtherExpensesAll.toFixed(2))}</div></div>
    <div class="card"><strong>Total Trip Cost</strong><div>₹ ${escapeHtml(totalTripCost.toFixed(2))}</div><div class="muted">Fuel Amount + Other Expenses</div></div>
    <div class="card"><strong>Driver Balance</strong><div>${escapeHtml(driverBalanceType)} • ₹ ${escapeHtml(Math.abs(driverBalance).toFixed(2))}</div></div>
  </div>

  <div class="no-print muted" style="margin-top:12px">Tip: Use browser print settings to select A4 and “Background graphics” if needed.</div>
  <script>
    // More reliable than timeouts from opener: print after content load
    window.addEventListener('load', function () {
      setTimeout(function () {
        try { window.focus(); window.print(); } catch (e) {}
      }, 150);
    });
  </script>
</body>
</html>`;

    const w = window.open('about:blank', '_blank', 'width=1100,height=800');
    if (!w) {
      alert('⚠️ Pop-up blocked. Please allow pop-ups to print.');
      return;
    }
    try { w.opener = null; } catch (e) {}
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
  };

  const isFinalized = selectedTrip?.finalized || selectedTrip?.status === 'Closed';
  
  // Calculate totals
  const initialAdvanceFuel = selectedTrip?.fuelIssued ? parseFloat(selectedTrip.fuelIssued) : 0;
  const initialAdvanceAmount = selectedTrip?.advanceToDriver ? parseFloat(selectedTrip.advanceToDriver) : 0;
  const totalFuelEntries = selectedTrip?.fuelEntries?.reduce((sum, entry) => sum + (parseFloat(entry.fuelLiters) || 0), 0) || 0;
  const totalAdvanceEntries = selectedTrip?.advanceEntries?.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0) || 0;
  const totalFuel = initialAdvanceFuel + totalFuelEntries;
  const totalFuelAmountView = selectedTrip?.fuelEntries?.reduce((sum, entry) => sum + (parseFloat(entry?.fuelAmount) || 0), 0) || 0;
  const totalAdvance = initialAdvanceAmount + totalAdvanceEntries;
  const totalOtherExpenses = (otherExpenses || []).reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  
  // Finalization calculations
  const totalKM = parseFloat(finalizeData.totalKM) || 0;
  const desiredAvg = parseFloat(finalizeData.desiredAverage) || 0;
  const actualAverage = totalKM > 0 && totalFuel > 0 ? (totalKM / totalFuel).toFixed(2) : 0;
  const expectedFuelNum = desiredAvg > 0 && totalKM > 0 ? (totalKM / desiredAvg) : 0;
  const expectedFuel = expectedFuelNum.toFixed(2);
  const mpDieselRate = parseFloat(fuelRates?.MP?.diesel) || parseFloat(finalizeData.dieselRate) || 94.14;
  const extraFuelLitersNum = totalFuel - expectedFuelNum; // can be negative (short)
  const extraFuelLiters = extraFuelLitersNum.toFixed(2);
  const extraFuelAmountNum = extraFuelLitersNum * mpDieselRate; // can be negative
  const extraFuelAmount = extraFuelAmountNum.toFixed(2);
  
  // Calculate matrix expenses total
  const matrixTotal = 
    (parseFloat(finalizeData.otherExpensesMatrix?.bhatta?.amount) || 0) +
    (parseFloat(finalizeData.otherExpensesMatrix?.salary?.amount) || 0) +
    (parseFloat(finalizeData.otherExpensesMatrix?.secondDriver?.amount) || 0);
  
  // Driver balance: Credit (+) means driver has to return, Debit (-) means company has to pay
  const finalBalance = totalAdvance - (totalOtherExpenses + matrixTotal) - extraFuelAmountNum;
  const totalTripCostView = totalFuelAmountView + totalOtherExpenses + matrixTotal;

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
          {/* 1) Trip Number */}
          <div style={{
            marginBottom: '15px',
            padding: '16px 20px',
            backgroundColor: '#eff6ff',
            borderRadius: '8px',
            border: '2px solid #60a5fa'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ margin: 0, color: '#1d4ed8' }}>1) Trip Number</h4>
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
            <div style={{ marginTop: '8px', fontSize: '20px', fontWeight: 'bold' }}>
              {selectedTrip.tripNumber}
            </div>
          </div>

          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f0f9ff', 
            borderRadius: '8px',
            border: '2px solid #3b82f6'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#3b82f6' }}>2) Trip Details</h4>
            </div>
            <div className="grid-3">
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
              {selectedTrip.vehicleType === 'Owned' && selectedTrip.ownedDriver && (
                <div>
                  <strong style={{ color: '#666' }}>Driver:</strong>
                  <div style={{ fontSize: '16px' }}>{getDriverDetails(selectedTrip.ownedDriver)}</div>
                </div>
              )}
              {selectedTrip.vehicleType === 'Owned' && selectedTrip.secondDriver && (
                <div>
                  <strong style={{ color: '#666' }}>Second Driver:</strong>
                  <div style={{ fontSize: '16px' }}>{getDriverDetails(selectedTrip.secondDriver)}</div>
                </div>
              )}
              {selectedTrip.vehicleType === 'Market' && selectedTrip.marketDriverName && (
                <div>
                  <strong style={{ color: '#666' }}>Driver:</strong>
                  <div style={{ fontSize: '16px' }}>{selectedTrip.marketDriverName} ({selectedTrip.marketDriverMobile || 'N/A'})</div>
                </div>
              )}
            </div>
          </div>

          {/* 3) Fuel Issued */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#fff7ed', 
            borderRadius: '8px',
            border: '2px solid #fb923c'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#9a3412' }}>3) Fuel Issued</h4>
            <div className="grid-2">
              <div>
                <strong>Initial Fuel Issued:</strong> {initialAdvanceFuel.toFixed(2)} Liters
              </div>
              <div>
                <strong>Fuel Entries:</strong> {totalFuelEntries.toFixed(2)} Liters ({selectedTrip?.fuelEntries?.length || 0} entries)
              </div>
              <div style={{ gridColumn: '1 / -1', paddingTop: '10px', borderTop: '1px solid #fb923c', marginTop: '10px' }}>
                <strong style={{ fontSize: '18px' }}>Total Fuel Issued:</strong>{' '}
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>{totalFuel.toFixed(2)} Liters</span>
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
                              {(() => {
                                const v = fuelVendors.find(v => v.id.toString() === entry.fuelVendor?.toString());
                                return v?.vendorName || v?.tradeName || v?.companyName || v?.vendorCode || v?.code || 'N/A';
                              })()}
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

          {/* 4) Advance */}
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#ecfdf5', 
            borderRadius: '8px',
            border: '2px solid #10b981'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#065f46' }}>4) Advance</h4>
            <div className="grid-2">
              <div>
                <strong>Initial Advance:</strong> ₹{initialAdvanceAmount.toFixed(2)}
              </div>
              <div>
                <strong>Advance Entries:</strong> ₹{totalAdvanceEntries.toFixed(2)} ({selectedTrip?.advanceEntries?.length || 0} entries)
              </div>
              <div style={{ gridColumn: '1 / -1', paddingTop: '10px', borderTop: '1px solid #10b981', marginTop: '10px' }}>
                <strong style={{ fontSize: '18px' }}>Total Advance:</strong>{' '}
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>₹{totalAdvance.toFixed(2)}</span>
              </div>
            </div>
          </div>

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
              <h4 style={{ marginTop: 0, marginBottom: '15px' }}>5) Add Other Expenses (Toll, Loading, etc.)</h4>
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
                      {getOtherExpenseTypeOptions().length === 0 ? (
                        <option value="">-- Add Expense Types in Expense Master --</option>
                      ) : (
                        getOtherExpenseTypeOptions().map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))
                      )}
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
            <h4 style={{ marginBottom: '15px' }}>5) Other Expenses List</h4>
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
                                  {(() => {
                                    const opts = getOtherExpenseTypeOptions();
                                    const current = editForm.expenseType;
                                    const hasCurrent = current && opts.some(t => normalizeExpenseType(t) === normalizeExpenseType(current));
                                    return (
                                      <>
                                        {/* Show legacy type if it is not present in Expense Master */}
                                        {current && !hasCurrent && (
                                          <option value={current}>{current} (Not in Expense Master)</option>
                                        )}
                                        {opts.map(t => (
                                          <option key={t} value={t}>{t}</option>
                                        ))}
                                      </>
                                    );
                                  })()}
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

                {/* 5) Other Expenses Matrix */}
                <div style={{ 
                  marginBottom: '20px', 
                  padding: '20px', 
                  backgroundColor: '#fff', 
                  borderRadius: '8px',
                  border: '1px solid #8b5cf6'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#6d28d9' }}>5) Other Expenses Matrix</h4>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f5f3ff', borderBottom: '2px solid #8b5cf6' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6d28d9' }}>Expense Type</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6d28d9' }}>From Date</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6d28d9' }}>To Date</th>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#6d28d9' }}>Amount (₹)</th>
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                              disabled={isFinalized}
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
                  <div style={{ marginTop: '15px', padding: '12px', backgroundColor: '#f5f3ff', borderRadius: '6px', fontSize: '0.875rem', color: '#6d28d9' }}>
                    <strong>Note:</strong> These matrix amounts (Bhatta/Salary/Second Driver) are included in the driver balance calculation.
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
              <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#059669' }}>Finalize Trip (Driver Balance)</h3>
              
              <div className="grid-3" style={{ marginBottom: '20px' }}>
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
                  <label>MP Diesel Rate (₹/L)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={(parseFloat(fuelRates?.MP?.diesel) || parseFloat(finalizeData.dieselRate) || 94.14).toFixed(2)}
                    onChange={(e) => setFinalizeData({ ...finalizeData, dieselRate: e.target.value })}
                    placeholder="0.00"
                    readOnly={Boolean(fuelRates?.MP?.diesel)}
                  />
                  <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                    Extra Fuel Amount = (Fuel Issued − Expected Consumption) × MP Diesel Rate
                  </small>
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
                      <strong>Fuel Issued:</strong> {totalFuel.toFixed(2)} Liters
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
                      <strong>Expected Consumption:</strong> {expectedFuel} Liters
                    </div>
                    <div>
                      <strong>Fuel Difference (Issued − Expected):</strong>
                      <span style={{ color: extraFuelAmountNum > 0 ? '#dc3545' : '#059669', fontWeight: 'bold', marginLeft: '8px' }}>
                        {extraFuelLiters} Liters
                      </span>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <strong>Extra Fuel Amount (₹):</strong>
                      <span style={{ color: extraFuelAmountNum > 0 ? '#dc3545' : '#059669', fontWeight: 'bold', marginLeft: '8px' }}>
                        ₹{extraFuelAmount}
                      </span>
                      <span style={{ marginLeft: '10px', fontSize: '0.85rem', color: '#64748b' }}>
                        @ ₹{mpDieselRate.toFixed(2)}/L (MP)
                      </span>
                    </div>
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
                    <strong>Total Advance:</strong> ₹{totalAdvance.toFixed(2)}
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
                    <strong>Total Fuel Amount:</strong> ₹{totalFuelAmountView.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    <strong>Total Trip Cost:</strong> ₹{totalTripCostView.toFixed(2)}
                  </div>
                  <div style={{ fontSize: '18px', marginBottom: '10px' }}>
                    <strong>Extra Fuel Amount (₹):</strong> ₹{extraFuelAmount}
                  </div>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: finalBalance >= 0 ? '#059669' : '#dc3545',
                    paddingTop: '10px',
                    borderTop: `2px solid ${finalBalance >= 0 ? '#10b981' : '#ef4444'}`
                  }}>
                    Driver Balance ({finalBalance >= 0 ? 'Credit' : 'Debit'}):
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
                  disabled={!totalKM || !desiredAvg}
                  style={{ flex: 1 }}
                >
                  ✅ Finalize Trip
                </button>
                <button
                  type="button"
                  onClick={handlePrintTripExpenseDetails}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                  disabled={!selectedTrip}
                >
                  <Printer size={16} /> Print Expenses
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
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <h3 style={{ marginTop: 0, marginBottom: 0, color: '#059669' }}>Finalized Trip Summary</h3>
                <button
                  type="button"
                  onClick={handlePrintTripExpenseDetails}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Printer size={16} /> Print Expenses
                </button>
              </div>
              <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
                <div className="grid-2" style={{ gap: '15px', marginBottom: '15px' }}>
                  <div><strong>Total KM:</strong> {selectedTrip.finalizedData.totalKM}</div>
                  <div><strong>Desired Average:</strong> {selectedTrip.finalizedData.desiredAverage} KM/L</div>
                  <div><strong>Actual Average:</strong> {parseFloat(selectedTrip.finalizedData.actualAverage || 0).toFixed(2)} KM/L</div>
                  <div><strong>Fuel Issued:</strong> {parseFloat(selectedTrip.finalizedData.totalFuelIssued || 0).toFixed(2)} Liters</div>
                  <div><strong>Total Fuel Amount:</strong> ₹{(() => {
                    const fd = selectedTrip.finalizedData || {};
                    const stored = parseFloat(fd.totalFuelAmount);
                    if (Number.isFinite(stored)) return stored.toFixed(2);
                    const computed = (selectedTrip?.fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelAmount) || 0), 0);
                    return computed.toFixed(2);
                  })()}</div>
                  <div><strong>Expected Consumption:</strong> {parseFloat(selectedTrip.finalizedData.expectedFuel || 0).toFixed(2)} Liters</div>
                  <div><strong>Fuel Difference:</strong> {parseFloat(selectedTrip.finalizedData.extraFuelLiters || 0).toFixed(2)} Liters</div>
                  <div><strong>MP Diesel Rate:</strong> ₹{parseFloat(selectedTrip.finalizedData.mpDieselRate || 0).toFixed(2)}/L</div>
                  <div><strong>Extra Fuel Amount:</strong> ₹{parseFloat(selectedTrip.finalizedData.extraFuelAmount || 0).toFixed(2)}</div>
                  <div><strong>Total Trip Cost:</strong> ₹{(() => {
                    const fd = selectedTrip.finalizedData || {};
                    const stored = parseFloat(fd.totalTripCost);
                    if (Number.isFinite(stored)) return stored.toFixed(2);
                    const totalOther = parseFloat(fd.totalOtherExpenses) || 0;
                    const fuelAmt = Number.isFinite(parseFloat(fd.totalFuelAmount))
                      ? parseFloat(fd.totalFuelAmount)
                      : (selectedTrip?.fuelEntries || []).reduce((s, e) => s + (parseFloat(e?.fuelAmount) || 0), 0);
                    return (fuelAmt + totalOther).toFixed(2);
                  })()}</div>
                </div>
                <div style={{ 
                  padding: '15px', 
                  backgroundColor: (parseFloat(selectedTrip.finalizedData.driverBalance || 0) >= 0) ? '#d1fae5' : '#fee2e2',
                  borderRadius: '6px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color: (parseFloat(selectedTrip.finalizedData.driverBalance || 0) >= 0) ? '#059669' : '#dc3545'
                }}>
                  Driver Balance ({selectedTrip.finalizedData.driverBalanceType || ((parseFloat(selectedTrip.finalizedData.driverBalance || 0) >= 0) ? 'Credit' : 'Debit')}):
                  ₹{Math.abs(parseFloat(selectedTrip.finalizedData.driverBalance || 0)).toFixed(2)}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
