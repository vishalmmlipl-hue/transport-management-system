// Sync Service - Provides automatic synchronization between localStorage and backend API
// This service ensures data is stored both locally and on the server for cross-device sync

import { databaseAPI } from '../utils/database-api';

// Tables that should be synced to the backend
const SYNC_TABLES = [
  'lrBookings',
  'ftlLRBookings',
  'ptlLRBookings',
  'manifests',
  'trips',
  'pods',
  'invoices',
  'payments',
  'branches',
  'cities',
  'vehicles',
  'drivers',
  'staff',
  'users',
  'tbbClients',
  'accounts',
  'expenseTypes',
  'marketVehicleVendors',
  'otherVendors',
  'branchExpenses',
  'lrSeries',
  'clientRates',
  'ftlInquiries'
];

// Map frontend table names to backend table names if different
const TABLE_NAME_MAP = {
  'lrBookings': 'lrBookings',
  'ftlLRBookings': 'ftlLRBookings',
  'ptlLRBookings': 'ptlLRBookings',
  'manifests': 'manifests',
  'trips': 'trips',
  'pods': 'pods',
  'invoices': 'invoices',
  'payments': 'payments',
  'branches': 'branches',
  'cities': 'cities',
  'vehicles': 'vehicles',
  'drivers': 'drivers',
  'staff': 'staff',
  'users': 'users',
  'tbbClients': 'clients',
  'accounts': 'accounts',
  'expenseTypes': 'expenseTypes',
  'marketVehicleVendors': 'marketVehicleVendors',
  'otherVendors': 'otherVendors',
  'branchExpenses': 'branchExpenses',
  'lrSeries': 'lrSeries',
  'clientRates': 'clientRates',
  'ftlInquiries': 'ftlInquiries'
};

// Queue for pending sync operations
let syncQueue = [];
let isSyncing = false;

// Get the backend table name
const getBackendTableName = (frontendTableName) => {
  return TABLE_NAME_MAP[frontendTableName] || frontendTableName;
};

// Check if a table should be synced
const shouldSync = (tableName) => {
  return SYNC_TABLES.includes(tableName);
};

// Sync a single record to the backend
const syncRecordToBackend = async (tableName, record, operation = 'create') => {
  const backendTable = getBackendTableName(tableName);

  try {
    if (operation === 'create') {
      await databaseAPI.create(backendTable, record);
    } else if (operation === 'update') {
      await databaseAPI.update(backendTable, record.id, record);
    } else if (operation === 'delete') {
      await databaseAPI.delete(backendTable, record.id);
    }
    console.log(`✓ Synced ${operation} for ${tableName}:`, record.id);
    return true;
  } catch (error) {
    console.error(`✗ Failed to sync ${operation} for ${tableName}:`, error);
    // Add to queue for retry
    syncQueue.push({ tableName, record, operation, retryCount: 0 });
    return false;
  }
};

// Process the sync queue
const processSyncQueue = async () => {
  if (isSyncing || syncQueue.length === 0) return;

  isSyncing = true;
  const item = syncQueue.shift();

  if (item && item.retryCount < 3) {
    const success = await syncRecordToBackend(item.tableName, item.record, item.operation);
    if (!success) {
      item.retryCount++;
      syncQueue.push(item);
    }
  }

  isSyncing = false;

  // Continue processing if there are more items
  if (syncQueue.length > 0) {
    setTimeout(processSyncQueue, 1000);
  }
};

// Save data to both localStorage and sync to backend
export const syncService = {
  // Create a new record (save to localStorage and sync to backend)
  async create(tableName, record) {
    // First save to localStorage for immediate availability
    const existingData = JSON.parse(localStorage.getItem(tableName) || '[]');
    const newRecord = {
      ...record,
      id: record.id || Date.now(),
      createdAt: record.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      _synced: false
    };
    existingData.push(newRecord);
    localStorage.setItem(tableName, JSON.stringify(existingData));

    // If this table should be synced, send to backend
    if (shouldSync(tableName)) {
      const { _synced, ...recordToSync } = newRecord;
      const success = await syncRecordToBackend(tableName, recordToSync, 'create');

      // Mark as synced if successful
      if (success) {
        const updated = JSON.parse(localStorage.getItem(tableName) || '[]');
        const idx = updated.findIndex(r => r.id === newRecord.id);
        if (idx !== -1) {
          updated[idx]._synced = true;
          localStorage.setItem(tableName, JSON.stringify(updated));
        }
      }
    }

    return newRecord;
  },

  // Update an existing record
  async update(tableName, id, updates) {
    const existingData = JSON.parse(localStorage.getItem(tableName) || '[]');
    const index = existingData.findIndex(r => r.id?.toString() === id?.toString());

    if (index === -1) {
      console.error(`Record not found: ${tableName}/${id}`);
      return null;
    }

    const updatedRecord = {
      ...existingData[index],
      ...updates,
      updatedAt: new Date().toISOString(),
      _synced: false
    };
    existingData[index] = updatedRecord;
    localStorage.setItem(tableName, JSON.stringify(existingData));

    // Sync to backend
    if (shouldSync(tableName)) {
      const { _synced, ...recordToSync } = updatedRecord;
      const success = await syncRecordToBackend(tableName, recordToSync, 'update');

      if (success) {
        existingData[index]._synced = true;
        localStorage.setItem(tableName, JSON.stringify(existingData));
      }
    }

    return updatedRecord;
  },

  // Delete a record
  async delete(tableName, id) {
    const existingData = JSON.parse(localStorage.getItem(tableName) || '[]');
    const recordToDelete = existingData.find(r => r.id?.toString() === id?.toString());
    const filtered = existingData.filter(r => r.id?.toString() !== id?.toString());
    localStorage.setItem(tableName, JSON.stringify(filtered));

    // Sync deletion to backend
    if (shouldSync(tableName) && recordToDelete) {
      await syncRecordToBackend(tableName, { id }, 'delete');
    }

    return true;
  },

  // Get all records (merge localStorage and backend data)
  async getAll(tableName) {
    // Start with localStorage data for immediate availability
    let localData = JSON.parse(localStorage.getItem(tableName) || '[]');

    // If this table should be synced, fetch from backend
    if (shouldSync(tableName)) {
      try {
        const backendTable = getBackendTableName(tableName);
        const backendData = await databaseAPI.getAll(backendTable);

        if (Array.isArray(backendData) && backendData.length > 0) {
          // Merge backend data with local data
          // Backend is source of truth, but keep local unsynced records
          const localUnsynced = localData.filter(local => !local._synced);
          const mergedIds = new Set(backendData.map(r => r.id?.toString()));

          // Add local unsynced records that don't exist on backend
          const newLocalRecords = localUnsynced.filter(r => !mergedIds.has(r.id?.toString()));

          // Combine backend data with new local records
          localData = [...backendData, ...newLocalRecords];

          // Update localStorage with merged data
          localStorage.setItem(tableName, JSON.stringify(localData));

          // Try to sync any unsynced local records
          for (const record of newLocalRecords) {
            const { _synced, ...recordToSync } = record;
            syncRecordToBackend(tableName, recordToSync, 'create');
          }
        }
      } catch (error) {
        console.warn(`Could not fetch from backend for ${tableName}, using localStorage:`, error);
      }
    }

    return localData;
  },

  // Get a single record by ID
  async getById(tableName, id) {
    const allData = await this.getAll(tableName);
    return allData.find(r => r.id?.toString() === id?.toString()) || null;
  },

  // Force sync all unsynced records for a table
  async syncTable(tableName) {
    if (!shouldSync(tableName)) return { synced: 0, failed: 0 };

    const localData = JSON.parse(localStorage.getItem(tableName) || '[]');
    const unsynced = localData.filter(r => !r._synced);

    let synced = 0;
    let failed = 0;

    for (const record of unsynced) {
      const { _synced, ...recordToSync } = record;
      const success = await syncRecordToBackend(tableName, recordToSync, 'create');
      if (success) {
        synced++;
        record._synced = true;
      } else {
        failed++;
      }
    }

    localStorage.setItem(tableName, JSON.stringify(localData));

    return { synced, failed };
  },

  // Force sync all tables
  async syncAll() {
    const results = {};
    for (const tableName of SYNC_TABLES) {
      results[tableName] = await this.syncTable(tableName);
    }
    return results;
  },

  // Check server connectivity
  async checkConnection() {
    return await databaseAPI.checkHealth();
  },

  // Get sync status
  getSyncStatus() {
    const status = {};
    for (const tableName of SYNC_TABLES) {
      const data = JSON.parse(localStorage.getItem(tableName) || '[]');
      const unsynced = data.filter(r => !r._synced).length;
      status[tableName] = {
        total: data.length,
        synced: data.length - unsynced,
        unsynced
      };
    }
    return status;
  }
};

// Start processing sync queue on load
if (typeof window !== 'undefined') {
  setInterval(processSyncQueue, 5000);
}

export default syncService;
