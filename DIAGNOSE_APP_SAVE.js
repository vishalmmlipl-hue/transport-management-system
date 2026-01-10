// Diagnose why app might not be saving data
// Run this in browser console on https://mmlipl.info

(async () => {
  console.log('🔍 Diagnosing App Data Save...\n');
  
  // 1. Check API URL configuration
  console.log('1️⃣ Checking API URL Configuration...');
  const hostname = window.location.hostname;
  console.log('   Current hostname:', hostname);
  
  const expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  console.log('   Expected API URL:', expectedAPI);
  
  if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
    console.log('   ✅ Hostname matches - should use Render API');
  } else {
    console.log('   ⚠️ Hostname mismatch - might use wrong API');
  }
  
  // 2. Check if syncService is available
  console.log('\n2️⃣ Checking syncService...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    console.log('   ✅ syncService loaded');
    
    // Test syncService save
    console.log('\n3️⃣ Testing syncService.save()...');
    const testData = {
      branchName: 'syncService Test ' + Date.now(),
      branchCode: 'SYNC' + Date.now(),
      status: 'Active'
    };
    
    console.log('   Saving:', testData.branchName);
    const result = await syncService.save('branches', testData);
    console.log('   Result:', result);
    
    if (result.synced) {
      console.log('   ✅ syncService saved to server!');
    } else {
      console.log('   ❌ syncService only saved to localStorage');
      console.log('   Reason:', result.fallback ? 'Server unavailable' : 'Unknown');
    }
  } catch (error) {
    console.error('   ❌ Error loading syncService:', error);
  }
  
  // 3. Check databaseAPI
  console.log('\n4️⃣ Checking databaseAPI...');
  try {
    const databaseAPI = (await import('./src/utils/database-api')).default;
    console.log('   ✅ databaseAPI loaded');
    
    // Check API base URL
    // This is tricky - we need to see what it's actually using
    console.log('   Check console for: "🔗 API Base URL: ..." when creating data');
  } catch (error) {
    console.error('   ❌ Error loading databaseAPI:', error);
  }
  
  // 4. Check current data
  console.log('\n5️⃣ Checking Current Data...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   📱 LocalStorage branches: ${localBranches.length}`);
  
  try {
    const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const serverData = await serverResponse.json();
    const serverBranches = serverData.data || serverData || [];
    console.log(`   ☁️ Server branches: ${serverBranches.length}`);
    
    if (localBranches.length > serverBranches.length) {
      console.log('   ⚠️ LocalStorage has more data than server!');
      console.log('   → Data is NOT syncing to server');
    } else if (serverBranches.length > localBranches.length) {
      console.log('   ✅ Server has more data than localStorage');
      console.log('   → Data IS syncing, but localStorage might be stale');
    } else if (localBranches.length === serverBranches.length && localBranches.length > 0) {
      console.log('   ✅ Counts match - data might be syncing');
    } else {
      console.log('   ⚠️ Both are empty - no data yet');
    }
  } catch (error) {
    console.error('   ❌ Error checking server:', error);
  }
  
  console.log('\n✅ Diagnosis Complete!');
  console.log('\n📝 Next Steps:');
  console.log('   1. Create data in app and watch console');
  console.log('   2. Look for API call logs');
  console.log('   3. Check if API URL is correct');
  console.log('   4. Share results if still not working');
})();
