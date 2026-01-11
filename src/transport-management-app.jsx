import React, { useState, useEffect } from 'react';
import { FileText, Users, MapPin, Truck, Package, UserCheck, Briefcase, Building2, UserCog, ClipboardList, CheckCircle, Receipt, DollarSign, BarChart, LogOut, User, Menu, X, Home, Settings, ChevronRight, TrendingUp, BookOpen, Hash, PackageCheck, Database, Edit2, Wallet } from 'lucide-react';
import initSampleData from './init-sample-data';
import AutoDataSync from './components/AutoDataSync';
import syncService from './utils/sync-service';

import LoginForm from './login-form.jsx';
import ClientMasterForm from './client-master-form.jsx';
import CityMasterForm from './city-master-form.jsx';
import VehicleMasterForm from './vehicle-master-form.jsx';
import DriverMasterForm from './driver-master-form.jsx';
import StaffMasterForm from './staff-master-form.jsx';
import BranchMasterForm from './branch-master-form.jsx';
import UserMasterForm from './user-master-form.jsx';
import AccountMaster from './account-master.jsx';
import LRSeriesMaster from './lr-series-master.jsx';
import ClientRateMaster from './client-rate-master.jsx';
import MarketVehicleVendorForm from './market-vehicle-vendor-form.jsx';
import OtherVendorForm from './other-vendor-form.jsx';
import LRBookingForm from './lr-booking-form.jsx';
import FTLBookingForm from './ftl-booking-form.jsx';
import FTLInquiryForm from './ftl-inquiry-form.jsx';
import FTLInquiryReport from './ftl-inquiry-report.jsx';
import LRModifyForm from './lr-modify-form.jsx';
import LRTrackingSearch from './lr-tracking-search.jsx';
import ManifestForm from './manifest-form.jsx';
import ManifestReceiveForm from './manifest-receive-form.jsx';
import TripManagementForm from './trip-management-form.jsx';
import NetworkUrlDisplay from './network-url-display.jsx';
import PODForm from './pod-form.jsx';
import ManagePODForm from './manage-pod-form.jsx';
import BillingInvoiceForm from './billing-invoice-form.jsx';
import PaymentCollectionForm from './payment-collection-form.jsx';
import ReportsDashboard from './reports-dashboard.jsx';
import PendingShipmentsBranch from './pending-shipments-branch.jsx';
import BranchExpenseForm from './branch-expense-form.jsx';
import AdminExpenseForm from './admin-expense-form.jsx';
import BranchAccountForm from './branch-account-form.jsx';
import BranchDayBook from './branch-daybook.jsx';
import ExpenseMasterForm from './expense-master-form.jsx';

export default function TransportManagementApp() {
  const [currentView, setCurrentView] = useState('home');
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);

  // Load branches from server using hook (no localStorage fallback)
  const loadBranchesFromServer = async () => {
    try {
      const response = await fetch('https://transport-management-system-wzhx.onrender.com/api/branches');
      const result = await response.json();
      const activeBranches = (result.data || []).filter(b => b.status === 'Active' || !b.status);
      setBranches(activeBranches);
      
      // Clear localStorage to prevent conflicts
      localStorage.removeItem('branches');
      
      return activeBranches;
    } catch (error) {
      console.error('Error loading branches:', error);
      // DO NOT fallback to localStorage - this causes browser-specific data
      setBranches([]);
      return [];
    }
  };

  useEffect(() => {
    const loggedIn = localStorage.getItem('isLoggedIn');
    const user = localStorage.getItem('currentUser');
    
    if (loggedIn === 'true' && user) {
      let userData = JSON.parse(user);
      
      // If user doesn't have accessPermissions, try to load from users list
      if (!userData.accessPermissions) {
        const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
        const systemUser = systemUsers.find(u => u.username === userData.username);
        if (systemUser && systemUser.accessPermissions) {
          userData = {
            ...userData,
            accessPermissions: systemUser.accessPermissions,
            userRole: systemUser.userRole || userData.role
          };
          // Update stored user data
          localStorage.setItem('currentUser', JSON.stringify(userData));
        }
      }
      
      setIsLoggedIn(true);
      setCurrentUser(userData);
      
      // Load branches from server first, then set selected branch
      loadBranchesFromServer().then((loadedBranches) => {
        // For admin: load selected branch from localStorage or use first branch
        if (userData.role === 'Admin' || userData.role === 'admin') {
          const savedBranchId = localStorage.getItem('adminSelectedBranch');
          if (savedBranchId && loadedBranches.length > 0) {
            const branch = loadedBranches.find(b => b.id && b.id.toString() === savedBranchId);
            if (branch) {
              setSelectedBranch(branch);
              // Update currentUser branch for context
              const updatedUser = { ...userData, branch: branch.id };
              setCurrentUser(updatedUser);
              localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            }
          } else if (loadedBranches.length > 0 && loadedBranches[0].id) {
            setSelectedBranch(loadedBranches[0]);
            const updatedUser = { ...userData, branch: loadedBranches[0].id };
            setCurrentUser(updatedUser);
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            localStorage.setItem('adminSelectedBranch', loadedBranches[0].id.toString());
          }
        } else {
          // For non-admin: use their assigned branch
          if (userData.branch && loadedBranches.length > 0) {
            const branch = loadedBranches.find(b => b.id && b.id.toString() === String(userData.branch));
            if (branch) {
              setSelectedBranch(branch);
            }
          }
        }
      });
    }

    // Listen for navigation events from child components
    const handleNavigateToHome = () => {
      setCurrentView('home');
      sessionStorage.removeItem('navigateToHome');
    };

    window.addEventListener('navigateToHome', handleNavigateToHome);

    // Also check sessionStorage on mount
    if (sessionStorage.getItem('navigateToHome') === 'true') {
      setCurrentView('home');
      sessionStorage.removeItem('navigateToHome');
    }

    // Listen for data sync events to reload branches
    const handleDataSync = () => {
      loadBranchesFromServer();
    };
    window.addEventListener('dataSyncedFromServer', handleDataSync);

    return () => {
      window.removeEventListener('navigateToHome', handleNavigateToHome);
      window.removeEventListener('dataSyncedFromServer', handleDataSync);
    };
  }, []);

  // Separate useEffect to listen for navigation events and check sessionStorage
  useEffect(() => {
    const handleNavigateToHome = () => {
      setCurrentView('home');
      sessionStorage.removeItem('navigateToHome');
    };

    const handleNavigateToView = (event) => {
      const view = event.detail || sessionStorage.getItem('navigateToView');
      if (view) {
        setCurrentView(view);
        sessionStorage.removeItem('navigateToView');
      }
    };

    window.addEventListener('navigateToHome', handleNavigateToHome);
    window.addEventListener('navigateToView', handleNavigateToView);

    // Poll sessionStorage as a fallback (check every 100ms)
    const pollInterval = setInterval(() => {
      if (sessionStorage.getItem('navigateToHome') === 'true') {
        setCurrentView('home');
        sessionStorage.removeItem('navigateToHome');
      }
      const navigateToView = sessionStorage.getItem('navigateToView');
      if (navigateToView) {
        setCurrentView(navigateToView);
        sessionStorage.removeItem('navigateToView');
      }
    }, 100);

    return () => {
      window.removeEventListener('navigateToHome', handleNavigateToHome);
      window.removeEventListener('navigateToView', handleNavigateToView);
      clearInterval(pollInterval);
    };
  }, []);

  const ACCESS_CONTROL = {
    'Admin': ['client-master', 'city-master', 'vehicle-master', 'driver-master', 'staff-master', 'branch-master', 'user-master', 'lr-series', 'account-master', 'expense-master', 'client-rate-master', 'market-vehicle-vendor', 'other-vendor', 'lr-booking', 'ftl-booking', 'ftl-inquiry', 'ftl-inquiry-report', 'lr-modify', 'manifest', 'manifest-receive', 'pending-shipments', 'trip-management', 'pod', 'manage-pod', 'billing', 'payments', 'branch-expense', 'admin-expense', 'branch-account', 'branch-daybook', 'reports'],
    'Manager': ['client-master', 'city-master', 'vehicle-master', 'driver-master', 'staff-master', 'lr-series', 'account-master', 'expense-master', 'client-rate-master', 'market-vehicle-vendor', 'other-vendor', 'lr-booking', 'ftl-booking', 'ftl-inquiry', 'ftl-inquiry-report', 'lr-modify', 'manifest', 'manifest-receive', 'pending-shipments', 'trip-management', 'pod', 'manage-pod', 'billing', 'payments', 'branch-expense', 'branch-account', 'branch-daybook', 'reports'],
    'Operator': ['lr-booking', 'ftl-booking', 'ftl-inquiry', 'ftl-inquiry-report', 'lr-modify', 'manifest', 'manifest-receive', 'pending-shipments', 'trip-management', 'pod', 'manage-pod', 'branch-expense', 'branch-daybook'],
    'Accountant': ['client-master', 'account-master', 'expense-master', 'client-rate-master', 'lr-booking', 'ftl-booking', 'lr-modify', 'billing', 'payments', 'branch-expense', 'admin-expense', 'branch-account', 'branch-daybook', 'reports'],
    'Driver': ['trip-management', 'pod']
  };

  // MENU REORDERED - OPERATIONS FIRST
  const MENU_STRUCTURE = [
    {
      category: 'Operations',
      icon: TrendingUp,
      color: '#3b82f6',
      items: [
        { id: 'lr-booking', title: 'PTL LR Booking', icon: FileText, color: '#3b82f6' },
        { id: 'ftl-booking', title: 'FTL LR Booking', icon: FileText, color: '#8b5cf6' },
        { id: 'ftl-inquiry', title: 'FTL Inquiry', icon: FileText, color: '#06b6d4' },
        { id: 'lr-modify', title: 'LR View/Modify', icon: Edit2, color: '#8b5cf6' },
        { id: 'manifest', title: 'Manifest', icon: ClipboardList, color: '#06b6d4' },
        { id: 'manifest-receive', title: 'Manifest Receive', icon: PackageCheck, color: '#10b981' },
        { id: 'pending-shipments', title: 'Pending Shipments', icon: Package, color: '#f59e0b' },
        { id: 'trip-management', title: 'Trip Management', icon: Truck, color: '#8b5cf6' },
        { id: 'pod', title: 'Create POD', icon: CheckCircle, color: '#10b981' },
        { id: 'manage-pod', title: 'Manage PODs', icon: PackageCheck, color: '#10b981' }
      ]
    },
    {
      category: 'Financial',
      icon: DollarSign,
      color: '#10b981',
      items: [
        { id: 'billing', title: 'Billing & Invoice', icon: Receipt, color: '#f59e0b' },
        { id: 'payments', title: 'Payment Collection', icon: DollarSign, color: '#10b981' },
        { id: 'branch-expense', title: 'Branch Expense', icon: Receipt, color: '#f97316' },
        { id: 'admin-expense', title: 'Fund Allocation', icon: DollarSign, color: '#3b82f6' },
        { id: 'branch-daybook', title: 'Branch Day Book', icon: BookOpen, color: '#14b8a6' }
      ]
    },
    {
      category: 'Reports',
      icon: BarChart,
      color: '#ec4899',
      items: [
        { id: 'reports', title: 'Reports & Analytics', icon: BarChart, color: '#ec4899' },
        { id: 'ftl-inquiry-report', title: 'FTL Inquiry Report', icon: FileText, color: '#06b6d4' }
      ]
    },
    {
      category: 'Master Data',
      icon: Settings,
      color: '#64748b',
      items: [
        { id: 'client-master', title: 'Client Master', icon: Users, color: '#6366f1' },
        { id: 'city-master', title: 'City Master', icon: MapPin, color: '#14b8a6' },
        { id: 'vehicle-master', title: 'Vehicle Master', icon: Truck, color: '#f97316' },
        { id: 'driver-master', title: 'Driver Master', icon: UserCheck, color: '#06b6d4' },
        { id: 'staff-master', title: 'Staff Master', icon: Briefcase, color: '#a855f7' },
        { id: 'branch-master', title: 'Branch Master', icon: Building2, color: '#f59e0b' },
        { id: 'user-master', title: 'User Master', icon: UserCog, color: '#8b5cf6' },
        { id: 'lr-series', title: 'LR Series', icon: Hash, color: '#8b5cf6' },
        { id: 'account-master', title: 'Account Master', icon: BookOpen, color: '#10b981' },
        { id: 'expense-master', title: 'Expense Master', icon: DollarSign, color: '#ef4444' },
        { id: 'branch-account', title: 'Branch Accounts', icon: Wallet, color: '#6366f1' },
        { id: 'client-rate-master', title: 'Client Rate Master', icon: DollarSign, color: '#10b981' }
      ]
    },
    {
      category: 'Vendors',
      icon: Package,
      color: '#f97316',
      items: [
        { id: 'market-vehicle-vendor', title: 'Market Vehicle Vendor', icon: Truck, color: '#f97316' },
        { id: 'other-vendor', title: 'Other Vendor', icon: Package, color: '#fb923c' }
      ]
    }
  ];

  // Map permission keys to menu item IDs
  const PERMISSION_TO_MODULES = {
    'operations': ['lr-booking', 'ftl-booking', 'ftl-inquiry', 'ftl-inquiry-report', 'lr-modify', 'manifest', 'manifest-receive', 'pending-shipments', 'trip-management', 'pod', 'manage-pod'],
    'lrBooking': ['lr-booking', 'ftl-booking', 'lr-modify'],
    'clientMaster': ['client-master'],
    'cityMaster': ['city-master'],
    'vehicleMaster': ['vehicle-master'],
    'driverMaster': ['driver-master'],
    'staffMaster': ['staff-master'],
    'branchMaster': ['branch-master'],
    'marketVehicleVendor': ['market-vehicle-vendor'],
    'otherVendor': ['other-vendor'],
    'reports': ['reports', 'ftl-inquiry-report'],
    'settings': ['user-master', 'lr-series', 'account-master', 'expense-master', 'branch-account', 'client-rate-master']
  };

  const hasAccess = (moduleId) => {
    if (!currentUser) return false;
    
    // First check role-based access
    const userAccess = ACCESS_CONTROL[currentUser.role] || [];
    if (userAccess.includes(moduleId)) {
      return true;
    }
    
    // Then check individual user permissions
    if (currentUser.accessPermissions) {
      // Check if user has 'operations' permission and module is in operations category
      if (currentUser.accessPermissions.operations && PERMISSION_TO_MODULES.operations.includes(moduleId)) {
        return true;
      }
      
      // Check other permissions
      for (const [permissionKey, moduleIds] of Object.entries(PERMISSION_TO_MODULES)) {
        if (currentUser.accessPermissions[permissionKey] && moduleIds.includes(moduleId)) {
          return true;
        }
      }
    }
    
    return false;
  };

  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
    setCurrentUser(null);
    setIsLoggedIn(false);
    setCurrentView('home');
    setSelectedBranch(null);
  };

  const handleBranchChange = (branchId) => {
    if (!branchId || branchId === 'all') {
      setSelectedBranch(null);
      const updatedUser = { ...currentUser, branch: null };
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      localStorage.removeItem('adminSelectedBranch');
    } else {
      const branch = branches.find(b => b.id && b.id.toString() === String(branchId));
      if (branch) {
        setSelectedBranch(branch);
        const updatedUser = { ...currentUser, branch: branch.id };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            if (branch.id) {
              localStorage.setItem('adminSelectedBranch', branch.id.toString());
            }
      }
    }
  };

  const isAdmin = currentUser && (currentUser.role === 'Admin' || currentUser.role === 'admin');

  const renderContent = () => {
    const viewMap = {
      'client-master': <ClientMasterForm />,
      'city-master': <CityMasterForm />,
      'vehicle-master': <VehicleMasterForm />,
      'driver-master': <DriverMasterForm />,
      'staff-master': <StaffMasterForm />,
      'branch-master': <BranchMasterForm />,
      'user-master': <UserMasterForm />,
      'lr-series': <LRSeriesMaster />,
      'account-master': <AccountMaster />,
      'expense-master': <ExpenseMasterForm />,
      'client-rate-master': <ClientRateMaster />,
      'market-vehicle-vendor': <MarketVehicleVendorForm />,
      'other-vendor': <OtherVendorForm />,
      'lr-booking': <LRBookingForm />,
      'ftl-booking': <FTLBookingForm />,
      'ftl-inquiry': <FTLInquiryForm />,
      'ftl-inquiry-report': <FTLInquiryReport />,
      'lr-modify': <LRModifyForm />,
      'manifest': <ManifestForm />,
      'manifest-receive': <ManifestReceiveForm />,
      'pending-shipments': <PendingShipmentsBranch />,
      'trip-management': <TripManagementForm />,
      'pod': <PODForm />,
      'manage-pod': <ManagePODForm />,
      'billing': <BillingInvoiceForm />,
      'payments': <PaymentCollectionForm />,
      'branch-expense': <BranchExpenseForm />,
      'admin-expense': <AdminExpenseForm />,
      'branch-account': <BranchAccountForm />,
      'branch-daybook': <BranchDayBook />,
      'reports': <ReportsDashboard />
    };

    if (currentView === 'home') {
      return renderDashboard();
    }

    return viewMap[currentView] || renderDashboard();
  };

  const renderDashboard = () => {
    // Get notifications for expiry
    const getNotifications = () => {
      const notifications = [];
      const today = new Date();
      const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
      
      // Check E-waybill expiry for shipments without POD
      const lrBookings = JSON.parse(localStorage.getItem('lrBookings') || '[]');
      const pods = JSON.parse(localStorage.getItem('pods') || '[]');
      
      lrBookings.forEach(lr => {
        // Check if POD exists for this LR
        const podExists = pods.some(pod => {
          const podLRId = typeof pod.lrNumber === 'object' ? pod.lrNumber.id : pod.lrNumber;
          return podLRId === lr.id || podLRId === lr.lrNumber || pod.lrNumber === lr.lrNumber;
        });
        
        // Only check e-waybill expiry if POD is not uploaded
        if (!podExists && lr.ewaybills && Array.isArray(lr.ewaybills)) {
          lr.ewaybills.forEach((ewaybill, index) => {
            if (ewaybill.expiryDate) {
              const expiryDate = new Date(ewaybill.expiryDate);
              if (expiryDate < today) {
                notifications.push({
                  type: 'expired',
                  category: 'ewaybill',
                  title: 'E-Waybill Expired',
                  message: `LR ${lr.lrNumber}: E-Waybill ${ewaybill.number || `#${index + 1}`} expired on ${expiryDate.toLocaleDateString()}`,
                  link: 'lr-modify',
                  linkId: lr.id,
                  priority: 'high'
                });
              } else if (expiryDate <= thirtyDaysFromNow) {
                notifications.push({
                  type: 'expiring',
                  category: 'ewaybill',
                  title: 'E-Waybill Expiring Soon',
                  message: `LR ${lr.lrNumber}: E-Waybill ${ewaybill.number || `#${index + 1}`} expires on ${expiryDate.toLocaleDateString()}`,
                  link: 'lr-modify',
                  linkId: lr.id,
                  priority: 'medium'
                });
              }
            }
          });
        }
      });
      
      // Check Vehicle document expiry
      const vehicles = JSON.parse(localStorage.getItem('vehicles') || '[]');
      vehicles.forEach(vehicle => {
        // Check Permit expiry
        if (vehicle.permit?.expiryDate) {
          const expiryDate = new Date(vehicle.permit.expiryDate);
          if (expiryDate < today) {
            notifications.push({
              type: 'expired',
              category: 'vehicle',
              title: 'Vehicle Permit Expired',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Permit expired on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'high'
            });
          } else if (expiryDate <= thirtyDaysFromNow) {
            notifications.push({
              type: 'expiring',
              category: 'vehicle',
              title: 'Vehicle Permit Expiring Soon',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Permit expires on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'medium'
            });
          }
        }
        
        // Check Fitness expiry
        if (vehicle.fitness?.expiryDate) {
          const expiryDate = new Date(vehicle.fitness.expiryDate);
          if (expiryDate < today) {
            notifications.push({
              type: 'expired',
              category: 'vehicle',
              title: 'Vehicle Fitness Expired',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Fitness expired on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'high'
            });
          } else if (expiryDate <= thirtyDaysFromNow) {
            notifications.push({
              type: 'expiring',
              category: 'vehicle',
              title: 'Vehicle Fitness Expiring Soon',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Fitness expires on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'medium'
            });
          }
        }
        
        // Check TP expiry
        if (vehicle.tp?.expiryDate) {
          const expiryDate = new Date(vehicle.tp.expiryDate);
          if (expiryDate < today) {
            notifications.push({
              type: 'expired',
              category: 'vehicle',
              title: 'Vehicle TP Expired',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: TP (${vehicle.tp.state || 'N/A'}) expired on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'high'
            });
          } else if (expiryDate <= thirtyDaysFromNow) {
            notifications.push({
              type: 'expiring',
              category: 'vehicle',
              title: 'Vehicle TP Expiring Soon',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: TP (${vehicle.tp.state || 'N/A'}) expires on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'medium'
            });
          }
        }
        
        // Check Insurance expiry
        if (vehicle.insurance?.expiryDate) {
          const expiryDate = new Date(vehicle.insurance.expiryDate);
          if (expiryDate < today) {
            notifications.push({
              type: 'expired',
              category: 'vehicle',
              title: 'Vehicle Insurance Expired',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Insurance expired on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'high'
            });
          } else if (expiryDate <= thirtyDaysFromNow) {
            notifications.push({
              type: 'expiring',
              category: 'vehicle',
              title: 'Vehicle Insurance Expiring Soon',
              message: `${vehicle.vehicleNumber || vehicle.vehicle_number}: Insurance expires on ${expiryDate.toLocaleDateString()}`,
              link: 'vehicle-master',
              priority: 'medium'
            });
          }
        }
      });
      
      // Check Driver License expiry
      const drivers = JSON.parse(localStorage.getItem('drivers') || '[]');
      drivers.forEach(driver => {
        if (driver.licenseExpiryDate) {
          const expiryDate = new Date(driver.licenseExpiryDate);
          if (expiryDate < today) {
            notifications.push({
              type: 'expired',
              category: 'driver',
              title: 'Driver License Expired',
              message: `${driver.driverName || driver.name}: License ${driver.licenseNumber || ''} expired on ${expiryDate.toLocaleDateString()}`,
              link: 'driver-master',
              priority: 'high'
            });
          } else if (expiryDate <= thirtyDaysFromNow) {
            notifications.push({
              type: 'expiring',
              category: 'driver',
              title: 'Driver License Expiring Soon',
              message: `${driver.driverName || driver.name}: License ${driver.licenseNumber || ''} expires on ${expiryDate.toLocaleDateString()}`,
              link: 'driver-master',
              priority: 'medium'
            });
          }
        }
      });
      
      // Sort by priority (high first) and then by type (expired first)
      return notifications.sort((a, b) => {
        if (a.priority === 'high' && b.priority !== 'high') return -1;
        if (a.priority !== 'high' && b.priority === 'high') return 1;
        if (a.type === 'expired' && b.type !== 'expired') return -1;
        if (a.type !== 'expired' && b.type === 'expired') return 1;
        return 0;
      });
    };

    const notifications = getNotifications();
    const expiredCount = notifications.filter(n => n.type === 'expired').length;
    const expiringCount = notifications.filter(n => n.type === 'expiring').length;

    return (
      <div>
        <style>{`
          .welcome-banner {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px;
            border-radius: 16px;
            color: white;
            margin-bottom: 30px;
            box-shadow: 0 8px 32px rgba(102,126,234,0.3);
          }
          
          .workflow-section {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            border-radius: 16px;
            padding: 28px;
            margin-bottom: 24px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
          }
          
          .section-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid rgba(255,255,255,0.1);
          }
          
          .section-title {
            font-size: 1.4rem;
            font-weight: 700;
            color: white;
          }
          
          .workflow-steps {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
          }
          
          .step-card {
            background: linear-gradient(135deg, rgba(59,130,246,0.1) 0%, rgba(139,92,246,0.1) 100%);
            padding: 24px;
            border-radius: 12px;
            border: 2px solid rgba(59,130,246,0.3);
            cursor: pointer;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .step-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(139,92,246,0.2) 100%);
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          
          .step-card:hover::before {
            opacity: 1;
          }
          
          .step-card:hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 12px 32px rgba(59,130,246,0.4);
            border-color: #3b82f6;
          }
          
          .step-number {
            width: 40px;
            height: 40px;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            color: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            font-size: 1.2rem;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
            box-shadow: 0 4px 12px rgba(59,130,246,0.5);
          }
          
          .step-title {
            font-weight: 700;
            color: white;
            margin-bottom: 8px;
            font-size: 1.1rem;
            position: relative;
            z-index: 1;
          }
          
          .step-desc {
            font-size: 0.9rem;
            color: rgba(255,255,255,0.7);
            position: relative;
            z-index: 1;
          }
          
          .quick-stats {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
          }
          
          .stat-card {
            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
            padding: 28px;
            border-radius: 16px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            border: 1px solid rgba(255,255,255,0.1);
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease;
          }
          
          .stat-card::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%);
            transition: all 0.3s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 32px rgba(59,130,246,0.3);
            border-color: #3b82f6;
          }
          
          .stat-card:hover::before {
            top: -25%;
            right: -25%;
          }
          
          .stat-value {
            font-size: 2.5rem;
            font-weight: 700;
            background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 8px;
            position: relative;
            z-index: 1;
          }
          
          .stat-label {
            font-size: 0.95rem;
            color: rgba(255,255,255,0.6);
            font-weight: 500;
            position: relative;
            z-index: 1;
          }
          
          .stat-icon {
            position: absolute;
            top: 20px;
            right: 20px;
            opacity: 0.1;
            z-index: 0;
          }
          
          @media (max-width: 768px) {
            .quick-stats {
              grid-template-columns: repeat(2, 1fr);
            }
            
            .workflow-steps {
              grid-template-columns: 1fr;
            }
          }
          
          .notifications-section {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 30px;
            box-shadow: 0 4px 16px rgba(0,0,0,0.1);
          }
          
          .notification-item {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 12px;
            border-left: 4px solid;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .notification-item:hover {
            transform: translateX(4px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .notification-expired {
            background: #fee2e2;
            border-left-color: #dc2626;
          }
          
          .notification-expiring {
            background: #fef3c7;
            border-left-color: #f59e0b;
          }
          
          .notification-title {
            font-weight: 600;
            font-size: 1rem;
            margin-bottom: 4px;
          }
          
          .notification-expired .notification-title {
            color: #dc2626;
          }
          
          .notification-expiring .notification-title {
            color: #92400e;
          }
          
          .notification-message {
            font-size: 0.9rem;
            color: #475569;
          }
          
          .notification-badge {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-left: 8px;
          }
          
          .badge-expired {
            background: #dc2626;
            color: white;
          }
          
          .badge-expiring {
            background: #f59e0b;
            color: white;
          }
        `}</style>

        <div className="welcome-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: 'rgba(255,255,255,0.2)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.3)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <Truck size={48} style={{ color: 'white' }} />
            </div>
            <div>
              <h1 style={{ fontSize: '2.2rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>TMS</span>
                <span style={{ fontSize: '1.8rem', opacity: 0.8 }}>|</span>
                <span style={{ fontSize: '1.6rem', fontWeight: 500 }}>Transport Management System</span>
              </h1>
              <p style={{ fontSize: '0.95rem', opacity: 0.9, marginTop: '4px' }}>
                Complete Logistics & Fleet Management Solution
              </p>
            </div>
          </div>
          <div style={{ 
            paddingTop: '20px', 
            borderTop: '1px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '4px' }}>
                Welcome, {currentUser?.name}! 👋
              </h2>
              <p style={{ fontSize: '1rem', opacity: 0.95 }}>
                {currentUser?.role} Dashboard
              </p>
            </div>
            {currentUser?.branch && (
              <div style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '12px 20px',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.2)'
              }}>
                <div style={{ fontSize: '0.85rem', opacity: 0.9, marginBottom: '4px' }}>Branch</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                  {(() => {
                    // Use branches from state (loaded from server), not localStorage
                    if (currentUser.branch && branches.length > 0) {
                      const branch = branches.find(b => b.id && b.id.toString() === String(currentUser.branch));
                      return branch ? `${branch.branchName} - ${branch.address?.city || branch.city || ''}` : 'N/A';
                    }
                    return 'N/A';
                  })()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* LR Search Section */}
        {hasAccess('lr-booking') && (
          <div className="workflow-section" style={{ marginBottom: '30px' }}>
            <div className="section-header">
              <FileText size={28} style={{ color: '#3b82f6' }} />
              <span className="section-title">LR Tracking & Search</span>
            </div>
            <LRTrackingSearch onLRSelect={(lrId) => {
              setCurrentView('lr-modify');
              // Store selected LR ID for editing
              sessionStorage.setItem('editLRId', lrId);
            }} />
          </div>
        )}

        {/* Quick Stats */}
        <div className="quick-stats">
          <div className="stat-card">
            <FileText size={48} className="stat-icon" style={{ color: '#3b82f6' }} />
            <div className="stat-value">{JSON.parse(localStorage.getItem('lrBookings') || '[]').length}</div>
            <div className="stat-label">Total LRs</div>
          </div>
          <div className="stat-card">
            <Truck size={48} className="stat-icon" style={{ color: '#8b5cf6' }} />
            <div className="stat-value">{JSON.parse(localStorage.getItem('trips') || '[]').filter(t => t.status === 'In Progress').length}</div>
            <div className="stat-label">Active Trips</div>
          </div>
          <div className="stat-card">
            <Receipt size={48} className="stat-icon" style={{ color: '#f59e0b' }} />
            <div className="stat-value">{JSON.parse(localStorage.getItem('invoices') || '[]').filter(i => i.status === 'Pending').length}</div>
            <div className="stat-label">Pending Invoices</div>
          </div>
          <div className="stat-card">
            <TrendingUp size={48} className="stat-icon" style={{ color: '#10b981' }} />
            <div className="stat-value">{JSON.parse(localStorage.getItem('vehicles') || '[]').filter(v => v.status === 'Active').length}</div>
            <div className="stat-label">Active Vehicles</div>
          </div>
        </div>

        {/* Notifications Section */}
        {notifications.length > 0 && (
          <div className="notifications-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                ⚠️ Expiry Notifications
              </h2>
              <div style={{ display: 'flex', gap: '12px' }}>
                {expiredCount > 0 && (
                  <span className="notification-badge badge-expired">
                    {expiredCount} Expired
                  </span>
                )}
                {expiringCount > 0 && (
                  <span className="notification-badge badge-expiring">
                    {expiringCount} Expiring Soon
                  </span>
                )}
              </div>
            </div>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {notifications.map((notification, index) => (
                <div
                  key={index}
                  className={`notification-item ${notification.type === 'expired' ? 'notification-expired' : 'notification-expiring'}`}
                  onClick={() => {
                    setCurrentView(notification.link);
                    if (notification.linkId) {
                      // Store the LR ID to highlight it in the modify form
                      setTimeout(() => {
                        localStorage.setItem('highlightLRId', notification.linkId.toString());
                      }, 100);
                    }
                  }}
                >
                  <div className="notification-title">
                    {notification.title}
                    <span className={`notification-badge ${notification.type === 'expired' ? 'badge-expired' : 'badge-expiring'}`}>
                      {notification.type === 'expired' ? 'Expired' : 'Expiring'}
                    </span>
                  </div>
                  <div className="notification-message">
                    {notification.message}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                    Click to view details →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily Operations Workflow */}
        {hasAccess('lr-booking') && (
          <div className="workflow-section">
            <div className="section-header">
              <TrendingUp size={28} style={{ color: '#3b82f6' }} />
              <span className="section-title">Daily Operations Workflow</span>
            </div>
            <div className="workflow-steps">
              {hasAccess('lr-booking') && (
                <div className="step-card" onClick={() => setCurrentView('lr-booking')}>
                  <div className="step-number">1</div>
                  <div className="step-title">📄 LR Booking</div>
                  <div className="step-desc">Create new consignment booking</div>
                </div>
              )}
              {hasAccess('manifest') && (
                <div className="step-card" onClick={() => setCurrentView('manifest')}>
                  <div className="step-number">2</div>
                  <div className="step-title">📋 Manifest</div>
                  <div className="step-desc">Consolidate multiple LRs</div>
                </div>
              )}
              {hasAccess('trip-management') && (
                <div className="step-card" onClick={() => setCurrentView('trip-management')}>
                  <div className="step-number">3</div>
                  <div className="step-title">🚚 Trip Management</div>
                  <div className="step-desc">Assign vehicle & track trip</div>
                </div>
              )}
              {hasAccess('pod') && (
                <div className="step-card" onClick={() => setCurrentView('pod')}>
                  <div className="step-number">4</div>
                  <div className="step-title">✅ Create POD</div>
                  <div className="step-desc">Delivery confirmation</div>
                </div>
              )}
              {hasAccess('manage-pod') && (
                <div className="step-card" onClick={() => setCurrentView('manage-pod')}>
                  <div className="step-number">5</div>
                  <div className="step-title">📦 Manage PODs</div>
                  <div className="step-desc">View & edit all PODs</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Financial Workflow */}
        {hasAccess('billing') && (
          <div className="workflow-section">
            <div className="section-header">
              <DollarSign size={28} style={{ color: '#10b981' }} />
              <span className="section-title">Financial Workflow</span>
            </div>
            <div className="workflow-steps">
              {hasAccess('billing') && (
                <div className="step-card" onClick={() => setCurrentView('billing')}>
                  <div className="step-number" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>1</div>
                  <div className="step-title">🧾 Generate Invoice</div>
                  <div className="step-desc">Bill TBB clients</div>
                </div>
              )}
              {hasAccess('payments') && (
                <div className="step-card" onClick={() => setCurrentView('payments')}>
                  <div className="step-number" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>2</div>
                  <div className="step-title">💰 Record Payment</div>
                  <div className="step-desc">Track payment collections</div>
                </div>
              )}
              {hasAccess('reports') && (
                <div className="step-card" onClick={() => setCurrentView('reports')}>
                  <div className="step-number" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>3</div>
                  <div className="step-title">📊 View Reports</div>
                  <div className="step-desc">Analytics & business insights</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Master Data Setup */}
        {(hasAccess('client-master') || hasAccess('vehicle-master')) && (
          <div className="workflow-section">
            <div className="section-header">
              <Settings size={28} style={{ color: '#64748b' }} />
              <span className="section-title">Master Data Management</span>
            </div>
            <div className="workflow-steps">
              {hasAccess('branch-master') && (
                <div className="step-card" onClick={() => setCurrentView('branch-master')}>
                  <div className="step-title">🏢 Branch Master</div>
                  <div className="step-desc">Setup branch network</div>
                </div>
              )}
              {hasAccess('client-master') && (
                <div className="step-card" onClick={() => setCurrentView('client-master')}>
                  <div className="step-title">👥 Client Master</div>
                  <div className="step-desc">Manage TBB clients</div>
                </div>
              )}
              {hasAccess('city-master') && (
                <div className="step-card" onClick={() => setCurrentView('city-master')}>
                  <div className="step-title">📍 City Master</div>
                  <div className="step-desc">Add cities & routes</div>
                </div>
              )}
              {hasAccess('vehicle-master') && (
                <div className="step-card" onClick={() => setCurrentView('vehicle-master')}>
                  <div className="step-title">🚛 Vehicle Master</div>
                  <div className="step-desc">Fleet management</div>
                </div>
              )}
              {hasAccess('driver-master') && (
                <div className="step-card" onClick={() => setCurrentView('driver-master')}>
                  <div className="step-title">👤 Driver Master</div>
                  <div className="step-desc">Driver onboarding</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f172a' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        .sidebar {
          width: 280px;
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border-right: 1px solid rgba(255,255,255,0.1);
          display: flex;
          flex-direction: column;
          transition: all 0.3s ease;
        }
        
        .sidebar.closed {
          width: 80px;
        }
        
        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        
        .logo {
          font-size: 1.4rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .menu-section {
          padding: 16px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        
        .menu-category {
          padding: 12px 20px;
          font-size: 0.7rem;
          font-weight: 700;
          color: rgba(255,255,255,0.5);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .menu-item {
          padding: 14px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          color: rgba(255,255,255,0.7);
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
          position: relative;
        }
        
        .menu-item::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
          opacity: 0;
          transition: opacity 0.2s ease;
        }
        
        .menu-item:hover {
          background: rgba(59,130,246,0.1);
          color: white;
        }
        
        .menu-item:hover::before {
          opacity: 1;
        }
        
        .menu-item.active {
          background: rgba(59,130,246,0.15);
          color: white;
          font-weight: 600;
        }
        
        .menu-item.active::before {
          opacity: 1;
        }
        
        .sidebar-footer {
          margin-top: auto;
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px;
          background: rgba(59,130,246,0.1);
          border-radius: 12px;
          margin-bottom: 12px;
          border: 1px solid rgba(59,130,246,0.2);
        }
        
        .user-avatar {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 4px 12px rgba(102,126,234,0.4);
        }
        
        .user-info {
          flex: 1;
        }
        
        .user-name {
          font-weight: 700;
          color: white;
          font-size: 0.95rem;
        }
        
        .user-role {
          font-size: 0.75rem;
          color: rgba(255,255,255,0.6);
          background: rgba(59,130,246,0.2);
          padding: 2px 8px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 2px;
        }
        
        .logout-button {
          width: 100%;
          padding: 14px;
          background: rgba(239,68,68,0.1);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 10px;
          color: #fca5a5;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }
        
        .logout-button:hover {
          background: rgba(239,68,68,0.2);
          border-color: #ef4444;
          color: #fee2e2;
          transform: translateY(-2px);
        }
        
        .main-content {
          flex: 1;
          overflow-y: auto;
          padding: 30px;
          background: linear-gradient(180deg, #0f172a 0%, #1e293b 100%);
        }
        
        .top-bar {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
          padding: 20px 30px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }
        
        .breadcrumb {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.6);
          font-size: 0.9rem;
        }
        
        .toggle-btn {
          width: 44px;
          height: 44px;
          border: 1px solid rgba(255,255,255,0.1);
          background: rgba(59,130,246,0.1);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.8);
          transition: all 0.2s ease;
        }
        
        .toggle-btn:hover {
          background: rgba(59,130,246,0.2);
          border-color: #3b82f6;
          transform: scale(1.05);
        }
      `}</style>

      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? '' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <Truck size={32} />
            {sidebarOpen && <span>TMS Pro</span>}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          <div className="menu-item" onClick={() => setCurrentView('home')} style={{ background: currentView === 'home' ? 'rgba(59,130,246,0.15)' : 'transparent' }}>
            <Home size={22} />
            {sidebarOpen && <span>Dashboard</span>}
          </div>

          {MENU_STRUCTURE.map((section, idx) => {
            const accessibleItems = section.items.filter(item => hasAccess(item.id));
            if (accessibleItems.length === 0) return null;

            const CategoryIcon = section.icon;
            return (
              <div key={idx} className="menu-section">
                {sidebarOpen && (
                  <div className="menu-category">
                    <CategoryIcon size={14} />
                    {section.category}
                  </div>
                )}
                {accessibleItems.map(item => {
                  const ItemIcon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className={`menu-item ${currentView === item.id ? 'active' : ''}`}
                      onClick={() => setCurrentView(item.id)}
                    >
                      <ItemIcon size={22} style={{ color: item.color }} />
                      {sidebarOpen && <span>{item.title}</span>}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <>
              <div className="user-profile">
                <div className="user-avatar">
                  <User size={22} />
                </div>
                <div className="user-info">
                  <div className="user-name">{currentUser?.name}</div>
                  <div className="user-role">{currentUser?.role}</div>
                </div>
              </div>
              <button className="logout-button" onClick={handleLogout}>
                <LogOut size={20} />
                Logout
              </button>
            </>
          )}
          {!sidebarOpen && (
            <button className="logout-button" onClick={handleLogout} style={{ padding: '14px 0' }}>
              <LogOut size={20} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="top-bar">
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          
          <div className="breadcrumb">
            <Home size={16} />
            <ChevronRight size={16} />
            <span style={{ color: 'white', fontWeight: 600 }}>
              {currentView === 'home' ? 'Dashboard' : MENU_STRUCTURE.flatMap(s => s.items).find(i => i.id === currentView)?.title || 'Dashboard'}
            </span>
          </div>

          {/* Branch Selector for Admin */}
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Building2 size={18} style={{ color: 'rgba(255,255,255,0.7)' }} />
                <select
                  value={selectedBranch && selectedBranch.id ? selectedBranch.id.toString() : 'all'}
                  onChange={(e) => handleBranchChange(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid rgba(255,255,255,0.2)',
                    background: 'rgba(59,130,246,0.1)',
                    color: 'white',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    outline: 'none',
                    minWidth: '200px'
                  }}
                  onFocus={(e) => {
                    e.target.style.background = 'rgba(59,130,246,0.2)';
                    e.target.style.borderColor = '#3b82f6';
                  }}
                  onBlur={(e) => {
                    e.target.style.background = 'rgba(59,130,246,0.1)';
                    e.target.style.borderColor = 'rgba(255,255,255,0.2)';
                  }}
                >
                  <option value="all" style={{ background: '#1e293b', color: 'white' }}>All Branches</option>
                  {branches.map(branch => (
                    <option key={branch.id} value={branch.id} style={{ background: '#1e293b', color: 'white' }}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              </div>
              {selectedBranch && (
                <div style={{
                  padding: '6px 12px',
                  background: 'rgba(16,185,129,0.2)',
                  borderRadius: '6px',
                  border: '1px solid rgba(16,185,129,0.3)',
                  fontSize: '0.85rem',
                  color: '#10b981',
                  fontWeight: 500
                }}>
                  {selectedBranch.branchName}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="main-content">
          {renderContent()}
        </div>
      </div>
      <AutoDataSync />
    </div>
  );
}
