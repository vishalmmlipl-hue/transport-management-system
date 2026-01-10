// Custom hook to load data from server first, then fallback to localStorage
import { useState, useEffect } from 'react';
import syncService from '../utils/sync-service';

/**
 * Hook to load data from server, with localStorage fallback
 * @param {string} storageKey - localStorage key (e.g., 'branches', 'cities')
 * @param {function} filterFn - Optional filter function (e.g., (item) => item.status === 'Active')
 * @returns {object} { data, loading, synced }
 */
export function useServerData(storageKey, filterFn = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [synced, setSynced] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await syncService.load(storageKey);
      let loadedData = result.data || [];
      
      // Apply filter if provided
      if (filterFn && Array.isArray(loadedData)) {
        loadedData = loadedData.filter(filterFn);
      }
      
      setData(loadedData);
      setSynced(result.synced);
    } catch (error) {
      console.error(`Error loading ${storageKey}:`, error);
      // Fallback to localStorage
      const localData = JSON.parse(localStorage.getItem(storageKey) || '[]');
      let filteredData = localData;
      if (filterFn) {
        filteredData = localData.filter(filterFn);
      }
      setData(filteredData);
      setSynced(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // Listen for sync events to reload
    const handleSync = () => {
      loadData();
    };
    window.addEventListener('dataSyncedFromServer', handleSync);
    
    return () => {
      window.removeEventListener('dataSyncedFromServer', handleSync);
    };
  }, [storageKey]);

  return { data, loading, synced, reload: loadData };
}

export default useServerData;
