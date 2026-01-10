// Check if App's syncService is Working
// Run this in console AFTER the app has loaded

(async () => {
  console.log('🔍 Checking App\'s syncService...\n');
  
  // Wait a moment for app to load
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Check if syncService is available in the app
  console.log('1️⃣ Checking if syncService is available...');
  
  // Try to access syncService from window or React DevTools
  // Or we can test by creating a branch programmatically
  
  console.log('2️⃣ Testing syncService via app context...');
  
  // Import syncService the same way the app does
  try {
    // This should work if the app is using ES modules
    const syncServiceModule = await import('/src/utils/sync-service.js');
    const syncService = syncServiceModule.default;
    
    console.log('✅ syncService imported');
    
    const testBranch = {
      branchName: 'Console Test ' + Date.now(),
      branchCode: 'CONSOLE' + Date.now(),
      address: 'Test',
      city: 'Test',
      state: 'Test',
      status: 'Active'
    };
    
    console.log('Creating branch:', testBranch.branchName);
    console.log('Watch for detailed logs...');
    
    const result = await syncService.save('branches', testBranch);
    
    console.log('\nResult:', result);
    console.log('Synced?', result.synced);
    
    if (result.synced) {
      console.log('✅ syncService WORKS from console!');
    } else {
      console.error('❌ syncService FAILED - check logs above');
    }
    
    // Check server
    const check = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const checkData = await check.json();
    const found = checkData.data.find(b => b.branchName === testBranch.branchName);
    
    if (found) {
      console.log('✅ Branch found on server!');
    } else {
      console.error('❌ Branch NOT on server!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    console.log('\n💡 Alternative: Create a branch in the app UI and watch console logs');
  }
  
  console.log('\n✅ Test Complete!');
})();
