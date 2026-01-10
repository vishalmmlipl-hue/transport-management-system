// Check Sync Status - Run this on BOTH systems
// This will show you what's happening with data sync

(async () => {
  console.log('🔍 Checking Sync Status...\n');
  
  // Check 1: API URL
  console.log('1️⃣ API Configuration:');
  const hostname = window.location.hostname;
  console.log('   Hostname:', hostname);
  
  let expectedAPI;
  if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
    expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  } else {
    expectedAPI = 'http://localhost:3001/api';
  }
  console.log('   Expected API:', expectedAPI);
  
  // Check 2: Server Health
  console.log('\n2️⃣ Server Health:');
  try {
    const healthResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('   Status:', healthData.success ? '✅ Online' : '❌ Offline');
    console.log('   Response:', healthData);
  } catch (error) {
    console.error('   ❌ Server not accessible:', error.message);
  }
  
  // Check 3: Data on Server
  console.log('\n3️⃣ Data on Server:');
  try {
    const branchesResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
    const branchesData = await branchesResponse.json();
    console.log('   Branches on server:', branchesData.data.length);
    if (branchesData.data.length > 0) {
      console.log('   Branch names:');
      branchesData.data.forEach(b => {
        console.log(`     - ${b.branchName} (ID: ${b.id}, Status: ${b.status})`);
      });
    }
  } catch (error) {
    console.error('   ❌ Error fetching branches:', error.message);
  }
  
  // Check 4: Data in localStorage
  console.log('\n4️⃣ Data in localStorage:');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('   Branches in localStorage:', localBranches.length);
  if (localBranches.length > 0) {
    console.log('   Branch names:');
    localBranches.forEach(b => {
      console.log(`     - ${b.branchName} (ID: ${b.id}, Status: ${b.status || 'N/A'})`);
    });
  }
  
  // Check 5: Compare
  console.log('\n5️⃣ Comparison:');
  const serverBranches = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches').then(r => r.json()).then(d => d.data || []);
  const localBranches2 = JSON.parse(localStorage.getItem('branches') || '[]');
  
  if (serverBranches.length === localBranches2.length) {
    console.log('   ✅ Same number of branches on server and localStorage');
  } else {
    console.log(`   ⚠️ Mismatch: Server has ${serverBranches.length}, localStorage has ${localBranches2.length}`);
  }
  
  // Check 6: Test syncService
  console.log('\n6️⃣ Testing syncService:');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const health = await syncService.checkServerHealth();
    console.log('   Server health check:', health ? '✅ Healthy' : '❌ Unhealthy');
  } catch (error) {
    console.error('   ❌ Error testing syncService:', error.message);
  }
  
  console.log('\n✅ Status Check Complete!');
  console.log('\n💡 What to look for:');
  console.log('   - If server has 0 branches but localStorage has branches → data not syncing TO server');
  console.log('   - If server has branches but localStorage doesn\'t → data not syncing FROM server');
  console.log('   - If both have same data → sync is working!');
})();
