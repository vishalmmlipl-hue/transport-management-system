// Sync Remaining Branch from System A to Server
// Run this on System A to sync the 1 remaining branch

(async () => {
  console.log('🔄 Syncing Remaining Branch to Server...\n');
  
  // Get branch from System A localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('System A has:', localBranches.length, 'branches');
  
  if (localBranches.length === 0) {
    console.log('❌ No branches in System A to sync!');
    return;
  }
  
  localBranches.forEach(function(b) {
    console.log('  - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Sync each branch to server
  console.log('\nSyncing to server...\n');
  
  for (let i = 0; i < localBranches.length; i++) {
    const branch = localBranches[i];
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
        console.error('  ❌ Failed:', result.error || 'Unknown error');
      }
    } catch (error) {
      console.error('  ❌ Error:', error.message);
    }
  }
  
  // Verify
  const verify = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verify.json();
  console.log('\n✅ Server now has:', verifyData.data.length, 'branches');
  
  if (verifyData.data.length > 0) {
    console.log('Branches on server:');
    verifyData.data.forEach(function(b) {
      console.log('  - ' + b.branchName);
    });
  }
  
  console.log('\n💡 Now run the sync script on System B!');
})();
