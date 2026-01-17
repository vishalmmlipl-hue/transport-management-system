import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';

export default function FTLInquiryReport() {
  const [inquiries, setInquiries] = useState([]);
  const [branches, setBranches] = useState([]);
  const [clients, setClients] = useState([]);
  const [cities, setCities] = useState([]);
  const [, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setInquiries(JSON.parse(localStorage.getItem('ftlInquiries') || '[]'));
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]').filter(b => b.status === 'Active'));
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const tbbClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    setClients([...allClients, ...tbbClients].filter(c => c.status === 'Active'));
    setCities(JSON.parse(localStorage.getItem('cities') || '[]').filter(c => c.status === 'Active'));
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    // Check if admin
    const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const systemUser = systemUsers.find(u => u.username === user?.username);
    const userRole = systemUser?.userRole || user?.role || '';
    setIsAdmin(userRole === 'Admin' || userRole === 'admin');
    
    // Set branch for filtering
    if (!isAdmin) {
      let userBranchId = systemUser?.branch || user?.branch;
      if (userBranchId) {
        const branch = JSON.parse(localStorage.getItem('branches') || '[]').find(b => 
          b.id.toString() === userBranchId.toString()
        );
        if (branch) {
          setSelectedBranch(branch);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (isAdmin) {
      const checkBranchChange = () => {
        const adminBranchId = localStorage.getItem('adminSelectedBranch');
        if (adminBranchId && adminBranchId !== 'all') {
          const branch = branches.find(b => b.id.toString() === adminBranchId);
          if (branch && (!selectedBranch || selectedBranch.id.toString() !== branch.id.toString())) {
            setSelectedBranch(branch);
          }
        } else if (selectedBranch) {
          setSelectedBranch(null);
        }
      };
      const interval = setInterval(checkBranchChange, 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, branches, selectedBranch]);

  const getCityName = (cityCode) => {
    const city = cities.find(c => c.code === cityCode || c.id?.toString() === cityCode);
    return city ? city.cityName : cityCode || 'N/A';
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id.toString() === clientId);
    return client ? (client.companyName || client.clientName) : 'N/A';
  };

  const filteredInquiries = inquiries.filter(inq => {
    // Date filter
    const dateMatch = inq.inquiryDate >= dateRange.from && inq.inquiryDate <= dateRange.to;
    if (!dateMatch) return false;
    
    // Branch filter
    if (selectedBranch) {
      if (inq.branch !== selectedBranch.id.toString()) return false;
    }
    
    // Status filter
    if (filterStatus !== 'all') {
      if (inq.status !== filterStatus) return false;
    }
    
    return true;
  });

  const generateReport = () => {
    const branchName = selectedBranch ? selectedBranch.branchName : 'All_Branches';
    const dateStr = `${dateRange.from}_to_${dateRange.to}`;
    const filename = `FTL_Inquiry_Report_${branchName}_${dateStr}.csv`;
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Inquiry Number', 'Inquiry Date', 'Client Name', 'Vehicle Type', 'Weight (Tons)',
      'Container Type', 'From', 'To', 'Freight', 'Expenses', 'Status',
      'Vehicle Assigned', 'Driver Assigned', 'LR Number', 'Remarks'
    ];

    const rows = filteredInquiries.map(inq => [
      inq.inquiryNumber || '',
      inq.inquiryDate || '',
      getClientName(inq.clientId),
      inq.vehicleType || '',
      inq.weight || '0',
      inq.containerType || '',
      getCityName(inq.from),
      getCityName(inq.to),
      inq.freight || '0',
      inq.expenses || '0',
      inq.status || 'Pending',
      inq.assignedVehicleNumber || 'N/A',
      inq.assignedDriverName || 'N/A',
      inq.lrNumber || 'N/A',
      inq.remarks || ''
    ]);

    // Summary
    const summary = {
      total: filteredInquiries.length,
      pending: filteredInquiries.filter(i => i.status === 'Pending').length,
      confirmed: filteredInquiries.filter(i => i.status === 'Confirmed').length,
      vehicleAssigned: filteredInquiries.filter(i => i.status === 'Vehicle Assigned').length,
      orderConfirmed: filteredInquiries.filter(i => i.status === 'Order Confirmed').length,
      cancelled: filteredInquiries.filter(i => i.status === 'Cancelled').length,
      totalFreight: filteredInquiries.reduce((sum, i) => sum + (parseFloat(i.freight) || 0), 0)
    };

    const summaryRows = [
      [],
      ['SUMMARY'],
      ['Total Inquiries:', summary.total],
      ['Pending:', summary.pending],
      ['Confirmed:', summary.confirmed],
      ['Vehicle Assigned:', summary.vehicleAssigned],
      ['Order Confirmed:', summary.orderConfirmed],
      ['Cancelled:', summary.cancelled],
      ['Total Freight:', `₹${summary.totalFreight.toFixed(2)}`]
    ];

    const csvContent = [
      [headers.map(escapeCSV).join(',')],
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...summaryRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Report "${filename}" generated successfully!`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
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
        }
        
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 4px;
          letter-spacing: 0.01em;
        }
        
        input, select, textarea {
          width: 100%;
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          background: white;
          box-sizing: border-box;
        }
        
        input:focus, select:focus, textarea:focus {
          outline: none;
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
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
        
        .mb-6 {
          margin-bottom: 24px;
        }
      `}</style>
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">FTL Inquiry Report</h1>
          <p className="text-slate-600 text-lg">View and export FTL inquiry data</p>
        </div>

        {/* Filters */}
        <div className="section-card mb-6">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            {isAdmin && (
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                  Branch
                </label>
                <select
                  value={selectedBranch ? selectedBranch.id.toString() : 'all'}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setSelectedBranch(null);
                    } else {
                      const branch = branches.find(b => b.id.toString() === e.target.value);
                      setSelectedBranch(branch || null);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '0.9rem',
                    minWidth: '200px'
                  }}
                >
                  <option value="all">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem',
                  minWidth: '150px'
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
            
            <button
              onClick={generateReport}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Download size={18} />
              Generate Report
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid-4 mb-6">
          <div className="section-card">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#3b82f6' }}>
              {filteredInquiries.length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Total Inquiries
            </div>
          </div>
          
          <div className="section-card">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
              {filteredInquiries.filter(i => i.status === 'Order Confirmed').length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Order Confirmed
            </div>
          </div>
          
          <div className="section-card">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#f59e0b' }}>
              {filteredInquiries.filter(i => i.status === 'Pending' || i.status === 'Confirmed' || i.status === 'Vehicle Assigned').length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              In Progress
            </div>
          </div>
          
          <div className="section-card">
            <div style={{ fontSize: '2rem', fontWeight: 700, color: '#ef4444' }}>
              {filteredInquiries.filter(i => i.status === 'Cancelled').length}
            </div>
            <div style={{ fontSize: '0.9rem', color: '#64748b', marginTop: '4px' }}>
              Cancelled
            </div>
          </div>
        </div>

        {/* Inquiries Table */}
        <div className="section-card">
          <h2 className="section-title">FTL Inquiries</h2>
          
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
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>LR #</th>
                </tr>
              </thead>
              <tbody>
                {filteredInquiries.length === 0 ? (
                  <tr>
                    <td colSpan="11" style={{ textAlign: 'center', padding: '40px' }}>
                      No inquiries found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredInquiries.map(inquiry => (
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
                      <td>{inquiry.assignedVehicleNumber || 'N/A'}</td>
                      <td>{inquiry.assignedDriverName || 'N/A'}</td>
                      <td>{inquiry.lrNumber || 'N/A'}</td>
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

