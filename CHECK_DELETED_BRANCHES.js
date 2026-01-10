// Check What Branches Are on Server
// Run this in browser console to see all branches (including deleted ones)

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🔍 Checking branches on server...\n');
  
  const response = await fetch(`${API_URL}/branches`);
  const data = await response.json();
  
  if (data.success) {
    console.log(`✅ Total branches on server: ${data.data.length}`);
    console.log('\n📋 All Branches:');
    data.data.forEach((b, i) => {
      console.log(`${i + 1}. ID: ${b.id} | Name: ${b.branchName} | Status: ${b.status || 'Active'}`);
    });
    
    const activeBranches = data.data.filter(b => b.status === 'Active');
    const inactiveBranches = data.data.filter(b => b.status === 'Inactive');
    const noStatusBranches = data.data.filter(b => !b.status);
    
    console.log('\n📊 Summary:');
    console.log(`   Active: ${activeBranches.length}`);
    console.log(`   Inactive: ${inactiveBranches.length}`);
    console.log(`   No Status: ${noStatusBranches.length}`);
    
    if (inactiveBranches.length > 0) {
      console.log('\n⚠️ Inactive branches (should be filtered out):');
      inactiveBranches.forEach(b => {
        console.log(`   - ${b.branchName} (ID: ${b.id})`);
      });
    }
    
    if (noStatusBranches.length > 0) {
      console.log('\n⚠️ Branches without status:');
      noStatusBranches.forEach(b => {
        console.log(`   - ${b.branchName} (ID: ${b.id})`);
      });
    }
  } else {
    console.error('❌ Failed to get branches:', data);
  }
})();
