// Fix Delete Sync Issue
// Run this to check server and sync System B

(async () => {
  console.log('🔍 Checking Delete Sync Issue...\n');
  
  // Step 1: Check what's on server
  console.log('1️⃣ Checking server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('   Server has:', serverBranches.length, 'branches');
  serverBranches.forEach(function(b) {
    console.log(`     - ${b.branchName} (ID: ${b.id})`);
  });
  
  // Step 2: Check System A localStorage
  console.log('\n2️⃣ System A localStorage:');
  const localA = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   Has:', localA.length, 'branches');
  localA.forEach(function(b) {
    console.log(`     - ${b.branchName}`);
  });
  
  // Step 3: If server has more branches than System A, delete them from server
  if (serverBranches.length > localA.length) {
    console.log('\n3️⃣ Server has MORE branches than System A!');
    console.log('   Deleting extra branches from server...\n');
    
    // Find branches on server that aren't in System A
    const toDelete = serverBranches.filter(function(serverBranch) {
      return !localA.find(function(localBranch) {
        return localBranch.id === serverBranch.id || 
               localBranch.branchCode === serverBranch.branchCode;
      });
    });
    
    console.log('   Found', toDelete.length, 'branches to delete:');
    toDelete.forEach(function(b) {
      console.log(`     - ${b.branchName} (ID: ${b.id})`);
    });
    
    // Delete them
    for (let i = 0; i < toDelete.length; i++) {
      const branch = toDelete[i];
      try {
        console.log(`   Deleting: ${branch.branchName}...`);
        const deleteResponse = await fetch(`https://transport-management-system-wzhx.onrender.com/api/branches/${branch.id}`, {
          method: 'DELETE'
        });
        const deleteResult = await deleteResponse.json();
        if (deleteResult.success) {
          console.log(`     ✅ Deleted`);
        } else {
          console.error(`     ❌ Failed:`, deleteResult);
        }
      } catch (error) {
        console.error(`     ❌ Error:`, error.message);
      }
    }
  }
  
  // Step 4: Verify server now matches System A
  const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyResponse.json();
  console.log('\n4️⃣ Server now has:', verifyData.data.length, 'branches');
  
  // Step 5: Update System B
  console.log('\n5️⃣ Updating System B...');
  console.log('   💡 Run this script on System B to sync:');
  console.log('   localStorage.setItem("branches", JSON.stringify(' + JSON.stringify(verifyData.data) + '));');
  console.log('   window.dispatchEvent(new CustomEvent("dataSyncedFromServer"));');
  console.log('   Then refresh System B (F5)');
  
  console.log('\n✅ Complete!');
})();
