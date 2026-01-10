// Fix System B - Force Load All Branches from Server
// Run this on System B to load all 5 branches

(async () => {
  console.log('🔧 Fixing System B Loading...\n');
  
  // Step 1: Get all branches from server
  console.log('1️⃣ Fetching from server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('   Server has:', serverBranches.length, 'branches:');
  serverBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ', Status: ' + (b.status || 'N/A') + ')');
  });
  
  // Step 2: Check what's in localStorage
  console.log('\n2️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   localStorage has:', localBranches.length, 'branches');
  
  // Step 3: Update localStorage with ALL server branches
  console.log('\n3️⃣ Updating localStorage with ALL server branches...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ Updated');
  
  // Step 4: Filter Active branches (what should display)
  const activeBranches = serverBranches.filter(function(b) {
    return b.status === 'Active' || !b.status || b.status === undefined;
  });
  console.log('\n4️⃣ Active branches (should display):', activeBranches.length);
  activeBranches.forEach(function(b) {
    console.log('     - ' + b.branchName);
  });
  
  // Step 5: Trigger reload
  console.log('\n5️⃣ Triggering component reload...');
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('   ✅ Reload event dispatched');
  
  console.log('\n✅ Complete!');
  console.log('💡 Refresh System B (F5) to see all 5 branches!');
  console.log('💡 After refresh, System B should show:', activeBranches.length, 'branches');
})();
