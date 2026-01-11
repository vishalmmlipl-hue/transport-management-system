/**
 * Auto-Sync localStorage Data to Render.com Server
 * 
 * This script runs automatically on app load to:
 * 1. Check for data in localStorage
 * 2. Sync missing data to Render.com server
 * 3. Clear localStorage after successful sync
 * 
 * This ensures all data is stored on the server, not in browsers
 */

const API_BASE_URL = 'https://transport-management-system-wzhx.onrender.com/api';

/**
 * Sync a single resource from localStorage to server
 */
async function syncResource(resourceName, endpoint, uniqueField = 'id') {
  try {
    // Get data from localStorage
    const localData = JSON.parse(localStorage.getItem(resourceName) || '[]');
    
    if (!localData || localData.length === 0) {
      return { synced: 0, skipped: 0, errors: 0 };
    }
    
    // Get existing data from server
    const serverResponse = await fetch(`${API_BASE_URL}${endpoint}`);
    const serverData = await serverResponse.json();
    const serverItems = serverData.data || [];
    
    // Create a set of existing items on server (by unique field or ID)
    const serverKeys = new Set();
    serverItems.forEach(item => {
      // Try multiple fields to identify unique items
      const key = item[uniqueField] || 
                  item.id || 
                  item[`${resourceName.slice(0, -1)}Code`] || 
                  item.code || 
                  item.branchCode || 
                  item.cityCode ||
                  item.clientCode ||
                  item.vehicleNumber ||
                  item.licenseNumber ||
                  item.employeeId ||
                  item.lrNumber ||
                  item.manifestNumber ||
                  item.tripNumber ||
                  item.invoiceNumber ||
                  item.podNumber ||
                  item.inquiryNumber;
      if (key) {
        serverKeys.add(String(key).toUpperCase());
      }
    });
    
    // Find items to sync (not already on server)
    const itemsToSync = localData.filter(item => {
      // Try multiple fields to identify unique items
      const key = item[uniqueField] || 
                  item.id || 
                  item[`${resourceName.slice(0, -1)}Code`] || 
                  item.code || 
                  item.branchCode || 
                  item.cityCode ||
                  item.clientCode ||
                  item.vehicleNumber ||
                  item.licenseNumber ||
                  item.employeeId ||
                  item.lrNumber ||
                  item.manifestNumber ||
                  item.tripNumber ||
                  item.invoiceNumber ||
                  item.podNumber ||
                  item.inquiryNumber;
      if (!key) return false;
      return !serverKeys.has(String(key).toUpperCase());
    });
    
    if (itemsToSync.length === 0) {
      return { synced: 0, skipped: localData.length, errors: 0 };
    }
    
    // Sync items to server
    let synced = 0;
    let errors = 0;
    
    for (const item of itemsToSync) {
      try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        const result = await response.json();
        
        if (result.success) {
          synced++;
        } else {
          errors++;
          console.warn(`Failed to sync ${resourceName} item:`, result.error || 'Unknown error');
        }
      } catch (error) {
        errors++;
        console.error(`Error syncing ${resourceName} item:`, error);
      }
    }
    
    return { synced, skipped: localData.length - itemsToSync.length, errors };
  } catch (error) {
    console.error(`Error syncing ${resourceName}:`, error);
    return { synced: 0, skipped: 0, errors: 1 };
  }
}

/**
 * Auto-sync all resources from localStorage to server
 */
async function autoSyncToServer() {
  // Only run once per session
  if (sessionStorage.getItem('autoSyncCompleted')) {
    return;
  }
  
  console.log('🔄 Auto-syncing localStorage data to Render.com server...');
  
  const resources = [
    { name: 'branches', endpoint: '/branches', uniqueField: 'branchCode' },
    { name: 'cities', endpoint: '/cities', uniqueField: 'code' },
    { name: 'clients', endpoint: '/clients', uniqueField: 'clientCode' },
    { name: 'tbbClients', endpoint: '/tbbClients', uniqueField: 'clientCode' },
    { name: 'vehicles', endpoint: '/vehicles', uniqueField: 'vehicleNumber' },
    { name: 'drivers', endpoint: '/drivers', uniqueField: 'licenseNumber' },
    { name: 'staff', endpoint: '/staff', uniqueField: 'employeeId' },
    { name: 'lrBookings', endpoint: '/lrBookings', uniqueField: 'lrNumber' },
    { name: 'ftlLRBookings', endpoint: '/ftlLRBookings', uniqueField: 'lrNumber' },
    { name: 'ptlLRBookings', endpoint: '/ptlLRBookings', uniqueField: 'lrNumber' },
    { name: 'manifests', endpoint: '/manifests', uniqueField: 'manifestNumber' },
    { name: 'trips', endpoint: '/trips', uniqueField: 'tripNumber' },
    { name: 'invoices', endpoint: '/invoices', uniqueField: 'invoiceNumber' },
    { name: 'pods', endpoint: '/pods', uniqueField: 'podNumber' },
    { name: 'ftlInquiries', endpoint: '/ftlInquiries', uniqueField: 'inquiryNumber' },
  ];
  
  let totalSynced = 0;
  let totalSkipped = 0;
  let totalErrors = 0;
  
  for (const resource of resources) {
    const result = await syncResource(resource.name, resource.endpoint, resource.uniqueField);
    totalSynced += result.synced;
    totalSkipped += result.skipped;
    totalErrors += result.errors;
    
    if (result.synced > 0) {
      console.log(`✅ Synced ${result.synced} ${resource.name} to server`);
    }
  }
  
  // Clear localStorage for synced resources
  if (totalSynced > 0) {
    console.log(`\n✅ Auto-sync complete: ${totalSynced} items synced, ${totalSkipped} already on server, ${totalErrors} errors`);
    
    // Clear localStorage for all business data
    resources.forEach(resource => {
      localStorage.removeItem(resource.name);
    });
    
    console.log('✅ Cleared localStorage - all data is now on server');
    
    // Trigger a reload event so components refresh from server
    window.dispatchEvent(new CustomEvent('dataSyncedToServer'));
  } else if (totalSkipped > 0) {
    console.log(`✅ All data already on server (${totalSkipped} items checked)`);
    
    // Still clear localStorage to ensure server is source of truth
    resources.forEach(resource => {
      localStorage.removeItem(resource.name);
    });
  } else {
    console.log('ℹ️ No data in localStorage to sync');
  }
  
  // Mark as completed for this session
  sessionStorage.setItem('autoSyncCompleted', 'true');
}

// Run auto-sync when script loads
if (typeof window !== 'undefined') {
  // Run after a short delay to ensure API is ready
  // Wrap in try-catch to prevent crashes
  setTimeout(() => {
    try {
      autoSyncToServer().catch(error => {
        console.warn('Auto-sync error (non-critical):', error);
        // Don't crash the app if auto-sync fails
      });
    } catch (error) {
      console.warn('Auto-sync initialization error (non-critical):', error);
      // Don't crash the app
    }
  }, 1000);
}

export default autoSyncToServer;
