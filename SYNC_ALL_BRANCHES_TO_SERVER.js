/**
 * SYNC: Merge All Branches from Both Browsers to Server
 * 
 * Run this to see what branches exist and sync them all to server
 */

(async () => {
  console.log('🔄 Syncing all branches to Render.com server...\n');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // Step 1: Get branches from server
  console.log('1️⃣ Getting branches from server...');
  let serverBranches = [];
  try {
    const response = await fetch(`${API_URL}/branches`);
    const result = await response.json();
    serverBranches = result.data || [];
    console.log(`   Server has ${serverBranches.length} branches`);
    serverBranches.forEach(b => {
      console.log(`   - ${b.branchName} (${b.branchCode})`);
    });
  } catch (error) {
    console.error('   ❌ Error getting server branches:', error);
  }
  
  // Step 2: Get branches from localStorage
  console.log('\n2️⃣ Getting branches from localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has ${localBranches.length} branches`);
  localBranches.forEach(b => {
    console.log(`   - ${b.branchName || b.name} (${b.branchCode || b.code})`);
  });
  
  // Step 3: Find branches in localStorage that aren't on server
  console.log('\n3️⃣ Finding branches to sync...');
  const serverCodes = serverBranches.map(b => (b.branchCode || b.code).toUpperCase());
  const branchesToSync = localBranches.filter(b => {
    const code = (b.branchCode || b.code || '').toUpperCase();
    return code && !serverCodes.includes(code);
  });
  
  console.log(`   Found ${branchesToSync.length} branches to sync`);
  
  if (branchesToSync.length === 0) {
    console.log('   ✅ All branches are already on server!');
  } else {
    // Step 4: Sync branches to server
    console.log('\n4️⃣ Syncing branches to server...');
    let synced = 0;
    let failed = 0;
    
    for (const branch of branchesToSync) {
      try {
        const branchData = {
          branchName: branch.branchName || branch.name,
          branchCode: branch.branchCode || branch.code,
          address: branch.address || '',
          city: branch.city || '',
          state: branch.state || '',
          pincode: branch.pincode || '',
          phone: branch.phone || '',
          email: branch.email || '',
          gstNumber: branch.gstNumber || '',
          isHeadOffice: branch.isHeadOffice || false,
          managerName: branch.managerName || '',
          managerMobile: branch.managerMobile || '',
          lrSeriesStart: branch.lrSeriesStart || '',
          lrSeriesEnd: branch.lrSeriesEnd || '',
          lrSeriesCurrent: branch.lrSeriesCurrent || '',
          lrPrefix: branch.lrPrefix || '',
          status: branch.status || 'Active',
          nearbyCities: branch.nearbyCities || [],
          odaLocations: branch.odaLocations || [],
          createdAt: branch.createdAt || new Date().toISOString()
        };
        
        const response = await fetch(`${API_URL}/branches`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(branchData)
        });
        
        const result = await response.json();
        
        if (result.success) {
          synced++;
          console.log(`   ✅ Synced: ${branchData.branchName} (${branchData.branchCode})`);
        } else {
          failed++;
          console.error(`   ❌ Failed: ${branchData.branchName} - ${result.error || 'Unknown error'}`);
        }
      } catch (error) {
        failed++;
        console.error(`   ❌ Error syncing ${branch.branchName || branch.name}:`, error.message);
      }
    }
    
    console.log(`\n   ✅ Synced ${synced} branches`);
    if (failed > 0) {
      console.log(`   ⚠️ Failed to sync ${failed} branches`);
    }
  }
  
  // Step 5: Verify final state
  console.log('\n5️⃣ Verifying final state...');
  try {
    const verifyResponse = await fetch(`${API_URL}/branches`);
    const verifyResult = await verifyResponse.json();
    const finalBranches = verifyResult.data || [];
    console.log(`   Server now has ${finalBranches.length} branches:`);
    finalBranches.forEach(b => {
      console.log(`   - ${b.branchName} (${b.branchCode})`);
    });
  } catch (error) {
    console.error('   ❌ Error verifying:', error);
  }
  
  // Step 6: Clear localStorage
  console.log('\n6️⃣ Clearing localStorage...');
  localStorage.removeItem('branches');
  console.log('   ✅ localStorage cleared');
  
  console.log('\n✅ Sync complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Run this script in BOTH browsers');
  console.log('   2. Clear localStorage on both: localStorage.removeItem("branches")');
  console.log('   3. Reload both browsers');
  console.log('   4. All branches should now be the same!');
})();
