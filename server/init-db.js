const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'tms_database.db');

// Create database directory if it doesn't exist
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Create all tables
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    userRole TEXT NOT NULL,
    branch TEXT,
    email TEXT,
    mobile TEXT,
    accessPermissions TEXT,
    code TEXT,
    linkedStaff TEXT,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Branches table
  db.run(`CREATE TABLE IF NOT EXISTS branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branchName TEXT NOT NULL,
    branchCode TEXT UNIQUE NOT NULL,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    phone TEXT,
    email TEXT,
    gstNumber TEXT,
    isHeadOffice INTEGER DEFAULT 0,
    managerName TEXT,
    managerMobile TEXT,
    lrSeriesStart TEXT,
    lrSeriesEnd TEXT,
    lrSeriesCurrent TEXT,
    lrPrefix TEXT,
    nearbyCities TEXT,
    odaLocations TEXT,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Cities table
  db.run(`CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT UNIQUE NOT NULL,
    cityName TEXT NOT NULL,
    state TEXT NOT NULL,
    region TEXT,
    zone TEXT,
    pincodeRanges TEXT,
    isODA INTEGER DEFAULT 0,
    distanceFromHub TEXT,
    transitDays TEXT,
    status TEXT DEFAULT 'Active',
    remarks TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Vehicles table
  db.run(`CREATE TABLE IF NOT EXISTS vehicles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicleNumber TEXT UNIQUE NOT NULL,
    vehicleType TEXT NOT NULL,
    ownershipType TEXT,
    capacity TEXT,
    capacityUnit TEXT,
    owner TEXT,
    insurance TEXT,
    tp TEXT,
    fitness TEXT,
    permit TEXT,
    rcBook TEXT,
    status TEXT DEFAULT 'Active',
    remarks TEXT,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Drivers table
  db.run(`CREATE TABLE IF NOT EXISTS drivers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    driverName TEXT NOT NULL,
    nickName TEXT,
    fatherName TEXT,
    mobile TEXT,
    alternateMobile TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    pincode TEXT,
    licenseNumber TEXT,
    licenseExpiryDate TEXT,
    licenseIssueDate TEXT,
    licenseType TEXT,
    bloodGroup TEXT,
    dateOfBirth TEXT,
    gender TEXT,
    aadharNumber TEXT,
    emailId TEXT,
    emergencyContactName TEXT,
    emergencyContactNumber TEXT,
    salary TEXT,
    salaryType TEXT,
    joinDate TEXT,
    status TEXT DEFAULT 'Active',
    remarks TEXT,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Staff table
  db.run(`CREATE TABLE IF NOT EXISTS staff (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staffName TEXT NOT NULL,
    staffCode TEXT UNIQUE NOT NULL,
    fatherName TEXT,
    dateOfBirth TEXT,
    bloodGroup TEXT,
    designation TEXT,
    department TEXT,
    branch TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    contactDetails TEXT,
    aadharNumber TEXT,
    panNumber TEXT,
    bankDetails TEXT,
    salaryType TEXT,
    salaryDetails TEXT,
    joiningDate TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Staff Attendance table
  db.run(`CREATE TABLE IF NOT EXISTS staffAttendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    staffId INTEGER NOT NULL,
    staffName TEXT,
    branchId INTEGER,
    branchName TEXT,
    attendanceDate TEXT NOT NULL,
    status TEXT NOT NULL,
    checkInTime TEXT,
    checkOutTime TEXT,
    location TEXT,
    remarks TEXT,
    isMobileApp INTEGER DEFAULT 0,
    deviceInfo TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (staffId) REFERENCES staff(id)
  )`);

  // LR Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS lrBookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lrNumber TEXT UNIQUE NOT NULL,
    bookingDate TEXT NOT NULL,
    branch TEXT,
    consignor TEXT,
    consignee TEXT,
    fromLocation TEXT,
    toLocation TEXT,
    pieces TEXT,
    weight TEXT,
    freight TEXT,
    totalAmount TEXT,
    paymentMode TEXT,
    deliveryMode TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // FTL LR Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS ftlLRBookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lrNumber TEXT UNIQUE NOT NULL,
    bookingDate TEXT NOT NULL,
    branch TEXT,
    consignor TEXT,
    consignee TEXT,
    fromLocation TEXT,
    toLocation TEXT,
    vehicleType TEXT,
    freight TEXT,
    totalAmount TEXT,
    paymentMode TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // PTL LR Bookings table
  db.run(`CREATE TABLE IF NOT EXISTS ptlLRBookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lrNumber TEXT UNIQUE NOT NULL,
    bookingDate TEXT NOT NULL,
    branch TEXT,
    consignor TEXT,
    consignee TEXT,
    fromLocation TEXT,
    toLocation TEXT,
    pieces TEXT,
    weight TEXT,
    freight TEXT,
    totalAmount TEXT,
    paymentMode TEXT,
    deliveryMode TEXT,
    remarks TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Manifests table
  db.run(`CREATE TABLE IF NOT EXISTS manifests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    manifestNumber TEXT UNIQUE NOT NULL,
    manifestDate TEXT NOT NULL,
    branch TEXT,
    destinationBranch TEXT,
    manifestType TEXT DEFAULT 'branch',
    vendorId TEXT,
    vendorName TEXT,
    vehicleNumber TEXT,
    driverName TEXT,
    selectedLRs TEXT,
    totalAmount TEXT,
    status TEXT DEFAULT 'Pending',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Trips table
  db.run(`CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tripNumber TEXT UNIQUE NOT NULL,
    tripDate TEXT NOT NULL,
    tripType TEXT NOT NULL,
    vehicleType TEXT NOT NULL,
    originBranch TEXT,
    origin TEXT,
    destination TEXT,
    selectedManifest TEXT,
    selectedLRs TEXT,
    expenses TEXT,
    status TEXT DEFAULT 'In Progress',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Invoices table
  db.run(`CREATE TABLE IF NOT EXISTS invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoiceNumber TEXT UNIQUE NOT NULL,
    invoiceDate TEXT NOT NULL,
    clientId TEXT,
    clientName TEXT,
    lrNumbers TEXT,
    totalAmount TEXT,
    status TEXT DEFAULT 'Pending',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Payments table
  db.run(`CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    paymentNumber TEXT UNIQUE NOT NULL,
    paymentDate TEXT NOT NULL,
    clientId TEXT,
    clientName TEXT,
    amount TEXT,
    paymentMode TEXT,
    invoiceNumbers TEXT,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // PODs table
  db.run(`CREATE TABLE IF NOT EXISTS pods (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    podNumber TEXT UNIQUE NOT NULL,
    lrNumber TEXT NOT NULL,
    deliveryDate TEXT,
    receivedBy TEXT,
    signature TEXT,
    status TEXT DEFAULT 'Pending',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Clients table
  db.run(`CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientCode TEXT UNIQUE NOT NULL,
    clientName TEXT NOT NULL,
    clientType TEXT,
    contactPerson TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    gstNumber TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Client Rates table (stored in DB so rates are shared across systems)
  db.run(`CREATE TABLE IF NOT EXISTS clientRates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    clientId TEXT,
    clientCode TEXT,
    rateType TEXT,
    status TEXT DEFAULT 'Active',
    effectiveDate TEXT,
    showAmountsInPrint INTEGER DEFAULT 1,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Accounts table
  db.run(`CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountCode TEXT UNIQUE NOT NULL,
    accountName TEXT NOT NULL,
    accountType TEXT NOT NULL,
    parentAccount TEXT,
    balance TEXT DEFAULT '0',
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Expense Types table
  db.run(`CREATE TABLE IF NOT EXISTS expenseTypes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    expenseType TEXT NOT NULL,
    subGroup TEXT,
    description TEXT,
    accountId TEXT,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Branch Expenses table
  db.run(`CREATE TABLE IF NOT EXISTS branchExpenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    expenseNumber TEXT UNIQUE NOT NULL,
    expenseDate TEXT NOT NULL,
    branch TEXT NOT NULL,
    expenseCategory TEXT,
    expenseType TEXT,
    amount TEXT NOT NULL,
    gstAmount TEXT DEFAULT '0',
    totalAmount TEXT NOT NULL,
    paymentMode TEXT,
    account TEXT,
    description TEXT,
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Branch Accounts (Bank/UPI/Cash accounts used for Day Book payments)
  db.run(`CREATE TABLE IF NOT EXISTS branchAccounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    accountType TEXT NOT NULL,
    branch TEXT NOT NULL,
    accountName TEXT NOT NULL,
    accountNumber TEXT,
    bankName TEXT,
    ifscCode TEXT,
    openingBalance TEXT DEFAULT '0',
    currentBalance TEXT DEFAULT '0',
    accountId TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Vehicle Maintenance table
  db.run(`CREATE TABLE IF NOT EXISTS vehicleMaintenance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicleNumber TEXT NOT NULL,
    maintenanceDate TEXT NOT NULL,
    maintenanceType TEXT,
    workshopName TEXT,
    driverName TEXT,
    parts TEXT,
    labourCharges TEXT,
    totalCost TEXT,
    expenseTypeId TEXT,
    expenseType TEXT,
    accountId TEXT,
    remarks TEXT,
    billName TEXT,
    billType TEXT,
    billData TEXT,
    status TEXT DEFAULT 'Active',
    data TEXT,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Market Vehicle Vendors table
  db.run(`CREATE TABLE IF NOT EXISTS marketVehicleVendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendorCode TEXT UNIQUE NOT NULL,
    vendorName TEXT NOT NULL,
    contactPerson TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    gstNumber TEXT,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Other Vendors table
  db.run(`CREATE TABLE IF NOT EXISTS otherVendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendorCode TEXT UNIQUE NOT NULL,
    vendorName TEXT NOT NULL,
    vendorCategory TEXT,
    contactPerson TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT,
    gstNumber TEXT,
    status TEXT DEFAULT 'Active',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  console.log('✅ All tables created successfully');
});

db.close((err) => {
  if (err) {
    console.error('Error closing database:', err.message);
    process.exit(1);
  }
  console.log('✅ Database initialization complete!');
  console.log(`📁 Database file: ${dbPath}`);
  console.log('\n🚀 You can now start the server with: npm start');
});

