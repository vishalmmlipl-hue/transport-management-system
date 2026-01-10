// Emergency Resync - Server is Empty!
// Run this to check server and resync all branches

(async () => {
  console.log('🚨 Emergency Resync - Server Appears Empty!\n');
  
  // Step 1: Check server health
  console.log('1️⃣ Checking server health...');
  try {
    const healthResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('   Server status:', healthData.success ? '✅ Online' : '❌ Offline');
    console.log('   Response:', healthData);
  } catch (error) {
    console.error('   ❌ Cannot reach server:', error);
    return;
  }
  
  // Step 2: Get branches from localStorage
  console.log('\n2️⃣ Getting branches from localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   Found', localBranches.length, 'branches in localStorage');
  
  if (localBranches.length === 0) {
    console.log('   ⚠️ No branches in localStorage to sync!');
    return;
  }
  
  // Step 3: Sync all branches to server
  console.log('\n3️⃣ Syncing all branches to server...\n');
  
  let synced = 0;
  let failed = 0;
  
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
  
  // Step 4: Verify
  console.log('\n4️⃣ Verifying...');
  const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyResponse.json();
  console.log('   Server now has:', verifyData.data.length, 'branches');
  
  console.log('\n📊 Summary:');
  console.log('   ✅ Synced:', synced);
  console.log('   ❌ Failed:', failed);
  
  if (verifyData.data.length > 0) {
    console.log('\n   Branches on server:');
    verifyData.data.forEach(function(b) {
      console.log('     - ' + b.branchName);
    });
  }
  
  console.log('\n✅ Resync Complete!');
  console.log('💡 Refresh both systems to see all branches');
})();
