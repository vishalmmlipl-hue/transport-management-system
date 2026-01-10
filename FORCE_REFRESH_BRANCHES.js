// Force Refresh Branches from Server
// Run this in browser console on the system showing deleted branches

(async () => {
  console.log('🔄 Force refreshing branches from server...');
  
  try {
    // Import sync service
    const syncService = (await import('./src/utils/sync-service')).default;
    
    // Load fresh branches from server
    const result = await syncService.load('branches');
    
    if (result.synced) {
      console.log('✅ Branches refreshed from server!');
      console.log('Total branches:', result.data.length);
      console.log('Active branches:', result.data.filter(b => b.status === 'Active').length);
      
      // Update localStorage
      localStorage.setItem('branches', JSON.stringify(result.data));
      
      // Trigger reload event
      window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
      
      console.log('✅ localStorage updated!');
      console.log('💡 Refresh the page to see updated branches');
    } else {
      console.warn('⚠️ Could not sync from server, using localStorage');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
