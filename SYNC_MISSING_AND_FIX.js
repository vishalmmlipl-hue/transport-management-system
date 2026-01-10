// Sync Missing Branches and Diagnose Save Issue
// Run this to sync missing branches and see why new ones aren't saving

(async () => {
  console.log('🔄 Syncing Missing Branches...\n');
  
  // Get branches from both sources
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  
  console.log('Server:', serverBranches.length, 'branches');
  console.log('localStorage:', localBranches.length, 'branches');
  
  // Find missing
  const missing = localBranches.filter(function(local) {
    return !serverBranches.find(function(server) {
      return server.branchCode === local.branchCode || 
             server.branchName === local.branchName;
    });
  });
  
  console.log('\nMissing branches:', missing.length);
  missing.forEach(function(b) {
    console.log('  - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Sync missing
  if (missing.length > 0) {
    console.log('\nSyncing...\n');
    for (let i = 0; i < missing.length; i++) {
      const branch = missing[i];
      try {
        console.log('Syncing:', branch.branchName + '...');
        const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branch)
        });
        const result = await response.json();
        if (result.success) {
          console.log('  ✅ Synced');
        } else {
          console.error('  ❌ Failed:', result);
        }
      } catch (error) {
        console.error('  ❌ Error:', error.message);
      }
    }
  }
  
  // Verify
  const verify = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verify.json();
  console.log('\n✅ Server now has:', verifyData.data.length, 'branches');
  
  console.log('\n💡 Next: Create a NEW branch and check Network tab');
  console.log('   Look for POST request to /api/branches');
  console.log('   Check if it succeeds (200) or fails (400/500)');
})();
