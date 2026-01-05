// Data Service Layer
// This service abstracts data storage - works with Supabase (cloud) or localStorage (fallback)
// All components should use this service instead of directly calling localStorage or Supabase

import { supabase, isSupabaseConfigured } from '../supabaseClient';

// Helper to determine storage mode
const useDatabase = isSupabaseConfigured();

// Generic CRUD operations
export const dataService = {
  // Get all records from a table
  async getAll(tableName) {
    if (useDatabase) {
      try {
        if (!supabase) {
          console.warn(`Supabase not initialized. Using localStorage for ${tableName}`);
          return this.getAllLocalStorage(tableName);
        }
        
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error(`Error fetching ${tableName}:`, error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          // Fallback to localStorage if database fails
          return this.getAllLocalStorage(tableName);
        }
        return data || [];
      } catch (error) {
        console.error(`Error fetching ${tableName}:`, error);
        console.error('Exception details:', error.message);
        return this.getAllLocalStorage(tableName);
      }
    } else {
      return this.getAllLocalStorage(tableName);
    }
  },

  // Get a single record by ID
  async getById(tableName, id) {
    if (useDatabase) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .eq('id', id)
          .single();
        
        if (error) {
          console.error(`Error fetching ${tableName} by ID:`, error);
          return this.getByIdLocalStorage(tableName, id);
        }
        return data;
      } catch (error) {
        console.error(`Error fetching ${tableName} by ID:`, error);
        return this.getByIdLocalStorage(tableName, id);
      }
    } else {
      return this.getByIdLocalStorage(tableName, id);
    }
  },

  // Create a new record
  async create(tableName, record) {
    if (useDatabase) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .insert([record])
          .select()
          .single();
        
        if (error) {
          console.error(`Error creating ${tableName}:`, error);
          // Fallback to localStorage
          return this.createLocalStorage(tableName, record);
        }
        return data;
      } catch (error) {
        console.error(`Error creating ${tableName}:`, error);
        return this.createLocalStorage(tableName, record);
      }
    } else {
      return this.createLocalStorage(tableName, record);
    }
  },

  // Update a record
  async update(tableName, id, updates) {
    if (useDatabase) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        
        if (error) {
          console.error(`Error updating ${tableName}:`, error);
          return this.updateLocalStorage(tableName, id, updates);
        }
        return data;
      } catch (error) {
        console.error(`Error updating ${tableName}:`, error);
        return this.updateLocalStorage(tableName, id, updates);
      }
    } else {
      return this.updateLocalStorage(tableName, id, updates);
    }
  },

  // Delete a record
  async delete(tableName, id) {
    if (useDatabase) {
      try {
        const { error } = await supabase
          .from(tableName)
          .delete()
          .eq('id', id);
        
        if (error) {
          console.error(`Error deleting ${tableName}:`, error);
          return this.deleteLocalStorage(tableName, id);
        }
        return { success: true };
      } catch (error) {
        console.error(`Error deleting ${tableName}:`, error);
        return this.deleteLocalStorage(tableName, id);
      }
    } else {
      return this.deleteLocalStorage(tableName, id);
    }
  },

  // Query with filters
  async query(tableName, filters = {}) {
    if (useDatabase) {
      try {
        let query = supabase.from(tableName).select('*');
        
        // Apply filters
        Object.keys(filters).forEach(key => {
          if (filters[key] !== undefined && filters[key] !== null) {
            query = query.eq(key, filters[key]);
          }
        });
        
        const { data, error } = await query;
        
        if (error) {
          console.error(`Error querying ${tableName}:`, error);
          return this.queryLocalStorage(tableName, filters);
        }
        return data || [];
      } catch (error) {
        console.error(`Error querying ${tableName}:`, error);
        return this.queryLocalStorage(tableName, filters);
      }
    } else {
      return this.queryLocalStorage(tableName, filters);
    }
  },

  // LocalStorage fallback methods
  getAllLocalStorage(tableName) {
    try {
      const data = localStorage.getItem(tableName);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error(`Error reading localStorage for ${tableName}:`, error);
      return [];
    }
  },

  getByIdLocalStorage(tableName, id) {
    const all = this.getAllLocalStorage(tableName);
    return all.find(item => item.id?.toString() === id?.toString()) || null;
  },

  createLocalStorage(tableName, record) {
    const all = this.getAllLocalStorage(tableName);
    const newRecord = {
      ...record,
      id: record.id || Date.now(),
      created_at: record.created_at || new Date().toISOString()
    };
    all.push(newRecord);
    localStorage.setItem(tableName, JSON.stringify(all));
    return newRecord;
  },

  updateLocalStorage(tableName, id, updates) {
    const all = this.getAllLocalStorage(tableName);
    const index = all.findIndex(item => item.id?.toString() === id?.toString());
    if (index !== -1) {
      all[index] = {
        ...all[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      localStorage.setItem(tableName, JSON.stringify(all));
      return all[index];
    }
    return null;
  },

  deleteLocalStorage(tableName, id) {
    const all = this.getAllLocalStorage(tableName);
    const filtered = all.filter(item => item.id?.toString() !== id?.toString());
    localStorage.setItem(tableName, JSON.stringify(filtered));
    return { success: true };
  },

  queryLocalStorage(tableName, filters) {
    const all = this.getAllLocalStorage(tableName);
    return all.filter(item => {
      return Object.keys(filters).every(key => {
        if (filters[key] === undefined || filters[key] === null) return true;
        return item[key]?.toString() === filters[key]?.toString();
      });
    });
  },

  // Get storage mode
  getStorageMode() {
    return useDatabase ? 'database' : 'localStorage';
  },

  // Check if database is configured
  isDatabaseConfigured() {
    return useDatabase;
  }
};

// Table name mappings (localStorage keys to database table names)
export const tableNames = {
  // Master data
  branches: 'branches',
  cities: 'cities',
  tbbClients: 'tbb_clients',
  vehicles: 'vehicles',
  drivers: 'drivers',
  staff: 'staff',
  users: 'users',
  vendors: 'vendors',
  marketVehicleVendors: 'vendors', // Same table, filtered by type
  otherVendors: 'vendors', // Same table, filtered by type
  clientRates: 'client_rates',
  accounts: 'accounts',
  lrSeries: 'lr_series',
  
  // Transaction data
  lrBookings: 'lr_bookings',
  manifests: 'manifests',
  trips: 'trips',
  pods: 'pods',
  invoices: 'invoices',
  payments: 'payments'
};

// Convenience functions for each table
export const branchesService = {
  getAll: () => dataService.getAll(tableNames.branches),
  getById: (id) => dataService.getById(tableNames.branches, id),
  create: (branch) => dataService.create(tableNames.branches, branch),
  update: (id, updates) => dataService.update(tableNames.branches, id, updates),
  delete: (id) => dataService.delete(tableNames.branches, id),
  query: (filters) => dataService.query(tableNames.branches, filters)
};

export const citiesService = {
  getAll: () => dataService.getAll(tableNames.cities),
  getById: (id) => dataService.getById(tableNames.cities, id),
  create: (city) => dataService.create(tableNames.cities, city),
  update: (id, updates) => dataService.update(tableNames.cities, id, updates),
  delete: (id) => dataService.delete(tableNames.cities, id),
  query: (filters) => dataService.query(tableNames.cities, filters)
};

export const vehiclesService = {
  getAll: () => dataService.getAll(tableNames.vehicles),
  getById: (id) => dataService.getById(tableNames.vehicles, id),
  create: (vehicle) => dataService.create(tableNames.vehicles, vehicle),
  update: (id, updates) => dataService.update(tableNames.vehicles, id, updates),
  delete: (id) => dataService.delete(tableNames.vehicles, id),
  query: (filters) => dataService.query(tableNames.vehicles, filters)
};

export const driversService = {
  getAll: () => dataService.getAll(tableNames.drivers),
  getById: (id) => dataService.getById(tableNames.drivers, id),
  create: (driver) => dataService.create(tableNames.drivers, driver),
  update: (id, updates) => dataService.update(tableNames.drivers, id, updates),
  delete: (id) => dataService.delete(tableNames.drivers, id),
  query: (filters) => dataService.query(tableNames.drivers, filters)
};

export const lrBookingsService = {
  getAll: () => dataService.getAll(tableNames.lrBookings),
  getById: (id) => dataService.getById(tableNames.lrBookings, id),
  create: (lr) => dataService.create(tableNames.lrBookings, lr),
  update: (id, updates) => dataService.update(tableNames.lrBookings, id, updates),
  delete: (id) => dataService.delete(tableNames.lrBookings, id),
  query: (filters) => dataService.query(tableNames.lrBookings, filters)
};

export const manifestsService = {
  getAll: () => dataService.getAll(tableNames.manifests),
  getById: (id) => dataService.getById(tableNames.manifests, id),
  create: (manifest) => dataService.create(tableNames.manifests, manifest),
  update: (id, updates) => dataService.update(tableNames.manifests, id, updates),
  delete: (id) => dataService.delete(tableNames.manifests, id),
  query: (filters) => dataService.query(tableNames.manifests, filters)
};

export const tripsService = {
  getAll: () => dataService.getAll(tableNames.trips),
  getById: (id) => dataService.getById(tableNames.trips, id),
  create: (trip) => dataService.create(tableNames.trips, trip),
  update: (id, updates) => dataService.update(tableNames.trips, id, updates),
  delete: (id) => dataService.delete(tableNames.trips, id),
  query: (filters) => dataService.query(tableNames.trips, filters)
};

export const invoicesService = {
  getAll: () => dataService.getAll(tableNames.invoices),
  getById: (id) => dataService.getById(tableNames.invoices, id),
  create: (invoice) => dataService.create(tableNames.invoices, invoice),
  update: (id, updates) => dataService.update(tableNames.invoices, id, updates),
  delete: (id) => dataService.delete(tableNames.invoices, id),
  query: (filters) => dataService.query(tableNames.invoices, filters)
};

export const usersService = {
  getAll: () => dataService.getAll(tableNames.users),
  getById: (id) => dataService.getById(tableNames.users, id),
  create: (user) => dataService.create(tableNames.users, user),
  update: (id, updates) => dataService.update(tableNames.users, id, updates),
  delete: (id) => dataService.delete(tableNames.users, id),
  query: (filters) => dataService.query(tableNames.users, filters)
};

// Export default
export default dataService;

