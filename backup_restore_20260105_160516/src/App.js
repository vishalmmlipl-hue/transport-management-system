import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import FTLLRBooking from './components/FTLLRBooking';
import PTLLRBooking from './components/PTLLRBooking';
import SearchLR from './components/SearchLR';
import ModifyLR from './components/ModifyLR';
import Manifest from './components/Manifest';
import InvoiceCreation from './components/InvoiceCreation';
import TripManagement from './components/TripManagement';
import StaffMaster from './components/StaffMaster';
import CreatePOD from './components/CreatePOD';
import LRTracking from './components/LRTracking';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const tabs = [
    { id: 'dashboard', label: '🏠 Dashboard' },
    { id: 'ftl', label: 'FTL LR Booking' },
    { id: 'ptl', label: 'PTL LR Booking' },
    { id: 'search', label: 'Search LR' },
    { id: 'modify', label: 'Modify LR' },
    { id: 'manifest', label: 'Manifest' },
    { id: 'invoice', label: 'Invoice' },
    { id: 'trip', label: 'Trip Management' },
    { id: 'staff', label: 'Staff Master' },
    { id: 'pod', label: 'Create POD' },
    { id: 'tracking', label: 'LR Tracking' },
  ];

  // Listen for navigation events from Dashboard
  useEffect(() => {
    const handleNavigate = (event) => {
      setActiveTab(event.detail);
    };
    window.addEventListener('navigateToTab', handleNavigate);
    return () => window.removeEventListener('navigateToTab', handleNavigate);
  }, []);

  return (
    <div className="App" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <div style={{ 
        borderBottom: '2px solid #ddd', 
        marginBottom: '20px',
        backgroundColor: '#f8f9fa',
        overflowX: 'auto',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          display: 'flex', 
          gap: '0',
          minWidth: 'fit-content'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '15px 20px',
                border: 'none',
                backgroundColor: activeTab === tab.id ? '#007bff' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                borderBottom: activeTab === tab.id ? '3px solid #0056b3' : '3px solid transparent',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'ftl' && <FTLLRBooking />}
      {activeTab === 'ptl' && <PTLLRBooking />}
      {activeTab === 'search' && <SearchLR />}
      {activeTab === 'modify' && <ModifyLR />}
      {activeTab === 'manifest' && <Manifest />}
      {activeTab === 'invoice' && <InvoiceCreation />}
      {activeTab === 'trip' && <TripManagement />}
      {activeTab === 'staff' && <StaffMaster />}
      {activeTab === 'pod' && <CreatePOD />}
      {activeTab === 'tracking' && <LRTracking />}
    </div>
  );
}

export default App;
