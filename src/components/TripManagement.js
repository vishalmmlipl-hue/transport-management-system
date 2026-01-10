import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import syncService from '../utils/sync-service';

const TripManagement = () => {
  const [activeTab, setActiveTab] = useState('create'); // 'create', 'addExpense', 'viewExpenses'
  const [trips, setTrips] = useState([]);
  const [availableLRs, setAvailableLRs] = useState([]);

  useEffect(() => {
    loadTrips();
    loadLRs();
  }, []);

  const loadTrips = async () => {
    try {
      const result = await syncService.load('trips');
      setTrips(result.data);
    } catch (error) {
      console.error('Error loading trips:', error);
      // Fallback to localStorage
      const savedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
      setTrips(savedTrips);
    }
  };

  const loadLRs = async () => {
    try {
      const ftlResult = await syncService.load('ftlLRBookings');
      const ptlResult = await syncService.load('ptlLRBookings');
      setAvailableLRs([...ftlResult.data, ...ptlResult.data]);
    } catch (error) {
      console.error('Error loading LR bookings:', error);
      // Fallback to localStorage
      const ftlBookings = JSON.parse(localStorage.getItem('ftlLRBookings') || '[]');
      const ptlBookings = JSON.parse(localStorage.getItem('ptlLRBookings') || '[]');
      setAvailableLRs([...ftlBookings, ...ptlBookings]);
    }
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '20px auto', padding: '20px' }}>
      <h2 style={{ marginBottom: '30px', color: '#333' }}>Trip Management</h2>
      
      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        marginBottom: '30px',
        borderBottom: '2px solid #ddd'
      }}>
        <button
          onClick={() => setActiveTab('create')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'create' ? '#007bff' : 'transparent',
            color: activeTab === 'create' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'create' ? 'bold' : 'normal',
            borderBottom: activeTab === 'create' ? '3px solid #0056b3' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          ➕ Create Trip
        </button>
        <button
          onClick={() => setActiveTab('addExpense')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'addExpense' ? '#007bff' : 'transparent',
            color: activeTab === 'addExpense' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'addExpense' ? 'bold' : 'normal',
            borderBottom: activeTab === 'addExpense' ? '3px solid #0056b3' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          💰 Add Trip Expense
        </button>
        <button
          onClick={() => setActiveTab('viewExpenses')}
          style={{
            padding: '12px 24px',
            border: 'none',
            backgroundColor: activeTab === 'viewExpenses' ? '#007bff' : 'transparent',
            color: activeTab === 'viewExpenses' ? 'white' : '#333',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: activeTab === 'viewExpenses' ? 'bold' : 'normal',
            borderBottom: activeTab === 'viewExpenses' ? '3px solid #0056b3' : '3px solid transparent',
            transition: 'all 0.3s'
          }}
        >
          📊 View/Edit/Finalize Expenses
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'create' && <CreateTripForm trips={trips} setTrips={setTrips} availableLRs={availableLRs} loadTrips={loadTrips} />}
      {activeTab === 'addExpense' && <AddTripExpenseForm trips={trips} loadTrips={loadTrips} />}
      {activeTab === 'viewExpenses' && <ViewEditFinalizeExpenses trips={trips} loadTrips={loadTrips} />}
    </div>
  );
};

// Form 1: Create Trip
const CreateTripForm = ({ trips, setTrips, availableLRs, loadTrips }) => {
  const [formData, setFormData] = useState({
    tripNumber: '',
    vehicleNumber: '',
    driverName: '',
    fromLocation: '',
    toLocation: '',
    startDate: '',
    endDate: '',
    selectedLRs: [],
    branch: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLRSelection = (lrId) => {
    setFormData(prev => ({
      ...prev,
      selectedLRs: prev.selectedLRs.includes(lrId)
        ? prev.selectedLRs.filter(id => id !== lrId)
        : [...prev.selectedLRs, lrId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.selectedLRs.length === 0) {
      alert('Please select at least one LR booking');
      return;
    }

    const trip = {
      id: Date.now().toString(),
      ...formData,
      status: 'Active',
      createdAt: new Date().toISOString()
    };

    try {
      // Save to API server and localStorage
      const result = await syncService.save('trips', trip);
      
      if (result.synced) {
        alert('Trip created successfully and synced across all systems!');
      } else {
        alert('Trip created successfully! (Saved locally - server may be unavailable)');
      }

      const updatedTrips = [...trips, trip];
      setTrips(updatedTrips);
      
      window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'trip', data: trip } }));
      
      setFormData({
        tripNumber: '',
        vehicleNumber: '',
        driverName: '',
        fromLocation: '',
        toLocation: '',
        startDate: '',
        endDate: '',
        selectedLRs: [],
        branch: '',
      });
      loadTrips();
    } catch (error) {
      console.error('Error saving trip:', error);
      alert('Error saving trip. Please try again.');
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Create New Trip</h3>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Trip Number *
            </label>
            <input
              type="text"
              name="tripNumber"
              value={formData.tripNumber}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Branch *
            </label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="">-- Select Branch --</option>
              <option value="All Branches">All Branches</option>
              <option value="Branch 1">Branch 1</option>
              <option value="Branch 2">Branch 2</option>
              <option value="Branch 3">Branch 3</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Vehicle Number *
            </label>
            <input
              type="text"
              name="vehicleNumber"
              value={formData.vehicleNumber}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Driver Name *
            </label>
            <input
              type="text"
              name="driverName"
              value={formData.driverName}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              From Location *
            </label>
            <input
              type="text"
              name="fromLocation"
              value={formData.fromLocation}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              To Location *
            </label>
            <input
              type="text"
              name="toLocation"
              value={formData.toLocation}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600' }}>
            Select LR Bookings * ({formData.selectedLRs.length} selected)
          </label>
          <div style={{ 
            maxHeight: '200px', 
            overflowY: 'auto', 
            border: '1px solid #ccc', 
            borderRadius: '4px', 
            padding: '15px',
            backgroundColor: '#f8f9fa'
          }}>
            {availableLRs.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No LR bookings available</p>
            ) : (
              availableLRs.map(lr => (
                <div key={lr.id} style={{ marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={formData.selectedLRs.includes(lr.id)}
                      onChange={() => handleLRSelection(lr.id)}
                      style={{ marginRight: '10px', width: '18px', height: '18px' }}
                    />
                    <span style={{ fontSize: '14px' }}>
                      LR #{lr.lrNumber || lr.id} {lr.lrReferenceNumber ? `(Ref: ${lr.lrReferenceNumber})` : ''} | 
                      {lr.fromLocation || 'N/A'} → {lr.toLocation || 'N/A'}
                    </span>
                  </label>
                </div>
              ))
            )}
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '12px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Create Trip
        </button>
      </form>
    </div>
  );
};

// Form 2: Add Trip Expense
const AddTripExpenseForm = ({ trips, loadTrips }) => {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    type: 'debit',
    account: 'driver',
    expenseDate: new Date().toISOString().split('T')[0],
    category: 'Fuel'
  });

  useEffect(() => {
    if (selectedTripId) {
      const trip = trips.find(t => t.id === selectedTripId);
      setSelectedTrip(trip);
    } else {
      setSelectedTrip(null);
    }
  }, [selectedTripId, trips]);

  const handleTripChange = (e) => {
    setSelectedTripId(e.target.value);
  };

  const handleExpenseChange = (e) => {
    const { name, value } = e.target;
    setExpenseForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!selectedTripId) {
      alert('Please select a trip');
      return;
    }
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Please fill in description and amount');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      date: expenseForm.expenseDate,
      createdAt: new Date().toISOString()
    };

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const existingSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
    
    if (existingSheet) {
      existingSheet.expenses = [...(existingSheet.expenses || []), newExpense];
      const updated = tripSheets.map(ts => ts.tripId === selectedTripId ? existingSheet : ts);
      localStorage.setItem('tripSheets', JSON.stringify(updated));
    } else {
      tripSheets.push({
        tripId: selectedTripId,
        expenses: [newExpense],
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('tripSheets', JSON.stringify(tripSheets));
    }

    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'tripSheet', data: { tripId: selectedTripId } } }));
    
    alert(`Expense added successfully to Trip #${selectedTrip?.tripNumber || selectedTripId}!`);
    
    setExpenseForm({
      description: '',
      amount: '',
      type: 'debit',
      account: 'driver',
      expenseDate: new Date().toISOString().split('T')[0],
      category: 'Fuel'
    });
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>Add Trip Expense</h3>
      
      <form onSubmit={handleAddExpense}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
            Select Trip *
          </label>
          <select
            value={selectedTripId}
            onChange={handleTripChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '15px',
              backgroundColor: '#fff'
            }}
          >
            <option value="">-- Select a Trip --</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>
                Trip #{trip.tripNumber} - {trip.fromLocation} → {trip.toLocation} ({trip.vehicleNumber})
              </option>
            ))}
          </select>
        </div>

        {selectedTrip && (
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px solid #007bff'
          }}>
            <h4 style={{ marginTop: 0, marginBottom: '15px', color: '#007bff' }}>Trip Details</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong style={{ color: '#666' }}>Trip Number:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.tripNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Route:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📍 {selectedTrip.fromLocation} → {selectedTrip.toLocation}
                </div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Vehicle:</strong>
                <div style={{ fontSize: '16px' }}>🚚 {selectedTrip.vehicleNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Driver:</strong>
                <div style={{ fontSize: '16px' }}>👤 {selectedTrip.driverName}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Branch:</strong>
                <div style={{ fontSize: '16px' }}>🏢 {selectedTrip.branch}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Start Date:</strong>
                <div style={{ fontSize: '16px' }}>{selectedTrip.startDate ? new Date(selectedTrip.startDate).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Expense Category *
            </label>
            <select
              name="category"
              value={expenseForm.category}
              onChange={handleExpenseChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="Fuel">Fuel</option>
              <option value="Toll">Toll</option>
              <option value="Loading">Loading</option>
              <option value="Unloading">Unloading</option>
              <option value="Detention">Detention</option>
              <option value="Repair">Repair</option>
              <option value="Food">Food</option>
              <option value="Driver Advance">Driver Advance</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Expense Date *
            </label>
            <input
              type="date"
              name="expenseDate"
              value={expenseForm.expenseDate}
              onChange={handleExpenseChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
            Description *
          </label>
          <input
            type="text"
            name="description"
            value={expenseForm.description}
            onChange={handleExpenseChange}
            required
            placeholder="Enter expense description"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Amount (₹) *
            </label>
            <input
              type="number"
              name="amount"
              value={expenseForm.amount}
              onChange={handleExpenseChange}
              required
              step="0.01"
              min="0"
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Type *
            </label>
            <select
              name="type"
              value={expenseForm.type}
              onChange={handleExpenseChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '600' }}>
              Account *
            </label>
            <select
              name="account"
              value={expenseForm.account}
              onChange={handleExpenseChange}
              required
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="driver">Driver</option>
              <option value="company">Company</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!selectedTripId}
          style={{
            padding: '12px 30px',
            backgroundColor: selectedTripId ? '#28a745' : '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: selectedTripId ? 'pointer' : 'not-allowed',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          Add Expense
        </button>
      </form>
    </div>
  );
};

// Form 3: View/Edit/Finalize Trip Expenses
const ViewEditFinalizeExpenses = ({ trips, loadTrips }) => {
  const [selectedTripId, setSelectedTripId] = useState('');
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [editingExpense, setEditingExpense] = useState(null);
  const [editForm, setEditForm] = useState({
    description: '',
    amount: '',
    type: 'debit',
    account: 'driver',
    category: 'Fuel',
    expenseDate: ''
  });

  useEffect(() => {
    if (selectedTripId) {
      const trip = trips.find(t => t.id === selectedTripId);
      setSelectedTrip(trip);
      
      const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
      const tripSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
      setExpenses(tripSheet?.expenses || []);
    } else {
      setSelectedTrip(null);
      setExpenses([]);
    }
  }, [selectedTripId, trips]);

  const handleTripChange = (e) => {
    setSelectedTripId(e.target.value);
    setEditingExpense(null);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense.id);
    setEditForm({
      description: expense.description,
      amount: expense.amount.toString(),
      type: expense.type || 'debit',
      account: expense.account || 'driver',
      category: expense.category || 'Fuel',
      expenseDate: expense.date || expense.expenseDate || new Date().toISOString().split('T')[0]
    });
  };

  const handleSaveEdit = () => {
    if (!editForm.description || !editForm.amount) {
      alert('Please fill in description and amount');
      return;
    }

    const updatedExpenses = expenses.map(exp => 
      exp.id === editingExpense 
        ? {
            ...exp,
            description: editForm.description,
            amount: parseFloat(editForm.amount),
            type: editForm.type,
            account: editForm.account,
            category: editForm.category,
            date: editForm.expenseDate,
            updatedAt: new Date().toISOString()
          }
        : exp
    );

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const existingSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
    
    if (existingSheet) {
      existingSheet.expenses = updatedExpenses;
      const updated = tripSheets.map(ts => ts.tripId === selectedTripId ? existingSheet : ts);
      localStorage.setItem('tripSheets', JSON.stringify(updated));
    } else {
      tripSheets.push({
        tripId: selectedTripId,
        expenses: updatedExpenses,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('tripSheets', JSON.stringify(tripSheets));
    }

    setExpenses(updatedExpenses);
    setEditingExpense(null);
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'tripSheet', data: { tripId: selectedTripId } } }));
    alert('Expense updated successfully!');
  };

  const handleDelete = (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    const updatedExpenses = expenses.filter(exp => exp.id !== expenseId);
    
    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const existingSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
    
    if (existingSheet) {
      existingSheet.expenses = updatedExpenses;
      const updated = tripSheets.map(ts => ts.tripId === selectedTripId ? existingSheet : ts);
      localStorage.setItem('tripSheets', JSON.stringify(updated));
    }

    setExpenses(updatedExpenses);
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'tripSheet', data: { tripId: selectedTripId } } }));
    alert('Expense deleted successfully!');
  };

  const handleFinalize = () => {
    if (expenses.length === 0) {
      alert('No expenses to finalize');
      return;
    }

    if (!window.confirm('Are you sure you want to finalize this trip? This will mark the trip as completed and expenses cannot be edited.')) {
      return;
    }

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const existingSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
    
    if (existingSheet) {
      existingSheet.finalized = true;
      existingSheet.finalizedAt = new Date().toISOString();
      const updated = tripSheets.map(ts => ts.tripId === selectedTripId ? existingSheet : ts);
      localStorage.setItem('tripSheets', JSON.stringify(updated));
    }

    const updatedTrips = trips.map(trip => 
      trip.id === selectedTripId 
        ? { ...trip, status: 'Finalized', finalizedAt: new Date().toISOString() }
        : trip
    );
    localStorage.setItem('trips', JSON.stringify(updatedTrips));
    loadTrips();

    alert('Trip expenses finalized successfully!');
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'tripSheet', data: { tripId: selectedTripId } } }));
  };

  const handleDownloadExcel = () => {
    if (!selectedTrip || expenses.length === 0) {
      alert('Please select a trip with expenses');
      return;
    }

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const tripSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
    const isFinalized = tripSheet?.finalized || false;

    // Prepare Excel data
    const excelData = [
      ['TRIP EXPENSES REPORT'],
      ['Trip Number:', selectedTrip.tripNumber],
      ['Route:', `${selectedTrip.fromLocation} → ${selectedTrip.toLocation}`],
      ['Vehicle:', selectedTrip.vehicleNumber],
      ['Driver:', selectedTrip.driverName],
      ['Branch:', selectedTrip.branch],
      ['Status:', isFinalized ? 'Finalized' : 'Pending'],
      ['Generated Date:', new Date().toLocaleString()],
      [],
      ['EXPENSES DETAILS'],
      ['Date', 'Category', 'Description', 'Amount (₹)', 'Type', 'Account']
    ];

    expenses.forEach(exp => {
      excelData.push([
        exp.date || exp.expenseDate || 'N/A',
        exp.category || 'N/A',
        exp.description,
        exp.amount,
        exp.type.toUpperCase(),
        exp.account
      ]);
    });

    excelData.push([]);
    const totalDebit = expenses.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
    const totalCredit = expenses.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
    const balance = totalCredit - totalDebit;

    excelData.push(['SUMMARY']);
    excelData.push(['Total Debit:', totalDebit]);
    excelData.push(['Total Credit:', totalCredit]);
    excelData.push(['Balance:', balance]);

    // Create workbook
    const ws = XLSX.utils.aoa_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trip Expenses');

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Date
      { wch: 15 }, // Category
      { wch: 30 }, // Description
      { wch: 15 }, // Amount
      { wch: 10 }, // Type
      { wch: 12 }  // Account
    ];

    // Download
    const filename = `Trip_Expenses_${selectedTrip.tripNumber}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, filename);
    alert('Excel file downloaded successfully!');
  };

  const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
  const tripSheet = tripSheets.find(ts => ts.tripId === selectedTripId);
  const isFinalized = tripSheet?.finalized || false;
  const totalDebit = expenses.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = expenses.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalCredit - totalDebit;

  return (
    <div style={{ padding: '20px', border: '1px solid #ddd', borderRadius: '8px', backgroundColor: '#fff' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', color: '#333' }}>View/Edit/Finalize Trip Expenses</h3>
      
      <div style={{ marginBottom: '25px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', fontSize: '16px' }}>
          Select Trip
        </label>
        <select
          value={selectedTripId}
          onChange={handleTripChange}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            fontSize: '15px',
            backgroundColor: '#fff'
          }}
        >
          <option value="">-- Select a Trip --</option>
          {trips.map(trip => (
            <option key={trip.id} value={trip.id}>
              Trip #{trip.tripNumber} - {trip.fromLocation} → {trip.toLocation} ({trip.vehicleNumber})
            </option>
          ))}
        </select>
      </div>

      {selectedTrip && (
        <>
          <div style={{ 
            marginBottom: '25px', 
            padding: '20px', 
            backgroundColor: '#f8f9fa', 
            borderRadius: '8px',
            border: '2px solid #007bff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h4 style={{ margin: 0, color: '#007bff' }}>Trip Details</h4>
              {isFinalized && (
                <span style={{
                  padding: '5px 15px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  ✅ FINALIZED
                </span>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <strong style={{ color: '#666' }}>Trip Number:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>{selectedTrip.tripNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Route:</strong>
                <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📍 {selectedTrip.fromLocation} → {selectedTrip.toLocation}
                </div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Vehicle:</strong>
                <div style={{ fontSize: '16px' }}>🚚 {selectedTrip.vehicleNumber}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Driver:</strong>
                <div style={{ fontSize: '16px' }}>👤 {selectedTrip.driverName}</div>
              </div>
              <div>
                <strong style={{ color: '#666' }}>Branch:</strong>
                <div style={{ fontSize: '16px' }}>🏢 {selectedTrip.branch}</div>
              </div>
            </div>
          </div>

          {expenses.length > 0 && (
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDownloadExcel}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                📥 Download Excel
              </button>
              {!isFinalized && (
                <button
                  onClick={handleFinalize}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  ✅ Finalize Trip Expenses
                </button>
              )}
            </div>
          )}

          <div>
            <h4 style={{ marginBottom: '15px' }}>Expenses List</h4>
            {expenses.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic', padding: '20px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                No expenses added for this trip yet
              </p>
            ) : (
              <>
                <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#fff' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Date</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Category</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Description</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Amount (₹)</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Type</th>
                        <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #0056b3' }}>Account</th>
                        {!isFinalized && (
                          <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #0056b3' }}>Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {expenses.map(expense => (
                        <tr key={expense.id} style={{ borderBottom: '1px solid #ddd' }}>
                          {editingExpense === expense.id ? (
                            <>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="date"
                                  value={editForm.expenseDate}
                                  onChange={(e) => setEditForm({ ...editForm, expenseDate: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <select
                                  value={editForm.category}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                >
                                  <option value="Fuel">Fuel</option>
                                  <option value="Toll">Toll</option>
                                  <option value="Loading">Loading</option>
                                  <option value="Unloading">Unloading</option>
                                  <option value="Detention">Detention</option>
                                  <option value="Repair">Repair</option>
                                  <option value="Food">Food</option>
                                  <option value="Driver Advance">Driver Advance</option>
                                  <option value="Other">Other</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="text"
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <input
                                  type="number"
                                  value={editForm.amount}
                                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                                  step="0.01"
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                />
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <select
                                  value={editForm.type}
                                  onChange={(e) => setEditForm({ ...editForm, type: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                >
                                  <option value="debit">Debit</option>
                                  <option value="credit">Credit</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <select
                                  value={editForm.account}
                                  onChange={(e) => setEditForm({ ...editForm, account: e.target.value })}
                                  style={{ width: '100%', padding: '5px', border: '1px solid #ccc', borderRadius: '3px' }}
                                >
                                  <option value="driver">Driver</option>
                                  <option value="company">Company</option>
                                </select>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                <button
                                  onClick={handleSaveEdit}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    marginRight: '5px',
                                    fontSize: '12px'
                                  }}
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditingExpense(null)}
                                  style={{
                                    padding: '5px 10px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    cursor: 'pointer',
                                    fontSize: '12px'
                                  }}
                                >
                                  Cancel
                                </button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {expense.date || expense.expenseDate || 'N/A'}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                {expense.category || 'N/A'}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.description}</td>
                              <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>
                                ₹{expense.amount.toFixed(2)}
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                                <span style={{
                                  padding: '3px 8px',
                                  borderRadius: '3px',
                                  backgroundColor: expense.type === 'debit' ? '#dc3545' : '#28a745',
                                  color: 'white',
                                  fontSize: '12px',
                                  fontWeight: 'bold'
                                }}>
                                  {expense.type.toUpperCase()}
                                </span>
                              </td>
                              <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.account}</td>
                              {!isFinalized && (
                                <td style={{ padding: '10px', border: '1px solid #ddd', textAlign: 'center' }}>
                                  <button
                                    onClick={() => handleEdit(expense)}
                                    style={{
                                      padding: '5px 10px',
                                      backgroundColor: '#17a2b8',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      marginRight: '5px',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(expense.id)}
                                    style={{
                                      padding: '5px 10px',
                                      backgroundColor: '#dc3545',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '3px',
                                      cursor: 'pointer',
                                      fontSize: '12px'
                                    }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  border: '2px solid #007bff'
                }}>
                  <h4 style={{ marginTop: 0, marginBottom: '15px' }}>Expense Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                    <div>
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Total Debit:</strong>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#dc3545' }}>
                        ₹{totalDebit.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Total Credit:</strong>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#28a745' }}>
                        ₹{totalCredit.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Balance:</strong>
                      <div style={{ 
                        fontSize: '20px', 
                        fontWeight: 'bold', 
                        color: balance >= 0 ? '#28a745' : '#dc3545' 
                      }}>
                        ₹{balance.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#666', display: 'block', marginBottom: '5px' }}>Total Expenses:</strong>
                      <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#007bff' }}>
                        {expenses.length} entries
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TripManagement;
