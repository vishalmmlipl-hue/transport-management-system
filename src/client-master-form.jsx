import React, { useState, useEffect } from 'react';
import { clientsService } from './services/dataService';
import { apiService } from './utils/apiService';
import { Save, Plus, Trash2, User, Edit2, Eye, X } from 'lucide-react';

export default function ClientMasterForm() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [viewingId, setViewingId] = useState(null);
  const [showClientList, setShowClientList] = useState(true);
  const [formData, setFormData] = useState({
    clientCode: '',
    clientType: 'TBB',
    companyName: '',
    tradeName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    primaryContact: {
      name: '',
      designation: '',
      mobile: '',
      phone: '',
      email: ''
    },
    additionalContacts: [],
    gstNumber: '',
    isUnregisteredPerson: false,
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    billingDetails: {
      creditLimit: '',
      creditDays: '',
      paymentTerms: 'Net 30'
    },
    deliveryType: 'Godown', // Default delivery type for TBB clients: 'Godown' or 'Door'
    status: 'Active',
    remarks: ''
  });

  const [showAdditionalContact, setShowAdditionalContact] = useState(false);

  const normalizeClient = (c) => {
    if (!c) return c;
    return {
      ...c,
      // unify code/name across possible schemas
      code: c.code || c.clientCode || c.client_code || c.clientCode,
      clientCode: c.clientCode || c.code || c.client_code,
      companyName: c.companyName || c.clientName || c.client_name || c.clientName,
      clientName: c.clientName || c.companyName || c.client_name,
    };
  };

  // Auto-generate next Client Code (not DB id) from existing list
  const generateNextClientCode = (list) => {
    const clientsList = Array.isArray(list) ? list : [];
    // This screen is for TBB clients primarily; match existing sample codes like TBB001
    let bestPrefix = 'TBB';
    let bestNum = 0;
    let bestPad = 3;

    for (const c of clientsList) {
      const raw = (c?.clientCode || c?.code || '').toString().trim().toUpperCase();
      if (!raw) continue;

      const m = raw.match(/^([A-Z]+)(\d+)$/);
      if (m) {
        const prefix = m[1];
        const num = parseInt(m[2], 10);
        if (!Number.isNaN(num) && num >= bestNum) {
          bestPrefix = prefix;
          bestNum = num;
          bestPad = m[2].length || bestPad;
        }
      } else {
        const onlyNum = parseInt(raw, 10);
        if (!Number.isNaN(onlyNum) && onlyNum >= bestNum) {
          bestNum = onlyNum;
        }
      }
    }

    const next = bestNum + 1;
    return `${bestPrefix}${String(next).padStart(bestPad, '0')}`;
  };

  const buildEmptyFormData = (prefillClientCode) => ({
    clientCode: prefillClientCode || '',
    clientType: 'TBB',
    companyName: '',
    tradeName: '',
    address: {
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      country: 'India'
    },
    primaryContact: {
      name: '',
      designation: '',
      mobile: '',
      phone: '',
      email: ''
    },
    additionalContacts: [],
    gstNumber: '',
    isUnregisteredPerson: false,
    panNumber: '',
    bankDetails: {
      accountName: '',
      accountNumber: '',
      bankName: '',
      branch: '',
      ifscCode: ''
    },
    billingDetails: {
      creditLimit: '',
      creditDays: '',
      paymentTerms: 'Net 30'
    },
    deliveryType: 'Godown', // Default delivery type for TBB clients: 'Godown' or 'Door'
    status: 'Active',
    remarks: ''
  });

  // Load clients from API
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        const clientsData = await apiService.getClients();
        setClients((clientsData || []).map(normalizeClient));
      } catch (error) {
        console.error('Error loading clients:', error);
        // Fallback to dataService
        try {
          const fallbackData = await clientsService.getAll();
          const list = Array.isArray(fallbackData) ? fallbackData : (fallbackData?.data || []);
          setClients((list || []).map(normalizeClient));
        } catch (err) {
          console.error('Fallback also failed:', err);
          setClients([]);
        }
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  // Reset form
  const resetForm = (options = {}) => {
    const nextCode = options.clientCode || generateNextClientCode(clients);
    setFormData(buildEmptyFormData(nextCode));
    setEditingId(null);
    setViewingId(null);
    setShowAdditionalContact(false);
  };

  // Ensure Client Code is filled when opening Create form (even if clients load later)
  useEffect(() => {
    if (showClientList) return;
    if (editingId || viewingId) return;
    const current = (formData?.clientCode || '').toString().trim();
    if (current) return;
    setFormData(prev => ({ ...prev, clientCode: generateNextClientCode(clients) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClientList, editingId, viewingId, clients]);

  // Load client data into form for editing
  const handleEdit = (client) => {
    // Parse JSON fields if they're strings
    const address = typeof client.address === 'string' ? JSON.parse(client.address || '{}') : (client.address || {});
    const primaryContact = typeof client.primaryContact === 'string' ? JSON.parse(client.primaryContact || '{}') : (client.primaryContact || {});
    const additionalContacts = typeof client.additionalContacts === 'string' ? JSON.parse(client.additionalContacts || '[]') : (client.additionalContacts || []);
    const bankDetails = typeof client.bankDetails === 'string' ? JSON.parse(client.bankDetails || '{}') : (client.bankDetails || {});
    const billingDetails = typeof client.billingDetails === 'string' ? JSON.parse(client.billingDetails || '{}') : (client.billingDetails || {});

    setFormData({
      clientCode: client.clientCode || client.code || '',
      clientType: client.clientType || 'TBB',
      companyName: client.companyName || client.clientName || '',
      tradeName: client.tradeName || '',
      address: {
        line1: address.line1 || '',
        line2: address.line2 || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        country: address.country || 'India'
      },
      primaryContact: {
        name: primaryContact.name || '',
        designation: primaryContact.designation || '',
        mobile: primaryContact.mobile || '',
        phone: primaryContact.phone || '',
        email: primaryContact.email || ''
      },
      additionalContacts: additionalContacts || [],
      gstNumber: client.gstNumber || '',
      isUnregisteredPerson: client.gstNumber === 'URP' || client.isUnregisteredPerson || false,
      panNumber: client.panNumber || '',
      bankDetails: {
        accountName: bankDetails.accountName || '',
        accountNumber: bankDetails.accountNumber || '',
        bankName: bankDetails.bankName || '',
        branch: bankDetails.branch || '',
        ifscCode: bankDetails.ifscCode || ''
      },
      billingDetails: {
        creditLimit: billingDetails.creditLimit || '',
        creditDays: billingDetails.creditDays || '',
        paymentTerms: billingDetails.paymentTerms || 'Net 30'
      },
      deliveryType: client.deliveryType || 'Godown',
      status: client.status || 'Active',
      remarks: client.remarks || ''
    });
    setEditingId(client.id);
    setViewingId(null);
    setShowClientList(false);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // View client details
  const handleView = (client) => {
    setViewingId(client.id);
    setEditingId(null);
    setShowClientList(false);
  };

  // Delete client with dependency checking
  const handleDelete = async (clientId, clientName) => {
    try {
      // Check dependencies first
      const depsResult = await apiService.checkClientDependencies(clientId);
      
      if (depsResult.hasDependencies && depsResult.totalCount > 0) {
        const deps = depsResult.dependencies;
        const depsList = [
          deps.lrBookings.length > 0 && `${deps.lrBookings.length} LR Booking(s)`,
          deps.ftlLRBookings.length > 0 && `${deps.ftlLRBookings.length} FTL LR Booking(s)`,
          deps.ptlLRBookings.length > 0 && `${deps.ptlLRBookings.length} PTL LR Booking(s)`,
          deps.invoices.length > 0 && `${deps.invoices.length} Invoice(s)`,
          deps.clientRates.length > 0 && `${deps.clientRates.length} Client Rate(s)`,
          deps.payments.length > 0 && `${deps.payments.length} Payment(s)`
        ].filter(Boolean).join(', ');

        const confirmMessage = `⚠️ Client "${clientName}" has ${depsResult.totalCount} dependency(ies):\n\n${depsList}\n\nDo you want to delete this client and clear all references?\n\nThis will:\n- Remove client from all LR bookings (consignor/consignee)\n- Delete all client rates\n- Mark client as [DELETED] in invoices and payments\n\nThis action cannot be undone!`;
        
        if (!window.confirm(confirmMessage)) {
          return;
        }

        // Delete with clearing references
        const deleteResult = await apiService.deleteClientWithDependencies(clientId, true);
        
        // Refresh client list
        const clientsData = await apiService.getClients();
        setClients((clientsData || []).map(normalizeClient));
        
        // Dispatch event to refresh other forms
        window.dispatchEvent(new Event('clientDataUpdated'));
        
        alert(`✅ Client "${clientName}" deleted successfully!\n\nCleared references:\n${depsList}`);
      } else {
        // No dependencies, simple delete
        if (!window.confirm(`Are you sure you want to delete client "${clientName}"?\n\nThis action cannot be undone.`)) {
          return;
        }

        await apiService.deleteClient(clientId);
        
        // Refresh client list
        const clientsData = await apiService.getClients();
        setClients(clientsData || []);
        
        // Dispatch event to refresh other forms
        window.dispatchEvent(new Event('clientDataUpdated'));
        
        alert(`✅ Client "${clientName}" deleted successfully!`);
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('dependencies')) {
        alert(`❌ Cannot delete client: ${errorMsg}\n\nPlease clear all references first or use "Delete with References" option.`);
      } else {
        alert(`❌ Error deleting client: ${errorMsg}`);
      }
    }
  };

  // Suspend / Activate client (status update)
  const handleToggleSuspend = async (client) => {
    try {
      const currentStatus = (client.status || 'Active').toString();
      const nextStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';

      const msg =
        nextStatus === 'Suspended'
          ? `Suspend client "${client.companyName || client.code}"?\n\nClient will not be available for new selections (recommended).`
          : `Activate client "${client.companyName || client.code}"?`;

      if (!window.confirm(msg)) return;

      await apiService.updateClient(client.id, { ...client, status: nextStatus, updatedAt: new Date().toISOString() });

      // Refresh client list
      const clientsData = await apiService.getClients();
      setClients((clientsData || []).map(normalizeClient));

      window.dispatchEvent(new Event('clientDataUpdated'));
      alert(`✅ Client "${client.companyName || client.code}" is now ${nextStatus}.`);
    } catch (error) {
      console.error('Error updating client status:', error);
      alert(`❌ Error updating status: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Create new client object
    const newClient = {
      code: formData.clientCode,
      clientCode: formData.clientCode,
      companyName: formData.companyName,
      clientName: formData.companyName,
      tradeName: formData.tradeName,
      address: formData.address,
      primaryContact: formData.primaryContact,
      additionalContacts: formData.additionalContacts,
      gstNumber: formData.gstNumber,
      panNumber: formData.panNumber,
      bankDetails: formData.bankDetails,
      billingDetails: formData.billingDetails,
      clientType: formData.clientType,
      deliveryType: formData.deliveryType || 'Godown',
      status: formData.status,
      remarks: formData.remarks,
      createdAt: new Date().toISOString()
    };
    try {
      if (editingId) {
        // Get old client data to check if code/name changed
        const oldClient = clients.find(c => c.id === editingId);
        const oldClientCode = oldClient?.clientCode || oldClient?.code;
        const oldCompanyName = oldClient?.companyName;
        const newClientCode = newClient.code;
        const newCompanyName = newClient.companyName;

        // If client code or name changed, update with references
        if (oldClientCode !== newClientCode || oldCompanyName !== newCompanyName) {
          await apiService.updateClientWithReferences(editingId, newClient);
        } else {
          // Simple update if code/name didn't change
          await apiService.updateClient(editingId, newClient);
        }
        
        // Dispatch event to refresh other forms
        window.dispatchEvent(new Event('clientDataUpdated'));
        
        alert(`✅ Client "${formData.companyName}" updated successfully!${(oldClientCode !== newClientCode || oldCompanyName !== newCompanyName) ? '\n\nAll references in LR bookings, invoices, and payments have been updated.' : ''}`);
        
        // Refresh client list
        const clientsData = await apiService.getClients();
        const normalizedList = (clientsData || []).map(normalizeClient);
        setClients(normalizedList);
        resetForm({ clientCode: generateNextClientCode(normalizedList) });
        setShowClientList(true);
      } else {
        // Create new client
        try {
          const created = await apiService.createClient(newClient);
          console.log('Client API response:', created);
        } catch (primaryError) {
          console.warn('apiService create failed, using clientsService fallback:', primaryError);
          const clientsResp = await clientsService.create(newClient);
          console.log('ClientsService API response:', clientsResp);
        }
        window.dispatchEvent(new Event('clientDataUpdated'));
        alert(`✅ Client "${formData.companyName}" created successfully!\n\nClient Code: ${newClient.code}\n\nThis client is now available for selection in LR booking forms.`);
        
        // Refresh client list
        const clientsData = await apiService.getClients();
        const normalizedList = (clientsData || []).map(normalizeClient);
        setClients(normalizedList);
        resetForm({ clientCode: generateNextClientCode(normalizedList) });
        setShowClientList(true);
      }
    } catch (err) {
      alert('❌ Error saving client: ' + err.message);
      console.error('Client save error:', err);
    }
  };

  const addAdditionalContact = () => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: [
        ...prev.additionalContacts,
        { name: '', designation: '', mobile: '', email: '' }
      ]
    }));
    setShowAdditionalContact(true);
  };

  const removeAdditionalContact = (index) => {
    setFormData(prev => ({
      ...prev,
      additionalContacts: prev.additionalContacts.filter((_, i) => i !== index)
    }));
  };

  const updateAdditionalContact = (index, field, value) => {
    const newContacts = [...formData.additionalContacts];
    newContacts[index][field] = value;
    setFormData(prev => ({ ...prev, additionalContacts: newContacts }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
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
          border-left: 4px solid #6366f1;
          transition: all 0.3s ease;
        }
        
        .form-section:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.1);
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
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
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
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.3);
        }
        
        .btn-secondary {
          background: white;
          color: #6366f1;
          border: 2px solid #6366f1;
        }
        
        .btn-secondary:hover {
          background: #6366f1;
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
          background: #6366f1;
          color: white;
          border-color: #6366f1;
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
        
        .contact-card {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          margin-bottom: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-active {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-inactive {
          background: #fee2e2;
          color: #991b1b;
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
            Client Master
          </h1>
          <p className="text-slate-600 text-lg">TBB Client Management System</p>
        </div>

        {/* Client List View */}
        {showClientList && !editingId && !viewingId && (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Clients List ({clients.length})
              </h2>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  resetForm();
                  setShowClientList(false);
                }}
              >
                <Plus size={16} /> Add New Client
              </button>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                Loading clients...
              </div>
            ) : clients.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                <p>No clients found. Click "Add New Client" to create one.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>ID</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Code</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Company Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Type</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Contact</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Status</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clients.map((client) => {
                      const primaryContact = typeof client.primaryContact === 'string' 
                        ? JSON.parse(client.primaryContact || '{}') 
                        : (client.primaryContact || {});
                      const contactMobile =
                        primaryContact.mobile ||
                        primaryContact.phone ||
                        client.mobile ||
                        client.phone ||
                        'N/A';
                      return (
                        <tr key={client.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600, color: '#475569' }}>
                            {client.id ?? '—'}
                          </td>
                          <td style={{ padding: '12px', fontFamily: 'monospace', fontWeight: 600 }}>
                            {client.clientCode || client.code || 'N/A'}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 500 }}>
                            {client.companyName || client.clientName || 'N/A'}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              background: client.clientType === 'TBB' ? '#dbeafe' : '#f3f4f6',
                              color: client.clientType === 'TBB' ? '#1e40af' : '#374151'
                            }}>
                              {client.clientType || 'TBB'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', fontSize: '0.9rem', color: '#64748b' }}>
                            {contactMobile}
                          </td>
                          <td style={{ padding: '12px' }}>
                            <span className={`status-badge ${client.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                              {client.status || 'Active'}
                            </span>
                          </td>
                          <td style={{ padding: '12px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleView(client)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                title="View Details"
                              >
                                <Eye size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleEdit(client)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                title="Edit"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => handleToggleSuspend(client)}
                                style={{
                                  padding: '6px 12px',
                                  fontSize: '0.85rem',
                                  background: (client.status || 'Active') === 'Active' ? '#fef3c7' : '#dcfce7',
                                  borderColor: (client.status || 'Active') === 'Active' ? '#f59e0b' : '#22c55e',
                                  color: (client.status || 'Active') === 'Active' ? '#92400e' : '#166534'
                                }}
                                title={(client.status || 'Active') === 'Active' ? 'Suspend' : 'Activate'}
                              >
                                {(client.status || 'Active') === 'Active' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                type="button"
                                className="btn btn-danger"
                                onClick={() => handleDelete(client.id, client.companyName || client.code)}
                                style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                title="Delete"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* View Client Modal */}
        {viewingId && (
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Client Details
              </h2>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setViewingId(null);
                  setShowClientList(true);
                }}
              >
                <X size={16} /> Close
              </button>
            </div>
            {(() => {
              const client = clients.find(c => c.id === viewingId);
              if (!client) return <div>Client not found</div>;
              
              const address = typeof client.address === 'string' ? JSON.parse(client.address || '{}') : (client.address || {});
              const primaryContact = typeof client.primaryContact === 'string' ? JSON.parse(client.primaryContact || '{}') : (client.primaryContact || {});
              const billingDetails = typeof client.billingDetails === 'string' ? JSON.parse(client.billingDetails || '{}') : (client.billingDetails || {});
              
              return (
                <div>
                  <div className="grid-4" style={{ marginBottom: '20px' }}>
                    <div>
                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Client ID:</strong>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px', fontFamily: 'monospace' }}>
                        {client.id ?? '—'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Client Code:</strong>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>
                        {client.clientCode || client.code || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Company Name:</strong>
                      <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: '4px' }}>
                        {client.companyName || client.clientName || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b', fontSize: '0.875rem' }}>Status:</strong>
                      <div style={{ marginTop: '4px' }}>
                        <span className={`status-badge ${client.status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                          {client.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <strong style={{ color: '#1e293b', fontSize: '1rem' }}>Address:</strong>
                    <div style={{ marginTop: '8px', color: '#475569' }}>
                      {address.line1 && <div>{address.line1}</div>}
                      {address.line2 && <div>{address.line2}</div>}
                      <div>{[address.city, address.state, address.pincode].filter(Boolean).join(', ')}</div>
                      {address.country && <div>{address.country}</div>}
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px' }}>
                    <strong style={{ color: '#1e293b', fontSize: '1rem' }}>Primary Contact:</strong>
                    <div style={{ marginTop: '8px', color: '#475569' }}>
                      <div>{primaryContact.name || 'N/A'}</div>
                      {primaryContact.designation && <div style={{ fontSize: '0.9rem', color: '#64748b' }}>{primaryContact.designation}</div>}
                      <div>{primaryContact.mobile || primaryContact.phone || 'N/A'}</div>
                      <div>{primaryContact.email || 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '20px', display: 'flex', gap: '20px' }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleEdit(client)}
                    >
                      <Edit2 size={16} /> Edit Client
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => {
                        setViewingId(null);
                        setShowClientList(true);
                      }}
                    >
                      Back to List
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Form for Create/Edit */}
        {(!showClientList || editingId) && (
          <form onSubmit={handleSubmit}>
            {editingId && (
              <div style={{
                background: '#fef3c7',
                border: '2px solid #fbbf24',
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ color: '#92400e', fontWeight: 600 }}>
                  ✏️ Editing Client: {formData.companyName || 'N/A'}
                </span>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    resetForm();
                    setShowClientList(true);
                  }}
                  style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                >
                  <X size={14} /> Cancel
                </button>
              </div>
            )}
          {/* Basic Information */}
          <div className="form-section">
            <h2 className="section-title">Basic Information</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Client Code</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.clientCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientCode: e.target.value.toUpperCase() }))}
                  placeholder="AUTO-GENERATED"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
              
              <div className="input-group">
                <label>Client Type</label>
                <select
                  value={formData.clientType}
                  onChange={(e) => setFormData(prev => ({ ...prev, clientType: e.target.value }))}
                  required
                >
                  <option value="TBB">TBB (To Be Billed) - Sundry Creditor</option>
                  <option value="Cash">Cash</option>
                  <option value="Credit">Credit - Sundry Creditor</option>
                </select>
                {(formData.clientType === 'TBB' || formData.clientType === 'Credit') && (
                  <div style={{
                    marginTop: '8px',
                    padding: '8px 12px',
                    background: '#fef3c7',
                    border: '1px solid #fbbf24',
                    borderRadius: '6px',
                    fontSize: '0.875rem',
                    color: '#92400e',
                    fontWeight: 600
                  }}>
                    📋 Sundry Creditor
                  </div>
                )}
              </div>
              
              <div className="input-group">
                <label>Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="input-group">
                <label>Company Name *</label>
                <input
                  type="text"
                  value={formData.companyName}
                  onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                  placeholder="Enter registered company name"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Trade Name / DBA</label>
                <input
                  type="text"
                  value={formData.tradeName}
                  onChange={(e) => setFormData(prev => ({ ...prev, tradeName: e.target.value }))}
                  placeholder="Doing Business As (Optional)"
                />
              </div>
            </div>
          </div>

          {/* Address Details */}
          <div className="form-section">
            <h2 className="section-title">Address Details</h2>
            
            <div className="input-group">
              <label>Address Line 1 *</label>
              <input
                type="text"
                value={formData.address.line1}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, line1: e.target.value }
                }))}
                placeholder="Building/Flat No., Street Name"
                required
              />
            </div>
            
            <div className="input-group">
              <label>Address Line 2</label>
              <input
                type="text"
                value={formData.address.line2}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  address: { ...prev.address, line2: e.target.value }
                }))}
                placeholder="Locality, Landmark"
              />
            </div>
            
            <div className="grid-4">
              <div className="input-group">
                <label>City *</label>
                <input
                  type="text"
                  value={formData.address.city}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, city: e.target.value }
                  }))}
                  placeholder="City"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>State *</label>
                <input
                  type="text"
                  value={formData.address.state}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, state: e.target.value }
                  }))}
                  placeholder="State"
                  required
                />
              </div>
              
              <div className="input-group">
                <label>Pincode</label>
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, pincode: e.target.value }
                  }))}
                  placeholder="6 digits"
                  maxLength="6"
                  pattern="[0-9]{6}"
                />
              </div>
              
              <div className="input-group">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.address.country}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    address: { ...prev.address, country: e.target.value }
                  }))}
                  required
                />
              </div>
            </div>
          </div>

          {/* Primary Contact Person */}
          <div className="form-section">
            <h2 className="section-title">Primary Contact Person</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>Contact Person Name</label>
                <input
                  type="text"
                  value={formData.primaryContact.name}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, name: e.target.value }
                  }))}
                  placeholder="Full Name"
                />
              </div>
              
              <div className="input-group">
                <label>Designation</label>
                <input
                  type="text"
                  value={formData.primaryContact.designation}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, designation: e.target.value }
                  }))}
                  placeholder="Manager, Director, etc."
                />
              </div>
            </div>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Mobile Number</label>
                <input
                  type="tel"
                  value={formData.primaryContact.mobile}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, mobile: e.target.value }
                  }))}
                  placeholder="10 digits"
                  maxLength="10"
                  pattern="[0-9]{10}"
                />
              </div>
              
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={formData.primaryContact.phone}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, phone: e.target.value }
                  }))}
                  placeholder="Landline with STD code"
                />
              </div>
              
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={formData.primaryContact.email}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    primaryContact: { ...prev.primaryContact, email: e.target.value }
                  }))}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Additional Contacts */}
          <div className="form-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 className="section-title" style={{ marginBottom: 0, paddingBottom: 0, border: 'none' }}>
                Additional Contacts
              </h2>
              <button type="button" className="btn btn-secondary" onClick={addAdditionalContact}>
                <Plus size={16} /> Add Contact
              </button>
            </div>
            
            {formData.additionalContacts.length === 0 ? (
              <p style={{ color: '#64748b', fontStyle: 'italic' }}>No additional contacts added</p>
            ) : (
              formData.additionalContacts.map((contact, index) => (
                <div key={index} className="contact-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <h4 style={{ margin: 0, color: '#475569', fontSize: '0.95rem', fontWeight: 600 }}>
                      <User size={16} style={{ display: 'inline', marginRight: '6px' }} />
                      Contact {index + 1}
                    </h4>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => removeAdditionalContact(index)}
                      style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                  
                  <div className="grid-2" style={{ marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Contact Name"
                      value={contact.name}
                      onChange={(e) => updateAdditionalContact(index, 'name', e.target.value)}
                    />
                    <input
                      type="text"
                      placeholder="Designation"
                      value={contact.designation}
                      onChange={(e) => updateAdditionalContact(index, 'designation', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid-2">
                    <input
                      type="tel"
                      placeholder="Mobile Number"
                      value={contact.mobile}
                      onChange={(e) => updateAdditionalContact(index, 'mobile', e.target.value)}
                      maxLength="10"
                    />
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={contact.email}
                      onChange={(e) => updateAdditionalContact(index, 'email', e.target.value)}
                    />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Tax & Legal Information */}
          <div className="form-section">
            <h2 className="section-title">Tax & Legal Information</h2>
            
            <div className="grid-2">
              <div className="input-group">
                <label>GST Number *</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    id="isUnregisteredPerson"
                    checked={formData.isUnregisteredPerson}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        isUnregisteredPerson: e.target.checked,
                        gstNumber: e.target.checked ? 'URP' : ''
                      }));
                    }}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="isUnregisteredPerson" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#475569', margin: 0 }}>
                    Unregistered Person (URP)
                  </label>
                </div>
                <input
                  type="text"
                  className="mono"
                  value={formData.gstNumber}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    // Allow URP or regular GST format
                    if (value === 'URP' || value.startsWith('URP')) {
                      setFormData(prev => ({ ...prev, gstNumber: 'URP', isUnregisteredPerson: true }));
                    } else {
                      setFormData(prev => ({ ...prev, gstNumber: value, isUnregisteredPerson: false }));
                    }
                  }}
                  placeholder={formData.isUnregisteredPerson ? "URP" : "15 characters or URP"}
                  maxLength={formData.isUnregisteredPerson ? 3 : 15}
                  pattern={formData.isUnregisteredPerson ? undefined : "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}"}
                  style={{ textTransform: 'uppercase' }}
                  required
                  readOnly={formData.isUnregisteredPerson}
                />
              </div>
              
              <div className="input-group">
                <label>PAN Number</label>
                <input
                  type="text"
                  className="mono"
                  value={formData.panNumber}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    panNumber: e.target.value.toUpperCase() 
                  }))}
                  placeholder="10 characters"
                  maxLength="10"
                  pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                  style={{ textTransform: 'uppercase' }}
                />
              </div>
            </div>
          </div>

          {/* Billing & Credit Details */}
          <div className="form-section">
            <h2 className="section-title">Billing & Credit Details</h2>
            
            <div className="grid-3">
              <div className="input-group">
                <label>Credit Limit (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.billingDetails.creditLimit}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, creditLimit: e.target.value }
                  }))}
                  placeholder="Maximum credit allowed"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Credit Days</label>
                <input
                  type="number"
                  value={formData.billingDetails.creditDays}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, creditDays: e.target.value }
                  }))}
                  placeholder="Number of days"
                  min="0"
                />
              </div>
              
              <div className="input-group">
                <label>Payment Terms</label>
                <select
                  value={formData.billingDetails.paymentTerms}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    billingDetails: { ...prev.billingDetails, paymentTerms: e.target.value }
                  }))}
                >
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 15">Net 15 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 45">Net 45 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                  <option value="Net 90">Net 90 Days</option>
                  <option value="COD">Cash on Delivery</option>
                  <option value="Advance">Advance Payment</option>
                </select>
              </div>
            </div>
            
            {/* Delivery Type - Only for TBB clients */}
            {(formData.clientType === 'TBB') && (
              <div className="input-group" style={{ marginTop: '16px' }}>
                <label>Default Delivery Type *</label>
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
                <small style={{ 
                  display: 'block', 
                  marginTop: '4px', 
                  color: '#64748b', 
                  fontSize: '0.75rem' 
                }}>
                  This will be the default delivery type when booking LRs for this client. Can be changed per LR.
                </small>
              </div>
            )}
          </div>

          {/* Remarks */}
          <div className="form-section">
            <h2 className="section-title">Remarks / Notes</h2>
            
            <div className="input-group">
              <label>Additional Information</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Any special instructions, preferences, or notes about this client..."
                rows="4"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div style={{ textAlign: 'center', marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
              <Save size={20} /> {editingId ? 'Update Client' : 'Save Client Master'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  resetForm();
                  setShowClientList(true);
                }}
                style={{ fontSize: '1.1rem', padding: '14px 40px' }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
}
