// Fix Branch Display Issue
// Run this on BOTH systems to see what's happening

(async () => {
  console.log('🔍 Diagnosing Branch Display Issue...\n');
  
  // Check 1: What's on server
  console.log('1️⃣ Server Data:');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  console.log(`   Server has: ${serverData.data.length} branches`);
  serverData.data.forEach(b => {
    console.log(`   - ${b.branchName} (Code: ${b.branchCode}, Status: ${b.status || 'N/A'})`);
  });
  
  // Check 2: What's in localStorage
  console.log('\n2️⃣ localStorage Data:');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has: ${localBranches.length} branches`);
  localBranches.forEach(b => {
    console.log(`   - ${b.branchName} (Code: ${b.branchCode}, Status: ${b.status || 'N/A'})`);
  });
  
  // Check 3: Filter by Active status
  console.log('\n3️⃣ Active Branches (what should display):');
  const activeOnServer = serverData.data.filter(b => b.status === 'Active');
  const activeInLocal = localBranches.filter(b => b.status === 'Active');
  
  console.log(`   Active on server: ${activeOnServer.length}`);
  activeOnServer.forEach(b => console.log(`     - ${b.branchName}`));
  
  console.log(`   Active in localStorage: ${activeInLocal.length}`);
  activeInLocal.forEach(b => console.log(`     - ${b.branchName}`));
  
  // Check 4: Sync server data to localStorage
  console.log('\n4️⃣ Syncing server data to localStorage...');
  localStorage.setItem('branches', JSON.stringify(serverData.data));
  console.log('   ✅ Updated localStorage with server data');
  
  // Check 5: Force reload
  console.log('\n5️⃣ Reloading page to refresh display...');
  console.log('   💡 After reload, branches should appear');
  
  console.log('\n✅ Diagnosis Complete!');
  console.log('\n💡 If branches still don\'t show:');
  console.log('   1. Check browser console for errors');
  console.log('   2. Check if branches have status="Active"');
  console.log('   3. Try refreshing the page');
})();
