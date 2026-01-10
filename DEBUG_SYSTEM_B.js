// Debug System B - Find Why Only 3 Branches Show
// Run this on System B

(async () => {
  console.log('🔍 Debugging System B...\n');
  
  // Step 1: Check server
  console.log('1️⃣ Server Data:');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('   Total branches on server:', serverBranches.length);
  serverBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ', Status: "' + (b.status || 'MISSING') + '")');
  });
  
  // Step 2: Check localStorage
  console.log('\n2️⃣ localStorage Data:');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   Total branches in localStorage:', localBranches.length);
  localBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ', Status: "' + (b.status || 'MISSING') + '")');
  });
  
  // Step 3: Filter Active (what should display)
  console.log('\n3️⃣ Active Branches (what should display):');
  const activeOnServer = serverBranches.filter(function(b) {
    return b.status === 'Active' || !b.status || b.status === undefined;
  });
  console.log('   Active on server:', activeOnServer.length);
  activeOnServer.forEach(function(b) {
    console.log('     - ' + b.branchName);
  });
  
  const activeInLocal = localBranches.filter(function(b) {
    return b.status === 'Active' || !b.status || b.status === undefined;
  });
  console.log('   Active in localStorage:', activeInLocal.length);
  
  // Step 4: Test syncService.load
  console.log('\n4️⃣ Testing syncService.load...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    console.log('   Result:', result);
    console.log('   Synced?', result.synced);
    console.log('   Data count:', result.data?.length || 0);
    
    if (result.data) {
      const active = result.data.filter(function(b) {
        return b.status === 'Active' || !b.status || b.status === undefined;
      });
      console.log('   Active branches in result:', active.length);
      active.forEach(function(b) {
        console.log('     - ' + b.branchName);
      });
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Step 5: Update localStorage with server data
  console.log('\n5️⃣ Updating localStorage with ALL server branches...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ Updated');
  
  console.log('\n💡 Check which branches have status !== "Active"');
  console.log('💡 Refresh System B and check console for loadBranches logs');
})();
