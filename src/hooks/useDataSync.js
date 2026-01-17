/**
 * React Hook for Data Synchronization with Render.com
 * Replaces localStorage usage with API calls
 */

import { useState, useEffect, useCallback } from 'react';
import apiService from '../utils/apiService';

/**
 * Generic hook for syncing data with Render.com server
 * 
 * @param {string} resourceName - Name of the resource (e.g., 'branches', 'cities')
 * @param {object} apiMethods - API methods object with get, create, update, delete
 * @param {array} initialData - Initial data array
 */
// Global request cache to prevent duplicate simultaneous requests
const requestCache = new Map();
const pendingRequests = new Map();

export const useDataSync = (resourceName, apiMethods, initialData = []) => {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  // Load data from server with request deduplication
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (apiMethods.get) {
        // Check if there's already a pending request for this resource
        if (pendingRequests.has(resourceName)) {
          // Wait for the existing request to complete
          const existingData = await pendingRequests.get(resourceName);
          setData(existingData || []);
          setLoading(false);
          return existingData;
        }

        // Check cache (valid for 5 seconds to prevent rapid re-requests)
        const cacheKey = `${resourceName}_${Date.now()}`;
        const cached = requestCache.get(resourceName);
        if (cached && Date.now() - cached.timestamp < 5000) {
          setData(cached.data || []);
          setLoading(false);
          return cached.data;
        }

        // Create new request promise
        const requestPromise = apiMethods.get().then(serverData => {
          // Cache the result
          requestCache.set(resourceName, {
            data: serverData || [],
            timestamp: Date.now()
          });
          // Remove from pending
          pendingRequests.delete(resourceName);
          return serverData || [];
        }).catch(err => {
          // Remove from pending on error
          pendingRequests.delete(resourceName);
          throw err;
        });

        // Store pending request
        pendingRequests.set(resourceName, requestPromise);

        const serverData = await requestPromise;
        setData(serverData || []);
        
        // Clear localStorage for this resource (migration)
        localStorage.removeItem(resourceName);
        
        return serverData;
      }
    } catch (err) {
      console.error(`❌ Error loading ${resourceName}:`, err);
      setError(err.message);
      
      // DO NOT fallback to localStorage - this causes browser-specific data issues
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [resourceName, apiMethods]);

  // Create new item
  const create = useCallback(async (itemData) => {
    try {
      setSyncing(true);
      setError(null);
      
      if (apiMethods.create) {
        const newItem = await apiMethods.create(itemData);
        setData(prev => [...prev, newItem]);
        
        // Remove from localStorage (migration)
        localStorage.removeItem(resourceName);
        
        return newItem;
      }
    } catch (err) {
      console.error(`Error creating ${resourceName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [resourceName, apiMethods]);

  // Update existing item
  const update = useCallback(async (id, itemData) => {
    try {
      setSyncing(true);
      setError(null);
      
      if (apiMethods.update) {
        const updatedItem = await apiMethods.update(id, itemData);
        setData(prev => prev.map(item => 
          item.id === id ? updatedItem : item
        ));
        
        // Remove from localStorage (migration)
        localStorage.removeItem(resourceName);
        
        return updatedItem;
      }
    } catch (err) {
      console.error(`Error updating ${resourceName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [resourceName, apiMethods]);

  // Delete item
  const remove = useCallback(async (id) => {
    try {
      setSyncing(true);
      setError(null);
      
      if (apiMethods.delete) {
        await apiMethods.delete(id);
        setData(prev => prev.filter(item => item.id !== id));
        
        // Remove from localStorage (migration)
        localStorage.removeItem(resourceName);
        
        return true;
      }
    } catch (err) {
      console.error(`Error deleting ${resourceName}:`, err);
      setError(err.message);
      throw err;
    } finally {
      setSyncing(false);
    }
  }, [resourceName, apiMethods]);

  // Load data on mount only (not when loadData changes to prevent infinite loops)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resourceName]); // Only reload if resourceName changes

  return {
    data,
    loading,
    error,
    syncing,
    loadData,
    create,
    update,
    remove,
    setData, // For manual updates if needed
  };
};

/**
 * Hook for Branches
 */
export const useBranches = () => {
  return useDataSync('branches', {
    get: apiService.getBranches,
    create: apiService.createBranch,
    update: apiService.updateBranch,
    delete: apiService.deleteBranch,
  });
};

/**
 * Hook for Cities
 */
export const useCities = () => {
  return useDataSync('cities', {
    get: apiService.getCities,
    create: apiService.createCity,
    update: apiService.updateCity,
    delete: apiService.deleteCity,
  });
};

/**
 * Hook for Clients
 */
export const useClients = () => {
  return useDataSync('clients', {
    get: apiService.getClients,
    create: apiService.createClient,
    update: apiService.updateClient,
    delete: apiService.deleteClient,
  });
};

/**
 * Hook for Vehicles
 */
export const useVehicles = () => {
  return useDataSync('vehicles', {
    get: apiService.getVehicles,
    create: apiService.createVehicle,
    update: apiService.updateVehicle,
    delete: apiService.deleteVehicle,
  });
};

/**
 * Hook for Drivers
 */
export const useDrivers = () => {
  return useDataSync('drivers', {
    get: apiService.getDrivers,
    create: apiService.createDriver,
    update: apiService.updateDriver,
    delete: apiService.deleteDriver,
  });
};

/**
 * Hook for Staff
 */
export const useStaff = () => {
  return useDataSync('staff', {
    get: apiService.getStaff,
    create: apiService.createStaff,
    update: apiService.updateStaff,
    delete: apiService.deleteStaff,
  });
};

/**
 * Hook for LR Bookings
 */
export const useLRBookings = () => {
  return useDataSync('lrBookings', {
    get: apiService.getLRBookings,
    create: apiService.createLRBooking,
    update: apiService.updateLRBooking,
    delete: apiService.deleteLRBooking,
  });
};

/**
 * Hook for FTL LR Bookings
 */
export const useFTLLRBookings = () => {
  return useDataSync('ftlLRBookings', {
    get: apiService.getFTLLRBookings,
    create: apiService.createFTLLRBooking,
    update: apiService.updateFTLLRBooking,
    delete: apiService.deleteFTLLRBooking,
  });
};

/**
 * Hook for PTL LR Bookings
 */
export const usePTLLRBookings = () => {
  return useDataSync('ptlLRBookings', {
    get: apiService.getPTLLRBookings,
    create: apiService.createPTLLRBooking,
    update: apiService.updatePTLLRBooking,
    delete: apiService.deletePTLLRBooking,
  });
};

/**
 * Hook for FTL Inquiries
 */
export const useFTLInquiries = () => {
  return useDataSync('ftlInquiries', {
    get: apiService.getFTLInquiries,
    create: apiService.createFTLInquiry,
    update: apiService.updateFTLInquiry,
    delete: apiService.deleteFTLInquiry,
  });
};

/**
 * Hook for Manifests
 */
export const useManifests = () => {
  return useDataSync('manifests', {
    get: apiService.getManifests,
    create: apiService.createManifest,
    update: apiService.updateManifest,
    delete: apiService.deleteManifest,
  });
};

/**
 * Hook for Trips
 */
export const useTrips = () => {
  return useDataSync('trips', {
    get: apiService.getTrips,
    create: apiService.createTrip,
    update: apiService.updateTrip,
    delete: apiService.deleteTrip,
  });
};

/**
 * Hook for Invoices
 */
export const useInvoices = () => {
  return useDataSync('invoices', {
    get: apiService.getInvoices,
    create: apiService.createInvoice,
    update: apiService.updateInvoice,
    delete: apiService.deleteInvoice,
  });
};

/**
 * Hook for PODs
 */
export const usePODs = () => {
  return useDataSync('pods', {
    get: apiService.getPODs,
    create: apiService.createPOD,
    update: apiService.updatePOD,
    delete: apiService.deletePOD,
  });
};

export default useDataSync;
