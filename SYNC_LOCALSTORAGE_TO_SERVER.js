// Sync All localStorage Data to Server
// Run this to push all existing localStorage data to the server

(async () => {
  const API_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  console.log('🔄 Syncing localStorage Data to Server...\n');
  
  // Get all localStorage keys that might have data
  const storageKeys = [
    'branches', 'cities', 'clients', 'tbbClients', 'vehicles', 'drivers',
    'staff', 'users', 'lrBookings', 'ftlLRBookings', 'ptlLRBookings',
    'manifests', 'trips', 'invoices', 'pods', 'accounts', 'expenseTypes',
    'branchExpenses', 'marketVehicleVendors', 'otherVendors', 'ftlInquiries'
  ];
  
  let totalSynced = 0;
  let totalFailed = 0;
  const results = {};
  
  for (const storageKey of storageKeys) {
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (localData.length === 0) {
      console.log(`⏭️  Skipping ${storageKey} (empty)`);
      continue;
    }
    
    console.log(`\n📦 Syncing ${storageKey} (${localData.length} items)...`);
    
    let synced = 0;
    let failed = 0;
    
    for (const item of localData) {
      try {
        // Determine table name
        const tableName = storageKey === 'tbbClients' ? 'clients' : storageKey;
        
        // Check if item exists on server
        const checkResponse = await fetch(`${API_URL}/${tableName}/${item.id}`);
        const checkData = await checkResponse.json();
        
        let response;
        if (checkData.success && checkData.data) {
          // Update existing
          console.log(`   Updating ${storageKey} item ${item.id}...`);
          response = await fetch(`${API_URL}/${tableName}/${item.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
        } else {
          // Create new
          console.log(`   Creating ${storageKey} item ${item.id}...`);
          response = await fetch(`${API_URL}/${tableName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
        }
        
        const result = await response.json();
        
        if (result.success) {
          synced++;
          totalSynced++;
        } else {
          failed++;
          totalFailed++;
          console.error(`   ❌ Failed:`, result);
        }
      } catch (error) {
        failed++;
        totalFailed++;
        console.error(`   ❌ Error syncing item ${item.id}:`, error.message);
      }
    }
    
    results[storageKey] = { synced, failed, total: localData.length };
    console.log(`   ✅ Synced: ${synced}, ❌ Failed: ${failed}`);
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 Sync Summary:');
  console.log('='.repeat(50));
  console.log(`✅ Total synced: ${totalSynced}`);
  console.log(`❌ Total failed: ${totalFailed}`);
  console.log('\nDetails:');
  Object.entries(results).forEach(([key, stats]) => {
    if (stats.total > 0) {
      console.log(`  ${key}: ${stats.synced}/${stats.total} synced`);
    }
  });
  
  // Verify branches on server
  console.log('\n🔍 Verifying branches on server...');
  const verifyResponse = await fetch(`${API_URL}/branches`);
  const verifyData = await verifyResponse.json();
  console.log(`   Server now has: ${verifyData.data.length} branches`);
  
  if (verifyData.data.length > 0) {
    console.log('   Branches:');
    verifyData.data.forEach(b => {
      console.log(`   - ${b.branchName} (ID: ${b.id})`);
    });
  }
  
  console.log('\n✅ Sync Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Run this script on BOTH systems');
  console.log('   2. Then test creating new data');
  console.log('   3. Check if new data appears on both systems');
})();
