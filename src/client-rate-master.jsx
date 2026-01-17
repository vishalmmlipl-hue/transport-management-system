
import React, { useState, useEffect } from 'react';
import { tbbClientsService } from './services/dataService';
import { Save, Plus, Trash2, Edit2, DollarSign, Package, MapPin, Weight, Truck, Download, Upload, FileSpreadsheet } from 'lucide-react';
import { apiService } from './utils/apiService';
import syncService from './utils/sync-service';

const parseMaybeJson = (value) => {
  if (value == null) return value;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

export default function ClientRateMaster() {
  const [clients, setClients] = useState([]);
  const [cities, setCities] = useState([]);
  const [clientRates, setClientRates] = useState([]);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [rateType, setRateType] = useState('per-box');

  useEffect(() => {
    // Load clients + cities (cities are required for Origin/Destination dropdowns)
    async function fetchMasterData() {
      try {
        const [clientsResp, citiesResp] = await Promise.all([
          tbbClientsService.getAll().catch(() => []),
          apiService.getCities().catch(() => []),
        ]);

        const clientList = Array.isArray(clientsResp) ? clientsResp : (clientsResp?.data || []);
        const normalizedClients = (clientList || []).map(c => ({
          ...c,
          // Ensure fields exist across schemas
          clientType: c.clientType || 'TBB',
          companyName: c.companyName || c.clientName || c.client_name,
          clientName: c.clientName || c.companyName || c.client_name,
          clientCode: c.clientCode || c.code || c.client_code || '',
          code: c.code || c.clientCode || c.client_code || '',
        }));
        setClients((normalizedClients || []).filter(c => (c.status === 'Active' || !c.status) && (String(c.clientType || '').toUpperCase() === 'TBB')));

        const cityList = Array.isArray(citiesResp) ? citiesResp : (citiesResp?.data || []);
        // Keep only active cities; normalize common fields
        const normalizedCities = (cityList || [])
          .filter(c => c && (c.status === 'Active' || !c.status))
          .map(c => ({
            ...c,
            id: c.id,
            code: c.code,
            cityName: c.cityName || c.name || c.city || '',
            state: c.state || '',
          }))
          .filter(c => c.id != null && c.cityName);
        setCities(normalizedCities);

        // Load rates from server (shared across systems)
        const ratesRes = await syncService.load('clientRates').catch(() => ({ data: [] }));
        const rawRates = Array.isArray(ratesRes) ? ratesRes : (ratesRes?.data || []);
        const hydratedRates = (rawRates || []).map(r => {
          const payload = parseMaybeJson(r?.data);
          if (payload && typeof payload === 'object') {
            return { ...payload, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, clientId: payload.clientId ?? r.clientId, clientCode: payload.clientCode ?? r.clientCode };
          }
          return r;
        });
        setClientRates(hydratedRates);
      } catch (err) {
        console.error('Error loading Client Rate Master data:', err);
        setClients([]);
        setCities([]);
        setClientRates([]);
      }
    }

    fetchMasterData();
  }, []);

  const [formData, setFormData] = useState({
    clientId: '',
    rateType: 'per-box',
    
    // Per Box/Item Rates
    perBoxRates: [{
      itemName: '',
      ratePerBox: '',
      minimumFreight: '', // Minimum freight charge
      description: '',
      originCity: '', // Origin city for city-to-city rates
      destinationCity: '', // Destination city for city-to-city rates
      applyToState: '' // State name if rate applies to entire state, empty for city-to-city
    }],
    
    // City Wise Rates
    cityWiseRates: [{
      originCity: '',
      destinationCity: '',
      ratePerKg: '',
      ratePerBox: '',
      minimumCharge: ''
    }],
    
    // Weight Slab Rates (City Wise)
    weightSlabRates: [{
      originCity: '',
      destinationCity: '',
      weightFrom: '',
      weightTo: '',
      ratePerKg: '',
      minimumCharge: ''
    }],
    
    // FTL (Full Truck Load) Rates
    ftlRates: [{
      originCity: '',
      destinationCity: '',
      vehicleType: '',
      ratePerTruck: '',
      description: ''
    }],
    
    // Additional Charges
    odaCharges: '',
    pickupCharges: '',
    deliveryCharges: '',
    lrCharges: '',
    waraiCharges: '',
    otherCharges: '',
    gstPercent: '5-rcm', // GST percentage: 'exempted', '5', '5-rcm'
    deliveryType: 'Godown', // Delivery type: 'Godown' or 'Door'
    showAmountsInPrint: true, // Show or hide amounts in printed LR for TBB clients
    
    effectiveDate: new Date().toISOString().split('T')[0],
    status: 'Active',
    remarks: ''
  });

  const addPerBoxRate = () => {
    setFormData(prev => ({
      ...prev,
      perBoxRates: [...prev.perBoxRates, { 
        itemName: '', 
        ratePerBox: '', 
        minimumFreight: '',
        description: '',
        originCity: '',
        destinationCity: '',
        applyToState: ''
      }]
    }));
  };

  const removePerBoxRate = (index) => {
    setFormData(prev => ({
      ...prev,
      perBoxRates: prev.perBoxRates.filter((_, i) => i !== index)
    }));
  };

  const addCityWiseRate = () => {
    setFormData(prev => ({
      ...prev,
      cityWiseRates: [...prev.cityWiseRates, { 
        originCity: '', 
        destinationCity: '', 
        ratePerKg: '', 
        ratePerBox: '',
        minimumCharge: '' 
      }]
    }));
  };

  const removeCityWiseRate = (index) => {
    setFormData(prev => ({
      ...prev,
      cityWiseRates: prev.cityWiseRates.filter((_, i) => i !== index)
    }));
  };

  const addWeightSlabRate = () => {
    setFormData(prev => ({
      ...prev,
      weightSlabRates: [...prev.weightSlabRates, { 
        originCity: '', 
        destinationCity: '', 
        weightFrom: '',
        weightTo: '',
        ratePerKg: '', 
        minimumCharge: '' 
      }]
    }));
  };

  const removeWeightSlabRate = (index) => {
    setFormData(prev => ({
      ...prev,
      weightSlabRates: prev.weightSlabRates.filter((_, i) => i !== index)
    }));
  };

  const addFTLRate = () => {
    setFormData(prev => ({
      ...prev,
      ftlRates: [...prev.ftlRates, { 
        originCity: '', 
        destinationCity: '', 
        vehicleType: '',
        ratePerTruck: '', 
        description: '' 
      }]
    }));
  };

  const removeFTLRate = (index) => {
    setFormData(prev => ({
      ...prev,
      ftlRates: prev.ftlRates.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const client = clients.find(c => c.id?.toString() === formData.clientId?.toString());
    const clientCode = client?.clientCode || client?.code || '';
    const dbPayload = {
      clientId: formData.clientId?.toString() || '',
      clientCode,
      rateType: formData.rateType || formData.rateType,
      status: formData.status || 'Active',
      effectiveDate: formData.effectiveDate || new Date().toISOString().split('T')[0],
      showAmountsInPrint: formData.showAmountsInPrint ? 1 : 0,
      data: {
        ...formData,
        clientCode,
        id: undefined,
      },
      updatedAt: new Date().toISOString(),
    };

    try {
      if (editingId) {
        await syncService.save('clientRates', dbPayload, true, editingId);
        setEditingId(null);
      } else {
        const { id, ...payloadNoId } = dbPayload; // ensure no id on create
        await syncService.save('clientRates', payloadNoId, false, null);
      }

      const ratesRes = await syncService.load('clientRates', true).catch(() => ({ data: [] }));
      const rawRates = Array.isArray(ratesRes) ? ratesRes : (ratesRes?.data || []);
      const hydratedRates = (rawRates || []).map(r => {
        const payload = parseMaybeJson(r?.data);
        if (payload && typeof payload === 'object') {
          return { ...payload, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, clientId: payload.clientId ?? r.clientId, clientCode: payload.clientCode ?? r.clientCode };
        }
        return r;
      });
      setClientRates(hydratedRates);
    } catch (err) {
      console.error('Client rate save error:', err);
      alert(`❌ Failed to save client rate.\n\n${err?.message || err}`);
      return;
    }

    setShowSuccessMessage(true);
    setTimeout(() => setShowSuccessMessage(false), 3000);

    // Reset form
    setFormData({
      clientId: '',
      rateType: 'per-box',
      perBoxRates: [{ 
        itemName: '', 
        ratePerBox: '', 
        minimumFreight: '',
        description: '',
        originCity: '',
        destinationCity: '',
        applyToState: ''
      }],
      cityWiseRates: [{ originCity: '', destinationCity: '', ratePerKg: '', ratePerBox: '', minimumCharge: '' }],
      weightSlabRates: [{ originCity: '', destinationCity: '', weightFrom: '', weightTo: '', ratePerKg: '', minimumCharge: '' }],
      odaCharges: '',
      pickupCharges: '',
      deliveryCharges: '',
      lrCharges: '',
      waraiCharges: '',
      otherCharges: '',
      gstPercent: '5-rcm',
      deliveryType: 'Godown',
      showAmountsInPrint: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      status: 'Active',
      remarks: ''
    });

    setTimeout(() => {
      document.querySelector('select[name="clientId"]')?.focus();
    }, 100);
  };

  const editRate = (rate) => {
    setFormData(rate);
    setEditingId(rate.id);
    setRateType(rate.rateType);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteRate = async (id) => {
    if (window.confirm('Are you sure you want to delete this rate?')) {
      try {
        // Use backend delete so it disappears on all systems
        const databaseAPI = (await import('./utils/database-api')).default;
        await databaseAPI.delete('clientRates', id);
        const updated = clientRates.filter(r => r.id !== id);
        setClientRates(updated);
      } catch (err) {
        console.error('Client rate delete error:', err);
        alert(`❌ Failed to delete rate.\n\n${err?.message || err}`);
      }
    }
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id.toString() === clientId);
    return client ? client.companyName : 'Unknown Client';
  };

  const getCityName = (cityId) => {
    if (!cityId) return '';
    const val = cityId.toString();
    const city = cities.find(c =>
      c.id?.toString() === val ||
      c.code?.toString() === val ||
      c.cityName?.toString() === val
    );
    return city ? `${city.cityName}${city.state ? `, ${city.state}` : ''}` : cityId;
  };

  // Excel Template Download
  const downloadExcelTemplate = (templateType) => {
    const XLSX = window.XLSX;
    if (!XLSX) {
      alert('Excel library not loaded. Please refresh the page.');
      return;
    }

    let worksheetData = [];
    let filename = '';

    if (templateType === 'per-box') {
      worksheetData = [
        ['CLIENT RATE MASTER - PER BOX/ITEM TEMPLATE'],
        ['Fill in the yellow cells, then upload this file'],
        [],
        ['Client Code', 'Item Name', 'Rate Per Box', 'Description', 'ODA Charges', 'Pickup Charges', 'Delivery Charges', 'LR Charges', 'Warai Charges', 'Other Charges', 'Effective Date', 'Remarks'],
        ['TBB-001', 'Small Box', '50', 'Standard small box', '100', '30', '50', '20', '25', '10', '2025-01-01', 'Sample rate'],
        ['TBB-001', 'Large Box', '100', 'Standard large box', '100', '30', '50', '20', '25', '10', '2025-01-01', ''],
        ['', '', '', '', '', '', '', '', '', '', '', ''],
      ];
      filename = 'Rate_Template_PerBox.xlsx';
    } else if (templateType === 'city-wise') {
      worksheetData = [
        ['CLIENT RATE MASTER - CITY WISE TEMPLATE'],
        ['Fill in the yellow cells, then upload this file'],
        [],
        ['Client Code', 'Origin City', 'Destination City', 'Rate Per Kg', 'Rate Per Box', 'Minimum Charge', 'ODA Charges', 'Pickup Charges', 'Delivery Charges', 'LR Charges', 'Warai Charges', 'Other Charges', 'Effective Date', 'Remarks'],
        ['TBB-001', 'Mumbai', 'Delhi', '15', '200', '500', '100', '50', '75', '20', '30', '10', '2025-01-01', 'Sample rate'],
        ['TBB-001', 'Delhi', 'Bangalore', '18', '250', '600', '150', '60', '80', '25', '35', '15', '2025-01-01', ''],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ];
      filename = 'Rate_Template_CityWise.xlsx';
    } else if (templateType === 'weight-slab') {
      worksheetData = [
        ['CLIENT RATE MASTER - WEIGHT SLAB TEMPLATE'],
        ['Fill in the yellow cells, then upload this file'],
        [],
        ['Client Code', 'Origin City', 'Destination City', 'Weight From (Kg)', 'Weight To (Kg)', 'Rate Per Kg', 'Minimum Charge', 'ODA Charges', 'Pickup Charges', 'Delivery Charges', 'LR Charges', 'Warai Charges', 'Other Charges', 'Effective Date', 'Remarks'],
        ['TBB-001', 'Mumbai', 'Delhi', '0', '50', '20', '500', '100', '50', '75', '20', '30', '10', '2025-01-01', '0-50 kg slab'],
        ['TBB-001', 'Mumbai', 'Delhi', '51', '100', '18', '900', '100', '50', '75', '20', '30', '10', '2025-01-01', '51-100 kg slab'],
        ['TBB-001', 'Mumbai', 'Delhi', '101', '999', '15', '1500', '100', '50', '75', '20', '30', '10', '2025-01-01', '101+ kg slab'],
        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ];
      filename = 'Rate_Template_WeightSlab.xlsx';
    }

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    const colWidths = Array(14).fill({ wch: 15 });
    ws['!cols'] = colWidths;

    // Apply styles (yellow background for data rows)
    const range = XLSX.utils.decode_range(ws['!ref']);
    for (let R = 3; R <= range.e.r; R++) {
      for (let C = range.s.c; C <= range.e.c; C++) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        ws[cellAddress].s = {
          fill: { fgColor: { rgb: R >= 4 ? "FFFF00" : "FFFFFF" } },
          font: { bold: R < 3 },
          border: {
            top: { style: 'thin', color: { rgb: "000000" } },
            bottom: { style: 'thin', color: { rgb: "000000" } },
            left: { style: 'thin', color: { rgb: "000000" } },
            right: { style: 'thin', color: { rgb: "000000" } }
          }
        };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Rate Master');
    XLSX.writeFile(wb, filename);
  };

  // Excel Upload Handler
  const handleExcelUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const XLSX = window.XLSX;
    if (!XLSX) {
      alert('Excel library not loaded. Please refresh the page.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Detect rate type from header
        const headerRow = jsonData[0][0];
        let rateType = 'per-box';
        if (headerRow.includes('CITY WISE')) rateType = 'city-wise';
        if (headerRow.includes('WEIGHT SLAB')) rateType = 'weight-slab';

        // Parse data starting from row 4 (index 3)
        const dataRows = jsonData.slice(4).filter(row => row[0]); // Skip empty rows

        let importedCount = 0;
        const newRates = [];

        dataRows.forEach(row => {
          if (!row[0]) return; // Skip empty client code

          const clientCode = row[0].toString().trim();
          const client = clients.find(c => (c.clientCode || c.code) === clientCode);
          if (!client) {
            console.warn(`Client not found: ${clientCode}`);
            return;
          }

          let newRate = {
            id: Date.now() + Math.random(),
            clientId: client.id.toString(),
            clientCode,
            rateType: rateType,
            perBoxRates: [],
            cityWiseRates: [],
            weightSlabRates: [],
            effectiveDate: row[rateType === 'per-box' ? 10 : rateType === 'city-wise' ? 12 : 13] || new Date().toISOString().split('T')[0],
            status: 'Active',
            remarks: row[rateType === 'per-box' ? 11 : rateType === 'city-wise' ? 13 : 14] || '',
            createdAt: new Date().toISOString()
          };

          if (rateType === 'per-box') {
            // Client Code, Item Name, Rate Per Box, Description, ODA, Pickup, Delivery, LR, Warai, Other, Effective Date, Remarks
            newRate.perBoxRates = [{
              itemName: row[1] || '',
              ratePerBox: row[2] || '',
              description: row[3] || ''
            }];
            newRate.odaCharges = row[4] || '';
            newRate.pickupCharges = row[5] || '';
            newRate.deliveryCharges = row[6] || '';
            newRate.lrCharges = row[7] || '';
            newRate.waraiCharges = row[8] || '';
            newRate.otherCharges = row[9] || '';
          } else if (rateType === 'city-wise') {
            // Client Code, Origin, Dest, Rate/Kg, Rate/Box, Min Charge, ODA, Pickup, Delivery, LR, Warai, Other, Effective, Remarks
            const originCity = cities.find(c => c.cityName === row[1]);
            const destCity = cities.find(c => c.cityName === row[2]);
            
            if (originCity && destCity) {
              newRate.cityWiseRates = [{
                originCity: originCity.id.toString(),
                destinationCity: destCity.id.toString(),
                ratePerKg: row[3] || '',
                ratePerBox: row[4] || '',
                minimumCharge: row[5] || ''
              }];
              newRate.odaCharges = row[6] || '';
              newRate.pickupCharges = row[7] || '';
              newRate.deliveryCharges = row[8] || '';
              newRate.lrCharges = row[9] || '';
              newRate.waraiCharges = row[10] || '';
              newRate.otherCharges = row[11] || '';
            }
          } else if (rateType === 'weight-slab') {
            // Client Code, Origin, Dest, Weight From, Weight To, Rate/Kg, Min Charge, ODA, Pickup, Delivery, LR, Warai, Other, Effective, Remarks
            const originCity = cities.find(c => c.cityName === row[1]);
            const destCity = cities.find(c => c.cityName === row[2]);
            
            if (originCity && destCity) {
              newRate.weightSlabRates = [{
                originCity: originCity.id.toString(),
                destinationCity: destCity.id.toString(),
                weightFrom: row[3] || '',
                weightTo: row[4] || '',
                ratePerKg: row[5] || '',
                minimumCharge: row[6] || ''
              }];
              newRate.odaCharges = row[7] || '';
              newRate.pickupCharges = row[8] || '';
              newRate.deliveryCharges = row[9] || '';
              newRate.lrCharges = row[10] || '';
              newRate.waraiCharges = row[11] || '';
              newRate.otherCharges = row[12] || '';
            }
          }

          newRates.push(newRate);
          importedCount++;
        });

        // Save imported rates to server so they appear on all systems
        for (const r of newRates) {
          const dbPayload = {
            clientId: r.clientId?.toString() || '',
            clientCode: (clients.find(c => c.id?.toString() === r.clientId?.toString())?.clientCode) || r.clientCode || '',
            rateType: r.rateType || '',
            status: r.status || 'Active',
            effectiveDate: r.effectiveDate || new Date().toISOString().split('T')[0],
            showAmountsInPrint: r.showAmountsInPrint ? 1 : 0,
            data: { ...r, id: undefined },
            updatedAt: new Date().toISOString(),
          };
          await syncService.save('clientRates', dbPayload, false, null);
        }

        const ratesRes = await syncService.load('clientRates', true).catch(() => ({ data: [] }));
        const rawRates = Array.isArray(ratesRes) ? ratesRes : (ratesRes?.data || []);
        const hydratedRates = (rawRates || []).map(r => {
          const payload = parseMaybeJson(r?.data);
          if (payload && typeof payload === 'object') {
            return { ...payload, id: r.id, createdAt: r.createdAt, updatedAt: r.updatedAt, clientId: payload.clientId ?? r.clientId, clientCode: payload.clientCode ?? r.clientCode };
          }
          return r;
        });
        setClientRates(hydratedRates);

        alert(`✅ Successfully imported ${importedCount} rate(s)!`);
        event.target.value = ''; // Reset file input
      } catch (error) {
        console.error('Excel import error:', error);
        alert('❌ Error importing Excel file. Please check the format and try again.');
      }
    };

    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #3b82f6;
        }
        
        .section-title {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          gap: 8px;
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
        
        .btn-secondary {
          background: white;
          color: #3b82f6;
          border: 2px solid #3b82f6;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
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
        
        .rate-item {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .toggle-group {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .toggle-btn {
          flex: 1;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          color: #64748b;
          text-align: center;
        }
        
        .toggle-btn.active {
          background: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        
        .success-message {
          position: fixed;
          top: 20px;
          right: 20px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 16px 24px;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(16,185,129,0.3);
          z-index: 1000;
          animation: slideIn 0.3s ease;
        }
        
        @keyframes slideIn {
          from { transform: translateX(400px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        
        .rate-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .rate-card:hover {
          border-color: #3b82f6;
          box-shadow: 0 4px 12px rgba(59,130,246,0.1);
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
            💰 Client Rate Master
          </h1>
          <p className="text-slate-600 text-lg">TBB Client Rate Matrix - Per Box, City Wise & Weight Wise</p>
        </div>

        {/* Excel Import/Export Section */}
        <div className="form-section" style={{ marginBottom: '30px' }}>
          <h2 className="section-title">
            <FileSpreadsheet size={20} />
            📊 Bulk Upload from Excel
          </h2>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              padding: '20px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
                <Download size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Download Templates
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px', opacity: 0.9 }}>
                Download Excel template, fill rates, then upload
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => downloadExcelTemplate('per-box')}
                  className="btn btn-secondary"
                  style={{ 
                    background: 'white', 
                    color: '#10b981', 
                    border: '2px solid white',
                    justifyContent: 'center'
                  }}
                >
                  <Package size={16} /> Per Box Template
                </button>
                <button
                  type="button"
                  onClick={() => downloadExcelTemplate('city-wise')}
                  className="btn btn-secondary"
                  style={{ 
                    background: 'white', 
                    color: '#10b981', 
                    border: '2px solid white',
                    justifyContent: 'center'
                  }}
                >
                  <MapPin size={16} /> City Wise Template
                </button>
                <button
                  type="button"
                  onClick={() => downloadExcelTemplate('weight-slab')}
                  className="btn btn-secondary"
                  style={{ 
                    background: 'white', 
                    color: '#10b981', 
                    border: '2px solid white',
                    justifyContent: 'center'
                  }}
                >
                  <Weight size={16} /> Weight Slab Template
                </button>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
              padding: '20px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
                <Upload size={20} style={{ display: 'inline', marginRight: '8px' }} />
                Upload Filled Excel
              </h3>
              <p style={{ fontSize: '0.85rem', marginBottom: '16px', opacity: 0.9 }}>
                After filling template, upload Excel file here
              </p>
              <label 
                htmlFor="excelUpload"
                className="btn btn-secondary"
                style={{ 
                  background: 'white', 
                  color: '#3b82f6', 
                  border: '2px solid white',
                  cursor: 'pointer',
                  justifyContent: 'center',
                  display: 'flex'
                }}
              >
                <Upload size={16} /> Choose Excel File
              </label>
              <input
                id="excelUpload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleExcelUpload}
                style={{ display: 'none' }}
              />
              <p style={{ fontSize: '0.75rem', marginTop: '12px', opacity: 0.8 }}>
                Supported: .xlsx, .xls files
              </p>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '20px',
              borderRadius: '12px',
              color: 'white'
            }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px' }}>
                📝 Quick Instructions
              </h3>
              <ul style={{ fontSize: '0.85rem', lineHeight: '1.8', listStyle: 'none', padding: 0 }}>
                <li>✅ 1. Download template (choose type)</li>
                <li>✅ 2. Fill in yellow cells in Excel</li>
                <li>✅ 3. Use exact client codes & city names</li>
                <li>✅ 4. Save and upload the file</li>
                <li>✅ 5. Rates will be imported instantly!</li>
              </ul>
            </div>
          </div>

          <div style={{
            background: '#fef3c7',
            border: '2px solid #fbbf24',
            borderRadius: '8px',
            padding: '16px',
            fontSize: '0.9rem',
            color: '#92400e'
          }}>
            <strong>⚠️ Important:</strong> 
            <ul style={{ marginTop: '8px', marginBottom: 0, paddingLeft: '20px' }}>
              <li>Use exact <strong>Client Codes</strong> from Client Master (e.g., TBB-001)</li>
              <li>Use exact <strong>City Names</strong> from City Master (e.g., Mumbai, Delhi)</li>
              <li>Fill <strong>yellow cells</strong> only, don't modify headers</li>
              <li>One row = one rate entry (you can have multiple rows for same client)</li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{
          textAlign: 'center',
          margin: '30px 0',
          fontSize: '1.2rem',
          fontWeight: 600,
          color: '#64748b'
        }}>
          — OR Manual Entry Below —
        </div>

        {showSuccessMessage && (
          <div className="success-message">
            <strong>✅ Client Rate {editingId ? 'Updated' : 'Created'} Successfully!</strong>
            <p style={{ fontSize: '0.9rem', marginTop: '4px', opacity: 0.9 }}>
              Ready for next entry...
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Client Selection */}
          <div className="form-section">
            <h2 className="section-title">
              <DollarSign size={20} />
              Client & Rate Type
            </h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Select TBB Client *</label>
                {clients.length === 0 ? (
                  <div style={{
                    padding: '12px',
                    background: '#fef3c7',
                    borderRadius: '8px',
                    border: '2px solid #fbbf24',
                    color: '#92400e',
                    fontSize: '0.9rem'
                  }}>
                    ⚠️ No TBB clients available. Please add TBB clients first.
                  </div>
                ) : (
                  <select
                    name="clientId"
                    value={formData.clientId}
                    onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                    required
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>
                        {client.code} - {client.companyName}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              <div className="input-group">
                <label>Effective Date *</label>
                <input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <label>Rate Type *</label>
            <div className="toggle-group">
              <button
                type="button"
                className={`toggle-btn ${rateType === 'per-box' ? 'active' : ''}`}
                onClick={() => {
                  setRateType('per-box');
                  setFormData(prev => ({ ...prev, rateType: 'per-box' }));
                }}
              >
                📦 Per Box / Item
              </button>
              <button
                type="button"
                className={`toggle-btn ${rateType === 'city-wise' ? 'active' : ''}`}
                onClick={() => {
                  setRateType('city-wise');
                  setFormData(prev => ({ ...prev, rateType: 'city-wise' }));
                }}
              >
                🗺️ City Wise
              </button>
              <button
                type="button"
                className={`toggle-btn ${rateType === 'weight-slab' ? 'active' : ''}`}
                onClick={() => {
                  setRateType('weight-slab');
                  setFormData(prev => ({ ...prev, rateType: 'weight-slab' }));
                }}
              >
                ⚖️ Weight Slab
              </button>
              <button
                type="button"
                className={`toggle-btn ${rateType === 'ftl' ? 'active' : ''}`}
                onClick={() => {
                  setRateType('ftl');
                  setFormData(prev => ({ ...prev, rateType: 'ftl' }));
                }}
              >
                🚚 FTL (Per Truck)
              </button>
            </div>
          </div>

          {/* Per Box Rates */}
          {rateType === 'per-box' && (
            <div className="form-section">
              <h2 className="section-title">
                <Package size={20} />
                Per Box / Item Wise Rates
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Define rates for different item types/boxes
                </p>
                <button type="button" className="btn btn-secondary" onClick={addPerBoxRate}>
                  <Plus size={16} /> Add Item
                </button>
              </div>

              {formData.perBoxRates.map((item, index) => (
                <div key={index} className="rate-item">
                  <div className="grid-3">
                    <div className="input-group">
                      <label>Item/Box Name *</label>
                      <input
                        type="text"
                        value={item.itemName}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].itemName = e.target.value;
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                        placeholder="e.g., Small Box, Large Box, Cartoon"
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Rate Per Box (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.ratePerBox}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].ratePerBox = e.target.value;
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Minimum Freight (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.minimumFreight}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].minimumFreight = e.target.value;
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                        placeholder="Minimum freight charge"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="input-group" style={{ marginTop: '12px' }}>
                    <label>Description</label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => {
                        const newRates = [...formData.perBoxRates];
                        newRates[index].description = e.target.value;
                        setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                      }}
                      placeholder="Optional notes"
                    />
                  </div>
                  
                  <div className="grid-3" style={{ marginTop: '12px' }}>
                    <div className="input-group">
                      <label>Origin City</label>
                      <select
                        value={item.originCity}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].originCity = e.target.value;
                          // Clear applyToState when city is selected
                          if (e.target.value) {
                            newRates[index].applyToState = '';
                          }
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                        disabled={!!item.applyToState}
                      >
                        <option value="">-- Select Origin City --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {city.cityName}, {city.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Destination City</label>
                      <select
                        value={item.destinationCity}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].destinationCity = e.target.value;
                          // Clear applyToState when city is selected
                          if (e.target.value) {
                            newRates[index].applyToState = '';
                          }
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                        disabled={!!item.applyToState}
                      >
                        <option value="">-- Select Destination City --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>
                            {city.cityName}, {city.state}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Apply to State</label>
                      <select
                        value={item.applyToState}
                        onChange={(e) => {
                          const newRates = [...formData.perBoxRates];
                          newRates[index].applyToState = e.target.value;
                          // Clear cities when state is selected
                          if (e.target.value) {
                            newRates[index].originCity = '';
                            newRates[index].destinationCity = '';
                          }
                          setFormData(prev => ({ ...prev, perBoxRates: newRates }));
                        }}
                      >
                        <option value="">-- Select State (Optional) --</option>
                        {[...new Set(cities.map(city => city.state))].sort().map(state => (
                          <option key={state} value={state}>
                            {state}
                          </option>
                        ))}
                      </select>
                      <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                        Select a state to apply this rate to all cities in that state (city selection will be disabled)
                      </small>
                    </div>
                  </div>
                  
                  {formData.perBoxRates.length > 1 && (
                    <div style={{ textAlign: 'right', marginTop: '12px' }}>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removePerBoxRate(index)}
                        style={{ padding: '6px 12px' }}
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* City Wise Rates */}
          {rateType === 'city-wise' && (
            <div className="form-section">
              <h2 className="section-title">
                <MapPin size={20} />
                City Wise Rate Matrix
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Define rates for origin-destination city pairs
                </p>
                <button type="button" className="btn btn-secondary" onClick={addCityWiseRate}>
                  <Plus size={16} /> Add City Pair
                </button>
              </div>

              {formData.cityWiseRates.map((rate, index) => (
                <div key={index} className="rate-item">
                  <div className="grid-4">
                    <div className="input-group">
                      <label>Origin City *</label>
                      <select
                        value={rate.originCity}
                        onChange={(e) => {
                          const newRates = [...formData.cityWiseRates];
                          newRates[index].originCity = e.target.value;
                          setFormData(prev => ({ ...prev, cityWiseRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Destination City *</label>
                      <select
                        value={rate.destinationCity}
                        onChange={(e) => {
                          const newRates = [...formData.cityWiseRates];
                          newRates[index].destinationCity = e.target.value;
                          setFormData(prev => ({ ...prev, cityWiseRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Rate Per Kg (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.ratePerKg}
                        onChange={(e) => {
                          const newRates = [...formData.cityWiseRates];
                          newRates[index].ratePerKg = e.target.value;
                          setFormData(prev => ({ ...prev, cityWiseRates: newRates }));
                        }}
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Rate Per Box (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.ratePerBox}
                        onChange={(e) => {
                          const newRates = [...formData.cityWiseRates];
                          newRates[index].ratePerBox = e.target.value;
                          setFormData(prev => ({ ...prev, cityWiseRates: newRates }));
                        }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid-2" style={{ marginTop: '8px' }}>
                    <div className="input-group">
                      <label>Minimum Charge (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.minimumCharge}
                        onChange={(e) => {
                          const newRates = [...formData.cityWiseRates];
                          newRates[index].minimumCharge = e.target.value;
                          setFormData(prev => ({ ...prev, cityWiseRates: newRates }));
                        }}
                      />
                    </div>
                    
                    {formData.cityWiseRates.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeCityWiseRate(index)}
                          style={{ width: '100%' }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Weight Slab Rates */}
          {rateType === 'weight-slab' && (
            <div className="form-section">
              <h2 className="section-title">
                <Weight size={20} />
                Weight Slab Rate Matrix (City Wise)
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Define rates based on weight slabs for city pairs
                </p>
                <button type="button" className="btn btn-secondary" onClick={addWeightSlabRate}>
                  <Plus size={16} /> Add Weight Slab
                </button>
              </div>

              {formData.weightSlabRates.map((slab, index) => (
                <div key={index} className="rate-item">
                  <div className="grid-4">
                    <div className="input-group">
                      <label>Origin City *</label>
                      <select
                        value={slab.originCity}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].originCity = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Destination City *</label>
                      <select
                        value={slab.destinationCity}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].destinationCity = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Weight From (Kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={slab.weightFrom}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].weightFrom = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                        placeholder="0"
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Weight To (Kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={slab.weightTo}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].weightTo = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                        placeholder="100"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid-3" style={{ marginTop: '8px' }}>
                    <div className="input-group">
                      <label>Rate Per Kg (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={slab.ratePerKg}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].ratePerKg = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Minimum Charge (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={slab.minimumCharge}
                        onChange={(e) => {
                          const newRates = [...formData.weightSlabRates];
                          newRates[index].minimumCharge = e.target.value;
                          setFormData(prev => ({ ...prev, weightSlabRates: newRates }));
                        }}
                      />
                    </div>
                    
                    {formData.weightSlabRates.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeWeightSlabRate(index)}
                          style={{ width: '100%' }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* FTL (Full Truck Load) Rates */}
          {rateType === 'ftl' && (
            <div className="form-section">
              <h2 className="section-title">
                <Truck size={20} />
                FTL (Full Truck Load) Rates - Per Truck
              </h2>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                  Define fixed rates per truck for city pairs
                </p>
                <button type="button" className="btn btn-secondary" onClick={addFTLRate}>
                  <Plus size={16} /> Add FTL Rate
                </button>
              </div>

              {formData.ftlRates.map((rate, index) => (
                <div key={index} className="rate-item">
                  <div className="grid-4">
                    <div className="input-group">
                      <label>Origin City *</label>
                      <select
                        value={rate.originCity}
                        onChange={(e) => {
                          const newRates = [...formData.ftlRates];
                          newRates[index].originCity = e.target.value;
                          setFormData(prev => ({ ...prev, ftlRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Destination City *</label>
                      <select
                        value={rate.destinationCity}
                        onChange={(e) => {
                          const newRates = [...formData.ftlRates];
                          newRates[index].destinationCity = e.target.value;
                          setFormData(prev => ({ ...prev, ftlRates: newRates }));
                        }}
                        required
                      >
                        <option value="">-- Select --</option>
                        {cities.map(city => (
                          <option key={city.id} value={city.id}>{city.cityName}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="input-group">
                      <label>Vehicle Type *</label>
                      <input
                        type="text"
                        value={rate.vehicleType}
                        onChange={(e) => {
                          const newRates = [...formData.ftlRates];
                          newRates[index].vehicleType = e.target.value;
                          setFormData(prev => ({ ...prev, ftlRates: newRates }));
                        }}
                        placeholder="e.g., 32ft, 20ft, Mini Truck"
                        required
                      />
                    </div>
                    
                    <div className="input-group">
                      <label>Rate Per Truck (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        value={rate.ratePerTruck}
                        onChange={(e) => {
                          const newRates = [...formData.ftlRates];
                          newRates[index].ratePerTruck = e.target.value;
                          setFormData(prev => ({ ...prev, ftlRates: newRates }));
                        }}
                        placeholder="Fixed rate for full truck"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="grid-2" style={{ marginTop: '8px' }}>
                    <div className="input-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={rate.description}
                        onChange={(e) => {
                          const newRates = [...formData.ftlRates];
                          newRates[index].description = e.target.value;
                          setFormData(prev => ({ ...prev, ftlRates: newRates }));
                        }}
                        placeholder="Optional notes"
                      />
                    </div>
                    
                    {formData.ftlRates.length > 1 && (
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => removeFTLRate(index)}
                          style={{ width: '100%' }}
                        >
                          <Trash2 size={14} /> Remove
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Additional Charges */}
          <div className="form-section">
            <h2 className="section-title">
              Additional Charges (Standard for all bookings)
            </h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>ODA Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.odaCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, odaCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Pickup Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.pickupCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, pickupCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Delivery Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.deliveryCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, deliveryCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>LR Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.lrCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, lrCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Warai/Union Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.waraiCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, waraiCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Other Charges (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.otherCharges}
                  onChange={(e) => setFormData(prev => ({ ...prev, otherCharges: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>GST (%) *</label>
                <select
                  value={formData.gstPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstPercent: e.target.value }))}
                  required
                >
                  <option value="exempted">Exempted</option>
                  <option value="5">5%</option>
                  <option value="5-rcm">5% (RCM)</option>
                </select>
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                  GST percentage for this client's rates
                </small>
              </div>
              
              <div className="input-group">
                <label>Delivery Type *</label>
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
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                  This rate applies to {formData.deliveryType === 'Godown' ? 'Godown' : 'Door'} delivery type
                </small>
              </div>
              
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={formData.showAmountsInPrint}
                    onChange={(e) => setFormData(prev => ({ ...prev, showAmountsInPrint: e.target.checked }))}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span>Show Amounts in Print LR</span>
                </label>
                <small style={{ display: 'block', marginTop: '4px', color: '#64748b', fontSize: '0.75rem' }}>
                  {formData.showAmountsInPrint 
                    ? 'Amounts will be displayed in printed LR for this TBB client' 
                    : 'Amounts will be hidden in printed LR for this TBB client'}
                </small>
              </div>
            </div>
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Additional Information</h2>
            
            <div className="input-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '30px' }}>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ fontSize: '1.1rem', padding: '14px 40px' }}
            >
              <Save size={20} />
              {editingId ? 'Update Rate' : 'Save Rate (Continue Adding)'}
            </button>
            
            {editingId && (
              <button 
                type="button"
                className="btn btn-secondary"
                style={{ marginLeft: '12px', fontSize: '1.1rem', padding: '14px 40px' }}
                onClick={() => {
                  setEditingId(null);
                  setFormData({
                    clientId: '',
                    rateType: 'per-box',
                    perBoxRates: [{ itemName: '', ratePerBox: '', description: '' }],
                    cityWiseRates: [{ originCity: '', destinationCity: '', ratePerKg: '', ratePerBox: '', minimumCharge: '' }],
                    weightSlabRates: [{ originCity: '', destinationCity: '', weightFrom: '', weightTo: '', ratePerKg: '', minimumCharge: '' }],
                    odaCharges: '',
                    pickupCharges: '',
                    deliveryCharges: '',
                    lrCharges: '',
                    waraiCharges: '',
                    otherCharges: '',
                    effectiveDate: new Date().toISOString().split('T')[0],
                    status: 'Active',
                    remarks: ''
                  });
                }}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>

        {/* Rates List */}
        {clientRates.length > 0 && (
          <div className="form-section" style={{ marginTop: '40px' }}>
            <h2 className="section-title">Saved Client Rates ({clientRates.length})</h2>
            
            {clientRates.map(rate => (
              <div key={rate.id} className="rate-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
                      {getClientName(rate.clientId)}
                    </h3>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      <strong>Type:</strong> {rate.rateType === 'per-box' ? '📦 Per Box/Item' : rate.rateType === 'city-wise' ? '🗺️ City Wise' : '⚖️ Weight Slab'} | 
                      <strong> Effective:</strong> {rate.effectiveDate}
                    </div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      onClick={() => editRate(rate)}
                      style={{ padding: '8px 12px' }}
                    >
                      <Edit2 size={16} /> Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => deleteRate(rate.id)}
                      style={{ padding: '8px 12px' }}
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </div>
                </div>
                
                {/* Display Rate Details */}
                {rate.rateType === 'per-box' && rate.perBoxRates && (
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                    <strong>Per Box Rates:</strong>
                    {rate.perBoxRates.map((item, idx) => (
                      <div key={idx} style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                        • {item.itemName}: ₹{item.ratePerBox} per box
                      </div>
                    ))}
                  </div>
                )}
                
                {rate.rateType === 'city-wise' && rate.cityWiseRates && (
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                    <strong>City Wise Rates:</strong>
                    {rate.cityWiseRates.map((cityRate, idx) => (
                      <div key={idx} style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                        • {getCityName(cityRate.originCity)} → {getCityName(cityRate.destinationCity)}: ₹{cityRate.ratePerKg}/kg
                      </div>
                    ))}
                  </div>
                )}
                
                {rate.rateType === 'weight-slab' && rate.weightSlabRates && (
                  <div style={{ background: '#f1f5f9', padding: '12px', borderRadius: '6px', marginTop: '12px' }}>
                    <strong>Weight Slab Rates:</strong>
                    {rate.weightSlabRates.map((slab, idx) => (
                      <div key={idx} style={{ marginTop: '4px', fontSize: '0.9rem' }}>
                        • {getCityName(slab.originCity)} → {getCityName(slab.destinationCity)}: {slab.weightFrom}-{slab.weightTo} kg @ ₹{slab.ratePerKg}/kg
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Additional Charges */}
                <div style={{ marginTop: '12px', fontSize: '0.85rem', color: '#64748b' }}>
                  <strong>Additional Charges:</strong>
                  {rate.deliveryType && (
                    <span style={{ 
                      display: 'inline-block', 
                      marginLeft: '8px', 
                      padding: '2px 8px', 
                      background: rate.deliveryType === 'Door' ? '#fef3c7' : '#dbeafe',
                      borderRadius: '4px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: rate.deliveryType === 'Door' ? '#92400e' : '#1e40af'
                    }}>
                      {rate.deliveryType === 'Door' ? '🚚 Door' : '🏢 Godown'} Delivery
                    </span>
                  )}
                  {rate.odaCharges && ` ODA: ₹${rate.odaCharges}`}
                  {rate.pickupCharges && ` | Pickup: ₹${rate.pickupCharges}`}
                  {rate.deliveryCharges && ` | Delivery: ₹${rate.deliveryCharges}`}
                  {rate.lrCharges && ` | LR: ₹${rate.lrCharges}`}
                  {rate.waraiCharges && ` | Warai: ₹${rate.waraiCharges}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
