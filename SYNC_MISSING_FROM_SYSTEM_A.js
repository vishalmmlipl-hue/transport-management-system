// Sync Missing Branches from System A to Server
// Run this on System A to sync the 2 extra branches

(async () => {
  console.log('🔄 Syncing Missing Branches from System A...\n');
  
  // Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  // Get branches from localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  
  console.log('Server has:', serverBranches.length, 'branches');
  console.log('localStorage has:', localBranches.length, 'branches');
  
  // Find branches NOT on server
  const missing = localBranches.filter(function(local) {
    return !serverBranches.find(function(server) {
      return server.branchCode === local.branchCode || 
             server.branchName === local.branchName;
    });
  });
  
  console.log('\nFound', missing.length, 'branches NOT on server:');
  missing.forEach(function(b) {
    console.log('  - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  if (missing.length === 0) {
    console.log('\n✅ All branches are already on server!');
    return;
  }
  
  console.log('\nSyncing to server...\n');
  
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
        console.error('  ❌ Failed:', result.error || 'Unknown error');
        // Show the error response
        const errorText = await response.text();
        console.error('  Error details:', errorText);
      }
    } catch (error) {
      console.error('  ❌ Error:', error.message);
    }
  }
  
  // Verify
  const verify = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verify.json();
  console.log('\n✅ Server now has:', verifyData.data.length, 'branches');
  
  // Update localStorage with server data
  localStorage.setItem('branches', JSON.stringify(verifyData.data));
  console.log('✅ Updated localStorage with server data');
  
  console.log('\n💡 Refresh System A to see updated branch list!');
  console.log('💡 Both systems should now show the same branches!');
})();
