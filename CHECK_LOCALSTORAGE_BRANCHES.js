/**
 * CHECK: What Branches Are in localStorage
 * 
 * Run this to see what branches need to be synced
 */

(async () => {
  console.log('🔍 Checking localStorage for branches...\n');
  
  // Check localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`📦 localStorage has ${localBranches.length} branches`);
  
  if (localBranches.length > 0) {
    console.log('\n📋 Branches in localStorage:');
    localBranches.forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.branchName || b.name} (${b.branchCode || b.code})`);
    });
    
    // Check server
    console.log('\n📡 Checking server...');
    const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const serverData = await serverResponse.json();
    const serverBranches = serverData.data || [];
    console.log(`   Server has ${serverBranches.length} branches`);
    
    // Find missing branches
    const serverCodes = serverBranches.map(b => (b.branchCode || b.code || '').toUpperCase());
    const missing = localBranches.filter(b => {
      const code = (b.branchCode || b.code || '').toUpperCase();
      return code && !serverCodes.includes(code);
    });
    
    if (missing.length > 0) {
      console.log(`\n⚠️ ${missing.length} branches need to be synced:`);
      missing.forEach(b => {
        console.log(`   - ${b.branchName || b.name} (${b.branchCode || b.code})`);
      });
      
      console.log('\n💡 Solution:');
      console.log('   1. Reload the page - auto-sync will run automatically');
      console.log('   2. Or run TEST_AUTO_SYNC_NOW.js to sync now');
    } else {
      console.log('\n✅ All branches are already on server!');
    }
  } else {
    console.log('✅ No branches in localStorage');
    console.log('   All data should be on server');
    
    // Check server
    const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const serverData = await serverResponse.json();
    console.log(`\n📡 Server has ${serverData.data?.length || 0} branches`);
  }
})();
