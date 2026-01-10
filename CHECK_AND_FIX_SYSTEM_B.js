// Check Server Branches and Fix System B
// Run this on System B to see what's on server and sync

(async () => {
  console.log('🔍 Checking Server and Fixing System B...\n');
  
  // Step 1: Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('📊 Server has', serverBranches.length, 'branches:');
  serverBranches.forEach(function(b) {
    console.log(`   - ${b.branchName} (ID: ${b.id}, Code: ${b.branchCode}, Status: ${b.status || 'N/A'})`);
  });
  
  // Step 2: Check localStorage on System B
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('\n📦 System B localStorage has', localBranches.length, 'branches:');
  localBranches.forEach(function(b) {
    console.log(`   - ${b.branchName} (ID: ${b.id})`);
  });
  
  // Step 3: Update localStorage with server data
  console.log('\n🔄 Updating System B localStorage with server data...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ Updated');
  
  // Step 4: Filter Active branches (what should display)
  const activeBranches = serverBranches.filter(function(b) {
    return b.status === 'Active' || !b.status || b.status === undefined;
  });
  console.log('\n✅ Active branches (should display):', activeBranches.length);
  activeBranches.forEach(function(b) {
    console.log(`   - ${b.branchName}`);
  });
  
  // Step 5: Trigger reload
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('\n✅ Triggered reload event');
  
  console.log('\n💡 Refresh System B (F5) to see', activeBranches.length, 'branches!');
  console.log('💡 System B should now match the server!');
})();
