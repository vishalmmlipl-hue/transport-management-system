// Clear Old Cache and Reload from Server - System B
// Run this on System B to clear old branches and load fresh from server

(async () => {
  console.log('🧹 Clearing Old Cache on System B...\n');
  
  // Step 1: Check what's currently in localStorage
  const oldBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('1️⃣ Old branches in localStorage:', oldBranches.length);
  oldBranches.forEach(function(b) {
    console.log('   - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Step 2: Get fresh data from server
  console.log('\n2️⃣ Fetching fresh data from server...');
  try {
    const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const serverData = await serverResponse.json();
    const serverBranches = serverData.data || [];
    
    console.log('   Server has:', serverBranches.length, 'branches');
    serverBranches.forEach(function(b) {
      console.log('   - ' + b.branchName + ' (Code: ' + b.branchCode + ', Status: ' + (b.status || 'N/A') + ')');
    });
    
    // Step 3: Clear old cache and set fresh data
    console.log('\n3️⃣ Clearing old cache and setting fresh data...');
    localStorage.removeItem('branches');
    localStorage.setItem('branches', JSON.stringify(serverBranches));
    console.log('   ✅ Cache cleared and fresh data loaded');
    
    // Step 4: Verify
    const verify = JSON.parse(localStorage.getItem('branches') || '[]');
    console.log('\n4️⃣ Verification:');
    console.log('   localStorage now has:', verify.length, 'branches');
    verify.forEach(function(b) {
      console.log('   - ' + b.branchName);
    });
    
    // Step 5: Trigger reload
    console.log('\n5️⃣ Triggering component reload...');
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    console.log('   ✅ Reload event dispatched');
    
    console.log('\n✅ Complete! Reloading page in 2 seconds...');
    setTimeout(function() {
      window.location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Make sure you can access the server:');
    console.log('   https://transport-management-system-wzhx.onrender.com/api/branches');
  }
})();
