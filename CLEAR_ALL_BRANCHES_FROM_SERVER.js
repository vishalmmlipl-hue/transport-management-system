// Clear All Branches from Server
// WARNING: This will delete ALL branches from the server!
// Run this to start fresh

(async () => {
  console.log('⚠️ WARNING: This will delete ALL branches from server!\n');
  
  // Step 1: Get all branches from server
  console.log('1️⃣ Getting branches from server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('   Found', serverBranches.length, 'branches on server:');
  serverBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (ID: ' + b.id + ', Code: ' + b.branchCode + ')');
  });
  
  if (serverBranches.length === 0) {
    console.log('\n✅ Server is already empty!');
    return;
  }
  
  // Step 2: Delete all branches
  console.log('\n2️⃣ Deleting all branches...\n');
  
  let deleted = 0;
  let failed = 0;
  
  for (let i = 0; i < serverBranches.length; i++) {
    const branch = serverBranches[i];
    try {
      console.log('Deleting:', branch.branchName + '...');
      
      const response = await fetch(`https://transport-management-system-wzhx.onrender.com/api/branches/${branch.id}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        deleted++;
        console.log('  ✅ Deleted');
      } else {
        failed++;
        console.error('  ❌ Failed:', result);
      }
    } catch (error) {
      failed++;
      console.error('  ❌ Error:', error.message);
    }
  }
  
  // Step 3: Verify
  console.log('\n3️⃣ Verifying deletion...');
  const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const verifyData = await verifyResponse.json();
  
  console.log('\n📊 Summary:');
  console.log('   ✅ Deleted:', deleted);
  console.log('   ❌ Failed:', failed);
  console.log('   Server now has:', verifyData.data.length, 'branches');
  
  if (verifyData.data.length === 0) {
    console.log('\n✅ All branches deleted! Server is now empty.');
    console.log('💡 You can now create new branches without conflicts.');
  } else {
    console.log('\n⚠️ Some branches still remain on server.');
  }
})();
