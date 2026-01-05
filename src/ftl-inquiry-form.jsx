import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, XCircle, Truck, User, Plus, Search, Edit2, Trash2 } from 'lucide-react';

export default function FTLInquiryForm() {
  const [inquiries, setInquiries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [cities, setCities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isOperator, setIsOperator] = useState(false);

  const vehicleTypeOptions = [
    'TATA ACE', 'PICKUP', '14 FEET', '17 FEET', '19 FEET', '20 FEET',
    '22 FEET', '24 FEET', '32 FEET EXL', '32 FEET MXL',
    '20 FEET TRAILER', '40 FEET TRAILER', 'Truck', 'Mini Truck', 'Tempo',
    'Container 20ft', 'Container 40ft', 'Trailer', 'Others'
  ];

  const [formData, setFormData] = useState({
    inquiryNumber: '',
    inquiryDate: new Date().toISOString().split('T')[0],
    vehicleType: '',
    weight: '',
    containerType: 'Open', // Open or Closed
    from: '',
    to: '',
    freight: '',
    expenses: '',
    clientName: '',
    clientId: '',
    branch: '',
    status: 'Pending', // Pending, Confirmed, Cancelled, Vehicle Assigned, Order Confirmed
    remarks: '',
    // After first confirmation
    assignedVehicle: '',
    assignedVehicleNumber: '',
    assignedDriver: '',
    assignedDriverName: '',
    assignedDriverNumber: '',
    // LR booking reference
    lrBookingId: null,
    lrNumber: '',
    // Timestamps
    confirmedAt: null,
    vehicleAssignedAt: null,
    orderConfirmedAt: null,
    cancelledAt: null,
    cancelledBy: null,
    cancelledReason: ''
  });

  const [fromSearch, setFromSearch] = useState('');
  const [toSearch, setToSearch] = useState('');
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [showToDropdown, setShowToDropdown] = useState(false);
  const [fromDropdownIndex, setFromDropdownIndex] = useState(-1);
  const [toDropdownIndex, setToDropdownIndex] = useState(-1);

  useEffect(() => {
    // Load data
    const storedInquiries = JSON.parse(localStorage.getItem('ftlInquiries') || '[]');
    setInquiries(storedInquiries);
    
    setCities(JSON.parse(localStorage.getItem('cities') || '[]').filter(c => c.status === 'Active'));
    setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]').filter(v => v.status === 'Active'));
    setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]').filter(d => d.status === 'Active'));
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const tbbClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    setClients([...allClients, ...tbbClients].filter(c => c.status === 'Active'));
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]').filter(b => b.status === 'Active'));
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    // Check if operator
    const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const systemUser = systemUsers.find(u => u.username === user?.username);
    const userRole = systemUser?.userRole || user?.role || '';
    setIsOperator(userRole === 'Operator' || userRole === 'operator');
    
    // Auto-select branch
    if (user && branches.length > 0) {
      const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
      const systemUser = systemUsers.find(u => u.username === user.username);
      let userBranchId = systemUser?.branch || user.branch;
      if (userBranchId) {
        const branch = branches.find(b => b.id.toString() === userBranchId.toString());
        if (branch) {
          setFormData(prev => ({ ...prev, branch: branch.id.toString() }));
        }
      }
    }
  }, []);

  // Generate inquiry number
  useEffect(() => {
    if (!editingId && !formData.inquiryNumber) {
      const existingInquiries = JSON.parse(localStorage.getItem('ftlInquiries') || '[]');
      const count = existingInquiries.length + 1;
      const date = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const inquiryNo = `INQ-${date}-${String(count).padStart(4, '0')}`;
      setFormData(prev => ({ ...prev, inquiryNumber: inquiryNo }));
    }
  }, [editingId, formData.inquiryNumber]);

  // Filter cities for dropdown
  const filteredFromCities = cities.filter(city =>
    city.cityName?.toLowerCase().startsWith(fromSearch.toLowerCase()) ||
    city.code?.toLowerCase().startsWith(fromSearch.toLowerCase())
  ).slice(0, 10);

  const filteredToCities = cities.filter(city =>
    city.cityName?.toLowerCase().startsWith(toSearch.toLowerCase()) ||
    city.code?.toLowerCase().startsWith(toSearch.toLowerCase())
  ).slice(0, 10);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const existingInquiries = JSON.parse(localStorage.getItem('ftlInquiries') || '[]');
    
    if (editingId) {
      const updated = existingInquiries.map(inq =>
        inq.id === editingId
          ? { ...formData, id: editingId, updatedAt: new Date().toISOString() }
          : inq
      );
      localStorage.setItem('ftlInquiries', JSON.stringify(updated));
      setInquiries(updated);
      setEditingId(null);
      alert('✅ Inquiry updated successfully!');
    } else {
      const newInquiry = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.name || currentUser?.username || 'Unknown'
      };
      existingInquiries.push(newInquiry);
      localStorage.setItem('ftlInquiries', JSON.stringify(existingInquiries));
      setInquiries(existingInquiries);
      alert('✅ Inquiry created successfully!');
    }
    
    // Reset form
    setFormData({
      inquiryNumber: '',
      inquiryDate: new Date().toISOString().split('T')[0],
      vehicleType: '',
      weight: '',
      containerType: 'Open',
      from: '',
      to: '',
      freight: '',
      expenses: '',
      clientName: '',
      clientId: '',
      branch: formData.branch,
      status: 'Pending',
      remarks: '',
      assignedVehicle: '',
      assignedVehicleNumber: '',
      assignedDriver: '',
      assignedDriverName: '',
      assignedDriverNumber: '',
      lrBookingId: null,
      lrNumber: '',
      confirmedAt: null,
      vehicleAssignedAt: null,
      orderConfirmedAt: null,
      cancelledAt: null,
      cancelledBy: null,
      cancelledReason: ''
    });
    setFromSearch('');
    setToSearch('');
  };

  const handleConfirm = (inquiryId) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry) return;
    
    if (inquiry.status === 'Pending') {
      // First confirmation - move to Confirmed status
      const updated = inquiries.map(i =>
        i.id === inquiryId
          ? {
              ...i,
              status: 'Confirmed',
              confirmedAt: new Date().toISOString(),
              confirmedBy: currentUser?.name || currentUser?.username || 'Unknown'
            }
          : i
      );
      localStorage.setItem('ftlInquiries', JSON.stringify(updated));
      setInquiries(updated);
      alert('✅ Inquiry confirmed! Please assign vehicle and driver.');
    } else if (inquiry.status === 'Vehicle Assigned') {
      // Second confirmation - move to Order Confirmed
      const updated = inquiries.map(i =>
        i.id === inquiryId
          ? {
              ...i,
              status: 'Order Confirmed',
              orderConfirmedAt: new Date().toISOString(),
              orderConfirmedBy: currentUser?.name || currentUser?.username || 'Unknown'
            }
          : i
      );
      localStorage.setItem('ftlInquiries', JSON.stringify(updated));
      setInquiries(updated);
      alert('✅ Order confirmed! You can now create FTL LR Booking.');
    }
  };

  const handleCancel = (inquiryId) => {
    const reason = window.prompt('Please provide reason for cancellation:');
    if (reason === null) return; // User cancelled
    
    const updated = inquiries.map(i =>
      i.id === inquiryId
        ? {
            ...i,
            status: 'Cancelled',
            cancelledAt: new Date().toISOString(),
            cancelledBy: currentUser?.name || currentUser?.username || 'Unknown',
            cancelledReason: reason || ''
          }
        : i
    );
    localStorage.setItem('ftlInquiries', JSON.stringify(updated));
    setInquiries(updated);
    alert('❌ Inquiry cancelled.');
  };

  const handleAssignVehicle = (inquiryId) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry || inquiry.status !== 'Confirmed') return;
    
    const vehicleId = window.prompt('Enter Vehicle ID or select from list:\n' + 
      vehicles.map(v => `${v.id}: ${v.vehicleNumber} - ${v.vehicleType}`).join('\n'));
    
    if (!vehicleId) return;
    
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId || v.vehicleNumber === vehicleId);
    if (!vehicle) {
      alert('Vehicle not found!');
      return;
    }
    
    const driverId = window.prompt('Enter Driver ID or select from list:\n' + 
      drivers.map(d => `${d.id}: ${d.driverName} - ${d.contactDetails?.mobile || 'N/A'}`).join('\n'));
    
    if (!driverId) return;
    
    const driver = drivers.find(d => d.id.toString() === driverId || d.driverName === driverId);
    if (!driver) {
      alert('Driver not found!');
      return;
    }
    
    const updated = inquiries.map(i =>
      i.id === inquiryId
        ? {
            ...i,
            status: 'Vehicle Assigned',
            assignedVehicle: vehicle.id.toString(),
            assignedVehicleNumber: vehicle.vehicleNumber,
            assignedDriver: driver.id.toString(),
            assignedDriverName: driver.driverName,
            assignedDriverNumber: driver.contactDetails?.mobile || '',
            vehicleAssignedAt: new Date().toISOString(),
            assignedBy: currentUser?.name || currentUser?.username || 'Unknown'
          }
        : i
    );
    localStorage.setItem('ftlInquiries', JSON.stringify(updated));
    setInquiries(updated);
    alert('✅ Vehicle and driver assigned! Please confirm the order.');
  };

  const handleCreateLR = (inquiryId) => {
    const inquiry = inquiries.find(i => i.id === inquiryId);
    if (!inquiry || inquiry.status !== 'Order Confirmed') {
      alert('Please confirm the order first!');
      return;
    }
    
    // Store inquiry ID in localStorage to pre-fill FTL booking form
    localStorage.setItem('selectedFTLInquiry', JSON.stringify(inquiry));
    localStorage.setItem('view', 'ftl-booking');
    window.location.reload();
  };

  const editInquiry = (inquiry) => {
    setFormData(inquiry);
    setEditingId(inquiry.id);
    setFromSearch(inquiry.from || '');
    setToSearch(inquiry.to || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteInquiry = (id) => {
    if (window.confirm('Are you sure you want to delete this inquiry?')) {
      const updated = inquiries.filter(i => i.id !== id);
      localStorage.setItem('ftlInquiries', JSON.stringify(updated));
      setInquiries(updated);
      alert('✅ Inquiry deleted!');
    }
  };

  const getCityName = (cityCode) => {
    const city = cities.find(c => c.code === cityCode || c.id?.toString() === cityCode);
    return city ? city.cityName : cityCode || 'N/A';
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id.toString() === clientId);
    return client ? (client.companyName || client.clientName) : 'N/A';
  };

  const getBranchName = (branchId) => {
    const branch = branches.find(b => b.id.toString() === branchId);
    return branch ? branch.branchName : 'N/A';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #06b6d4;
          transition: all 0.3s ease;
        }
        
        .section-card:hover {
          box-shadow: 0 4px 16px rgba(6,182,212,0.1);
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
          position: relative;
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
          box-sizing: border-box;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
        }
        
        textarea {
          resize: vertical;
          min-height: 80px;
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
        
        @media (max-width: 1024px) {
          .grid-3 {
            grid-template-columns: repeat(2, 1fr);
          }
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(6,182,212,0.3);
        }
        
        .btn-secondary {
          background: #f1f5f9;
          color: #475569;
        }
        
        .btn-secondary:hover {
          background: #e2e8f0;
        }
        
        .btn-success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-success:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        
        .btn-danger {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
        }
        
        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        }
        
        .table-container {
          overflow-x: auto;
          margin-top: 16px;
        }
        
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        
        .data-table thead {
          background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
          color: white;
        }
        
        .data-table th {
          padding: 12px 16px;
          text-align: left;
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .data-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.9rem;
          color: #475569;
        }
        
        .data-table tbody tr:hover {
          background: #f8fafc;
        }
        
        .data-table tbody tr:last-child td {
          border-bottom: none;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">FTL Inquiry Form</h1>
          <p className="text-slate-600 text-lg">Create and manage FTL inquiries</p>
        </div>

        {/* Inquiry Form */}
        <div className="section-card mb-6">
          <h2 className="section-title">
            {editingId ? 'Edit Inquiry' : 'Create New Inquiry'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="grid-2">
              <div className="input-group">
                <label>Inquiry Number</label>
                <input
                  type="text"
                  value={formData.inquiryNumber}
                  readOnly
                  style={{ background: '#f1f5f9' }}
                />
              </div>
              
              <div className="input-group">
                <label>Inquiry Date *</label>
                <input
                  type="date"
                  value={formData.inquiryDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, inquiryDate: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>Vehicle Type *</label>
                <select
                  value={formData.vehicleType}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleType: e.target.value }))}
                  required
                >
                  <option value="">-- Select Vehicle Type --</option>
                  {vehicleTypeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div className="input-group">
                <label>Weight (Tons) *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Container Type *</label>
                <select
                  value={formData.containerType}
                  onChange={(e) => setFormData(prev => ({ ...prev, containerType: e.target.value }))}
                  required
                >
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>From (Origin) *</label>
                <input
                  type="text"
                  value={fromSearch}
                  onChange={(e) => {
                    setFromSearch(e.target.value);
                    setShowFromDropdown(e.target.value.length >= 2);
                    setFromDropdownIndex(-1);
                  }}
                  onFocus={() => {
                    if (fromSearch.length >= 2) setShowFromDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowFromDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setFromDropdownIndex(prev => 
                        prev < filteredFromCities.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setFromDropdownIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && fromDropdownIndex >= 0) {
                      e.preventDefault();
                      const city = filteredFromCities[fromDropdownIndex];
                      setFormData(prev => ({ ...prev, from: city.code }));
                      setFromSearch(city.cityName);
                      setShowFromDropdown(false);
                    }
                  }}
                  placeholder="Type at least 2 characters to search..."
                  required
                />
                {showFromDropdown && filteredFromCities.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    width: '100%',
                    marginTop: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {filteredFromCities.map((city, idx) => (
                      <div
                        key={city.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, from: city.code }));
                          setFromSearch(city.cityName);
                          setShowFromDropdown(false);
                        }}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          background: idx === fromDropdownIndex ? '#eff6ff' : 'white',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {city.cityName}, {city.state}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="input-group">
                <label>To (Destination) *</label>
                <input
                  type="text"
                  value={toSearch}
                  onChange={(e) => {
                    setToSearch(e.target.value);
                    setShowToDropdown(e.target.value.length >= 2);
                    setToDropdownIndex(-1);
                  }}
                  onFocus={() => {
                    if (toSearch.length >= 2) setShowToDropdown(true);
                  }}
                  onBlur={() => setTimeout(() => setShowToDropdown(false), 200)}
                  onKeyDown={(e) => {
                    if (e.key === 'ArrowDown') {
                      e.preventDefault();
                      setToDropdownIndex(prev => 
                        prev < filteredToCities.length - 1 ? prev + 1 : prev
                      );
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      setToDropdownIndex(prev => prev > 0 ? prev - 1 : -1);
                    } else if (e.key === 'Enter' && toDropdownIndex >= 0) {
                      e.preventDefault();
                      const city = filteredToCities[toDropdownIndex];
                      setFormData(prev => ({ ...prev, to: city.code }));
                      setToSearch(city.cityName);
                      setShowToDropdown(false);
                    }
                  }}
                  placeholder="Type at least 2 characters to search..."
                  required
                />
                {showToDropdown && filteredToCities.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    zIndex: 1000,
                    background: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    width: '100%',
                    marginTop: '4px',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                  }}>
                    {filteredToCities.map((city, idx) => (
                      <div
                        key={city.id}
                        onClick={() => {
                          setFormData(prev => ({ ...prev, to: city.code }));
                          setToSearch(city.cityName);
                          setShowToDropdown(false);
                        }}
                        style={{
                          padding: '10px',
                          cursor: 'pointer',
                          background: idx === toDropdownIndex ? '#eff6ff' : 'white',
                          borderBottom: '1px solid #f1f5f9'
                        }}
                      >
                        {city.cityName}, {city.state}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid-3">
              <div className="input-group">
                <label>Freight Amount *</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.freight}
                  onChange={(e) => setFormData(prev => ({ ...prev, freight: e.target.value }))}
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Expenses</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.expenses}
                  onChange={(e) => setFormData(prev => ({ ...prev, expenses: e.target.value }))}
                />
              </div>
              
              <div className="input-group">
                <label>Client Name *</label>
                <select
                  value={formData.clientId}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    const client = clients.find(c => c.id.toString() === clientId);
                    setFormData(prev => ({
                      ...prev,
                      clientId: clientId,
                      clientName: client ? (client.companyName || client.clientName) : ''
                    }));
                  }}
                  required
                >
                  <option value="">-- Select Client --</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.code || client.clientCode} - {client.companyName || client.clientName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label>Remarks</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                rows="3"
                placeholder="Any additional notes..."
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> {editingId ? 'Update Inquiry' : 'Create Inquiry'}
              </button>
              {editingId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingId(null);
                    setFormData({
                      inquiryNumber: '',
                      inquiryDate: new Date().toISOString().split('T')[0],
                      vehicleType: '',
                      weight: '',
                      containerType: 'Open',
                      from: '',
                      to: '',
                      freight: '',
                      expenses: '',
                      clientName: '',
                      clientId: '',
                      branch: formData.branch,
                      status: 'Pending',
                      remarks: '',
                      assignedVehicle: '',
                      assignedVehicleNumber: '',
                      assignedDriver: '',
                      assignedDriverName: '',
                      assignedDriverNumber: '',
                      lrBookingId: null,
                      lrNumber: '',
                      confirmedAt: null,
                      vehicleAssignedAt: null,
                      orderConfirmedAt: null,
                      cancelledAt: null,
                      cancelledBy: null,
                      cancelledReason: ''
                    });
                    setFromSearch('');
                    setToSearch('');
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Inquiries List */}
        <div className="section-card">
          <h2 className="section-title">FTL Inquiries</h2>
          
          <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <select
              onChange={(e) => {
                const status = e.target.value;
                // Filter logic can be added here if needed
              }}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '2px solid #e2e8f0'
              }}
            >
              <option value="all">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Vehicle Assigned">Vehicle Assigned</option>
              <option value="Order Confirmed">Order Confirmed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Inquiry #</th>
                  <th>Date</th>
                  <th>Client</th>
                  <th>Vehicle Type</th>
                  <th>From → To</th>
                  <th>Weight</th>
                  <th>Freight</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan="9" style={{ textAlign: 'center', padding: '40px' }}>
                      No inquiries found. Create your first inquiry above.
                    </td>
                  </tr>
                ) : (
                  inquiries.map(inquiry => (
                    <tr key={inquiry.id}>
                      <td>{inquiry.inquiryNumber}</td>
                      <td>{inquiry.inquiryDate}</td>
                      <td>{getClientName(inquiry.clientId)}</td>
                      <td>{inquiry.vehicleType}</td>
                      <td>{getCityName(inquiry.from)} → {getCityName(inquiry.to)}</td>
                      <td>{inquiry.weight} Tons</td>
                      <td>₹{parseFloat(inquiry.freight || 0).toFixed(2)}</td>
                      <td>
                        <span style={{
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: 
                            inquiry.status === 'Order Confirmed' ? '#d1fae5' :
                            inquiry.status === 'Confirmed' || inquiry.status === 'Vehicle Assigned' ? '#dbeafe' :
                            inquiry.status === 'Cancelled' ? '#fee2e2' : '#fef3c7',
                          color:
                            inquiry.status === 'Order Confirmed' ? '#065f46' :
                            inquiry.status === 'Confirmed' || inquiry.status === 'Vehicle Assigned' ? '#1e40af' :
                            inquiry.status === 'Cancelled' ? '#991b1b' : '#92400e'
                        }}>
                          {inquiry.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {inquiry.status === 'Pending' && isOperator && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => handleConfirm(inquiry.id)}
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                <CheckCircle size={14} /> Confirm
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleCancel(inquiry.id)}
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                <XCircle size={14} /> Cancel
                              </button>
                            </>
                          )}
                          {inquiry.status === 'Confirmed' && isOperator && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleAssignVehicle(inquiry.id)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Truck size={14} /> Assign Vehicle
                            </button>
                          )}
                          {inquiry.status === 'Vehicle Assigned' && isOperator && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => handleConfirm(inquiry.id)}
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                <CheckCircle size={14} /> Confirm Order
                              </button>
                              <button
                                className="btn btn-danger"
                                onClick={() => handleCancel(inquiry.id)}
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              >
                                <XCircle size={14} /> Cancel
                              </button>
                            </>
                          )}
                          {inquiry.status === 'Order Confirmed' && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleCreateLR(inquiry.id)}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              Create LR
                            </button>
                          )}
                          <button
                            className="btn btn-secondary"
                            onClick={() => editInquiry(inquiry)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            className="btn btn-danger"
                            onClick={() => deleteInquiry(inquiry.id)}
                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

