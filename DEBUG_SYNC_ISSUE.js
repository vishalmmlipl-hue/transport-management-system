// Debug Data Sync Issue
// Run this in browser console to check why data isn't syncing

(async () => {
  console.log('🔍 Debugging Data Sync Issue...\n');
  
  // Check 1: API URL
  console.log('1️⃣ Checking API URL...');
  const hostname = window.location.hostname;
  console.log('   Hostname:', hostname);
  
  let expectedAPI;
  if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
    expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  } else {
    expectedAPI = 'http://localhost:3001/api';
  }
  console.log('   Expected API URL:', expectedAPI);
  
  // Check 2: Server Health
  console.log('\n2️⃣ Checking Server Health...');
  try {
    const healthResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('   ✅ Server is accessible:', healthData);
  } catch (error) {
    console.error('   ❌ Server not accessible:', error.message);
  }
  
  // Check 3: Test Create Operation
  console.log('\n3️⃣ Testing Create Operation...');
  try {
    const testBranch = {
      branchName: 'Sync Test ' + Date.now(),
      branchCode: 'SYNC' + Date.now(),
      address: 'Test',
      city: 'Test City',
      state: 'Test State',
      status: 'Active'
    };
    
    console.log('   Creating test branch:', testBranch.branchName);
    
    const createResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    console.log('   Response status:', createResponse.status);
    const createData = await createResponse.json();
    console.log('   Response data:', createData);
    
    if (createData.success) {
      console.log('   ✅ Create successful! Data saved to server');
      
      // Verify it was saved
      const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const verifyData = await verifyResponse.json();
      const found = verifyData.data?.find(b => b.branchName === testBranch.branchName);
      
      if (found) {
        console.log('   ✅ Verified: Branch exists on server!');
      } else {
        console.error('   ❌ Branch not found on server after create!');
      }
    } else {
      console.error('   ❌ Create failed:', createData);
    }
  } catch (error) {
    console.error('   ❌ Create error:', error);
  }
  
  // Check 4: Check localStorage
  console.log('\n4️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   Branches in localStorage:', localBranches.length);
  
  // Check 5: Check if syncService is being used
  console.log('\n5️⃣ Checking syncService usage...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    console.log('   ✅ syncService imported successfully');
    
    // Test syncService.save
    const testData = {
      branchName: 'SyncService Test ' + Date.now(),
      branchCode: 'SST' + Date.now(),
      address: 'Test',
      city: 'Test',
      state: 'Test',
      status: 'Active'
    };
    
    console.log('   Testing syncService.save...');
    const result = await syncService.save('branches', testData);
    console.log('   Result:', result);
    
    if (result.synced) {
      console.log('   ✅ syncService.save worked! Data synced to server');
    } else {
      console.error('   ❌ syncService.save failed to sync:', result);
    }
  } catch (error) {
    console.error('   ❌ Error testing syncService:', error);
  }
  
  console.log('\n✅ Debug Complete!');
  console.log('Check the results above to see where the issue is.');
})();
