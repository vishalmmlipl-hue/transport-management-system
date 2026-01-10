// Test if Data Sync is Working
// Run this on BOTH systems to see if data syncs

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing Data Sync...\n');
  console.log('Current system:', window.location.hostname);
  console.log('API URL:', API_URL);
  console.log('');
  
  // Step 1: Check what's on server
  console.log('1️⃣ Checking what\'s on server...');
  const getResponse = await fetch(`${API_URL}/branches`);
  const getData = await getResponse.json();
  
  if (getData.success) {
    console.log(`   Server has ${getData.data.length} branches`);
    getData.data.forEach(b => {
      console.log(`   - ${b.branchName} (ID: ${b.id}, Status: ${b.status})`);
    });
  }
  
  // Step 2: Check localStorage
  console.log('\n2️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has ${localBranches.length} branches`);
  
  // Step 3: Test creating data
  console.log('\n3️⃣ Testing create operation...');
  const testBranch = {
    branchName: 'Sync Test ' + new Date().toLocaleTimeString(),
    branchCode: 'TEST' + Date.now(),
    address: 'Test Address',
    city: 'Test City',
    state: 'Test State',
    status: 'Active'
  };
  
  try {
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const createData = await createResponse.json();
    
    if (createData.success) {
      console.log('   ✅ Created successfully!');
      console.log('   Created branch:', createData.data);
      
      // Step 4: Verify it's on server
      console.log('\n4️⃣ Verifying on server...');
      const verifyResponse = await fetch(`${API_URL}/branches`);
      const verifyData = await verifyResponse.json();
      
      const found = verifyData.data?.find(b => b.branchName === testBranch.branchName);
      if (found) {
        console.log('   ✅ Branch found on server!');
        console.log('   ✅ Data sync is WORKING!');
      } else {
        console.error('   ❌ Branch NOT found on server!');
        console.error('   ❌ Data sync is NOT working!');
      }
    } else {
      console.error('   ❌ Create failed:', createData);
    }
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  console.log('\n✅ Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Run this on System A - create test branch');
  console.log('   2. Run this on System B - check if test branch appears');
  console.log('   3. If not appearing, check console for errors');
})();
