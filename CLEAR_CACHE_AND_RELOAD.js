// Clear Cache and Reload from Server
// Copy and paste this ENTIRE script into browser console

(async () => {
  console.log('🧹 Clearing cache and reloading from server...\n');
  
  // Clear all master data cache
  const keysToClear = [
    'branches', 
    'cities', 
    'vehicles', 
    'drivers', 
    'staff', 
    'clients',
    'tbbClients',
    'lrBookings',
    'ftlLRBookings',
    'ptlLRBookings',
    'manifests',
    'trips',
    'invoices',
    'pods'
  ];
  
  keysToClear.forEach(key => {
    localStorage.removeItem(key);
    console.log(`✅ Cleared ${key}`);
  });
  
  console.log('\n✅ All cache cleared!');
  console.log('🔄 Reloading page to get fresh data from server...\n');
  
  // Reload page
  window.location.reload();
})();
