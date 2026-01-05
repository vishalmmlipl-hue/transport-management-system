import React, { useState, useEffect } from 'react';
import { BarChart, TrendingUp, Package, Truck, FileText, DollarSign, Users, Calendar, Download, Building2, Filter } from 'lucide-react';

export default function ReportsDashboard() {
  const [lrBookings, setLrBookings] = useState([]);
  const [trips, setTrips] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [pods, setPods] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [clients, setClients] = useState([]);
  const [branches, setBranches] = useState([]);
  const [manifests, setManifests] = useState([]);
  const [cities, setCities] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [reportType, setReportType] = useState('LR Bookings');
  
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    setLrBookings(JSON.parse(localStorage.getItem('lrBookings') || '[]'));
    setTrips(JSON.parse(localStorage.getItem('trips') || '[]'));
    setInvoices(JSON.parse(localStorage.getItem('invoices') || '[]'));
    setPayments(JSON.parse(localStorage.getItem('payments') || '[]'));
    setPods(JSON.parse(localStorage.getItem('pods') || '[]'));
    setVehicles(JSON.parse(localStorage.getItem('vehicles') || '[]'));
    setDrivers(JSON.parse(localStorage.getItem('drivers') || '[]'));
    // Load all clients (for Sundry Creditor reports)
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    const tbbClients = JSON.parse(localStorage.getItem('tbbClients') || '[]');
    setClients([...allClients, ...tbbClients]);
    setBranches(JSON.parse(localStorage.getItem('branches') || '[]'));
    setManifests(JSON.parse(localStorage.getItem('manifests') || '[]'));
    setCities(JSON.parse(localStorage.getItem('cities') || '[]'));
    
    // Get current user
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    setCurrentUser(user);
    
    // Check if admin
    const systemUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const systemUser = systemUsers.find(u => u.username === user?.username);
    const userRole = systemUser?.userRole || user?.role || '';
    const adminStatus = userRole === 'Admin' || userRole === 'admin';
    setIsAdmin(adminStatus);
    
    // Set branch for filtering
    if (adminStatus) {
      // Admin: use selected branch from top bar or all branches
      const adminBranchId = localStorage.getItem('adminSelectedBranch');
      if (adminBranchId && adminBranchId !== 'all') {
        const allBranches = JSON.parse(localStorage.getItem('branches') || '[]');
        const branch = allBranches.find(b => b.id.toString() === adminBranchId);
        setSelectedBranch(branch || null);
      } else {
        setSelectedBranch(null); // All branches
      }
    } else {
      // Non-admin: use their assigned branch
      let userBranchId = null;
      if (systemUser && systemUser.branch) {
        userBranchId = systemUser.branch;
      } else if (user && user.branch) {
        userBranchId = user.branch;
      }
      
      if (userBranchId) {
        const branch = JSON.parse(localStorage.getItem('branches') || '[]').find(b => 
          b.id.toString() === userBranchId.toString() || 
          b.branchCode === userBranchId
        );
        if (branch) {
          setSelectedBranch(branch);
        }
      }
    }
  }, []);

  // Sync with admin branch selector from top bar (for admin users)
  useEffect(() => {
    if (isAdmin) {
      const checkBranchChange = () => {
        const adminBranchId = localStorage.getItem('adminSelectedBranch');
        if (adminBranchId && adminBranchId !== 'all') {
          const branch = branches.find(b => b.id.toString() === adminBranchId);
          if (branch && (!selectedBranch || selectedBranch.id.toString() !== branch.id.toString())) {
            setSelectedBranch(branch);
          }
        } else if (selectedBranch) {
          setSelectedBranch(null);
        }
      };
      
      // Check every second for branch changes
      const interval = setInterval(checkBranchChange, 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, branches, selectedBranch]);

  // Get branch for LR based on booking branch or manifest destination
  const getLRBranch = (lr) => {
    if (lr.branch) {
      const branch = branches.find(b => b.id.toString() === lr.branch.toString());
      if (branch) return branch;
    }
    
    // Try to find from manifest
    const manifest = manifests.find(m => 
      m.selectedLRs?.some(mlr => {
        const mlrId = typeof mlr === 'object' ? mlr.id : mlr;
        return mlrId === lr.id;
      })
    );
    
    if (manifest && manifest.destinationBranch) {
      const branch = branches.find(b => 
        b.id.toString() === manifest.destinationBranch.toString() || 
        b.branchCode === manifest.destinationBranch
      );
      if (branch) return branch;
    }
    
    return null;
  };

  // Calculate metrics
  const calculateMetrics = () => {
    // Filter by date range and branch
    let filteredLRs = lrBookings.filter(lr => {
      const dateMatch = lr.bookingDate >= dateRange.from && lr.bookingDate <= dateRange.to;
      if (!dateMatch) return false;
      
      // Branch filter
      if (selectedBranch) {
        const lrBranch = getLRBranch(lr);
        return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
      }
      return true;
    });
    
    let filteredTrips = trips.filter(trip => {
      const dateMatch = trip.tripDate >= dateRange.from && trip.tripDate <= dateRange.to;
      if (!dateMatch) return false;
      
      // Branch filter - trips are linked to manifests which have branches
      if (selectedBranch) {
        const manifest = manifests.find(m => m.id === trip.manifestId);
        if (manifest && manifest.destinationBranch) {
          return manifest.destinationBranch.toString() === selectedBranch.id.toString();
        }
        return false;
      }
      return true;
    });
    
    let filteredInvoices = invoices.filter(inv => {
      const dateMatch = inv.invoiceDate >= dateRange.from && inv.invoiceDate <= dateRange.to;
      if (!dateMatch) return false;
      
      // Branch filter - invoices linked to LRs
      if (selectedBranch && inv.lrId) {
        const lr = lrBookings.find(l => l.id.toString() === inv.lrId.toString());
        if (lr) {
          const lrBranch = getLRBranch(lr);
          return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
        }
      }
      return !selectedBranch;
    });
    
    let filteredPayments = payments.filter(pay => {
      const dateMatch = pay.paymentDate >= dateRange.from && pay.paymentDate <= dateRange.to;
      if (!dateMatch) return false;
      
      // Branch filter - payments linked to invoices/LRs
      if (selectedBranch && pay.invoiceId) {
        const inv = invoices.find(i => i.id.toString() === pay.invoiceId.toString());
        if (inv && inv.lrId) {
          const lr = lrBookings.find(l => l.id.toString() === inv.lrId.toString());
          if (lr) {
            const lrBranch = getLRBranch(lr);
            return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
          }
        }
      }
      return !selectedBranch;
    });
    
    let filteredPODs = pods.filter(pod => {
      const dateMatch = pod.deliveryDate >= dateRange.from && pod.deliveryDate <= dateRange.to;
      if (!dateMatch) return false;
      
      // Branch filter - PODs linked to LRs
      if (selectedBranch && pod.lrNumber) {
        const lr = lrBookings.find(l => 
          l.id.toString() === pod.lrNumber.toString() || 
          l.lrNumber === pod.lrNumber ||
          l.id === pod.lrNumber
        );
        if (lr) {
          const lrBranch = getLRBranch(lr);
          return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
        }
      }
      return !selectedBranch;
    });

    // LR Metrics
    const totalLRs = filteredLRs.length;
    const totalRevenue = filteredLRs.reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const totalWeight = filteredLRs.reduce((sum, lr) => sum + (parseFloat(lr.weight) || 0), 0);
    const totalPieces = filteredLRs.reduce((sum, lr) => sum + (parseInt(lr.pieces) || 0), 0);
    
    // Payment Mode Split
    const paidAmount = filteredLRs.filter(lr => lr.paymentMode === 'Paid')
      .reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const toPayAmount = filteredLRs.filter(lr => lr.paymentMode === 'ToPay')
      .reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const tbbAmount = filteredLRs.filter(lr => lr.paymentMode === 'TBB')
      .reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    
    // Trip Metrics
    const totalTrips = filteredTrips.length;
    const activeTrips = filteredTrips.filter(t => t.status === 'In Progress').length;
    const completedTrips = filteredTrips.filter(t => t.status === 'Completed' || t.status === 'Closed').length;
    
    const ownedVehicleTrips = filteredTrips.filter(t => t.vehicleType === 'Owned').length;
    const marketVehicleTrips = filteredTrips.filter(t => t.vehicleType === 'Market').length;
    
    // Trip Expenses
    const totalExpenses = filteredTrips.reduce((sum, trip) => {
      if (trip.expenses && trip.expenses.length > 0) {
        return sum + trip.expenses.reduce((expSum, exp) => expSum + (parseFloat(exp.amount) || 0), 0);
      }
      return sum;
    }, 0);
    
    // Invoice Metrics
    const totalInvoices = filteredInvoices.length;
    const totalInvoiceAmount = filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.totalAmount) || 0), 0);
    const paidInvoices = filteredInvoices.filter(inv => inv.status === 'Paid').length;
    const pendingInvoices = filteredInvoices.filter(inv => inv.status === 'Pending').length;
    
    // Payment Metrics
    const totalPaymentsReceived = filteredPayments.reduce((sum, pay) => sum + (parseFloat(pay.amount) || 0), 0);
    
    // POD Metrics
    const totalDeliveries = filteredPODs.length;
    const successfulDeliveries = filteredPODs.filter(pod => pod.status === 'Delivered').length;
    
    // Fleet Metrics
    const activeVehicles = vehicles.filter(v => v.status === 'Active').length;
    const activeDrivers = drivers.filter(d => d.status === 'Active').length;
    const activeClients = clients.filter(c => c.status === 'Active').length;

    return {
      lr: {
        total: totalLRs,
        revenue: totalRevenue,
        weight: totalWeight,
        pieces: totalPieces,
        paid: paidAmount,
        toPay: toPayAmount,
        tbb: tbbAmount
      },
      trips: {
        total: totalTrips,
        active: activeTrips,
        completed: completedTrips,
        owned: ownedVehicleTrips,
        market: marketVehicleTrips,
        expenses: totalExpenses
      },
      invoices: {
        total: totalInvoices,
        amount: totalInvoiceAmount,
        paid: paidInvoices,
        pending: pendingInvoices
      },
      payments: {
        total: filteredPayments.length,
        amount: totalPaymentsReceived
      },
      deliveries: {
        total: totalDeliveries,
        successful: successfulDeliveries,
        successRate: totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries * 100) : 0
      },
      fleet: {
        vehicles: activeVehicles,
        drivers: activeDrivers,
        clients: activeClients
      }
    };
  };

  const metrics = calculateMetrics();

  // Generate Report Function
  const generateReport = () => {
    const branchName = selectedBranch ? selectedBranch.branchName : 'All_Branches';
    const dateStr = `${dateRange.from}_to_${dateRange.to}`;
    
    let csvContent = '';
    let filename = '';
    
    switch (reportType) {
      case 'LR Bookings':
        filename = `LR_Bookings_${branchName}_${dateStr}.csv`;
        csvContent = generateLRReport();
        break;
      case 'Trips':
        filename = `Trips_${branchName}_${dateStr}.csv`;
        csvContent = generateTripsReport();
        break;
      case 'Invoices':
        filename = `Invoices_${branchName}_${dateStr}.csv`;
        csvContent = generateInvoicesReport();
        break;
      case 'Payments':
        filename = `Payments_${branchName}_${dateStr}.csv`;
        csvContent = generatePaymentsReport();
        break;
      case 'PODs':
        filename = `PODs_${branchName}_${dateStr}.csv`;
        csvContent = generatePODsReport();
        break;
      case 'Paid To Pay Report':
        filename = `Paid_ToPay_Report_${branchName}_${dateStr}.csv`;
        csvContent = generatePaidToPayReport();
        break;
      case 'Sundry Creditor Payment Report':
        filename = `Sundry_Creditor_Payment_Report_${branchName}_${dateStr}.csv`;
        csvContent = generateSundryCreditorReport();
        break;
      case 'Sales Report':
        filename = `Sales_Report_${branchName}_${dateStr}.csv`;
        csvContent = generateSalesReport();
        break;
      case 'Summary Report':
        filename = `Summary_Report_${branchName}_${dateStr}.csv`;
        csvContent = generateSummaryReport();
        break;
      default:
        alert('Please select a report type');
        return;
    }
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert(`✅ Report "${filename}" generated successfully!`);
  };

  const generateLRReport = () => {
    const filteredLRs = lrBookings.filter(lr => {
      const dateMatch = lr.bookingDate >= dateRange.from && lr.bookingDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch) {
        const lrBranch = getLRBranch(lr);
        return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
      }
      return true;
    });

    const headers = [
      'LR Number', 'Booking Date', 'Branch', 'Consignor Name', 'Consignor Contact',
      'Consignee Name', 'Consignee Contact', 'Origin', 'Destination', 'Pieces',
      'Weight (kg)', 'Amount', 'Payment Mode', 'Status', 'Expected Delivery Date'
    ];
    
    const rows = filteredLRs.map(lr => [
      lr.lrNumber || '',
      lr.bookingDate || '',
      getLRBranch(lr)?.branchName || 'N/A',
      lr.consignor?.name || '',
      lr.consignor?.contact || '',
      lr.consignee?.name || '',
      lr.consignee?.contact || '',
      lr.origin || '',
      lr.destination || '',
      lr.pieces || '0',
      lr.weight || '0',
      lr.totalAmount || '0',
      lr.paymentMode || '',
      lr.status || '',
      lr.expectedDeliveryDate || ''
    ]);
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [headers.map(escapeCSV), ...rows.map(row => row.map(escapeCSV))].map(row => row.join(',')).join('\n');
  };

  const generateTripsReport = () => {
    const filteredTrips = trips.filter(trip => {
      const dateMatch = trip.tripDate >= dateRange.from && trip.tripDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch) {
        const manifest = manifests.find(m => m.id === trip.manifestId);
        if (manifest && manifest.destinationBranch) {
          return manifest.destinationBranch.toString() === selectedBranch.id.toString();
        }
        return false;
      }
      return true;
    });

    const headers = [
      'Trip Number', 'Trip Date', 'Vehicle Number', 'Driver Name', 'Origin Branch',
      'Destination Branch', 'Status', 'Total Expenses', 'LRs Count'
    ];
    
    const rows = filteredTrips.map(trip => {
      const manifest = manifests.find(m => m.id === trip.manifestId);
      const originBranch = manifest ? branches.find(b => b.id.toString() === manifest.originBranch?.toString()) : null;
      const destBranch = manifest ? branches.find(b => b.id.toString() === manifest.destinationBranch?.toString()) : null;
      const driver = drivers.find(d => d.id.toString() === trip.driverId?.toString());
      
      return [
        trip.tripNumber || '',
        trip.tripDate || '',
        trip.vehicleNumber || '',
        driver?.driverName || driver?.name || '',
        originBranch?.branchName || 'N/A',
        destBranch?.branchName || 'N/A',
        trip.status || '',
        trip.totalExpenses || '0',
        manifest?.selectedLRs?.length || '0'
      ];
    });
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [headers.map(escapeCSV), ...rows.map(row => row.map(escapeCSV))].map(row => row.join(',')).join('\n');
  };

  const generateInvoicesReport = () => {
    const filteredInvoices = invoices.filter(inv => {
      const dateMatch = inv.invoiceDate >= dateRange.from && inv.invoiceDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch && inv.lrId) {
        const lr = lrBookings.find(l => l.id.toString() === inv.lrId.toString());
        if (lr) {
          const lrBranch = getLRBranch(lr);
          return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
        }
      }
      return !selectedBranch;
    });

    const headers = [
      'Invoice Number', 'Invoice Date', 'LR Number', 'Client Name', 'Amount',
      'GST Amount', 'Total Amount', 'Status', 'Due Date'
    ];
    
    const rows = filteredInvoices.map(inv => {
      const lr = lrBookings.find(l => l.id.toString() === inv.lrId?.toString());
      const client = clients.find(c => c.id.toString() === inv.clientId?.toString());
      
      return [
        inv.invoiceNumber || '',
        inv.invoiceDate || '',
        lr?.lrNumber || '',
        client?.companyName || client?.name || '',
        inv.amount || '0',
        inv.gstAmount || '0',
        inv.totalAmount || '0',
        inv.status || '',
        inv.dueDate || ''
      ];
    });
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [headers.map(escapeCSV), ...rows.map(row => row.map(escapeCSV))].map(row => row.join(',')).join('\n');
  };

  const generatePaymentsReport = () => {
    const filteredPayments = payments.filter(pay => {
      const dateMatch = pay.paymentDate >= dateRange.from && pay.paymentDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch && pay.invoiceId) {
        const inv = invoices.find(i => i.id.toString() === pay.invoiceId.toString());
        if (inv && inv.lrId) {
          const lr = lrBookings.find(l => l.id.toString() === inv.lrId.toString());
          if (lr) {
            const lrBranch = getLRBranch(lr);
            return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
          }
        }
      }
      return !selectedBranch;
    });

    const headers = [
      'Payment Date', 'Invoice Number', 'Client Name', 'Amount', 'Payment Mode',
      'Reference Number', 'Remarks'
    ];
    
    const rows = filteredPayments.map(pay => {
      const inv = invoices.find(i => i.id.toString() === pay.invoiceId?.toString());
      const client = clients.find(c => c.id.toString() === pay.clientId?.toString() || c.id.toString() === inv?.clientId?.toString());
      
      return [
        pay.paymentDate || '',
        inv?.invoiceNumber || '',
        client?.companyName || client?.name || '',
        pay.amount || '0',
        pay.paymentMode || '',
        pay.referenceNumber || '',
        pay.remarks || ''
      ];
    });
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [headers.map(escapeCSV), ...rows.map(row => row.map(escapeCSV))].map(row => row.join(',')).join('\n');
  };

  const generatePODsReport = () => {
    const filteredPODs = pods.filter(pod => {
      const dateMatch = pod.deliveryDate >= dateRange.from && pod.deliveryDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch && pod.lrNumber) {
        const lr = lrBookings.find(l => 
          l.id.toString() === pod.lrNumber.toString() || 
          l.lrNumber === pod.lrNumber ||
          l.id === pod.lrNumber
        );
        if (lr) {
          const lrBranch = getLRBranch(lr);
          return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
        }
      }
      return !selectedBranch;
    });

    const headers = [
      'POD Number', 'LR Number', 'Delivery Date', 'Delivery Time', 'Receiver Name',
      'Receiver Contact', 'Pieces Delivered', 'Condition', 'Dispatch Status',
      'Dispatch Mode', 'Courier Name', 'Tracking Number', 'Remarks'
    ];
    
    const rows = filteredPODs.map(pod => [
      pod.podNumber || '',
      pod.lrNumberDisplay || pod.lrNumber || '',
      pod.deliveryDate || '',
      pod.deliveryTime || '',
      pod.receiverName || '',
      pod.receiverMobile || '',
      pod.piecesDelivered || '0',
      pod.condition || '',
      pod.podDispatchStatus || '',
      pod.podDispatchMode || '',
      pod.courierName || '',
      pod.trackingNumber || '',
      pod.remarks || ''
    ]);
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    return [headers.map(escapeCSV), ...rows.map(row => row.map(escapeCSV))].map(row => row.join(',')).join('\n');
  };

  const generatePaidToPayReport = () => {
    const filteredLRs = lrBookings.filter(lr => {
      const dateMatch = lr.bookingDate >= dateRange.from && lr.bookingDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch) {
        const lrBranch = getLRBranch(lr);
        return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
      }
      return true;
    });

    // Separate by payment mode
    const paidLRs = filteredLRs.filter(lr => lr.paymentMode === 'Paid');
    const toPayLRs = filteredLRs.filter(lr => lr.paymentMode === 'ToPay');
    const tbbLRs = filteredLRs.filter(lr => lr.paymentMode === 'TBB');

    const headers = [
      'Payment Mode', 'LR Number', 'Booking Date', 'Branch', 'Consignor Name', 
      'Consignor Contact', 'Consignee Name', 'Consignee Contact', 'Origin', 
      'Destination', 'Pieces', 'Weight (kg)', 'Amount', 'Status', 'Expected Delivery Date'
    ];
    
    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const formatLRRow = (lr, paymentMode) => [
      paymentMode,
      lr.lrNumber || '',
      lr.bookingDate || '',
      getLRBranch(lr)?.branchName || 'N/A',
      lr.consignor?.name || '',
      lr.consignor?.contact || '',
      lr.consignee?.name || '',
      lr.consignee?.contact || '',
      lr.origin || '',
      lr.destination || '',
      lr.pieces || '0',
      lr.weight || '0',
      lr.totalAmount || '0',
      lr.status || '',
      lr.expectedDeliveryDate || ''
    ];

    const rows = [
      // Paid section
      ...paidLRs.map(lr => formatLRRow(lr, 'Paid')),
      // To Pay section
      ...toPayLRs.map(lr => formatLRRow(lr, 'To Pay')),
      // TBB section
      ...tbbLRs.map(lr => formatLRRow(lr, 'TBB'))
    ];

    // Add summary rows
    const paidTotal = paidLRs.reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const toPayTotal = toPayLRs.reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const tbbTotal = tbbLRs.reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    const grandTotal = paidTotal + toPayTotal + tbbTotal;

    const summaryRows = [
      [],
      ['SUMMARY'],
      ['Paid - Count:', paidLRs.length],
      ['Paid - Total Amount:', `₹${paidTotal.toFixed(2)}`],
      ['To Pay - Count:', toPayLRs.length],
      ['To Pay - Total Amount:', `₹${toPayTotal.toFixed(2)}`],
      ['TBB - Count:', tbbLRs.length],
      ['TBB - Total Amount:', `₹${tbbTotal.toFixed(2)}`],
      ['Grand Total:', `₹${grandTotal.toFixed(2)}`]
    ];

    return [
      [headers.map(escapeCSV).join(',')],
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...summaryRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
  };

  const generateSundryCreditorReport = () => {
    const allClients = JSON.parse(localStorage.getItem('clients') || '[]');
    
    // Filter LRs by Sundry Creditor payment mode and date range
    const filteredLRs = lrBookings.filter(lr => {
      if (lr.paymentMode !== 'SundryCreditor') return false;
      
      const dateMatch = lr.bookingDate >= dateRange.from && lr.bookingDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch) {
        const lrBranch = getLRBranch(lr);
        return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
      }
      return true;
    });

    // Group by client
    const clientGroups = {};
    filteredLRs.forEach(lr => {
      const clientId = lr.sundryCreditor?.toString() || '';
      if (!clientGroups[clientId]) {
        const client = allClients.find(c => c.id.toString() === clientId);
        clientGroups[clientId] = {
          client: client,
          clientId: clientId,
          clientName: client ? (client.companyName || client.clientName) : 'Unknown',
          clientCode: client ? (client.code || client.clientCode) : 'N/A',
          lrs: [],
          totalAmount: 0
        };
      }
      clientGroups[clientId].lrs.push(lr);
      clientGroups[clientId].totalAmount += parseFloat(lr.totalAmount) || 0;
    });

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Client Code', 'Client Name', 'LR Number', 'Booking Date', 'Branch', 
      'Consignor Name', 'Consignee Name', 'Origin', 'Destination', 
      'Pieces', 'Weight (kg)', 'Freight Amount', 'Total Amount', 'Status'
    ];

    const rows = [];
    
    // Add rows grouped by client
    Object.values(clientGroups).forEach(group => {
      group.lrs.forEach(lr => {
        rows.push([
          group.clientCode,
          group.clientName,
          lr.lrNumber || '',
          lr.bookingDate || '',
          getLRBranch(lr)?.branchName || 'N/A',
          lr.consignor?.name || '',
          lr.consignee?.name || '',
          lr.origin || '',
          lr.destination || '',
          lr.pieces || '0',
          lr.weight || '0',
          lr.charges?.freightRate || '0',
          lr.totalAmount || '0',
          lr.status || ''
        ]);
      });
    });

    // Add summary by client
    const summaryRows = [
      [],
      ['SUMMARY BY CLIENT'],
      []
    ];

    Object.values(clientGroups)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .forEach(group => {
        summaryRows.push([
          group.clientCode,
          group.clientName,
          `LR Count: ${group.lrs.length}`,
          `Total Amount: ₹${group.totalAmount.toFixed(2)}`
        ]);
      });

    const grandTotal = Object.values(clientGroups).reduce((sum, group) => sum + group.totalAmount, 0);
    const totalLRs = filteredLRs.length;

    summaryRows.push(
      [],
      ['GRAND TOTAL'],
      [`Total LRs: ${totalLRs}`],
      [`Total Amount: ₹${grandTotal.toFixed(2)}`]
    );

    return [
      [headers.map(escapeCSV).join(',')],
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...summaryRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
  };

  const generateSalesReport = () => {
    // Filter LRs by date and branch
    const filteredLRs = lrBookings.filter(lr => {
      const dateMatch = lr.bookingDate >= dateRange.from && lr.bookingDate <= dateRange.to;
      if (!dateMatch) return false;
      
      if (selectedBranch) {
        const lrBranch = getLRBranch(lr);
        return lrBranch && lrBranch.id.toString() === selectedBranch.id.toString();
      }
      return true;
    });

    // Group by booking mode and payment mode
    const ftlCash = filteredLRs.filter(lr => 
      lr.bookingMode === 'FTL' && lr.paymentMode === 'Paid'
    );
    const ftlToPay = filteredLRs.filter(lr => 
      lr.bookingMode === 'FTL' && lr.paymentMode === 'ToPay'
    );
    const ftlTBB = filteredLRs.filter(lr => 
      lr.bookingMode === 'FTL' && lr.paymentMode === 'TBB'
    );
    const ftlSundryCreditor = filteredLRs.filter(lr => 
      lr.bookingMode === 'FTL' && lr.paymentMode === 'SundryCreditor'
    );
    
    const ptlCash = filteredLRs.filter(lr => 
      (lr.bookingMode === 'PTL' || !lr.bookingMode) && lr.paymentMode === 'Paid'
    );
    const ptlToPay = filteredLRs.filter(lr => 
      (lr.bookingMode === 'PTL' || !lr.bookingMode) && lr.paymentMode === 'ToPay'
    );
    const ptlTBB = filteredLRs.filter(lr => 
      (lr.bookingMode === 'PTL' || !lr.bookingMode) && lr.paymentMode === 'TBB'
    );
    const ptlSundryCreditor = filteredLRs.filter(lr => 
      (lr.bookingMode === 'PTL' || !lr.bookingMode) && lr.paymentMode === 'SundryCreditor'
    );

    const escapeCSV = (value) => {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const getCityName = (cityCode) => {
      if (!cityCode) return 'N/A';
      const city = cities.find(c => 
        c.code === cityCode || 
        c.id?.toString() === cityCode.toString() ||
        c.cityName === cityCode
      );
      return city ? city.cityName : cityCode;
    };

    const headers = [
      'Category', 'LR Number', 'Booking Date', 'Branch', 'Consignor', 'Consignee',
      'Origin', 'Destination', 'Pieces', 'Weight (kg)', 'Total Amount (INR)', 'Payment Mode', 'Status'
    ];

    const formatLRRow = (lr, category) => [
      category,
      lr.lrNumber || '',
      lr.bookingDate || '',
      getLRBranch(lr)?.branchName || 'N/A',
      lr.consignor?.name || '',
      lr.consignee?.name || '',
      getCityName(lr.origin),
      getCityName(lr.destination),
      lr.pieces || '0',
      lr.weight || '0',
      parseFloat(lr.totalAmount || 0).toFixed(2),
      lr.paymentMode || '',
      lr.status || ''
    ];

    const rows = [
      // FTL Cash
      ...ftlCash.map(lr => formatLRRow(lr, 'FTL - Cash')),
      // FTL To Pay
      ...ftlToPay.map(lr => formatLRRow(lr, 'FTL - To Pay')),
      // FTL TBB
      ...ftlTBB.map(lr => formatLRRow(lr, 'FTL - TBB')),
      // FTL Sundry Creditor
      ...ftlSundryCreditor.map(lr => formatLRRow(lr, 'FTL - Sundry Creditor')),
      // PTL Cash
      ...ptlCash.map(lr => formatLRRow(lr, 'PTL - Cash')),
      // PTL To Pay
      ...ptlToPay.map(lr => formatLRRow(lr, 'PTL - To Pay')),
      // PTL TBB
      ...ptlTBB.map(lr => formatLRRow(lr, 'PTL - TBB')),
      // PTL Sundry Creditor
      ...ptlSundryCreditor.map(lr => formatLRRow(lr, 'PTL - Sundry Creditor'))
    ];

    // Calculate totals
    const calculateTotal = (lrs) => lrs.reduce((sum, lr) => sum + (parseFloat(lr.totalAmount) || 0), 0);
    
    const ftlCashTotal = calculateTotal(ftlCash);
    const ftlToPayTotal = calculateTotal(ftlToPay);
    const ftlTBBTotal = calculateTotal(ftlTBB);
    const ftlSundryCreditorTotal = calculateTotal(ftlSundryCreditor);
    const ftlTotal = ftlCashTotal + ftlToPayTotal + ftlTBBTotal + ftlSundryCreditorTotal;
    
    const ptlCashTotal = calculateTotal(ptlCash);
    const ptlToPayTotal = calculateTotal(ptlToPay);
    const ptlTBBTotal = calculateTotal(ptlTBB);
    const ptlSundryCreditorTotal = calculateTotal(ptlSundryCreditor);
    const ptlTotal = ptlCashTotal + ptlToPayTotal + ptlTBBTotal + ptlSundryCreditorTotal;
    
    const cashTotal = ftlCashTotal + ptlCashTotal;
    const toPayTotal = ftlToPayTotal + ptlToPayTotal;
    const tbbTotal = ftlTBBTotal + ptlTBBTotal;
    const sundryCreditorTotal = ftlSundryCreditorTotal + ptlSundryCreditorTotal;
    const grandTotal = ftlTotal + ptlTotal;

    // Format summary with proper Excel structure
    const summaryRows = [
      [],
      ['SALES SUMMARY'],
      [],
      ['FTL SALES', 'Count', 'Amount (INR)'],
      ['FTL - Cash', ftlCash.length, ftlCashTotal.toFixed(2)],
      ['FTL - To Pay', ftlToPay.length, ftlToPayTotal.toFixed(2)],
      ['FTL - TBB', ftlTBB.length, ftlTBBTotal.toFixed(2)],
      ['FTL - Sundry Creditor', ftlSundryCreditor.length, ftlSundryCreditorTotal.toFixed(2)],
      ['FTL Total', ftlCash.length + ftlToPay.length + ftlTBB.length + ftlSundryCreditor.length, ftlTotal.toFixed(2)],
      [],
      ['PTL SALES', 'Count', 'Amount (INR)'],
      ['PTL - Cash', ptlCash.length, ptlCashTotal.toFixed(2)],
      ['PTL - To Pay', ptlToPay.length, ptlToPayTotal.toFixed(2)],
      ['PTL - TBB', ptlTBB.length, ptlTBBTotal.toFixed(2)],
      ['PTL - Sundry Creditor', ptlSundryCreditor.length, ptlSundryCreditorTotal.toFixed(2)],
      ['PTL Total', ptlCash.length + ptlToPay.length + ptlTBB.length + ptlSundryCreditor.length, ptlTotal.toFixed(2)],
      [],
      ['CONSOLIDATED BY PAYMENT MODE', 'Count', 'Amount (INR)'],
      ['Cash (FTL + PTL)', ftlCash.length + ptlCash.length, cashTotal.toFixed(2)],
      ['To Pay (FTL + PTL)', ftlToPay.length + ptlToPay.length, toPayTotal.toFixed(2)],
      ['TBB (FTL + PTL)', ftlTBB.length + ptlTBB.length, tbbTotal.toFixed(2)],
      ['Sundry Creditor (FTL + PTL)', ftlSundryCreditor.length + ptlSundryCreditor.length, sundryCreditorTotal.toFixed(2)],
      [],
      ['GRAND TOTAL', 'Count', 'Amount (INR)'],
      ['Total LRs', filteredLRs.length, grandTotal.toFixed(2)]
    ];

    // Add report header with metadata
    const branchName = selectedBranch ? selectedBranch.branchName : 'All Branches';
    const reportHeader = [
      ['SALES REPORT'],
      ['Branch:', branchName],
      ['Period:', `${dateRange.from} to ${dateRange.to}`],
      ['Generated On:', new Date().toLocaleString()],
      []
    ];

    return [
      ...reportHeader.map(row => row.map(escapeCSV).join(',')),
      [headers.map(escapeCSV).join(',')],
      ...rows.map(row => row.map(escapeCSV).join(',')),
      ...summaryRows.map(row => row.map(escapeCSV).join(','))
    ].join('\n');
  };

  const generateSummaryReport = () => {
    const branchName = selectedBranch ? selectedBranch.branchName : 'All Branches';
    const summary = [
      ['REPORT SUMMARY'],
      [''],
      ['Branch:', branchName],
      ['Period:', `${dateRange.from} to ${dateRange.to}`],
      ['Generated On:', new Date().toLocaleString()],
      [''],
      ['METRICS'],
      [''],
      ['LR Bookings:', metrics.lr.total],
      ['Total Revenue:', `₹${metrics.lr.revenue.toFixed(2)}`],
      ['Total Weight:', `${metrics.lr.weight.toFixed(2)} kg`],
      ['Total Pieces:', metrics.lr.pieces],
      [''],
      ['Payment Breakdown:'],
      ['Paid:', `₹${metrics.lr.paid.toFixed(2)}`],
      ['To Pay:', `₹${metrics.lr.toPay.toFixed(2)}`],
      ['TBB:', `₹${metrics.lr.tbb.toFixed(2)}`],
      [''],
      ['Trips:'],
      ['Total Trips:', metrics.trips.total],
      ['Active Trips:', metrics.trips.active],
      ['Completed Trips:', metrics.trips.completed],
      ['Total Expenses:', `₹${metrics.trips.expenses.toFixed(2)}`],
      [''],
      ['Invoices:'],
      ['Total Invoices:', metrics.invoices.total],
      ['Invoice Amount:', `₹${metrics.invoices.amount.toFixed(2)}`],
      ['Paid Invoices:', metrics.invoices.paid],
      ['Pending Invoices:', metrics.invoices.pending],
      [''],
      ['Payments:'],
      ['Total Payments:', metrics.payments.total],
      ['Amount Received:', `₹${metrics.payments.amount.toFixed(2)}`],
      [''],
      ['Deliveries:'],
      ['Total Deliveries:', metrics.deliveries.total],
      ['Success Rate:', `${metrics.deliveries.successRate.toFixed(2)}%`],
      [''],
      ['Fleet:'],
      ['Active Vehicles:', metrics.fleet.vehicles],
      ['Active Drivers:', metrics.fleet.drivers],
      ['Active Clients:', metrics.fleet.clients]
    ];
    
    return summary.map(row => row.join(',')).join('\n');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-slate-100 p-6">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Work+Sans:wght@300;400;500;600;700&display=swap');
        
        * {
          font-family: 'Work Sans', sans-serif;
        }
        
        .mono {
          font-family: 'Space Mono', monospace;
        }
        
        .metric-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
          border-left: 4px solid #6366f1;
        }
        
        .metric-card:hover {
          box-shadow: 0 4px 16px rgba(99,102,241,0.15);
          transform: translateY(-2px);
        }
        
        .metric-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1e293b;
          margin: 8px 0;
        }
        
        .metric-label {
          font-size: 0.9rem;
          color: #64748b;
          font-weight: 500;
        }
        
        .metric-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: white;
        }
        
        .section-card {
          background: white;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        
        .section-title {
          font-size: 1.3rem;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }
        
        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        
        .grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        
        .grid-4 {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
          margin-top: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          transition: width 0.3s ease;
        }
        
        .stat-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .stat-row:last-child {
          border-bottom: none;
        }
        
        input {
          padding: 10px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.95rem;
        }
        
        input:focus {
          outline: none;
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        
        @media (max-width: 1024px) {
          .grid-4 {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 768px) {
          .grid-2, .grid-3, .grid-4 {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Reports & Analytics
          </h1>
          <p className="text-slate-600 text-lg">Business Intelligence Dashboard</p>
        </div>

        {/* Filters and Report Generation */}
        <div className="section-card">
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                Branch {isAdmin ? '(Select Branch)' : ''}
              </label>
              {isAdmin ? (
                <select
                  value={selectedBranch ? selectedBranch.id.toString() : 'all'}
                  onChange={(e) => {
                    if (e.target.value === 'all') {
                      setSelectedBranch(null);
                    } else {
                      const branch = branches.find(b => b.id.toString() === e.target.value);
                      setSelectedBranch(branch || null);
                    }
                  }}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '2px solid #e2e8f0',
                    fontSize: '0.9rem',
                    minWidth: '200px'
                  }}
                >
                  <option value="all">All Branches</option>
                  {branches.filter(b => b.status === 'Active').map(branch => (
                    <option key={branch.id} value={branch.id}>
                      {branch.branchName} ({branch.branchCode})
                    </option>
                  ))}
                </select>
              ) : (
                <div style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#f1f5f9',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem',
                  minWidth: '200px'
                }}>
                  {selectedBranch ? `${selectedBranch.branchName} (${selectedBranch.branchCode})` : 'All Branches'}
                </div>
              )}
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                From Date
              </label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                To Date
              </label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '4px' }}>
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  fontSize: '0.9rem',
                  minWidth: '180px'
                }}
              >
                <option value="LR Bookings">LR Bookings</option>
                <option value="Trips">Trips</option>
                <option value="Invoices">Invoices</option>
                <option value="Payments">Payments</option>
                <option value="PODs">PODs</option>
                <option value="Paid To Pay Report">Paid To Pay Report</option>
                <option value="Sundry Creditor Payment Report">Sundry Creditor Payment Report</option>
                <option value="Sales Report">Sales Report</option>
                <option value="Summary Report">Summary Report</option>
              </select>
            </div>
            
            <button
              onClick={() => generateReport()}
              style={{
                padding: '10px 20px',
                background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 4px 12px rgba(59,130,246,0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <Download size={18} />
              Generate Report
            </button>
          </div>
          
          <div style={{ 
            padding: '12px', 
            background: '#f1f5f9', 
            borderRadius: '8px',
            fontSize: '0.875rem',
            color: '#64748b'
          }}>
            Showing data from <strong>{dateRange.from}</strong> to <strong>{dateRange.to}</strong>
            {selectedBranch && ` | Branch: ${selectedBranch.branchName}`}
            {!selectedBranch && isAdmin && ' | All Branches'}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid-4" style={{ marginBottom: '30px' }}>
          <div className="metric-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="metric-icon">
                <FileText size={24} />
              </div>
              <div className="metric-label">Total LRs</div>
            </div>
            <div className="metric-value">{metrics.lr.total}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {metrics.lr.pieces.toLocaleString()} pieces
            </div>
          </div>

          <div className="metric-card" style={{ borderLeftColor: '#10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                <DollarSign size={24} />
              </div>
              <div className="metric-label">Total Revenue</div>
            </div>
            <div className="metric-value">₹{(metrics.lr.revenue / 1000).toFixed(1)}K</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {metrics.lr.weight.toFixed(0)} Kg
            </div>
          </div>

          <div className="metric-card" style={{ borderLeftColor: '#f59e0b' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                <Truck size={24} />
              </div>
              <div className="metric-label">Total Trips</div>
            </div>
            <div className="metric-value">{metrics.trips.total}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {metrics.trips.active} active
            </div>
          </div>

          <div className="metric-card" style={{ borderLeftColor: '#8b5cf6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div className="metric-icon" style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }}>
                <Package size={24} />
              </div>
              <div className="metric-label">Deliveries</div>
            </div>
            <div className="metric-value">{metrics.deliveries.total}</div>
            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              {metrics.deliveries.successRate.toFixed(0)}% success rate
            </div>
          </div>
        </div>

        {/* LR Analysis */}
        <div className="section-card">
          <h2 className="section-title">LR Booking Analysis</h2>
          
          <div className="grid-3">
            <div>
              <div className="stat-row">
                <span style={{ fontWeight: 500 }}>Paid</span>
                <span style={{ fontWeight: 700, color: '#10b981' }}>₹{(metrics.lr.paid / 1000).toFixed(1)}K</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: `${metrics.lr.revenue > 0 ? (metrics.lr.paid / metrics.lr.revenue * 100) : 0}%` 
                }}></div>
              </div>
            </div>
            
            <div>
              <div className="stat-row">
                <span style={{ fontWeight: 500 }}>To Pay</span>
                <span style={{ fontWeight: 700, color: '#f59e0b' }}>₹{(metrics.lr.toPay / 1000).toFixed(1)}K</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: `${metrics.lr.revenue > 0 ? (metrics.lr.toPay / metrics.lr.revenue * 100) : 0}%`,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                }}></div>
              </div>
            </div>
            
            <div>
              <div className="stat-row">
                <span style={{ fontWeight: 500 }}>TBB</span>
                <span style={{ fontWeight: 700, color: '#6366f1' }}>₹{(metrics.lr.tbb / 1000).toFixed(1)}K</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ 
                  width: `${metrics.lr.revenue > 0 ? (metrics.lr.tbb / metrics.lr.revenue * 100) : 0}%`,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)'
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Trip & Financial Analysis */}
        <div className="grid-2">
          <div className="section-card">
            <h2 className="section-title">Trip Analysis</h2>
            
            <div className="stat-row">
              <span>Owned Vehicle Trips</span>
              <span style={{ fontWeight: 700 }}>{metrics.trips.owned}</span>
            </div>
            
            <div className="stat-row">
              <span>Market Vehicle Trips</span>
              <span style={{ fontWeight: 700 }}>{metrics.trips.market}</span>
            </div>
            
            <div className="stat-row">
              <span>Active Trips</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{metrics.trips.active}</span>
            </div>
            
            <div className="stat-row">
              <span>Completed Trips</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{metrics.trips.completed}</span>
            </div>
            
            <div className="stat-row">
              <span>Total Expenses</span>
              <span style={{ fontWeight: 700, color: '#ef4444' }}>₹{(metrics.trips.expenses / 1000).toFixed(1)}K</span>
            </div>
          </div>

          <div className="section-card">
            <h2 className="section-title">Financial Summary</h2>
            
            <div className="stat-row">
              <span>Total Invoices</span>
              <span style={{ fontWeight: 700 }}>{metrics.invoices.total}</span>
            </div>
            
            <div className="stat-row">
              <span>Invoice Amount</span>
              <span style={{ fontWeight: 700, color: '#6366f1' }}>₹{(metrics.invoices.amount / 1000).toFixed(1)}K</span>
            </div>
            
            <div className="stat-row">
              <span>Paid Invoices</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>{metrics.invoices.paid}</span>
            </div>
            
            <div className="stat-row">
              <span>Pending Invoices</span>
              <span style={{ fontWeight: 700, color: '#f59e0b' }}>{metrics.invoices.pending}</span>
            </div>
            
            <div className="stat-row">
              <span>Payments Received</span>
              <span style={{ fontWeight: 700, color: '#10b981' }}>₹{(metrics.payments.amount / 1000).toFixed(1)}K</span>
            </div>
          </div>
        </div>

        {/* Fleet Status */}
        <div className="section-card">
          <h2 className="section-title">Fleet & Resources</h2>
          
          <div className="grid-3">
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#6366f1' }}>{metrics.fleet.vehicles}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '8px' }}>Active Vehicles</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#10b981' }}>{metrics.fleet.drivers}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '8px' }}>Active Drivers</div>
            </div>
            
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '3rem', fontWeight: 700, color: '#f59e0b' }}>{metrics.fleet.clients}</div>
              <div style={{ fontSize: '1rem', color: '#64748b', marginTop: '8px' }}>Active Clients</div>
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="section-card">
          <h2 className="section-title">Key Performance Indicators</h2>
          
          <div className="grid-2">
            <div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Average Revenue per LR</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#1e293b' }}>
                ₹{metrics.lr.total > 0 ? (metrics.lr.revenue / metrics.lr.total).toFixed(0) : 0}
              </div>
            </div>
            
            <div>
              <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '8px' }}>Delivery Success Rate</div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>
                {metrics.deliveries.successRate.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
