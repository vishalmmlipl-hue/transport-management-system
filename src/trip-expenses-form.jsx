import React, { useState, useEffect } from 'react';
import { Save, Plus, Trash2, DollarSign, Fuel, Package, TrendingUp, Calculator, Truck } from 'lucide-react';
import { createDriverSalaryLedger } from './utils/ledgerService';

export default function TripExpensesForm() {
  const [trips, setTrips] = useState([]);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [totalKM, setTotalKM] = useState('');
  const [driverSalary, setDriverSalary] = useState('');
  const [driverSalaryPaymentMode, setDriverSalaryPaymentMode] = useState('Cash'); // 'Cash' or 'On Account'
  const [driverSalaryUpiId, setDriverSalaryUpiId] = useState('');
  const [desiredAverage, setDesiredAverage] = useState(''); // km per liter expected
  const [averageGiven, setAverageGiven] = useState(''); // km per liter actual
  const [totalDieselTaken, setTotalDieselTaken] = useState(''); // total liters
  
  const [dieselExpenses, setDieselExpenses] = useState([]);
  const [bhattaExpenses, setBhattaExpenses] = useState([]);
  const [borderExpenses, setBorderExpenses] = useState([]);
  const [otherExpenses, setOtherExpenses] = useState([]);
  
  const [dieselDeduction, setDieselDeduction] = useState('');
  const [otherDeductions, setOtherDeductions] = useState('');

  useEffect(() => {
    const tripsData = JSON.parse(localStorage.getItem('trips') || '[]');
    setTrips(tripsData);
  }, []);

  useEffect(() => {
    if (selectedTrip) {
      const trip = trips.find(t => t.id.toString() === selectedTrip);
      if (trip && trip.expenses) {
        setTotalKM(trip.expenses.totalKM || '');
        setDriverSalary(trip.expenses.driverSalary || '');
        setDesiredAverage(trip.expenses.desiredAverage || '');
        setAverageGiven(trip.expenses.averageGiven || '');
        setTotalDieselTaken(trip.expenses.totalDieselTaken || '');
        setDieselExpenses(trip.expenses.diesel || []);
        setBhattaExpenses(trip.expenses.bhatta || []);
        setBorderExpenses(trip.expenses.border || []);
        setOtherExpenses(trip.expenses.other || []);
        setDieselDeduction(trip.expenses.dieselDeduction || '');
        setOtherDeductions(trip.expenses.otherDeductions || '');
      } else {
        resetForm();
      }
    }
  }, [selectedTrip, trips]);

  const resetForm = () => {
    setTotalKM('');
    setDriverSalary('');
    setDriverSalaryPaymentMode('Cash');
    setDriverSalaryUpiId('');
    setDesiredAverage('');
    setAverageGiven('');
    setTotalDieselTaken('');
    setDieselExpenses([]);
    setBhattaExpenses([]);
    setBorderExpenses([]);
    setOtherExpenses([]);
    setDieselDeduction('');
    setOtherDeductions('');
  };

  // Add expense entry
  const addExpense = (type) => {
    const newExpense = {
      id: Date.now(),
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      paymentMode: 'Cash', // Cash | UPI | On Account
      upiId: ''
    };
    
    switch(type) {
      case 'diesel':
        setDieselExpenses([...dieselExpenses, newExpense]);
        break;
      case 'bhatta':
        setBhattaExpenses([...bhattaExpenses, newExpense]);
        break;
      case 'border':
        setBorderExpenses([...borderExpenses, newExpense]);
        break;
      case 'other':
        setOtherExpenses([...otherExpenses, newExpense]);
        break;
    }
  };

  // Remove expense entry
  const removeExpense = (type, id) => {
    switch(type) {
      case 'diesel':
        setDieselExpenses(dieselExpenses.filter(e => e.id !== id));
        break;
      case 'bhatta':
        setBhattaExpenses(bhattaExpenses.filter(e => e.id !== id));
        break;
      case 'border':
        setBorderExpenses(borderExpenses.filter(e => e.id !== id));
        break;
      case 'other':
        setOtherExpenses(otherExpenses.filter(e => e.id !== id));
        break;
    }
  };

  // Update expense entry
  const updateExpense = (type, id, field, value) => {
    const updateList = (list) => list.map(e => 
      e.id === id
        ? {
            ...e,
            [field]: value,
            ...(field === 'paymentMode' && value !== 'UPI' ? { upiId: '' } : {})
          }
        : e
    );
    
    switch(type) {
      case 'diesel':
        setDieselExpenses(updateList(dieselExpenses));
        break;
      case 'bhatta':
        setBhattaExpenses(updateList(bhattaExpenses));
        break;
      case 'border':
        setBorderExpenses(updateList(borderExpenses));
        break;
      case 'other':
        setOtherExpenses(updateList(otherExpenses));
        break;
    }
  };

  // Calculate totals
  const calculateTotal = (expenses) => {
    return expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  };

  const totalDiesel = calculateTotal(dieselExpenses);
  const totalBhatta = calculateTotal(bhattaExpenses);
  const totalBorder = calculateTotal(borderExpenses);
  const totalOther = calculateTotal(otherExpenses);
  
  const totalExpenses = totalDiesel + totalBhatta + totalBorder + totalOther;
  
  const salary = parseFloat(driverSalary) || 0;
  const dieselDed = parseFloat(dieselDeduction) || 0;
  const otherDed = parseFloat(otherDeductions) || 0;
  
  // Diesel efficiency calculations
  const km = parseFloat(totalKM) || 0;
  const desiredAvg = parseFloat(desiredAverage) || 0;
  const actualAvg = parseFloat(averageGiven) || 0;
  const dieselTaken = parseFloat(totalDieselTaken) || 0;
  
  // Expected diesel based on desired average
  const expectedDiesel = desiredAvg > 0 ? (km / desiredAvg) : 0;
  
  // Extra diesel consumed
  const extraDiesel = dieselTaken - expectedDiesel;
  
  // Calculate average diesel rate from expenses
  const avgDieselRate = dieselTaken > 0 ? (totalDiesel / dieselTaken) : 0;
  
  // Extra diesel cost (auto-calculated)
  const extraDieselCost = extraDiesel > 0 ? (extraDiesel * avgDieselRate) : 0;
  
  // Actual average achieved
  const actualAverageAchieved = dieselTaken > 0 ? (km / dieselTaken) : 0;
  
  const totalDeductions = dieselDed + otherDed;
  const balancePayment = salary - totalDeductions;
  
  const avgPerKM = totalKM ? (totalExpenses / parseFloat(totalKM)).toFixed(2) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!selectedTrip) {
      alert('Please select a trip first!');
      return;
    }
    
    const trip = trips.find(t => t.id.toString() === selectedTrip);
    
    // Get branch ID from trip's manifest
    const manifests = JSON.parse(localStorage.getItem('manifests') || '[]');
    const manifest = manifests.find(m => m.id === trip.manifestId);
    const branchId = manifest?.branch || trip.branch || null;
    
    const expensesData = {
      totalKM: totalKM,
      driverSalary: driverSalary,
      driverSalaryPaymentMode: driverSalaryPaymentMode,
      driverSalaryUpiId: driverSalaryPaymentMode === 'UPI' ? String(driverSalaryUpiId || '').trim() : '',
      desiredAverage: desiredAverage,
      averageGiven: averageGiven,
      totalDieselTaken: totalDieselTaken,
      diesel: dieselExpenses,
      bhatta: bhattaExpenses,
      border: borderExpenses,
      other: otherExpenses,
      dieselDeduction: dieselDeduction,
      otherDeductions: otherDeductions,
      totalExpenses: totalExpenses,
      balancePayment: balancePayment,
      avgPerKM: avgPerKM,
      expectedDiesel: expectedDiesel,
      extraDiesel: extraDiesel,
      extraDieselCost: extraDieselCost,
      actualAverageAchieved: actualAverageAchieved,
      lastUpdated: new Date().toISOString()
    };
    
    const updatedTrip = {
      ...trip,
      expenses: expensesData
    };
    
    const updatedTrips = trips.map(t => 
      t.id.toString() === selectedTrip ? updatedTrip : t
    );
    
    localStorage.setItem('trips', JSON.stringify(updatedTrips));
    setTrips(updatedTrips);
    
    // Calculate on-account amounts
    const onAccountBhatta = bhattaExpenses
      .filter(e => e.paymentMode === 'On Account')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const onAccountOther = otherExpenses
      .filter(e => e.paymentMode === 'On Account')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    
    const onAccountSalary = driverSalaryPaymentMode === 'On Account' ? salary : 0;
    const totalOnAccount = onAccountSalary + onAccountBhatta + onAccountOther;
    
    // Create ledger entries for salary and bhatta if they exist
    if (branchId && (salary > 0 || totalBhatta > 0 || totalOnAccount > 0)) {
      try {
        createDriverSalaryLedger(
          updatedTrip, 
          salary, 
          totalBhatta, 
          branchId,
          driverSalaryPaymentMode,
          bhattaExpenses,
          otherExpenses
        );
      } catch (error) {
        console.error('Error creating ledger entries:', error);
      }
    }
    
    alert(`✅ Trip Expenses Saved!\n\nTrip: ${trip.tripNumber}\nTotal Expenses: ₹${totalExpenses.toFixed(2)}\nDriver Balance: ₹${balancePayment.toFixed(2)}\nAverage per KM: ₹${avgPerKM}${(salary > 0 || totalBhatta > 0) ? '\n\nLedger entries created for salary/bhatta.' : ''}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 p-6">
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
          border-left: 4px solid #8b5cf6;
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
          border-color: #8b5cf6;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
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
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
        }
        
        .btn-add {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-danger {
          background: #ef4444;
          color: white;
          padding: 6px 12px;
        }
        
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
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
        
        .expense-item {
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          position: relative;
        }
        
        .expense-item:hover {
          border-color: #8b5cf6;
        }
        
        .summary-card {
          background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
          color: white;
          border-radius: 12px;
          padding: 24px;
          margin-top: 24px;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 12px 0;
          border-bottom: 1px solid rgba(255,255,255,0.2);
        }
        
        .summary-row:last-child {
          border-bottom: none;
          font-size: 1.3rem;
          font-weight: 700;
          padding-top: 16px;
          margin-top: 8px;
          border-top: 2px solid rgba(255,255,255,0.3);
        }
        
        .stat-box {
          background: white;
          border-radius: 8px;
          padding: 16px;
          text-align: center;
          border: 2px solid #e2e8f0;
        }
        
        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #8b5cf6;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 0.85rem;
          color: #64748b;
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
            💰 Trip Expenses & Driver Payment
          </h1>
          <p className="text-slate-600 text-lg">Comprehensive expense tracking and driver salary calculation</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Trip Selection */}
          <div className="form-section">
            <h2 className="section-title">
              <Truck size={20} />
              Select Trip
            </h2>
            
            <div className="input-group">
              <label>Trip *</label>
              <select
                value={selectedTrip || ''}
                onChange={(e) => setSelectedTrip(e.target.value)}
                required
              >
                <option value="">-- Select Trip --</option>
                {trips.map(trip => (
                  <option key={trip.id} value={trip.id}>
                    {trip.tripNumber} - {trip.origin} to {trip.destination} ({trip.vehicleNumber})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedTrip && (
            <>
              {/* Basic Details */}
              <div className="form-section">
                <h2 className="section-title">
                  <TrendingUp size={20} />
                  Trip & Salary Details
                </h2>
                
                <div className="grid-2">
                  <div className="input-group">
                    <label>Total KM Running (Manual Entry) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalKM}
                      onChange={(e) => setTotalKM(e.target.value)}
                      placeholder="Enter total kilometers"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Driver Salary (Manual Entry) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={driverSalary}
                      onChange={(e) => setDriverSalary(e.target.value)}
                      placeholder="Enter driver salary"
                      required
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Salary Payment Mode *</label>
                    <select
                      value={driverSalaryPaymentMode}
                      onChange={(e) => {
                        const v = e.target.value;
                        setDriverSalaryPaymentMode(v);
                        if (v !== 'UPI') setDriverSalaryUpiId('');
                      }}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: '0.95rem'
                      }}
                    >
                      <option value="Cash">Cash (Paid Immediately)</option>
                      <option value="UPI">UPI</option>
                      <option value="On Account">On Account (Pay to Driver Later)</option>
                    </select>
                    {driverSalaryPaymentMode === 'UPI' && (
                      <div style={{ marginTop: '10px' }}>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                          UPI ID / Mobile No. *
                        </label>
                        <input
                          type="text"
                          value={driverSalaryUpiId}
                          onChange={(e) => setDriverSalaryUpiId(e.target.value)}
                          placeholder="example@upi or 9876543210"
                          required
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            fontSize: '0.95rem'
                          }}
                        />
                      </div>
                    )}
                    {driverSalaryPaymentMode === 'On Account' && (
                      <small style={{ display: 'block', marginTop: '4px', color: '#f59e0b', fontSize: '0.75rem' }}>
                        ⚠️ This salary will be added to driver's account and can be settled later.
                      </small>
                    )}
                  </div>
                </div>
              </div>

              {/* Diesel Efficiency Section */}
              <div className="form-section" style={{ borderLeftColor: '#f59e0b' }}>
                <h2 className="section-title">
                  <Fuel size={20} />
                  ⚡ Diesel Efficiency Tracking
                </h2>
                
                <div className="grid-3">
                  <div className="input-group">
                    <label>Desired Average (km/liter) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={desiredAverage}
                      onChange={(e) => setDesiredAverage(e.target.value)}
                      placeholder="Expected km per liter (e.g., 6.5)"
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Target fuel efficiency
                    </small>
                  </div>
                  
                  <div className="input-group">
                    <label>Average Given (km/liter)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={averageGiven}
                      onChange={(e) => setAverageGiven(e.target.value)}
                      placeholder="Actual km per liter achieved"
                    />
                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Actual performance (optional)
                    </small>
                  </div>
                  
                  <div className="input-group">
                    <label>Total Diesel Taken (Liters) *</label>
                    <input
                      type="number"
                      step="0.01"
                      value={totalDieselTaken}
                      onChange={(e) => setTotalDieselTaken(e.target.value)}
                      placeholder="Total liters filled"
                      required
                    />
                    <small style={{ color: '#64748b', fontSize: '0.8rem' }}>
                      Sum of all diesel filled
                    </small>
                  </div>
                </div>
                
                {/* Diesel Calculations Display */}
                {totalKM && desiredAverage && totalDieselTaken && (
                  <div style={{ 
                    marginTop: '20px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                    borderRadius: '12px',
                    border: '2px solid #f59e0b'
                  }}>
                    <h3 style={{ 
                      fontSize: '1rem',
                      fontWeight: '700',
                      marginBottom: '16px',
                      color: '#92400e'
                    }}>
                      🔍 Diesel Efficiency Analysis
                    </h3>
                    
                    <div className="grid-4" style={{ gap: '12px' }}>
                      <div style={{ 
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                          Expected Diesel
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#0891b2' }}>
                          {expectedDiesel.toFixed(2)} L
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                          Actual Diesel
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#8b5cf6' }}>
                          {dieselTaken.toFixed(2)} L
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center',
                        border: extraDiesel > 0 ? '2px solid #ef4444' : '2px solid #10b981'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                          Extra/Saved Diesel
                        </div>
                        <div style={{ 
                          fontSize: '1.3rem',
                          fontWeight: '700',
                          color: extraDiesel > 0 ? '#ef4444' : '#10b981'
                        }}>
                          {extraDiesel > 0 ? '+' : ''}{extraDiesel.toFixed(2)} L
                        </div>
                      </div>
                      
                      <div style={{ 
                        background: 'white',
                        padding: '12px',
                        borderRadius: '8px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '4px' }}>
                          Actual Average
                        </div>
                        <div style={{ fontSize: '1.3rem', fontWeight: '700', color: '#f59e0b' }}>
                          {actualAverageAchieved.toFixed(2)} km/L
                        </div>
                      </div>
                    </div>
                    
                    {extraDiesel > 0 && (
                      <div style={{ 
                        marginTop: '16px',
                        padding: '12px',
                        background: '#fee2e2',
                        borderRadius: '8px',
                        border: '2px solid #fecaca',
                        color: '#991b1b',
                        fontSize: '0.9rem'
                      }}>
                        <strong>⚠️ Extra Diesel Cost:</strong> ₹{extraDieselCost.toFixed(2)}
                        <br/>
                        <small>(Average Rate: ₹{avgDieselRate.toFixed(2)}/liter)</small>
                        <br/>
                        <small style={{ fontSize: '0.8rem' }}>
                          💡 Consider adding this to deductions
                        </small>
                      </div>
                    )}
                    
                    {extraDiesel <= 0 && (
                      <div style={{ 
                        marginTop: '16px',
                        padding: '12px',
                        background: '#d1fae5',
                        borderRadius: '8px',
                        border: '2px solid #a7f3d0',
                        color: '#065f46',
                        fontSize: '0.9rem'
                      }}>
                        <strong>✅ Great Performance!</strong> Driver achieved better than expected average.
                        <br/>
                        <small>Diesel saved: {Math.abs(extraDiesel).toFixed(2)} liters (₹{Math.abs(extraDieselCost).toFixed(2)})</small>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Diesel Expenses */}
              <div className="form-section">
                <h2 className="section-title">
                  <Fuel size={20} />
                  ⛽ Diesel Expenses
                </h2>
                
                {dieselExpenses.map((expense, index) => (
                  <div key={expense.id} className="expense-item">
                    <div style={{ 
                      position: 'absolute',
                      top: '12px',
                      right: '12px'
                    }}>
                      <button 
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeExpense('diesel', expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid-4">
                      <div className="input-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => updateExpense('diesel', expense.id, 'date', e.target.value)}
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={expense.location}
                          onChange={(e) => updateExpense('diesel', expense.id, 'location', e.target.value)}
                          placeholder="Petrol pump location"
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Amount (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpense('diesel', expense.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => updateExpense('diesel', expense.id, 'description', e.target.value)}
                          placeholder="Liters, receipt no., etc."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-add" onClick={() => addExpense('diesel')}>
                  <Plus size={18} />
                  Add Diesel Entry
                </button>
                
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: '#065f46'
                }}>
                  Total Diesel: ₹{totalDiesel.toFixed(2)}
                </div>
              </div>

              {/* Bhatta (Allowances) */}
              <div className="form-section">
                <h2 className="section-title">
                  <DollarSign size={20} />
                  💵 Bhatta (Driver Allowances)
                </h2>
                
                {bhattaExpenses.map((expense, index) => (
                  <div key={expense.id} className="expense-item">
                    <div style={{ 
                      position: 'absolute',
                      top: '12px',
                      right: '12px'
                    }}>
                      <button 
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeExpense('bhatta', expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid-4">
                      <div className="input-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => updateExpense('bhatta', expense.id, 'date', e.target.value)}
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={expense.location}
                          onChange={(e) => updateExpense('bhatta', expense.id, 'location', e.target.value)}
                          placeholder="City/Place"
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Amount (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpense('bhatta', expense.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => updateExpense('bhatta', expense.id, 'description', e.target.value)}
                          placeholder="Food, accommodation, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="input-group" style={{ marginTop: '12px' }}>
                      <label>Payment Mode *</label>
                      <select
                        value={expense.paymentMode || 'Cash'}
                        onChange={(e) => updateExpense('bhatta', expense.id, 'paymentMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        <option value="Cash">Cash (Paid Immediately)</option>
                        <option value="UPI">UPI</option>
                        <option value="On Account">On Account (Pay to Driver Later)</option>
                      </select>
                      {expense.paymentMode === 'UPI' && (
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                            UPI ID / Mobile No. *
                          </label>
                          <input
                            type="text"
                            value={expense.upiId || ''}
                            onChange={(e) => updateExpense('bhatta', expense.id, 'upiId', e.target.value)}
                            placeholder="example@upi or 9876543210"
                            required
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>
                      )}
                      {expense.paymentMode === 'On Account' && (
                        <small style={{ display: 'block', marginTop: '4px', color: '#f59e0b', fontSize: '0.75rem' }}>
                          ⚠️ This amount will be added to driver's account and can be settled later against salary/bhatta.
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-add" onClick={() => addExpense('bhatta')}>
                  <Plus size={18} />
                  Add Bhatta Entry
                </button>
                
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: '#065f46'
                }}>
                  Total Bhatta: ₹{totalBhatta.toFixed(2)}
                </div>
              </div>

              {/* Border Expenses */}
              <div className="form-section">
                <h2 className="section-title">
                  <Package size={20} />
                  🚧 Border/Toll Expenses
                </h2>
                
                {borderExpenses.map((expense, index) => (
                  <div key={expense.id} className="expense-item">
                    <div style={{ 
                      position: 'absolute',
                      top: '12px',
                      right: '12px'
                    }}>
                      <button 
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeExpense('border', expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid-4">
                      <div className="input-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => updateExpense('border', expense.id, 'date', e.target.value)}
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={expense.location}
                          onChange={(e) => updateExpense('border', expense.id, 'location', e.target.value)}
                          placeholder="Border/Toll name"
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Amount (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpense('border', expense.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => updateExpense('border', expense.id, 'description', e.target.value)}
                          placeholder="Toll receipt, border tax, etc."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-add" onClick={() => addExpense('border')}>
                  <Plus size={18} />
                  Add Border/Toll Entry
                </button>
                
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: '#065f46'
                }}>
                  Total Border/Toll: ₹{totalBorder.toFixed(2)}
                </div>
              </div>

              {/* Other Expenses */}
              <div className="form-section">
                <h2 className="section-title">
                  <DollarSign size={20} />
                  📝 Other Expenses
                </h2>
                
                {otherExpenses.map((expense, index) => (
                  <div key={expense.id} className="expense-item">
                    <div style={{ 
                      position: 'absolute',
                      top: '12px',
                      right: '12px'
                    }}>
                      <button 
                        type="button"
                        className="btn btn-danger"
                        onClick={() => removeExpense('other', expense.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    
                    <div className="grid-4">
                      <div className="input-group">
                        <label>Date</label>
                        <input
                          type="date"
                          value={expense.date}
                          onChange={(e) => updateExpense('other', expense.id, 'date', e.target.value)}
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Location</label>
                        <input
                          type="text"
                          value={expense.location}
                          onChange={(e) => updateExpense('other', expense.id, 'location', e.target.value)}
                          placeholder="Location"
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Amount (₹) *</label>
                        <input
                          type="number"
                          step="0.01"
                          value={expense.amount}
                          onChange={(e) => updateExpense('other', expense.id, 'amount', e.target.value)}
                          placeholder="0.00"
                          required
                        />
                      </div>
                      
                      <div className="input-group">
                        <label>Description</label>
                        <input
                          type="text"
                          value={expense.description}
                          onChange={(e) => updateExpense('other', expense.id, 'description', e.target.value)}
                          placeholder="Repair, parking, etc."
                        />
                      </div>
                    </div>
                    
                    <div className="input-group" style={{ marginTop: '12px' }}>
                      <label>Payment Mode *</label>
                      <select
                        value={expense.paymentMode || 'Cash'}
                        onChange={(e) => updateExpense('other', expense.id, 'paymentMode', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '0.95rem'
                        }}
                      >
                        <option value="Cash">Cash (Paid Immediately)</option>
                        <option value="UPI">UPI</option>
                        <option value="On Account">On Account (Pay to Driver Later)</option>
                      </select>
                      {expense.paymentMode === 'UPI' && (
                        <div style={{ marginTop: '10px' }}>
                          <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                            UPI ID / Mobile No. *
                          </label>
                          <input
                            type="text"
                            value={expense.upiId || ''}
                            onChange={(e) => updateExpense('other', expense.id, 'upiId', e.target.value)}
                            placeholder="example@upi or 9876543210"
                            required
                            style={{
                              width: '100%',
                              padding: '10px 12px',
                              border: '2px solid #e2e8f0',
                              borderRadius: '8px',
                              fontSize: '0.95rem'
                            }}
                          />
                        </div>
                      )}
                      {expense.paymentMode === 'On Account' && (
                        <small style={{ display: 'block', marginTop: '4px', color: '#f59e0b', fontSize: '0.75rem' }}>
                          ⚠️ This amount will be added to driver's account and can be settled later against salary/bhatta.
                        </small>
                      )}
                    </div>
                  </div>
                ))}
                
                <button type="button" className="btn btn-add" onClick={() => addExpense('other')}>
                  <Plus size={18} />
                  Add Other Expense
                </button>
                
                <div style={{ 
                  marginTop: '16px',
                  padding: '12px 16px',
                  background: '#f0fdf4',
                  borderRadius: '8px',
                  border: '2px solid #10b981',
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: '#065f46'
                }}>
                  Total Other: ₹{totalOther.toFixed(2)}
                </div>
              </div>

              {/* Deductions */}
              <div className="form-section">
                <h2 className="section-title">
                  <Calculator size={20} />
                  ➖ Deductions from Driver Salary
                </h2>
                
                <div className="grid-2">
                  <div className="input-group">
                    <label>Diesel Deduction (Extra Diesel) (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={dieselDeduction}
                      onChange={(e) => setDieselDeduction(e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                  
                  <div className="input-group">
                    <label>Other Deductions (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={otherDeductions}
                      onChange={(e) => setOtherDeductions(e.target.value)}
                      placeholder="Advance, damages, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="summary-card">
                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '20px', textAlign: 'center' }}>
                  📊 Trip Expenses Summary
                </h2>
                
                <div className="grid-3" style={{ marginBottom: '24px' }}>
                  <div className="stat-box">
                    <div className="stat-value">₹{totalExpenses.toFixed(2)}</div>
                    <div className="stat-label">Total Expenses</div>
                  </div>
                  
                  <div className="stat-box">
                    <div className="stat-value">{totalKM || '0'} km</div>
                    <div className="stat-label">Total Distance</div>
                  </div>
                  
                  <div className="stat-box">
                    <div className="stat-value">₹{avgPerKM}</div>
                    <div className="stat-label">Average per KM</div>
                  </div>
                </div>
                
                {/* Diesel Efficiency Stats */}
                {totalDieselTaken && desiredAverage && (
                  <div style={{ 
                    marginBottom: '24px',
                    padding: '16px',
                    background: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    border: '2px solid rgba(255,255,255,0.3)'
                  }}>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '12px', fontWeight: '600' }}>
                      ⛽ Diesel Efficiency
                    </h3>
                    <div className="grid-4">
                      <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Expected</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                          {expectedDiesel.toFixed(2)} L
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Actual</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                          {dieselTaken.toFixed(2)} L
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Extra/Saved</div>
                        <div style={{ 
                          fontSize: '1.2rem',
                          fontWeight: '700',
                          color: extraDiesel > 0 ? '#fecaca' : '#86efac'
                        }}>
                          {extraDiesel > 0 ? '+' : ''}{extraDiesel.toFixed(2)} L
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.9 }}>Avg Achieved</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                          {actualAverageAchieved.toFixed(2)} km/L
                        </div>
                      </div>
                    </div>
                    {extraDiesel > 0 && (
                      <div style={{ 
                        marginTop: '12px',
                        padding: '8px 12px',
                        background: '#fee2e2',
                        borderRadius: '6px',
                        color: '#991b1b',
                        fontSize: '0.85rem',
                        fontWeight: '600'
                      }}>
                        💸 Extra Diesel Cost: ₹{extraDieselCost.toFixed(2)}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="summary-row">
                  <span>⛽ Diesel</span>
                  <span>₹{totalDiesel.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>💵 Bhatta</span>
                  <span>₹{totalBhatta.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>🚧 Border/Toll</span>
                  <span>₹{totalBorder.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>📝 Other</span>
                  <span>₹{totalOther.toFixed(2)}</span>
                </div>
                
                <div className="summary-row">
                  <span>TOTAL EXPENSES</span>
                  <span>₹{totalExpenses.toFixed(2)}</span>
                </div>
                
                <div style={{ 
                  marginTop: '24px',
                  paddingTop: '24px',
                  borderTop: '2px solid rgba(255,255,255,0.3)'
                }}>
                  <div className="summary-row">
                    <span>💰 Driver Salary</span>
                    <span>₹{salary.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>➖ Diesel Deduction</span>
                    <span>₹{dieselDed.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>➖ Other Deductions</span>
                    <span>₹{otherDed.toFixed(2)}</span>
                  </div>
                  
                  <div className="summary-row">
                    <span>💳 BALANCE TO PAY DRIVER</span>
                    <span>₹{balancePayment.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '14px 40px' }}>
                  <Save size={20} />
                  Save Trip Expenses
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
