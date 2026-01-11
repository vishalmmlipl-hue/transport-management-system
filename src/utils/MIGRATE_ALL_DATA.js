/**
 * MIGRATE ALL DATA FROM LOCALSTORAGE TO RENDER.COM
 * 
 * Run this script ONCE in browser console to migrate all data
 * Then all browsers will use the same server data
 * 
 * Copy and paste this entire script into browser console on mmlipl.info
 */

(async () => {
  console.log('🚀 Starting complete data migration to Render.com...\n');
  
  const API_BASE_URL = 'https://transport-management-system-wzhx.onrender.com/api';
  
  const resources = [
    { key: 'branches', endpoint: '/branches', uniqueField: 'branchCode' },
    { key: 'cities', endpoint: '/cities', uniqueField: 'cityCode' },
    { key: 'clients', endpoint: '/clients', uniqueField: 'code' },
    { key: 'tbbClients', endpoint: '/clients', uniqueField: 'code' },
    { key: 'vehicles', endpoint: '/vehicles', uniqueField: 'vehicleNumber' },
    { key: 'drivers', endpoint: '/drivers', uniqueField: 'licenseNumber' },
    { key: 'staff', endpoint: '/staff', uniqueField: null },
    { key: 'staffMaster', endpoint: '/staff', uniqueField: null },
    { key: 'lrBookings', endpoint: '/lrBookings', uniqueField: 'lrNumber' },
    { key: 'ftlLRBookings', endpoint: '/ftlLRBookings', uniqueField: 'lrNumber' },
    { key: 'ptlLRBookings', endpoint: '/ptlLRBookings', uniqueField: 'lrNumber' },
    { key: 'manifests', endpoint: '/manifests', uniqueField: 'manifestNumber' },
    { key: 'trips', endpoint: '/trips', uniqueField: 'tripNumber' },
    { key: 'invoices', endpoint: '/invoices', uniqueField: 'invoiceNumber' },
    { key: 'pods', endpoint: '/pods', uniqueField: 'lrNumber' },
    { key: 'ftlInquiries', endpoint: '/ftlInquiries', uniqueField: null },
    { key: 'clientRates', endpoint: '/clientRates', uniqueField: null },
    { key: 'users', endpoint: '/users', uniqueField: 'username' }
  ];
  
  let totalMigrated = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const resource of resources) {
    try {
      const localData = JSON.parse(localStorage.getItem(resource.key) || '[]');
      
      if (!Array.isArray(localData) || localData.length === 0) {
        console.log(`⏭️  ${resource.key}: No data to migrate`);
        continue;
      }
      
      console.log(`\n📦 ${resource.key}: ${localData.length} items`);
      
      // Get existing data from server
      const checkResponse = await fetch(`${API_BASE_URL}${resource.endpoint}`);
      const checkResult = await checkResponse.json();
      const existing = checkResult.data || [];
      
      let migrated = 0;
      let skipped = 0;
      
      for (const item of localData) {
        try {
          // Check if exists
          const exists = existing.some(existingItem => {
            if (item.id && existingItem.id === item.id) return true;
            if (resource.uniqueField && item[resource.uniqueField] && 
                existingItem[resource.uniqueField] === item[resource.uniqueField]) return true;
            return false;
          });
          
          if (exists) {
            skipped++;
            continue;
          }
          
          // Create on server
          const response = await fetch(`${API_BASE_URL}${resource.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            migrated++;
            totalMigrated++;
          } else {
            skipped++;
            totalSkipped++;
            console.warn(`  ⚠️ Failed: ${result.error || 'Unknown error'}`);
          }
        } catch (error) {
          totalErrors++;
          console.error(`  ❌ Error: ${error.message}`);
        }
      }
      
      console.log(`  ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error processing ${resource.key}:`, error);
      totalErrors++;
    }
  }
  
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Total Migrated: ${totalMigrated}`);
  console.log(`  ⏭️  Total Skipped: ${totalSkipped} (already on server)`);
  console.log(`  ❌ Total Errors: ${totalErrors}`);
  
  // Clear localStorage
  console.log('\n🧹 Clearing localStorage...');
  const keysToClear = resources.map(r => r.key);
  let cleared = 0;
  
  for (const key of keysToClear) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
    }
  }
  
  console.log(`✅ Cleared ${cleared} localStorage keys`);
  console.log('\n✅ Migration complete!');
  console.log('✅ All browsers will now use the same server data');
  console.log('🔄 Reload the page to see changes');
  
  // Ask to reload
  if (confirm('✅ Migration complete! Reload page now?')) {
    window.location.reload();
  }
})();
