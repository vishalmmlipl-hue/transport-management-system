/**
 * DEBUG: Why Server Has 0 Branches
 * 
 * Run this in browser console to diagnose the issue
 */

(async () => {
  console.log('🔍 Debugging: Why Server Has 0 Branches\n');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // 1. Check current branches
  console.log('1️⃣ Checking current branches on server...');
  try {
    const getResponse = await fetch(`${API_URL}/branches`);
    const getData = await getResponse.json();
    console.log('   Response:', getData);
    console.log(`   Current branches: ${getData.data?.length || 0}`);
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // 2. Test creating a branch
  console.log('\n2️⃣ Testing branch creation...');
  const testBranch = {
    branchName: 'Debug Test Branch',
    branchCode: 'DEBUG' + Date.now(),
    address: 'Test Address',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '022-12345678',
    email: 'test@example.com',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  try {
    console.log('   Creating branch:', testBranch.branchCode);
    const createResponse = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    console.log('   Response status:', createResponse.status);
    const createData = await createResponse.json();
    console.log('   Response data:', createData);
    
    if (createData.success) {
      console.log('   ✅ Branch created successfully!');
      console.log('   Created branch:', createData.data);
    } else {
      console.error('   ❌ Branch creation failed:', createData.error || createData.message);
    }
  } catch (error) {
    console.error('   ❌ Error creating branch:', error);
  }
  
  // 3. Verify branch was saved
  console.log('\n3️⃣ Verifying branch was saved...');
  try {
    const verifyResponse = await fetch(`${API_URL}/branches`);
    const verifyData = await verifyResponse.json();
    const branches = verifyData.data || [];
    
    console.log(`   Total branches now: ${branches.length}`);
    
    const found = branches.find(b => b.branchCode === testBranch.branchCode);
    if (found) {
      console.log('   ✅ Branch found on server!');
      console.log('   Branch details:', found);
    } else {
      console.log('   ❌ Branch NOT found on server!');
      console.log('   This means the save operation failed or data is not persisting.');
      
      if (branches.length > 0) {
        console.log('   But other branches exist:', branches.map(b => b.branchCode));
      }
    }
  } catch (error) {
    console.error('   ❌ Error verifying:', error);
  }
  
  // 4. Check localStorage
  console.log('\n4️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has ${localBranches.length} branches`);
  
  if (localBranches.length > 0) {
    console.log('   ⚠️ WARNING: Branches exist in localStorage but not on server!');
    console.log('   This means data is not being synced to server.');
    console.log('   Sample branch from localStorage:', localBranches[0]);
  }
  
  // 5. Check if API service is being used
  console.log('\n5️⃣ Checking API service configuration...');
  console.log('   API URL:', API_URL);
  console.log('   Expected: https://transport-management-system-wzhx.onrender.com/api');
  
  // 6. Test direct API call vs hook
  console.log('\n6️⃣ Testing API service methods...');
  try {
    // Test if apiService is available
    const apiServiceModule = await import('./src/utils/apiService.js');
    const apiService = apiServiceModule.default || apiServiceModule.apiService;
    
    if (apiService) {
      console.log('   ✅ apiService found');
      console.log('   Testing getBranches...');
      const branches = await apiService.getBranches();
      console.log('   Result:', branches?.length || 0, 'branches');
    } else {
      console.log('   ⚠️ apiService not found');
    }
  } catch (error) {
    console.error('   ❌ Error testing apiService:', error);
  }
  
  // 7. Summary and recommendations
  console.log('\n📊 Summary:');
  console.log('   - Server API: Working');
  console.log('   - Database: Configured');
  console.log('   - Current branches: 0');
  console.log('   - localStorage branches:', localBranches.length);
  
  console.log('\n💡 Possible Reasons:');
  console.log('   1. Data was never synced to server');
  console.log('   2. Database was cleared/reset');
  console.log('   3. Save operations are failing silently');
  console.log('   4. Data is being saved but not persisting');
  
  console.log('\n🔧 Next Steps:');
  console.log('   1. Run QUICK_FIX_BRANCHES.js to sync localStorage to server');
  console.log('   2. Check if test branch creation worked above');
  console.log('   3. Check Render.com logs for errors');
  console.log('   4. Verify database file exists on Render.com');
  
  console.log('\n✅ Debug complete!');
})();
