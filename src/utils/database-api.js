// Database API Client
// Replaces localStorage with API calls to backend server

// Use production API URL if on mmlipl.info, otherwise use localhost
const getAPIBaseURL = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'mmlipl.info' || hostname === 'www.mmlipl.info') {
      // Use Render API server for production
      return 'https://transport-management-system-wzhx.onrender.com/api';
    }
  }
  return process.env.REACT_APP_API_URL || 'http://localhost:3001/api'; // Development
};

const API_BASE_URL = getAPIBaseURL();

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
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
    const result = await apiCall(`/${tableName}`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (result.success) {
      return result.data;
    }
    // Fallback to localStorage
    return this.createLocalStorage(tableName, data);
  },

  async update(tableName, id, data) {
    const result = await apiCall(`/${tableName}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    if (result.success) {
      return result.data;
    }
    // Fallback to localStorage
    return this.updateLocalStorage(tableName, id, data);
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
      const response = await fetch(`${API_BASE_URL.replace('/api', '')}/api/health`);
      const data = await response.json();
      return data.success || false;
    } catch (error) {
      return false;
    }
  },
};

export default databaseAPI;

