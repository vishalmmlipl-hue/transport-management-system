/**
 * MIGRATE ALL DATA TO RENDER.COM AND CLEAR LOCALSTORAGE
 * 
 * Run this ONCE in browser console to migrate all localStorage data to Render.com
 * Then run CLEAR_LOCALSTORAGE_NOW.js on all other browsers
 * 
 * Copy and paste this entire script into browser console on mmlipl.info
 */

(async () => {
  console.log('🚀 Starting complete data migration to Render.com...\n');
  console.log('📤 This will copy all localStorage data to Render.com server\n');
  
  const API_BASE = 'https://transport-management-system-wzhx.onrender.com/api';
  
  const resources = [
    { key: 'branches', endpoint: '/branches', idField: 'id', uniqueField: 'branchCode' },
    { key: 'cities', endpoint: '/cities', idField: 'id', uniqueField: 'cityCode' },
    { key: 'clients', endpoint: '/clients', idField: 'id', uniqueField: 'code' },
    { key: 'tbbClients', endpoint: '/clients', idField: 'id', uniqueField: 'code' },
    { key: 'vehicles', endpoint: '/vehicles', idField: 'id', uniqueField: 'vehicleNumber' },
    { key: 'drivers', endpoint: '/drivers', idField: 'id', uniqueField: 'licenseNumber' },
    { key: 'staff', endpoint: '/staff', idField: 'id', uniqueField: null },
    { key: 'staffMaster', endpoint: '/staff', idField: 'id', uniqueField: null },
    { key: 'lrBookings', endpoint: '/lrBookings', idField: 'id', uniqueField: 'lrNumber' },
    { key: 'ftlLRBookings', endpoint: '/ftlLRBookings', idField: 'id', uniqueField: 'lrNumber' },
    { key: 'ptlLRBookings', endpoint: '/ptlLRBookings', idField: 'id', uniqueField: 'lrNumber' },
    { key: 'manifests', endpoint: '/manifests', idField: 'id', uniqueField: 'manifestNumber' },
    { key: 'trips', endpoint: '/trips', idField: 'id', uniqueField: 'tripNumber' },
    { key: 'invoices', endpoint: '/invoices', idField: 'id', uniqueField: 'invoiceNumber' },
    { key: 'pods', endpoint: '/pods', idField: 'id', uniqueField: 'lrNumber' },
    { key: 'ftlInquiries', endpoint: '/ftlInquiries', idField: 'id', uniqueField: null },
    { key: 'clientRates', endpoint: '/clientRates', idField: 'id', uniqueField: null },
    { key: 'users', endpoint: '/users', idField: 'id', uniqueField: 'username' }
  ];
  
  let totalStats = {
    migrated: 0,
    skipped: 0,
    errors: 0
  };
  
  // Step 1: Migrate all data
  console.log('📤 STEP 1: Migrating data to Render.com...\n');
  
  for (const resource of resources) {
    try {
      const localData = JSON.parse(localStorage.getItem(resource.key) || '[]');
      
      if (!Array.isArray(localData) || localData.length === 0) {
        console.log(`⏭️  ${resource.key}: No data`);
        continue;
      }
      
      console.log(`📦 ${resource.key}: ${localData.length} items`);
      
      // Get existing data from server
      let existing = [];
      try {
        const checkRes = await fetch(`${API_BASE}${resource.endpoint}`);
        const checkResult = await checkRes.json();
        existing = checkResult.data || [];
      } catch (e) {
        console.warn(`  ⚠️  Could not check server for ${resource.key}`);
      }
      
      let migrated = 0;
      let skipped = 0;
      
      for (const item of localData) {
        try {
          // Check if exists on server
          const exists = existing.some(existingItem => {
            // Check by ID
            if (resource.idField && item[resource.idField] && 
                existingItem[resource.idField] === item[resource.idField]) {
              return true;
            }
            // Check by unique field
            if (resource.uniqueField && item[resource.uniqueField] && 
                existingItem[resource.uniqueField] === item[resource.uniqueField]) {
              return true;
            }
            return false;
          });
          
          if (exists) {
            skipped++;
            continue;
          }
          
          // Create on server
          const response = await fetch(`${API_BASE}${resource.endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item)
          });
          
          const result = await response.json();
          
          if (result.success && result.data) {
            migrated++;
            totalStats.migrated++;
          } else {
            skipped++;
            totalStats.skipped++;
            console.warn(`  ⚠️  Failed: ${result.error || 'Unknown'}`);
          }
        } catch (error) {
          totalStats.errors++;
          console.error(`  ❌ Error: ${error.message}`);
        }
      }
      
      console.log(`  ✅ Migrated: ${migrated}, Skipped: ${skipped}`);
      
      // Small delay
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`❌ Error processing ${resource.key}:`, error);
      totalStats.errors++;
    }
  }
  
  // Step 2: Clear localStorage
  console.log('\n🧹 STEP 2: Clearing localStorage...\n');
  
  const allKeys = resources.map(r => r.key);
  allKeys.push('staffMaster'); // Also clear staffMaster
  
  let cleared = 0;
  for (const key of allKeys) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`✅ Cleared ${key}`);
    }
  }
  
  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${totalStats.migrated} items to Render.com`);
  console.log(`  ⏭️  Skipped: ${totalStats.skipped} items (already on server)`);
  console.log(`  ❌ Errors: ${totalStats.errors} items`);
  console.log(`  🧹 Cleared: ${cleared} localStorage keys`);
  
  console.log('\n✅ Migration complete!');
  console.log('✅ All data is now on Render.com server');
  console.log('✅ localStorage cleared - all browsers will use server data');
  console.log('\n📋 Next Steps:');
  console.log('  1. Run CLEAR_LOCALSTORAGE_NOW.js on all other browsers');
  console.log('  2. Reload this page');
  console.log('  3. Verify data loads from Render.com');
  
  if (confirm('✅ Migration complete! Reload page now?')) {
    window.location.reload();
  }
})();
