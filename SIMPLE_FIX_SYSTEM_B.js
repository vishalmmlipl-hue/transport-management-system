// Simple Fix for System B - No template literals
// Copy this ENTIRE block into console on System B

(async () => {
  console.log('🔧 Force Reloading System B...\n');
  
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log('Server has: ' + serverBranches.length + ' branches');
  
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('✅ localStorage updated');
  
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    const active = (result.data || []).filter(function(b) {
      return b.status === 'Active' || !b.status;
    });
    console.log('Active branches: ' + active.length);
  } catch (error) {
    console.error('Error:', error);
  }
  
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('✅ Triggered reload event');
  console.log('Reloading page in 2 seconds...');
  
  setTimeout(function() {
    window.location.reload();
  }, 2000);
})();
