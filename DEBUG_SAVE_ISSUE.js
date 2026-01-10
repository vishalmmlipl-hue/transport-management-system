// Debug Why Save Isn't Working
// Run this to see what happens when syncService.save is called

console.log('🔍 Debugging Save Issue...\n');

// Intercept syncService.save to see what's happening
(async () => {
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    
    console.log('✅ syncService loaded');
    
    // Test saving a branch
    const testBranch = {
      branchName: 'Debug Test ' + Date.now(),
      branchCode: 'DEBUG' + Date.now(),
      address: 'Test',
      city: 'Test',
      state: 'Test',
      status: 'Active'
    };
    
    console.log('\nTesting syncService.save...');
    console.log('Watch for detailed logs...\n');
    
    const result = await syncService.save('branches', testBranch);
    
    console.log('\nResult:', result);
    console.log('Synced?', result.synced);
    console.log('Fallback?', result.fallback);
    
    if (result.synced) {
      console.log('✅ syncService.save WORKED!');
      
      // Verify on server
      const check = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const checkData = await check.json();
      const found = checkData.data.find(b => b.branchName === testBranch.branchName);
      
      if (found) {
        console.log('✅ Verified: Branch IS on server!');
      } else {
        console.error('❌ Branch NOT on server despite synced=true!');
      }
    } else {
      console.error('❌ syncService.save FAILED - check logs above for error');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
