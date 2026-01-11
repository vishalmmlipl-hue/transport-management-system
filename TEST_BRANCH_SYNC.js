/**
 * TEST: Create Branch and Verify It Saves to Render.com
 * 
 * Run this in browser console to test branch creation
 */

(async () => {
  console.log('🧪 Testing branch creation and sync...\n');
  
  const testBranch = {
    branchName: 'TEST SYNC BRANCH',
    branchCode: 'TESTSYNC' + Date.now(),
    address: 'Test Address',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    phone: '022-12345678',
    email: 'test@example.com',
    status: 'Active',
    createdAt: new Date().toISOString()
  };
  
  console.log('📤 Creating test branch:', testBranch.branchCode);
  
  try {
    // Step 1: Create branch
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const result = await response.json();
    console.log('📥 Server response:', result);
    
    if (result.success && result.data) {
      console.log('✅ Branch created on Render.com!');
      console.log('   Branch ID:', result.data.id);
      console.log('   Branch Code:', result.data.branchCode);
      
      // Step 2: Check localStorage
      const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
      console.log(`\n📦 localStorage has ${localBranches.length} branches`);
      
      if (localBranches.length > 0) {
        console.log('   ⚠️ WARNING: Branches found in localStorage!');
        console.log('   This means something is still saving to localStorage.');
      } else {
        console.log('   ✅ localStorage is empty - good!');
      }
      
      // Step 3: Verify on server
      console.log('\n🔍 Verifying branch on server...');
      const verifyResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const verifyResult = await verifyResponse.json();
      const serverBranches = verifyResult.data || [];
      
      const found = serverBranches.find(b => b.branchCode === testBranch.branchCode);
      if (found) {
        console.log('✅ Branch found on server!');
        console.log('   Total branches on server:', serverBranches.length);
      } else {
        console.log('❌ Branch NOT found on server!');
        console.log('   This means the save failed.');
      }
      
      // Step 4: Instructions
      console.log('\n📋 Next Steps:');
      console.log('   1. Open another browser');
      console.log('   2. Go to mmlipl.info');
      console.log('   3. Check Branch Master');
      console.log('   4. You should see:', testBranch.branchCode);
      console.log('\n   If you don\'t see it:');
      console.log('   - Check Network tab for API calls');
      console.log('   - Check console for errors');
      console.log('   - Verify Render.com is running');
      
    } else {
      console.error('❌ Failed to create branch:', result.error || 'Unknown error');
    }
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if Render.com is running');
    console.log('   2. Check Network tab for CORS errors');
    console.log('   3. Check console for other errors');
  }
})();
