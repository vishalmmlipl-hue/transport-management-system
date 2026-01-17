// Database API Client
// Replaces localStorage with API calls to backend server

// Get API Base URL - Priority: Environment variable > Production domain > Localhost
const getAPIBaseURL = () => {
  // 1. Check environment variable first (highest priority)
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 2. Check if running on production domain
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // Use VPS API server for mmlipl.in (Hostinger VPS frontend)
    if (hostname === 'mmlipl.in' || hostname === 'www.mmlipl.in' || hostname === 'www1.mmlipl.in') {
      // Use VPS API server (backend is on same VPS)
      return 'https://mmlipl.in/api';
    }
    // Use Render API server for mmlipl.info (Netlify frontend)
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      // Use Render API server (backend is on Render)
      return 'https://transport-management-system-wzhx.onrender.com/api';
    }
    // Fallback to Render for other production domains (Netlify, etc.)
    if (hostname.includes('netlify.app') ||
        hostname.includes('vercel.app') ||
        (!hostname.includes('localhost') && hostname !== 'mmlipl.info' && hostname !== 'mmlipl.in')) {
      // Use Render API server for other production domains
      return 'https://transport-management-system-wzhx.onrender.com/api';
    }
  }
  
  // 3. Fallback to localhost for local development
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getAPIBaseURL();

// Log API URL for debugging (always log in browser console)
if (typeof window !== 'undefined') {
  console.log('🔗 API Base URL:', API_BASE_URL);
  console.log('🔗 Current hostname:', window.location.hostname);
}

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log(`   🌐 API Call: ${options.method || 'GET'} ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log(`   📡 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`   ❌ API Error (${endpoint}):`, response.status, errorText);
      // Server reachable but returned an error -> DO NOT fallback to localStorage here
      // Return a structured error so callers can decide how to handle it.
      let message = errorText;
      try {
        const parsed = JSON.parse(errorText);
        message = parsed?.error || parsed?.message || errorText;
      } catch (_) {
        // keep raw text
      }
      return { success: false, error: message, status: response.status, fallback: false };
    }

    const data = await response.json();
    console.log(`   ✅ API Response:`, data);
    return data;
  } catch (error) {
    // More detailed error logging
    console.error(`   ❌ API Call Failed (${endpoint}):`, {
      url,
      error: error.message,
      type: error.name,
    });
    
    // Fallback to localStorage if API fails
    return { success: false, error: error.message, fallback: true };
  }
};

// Database API Service
export const databaseAPI = {
  // Generic CRUD operations
  async getAll(tableName) {
    const result = await apiCall(`/${tableName}`);
    if (result.success) {
      return result.data || [];
    }
    // Fallback to localStorage
    return this.getAllLocalStorage(tableName);
  },

  async getById(tableName, id) {
    const result = await apiCall(`/${tableName}/${id}`);
    if (result.success) {
      return result.data;
    }
    // Fallback to localStorage
    return this.getByIdLocalStorage(tableName, id);
  },

  async create(tableName, data) {
    // Debug: Log what's being sent
    const dataKeys = Object.keys(data || {});
    console.log(`   📤 Creating ${tableName}:`, data);
    console.log(`   🔍 Data keys being sent:`, dataKeys);
    if (tableName === 'otherVendors' || tableName === 'marketVehicleVendors') {
      const allowedKeys = ['id', 'code', 'status', 'createdAt', 'updatedAt', 'data'];
      const unexpectedKeys = dataKeys.filter(k => !allowedKeys.includes(k));
      if (unexpectedKeys.length > 0) {
        console.error(`   ❌ ERROR: Unexpected keys in ${tableName} data:`, unexpectedKeys);
        console.error(`   ❌ This data should have been filtered!`);
      } else {
        console.log(`   ✅ Data correctly filtered for ${tableName}`);
      }
    }
    const result = await apiCall(`/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    console.log(`   📥 Create response for ${tableName}:`, result);
    
    if (result.success && result.data) {
      console.log(`   ✅ Successfully created ${tableName}`);
      return result.data;
    }

    // Server reachable but rejected request -> DO NOT create local fallback records
    if (result && result.success === false && result.fallback === false) {
      console.warn(`   ❌ Create rejected by server for ${tableName}:`, result.error);
      return { success: false, error: result.error, fallback: false };
    }

    // Fallback to localStorage - mark it so sync-service knows it failed
    console.warn(`   ⚠️ Create failed for ${tableName}, using localStorage fallback`);
    const fallbackResult = this.createLocalStorage(tableName, data);
    // Add fallback flag so sync-service can detect it
    return { ...fallbackResult, _fallback: true, _apiFailed: true };
  },

  async update(tableName, id, data) {
    console.log(`   📤 Updating ${tableName} ID ${id}:`, data);
    const result = await apiCall(`/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    console.log(`   📥 Update response for ${tableName}:`, result);
    
    if (result.success && result.data) {
      console.log(`   ✅ Successfully updated ${tableName}`);
      return result.data;
    }

    // Server reachable but rejected request -> DO NOT create local fallback records
    if (result && result.success === false && result.fallback === false) {
      console.warn(`   ❌ Update rejected by server for ${tableName}:`, result.error);
      return { success: false, error: result.error, fallback: false };
    }

    // Fallback to localStorage - mark it so sync-service knows it failed
    console.warn(`   ⚠️ Update failed for ${tableName}, using localStorage fallback`);
    const fallbackResult = this.updateLocalStorage(tableName, id, data);
    // Add fallback flag so sync-service can detect it
    return fallbackResult ? { ...fallbackResult, _fallback: true, _apiFailed: true } : null;
  },

  async delete(tableName, id) {
    const result = await apiCall(`/${tableName}/${id}`, {
      method: 'DELETE',
    });
    if (result.success) {
      return true;
    }
    // Fallback to localStorage
    return this.deleteLocalStorage(tableName, id);
  },

  async bulkCreate(tableName, records) {
    const result = await apiCall(`/bulk/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(records),
    });
    if (result.success) {
      return result.data;
    }
    // Fallback to localStorage
    return records.map(record => this.createLocalStorage(tableName, record));
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
    return all.find(item => item.id?.toString() === id.toString());
  },

  createLocalStorage(tableName, data) {
    const all = this.getAllLocalStorage(tableName);
    const newItem = {
      ...data,
      id: data.id || Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    all.push(newItem);
    localStorage.setItem(tableName, JSON.stringify(all));
    return newItem;
  },

  updateLocalStorage(tableName, id, data) {
    const all = this.getAllLocalStorage(tableName);
    const index = all.findIndex(item => item.id?.toString() === id.toString());
    if (index !== -1) {
      all[index] = {
        ...all[index],
        ...data,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(tableName, JSON.stringify(all));
      return all[index];
    }
    return null;
  },

  deleteLocalStorage(tableName, id) {
    const all = this.getAllLocalStorage(tableName);
    const filtered = all.filter(item => item.id?.toString() !== id.toString());
    localStorage.setItem(tableName, JSON.stringify(filtered));
    return true;
  },

  // Check server health
  async checkHealth() {
    try {
      // Use the health endpoint directly
      const healthUrl = API_BASE_URL.endsWith('/api') 
        ? `${API_BASE_URL.replace('/api', '')}/api/health`
        : `${API_BASE_URL}/health`;
      
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.warn(`⚠️ Health check failed: ${response.status}`);
        return false;
      }
      
      const data = await response.json();
      const isHealthy = data.success || false;
      
      if (isHealthy) {
        console.log('✅ Server health check passed');
      } else {
        console.warn('⚠️ Server health check returned false');
      }
      
      return isHealthy;
    } catch (error) {
      console.error('❌ Server health check error:', error.message);
      return false;
    }
  },
};

export default databaseAPI;

