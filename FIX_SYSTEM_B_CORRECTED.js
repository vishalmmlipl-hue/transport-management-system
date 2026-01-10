// Fix System B - CORRECTED VERSION
// Copy and paste this ENTIRE block into console on System B

(async () => {
  console.log('🔧 Fixing System B...\n');
  
  // Check server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log(`Server has: ${serverBranches.length} branches`);
  
  // Force update localStorage
  console.log('\nUpdating localStorage...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('✅ localStorage updated');
  
  // Test syncService
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    console.log('\nsyncService result:');
    console.log('  Synced?', result.synced);
    console.log('  Data count:', result.data?.length || 0);
    
    const active = (result.data || []).filter(b => 
      b.status === 'Active' || !b.status
    );
    console.log(`  Active branches: ${active.length}`);
  } catch (error) {
    console.error('Error:', error);
  }
  
  console.log('\n✅ Done! Now refresh the page.');
})();
