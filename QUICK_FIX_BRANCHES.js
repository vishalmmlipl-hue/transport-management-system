/**
 * QUICK FIX: Sync All Branches and Clear localStorage
 * 
 * Run this in BOTH browsers to fix branch differences
 */

(async () => {
  console.log('🔧 Fixing branch differences...\n');
  
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  // 1. Get server branches
  console.log('1️⃣ Getting branches from server...');
  let serverBranches = [];
  try {
    const serverRes = await fetch(`${API_URL}/branches`);
    const serverData = await serverRes.json();
    serverBranches = serverData.data || [];
    console.log(`   Server has ${serverBranches.length} branches`);
    serverBranches.forEach(b => {
      console.log(`   - ${b.branchName} (${b.branchCode})`);
    });
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  // 2. Get local branches
  console.log('\n2️⃣ Getting branches from localStorage...');
  const localBranches = JSON.parse(localStorage.getItem('branches') || '[]');
  console.log(`   localStorage has ${localBranches.length} branches`);
  localBranches.forEach(b => {
    console.log(`   - ${b.branchName || b.name} (${b.branchCode || b.code})`);
  });
  
  // 3. Sync missing branches
  if (localBranches.length > 0) {
    console.log('\n3️⃣ Syncing missing branches to server...');
    const serverCodes = serverBranches.map(b => (b.branchCode || '').toUpperCase());
    const toSync = localBranches.filter(b => {
      const code = (b.branchCode || b.code || '').toUpperCase();
      return code && !serverCodes.includes(code);
    });
    
    console.log(`   Found ${toSync.length} branches to sync`);
    
    for (const branch of toSync) {
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
          console.log(`   ✅ Synced: ${branchData.branchName}`);
        } else {
          console.error(`   ❌ Failed: ${branchData.branchName}`);
        }
      } catch (error) {
        console.error(`   ❌ Error: ${branch.branchName || branch.name}`, error);
      }
    }
  } else {
    console.log('   ✅ No branches in localStorage to sync');
  }
  
  // 4. Clear localStorage
  console.log('\n4️⃣ Clearing localStorage...');
  localStorage.removeItem('branches');
  console.log('   ✅ Cleared');
  
  // 5. Verify final state
  console.log('\n5️⃣ Verifying server state...');
  try {
    const verifyRes = await fetch(`${API_URL}/branches`);
    const verifyData = await verifyRes.json();
    const finalBranches = verifyData.data || [];
    console.log(`   Server now has ${finalBranches.length} branches:`);
    finalBranches.forEach(b => {
      console.log(`   - ${b.branchName} (${b.branchCode})`);
    });
  } catch (error) {
    console.error('   ❌ Error:', error);
  }
  
  console.log('\n✅ Fix complete!');
  console.log('\n💡 Next: Reload the page and both browsers should show the same branches!');
  console.log('   Run: window.location.reload()');
})();
