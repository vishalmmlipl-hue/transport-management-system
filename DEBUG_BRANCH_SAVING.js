/**
 * DEBUG: Check Why Branches Are Saving to localStorage
 * 
 * Run this in browser console to check:
 * 1. If branches are being saved to localStorage
 * 2. If API calls are going to Render.com
 * 3. If data is on server
 */

(async () => {
  console.log('🔍 Debugging branch saving issue...\n');
  
  // 1. Check localStorage
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`1️⃣ localStorage has ${localBranches.length} branches`);
  if (localBranches.length > 0) {
    console.log('   ⚠️ WARNING: Branches found in localStorage!');
    console.log('   Latest branch:', localBranches[localBranches.length - 1]);
  }
  
  // 2. Check server
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const result = await response.json();
    const serverBranches = result.data || [];
    console.log(`\n2️⃣ Server has ${serverBranches.length} branches`);
    if (serverBranches.length > 0) {
      console.log('   Latest branch:', serverBranches[serverBranches.length - 1]);
    }
  } catch (error) {
    console.error('   ❌ Error checking server:', error);
  }
  
  // 3. Check API service URL
  console.log('\n3️⃣ API Service Configuration:');
  console.log('   Render.com URL: https://transport-management-system-wzhx.onrender.com/api');
  console.log('   Current hostname:', window.location.hostname);
  
  // 4. Test API call
  console.log('\n4️⃣ Testing API call...');
  try {
    const testBranch = {
      branchName: 'TEST BRANCH',
      branchCode: 'TEST' + Date.now(),
      status: 'Active',
      createdAt: new Date().toISOString()
    };
    
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testBranch)
    });
    
    const result = await response.json();
    console.log('   Response:', result);
    
    if (result.success) {
      console.log('   ✅ API call successful - branch saved to Render.com');
      console.log('   Saved branch:', result.data);
      
      // Check localStorage again
      const afterLocal = JSON.parse(localStorage.getItem('branches') || '[]');
      console.log(`\n   localStorage after save: ${afterLocal.length} branches`);
      if (afterLocal.length > localBranches.length) {
        console.log('   ⚠️ WARNING: localStorage was updated! Something is saving to localStorage.');
      } else {
        console.log('   ✅ localStorage not updated - good!');
      }
    } else {
      console.error('   ❌ API call failed:', result.error);
    }
  } catch (error) {
    console.error('   ❌ Error testing API:', error);
  }
  
  // 5. Recommendations
  console.log('\n💡 Recommendations:');
  console.log('   1. Clear localStorage: localStorage.removeItem("branches")');
  console.log('   2. Check browser console for errors when creating branch');
  console.log('   3. Check Network tab to see if API calls are going to Render.com');
  console.log('   4. Verify branch-master-form.jsx is using useBranches() hook');
  
})();
