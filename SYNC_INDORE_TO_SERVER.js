// Sync INDORE Branch to Server
// Run this on System A to sync the INDORE branch

(async () => {
  console.log('🔄 Syncing INDORE Branch to Server...\n');
  
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  const indoreBranch = localBranches.find(function(b) { return b.branchName === 'INDORE' || b.branchCode === 'IDR001'; });
  
  if (!indoreBranch) {
    console.log('❌ INDORE branch not found in localStorage');
    return;
  }
  
  console.log('Found INDORE branch:', indoreBranch);
  console.log('Syncing to server...');
  
  try {
    const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(indoreBranch)
    });
    
    const result = await response.json();
    console.log('Response:', result);
    
    if (result.success) {
      console.log('✅ INDORE branch synced to server!');
      
      // Verify
      const verify = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const verifyData = await verify.json();
      console.log('\n✅ Server now has:', verifyData.data.length, 'branches');
      
      console.log('\n💡 Now run the sync script on System B!');
    } else {
      console.error('❌ Failed:', result.error);
      console.log('\n💡 Try creating a new branch in the app instead');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
