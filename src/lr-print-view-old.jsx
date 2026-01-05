import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function LRPrintView({ lrId, onClose }) {
  const [lrData, setLrData] = useState(null);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [tbbClients, setTbbClients] = useState([]);
  const [clientRates, setClientRates] = useState([]);
  const [showAmountsInPrint, setShowAmountsInPrint] = useState(true);

  useEffect(() => {
    const loadData = () => {
    const allLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
    const allCities = JSON.parse(localStorage.getItem('cities') || '[]');
    const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
    const allClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    const allClientRates = JSON.parse(localStorage.getItem('clientRates') || '[]');
    
    setCities(allCities);
    setBranches(allBranches);
    setTbbClients(allClients);
    setClientRates(allClientRates);

    // Get LR ID from props or sessionStorage
    const idToUse = lrId || sessionStorage.getItem('printLRId');
    if (idToUse) {
      const lr = allLRs.find(l => l.id.toString() === idToUse.toString());
      if (lr) {
        setLrData(lr);
      }
    }
    };
    
    loadData();
    
    // Also listen for storage changes to reload cities if they're added later
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lrId]);

  // Reload cities when lrData changes to ensure we have the latest data
  useEffect(() => {
    if (lrData && (!cities || cities.length === 0)) {
      const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
      if (storedCities && storedCities.length > 0) {
        setCities(storedCities);
      }
    }
  }, [lrData, cities]);

  // Check Rate Master setting for showing/hiding amounts in print
  useEffect(() => {
    if (lrData && lrData.paymentMode === 'TBB' && lrData.tbbClient && clientRates.length > 0 && cities.length > 0) {
      const client = tbbClients.find(c => c.id?.toString() === lrData.tbbClient || c.code === lrData.tbbClient);
      const originCity = cities.find(c => c.code === lrData.origin || c.id?.toString() === lrData.origin);
      const destCity = cities.find(c => c.code === lrData.destination || c.id?.toString() === lrData.destination);
      
      if (client && originCity && destCity) {
        // Find matching rate from Rate Master
        const matchingRate = clientRates.find(rate => {
          if (rate.status !== 'Active') return false;
          
          const rateClientId = rate.clientId?.toString();
          const rateClientCode = rate.clientCode;
          const clientMatches = rateClientId === client.id?.toString() || 
                               rateClientId === client.code ||
                               rateClientCode === client.code ||
                               rateClientCode === client.id?.toString();
          
          if (!clientMatches) return false;
          
          // Check city match
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
        
        // Set showAmountsInPrint from Rate Master (default to true if not found)
        if (matchingRate && matchingRate.showAmountsInPrint !== undefined) {
          setShowAmountsInPrint(matchingRate.showAmountsInPrint);
        } else {
          setShowAmountsInPrint(true); // Default to showing amounts
        }
      } else {
        setShowAmountsInPrint(true); // Default to showing amounts if no match
      }
    } else {
      setShowAmountsInPrint(true); // Default to showing amounts for non-TBB or if data not ready
    }
  }, [lrData, clientRates, cities, tbbClients]);

  const getCityName = (cityCode) => {
    // Handle null, undefined, empty string
    if (cityCode === null || cityCode === undefined || cityCode === '') {
      return '';
    }
    
    // Convert to string for comparison
    const cityCodeStr = String(cityCode).trim();
    if (!cityCodeStr || cityCodeStr === 'null' || cityCodeStr === 'undefined') {
      return '';
    }
    
    // Always try to get cities from localStorage if cities array is empty
    let citiesToSearch = cities;
    if (!citiesToSearch || citiesToSearch.length === 0) {
      const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
      if (storedCities && storedCities.length > 0) {
        citiesToSearch = storedCities;
        // Update state for future use
        if (cities.length === 0) {
          setCities(storedCities);
        }
      }
    }
    
    // If still no cities, return the value as-is (might already be a city name)
    if (!citiesToSearch || citiesToSearch.length === 0) {
      return cityCodeStr;
    }
    
    // Try to find by ID first (most common case - stored as ID string/number)
    let city = citiesToSearch.find(c => {
      if (!c) return false;
      
      // Check by ID (exact match)
      if (c.id !== null && c.id !== undefined) {
        const cityIdStr = String(c.id).trim();
        if (cityIdStr === cityCodeStr) return true;
      }
      
      // Check by code
      if (c.code) {
        const codeStr = String(c.code).trim();
        if (codeStr === cityCodeStr) return true;
      }
      
      // Check by cityName (in case it's stored as name)
      if (c.cityName) {
        const nameStr = String(c.cityName).trim();
        if (nameStr === cityCodeStr) return true;
      }
      
      return false;
    });
    
    // If still not found, try case-insensitive match
    if (!city) {
      const searchStrLower = cityCodeStr.toLowerCase();
      city = citiesToSearch.find(c => {
        if (!c) return false;
        
        if (c.id !== null && c.id !== undefined) {
          if (String(c.id).trim().toLowerCase() === searchStrLower) return true;
        }
        if (c.code && String(c.code).trim().toLowerCase() === searchStrLower) return true;
        if (c.cityName && String(c.cityName).trim().toLowerCase() === searchStrLower) return true;
        
        return false;
      });
    }
    
    // Return city name if found
    if (city && city.cityName) {
      return city.cityName;
    }
    
    // If not found, return the original value (might already be a city name)
    return cityCodeStr;
  };

  const getBranchName = (branchCode) => {
    if (!branchCode) return '';
    const branch = branches.find(b => b.branchCode === branchCode || b.id.toString() === branchCode);
    return branch ? branch.branchName : branchCode;
  };

  const getClientName = (clientCode) => {
    if (!clientCode) return '';
    const client = tbbClients.find(c => c.code === clientCode || c.id === clientCode);
    return client ? client.companyName : clientCode;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
  };

  // Format date as DD-MMM-YYYY (e.g., 30-Dec-2025)
  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Get origin and destination in CITY-CITY format
  const getOriginDestination = () => {
    const originCity = getCityName(lrData.origin);
    const destCity = getCityName(lrData.destination);
    return `${originCity.toUpperCase()}-${destCity.toUpperCase()}`;
  };

  // Get invoice value (if available, otherwise 0)
  const getInvoiceValue = () => {
    // Try to get from invoices if stored, otherwise return 0
    return '0'; // Default to 0 as invoice value is not stored in current structure
  };

  // Get description of goods
  const getDescriptionOfGoods = () => {
    if (lrData.cftEntries && lrData.cftEntries.length > 0) {
      return lrData.cftEntries.map(entry => 
        `Carton Boxes - ${entry.pieces || 1}`
      ).join(', ');
    }
    return `Carton Boxes - ${lrData.pieces || 0}`;
  };

  // Get dimension string
  const getDimensionString = () => {
    if (lrData.cftEntries && lrData.cftEntries.length > 0) {
      const firstEntry = lrData.cftEntries[0];
      if (firstEntry.length && firstEntry.width && firstEntry.height) {
        return `${firstEntry.length} x ${firstEntry.width} x ${firstEntry.height} ${firstEntry.unit || 'cm'}`;
      }
    }
    if (lrData.cftDimensions?.length && lrData.cftDimensions?.width && lrData.cftDimensions?.height) {
      return `${lrData.cftDimensions.length} x ${lrData.cftDimensions.width} x ${lrData.cftDimensions.height} ${lrData.cftDimensions.unit || 'cm'}`;
    }
    return '';
  };

  // Get mode of booking
  const getModeOfBooking = () => {
    if (lrData.bookingMode === 'PTL' || lrData.bookingMode === 'FTL') return 'Road';
    return 'Road'; // Default
  };

  // Get booking type
  const getBookingType = () => {
    if (lrData.paymentMode === 'TBB') return 'To Be Billed';
    if (lrData.paymentMode === 'Paid') return 'Paid';
    if (lrData.paymentMode === 'ToPay') return 'To Pay';
    return 'To Be Billed';
  };

  // Get freight type
  const getFreightType = () => {
    return 'SUNDRY'; // Default
  };

  // Get consignor address with pin
  const getConsignorAddress = () => {
    const address = lrData.consignor?.address || '';
    // Try to extract pin if available
    const pinMatch = address.match(/\b\d{6}\b/);
    const pin = pinMatch ? pinMatch[0] : '';
    return { address, pin };
  };

  // Get consignee address with pin
  const getConsigneeAddress = () => {
    const address = lrData.consignee?.address || '';
    // Try to extract pin if available
    const pinMatch = address.match(/\b\d{6}\b/);
    const pin = pinMatch ? pinMatch[0] : '0';
    return { address, pin };
  };

  const calculateChargedWeight = () => {
    if (!lrData) return '';
    const actualWeight = parseFloat(lrData.weight || 0);
    const cftWeight = parseFloat(lrData.calculatedCFT || 0);
    // calculatedCFT already contains the CFT weight in kg (calculated from dimensions)
    // Charged weight is the higher of actual weight or CFT weight
    return Math.max(actualWeight, cftWeight).toFixed(2);
  };

  const calculateSubtotal = () => {
    if (!lrData || !lrData.charges) return 0;
    const { freightRate, lrCharges, hamali, pickupCharges, deliveryCharges, odaCharges, other, waraiUnion } = lrData.charges;
    // Always use separate pickup and delivery charges
    const pickupDeliveryTotal = (parseFloat(pickupCharges) || 0) + (parseFloat(deliveryCharges) || 0);
    // Rate is per-piece/per-kg rate, not an amount. Only freightRate (calculated amount) should be included
    return (parseFloat(freightRate) || 0) + 
           (parseFloat(lrCharges) || 0) + 
           (parseFloat(hamali) || 0) + 
           pickupDeliveryTotal + 
           (parseFloat(odaCharges) || 0) + 
           (parseFloat(other) || 0) + 
           (parseFloat(waraiUnion) || 0);
  };

  const getGSTBreakdown = () => {
    if (!lrData || !lrData.charges) return { igst: 0, cgst: 0, sgst: 0 };
    const subtotal = calculateSubtotal();
    const gstPercent = lrData.charges.gstPercent;
    
    let gstRate = 0;
    if (gstPercent === 'exempted') {
      gstRate = 0;
    } else if (gstPercent === '5-rcm') {
      gstRate = 5;
    } else {
      gstRate = parseFloat(gstPercent) || 0;
    }
    
    const totalGST = (subtotal * gstRate) / 100;
    
    // For interstate: IGST, For intrastate: CGST + SGST
    const originCity = cities.find(c => 
      c.id?.toString() === lrData.origin?.toString() || 
      c.code === lrData.origin || 
      c.cityName === lrData.origin
    );
    const destCity = cities.find(c => 
      c.id?.toString() === lrData.destination?.toString() || 
      c.code === lrData.destination || 
      c.cityName === lrData.destination
    );
    const isInterstate = originCity?.state !== destCity?.state;
    
    if (isInterstate) {
      return { igst: totalGST, cgst: 0, sgst: 0 };
    } else {
      return { igst: 0, cgst: totalGST / 2, sgst: totalGST / 2 };
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!lrData) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <p>Loading LR data...</p>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const gstBreakdown = getGSTBreakdown();
  const grandTotal = subtotal + gstBreakdown.igst + gstBreakdown.cgst + gstBreakdown.sgst;
  const chargedWeight = calculateChargedWeight();

  return (
    <div>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .lr-print-container, .lr-print-container * {
            visibility: visible;
          }
          .lr-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
        
        @page {
          size: A4;
          margin: 0;
        }
        
        .lr-print-container {
          width: 210mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          padding: 0;
          font-family: Arial, sans-serif;
          font-size: 11px;
          color: black;
        }
        
        .lr-header {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: white;
          padding: 12px 16px;
          text-align: center;
        }
        
        .company-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 4px;
          letter-spacing: 1px;
        }
        
        .company-address {
          font-size: 10px;
          margin-bottom: 2px;
        }
        
        .company-contact {
          font-size: 9px;
          margin-top: 4px;
        }
        
        .lr-body {
          padding: 12px 16px;
        }
        
        .lr-section {
          margin-bottom: 12px;
          border: 1px solid #000;
        }
        
        .section-header {
          background: #f0f0f0;
          padding: 4px 8px;
          font-weight: bold;
          font-size: 10px;
          border-bottom: 1px solid #000;
        }
        
        .section-content {
          padding: 8px;
        }
        
        .lr-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        .lr-field {
          margin-bottom: 6px;
        }
        
        .field-label {
          font-size: 9px;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .field-value {
          font-size: 11px;
          min-height: 18px;
          border-bottom: 1px solid #ccc;
          padding: 2px 4px;
        }
        
        .field-value.empty {
          border-bottom: 1px dashed #999;
        }
        
        .charges-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        
        .charges-table th,
        .charges-table td {
          border: 1px solid #000;
          padding: 4px 6px;
          text-align: left;
        }
        
        .charges-table th {
          background: #f0f0f0;
          font-weight: bold;
          text-align: center;
        }
        
        .charges-table td {
          text-align: right;
        }
        
        .signature-section {
          margin-top: 16px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        
        .signature-box {
          border: 1px solid #000;
          padding: 8px;
          min-height: 60px;
        }
        
        .footer {
          margin-top: 16px;
          padding: 8px;
          text-align: center;
          font-size: 9px;
          border-top: 2px solid #000;
        }
        
        .barcode {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          letter-spacing: 2px;
          font-weight: bold;
        }
        
        .mode-checkbox {
          display: inline-block;
          width: 12px;
          height: 12px;
          border: 1px solid #000;
          margin-right: 4px;
          vertical-align: middle;
        }
        
        .mode-checked {
          background: #000;
        }
      `}</style>

      {/* Print Controls - Hidden when printing */}
      <div className="no-print" style={{ 
        position: 'fixed', 
        top: '20px', 
        right: '20px', 
        zIndex: 1000,
        display: 'flex',
        gap: '12px'
      }}>
        <button
          onClick={handlePrint}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}
        >
          <Printer size={20} />
          Print / Save as PDF
        </button>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              background: '#e2e8f0',
              color: '#475569',
              border: 'none',
              borderRadius: '8px',
              fontSize: '1rem',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <X size={20} />
            Close
          </button>
        )}
      </div>

      {/* LR Print Format */}
      <div className="lr-print-container">
        {/* Company Header */}
        <div className="lr-header">
          <div className="company-name">MULTI MODE LOGISTICS (INDIA) PVT. LTD.</div>
          <div className="company-address">6/2, Snehlata Ganj, INDORE-1</div>
          <div className="company-contact">
            Mobile: 6262001419, 8370000390 | Tel: 0731-2540777 | PAN NO.: AAHCM8960D | GSTIN: 23AAHCM8960D1ZG
          </div>
        </div>

        <div className="lr-body">
          {/* AWB Number and Mode */}
          <div className="lr-section">
            <div className="section-header">CONSIGNMENT NOTE</div>
            <div className="section-content">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div>
                  <div className="field-label">AWB No.:</div>
                  <div className="field-value barcode">{lrData.lrNumber || 'N/A'}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="field-label">Date:</div>
                  <div className="field-value">{formatDate(lrData.bookingDate)}</div>
                </div>
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <div className="field-label">Mode of Transportation:</div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                    <span className={`mode-checkbox ${lrData.bookingMode === 'AIR' ? 'mode-checked' : ''}`}></span>
                    AIR
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                    <span className={`mode-checkbox ${lrData.bookingMode === 'TRAIN' ? 'mode-checked' : ''}`}></span>
                    TRAIN
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                    <span className={`mode-checkbox ${lrData.bookingMode === 'ROAD' || lrData.bookingMode === 'PTL' || lrData.bookingMode === 'FTL' ? 'mode-checked' : ''}`}></span>
                    ROAD
                  </label>
                </div>
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <div className="field-label">Time of Booking:</div>
                <div className="field-value empty"></div>
              </div>
            </div>
          </div>

          {/* FTL Mode: Booking Details, Pickup & Delivery Points */}
          {lrData.bookingMode === 'FTL' ? (
            <>
              {/* Booking Details */}
              <div className="lr-section">
                <div className="section-header">BOOKING DETAILS</div>
                <div className="section-content">
                  <div className="lr-grid">
                    <div>
                      <div className="field-label">ORIGIN CITY:</div>
                      <div className="field-value" style={{ fontWeight: 'bold' }}>
                        {(() => {
                          if (!lrData.origin) return 'N/A';
                          
                          // Try to get city name
                          const cityName = getCityName(lrData.origin);
                          
                          // If we got a valid city name (different from the input), use it
                          if (cityName && cityName !== String(lrData.origin).trim() && cityName !== '') {
                            return cityName;
                          }
                          
                          // If cityName is empty or same as input, try to find city directly
                          if (cities && cities.length > 0) {
                            const originCity = cities.find(c => {
                              if (!c) return false;
                              const originStr = String(lrData.origin).trim();
                              return (c.id !== null && c.id !== undefined && String(c.id).trim() === originStr) ||
                                     (c.code && String(c.code).trim() === originStr) ||
                                     (c.cityName && String(c.cityName).trim() === originStr);
                            });
                            if (originCity && originCity.cityName) {
                              return originCity.cityName;
                            }
                          }
                          
                          // If still not found, return the origin value itself (might be a city name already)
                          return String(lrData.origin).trim() || 'N/A';
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="field-label">DESTINATION CITY:</div>
                      <div className="field-value" style={{ fontWeight: 'bold' }}>
                        {(() => {
                          if (!lrData.destination) return 'N/A';
                          
                          // Try to get city name
                          const cityName = getCityName(lrData.destination);
                          
                          // If we got a valid city name (different from the input), use it
                          if (cityName && cityName !== String(lrData.destination).trim() && cityName !== '') {
                            return cityName;
                          }
                          
                          // If cityName is empty or same as input, try to find city directly
                          if (cities && cities.length > 0) {
                            const destCity = cities.find(c => {
                              if (!c) return false;
                              const destStr = String(lrData.destination).trim();
                              return (c.id !== null && c.id !== undefined && String(c.id).trim() === destStr) ||
                                     (c.code && String(c.code).trim() === destStr) ||
                                     (c.cityName && String(c.cityName).trim() === destStr);
                            });
                            if (destCity && destCity.cityName) {
                              return destCity.cityName;
                            }
                          }
                          
                          // If still not found, return the destination value itself (might be a city name already)
                          return String(lrData.destination).trim() || 'N/A';
                        })()}
                      </div>
                    </div>
                    <div>
                      <div className="field-label">VEHICLE NUMBER:</div>
                      <div className="field-value">{lrData.vehicleNumber || ''}</div>
                    </div>
                    <div>
                      <div className="field-label">BRANCH:</div>
                      <div className="field-value">{getBranchName(lrData.branch) || ''}</div>
                    </div>
                    <div>
                      <div className="field-label">BOOKING DATE:</div>
                      <div className="field-value">{formatDate(lrData.bookingDate)}</div>
                    </div>
                    <div>
                      <div className="field-label">EXPECTED DELIVERY DATE:</div>
                      <div className="field-value">{formatDate(lrData.expectedDeliveryDate)}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pickup Points */}
              {lrData.pickupPoints && lrData.pickupPoints.length > 0 && (
                <div className="lr-section">
                  <div className="section-header">PICKUP POINTS</div>
                  <div className="section-content" style={{ padding: '0' }}>
                    <table className="charges-table" style={{ fontSize: '9px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>Sr.</th>
                          <th style={{ width: '20%' }}>Consignor Name</th>
                          <th style={{ width: '15%' }}>Contact</th>
                          <th style={{ width: '25%' }}>Address</th>
                          <th style={{ width: '10%' }}>City</th>
                          <th style={{ width: '10%' }}>GSTIN</th>
                          <th style={{ width: '8%' }}>Pieces</th>
                          <th style={{ width: '7%' }}>Weight (kg)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lrData.pickupPoints.map((point, index) => {
                          const cityName = cities.find(c => c.id?.toString() === point.city?.toString() || c.code === point.city)?.cityName || point.city || '';
                          return (
                            <tr key={point.id || index}>
                              <td>{index + 1}</td>
                              <td>{point.consignor?.name || ''}</td>
                              <td>{point.consignor?.contact || ''}</td>
                              <td>{point.consignor?.address || ''}</td>
                              <td>{cityName}</td>
                              <td>{point.consignor?.gst || ''}</td>
                              <td>{point.pieces || '0'}</td>
                              <td>{point.quantity || '0.00'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Delivery Points with POD Signature */}
              {lrData.deliveryPoints && lrData.deliveryPoints.length > 0 && (
                <div className="lr-section">
                  <div className="section-header">DELIVERY POINTS</div>
                  <div className="section-content" style={{ padding: '0' }}>
                    <table className="charges-table" style={{ fontSize: '9px' }}>
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>Sr.</th>
                          <th style={{ width: '18%' }}>Consignee Name</th>
                          <th style={{ width: '12%' }}>Contact</th>
                          <th style={{ width: '20%' }}>Address</th>
                          <th style={{ width: '10%' }}>City</th>
                          <th style={{ width: '10%' }}>GSTIN</th>
                          <th style={{ width: '7%' }}>Pieces</th>
                          <th style={{ width: '7%' }}>Weight (kg)</th>
                          <th style={{ width: '11%' }}>POD Signature</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lrData.deliveryPoints.map((point, index) => {
                          const cityName = cities.find(c => c.id?.toString() === point.city?.toString() || c.code === point.city)?.cityName || point.city || '';
                          return (
                            <tr key={point.id || index}>
                              <td>{index + 1}</td>
                              <td>{point.consignee?.name || ''}</td>
                              <td>{point.consignee?.contact || ''}</td>
                              <td>{point.consignee?.address || ''}</td>
                              <td>{cityName}</td>
                              <td>{point.consignee?.gst || ''}</td>
                              <td>{point.pieces || '0'}</td>
                              <td>{point.quantity || '0.00'}</td>
                              <td style={{ minHeight: '40px', verticalAlign: 'top', padding: '8px' }}>
                                <div style={{ border: '1px solid #000', minHeight: '30px', padding: '4px' }}>
                                  <div style={{ fontSize: '7px', marginBottom: '2px' }}>Receiver Sign:</div>
                                  <div style={{ minHeight: '20px' }}></div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Standard Mode: Origin and Destination */
          <div className="lr-section">
            <div className="section-header">ORIGIN & DESTINATION</div>
            <div className="section-content">
              <div className="lr-grid">
                <div>
                  <div className="field-label">ORIGIN CITY:</div>
                    <div className="field-value" style={{ fontWeight: 'bold' }}>
                      {(() => {
                        if (!lrData.origin) return 'N/A';
                        
                        // Try to get city name
                        const cityName = getCityName(lrData.origin);
                        
                        // If we got a valid city name (different from the input), use it
                        if (cityName && cityName !== String(lrData.origin).trim() && cityName !== '') {
                          return cityName;
                        }
                        
                        // If cityName is empty or same as input, try to find city directly
                        if (cities && cities.length > 0) {
                          const originCity = cities.find(c => {
                            if (!c) return false;
                            const originStr = String(lrData.origin).trim();
                            return (c.id !== null && c.id !== undefined && String(c.id).trim() === originStr) ||
                                   (c.code && String(c.code).trim() === originStr) ||
                                   (c.cityName && String(c.cityName).trim() === originStr);
                          });
                          if (originCity && originCity.cityName) {
                            return originCity.cityName;
                          }
                        }
                        
                        // If still not found, return the origin value itself (might be a city name already)
                        return String(lrData.origin).trim() || 'N/A';
                      })()}
                    </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <div className="field-label">SHIPPER NAME:</div>
                    <div className="field-value">{lrData.consignor?.name || ''}</div>
                  </div>
                  
                  <div style={{ marginTop: '6px' }}>
                    <div className="field-label">PH. NO., MOBILE NO., GSTIN:</div>
                    <div className="field-value">{lrData.consignor?.contact || ''} {lrData.consignor?.gst || ''}</div>
                  </div>
                </div>
                
                <div>
                  <div className="field-label">DESTINATION CITY:</div>
                    <div className="field-value" style={{ fontWeight: 'bold' }}>
                      {(() => {
                        if (!lrData.destination) return 'N/A';
                        
                        // Try to get city name
                        const cityName = getCityName(lrData.destination);
                        
                        // If we got a valid city name (different from the input), use it
                        if (cityName && cityName !== String(lrData.destination).trim() && cityName !== '') {
                          return cityName;
                        }
                        
                        // If cityName is empty or same as input, try to find city directly
                        if (cities && cities.length > 0) {
                          const destCity = cities.find(c => {
                            if (!c) return false;
                            const destStr = String(lrData.destination).trim();
                            return (c.id !== null && c.id !== undefined && String(c.id).trim() === destStr) ||
                                   (c.code && String(c.code).trim() === destStr) ||
                                   (c.cityName && String(c.cityName).trim() === destStr);
                          });
                          if (destCity && destCity.cityName) {
                            return destCity.cityName;
                          }
                        }
                        
                        // If still not found, return the destination value itself (might be a city name already)
                        return String(lrData.destination).trim() || 'N/A';
                      })()}
                    </div>
                  
                  <div style={{ marginTop: '8px' }}>
                    <div className="field-label">CONSIGNEE NAME:</div>
                    <div className="field-value">{lrData.consignee?.name || ''}</div>
                  </div>
                  
                  <div style={{ marginTop: '6px' }}>
                    <div className="field-label">PH. NO., MOBILE NO., GSTIN:</div>
                    <div className="field-value">{lrData.consignee?.contact || ''} {lrData.consignee?.gst || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Package Details */}
          {lrData.bookingMode !== 'FTL' && (
          <div className="lr-section">
            <div className="section-header">PACKAGE & CONTENT DETAILS</div>
            <div className="section-content">
              <div className="lr-grid">
                <div>
                  <div className="field-label">NO. OF PCS.:</div>
                  <div className="field-value">{lrData.pieces || ''}</div>
                </div>
                <div>
                  <div className="field-label">ACTUAL WEIGHT:</div>
                  <div className="field-value">{lrData.weight || ''} kgs</div>
                </div>
                <div>
                  <div className="field-label">DIMENSIONS (L x W x H):</div>
                  <div className="field-value">
                      {lrData.cftEntries && lrData.cftEntries.length > 0 ? (
                        <div>
                          {lrData.cftEntries.map((entry, index) => (
                            <div key={entry.id || index} style={{ marginBottom: '4px' }}>
                              {entry.length && entry.width && entry.height
                                ? `${entry.length} x ${entry.width} x ${entry.height} ${entry.unit || 'cm'}${entry.pieces ? ` (${entry.pieces} ${entry.pieces === 1 ? 'box' : 'boxes'})` : ''}`
                                : ''}
                            </div>
                          ))}
                        </div>
                      ) : lrData.cftDimensions?.length && lrData.cftDimensions?.width && lrData.cftDimensions?.height ? (
                        `${lrData.cftDimensions.length} x ${lrData.cftDimensions.width} x ${lrData.cftDimensions.height} ${lrData.cftDimensions.unit || 'cm'}${lrData.pieces ? ` (${lrData.pieces} ${lrData.pieces === 1 ? 'piece' : 'pieces'})` : ''}`
                      ) : lrData.pieces ? (
                        `${lrData.pieces} ${lrData.pieces === 1 ? 'piece' : 'pieces'}`
                      ) : ''}
                  </div>
                </div>
                <div>
                  <div className="field-label">CHARGED WEIGHT:</div>
                  <div className="field-value">{chargedWeight} kgs</div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <div className="field-label">CONTENTS - DESCRIPTION (SAID TO CONTAIN):</div>
                  <div className="field-value" style={{ minHeight: '30px' }}>{lrData.consignor?.name || ''} - Consignment</div>
                </div>
                <div>
                  <div className="field-label">Invoice No.:</div>
                  <div className="field-value">{lrData.invoices?.[0]?.number || ''}</div>
                </div>
                </div>
              </div>
            </div>
          )}

          {/* FTL Mode: Total Summary */}
          {lrData.bookingMode === 'FTL' && (
            <div className="lr-section">
              <div className="section-header">TOTAL SUMMARY</div>
              <div className="section-content">
                <div className="lr-grid">
                <div>
                    <div className="field-label">TOTAL PIECES:</div>
                    <div className="field-value">
                      {lrData.pickupPoints?.reduce((sum, p) => sum + (parseFloat(p.pieces) || 0), 0) +
                       lrData.deliveryPoints?.reduce((sum, p) => sum + (parseFloat(p.pieces) || 0), 0) || lrData.pieces || '0'}
                </div>
              </div>
                  <div>
                    <div className="field-label">TOTAL WEIGHT (kg):</div>
                    <div className="field-value">
                      {(
                        (lrData.pickupPoints?.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) || 0) +
                        (lrData.deliveryPoints?.reduce((sum, p) => sum + (parseFloat(p.quantity) || 0), 0) || 0)
                      ).toFixed(2) || lrData.weight || '0.00'}
            </div>
          </div>
                  <div>
                    <div className="field-label">DIMENSIONS (L x W x H):</div>
                    <div className="field-value">
                      {lrData.cftEntries && lrData.cftEntries.length > 0 ? (
                        <div>
                          {lrData.cftEntries.map((entry, index) => (
                            <div key={entry.id || index} style={{ marginBottom: '4px' }}>
                              {entry.length && entry.width && entry.height
                                ? `${entry.length} x ${entry.width} x ${entry.height} ${entry.unit || 'cm'}${entry.pieces ? ` (${entry.pieces} ${entry.pieces === 1 ? 'box' : 'boxes'})` : ''}`
                                : ''}
                            </div>
                          ))}
                        </div>
                      ) : lrData.cftDimensions?.length && lrData.cftDimensions?.width && lrData.cftDimensions?.height ? (
                        `${lrData.cftDimensions.length} x ${lrData.cftDimensions.width} x ${lrData.cftDimensions.height} ${lrData.cftDimensions.unit || 'cm'}${lrData.pieces ? ` (${lrData.pieces} ${lrData.pieces === 1 ? 'piece' : 'pieces'})` : ''}`
                      ) : lrData.pieces ? (
                        `${lrData.pieces} ${lrData.pieces === 1 ? 'piece' : 'pieces'}`
                      ) : ''}
                    </div>
                  </div>
                  <div>
                    <div className="field-label">CHARGED WEIGHT:</div>
                    <div className="field-value">{chargedWeight} kgs</div>
                  </div>
                  <div>
                    <div className="field-label">Invoice No.:</div>
                    <div className="field-value">{lrData.invoices?.map(inv => inv.number).join(', ') || ''}</div>
                  </div>
                  <div>
                    <div className="field-label">E-Waybill No.:</div>
                    <div className="field-value">{lrData.ewaybills?.map(ew => ew.number).join(', ') || ''}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Charges Section */}
          <div className="lr-section">
            <div className="section-header">CHARGES</div>
            <div className="section-content" style={{ padding: '0' }}>
              <table className="charges-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>PARTICULARS</th>
                    <th style={{ width: '30%' }}>AMOUNT RUPEES</th>
                    <th style={{ width: '30%' }}>REMARKS</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Freight Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.freightRate || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>F.O.D. Charges</td>
                    <td>{showAmountsInPrint ? '' : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Other Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.other || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Hamali/Labour Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.hamali || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Pickup Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.pickupCharges || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Delivery Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.deliveryCharges || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>ODA Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.odaCharges || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Warai/Union Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.waraiUnion || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>Docket Charge</td>
                    <td>{showAmountsInPrint ? (lrData.charges?.lrCharges || '0.00') : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>COD/DOD Charge</td>
                    <td>{showAmountsInPrint ? '' : '---'}</td>
                    <td></td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', background: '#f0f0f0' }}>
                    <td>SUB-TOTAL</td>
                    <td>{showAmountsInPrint ? subtotal.toFixed(2) : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>IGST %</td>
                    <td>{showAmountsInPrint ? gstBreakdown.igst.toFixed(2) : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>CGST %</td>
                    <td>{showAmountsInPrint ? gstBreakdown.cgst.toFixed(2) : '---'}</td>
                    <td></td>
                  </tr>
                  <tr>
                    <td>SGST %</td>
                    <td>{showAmountsInPrint ? gstBreakdown.sgst.toFixed(2) : '---'}</td>
                    <td></td>
                  </tr>
                  <tr style={{ fontWeight: 'bold', background: '#e0e0e0', fontSize: '12px' }}>
                    <td>GRAND TOTAL</td>
                    <td>{showAmountsInPrint ? grandTotal.toFixed(2) : '---'}</td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment Mode */}
          <div className="lr-section">
            <div className="section-header">PAYMENT MODE</div>
            <div className="section-content">
              <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                  <span className={`mode-checkbox ${lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH' ? 'mode-checked' : ''}`}></span>
                  <span style={{
                    fontWeight: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? 'bold' : 'normal',
                    color: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? '#dc2626' : 'inherit',
                    fontSize: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? '12px' : '10px',
                    backgroundColor: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? '#fee2e2' : 'transparent',
                    padding: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? '4px 8px' : '0',
                    borderRadius: (lrData.paymentMode === 'Paid' || lrData.paymentMode === 'CASH') ? '4px' : '0'
                  }}>
                    CASH
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                  <span className={`mode-checkbox ${lrData.paymentMode === 'TBB' || lrData.paymentMode === 'CREDIT' ? 'mode-checked' : ''}`}></span>
                  CREDIT
                </label>
                <label style={{ display: 'flex', alignItems: 'center', fontSize: '10px' }}>
                  <span className={`mode-checkbox ${lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay' ? 'mode-checked' : ''}`}></span>
                  <span style={{
                    fontWeight: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? 'bold' : 'normal',
                    color: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? '#dc2626' : 'inherit',
                    fontSize: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? '12px' : '10px',
                    backgroundColor: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? '#fee2e2' : 'transparent',
                    padding: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? '4px 8px' : '0',
                    borderRadius: (lrData.paymentMode === 'To Pay' || lrData.paymentMode === 'TO-PAY' || lrData.paymentMode === 'ToPay') ? '4px' : '0'
                  }}>
                  TO-PAY
                  </span>
                </label>
              </div>
              {/* GODOWN DELIVERY Banner */}
              {lrData.deliveryType === 'Godown' && (
                <div style={{
                  marginTop: '12px',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                  border: '3px solid #dc2626',
                  borderRadius: '8px',
                  textAlign: 'center'
                }}>
                  <div style={{
                    fontSize: '18px',
                    fontWeight: 'bold',
                    color: '#991b1b',
                    letterSpacing: '2px'
                  }}>
                    GODOWN DELIVERY
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Liability Clause */}
          <div style={{ marginTop: '12px', fontSize: '9px', lineHeight: '1.4' }}>
            <div style={{ marginBottom: '6px', fontWeight: 'bold' }}>LIABILITY CLAUSE:</div>
            <div style={{ marginBottom: '8px' }}>
              Our liability for any loss or damage to the shipment is to the extent of Rs. 100/- only. All disputes are subject to the jurisdiction of origin station courts only.
            </div>
            <div style={{ marginBottom: '8px', fontStyle: 'italic' }}>
              This is a non-negotiable Consignment Note.
            </div>
            <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>SENDER'S DECLARATION:</div>
            <div style={{ marginLeft: '8px', marginBottom: '4px' }}>
              (1) That this consignment does not contain currency notes, jewellery, contraband, explosives etc.
            </div>
            <div style={{ marginLeft: '8px' }}>
              (2) That I have read the terms & conditions of carriage as given on reverse of the Shipper's Copy of Consignment Note, and abide by the same.
            </div>
          </div>

          {/* Signatures */}
          {lrData.bookingMode === 'FTL' ? (
            /* FTL Mode: POD Signatures for each Delivery Point */
            <div style={{ marginTop: '16px' }}>
              <div className="section-header">PROOF OF DELIVERY (POD) - RECEIVER SIGNATURES</div>
              <div className="section-content" style={{ padding: '12px' }}>
                {lrData.deliveryPoints && lrData.deliveryPoints.length > 0 ? (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
                    {lrData.deliveryPoints.map((point, index) => (
                      <div key={point.id || index} style={{ border: '1px solid #000', padding: '12px', borderRadius: '4px' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '10px' }}>
                          Delivery Point {index + 1}: {point.consignee?.name || ''}
                        </div>
                        <div style={{ marginBottom: '6px', fontSize: '9px' }}>
                          <div className="field-label">Address: {point.consignee?.address || ''}</div>
                          <div className="field-label">City: {cities.find(c => c.id?.toString() === point.city?.toString() || c.code === point.city)?.cityName || point.city || ''}</div>
                        </div>
                        <div style={{ marginTop: '12px' }}>
                          <div className="field-label" style={{ marginBottom: '4px', fontSize: '9px' }}>RECEIVED IN GOOD ORDER AND CONDITION</div>
                          <div style={{ marginBottom: '4px' }}>
                            <span className="field-label" style={{ display: 'inline-block', width: '50px', fontSize: '8px' }}>NAME:</span>
                            <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px' }}></span>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <span className="field-label" style={{ display: 'inline-block', width: '50px', fontSize: '8px' }}>SIGNATURE:</span>
                            <div style={{ border: '1px solid #000', minHeight: '30px', marginTop: '4px' }}></div>
                          </div>
                          <div style={{ marginBottom: '4px' }}>
                            <span className="field-label" style={{ display: 'inline-block', width: '50px', fontSize: '8px' }}>DATE:</span>
                            <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                          </div>
                          <div>
                            <span className="field-label" style={{ display: 'inline-block', width: '50px', fontSize: '8px' }}>TIME:</span>
                            <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '20px', textAlign: 'center', fontSize: '10px' }}>No delivery points</div>
                )}
              </div>
              
              {/* Sender Signature */}
              <div style={{ marginTop: '16px' }}>
                <div className="signature-section">
                  <div>
                    <div className="signature-box">
                      <div className="field-label" style={{ marginBottom: '4px' }}>SENDER'S NAME:</div>
                      <div style={{ minHeight: '20px', marginBottom: '8px' }}></div>
                      <div className="field-label" style={{ marginBottom: '4px' }}>SIGNATURE (Sender):</div>
                      <div style={{ minHeight: '20px' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Standard Mode: Single Signature */
          <div className="signature-section">
            <div>
              <div className="signature-box">
                <div className="field-label" style={{ marginBottom: '4px' }}>SENDER'S NAME:</div>
                <div style={{ minHeight: '20px', marginBottom: '8px' }}></div>
                <div className="field-label" style={{ marginBottom: '4px' }}>SIGNATURE (Sender):</div>
                <div style={{ minHeight: '20px' }}></div>
              </div>
            </div>
            <div>
              <div className="signature-box">
                <div className="field-label" style={{ marginBottom: '4px' }}>RECEIVED IN GOOD ORDER AND CONDITION</div>
                <div style={{ marginTop: '8px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>NAME:</span>
                    <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>SIGNATURE:</span>
                    <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>DATE:</span>
                    <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                  </div>
                  <div>
                    <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>TIME:</span>
                    <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '100px' }}></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          )}

          {/* Company Signature */}
          <div style={{ marginTop: '12px', textAlign: 'right' }}>
            <div style={{ display: 'inline-block', border: '1px solid #000', padding: '8px 16px', minWidth: '200px' }}>
              <div className="field-label" style={{ marginBottom: '4px' }}>FOR MULTIMODE LOGISTICS (INDIA) PVT. LTD.:</div>
              <div style={{ marginTop: '8px' }}>
                <div style={{ marginBottom: '4px' }}>
                  <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>SIGNATURE:</span>
                  <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px' }}></span>
                </div>
                <div style={{ marginBottom: '4px' }}>
                  <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>DATE:</span>
                  <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px' }}></span>
                </div>
                <div>
                  <span className="field-label" style={{ display: 'inline-block', width: '60px' }}>TIME:</span>
                  <span style={{ borderBottom: '1px solid #000', display: 'inline-block', minWidth: '120px' }}></span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="footer">
            <div style={{ marginBottom: '4px' }}>
              Website: www.mmlipl.com | E-mail: pickup@mmlipl.com
            </div>
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              (ALL DISPUTES ARE SUBJECT TO THE JURISDICTION OF INDORE COURTS ONLY.)
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <div style={{ fontWeight: 'bold' }}>ACCOUNTS COPY</div>
              <div style={{ fontStyle: 'italic' }}>THANKS FOR USING MULTIMODE LOGISTICS</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

