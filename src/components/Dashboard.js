import React, { useState, useEffect } from 'react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    ftlBookings: 0,
    ptlBookings: 0,
    trips: 0,
    pods: 0,
    manifests: 0,
    invoices: 0,
    staff: 0,
    tripSheets: 0,
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000);
    const handleDataUpdate = () => {
      loadStats();
    };
    window.addEventListener('storage', handleDataUpdate);
    window.addEventListener('dataUpdated', handleDataUpdate);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleDataUpdate);
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  const loadStats = () => {
    try {
      setStats({
        ftlBookings: JSON.parse(localStorage.getItem('ftlLRBookings') || '[]').length,
        ptlBookings: JSON.parse(localStorage.getItem('ptlLRBookings') || '[]').length,
        trips: JSON.parse(localStorage.getItem('trips') || '[]').length,
        pods: JSON.parse(localStorage.getItem('pods') || '[]').length,
        manifests: JSON.parse(localStorage.getItem('manifests') || '[]').length,
        invoices: JSON.parse(localStorage.getItem('invoices') || '[]').length,
        staff: JSON.parse(localStorage.getItem('staffMaster') || '[]').length,
        tripSheets: JSON.parse(localStorage.getItem('tripSheets') || '[]').length,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ marginBottom: '30px', color: '#333' }}>Dashboard</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.ftlBookings}
          </div>
          <div style={{ color: '#666' }}>FTL LR Bookings</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.ptlBookings}
          </div>
          <div style={{ color: '#666' }}>PTL LR Bookings</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.trips}
          </div>
          <div style={{ color: '#666' }}>Trips</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.pods}
          </div>
          <div style={{ color: '#666' }}>PODs</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.manifests}
          </div>
          <div style={{ color: '#666' }}>Manifests</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.invoices}
          </div>
          <div style={{ color: '#666' }}>Invoices</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.staff}
          </div>
          <div style={{ color: '#666' }}>Staff</div>
        </div>

        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #ddd'
        }}>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333', marginBottom: '10px' }}>
            {stats.tripSheets}
          </div>
          <div style={{ color: '#666' }}>Trip Sheets</div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
