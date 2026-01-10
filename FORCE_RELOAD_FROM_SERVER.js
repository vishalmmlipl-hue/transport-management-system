// Force Reload from Server - Run this on BOTH systems
// This will clear localStorage and reload fresh data from server

(async () => {
  console.log('🔄 Force Reloading from Server...\n');
  console.log('System:', window.location.hostname);
  console.log('');
  
  // Step 1: Get fresh data from server
  console.log('1️⃣ Fetching fresh data from server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  
  console.log('   Server has:', serverBranches.length, 'branches');
  serverBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Step 2: Clear localStorage
  console.log('\n2️⃣ Clearing localStorage...');
  localStorage.removeItem('branches');
  console.log('   ✅ Cleared');
  
  // Step 3: Set fresh data from server
  console.log('\n3️⃣ Setting fresh data from server...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ Set', serverBranches.length, 'branches');
  
  // Step 4: Verify
  const verify = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('\n4️⃣ Verification:');
  console.log('   localStorage now has:', verify.length, 'branches');
  
  // Step 5: Trigger reload event
  console.log('\n5️⃣ Triggering component reload...');
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('   ✅ Reload event dispatched');
  
  console.log('\n✅ Complete!');
  console.log('💡 Refresh the page (F5) to see the branches!');
  console.log('💡 After refresh, both systems should show the same branches!');
})();
