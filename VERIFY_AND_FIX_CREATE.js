// Verify and Fix Branch Creation
// Run this to check if new branches are saving to server

(async () => {
  console.log('🔍 Verifying Branch Creation...\n');
  
  // Check current state
  const serverResponse = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
  const serverData = await serverResponse.json();
  console.log('Server has:', serverData.data.length, 'branches');
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log('localStorage has:', localBranches.length, 'branches');
  
  if (localBranches.length > serverData.data.length) {
    console.log('\n⚠️ localStorage has MORE branches than server!');
    console.log('   This means new branches are NOT saving to server.');
    console.log('   Missing branches:', localBranches.length - serverData.data.length);
    
    // Find missing branches
    const missing = localBranches.filter(function(local) {
      return !serverData.data.find(function(server) {
        return server.branchCode === local.branchCode || 
               server.branchName === local.branchName;
      });
    });
    
    console.log('\nMissing branches:');
    missing.forEach(function(b) {
      console.log('  - ' + b.branchName + ' (Code: ' + b.branchCode + ')');
    });
    
    console.log('\n💡 Try creating a branch in the app and watch the console logs.');
    console.log('💡 You should see: 🔄 Calling syncService.save()...');
    console.log('💡 If you don\'t see that, refresh the page to load updated code.');
  } else {
    console.log('\n✅ localStorage matches server!');
  }
})();
