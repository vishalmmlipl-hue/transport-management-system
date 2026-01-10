// Find The Problem - Run this to see why data isn't saving
// Copy this ENTIRE block into console

(async () => {
  console.log('🔍 Finding The Problem...\n');
  
  // Test 1: Can we CREATE data directly?
  console.log('TEST 1: Direct API Create');
  console.log('─────────────────────────');
  const testBranch = {
    branchName: 'Direct API Test ' + Date.now(),
    branchCode: 'DIRECT' + Date.now(),
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    status: 'Active'
  };
  
  try {
    console.log('Creating:', testBranch.branchName);
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);
    
    if (data.success) {
      console.log('✅ DIRECT API CREATE WORKS!');
      
      // Verify it's on server
      const check = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const checkData = await check.json();
      const found = checkData.data.find(b => b.branchName === testBranch.branchName);
      
      if (found) {
        console.log('✅ Verified: Branch is on server!');
      } else {
        console.error('❌ Branch NOT found on server after create!');
      }
    } else {
      console.error('❌ DIRECT API CREATE FAILED:', data);
    }
  } catch (error) {
    console.error('❌ ERROR:', error);
  }
  
  console.log('\n\nTEST 2: syncService.save');
  console.log('─────────────────────────');
  
  try {
    // Import syncService
    const syncServiceModule = await import('./src/utils/sync-service');
    const syncService = syncServiceModule.default;
    
    const syncTestBranch = {
      branchName: 'SyncService Test ' + Date.now(),
      branchCode: 'SYNC' + Date.now(),
      address: 'Sync Address',
      city: 'Sync City',
      state: 'Sync State',
      status: 'Active'
    };
    
    console.log('Creating via syncService:', syncTestBranch.branchName);
    console.log('Watch for these logs:');
    console.log('  - 💾 Saving branches to server...');
    console.log('  - 🌐 API Call: POST ...');
    console.log('  - 📡 Response status: ...');
    
    const result = await syncService.save('branches', syncTestBranch);
    
    console.log('\nResult:', result);
    console.log('Synced?', result.synced);
    console.log('Fallback?', result.fallback);
    
    if (result.synced) {
      console.log('✅ SYNC SERVICE WORKS!');
    } else {
      console.error('❌ SYNC SERVICE FAILED - Check console logs above for error details');
    }
    
    // Verify on server
    const finalCheck = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const finalData = await finalCheck.json();
    const syncFound = finalData.data.find(b => b.branchName === syncTestBranch.branchName);
    
    if (syncFound) {
      console.log('✅ SyncService branch found on server!');
    } else {
      console.error('❌ SyncService branch NOT on server!');
    }
    
  } catch (error) {
    console.error('❌ ERROR testing syncService:', error);
  }
  
  // Final check
  console.log('\n\nFINAL CHECK');
  console.log('────────────');
  const final = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const finalData = await final.json();
  console.log('Total branches on server:', finalData.data.length);
  
  if (finalData.data.length > 0) {
    console.log('Branches:');
    finalData.data.forEach(b => console.log(`  - ${b.branchName}`));
  }
  
  console.log('\n✅ Test Complete!');
  console.log('\n💡 What to check:');
  console.log('   1. If TEST 1 worked → API is fine, problem is in app code');
  console.log('   2. If TEST 2 failed → Check console logs above for the error');
  console.log('   3. Look for: CORS errors, network errors, or API errors');
})();
