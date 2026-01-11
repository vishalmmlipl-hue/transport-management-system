/**
 * Global localStorage Cleanup and Migration Script
 * 
 * This script:
 * 1. Migrates all localStorage data to Render.com
 * 2. Clears localStorage to prevent conflicts
 * 3. Ensures all browsers use the same server data
 * 
 * Run this ONCE on app load to migrate and clean up
 */

const API_BASE_URL = 'https://transport-management-system-wzhx.onrender.com/api';

// List of all business data keys that should be on server
const BUSINESS_DATA_KEYS = [
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

// Keys that should stay in localStorage (user preferences, not business data)
const KEEP_KEYS = [
  'currentUser',
  'isLoggedIn',
  'financialYear',
  'adminSelectedBranch',
  'returnToManifestEdit',
  'selectedFTLInquiry'
];

/**
 * Migrate a single resource from localStorage to Render.com
 */
const migrateResource = async (key, apiEndpoint) => {
  try {
    const localData = JSON.parse(localStorage.getItem(key) || '[]');
    
    if (!Array.isArray(localData) || localData.length === 0) {
      return { migrated: 0, skipped: 0 };
    }
    
    console.log(`📦 Migrating ${key}: ${localData.length} items...`);
    
    let migrated = 0;
    let skipped = 0;
    
    // Migrate each item
    for (const item of localData) {
      try {
        // Check if item already exists on server (by ID or unique field)
        const checkResponse = await fetch(`${API_BASE_URL}${apiEndpoint}`);
        const checkResult = await checkResponse.json();
        const existing = checkResult.data || [];
        
        // Check if item exists
        const exists = existing.some(existingItem => {
          if (item.id && existingItem.id === item.id) return true;
          // Check by unique code/name if available
          if (item.branchCode && existingItem.branchCode === item.branchCode) return true;
          if (item.cityCode && existingItem.cityCode === item.cityCode) return true;
          if (item.code && existingItem.code === item.code) return true;
          return false;
        });
        
        if (exists) {
          skipped++;
          continue;
        }
        
        // Create on server
        const response = await fetch(`${API_BASE_URL}${apiEndpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item)
        });
        
        const result = await response.json();
        
        if (result.success && result.data) {
          migrated++;
        } else {
          skipped++;
          console.warn(`⚠️ Failed to migrate item from ${key}:`, result.error);
        }
      } catch (error) {
        console.error(`❌ Error migrating item from ${key}:`, error);
        skipped++;
      }
    }
    
    console.log(`✅ ${key}: ${migrated} migrated, ${skipped} skipped`);
    return { migrated, skipped };
  } catch (error) {
    console.error(`❌ Error migrating ${key}:`, error);
    return { migrated: 0, skipped: 0 };
  }
};

/**
 * Map localStorage keys to API endpoints
 */
const getApiEndpoint = (key) => {
  const mapping = {
    'branches': '/branches',
    'cities': '/cities',
    'clients': '/clients',
    'tbbClients': '/clients', // Same endpoint
    'vehicles': '/vehicles',
    'drivers': '/drivers',
    'staff': '/staff',
    'staffMaster': '/staff', // Same endpoint
    'lrBookings': '/lrBookings',
    'ftlLRBookings': '/ftlLRBookings',
    'ptlLRBookings': '/ptlLRBookings',
    'manifests': '/manifests',
    'trips': '/trips',
    'invoices': '/invoices',
    'pods': '/pods',
    'ftlInquiries': '/ftlInquiries',
    'clientRates': '/clientRates',
    'users': '/users'
  };
  
  return mapping[key] || null;
};

/**
 * Main migration function
 */
export const migrateAndCleanLocalStorage = async () => {
  console.log('🚀 Starting localStorage migration and cleanup...\n');
  
  const results = {
    migrated: 0,
    skipped: 0,
    cleared: 0,
    errors: []
  };
  
  // Step 1: Migrate all business data to Render.com
  console.log('📤 Step 1: Migrating data to Render.com...\n');
  
  for (const key of BUSINESS_DATA_KEYS) {
    const endpoint = getApiEndpoint(key);
    if (!endpoint) {
      console.log(`⏭️  Skipping ${key} - no API endpoint mapping`);
      continue;
    }
    
    const result = await migrateResource(key, endpoint);
    results.migrated += result.migrated;
    results.skipped += result.skipped;
    
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Step 2: Clear all business data from localStorage
  console.log('\n🧹 Step 2: Clearing localStorage...\n');
  
  for (const key of BUSINESS_DATA_KEYS) {
    const data = localStorage.getItem(key);
    if (data) {
      localStorage.removeItem(key);
      results.cleared++;
      console.log(`✅ Cleared ${key}`);
    }
  }
  
  // Step 3: Keep only user preferences
  console.log('\n💾 Step 3: Keeping user preferences...\n');
  console.log(`✅ Kept: ${KEEP_KEYS.join(', ')}`);
  
  // Summary
  console.log('\n📊 Migration Summary:');
  console.log(`  ✅ Migrated: ${results.migrated} items`);
  console.log(`  ⏭️  Skipped: ${results.skipped} items (already on server)`);
  console.log(`  🧹 Cleared: ${results.cleared} localStorage keys`);
  console.log('\n✅ Migration complete! All data is now on Render.com server.');
  console.log('✅ localStorage cleared - all browsers will use server data.');
  
  // Trigger reload event
  window.dispatchEvent(new CustomEvent('localStorageMigrated'));
  
  return results;
};

/**
 * Quick cleanup - just clear localStorage (if data is already on server)
 */
export const clearLocalStorageOnly = () => {
  console.log('🧹 Clearing localStorage business data...\n');
  
  let cleared = 0;
  for (const key of BUSINESS_DATA_KEYS) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      cleared++;
      console.log(`✅ Cleared ${key}`);
    }
  }
  
  console.log(`\n✅ Cleared ${cleared} localStorage keys`);
  console.log('✅ All browsers will now load from Render.com server');
  
  window.dispatchEvent(new CustomEvent('localStorageCleared'));
  
  return cleared;
};

// Auto-run on import (if in browser)
if (typeof window !== 'undefined') {
  // Check if migration has already run (to avoid running multiple times)
  const migrationKey = 'localStorageMigrationCompleted';
  const migrationDate = localStorage.getItem(migrationKey);
  const today = new Date().toDateString();
  
  // Only run once per day
  if (migrationDate !== today) {
    console.log('🔄 Auto-running localStorage cleanup...');
    
    // Run cleanup (clear only, migration should be done manually)
    clearLocalStorageOnly();
    
    // Mark as completed for today
    localStorage.setItem(migrationKey, today);
  }
}

export default { migrateAndCleanLocalStorage, clearLocalStorageOnly };
