import React, { useEffect, useMemo, useState } from 'react';
import { Save, Plus, Trash2, Wrench, Upload, Download, Search } from 'lucide-react';

export default function VehicleMaintenanceForm() {
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [branchAccounts, setBranchAccounts] = useState([]);
  const [vendors, setVendors] = useState([]); // Other Vendor master (parts suppliers)
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({
    vehicleNumber: '',
    maintenanceDate: new Date().toISOString().split('T')[0],
    maintenanceType: '',
    workshopName: '',
    driverName: '',
    // Parts supplier (auto from Other Vendor master or manual)
    partsSupplierMode: 'select', // select | manual
    partsSupplierVendorId: '',
    partsSupplierVendorName: '',
    parts: [{ partName: '', partNumber: '', price: '' }],
    labourCharges: '',
    remarks: '',
    expenseTypeId: '',
    accountId: '',
    // optional accounting posting (only if branch chosen)
    paidFromBranch: '',
    paymentMode: 'Cash', // Cash | UPI | Bank | Credit
    paymentAccountId: '', // branchAccounts.id (required for Cash/UPI/Bank)
    creditDueDate: '',
    // bill
    billName: '',
    billType: '',
    billData: ''
  });

  const totalPartsCost = useMemo(() => {
    return (form.parts || []).reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0);
  }, [form.parts]);

  const totalCost = useMemo(() => {
    return totalPartsCost + (parseFloat(form.labourCharges) || 0);
  }, [totalPartsCost, form.labourCharges]);

  const selectedExpenseType = useMemo(() => {
    const et = (expenseTypes || []).find(x => String(x.id) === String(form.expenseTypeId));
    return et || null;
  }, [expenseTypes, form.expenseTypeId]);

  const selectedAccount = useMemo(() => {
    const acc = (accounts || []).find(a => String(a.id) === String(form.accountId));
    return acc || null;
  }, [accounts, form.accountId]);

  const parseMaybeJson = (v) => {
    if (!v) return null;
    if (typeof v === 'object') return v;
    if (typeof v !== 'string') return null;
    try {
      return JSON.parse(v);
    } catch {
      return null;
    }
  };

  const loadAll = async () => {
    const syncService = (await import('./utils/sync-service')).default;
    const [vehRes, drvRes, expRes, accRes, maintRes, brRes, baRes, ovRes] = await Promise.all([
      syncService.load('vehicles'),
      syncService.load('drivers'),
      syncService.load('expenseTypes'),
      syncService.load('accounts'),
      syncService.load('vehicleMaintenance'),
      syncService.load('branches'),
      syncService.load('branchAccounts'),
      syncService.load('otherVendors'),
    ]);

    const vehiclesArr = Array.isArray(vehRes) ? vehRes : (vehRes?.data || []);
    const driversArr = Array.isArray(drvRes) ? drvRes : (drvRes?.data || []);
    const expenseArr = Array.isArray(expRes) ? expRes : (expRes?.data || []);
    const accountsArr = Array.isArray(accRes) ? accRes : (accRes?.data || []);
    const maintArr = Array.isArray(maintRes) ? maintRes : (maintRes?.data || []);
    const branchesArr = Array.isArray(brRes) ? brRes : (brRes?.data || []);
    const branchAccountsArr = Array.isArray(baRes) ? baRes : (baRes?.data || []);
    const otherVendorsArr = Array.isArray(ovRes) ? ovRes : (ovRes?.data || []);

    setVehicles(vehiclesArr.filter(v => !v.status || v.status === 'Active'));
    setDrivers(driversArr.filter(d => !d.status || d.status === 'Active'));
    setExpenseTypes(expenseArr.filter(e => !e.status || e.status === 'Active'));
    setAccounts(
      accountsArr
        .map(a => {
          const data = parseMaybeJson(a?.data) || {};
          return { ...a, ...data, data: a?.data };
        })
        .filter(a => !a.status || a.status === 'Active')
    );
    setRecords(
      (maintArr || []).map(r => {
        const data = parseMaybeJson(r.data) || {};
        const parts = parseMaybeJson(r.parts);
        return { ...r, ...data, parts: Array.isArray(parts) ? parts : (data.parts || []) };
      })
    );

    // Branches used only for optional expense posting
    localStorage.setItem('branches', JSON.stringify(branchesArr || []));
    setBranchAccounts((branchAccountsArr || []).filter(a => !a.status || a.status === 'Active'));
    localStorage.setItem('branchAccounts', JSON.stringify((branchAccountsArr || []).filter(a => !a.status || a.status === 'Active')));

    // Vendor master
    setVendors((otherVendorsArr || []).filter(v => !v.status || v.status === 'Active'));
    localStorage.setItem('otherVendors', JSON.stringify((otherVendorsArr || []).filter(v => !v.status || v.status === 'Active')));
  };

  useEffect(() => {
    loadAll().catch(err => {
      console.error('VehicleMaintenance load error:', err);
      // fallback (keep usable)
      setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]'));
      setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]'));
      setExpenseTypes(JSON.parse(localStorage.getItem('expenseTypes') || '[]'));
      setAccounts(JSON.parse(localStorage.getItem('accountMaster') || '[]'));
      setRecords(JSON.parse(localStorage.getItem('vehicleMaintenance') || '[]'));
    });

    const onSync = () => loadAll().catch(() => {});
    window.addEventListener('dataSyncedFromServer', onSync);
    window.addEventListener('expenseTypesUpdated', onSync);
    return () => {
      window.removeEventListener('dataSyncedFromServer', onSync);
      window.removeEventListener('expenseTypesUpdated', onSync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-map accountId when expenseType is selected (from Expense Master)
  useEffect(() => {
    if (!selectedExpenseType) return;
    const nextAccountId = selectedExpenseType.accountId || selectedExpenseType.expenseHead || '';
    if (nextAccountId && String(nextAccountId) !== String(form.accountId)) {
      setForm(prev => ({ ...prev, accountId: nextAccountId }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.expenseTypeId]);

  // Default expense type to "Vehicle Maintenance" if present
  useEffect(() => {
    if (form.expenseTypeId) return;
    const vm = (expenseTypes || []).find(et => String(et.expenseType || '').toLowerCase().includes('vehicle') && String(et.expenseType || '').toLowerCase().includes('maintenance'));
    if (vm?.id) {
      setForm(prev => ({ ...prev, expenseTypeId: String(vm.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expenseTypes]);

  // Auto-pick the vehicle ledger account when vehicle changes (created by Vehicle Master)
  useEffect(() => {
    const vehicleNo = String(form.vehicleNumber || '').trim().toUpperCase();
    if (!vehicleNo) return;
    const sanitized = vehicleNo.replace(/[^A-Z0-9]/g, '');
    const expectedCode = `VM-${sanitized}`;
    const ledger = (accounts || []).find(a => String(a.accountCode || '').toUpperCase() === expectedCode)
      || (accounts || []).find(a => String(a.linkedEntityType || '').toLowerCase() === 'vehicle' && String(a.linkedVehicleNumber || '').toUpperCase() === vehicleNo);
    if (ledger?.id && (!form.accountId || String(form.accountId) !== String(ledger.id))) {
      setForm(prev => ({ ...prev, accountId: String(ledger.id) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.vehicleNumber, accounts]);

  const setPart = (idx, patch) => {
    setForm(prev => {
      const next = [...(prev.parts || [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, parts: next };
    });
  };

  const addPartRow = () => setForm(prev => ({ ...prev, parts: [...(prev.parts || []), { partName: '', partNumber: '', price: '' }] }));
  const removePartRow = (idx) => setForm(prev => ({ ...prev, parts: (prev.parts || []).filter((_, i) => i !== idx) }));

  const handleBillUpload = async (file) => {
    if (!file) return;
    // Store as base64 data URL
    const reader = new FileReader();
    const p = new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });
    reader.readAsDataURL(file);
    const dataUrl = await p;
    setForm(prev => ({
      ...prev,
      billName: file.name,
      billType: file.type || '',
      billData: String(dataUrl || '')
    }));
  };

  const clearForm = () => {
    setForm(prev => ({
      vehicleNumber: '',
      maintenanceDate: new Date().toISOString().split('T')[0],
      maintenanceType: '',
      workshopName: '',
      driverName: '',
      partsSupplierMode: 'select',
      partsSupplierVendorId: '',
      partsSupplierVendorName: '',
      parts: [{ partName: '', partNumber: '', price: '' }],
      labourCharges: '',
      remarks: '',
      expenseTypeId: prev.expenseTypeId || '',
      accountId: prev.accountId || '',
      paidFromBranch: '',
      paymentMode: 'Cash',
      paymentAccountId: '',
      creditDueDate: '',
      billName: '',
      billType: '',
      billData: ''
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.vehicleNumber) {
      alert('⚠️ Vehicle Number is required');
      return;
    }
    if (!form.maintenanceDate) {
      alert('⚠️ Maintenance Date is required');
      return;
    }

    const paymentMode = String(form.paymentMode || 'Cash');
    const isCredit = paymentMode === 'Credit';
    if (!isCredit) {
      if (!form.paidFromBranch) {
        alert('⚠️ Paid From Branch is required for Cash/UPI/Bank payments');
        return;
      }
      if (!form.paymentAccountId) {
        alert('⚠️ Payment Account is required for Cash/UPI/Bank payments');
        return;
      }
    }

    const supplierName =
      form.partsSupplierMode === 'manual'
        ? String(form.partsSupplierVendorName || '').trim()
        : (() => {
            const v = (vendors || []).find(x => String(x.id) === String(form.partsSupplierVendorId));
            return (v?.vendorName || v?.tradeName || v?.companyName || '').trim();
          })();

    if (isCredit && !supplierName) {
      alert('⚠️ For Credit purchases, Parts Supplier Vendor name is required');
      return;
    }

    const syncService = (await import('./utils/sync-service')).default;
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

    const payload = {
      vehicleNumber: form.vehicleNumber,
      maintenanceDate: form.maintenanceDate,
      maintenanceType: form.maintenanceType || '',
      workshopName: form.workshopName || '',
      driverName: form.driverName || '',
      partsSupplierVendorId: form.partsSupplierMode === 'select' ? (form.partsSupplierVendorId || '') : '',
      partsSupplierVendorName: supplierName || '',
      parts: JSON.stringify((form.parts || []).filter(p => p.partName || p.partNumber || p.price)),
      labourCharges: String(form.labourCharges || ''),
      totalCost: String(totalCost.toFixed(2)),
      expenseTypeId: form.expenseTypeId || '',
      expenseType: selectedExpenseType?.expenseType || '',
      accountId: form.accountId || '',
      remarks: form.remarks || '',
      billName: form.billName || '',
      billType: form.billType || '',
      billData: form.billData || '',
      status: 'Active',
      updatedAt: new Date().toISOString(),
      data: {
        createdBy: currentUser?.username || '',
        expenseHeadName: selectedAccount?.accountName || '',
        paymentMode: paymentMode,
        paidFromBranch: form.paidFromBranch || '',
        paymentAccountId: form.paymentAccountId || '',
        creditDueDate: form.creditDueDate || '',
        supplierName: supplierName || '',
      }
    };

    const res = await syncService.save('vehicleMaintenance', payload);
    if (res && res.success === false) {
      alert(`❌ Save failed: ${res.error || 'Unknown error'}`);
      return;
    }

    // Create a Branch Expense entry ONLY for Cash/UPI/Bank (Credit does not hit Day Book)
    if (!isCredit && form.paidFromBranch && form.paymentAccountId && totalCost > 0 && (selectedExpenseType?.expenseType || '').trim()) {
      try {
        const branches = JSON.parse(localStorage.getItem('branches') || '[]');
        const b = branches.find(x => String(x.id) === String(form.paidFromBranch));
        const branchName = b?.branchName || '';
        const payAcc = (branchAccounts || []).find(a => String(a.id) === String(form.paymentAccountId));
        const payAccName = payAcc?.accountName || 'N/A';
        const payAccType = payAcc?.accountType || 'N/A';
        const branchExpense = {
          expenseNumber: `VM${Date.now()}`,
          expenseDate: form.maintenanceDate,
          branch: String(form.paidFromBranch),
          branchName,
          expenseCategory: selectedExpenseType?.category || 'Operating',
          expenseType: selectedExpenseType?.expenseType || 'Vehicle Maintenance',
          amount: String(totalCost.toFixed(2)),
          gstAmount: '0',
          totalAmount: String(totalCost.toFixed(2)),
          paymentMode: paymentMode,
          account: String(form.paymentAccountId || ''),
          accountName: payAccName,
          accountType: payAccType,
          paidTo: supplierName || form.workshopName || '',
          description: `Vehicle Maintenance - ${form.vehicleNumber}${form.maintenanceType ? ` - ${form.maintenanceType}` : ''}${form.workshopName ? ` - ${form.workshopName}` : ''}`,
          status: 'Active',
          data: {
            source: 'VehicleMaintenance',
            vehicleNumber: form.vehicleNumber,
            maintenanceDate: form.maintenanceDate,
            maintenanceType: form.maintenanceType || '',
            workshopName: form.workshopName || '',
            supplierVendorId: form.partsSupplierVendorId || '',
            supplierVendorName: supplierName || '',
            billName: form.billName || '',
            billData: form.billData || '',
          }
        };
        await syncService.save('branchExpenses', branchExpense);
        window.dispatchEvent(new CustomEvent('branchExpenseCreated', { detail: { expense: branchExpense } }));
      } catch (err) {
        console.warn('Branch expense creation failed:', err);
      }
    }

    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    alert('✅ Vehicle maintenance saved!');
    await loadAll();
    clearForm();
  };

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    const list = records || [];
    if (!q) return list;
    return list.filter(r => {
      const vehicle = String(r.vehicleNumber || '').toLowerCase();
      const type = String(r.maintenanceType || '').toLowerCase();
      const workshop = String(r.workshopName || '').toLowerCase();
      const driver = String(r.driverName || '').toLowerCase();
      return vehicle.includes(q) || type.includes(q) || workshop.includes(q) || driver.includes(q);
    });
  }, [records, search]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 p-6">
      <div className="form-section">
        <h1 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Wrench size={22} /> Vehicle Maintenance
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="grid-3">
            <div className="input-group">
              <label>Vehicle Number *</label>
              <select
                value={form.vehicleNumber}
                onChange={(e) => setForm(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                required
              >
                <option value="">-- Select Vehicle --</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.vehicleNumber}>{v.vehicleNumber}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Maintenance Date *</label>
              <input
                type="date"
                value={form.maintenanceDate}
                onChange={(e) => setForm(prev => ({ ...prev, maintenanceDate: e.target.value }))}
                required
              />
            </div>

            <div className="input-group">
              <label>Maintenance Type</label>
              <input
                type="text"
                value={form.maintenanceType}
                onChange={(e) => setForm(prev => ({ ...prev, maintenanceType: e.target.value }))}
                placeholder="e.g., Service, Oil Change, Tyre"
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="input-group">
              <label>Workshop Name</label>
              <input
                type="text"
                value={form.workshopName}
                onChange={(e) => setForm(prev => ({ ...prev, workshopName: e.target.value }))}
                placeholder="Workshop"
              />
            </div>

            <div className="input-group">
              <label>Driver Name</label>
              <select
                value={form.driverName}
                onChange={(e) => setForm(prev => ({ ...prev, driverName: e.target.value }))}
              >
                <option value="">-- Optional --</option>
                {drivers.map(d => (
                  <option key={d.id} value={d.driverName}>{d.nickName ? `${d.driverName} (${d.nickName})` : d.driverName}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Remark</label>
              <input
                type="text"
                value={form.remarks}
                onChange={(e) => setForm(prev => ({ ...prev, remarks: e.target.value }))}
                placeholder="Optional remark"
              />
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '16px' }}>
            <h2 className="section-title">Parts Supplier Vendor (Optional)</h2>
            <div className="grid-3">
              <div className="input-group">
                <label>Mode</label>
                <select
                  value={form.partsSupplierMode}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    partsSupplierMode: e.target.value,
                    partsSupplierVendorId: e.target.value === 'manual' ? '' : prev.partsSupplierVendorId,
                    partsSupplierVendorName: e.target.value === 'select' ? '' : prev.partsSupplierVendorName
                  }))}
                >
                  <option value="select">Select from Vendor Master</option>
                  <option value="manual">Manual</option>
                </select>
              </div>

              {form.partsSupplierMode === 'select' ? (
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Vendor Name</label>
                  <select
                    value={form.partsSupplierVendorId}
                    onChange={(e) => setForm(prev => ({ ...prev, partsSupplierVendorId: e.target.value }))}
                  >
                    <option value="">-- Optional --</option>
                    {vendors.map(v => (
                      <option key={v.id} value={v.id}>
                        {(v.vendorName || v.tradeName || v.companyName || 'Vendor')} {v.vendorCode ? `(${v.vendorCode})` : (v.code ? `(${v.code})` : '')}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="input-group" style={{ gridColumn: 'span 2' }}>
                  <label>Vendor Name</label>
                  <input
                    type="text"
                    value={form.partsSupplierVendorName}
                    onChange={(e) => setForm(prev => ({ ...prev, partsSupplierVendorName: e.target.value }))}
                    placeholder="Enter vendor name"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '16px' }}>
            <h2 className="section-title">Parts Changed (Optional)</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
                <thead>
                  <tr style={{ background: '#f97316', color: '#fff' }}>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Part Name</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Part Number</th>
                    <th style={{ padding: '10px', textAlign: 'left' }}>Price (₹)</th>
                    <th style={{ padding: '10px', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(form.parts || []).map((p, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                      <td style={{ padding: '10px' }}>
                        <input value={p.partName} onChange={(e) => setPart(idx, { partName: e.target.value })} placeholder="Part name" />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input value={p.partNumber} onChange={(e) => setPart(idx, { partNumber: e.target.value })} placeholder="Part number" />
                      </td>
                      <td style={{ padding: '10px' }}>
                        <input type="number" step="0.01" value={p.price} onChange={(e) => setPart(idx, { price: e.target.value })} placeholder="0.00" />
                      </td>
                      <td style={{ padding: '10px', textAlign: 'center' }}>
                        <button type="button" className="btn btn-danger" onClick={() => removePartRow(idx)} disabled={(form.parts || []).length <= 1}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '10px' }}>
              <button type="button" className="btn btn-secondary" onClick={addPartRow}>
                <Plus size={16} /> Add Part
              </button>
            </div>
          </div>

          <div className="grid-3" style={{ marginTop: '16px' }}>
            <div className="input-group">
              <label>Labour Charges</label>
              <input
                type="number"
                step="0.01"
                value={form.labourCharges}
                onChange={(e) => setForm(prev => ({ ...prev, labourCharges: e.target.value }))}
                placeholder="0.00"
              />
            </div>

            <div className="input-group">
              <label>Total Maintenance Cost</label>
              <input type="text" value={`₹${totalCost.toFixed(2)}`} readOnly />
              <small style={{ color: '#64748b' }}>Auto = Parts + Labour</small>
            </div>

            <div className="input-group">
              <label>Upload Bill</label>
              <input type="file" accept="image/*,application/pdf" onChange={(e) => handleBillUpload(e.target.files?.[0])} />
              {form.billName && (
                <small style={{ color: '#64748b' }}>
                  <Upload size={14} /> {form.billName}
                </small>
              )}
            </div>
          </div>

          <div className="form-section" style={{ marginTop: '16px' }}>
            <h2 className="section-title">Accounting Link (Expense Master + Account Master)</h2>
            <div className="grid-3">
              <div className="input-group">
                <label>Expense Type (from Expense Master)</label>
                <select value={form.expenseTypeId} onChange={(e) => setForm(prev => ({ ...prev, expenseTypeId: e.target.value }))}>
                  <option value="">-- Optional --</option>
                  {expenseTypes.map(et => (
                    <option key={et.id} value={et.id}>
                      {et.expenseType} {et.category ? `(${et.category})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="input-group">
                <label>Expense Head (Account)</label>
                <select value={form.accountId} onChange={(e) => setForm(prev => ({ ...prev, accountId: e.target.value }))}>
                  <option value="">-- Optional --</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} ({a.accountCode})
                    </option>
                  ))}
                </select>
                {selectedAccount && (
                  <small style={{ color: '#64748b' }}>
                    Selected: {selectedAccount.accountName}
                  </small>
                )}
              </div>

              <div className="input-group">
                <label>Paid From Branch {form.paymentMode === 'Credit' ? '(optional)' : '*'}</label>
                <select value={form.paidFromBranch} onChange={(e) => setForm(prev => ({ ...prev, paidFromBranch: e.target.value }))}>
                  <option value="">-- Optional --</option>
                  {(JSON.parse(localStorage.getItem('branches') || '[]') || [])
                    .filter(b => !b.status || b.status === 'Active')
                    .map(b => (
                      <option key={b.id} value={b.id}>{b.branchName}</option>
                    ))}
                </select>
              </div>
            </div>
            <div className="grid-3">
              <div className="input-group">
                <label>Payment Mode (optional)</label>
                <select
                  value={form.paymentMode}
                  onChange={(e) => setForm(prev => ({
                    ...prev,
                    paymentMode: e.target.value,
                    paymentAccountId: e.target.value === 'Credit' ? '' : prev.paymentAccountId
                  }))}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank">Bank</option>
                  <option value="On Account">On Account</option>
                  <option value="Credit">Credit</option>
                </select>
              </div>

              <div className="input-group">
                <label>Payment Account {form.paymentMode === 'Credit' ? '(not required)' : '*'}</label>
                <select
                  value={form.paymentAccountId}
                  onChange={(e) => setForm(prev => ({ ...prev, paymentAccountId: e.target.value }))}
                  disabled={form.paymentMode === 'Credit' || !form.paidFromBranch}
                >
                  <option value="">{form.paymentMode === 'Credit' ? '-- Not Applicable --' : '-- Select Account --'}</option>
                  {(branchAccounts || [])
                    .filter(a => String(a.branch) === String(form.paidFromBranch) && (!a.status || a.status === 'Active'))
                    .map(a => (
                      <option key={a.id} value={a.id}>
                        {a.accountName} - {a.accountType}
                      </option>
                    ))}
                </select>
                {form.paymentMode !== 'Credit' && !form.paidFromBranch && (
                  <small style={{ color: '#64748b' }}>Select Paid From Branch first</small>
                )}
              </div>

              <div className="input-group">
                <label>Credit Due Date (optional)</label>
                <input
                  type="date"
                  value={form.creditDueDate}
                  onChange={(e) => setForm(prev => ({ ...prev, creditDueDate: e.target.value }))}
                  disabled={form.paymentMode !== 'Credit'}
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} /> Save Maintenance
            </button>
            <button type="button" className="btn btn-secondary" onClick={clearForm}>
              Clear
            </button>
          </div>
        </form>
      </div>

      <div className="form-section" style={{ marginTop: '20px' }}>
        <h2 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Search size={18} /> Saved Records ({filtered.length})
        </h2>
        <div className="input-group">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by vehicle/type/workshop/driver..." />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff' }}>
            <thead>
              <tr style={{ background: '#0f172a', color: '#fff' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Vehicle</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Type</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Workshop</th>
                <th style={{ padding: '10px', textAlign: 'left' }}>Cost</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>Bill</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '10px' }}>{r.maintenanceDate || ''}</td>
                  <td style={{ padding: '10px' }}>{r.vehicleNumber || ''}</td>
                  <td style={{ padding: '10px' }}>{r.maintenanceType || ''}</td>
                  <td style={{ padding: '10px' }}>{r.workshopName || ''}</td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>₹{parseFloat(r.totalCost || 0).toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    {r.billData ? (
                      <a
                        href={r.billData}
                        download={r.billName || `bill_${r.id}`}
                        className="btn btn-secondary"
                        style={{ padding: '8px 10px' }}
                      >
                        <Download size={14} /> Download
                      </a>
                    ) : (
                      <span style={{ color: '#64748b' }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>
                    No maintenance records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #f97316;
        }
        .section-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0f172a;
          margin-bottom: 16px;
          padding-bottom: 10px;
          border-bottom: 2px solid #e2e8f0;
        }
        .input-group { margin-bottom: 14px; }
        label { display:block; font-size: 0.875rem; font-weight: 600; color:#334155; margin-bottom: 6px; }
        input, select, textarea { width: 100%; padding: 10px 12px; border: 2px solid #e2e8f0; border-radius: 8px; }
        input:focus, select:focus, textarea:focus { outline: none; border-color: #f97316; box-shadow: 0 0 0 3px rgba(249,115,22,0.15); }
        .btn { border: none; border-radius: 8px; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary { background: #f97316; color: white; padding: 10px 16px; }
        .btn-secondary { background: #f1f5f9; color: #334155; padding: 10px 16px; }
        .btn-danger { background: #ef4444; color: white; padding: 8px 10px; }
        .grid-3 { display:grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        @media (max-width: 900px) { .grid-3 { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}

