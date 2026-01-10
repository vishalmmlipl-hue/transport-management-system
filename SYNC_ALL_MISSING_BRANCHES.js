// Sync All Missing Branches to Server
// Run this to sync all branches from localStorage to server

(async () => {
  console.log('🔄 Syncing All Missing Branches...\n');
  
  // Get branches from localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('localStorage has:', localBranches.length, 'branches');
  
  // Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log('Server has:', serverBranches.length, 'branches\n');
  
  // Find branches NOT on server
  const missing = localBranches.filter(function(local) {
    return !serverBranches.find(function(server) {
      return server.branchCode === local.branchCode || 
             server.branchName === local.branchName ||
             server.id === local.id;
    });
  });
  
  if (missing.length === 0) {
    console.log('✅ All branches are already on server!');
    return;
  }
  
  console.log('Found', missing.length, 'branches NOT on server:');
  missing.forEach(function(b) {
    console.log('  - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  console.log('\n🔄 Syncing to server...\n');
  
  let synced = 0;
  let failed = 0;
  
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
        synced++;
        console.log('  ✅ Synced:', branch.branchName);
      } else {
        failed++;
        console.error('  ❌ Failed:', branch.branchName, result);
      }
    } catch (error) {
      failed++;
      console.error('  ❌ Error:', branch.branchName, error.message);
    }
  }
  
  console.log('\n📊 Summary:');
  console.log('  ✅ Synced:', synced);
  console.log('  ❌ Failed:', failed);
  
  // Verify
  const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyResponse.json();
  console.log('\n✅ Server now has:', verifyData.data.length, 'branches');
  
  console.log('\n💡 Next: Refresh both systems to see all branches!');
})();
