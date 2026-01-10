import { useEffect, useState } from 'react';
import syncService from '../utils/sync-service';

// Auto-sync component that syncs data between API and localStorage
export default function AutoDataSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(null);

  // Sync all data from API to localStorage
  const syncFromServer = async () => {
    setIsSyncing(true);
    try {
      const results = await syncService.syncAll();
      const allSynced = Object.values(results).every(r => r.synced);
      setServerAvailable(allSynced);
      setLastSyncTime(new Date());
      
      if (allSynced) {
        console.log('✅ Data synced from server - all systems now have latest data');
        // Trigger a custom event to notify components to reload
        window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
      } else {
        console.warn('⚠️ Some data synced from localStorage (server may be unavailable)');
      }
    } catch (error) {
      console.error('❌ Sync error:', error);
      setServerAvailable(false);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sync localStorage data to server
  const syncToServer = async () => {
    const storageKeys = [
      'lrBookings', 'ftlLRBookings', 'ptlLRBookings', 'manifests', 'trips',
      'invoices', 'pods', 'clients', 'tbbClients', 'branches', 'cities',
      'vehicles', 'drivers', 'staff', 'users', 'accounts', 'expenseTypes',
      'branchExpenses', 'marketVehicleVendors', 'otherVendors', 'ftlInquiries'
    ];

    let syncedCount = 0;
    let failedCount = 0;

    for (const key of storageKeys) {
      try {
        const localData = JSON.parse(localStorage.getItem(key) || '[]');
        if (localData.length > 0) {
          // Try to sync each item
          for (const item of localData) {
            try {
              await syncService.save(key, item, !!item.id, item.id);
              syncedCount++;
            } catch (error) {
              failedCount++;
              console.warn(`Failed to sync ${key} item ${item.id}:`, error);
            }
          }
        }
      } catch (error) {
        console.error(`Error syncing ${key}:`, error);
        failedCount++;
      }
    }

    if (syncedCount > 0) {
      console.log(`✅ Synced ${syncedCount} items to server`);
    }
    if (failedCount > 0) {
      console.warn(`⚠️ Failed to sync ${failedCount} items`);
    }
  };

  useEffect(() => {
    // Check server health on mount
    const checkServer = async () => {
      const healthy = await syncService.checkServerHealth();
      setServerAvailable(healthy);
      
      if (healthy) {
        // If server is available, sync from server first
        await syncFromServer();
        // Then sync local changes to server
        await syncToServer();
      } else {
        console.warn('⚠️ Database server not available, using localStorage only');
      }
    };

    checkServer();

    // Auto-sync every 10 seconds (more frequent for better sync)
    const interval = setInterval(async () => {
      const healthy = await syncService.checkServerHealth();
      if (healthy) {
        await syncFromServer();
        await syncToServer();
      }
    }, 10000); // 10 seconds - sync more frequently

    // Listen for data updates
    const handleDataUpdate = () => {
      if (serverAvailable) {
        syncToServer();
      }
    };

    window.addEventListener('dataUpdated', handleDataUpdate);
    window.addEventListener('storage', handleDataUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('dataUpdated', handleDataUpdate);
      window.removeEventListener('storage', handleDataUpdate);
    };
  }, []);

  // Optional: Show sync status in UI (commented out by default)
  if (false) { // Set to true to show sync status
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: serverAvailable ? '#10b981' : '#ef4444',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '0.85rem',
        zIndex: 9999
      }}>
        {isSyncing ? '🔄 Syncing...' : serverAvailable ? '✅ Server Connected' : '⚠️ Offline Mode'}
        {lastSyncTime && (
          <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
            Last sync: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>
    );
  }

  return null; // Component doesn't render anything by default
}

