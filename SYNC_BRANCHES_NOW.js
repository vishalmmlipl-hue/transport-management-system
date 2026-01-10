// SYNC BRANCHES TO SERVER - Copy and paste this entire block

(async () => {
  console.log('🔄 Syncing branches to server...\n');
  
  // Step 1: Get branches from localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`📦 Found ${localBranches.length} branches in localStorage:`);
  localBranches.forEach(b => console.log(`   - ${b.branchName} (Code: ${b.branchCode})`));
  
  // Step 2: Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log(`\n🌐 Server has ${serverBranches.length} branches:`);
  serverBranches.forEach(b => console.log(`   - ${b.branchName} (Code: ${b.branchCode})`));
  
  // Step 3: Find branches NOT on server
  const missing = localBranches.filter(local => {
    const exists = serverBranches.find(server => 
      server.branchCode === local.branchCode || 
      server.branchName === local.branchName ||
      server.id === local.id
    );
    return !exists;
  });
  
  if (missing.length === 0) {
    console.log('\n✅ All branches are already on server!');
    return;
  }
  
  console.log(`\n⚠️ Found ${missing.length} branches NOT on server:`);
  missing.forEach(b => console.log(`   - ${b.branchName} (Code: ${b.branchCode})`));
  
  // Step 4: Sync each missing branch
  console.log('\n🔄 Syncing to server...\n');
  
  let synced = 0;
  let failed = 0;
  
  for (const branch of missing) {
    try {
      console.log(`   Syncing: ${branch.branchName}...`);
      
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
      
      const result = await response.json();
      
      if (result.success) {
        synced++;
        console.log(`   ✅ Success: ${branch.branchName}`);
      } else {
        failed++;
        console.error(`   ❌ Failed: ${branch.branchName}`, result);
      }
    } catch (error) {
      failed++;
      console.error(`   ❌ Error: ${branch.branchName}`, error.message);
    }
  }
  
  // Step 5: Verify
  console.log(`\n📊 Summary: ${synced} synced, ${failed} failed`);
  
  const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyResponse.json();
  console.log(`\n✅ Server now has: ${verifyData.data.length} branches`);
  
  if (verifyData.data.length > 0) {
    console.log('   Branches on server:');
    verifyData.data.forEach(b => {
      console.log(`     - ${b.branchName} (Code: ${b.branchCode})`);
    });
  }
  
  console.log('\n💡 Next: Refresh the page and check if branches appear on other system!');
})();
