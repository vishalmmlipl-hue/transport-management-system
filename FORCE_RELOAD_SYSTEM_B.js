// Force Reload System B - Run this on System B
// This will force reload branches and trigger component update

(async () => {
  console.log('🔧 Force Reloading System B...\n');
  
  // Step 1: Get fresh data from server
  console.log('1️⃣ Fetching from server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log(`   Server has: ${serverBranches.length} branches`);
  
  // Step 2: Update localStorage
  console.log('\n2️⃣ Updating localStorage...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ Updated');
  
  // Step 3: Test syncService
  console.log('\n3️⃣ Testing syncService...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    console.log('   Result:', result);
    console.log('   Synced:', result.synced);
    console.log('   Data count:', result.data?.length || 0);
    
    const active = (result.data || []).filter(b => 
      b.status === 'Active' || !b.status || b.status === undefined
    );
    console.log(`   Active branches: ${active.length}`);
    
    if (active.length > 0) {
      console.log('   Active branches:');
      active.forEach(b => console.log(`     - ${b.branchName}`));
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // Step 4: Dispatch events to trigger reload
  console.log('\n4️⃣ Triggering component reload...');
  window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
  console.log('   ✅ Dispatched dataSyncedFromServer event');
  
  // Step 5: Force page reload after a delay
  console.log('\n5️⃣ Reloading page in 2 seconds...');
  console.log('   💡 This will refresh the page and load branches');
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
  
  console.log('\n✅ Script complete! Page will reload automatically...');
})();
