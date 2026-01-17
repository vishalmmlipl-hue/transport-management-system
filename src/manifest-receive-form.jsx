import React, { useState, useEffect } from 'react';
import { CheckCircle, Package, Truck, Calendar, Clock, Search, Printer, X } from 'lucide-react';
import { apiService } from './utils/apiService';

// Helper function to clean branch names
const cleanBranchName = (name) => {
  if (!name) return '';
  let cleaned = name.toString().trim();
  cleaned = cleaned.replace(/0+$/, '');
  cleaned = cleaned.trim();
  cleaned = cleaned.replace(/\s+0+$/, '');
  return cleaned.trim();
};

export default function ManifestReceiveForm() {
  const [manifests, setManifests] = useState([]);
  const [branches, setBranches] = useState([]);
  const [cities, setCities] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [currentBranch, setCurrentBranch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('Pending'); // Pending, Received, All
  const [searchTerm, setSearchTerm] = useState('');
  const [lrReceiptData, setLrReceiptData] = useState({}); // Track individual LR receipts: { lrId: { received: bool, receivedPieces: number, discrepancy: string, vendorLRNumber: string } }
  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState(false);
  const [selectedLRForDiscrepancy, setSelectedLRForDiscrepancy] = useState(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    manifestNumber: '',
    fromDate: '',
    toDate: '',
    vehicleNumber: '',
    driverName: '',
    branch: '',
    status: ''
  });
  const [searchResults, setSearchResults] = useState([]);
  const [selectedManifestForPrint, setSelectedManifestForPrint] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Load branches, cities, vehicles, drivers from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Load branches from API
        const branchesData = await apiService.getBranches();
        const cleanedBranches = (branchesData || []).filter(b =>
          b.status === 'Active' || !b.status || b.status === undefined
        ).map(branch => ({
          ...branch,
          branchName: cleanBranchName(branch.branchName || '')
        }));
        setBranches(cleanedBranches);
        
        // Load cities from API
        const citiesData = await apiService.getCities();
        setCities(citiesData || []);
        
        // Load vehicles from API
        const vehiclesData = await apiService.getVehicles();
        setVehicles((vehiclesData || []).filter(v => v.status === 'Active'));
        
        // Load drivers from API
        const driversData = await apiService.getDrivers();
        setDrivers((driversData || []).filter(d => d.status === 'Active'));
        
        // Load user from localStorage (for now, as user management might still use localStorage)
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        
        // Get current user and admin status
        let userIsAdmin = false;
        if (user) {
          setCurrentUser(user);
          
          // Check if admin
          const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const systemUser = systemUsers.find(u => u.username === user.username);
          const userRole = systemUser?.userRole || user?.role || '';
          userIsAdmin = userRole === 'Admin' || userRole === 'admin';
          setIsAdmin(userIsAdmin);
          
          // Set current branch to logged-in user's branch
          let userBranchId = null;
          
          // For admin, check adminSelectedBranch first
          if (userIsAdmin) {
            const adminSelectedBranchId = localStorage.getItem('adminSelectedBranch');
            if (adminSelectedBranchId) {
              userBranchId = adminSelectedBranchId;
            }
          }
          
          // Get branch from system user record
          // Skip if branch is 'all' (Super Admin/Admin with all branches access)
          if (!userBranchId && systemUser && systemUser.branch && systemUser.branch !== 'all' && systemUser.branch !== 'ALL') {
            userBranchId = systemUser.branch;
          } else if (!userBranchId && user.branch && user.branch !== 'all' && user.branch !== 'ALL') {
            userBranchId = user.branch;
          }
          
          if (userBranchId) {
            const branch = cleanedBranches.find(b => 
              b.id.toString() === userBranchId.toString() || 
              b.branchCode === userBranchId.toString()
            );
            if (branch) {
              setCurrentBranch(branch);
            }
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        // Fallback to localStorage if API fails
        const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        const allCities = JSON.parse(localStorage.getItem('cities') || '[]');
        const allVehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
        const allDrivers = JSON.parse(localStorage.getItem('drivers') || '[]');
        
        setBranches(allBranches);
        setCities(allCities);
        setVehicles(allVehicles.filter(v => v.status === 'Active'));
        setDrivers(allDrivers.filter(d => d.status === 'Active'));
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Load manifests from API
  const loadManifests = async () => {
    try {
      console.log('🔄 Loading manifests from API...');
      const manifestsData = await apiService.getManifests();
      const allManifests = Array.isArray(manifestsData) ? manifestsData : (manifestsData?.data || []);
      
      // Normalize selectedLRs for all manifests - ensure it's always an array
      const normalizedManifests = allManifests.map(manifest => {
        const manifestCopy = { ...manifest };
        if (manifestCopy.selectedLRs) {
          if (typeof manifestCopy.selectedLRs === 'string') {
            try {
              manifestCopy.selectedLRs = JSON.parse(manifestCopy.selectedLRs);
            } catch (e) {
              console.warn('Could not parse selectedLRs for manifest:', manifest.manifestNumber, e);
              manifestCopy.selectedLRs = [];
            }
          }
          if (!Array.isArray(manifestCopy.selectedLRs)) {
            manifestCopy.selectedLRs = [];
          }
        } else {
          manifestCopy.selectedLRs = [];
        }
        return manifestCopy;
      });
      
      setManifests(normalizedManifests);
      console.log('✅ Manifests loaded:', normalizedManifests.length);
    } catch (error) {
      console.error('Error loading manifests:', error);
      // Fallback to localStorage if API fails
      const allManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
      // Normalize fallback manifests too
      const normalizedManifests = allManifests.map(manifest => {
        const manifestCopy = { ...manifest };
        if (manifestCopy.selectedLRs) {
          if (typeof manifestCopy.selectedLRs === 'string') {
            try {
              manifestCopy.selectedLRs = JSON.parse(manifestCopy.selectedLRs);
            } catch (e) {
              manifestCopy.selectedLRs = [];
            }
          }
          if (!Array.isArray(manifestCopy.selectedLRs)) {
            manifestCopy.selectedLRs = [];
          }
        } else {
          manifestCopy.selectedLRs = [];
        }
        return manifestCopy;
      });
      setManifests(normalizedManifests);
    }
  };
  
  useEffect(() => {
    if (!loading) { // Only load manifests after branches/cities are loaded
      loadManifests();
    }
  }, [loading]);
  
  // Listen for manifest creation/update events
  useEffect(() => {
    const handleManifestCreated = () => {
      console.log('🔄 Manifest created event received in receive form, reloading...');
      loadManifests();
    };
    
    const handleManifestUpdated = () => {
      console.log('🔄 Manifest updated event received in receive form, reloading...');
      loadManifests();
    };
    
    const handleDataSync = () => {
      console.log('🔄 Data sync event received in receive form, reloading...');
      loadManifests();
    };
    
    window.addEventListener('manifestCreated', handleManifestCreated);
    window.addEventListener('manifestUpdated', handleManifestUpdated);
    window.addEventListener('dataSyncedFromServer', handleDataSync);
    
    return () => {
      window.removeEventListener('manifestCreated', handleManifestCreated);
      window.removeEventListener('manifestUpdated', handleManifestUpdated);
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
    };
  }, [loading]);

  // Get destination branch from manifest route/LRs
  const getDestinationBranch = (manifest) => {
    if (branches.length === 0) return null;
    
    // First check if destinationBranch is explicitly set
    if (manifest.destinationBranch) {
      const branch = branches.find(b => 
        b.id?.toString() === manifest.destinationBranch?.toString() || 
        b.branchCode === manifest.destinationBranch?.toString()
      );
      if (branch) {
        return {
          ...branch,
          branchName: cleanBranchName(branch.branchName || '')
        };
      }
    }
    
    // Try to determine from LR destinations
    if (manifest.selectedLRs && manifest.selectedLRs.length > 0) {
      const firstLR = manifest.selectedLRs[0];
      
      // Handle both object and ID references
      const lrDestination = firstLR.destination || (typeof firstLR === 'object' ? firstLR.destination : null);
      
      if (lrDestination) {
        // Find branch in destination city
        const destinationCity = cities.find(c => 
          c.code === lrDestination || 
          c.cityName === lrDestination ||
          c.id?.toString() === lrDestination?.toString()
        );
        
        if (destinationCity) {
          // Find branch in that city/state
          const destBranch = branches.find(b => {
            const branchCity = b.address?.city || b.city;
            const branchState = b.address?.state || b.state;
            return branchCity === destinationCity.cityName || branchState === destinationCity.state;
          });
          if (destBranch) {
            return {
              ...destBranch,
              branchName: cleanBranchName(destBranch.branchName || '')
            };
          }
        }
      }
    }
    return null;
  };

  // Get origin branch from manifest
  const getOriginBranchFromManifest = (manifest) => {
    if (!manifest || branches.length === 0) return null;
    
    // Try multiple ways to find the branch
    const branchId = manifest.branch || manifest.originBranch || manifest.branchId;
    if (!branchId) return null;
    
    const branch = branches.find(b => {
      const bId = b.id?.toString();
      const bCode = b.branchCode?.toString();
      const mBranch = branchId?.toString();
      
      return bId === mBranch || 
             bCode === mBranch ||
             bId === manifest.branch?.toString() ||
             bCode === manifest.branch?.toString();
    });
    
    if (branch) {
      return {
        ...branch,
        branchName: cleanBranchName(branch.branchName || '')
      };
    }
    
    return null;
  };

  // Filter manifests for current branch based on manifest type
  const getPendingManifests = () => {
    // Admin with "All branches" can see all manifests
    if (!currentBranch && isAdmin) {
      return manifests.filter(manifest => {
        // Filter by status
        if (filterStatus === 'Pending') {
          return !manifest.receivedAt && manifest.status !== 'Received';
        } else if (filterStatus === 'Received') {
          return manifest.receivedAt || manifest.status === 'Received';
        }
        return true; // All
      }).filter(manifest => {
        // Filter by search term
        if (!searchTerm) return true;
        const term = searchTerm.toLowerCase();
        return (
          manifest.manifestNumber.toLowerCase().includes(term) ||
          manifest.vehicleNumber?.toLowerCase().includes(term) ||
          manifest.driverName?.toLowerCase().includes(term) ||
          manifest.route?.toLowerCase().includes(term)
        );
      });
    }

    if (!currentBranch) return [];
    
    return manifests.filter(manifest => {
      const manifestType = manifest.manifestType || 'branch'; // Default to branch for backward compatibility
      const originBranch = getOriginBranchFromManifest(manifest);
      const destBranch = getDestinationBranch(manifest);
      
      // Check if current branch can receive this manifest
      let canReceive = false;
      
      if (manifestType === 'branch') {
        // Branch-to-branch: Only destination branch can receive (even admin must select destination branch)
        canReceive = destBranch && (
          destBranch.id.toString() === currentBranch.id.toString() ||
          destBranch.branchCode === currentBranch.branchCode
        );
      } else if (manifestType === 'vendor') {
        // Branch-to-vendor: Only origin branch can receive (for vendor return/receipt)
        canReceive = originBranch && (
          originBranch.id.toString() === currentBranch.id.toString() ||
          originBranch.branchCode === currentBranch.branchCode
        );
      }
      
      if (!canReceive) return false;
      
      // Filter by status
      if (filterStatus === 'Pending') {
        return !manifest.receivedAt && manifest.status !== 'Received';
      } else if (filterStatus === 'Received') {
        return manifest.receivedAt || manifest.status === 'Received';
      }
      return true; // All
    }).filter(manifest => {
      // Filter by search term
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        manifest.manifestNumber.toLowerCase().includes(term) ||
        manifest.vehicleNumber?.toLowerCase().includes(term) ||
        manifest.driverName?.toLowerCase().includes(term) ||
        manifest.route?.toLowerCase().includes(term)
      );
    });
  };

  const handleLRReceiveToggle = async (manifestId, lrId, lrData) => {
    if (!currentBranch && !isAdmin) {
      alert('⚠️ Please select a branch first!');
      return;
    }

    const manifestIndex = manifests.findIndex(m => m.id === manifestId);
    
    if (manifestIndex === -1) return;

    const manifest = manifests[manifestIndex];
    
    // Verify that current branch can receive this manifest
    const manifestType = manifest.manifestType || 'branch';
    const originBranch = getOriginBranchFromManifest(manifest);
    const destBranch = getDestinationBranch(manifest);
    
    let canReceive = false;
    if (manifestType === 'branch') {
      // Branch-to-branch: Only destination branch can receive
      canReceive = destBranch && (
        (currentBranch ? (destBranch.id.toString() === currentBranch.id.toString() || destBranch.branchCode === currentBranch.branchCode) : true)
      );
    } else if (manifestType === 'vendor') {
      // Branch-to-vendor: Only origin branch can receive
      canReceive = originBranch && (
        (currentBranch ? (originBranch.id.toString() === currentBranch.id.toString() || originBranch.branchCode === currentBranch.branchCode) : true)
      );
    }
    
    if (!canReceive) {
      alert('⚠️ You can only receive manifests destined for your branch!');
      return;
    }
    const lrReceipts = manifest.lrReceipts || {};
    const isCurrentlyReceived = lrReceipts[lrId]?.received || false;

    if (isCurrentlyReceived) {
      // Deselect - remove receipt
      delete lrReceipts[lrId];
    } else {
      // Select - mark as received
      const expectedPieces = parseInt(lrData?.pieces || 0);
      const manifestType = manifest.manifestType || 'branch';
      const newReceipt = {
        received: true,
        receivedAt: new Date().toISOString(),
        receivedBy: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Unknown',
        expectedPieces: expectedPieces,
        receivedPieces: expectedPieces, // Default to expected, user can change
        discrepancy: '',
        remarks: '',
        vendorLRNumber: '' // For vendor manifests, store vendor's LR number
      };
      lrReceipts[lrId] = newReceipt;
      
      // Always open modal to allow user to verify/update pieces and add remarks
      setSelectedLRForDiscrepancy({ manifestId, lrId, lrData, receipt: newReceipt });
      setShowDiscrepancyModal(true);
    }

    // Update manifest
    const updatedManifest = {
      ...manifest,
      lrReceipts: lrReceipts,
      // Mark manifest as received if all LRs are received
      status: Object.keys(lrReceipts).length === (manifest.selectedLRs?.length || 0) ? 'Received' : manifest.status,
      receivedAt: Object.keys(lrReceipts).length === (manifest.selectedLRs?.length || 0) ? new Date().toISOString() : manifest.receivedAt
    };

    // Save to API
    try {
      await apiService.updateManifest(manifestId, updatedManifest);
      // Update local state
      const updatedManifests = [...manifests];
      const index = updatedManifests.findIndex(m => m.id === manifestId);
      if (index !== -1) {
        updatedManifests[index] = updatedManifest;
        setManifests(updatedManifests);
        setLrReceiptData(lrReceipts);
      }
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('manifestUpdated', { detail: { manifest: updatedManifest } }));
      window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    } catch (error) {
      console.error('Error updating manifest:', error);
      alert('⚠️ Error saving manifest. Please try again.');
      // Fallback to localStorage
      const allManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
      const fallbackIndex = allManifests.findIndex(m => m.id === manifestId);
      if (fallbackIndex !== -1) {
        allManifests[fallbackIndex] = updatedManifest;
        localStorage.setItem('manifests', JSON.stringify(allManifests));
        setManifests(allManifests);
        setLrReceiptData(lrReceipts);
      }
    }
  };

  const handleSaveDiscrepancy = async () => {
    if (!selectedLRForDiscrepancy) return;

    const { manifestId, lrId, receipt } = selectedLRForDiscrepancy;
    const manifestIndex = manifests.findIndex(m => m.id === manifestId);
    
    if (manifestIndex === -1) return;

    const manifest = manifests[manifestIndex];
    const lrReceipts = manifest.lrReceipts || {};
    const expectedPieces = receipt?.expectedPieces || parseInt(selectedLRForDiscrepancy.lrData?.pieces || 0);
    const receivedPieces = parseInt(receipt?.receivedPieces || expectedPieces);
    
    if (lrReceipts[lrId]) {
      lrReceipts[lrId] = {
        ...lrReceipts[lrId],
        receivedPieces: receivedPieces,
        discrepancy: receipt?.discrepancy || '',
        remarks: receipt?.remarks || '',
        vendorLRNumber: receipt?.vendorLRNumber || ''
      };
    } else {
      // Create new receipt entry
      lrReceipts[lrId] = {
        received: true,
        receivedAt: new Date().toISOString(),
        receivedBy: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Unknown',
        expectedPieces: expectedPieces,
        receivedPieces: receivedPieces,
        discrepancy: receipt?.discrepancy || '',
        remarks: receipt?.remarks || '',
        vendorLRNumber: receipt?.vendorLRNumber || ''
      };
    }

    const updatedManifest = {
      ...manifest,
      lrReceipts: lrReceipts,
      status: Object.keys(lrReceipts).length === (manifest.selectedLRs?.length || 0) ? 'Received' : manifest.status,
      receivedAt: Object.keys(lrReceipts).length === (manifest.selectedLRs?.length || 0) ? new Date().toISOString() : manifest.receivedAt
    };

    // Save to API
    try {
      await apiService.updateManifest(manifestId, updatedManifest);
      // Update local state
      const updatedManifests = [...manifests];
      updatedManifests[manifestIndex] = updatedManifest;
      setManifests(updatedManifests);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('manifestUpdated', { detail: { manifest: updatedManifest } }));
      window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
    } catch (error) {
      console.error('Error saving discrepancy:', error);
      alert('⚠️ Error saving discrepancy. Please try again.');
      // Fallback to localStorage
      const allManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
      const fallbackIndex = allManifests.findIndex(m => m.id === manifestId);
      if (fallbackIndex !== -1) {
        allManifests[fallbackIndex] = updatedManifest;
        localStorage.setItem('manifests', JSON.stringify(allManifests));
        setManifests(allManifests);
      }
    }
    setShowDiscrepancyModal(false);
    setSelectedLRForDiscrepancy(null);
  };

  const handleReceiveManifest = async (manifestId) => {
    if (!currentBranch && !isAdmin) {
      alert('⚠️ Please select a branch first!');
      return;
    }
    
    // Verify that current branch can receive this manifest
    const manifest = manifests.find(m => m.id === manifestId);
    if (!manifest) return;
    
    const manifestType = manifest.manifestType || 'branch';
    const originBranch = getOriginBranchFromManifest(manifest);
    const destBranch = getDestinationBranch(manifest);
    
    let canReceive = false;
    if (manifestType === 'branch') {
      // Branch-to-branch: Only destination branch can receive
      canReceive = destBranch && (
        (currentBranch ? (destBranch.id.toString() === currentBranch.id.toString() || destBranch.branchCode === currentBranch.branchCode) : true)
      );
    } else if (manifestType === 'vendor') {
      // Branch-to-vendor: Only origin branch can receive
      canReceive = originBranch && (
        (currentBranch ? (originBranch.id.toString() === currentBranch.id.toString() || originBranch.branchCode === currentBranch.branchCode) : true)
      );
    }
    
    if (!canReceive) {
      alert('⚠️ You can only receive manifests destined for your branch!');
      return;
    }

    const manifestIndex = manifests.findIndex(m => m.id === manifestId);
    
    if (manifestIndex === -1) {
      alert('Manifest not found!');
      return;
    }

    const receiveData = {
      receivedAt: new Date().toISOString(),
      receivedBy: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'Unknown',
      receivedBranch: (currentBranch?.branchCode || currentBranch?.id) || (manifestType === 'branch' ? (destBranch?.branchCode || destBranch?.id) : (originBranch?.branchCode || originBranch?.id)) || '',
      status: 'Received',
      receivedRemarks: ''
    };

    // Prompt for remarks
    const remarks = prompt('Enter any remarks or notes (optional):');
    if (remarks !== null) {
      receiveData.receivedRemarks = remarks;
    }

    const updatedManifest = {
      ...manifest,
      ...receiveData
    };

    // Save to API
    try {
      await apiService.updateManifest(manifestId, updatedManifest);
      // Update local state
      const updatedManifests = [...manifests];
      updatedManifests[manifestIndex] = updatedManifest;
      setManifests(updatedManifests);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('manifestUpdated', { detail: { manifest: updatedManifest } }));
      window.dispatchEvent(new CustomEvent('dataSyncedFromServer'));
      
      alert(`✅ Manifest received successfully!\n\nManifest: ${updatedManifest.manifestNumber}\nReceived at: ${new Date(receiveData.receivedAt).toLocaleString()}\nReceived by: ${receiveData.receivedBy}`);
    } catch (error) {
      console.error('Error receiving manifest:', error);
      alert('⚠️ Error receiving manifest. Please try again.');
      // Fallback to localStorage
      const allManifests = JSON.parse(localStorage.getItem('manifests') || '[]');
      const fallbackIndex = allManifests.findIndex(m => m.id === manifestId);
      if (fallbackIndex !== -1) {
        allManifests[fallbackIndex] = updatedManifest;
        localStorage.setItem('manifests', JSON.stringify(allManifests));
        setManifests(allManifests);
      }
    }
  };

  const getCityName = (cityCode) => {
    const city = cities.find(c => c.code === cityCode || c.cityName === cityCode);
    return city ? city.cityName : cityCode || 'N/A';
  };

  const getOriginBranch = (manifest) => {
    // Use the same logic as getOriginBranchFromManifest
    return getOriginBranchFromManifest(manifest);
  };

  const handleSearchManifests = () => {
    let filtered = [...manifests];

    if (searchFilters.manifestNumber) {
      filtered = filtered.filter(m => 
        m.manifestNumber?.toLowerCase().includes(searchFilters.manifestNumber.toLowerCase())
      );
    }

    if (searchFilters.fromDate) {
      filtered = filtered.filter(m => 
        m.manifestDate >= searchFilters.fromDate
      );
    }

    if (searchFilters.toDate) {
      filtered = filtered.filter(m => 
        m.manifestDate <= searchFilters.toDate
      );
    }

    if (searchFilters.vehicleNumber) {
      const vehicle = vehicles.find(v => 
        v.id.toString() === searchFilters.vehicleNumber
      );
      if (vehicle) {
        filtered = filtered.filter(m => 
          m.vehicleNumber === vehicle.id.toString() ||
          m.vehicleNumber === vehicle.vehicleNumber
        );
      }
    }

    if (searchFilters.driverName) {
      const driver = drivers.find(d => 
        d.id.toString() === searchFilters.driverName
      );
      if (driver) {
        filtered = filtered.filter(m => 
          m.driverName === driver.id.toString() ||
          m.driverName === driver.driverName
        );
      }
    }

    if (searchFilters.branch) {
      filtered = filtered.filter(m => 
        m.branch === searchFilters.branch
      );
    }

    if (searchFilters.status) {
      filtered = filtered.filter(m => 
        m.status === searchFilters.status
      );
    }

    setSearchResults(filtered);
  };

  const clearSearch = () => {
    setSearchFilters({
      manifestNumber: '',
      fromDate: '',
      toDate: '',
      vehicleNumber: '',
      driverName: '',
      branch: '',
      status: ''
    });
    setSearchResults([]);
  };

  const getVehicleNumber = (vehicleId) => {
    if (!vehicleId) return 'N/A';
    const vehicle = vehicles.find(v => v.id.toString() === vehicleId.toString());
    return vehicle ? vehicle.vehicleNumber : vehicleId;
  };

  const getDriverName = (driverId) => {
    if (!driverId) return 'N/A';
    const driver = drivers.find(d => d.id.toString() === driverId.toString());
    if (!driver) return driverId;
    // Show driverName with nickName if available
    return driver.nickName ? `${driver.driverName} (${driver.nickName})` : driver.driverName;
  };

  const handlePrintManifest = (manifest) => {
    setSelectedManifestForPrint(manifest);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const pendingManifests = getPendingManifests();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .mono {
          font-family: 'Space Mono', monospace;
        }
        
        .form-section {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          border-left: 4px solid #10b981;
          transition: all 0.3s ease;
        }
        
        .manifest-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
        }
        
        .manifest-card:hover {
          border-color: #10b981;
          box-shadow: 0 4px 12px rgba(16,185,129,0.1);
          transform: translateY(-2px);
        }
        
        .manifest-card.received {
          border-color: #d1fae5;
          background: #f0fdf4;
        }
        
        .status-badge {
          display: inline-block;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.85rem;
          font-weight: 600;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-received {
          background: #d1fae5;
          color: #065f46;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.9rem;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(16,185,129,0.3);
        }
        
        .btn-secondary {
          background: #e2e8f0;
          color: #475569;
        }
        
        .input-group {
          margin-bottom: 16px;
        }
        
        label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #475569;
          margin-bottom: 6px;
        }
        
        input, select {
          width: 100%;
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: all 0.2s ease;
        }
        
        input:focus, select:focus {
          outline: none;
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.1);
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        {loading && (
          <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
            Loading branches and data...
          </div>
        )}
        {!loading && (
          <>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                Manifest Receive
              </h1>
              <p className="text-slate-600 text-lg">Receive and acknowledge manifests at destination branch</p>
            </div>

        {/* Branch Selection & Filters */}
        <div className="form-section">
          <div className="grid-4">
            <div className="input-group">
              <label>Current Branch</label>
              {isAdmin ? (
                <select
                  value={currentBranch?.id || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) {
                      // Admin: All branches
                      setCurrentBranch(null);
                      localStorage.removeItem('adminSelectedBranch');
                      try {
                        window.dispatchEvent(new CustomEvent('adminBranchChanged', { detail: { branchId: null } }));
                      } catch (err) {}
                      return;
                    }
                    const branch = branches.find(b => b.id.toString() === val);
                    setCurrentBranch(branch || null);
                    if (branch) {
                      localStorage.setItem('adminSelectedBranch', branch.id.toString());
                      try {
                        window.dispatchEvent(new CustomEvent('adminBranchChanged', { detail: { branchId: String(branch.id) } }));
                      } catch (err) {}
                    }
                  }}
                >
                  <option value="">All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  color: '#1e293b',
                  fontWeight: 500
                }}>
                  {currentBranch ? `${currentBranch.branchName} (${currentBranch.branchCode})` : 'No Branch Assigned'}
                </div>
              )}
              {!isAdmin && currentBranch && (
                <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                  Your assigned branch (cannot be changed)
                </small>
              )}
            </div>
            
            <div className="input-group">
              <label>Filter Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="Pending">Pending Receipt</option>
                <option value="Received">Received</option>
                <option value="All">All</option>
              </select>
            </div>
            
            <div className="input-group">
              <label>Search</label>
              <input
                type="text"
                placeholder="Manifest No, Vehicle, Driver..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="input-group">
              <label style={{ opacity: 0 }}>Actions</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSearchModal(true)}
                  className="btn btn-secondary"
                  style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                >
                  <Search size={16} /> Search & Print
                </button>
                <div style={{ 
                  padding: '10px 12px', 
                  background: '#f8fafc', 
                  borderRadius: '8px',
                  textAlign: 'center',
                  fontWeight: 600,
                  color: '#475569',
                  flex: 1
                }}>
                  {pendingManifests.length} Manifest{pendingManifests.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Manifests List */}
        {pendingManifests.length === 0 ? (
          <div className="form-section" style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Package size={64} style={{ color: '#cbd5e1', marginBottom: '16px' }} />
            <h3 style={{ color: '#64748b', marginBottom: '8px' }}>No Manifests Found</h3>
            <p style={{ color: '#94a3b8' }}>
              {filterStatus === 'Pending' 
                ? 'No pending manifests to receive at this branch.'
                : 'No manifests match your search criteria.'}
            </p>
          </div>
        ) : (
          <div>
            {pendingManifests.map(manifest => {
              const originBranch = getOriginBranch(manifest);
              const destBranch = getDestinationBranch(manifest);
              const isReceived = manifest.receivedAt || manifest.status === 'Received';
              const manifestType = manifest.manifestType || 'branch';
              const isVendorManifest = manifestType === 'vendor';
              
              return (
                <div key={manifest.id} className={`manifest-card ${isReceived ? 'received' : ''}`}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '16px' }}>
                    <div>
                      <h3 className="mono" style={{ fontSize: '1.3rem', marginBottom: '4px', color: '#1e293b' }}>
                        {manifest.manifestNumber}
                      </h3>
                      <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                        <Calendar size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {manifest.manifestDate}
                      </p>
                    </div>
                    <span className={`status-badge status-${isReceived ? 'received' : 'pending'}`}>
                      {isReceived ? 'Received' : 'Pending'}
                    </span>
                  </div>

                  <div className="grid-4" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                    <div>
                      <strong style={{ color: '#64748b' }}>Origin Branch:</strong>
                      <div style={{ color: '#1e293b', marginTop: '4px' }}>
                        {originBranch ? `${originBranch.branchName} (${originBranch.branchCode})` : 'N/A'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b' }}>Destination:</strong>
                      <div style={{ color: '#1e293b', marginTop: '4px' }}>
                        {isVendorManifest 
                          ? (manifest.vendorName ? `Vendor: ${manifest.vendorName}` : 'Vendor')
                          : (destBranch ? `${destBranch.branchName} (${destBranch.branchCode})` : 'N/A')}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b' }}>Vehicle:</strong>
                      <div style={{ color: '#1e293b', marginTop: '4px' }} className="mono">
                        <Truck size={14} style={{ display: 'inline', marginRight: '4px' }} />
                        {manifest.vehicleNumber || 'N/A'}
                      </div>
                    </div>
                    <div>
                      <strong style={{ color: '#64748b' }}>Driver:</strong>
                      <div style={{ color: '#1e293b', marginTop: '4px' }}>
                        {manifest.driverName || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {manifest.route && (
                    <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
                      <strong style={{ color: '#64748b' }}>Route:</strong>
                      <span style={{ marginLeft: '8px', color: '#1e293b' }}>{manifest.route}</span>
                    </div>
                  )}

                  {(() => {
                    // Normalize selectedLRs: handle stringified JSON or direct array
                    let lrArray = manifest.selectedLRs;
                    if (typeof lrArray === 'string') {
                      try {
                        lrArray = JSON.parse(lrArray);
                      } catch (e) {
                        console.warn('Could not parse selectedLRs in receive form for manifest:', manifest.manifestNumber, e);
                        lrArray = [];
                      }
                    }
                    if (!Array.isArray(lrArray)) {
                      lrArray = [];
                    }
                    if (lrArray.length === 0) return null;
                    return (
                      <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                        <strong style={{ color: '#64748b', display: 'block', marginBottom: '12px' }}>
                          LR Details - Select to Receive ({lrArray.length} LR{lrArray.length !== 1 ? 's' : ''}):
                        </strong>
                        <div style={{ 
                          display: 'grid', 
                          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                          gap: '12px',
                          fontSize: '0.85rem'
                        }}>
                          {lrArray.map((lr, idx) => {
                            // Handle both object and ID references safely
                            const lrData = typeof lr === 'object' && lr !== null ? lr : null;
                            const lrId = lrData?.id || lr || idx;
                            const lrNumber = lrData?.lrNumber || lrData?.id || `LR-${idx + 1}`;
                            const expectedPieces = parseInt(lrData?.pieces || 0);
                            const weight = lrData?.weight || 'N/A';
                            const origin = lrData?.origin || '';
                            const destination = lrData?.destination || '';
                            
                            const lrReceipt = manifest.lrReceipts?.[lrId];
                            const isReceived = lrReceipt?.received || false;
                            const receivedPieces = lrReceipt?.receivedPieces || expectedPieces;
                            const hasDiscrepancy = receivedPieces !== expectedPieces;
                            const discrepancy = lrReceipt?.discrepancy || '';
                            const remarks = lrReceipt?.remarks || '';
                            const vendorLRNumber = lrReceipt?.vendorLRNumber || '';
                            
                            return (
                            <div key={idx} style={{ 
                              padding: '12px', 
                              background: isReceived ? '#ecfdf5' : '#f1f5f9', 
                              borderRadius: '8px',
                              borderLeft: `4px solid ${isReceived ? (hasDiscrepancy ? '#f59e0b' : '#10b981') : '#cbd5e1'}`,
                              border: hasDiscrepancy ? '2px solid #f59e0b' : '1px solid #e2e8f0'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <input
                                  type="checkbox"
                                  checked={isReceived}
                                  onChange={() => handleLRReceiveToggle(manifest.id, lrId, lrData)}
                                  style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: '#10b981',
                                    flexShrink: 0
                                  }}
                                />
                                <div className="mono" style={{ fontWeight: 600, fontSize: '0.95rem', flex: 1 }}>
                                  {lrNumber}
                                </div>
                                {isReceived && (
                                  <span style={{
                                    padding: '3px 8px',
                                    background: hasDiscrepancy ? '#fef3c7' : '#d1fae5',
                                    color: hasDiscrepancy ? '#92400e' : '#065f46',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    fontWeight: 600
                                  }}>
                                    {hasDiscrepancy ? '⚠️ Short' : '✓ Received'}
                                  </span>
                                )}
                              </div>
                              
                              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>
                                <div><strong>Expected:</strong> {expectedPieces} Pcs, {weight} Kg</div>
                                {isReceived && (
                                  <div style={{ marginTop: '4px' }}>
                                    <strong>Received:</strong> <span style={{ color: hasDiscrepancy ? '#dc2626' : '#059669', fontWeight: 600 }}>
                                      {receivedPieces} Pcs
                                    </span>
                                    {hasDiscrepancy && (
                                      <span style={{ marginLeft: '8px', color: '#dc2626', fontSize: '0.75rem' }}>
                                        (Short by {expectedPieces - receivedPieces} Pcs)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '4px' }}>
                                {getCityName(origin)} → {getCityName(destination)}
                              </div>
                              
                              {isReceived && (discrepancy || remarks || (isVendorManifest && vendorLRNumber)) && (
                                <div style={{ 
                                  marginTop: '8px', 
                                  padding: '8px', 
                                  background: '#fef3c7', 
                                  borderRadius: '4px',
                                  fontSize: '0.75rem'
                                }}>
                                  {isVendorManifest && vendorLRNumber && (
                                    <div style={{ marginBottom: '4px', color: '#059669', fontWeight: 600 }}>
                                      <strong>Vendor LR No:</strong> <span className="mono">{vendorLRNumber}</span>
                                    </div>
                                  )}
                                  {discrepancy && (
                                    <div style={{ marginBottom: '4px' }}>
                                      <strong>Discrepancy:</strong> {discrepancy}
                                    </div>
                                  )}
                                  {remarks && (
                                    <div>
                                      <strong>Remarks:</strong> {remarks}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              {isReceived && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedLRForDiscrepancy({ manifestId: manifest.id, lrId, lrData, receipt: lrReceipt });
                                    setShowDiscrepancyModal(true);
                                  }}
                                  style={{
                                    marginTop: '8px',
                                    padding: '4px 8px',
                                    background: '#fef3c7',
                                    border: '1px solid #fbbf24',
                                    borderRadius: '4px',
                                    fontSize: '0.75rem',
                                    cursor: 'pointer',
                                    color: '#92400e',
                                    fontWeight: 500
                                  }}
                                >
                                  {hasDiscrepancy ? 'Edit Discrepancy' : 'Add Discrepancy/Remarks'}
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })()}

                  {(() => {
                    // Normalize selectedLRs for summary calculations
                    let lrArray = manifest.selectedLRs;
                    if (typeof lrArray === 'string') {
                      try {
                        lrArray = JSON.parse(lrArray);
                      } catch (e) {
                        lrArray = [];
                      }
                    }
                    if (!Array.isArray(lrArray)) {
                      lrArray = [];
                    }
                    const hasLRs = lrArray.length > 0;
                    
                    if (!manifest.summary && !hasLRs) return null;
                    
                    return (
                      <div style={{ 
                        marginTop: '16px', 
                        padding: '12px', 
                        background: '#ecfdf5', 
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-around',
                        fontSize: '0.9rem'
                      }}>
                        <div>
                          <strong style={{ color: '#64748b' }}>Total Pieces:</strong>
                          <span style={{ marginLeft: '8px', color: '#1e293b', fontWeight: 600 }}>
                            {manifest.summary?.totalPieces || lrArray.reduce((sum, lr) => {
                              const lrData = typeof lr === 'object' && lr !== null ? lr : null;
                              return sum + (parseInt(lrData?.pieces || 0) || 0);
                            }, 0)}
                          </span>
                        </div>
                        <div>
                          <strong style={{ color: '#64748b' }}>Total Weight:</strong>
                          <span style={{ marginLeft: '8px', color: '#1e293b', fontWeight: 600 }}>
                            {(manifest.summary?.totalWeight || lrArray.reduce((sum, lr) => {
                              const lrData = typeof lr === 'object' && lr !== null ? lr : null;
                              return sum + (parseFloat(lrData?.weight || 0) || 0);
                            }, 0)).toFixed(2)} Kg
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  {isReceived && manifest.receivedAt && (
                    <div style={{ 
                      marginTop: '16px', 
                      padding: '12px', 
                      background: '#d1fae5', 
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <strong style={{ color: '#065f46' }}>Received At:</strong>
                        <span style={{ color: '#047857' }}>
                          {new Date(manifest.receivedAt).toLocaleString()}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ color: '#065f46' }}>Received By:</strong>
                        <span style={{ color: '#047857' }}>
                          {manifest.receivedBy || 'N/A'}
                        </span>
                      </div>
                      {manifest.receivedRemarks && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #a7f3d0' }}>
                          <strong style={{ color: '#065f46' }}>Remarks:</strong>
                          <div style={{ color: '#047857', marginTop: '4px' }}>
                            {manifest.receivedRemarks}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {!isReceived && (
                    <div style={{ marginTop: '16px', textAlign: 'right' }}>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleReceiveManifest(manifest.id)}
                      >
                        <CheckCircle size={18} />
                        Receive Manifest
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
          </>
        )}
      </div>

      {/* Discrepancy Modal */}
      {showDiscrepancyModal && selectedLRForDiscrepancy && (() => {
        const manifest = manifests.find(m => m.id === selectedLRForDiscrepancy.manifestId);
        const isVendorManifest = manifest && (manifest.manifestType === 'vendor');
        
        return (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowDiscrepancyModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '20px', color: '#1e293b' }}>
              LR Receipt Details
            </h2>
            
            <div style={{ marginBottom: '16px', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div className="mono" style={{ fontWeight: 600, marginBottom: '4px' }}>
                {selectedLRForDiscrepancy.lrData?.lrNumber || 'N/A'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                Expected: {selectedLRForDiscrepancy.receipt?.expectedPieces || selectedLRForDiscrepancy.lrData?.pieces || 0} Pieces
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                Received Pieces *
              </label>
                              <input
                type="number"
                value={selectedLRForDiscrepancy.receipt?.receivedPieces || selectedLRForDiscrepancy.receipt?.expectedPieces || parseInt(selectedLRForDiscrepancy.lrData?.pieces || 0)}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setSelectedLRForDiscrepancy(prev => ({
                    ...prev,
                    receipt: {
                      ...prev.receipt,
                      receivedPieces: value,
                      expectedPieces: prev.receipt?.expectedPieces || parseInt(prev.lrData?.pieces || 0)
                    }
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
                min="0"
                required
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                Discrepancy Type
              </label>
              <select
                value={selectedLRForDiscrepancy.receipt?.discrepancy || ''}
                onChange={(e) => {
                  setSelectedLRForDiscrepancy(prev => ({
                    ...prev,
                    receipt: {
                      ...prev.receipt,
                      discrepancy: e.target.value
                    }
                  }));
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem'
                }}
              >
                <option value="">-- Select if applicable --</option>
                <option value="Short Received">Short Received</option>
                <option value="Damaged">Damaged</option>
                <option value="Missing">Missing</option>
                <option value="Extra Received">Extra Received</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {isVendorManifest && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                  Vendor LR Number *
                </label>
                <input
                  type="text"
                  value={selectedLRForDiscrepancy.receipt?.vendorLRNumber || ''}
                  onChange={(e) => {
                    setSelectedLRForDiscrepancy(prev => ({
                      ...prev,
                      receipt: {
                        ...prev.receipt,
                        vendorLRNumber: e.target.value
                      }
                    }));
                  }}
                  placeholder="Enter vendor's LR number"
                  className="mono"
                  required={isVendorManifest}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '0.95rem'
                  }}
                />
                <small style={{ display: 'block', marginTop: '4px', fontSize: '0.75rem', color: '#64748b' }}>
                  Enter the LR number assigned by the vendor for this shipment
                </small>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                Remarks
              </label>
              <textarea
                value={selectedLRForDiscrepancy.receipt?.remarks || ''}
                onChange={(e) => {
                  setSelectedLRForDiscrepancy(prev => ({
                    ...prev,
                    receipt: {
                      ...prev.receipt,
                      remarks: e.target.value
                    }
                  }));
                }}
                placeholder="Enter any additional remarks or notes..."
                rows="3"
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleSaveDiscrepancy}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setShowDiscrepancyModal(false);
                  setSelectedLRForDiscrepancy(null);
                }}
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
        );
      })()}

      {/* Search Manifest Modal */}
      {showSearchModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowSearchModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '900px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: '#1e293b' }}>
                Search & Print Manifest
              </h2>
              <button
                onClick={() => {
                  setShowSearchModal(false);
                  clearSearch();
                  setSelectedManifestForPrint(null);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '8px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} style={{ color: '#64748b' }} />
              </button>
            </div>

            {/* Search Filters */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    Manifest Number
                  </label>
                  <input
                    type="text"
                    value={searchFilters.manifestNumber}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, manifestNumber: e.target.value }))}
                    placeholder="Enter manifest number"
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    From Date
                  </label>
                  <input
                    type="date"
                    value={searchFilters.fromDate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, fromDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    To Date
                  </label>
                  <input
                    type="date"
                    value={searchFilters.toDate}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, toDate: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    Vehicle
                  </label>
                  <select
                    value={searchFilters.vehicleNumber}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, vehicleNumber: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">All Vehicles</option>
                    {vehicles.map(vehicle => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.vehicleNumber} - {vehicle.vehicleType}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    Driver
                  </label>
                  <select
                    value={searchFilters.driverName}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, driverName: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">All Drivers</option>
                    {drivers.map(driver => (
                      <option key={driver.id} value={driver.id}>
                        {driver.driverName}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    Branch
                  </label>
                  <select
                    value={searchFilters.branch}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, branch: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.id} value={branch.id}>
                        {branch.branchName} - {branch.address?.city || ''}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#475569', marginBottom: '6px' }}>
                    Status
                  </label>
                  <select
                    value={searchFilters.status}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, status: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '0.9rem'
                    }}
                  >
                    <option value="">All Status</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Received">Received</option>
                    <option value="Created">Created</option>
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={handleSearchManifests}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <Search size={18} /> Search
                </button>
                <button
                  type="button"
                  onClick={clearSearch}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <X size={18} /> Clear
                </button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '12px', color: '#1e293b' }}>
                  Search Results ({searchResults.length})
                </h3>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Manifest No.</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Date</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Branch</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Vehicle</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Driver</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>LRs</th>
                        <th style={{ padding: '10px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                        <th style={{ padding: '10px', textAlign: 'center', fontWeight: 600 }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {searchResults.map((manifest) => (
                        <tr key={manifest.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                          <td style={{ padding: '10px' }} className="mono">{manifest.manifestNumber}</td>
                          <td style={{ padding: '10px' }}>{manifest.manifestDate}</td>
                          <td style={{ padding: '10px' }}>{getOriginBranch(manifest)?.branchName || 'N/A'}</td>
                          <td style={{ padding: '10px' }}>{getVehicleNumber(manifest.vehicleNumber)}</td>
                          <td style={{ padding: '10px' }}>{getDriverName(manifest.driverName)}</td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            {manifest.selectedLRs?.length || manifest.summary?.lrCount || 0}
                          </td>
                          <td style={{ padding: '10px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '0.85rem',
                              fontWeight: 600,
                              background: manifest.status === 'Received' || manifest.status === 'Delivered' ? '#d1fae5' : 
                                         manifest.status === 'In Transit' ? '#dbeafe' : '#f3f4f6',
                              color: manifest.status === 'Received' || manifest.status === 'Delivered' ? '#065f46' : 
                                    manifest.status === 'In Transit' ? '#1e40af' : '#374151'
                            }}>
                              {manifest.status || 'Created'}
                            </span>
                          </td>
                          <td style={{ padding: '10px', textAlign: 'center' }}>
                            <button
                              type="button"
                              onClick={() => handlePrintManifest(manifest)}
                              className="btn btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <Printer size={16} /> Print
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {searchResults.length === 0 && Object.values(searchFilters).some(v => v) && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No manifests found matching your search criteria.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Print View for Selected Manifest */}
      {selectedManifestForPrint && (
        <div style={{ display: 'none' }} id="manifest-print-view">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '10px' }}>
              <img
                src="/brand-logo.png"
                alt="Company Logo"
                style={{ height: '56px', width: 'auto', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo192.png';
                }}
              />
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '8px' }}>MANIFEST</h1>
            <div className="mono" style={{ fontSize: '1.2rem' }}>{selectedManifestForPrint.manifestNumber}</div>
            <div style={{ marginTop: '8px' }}>Date: {selectedManifestForPrint.manifestDate}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <strong>Vehicle:</strong> {getVehicleNumber(selectedManifestForPrint.vehicleNumber)}<br/>
              <strong>Driver:</strong> {getDriverName(selectedManifestForPrint.driverName)}<br/>
              {(() => {
                const driver = drivers.find(d => d.id.toString() === selectedManifestForPrint.driverName?.toString());
                return driver && (
                  <><strong>Mobile:</strong> {driver.mobile || driver.contactDetails?.mobile || 'N/A'}</>
                );
              })()}
            </div>
            <div>
              <strong>Route:</strong> {selectedManifestForPrint.route || 'N/A'}<br/>
              <strong>Departure:</strong> {selectedManifestForPrint.departureDate} {selectedManifestForPrint.departureTime || ''}<br/>
              <strong>Branch:</strong> {getOriginBranch(selectedManifestForPrint)?.branchName || 'N/A'}
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px' }}>
            <thead>
              <tr style={{ background: '#f1f5f9' }}>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>S.No</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>LR No.</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Consignor</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Consignee</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Pieces</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Weight (Kg)</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>From</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>To</th>
                <th style={{ border: '1px solid #000', padding: '8px', textAlign: 'left' }}>Mode</th>
              </tr>
            </thead>
            <tbody>
              {selectedManifestForPrint.selectedLRs?.map((lr, index) => (
                <tr key={lr.id || index}>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{index + 1}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }} className="mono">{lr.lrNumber}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{lr.consignor?.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{lr.consignee?.name || 'N/A'}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{lr.pieces || 0}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{lr.weight || 0}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{getCityName(lr.origin)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px' }}>{getCityName(lr.destination)}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', fontSize: '0.75rem', fontWeight: 600 }}>{lr.paymentMode || 'N/A'}</td>
                </tr>
              ))}
              {selectedManifestForPrint.summary && (
                <tr style={{ fontWeight: 600, background: '#f1f5f9' }}>
                  <td colSpan="4" style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>TOTAL:</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'center' }}>{selectedManifestForPrint.summary.totalPieces || 0}</td>
                  <td style={{ border: '1px solid #000', padding: '8px', textAlign: 'right' }}>{selectedManifestForPrint.summary.totalWeight?.toFixed(2) || '0.00'}</td>
                  <td colSpan="3" style={{ border: '1px solid #000', padding: '8px' }}></td>
                </tr>
              )}
            </tbody>
          </table>

          {selectedManifestForPrint.summary && (
            <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
              <div>
                <strong>Paid:</strong> ₹{selectedManifestForPrint.summary.totalPaid?.toFixed(2) || '0.00'}
              </div>
              <div>
                <strong>To Pay:</strong> ₹{selectedManifestForPrint.summary.totalToPay?.toFixed(2) || '0.00'}
              </div>
              <div>
                <strong>TBB:</strong> ₹{selectedManifestForPrint.summary.totalTBB?.toFixed(2) || '0.00'}
              </div>
            </div>
          )}

          {selectedManifestForPrint.remarks && (
            <div style={{ marginTop: '16px' }}>
              <strong>Remarks:</strong> {selectedManifestForPrint.remarks}
            </div>
          )}

          <div style={{ marginTop: '48px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
            <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
              Prepared By
            </div>
            <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
              Checked By
            </div>
            <div style={{ borderTop: '2px solid #000', paddingTop: '8px', textAlign: 'center' }}>
              Driver Signature
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          
          #manifest-print-view, #manifest-print-view * {
            visibility: visible;
          }
          
          #manifest-print-view {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}

