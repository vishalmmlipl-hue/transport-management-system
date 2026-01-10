// Correct API Test - Use Proper Column Names
// Copy and paste this into your browser console (F12)

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🧪 Testing API with Correct Schema...\n');
  
  // Test 1: Create Branch (with correct columns)
  console.log('1️⃣ Creating Branch...');
  try {
    const testBranch = {
      branchName: 'Test Branch ' + Date.now(),
      branchCode: 'TB' + Date.now(), // Required, unique
      address: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      status: 'Active'
    };
    
    const response = await fetch(`${API_URL}/branches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Branch Created Successfully!', data.data);
    } else {
      console.error('❌ Create Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('');
  
  // Test 2: Get All Branches
  console.log('2️⃣ Retrieving Branches...');
  try {
    const response = await fetch(`${API_URL}/branches`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Branches Retrieved!');
      console.log('Count:', data.data.length);
      console.log('Sample:', data.data[0]);
    } else {
      console.error('❌ Retrieve Failed:', data);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('');
  console.log('✅ Test Complete!');
})();
