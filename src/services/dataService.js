export const expenseMasterService = {
  // Backend table is expenseTypes (NOT expenseMaster)
  getAll: () => dataService.getAll('expenseTypes'),
  getById: (id) => dataService.getById('expenseTypes', id),
  create: (record) => dataService.create('expenseTypes', record),
  update: (id, updates) => dataService.update('expenseTypes', id, updates),
  delete: (id) => dataService.delete('expenseTypes', id),
  query: (filters) => dataService.query('expenseTypes', filters)
};

export const accountsService = {
  getAll: () => dataService.getAll('accounts'),
  getById: (id) => dataService.getById('accounts', id),
  create: (record) => dataService.create('accounts', record),
  update: (id, updates) => dataService.update('accounts', id, updates),
  delete: (id) => dataService.delete('accounts', id),
  query: (filters) => dataService.query('accounts', filters)
};
// Data Service Layer
// This service abstracts data storage - works only with backend API (cloud sync)

// API URLs for different environments
const HOSTINGER_API_URL = 'https://mmlipl.in/api';
const RENDER_API_URL = 'https://transport-management-system-wzhx.onrender.com/api';

/**
 * Get API Base URL dynamically based on hostname
 */
function getAPIBaseURL() {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // mmlipl.in → Use Hostinger API
    if (hostname === 'mmlipl.in' || hostname === 'www.mmlipl.in') {
      return HOSTINGER_API_URL;
    }
    
    // mmlipl.info → Use Render.com API
    if (hostname === 'mmlipl.info' || 
        hostname === 'www.mmlipl.info' ||
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app')) {
      return RENDER_API_URL;
    }
  }
  
  // Development: Use environment variable if set, otherwise Hostinger
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Default to Hostinger for development (since that's the production server)
  return HOSTINGER_API_URL;
}

// Helper for HTTP requests
async function apiRequest(path, options = {}) {
  const apiBaseUrl = getAPIBaseURL();
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'API request failed');
  }
  const data = await response.json();
  // Handle both array response and object with data property
  return Array.isArray(data) ? data : (data.data || data);
}

// Generic CRUD operations using Render.com API
export const dataService = {
  // Get all records from a table
  async getAll(tableName) {
    return apiRequest(`/${tableName}`);
  },

  // Get a single record by ID
  async getById(tableName, id) {
    return apiRequest(`/${tableName}/${id}`);
  },

  // Create a new record
  async create(tableName, record) {
    return apiRequest(`/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  // Update a record by ID
  async update(tableName, id, updates) {
    return apiRequest(`/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a record by ID
  async delete(tableName, id) {
    return apiRequest(`/${tableName}/${id}`, {
      method: 'DELETE',
    });
  },

  // Query records with filters (if supported by your API)
  async query(tableName, filters) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiRequest(`/${tableName}${params}`);
  },
};

// Table name mapping for backend API
// Note: Backend uses camelCase (lrBookings), not snake_case (lr_bookings)
const tableNames = {
  branches: 'branches',
  cities: 'cities',
  vehicles: 'vehicles',
  drivers: 'drivers',
  lrBookings: 'lrBookings', // Fixed: was 'lr_bookings', backend uses 'lrBookings'
  manifests: 'manifests',
  trips: 'trips',
  pods: 'pods',
  invoices: 'invoices',
  payments: 'payments',
  users: 'users',
  clientRates: 'clientRates',
  // Backend exposes /api/clients (NOT /api/tbb_clients)
  // Keep tbbClients as an alias to clients for backward compatibility.
  tbbClients: 'clients',
  clients: 'clients'
};

// Convenience functions for each table
// TBB Clients Service
export const tbbClientsService = {
  getAll: () => dataService.getAll(tableNames.tbbClients),
  getById: (id) => dataService.getById(tableNames.tbbClients, id),
  create: (client) => dataService.create(tableNames.tbbClients, client),
  update: (id, updates) => dataService.update(tableNames.tbbClients, id, updates),
  delete: (id) => dataService.delete(tableNames.tbbClients, id),
  query: (filters) => dataService.query(tableNames.tbbClients, filters)
};

// Generic Clients Service (for sundry creditors, etc)
export const clientsService = {
  getAll: () => dataService.getAll(tableNames.clients),
  getById: (id) => dataService.getById(tableNames.clients, id),
  create: (client) => dataService.create(tableNames.clients, client),
  update: (id, updates) => dataService.update(tableNames.clients, id, updates),
  delete: (id) => dataService.delete(tableNames.clients, id),
  query: (filters) => dataService.query(tableNames.clients, filters)
};
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

export const podsService = {
  getAll: () => dataService.getAll(tableNames.pods),
  getById: (id) => dataService.getById(tableNames.pods, id),
  create: (pod) => dataService.create(tableNames.pods, pod),
  update: (id, updates) => dataService.update(tableNames.pods, id, updates),
  delete: (id) => dataService.delete(tableNames.pods, id),
  query: (filters) => dataService.query(tableNames.pods, filters)
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

