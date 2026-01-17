import React, { useState, useEffect, useMemo } from 'react';
import { Save, Plus, Trash2, Printer, Truck, User, Search, X, Edit2 } from 'lucide-react';

export default function ManifestForm() {
  const [lrBookings, setLrBookings] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [trips, setTrips] = useState([]);
  const [vendors, setVendors] = useState([]); // Market vehicle vendors for forwarding
  
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // Current user and branch info
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  
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
  
  // Load data from server
  const loadData = async () => {
    try {
      // Import syncService
      const syncService = (await import('./utils/sync-service')).default;
      
      // Load from server
      const [ftlResult, ptlResult, vehiclesResult, driversResult, branchesResult, citiesResult, manifestsResult, tripsResult, vendorsResult] = await Promise.all([
        syncService.load('ftlLRBookings'),
        syncService.load('ptlLRBookings'),
        syncService.load('vehicles'),
        syncService.load('drivers'),
        syncService.load('branches'),
        syncService.load('cities'),
        syncService.load('manifests'),
        syncService.load('trips'),
        syncService.load('marketVehicleVendors')
      ]);
      
      // Combine LR sources
      const storedLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
      const allLRs = [...(ftlResult.data || []), ...(ptlResult.data || []), ...storedLRs];
      const uniqueLRs = allLRs.filter((lr, index, self) => 
        index === self.findIndex(t => t.id?.toString() === lr.id?.toString())
      );
      
      setLrBookings(uniqueLRs);
      setVehicles((vehiclesResult.data || []).filter(v => v.status === 'Active'));
      setDrivers((driversResult.data || []).filter(d => d.status === 'Active'));
      setBranches((branchesResult.data || []).filter(b => b.status === 'Active'));
      setCities(citiesResult.data || []);
      
      // Handle manifests - ensure we get array and parse selectedLRs
      const allManifests = Array.isArray(manifestsResult) 
        ? manifestsResult 
        : (manifestsResult?.data || []);
      
      // Ensure selectedLRs is always an array (parse if needed)
      const parsedManifests = allManifests.map(manifest => {
        const manifestCopy = { ...manifest };
        if (manifestCopy.selectedLRs) {
          if (typeof manifestCopy.selectedLRs === 'string') {
            try {
              manifestCopy.selectedLRs = JSON.parse(manifestCopy.selectedLRs);
            } catch (e) {
              console.warn('Could not parse selectedLRs for manifest:', manifest.manifestNumber, e);
              manifestCopy.selectedLRs = [];
            }
          }
          if (!Array.isArray(manifestCopy.selectedLRs)) {
            manifestCopy.selectedLRs = [];
          }
        } else {
          manifestCopy.selectedLRs = [];
        }
        return manifestCopy;
      });
      
      setManifests(parsedManifests);
      
      setTrips(tripsResult.data || []);
      setVendors((vendorsResult.data || []).filter(v => v.status === 'Active'));
      
      console.log('✅ Manifests loaded:', allManifests.length);
    } catch (error) {
      console.error('Error loading data:', error);
      // Fallback to localStorage
      const ftlLRs = JSON.parse(localStorage.getItem('ftlLRBookings') || '[]');
      const ptlLRs = JSON.parse(localStorage.getItem('ptlLRBookings') || '[]');
      const storedLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
      const allLRs = [...ftlLRs, ...ptlLRs, ...storedLRs];
      const uniqueLRs = allLRs.filter((lr, index, self) => 
        index === self.findIndex(t => t.id?.toString() === lr.id?.toString())
      );
      
      const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      const storedDrivers = JSON.parse(localStorage.getItem('drivers') || '[]');
      const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
      const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
      const storedManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
      const storedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
      const storedVendors = JSON.parse(localStorage.getItem('marketVehicleVendors') || '[]');
      
      setLrBookings(uniqueLRs);
      setVehicles(storedVehicles.filter(v => v.status === 'Active'));
      setDrivers(storedDrivers.filter(d => d.status === 'Active'));
      setBranches(storedBranches.filter(b => b.status === 'Active'));
      setCities(storedCities);
      setManifests(storedManifests);
      setTrips(storedTrips);
      setVendors(storedVendors.filter(v => v.status === 'Active'));
    }
  };
  
  useEffect(() => {
    loadData();
    
    // Listen for manifest creation/update events
    const handleManifestCreated = () => {
      console.log('🔄 Manifest created event received, reloading manifests...');
      loadData();
    };
    
    const handleManifestUpdated = () => {
      console.log('🔄 Manifest updated event received, reloading manifests...');
      loadData();
    };
    
    const handleDataSync = () => {
      console.log('🔄 Data sync event received, reloading manifests...');
      loadData();
    };
    
    window.addEventListener('manifestCreated', handleManifestCreated);
    window.addEventListener('manifestUpdated', handleManifestUpdated);
    window.addEventListener('dataSyncedFromServer', handleDataSync);
    
    return () => {
      window.removeEventListener('manifestCreated', handleManifestCreated);
      window.removeEventListener('manifestUpdated', handleManifestUpdated);
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
    };
  }, []);
  
  // Get current user and branch info
  useEffect(() => {
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
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
          const branch = storedBranches.find(b => b.id.toString() === userBranchId.toString());
          setUserBranch(branch || null);
        } else {
          setUserBranch(null);
        }
      }
    }
  }, []);

  // Admin branch context: if Admin selected a branch in dashboard/topbar, force manifest origin branch.
  // If Admin selected "All", unlock and clear so user can choose any.
  useEffect(() => {
    if (!isAdmin) return;
    const apply = (branchId) => {
      const id = branchId ? String(branchId) : '';
      if (!id) return; // Admin selected ALL branches -> do not force
      const b = (branches || []).find(x => String(x.id) === id);
      if (b) {
        setSelectedBranch(b);
        setFormData(prev => ({ ...prev, branch: String(b.id) }));
      } else {
        setFormData(prev => ({ ...prev, branch: id }));
      }
    };

    // Apply persisted selection on load
    const persisted = localStorage.getItem('adminSelectedBranch');
    if (persisted) apply(persisted);

    const onChanged = (e) => apply(e?.detail?.branchId || '');
    window.addEventListener('adminBranchChanged', onChanged);
    return () => window.removeEventListener('adminBranchChanged', onChanged);
  }, [isAdmin, branches]);

  const [formData, setFormData] = useState({
    manifestNumber: '',
    manifestDate: new Date().toISOString().split('T')[0],
    branch: '',
    manifestType: 'branch', // 'branch' for branch-to-branch, 'vendor' for branch-to-vendor
    destinationBranch: '',
    vendorId: '', // For branch-to-vendor forwarding
    vendorName: '', // Store vendor name for display
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

  // Auto-generate manifest number based on server data
  useEffect(() => {
    // Only generate when not editing and manifests are loaded
    if (!editingManifestId && manifests.length >= 0) {
      // Get the highest manifest number from existing manifests
      const manifestNumbers = manifests
        .map(m => {
          if (!m.manifestNumber) return 0;
          const match = m.manifestNumber.match(/MNF(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);
      
      const maxNumber = manifestNumbers.length > 0 ? Math.max(...manifestNumbers) : 0;
      const nextNumber = maxNumber + 1;
      const manifestNo = `MNF${String(nextNumber).padStart(6, '0')}`;
      
      setFormData(prev => {
        // Always update manifest number when creating new manifest (not editing)
        // Only if it's empty, default, or same as current calculated number
        const currentNum = prev.manifestNumber?.match(/MNF(\d+)/);
        const currentNumValue = currentNum ? parseInt(currentNum[1], 10) : 0;
        
        if (!prev.manifestNumber || currentNumValue <= maxNumber) {
          return { ...prev, manifestNumber: manifestNo };
        }
        return prev;
      });
    }
  }, [manifests, editingManifestId]);

  // Check if returning from LR creation to continue editing manifest
  useEffect(() => {
    const returnToManifestEdit = localStorage.getItem('returnToManifestEdit');
    if (returnToManifestEdit && manifests.length > 0) {
      const manifestId = parseInt(returnToManifestEdit);
      const manifest = manifests.find(m => m.id === manifestId);
      if (manifest) {
        // Reload LR bookings to get the newly created one
        const allLRBookings = [
          ...JSON.parse(localStorage.getItem('ftlLRBookings') || '[]'),
          ...JSON.parse(localStorage.getItem('ptlLRBookings') || '[]')
        ];
        setLrBookings(allLRBookings);
        
        // Switch to create tab
        setActiveTab('create');
        
        // Set editing manifest ID
        setEditingManifestId(manifest.id);
        
        // Load manifest data into form
        // Ensure selectedLRs is a parsed array of IDs
        let selectedLRIds = [];
        if (manifest.selectedLRs) {
          let lrArray = manifest.selectedLRs;
          if (typeof lrArray === 'string') {
            try {
              lrArray = JSON.parse(lrArray);
            } catch (e) {
              console.warn('Could not parse selectedLRs when returning to manifest edit:', e);
              lrArray = [];
            }
          }
          if (Array.isArray(lrArray)) {
            selectedLRIds = lrArray.map(lr => {
              if (typeof lr === 'object' && lr && lr.id) return lr.id;
              return lr;
            }).filter(Boolean);
          }
        }

        setFormData({
          manifestNumber: manifest.manifestNumber,
          manifestDate: manifest.manifestDate,
          branch: manifest.branch,
          manifestType: manifest.manifestType || 'branch',
          destinationBranch: manifest.destinationBranch || '',
          vendorId: manifest.vendorId || '',
          vendorName: manifest.vendorName || '',
          vehicleNumber: manifest.vehicleNumber,
          driverName: manifest.driverName,
          route: manifest.route,
          selectedLRs: selectedLRIds,
          departureDate: manifest.departureDate,
          departureTime: manifest.departureTime,
          loadingBy: manifest.loadingBy || '',
          vehicleKms: manifest.vehicleKms || '',
          remarks: manifest.remarks || ''
        });

        // Set selected vehicle and driver
        const vehicle = vehicles.find(v => v.id.toString() === manifest.vehicleNumber.toString());
        if (vehicle) setSelectedVehicle(vehicle);
        const driver = drivers.find(d => d.id.toString() === manifest.driverName.toString());
        if (driver) setSelectedDriver(driver);
        const branch = branches.find(b => b.id.toString() === manifest.branch.toString());
        if (branch) setSelectedBranch(branch);
        
        // Clear the return flag
        localStorage.removeItem('returnToManifestEdit');
        
        // Scroll to top
        setTimeout(() => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [manifests, vehicles, drivers, branches]);

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
        } else if (lr.paymentMode === 'TBB' || lr.paymentMode === 'SundryCreditor') {
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

  // Reload LRs from all sources
  const reloadLRBookings = () => {
    const ftlLRs = JSON.parse(localStorage.getItem('ftlLRBookings') || '[]');
    const ptlLRs = JSON.parse(localStorage.getItem('ptlLRBookings') || '[]');
    const storedLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    // Combine all LR sources
    const allLRs = [...ftlLRs, ...ptlLRs, ...storedLRs];
    // Remove duplicates based on ID
    const uniqueLRs = allLRs.filter((lr, index, self) => 
      index === self.findIndex(t => t.id?.toString() === lr.id?.toString())
    );
    setLrBookings(uniqueLRs);
    return uniqueLRs;
  };

  // Get destination branch for an LR based on destination city
  const getLRDestinationBranch = (lr) => {
    if (!lr || !lr.destination) return null;
    
    // Find destination city
    const destinationCity = cities.find(c => 
      c.code === lr.destination || 
      c.cityName === lr.destination ||
      c.id?.toString() === lr.destination?.toString()
    );
    
    if (destinationCity) {
      // Find branch in that city/state
      const destBranch = branches.find(b => 
        b.address && (
          b.address.city === destinationCity.cityName || 
          b.address.state === destinationCity.state ||
          b.city === destinationCity.cityName ||
          b.state === destinationCity.state
        )
      );
      return destBranch;
    }
    
    return null;
  };

  // Check if LR is accessible to current user's branch
  const isLRAccessible = (lr) => {
    // Admin can see all LRs
    if (isAdmin) return true;
    
    // If no user branch, don't show any (safety)
    if (!userBranch) return false;
    
    // Check if LR was booked in user's branch
    const lrBranch = branches.find(b => 
      b.id?.toString() === lr.branch?.toString() || 
      b.branchCode === lr.branch
    );
    
    if (lrBranch && (
      lrBranch.id?.toString() === userBranch.id?.toString() ||
      lrBranch.branchCode === userBranch.branchCode
    )) {
      return true; // LR booked in user's branch
    }
    
    // Check if LR destination is in user's branch (for delivery/forwarding)
    const destBranch = getLRDestinationBranch(lr);
    if (destBranch && (
      destBranch.id?.toString() === userBranch.id?.toString() ||
      destBranch.branchCode === userBranch.branchCode
    )) {
      return true; // LR destination is user's branch (for delivery/forwarding)
    }
    
    return false;
  };

  // Get available LRs for selection (not in any manifest, or in the manifest being edited)
  const getAvailableLRs = useMemo(() => {
    // Ensure we have the latest LRs
    const currentLRs = lrBookings.length > 0 ? lrBookings : [];
    if (!currentLRs.length) {
      return [];
    }
    
    // Get all LRs that are in other manifests (excluding the one being edited)
    const lrsInOtherManifests = new Set();
    
    manifests.forEach(manifest => {
      // Skip the manifest being edited - we want to show its LRs
      if (editingManifestId && manifest.id === editingManifestId) {
        return;
      }
      
      // Collect LR IDs from other manifests
      if (manifest.selectedLRs) {
        let lrArray = manifest.selectedLRs;
        
        // Handle case where selectedLRs might be a JSON string (from database)
        // Note: Server should parse this, but handle both cases
        if (typeof lrArray === 'string') {
          try {
            lrArray = JSON.parse(lrArray);
          } catch (e) {
            // Not JSON, skip this manifest
            return;
          }
        }
        
        if (Array.isArray(lrArray) && lrArray.length > 0) {
          lrArray.forEach(lr => {
            // Handle both object and ID formats
            let lrId = null;
            
            if (typeof lr === 'object' && lr !== null) {
              // Could be {id: X} or full LR object
              lrId = lr.id;
            } else if (typeof lr === 'number' || typeof lr === 'string') {
              // Direct ID
              lrId = lr;
            }
            
            if (lrId !== null && lrId !== undefined) {
              const idValue = typeof lrId === 'object' && lrId.id ? lrId.id : lrId;
              if (idValue) {
                lrsInOtherManifests.add(idValue.toString());
              }
            }
          });
        }
      }
    });
    
    // Get LRs that are in the manifest being edited
    const editingManifest = editingManifestId ? manifests.find(m => m.id === editingManifestId) : null;
    const lrsInEditingManifest = new Set();
    if (editingManifest && editingManifest.selectedLRs) {
      let lrArray = editingManifest.selectedLRs;
      
      // Handle case where selectedLRs might be a JSON string (from database)
      if (typeof lrArray === 'string') {
        try {
          lrArray = JSON.parse(lrArray);
        } catch (e) {
          lrArray = [];
        }
      }
      
      if (Array.isArray(lrArray)) {
        lrArray.forEach(lr => {
          let lrId;
          if (typeof lr === 'object' && lr !== null) {
            lrId = lr.id;
          } else {
            lrId = lr;
          }
          if (lrId) {
            const idValue = typeof lrId === 'object' && lrId.id ? lrId.id : lrId;
            if (idValue) lrsInEditingManifest.add(idValue.toString());
          }
        });
      }
    }
    
    // Return LRs that are either:
    // 1. Not in any manifest (available to add), OR
    // 2. In the manifest being edited (so they can be reselected/removed)
    // AND accessible to current user's branch
    const result = currentLRs.filter(lr => {
      if (!lr || !lr.id) return false;
      const lrIdStr = lr.id.toString();
      
      // Check branch access first
      if (!isLRAccessible(lr)) return false;
      
      // If editing, include:
      // - LRs that are in the current manifest (for reselection/removal)
      // - LRs that are not in any other manifest (for adding new LRs)
      const isAvailable = editingManifestId 
        ? (lrsInEditingManifest.has(lrIdStr) || !lrsInOtherManifests.has(lrIdStr))
        : !lrsInOtherManifests.has(lrIdStr);
      
      return isAvailable;
    });
    
    return result;
  }, [lrBookings, manifests, editingManifestId, branches, currentUser, isAdmin, userBranch]);

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

  // Get LR Type display (TBB, Paid, ToPay, SundryCreditor)
  const getLRType = (paymentMode) => {
    if (paymentMode === 'TBB' || paymentMode === 'SundryCreditor') return 'TBB';
    if (paymentMode === 'Paid') return 'Paid';
    if (paymentMode === 'ToPay') return 'ToPay';
    return paymentMode || 'N/A';
  };

  const handlePrint = (manifest = null) => {
    if (manifest) {
      // Ensure selectedLRs is always an array
      const manifestCopy = { ...manifest };
      if (manifestCopy.selectedLRs) {
        if (typeof manifestCopy.selectedLRs === 'string') {
          try {
            manifestCopy.selectedLRs = JSON.parse(manifestCopy.selectedLRs);
          } catch (e) {
            console.warn('Could not parse selectedLRs for print:', e);
            manifestCopy.selectedLRs = [];
          }
        }
        if (!Array.isArray(manifestCopy.selectedLRs)) {
          manifestCopy.selectedLRs = [];
        }
      } else {
        manifestCopy.selectedLRs = [];
      }
      setSelectedManifestForPrint(manifestCopy);
      setTimeout(() => {
        window.print();
      }, 100);
    } else {
      window.print();
    }
  };

  // Check if a trip exists for a manifest
  const hasTrip = (manifestId) => {
    if (!manifestId) return false;
    const manifestIdStr = manifestId.toString();
    
    // Check if any trip has this manifest selected
    return trips.some(trip => {
      // Direct ID match
      if (trip.selectedManifest?.toString() === manifestIdStr) {
        return true;
      }
      
      // Check by manifest ID if trip stores it differently
      const manifest = manifests.find(m => m.id?.toString() === manifestIdStr);
      if (manifest && trip.selectedManifest) {
        const tripManifestId = trip.selectedManifest.toString();
        if (tripManifestId === manifest.id?.toString()) {
          return true;
        }
      }
      
      return false;
    });
  };

  // Handle edit manifest
  const handleEdit = (manifest) => {
    if (hasTrip(manifest.id)) {
      alert('⚠️ This manifest cannot be edited. A trip has already been created for it.');
      return;
    }
    
    // Reload LRs to ensure we have all available LRs (including those in the manifest)
    reloadLRBookings();
    
    // Set editing manifest ID
    setEditingManifestId(manifest.id);
    
    // Load manifest data into form
    // Ensure selectedLRs is a parsed array of IDs
    let selectedLRIds = [];
    if (manifest.selectedLRs) {
      let lrArray = manifest.selectedLRs;
      if (typeof lrArray === 'string') {
        try {
          lrArray = JSON.parse(lrArray);
        } catch (e) {
          console.warn('Could not parse selectedLRs for edit:', e);
          lrArray = [];
        }
      }
      if (Array.isArray(lrArray)) {
        selectedLRIds = lrArray.map(lr => {
          if (typeof lr === 'object' && lr && lr.id) return lr.id;
          return lr;
        }).filter(Boolean);
      }
    }
    
    setFormData({
      manifestNumber: manifest.manifestNumber,
      manifestDate: manifest.manifestDate,
      branch: manifest.branch,
      destinationBranch: manifest.destinationBranch,
      vehicleNumber: manifest.vehicleNumber,
      driverName: manifest.driverName,
      route: manifest.route,
      selectedLRs: selectedLRIds,
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

  const handleSearch = async () => {
    // Reload manifests from server before searching to ensure we have latest data
    try {
      const syncService = (await import('./utils/sync-service')).default;
      const manifestsResult = await syncService.load('manifests');
      const allManifests = Array.isArray(manifestsResult) 
        ? manifestsResult 
        : (manifestsResult?.data || []);
      setManifests(allManifests);
      console.log('🔄 Manifests reloaded for search:', allManifests.length);
    } catch (error) {
      console.error('Error reloading manifests for search:', error);
    }
    
    // Use current manifests state (which may have been just updated)
    let filtered = [...manifests];

    // If manifest number is provided, search by it; otherwise show all
    if (searchFilters.manifestNumber && searchFilters.manifestNumber.trim()) {
      filtered = filtered.filter(m => 
        m.manifestNumber?.toLowerCase().includes(searchFilters.manifestNumber.toLowerCase().trim())
      );
    }
    // If manifest number is empty, show all manifests (no filter)

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
    if (!driver) return driverId;
    // Show driverName with nickName if available
    return driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.selectedLRs.length === 0) {
      alert('⚠️ Please select at least one LR for the manifest!');
      return;
    }

    const selectedLRDetails = lrBookings.filter(lr => 
      formData.selectedLRs.includes(lr.id)
    );

    // Determine destination branch from LR destinations (only for branch-to-branch manifests)
    let destinationBranch = formData.destinationBranch;
    if (formData.manifestType === 'branch' && !destinationBranch && selectedLRDetails.length > 0) {
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
    
    // Validate manifest type requirements
    if (formData.manifestType === 'branch' && !destinationBranch) {
      alert('⚠️ Please select a destination branch for branch-to-branch manifest!');
      return;
    }
    
    if (formData.manifestType === 'vendor' && !formData.vendorId) {
      alert('⚠️ Please select a vendor for branch-to-vendor forwarding!');
      return;
    }

    try {
      const syncService = (await import('./utils/sync-service')).default;
      
      if (editingManifestId) {
        // Update existing manifest
        const existingManifest = manifests.find(m => m.id === editingManifestId);
        if (!existingManifest) {
          alert('⚠️ Manifest not found!');
          return;
        }
        
        const updatedManifest = {
          ...existingManifest,
          manifestDate: formData.manifestDate,
          branch: formData.branch,
          manifestType: formData.manifestType,
          destinationBranch: formData.manifestType === 'branch' ? destinationBranch : '',
          vendorId: formData.manifestType === 'vendor' ? formData.vendorId : '',
          vendorName: formData.manifestType === 'vendor' ? formData.vendorName : '',
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
          updatedAt: new Date().toISOString()
        };
        
        // Save to server
        await syncService.save('manifests', updatedManifest);
        
        // Update local state
        const updatedManifests = manifests.map(m => m.id === editingManifestId ? updatedManifest : m);
        setManifests(updatedManifests);
        localStorage.setItem('manifests', JSON.stringify(updatedManifests));
        
        const updatedManifestNumber = formData.manifestNumber;
        
        // Reset form completely
        // Generate next manifest number based on server data
        const manifestNumbers = manifests
          .map(m => {
            const match = m.manifestNumber?.match(/MNF(\d+)/);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(num => num > 0);
        
        const maxNumber = manifestNumbers.length > 0 ? Math.max(...manifestNumbers) : 0;
        const nextNumber = maxNumber + 1;
        const manifestNo = `MNF${String(nextNumber).padStart(6, '0')}`;
        
        setFormData({
          manifestNumber: manifestNo,
          manifestDate: new Date().toISOString().split('T')[0],
          branch: '',
          manifestType: 'branch',
          destinationBranch: '',
          vendorId: '',
          vendorName: '',
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
        
        alert(`✅ Manifest "${updatedManifestNumber}" updated successfully!`);
        
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('manifestUpdated'));
        
        // Switch back to search tab
        setActiveTab('search');
        handleSearch(); // Refresh search results
      } else {
        // Create new manifest
        const newManifest = {
          manifestNumber: formData.manifestNumber,
          manifestDate: formData.manifestDate,
          branch: formData.branch,
          manifestType: formData.manifestType,
          destinationBranch: formData.manifestType === 'branch' ? destinationBranch : '',
          vendorId: formData.manifestType === 'vendor' ? formData.vendorId : '',
          vendorName: formData.manifestType === 'vendor' ? formData.vendorName : '',
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

        // Save to server
        const saveResult = await syncService.save('manifests', newManifest);
        
        // Extract the saved manifest data from the result
        const savedManifest = saveResult?.data || saveResult;
        
        // Reload all manifests from server to ensure we have the latest data
        const reloadedManifestsResult = await syncService.load('manifests');
        const reloadedManifests = Array.isArray(reloadedManifestsResult) 
          ? reloadedManifestsResult 
          : (reloadedManifestsResult?.data || []);
        
        // Update local state with all manifests from server
        setManifests(reloadedManifests);
        localStorage.setItem('manifests', JSON.stringify(reloadedManifests));

        alert(`✅ Manifest "${formData.manifestNumber}" created successfully!\n\nTotal LRs: ${manifestSummary.lrCount}\nTotal Pieces: ${manifestSummary.totalPieces}\nTotal Weight: ${manifestSummary.totalWeight} Kg\n\nSaved to server!`);
        
        // Trigger refresh event for other components
        window.dispatchEvent(new CustomEvent('manifestCreated', { detail: { manifest: savedManifest } }));
        
        // Also trigger a general data sync event
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
        
        // Auto-print after creation
        setTimeout(() => {
          window.print();
        }, 500);
      }
    } catch (error) {
      console.error('Error saving manifest:', error);
      alert(`❌ Error saving manifest: ${error.message || 'Unknown error'}`);
    }
  };

  // Get selected LR details - handle both ID references and full objects
  const selectedLRDetails = (Array.isArray(formData.selectedLRs) ? formData.selectedLRs : []).map(selectedLRId => {
    // First try to find in lrBookings by ID
    let lr = lrBookings.find(lr => lr.id?.toString() === selectedLRId?.toString());
    
    // If not found, check if the manifest has the full LR object stored
    if (!lr && editingManifestId) {
      const editingManifest = manifests.find(m => m.id === editingManifestId);
      if (editingManifest && editingManifest.selectedLRs) {
        let lrArray = editingManifest.selectedLRs;
        if (typeof lrArray === 'string') {
          try {
            lrArray = JSON.parse(lrArray);
          } catch (e) {
            console.warn('Could not parse selectedLRs when resolving LR details:', e);
            lrArray = [];
          }
        }
        if (Array.isArray(lrArray)) {
          const storedLR = lrArray.find(lrItem => {
            const lrId = typeof lrItem === 'object' && lrItem.id ? lrItem.id : lrItem;
            return lrId?.toString() === selectedLRId?.toString();
          });
          if (storedLR && typeof storedLR === 'object' && storedLR.id) {
            lr = storedLR;
          }
        }
      }
    }
    
    // If still not found, try to find in all LR sources
    if (!lr) {
      const allLRs = [
        ...JSON.parse(localStorage.getItem('ftlLRBookings') || '[]'),
        ...JSON.parse(localStorage.getItem('ptlLRBookings') || '[]'),
        ...JSON.parse(localStorage.getItem('lrBookings') || '[]')
      ];
      lr = allLRs.find(l => l.id?.toString() === selectedLRId?.toString());
    }
    
    return lr;
  }).filter(lr => lr !== undefined && lr !== null);

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
                  placeholder="Enter manifest number or leave blank for all"
                />
                <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                  Enter manifest number to search specific manifest, or leave blank to search all
                </small>
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
                onClick={async () => {
                  // Reload manifests from server
                  try {
                    const syncService = (await import('./utils/sync-service')).default;
                    const manifestsResult = await syncService.load('manifests');
                    const allManifests = Array.isArray(manifestsResult) 
                      ? manifestsResult 
                      : (manifestsResult?.data || []);
                    setManifests(allManifests);
                    localStorage.setItem('manifests', JSON.stringify(allManifests));
                    console.log('🔄 Manifests refreshed:', allManifests.length);
                    alert(`✅ Manifests refreshed! Found ${allManifests.length} manifest(s).`);
                  } catch (error) {
                    console.error('Error refreshing manifests:', error);
                    alert('❌ Error refreshing manifests. Please try again.');
                  }
                }}
                className="btn"
                style={{ 
                  background: '#10b981', 
                  color: 'white',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title="Reload manifests from server"
              >
                🔄 Refresh
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
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                          <button
                            type="button"
                            onClick={() => handlePrint(manifest)}
                            className="btn btn-print"
                            style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                          >
                            <Printer size={16} /> Print
                          </button>
                          {(() => {
                            const tripExists = hasTrip(manifest.id);
                            return !tripExists ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleEdit(manifest)}
                                  className="btn"
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '0.85rem',
                                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                                    color: 'white',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                  title="Edit Manifest (Available until trip is created)"
                                >
                                  <Edit2 size={16} /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDelete(manifest)}
                                  className="btn"
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '0.85rem',
                                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                                    color: 'white',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: 'pointer'
                                  }}
                                  title="Delete Manifest"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <span style={{ 
                                fontSize: '0.75rem', 
                                color: '#64748b', 
                                fontStyle: 'italic',
                                padding: '4px 8px'
                              }}>
                                Trip Created
                              </span>
                            );
                          })()}
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
                <img
                  src="/brand-logo.png"
                  alt="Company Logo"
                  style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo192.png';
                  }}
                />
              </div>
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
                <div>
                  {selectedManifestForPrint.manifestType === 'vendor' && selectedManifestForPrint.vendorName
                    ? `To Vendor: ${selectedManifestForPrint.vendorName}`
                    : selectedManifestForPrint.route || 'N/A'}
                </div>
              </div>
              {selectedManifestForPrint.manifestType === 'vendor' && (
                <div>
                  <div style={{ fontWeight: 600 }}>Forwarding Vendor</div>
                  <div>{selectedManifestForPrint.vendorName || 'N/A'}</div>
                </div>
              )}
              {selectedManifestForPrint.manifestType === 'branch' && selectedManifestForPrint.destinationBranch && (
                <div>
                  <div style={{ fontWeight: 600 }}>To Branch</div>
                  <div>{getBranchName(selectedManifestForPrint.destinationBranch) || 'N/A'}</div>
                </div>
              )}
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
                {(Array.isArray(selectedManifestForPrint.selectedLRs) ? selectedManifestForPrint.selectedLRs : []).map((lr, index) => {
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
                      <td style={{ border: '1px solid #000', padding: '6px', fontFamily: 'monospace' }}>
                        {lr.lrNumber || 'N/A'}
                        {lr.referenceNumber && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            Ref: {lr.referenceNumber}
                          </div>
                        )}
                      </td>
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
                {(() => {
                  // Recalculate summary from actual LR data to ensure accuracy
                  // Use the EXACT same LR objects as displayed in the table above
                  const lrs = selectedManifestForPrint.selectedLRs || [];
                  const recalculatedSummary = lrs.reduce((acc, lr) => {
                    if (!lr) return acc;
                    
                    // Use the LR object directly (same as table display - no lookup needed)
                    // The manifest stores full LR objects, so use them directly
                    const lrData = lr; // Use directly, no lookup
                    
                    acc.totalPieces += parseInt(lrData.pieces) || 0;
                    acc.totalWeight += parseFloat(lrData.weight) || 0;
                    
                    // Calculate total amount - use EXACT same logic as table display above
                    // Match the table calculation exactly: lr.totalAmount || 0
                    let totalAmount = lrData.totalAmount || 0;
                    totalAmount = parseFloat(totalAmount) || 0;
                    if (!totalAmount && lrData.charges) {
                      const subtotal = (parseFloat(lrData.charges.freightRate) || 0) +
                                     (parseFloat(lrData.charges.lrCharges) || 0) +
                                     (parseFloat(lrData.charges.hamali) || 0) +
                                     (parseFloat(lrData.charges.pickupCharges) || 0) +
                                     (parseFloat(lrData.charges.deliveryCharges) || 0) +
                                     (parseFloat(lrData.charges.odaCharges) || 0) +
                                     (parseFloat(lrData.charges.other) || 0) +
                                     (parseFloat(lrData.charges.waraiUnion) || 0);
                      
                      const gstPercent = lrData.charges.gstPercent || '5-rcm';
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
                    
                    // Normalize payment mode (handle case variations and spaces)
                    const paymentMode = (lrData.paymentMode || 'ToPay').toString().trim();
                    const normalizedMode = paymentMode.toLowerCase().replace(/\s+/g, '');
                    
                    if (normalizedMode === 'paid') {
                      acc.totalPaid += totalAmount;
                    } else if (normalizedMode === 'topay') {
                      acc.totalToPay += totalAmount;
                    } else if (normalizedMode === 'tbb' || normalizedMode === 'sundrycreditor') {
                      acc.totalTBB += totalAmount;
                    } else {
                      // Default to ToPay if unknown
                      acc.totalToPay += totalAmount;
                    }
                    
                    return acc;
                  }, {
                    totalPieces: 0,
                    totalWeight: 0,
                    totalPaid: 0,
                    totalToPay: 0,
                    totalTBB: 0
                  });
                  
                  const grandTotal = recalculatedSummary.totalPaid + recalculatedSummary.totalToPay + recalculatedSummary.totalTBB;
                  
                  return (
                    <tr style={{ border: '1px solid #000', fontWeight: 600, background: '#f0f0f0' }}>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }} colSpan="7">
                        {lrs.length}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                        {recalculatedSummary.totalPieces}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                        {formatNumber(recalculatedSummary.totalWeight)}
                      </td>
                      <td style={{ border: '1px solid #000', padding: '6px', textAlign: 'right' }}>
                        {formatNumber(grandTotal)}
                      </td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>

            {/* Footer Totals */}
            {(() => {
              // Recalculate summary from actual LR data to ensure accuracy
              // Use the EXACT same LR objects as displayed in the table above
              const lrs = selectedManifestForPrint.selectedLRs || [];
              const recalculatedSummary = lrs.reduce((acc, lr) => {
                if (!lr) return acc;
                
                // Use the LR object directly (same as table display - no lookup needed)
                // The manifest stores full LR objects, so use them directly
                const lrData = lr; // Use directly, no lookup
                
                acc.totalPieces += parseInt(lrData.pieces) || 0;
                acc.totalWeight += parseFloat(lrData.weight) || 0;
                
                // Calculate total amount - use EXACT same logic as table display above
                // Match the table calculation exactly: lr.totalAmount || 0
                let totalAmount = lrData.totalAmount || 0;
                totalAmount = parseFloat(totalAmount) || 0;
                if (!totalAmount && lrData.charges) {
                  const subtotal = (parseFloat(lrData.charges.freightRate) || 0) +
                                 (parseFloat(lrData.charges.lrCharges) || 0) +
                                 (parseFloat(lrData.charges.hamali) || 0) +
                                 (parseFloat(lrData.charges.pickupCharges) || 0) +
                                 (parseFloat(lrData.charges.deliveryCharges) || 0) +
                                 (parseFloat(lrData.charges.odaCharges) || 0) +
                                 (parseFloat(lrData.charges.other) || 0) +
                                 (parseFloat(lrData.charges.waraiUnion) || 0);
                  
                  const gstPercent = lrData.charges.gstPercent || '5-rcm';
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
                
                // Normalize payment mode (handle case variations and spaces)
                const paymentMode = (lrData.paymentMode || 'ToPay').toString().trim();
                const normalizedMode = paymentMode.toLowerCase().replace(/\s+/g, '');
                
                if (normalizedMode === 'paid') {
                  acc.totalPaid += totalAmount;
                } else if (normalizedMode === 'topay') {
                  acc.totalToPay += totalAmount;
                } else if (normalizedMode === 'tbb' || normalizedMode === 'sundrycreditor') {
                  acc.totalTBB += totalAmount;
                } else {
                  // Default to ToPay if unknown
                  acc.totalToPay += totalAmount;
                }
                
                return acc;
              }, {
                totalPieces: 0,
                totalWeight: 0,
                totalPaid: 0,
                totalToPay: 0,
                totalTBB: 0
              });
              
              const grandTotal = recalculatedSummary.totalPaid + recalculatedSummary.totalToPay + recalculatedSummary.totalTBB;
              
              return (
                <div style={{ 
                  marginTop: '20px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr 1fr',
                  gap: '12px',
                  fontSize: '11px',
                  fontWeight: 600
                }}>
                  <div>
                    <div>NO OF PKGS:</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{recalculatedSummary.totalPieces}</div>
                  </div>
                  <div>
                    <div>ACTUAL WEIGHT</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(recalculatedSummary.totalWeight)}</div>
                  </div>
                  <div>
                    <div>TO PAY AMOUNT</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(recalculatedSummary.totalToPay)}</div>
                  </div>
                  <div>
                    <div>PAID AMOUNT</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(recalculatedSummary.totalPaid)}</div>
                  </div>
                  <div>
                    <div>TBB AMOUNT</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(recalculatedSummary.totalTBB)}</div>
                  </div>
                  <div>
                    <div>GRAND TOTAL</div>
                    <div style={{ fontSize: '12px', marginTop: '4px' }}>{formatNumber(grandTotal)}</div>
                  </div>
                </div>
              );
            })()}

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
                    manifestType: 'branch',
                    destinationBranch: '',
                    vendorId: '',
                    vendorName: '',
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
                    disabled={isAdmin && !!localStorage.getItem('adminSelectedBranch')}
                    style={(isAdmin && !!localStorage.getItem('adminSelectedBranch'))
                      ? { background: '#f3f4f6', cursor: 'not-allowed' }
                      : {}}
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
                <label>Manifest Type *</label>
                <select
                  value={formData.manifestType}
                  onChange={(e) => {
                    const type = e.target.value;
                    setFormData(prev => ({ 
                      ...prev, 
                      manifestType: type,
                      destinationBranch: type === 'branch' ? prev.destinationBranch : '',
                      vendorId: type === 'vendor' ? prev.vendorId : '',
                      vendorName: type === 'vendor' ? prev.vendorName : ''
                    }));
                  }}
                  required
                >
                  <option value="branch">Branch to Branch</option>
                  <option value="vendor">Branch to Vendor (Forwarding)</option>
                </select>
                <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                  {formData.manifestType === 'branch' 
                    ? 'Manifest will be sent to another branch' 
                    : 'LRs will be forwarded to a vendor for delivery'}
                </small>
              </div>
            </div>

            <div className="grid-2">
              {formData.manifestType === 'branch' ? (
                <div className="input-group">
                  <label>Destination Branch *</label>
                  <select
                    value={formData.destinationBranch}
                    onChange={(e) => setFormData(prev => ({ ...prev, destinationBranch: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Destination Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName} - {branch.address.city}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select the destination branch for this manifest
                  </small>
                </div>
              ) : (
                <div className="input-group">
                  <label>Vendor (For Forwarding) *</label>
                  <select
                    value={formData.vendorId}
                    onChange={(e) => {
                      const vendorId = e.target.value;
                      const vendor = vendors.find(v => v.id?.toString() === vendorId);
                      setFormData(prev => ({ 
                        ...prev, 
                        vendorId: vendorId,
                        vendorName: vendor ? (vendor.companyName || vendor.tradeName || vendor.vendorName || '') : ''
                      }));
                    }}
                    required
                  >
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(vendor => (
                      <option key={vendor.id} value={vendor.id}>
                        {vendor.companyName || vendor.tradeName || vendor.vendorName || 'N/A'} 
                        {vendor.primaryContact?.mobile ? ` - ${vendor.primaryContact.mobile}` : ''}
                      </option>
                    ))}
                  </select>
                  <small style={{ color: '#64748b', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    Select vendor to forward LRs for delivery
                  </small>
                </div>
              )}
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
            <h2 className="section-title">
              {editingManifestId ? 'Edit LR Bookings for Manifest' : 'Select LR Bookings for Manifest'}
            </h2>
            
            {editingManifestId && (
              <div style={{
                padding: '12px 16px',
                background: '#dbeafe',
                borderRadius: '8px',
                border: '2px solid #3b82f6',
                marginBottom: '16px',
                fontSize: '0.9rem',
                color: '#1e40af',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <strong>✏️ Editing Mode:</strong> You can reselect existing LRs from this manifest and add new LRs that are not in any other manifest.
                </div>
                <button
                  type="button"
                  onClick={() => {
                    // Store current manifest ID to return after creating LR
                    if (editingManifestId) {
                      localStorage.setItem('returnToManifestEdit', editingManifestId.toString());
                    }
                    // Use sessionStorage to navigate to LR booking form
                    sessionStorage.setItem('navigateToView', 'lr-booking');
                    // Dispatch custom event to trigger navigation
                    window.dispatchEvent(new CustomEvent('navigateToView', { detail: 'lr-booking' }));
                    // Also try direct navigation if parent is listening
                    if (window.parent && window.parent !== window) {
                      window.parent.postMessage({ type: 'navigate', view: 'lr-booking' }, '*');
                    }
                  }}
                  style={{
                    padding: '8px 16px',
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-1px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>+</span> Add New LR
                </button>
              </div>
            )}
            
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
            ) : getAvailableLRs.length === 0 && !editingManifestId ? (
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
            ) : getAvailableLRs.length === 0 && editingManifestId ? (
              <div style={{
                padding: '20px',
                background: '#fef3c7',
                borderRadius: '8px',
                border: '2px solid #fbbf24',
                color: '#92400e',
                textAlign: 'center'
              }}>
                ⚠️ No LRs available to add. All LRs are in other manifests. You can only reselect LRs that are already in this manifest.
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
                        const availableLRIds = getAvailableLRs.map(lr => lr.id);
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
                      {formData.selectedLRs.length === getAvailableLRs.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>
                
                {(() => {
                  const availableLRs = getAvailableLRs;
                  const editingManifest = editingManifestId ? manifests.find(m => m.id === editingManifestId) : null;
                  const lrsInEditingManifest = new Set();
                  if (editingManifest && editingManifest.selectedLRs) {
                    editingManifest.selectedLRs.forEach(lr => {
                      const lrId = typeof lr === 'object' && lr.id ? lr.id : lr;
                      if (lrId) lrsInEditingManifest.add(lrId.toString());
                    });
                  }
                  
                  return availableLRs.map(lr => {
                    const isInManifest = editingManifestId && lrsInEditingManifest.has(lr.id.toString());
                    return (
                      <div
                        key={lr.id}
                        className={`lr-card ${formData.selectedLRs.includes(lr.id) ? 'selected' : ''}`}
                        style={{ 
                          cursor: 'pointer',
                          border: isInManifest ? '2px solid #3b82f6' : '2px solid #e2e8f0',
                          background: isInManifest && !formData.selectedLRs.includes(lr.id) ? '#eff6ff' : 'white'
                        }}
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
                        {lr.referenceNumber && (
                          <span style={{ marginLeft: '12px', fontSize: '0.9rem', color: '#64748b', fontWeight: 'normal' }}>
                            Ref: {lr.referenceNumber}
                          </span>
                        )}
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
                      <div><strong>Consignor:</strong> {lr.consignor?.name || lr.consignorName || 'N/A'}</div>
                      <div><strong>Consignee:</strong> {lr.consignee?.name || lr.consigneeName || 'N/A'}</div>
                    </div>
                    
                    {(lr.freightAmount || lr.totalAmount || lr.rate || lr.ratePerKg) && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px 12px', 
                        background: '#f0fdf4', 
                        borderRadius: '6px',
                        border: '1px solid #86efac',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          {lr.freightAmount && (
                            <div>
                              <strong>Freight:</strong> ₹{parseFloat(lr.freightAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {lr.totalAmount && (
                            <div>
                              <strong>Total Amount:</strong> ₹{parseFloat(lr.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {lr.rate && (
                            <div>
                              <strong>Rate:</strong> ₹{parseFloat(lr.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                          {lr.ratePerKg && (
                            <div>
                              <strong>Rate/Kg:</strong> ₹{parseFloat(lr.ratePerKg).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(lr.remarks || lr.description || lr.specialInstructions) && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '8px 12px', 
                        background: '#fef3c7', 
                        borderRadius: '6px',
                        border: '1px solid #fbbf24',
                        fontSize: '0.85rem'
                      }}>
                        <strong>Remarks:</strong> {lr.remarks || lr.description || lr.specialInstructions || 'N/A'}
                      </div>
                    )}
                    {editingManifestId && isInManifest && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '4px 8px', 
                        background: '#3b82f6', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        ✓ Already in Manifest
                      </div>
                    )}
                    {editingManifestId && !isInManifest && (
                      <div style={{ 
                        marginTop: '8px', 
                        padding: '4px 8px', 
                        background: '#10b981', 
                        color: 'white', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        display: 'inline-block'
                      }}>
                        + Add to Manifest
                      </div>
                    )}
                  </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {/* Selected LR Details Section */}
          {formData.selectedLRs.length > 0 && (
            <div className="form-section no-print" style={{ borderLeft: '4px solid #10b981' }}>
              <h2 className="section-title" style={{ color: '#10b981' }}>
                Selected LR Details ({formData.selectedLRs.length} LR{formData.selectedLRs.length !== 1 ? 's' : ''})
              </h2>
              
              {selectedLRDetails.length === 0 && formData.selectedLRs.length > 0 ? (
                <div style={{
                  padding: '20px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px solid #fbbf24',
                  color: '#92400e',
                  textAlign: 'center'
                }}>
                  ⚠️ LR data is being loaded... Please wait or refresh the page.
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
                  gap: '16px',
                  marginTop: '16px'
                }}>
                  {selectedLRDetails.map((lr) => (
                  <div
                    key={lr.id}
                    style={{
                      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                      border: '2px solid #10b981',
                      borderRadius: '12px',
                      padding: '16px',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)'
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      marginBottom: '12px',
                      paddingBottom: '12px',
                      borderBottom: '2px solid #86efac'
                    }}>
                      <div>
                        <strong className="mono" style={{ fontSize: '1.1rem', color: '#059669' }}>
                          LR: {lr.lrNumber || 'N/A'}
                        </strong>
                        {lr.referenceNumber && (
                          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '2px' }}>
                            Ref: {lr.referenceNumber}
                          </div>
                        )}
                        <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                          {lr.bookingDate || 'N/A'}
                        </div>
                      </div>
                      <span style={{
                        padding: '6px 12px',
                        background: '#10b981',
                        color: 'white',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 600
                      }}>
                        {lr.paymentMode || 'N/A'}
                      </span>
                    </div>
                    
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(2, 1fr)', 
                      gap: '12px',
                      marginBottom: '12px',
                      fontSize: '0.9rem'
                    }}>
                      <div>
                        <strong style={{ color: '#64748b' }}>From:</strong>
                        <div style={{ color: '#1e293b', fontWeight: 500, marginTop: '4px' }}>
                          {getCityName(lr.origin || '')}
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b' }}>To:</strong>
                        <div style={{ color: '#1e293b', fontWeight: 500, marginTop: '4px' }}>
                          {getCityName(lr.destination || '')}
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b' }}>Pieces:</strong>
                        <div style={{ color: '#1e293b', fontWeight: 500, marginTop: '4px' }}>
                          {lr.pieces || '0'}
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b' }}>Weight:</strong>
                        <div style={{ color: '#1e293b', fontWeight: 500, marginTop: '4px' }}>
                          {lr.weight || '0'} Kg
                        </div>
                      </div>
                    </div>
                    
                    <div style={{ 
                      marginTop: '12px', 
                      padding: '10px', 
                      background: 'white', 
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      border: '1px solid #d1fae5'
                    }}>
                      <div style={{ marginBottom: '6px' }}>
                        <strong style={{ color: '#64748b' }}>Consignor:</strong>
                        <div style={{ color: '#1e293b', marginTop: '2px' }}>
                          {lr.consignor?.name || lr.consignorName || 'N/A'}
                        </div>
                      </div>
                      <div>
                        <strong style={{ color: '#64748b' }}>Consignee:</strong>
                        <div style={{ color: '#1e293b', marginTop: '2px' }}>
                          {lr.consignee?.name || lr.consigneeName || 'N/A'}
                        </div>
                      </div>
                    </div>
                    
                    {(lr.freightAmount || lr.totalAmount || lr.rate || lr.ratePerKg) && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px', 
                        background: '#ecfdf5', 
                        borderRadius: '8px',
                        border: '1px solid #86efac',
                        fontSize: '0.85rem'
                      }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                          {lr.freightAmount && (
                            <div>
                              <strong style={{ color: '#64748b' }}>Freight:</strong>
                              <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                ₹{parseFloat(lr.freightAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                          {lr.totalAmount && (
                            <div>
                              <strong style={{ color: '#64748b' }}>Total:</strong>
                              <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                ₹{parseFloat(lr.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                          {lr.rate && (
                            <div>
                              <strong style={{ color: '#64748b' }}>Rate:</strong>
                              <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                ₹{parseFloat(lr.rate).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                          {lr.ratePerKg && (
                            <div>
                              <strong style={{ color: '#64748b' }}>Rate/Kg:</strong>
                              <div style={{ color: '#059669', fontWeight: 600, marginTop: '2px' }}>
                                ₹{parseFloat(lr.ratePerKg).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {(lr.remarks || lr.description || lr.specialInstructions) && (
                      <div style={{ 
                        marginTop: '12px', 
                        padding: '10px', 
                        background: '#fef3c7', 
                        borderRadius: '8px',
                        border: '1px solid #fbbf24',
                        fontSize: '0.85rem'
                      }}>
                        <strong style={{ color: '#92400e' }}>Remarks:</strong>
                        <div style={{ color: '#78350f', marginTop: '4px' }}>
                          {lr.remarks || lr.description || lr.specialInstructions || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                </div>
              )}
            </div>
          )}

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
                    <th style={{ width: '6%' }}>S.No</th>
                    <th style={{ width: '10%' }}>LR No.</th>
                    <th style={{ width: '15%' }}>Consignor</th>
                    <th style={{ width: '15%' }}>Consignee</th>
                    <th style={{ width: '6%' }}>Pieces</th>
                    <th style={{ width: '8%' }}>Weight (Kg)</th>
                    <th style={{ width: '8%' }}>From</th>
                    <th style={{ width: '8%' }}>To</th>
                    <th style={{ width: '6%' }}>Mode</th>
                    <th style={{ width: '10%' }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedLRDetails.map((lr, index) => {
                    const lrAmount = parseFloat(lr.totalAmount) || 0;
                    return (
                      <tr key={lr.id}>
                        <td>{index + 1}</td>
                        <td className="mono">{lr.lrNumber}</td>
                        <td>{lr.consignor?.name || lr.consignorName || 'N/A'}</td>
                        <td>{lr.consignee?.name || lr.consigneeName || 'N/A'}</td>
                        <td style={{ textAlign: 'center' }}>{lr.pieces || '0'}</td>
                        <td style={{ textAlign: 'right' }}>{lr.weight || '0'}</td>
                        <td>{getCityName(lr.origin)}</td>
                        <td>{getCityName(lr.destination)}</td>
                        <td style={{ fontSize: '0.75rem', fontWeight: 600 }}>{lr.paymentMode || 'N/A'}</td>
                        <td style={{ textAlign: 'right' }}>{lrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    );
                  })}
                  <tr style={{ fontWeight: 600, background: '#f1f5f9' }}>
                    <td colSpan="4" style={{ textAlign: 'right' }}>TOTAL:</td>
                    <td style={{ textAlign: 'center' }}>{manifestSummary.totalPieces}</td>
                    <td style={{ textAlign: 'right' }}>{manifestSummary.totalWeight.toFixed(2)}</td>
                    <td colSpan="3"></td>
                    <td style={{ textAlign: 'right' }}>
                      {(manifestSummary.totalPaid + manifestSummary.totalToPay + manifestSummary.totalTBB).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px' }}>
                <div>
                  <strong>Paid:</strong> ₹{manifestSummary.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div>
                  <strong>To Pay:</strong> ₹{manifestSummary.totalToPay.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div>
                  <strong>TBB:</strong> ₹{manifestSummary.totalTBB.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div>
                  <strong>Grand Total:</strong> ₹{(manifestSummary.totalPaid + manifestSummary.totalToPay + manifestSummary.totalTBB).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
