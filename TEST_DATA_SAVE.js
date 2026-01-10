// Test if data is actually saving to server
// Run this in browser console on https://mmlipl.info

(async () => {
  console.log('🧪 Testing Data Save to Cloud Server...\n');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // Test 1: Check server health
  console.log('1️⃣ Testing Server Health...');
  try {
    const healthResponse = await fetch(`${API_URL}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Server Status:', healthData);
  } catch (error) {
    console.error('❌ Server Health Check Failed:', error);
    console.log('\n⚠️ Server might be sleeping. Wait 30 seconds and try again.');
    return;
  }
  
  // Test 2: Try to create a test branch
  console.log('\n2️⃣ Testing Branch Creation...');
  const testBranch = {
    branchName: 'Test Branch ' + Date.now(),
    branchCode: 'TEST' + Date.now(),
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  console.log('   Creating test branch:', testBranch.branchName);
  
  try {
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testBranch)
    });
    
    console.log('   Response status:', createResponse.status, createResponse.statusText);
    
    const createData = await createResponse.json();
    console.log('   Response data:', createData);
    
    if (createResponse.ok && createData.success) {
      console.log('   ✅ Branch created successfully on server!');
      
      // Verify it's on server
      console.log('\n3️⃣ Verifying branch on server...');
      const verifyResponse = await fetch(`${API_URL}/branches`);
      const verifyData = await verifyResponse.json();
      const branches = verifyData.data || verifyData || [];
      const found = branches.find(b => b.branchCode === testBranch.branchCode);
      
      if (found) {
        console.log('   ✅ Branch found on server!');
        console.log('   📦 Total branches on server:', branches.length);
        console.log('\n✅ DATA IS SAVING TO CLOUD!');
      } else {
        console.log('   ❌ Branch NOT found on server');
        console.log('   ⚠️ Data might not be persisting');
      }
    } else {
      console.error('   ❌ Branch creation failed:', createData);
      console.log('\n❌ DATA IS NOT SAVING TO CLOUD');
      console.log('   Error:', createData.error || createData.message || 'Unknown error');
    }
  } catch (error) {
    console.error('   ❌ Error creating branch:', error);
    console.log('\n❌ DATA IS NOT SAVING TO CLOUD');
    console.log('   Check browser console for CORS or network errors');
  }
  
  // Test 3: Check current API URL
  console.log('\n4️⃣ Checking API Configuration...');
  console.log('   Current hostname:', window.location.hostname);
  console.log('   Expected API URL:', API_URL);
  
  // Test 4: Check syncService
  console.log('\n5️⃣ Testing syncService...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    console.log('   ✅ syncService loaded');
    
    // Try to save via syncService
    const testData = {
      branchName: 'SyncService Test ' + Date.now(),
      branchCode: 'SYNC' + Date.now(),
      status: 'Active'
    };
    
    console.log('   Testing syncService.save()...');
    const saveResult = await syncService.save('branches', testData);
    console.log('   Save result:', saveResult);
    
    if (saveResult.synced) {
      console.log('   ✅ syncService saved to server!');
    } else {
      console.log('   ❌ syncService only saved to localStorage');
      console.log('   Reason:', saveResult.fallback ? 'Server unavailable' : 'Unknown');
    }
  } catch (error) {
    console.error('   ❌ Error testing syncService:', error);
  }
  
  console.log('\n✅ Test Complete!');
  console.log('\n📝 Summary:');
  console.log('   - If you see "✅ DATA IS SAVING TO CLOUD": Everything works!');
  console.log('   - If you see "❌ DATA IS NOT SAVING": Check errors above');
})();
