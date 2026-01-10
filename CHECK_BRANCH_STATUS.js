// Check Branch Status and Fix Display
// Run this on BOTH systems

(async () => {
  console.log('🔍 Checking Branch Status...\n');
  
  // Get branches from server
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log(`Server has ${serverBranches.length} branches:\n`);
  
  serverBranches.forEach(b => {
    console.log(`Branch: ${b.branchName}`);
    console.log(`  Code: ${b.branchCode}`);
    console.log(`  Status: ${b.status || 'MISSING!'}`);
    console.log(`  Will display? ${(b.status === 'Active') ? '✅ YES' : '❌ NO'}`);
    console.log('');
  });
  
  // Count Active vs Others
  const active = serverBranches.filter(b => b.status === 'Active');
  const inactive = serverBranches.filter(b => b.status !== 'Active');
  const missingStatus = serverBranches.filter(b => !b.status);
  
  console.log(`Summary:`);
  console.log(`  Active: ${active.length}`);
  console.log(`  Inactive/Missing: ${inactive.length + missingStatus.length}`);
  
  // Fix branches without status
  if (missingStatus.length > 0) {
    console.log(`\n⚠️ Found ${missingStatus.length} branches without status!`);
    console.log('Updating them to Active...\n');
    
    for (const branch of missingStatus) {
      try {
        const response = await fetch(`https://transport-management-system-wzhx.onrender.com/api/branches/${branch.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...branch, status: 'Active' })
        });
        const result = await response.json();
        if (result.success) {
          console.log(`✅ Updated ${branch.branchName} to Active`);
        } else {
          console.error(`❌ Failed to update ${branch.branchName}`, result);
        }
      } catch (error) {
        console.error(`❌ Error updating ${branch.branchName}:`, error);
      }
    }
  }
  
  // Update localStorage with server data
  console.log('\n🔄 Updating localStorage with server data...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('✅ localStorage updated');
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Refresh the page');
  console.log('   2. Check Branch Master form');
  console.log('   3. All Active branches should now display');
})();
