// Deep Fix for System B - Run this to diagnose and fix
// Copy this ENTIRE block into console on System B

(async () => {
  console.log('🔍 Deep Diagnosis for System B...\n');
  
  // Step 1: Check server
  console.log('1️⃣ Checking server...');
  try {
    const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const serverData = await serverResponse.json();
    const serverBranches = serverData.data || [];
    console.log(`   ✅ Server has: ${serverBranches.length} branches`);
    serverBranches.forEach(b => {
      console.log(`      - ${b.branchName} (Status: ${b.status || 'N/A'})`);
    });
  } catch (error) {
    console.error('   ❌ Cannot reach server:', error);
    return;
  }
  
  // Step 2: Check localStorage
  console.log('\n2️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has: ${localBranches.length} branches`);
  
  // Step 3: Force update localStorage
  console.log('\n3️⃣ Updating localStorage with server data...');
  const serverResponse2 = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData2 = await serverResponse2.json();
  localStorage.setItem('branches', JSON.stringify(serverData2.data || []));
  console.log('   ✅ localStorage updated');
  
  // Step 4: Test syncService.load
  console.log('\n4️⃣ Testing syncService.load...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    
    console.log('   Result:', result);
    console.log('   Synced?', result.synced);
    console.log('   Data:', result.data);
    console.log('   Data count:', result.data?.length || 0);
    
    if (result.data && result.data.length > 0) {
      console.log('   Branches in result:');
      result.data.forEach(b => {
        console.log(`      - ${b.branchName} (Status: ${b.status || 'N/A'})`);
      });
      
      // Filter Active
      const active = result.data.filter(b => 
        b.status === 'Active' || !b.status || b.status === undefined
      );
      console.log(`   Active branches: ${active.length}`);
      active.forEach(b => {
        console.log(`      - ${b.branchName}`);
      });
    } else {
      console.error('   ❌ No data in result!');
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // Step 5: Check if component is loaded
  console.log('\n5️⃣ Checking React component state...');
  console.log('   💡 Open React DevTools and check BranchMasterForm component');
  console.log('   💡 Look for the "branches" state - what value does it have?');
  
  // Step 6: Manual trigger reload
  console.log('\n6️⃣ Triggering manual reload...');
  try {
    // Dispatch event to trigger reload
    window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    console.log('   ✅ Dispatched dataSyncedFromServer event');
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  console.log('\n✅ Diagnosis Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Check if localStorage has branches:', localStorage.getItem('branches') ? 'YES' : 'NO');
  console.log('   2. Refresh the page');
  console.log('   3. Open Branch Master form');
  console.log('   4. Check browser console for errors');
  console.log('   5. Check React DevTools for component state');
  
  // Final check
  const finalCheck = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`\n📊 Final localStorage check: ${finalCheck.length} branches`);
  if (finalCheck.length > 0) {
    console.log('   Branches:');
    finalCheck.forEach(b => console.log(`     - ${b.branchName}`));
  }
})();
