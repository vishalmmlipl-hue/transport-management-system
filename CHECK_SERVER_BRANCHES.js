/**
 * CHECK: What Branches Are on Render.com Server
 * 
 * Run this in browser console to see all branches on the server
 */

(async () => {
  console.log('🔍 Checking branches on Render.com server...\n');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  try {
    // Get branches from server
    console.log('📡 Fetching branches from server...');
    const response = await fetch(`${API_URL}/branches`);
    const result = await response.json();
    
    if (result.success) {
      const branches = result.data || [];
      
      console.log(`✅ Server Response: Success`);
      console.log(`📊 Total Branches: ${branches.length}\n`);
      
      if (branches.length === 0) {
        console.log('⚠️ No branches found on server!');
        console.log('💡 You may need to create branches or sync from localStorage.');
      } else {
        console.log('📋 Branches on Server:\n');
        branches.forEach((branch, index) => {
          console.log(`${index + 1}. ${branch.branchName || branch.name || 'Unnamed'}`);
          console.log(`   Code: ${branch.branchCode || branch.code || 'N/A'}`);
          console.log(`   ID: ${branch.id || 'N/A'}`);
          console.log(`   Status: ${branch.status || 'Active'}`);
          console.log(`   City: ${branch.city || 'N/A'}`);
          console.log(`   State: ${branch.state || 'N/A'}`);
          console.log(`   Phone: ${branch.phone || 'N/A'}`);
          console.log(`   Email: ${branch.email || 'N/A'}`);
          console.log(`   Manager: ${branch.managerName || 'Not assigned'}`);
          if (branch.lrPrefix) {
            console.log(`   LR Prefix: ${branch.lrPrefix}`);
          }
          if (branch.lrSeriesStart && branch.lrSeriesEnd) {
            console.log(`   LR Series: ${branch.lrSeriesStart} to ${branch.lrSeriesEnd}`);
          }
          console.log('');
        });
        
        // Summary
        console.log('📊 Summary:');
        console.log(`   Total: ${branches.length}`);
        const active = branches.filter(b => b.status === 'Active' || !b.status).length;
        const inactive = branches.filter(b => b.status === 'Inactive').length;
        console.log(`   Active: ${active}`);
        console.log(`   Inactive: ${inactive}`);
      }
      
      // Compare with localStorage
      console.log('\n📦 Comparing with localStorage...');
      const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
      console.log(`   Server: ${branches.length} branches`);
      console.log(`   localStorage: ${localBranches.length} branches`);
      
      if (localBranches.length > 0) {
        console.log('\n⚠️ WARNING: Branches found in localStorage!');
        console.log('   This means data is not fully synced to server.');
        console.log('   Run QUICK_FIX_BRANCHES.js to sync them.');
        
        // Find differences
        const serverCodes = branches.map(b => (b.branchCode || b.code || '').toUpperCase());
        const localCodes = localBranches.map(b => (b.branchCode || b.code || '').toUpperCase());
        
        const onlyOnServer = branches.filter(b => {
          const code = (b.branchCode || b.code || '').toUpperCase();
          return code && !localCodes.includes(code);
        });
        
        const onlyInLocal = localBranches.filter(b => {
          const code = (b.branchCode || b.code || '').toUpperCase();
          return code && !serverCodes.includes(code);
        });
        
        if (onlyOnServer.length > 0) {
          console.log(`\n   ✅ Branches only on server (${onlyOnServer.length}):`);
          onlyOnServer.forEach(b => {
            console.log(`      - ${b.branchName || b.name} (${b.branchCode || b.code})`);
          });
        }
        
        if (onlyInLocal.length > 0) {
          console.log(`\n   ⚠️ Branches only in localStorage (${onlyInLocal.length}):`);
          onlyInLocal.forEach(b => {
            console.log(`      - ${b.branchName || b.name} (${b.branchCode || b.code})`);
          });
          console.log('   💡 Run QUICK_FIX_BRANCHES.js to sync these to server');
        }
        
        if (onlyOnServer.length === 0 && onlyInLocal.length === 0) {
          console.log('   ✅ Server and localStorage match!');
        }
      } else {
        console.log('   ✅ localStorage is empty - good!');
        console.log('   ✅ All data is on server');
      }
      
    } else {
      console.error('❌ Server Response Error:', result.error || result.message);
      console.log('   Full response:', result);
    }
    
  } catch (error) {
    console.error('❌ Error fetching branches:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('   1. Check if Render.com server is running');
    console.log('   2. Check Network tab for CORS errors');
    console.log('   3. Verify API URL is correct');
    console.log('   4. Check console for other errors');
  }
  
  console.log('\n✅ Check complete!');
})();
