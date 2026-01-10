export const expenseMasterService = {
  getAll: () => dataService.getAll('expenseMaster'),
  getById: (id) => dataService.getById('expenseMaster', id),
  create: (record) => dataService.create('expenseMaster', record),
  update: (id, updates) => dataService.update('expenseMaster', id, updates),
  delete: (id) => dataService.delete('expenseMaster', id),
  query: (filters) => dataService.query('expenseMaster', filters)
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

// Render.com API base URL
const API_BASE_URL = 'https://transport-management-system-wzhx.onrender.com';

// Helper for HTTP requests
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
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
  return response.json();
}

// Generic CRUD operations using Render.com API
export const dataService = {
  // Get all records from a table
  async getAll(tableName) {
    return apiRequest(`/api/${tableName}`);
  },

  // Get a single record by ID
  async getById(tableName, id) {
    return apiRequest(`/api/${tableName}/${id}`);
  },

  // Create a new record
  async create(tableName, record) {
    return apiRequest(`/api/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(record),
    });
  },

  // Update a record by ID
  async update(tableName, id, updates) {
    return apiRequest(`/api/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  // Delete a record by ID
  async delete(tableName, id) {
    return apiRequest(`/api/${tableName}/${id}`, {
      method: 'DELETE',
    });
  },

  // Query records with filters (if supported by your API)
  async query(tableName, filters) {
    const params = filters ? '?' + new URLSearchParams(filters).toString() : '';
    return apiRequest(`/api/${tableName}${params}`);
  },
};
  lrBookings: 'lr_bookings',
  manifests: 'manifests',
  trips: 'trips',
  pods: 'pods',
  invoices: 'invoices',
  payments: 'payments'
};

// Table name mapping for backend API
const tableNames = {
  branches: 'branches',
  cities: 'cities',
  vehicles: 'vehicles',
  drivers: 'drivers',
  lrBookings: 'lr_bookings',
  manifests: 'manifests',
  trips: 'trips',
  pods: 'pods',
  invoices: 'invoices',
  payments: 'payments',
  users: 'users',
  tbbClients: 'tbb_clients', // <-- Ensure this matches your backend table name
  clients: 'clients'         // <-- Ensure this matches your backend table name
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

