// Test Creating Data and Verifying It Saves to Server
// Run this to test if data creation is working

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing Data Creation and Sync...\n');
  
  // Step 1: Check current state
  console.log('1️⃣ Checking current state...');
  const getResponse = await fetch(`${API_URL}/branches`);
  const getData = await getResponse.json();
  console.log(`   Server has: ${getData.data.length} branches`);
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has: ${localBranches.length} branches`);
  
  // Step 2: Create a test branch directly via API
  console.log('\n2️⃣ Testing direct API call...');
  const testBranch = {
    branchName: 'API Test ' + new Date().toLocaleTimeString(),
    branchCode: 'APITEST' + Date.now(),
    address: '123 Test Street',
    city: 'Test City',
    state: 'Test State',
    pincode: '123456',
    contactPerson: 'Test Person',
    phone: '1234567890',
    email: 'test@example.com',
    status: 'Active'
  };
  
  try {
    console.log('   Creating branch:', testBranch.branchName);
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const createData = await createResponse.json();
    console.log('   Response:', createData);
    
    if (createData.success) {
      console.log('   ✅ Direct API call worked!');
      
      // Step 3: Verify it's on server
      console.log('\n3️⃣ Verifying on server...');
      const verifyResponse = await fetch(`${API_URL}/branches`);
      const verifyData = await verifyResponse.json();
      
      const found = verifyData.data?.find(b => b.branchName === testBranch.branchName);
      if (found) {
        console.log('   ✅ Branch found on server!');
        console.log('   Branch details:', found);
      } else {
        console.error('   ❌ Branch NOT found on server!');
      }
    } else {
      console.error('   ❌ Direct API call failed:', createData);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // Step 4: Test syncService
  console.log('\n4️⃣ Testing syncService...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    
    const syncTestBranch = {
      branchName: 'SyncService Test ' + new Date().toLocaleTimeString(),
      branchCode: 'SYNCTEST' + Date.now(),
      address: '456 Sync Street',
      city: 'Sync City',
      state: 'Sync State',
      pincode: '654321',
      contactPerson: 'Sync Person',
      phone: '0987654321',
      email: 'sync@example.com',
      status: 'Active'
    };
    
    console.log('   Creating branch via syncService:', syncTestBranch.branchName);
    const result = await syncService.save('branches', syncTestBranch);
    
    console.log('   Result:', result);
    
    if (result.synced) {
      console.log('   ✅ syncService.save worked! Data synced to server');
    } else {
      console.error('   ❌ syncService.save failed to sync:', result);
      console.error('   This means the API call failed and it fell back to localStorage');
    }
    
    // Verify on server
    const finalCheck = await fetch(`${API_URL}/branches`);
    const finalData = await finalCheck.json();
    const syncFound = finalData.data?.find(b => b.branchName === syncTestBranch.branchName);
    
    if (syncFound) {
      console.log('   ✅ SyncService branch found on server!');
    } else {
      console.error('   ❌ SyncService branch NOT found on server!');
    }
    
  } catch (error) {
    console.error('   ❌ Error testing syncService:', error);
  }
  
  // Final check
  console.log('\n5️⃣ Final server check...');
  const finalResponse = await fetch(`${API_URL}/branches`);
  const finalData = await finalResponse.json();
  console.log(`   Server now has: ${finalData.data.length} branches`);
  
  if (finalData.data.length > 0) {
    console.log('   Branches on server:');
    finalData.data.forEach(b => {
      console.log(`   - ${b.branchName} (ID: ${b.id}, Status: ${b.status})`);
    });
  }
  
  console.log('\n✅ Test Complete!');
  console.log('\n💡 What to check:');
  console.log('   - If direct API call worked but syncService didn\'t → syncService has a bug');
  console.log('   - If both worked → your forms might not be calling syncService correctly');
  console.log('   - If neither worked → server or network issue');
})();
