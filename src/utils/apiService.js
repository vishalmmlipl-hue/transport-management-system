/**
 * Centralized API Service for Render.com
 * Replaces localStorage with server-side storage
 * All data operations go through this service
 */

// Render.com API Configuration
const RENDER_API_URL = 'https://transport-management-system-wzhx.onrender.com/api';

/**
 * Get API Base URL
 * Always use Render.com for production (mmlipl.info)
 * Use environment variable if set, otherwise Render.com
 */
export const getAPIBaseURL = () => {
  // Always use Render.com for production
  // This ensures all browsers use the same server
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Production domains: Always use Render.com
    if (hostname === 'mmlipl.info' || 
        hostname === 'www.mmlipl.info' ||
        hostname.includes('netlify.app') ||
        hostname.includes('vercel.app') ||
        (!hostname.includes('localhost') && !hostname.includes('127.0.0.1'))) {
      return RENDER_API_URL;
    }
  }
  
  // Development: Use environment variable if set, otherwise Render.com
  const envUrl = process.env.REACT_APP_API_URL;
  if (envUrl) {
    return envUrl;
  }
  
  // Default to Render.com
  return RENDER_API_URL;
};

/**
 * Generic API call function
 */
const apiCall = async (endpoint, method = 'GET', data = null) => {
  const url = `${getAPIBaseURL()}${endpoint}`;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error (${method} ${endpoint}):`, error.message);
    throw error;
  }
};

/**
 * API Service - All data operations
 */
export const apiService = {
  // ========== BRANCHES ==========
  async getBranches() {
    const result = await apiCall('/branches');
    return result.data || [];
  },
  
  async createBranch(branchData) {
    const result = await apiCall('/branches', 'POST', branchData);
    return result.data;
  },
  
  async updateBranch(id, branchData) {
    const result = await apiCall(`/branches/${id}`, 'PUT', branchData);
    return result.data;
  },
  
  async deleteBranch(id) {
    const result = await apiCall(`/branches/${id}`, 'DELETE');
    return result;
  },
  
  // ========== CITIES ==========
  async getCities() {
    const result = await apiCall('/cities');
    return result.data || [];
  },
  
  async createCity(cityData) {
    const result = await apiCall('/cities', 'POST', cityData);
    return result.data;
  },
  
  async updateCity(id, cityData) {
    const result = await apiCall(`/cities/${id}`, 'PUT', cityData);
    return result.data;
  },
  
  async deleteCity(id) {
    const result = await apiCall(`/cities/${id}`, 'DELETE');
    return result;
  },
  
  // ========== CLIENTS ==========
  async getClients() {
    const result = await apiCall('/clients');
    return result.data || [];
  },
  
  async createClient(clientData) {
    const result = await apiCall('/clients', 'POST', clientData);
    return result.data;
  },
  
  async updateClient(id, clientData) {
    const result = await apiCall(`/clients/${id}`, 'PUT', clientData);
    return result.data;
  },
  
  async deleteClient(id) {
    const result = await apiCall(`/clients/${id}`, 'DELETE');
    return result;
  },
  
  // ========== VEHICLES ==========
  async getVehicles() {
    const result = await apiCall('/vehicles');
    return result.data || [];
  },
  
  async createVehicle(vehicleData) {
    const result = await apiCall('/vehicles', 'POST', vehicleData);
    return result.data;
  },
  
  async updateVehicle(id, vehicleData) {
    const result = await apiCall(`/vehicles/${id}`, 'PUT', vehicleData);
    return result.data;
  },
  
  async deleteVehicle(id) {
    const result = await apiCall(`/vehicles/${id}`, 'DELETE');
    return result;
  },
  
  // ========== DRIVERS ==========
  async getDrivers() {
    const result = await apiCall('/drivers');
    return result.data || [];
  },
  
  async createDriver(driverData) {
    const result = await apiCall('/drivers', 'POST', driverData);
    return result.data;
  },
  
  async updateDriver(id, driverData) {
    const result = await apiCall(`/drivers/${id}`, 'PUT', driverData);
    return result.data;
  },
  
  async deleteDriver(id) {
    const result = await apiCall(`/drivers/${id}`, 'DELETE');
    return result;
  },
  
  // ========== STAFF ==========
  async getStaff() {
    const result = await apiCall('/staff');
    return result.data || [];
  },
  
  async createStaff(staffData) {
    const result = await apiCall('/staff', 'POST', staffData);
    return result.data;
  },
  
  async updateStaff(id, staffData) {
    const result = await apiCall(`/staff/${id}`, 'PUT', staffData);
    return result.data;
  },
  
  async deleteStaff(id) {
    const result = await apiCall(`/staff/${id}`, 'DELETE');
    return result;
  },
  
  // ========== LR BOOKINGS ==========
  async getLRBookings() {
    const result = await apiCall('/lrBookings');
    return result.data || [];
  },
  
  async createLRBooking(bookingData) {
    const result = await apiCall('/lrBookings', 'POST', bookingData);
    return result.data;
  },
  
  async updateLRBooking(id, bookingData) {
    const result = await apiCall(`/lrBookings/${id}`, 'PUT', bookingData);
    return result.data;
  },
  
  async deleteLRBooking(id) {
    const result = await apiCall(`/lrBookings/${id}`, 'DELETE');
    return result;
  },
  
  // ========== FTL LR BOOKINGS ==========
  async getFTLLRBookings() {
    const result = await apiCall('/ftlLRBookings');
    return result.data || [];
  },
  
  async createFTLLRBooking(bookingData) {
    const result = await apiCall('/ftlLRBookings', 'POST', bookingData);
    return result.data;
  },
  
  async updateFTLLRBooking(id, bookingData) {
    const result = await apiCall(`/ftlLRBookings/${id}`, 'PUT', bookingData);
    return result.data;
  },
  
  async deleteFTLLRBooking(id) {
    const result = await apiCall(`/ftlLRBookings/${id}`, 'DELETE');
    return result;
  },
  
  // ========== PTL LR BOOKINGS ==========
  async getPTLLRBookings() {
    const result = await apiCall('/ptlLRBookings');
    return result.data || [];
  },
  
  async createPTLLRBooking(bookingData) {
    const result = await apiCall('/ptlLRBookings', 'POST', bookingData);
    return result.data;
  },
  
  async updatePTLLRBooking(id, bookingData) {
    const result = await apiCall(`/ptlLRBookings/${id}`, 'PUT', bookingData);
    return result.data;
  },
  
  async deletePTLLRBooking(id) {
    const result = await apiCall(`/ptlLRBookings/${id}`, 'DELETE');
    return result;
  },
  
  // ========== FTL INQUIRIES ==========
  async getFTLInquiries() {
    const result = await apiCall('/ftlInquiries');
    return result.data || [];
  },
  
  async createFTLInquiry(inquiryData) {
    const result = await apiCall('/ftlInquiries', 'POST', inquiryData);
    return result.data;
  },
  
  async updateFTLInquiry(id, inquiryData) {
    const result = await apiCall(`/ftlInquiries/${id}`, 'PUT', inquiryData);
    return result.data;
  },
  
  async deleteFTLInquiry(id) {
    const result = await apiCall(`/ftlInquiries/${id}`, 'DELETE');
    return result;
  },
  
  // ========== MANIFESTS ==========
  async getManifests() {
    const result = await apiCall('/manifests');
    return result.data || [];
  },
  
  async createManifest(manifestData) {
    const result = await apiCall('/manifests', 'POST', manifestData);
    return result.data;
  },
  
  async updateManifest(id, manifestData) {
    const result = await apiCall(`/manifests/${id}`, 'PUT', manifestData);
    return result.data;
  },
  
  async deleteManifest(id) {
    const result = await apiCall(`/manifests/${id}`, 'DELETE');
    return result;
  },
  
  // ========== TRIPS ==========
  async getTrips() {
    const result = await apiCall('/trips');
    return result.data || [];
  },
  
  async createTrip(tripData) {
    const result = await apiCall('/trips', 'POST', tripData);
    return result.data;
  },
  
  async updateTrip(id, tripData) {
    const result = await apiCall(`/trips/${id}`, 'PUT', tripData);
    return result.data;
  },
  
  async deleteTrip(id) {
    const result = await apiCall(`/trips/${id}`, 'DELETE');
    return result;
  },
  
  // ========== INVOICES ==========
  async getInvoices() {
    const result = await apiCall('/invoices');
    return result.data || [];
  },
  
  async createInvoice(invoiceData) {
    const result = await apiCall('/invoices', 'POST', invoiceData);
    return result.data;
  },
  
  async updateInvoice(id, invoiceData) {
    const result = await apiCall(`/invoices/${id}`, 'PUT', invoiceData);
    return result.data;
  },
  
  async deleteInvoice(id) {
    const result = await apiCall(`/invoices/${id}`, 'DELETE');
    return result;
  },
  
  // ========== PODS ==========
  async getPODs() {
    const result = await apiCall('/pods');
    return result.data || [];
  },
  
  async createPOD(podData) {
    const result = await apiCall('/pods', 'POST', podData);
    return result.data;
  },
  
  async updatePOD(id, podData) {
    const result = await apiCall(`/pods/${id}`, 'PUT', podData);
    return result.data;
  },
  
  async deletePOD(id) {
    const result = await apiCall(`/pods/${id}`, 'DELETE');
    return result;
  },
  
  // ========== USERS ==========
  async getUsers() {
    const result = await apiCall('/users');
    return result.data || [];
  },
  
  async createUser(userData) {
    const result = await apiCall('/users', 'POST', userData);
    return result.data;
  },
  
  async updateUser(id, userData) {
    const result = await apiCall(`/users/${id}`, 'PUT', userData);
    return result.data;
  },
  
  async deleteUser(id) {
    const result = await apiCall(`/users/${id}`, 'DELETE');
    return result;
  },
  
  // ========== ACCOUNTS ==========
  async getAccounts() {
    const result = await apiCall('/accounts');
    return result.data || [];
  },
  
  async createAccount(accountData) {
    const result = await apiCall('/accounts', 'POST', accountData);
    return result.data;
  },
  
  async updateAccount(id, accountData) {
    const result = await apiCall(`/accounts/${id}`, 'PUT', accountData);
    return result.data;
  },
  
  async deleteAccount(id) {
    const result = await apiCall(`/accounts/${id}`, 'DELETE');
    return result;
  },
  
  // ========== EXPENSE TYPES ==========
  async getExpenseTypes() {
    const result = await apiCall('/expenseTypes');
    return result.data || [];
  },
  
  async createExpenseType(expenseTypeData) {
    const result = await apiCall('/expenseTypes', 'POST', expenseTypeData);
    return result.data;
  },
  
  async updateExpenseType(id, expenseTypeData) {
    const result = await apiCall(`/expenseTypes/${id}`, 'PUT', expenseTypeData);
    return result.data;
  },
  
  async deleteExpenseType(id) {
    const result = await apiCall(`/expenseTypes/${id}`, 'DELETE');
    return result;
  },
};

export default apiService;
