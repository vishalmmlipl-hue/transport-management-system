// Data Sync Service
// Saves data to both API server (for multi-system sync) and localStorage (for offline fallback)

import databaseAPI from './database-api';

// Map localStorage keys to API table names
const STORAGE_TO_TABLE = {
  'lrBookings': 'lrBookings',
  'ftlLRBookings': 'ftlLRBookings',
  'ptlLRBookings': 'ptlLRBookings',
  'manifests': 'manifests',
  'trips': 'trips',
  'invoices': 'invoices',
  'pods': 'pods',
  'clients': 'clients',
  'tbbClients': 'clients',
  'branches': 'branches',
  'cities': 'cities',
  'vehicles': 'vehicles',
  'drivers': 'drivers',
  'staff': 'staff',
  'users': 'users',
  'accounts': 'accounts',
  'expenseTypes': 'expenseTypes',
  'branchExpenses': 'branchExpenses',
  'marketVehicleVendors': 'marketVehicleVendors',
  'otherVendors': 'otherVendors',
  'ftlInquiries': 'ftlInquiries',
};

// Get table name from localStorage key
const getTableName = (storageKey) => {
  return STORAGE_TO_TABLE[storageKey] || storageKey;
};

// Sync Service
export const syncService = {
  // Save data to both API and localStorage
  async save(storageKey, data, isUpdate = false, id = null) {
    const tableName = getTableName(storageKey);
    
    console.log(`💾 Saving ${storageKey} to server...`, { tableName, isUpdate, id });
    
    try {
      // Try to save to API first
      let apiResult;
      if (isUpdate && id) {
        console.log(`   Updating ${tableName} with ID ${id}`);
        apiResult = await databaseAPI.update(tableName, id, data);
      } else {
        console.log(`   Creating new ${tableName}`);
        apiResult = await databaseAPI.create(tableName, data);
      }

      console.log(`   API result:`, apiResult);

      // Check if API save was successful
      // apiResult should be the data object if successful (from databaseAPI.create/update)
      // If it has _fallback or _apiFailed flag, it means API failed and localStorage was used
      const hasFallbackFlag = apiResult && (apiResult._fallback === true || apiResult._apiFailed === true);
      const hasSuccessFalse = apiResult && apiResult.success === false;
      
      // Check if apiResult looks like valid data (has id or any data fields)
      // More generic check - works for all table types
      const looksLikeData = apiResult && typeof apiResult === 'object' && 
                           !Array.isArray(apiResult) && 
                           (apiResult.id || Object.keys(apiResult).length > 0);
      
      if (!hasFallbackFlag && !hasSuccessFalse && looksLikeData && apiResult) {
        // API save successful - verify by checking if it has an id or any data
        // For updates, check if id matches. For creates, check if id exists or has data
        const hasIdentifier = apiResult.id || 
                             (isUpdate && id && apiResult.id === id) ||
                             Object.keys(apiResult).length > 0; // Has any data fields
        
        if (hasIdentifier) {
          // API save successful - clean result without fallback flags
          console.log(`   ✅ Successfully saved ${storageKey} to server`);
          // DO NOT save to localStorage - this causes browser-specific data
          // Clear localStorage instead to prevent conflicts
          localStorage.removeItem(storageKey);
          return { success: true, data: apiResult, synced: true };
        } else {
          // Result doesn't look like valid data
          console.warn(`   ⚠️ API result doesn't have valid identifier:`, apiResult);
          throw new Error('API save failed - invalid response');
        }
      } else {
        // API save failed or returned fallback
        console.warn(`   ⚠️ API save failed for ${storageKey}, result:`, apiResult);
        console.warn(`   ⚠️ Fallback flag: ${hasFallbackFlag}, Success false: ${hasSuccessFalse}, Looks like data: ${looksLikeData}`);
        throw new Error('API save failed');
      }
    } catch (error) {
      console.error(`   ❌ API save error for ${storageKey}:`, error);
      console.warn(`   Falling back to localStorage only`);
    }

    // Fallback to localStorage only
    const localResult = this.saveToLocalStorage(storageKey, data, isUpdate, id);
    console.warn(`   ⚠️ Saved ${storageKey} to localStorage only (server unavailable)`);
    return { success: true, data: localResult, synced: false, fallback: true };
  },

  // Save to localStorage
  saveToLocalStorage(storageKey, data, isUpdate = false, id = null) {
    const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
    
    if (isUpdate && id) {
      const index = existing.findIndex(item => item.id?.toString() === id.toString());
      if (index !== -1) {
        existing[index] = { ...existing[index], ...data, updatedAt: new Date().toISOString() };
      } else {
        existing.push({ ...data, id, updatedAt: new Date().toISOString() });
      }
    } else {
      const newItem = {
        ...data,
        id: data.id || Date.now(),
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      existing.push(newItem);
    }
    
    localStorage.setItem(storageKey, JSON.stringify(existing));
    return isUpdate && id ? existing.find(item => item.id?.toString() === id.toString()) : existing[existing.length - 1];
  },

  // Load data from API, fallback to localStorage
  async load(storageKey, forceRefresh = false) {
    const tableName = getTableName(storageKey);
    
    try {
      // Always try to get fresh data from API
      const apiData = await databaseAPI.getAll(tableName);
      if (apiData && !apiData.fallback && Array.isArray(apiData)) {
        // DO NOT save to localStorage - this causes browser-specific data
        // Clear localStorage instead to prevent conflicts
        localStorage.removeItem(storageKey);
        return { data: apiData, synced: true };
      }
    } catch (error) {
      console.warn(`API load failed for ${storageKey}, using localStorage:`, error);
    }

    // Fallback to localStorage
    const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return { data: localData, synced: false, fallback: true };
  },

  // Sync all data from API to localStorage
  async syncAll() {
    const results = {};
    
    for (const [storageKey] of Object.entries(STORAGE_TO_TABLE)) {
      try {
        const result = await this.load(storageKey);
        results[storageKey] = result;
      } catch (error) {
        console.error(`Error syncing ${storageKey}:`, error);
        results[storageKey] = { data: [], synced: false, error: error.message };
      }
    }
    
    return results;
  },

  // Check if API server is available
  async checkServerHealth() {
    return await databaseAPI.checkHealth();
  },
};

export default syncService;

