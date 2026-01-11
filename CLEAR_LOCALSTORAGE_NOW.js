/**
 * CLEAR ALL LOCALSTORAGE BUSINESS DATA
 * 
 * Run this in browser console on EACH browser to ensure all browsers use server data
 * 
 * Copy and paste this entire script into browser console
 */

(() => {
  console.log('🧹 Clearing all localStorage business data...\n');
  
  // All business data keys that should be on server
  const businessDataKeys = [
    'branches',
    'cities',
    'clients',
    'tbbClients',
    'vehicles',
    'drivers',
    'staff',
    'staffMaster',
    'lrBookings',
    'ftlLRBookings',
    'ptlLRBookings',
    'manifests',
    'trips',
    'invoices',
    'pods',
    'ftlInquiries',
    'clientRates',
    'users',
    'branchAccounts',
    'accountMaster',
    'expenseMaster',
    'branchFundAllocations',
    'marketVehicleVendors',
    'otherVendors',
    'tripSheets',
    'payments'
  ];
  
  let cleared = 0;
  let found = [];
  
  // Clear each key
  for (const key of businessDataKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      localStorage.removeItem(key);
      cleared++;
      const itemCount = JSON.parse(data).length || 0;
      found.push(`${key} (${itemCount} items)`);
      console.log(`✅ Cleared ${key} (${itemCount} items)`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`  ✅ Cleared: ${cleared} localStorage keys`);
  console.log(`  📦 Found data in: ${found.length > 0 ? found.join(', ') : 'none'}`);
  
  if (cleared > 0) {
    console.log(`\n⚠️  WARNING: You had ${cleared} localStorage keys with data!`);
    console.log(`⚠️  This data was browser-specific and may not match other browsers.`);
    console.log(`\n✅ All business data cleared from localStorage`);
    console.log(`✅ App will now load from Render.com server`);
    console.log(`✅ All browsers will see the same data`);
  } else {
    console.log(`\n✅ No business data found in localStorage`);
    console.log(`✅ App is already using server data`);
  }
  
  console.log(`\n🔄 Reloading page in 2 seconds...`);
  
  setTimeout(() => {
    window.location.reload();
  }, 2000);
})();
