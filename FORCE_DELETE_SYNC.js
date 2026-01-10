// Force Delete Sync - Run this on System B after deletions
// This will reload fresh data from server

(async () => {
  console.log('🔄 Force Reloading from Server After Deletions...\n');
  
  // Get fresh data from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('Server has:', serverBranches.length, 'branches');
  serverBranches.forEach(function(b) {
    console.log('  - ' + b.branchName + ' (ID: ' + b.id + ')');
  });
  
  // Update localStorage with server data
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('\n✅ Updated localStorage');
  
  // Trigger reload
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('✅ Triggered reload event');
  
  console.log('\n💡 Refresh System B (F5) to see updated branch list!');
  console.log('💡 System B should now show:', serverBranches.length, 'branches');
})();
