import React, { useEffect } from 'react';
import { 
  useFTLLRBookings, 
  usePTLLRBookings, 
  useTrips, 
  usePODs, 
  useManifests, 
  useInvoices, 
  useStaff 
} from '../hooks/useDataSync';

const Dashboard = () => {
  const { data: ftlBookings, loading: ftlLoading } = useFTLLRBookings();
  const { data: ptlBookings, loading: ptlLoading } = usePTLLRBookings();
  const { data: trips, loading: tripsLoading } = useTrips();
  const { data: pods, loading: podsLoading } = usePODs();
  const { data: manifests, loading: manifestsLoading } = useManifests();
  const { data: invoices, loading: invoicesLoading } = useInvoices();
  const { data: staff, loading: staffLoading } = useStaff();

  const loading = ftlLoading || ptlLoading || tripsLoading || podsLoading || 
                  manifestsLoading || invoicesLoading || staffLoading;

  const stats = {
    ftlBookings: ftlBookings?.length || 0,
    ptlBookings: ptlBookings?.length || 0,
    trips: trips?.length || 0,
    pods: pods?.length || 0,
    manifests: manifests?.length || 0,
    invoices: invoices?.length || 0,
    staff: staff?.length || 0,
    tripSheets: 0, // TODO: Add tripSheets hook if needed
  };

  useEffect(() => {
    const handleDataUpdate = () => {
      // Data will auto-reload via hooks
    };
    window.addEventListener('dataUpdated', handleDataUpdate);
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate);
    };
  }, []);

  if (loading) {
    return <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>Loading dashboard data from Render.com...</div>;
  }

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
