// Quick API Connection Test
// Copy and paste this into your browser console (F12)

(async () => {
  console.log('🧪 Testing API Connection...\n');
  console.log('Current URL:', window.location.href);
  console.log('Hostname:', window.location.hostname);
  console.log('');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // Test 1: Health Check
  console.log('1️⃣ Testing Health Endpoint...');
  try {
    const healthResponse = await fetch(`${API_URL.replace('/api', '')}/api/health`);
    console.log('   Status:', healthResponse.status);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ Health Check SUCCESS:', healthData);
    } else {
      console.error('   ❌ Health Check FAILED:', healthResponse.status, healthResponse.statusText);
    }
  } catch (error) {
    console.error('   ❌ Health Check ERROR:', error.message);
    console.log('   💡 Server might be sleeping (free tier). Wait 30-60 seconds and try again.');
  }
  
  console.log('');
  
  // Test 2: Get Branches
  console.log('2️⃣ Testing GET /branches...');
  try {
    const branchesResponse = await fetch(`${API_URL}/branches`);
    console.log('   Status:', branchesResponse.status);
    
    if (branchesResponse.ok) {
      const branchesData = await branchesResponse.json();
      console.log('   ✅ GET Branches SUCCESS');
      console.log('   Data:', branchesData);
    } else {
      console.error('   ❌ GET Branches FAILED:', branchesResponse.status);
    }
  } catch (error) {
    console.error('   ❌ GET Branches ERROR:', error.message);
  }
  
  console.log('');
  
  // Test 3: Create Test Branch
  console.log('3️⃣ Testing POST /branches (Create)...');
  try {
    const testBranch = {
      branchName: 'API Test Branch ' + Date.now(),
      location: 'Test Location',
      status: 'Active'
    };
    
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testBranch)
    });
    
    console.log('   Status:', createResponse.status);
    
    if (createResponse.ok) {
      const createData = await createResponse.json();
      console.log('   ✅ CREATE Branch SUCCESS');
      console.log('   Created:', createData);
      console.log('');
      console.log('🎉 API IS WORKING! Data sync should work!');
    } else {
      const errorText = await createResponse.text();
      console.error('   ❌ CREATE Branch FAILED:', createResponse.status);
      console.error('   Error:', errorText);
    }
  } catch (error) {
    console.error('   ❌ CREATE Branch ERROR:', error.message);
  }
  
  console.log('');
  console.log('✅ Test Complete!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   - If all tests show ✅, your API is working!');
  console.log('   - If tests show ❌, check the error messages above');
  console.log('   - The "manifest.json 401" error is unrelated and can be ignored');
})();
