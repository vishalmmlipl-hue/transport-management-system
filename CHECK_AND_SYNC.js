// Check What's on Server vs localStorage, Then Sync
// Run this to see the difference and sync missing data

(async () => {
  console.log('🔍 Checking Server vs localStorage...\n');
  
  // Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  // Get branches from localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  
  console.log('📊 Comparison:');
  console.log(`   Server has: ${serverBranches.length} branches`);
  console.log(`   localStorage has: ${localBranches.length} branches`);
  
  if (serverBranches.length > 0) {
    console.log('\n   Branches on SERVER:');
    serverBranches.forEach(b => {
      console.log(`     - ${b.branchName} (ID: ${b.id}, Code: ${b.branchCode})`);
    });
  }
  
  if (localBranches.length > 0) {
    console.log('\n   Branches in localStorage:');
    localBranches.forEach(b => {
      console.log(`     - ${b.branchName} (ID: ${b.id}, Code: ${b.branchCode})`);
    });
  }
  
  // Find branches in localStorage that are NOT on server
  const missingOnServer = localBranches.filter(local => {
    return !serverBranches.find(server => 
      server.id === local.id || 
      server.branchCode === local.branchCode ||
      server.branchName === local.branchName
    );
  });
  
  if (missingOnServer.length > 0) {
    console.log(`\n⚠️ Found ${missingOnServer.length} branches in localStorage that are NOT on server:`);
    missingOnServer.forEach(b => {
      console.log(`   - ${b.branchName} (Code: ${b.branchCode})`);
    });
    
    console.log('\n🔄 Syncing missing branches to server...');
    
    let synced = 0;
    let failed = 0;
    
    for (const branch of missingOnServer) {
      try {
        // Remove id so server can assign a new one, or keep it if server supports it
        const branchToSync = {
          ...branch,
          // Keep the id - server should handle it
        };
        
        console.log(`   Syncing: ${branch.branchName}...`);
        
        const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchToSync)
        });
        
        const result = await response.json();
        
        if (result.success) {
          synced++;
          console.log(`   ✅ Synced: ${branch.branchName}`);
        } else {
          failed++;
          console.error(`   ❌ Failed: ${branch.branchName}`, result);
        }
      } catch (error) {
        failed++;
        console.error(`   ❌ Error syncing ${branch.branchName}:`, error);
      }
    }
    
    console.log(`\n✅ Sync Complete: ${synced} synced, ${failed} failed`);
    
    // Verify
    const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const verifyData = await verifyResponse.json();
    console.log(`\n📊 Server now has: ${verifyData.data.length} branches`);
    
  } else {
    console.log('\n✅ All branches are already on server!');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Refresh the page to reload from server');
  console.log('   2. Create a new branch and watch console logs');
  console.log('   3. Check if new branch appears on server');
})();
