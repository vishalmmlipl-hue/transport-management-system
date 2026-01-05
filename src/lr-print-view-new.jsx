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

      const idToUse = lrId || sessionStorage.getItem('printLRId');
      if (idToUse) {
        const lr = allLRs.find(l => l.id.toString() === idToUse.toString());
        if (lr) {
          setLrData(lr);
        }
      }
    };
    
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [lrId]);

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

  const getOriginDestination = () => {
    const originCity = getCityName(lrData.origin);
    const destCity = getCityName(lrData.destination);
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
          padding: 12px;
          font-family: Arial, sans-serif;
          font-size: 10px;
          color: black;
          page-break-after: always;
        }
        
        .lr-print-container:last-child {
          page-break-after: auto;
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

      {/* Multiple Copies */}
      {['Consignor', 'Consignee', 'Accounts', 'EDP'].map((copyType, copyIndex) => (
        <div key={copyType} className="lr-print-container">
          {/* Company Header */}
          <div style={{ fontSize: '10px', marginBottom: '8px', lineHeight: '1.4' }}>
            <div><strong>Address:</strong> 6/2, Snehalata, Near Rajkumar Bridge, Indore, Madhya Pradesh.</div>
            <div><strong>GST IN:</strong> 23AAHCM8960D1ZG   <strong>Phone:</strong> 8370000320   <strong>Email:</strong> pickup@mmlipl.com</div>
          </div>

          {/* Docket No, Ref No, Date */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '33%', padding: '4px', border: '1px solid #000' }}><strong>Docket No</strong></td>
                <td style={{ width: '33%', padding: '4px', border: '1px solid #000' }}><strong>Ref No</strong></td>
                <td style={{ width: '34%', padding: '4px', border: '1px solid #000' }}><strong>Date</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{lrData.lrNumber || 'N/A'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{lrData.lrNumber || 'N/A'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{formatDateLong(lrData.bookingDate)}</td>
              </tr>
            </tbody>
          </table>

          {/* Origin and Destination */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '50%', padding: '4px', border: '1px solid #000' }}><strong>Origin</strong></td>
                <td style={{ width: '50%', padding: '4px', border: '1px solid #000' }}><strong>Destination</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{originDest[0]}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{originDest[1]}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignor and Consignee Details */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
            <thead>
              <tr>
                <th style={{ width: '50%', padding: '4px', border: '1px solid #000', textAlign: 'left' }}>Consignor's Name & Address</th>
                <th style={{ width: '50%', padding: '4px', border: '1px solid #000', textAlign: 'left' }}>Consignee's Name & Address</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignor?.name || 'N/A'}</div>
                  <div>{consignorAddr.address || ''}</div>
                  <div>Pin: {consignorAddr.pin || ''}   Phone: {lrData.consignor?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignor?.gst || ''}</div>
                </td>
                <td style={{ padding: '4px', border: '1px solid #000', verticalAlign: 'top' }}>
                  <div>{lrData.consignee?.name || 'N/A'}</div>
                  <div>{consigneeAddr.address || ''}</div>
                  <div>Pin: {consigneeAddr.pin || '0'}   Phone: {lrData.consignee?.contact || ''}</div>
                  <div>GSTIN: {lrData.consignee?.gst || ''}</div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Shipment Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '9px' }}>
            <thead>
              <tr>
                <th style={{ padding: '4px', border: '1px solid #000' }}>No Of Pkgs.</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Actual Weight (Kgs)</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Charged Weight</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Invoice No</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Invoice Value</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>E-Way Bill No</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Description Of Goods</th>
                <th style={{ padding: '4px', border: '1px solid #000' }}>Quantity</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{lrData.weight || '0'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{chargedWeight}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{lrData.invoices?.[0]?.number || '0'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>0</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{lrData.ewaybills?.[0]?.number || '0'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{getDescriptionOfGoods()}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'center' }}>{lrData.pieces || '0'}</td>
              </tr>
            </tbody>
          </table>

          {/* Mode of Delivery, Booking, Type, Dimension */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '25%', padding: '4px', border: '1px solid #000' }}><strong>Mode of Delivery</strong></td>
                <td style={{ width: '25%', padding: '4px', border: '1px solid #000' }}><strong>Mode of Booking</strong></td>
                <td style={{ width: '25%', padding: '4px', border: '1px solid #000' }}><strong>Booking Type</strong></td>
                <td style={{ width: '25%', padding: '4px', border: '1px solid #000' }}><strong>Dimension</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{lrData.deliveryType === 'Door' ? 'Door Delivery' : 'Godown Delivery'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{getModeOfBooking()}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{getBookingType()}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}>{getDimensionString()}</td>
              </tr>
            </tbody>
          </table>

          {/* Terms and Conditions */}
          <div style={{ fontSize: '9px', marginBottom: '8px', lineHeight: '1.4' }}>
            <div>Our liability for any loss or damage to the shipment is to the extent of Rs. 100/- only.</div>
            <div>All disputes are subject to the jurisdiction of Indore station courts only.</div>
            <div>This is a non-negotiable Consignment Note. Thereby declare:</div>
            <div>(1) That this consignment does not contain currency notes, jewellery, contraband, explosives etc.</div>
            <div>(2) That I have read the terms & conditions of carriage as given on reverse of the Shipper's Copy of Consignment Note and abide by the same.</div>
          </div>

          {/* Freight Details Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8px', fontSize: '10px' }}>
            <tbody>
              <tr>
                <td style={{ width: '20%', padding: '4px', border: '1px solid #000' }}><strong>Freight Type</strong></td>
                <td style={{ width: '20%', padding: '4px', border: '1px solid #000' }}><strong>Freight Charge</strong></td>
                <td style={{ width: '20%', padding: '4px', border: '1px solid #000' }}><strong>Other Charges</strong></td>
                <td style={{ width: '20%', padding: '4px', border: '1px solid #000' }}><strong>Docket Charge</strong></td>
                <td style={{ width: '20%', padding: '4px', border: '1px solid #000' }}><strong>Total Freight</strong></td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000' }}>SUNDRY</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.freightRate) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.other) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? (parseFloat(lrData.charges?.lrCharges) || 0).toFixed(2) : '---'}</td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? subtotal.toFixed(2) : '---'}</td>
              </tr>
              <tr>
                <td style={{ padding: '4px', border: '1px solid #000' }}><strong>IGST %</strong></td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.igst.toFixed(2) : '---'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}><strong>CGST %</strong></td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? gstBreakdown.cgst.toFixed(2) : '---'}</td>
                <td style={{ padding: '4px', border: '1px solid #000' }}><strong>SGST %</strong></td>
              </tr>
              <tr>
                <td colSpan="4" style={{ padding: '4px', border: '1px solid #000' }}><strong>Grand Total</strong></td>
                <td style={{ padding: '4px', border: '1px solid #000', textAlign: 'right' }}>{showAmountsInPrint ? grandTotal.toFixed(2) : '---'}</td>
              </tr>
            </tbody>
          </table>

          {/* Consignment Acknowledgement */}
          <div style={{ fontSize: '9px', marginBottom: '8px', lineHeight: '1.4' }}>
            <div><strong>Consignment Acknowledgement by consignee:</strong> We have verified the weight & received cargo with Documents in good condition.</div>
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
              <div>Signature ___________ Date: ______</div>
              <div>Seal Of The Company _________ Time: ______</div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ fontSize: '9px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div><strong>Freight Detail :</strong> As Per Terms</div>
              <div><strong>Remarks :</strong></div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div>For : Multi Mode Logistics (India) Pvt Ltd.</div>
              <div style={{ marginTop: '20px' }}>SHIV DEV SINGH</div>
              <div style={{ marginTop: '4px' }}>Auth. Signatory</div>
            </div>
          </div>

          {/* Copy Label */}
          <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '11px', fontWeight: 'bold' }}>
            {copyType} Copy
          </div>
        </div>
      ))}
    </div>
  );
}

