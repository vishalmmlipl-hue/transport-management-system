// Complete Sync Test - Run this on BOTH systems
// This will test the entire sync flow

(async () => {
  console.log('🔍 Complete Sync Test\n');
  console.log('Current System:', window.location.hostname);
  console.log('');
  
  // Step 1: Check server
  console.log('1️⃣ Checking server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  console.log('   Server has:', serverData.data.length, 'branches');
  serverData.data.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Step 2: Check localStorage
  console.log('\n2️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   localStorage has:', localBranches.length, 'branches');
  localBranches.forEach(function(b) {
    console.log('     - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
  });
  
  // Step 3: Compare
  console.log('\n3️⃣ Comparison:');
  if (serverData.data.length === localBranches.length) {
    console.log('   ✅ Same count');
    
    // Check if they match
    const serverCodes = serverData.data.map(b => b.branchCode).sort();
    const localCodes = localBranches.map(b => b.branchCode).sort();
    const match = JSON.stringify(serverCodes) === JSON.stringify(localCodes);
    
    if (match) {
      console.log('   ✅ Data matches!');
    } else {
      console.log('   ⚠️ Data does NOT match');
      console.log('   Server codes:', serverCodes);
      console.log('   Local codes:', localCodes);
    }
  } else {
    console.log('   ⚠️ Mismatch!');
    console.log('   Server:', serverData.data.length);
    console.log('   localStorage:', localBranches.length);
  }
  
  // Step 4: Test syncService.load
  console.log('\n4️⃣ Testing syncService.load...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    console.log('   Synced?', result.synced);
    console.log('   Data count:', result.data.length);
    
    if (result.synced) {
      console.log('   ✅ Successfully loaded from server');
    } else {
      console.log('   ⚠️ Loaded from localStorage (server unavailable)');
    }
  } catch (error) {
    console.error('   ❌ Error:', error.message);
  }
  
  // Step 5: Check API URL
  console.log('\n5️⃣ API Configuration:');
  const hostname = window.location.hostname;
  console.log('   Hostname:', hostname);
  
  let expectedAPI;
  if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
    expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  } else {
    expectedAPI = 'http://localhost:3001/api';
  }
  console.log('   Expected API:', expectedAPI);
  
  console.log('\n✅ Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Run this on System A');
  console.log('   2. Run this on System B');
  console.log('   3. Compare the results');
  console.log('   4. If server has different data, sync is not working');
})();
