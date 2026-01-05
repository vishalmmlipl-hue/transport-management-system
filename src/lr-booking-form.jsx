import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Calculator, Printer, Search, Edit2 } from 'lucide-react';
import LRPrintView from './lr-print-view.jsx';

export default function LRBookingForm() {
  // Load TBB clients from localStorage
  const [tbbClients, setTbbClients] = useState([]);
  const [cities, setCities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [branches, setBranches] = useState([]);
  const [clientRates, setClientRates] = useState([]);

  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedOrigin, setSelectedOrigin] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  
  // City search states for first 3 letters filtering
  const [originSearch, setOriginSearch] = useState('');
  const [destinationSearch, setDestinationSearch] = useState('');
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [originDropdownIndex, setOriginDropdownIndex] = useState(-1);
  const [destinationDropdownIndex, setDestinationDropdownIndex] = useState(-1);

  // Get current user
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [formData, setFormData] = useState({
    lrNumber: '',
    lrMode: 'auto',
    branch: '',
    bookingMode: 'PTL', // Always PTL for this form
    vehicleNumber: '',
    deliveryType: 'Godown',
    bookingDate: '',
    expectedDeliveryDate: '',
    paymentMode: 'Paid',
    tbbClient: '',
    consignor: {
      name: '',
      address: '',
      contact: '',
      gst: ''
    },
    consignee: {
      name: '',
      address: '',
      contact: '',
      gst: ''
    },
    origin: '',
    destination: '',
    odaDestination: '',
    pieces: '',
    weight: '',
    cftDimensions: {
      length: '',
      width: '',
      height: '',
      unit: 'cm',
      factor: 6
    },
    calculatedCFT: 0,
    invoices: [{ number: '' }],
    ewaybills: [{ number: '', expiryDate: '' }],
    // FTL mode: Multiple pickup and delivery points
    pickupPoints: [],
    deliveryPoints: [],
    charges: {
      rate: '',
      freightRate: '',
      lrCharges: '',
      hamali: '',
      pickupDelivery: '', // Combined field for non-TBB or legacy
      pickupCharges: '', // Separate pickup charges for TBB
      deliveryCharges: '', // Separate delivery charges for TBB
      odaCharges: '',
      other: '',
      waraiUnion: '',
      gstPercent: '5-rcm',
      calculationMethod: 'per-piece', // 'per-piece' or 'by-weight'
      minimumFreight: '', // Minimum freight from Rate Master (for per-box rates)
      // FTL specific charges
      advanceFreight: '',
      balanceFreight: '',
      detentionCharges: '',
      agentCommission: '',
      tdsDeducted: ''
    },
    totalAmount: 0,
    gstAmount: 0
  });

  const [showCFTCalculator, setShowCFTCalculator] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [savedLRId, setSavedLRId] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [lastSavedLRId, setLastSavedLRId] = useState(null);
  const [cftEntries, setCftEntries] = useState([{
    id: 1,
    length: '',
    width: '',
    height: '',
    pieces: 1,
    unit: 'cm',
    factor: 6
  }]);

  // Refs to track manual freight entry and previous values
  const lastCalculatedFreight = useRef(0);
  const lastPieces = useRef(0);
  const lastWeight = useRef(0);
  const lastCFT = useRef(0);
  const lastCFTDimensions = useRef(JSON.stringify({ length: '', width: '', height: '', unit: 'cm', factor: 6 }));
  const isFreightManual = useRef(false);

  // Sync selected cities when formData changes (e.g., when editing existing LR)
  useEffect(() => {
    if (formData.origin && cities.length > 0) {
      const city = cities.find(c => c.id.toString() === formData.origin);
      if (city && city !== selectedOrigin) {
        setSelectedOrigin(city);
        setOriginSearch('');
      }
    }
  }, [formData.origin, cities, selectedOrigin]);
  
  useEffect(() => {
    if (formData.destination && cities.length > 0) {
      const city = cities.find(c => c.id.toString() === formData.destination);
      if (city && city !== selectedDestination) {
        setSelectedDestination(city);
        setDestinationSearch('');
      }
    }
  }, [formData.destination, cities, selectedDestination]);

  // Function to get the next LR number from the last saved LR
  const getNextLRNumber = () => {
    const existingLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    if (existingLRs.length === 0) {
      // If no LRs exist, start from 1000000001
      return '1000000001';
    }
    
    // Get all LR numbers and find the highest one
    const lrNumbers = existingLRs
      .map(lr => lr.lrNumber)
      .filter(num => num && num.length === 10 && !isNaN(num))
      .map(num => parseInt(num))
      .filter(num => !isNaN(num));
    
    if (lrNumbers.length === 0) {
      return '1000000001';
    }
    
    const maxLRNumber = Math.max(...lrNumbers);
    const nextNumber = maxLRNumber + 1;
    
    // Ensure it's 10 digits
    return nextNumber.toString().padStart(10, '0');
  };

  // Generate LR number when mode is auto and number is empty
  useEffect(() => {
    if (formData && formData.lrMode === 'auto' && (!formData.lrNumber || formData.lrNumber === '')) {
      const nextLR = getNextLRNumber();
      setFormData(prev => ({ ...prev, lrNumber: nextLR }));
    }
  }, [formData?.lrMode]);

  useEffect(() => {
    calculateTotals();
  }, [formData.charges, formData.cftDimensions]);

  // Set selected client when TBB client is selected
  useEffect(() => {
    if (formData.paymentMode === 'TBB' && formData.tbbClient) {
      const client = tbbClients.find(c => c.id?.toString() === formData.tbbClient || c.code === formData.tbbClient);
      if (client) {
        setSelectedClient(client);
      } else {
        setSelectedClient(null);
      }
    } else if (formData.paymentMode !== 'TBB') {
      setSelectedClient(null);
      // Clear deliveryType and calculationMethod when switching away from TBB
      setFormData(prev => ({
        ...prev,
        deliveryType: prev.bookingMode === 'PTL' ? 'Godown' : prev.deliveryType,
        charges: {
          ...prev.charges,
          calculationMethod: 'per-piece' // Reset to default
        }
      }));
    }
  }, [formData.paymentMode, formData.tbbClient, tbbClients]);
  
  // Clear deliveryType and calculationMethod when TBB is selected but origin/destination not set yet
  useEffect(() => {
    if (formData.paymentMode === 'TBB' && (!formData.origin || !formData.destination)) {
      // Clear these fields - they will be populated from Rate Master when origin/destination are selected
      setFormData(prev => ({
        ...prev,
        deliveryType: '',
        charges: {
          ...prev.charges,
          calculationMethod: ''
        }
      }));
    }
  }, [formData.paymentMode, formData.origin, formData.destination]);

  // Fetch rate from Client Rate Master for TBB payment mode
  useEffect(() => {
    if (formData.paymentMode === 'TBB' && formData.tbbClient && formData.origin && formData.destination) {
      const client = tbbClients.find(c => c.id?.toString() === formData.tbbClient || c.code === formData.tbbClient);
      const originCity = cities.find(c => c.code === formData.origin || c.id?.toString() === formData.origin);
      const destCity = cities.find(c => c.code === formData.destination || c.id?.toString() === formData.destination);
      
      if (client && originCity && destCity) {
        // Find matching client rate - check both formats
        // Also match delivery type if specified in rate
        const matchingRate = clientRates.find(rate => {
          if (rate.status !== 'Active') return false;
          
          // Check if client matches (by ID or code)
          const rateClientId = rate.clientId?.toString();
          const rateClientCode = rate.clientCode;
          const clientMatches = rateClientId === client.id?.toString() || 
                               rateClientId === client.code ||
                               rateClientCode === client.code ||
                               rateClientCode === client.id?.toString();
          
          if (!clientMatches) return false;
          
          // For TBB: Don't require deliveryType match initially - we'll set it from Rate Master
          // If deliveryType is already set in formData, prefer matching it, but don't require it
          // This allows us to find the rate first, then set deliveryType from it
          
          // Format 1: Simple structure (from sample data)
          if (rate.origin && rate.destination) {
            return rate.origin === originCity.code && rate.destination === destCity.code;
          }
          
          // Format 2: Complex structure - City Wise Rates
          if (rate.cityWiseRates && rate.cityWiseRates.length > 0) {
            return rate.cityWiseRates.some(cr => {
              const crOrigin = cities.find(c => c.id?.toString() === cr.originCity || c.code === cr.originCity);
              const crDest = cities.find(c => c.id?.toString() === cr.destinationCity || c.code === cr.destinationCity);
              return crOrigin?.code === originCity.code && crDest?.code === destCity.code;
            });
          }
          
          // Format 3: Per Box Rates with city-to-city matching
          if (rate.perBoxRates && rate.perBoxRates.length > 0) {
            return rate.perBoxRates.some(pbr => {
              // If applyToState is set (string), check if cities are in that state
              if (pbr.applyToState && pbr.applyToState !== '') {
                return originCity.state === pbr.applyToState && destCity.state === pbr.applyToState;
              }
              
              // Otherwise, check exact city match
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
          let autoCalculationMethod = formData.charges.calculationMethod; // Default to current method
          let cityRate = null;
          let matchedPerBoxRate = null;
          
          // Check rateType first to determine the structure
          const rateType = matchingRate.rateType;
          
          // Format 1: Simple structure (legacy format)
          if (matchingRate.ratePerKg || matchingRate.ratePerBox) {
            // Auto-detect calculation method: use what's available
            if (matchingRate.ratePerKg && !matchingRate.ratePerBox) {
              // Only ratePerKg exists - use by-weight
              autoCalculationMethod = 'by-weight';
              rateValue = parseFloat(matchingRate.ratePerKg) || 0;
            } else if (matchingRate.ratePerBox && !matchingRate.ratePerKg) {
              // Only ratePerBox exists - use per-piece
              autoCalculationMethod = 'per-piece';
              rateValue = parseFloat(matchingRate.ratePerBox) || 0;
            } else if (matchingRate.ratePerBox && matchingRate.ratePerKg) {
              // Both exist - check rateType or prefer ratePerKg if rateType is city-wise or weight-slab
              if (rateType === 'city-wise' || rateType === 'weight-slab') {
                // For city-wise or weight-slab, prefer by-weight
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(matchingRate.ratePerKg) || 0;
              } else {
                // For per-box type, prefer per-piece
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
              // Auto-detect calculation method from city rate
              // If only ratePerKg exists, use by-weight
              // If only ratePerBox exists, use per-piece
              // If both exist, prefer by-weight for city-wise rates
              if (cityRate.ratePerKg && !cityRate.ratePerBox) {
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(cityRate.ratePerKg) || 0;
              } else if (cityRate.ratePerBox && !cityRate.ratePerKg) {
                autoCalculationMethod = 'per-piece';
                rateValue = parseFloat(cityRate.ratePerBox) || 0;
              } else if (cityRate.ratePerBox && cityRate.ratePerKg) {
                // Both exist - for city-wise rates, prefer by-weight
                autoCalculationMethod = 'by-weight';
                rateValue = parseFloat(cityRate.ratePerKg) || 0;
              }
            }
          }
          // Format 3: Weight Slab Rates (always by-weight)
          else if (matchingRate.weightSlabRates && matchingRate.weightSlabRates.length > 0) {
            const matchedWeightSlab = matchingRate.weightSlabRates.find(wsr => {
              const wsrOrigin = cities.find(c => c.id?.toString() === wsr.originCity || c.code === wsr.originCity);
              const wsrDest = cities.find(c => c.id?.toString() === wsr.destinationCity || c.code === wsr.destinationCity);
              return wsrOrigin?.code === originCity.code && wsrDest?.code === destCity.code;
            });
            
            if (matchedWeightSlab && matchedWeightSlab.ratePerKg) {
              autoCalculationMethod = 'by-weight';
              rateValue = parseFloat(matchedWeightSlab.ratePerKg) || 0;
            }
          }
          // Format 4: Per Box Rates with city-to-city matching (always per-piece)
          else if (matchingRate.perBoxRates && matchingRate.perBoxRates.length > 0) {
            matchedPerBoxRate = matchingRate.perBoxRates.find(pbr => {
              // If applyToState is set (string), check if cities are in that state
              if (pbr.applyToState && pbr.applyToState !== '') {
                return originCity.state === pbr.applyToState && destCity.state === pbr.applyToState;
              }
              
              // Otherwise, check exact city match
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
            // Auto-populate delivery type and calculation method from Rate Master for TBB clients
            // Set both in a single update to ensure consistency
            setFormData(prev => ({
              ...prev,
              // Set deliveryType from Rate Master (if specified)
              deliveryType: matchingRate.deliveryType && (matchingRate.deliveryType === 'Godown' || matchingRate.deliveryType === 'Door')
                ? matchingRate.deliveryType
                : prev.deliveryType,
              charges: {
                ...prev.charges,
                // Set calculationMethod from Rate Master (per-piece or by-weight)
                calculationMethod: autoCalculationMethod,
                rate: rateValue.toString(),
                // Auto-populate minimum freight from per-box rate if available
                minimumFreight: matchedPerBoxRate && matchedPerBoxRate.minimumFreight 
                  ? matchedPerBoxRate.minimumFreight.toString() 
                  : (prev.charges.minimumFreight || ''),
                // Auto-populate all additional charges from client rate master
                lrCharges: matchingRate.lrCharges ? matchingRate.lrCharges.toString() : (prev.charges.lrCharges || ''),
                odaCharges: matchingRate.odaCharges ? matchingRate.odaCharges.toString() : (prev.charges.odaCharges || ''),
                pickupCharges: matchingRate.pickupCharges ? matchingRate.pickupCharges.toString() : (prev.charges.pickupCharges || ''),
                deliveryCharges: matchingRate.deliveryCharges ? matchingRate.deliveryCharges.toString() : (prev.charges.deliveryCharges || ''),
                pickupDelivery: '', // Clear combined field when using separate fields
                waraiUnion: matchingRate.waraiCharges ? matchingRate.waraiCharges.toString() : (prev.charges.waraiUnion || ''),
                other: matchingRate.otherCharges ? matchingRate.otherCharges.toString() : (prev.charges.other || ''),
                gstPercent: matchingRate.gstPercent || prev.charges.gstPercent || '5-rcm'
              }
            }));
          }
        }
      }
    }
  }, [formData.paymentMode, formData.tbbClient, formData.origin, formData.destination, clientRates, cities, tbbClients]);

  // Fetch freight from Rate Master for FTL + TBB mode
  useEffect(() => {
    if (formData.bookingMode === 'FTL' && formData.paymentMode === 'TBB' && formData.tbbClient && formData.origin && formData.destination) {
      const client = tbbClients.find(c => c.id?.toString() === formData.tbbClient || c.code === formData.tbbClient);
      const originCity = cities.find(c => c.code === formData.origin || c.id?.toString() === formData.origin);
      const destCity = cities.find(c => c.code === formData.destination || c.id?.toString() === formData.destination);
      
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
          
          if (rate.origin && rate.destination) {
            return rate.origin === originCity.code && rate.destination === destCity.code;
          }
          
          if (rate.cityWiseRates && rate.cityWiseRates.length > 0) {
            return rate.cityWiseRates.some(cr => {
              const crOrigin = cities.find(c => c.id?.toString() === cr.originCity || c.code === cr.originCity);
              const crDest = cities.find(c => c.id?.toString() === cr.destinationCity || c.code === cr.destinationCity);
              return crOrigin?.code === originCity.code && crDest?.code === destCity.code;
            });
          }
          
          return false;
        });
        
        if (matchingRate) {
          // Check if rate master has freight field (FTL specific)
          const freightValue = matchingRate.freight || matchingRate.ftlFreight || matchingRate.freightRate;
          
          if (freightValue && !formData.charges.freightRate) {
            // Only auto-fill if freight is empty (allow manual override)
            setFormData(prev => ({
              ...prev,
              charges: {
                ...prev.charges,
                freightRate: freightValue.toString()
              }
            }));
          }
        }
      }
    }
  }, [formData.bookingMode, formData.paymentMode, formData.tbbClient, formData.origin, formData.destination, clientRates, cities, tbbClients]);

  // Fetch pickup/delivery charges from Rate Master for FTL + TBB mode
  useEffect(() => {
    if (formData.bookingMode === 'FTL' && formData.paymentMode === 'TBB' && formData.tbbClient && clientRates.length > 0 && cities.length > 0) {
      const client = tbbClients.find(c => c.id?.toString() === formData.tbbClient || c.code === formData.tbbClient);
      
      if (client) {
        let updatedPickupPoints = [...formData.pickupPoints];
        let updatedDeliveryPoints = [...formData.deliveryPoints];
        let hasChanges = false;

        // Update pickup points charges (only if charge is empty)
        updatedPickupPoints = updatedPickupPoints.map(point => {
          if (point.city && !point.charges) {
            const city = cities.find(c => c.id?.toString() === point.city || c.code === point.city);
            if (city) {
              const matchingRate = clientRates.find(rate => {
                if (rate.status !== 'Active') return false;
                const rateClientId = rate.clientId?.toString();
                const rateClientCode = rate.clientCode;
                const clientMatches = rateClientId === client.id?.toString() || 
                                     rateClientId === client.code ||
                                     rateClientCode === client.code ||
                                     rateClientCode === client.id?.toString();
                if (!clientMatches) return false;
                return rate.pickupCharges || (rate.cityWiseRates && rate.cityWiseRates.length > 0);
              });
              
              if (matchingRate) {
                const pickupCharge = matchingRate.pickupCharges || 
                                    matchingRate.cityWiseRates?.find(cr => {
                                      const crCity = cities.find(c => c.id?.toString() === cr.originCity || c.code === cr.originCity);
                                      return crCity?.code === city.code;
                                    })?.pickupCharges;
                
                if (pickupCharge) {
                  hasChanges = true;
                  return { ...point, charges: pickupCharge.toString() };
                }
              }
            }
          }
          return point;
        });

        // Update delivery points charges (only if charge is empty)
        updatedDeliveryPoints = updatedDeliveryPoints.map(point => {
          if (point.city && !point.charges) {
            const city = cities.find(c => c.id?.toString() === point.city || c.code === point.city);
            if (city) {
              const matchingRate = clientRates.find(rate => {
                if (rate.status !== 'Active') return false;
                const rateClientId = rate.clientId?.toString();
                const rateClientCode = rate.clientCode;
                const clientMatches = rateClientId === client.id?.toString() || 
                                     rateClientId === client.code ||
                                     rateClientCode === client.code ||
                                     rateClientCode === client.id?.toString();
                if (!clientMatches) return false;
                return rate.deliveryCharges || (rate.cityWiseRates && rate.cityWiseRates.length > 0);
              });
              
              if (matchingRate) {
                const deliveryCharge = matchingRate.deliveryCharges || 
                                      matchingRate.cityWiseRates?.find(cr => {
                                        const crCity = cities.find(c => c.id?.toString() === cr.destinationCity || c.code === cr.destinationCity);
                                        return crCity?.code === city.code;
                                      })?.deliveryCharges;
                
                if (deliveryCharge) {
                  hasChanges = true;
                  return { ...point, charges: deliveryCharge.toString() };
                }
              }
            }
          }
          return point;
        });

        if (hasChanges) {
          setFormData(prev => ({
            ...prev,
            pickupPoints: updatedPickupPoints,
            deliveryPoints: updatedDeliveryPoints
          }));
        }
      }
    }
  }, [formData.bookingMode, formData.paymentMode, formData.tbbClient, clientRates, cities, tbbClients]);

  // Auto-update pieces and weight from pickup/delivery points for FTL mode
  useEffect(() => {
    if (formData.bookingMode === 'FTL') {
      const totalPieces = formData.pickupPoints.reduce((sum, p) => sum + (parseFloat(p.pieces) || 0), 0) +
                         formData.deliveryPoints.reduce((sum, p) => sum + (parseFloat(p.pieces) || 0), 0);
      const totalQuantity = formData.pickupPoints.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) +
                           formData.deliveryPoints.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0);
      
      // Only auto-update if fields are empty or match the calculated total
      const currentPieces = parseFloat(formData.pieces) || 0;
      const currentWeight = parseFloat(formData.weight) || 0;
      
      if (totalPieces > 0 && (currentPieces === 0 || currentPieces === totalPieces)) {
        setFormData(prev => ({ ...prev, pieces: totalPieces.toString() }));
      }
      
      if (totalQuantity > 0 && (currentWeight === 0 || Math.abs(currentWeight - totalQuantity) < 0.01)) {
        setFormData(prev => ({ ...prev, weight: totalQuantity.toFixed(2) }));
      }
    }
  }, [formData.bookingMode, formData.pickupPoints, formData.deliveryPoints, formData.pieces, formData.weight]);

  // Load current user and set admin status
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    setIsAdmin(user?.role === 'Admin' || user?.role === 'Super Admin');
  }, []);

  // Function to load clients and other data
  const loadData = () => {
    const storedClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
    const storedVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
    const storedBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const storedClientRates = JSON.parse(localStorage.getItem('clientRates') || '[]');
    
    // Combine clients from both tbbClients and clients storage
    const combinedClients = [...storedClients, ...allClients];
    
    // Only show active TBB clients (from both sources)
    const activeTbbClients = combinedClients.filter(c => 
      c.status === 'Active' && c.clientType === 'TBB'
    );
    // Remove duplicates based on id
    const uniqueTbbClients = activeTbbClients.filter((client, index, self) =>
      index === self.findIndex(c => c.id === client.id)
    );
    setTbbClients(uniqueTbbClients);
    
    // Only show active cities
    const activeCities = storedCities.filter(c => c.status === 'Active');
    setCities(activeCities);
    
    // Only show active vehicles
    const activeVehicles = storedVehicles.filter(v => v.status === 'Active');
    setVehicles(activeVehicles);
    
    // Only show active branches
    const activeBranches = storedBranches.filter(b => b.status === 'Active');
    setBranches(activeBranches);
    
    // Load client rates (only active ones)
    const activeClientRates = storedClientRates.filter(r => r.status === 'Active');
    setClientRates(activeClientRates);
  };

  // Load clients, cities, vehicles, and branches from localStorage on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Listen for storage changes to reload clients when new ones are added
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'tbbClients' || e.key === 'clients') {
        loadData();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event for same-tab updates
    const handleCustomStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('clientDataUpdated', handleCustomStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('clientDataUpdated', handleCustomStorageChange);
    };
  }, []);

  // Auto-select branch based on logged-in user
  useEffect(() => {
    if (currentUser && branches.length > 0 && !formData.branch) {
      // Get user's branch from users list (if user was created in User Master)
      const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const systemUser = systemUsers.find(u => u.username === currentUser.username);
      
      let userBranchId = null;
      
      if (systemUser && systemUser.branch) {
        // User has a branch assigned in User Master
        userBranchId = systemUser.branch;
      } else if (currentUser.branch) {
        // User object has branch directly
        userBranchId = currentUser.branch;
      }
      
      if (userBranchId) {
        // Find the branch by ID
        const branch = branches.find(b => b.id.toString() === userBranchId.toString());
        if (branch) {
          setSelectedBranch(branch);
          setFormData(prev => ({ ...prev, branch: branch.id.toString() }));
        }
      }
    }
  }, [currentUser, branches, formData.branch]);

  // Auto-calculate freight based on rate and calculation method (Per Piece or Per KG)
  useEffect(() => {
    // Skip auto-calculation for FTL mode (freight is entered directly)
    if (formData.bookingMode === 'FTL') {
      return;
    }
    
    // Auto-calculate for Paid, ToPay, and TBB payment modes
    if (formData.paymentMode !== 'Paid' && formData.paymentMode !== 'ToPay' && formData.paymentMode !== 'TBB') {
      return;
    }
    
    const rate = parseFloat(formData.charges.rate) || 0;
    const pieces = parseFloat(formData.pieces) || 0;
    const actualWeight = parseFloat(formData.weight) || 0;
    const calculatedCFT = parseFloat(formData.calculatedCFT) || 0;
    const currentFreight = parseFloat(formData.charges.freightRate) || 0;
    const calculationMethod = formData.charges.calculationMethod || 'by-weight';

    // Check if pieces or weight changed (always recalculate if they changed)
    const piecesChanged = pieces !== lastPieces.current;
    const cftDimensionsStr = JSON.stringify(formData.cftDimensions);
    const cftDimensionsChanged = cftDimensionsStr !== lastCFTDimensions.current;
    const weightChanged = actualWeight !== lastWeight.current || calculatedCFT !== lastCFT.current || cftDimensionsChanged;
    const shouldRecalculate = piecesChanged || weightChanged;

    // Update refs for pieces/weight even if we don't calculate (for tracking changes)
    if (piecesChanged) lastPieces.current = pieces;
    if (weightChanged) {
      lastWeight.current = actualWeight;
      lastCFT.current = calculatedCFT;
      lastCFTDimensions.current = cftDimensionsStr;
    }

    // If freight was manually entered and only rate changed (not pieces/weight), keep manual value
    if (isFreightManual.current && !shouldRecalculate && rate > 0) {
      // Only rate changed, keep manual freight
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
        // calculatedCFT already contains the CFT weight:
        // - CM: (L×B×H)/5000 (no factor)
        // - Inches: (L×B×H)/1728 × factor (6/8/10 kg per CFT)
        const cftWeight = parseFloat(calculatedCFT) || 0;
        
        // Compare CFT weight with actual weight, use whichever is higher
        // If CFT weight > actual weight: use CFT weight × rate
        // Otherwise: use actual weight × rate
        const chargedWeight = cftWeight > actualWeight ? cftWeight : actualWeight;
        
        if (chargedWeight > 0) {
          calculatedFreight = rate * chargedWeight;
        }
      }

      // Auto-update freight if:
      // 1. Freight is currently 0 (empty), OR
      // 2. Pieces or weight changed (always recalculate), OR
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
              freightRate: calculatedFreight.toFixed(2)
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
  }, [formData.paymentMode, formData.charges.rate, formData.charges.calculationMethod, formData.pieces, formData.weight, formData.calculatedCFT, formData.cftDimensions]);

  // Calculate balance freight for FTL mode
  useEffect(() => {
    if (formData.bookingMode === 'FTL') {
      const freight = parseFloat(formData.charges.freightRate) || 0;
      const advance = parseFloat(formData.charges.advanceFreight) || 0;
      const agentCommission = parseFloat(formData.charges.agentCommission) || 0;
      const tdsDeducted = parseFloat(formData.charges.tdsDeducted) || 0;
      
      const balance = freight - advance - agentCommission - tdsDeducted;
      
      setFormData(prev => ({
        ...prev,
        charges: {
          ...prev.charges,
          balanceFreight: balance >= 0 ? balance.toFixed(2) : '0.00'
        }
      }));
    }
  }, [formData.bookingMode, formData.charges.freightRate, formData.charges.advanceFreight, formData.charges.agentCommission, formData.charges.tdsDeducted]);

  const calculateCFT = () => {
    const { length, width, height, unit, factor } = formData.cftDimensions;
    if (!length || !width || !height) return 0;

    const l = parseFloat(length);
    const b = parseFloat(width);
    const h = parseFloat(height);
    const factorValue = parseInt(factor) || 6;

    let cftWeight = 0;

    if (unit === 'inches') {
      // Inches: (L×B×H)/1728 × factor (6/8/10 kg per CFT) = CFT Weight
      const cftVolume = (l * b * h) / 1728;
      cftWeight = cftVolume * factorValue;
    } else {
      // CM: (L×B×H)/5000 = CFT Weight (no factor multiplication)
      cftWeight = (l * b * h) / 5000;
    }

    return cftWeight.toFixed(2);
  };

  // Calculate CFT Weight using the specified formulas
  const calculateCFTWeight = () => {
    const { length, width, height, unit, factor } = formData.cftDimensions;
    if (!length || !width || !height) return 0;

    const l = parseFloat(length);
    const b = parseFloat(width);
    const h = parseFloat(height);
    const factorValue = parseInt(factor) || 6;

    let cftWeight = 0;

    if (unit === 'cm') {
      // CM: L×B×H/5000 = CFT Weight (in kg)
      cftWeight = (l * b * h) / 5000;
    } else {
      // Inches: L×B×H/1728 = CFT, then CFT × factor (6, 8, or 10) = CFT Weight (in kg)
      const cft = (l * b * h) / 1728;
      cftWeight = cft * factorValue;
    }

    return cftWeight;
  };

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
    const lrPieces = parseFloat(formData.pieces) || 0;
    
    if (lrPieces > 0 && totalPieces !== lrPieces) {
      alert(`⚠️ Total pieces in CFT calculator (${totalPieces}) must exactly equal pieces entered in LR form (${lrPieces}). Please adjust the pieces in CFT entries to match exactly.`);
      return;
    }
    
    const totalCFTWeight = calculateTotalCFTWeight();
    setFormData(prev => ({ ...prev, calculatedCFT: totalCFTWeight.toFixed(2) }));
    setShowCFTCalculator(false);
  };

  // FTL Mode: Pickup and Delivery Points Management
  const addPickupPoint = () => {
    const newPoint = {
      id: Date.now(),
      consignor: {
        name: '',
        address: '',
        contact: '',
        gst: ''
      },
      city: '',
      pieces: '',
      quantity: '',
      charges: ''
    };
    setFormData(prev => ({
      ...prev,
      pickupPoints: [...prev.pickupPoints, newPoint]
    }));
  };

  const removePickupPoint = (id) => {
    setFormData(prev => ({
      ...prev,
      pickupPoints: prev.pickupPoints.filter(point => point.id !== id)
    }));
  };

  const updatePickupPoint = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      pickupPoints: prev.pickupPoints.map(point => {
        if (point.id === id) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return {
              ...point,
              [parent]: {
                ...point[parent],
                [child]: value
              }
            };
          }
          return { ...point, [field]: value };
        }
        return point;
      })
    }));
  };

  const addDeliveryPoint = () => {
    const newPoint = {
      id: Date.now(),
      consignee: {
        name: '',
        address: '',
        contact: '',
        gst: ''
      },
      city: '',
      pieces: '',
      quantity: '',
      charges: ''
    };
    setFormData(prev => ({
      ...prev,
      deliveryPoints: [...prev.deliveryPoints, newPoint]
    }));
  };

  const removeDeliveryPoint = (id) => {
    setFormData(prev => ({
      ...prev,
      deliveryPoints: prev.deliveryPoints.filter(point => point.id !== id)
    }));
  };

  const updateDeliveryPoint = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      deliveryPoints: prev.deliveryPoints.map(point => {
        if (point.id === id) {
          if (field.includes('.')) {
            const [parent, child] = field.split('.');
            return {
              ...point,
              [parent]: {
                ...point[parent],
                [child]: value
              }
            };
          }
          return { ...point, [field]: value };
        }
        return point;
      })
    }));
  };

  // Calculate total pieces and quantity from all pickup/delivery points
  const calculateTotalPiecesFromPoints = () => {
    const pickupTotal = formData.pickupPoints.reduce((sum, point) => sum + (parseFloat(point.pieces) || 0), 0);
    const deliveryTotal = formData.deliveryPoints.reduce((sum, point) => sum + (parseFloat(point.pieces) || 0), 0);
    return pickupTotal + deliveryTotal;
  };

  const calculateTotalQuantityFromPoints = () => {
    const pickupTotal = formData.pickupPoints.reduce((sum, point) => sum + (parseFloat(point.quantity) || 0), 0);
    const deliveryTotal = formData.deliveryPoints.reduce((sum, point) => sum + (parseFloat(point.quantity) || 0), 0);
    return pickupTotal + deliveryTotal;
  };

  const calculateTotals = () => {
    const { rate, freightRate, lrCharges, hamali, pickupCharges, deliveryCharges, odaCharges, other, waraiUnion, gstPercent } = formData.charges;
    
    // Always use separate pickup and delivery charges
    const pickupDeliveryTotal = (parseFloat(pickupCharges) || 0) + (parseFloat(deliveryCharges) || 0);
    
    // Rate is per-piece/per-kg rate, not an amount. Only freightRate (calculated amount) should be included
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

  const addInvoice = () => {
    setFormData(prev => ({
      ...prev,
      invoices: [...prev.invoices, { number: '' }]
    }));
  };

  const removeInvoice = (index) => {
    setFormData(prev => ({
      ...prev,
      invoices: prev.invoices.filter((_, i) => i !== index)
    }));
  };

  const addEwaybill = () => {
    setFormData(prev => ({
      ...prev,
      ewaybills: [...prev.ewaybills, { number: '', expiryDate: '' }]
    }));
  };

  const removeEwaybill = (index) => {
    setFormData(prev => ({
      ...prev,
      ewaybills: prev.ewaybills.filter((_, i) => i !== index)
    }));
  };

  // Function to reset form to blank state with next LR number
  const resetForm = (generateNextLR = true) => {
    const nextLRNumber = generateNextLR ? getNextLRNumber() : '';
    
    setFormData({
      lrNumber: nextLRNumber,
      lrMode: 'auto',
      branch: '', // Will be auto-selected by useEffect based on logged-in user
      bookingMode: 'PTL',
      vehicleNumber: '',
      deliveryType: 'Godown',
      bookingDate: '',
      expectedDeliveryDate: '',
      paymentMode: 'Paid',
      tbbClient: '',
      consignor: {
        name: '',
        address: '',
        contact: '',
        gst: ''
      },
      consignee: {
        name: '',
        address: '',
        contact: '',
        gst: ''
      },
      origin: '',
      destination: '',
      odaDestination: '',
      pieces: '',
      weight: '',
      cftDimensions: {
        length: '',
        width: '',
        height: '',
        unit: 'cm',
        factor: 6
      },
      calculatedCFT: 0,
      invoices: [{ number: '' }],
      ewaybills: [{ number: '', expiryDate: '' }],
      pickupPoints: [],
      deliveryPoints: [],
      charges: {
        rate: '',
        freightRate: '',
        lrCharges: '',
        hamali: '',
        pickupDelivery: '',
        pickupCharges: '',
        deliveryCharges: '',
        odaCharges: '',
        other: '',
        waraiUnion: '',
        gstPercent: '5-rcm',
        calculationMethod: 'per-piece',
        minimumFreight: '',
        advanceFreight: '',
        balanceFreight: '',
        detentionCharges: '',
        agentCommission: '',
        tdsDeducted: ''
      },
      totalAmount: 0,
      gstAmount: 0
    });
    
    // Reset CFT entries
    setCftEntries([{
      id: 1,
      length: '',
      width: '',
      height: '',
      pieces: 1,
      unit: 'cm',
      factor: 6
    }]);
    
    // Reset selected cities and clients
    setSelectedOrigin(null);
    setSelectedDestination(null);
    setSelectedClient(null);
    setOriginSearch('');
    setDestinationSearch('');
    
    // Reset refs
    lastCalculatedFreight.current = 0;
    lastPieces.current = 0;
    lastWeight.current = 0;
    lastCFT.current = 0;
    lastCFTDimensions.current = JSON.stringify({ length: '', width: '', height: '', unit: 'cm', factor: 6 });
    isFreightManual.current = false;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Save LR to localStorage
    const existingLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    const newLR = {
      id: Date.now(),
      ...formData,
      cftEntries: cftEntries, // Include CFT entries for dimensions
      status: 'Booked',
      createdAt: new Date().toISOString()
    };
    
    existingLRs.push(newLR);
    localStorage.setItem('lrBookings', JSON.stringify(existingLRs));
    
    // Store saved LR ID and show dialog
    setLastSavedLRId(newLR.id);
    setShowSaveDialog(true);
  };

  const handlePrintLR = () => {
    setSavedLRId(lastSavedLRId);
    setShowPrintView(true);
    setShowSaveDialog(false);
  };

  const handleNextLRBooking = () => {
    setShowSaveDialog(false);
    resetForm(true); // Reset form and generate next LR number
    setLastSavedLRId(null);
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
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
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
        
        .btn-secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }
        
        .btn-secondary:hover {
          background: #3b82f6;
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
        }
        
        .btn-danger:hover {
          background: #dc2626;
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
        
        .toggle-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
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
        
        .calculator-modal {
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
          animation: fadeIn 0.2s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .calculator-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .rcm-notification {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          border-left: 4px solid #f59e0b;
          padding: 16px;
          border-radius: 8px;
          margin-top: 20px;
          font-size: 0.9rem;
          color: #92400e;
          font-weight: 500;
        }
        
        .total-section {
          background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          margin-top: 20px;
        }
        
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 1.1rem;
        }
        
        .total-row.grand {
          border-top: 2px solid rgba(255,255,255,0.2);
          margin-top: 12px;
          padding-top: 16px;
          font-size: 1.4rem;
          font-weight: 700;
        }
        
        .dynamic-item {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2" style={{ letterSpacing: '-0.02em' }}>
            PTL LR Booking Form
          </h1>
          <p className="text-slate-600 text-lg">Lorry Receipt Management System</p>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={(e) => {
          // Handle down arrow key navigation
          if (e.key === 'ArrowDown') {
            // For select dropdowns, allow native option selection (don't prevent default)
            if (e.target.tagName === 'SELECT') {
              // Let the browser handle dropdown option navigation
              return;
            }
            
            // For input fields (including city search inputs), check if dropdown is open
            if (e.target.tagName === 'INPUT') {
              // Check if this is a city search input with an open dropdown
              const isOriginSearch = e.target.placeholder?.includes('Type first 3 letters');
              const isDestinationSearch = e.target.placeholder?.includes('Type first 3 letters');
              
              // If it's a city search input, allow typing (don't prevent default)
              if (isOriginSearch || isDestinationSearch) {
                return;
              }
              
              // For regular input fields, move to next field
              e.preventDefault();
              const form = e.currentTarget;
              const focusableElements = Array.from(form.querySelectorAll(
                'input:not([type="hidden"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
              ));
              const currentIndex = focusableElements.indexOf(e.target);
              if (currentIndex < focusableElements.length - 1) {
                focusableElements[currentIndex + 1].focus();
              }
            }
            
            // For textarea, move to next field
            if (e.target.tagName === 'TEXTAREA') {
              e.preventDefault();
              const form = e.currentTarget;
              const focusableElements = Array.from(form.querySelectorAll(
                'input:not([type="hidden"]):not([readonly]):not([disabled]), select:not([disabled]), textarea:not([readonly]):not([disabled])'
              ));
              const currentIndex = focusableElements.indexOf(e.target);
              if (currentIndex < focusableElements.length - 1) {
                focusableElements[currentIndex + 1].focus();
              }
            }
          }
        }}>
          {/* LR Details & Booking Mode */}
          <div className="form-section">
            <h2 className="section-title">LR Details & Booking Mode</h2>
            
            <div className="grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label style={{ marginBottom: '8px' }}>LR Number Mode</label>
                <div className="toggle-group">
                  <button
                    type="button"
                    className={`toggle-btn ${formData.lrMode === 'auto' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, lrMode: 'auto' }))}
                  >
                    Auto Generate
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${formData.lrMode === 'manual' ? 'active' : ''}`}
                    onClick={() => setFormData(prev => ({ ...prev, lrMode: 'manual', lrNumber: '' }))}
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
                  value={formData.lrNumber}
                  onChange={(e) => {
                    if (formData.lrMode === 'manual' && e.target.value.length <= 10) {
                      setFormData(prev => ({ ...prev, lrNumber: e.target.value }));
                    }
                  }}
                  maxLength="10"
                  readOnly={formData.lrMode === 'auto'}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Booking Date</label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, bookingDate: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Expected Delivery Date</label>
                <input
                  type="date"
                  value={formData.expectedDeliveryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="input-group" style={{ marginTop: '16px' }}>
              <label>Branch (Auto-selected from login)</label>
              {branches.length === 0 ? (
                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '2px solid #fbbf24',
                  color: '#92400e',
                  fontSize: '0.9rem'
                }}>
                  âš ï¸ No branches available. Please add branches in Branch Master first.
                </div>
              ) : (
                <>
                  <select
                    value={formData.branch}
                    onChange={(e) => {
                      const branchId = e.target.value;
                      const branch = branches.find(b => b.id.toString() === branchId);
                      setSelectedBranch(branch);
                      setFormData(prev => ({ ...prev, branch: branchId }));
                    }}
                    required
                    disabled={!isAdmin && formData.branch !== ''} // Disable if not admin and branch is already selected
                    style={!isAdmin && formData.branch !== '' ? { background: '#f3f4f6', cursor: 'not-allowed' } : {}}
                  >
                    <option value="">-- Select Branch --</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName} - {branch.address?.city || branch.city || ''}
                      </option>
                    ))}
                  </select>
                  {!isAdmin && formData.branch && (
                    <small style={{ 
                      display: 'block', 
                      marginTop: '4px', 
                      color: '#64748b', 
                      fontSize: '0.75rem',
                      fontStyle: 'italic'
                    }}>
                      Branch auto-selected based on your login. Only Admin can change branch.
                    </small>
                  )}
                  {isAdmin && (
                    <small style={{ 
                      display: 'block', 
                      marginTop: '4px', 
                      color: '#3b82f6', 
                      fontSize: '0.75rem'
                    }}>
                      Admin: You can select any branch
                    </small>
                  )}
                </>
              )}
            </div>

            {formData.bookingMode === 'FTL' && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Vehicle Number</label>
                {vehicles.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    âš ï¸ No vehicles available. Please add vehicles in Vehicle Master.
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
                          {vehicle.vehicleNumber} - {vehicle.vehicleType} ({vehicle.capacity} {vehicle.capacityUnit})
                        </option>
                      ))}
                    </select>
                    {selectedVehicle && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        background: '#f1f5f9',
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        color: '#475569',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ marginBottom: '4px' }}><strong>Type:</strong> {selectedVehicle.vehicleType}</div>
                        <div style={{ marginBottom: '4px' }}><strong>Capacity:</strong> {selectedVehicle.capacity} {selectedVehicle.capacityUnit}</div>
                        <div><strong>Owner:</strong> {selectedVehicle.owner.name}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

          {/* Payment Details */}
          <div className="form-section">
            <h2 className="section-title">Payment Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Payment Mode</label>
                <select
                  value={formData.paymentMode}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMode: e.target.value }))}
                  required
                >
                  <option value="Paid">Paid</option>
                  <option value="ToPay">To Pay</option>
                  <option value="TBB">To Be Billed (TBB)</option>
                </select>
              </div>
              
              {/* Delivery Type - Show for PTL mode (editable) OR when TBB is selected (read-only from Rate Master) */}
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
                    <>
                      <div className="toggle-group">
                        <button
                          type="button"
                          className={`toggle-btn ${formData.deliveryType === 'Godown' ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Godown' }))}
                        >
                          Godown Delivery
                        </button>
                        <button
                          type="button"
                          className={`toggle-btn ${formData.deliveryType === 'Door' ? 'active' : ''}`}
                          onClick={() => setFormData(prev => ({ ...prev, deliveryType: 'Door' }))}
                        >
                          Door Delivery
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
              
            </div>
            
            {/* Rate Calculation Method - Show below Payment Mode and Delivery Type */}
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
                  <strong>{formData.charges.calculationMethod === 'per-piece' ? 'Per Piece' : formData.charges.calculationMethod === 'by-weight' ? 'Per KG' : 'Not set'}</strong>
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
                  <small style={{ 
                    display: 'block', 
                    marginTop: '4px', 
                    color: '#64748b', 
                    fontSize: '0.75rem' 
                  }}>
                    {formData.charges.calculationMethod === 'per-piece' 
                      ? 'Rate will be multiplied by number of pieces' 
                      : formData.charges.calculationMethod === 'by-weight'
                        ? 'Rate will be multiplied by weight (whichever is higher: actual weight or CFT weight)'
                        : ''}
                  </small>
                </div>
              ) : (
                // For non-TBB: Editable toggle
                <>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.charges.calculationMethod === 'per-piece' ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, calculationMethod: 'per-piece' }
                      }))}
                    >
                      Per Piece
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${formData.charges.calculationMethod === 'by-weight' ? 'active' : ''}`}
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, calculationMethod: 'by-weight' }
                      }))}
                    >
                      Per KG
                    </button>
                  </div>
                  <small style={{ 
                    display: 'block', 
                    marginTop: '4px', 
                    color: '#64748b', 
                    fontSize: '0.75rem' 
                  }}>
                    {formData.charges.calculationMethod === 'per-piece' 
                      ? 'Rate will be multiplied by number of pieces' 
                      : 'Rate will be multiplied by weight (whichever is higher: actual weight or CFT weight)'}
                  </small>
                </>
              )}
            </div>
            
            {formData.paymentMode === 'TBB' && (
                <div className="input-group">
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
                      value={formData.tbbClient}
                      onChange={(e) => {
                        const clientId = e.target.value;
                        const client = tbbClients.find(c => c.id?.toString() === clientId);
                        setSelectedClient(client);
                        setFormData(prev => ({ 
                          ...prev, 
                          tbbClient: clientId,
                          // Auto-populate delivery type from Client Master
                          deliveryType: client && client.deliveryType ? client.deliveryType : prev.deliveryType
                        }));
                      }}
                      required
                    >
                      <option value="">-- Select TBB Client --</option>
                      {tbbClients.map(client => (
                        <option key={client.id} value={client.id}>
                          {client.clientName || client.companyName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
          </div>

          {/* Route Details */}
          <div className="form-section">
            <h2 className="section-title">Route Details</h2>
            
            <div className="grid-3">
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
                          <div style={{ padding: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                            No cities found starting with "{originSearch.substring(0, 3)}"
                          </div>
                        )}
                      </div>
                    )}
                    {selectedOrigin && !showOriginDropdown && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        {selectedOrigin.zone} Zone • {selectedOrigin.state}
                        {selectedOrigin.isODA && <span style={{ color: '#f59e0b', fontWeight: 600 }}> • ODA</span>}
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
                            setFormData(prev => ({ 
                              ...prev, 
                              destination: city.id.toString(),
                              odaDestination: city && city.isODA ? city.cityName : prev.odaDestination
                            }));
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
                                // Auto-populate ODA destination if city is ODA
                                setFormData(prev => ({ 
                                  ...prev, 
                                  destination: city.id.toString(),
                                  odaDestination: city && city.isODA ? city.cityName : prev.odaDestination
                                }));
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
                          <div style={{ padding: '10px', color: '#64748b', fontSize: '0.9rem' }}>
                            No cities found starting with "{destinationSearch.substring(0, 3)}"
                          </div>
                        )}
                      </div>
                    )}
                    {selectedDestination && !showDestinationDropdown && (
                      <div style={{
                        marginTop: '6px',
                        fontSize: '0.85rem',
                        color: '#64748b'
                      }}>
                        {selectedDestination.zone} Zone • {selectedDestination.state}
                        {selectedDestination.isODA && <span style={{ color: '#f59e0b', fontWeight: 600 }}> • ODA</span>}
                        {selectedDestination.transitDays && <span> • {selectedDestination.transitDays} days transit</span>}
                      </div>
                    )}
                  </>
                )}
              </div>
              
              <div className="input-group">
                <label>ODA Location</label>
                <input
                  type="text"
                  value={formData.odaDestination}
                  onChange={(e) => setFormData(prev => ({ ...prev, odaDestination: e.target.value }))}
                  placeholder="Enter ODA location/address"
                />
                {selectedDestination && selectedDestination.isODA && (
                  <div style={{
                    marginTop: '6px',
                    fontSize: '0.85rem',
                    color: '#f59e0b',
                    fontWeight: 600
                  }}>
                    ⚠️ ODA charges applicable
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Consignor Details */}
          {formData.bookingMode !== 'FTL' && (
          <div className="form-section">
            <h2 className="section-title">Consignor Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Consignor Name</label>
                <input
                  type="text"
                  value={formData.consignor.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignor: { ...prev.consignor, name: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.consignor.contact}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignor: { ...prev.consignor, contact: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Address</label>
                <textarea
                  value={formData.consignor.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignor: { ...prev.consignor, address: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>GST Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.consignor.gst}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData(prev => ({
                      ...prev,
                      consignor: { ...prev.consignor, gst: value }
                    }));
                  }}
                  maxLength={formData.consignor.gst === 'URP' ? 3 : 15}
                  placeholder="15 characters or URP"
                />
              </div>
            </div>
          </div>
          )}

          {/* Consignee Details */}
          {formData.bookingMode !== 'FTL' && (
          <div className="form-section">
            <h2 className="section-title">Consignee Details</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Consignee Name</label>
                <input
                  type="text"
                  value={formData.consignee.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignee: { ...prev.consignee, name: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Contact Number</label>
                <input
                  type="tel"
                  value={formData.consignee.contact}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignee: { ...prev.consignee, contact: e.target.value }
                  }))}
                />
              </div>
            </div>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Address</label>
                <textarea
                  value={formData.consignee.address}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    consignee: { ...prev.consignee, address: e.target.value }
                  }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>GST Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.consignee.gst}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    setFormData(prev => ({
                      ...prev,
                      consignee: { ...prev.consignee, gst: value }
                    }));
                  }}
                  maxLength={formData.consignee.gst === 'URP' ? 3 : 15}
                  placeholder="15 characters or URP"
                />
              </div>
            </div>
          </div>
          )}

          {/* Shipment Details */}
          <div className="form-section">
            <h2 className="section-title">Shipment Details</h2>
            
            {formData.bookingMode === 'FTL' ? (
              <div>
                <div style={{
                  padding: '12px',
                  background: '#dbeafe',
                  borderRadius: '6px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  color: '#1e40af'
                }}>
                  <strong>FTL Mode:</strong> Pieces and weight are calculated from pickup/delivery points below, or you can enter manually.
                </div>
                <div className="grid-3">
                  <div className="input-group">
                    <label>Total Pieces</label>
                    <input
                      type="number"
                      value={formData.pieces || calculateTotalPiecesFromPoints()}
                      onChange={(e) => setFormData(prev => ({ ...prev, pieces: e.target.value }))}
                      min="0"
                      placeholder="Auto from points or manual"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      From points: {calculateTotalPiecesFromPoints()} pieces
                    </small>
                  </div>
                  
                  <div className="input-group">
                    <label>Total Weight (kg)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.weight || calculateTotalQuantityFromPoints()}
                      onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                      min="0"
                      placeholder="Auto from points or manual"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      From points: {calculateTotalQuantityFromPoints().toFixed(2)} kg
                    </small>
                  </div>
                  
                  <div className="input-group">
                    <label>Calculated CFT</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.calculatedCFT}
                        onChange={(e) => setFormData(prev => ({ ...prev, calculatedCFT: e.target.value }))}
                        min="0"
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setCftEntries([{
                            id: 1,
                            length: '',
                            width: '',
                            height: '',
                            pieces: 1,
                            unit: 'cm',
                            factor: 6
                          }]);
                          setShowCFTCalculator(true);
                        }}
                        title="CFT Calculator"
                      >
                        <Calculator size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid-3">
                <div className="input-group">
                  <label>Number of Pieces</label>
                  <input
                    type="number"
                    value={formData.pieces}
                    onChange={(e) => setFormData(prev => ({ ...prev, pieces: e.target.value }))}
                    min="1"
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label>Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
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
                      value={formData.calculatedCFT}
                      onChange={(e) => setFormData(prev => ({ ...prev, calculatedCFT: e.target.value }))}
                      min="0"
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setCftEntries([{
                          id: 1,
                          length: '',
                          width: '',
                          height: '',
                          pieces: 1,
                          unit: 'cm',
                          factor: 6
                        }]);
                        setShowCFTCalculator(true);
                      }}
                      title="CFT Calculator"
                    >
                      <Calculator size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Freight Charges */}
          {formData.bookingMode !== 'FTL' && (
          <div className="form-section">
            <h2 className="section-title">Freight Charges</h2>
            
            
            {formData.paymentMode === 'TBB' && formData.bookingMode !== 'FTL' && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                background: '#fef3c7', 
                borderRadius: '8px',
                border: '1px solid #fbbf24'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                  <strong style={{ color: '#92400e' }}>TBB Mode - Rates from Client Rate Master</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#78350f' }}>
                  {formData.tbbClient && formData.origin && formData.destination 
                    ? 'Rate will be automatically fetched from Client Rate Master based on selected client, origin, and destination.'
                    : 'Please select TBB Client, Origin, and Destination to fetch rates automatically.'}
                </div>
                {formData.charges.rate && (
                  <div style={{ marginTop: '8px', padding: '8px', background: '#fef9c3', borderRadius: '4px', fontSize: '0.85rem' }}>
                    <strong>Fetched Rate:</strong> ₹{formData.charges.rate} {formData.charges.calculationMethod === 'per-piece' ? 'per piece' : 'per kg'}
                  </div>
                )}
              </div>
            )}
            
            {formData.paymentMode === 'TBB' && formData.bookingMode === 'FTL' && (
              <div style={{ 
                marginBottom: '16px', 
                padding: '12px', 
                background: '#dbeafe', 
                borderRadius: '8px',
                border: '1px solid #3b82f6'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.2rem' }}>ℹ️</span>
                  <strong style={{ color: '#1e40af' }}>FTL + TBB Mode - Freight from Rate Master</strong>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#1e3a8a' }}>
                  {formData.tbbClient && formData.origin && formData.destination 
                    ? 'Freight will be automatically fetched from Client Rate Master if available, or you can enter manually.'
                    : 'Please select TBB Client, Origin, and Destination to fetch freight automatically, or enter manually.'}
                </div>
              </div>
            )}
            
            <div className="grid-3">
              {formData.bookingMode !== 'FTL' && (
                <div className="input-group">
                  <label>Rate * ({formData.charges.calculationMethod === 'per-piece' ? 'Per Piece' : 'Per KG'})</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.charges.rate}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      charges: { ...prev.charges, rate: e.target.value }
                    }))}
                    min="0"
                    placeholder={formData.paymentMode === 'TBB' 
                      ? 'Auto-fetched from Client Rate Master' 
                      : formData.charges.calculationMethod === 'per-piece' 
                        ? 'Rate per piece' 
                        : 'Rate per kg'}
                    required
                    disabled={formData.paymentMode === 'TBB'}
                    readOnly={formData.paymentMode === 'TBB'}
                    style={{
                      background: formData.paymentMode === 'TBB' ? '#f1f5f9' : 'white',
                      cursor: formData.paymentMode === 'TBB' ? 'not-allowed' : 'text'
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    marginTop: '4px', 
                    color: formData.paymentMode === 'TBB' ? '#f59e0b' : '#64748b', 
                    fontSize: '0.75rem',
                    fontWeight: formData.paymentMode === 'TBB' ? 600 : 400
                  }}>
                    {formData.paymentMode === 'TBB' 
                      ? '✓ Auto-fetched from Client Rate Master (based on client, origin, destination)'
                      : formData.charges.calculationMethod === 'per-piece' 
                        ? '✓ Rate will be multiplied by number of pieces' 
                        : '✓ Rate will be multiplied by weight (whichever is higher: actual weight or CFT weight)'}
                  </small>
                </div>
              )}
              
              {formData.bookingMode !== 'FTL' && (
                <div className="input-group">
                  <label>Freight Rate *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.charges.freightRate}
                    onChange={(e) => {
                      const manualValue = e.target.value;
                      const manualFreight = parseFloat(manualValue) || 0;
                      
                      // Mark as manually entered
                      isFreightManual.current = true;
                      lastCalculatedFreight.current = manualFreight;
                      
                      setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, freightRate: manualValue }
                      }));
                    }}
                    min="0"
                    required
                    style={{
                      background: formData.charges.rate && (
                        (formData.charges.calculationMethod === 'per-piece' && formData.pieces) ||
                        (formData.charges.calculationMethod === 'by-weight' && formData.weight)
                      ) ? '#f0fdf4' : 'white',
                      borderColor: formData.charges.rate && (
                        (formData.charges.calculationMethod === 'per-piece' && formData.pieces) ||
                        (formData.charges.calculationMethod === 'by-weight' && formData.weight)
                      ) ? '#10b981' : '#e2e8f0'
                    }}
                  />
                  <small style={{ 
                    display: 'block', 
                    marginTop: '4px', 
                    color: '#64748b', 
                    fontSize: '0.75rem' 
                  }}>
                    {formData.charges.rate && (
                      (formData.charges.calculationMethod === 'per-piece' && formData.pieces) ||
                      (formData.charges.calculationMethod === 'by-weight' && (formData.weight || formData.calculatedCFT))
                    )
                      ? `✓ Auto-calculated: Rate × ${formData.charges.calculationMethod === 'per-piece' ? 'Pieces' : 'Weight (whichever is higher: actual or CFT)'} (can be edited manually)` 
                      : formData.charges.calculationMethod === 'per-piece'
                        ? 'Enter manually or fill Rate + Pieces for auto-calculation'
                        : 'Enter manually or fill Rate + Weight/CFT for auto-calculation (uses whichever is higher: actual weight or CFT weight)'}
                  </small>
                </div>
              )}
              
              <div className="input-group">
                <label>LR Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.lrCharges}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, lrCharges: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Hamali Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.hamali}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, hamali: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              {/* Separate Pickup and Delivery charges for all payment modes */}
              <div className="input-group">
                <label>Pickup Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.pickupCharges}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, pickupCharges: e.target.value }
                  }))}
                  min="0"
                  placeholder={formData.paymentMode === 'TBB' && formData.tbbClient ? 'From Rate Master' : 'Enter pickup charges'}
                  style={{
                    background: formData.paymentMode === 'TBB' && formData.tbbClient && formData.charges.pickupCharges ? '#f1f5f9' : 'white'
                  }}
                />
                {formData.paymentMode === 'TBB' && formData.tbbClient && formData.charges.pickupCharges && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                    Auto-fetched from Rate Master
                  </small>
                )}
              </div>
              
              <div className="input-group">
                <label>Delivery Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.deliveryCharges}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, deliveryCharges: e.target.value }
                  }))}
                  min="0"
                  placeholder={formData.paymentMode === 'TBB' && formData.tbbClient ? 'From Rate Master' : 'Enter delivery charges'}
                  style={{
                    background: formData.paymentMode === 'TBB' && formData.tbbClient && formData.charges.deliveryCharges ? '#f1f5f9' : 'white'
                  }}
                />
                {formData.paymentMode === 'TBB' && formData.tbbClient && formData.charges.deliveryCharges && (
                  <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                    Auto-fetched from Rate Master
                  </small>
                )}
              </div>
              
              <div className="input-group">
                <label>ODA Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.odaCharges}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, odaCharges: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Other Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.other}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, other: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Warai/Union Charges</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.charges.waraiUnion}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, waraiUnion: e.target.value }
                  }))}
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>GST (%)</label>
                <select
                  value={formData.charges.gstPercent}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    charges: { ...prev.charges, gstPercent: e.target.value }
                  }))}
                  required
                >
                  <option value="5-rcm">5% (RCM)</option>
                  <option value="exempted">Exempted</option>
                  <option value="5">5%</option>
                  <option value="18">18%</option>
                </select>
              </div>
            </div>
          </div>
          )}

          {/* FTL Mode removed - use FTL Booking Form instead */}
          {false && (
            <div style={{ marginTop: '24px', padding: '20px', background: '#f0f9ff', borderRadius: '8px', border: '2px solid #0ea5e9' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#0c4a6e', marginBottom: '16px' }}>
                  FTL Mode - Freight Details
                </h3>
                
                <div className="grid-3">
                  <div className="input-group">
                    <label>Freight Rate *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.freightRate}
                      onChange={(e) => {
                        const manualValue = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          charges: { ...prev.charges, freightRate: manualValue }
                        }));
                      }}
                      min="0"
                      required
                      placeholder={formData.paymentMode === 'TBB' ? 'From Rate Master or Manual' : 'Enter Freight'}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      {formData.paymentMode === 'TBB' 
                        ? 'Can be fetched from Rate Master for TBB client or entered manually'
                        : 'Enter freight directly'}
                    </small>
                  </div>

                  <div className="input-group">
                    <label>LR Charges</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.lrCharges}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, lrCharges: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="input-group">
                    <label>Advance Freight</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.advanceFreight}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, advanceFreight: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      Advance payment received
                    </small>
                  </div>

                  <div className="input-group">
                    <label>Balance Freight (Auto)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.balanceFreight}
                      readOnly
                      style={{ background: '#f1f5f9', cursor: 'not-allowed' }}
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      = Freight - Advance - Agent Commission - TDS
                    </small>
                  </div>

                  <div className="input-group">
                    <label>Hamali Charges</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.hamali}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, hamali: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="input-group">
                    <label>Detention Charges</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.detentionCharges}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, detentionCharges: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      Can be edited until POD upload
                    </small>
                  </div>

                  <div className="input-group">
                    <label>Agent Commission (Deducted)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.agentCommission}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, agentCommission: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      Deducted from freight, reflects in ledger
                    </small>
                  </div>

                  <div className="input-group">
                    <label>TDS Deducted</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.charges.tdsDeducted}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        charges: { ...prev.charges, tdsDeducted: e.target.value }
                      }))}
                      min="0"
                      placeholder="0.00"
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                      TDS deducted, reflects in ledger
                    </small>
                  </div>
                </div>

              </div>
            )}

          {/* Invoice Numbers - Moved from Shipment Details */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ marginBottom: 0 }}>Invoice Numbers</label>
              <button type="button" className="btn btn-secondary" onClick={addInvoice}>
                <Plus size={16} /> Add Invoice
              </button>
            </div>
            
            {formData.invoices.map((invoice, index) => (
              <div key={index} className="dynamic-item">
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Invoice Number"
                    value={invoice.number}
                    onChange={(e) => {
                      const newInvoices = [...formData.invoices];
                      newInvoices[index].number = e.target.value;
                      setFormData(prev => ({ ...prev, invoices: newInvoices }));
                    }}
                    style={{ flex: 1 }}
                  />
                  {formData.invoices.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeInvoice(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* E-Waybills - Moved from Shipment Details */}
          <div style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <label style={{ marginBottom: 0 }}>E-Waybills</label>
                <button type="button" className="btn btn-secondary" onClick={addEwaybill}>
                  <Plus size={16} /> Add E-Waybill
                </button>
              </div>
              
            {formData.ewaybills.map((ewaybill, index) => (
              <div key={index} className="dynamic-item">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '12px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="E-Waybill Number"
                      value={ewaybill.number}
                      onChange={(e) => {
                        const newEwaybills = [...formData.ewaybills];
                        newEwaybills[index].number = e.target.value;
                        setFormData(prev => ({ ...prev, ewaybills: newEwaybills }));
                      }}
                    />
                    <input
                      type="date"
                      placeholder="Expiry Date"
                      value={ewaybill.expiryDate}
                      onChange={(e) => {
                        const newEwaybills = [...formData.ewaybills];
                        newEwaybills[index].expiryDate = e.target.value;
                        setFormData(prev => ({ ...prev, ewaybills: newEwaybills }));
                      }}
                    />
                    {formData.ewaybills.length > 1 && (
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeEwaybill(index)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                </div>
              </div>
            ))}
          </div>

          {formData.charges.gstPercent === '5-rcm' && (
            <div className="rcm-notification">
                âš ï¸ Reverse Charge Mechanism (RCM) applicable - GST to be paid by recipient
                <div style={{ marginTop: '8px', fontSize: '1.1rem', fontWeight: 700 }}>
                  RCM Amount (5%): {formData.gstAmount.toFixed(2)}
                </div>
              </div>
            )}

          {formData.charges.gstPercent === 'exempted' && (
            <div className="rcm-notification" style={{
                background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                borderLeft: '4px solid #2563eb'
              }}>
                â„¹ï¸ GST Exempted - No GST applicable on this transaction
              </div>
            )}

          <div className="total-section">
            <div className="total-row">
              <span>Subtotal:</span>
              <span className="mono">{(
                (parseFloat(formData.charges.freightRate) || 0) +
                (parseFloat(formData.charges.lrCharges) || 0) +
                (parseFloat(formData.charges.hamali) || 0) +
                (parseFloat(formData.charges.pickupCharges) || 0) + (parseFloat(formData.charges.deliveryCharges) || 0) +
                (parseFloat(formData.charges.odaCharges) || 0) +
                (parseFloat(formData.charges.other) || 0) +
                (parseFloat(formData.charges.waraiUnion) || 0)
              ).toFixed(2)}</span>
            </div>
            <div className="total-row">
              <span>GST ({
                formData.charges.gstPercent === 'exempted' ? 'Exempted' : 
                formData.charges.gstPercent === '5-rcm' ? '5% RCM' :
                formData.charges.gstPercent + '%'
              }):</span>
              <span className="mono">{formData.gstAmount.toFixed(2)}</span>
            </div>
            <div className="total-row grand">
              <span>Grand Total:</span>
              <span className="mono">{formData.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Bottom Notifications */}
          {(formData.deliveryType === 'Godown' || formData.paymentMode === 'ToPay') && (
            <div style={{
              background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
              border: '3px solid #dc2626',
              borderRadius: '12px',
              padding: '24px',
              marginTop: '20px',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#991b1b',
                letterSpacing: '0.1em',
                lineHeight: '1.6'
              }}>
                {formData.deliveryType === 'Godown' && formData.bookingMode === 'PTL' && (
                  <div>GODOWN DELIVERY</div>
                )}
                {formData.paymentMode === 'ToPay' && (
                  <div>TO PAY</div>
                )}
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Printer size={20} />
              Save & Print LR
            </button>
            {savedLRId && (
              <button 
                type="button"
                onClick={() => {
                  setShowPrintView(true);
                }}
                className="btn btn-secondary" 
                style={{ fontSize: '1.1rem', padding: '14px 40px', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <Printer size={20} />
                Print LR
              </button>
            )}
          </div>
        </form>
      </div>

      {/* CFT Calculator Modal */}
      {showCFTCalculator && (
        <div className="calculator-modal" onClick={() => setShowCFTCalculator(false)}>
          <div className="calculator-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                  // Reset entries when closing
                  setCftEntries([{
                    id: 1,
                    length: '',
                    width: '',
                    height: '',
                    pieces: 1,
                    unit: 'cm',
                    factor: 6
                  }]);
                }}
                style={{ flex: 1 }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Dialog */}
      {showSaveDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
            textAlign: 'center'
          }}>
            <div style={{
              fontSize: '3rem',
              marginBottom: '16px'
            }}>
              ✅
            </div>
            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: 600,
              color: '#1e293b',
              marginBottom: '8px'
            }}>
              LR Booking Saved Successfully!
            </h2>
            <p style={{
              fontSize: '1rem',
              color: '#64748b',
              marginBottom: '32px'
            }}>
              What would you like to do next?
            </p>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center'
            }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handlePrintLR}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                <Printer size={20} />
                Print LR
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleNextLRBooking}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: 600
                }}
              >
                Next LR Booking
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Print View Modal */}
      {showPrintView && savedLRId && (
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
            lrId={savedLRId} 
            onClose={() => {
              setShowPrintView(false);
              setSavedLRId(null);
              // After closing print view, reset form for next booking
              resetForm(true);
            }} 
          />
        </div>
      )}

    </div>
  );
}
