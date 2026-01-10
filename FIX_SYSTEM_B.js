// Fix System B - Force Reload from Server
// Run this on System B (the one showing 0 branches)

(async () => {
  console.log('🔧 Fixing System B...\n');
  
  // Step 1: Check what's on server
  console.log('1️⃣ Checking server...');
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  const serverBranches = serverData.data || [];
  console.log(`   Server has: ${serverBranches.length} branches`);
  serverBranches.forEach(b => {
    console.log(`   - ${b.branchName} (Status: ${b.status || 'N/A'})`);
  });
  
  // Step 2: Check localStorage
  console.log('\n2️⃣ Checking localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has: ${localBranches.length} branches`);
  
  // Step 3: Force update localStorage with server data
  console.log('\n3️⃣ Updating localStorage with server data...');
  localStorage.setItem('branches', JSON.stringify(serverBranches));
  console.log('   ✅ localStorage updated with', serverBranches.length, 'branches');
  
  // Step 4: Test syncService.load
  console.log('\n4️⃣ Testing syncService.load...');
  try {
    const syncService = (await import('./src/utils/sync-service')).default;
    const result = await syncService.load('branches');
    console.log('   Result:', result);
    console.log('   Synced?', result.synced);
    console.log('   Data count:', result.data?.length || 0);
    
    if (result.synced) {
      console.log('   ✅ Successfully loaded from server!');
    } else {
      console.warn('   ⚠️ Loaded from localStorage (server may be unavailable)');
    }
    
    // Count Active branches
    const active = (result.data || []).filter(b => 
      b.status === 'Active' || !b.status || b.status === undefined
    );
    console.log(`   Active branches: ${active.length}`);
    
  } catch (error) {
    console.error('   ❌ Error testing syncService:', error);
  }
  
  // Step 5: Check API URL
  console.log('\n5️⃣ Checking API configuration...');
  const hostname = window.location.hostname;
  console.log('   Hostname:', hostname);
  
  let expectedAPI;
  if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info' || !hostname.includes('localhost')) {
    expectedAPI = 'https://transport-management-system-wzhx.onrender.com/api';
  } else {
    expectedAPI = 'http://localhost:3001/api';
  }
  console.log('   Expected API:', expectedAPI);
  
  // Step 6: Test API connection
  console.log('\n6️⃣ Testing API connection...');
  try {
    const healthResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/health');
    const healthData = await healthResponse.json();
    console.log('   Server health:', healthData.success ? '✅ Online' : '❌ Offline');
  } catch (error) {
    console.error('   ❌ Cannot reach server:', error.message);
  }
  
  console.log('\n✅ Fix Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Refresh the page (F5 or Ctrl+R)');
  console.log('   2. Go to Branch Master form');
  console.log('   3. Check if branches appear');
  console.log('   4. Check browser console for any errors');
})();
