import React, { useState, useEffect, useRef } from 'react';
import { Save, Trash2, AlertCircle, Lock, Edit2, Printer, Search, Eye, Calculator, Plus, Home, ArrowLeft } from 'lucide-react';
import LRPrintView from './lr-print-view.jsx';
import { useLRBookings } from './hooks/useDataSync';
import { apiService } from './utils/apiService';
import syncService from './utils/sync-service';

const parseMaybeJson = (value) => {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  const t = value.trim();
  if (!t) return value;
  try { return JSON.parse(t); } catch { return value; }
};

export default function LRModifyForm() {
  // Use API hook for LR bookings
  const { data: allLRBookings, loading: lrLoading, loadData: loadLRBookings } = useLRBookings();
  
  const [lrBookings, setLrBookings] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [pods, setPods] = useState([]);
  const [currentLR, setCurrentLR] = useState(null);
  const [editMode, setEditMode] = useState('full'); // 'full', 'charges-only', 'none' - internal edit permissions
  const [viewMode, setViewMode] = useState('view'); // 'view', 'edit', 'delete' - user action mode
  const [formData, setFormData] = useState(null);
  const [tbbClients, setTbbClients] = useState([]);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [clientRates, setClientRates] = useState([]);
  const [showPrintView, setShowPrintView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLRId, setSelectedLRId] = useState(null);
  const [selectedLRKey, setSelectedLRKey] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userBranch, setUserBranch] = useState(null);
  const [showCFTCalculator, setShowCFTCalculator] = useState(false);
  const [cftEntries, setCftEntries] = useState([{
    id: 1,
    length: '',
    width: '',
    height: '',
    pieces: 1,
    unit: 'cm',
    factor: 6
  }]);

  // City search state
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [originDropdownIndex, setOriginDropdownIndex] = useState(-1);
  const [destinationDropdownIndex, setDestinationDropdownIndex] = useState(-1);

  // Refs to track manual freight entry and previous values
  const lastCalculatedFreight = useRef(0);
  const lastPieces = useRef(0);
  const lastWeight = useRef(0);
  const lastCFT = useRef(0);
  const lastRate = useRef(0);
  const lastCalculationMethod = useRef('');
  const isFreightManual = useRef(false);

  useEffect(() => {
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    const userIsAdmin = user?.role === 'Admin' || user?.role === 'Super Admin';
    setIsAdmin(userIsAdmin);
    
    // Get user's branch
    if (user && !userIsAdmin) {
      // For non-admin users, get branch from user object or from selectedBranch in localStorage
      const selectedBranchId = localStorage.getItem('adminSelectedBranch');
      const userBranchId = user.branch || selectedBranchId;
      setUserBranch(userBranchId);
    } else {
      setUserBranch(null); // Admin can see all branches
    }
    
    // Load LR data from API
    loadLRData();
  }, [isAdmin, userBranch]);
  
  // Update lrBookings when allLRBookings changes
  useEffect(() => {
    // LR list is loaded via loadLRData (combines lrBookings + ptlLRBookings + ftlLRBookings).
    // Do not overwrite combined list from hook updates.
  }, [allLRBookings, isAdmin, userBranch]);

  // Helper function to check if LR belongs to user's branch
  const isLRFromUserBranch = (lr) => {
    if (isAdmin) return true; // Admin can see all LRs
    if (!userBranch) return false; // If user has no branch, can't see any
    
    // Check if LR's branch matches user's branch
    const lrBranch = lr.branch || lr.bookingBranch;
    return lrBranch?.toString() === userBranch.toString();
  };

  const loadLRData = async () => {
    try {
      // Load all LR tables + other data from API
      const [
        baseLRs,
        ptlLRs,
        ftlLRs,
        allManifests,
        allInvoices,
        allPods,
        allClients,
        allCities,
        allBranches,
        allClientRates
      ] = await Promise.all([
        apiService.getLRBookings().catch(() => []),
        apiService.getPTLLRBookings().catch(() => []),
        apiService.getFTLLRBookings().catch(() => []),
        apiService.getManifests().catch(() => []),
        apiService.getInvoices().catch(() => []),
        apiService.getPODs().catch(() => []),
        apiService.getClients().catch(() => []),
        apiService.getCities().catch(() => []),
        apiService.getBranches().catch(() => []),
        syncService.load('clientRates').catch(() => ({ data: [] }))
      ]);

      const combinedLRs = [
        ...(baseLRs || []).map(lr => ({ ...lr, __table: 'lrBookings', bookingMode: lr.bookingMode || 'PTL', __key: `lrBookings:${lr.id}` })),
        ...(ptlLRs || []).map(lr => ({ ...lr, __table: 'ptlLRBookings', bookingMode: 'PTL', __key: `ptlLRBookings:${lr.id}` })),
        ...(ftlLRs || []).map(lr => ({ ...lr, __table: 'ftlLRBookings', bookingMode: 'FTL', __key: `ftlLRBookings:${lr.id}` })),
      ];
      
      // Filter LRs by branch for non-admin users and exclude deleted LRs
      const filteredLRs = (isAdmin ? combinedLRs : (combinedLRs || []).filter(lr => isLRFromUserBranch(lr)))
        .filter(lr => {
          // Exclude deleted LRs
          return lr.status !== 'Deleted' && !lr.deletedAt && lr.status !== 'deleted';
        });
      
      setLrBookings(filteredLRs || []);
      setManifests(allManifests || []);
      setInvoices(allInvoices || []);
      setPods(allPods || []);
      setTbbClients((allClients || []).filter(c => c.status === 'Active'));
      setCities(allCities || []);
      setBranches(allBranches || []);
      const rawRates = Array.isArray(allClientRates) ? allClientRates : (allClientRates?.data || []);
      const hydratedRates = (rawRates || []).map(r => {
        const payload = parseMaybeJson(r?.data);
        if (payload && typeof payload === 'object') {
          return { ...payload, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, clientId: payload.clientId ?? r.clientId, clientCode: payload.clientCode ?? r.clientCode };
        }
        return r;
      });
      setClientRates((hydratedRates || []).filter(r => (r.status === 'Active' || !r.status)));

      // Get LR key from sessionStorage (set by search component) or selected key/id
      const editKey = sessionStorage.getItem('editLRKey') || selectedLRKey || sessionStorage.getItem('editLRId') || selectedLRId;
      if (editKey) {
        let lr = null;
        if (String(editKey).includes(':')) {
          const [tbl, id] = String(editKey).split(':');
          lr = (filteredLRs || []).find(l => l.__table === tbl && l.id && l.id.toString() === id.toString());
        } else {
          lr = (filteredLRs || []).find(l => l.id && l.id.toString() === String(editKey));
        }
        if (lr) {
          // Check if user has permission to view this LR
          const lrBranch = lr.branch || lr.bookingBranch;
          const canView = isAdmin || !userBranch || lrBranch?.toString() === userBranch.toString();
          
          if (!canView) {
            alert('⚠️ You can only view LRs booked by your branch.');
            sessionStorage.removeItem('editLRId');
            sessionStorage.removeItem('editLRKey');
            return;
          }
          
          setCurrentLR(lr);
          setFormData({ ...lr });
          setViewMode('view'); // Reset to view mode when loading LR
          checkEditPermissions(lr, allManifests, allInvoices, allPods);
          
          // Initialize refs with current LR values
          lastPieces.current = parseFloat(lr.pieces) || 0;
          lastWeight.current = parseFloat(lr.weight) || 0;
          lastCFT.current = parseFloat(lr.calculatedCFT) || 0;
          lastRate.current = parseFloat(lr.charges?.rate) || 0;
          lastCalculationMethod.current = lr.charges?.calculationMethod || 'by-weight';
          lastCalculatedFreight.current = parseFloat(lr.charges?.freightRate) || 0;
          isFreightManual.current = false;
          
          // Set selected origin and destination cities
          // Try multiple ways to find the city (ID, code, cityName, fromLocation/toLocation)
          if (lr.origin || lr.fromLocation) {
            const originValue = lr.origin || lr.fromLocation;
            let originCity = null;
            
            // Try to find by ID
            if (originValue) {
              originCity = allCities.find(c => 
                c.id?.toString() === originValue.toString() || 
                c.code === originValue || 
                c.code?.toString() === originValue.toString() ||
                c.cityName === originValue ||
                c.cityName?.toLowerCase() === String(originValue).toLowerCase()
              );
            }
            
            if (originCity) {
              setSelectedOrigin(originCity);
              setOriginSearch(originCity.cityName);
              // Ensure formData.origin is set to city ID
              setFormData(prev => ({ ...prev, origin: originCity.id.toString() }));
            } else if (originValue) {
              // If city not found, still set the search field with the value
              setOriginSearch(String(originValue));
              setFormData(prev => ({ ...prev, origin: String(originValue) }));
            }
          }
          
          if (lr.destination || lr.toLocation) {
            const destValue = lr.destination || lr.toLocation;
            let destCity = null;
            
            // Try to find by ID
            if (destValue) {
              destCity = allCities.find(c => 
                c.id?.toString() === destValue.toString() || 
                c.code === destValue || 
                c.code?.toString() === destValue.toString() ||
                c.cityName === destValue ||
                c.cityName?.toLowerCase() === String(destValue).toLowerCase()
              );
            }
            
            if (destCity) {
              setSelectedDestination(destCity);
              setDestinationSearch(destCity.cityName);
              // Ensure formData.destination is set to city ID
              setFormData(prev => ({ ...prev, destination: destCity.id.toString() }));
            } else if (destValue) {
              // If city not found, still set the search field with the value
              setDestinationSearch(String(destValue));
              setFormData(prev => ({ ...prev, destination: String(destValue) }));
            }
          }
        }
      }
      if (sessionStorage.getItem('editLRId')) {
        sessionStorage.removeItem('editLRId');
      }
    } catch (error) {
      console.error('Error loading LR data:', error);
    }
  };

  // Load data when component mounts or when dependencies change
  useEffect(() => {
    if (isAdmin !== null && userBranch !== undefined) {
      loadLRData();
    }
  }, [isAdmin, userBranch]);
  
  // Reload when selected LR changes
  useEffect(() => {
    if (selectedLRId) {
      loadLRData();
    }
  }, [selectedLRId]);

  // Update city search fields when cities are loaded and formData has origin/destination
  useEffect(() => {
    if (formData && cities.length > 0) {
      // Update origin if formData.origin exists but selectedOrigin is not set
      if (formData.origin && !selectedOrigin) {
        const originValue = formData.origin;
        const originCity = cities.find(c => 
          c.id?.toString() === originValue.toString() || 
          c.code === originValue || 
          c.code?.toString() === originValue.toString() ||
          c.cityName === originValue ||
          c.cityName?.toLowerCase() === String(originValue).toLowerCase()
        );
        if (originCity) {
          setSelectedOrigin(originCity);
          setOriginSearch(originCity.cityName);
        } else if (originValue) {
          // If city not found, try getCityName helper
          const cityName = getCityName(originValue);
          if (cityName && cityName !== originValue) {
            setOriginSearch(cityName);
          } else {
            setOriginSearch(String(originValue));
          }
        }
      }
      
      // Update destination if formData.destination exists but selectedDestination is not set
      if (formData.destination && !selectedDestination) {
        const destValue = formData.destination;
        const destCity = cities.find(c => 
          c.id?.toString() === destValue.toString() || 
          c.code === destValue || 
          c.code?.toString() === destValue.toString() ||
          c.cityName === destValue ||
          c.cityName?.toLowerCase() === String(destValue).toLowerCase()
        );
        if (destCity) {
          setSelectedDestination(destCity);
          setDestinationSearch(destCity.cityName);
        } else if (destValue) {
          // If city not found, try getCityName helper
          const cityName = getCityName(destValue);
          if (cityName && cityName !== destValue) {
            setDestinationSearch(cityName);
          } else {
            setDestinationSearch(String(destValue));
          }
        }
      }
    }
  }, [cities, formData?.origin, formData?.destination]);
    
  // Listen for storage changes to reload when LR is updated elsewhere
  useEffect(() => {
    const handleStorageChange = () => {
      loadLRData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Helper function to get city name from ID or code
  const getCityName = (cityValue) => {
    if (!cityValue) return '';
    const city = cities.find(c => 
      c.id?.toString() === cityValue.toString() || 
      c.code === cityValue || 
      c.code?.toString() === cityValue.toString()
    );
    return city ? city.cityName : cityValue;
  };

  // Helper function to get city ID from stored value (could be ID or code)
  const getCityId = (cityValue) => {
    if (!cityValue) return '';
    const city = cities.find(c => 
      c.id?.toString() === cityValue.toString() || 
      c.code === cityValue || 
      c.code?.toString() === cityValue.toString()
    );
    return city ? city.id.toString() : cityValue;
  };

  const checkEditPermissions = (lr, allManifests, allInvoices, allPods) => {
    // Check if LR is in any manifest
    const inManifest = allManifests.some(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lr.id;
      })
    );
    
    // Check if LR has POD
    const hasPOD = allPods.some(pod => 
      pod.lrNumber === lr.id.toString() || pod.lrNumber === lr.lrNumber
    );
    
    // Check if LR is billed/invoiced
    const isBilled = allInvoices.some(inv => 
      inv.lrNumbers?.includes(lr.lrNumber) || 
      inv.lrNumbers?.some(ln => ln === lr.lrNumber) ||
      inv.lrDetails?.some(ld => ld.id === lr.id || ld.lrNumber === lr.lrNumber)
    );

    // Edit permissions:
    // - Full edit: Not manifested, not POD, not billed
    // - Charges only: Manifested but not billed (can edit freight, loading/unloading charges)
    // - Charges only (after POD): Has POD but not billed (can edit freight, loading/unloading charges)
    // - None: Billed/invoiced
    if (isBilled) {
      setEditMode('none');
    } else if (inManifest || hasPOD) {
      setEditMode('charges-only'); // Can edit charges till invoicing
    } else {
      setEditMode('full');
    }
  };

  const calculateTotals = () => {
    if (!formData || !formData.charges) return;
    
    const { rate, freightRate, lrCharges, hamali, pickupCharges, deliveryCharges, odaCharges, other, waraiUnion, gstPercent } = formData.charges;
    
    // Rate is per-piece/per-kg rate, not an amount. Only freightRate (calculated amount) should be included
    // Always use separate pickup and delivery charges
    const pickupDeliveryTotal = (parseFloat(pickupCharges) || 0) + (parseFloat(deliveryCharges) || 0);
    const subtotal = (parseFloat(freightRate) || 0) + 
                     (parseFloat(lrCharges) || 0) + 
                     (parseFloat(hamali) || 0) + 
                     pickupDeliveryTotal + 
                     (parseFloat(odaCharges) || 0) + 
                     (parseFloat(other) || 0) + 
                     (parseFloat(waraiUnion) || 0);
    
    let gstRate = 0;
    if (gstPercent === 'exempted') {
      gstRate = 0;
    } else if (gstPercent === '5-rcm') {
      gstRate = 5;
    } else {
      gstRate = parseFloat(gstPercent) || 0;
    }
    
    const gst = (subtotal * gstRate) / 100;
    
    setFormData(prev => ({
      ...prev,
      totalAmount: subtotal + gst,
      gstAmount: gst
    }));
  };

  // Fetch rates from Rate Master for TBB clients
  useEffect(() => {
    if (!formData || !formData.charges) return;
    
    // Only fetch rates for TBB clients in PTL mode
    if (formData.paymentMode === 'TBB' && formData.bookingMode !== 'FTL' && formData.tbbClient && formData.origin && formData.destination && clientRates.length > 0 && cities.length > 0) {
      const client = tbbClients.find(c => c.id?.toString() === formData.tbbClient || c.code === formData.tbbClient);
      const originCity = cities.find(c => c.id?.toString() === formData.origin || c.code === formData.origin);
      const destCity = cities.find(c => c.id?.toString() === formData.destination || c.code === formData.destination);
      
      if (client && originCity && destCity) {
        const matchingRate = clientRates.find(rate => {
          if (rate.status !== 'Active') return false;
          
          const rateClientId = rate.clientId?.toString();
          const rateClientCode = rate.clientCode;
          const clientMatches = rateClientId === client.id?.toString() || 
                               rateClientId === client.code ||
                               rateClientCode === client.code ||
                               rateClientCode === client.id?.toString();
          
          if (!clientMatches) return false;
          
          // Format 1: Simple structure
          if (rate.origin && rate.destination) {
            return rate.origin === originCity.code && rate.destination === destCity.code;
          }
          
          // Format 2: City Wise Rates
          if (rate.cityWiseRates && rate.cityWiseRates.length > 0) {
            return rate.cityWiseRates.some(cr => {
              const crOrigin = cities.find(c => c.id?.toString() === cr.originCity || c.code === cr.originCity);
              const crDest = cities.find(c => c.id?.toString() === cr.destinationCity || c.code === cr.destinationCity);
              return crOrigin?.code === originCity.code && crDest?.code === destCity.code;
            });
          }
          
          // Format 3: Per Box Rates
          if (rate.perBoxRates && rate.perBoxRates.length > 0) {
            return rate.perBoxRates.some(pbr => {
              if (pbr.applyToState && pbr.applyToState !== '') {
                return originCity.state === pbr.applyToState && destCity.state === pbr.applyToState;
              }
              if (pbr.originCity && pbr.destinationCity) {
                const pbrOrigin = cities.find(c => c.id?.toString() === pbr.originCity || c.code === pbr.originCity);
                const pbrDest = cities.find(c => c.id?.toString() === pbr.destinationCity || c.code === pbr.destinationCity);
                if (pbrOrigin && pbrDest) {
                  return pbrOrigin.code === originCity.code && pbrDest.code === destCity.code;
                }
              }
              return false;
            });
          }
          
          return false;
        });
        
        if (matchingRate) {
          let rateValue = 0;
          let autoCalculationMethod = formData.charges.calculationMethod;
          let cityRate = null;
          let matchedPerBoxRate = null;
          
          const rateType = matchingRate.rateType;
          
          // Format 1: Simple structure
          if (matchingRate.ratePerKg || matchingRate.ratePerBox) {
            if (matchingRate.ratePerKg && !matchingRate.ratePerBox) {
              autoCalculationMethod = 'by-weight';
              rateValue = parseFloat(matchingRate.ratePerKg) || 0;
            } else if (matchingRate.ratePerBox && !matchingRate.ratePerKg) {
              autoCalculationMethod = 'per-piece';
              rateValue = parseFloat(matchingRate.ratePerBox) || 0;
            } else if (matchingRate.ratePerBox && matchingRate.ratePerKg) {
              if (rateType === 'city-wise' || rateType === 'weight-slab') {
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(matchingRate.ratePerKg) || 0;
              } else {
                autoCalculationMethod = 'per-piece';
                rateValue = parseFloat(matchingRate.ratePerBox) || 0;
              }
            }
          }
          // Format 2: City Wise Rates
          else if (matchingRate.cityWiseRates && matchingRate.cityWiseRates.length > 0) {
            cityRate = matchingRate.cityWiseRates.find(cr => {
              const crOrigin = cities.find(c => c.id?.toString() === cr.originCity || c.code === cr.originCity);
              const crDest = cities.find(c => c.id?.toString() === cr.destinationCity || c.code === cr.destinationCity);
              return crOrigin?.code === originCity.code && crDest?.code === destCity.code;
            });
            
            if (cityRate) {
              if (cityRate.ratePerKg && !cityRate.ratePerBox) {
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(cityRate.ratePerKg) || 0;
              } else if (cityRate.ratePerBox && !cityRate.ratePerKg) {
                autoCalculationMethod = 'per-piece';
                rateValue = parseFloat(cityRate.ratePerBox) || 0;
              } else if (cityRate.ratePerBox && cityRate.ratePerKg) {
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(cityRate.ratePerKg) || 0;
              }
            }
          }
          // Format 3: Per Box Rates
          else if (matchingRate.perBoxRates && matchingRate.perBoxRates.length > 0) {
            matchedPerBoxRate = matchingRate.perBoxRates.find(pbr => {
              if (pbr.applyToState && pbr.applyToState !== '') {
                return originCity.state === pbr.applyToState && destCity.state === pbr.applyToState;
              }
              if (pbr.originCity && pbr.destinationCity) {
                const pbrOrigin = cities.find(c => c.id?.toString() === pbr.originCity || c.code === pbr.originCity);
                const pbrDest = cities.find(c => c.id?.toString() === pbr.destinationCity || c.code === pbr.destinationCity);
                if (pbrOrigin && pbrDest) {
                  return pbrOrigin.code === originCity.code && pbrDest.code === destCity.code;
                }
              }
              return false;
            });
            
            if (matchedPerBoxRate && matchedPerBoxRate.ratePerBox) {
              autoCalculationMethod = 'per-piece';
              rateValue = parseFloat(matchedPerBoxRate.ratePerBox) || 0;
            }
          }
          
          if (rateValue > 0) {
            setFormData(prev => ({
              ...prev,
              deliveryType: matchingRate.deliveryType && (matchingRate.deliveryType === 'Godown' || matchingRate.deliveryType === 'Door')
                ? matchingRate.deliveryType
                : prev.deliveryType,
              charges: {
                ...prev.charges,
                calculationMethod: autoCalculationMethod,
                rate: rateValue.toString(),
                minimumFreight: matchedPerBoxRate && matchedPerBoxRate.minimumFreight 
                  ? matchedPerBoxRate.minimumFreight.toString() 
                  : (prev.charges.minimumFreight || ''),
                lrCharges: matchingRate.lrCharges ? matchingRate.lrCharges.toString() : (prev.charges.lrCharges || ''),
                odaCharges: matchingRate.odaCharges ? matchingRate.odaCharges.toString() : (prev.charges.odaCharges || ''),
                pickupCharges: matchingRate.pickupCharges ? matchingRate.pickupCharges.toString() : (prev.charges.pickupCharges || ''),
                deliveryCharges: matchingRate.deliveryCharges ? matchingRate.deliveryCharges.toString() : (prev.charges.deliveryCharges || ''),
                waraiUnion: matchingRate.waraiCharges ? matchingRate.waraiCharges.toString() : (prev.charges.waraiUnion || ''),
                other: matchingRate.otherCharges ? matchingRate.otherCharges.toString() : (prev.charges.other || ''),
                gstPercent: matchingRate.gstPercent || prev.charges.gstPercent || '5-rcm'
              }
            }));
          }
        }
      }
    }
  }, [formData?.paymentMode, formData?.tbbClient, formData?.origin, formData?.destination, clientRates, cities, tbbClients]);

  // Auto-calculate freight based on rate and calculation method (Per Piece or Per KG)
  useEffect(() => {
    if (!formData || !formData.charges) return;
    
    // Skip auto-calculation for FTL mode (freight is entered directly)
    if (formData.bookingMode === 'FTL') {
      calculateTotals();
      return;
    }
    
    const rate = parseFloat(formData.charges.rate) || 0;
    const pieces = parseFloat(formData.pieces) || 0;
    const actualWeight = parseFloat(formData.weight) || 0;
    const calculatedCFT = parseFloat(formData.calculatedCFT) || 0;
    const currentFreight = parseFloat(formData.charges.freightRate) || 0;
    const calculationMethod = formData.charges.calculationMethod || 'by-weight';

    // Check if pieces, weight, rate, or calculation method changed (always recalculate if they changed)
    const piecesChanged = pieces !== lastPieces.current;
    const weightChanged = actualWeight !== lastWeight.current || calculatedCFT !== lastCFT.current;
    const rateChanged = rate !== lastRate.current;
    const methodChanged = calculationMethod !== lastCalculationMethod.current;
    const shouldRecalculate = piecesChanged || weightChanged || rateChanged || methodChanged;

    // Update refs for tracking changes
    if (piecesChanged) lastPieces.current = pieces;
    if (weightChanged) {
      lastWeight.current = actualWeight;
      lastCFT.current = calculatedCFT;
    }
    if (rateChanged) lastRate.current = rate;
    if (methodChanged) lastCalculationMethod.current = calculationMethod;

    // If freight was manually entered and only non-critical fields changed, keep manual value
    if (isFreightManual.current && !shouldRecalculate && rate > 0) {
      // Only non-critical fields changed, keep manual freight but recalculate totals
      calculateTotals();
      return;
    }

    if (rate > 0) {
      let calculatedFreight = 0;
      
      if (calculationMethod === 'per-piece') {
        // Per Piece calculation: Rate × Number of Pieces
        if (pieces > 0) {
          calculatedFreight = rate * pieces;
          
          // Apply minimum freight if specified (for per-box rates from Rate Master)
          const minimumFreight = parseFloat(formData.charges.minimumFreight) || 0;
          if (minimumFreight > 0 && calculatedFreight < minimumFreight) {
            calculatedFreight = minimumFreight;
          }
        }
      } else {
        // Per KG calculation: Rate × Weight
        // calculatedCFT already contains the CFT weight in kg
        const cftWeight = parseFloat(calculatedCFT) || 0;
        
        // Compare CFT weight with actual weight, use whichever is higher
        const chargedWeight = cftWeight > actualWeight ? cftWeight : actualWeight;
        
        if (chargedWeight > 0) {
          calculatedFreight = rate * chargedWeight;
        }
      }

      // Auto-update freight if:
      // 1. Freight is currently 0 (empty), OR
      // 2. Pieces, weight, or rate changed (always recalculate), OR
      // 3. Current freight matches the previous calculation (within 0.01) - meaning it was auto-calculated
      if (calculatedFreight > 0) {
        const shouldUpdate = currentFreight === 0 || 
                             shouldRecalculate ||
                             Math.abs(currentFreight - lastCalculatedFreight.current) < 0.01;
        
        if (shouldUpdate) {
          setFormData(prev => ({
            ...prev,
            charges: {
              ...prev.charges,
              freightRate: (parseFloat(calculatedFreight) || 0).toFixed(2)
            }
          }));
          
          // Update refs
          lastCalculatedFreight.current = calculatedFreight;
          lastPieces.current = pieces;
          lastWeight.current = actualWeight;
          lastCFT.current = calculatedCFT;
          isFreightManual.current = false; // Reset manual flag after auto-calculation
        }
      }
    }
    
    // Always recalculate totals after freight calculation
    calculateTotals();
  }, [
    formData?.paymentMode, 
    formData?.charges?.rate, 
    formData?.charges?.calculationMethod, 
    formData?.charges?.minimumFreight,
    formData?.pieces, 
    formData?.weight, 
    formData?.calculatedCFT,
    formData?.bookingMode,
    formData?.origin,
    formData?.destination,
    formData?.tbbClient
  ]);

  // Recalculate totals when any charge field changes (excluding rate which is handled above)
  useEffect(() => {
    if (formData && formData.charges) {
      calculateTotals();
    }
  }, [
    formData?.charges?.freightRate,
    formData?.charges?.lrCharges,
    formData?.charges?.hamali,
    formData?.charges?.pickupCharges,
    formData?.charges?.deliveryCharges,
    formData?.charges?.pickupDelivery,
    formData?.charges?.odaCharges,
    formData?.charges?.other,
    formData?.charges?.waraiUnion,
    formData?.charges?.gstPercent
  ]);

  // Load cftEntries from formData when editing
  useEffect(() => {
    if (formData && formData.cftEntries && formData.cftEntries.length > 0) {
      setCftEntries(formData.cftEntries);
    } else if (formData && formData.cftDimensions) {
      // Convert old format to new format
      setCftEntries([{
        id: 1,
        length: formData.cftDimensions.length || '',
        width: formData.cftDimensions.width || '',
        height: formData.cftDimensions.height || '',
        pieces: formData.pieces || 1,
        unit: formData.cftDimensions.unit || 'cm',
        factor: formData.cftDimensions.factor || 6
      }]);
    }
  }, [formData]);

  // Calculate CFT weight for a single entry
  const calculateCFTWeightForEntry = (entry) => {
    const l = parseFloat(entry.length) || 0;
    const b = parseFloat(entry.width) || 0;
    const h = parseFloat(entry.height) || 0;
    const pieces = parseFloat(entry.pieces) || 0;
    const factorValue = parseInt(entry.factor) || 6;

    if (!l || !b || !h || !pieces) return 0;

    let cftWeight = 0;
    if (entry.unit === 'cm') {
      // CM: (L×B×H)/5000 × pieces = CFT Weight
      cftWeight = ((l * b * h) / 5000) * pieces;
    } else {
      // Inches: ((L×B×H)/1728 × factor) × pieces = CFT Weight
      const cftVolume = (l * b * h) / 1728;
      cftWeight = (cftVolume * factorValue) * pieces;
    }

    return cftWeight;
  };

  // Calculate total CFT weight from all entries
  const calculateTotalCFTWeight = () => {
    return cftEntries.reduce((total, entry) => {
      return total + calculateCFTWeightForEntry(entry);
    }, 0);
  };

  const addCFTEntry = () => {
    const newId = Math.max(...cftEntries.map(e => e.id), 0) + 1;
    setCftEntries([...cftEntries, {
      id: newId,
      length: '',
      width: '',
      height: '',
      pieces: 1,
      unit: 'cm',
      factor: 6
    }]);
  };

  const removeCFTEntry = (id) => {
    if (cftEntries.length > 1) {
      setCftEntries(cftEntries.filter(entry => entry.id !== id));
    }
  };

  const updateCFTEntry = (id, field, value) => {
    setCftEntries(cftEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateTotalPieces = () => {
    return cftEntries.reduce((total, entry) => {
      return total + (parseFloat(entry.pieces) || 0);
    }, 0);
  };

  const applyCFTCalculation = () => {
    const totalPieces = calculateTotalPieces();
    const lrPieces = parseFloat(formData?.pieces) || 0;
    
    if (lrPieces > 0 && totalPieces !== lrPieces) {
      alert(`⚠️ Total pieces in CFT calculator (${totalPieces}) must exactly equal pieces entered in LR form (${lrPieces}). Please adjust the pieces in CFT entries to match exactly.`);
      return;
    }
    
    const totalCFTWeight = calculateTotalCFTWeight();
    setFormData(prev => ({ 
      ...prev, 
      calculatedCFT: (parseFloat(totalCFTWeight) || 0).toFixed(2),
      cftEntries: cftEntries // Save entries for print view
    }));
    // Update CFT ref to trigger freight recalculation
    lastCFT.current = totalCFTWeight;
    setShowCFTCalculator(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData || !currentLR) return;

    if (viewMode !== 'edit') {
      alert('⚠️ Please switch to Edit mode to save changes.');
      return;
    }

    if (editMode === 'none') {
      alert('⚠️ This LR cannot be edited. It has been billed.');
      return;
    }

    // Check if user has permission to edit this LR (branch check)
    if (!isLRFromUserBranch(currentLR)) {
      alert('⚠️ You can only modify LRs booked by your branch.');
      return;
    }

    // Find LR from current state (from API)
    const lrToUpdate = lrBookings.find(lr => lr.id === currentLR.id);
    
    if (!lrToUpdate) {
      // Try to find in allLRBookings as fallback
      const lrInAll = allLRBookings?.find(lr => lr.id === currentLR.id);
      if (!lrInAll) {
        alert('⚠️ LR not found! Please refresh the page and try again.');
        return;
      }
    }

    try {
      // Prepare update data - filter out UI-only fields and map to database columns
      const filterUpdateData = (data) => {
        // Fields to exclude (UI-only or not in database schema)
        // Only include basic fields that are definitely in the database
        const excludeFields = [
          'lrMode', // UI-only field for auto/manual LR number generation
          'bookingMode', // May not be in schema (FTL/PTL)
          'selectedOrigin', // UI state
          'selectedDestination', // UI state
          'showOriginDropdown', // UI state
          'showDestinationDropdown', // UI state
          'originDropdownIndex', // UI state
          'destinationDropdownIndex', // UI state
          'showCFTCalculator', // UI state
          'expandedLR', // UI state
          'podFormData', // UI state
        ];
        
        // Fields that might not exist as direct columns - store in data column
        // These are fields that may not be in the basic database schema
        // Only basic fields like id, lrNumber, date, status, createdAt, updatedAt should be direct columns
        const fieldsToStoreInData = [
          'vehicleNumber',
          'driverName',
          'vehicle',
          'driver',
          'vehicleId',
          'driverId',
          'expectedDeliveryDate',
          'pickupDate',
          'deliveryDate',
          'bookingDate',
          'lrDate',
          'invoiceNumber',
          'ewaybillNumber',
          'ewaybillDate',
          'lrReferenceNumber',
          'referenceNumber',
          'bookingBranch',
          'branch',
          'origin',
          'destination',
          'fromLocation',
          'toLocation',
          'pieces',
          'weight',
          'calculatedCFT',
          'totalAmount',
          'gstAmount',
          'paymentMode',
          'tbbClient',
          'freightRate',
          'remarks',
          'code',
          'clientName',
          'clientId',
        ];
        
        // Fields that should be stored in 'data' column as JSON (complex objects)
        const jsonFields = [
          'consignor',
          'consignee',
          'charges',
          'cftEntries',
          'deliveryPoints',
          'pickupPoints',
          'nearbyCities',
          'odaLocations',
          'contactDetails',
          'address',
          'bankDetails',
        ];
        
        const filtered = {};
        const dataColumn = {};
        
        // Only these basic fields should be direct columns in the database
        const allowedDirectColumns = ['id', 'lrNumber', 'date', 'status', 'createdAt', 'updatedAt', 'data'];
        
        Object.keys(data).forEach(key => {
          // Exclude UI-only fields
          if (excludeFields.includes(key)) return;
          
          // Exclude undefined values
          if (data[key] === undefined) return;
          
          // Exclude null values for optional fields (except id and lrNumber)
          if (data[key] === null && !['id', 'lrNumber'].includes(key)) return;
          
          // Only allow basic schema fields as direct columns
          if (!allowedDirectColumns.includes(key)) {
            // Store everything else in data column
            if (fieldsToStoreInData.includes(key) || jsonFields.includes(key) || 
                (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key]) && !(data[key] instanceof Date) && !(data[key] instanceof String))) {
              dataColumn[key] = data[key];
            } else {
              // Even simple fields that aren't in the basic schema go to data column
              dataColumn[key] = data[key];
            }
            return;
          }
          
          // Include only allowed direct columns
          filtered[key] = data[key];
        });
        
        // If we have complex data, store it in 'data' column
        if (Object.keys(dataColumn).length > 0) {
          // Merge with existing data column if present
          const existingData = typeof filtered.data === 'string' ? JSON.parse(filtered.data) : (filtered.data || {});
          filtered.data = JSON.stringify({ ...existingData, ...dataColumn });
        }
        
        return filtered;
      };
      
      let updateData;
      if (editMode === 'charges-only') {
        // Charges-only mode - only update charges
        updateData = filterUpdateData({
          ...currentLR,
          charges: formData.charges,
          totalAmount: formData.totalAmount,
          gstAmount: formData.gstAmount,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Full edit mode - update everything (but filter out UI fields)
        updateData = filterUpdateData({
          ...formData,
          cftEntries: cftEntries, // Include CFT entries for dimensions
          updatedAt: new Date().toISOString()
        });
      }

      // Update via correct LR table
      const table = currentLR.__table || 'lrBookings';
      const result =
        table === 'ftlLRBookings'
          ? await apiService.updateFTLLRBooking(currentLR.id, updateData)
          : table === 'ptlLRBookings'
            ? await apiService.updatePTLLRBooking(currentLR.id, updateData)
            : await apiService.updateLRBooking(currentLR.id, updateData);
      
      if (result && result.success !== false) {
        // Reload LR data from API (combined)
        await loadLRData();

        // Find and set the updated LR
        const updatedLR = lrBookings?.find(lr => (lr.__table || 'lrBookings') === table && lr.id === currentLR.id) || result.data;
        if (updatedLR) {
          setCurrentLR(updatedLR);
          setFormData({ ...updatedLR });
        }
        
        alert(`✅ LR ${editMode === 'charges-only' ? 'charges' : 'details'} updated successfully!`);
        
        // Switch back to view mode after successful update
        setViewMode('view');
      } else {
        throw new Error(result?.error || 'Update failed');
      }
    } catch (error) {
      console.error('Error updating LR:', error);
      alert(`❌ Failed to update LR: ${error.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async () => {
    if (!currentLR) return;

    // Check if manifested
    const inManifest = manifests.some(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === currentLR.id;
      })
    );

    if (inManifest) {
      alert('⚠️ Cannot delete this LR. It has been manifested. Deletion is only allowed before manifesting.');
      setViewMode('view');
      return;
    }

    // Check if billed
    const isBilled = invoices.some(inv => 
      inv.lrNumbers?.includes(currentLR.lrNumber) || 
      inv.lrNumbers?.some(ln => ln === currentLR.lrNumber) ||
      inv.lrDetails?.some(ld => ld.id === currentLR.id || ld.lrNumber === currentLR.lrNumber)
    );

    if (isBilled) {
      alert('⚠️ Cannot delete this LR. It has been billed. Deletion is only allowed before manifesting.');
      setViewMode('view');
      return;
    }

    // Delete confirmation is already shown in the delete mode UI
    try {
      // Delete via correct LR table
      const table = currentLR.__table || 'lrBookings';
      const result =
        table === 'ftlLRBookings'
          ? await apiService.deleteFTLLRBooking(currentLR.id)
          : table === 'ptlLRBookings'
            ? await apiService.deletePTLLRBooking(currentLR.id)
            : await apiService.deleteLRBooking(currentLR.id);
      
      if (result && result.success !== false) {
        // Reload LR data from API (combined)
        await loadLRData();
        
        // Clear current LR selection
        setCurrentLR(null);
        setFormData(null);
        setSelectedLRId(null);
        setSelectedLRKey(null);
        setViewMode('view'); // Reset to view mode
        
        alert('✅ LR deleted successfully!');
      } else {
        throw new Error(result?.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting LR:', error);
      alert(`❌ Failed to delete LR: ${error.message || 'Unknown error'}`);
      setViewMode('view'); // Reset to view mode even on error
    }
  };

  const handleSelectLR = (lrKeyOrId) => {
    setSelectedLRId(lrKeyOrId);
    setSelectedLRKey(String(lrKeyOrId));
    // Find LR from current combined lrBookings state
    let lr = null;
    if (String(lrKeyOrId).includes(':')) {
      const [tbl, id] = String(lrKeyOrId).split(':');
      lr = lrBookings.find(l => l.__table === tbl && l.id && l.id.toString() === id.toString());
    } else {
      lr = lrBookings.find(l => l.id && l.id.toString() === String(lrKeyOrId));
    }
    if (lr) {
      // Check if user has permission to view this LR
      if (!isLRFromUserBranch(lr)) {
        alert('⚠️ You can only view LRs booked by your branch.');
        return;
      }
      
      setCurrentLR(lr);
      setFormData({ ...lr });
      setViewMode('view'); // Reset to view mode when selecting a new LR
      checkEditPermissions(lr, manifests, invoices, pods);
    }
  };

  const filteredLRs = lrBookings.filter(lr => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      lr.lrNumber?.toLowerCase().includes(term) ||
      lr.consignor?.name?.toLowerCase().includes(term) ||
      lr.consignee?.name?.toLowerCase().includes(term) ||
      lr.origin?.toLowerCase().includes(term) ||
      lr.destination?.toLowerCase().includes(term)
    );
  });

  // LR Search and Select Interface
  if (!currentLR || !formData) {
    return (
      <div style={{ 
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        marginTop: '0',
        border: '2px solid #e2e8f0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        width: '100%'
      }}>
        <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '2px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '8px', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit2 size={28} style={{ color: '#3b82f6' }} />
            LR View / Modify
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', margin: 0 }}>
            Search and select an LR to view or modify its details
          </p>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <div style={{ position: 'relative', marginBottom: '15px' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search by LR Number, Consignor, Consignee, Origin, or Destination..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 12px 12px 40px',
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '0.95rem'
              }}
            />
          </div>
        </div>

        {filteredLRs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            <AlertCircle size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
            <p>No LRs found. {searchTerm ? 'Try a different search term.' : 'Create an LR booking first.'}</p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {filteredLRs.map(lr => (
              <div
                key={lr.__key || `${lr.__table || 'lrBookings'}:${lr.id}`}
                onClick={() => handleSelectLR(lr.__key || lr.id)}
                style={{
                  padding: '16px',
                  marginBottom: '10px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  background: selectedLRKey === (lr.__key || `${lr.__table || 'lrBookings'}:${lr.id}`) ? '#eff6ff' : 'white'
                }}
                onMouseEnter={(e) => {
                  if (selectedLRKey !== (lr.__key || `${lr.__table || 'lrBookings'}:${lr.id}`)) {
                    e.currentTarget.style.borderColor = '#3b82f6';
                    e.currentTarget.style.background = '#f8fafc';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedLRKey !== (lr.__key || `${lr.__table || 'lrBookings'}:${lr.id}`)) {
                    e.currentTarget.style.borderColor = '#e2e8f0';
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <strong style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: '#3b82f6' }}>
                        {lr.lrNumber}
                      </strong>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '12px',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        background: lr.status === 'Booked' ? '#dbeafe' : lr.status === 'Manifested' ? '#e0e7ff' : '#d1fae5',
                        color: lr.status === 'Booked' ? '#1e40af' : lr.status === 'Manifested' ? '#3730a3' : '#065f46'
                      }}>
                        {lr.status || 'Booked'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                      <strong>From:</strong> {lr.consignor?.name || 'N/A'} <strong style={{ marginLeft: '15px' }}>To:</strong> {lr.consignee?.name || 'N/A'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                      {getCityName(lr.origin) || lr.origin} → {getCityName(lr.destination) || lr.destination} | Pieces: {lr.pieces} | Weight: {lr.weight} kg
                    </div>
                  </div>
                  <Eye size={20} style={{ color: '#3b82f6', marginLeft: '15px' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  const getStatusInfo = () => {
    if (editMode === 'none') {
      return { text: 'Billed - Cannot Edit', color: '#10b981', icon: Lock };
    } else if (editMode === 'charges-only') {
      return { text: 'Manifested - Charges Only', color: '#3b82f6', icon: Edit2 };
    } else {
      return { text: 'Booked - Full Edit', color: '#f59e0b', icon: Edit2 };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  // Derived states from viewMode
  const isEditable = viewMode === 'edit';
  const isDeleteMode = viewMode === 'delete';

  return (
    <div style={{ background: 'transparent', padding: '0', minHeight: 'auto' }}>
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
        
        .form-section.disabled {
          opacity: 0.6;
          background: #f8fafc;
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
          background: white;
          color: #1e293b;
        }
        
        input:disabled, select:disabled, textarea:disabled {
          background: #f8fafc;
          color: #94a3b8;
          cursor: not-allowed;
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
        
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59,130,246,0.3);
        }
        
        .btn-secondary {
          background: linear-gradient(135deg, #64748b 0%, #475569 100%);
          color: white;
        }
        
        .btn-secondary:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(100,116,139,0.3);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .btn-danger:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
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
        
        .toggle-group {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 10px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #64748b;
        }
        
        .toggle-btn:hover:not(:disabled) {
          border-color: #3b82f6;
          background: #f8fafc;
        }
        
        .toggle-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .toggle-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f8fafc;
        }
        
        .status-banner {
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 600;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {/* Back Home Button */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => {
              // Set flag in sessionStorage (primary method)
              sessionStorage.setItem('navigateToHome', 'true');
              // Trigger a custom event to notify parent component (secondary method)
              try {
                const event = new CustomEvent('navigateToHome', { bubbles: true, cancelable: true });
                window.dispatchEvent(event);
                // Also dispatch on document for better compatibility
                document.dispatchEvent(event);
              } catch (e) {
                console.log('Event dispatch error:', e);
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
            }}
          >
            <ArrowLeft size={18} />
            Back Home
          </button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Modify LR Booking
          </h1>
          <p className="text-slate-600 text-lg">Edit or Delete LR Booking</p>
        </div>

        {/* Status Banner */}
        <div className="status-banner" style={{ background: statusInfo.color + '20', color: statusInfo.color, border: `2px solid ${statusInfo.color}40` }}>
          <StatusIcon size={24} />
          <span>{statusInfo.text}</span>
        </div>

        {/* Action Mode Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center', 
          marginBottom: '24px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (currentLR) {
                sessionStorage.setItem('printLRId', currentLR.id.toString());
                setShowPrintView(true);
              }
            }}
            style={{ fontSize: '1rem', padding: '12px 32px' }}
          >
            <Printer size={18} />
            Print
          </button>
          
          <button
            type="button"
            className={`btn ${viewMode === 'edit' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              if (editMode === 'none') {
                alert('⚠️ This LR cannot be edited. It has been billed.');
                return;
              }
              setViewMode('edit');
            }}
            disabled={editMode === 'none'}
            style={{ 
              fontSize: '1rem', 
              padding: '12px 32px',
              opacity: editMode === 'none' ? 0.5 : 1,
              cursor: editMode === 'none' ? 'not-allowed' : 'pointer'
            }}
          >
            <Edit2 size={18} />
            Edit
          </button>
          
          <button
            type="button"
            className={`btn ${viewMode === 'delete' ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => {
              if (editMode !== 'full') {
                alert('⚠️ This LR cannot be deleted. It has been manifested or billed.');
                return;
              }
              setViewMode('delete');
            }}
            disabled={editMode !== 'full'}
            style={{ 
              fontSize: '1rem', 
              padding: '12px 32px',
              opacity: editMode !== 'full' ? 0.5 : 1,
              cursor: editMode !== 'full' ? 'not-allowed' : 'pointer'
            }}
          >
            <Trash2 size={18} />
            Delete
          </button>
        </div>

        {/* Delete Confirmation */}
        {isDeleteMode && (
          <div style={{
            background: '#fee2e2',
            border: '2px solid #ef4444',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            <AlertCircle size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.3rem', fontWeight: 600, color: '#991b1b', marginBottom: '12px' }}>
              Confirm Deletion
            </h3>
            <p style={{ fontSize: '1rem', color: '#7f1d1d', marginBottom: '20px' }}>
              Are you sure you want to delete LR <strong>{formData.lrNumber}</strong>?<br />
              This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                style={{ fontSize: '1rem', padding: '12px 32px' }}
              >
                <Trash2 size={18} />
                Yes, Delete LR
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setViewMode('view')}
                style={{ fontSize: '1rem', padding: '12px 32px' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Hide form in delete mode - only show in view or edit mode */}
        {(viewMode === 'view' || viewMode === 'edit') && (
        <form onSubmit={handleSubmit}>
          {/* LR Details & Booking Mode */}
          <div className={`form-section ${!isEditable ? 'disabled' : ''}`}>
            <h2 className="section-title">LR Details & Booking Mode</h2>
            
            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label style={{ marginBottom: '8px' }}>LR Number Mode</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.lrMode === 'auto' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, lrMode: 'auto' }))}
                    disabled={!isEditable || editMode !== 'full'}
                  >
                    Auto Generate
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.lrMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, lrMode: 'manual', lrNumber: '' }))}
                    disabled={!isEditable || editMode !== 'full'}
                  >
                    Manual Entry
                  </button>
                </div>
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>LR Number (10 Digits)</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.lrNumber || ''}
                  onChange={(e) => {
                    if (formData.lrMode === 'manual' && e.target.value.length <= 10) {
                      setFormData(prev => ({ ...prev, lrNumber: e.target.value }));
                    }
                  }}
                  maxLength="10"
                  readOnly={formData.lrMode === 'auto' || !isEditable || editMode !== 'full'}
                  disabled={!isEditable || editMode !== 'full'}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Booking Date</label>
                <input
                  type="date"
                  value={formData.bookingDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full'}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full'}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Reference Number</label>
                <input
                  type="text"
                  value={formData.referenceNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNumber: e.target.value }))}
                  placeholder="PO/Order/Ref No (optional)"
                  disabled={!isEditable || editMode !== 'full'}
                />
              </div>
            </div>
            
            {/* Branch display */}
            {formData.branch && (
              <div style={{ 
                marginTop: '12px', 
                padding: '8px 12px', 
                background: '#f1f5f9', 
                borderRadius: '6px',
                fontSize: '0.85rem',
                color: '#475569'
              }}>
                <strong>Branch:</strong> {branches.find(b => b.id?.toString() === formData.branch)?.branchName || 'Auto-selected from login'}
              </div>
            )}
            
            <div className="grid-2" style={{ marginTop: '16px' }}>
              <div className="input-group">
                <label>Booking Mode</label>
                <select
                  value={formData.bookingMode || 'PTL'}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingMode: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full'}
                >
                  <option value="PTL">PTL</option>
                  <option value="FTL">FTL</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          <div className={`form-section ${!isEditable ? 'disabled' : ''}`}>
            <h2 className="section-title">Payment Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>
                  Payment Mode {!isAdmin && <Lock size={14} style={{ color: '#ef4444', marginLeft: '5px' }} title="Admin rights required" />}
                </label>
                <select
                  value={formData?.paymentMode || currentLR?.paymentMode || 'Paid'}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full' || !isAdmin}
                  style={{
                    borderColor: !isAdmin ? '#fecaca' : undefined,
                    background: !isAdmin ? '#fef2f2' : undefined
                  }}
                  title={!isAdmin ? '⚠️ Admin rights required to edit Payment Mode (Cash/To Pay)' : ''}
                >
                  <option value="Paid">Paid</option>
                  <option value="ToPay">To Pay</option>
                  <option value="TBB">TBB</option>
                </select>
                {!isAdmin && (
                  <small style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>
                    ⚠️ Admin rights required to edit Payment Mode
                  </small>
                )}
              </div>
              
              {/* Delivery Type - Show for PTL mode OR when TBB is selected */}
              {(formData.bookingMode === 'PTL' || formData.paymentMode === 'TBB') && (
                <div className="input-group">
                  <label>Delivery Type</label>
                  {formData.paymentMode === 'TBB' ? (
                    // For TBB: Display-only (auto-filled from Rate Master)
                    <div style={{ 
                      padding: '8px 12px', 
                      background: '#f1f5f9', 
                      borderRadius: '6px',
                      fontSize: '0.9rem',
                      color: '#475569',
                      border: '1px solid #e2e8f0'
                    }}>
                      <strong>{formData.deliveryType || 'Not set'}</strong> Delivery
                      {formData.origin && formData.destination && (
                        <small style={{ 
                          display: 'block', 
                          marginTop: '4px', 
                          color: '#3b82f6', 
                          fontSize: '0.75rem' 
                        }}>
                          Auto-selected from Rate Master
                        </small>
                      )}
                    </div>
                  ) : (
                    // For non-TBB: Editable toggle
                    <div className="toggle-group">
                      <button
                        type="button"
                        className={`toggle-btn ${formData.deliveryType === 'Godown' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Godown' }))}
                        disabled={!isEditable || editMode !== 'full'}
                      >
                        Godown Delivery
                      </button>
                      <button
                        type="button"
                        className={`toggle-btn ${formData.deliveryType === 'Door' || formData.deliveryType === 'Door Delivery' ? 'active' : ''}`}
                        onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Door' }))}
                        disabled={!isEditable || editMode !== 'full'}
                      >
                        Door Delivery
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            {/* Rate Calculation Method */}
            <div className="input-group" style={{ marginTop: '16px' }}>
              <label>Rate Calculation Method</label>
              {formData.paymentMode === 'TBB' ? (
                // For TBB: Display-only (auto-filled from Rate Master)
                <div style={{ 
                  padding: '8px 12px', 
                  background: '#f1f5f9', 
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  color: '#475569',
                  border: '1px solid #e2e8f0'
                }}>
                  <strong>{formData.charges?.calculationMethod === 'per-piece' ? 'Per Piece' : formData.charges?.calculationMethod === 'by-weight' ? 'Per KG' : 'Not set'}</strong>
                  {formData.origin && formData.destination && (
                    <small style={{ 
                      display: 'block', 
                      marginTop: '4px', 
                      color: '#3b82f6', 
                      fontSize: '0.75rem' 
                    }}>
                      Auto-selected from Rate Master
                    </small>
                  )}
                </div>
              ) : (
                // For non-TBB: Editable toggle
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.charges?.calculationMethod === 'per-piece' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      charges: { ...prev.charges, calculationMethod: 'per-piece' }
                    }))}
                    disabled={!isEditable || editMode === 'none'}
                  >
                    Per Piece
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.charges?.calculationMethod === 'by-weight' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      charges: { ...prev.charges, calculationMethod: 'by-weight' }
                    }))}
                    disabled={!isEditable || editMode === 'none'}
                  >
                    Per KG
                  </button>
                </div>
              )}
            </div>
            
            {formData.paymentMode === 'TBB' && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Select TBB Client</label>
                {tbbClients.length === 0 ? (
                  <div style={{
                    padding: '16px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e'
                  }}>
                    <strong>⚠️ No TBB Clients Available</strong>
                    <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                      Please add TBB clients in the Client Master form first.
                    </p>
                  </div>
                ) : (
                  <select
                    value={formData.tbbClient || ''}
                    onChange={(e) => {
                      const clientId = e.target.value;
                      const client = tbbClients.find(c => c.id?.toString() === clientId);
                      setFormData(prev => ({ 
                        ...prev, 
                        tbbClient: clientId
                      }));
                    }}
                    disabled={!isEditable || editMode !== 'full'}
                  >
                    <option value="">-- Select TBB Client --</option>
                    {tbbClients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.code} - {client.companyName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Route Details */}
          <div className={`form-section ${!isEditable ? 'disabled' : ''}`}>
            <h2 className="section-title">Route Details</h2>
            
            <div className="grid-3">
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Origin City</label>
                <input
                  type="text"
                  value={originSearch || ''}
                  onChange={(e) => {
                    const search = e.target.value;
                    setOriginSearch(search);
                    setShowOriginDropdown(search.length >= 3);
                    setOriginDropdownIndex(-1);
                    if (search.length < 3) {
                      setSelectedOrigin(null);
                      setFormData(prev => ({ ...prev, origin: '' }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const filteredCities = cities.filter(city => 
                        city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                      ).slice(0, 10);
                      setOriginDropdownIndex(prev => 
                        prev < filteredCities.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setOriginDropdownIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && originDropdownIndex >= 0 && showOriginDropdown) {
                      e.preventDefault();
                      const filteredCities = cities.filter(city => 
                        city.cityName.toLowerCase().startsWith(originSearch.toLowerCase().substring(0, 3))
                      ).slice(0, 10);
                      if (filteredCities[originDropdownIndex]) {
                        const city = filteredCities[originDropdownIndex];
                        setSelectedOrigin(city);
                        setFormData(prev => ({ ...prev, origin: city.id.toString() }));
                        setOriginSearch(city.cityName);
                        setShowOriginDropdown(false);
                        setOriginDropdownIndex(-1);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (selectedOrigin) {
                      setOriginSearch(selectedOrigin.cityName);
                    } else if (formData.origin) {
                      const cityName = getCityName(formData.origin);
                      setOriginSearch(cityName);
                    }
                    if (originSearch && originSearch.length >= 3) {
                      setShowOriginDropdown(true);
                    }
                    setOriginDropdownIndex(-1);
                  }}
                  onBlur={() => setTimeout(() => {
                    setShowOriginDropdown(false);
                    setOriginDropdownIndex(-1);
                  }, 200)}
                  placeholder="Type first 3 letters to search city..."
                  disabled={!isEditable || editMode !== 'full'}
                  required
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
                            setOriginSearch(city.cityName);
                            setShowOriginDropdown(false);
                            setOriginDropdownIndex(-1);
                          }}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: originDropdownIndex === index ? '#f8fafc' : 'white'
                          }}
                          onMouseEnter={() => setOriginDropdownIndex(index)}
                          onMouseLeave={() => {
                            if (originDropdownIndex !== index) {
                              // Keep hover state
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
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="input-group" style={{ position: 'relative' }}>
                <label>Destination City</label>
                <input
                  type="text"
                  value={destinationSearch || ''}
                  onChange={(e) => {
                    const search = e.target.value;
                    setDestinationSearch(search);
                    setShowDestinationDropdown(search.length >= 3);
                    setDestinationDropdownIndex(-1);
                    if (search.length < 3) {
                      setSelectedDestination(null);
                      setFormData(prev => ({ ...prev, destination: '' }));
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      const filteredCities = cities.filter(city => 
                        city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                      ).slice(0, 10);
                      setDestinationDropdownIndex(prev => 
                        prev < filteredCities.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setDestinationDropdownIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && destinationDropdownIndex >= 0 && showDestinationDropdown) {
                      e.preventDefault();
                      const filteredCities = cities.filter(city => 
                        city.cityName.toLowerCase().startsWith(destinationSearch.toLowerCase().substring(0, 3))
                      ).slice(0, 10);
                      if (filteredCities[destinationDropdownIndex]) {
                        const city = filteredCities[destinationDropdownIndex];
                        setSelectedDestination(city);
                        setFormData(prev => ({ 
                          ...prev, 
                          destination: city.id.toString(),
                          odaDestination: city && city.isODA ? city.cityName : prev.odaDestination
                        }));
                        setDestinationSearch(city.cityName);
                        setShowDestinationDropdown(false);
                        setDestinationDropdownIndex(-1);
                      }
                    }
                  }}
                  onFocus={() => {
                    if (selectedDestination) {
                      setDestinationSearch(selectedDestination.cityName);
                    } else if (formData.destination) {
                      const cityName = getCityName(formData.destination);
                      setDestinationSearch(cityName);
                    }
                    if (destinationSearch && destinationSearch.length >= 3) {
                      setShowDestinationDropdown(true);
                    }
                    setDestinationDropdownIndex(-1);
                  }}
                  onBlur={() => setTimeout(() => {
                    setShowDestinationDropdown(false);
                    setDestinationDropdownIndex(-1);
                  }, 200)}
                  placeholder="Type first 3 letters to search city..."
                  disabled={!isEditable || editMode !== 'full'}
                  required
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
                            setFormData(prev => ({ 
                              ...prev, 
                              destination: city.id.toString(),
                              odaDestination: city && city.isODA ? city.cityName : prev.odaDestination
                            }));
                            setDestinationSearch(city.cityName);
                            setShowDestinationDropdown(false);
                            setDestinationDropdownIndex(-1);
                          }}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f1f5f9',
                            background: destinationDropdownIndex === index ? '#f8fafc' : 'white'
                          }}
                          onMouseEnter={() => setDestinationDropdownIndex(index)}
                          onMouseLeave={() => {
                            if (destinationDropdownIndex !== index) {
                              // Keep hover state
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
                      <div style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>
                        No cities found
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="input-group">
                <label>ODA Location</label>
                <input
                  type="text"
                  value={formData.odaDestination || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, odaDestination: e.target.value }))}
                  placeholder="Enter ODA location/address"
                  disabled={!isEditable || editMode !== 'full'}
                />
              </div>
            </div>
          </div>

          {/* Shipment Details */}
          {formData.bookingMode !== 'FTL' && (
          <div className={`form-section ${!isEditable ? 'disabled' : ''}`}>
            <h2 className="section-title">Shipment Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Number of Pieces</label>
                <input
                  type="number"
                  value={formData.pieces || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, pieces: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full'}
                  min="1"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Weight (kg)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  disabled={!isEditable || editMode !== 'full'}
                  min="0"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Calculated CFT</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.calculatedCFT || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, calculatedCFT: e.target.value }))}
                    disabled={!isEditable || editMode !== 'full'}
                    min="0"
                    style={{ flex: 1 }}
                  />
                  {editMode !== 'none' && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        if (!formData.cftEntries || formData.cftEntries.length === 0) {
                          setCftEntries([{
                            id: 1,
                            length: '',
                            width: '',
                            height: '',
                            pieces: 1,
                            unit: 'cm',
                            factor: 6
                          }]);
                        }
                        setShowCFTCalculator(true);
                      }}
                      title="CFT Calculator"
                      disabled={!isEditable || editMode === 'none'}
                    >
                      <Calculator size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Invoice Numbers */}
            {formData.invoices && formData.invoices.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>Invoice Numbers</label>
                {formData.invoices.map((invoice, index) => (
                  <div key={index} style={{ marginBottom: '8px' }}>
                    <input
                      type="text"
                      value={invoice.number || ''}
                      onChange={(e) => {
                        const newInvoices = [...formData.invoices];
                        newInvoices[index] = { number: e.target.value };
                        setFormData(prev => ({ ...prev, invoices: newInvoices }));
                      }}
                      disabled={!isEditable || editMode !== 'full'}
                      placeholder={`Invoice ${index + 1}`}
                      style={{ width: '100%' }}
                    />
                  </div>
                ))}
              </div>
            )}
            
            {/* E-waybill Numbers */}
            {formData.ewaybills && formData.ewaybills.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <label style={{ marginBottom: '8px', display: 'block' }}>E-waybill Numbers</label>
                {formData.ewaybills.map((ewaybill, index) => (
                  <div key={index} style={{ marginBottom: '8px', display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      value={ewaybill.number || ''}
                      onChange={(e) => {
                        const newEwaybills = [...formData.ewaybills];
                        newEwaybills[index] = { ...newEwaybills[index], number: e.target.value };
                        setFormData(prev => ({ ...prev, ewaybills: newEwaybills }));
                      }}
                      disabled={!isEditable || editMode !== 'full'}
                      placeholder={`E-waybill ${index + 1}`}
                      style={{ flex: 1 }}
                    />
                    <input
                      type="date"
                      value={ewaybill.expiryDate || ''}
                      onChange={(e) => {
                        const newEwaybills = [...formData.ewaybills];
                        newEwaybills[index] = { ...newEwaybills[index], expiryDate: e.target.value };
                        setFormData(prev => ({ ...prev, ewaybills: newEwaybills }));
                      }}
                      disabled={!isEditable || editMode !== 'full'}
                      placeholder="Expiry Date"
                      style={{ width: '150px' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          )}

          {/* Freight & Charges */}
          <div className={`form-section ${!isEditable && editMode === 'none' ? 'disabled' : ''}`}>
            <h2 className="section-title">
              Freight & Additional Charges
              {editMode === 'charges-only' && (
                <span style={{ fontSize: '0.85rem', color: '#3b82f6', marginLeft: '12px', fontWeight: 400 }}>
                  (Only charges can be edited for manifested LRs)
                </span>
              )}
            </h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Rate (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.rate || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, rate: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>
                  Freight Rate (₹) * 
                  {editMode === 'charges-only' && <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginLeft: '8px' }}>(Editable till invoicing)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.freightRate || ''}
                  onChange={(e) => {
                    isFreightManual.current = true; // Mark as manually edited
                    setFormData(prev => ({
                      ...prev,
                      charges: { ...prev.charges, freightRate: e.target.value }
                    }));
                  }}
                  disabled={!isEditable || editMode === 'none'}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>LR Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.lrCharges || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, lrCharges: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>Hamali / Loading-Unloading (₹) {editMode === 'charges-only' && <span style={{ color: '#3b82f6', fontSize: '0.75rem' }}>(Editable till invoicing)</span>}</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.hamali || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, hamali: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              {/* Separate Pickup and Delivery charges */}
              <div className="input-group">
                <label>
                  Pickup Charges (₹)
                  {editMode === 'charges-only' && <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginLeft: '8px' }}>(Editable till invoicing)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.pickupCharges || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, pickupCharges: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>
                  Delivery Charges (₹)
                  {editMode === 'charges-only' && <span style={{ color: '#3b82f6', fontSize: '0.75rem', marginLeft: '8px' }}>(Editable till invoicing)</span>}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.deliveryCharges || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, deliveryCharges: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>ODA Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.odaCharges || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, odaCharges: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>Other Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.other || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, other: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>Warai Union (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges?.waraiUnion || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, waraiUnion: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                />
              </div>
              
              <div className="input-group">
                <label>GST %</label>
                <select
                  value={formData.charges?.gstPercent || '5-rcm'}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, gstPercent: e.target.value }
                  }))}
                  disabled={!isEditable || editMode === 'none'}
                >
                  <option value="exempted">Exempted</option>
                  <option value="5-rcm">5% RCM</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>

            {/* Total Summary */}
            <div style={{
              marginTop: '20px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Subtotal</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                  ₹{((parseFloat(formData.totalAmount) || 0) - (parseFloat(formData.gstAmount) || 0)).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>GST</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1e293b' }}>
                  ₹{(parseFloat(formData.gstAmount) || 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '4px' }}>Total Amount</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#3b82f6' }}>
                  ₹{(parseFloat(formData.totalAmount) || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {viewMode === 'edit' && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '30px', flexWrap: 'wrap' }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={!isEditable || editMode === 'none'}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                <Save size={20} />
                {editMode === 'charges-only' ? 'Update Charges' : 'Update LR'}
              </button>
              
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setViewMode('view');
                  // Reset formData to original LR
                  if (currentLR) {
                    setFormData({ ...currentLR });
                  }
                }}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* View Mode Actions */}
          {viewMode === 'view' && (
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '30px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowPrintView(true)}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                <Printer size={20} />
                Print LR
              </button>
            </div>
          )}

          {/* Delete Mode - Delete button is shown in delete confirmation section above */}
        </form>
        )}
      </div>

      {/* CFT Calculator Modal */}
      {showCFTCalculator && formData && (
        <div className="calculator-modal" onClick={() => setShowCFTCalculator(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          zIndex: 9998,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="calculator-content" onClick={(e) => e.stopPropagation()} style={{ 
            maxWidth: '700px', 
            maxHeight: '90vh', 
            overflowY: 'auto',
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.3rem', fontWeight: 600 }}>
              CFT Calculator - Multiple Piece Sizes
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '20px' }}>
              Add multiple entries for different piece sizes. Each entry will be calculated and multiplied by number of pieces.
              <strong style={{ color: '#dc2626' }}> Total pieces in all entries must exactly equal the pieces entered in LR form.</strong>
            </p>
            
            {cftEntries.map((entry, index) => (
              <div key={entry.id} style={{
                border: '2px solid #e2e8f0',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px',
                background: '#f8fafc'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: '#1e293b', margin: 0 }}>
                    Entry {index + 1}
                  </h4>
                  {cftEntries.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeCFTEntry(entry.id)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="input-group">
                  <label>Unit</label>
                  <select
                    value={entry.unit}
                    onChange={(e) => updateCFTEntry(entry.id, 'unit', e.target.value)}
                  >
                    <option value="cm">Centimeters (cm)</option>
                    <option value="inches">Inches</option>
                  </select>
                </div>

                <div className="grid-3" style={{ marginTop: '12px' }}>
                  <div className="input-group">
                    <label>Length</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.length}
                      onChange={(e) => updateCFTEntry(entry.id, 'length', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Width</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.width}
                      onChange={(e) => updateCFTEntry(entry.id, 'width', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Height</label>
                    <input
                      type="number"
                      step="0.01"
                      value={entry.height}
                      onChange={(e) => updateCFTEntry(entry.id, 'height', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: entry.unit === 'inches' ? '1fr 1fr' : '1fr', gap: '12px', marginTop: '12px' }}>
                  <div className="input-group">
                    <label>Number of Pieces</label>
                    <input
                      type="number"
                      min="1"
                      value={entry.pieces}
                      onChange={(e) => updateCFTEntry(entry.id, 'pieces', e.target.value)}
                      placeholder="1"
                    />
                  </div>
                  
                  {entry.unit === 'inches' && (
                    <div className="input-group">
                      <label>CFT Factor (kg per CFT)</label>
                      <select
                        value={entry.factor}
                        onChange={(e) => updateCFTEntry(entry.id, 'factor', e.target.value)}
                      >
                        <option value="6">6 kg per CFT</option>
                        <option value="8">8 kg per CFT</option>
                        <option value="10">10 kg per CFT</option>
                      </select>
                    </div>
                  )}
                </div>

                {entry.length && entry.width && entry.height && entry.pieces && (
                  <div style={{
                    marginTop: '12px',
                    padding: '12px',
                    background: '#e0f2fe',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ color: '#0369a1', marginBottom: '4px', fontWeight: 600 }}>
                      Entry {index + 1} Calculation:
                    </div>
                    <div style={{ color: '#0c4a6e', fontFamily: 'monospace' }}>
                      {entry.unit === 'cm'
                        ? `(${entry.length} × ${entry.width} × ${entry.height}) / 5000 × ${entry.pieces} pieces = ${calculateCFTWeightForEntry(entry).toFixed(2)} kg`
                        : `((${entry.length} × ${entry.width} × ${entry.height}) / 1728 × ${entry.factor}) × ${entry.pieces} pieces = ${calculateCFTWeightForEntry(entry).toFixed(2)} kg`}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              className="btn btn-secondary"
              onClick={addCFTEntry}
              style={{ width: '100%', marginBottom: '20px' }}
            >
              <Plus size={16} /> Add Another Piece Size
            </button>
            
            <div style={{ 
              background: '#f1f5f9', 
              padding: '16px', 
              borderRadius: '8px', 
              marginTop: '16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '4px' }}>
                Total CFT Weight (All Entries)
              </div>
              <div className="mono" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1e293b' }}>
                {calculateTotalCFTWeight().toFixed(2)} kg
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px', marginBottom: '8px' }}>
                Sum of all piece sizes: {calculateTotalPieces()} total pieces
              </div>
              {formData.pieces ? (
                <>
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: '#64748b', 
                    marginTop: '8px',
                    padding: '8px',
                    background: '#e2e8f0',
                    borderRadius: '4px'
                  }}>
                    Pieces in LR Form: {formData.pieces}
                  </div>
                  {calculateTotalPieces() !== parseFloat(formData.pieces) && calculateTotalPieces() > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '12px',
                      background: '#fee2e2',
                      border: '2px solid #ef4444',
                      borderRadius: '6px',
                      color: '#991b1b',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}>
                      ⚠️ Warning: Total pieces ({calculateTotalPieces()}) must exactly equal LR pieces ({formData.pieces})
                      <div style={{ fontSize: '0.75rem', marginTop: '4px', fontWeight: 400 }}>
                        {calculateTotalPieces() > parseFloat(formData.pieces) 
                          ? `You have ${calculateTotalPieces() - parseFloat(formData.pieces)} extra pieces. Please reduce.`
                          : `You need ${parseFloat(formData.pieces) - calculateTotalPieces()} more pieces. Please add.`}
                      </div>
                    </div>
                  )}
                  {calculateTotalPieces() === parseFloat(formData.pieces) && calculateTotalPieces() > 0 && (
                    <div style={{
                      marginTop: '12px',
                      padding: '8px',
                      background: '#d1fae5',
                      border: '1px solid #10b981',
                      borderRadius: '6px',
                      color: '#065f46',
                      fontSize: '0.85rem'
                    }}>
                      ✓ Pieces validation passed: Total matches LR pieces exactly
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  marginTop: '12px',
                  padding: '10px',
                  background: '#fef3c7',
                  border: '1px solid #fbbf24',
                  borderRadius: '6px',
                  color: '#92400e',
                  fontSize: '0.85rem'
                }}>
                  ℹ️ Please enter "Number of Pieces" in LR form first. Total pieces in CFT entries must exactly match LR pieces.
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={applyCFTCalculation}
                disabled={formData.pieces ? calculateTotalPieces() !== parseFloat(formData.pieces) : false}
                style={{ 
                  flex: 1,
                  opacity: (formData.pieces && calculateTotalPieces() !== parseFloat(formData.pieces)) ? 0.5 : 1,
                  cursor: (formData.pieces && calculateTotalPieces() !== parseFloat(formData.pieces)) ? 'not-allowed' : 'pointer'
                }}
              >
                Apply Total CFT Weight
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowCFTCalculator(false);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && currentLR && (
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
            lrId={currentLR.id} 
            lrTable={currentLR.__table}
            onClose={() => setShowPrintView(false)} 
          />
        </div>
      )}
    </div>
  );
}

