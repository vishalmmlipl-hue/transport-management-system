import React, { useState, useEffect } from 'react';

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
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
  const [availableLRs, setAvailableLRs] = useState([]);
  const [showTripSheet, setShowTripSheet] = useState(null);

  useEffect(() => {
    loadTrips();
    loadLRs();
  }, []);

  const loadTrips = () => {
    const savedTrips = JSON.parse(localStorage.getItem('trips') || '[]');
    setTrips(savedTrips);
  };

  const loadLRs = () => {
    const ftlBookings = JSON.parse(localStorage.getItem('ftlLRBookings') || '[]');
    const ptlBookings = JSON.parse(localStorage.getItem('ptlLRBookings') || '[]');
    setAvailableLRs([...ftlBookings, ...ptlBookings]);
  };

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.selectedLRs.length === 0) {
      alert('Please select at least one LR booking');
      return;
    }

    const trip = {
      id: Date.now().toString(),
      ...formData,
      createdAt: new Date().toISOString()
    };

    const updatedTrips = [...trips, trip];
    localStorage.setItem('trips', JSON.stringify(updatedTrips));
    
    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'trip', data: trip } }));
    alert('Trip created successfully!');
    
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
  };

  const handleViewTripSheet = (tripId) => {
    setShowTripSheet(tripId);
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '20px' }}>
      <h2>Trip Management</h2>
      
      <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '8px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Trip Number
              <input
                type="text"
                name="tripNumber"
                value={formData.tripNumber}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Branch
              <select
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              >
                <option value="">-- Select Branch --</option>
                <option value="All Branches">All Branches</option>
                <option value="Branch 1">Branch 1</option>
                <option value="Branch 2">Branch 2</option>
                <option value="Branch 3">Branch 3</option>
              </select>
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Vehicle Number
              <input
                type="text"
                name="vehicleNumber"
                value={formData.vehicleNumber}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              Driver Name
              <input
                type="text"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              From Location
              <input
                type="text"
                name="fromLocation"
                value={formData.fromLocation}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              To Location
              <input
                type="text"
                name="toLocation"
                value={formData.toLocation}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div>
            <label>
              Start Date
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
          <div>
            <label>
              End Date
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '5px',
                  border: '1px solid #ccc',
                  borderRadius: '4px'
                }}
              />
            </label>
          </div>
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>
            Select LR Bookings ({formData.selectedLRs.length} selected)
            <div style={{ marginTop: '10px', maxHeight: '200px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: '4px', padding: '10px' }}>
              {availableLRs.length === 0 ? (
                <p>No LR bookings available</p>
              ) : (
                availableLRs.map(lr => (
                  <div key={lr.id} style={{ marginBottom: '10px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={formData.selectedLRs.includes(lr.id)}
                        onChange={() => handleLRSelection(lr.id)}
                        style={{ marginRight: '10px' }}
                      />
                      <span>
                        LR #{lr.lrNumber} {lr.lrReferenceNumber ? `(Ref: ${lr.lrReferenceNumber})` : ''} | {lr.fromLocation} → {lr.toLocation}
                      </span>
                    </label>
                  </div>
                ))
              )}
            </div>
          </label>
        </div>

        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Create Trip
        </button>
      </form>

      <div>
        <h3>Existing Trips</h3>
        {trips.length === 0 ? (
          <p>No trips created yet</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {trips.map(trip => (
              <div
                key={trip.id}
                style={{
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  padding: '15px',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <h4 style={{ margin: 0 }}>Trip #{trip.tripNumber}</h4>
                  <button
                    onClick={() => handleViewTripSheet(trip.id)}
                    style={{
                      padding: '5px 15px',
                      backgroundColor: '#17a2b8',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    View Trip Sheet
                  </button>
                </div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  <div><strong>Vehicle:</strong> {trip.vehicleNumber}</div>
                  <div><strong>Driver:</strong> {trip.driverName}</div>
                  <div><strong>Route:</strong> {trip.fromLocation} → {trip.toLocation}</div>
                  <div><strong>Branch:</strong> {trip.branch}</div>
                  <div><strong>LRs:</strong> {trip.selectedLRs.length}</div>
                  <div><strong>Created:</strong> {new Date(trip.createdAt).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTripSheet && (
        <TripSheet tripId={showTripSheet} onClose={() => setShowTripSheet(null)} />
      )}
    </div>
  );
};

const TripSheet = ({ tripId, onClose }) => {
  const [trip, setTrip] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expenseForm, setExpenseForm] = useState({
    description: '',
    amount: '',
    type: 'debit',
    account: 'driver',
  });

  useEffect(() => {
    const trips = JSON.parse(localStorage.getItem('trips') || '[]');
    const foundTrip = trips.find(t => t.id === tripId);
    setTrip(foundTrip);

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const foundSheet = tripSheets.find(ts => ts.tripId === tripId);
    if (foundSheet) {
      setExpenses(foundSheet.expenses || []);
    }
  }, [tripId]);

  const handleAddExpense = () => {
    if (!expenseForm.description || !expenseForm.amount) {
      alert('Please fill in description and amount');
      return;
    }

    const newExpense = {
      id: Date.now().toString(),
      ...expenseForm,
      amount: parseFloat(expenseForm.amount),
      date: new Date().toISOString()
    };

    const updatedExpenses = [...expenses, newExpense];
    setExpenses(updatedExpenses);

    const tripSheets = JSON.parse(localStorage.getItem('tripSheets') || '[]');
    const existingSheet = tripSheets.find(ts => ts.tripId === tripId);
    
    if (existingSheet) {
      existingSheet.expenses = updatedExpenses;
      const updated = tripSheets.map(ts => ts.tripId === tripId ? existingSheet : ts);
      localStorage.setItem('tripSheets', JSON.stringify(updated));
    } else {
      tripSheets.push({
        tripId,
        expenses: updatedExpenses,
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('tripSheets', JSON.stringify(tripSheets));
    }

    window.dispatchEvent(new CustomEvent('dataUpdated', { detail: { type: 'tripSheet', data: { tripId, expenses: updatedExpenses } } }));
    
    setExpenseForm({
      description: '',
      amount: '',
      type: 'debit',
      account: 'driver',
    });
  };

  const totalDebit = expenses.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const totalCredit = expenses.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const balance = totalCredit - totalDebit;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '30px',
        maxWidth: '800px',
        width: '90%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2>Trip Sheet - Trip #{trip?.tripNumber}</h2>
          <button
            onClick={onClose}
            style={{
              padding: '5px 15px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
          <div><strong>Vehicle:</strong> {trip?.vehicleNumber}</div>
          <div><strong>Driver:</strong> {trip?.driverName}</div>
          <div><strong>Route:</strong> {trip?.fromLocation} → {trip?.toLocation}</div>
        </div>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ddd', borderRadius: '4px' }}>
          <h3>Add Expense</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <input
              type="text"
              placeholder="Description"
              value={expenseForm.description}
              onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <input
              type="number"
              placeholder="Amount"
              value={expenseForm.amount}
              onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <select
              value={expenseForm.type}
              onChange={(e) => setExpenseForm({ ...expenseForm, type: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="debit">Debit</option>
              <option value="credit">Credit</option>
            </select>
            <select
              value={expenseForm.account}
              onChange={(e) => setExpenseForm({ ...expenseForm, account: e.target.value })}
              style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
            >
              <option value="driver">Driver</option>
              <option value="company">Company</option>
            </select>
          </div>
          <button
            onClick={handleAddExpense}
            style={{
              padding: '8px 15px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Add Expense
          </button>
        </div>

        <div>
          <h3>Expenses</h3>
          {expenses.length === 0 ? (
            <p>No expenses added yet</p>
          ) : (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8f9fa' }}>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Amount</th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Type</th>
                    <th style={{ padding: '10px', textAlign: 'left', border: '1px solid #ddd' }}>Account</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense.id}>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.description}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>₹{expense.amount}</td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '3px',
                          backgroundColor: expense.type === 'debit' ? '#dc3545' : '#28a745',
                          color: 'white',
                          fontSize: '12px'
                        }}>
                          {expense.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '10px', border: '1px solid #ddd' }}>{expense.account}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <div><strong>Total Debit:</strong> ₹{totalDebit}</div>
                <div><strong>Total Credit:</strong> ₹{totalCredit}</div>
                <div><strong>Balance:</strong> ₹{balance}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TripManagement;

