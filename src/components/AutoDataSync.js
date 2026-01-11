import { useEffect, useState } from 'react';
import syncService from '../utils/sync-service';

// Auto-sync component that syncs data between API and localStorage
export default function AutoDataSync() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [serverAvailable, setServerAvailable] = useState(null);

  // DISABLED: Sync all data from API to localStorage
  // This was causing browser-specific data issues
  // Components should use API hooks directly, not localStorage
  const syncFromServer = async () => {
    console.log('⏭️  syncFromServer disabled - components use API hooks directly');
    // Do not sync to localStorage - this causes browser-specific data
    // Components should use useBranches(), useCities(), etc. hooks
    setServerAvailable(true);
    // Trigger reload event so components refresh from their hooks
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    return;
  };

  // DISABLED: Sync localStorage data to server
  // This was causing browser-specific data issues
  // All data should now go directly to Render.com API, not through localStorage
  const syncToServer = async () => {
    console.log('⏭️  syncToServer disabled - data goes directly to Render.com API');
    // Do not sync from localStorage - this causes browser-specific data
    // Components should use API hooks directly
    return;
  };

  useEffect(() => {
    // DISABLED: Auto-sync to localStorage
    // This was causing browser-specific data issues
    // Components should use API hooks directly (useBranches, useCities, etc.)
    console.log('⏭️  AutoDataSync disabled - components use API hooks directly');
    setServerAvailable(true);
    
    // Just trigger reload event so components refresh from their hooks
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    
    // No interval, no localStorage syncing
    return () => {
      // Cleanup not needed
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

