/**
 * Force Server Data Only - Remove localStorage Fallbacks
 * 
 * This script ensures all components use server data only
 * Run this on app initialization
 */

export const forceServerDataOnly = () => {
  console.log('🔒 Forcing server data only - clearing localStorage business data...\n');
  
  // List of all business data keys
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
  
  for (const key of businessDataKeys) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
    }
  }
  
  console.log(`✅ Cleared ${cleared} localStorage keys`);
  console.log('✅ All components will now load from Render.com server only');
  console.log('✅ This ensures all browsers see the same data');
  
  // Set flag to prevent localStorage usage
  sessionStorage.setItem('serverDataOnly', 'true');
  
  return cleared;
};

// Auto-run on import
// But wait for auto-sync to complete first
if (typeof window !== 'undefined') {
  // Only run once per session
  if (!sessionStorage.getItem('serverDataOnly')) {
    // Wait for auto-sync to complete (runs after 1 second)
    // Then clear localStorage (runs after 3 seconds)
    setTimeout(() => {
      if (sessionStorage.getItem('autoSyncCompleted')) {
        forceServerDataOnly();
      } else {
        // If auto-sync hasn't completed, wait a bit more
        setTimeout(() => {
          forceServerDataOnly();
        }, 2000);
      }
    }, 3000);
  }
}

export default forceServerDataOnly;
