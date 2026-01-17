import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

export default function LRPrintView({ lrId, lrTable, onClose }) {
  const [lrData, setLrData] = useState(null);
  const [cities, setCities] = useState([]);
  const [branches, setBranches] = useState([]);
  const [tbbClients, setTbbClients] = useState([]);
  const [clientRates, setClientRates] = useState([]);
  const [showAmountsInPrint, setShowAmountsInPrint] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const syncService = (await import('./utils/sync-service')).default;
        const databaseAPI = (await import('./utils/database-api')).default;

        const [citiesRes, branchesRes, clientsRes, clientRatesRes] = await Promise.all([
          syncService.load('cities').catch(() => ({ data: [] })),
          syncService.load('branches').catch(() => ({ data: [] })),
          syncService.load('clients').catch(() => ({ data: [] })),
          syncService.load('clientRates').catch(() => ({ data: [] })),
        ]);

        const allCities = Array.isArray(citiesRes) ? citiesRes : (citiesRes?.data || []);
        const allBranches = Array.isArray(branchesRes) ? branchesRes : (branchesRes?.data || []);
        const allClients = Array.isArray(clientsRes) ? clientsRes : (clientsRes?.data || []);

        if (!isMounted) return;
        setCities(allCities || []);
        setBranches(allBranches || []);
        setTbbClients(allClients || []);

        const parseMaybeJson = (value) => {
          if (value == null) return value;
          if (typeof value === 'object') return value;
          if (typeof value !== 'string') return value;
          const t = value.trim();
          if (!t) return value;
          try { return JSON.parse(t); } catch { return value; }
        };
        const rawRates = Array.isArray(clientRatesRes) ? clientRatesRes : (clientRatesRes?.data || []);
        const hydratedRates = (rawRates || []).map(r => {
          const payload = parseMaybeJson(r?.data);
          if (payload && typeof payload === 'object') {
            return { ...payload, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, clientId: payload.clientId ?? r.clientId, clientCode: payload.clientCode ?? r.clientCode };
          }
          return r;
        });
        setClientRates(Array.isArray(hydratedRates) ? hydratedRates : []);

        const idToUse = lrId || sessionStorage.getItem('printLRId');
        if (!idToUse) return;

        // Fetch LR from the correct table (FTL/PTL/base)
        const tryTables = lrTable ? [lrTable] : ['lrBookings', 'ptlLRBookings', 'ftlLRBookings'];
        let found = null;
        for (const tbl of tryTables) {
          try {
            const row = await databaseAPI.getById(tbl, idToUse);
            if (row && row.id != null) {
              found = { ...row, __table: tbl };
              break;
            }
          } catch (e) {
            // ignore and try next
          }
        }
        if (found && isMounted) setLrData(found);
      } catch (e) {
        // Fallback to localStorage (legacy)
        const allLRs = JSON.parse(localStorage.getItem('lrBookings') || '[]');
        const allCities = JSON.parse(localStorage.getItem('cities') || '[]');
        const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        const allClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
        const allClientRates = JSON.parse(localStorage.getItem('clientRates') || '[]');

        if (!isMounted) return;
        setCities(allCities);
        setBranches(allBranches);
        setTbbClients(allClients);
        setClientRates(allClientRates);

        const idToUse = lrId || sessionStorage.getItem('printLRId');
        if (idToUse) {
          const lr = allLRs.find(l => l.id.toString() === idToUse.toString());
          if (lr) setLrData(lr);
        }
      }
    };

    loadData();

    return () => { isMounted = false; };
  }, [lrId, lrTable]);

  useEffect(() => {
    if (lrData && lrData.paymentMode === 'TBB' && lrData.tbbClient && clientRates.length > 0 && cities.length > 0) {
      const client = tbbClients.find(c => c.id?.toString() === lrData.tbbClient || c.code === lrData.tbbClient);
      const originCity = cities.find(c => c.code === lrData.origin || c.id?.toString() === lrData.origin);
      const destCity = cities.find(c => c.code === lrData.destination || c.id?.toString() === lrData.destination);
      
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
        
        if (matchingRate && typeof matchingRate.showAmountsInPrint === 'boolean') {
          setShowAmountsInPrint(matchingRate.showAmountsInPrint);
        } else {
          setShowAmountsInPrint(true);
        }
      } else {
        setShowAmountsInPrint(true);
      }
    } else {
      setShowAmountsInPrint(true);
    }
  }, [lrData, clientRates, cities, tbbClients]);

  const getCityName = (cityCode) => {
    if (!cityCode) return '';
    const cityCodeStr = String(cityCode).trim();
    if (!cityCodeStr || cityCodeStr === 'null' || cityCodeStr === 'undefined') return '';
    
    let citiesToSearch = cities;
    if (!citiesToSearch || citiesToSearch.length === 0) {
      const storedCities = JSON.parse(localStorage.getItem('cities') || '[]');
      if (storedCities && storedCities.length > 0) {
        citiesToSearch = storedCities;
        setCities(storedCities);
      }
    }
    
    if (!citiesToSearch || citiesToSearch.length === 0) {
      return cityCodeStr;
    }
    
    let city = citiesToSearch.find(c => {
      if (!c) return false;
      if (c.id !== null && c.id !== undefined && String(c.id).trim() === cityCodeStr) return true;
      if (c.code && String(c.code).trim() === cityCodeStr) return true;
      if (c.cityName && String(c.cityName).trim() === cityCodeStr) return true;
      return false;
    });
    
    if (!city) {
      const searchStrLower = cityCodeStr.toLowerCase();
      city = citiesToSearch.find(c => {
        if (!c) return false;
        if (c.id !== null && c.id !== undefined && String(c.id).trim().toLowerCase() === searchStrLower) return true;
        if (c.code && String(c.code).trim().toLowerCase() === searchStrLower) return true;
        if (c.cityName && String(c.cityName).trim().toLowerCase() === searchStrLower) return true;
        return false;
      });
    }
    
    if (city && city.cityName) {
      return city.cityName;
    }
    
    return cityCodeStr;
  };

  const formatDateLong = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const calculateChargedWeight = () => {
    if (!lrData) return '0';
    const actualWeight = parseFloat(lrData.weight || 0);
    const cftWeight = parseFloat(lrData.calculatedCFT || 0);
    return Math.max(actualWeight, cftWeight).toFixed(2);
  };

  const calculateSubtotal = () => {
    if (!lrData || !lrData.charges) return 0;
    const { freightRate, lrCharges, hamali, pickupCharges, deliveryCharges, odaCharges, other, waraiUnion } = lrData.charges;
    const pickupDeliveryTotal = (parseFloat(pickupCharges) || 0) + (parseFloat(deliveryCharges) || 0);
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
    
    const originVal = lrData.origin || lrData.fromLocation;
    const destVal = lrData.destination || lrData.toLocation;
    const originCity = cities.find(c => 
      c.id?.toString() === originVal?.toString() || 
      c.code === originVal || 
      c.cityName === originVal
    );
    const destCity = cities.find(c => 
      c.id?.toString() === destVal?.toString() || 
      c.code === destVal || 
      c.cityName === destVal
    );
    const isInterstate = originCity?.state !== destCity?.state;
    
    if (isInterstate) {
      return { igst: totalGST, cgst: 0, sgst: 0 };
    } else {
      return { igst: 0, cgst: totalGST / 2, sgst: totalGST / 2 };
    }
  };

  const getOriginDestination = () => {
    const originCity = getCityName(lrData.origin || lrData.fromLocation);
    const destCity = getCityName(lrData.destination || lrData.toLocation);
    return `${originCity.toUpperCase()}-${destCity.toUpperCase()}`;
  };

  const getConsignorAddress = () => {
    const address = lrData.consignor?.address || '';
    const pinMatch = address.match(/\b\d{6}\b/);
    const pin = pinMatch ? pinMatch[0] : '';
    return { address, pin };
  };

  const getConsigneeAddress = () => {
    const address = lrData.consignee?.address || '';
    const pinMatch = address.match(/\b\d{6}\b/);
    const pin = pinMatch ? pinMatch[0] : '0';
    return { address, pin };
  };

  const getDescriptionOfGoods = () => {
    if (lrData.cftEntries && lrData.cftEntries.length > 0) {
      return lrData.cftEntries.map(entry => 
        `Carton Boxes - ${entry.pieces || 1}`
      ).join(', ');
    }
    return `Carton Boxes - ${lrData.pieces || 0}`;
  };

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

  const getModeOfBooking = () => {
    return 'Road';
  };

  const getBookingType = () => {
    if (lrData.paymentMode === 'TBB') return 'To Be Billed';
    if (lrData.paymentMode === 'Paid') return 'Paid';
    if (lrData.paymentMode === 'ToPay') return 'To Pay';
    return 'To Be Billed';
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
  const originDest = getOriginDestination().split('-');
  const consignorAddr = getConsignorAddress();
  const consigneeAddr = getConsigneeAddress();

  return (
    <div>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
          }
          .lr-print-root, .lr-print-root * {
            visibility: visible;
          }
          .lr-print-root {
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
        
        .lr-print-page {
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          margin: 0 auto;
          background: white;
          /* reduced top space; keep 0.5cm left */
          padding: 6mm 0 0 5mm;
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: black;
          page-break-after: always;
          display: flex;
          flex-direction: column;
          /* use explicit margin on second copy instead of flex gap */
          gap: 0;
        }
        
        .lr-print-page:last-child {
          page-break-after: auto;
        }
        
        .lr-print-container {
          width: 100%;
          /* 297mm total - 6mm top padding - 3mm second-copy offset = 288mm usable for 2 copies */
          flex: 0 0 144mm;
          height: 144mm;
          background: white;
          padding: 2px;
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: black;
          border: 1px solid #ddd;
          margin-bottom: 0;
          break-inside: avoid;
          page-break-inside: avoid;
          overflow: hidden;
          /* shrink content so both copies fit on one A4 */
          transform: scale(0.95);
          transform-origin: top left;
        }

        /* Allow POD footer to show (no clipping) */
        .lr-copy-top {
          overflow: visible;
          transform: scale(0.945);
        }

        /* Move second copy slightly down to make room for POD footer */
        .lr-copy-bottom {
          margin-top: 3mm;
        }
        
        .lr-print-container:last-child {
          margin-bottom: 0;
        }
      `}</style>

      <div className="no-print" style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', marginBottom: '20px' }}>
        <button
          onClick={() => window.print()}
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            marginRight: '12px'
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
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <X size={20} />
            Close
          </button>
        )}
      </div>

      <div className="lr-print-root">
        {/* Two LR copies on one A4 page (top + bottom) */}
        <div className="lr-print-page">
          {/* POD Copy */}
          <div className="lr-print-container lr-copy-top">
          {/* Company Header with Logo and Name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Logo */}
              <div style={{ 
                width: '60px', 
                height: '60px', 
                border: '2px solid #000', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f8fafc',
                textAlign: 'center',
                padding: '4px'
              }}>
                <img
                  src="/brand-logo.png"
                  alt="Company Logo"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo192.png';
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>MULTI MODE LOGISTICS (INDIA) PVT. LTD.</div>
                <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
                  <div><strong>Address:</strong> 6/2, Snehalata, Near Rajkumar Bridge, Indore, Madhya Pradesh.</div>
                  <div><strong>GST IN:</strong> 23AAHCM8960D1ZG   <strong>Phone:</strong> 8370000320   <strong>Email:</strong> pickup@mmlipl.com</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copy Label at Top */}
          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
            POD Copy
          </div>
          
          {/* Rest of POD copy content - same as Consignor copy */}
          {/* Docket No, Ref No, Date */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '33%', padding: '3px', border: '1px solid #000' }}><strong>Docket No</strong></td>
                <td style={{ width: '33%', padding: '3px', border: '1px solid #000' }}><strong>Ref No</strong></td>
                <td style={{ width: '34%', padding: '3px', border: '1px solid #000' }}><strong>Date</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{lrData.lrNumber || 'N/A'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{lrData.referenceNumber || '-'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{formatDateLong(lrData.bookingDate)}</td>
              </tr>
            </tbody>
          </table>

          {/* Origin and Destination */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', padding: '3px', border: '1px solid #000' }}><strong>Origin</strong></td>
                <td style={{ width: '50%', padding: '3px', border: '1px solid #000' }}><strong>Destination</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{originDest[0]}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{originDest[1]}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignor and Consignee Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <thead>
              <tr>
                <th style={{ width: '50%', padding: '3px', border: '1px solid #000', textAlign: 'left' }}>Consignor's Name & Address</th>
                <th style={{ width: '50%', padding: '3px', border: '1px solid #000', textAlign: 'left' }}>Consignee's Name & Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignor?.name || 'N/A'}</div>
                  <div>{consignorAddr.address || ''}</div>
                  <div>Pin: {consignorAddr.pin || ''}   Phone: {lrData.consignor?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignor?.gst || ''}</div>
                </td>
                <td style={{ padding: '3px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignee?.name || 'N/A'}</div>
                  <div>{consigneeAddr.address || ''}</div>
                  <div>Pin: {consigneeAddr.pin || '0'}   Phone: {lrData.consignee?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignee?.gst || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Shipment Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '8px' }}>
            <thead>
              <tr>
                <th style={{ padding: '3px', border: '1px solid #000' }}>No Of Pkgs.</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Actual Weight (Kgs)</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Charged Weight</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Invoice No</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Invoice Value</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>E-Way Bill No</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Description Of Goods</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.weight || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{chargedWeight}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.invoices?.[0]?.number || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>0</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.ewaybills?.[0]?.number || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getDescriptionOfGoods()}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
              </tr>
            </tbody>
          </table>

          {/* Mode of Delivery, Booking, Type, Dimension */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Mode of Delivery</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Mode of Booking</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Booking Type</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Dimension</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>
                  {lrData.deliveryType === 'Door' ? 'Door Delivery' : (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>GODOWN DELIVERY</span>
                  )}
                </td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getModeOfBooking()}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>
                  {lrData.paymentMode === 'Paid' ? (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>PAID</span>
                  ) : lrData.paymentMode === 'ToPay' ? (
                    <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#000' }}>TO PAY</span>
                  ) : (
                    getBookingType()
                  )}
                </td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getDimensionString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Terms and Conditions */}
          <div style={{ fontSize: '8px', marginBottom: '6px', lineHeight: '1.3' }}>
            <div>Our liability for any loss or damage to the shipment is to the extent of Rs. 100/- only.</div>
            <div>All disputes are subject to the jurisdiction of Indore station courts only.</div>
            <div>This is a non-negotiable Consignment Note. Thereby declare:</div>
            <div>(1) That this consignment does not contain currency notes, jewellery, contraband, explosives etc.</div>
            <div>(2) That I have read the terms & conditions of carriage as given on reverse of the Shipper's Copy of Consignment Note and abide by the same.</div>
          </div>

          {/* Freight Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '20%', padding: '3px', border: '1px solid #000' }}><strong>Freight Type</strong></td>
                <td style={{ width: '20%', padding: '3px', border: '1px solid #000' }}><strong>Freight Charge</strong></td>
                <td style={{ width: '20%', padding: '3px', border: '1px solid #000' }}><strong>Other Charges</strong></td>
                <td style={{ width: '20%', padding: '3px', border: '1px solid #000' }}><strong>Docket Charge</strong></td>
                <td style={{ width: '20%', padding: '3px', border: '1px solid #000' }}><strong>Total Freight</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>SUNDRY</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.freightRate) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.other) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.lrCharges) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? subtotal.toFixed(2) : '---'}</td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}><strong>IGST %</strong></td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.igst.toFixed(2) : '---'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}><strong>CGST %</strong></td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.cgst.toFixed(2) : '---'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}><strong>SGST %</strong></td>
              </tr>
              <tr>
                <td colSpan="4" style={{ padding: '3px', border: '1px solid #000' }}><strong>Grand Total</strong></td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? grandTotal.toFixed(2) : '---'}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignment Acknowledgement */}
          <div style={{ fontSize: '8px', marginBottom: '6px', lineHeight: '1.3' }}>
            <div><strong>Consignment Acknowledgement by consignee:</strong> We have verified the weight & received cargo with Documents in good condition.</div>
            <div style={{ marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
              <div>Signature ___________ Date: ______</div>
              <div>Seal Of The Company _________ Time: ______</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div><strong>Freight Detail :</strong> As Per Terms</div>
              <div><strong>Remarks :</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>For : Multi Mode Logistics (India) Pvt Ltd.</div>
              <div style={{ marginTop: '12px' }}>SHIV DEV SINGH</div>
              <div style={{ marginTop: '2px' }}>Auth. Signatory</div>
            </div>
          </div>
          </div>

          {/* Consignor Copy */}
          <div className="lr-print-container lr-copy-bottom">
          {/* Company Header with Logo and Name */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '2px solid #000', paddingBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {/* Logo */}
              <div style={{ 
                width: '60px', 
                height: '60px', 
                border: '2px solid #000', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                background: '#f8fafc',
                textAlign: 'center',
                padding: '4px'
              }}>
                <img
                  src="/brand-logo.png"
                  alt="Company Logo"
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/logo192.png';
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '2px' }}>MULTI MODE LOGISTICS (INDIA) PVT. LTD.</div>
                <div style={{ fontSize: '9px', lineHeight: '1.4' }}>
                  <div><strong>Address:</strong> 6/2, Snehalata, Near Rajkumar Bridge, Indore, Madhya Pradesh.</div>
                  <div><strong>GST IN:</strong> 23AAHCM8960D1ZG   <strong>Phone:</strong> 8370000320   <strong>Email:</strong> pickup@mmlipl.com</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Copy Label at Top */}
          <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
            Consignor Copy
          </div>
          
          {/* Docket No, Ref No, Date */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '33%', padding: '3px', border: '1px solid #000' }}><strong>Docket No</strong></td>
                <td style={{ width: '33%', padding: '3px', border: '1px solid #000' }}><strong>Ref No</strong></td>
                <td style={{ width: '34%', padding: '3px', border: '1px solid #000' }}><strong>Date</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{lrData.lrNumber || 'N/A'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{lrData.referenceNumber || '-'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{formatDateLong(lrData.bookingDate)}</td>
              </tr>
            </tbody>
          </table>

          {/* Origin and Destination */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', padding: '3px', border: '1px solid #000' }}><strong>Origin</strong></td>
                <td style={{ width: '50%', padding: '3px', border: '1px solid #000' }}><strong>Destination</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{originDest[0]}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{originDest[1]}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignor and Consignee Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6px', fontSize: '9px' }}>
            <thead>
              <tr>
                <th style={{ width: '50%', padding: '3px', border: '1px solid #000', textAlign: 'left' }}>Consignor's Name & Address</th>
                <th style={{ width: '50%', padding: '3px', border: '1px solid #000', textAlign: 'left' }}>Consignee's Name & Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignor?.name || 'N/A'}</div>
                  <div>{consignorAddr.address || ''}</div>
                  <div>Pin: {consignorAddr.pin || ''}   Phone: {lrData.consignor?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignor?.gst || ''}</div>
                </td>
                <td style={{ padding: '3px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignee?.name || 'N/A'}</div>
                  <div>{consigneeAddr.address || ''}</div>
                  <div>Pin: {consigneeAddr.pin || '0'}   Phone: {lrData.consignee?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignee?.gst || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Shipment Details Table (same fields as POD copy) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px', fontSize: '8px' }}>
            <thead>
              <tr>
                <th style={{ padding: '3px', border: '1px solid #000' }}>No Of Pkgs.</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Actual Weight (Kgs)</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Charged Weight</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Invoice No</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Invoice Value</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>E-Way Bill No</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Description Of Goods</th>
                <th style={{ padding: '3px', border: '1px solid #000' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.weight || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{chargedWeight}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.invoices?.[0]?.number || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>0</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.ewaybills?.[0]?.number || '0'}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getDescriptionOfGoods()}</td>
                <td style={{ padding: '3px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
              </tr>
            </tbody>
          </table>

          {/* Mode of Delivery, Booking, Type, Dimension (same as POD copy) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '5px', fontSize: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Mode of Delivery</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Mode of Booking</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Booking Type</strong></td>
                <td style={{ width: '25%', padding: '3px', border: '1px solid #000' }}><strong>Dimension</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '3px', border: '1px solid #000' }}>
                  {lrData.deliveryType === 'Door' ? 'Door Delivery' : (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>GODOWN DELIVERY</span>
                  )}
                </td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getModeOfBooking()}</td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>
                  {lrData.paymentMode === 'Paid' ? (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>PAID</span>
                  ) : lrData.paymentMode === 'ToPay' ? (
                    <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#000' }}>TO PAY</span>
                  ) : (
                    getBookingType()
                  )}
                </td>
                <td style={{ padding: '3px', border: '1px solid #000' }}>{getDimensionString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Terms and Conditions */}
          <div style={{ fontSize: '7px', marginBottom: '5px', lineHeight: '1.2' }}>
            <div>Our liability for any loss or damage to the shipment is to the extent of Rs. 100/- only.</div>
            <div>All disputes are subject to the jurisdiction of Indore station courts only.</div>
            <div>This is a non-negotiable Consignment Note. Thereby declare:</div>
            <div>(1) That this consignment does not contain currency notes, jewellery, contraband, explosives etc.</div>
            <div>(2) That I have read the terms & conditions of carriage as given on reverse of the Shipper's Copy of Consignment Note and abide by the same.</div>
          </div>

          {/* Freight Details Table (full, like POD copy) */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4px', fontSize: '8px' }}>
            <tbody>
              <tr>
                <td style={{ width: '20%', padding: '2px 3px', border: '1px solid #000' }}><strong>Freight Type</strong></td>
                <td style={{ width: '20%', padding: '2px 3px', border: '1px solid #000' }}><strong>Freight Charge</strong></td>
                <td style={{ width: '20%', padding: '2px 3px', border: '1px solid #000' }}><strong>Other Charges</strong></td>
                <td style={{ width: '20%', padding: '2px 3px', border: '1px solid #000' }}><strong>Docket Charge</strong></td>
                <td style={{ width: '20%', padding: '2px 3px', border: '1px solid #000' }}><strong>Total Freight</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '2px 3px', border: '1px solid #000' }}>SUNDRY</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.freightRate) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.other) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.lrCharges) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? subtotal.toFixed(2) : '---'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 3px', border: '1px solid #000' }}><strong>IGST %</strong></td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.igst.toFixed(2) : '---'}</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000' }}><strong>CGST %</strong></td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.cgst.toFixed(2) : '---'}</td>
                <td style={{ padding: '2px 3px', border: '1px solid #000' }}><strong>SGST %</strong></td>
              </tr>
              <tr>
                <td colSpan="4" style={{ padding: '2px 3px', border: '1px solid #000' }}><strong>Grand Total</strong></td>
                <td style={{ padding: '2px 3px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? grandTotal.toFixed(2) : '---'}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignment Acknowledgement */}
          <div style={{ fontSize: '7px', marginBottom: '4px', lineHeight: '1.15' }}>
            <div><strong>Consignment Acknowledgement by consignee:</strong> We have verified the weight & received cargo with Documents in good condition.</div>
            <div style={{ marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
              <div>Signature ___________ Date: ______</div>
              <div>Seal Of The Company _________ Time: ______</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '7px', marginTop: '4px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div><strong>Freight Detail :</strong> As Per Terms</div>
              <div><strong>Remarks :</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>For : Multi Mode Logistics (India) Pvt Ltd.</div>
              <div style={{ marginTop: '8px' }}>SHIV DEV SINGH</div>
              <div style={{ marginTop: '2px' }}>Auth. Signatory</div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
