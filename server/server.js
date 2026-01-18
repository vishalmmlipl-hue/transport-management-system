const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const dbPath = path.join(__dirname, 'tms_database.db');

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    console.error('💡 Make sure to run: npm run init-db first');
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Helper function to run database queries
const dbRun = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
};

const dbAll = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

const dbGet = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// Best-effort DB migration: ensure a column exists (non-destructive)
const ensureColumnExists = async (tableName, columnName, columnType) => {
  try {
    const cols = await dbAll(`PRAGMA table_info(${tableName})`);
    const has = (cols || []).some(c => c.name === columnName);
    if (has) return;
    await dbRun(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnType}`);
    console.log(`✅ Migration: added ${tableName}.${columnName}`);
  } catch (err) {
    // If table doesn't exist or cannot be altered, ignore (server should still run)
    console.warn(`⚠️ Migration skipped for ${tableName}.${columnName}:`, err.message || err);
  }
};

// Best-effort DB migration: ensure a table exists (non-destructive)
const ensureTableExists = async (createSql, tableNameForLog = 'table') => {
  try {
    await dbRun(createSql);
    console.log(`✅ Migration: ensured ${tableNameForLog} exists`);
  } catch (err) {
    console.warn(`⚠️ Migration skipped for ${tableNameForLog}:`, err.message || err);
  }
};

// Helper: get actual columns for a table (schema-safe writes)
const getTableColumns = async (tableName) => {
  const cols = await dbAll(`PRAGMA table_info(${tableName})`);
  return new Set((cols || []).map(c => c.name));
};

// Run light migrations on startup (so UI features can store JSON safely)
(async () => {
  await ensureColumnExists('accounts', 'data', 'TEXT');
  await ensureColumnExists('clients', 'clientType', 'TEXT');
  await ensureColumnExists('clients', 'data', 'TEXT');
  await ensureTableExists(
    `CREATE TABLE IF NOT EXISTS clientRates (
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
    )`,
    'clientRates'
  );
  await ensureTableExists(
    `CREATE TABLE IF NOT EXISTS branchAccounts (
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
    )`,
    'branchAccounts'
  );
  await ensureTableExists(
    `CREATE TABLE IF NOT EXISTS vehicleMaintenance (
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
    )`,
    'vehicleMaintenance'
  );
})();

// Generate next client code (e.g., TBB001) from DB.
// Prefix is used to support Cash/ToPay/Sundry clients too.
// This runs on the server so clientCode is never blank even if UI fails.
const getNextClientCode = async (prefix = 'TBB') => {
  const cols = await getTableColumns('clients');
  const codeCol = cols.has('clientCode') ? 'clientCode' : (cols.has('code') ? 'code' : null);
  if (!codeCol) {
    // Fallback if schema is unexpected
    return `${String(prefix || 'TBB').toUpperCase()}${String(Date.now()).slice(-6)}`;
  }

  const rows = await dbAll(`SELECT ${codeCol} as code FROM clients`);
  let bestNum = 0;
  let bestPad = 3;
  const pfx = String(prefix || 'TBB').toUpperCase();
  const used = new Set();

  for (const r of (rows || [])) {
    const raw = (r?.code || '').toString().trim().toUpperCase();
    if (!raw) continue;
    used.add(raw);

    // Prefer <PREFIX>### pattern
    const m = raw.match(new RegExp(`^${pfx}(\\d+)$`));
    if (m) {
      const n = parseInt(m[1], 10);
      if (!Number.isNaN(n) && n >= bestNum) {
        bestNum = n;
        bestPad = Math.max(bestPad, m[1].length);
      }
    }
  }

  // Find next unused in case of gaps/duplicates
  let next = bestNum + 1;
  let candidate = `${pfx}${String(next).padStart(bestPad, '0')}`;
  while (used.has(candidate)) {
    next += 1;
    candidate = `${pfx}${String(next).padStart(bestPad, '0')}`;
  }
  return candidate;
};

// Normalize client payload from frontend to whatever DB schema exists.
// Supports both styles:
// - New: clientCode/clientName/contactPerson/mobile/email/address/gstNumber/status/data
// - Old/custom: code/companyName/primaryContact/address/...
const normalizeClientPayload = (input, columnSet) => {
  const data = { ...(input || {}) };
  const primary = data.primaryContact || {};

  const clientCode = data.clientCode || data.code || data.client_code || '';
  const clientName = data.companyName || data.clientName || data.client_name || data.tradeName || '';
  const clientType = data.clientType || data.client_type || (data.data && data.data.clientType) || '';

  const normalized = {};

  // Code
  if (columnSet.has('clientCode')) normalized.clientCode = clientCode;
  if (columnSet.has('code')) normalized.code = clientCode;

  // Name
  if (columnSet.has('clientName')) normalized.clientName = clientName;
  if (columnSet.has('companyName')) normalized.companyName = clientName;

  // Contact
  if (columnSet.has('contactPerson')) normalized.contactPerson = data.contactPerson || primary.name || '';
  if (columnSet.has('mobile')) normalized.mobile = data.mobile || primary.mobile || primary.phone || '';
  if (columnSet.has('email')) normalized.email = data.email || primary.email || '';
  if (columnSet.has('clientType')) normalized.clientType = (clientType || 'TBB');

  // Address (can be JSON string)
  if (columnSet.has('address')) normalized.address = data.address || '';
  if (columnSet.has('gstNumber')) normalized.gstNumber = data.gstNumber || '';
  if (columnSet.has('status')) normalized.status = data.status || 'Active';

  // Put all other fields into data column (if exists)
  if (columnSet.has('data')) {
    const extras = { ...data };
    [
      'id', 'createdAt', 'updatedAt',
      'clientCode', 'clientName', 'client_code', 'client_name',
      'code', 'companyName', 'tradeName',
      'contactPerson', 'mobile', 'email',
      'address', 'gstNumber', 'status'
    ].forEach(k => delete extras[k]);
    if (Object.keys(extras).length > 0) {
      normalized.data = JSON.stringify(extras);
    }
  }

  return normalized;
};

// Normalize vendor payload to actual DB schema (schema-safe).
// DB vendor tables typically have: vendorCode, vendorName, vendorCategory (otherVendors only),
// contactPerson, mobile, email, address, gstNumber, status, createdAt, updatedAt (and sometimes data).
const normalizeVendorPayload = (tableName, input, columnSet) => {
  const data = { ...(input || {}) };
  const primary = data.primaryContact || {};
  const isOther = tableName === 'otherVendors';

  const vendorCode = data.vendorCode || data.code || data.vendor_id || '';
  const vendorName = data.vendorName || data.companyName || data.tradeName || '';

  const normalized = {};

  if (columnSet.has('vendorCode')) normalized.vendorCode = vendorCode || `VND${Date.now()}`;
  if (columnSet.has('code')) normalized.code = vendorCode || data.code || `VND${Date.now()}`;

  if (columnSet.has('vendorName')) normalized.vendorName = vendorName || 'UNKNOWN';
  if (columnSet.has('companyName')) normalized.companyName = vendorName || data.companyName || 'UNKNOWN';

  if (isOther && columnSet.has('vendorCategory')) {
    normalized.vendorCategory = data.vendorCategory || '';
  }

  if (columnSet.has('contactPerson')) normalized.contactPerson = data.contactPerson || primary.name || '';
  if (columnSet.has('mobile')) normalized.mobile = data.mobile || primary.mobile || primary.phone || '';
  if (columnSet.has('email')) normalized.email = data.email || primary.email || '';
  if (columnSet.has('address')) normalized.address = data.address || '';
  if (columnSet.has('gstNumber')) normalized.gstNumber = data.gstNumber || '';
  if (columnSet.has('status')) normalized.status = data.status || 'Active';

  // Preserve extra fields in data column (if exists)
  if (columnSet.has('data')) {
    const extras = { ...data };
    [
      'id', 'createdAt', 'updatedAt',
      'vendorCode', 'vendorName', 'vendorCategory',
      'code', 'companyName', 'tradeName',
      'contactPerson', 'mobile', 'email',
      'address', 'gstNumber', 'status'
    ].forEach(k => delete extras[k]);
    if (Object.keys(extras).length > 0) {
      normalized.data = JSON.stringify(extras);
    }
  }

  return normalized;
};

// Read minimal identifying client fields, regardless of schema variant
const getClientIdentityById = async (clientId) => {
  const cols = await getTableColumns('clients');
  const selectCols = ['id'];
  ['clientCode', 'code', 'clientName', 'companyName', 'status', 'data'].forEach(c => {
    if (cols.has(c)) selectCols.push(c);
  });
  const row = await dbGet(`SELECT ${selectCols.join(', ')} FROM clients WHERE id = ?`, [clientId]);
  if (!row) return null;
  const code = row.clientCode || row.code || '';
  const name = row.companyName || row.clientName || '';
  return { row, code, name };
};

// Generic CRUD endpoints for any table
const createCRUDRoutes = (tableName) => {
  // Get all records
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      // Schema-safe ordering (some tables might not have createdAt)
      const cols = await getTableColumns(tableName);
      const orderBy = cols.has('createdAt')
        ? ' ORDER BY createdAt DESC'
        : (cols.has('id') ? ' ORDER BY id DESC' : '');
      const rows = await dbAll(`SELECT * FROM ${tableName}${orderBy}`);
      
      // Special handling for LR booking tables
      const isLRTable = tableName === 'lrBookings' || tableName === 'ptlLRBookings' || tableName === 'ftlLRBookings';
      
      // Special handling for vendor tables
      const isVendorTable = tableName === 'otherVendors' || tableName === 'marketVehicleVendors';
      
      const parsedRows = rows.map(row => {
        const parsed = { ...row };
        
        // For LR tables, parse 'data' column and merge back
        if (isLRTable && parsed.data) {
          try {
            const parsedData = JSON.parse(parsed.data);
            Object.assign(parsed, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // For vendor tables, parse 'data' column and merge back
        if (isVendorTable && parsed.data) {
          try {
            const parsedData = JSON.parse(parsed.data);
            Object.assign(parsed, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }

        // For clients, we also store optional fields in `data` column (JSON).
        // Merge them back so frontend can see fields like clientType/deliveryType even if not a DB column.
        if (tableName === 'clients' && parsed.data && typeof parsed.data === 'string') {
          try {
            const parsedData = JSON.parse(parsed.data);
            if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
              Object.keys(parsedData).forEach(k => {
                if (parsed[k] === undefined || parsed[k] === null || parsed[k] === '') {
                  parsed[k] = parsedData[k];
                }
              });
            }
          } catch (e) {
            // Not JSON, keep as is
          }
        }

        // Client response normalization:
        // Many frontends expect code/companyName/clientType. Provide aliases so dropdowns work even
        // if DB schema only stores clientCode/clientName.
        if (tableName === 'clients') {
          const codeVal = (parsed.clientCode || parsed.code || '').toString();
          const nameVal = (parsed.clientName || parsed.companyName || '').toString();
          if (codeVal) {
            parsed.clientCode = codeVal;
            parsed.code = codeVal;
          }
          if (nameVal) {
            parsed.clientName = nameVal;
            parsed.companyName = nameVal;
          }
          if (!parsed.clientType) {
            // Best-effort default (schema may not have clientType column)
            parsed.clientType = 'TBB';
          }
        }
        
        // Parse other JSON fields
        const jsonFields = ['consignor', 'consignee', 'data', 'cftEntries', 'charges', 'deliveryPoints', 'pickupPoints', 'nearbyCities', 'odaLocations', 'contactDetails', 'address', 'bankDetails', 'salaryDetails', 'owner', 'insurance', 'tp', 'fitness', 'permit', 'accessPermissions', 'selectedLRs', 'summary', 'primaryContact', 'paymentTerms', 'rateDetails', 'vehicleTypes', 'serviceAreas'];
        jsonFields.forEach(field => {
          if (parsed[field] && typeof parsed[field] === 'string' && field !== 'data') {
            try {
              parsed[field] = JSON.parse(parsed[field]);
            } catch (e) {
              // Not JSON, keep as string
            }
          }
        });
        
        // Clean branch names - remove trailing "0" if present
        if (parsed.branchName) {
          parsed.branchName = parsed.branchName.trim().replace(/0+$/, '').trim();
        }
        
        return parsed;
      });
      
      res.json({ success: true, data: parsedRows });
    } catch (error) {
      if ((error?.message || '').includes('no such table')) {
        return res.json({ success: true, data: [] });
      }
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single record by ID
  app.get(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const row = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (row) {
        // Special handling for LR booking tables
        const isLRTable = tableName === 'lrBookings' || tableName === 'ptlLRBookings' || tableName === 'ftlLRBookings';
        
        // Special handling for vendor tables
        const isVendorTable = tableName === 'otherVendors' || tableName === 'marketVehicleVendors';
        const parsed = { ...row };
        
        // For LR tables, parse 'data' column and merge back
        if (isLRTable && parsed.data) {
          try {
            const parsedData = JSON.parse(parsed.data);
            Object.assign(parsed, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // For vendor tables, parse 'data' column and merge back
        if (isVendorTable && parsed.data) {
          try {
            const parsedData = JSON.parse(parsed.data);
            Object.assign(parsed, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }

        if (tableName === 'clients' && parsed.data && typeof parsed.data === 'string') {
          try {
            const parsedData = JSON.parse(parsed.data);
            if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
              Object.keys(parsedData).forEach(k => {
                if (parsed[k] === undefined || parsed[k] === null || parsed[k] === '') {
                  parsed[k] = parsedData[k];
                }
              });
            }
          } catch (e) {
            // Not JSON, keep as is
          }
        }

        if (tableName === 'clients') {
          const codeVal = (parsed.clientCode || parsed.code || '').toString();
          const nameVal = (parsed.clientName || parsed.companyName || '').toString();
          if (codeVal) {
            parsed.clientCode = codeVal;
            parsed.code = codeVal;
          }
          if (nameVal) {
            parsed.clientName = nameVal;
            parsed.companyName = nameVal;
          }
          if (!parsed.clientType) {
            parsed.clientType = 'TBB';
          }
        }
        
        // Parse other JSON fields
        const jsonFields = ['consignor', 'consignee', 'data', 'cftEntries', 'charges', 'deliveryPoints', 'pickupPoints', 'nearbyCities', 'odaLocations', 'owner', 'insurance', 'tp', 'fitness', 'permit', 'accessPermissions'];
        jsonFields.forEach(field => {
          if (parsed[field] && typeof parsed[field] === 'string' && field !== 'data') {
            try {
              parsed[field] = JSON.parse(parsed[field]);
            } catch (e) {
              // Not JSON, keep as string
            }
          }
        });
        
        // Clean branch names - remove trailing "0" if present
        if (parsed.branchName) {
          parsed.branchName = parsed.branchName.trim().replace(/0+$/, '').trim();
        }
        
        res.json({ success: true, data: parsed });
      } else {
        res.status(404).json({ success: false, error: 'Record not found' });
      }
    } catch (error) {
      if ((error?.message || '').includes('no such table')) {
        return res.status(404).json({ success: false, error: `Table ${tableName} does not exist` });
      }
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create new record
  app.post(`/api/${tableName}`, async (req, res) => {
    try {
      // Create a mutable copy of req.body to avoid const assignment issues
      let data = { ...req.body };
      
      // Clean branch names - remove trailing "0" if present
      if (tableName === 'branches' && data.branchName) {
        data.branchName = data.branchName.trim().replace(/0+$/, '').trim();
      }
      
      // Special handling for LR booking tables - store complex data in 'data' column
      const isLRTable = tableName === 'lrBookings' || tableName === 'ptlLRBookings' || tableName === 'ftlLRBookings';
      // Special handling for vendor tables
      const isVendorTable = tableName === 'otherVendors' || tableName === 'marketVehicleVendors';
      
      // Define actual database columns for LR tables (from schema)
      const lrTableColumns = {
        lrBookings: ['lrNumber', 'bookingDate', 'branch', 'consignor', 'consignee', 'fromLocation', 'toLocation', 'pieces', 'weight', 'freight', 'totalAmount', 'paymentMode', 'deliveryMode', 'remarks', 'status', 'data'],
        ptlLRBookings: ['lrNumber', 'bookingDate', 'branch', 'consignor', 'consignee', 'fromLocation', 'toLocation', 'pieces', 'weight', 'freight', 'totalAmount', 'paymentMode', 'deliveryMode', 'remarks', 'status', 'data'],
        ftlLRBookings: ['lrNumber', 'bookingDate', 'branch', 'consignor', 'consignee', 'fromLocation', 'toLocation', 'vehicleType', 'freight', 'totalAmount', 'paymentMode', 'remarks', 'status', 'data']
      };
      
      let insertData = {};
      let complexData = {};
      
      if (isLRTable) {
        const allowedColumns = lrTableColumns[tableName] || [];
        
        // Field mapping from frontend to database
        const fieldMapping = {
          'origin': 'fromLocation',
          'destination': 'toLocation',
          'deliveryType': 'deliveryMode'
        };
        
        // Separate fields into database columns and complex data
        Object.keys(data).forEach(key => {
          if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return; // Skip id and timestamps (handled by DB)
          
          // Map frontend field names to database column names
          const dbColumn = fieldMapping[key] || key;
          
          if (allowedColumns.includes(dbColumn)) {
            // This is a valid database column
            const value = data[key];
            // If it's an object/array, stringify it for TEXT column
            if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
              insertData[dbColumn] = JSON.stringify(value);
            } else {
              insertData[dbColumn] = value;
            }
          } else {
            // This field doesn't exist as a column - store in 'data' JSON
            complexData[key] = data[key];
          }
        });
        
        // Store all complex data in 'data' column as JSON
        if (Object.keys(complexData).length > 0) {
          insertData.data = JSON.stringify(complexData);
        } else if (data.data) {
          // If 'data' was provided directly, use it
          insertData.data = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
        }
      } else if (isVendorTable) {
        // Vendor tables: normalize payload and only insert actual DB columns.
        const skipFieldsSet = new Set(['id', 'createdAt', 'updatedAt']);
        const columnSet = await getTableColumns(tableName);
        data = normalizeVendorPayload(tableName, data, columnSet);

        const unknown = {};
        Object.keys(data).forEach(key => {
          if (skipFieldsSet.has(key)) return;
          const value = data[key];
          if (!columnSet.has(key)) {
            unknown[key] = value;
            return;
          }
          if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
            insertData[key] = JSON.stringify(value);
          } else {
            insertData[key] = value;
          }
        });

        if (columnSet.has('data') && Object.keys(unknown).length > 0) {
          let existing = {};
          if (insertData.data && typeof insertData.data === 'string') {
            try { existing = JSON.parse(insertData.data); } catch (e) { existing = {}; }
          }
          insertData.data = JSON.stringify({ ...existing, ...unknown });
        }
      } else {
        // For non-LR, non-vendor tables:
        // - Normalize specific tables (clients)
        // - Only insert actual DB columns to avoid SQLITE schema mismatch errors
        const skipFieldsSet = new Set(['id', 'lastLogin', 'createdAt', 'updatedAt', 'remarks']);
        const columnSet = await getTableColumns(tableName);

        if (tableName === 'clients') {
          // Server-side safety: ensure clientCode is present (auto-generate if missing)
          const incomingCode = (data.clientCode || data.code || data.client_code || '').toString().trim();
          if (!incomingCode) {
            const typeRaw = (data.clientType || data.client_type || (data.data && data.data.clientType) || '').toString().trim().toUpperCase();
            const prefix = typeRaw === 'CASH' ? 'CSH' : (typeRaw === 'TOPAY' || typeRaw === 'TO PAY' || typeRaw === 'TO_PAY' ? 'TPY' : 'TBB');
            const nextCode = await getNextClientCode(prefix);
            data.clientCode = nextCode;
            data.code = nextCode;
          }
          data = normalizeClientPayload(data, columnSet);
        }

        const unknown = {};
        Object.keys(data).forEach(key => {
          if (skipFieldsSet.has(key)) return;
          const value = data[key];
          if (!columnSet.has(key)) {
            unknown[key] = value;
            return;
          }
          if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
            insertData[key] = JSON.stringify(value);
          } else {
            insertData[key] = value;
          }
        });

        // If table supports a 'data' column, store unknown fields there
        if (columnSet.has('data') && Object.keys(unknown).length > 0) {
          let existing = {};
          if (insertData.data && typeof insertData.data === 'string') {
            try { existing = JSON.parse(insertData.data); } catch (e) { existing = {}; }
          }
          insertData.data = JSON.stringify({ ...existing, ...unknown });
        }
      }
      
      // Filter out fields not in database schema (final check)
      // Users table columns: id, username, password, userRole, branch, email, mobile, accessPermissions, code, linkedStaff, status, createdAt, updatedAt
      // Note: 'remarks' and 'lastLogin' are NOT in the users table schema
      const skipFields = ['id', 'lastLogin', 'createdAt', 'updatedAt', 'remarks'];
      const keys = Object.keys(insertData).filter(k => !skipFields.includes(k));
      if (keys.length === 0) {
        throw new Error('No valid columns to insert');
      }
      
      const values = keys.map(k => insertData[k]);
      const placeholders = keys.map(() => '?').join(', ');
      const columns = keys.join(', ');

      // Log for debugging
      console.log(`[${tableName}] Inserting ${keys.length} columns:`, keys);
      if (isLRTable && Object.keys(complexData).length > 0) {
        console.log(`[${tableName}] Complex data stored in 'data':`, Object.keys(complexData));
      }
      if (isVendorTable && Object.keys(complexData).length > 0) {
        console.log(`[${tableName}] Vendor complex data stored in 'data':`, Object.keys(complexData));
      }
      if (tableName === 'users') {
        console.log(`[users] Creating user:`, { username: insertData.username, userRole: insertData.userRole, code: insertData.code });
      }

      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
      if (tableName === 'users') {
        console.log(`[users] DEBUG - Keys before INSERT:`, keys);
        console.log(`[users] DEBUG - Columns in query:`, columns);
        if (columns.includes('lastLogin')) {
          console.error(`[users] ERROR: lastLogin found in columns! Keys:`, keys);
        }
      }
      console.log(`[${tableName}] Executing query:`, query.substring(0, 100) + '...');
      const result = await dbRun(query, values);
      console.log(`[${tableName}] Insert successful, new ID:`, result.id);
      
      let newRecord = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [result.id]);
      
      // Parse JSON fields back to objects
      if (newRecord) {
        // Create a mutable copy to avoid const assignment issues
        newRecord = { ...newRecord };
        
        // For LR tables, parse 'data' column and merge back
        if (isLRTable && newRecord.data) {
          try {
            const parsedData = JSON.parse(newRecord.data);
            Object.assign(newRecord, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // For vendor tables, parse 'data' column and merge back
        if (isVendorTable && newRecord.data) {
          try {
            const parsedData = JSON.parse(newRecord.data);
            Object.assign(newRecord, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // Parse other JSON fields that are stored as strings
        const jsonFields = ['consignor', 'consignee', 'data', 'cftEntries', 'charges', 'deliveryPoints', 'pickupPoints', 'nearbyCities', 'odaLocations', 'owner', 'insurance', 'tp', 'fitness', 'permit', 'accessPermissions'];
        jsonFields.forEach(field => {
          if (newRecord[field] && typeof newRecord[field] === 'string' && field !== 'data') {
            try {
              newRecord[field] = JSON.parse(newRecord[field]);
            } catch (e) {
              // Not JSON, keep as string
            }
          }
        });
        
        // Clean branch names - remove trailing "0" if present
        if (tableName === 'branches' && newRecord.branchName) {
          newRecord.branchName = newRecord.branchName.trim().replace(/0+$/, '').trim();
        }
      }
      
      res.json({ success: true, data: newRecord });
    } catch (error) {
      console.error(`❌ Error creating ${tableName}:`, error.message);
      if (typeof insertData !== 'undefined') {
        console.error(`   Attempted columns:`, Object.keys(insertData));
      }
      if (typeof complexData !== 'undefined') {
        console.error(`   Complex data fields:`, Object.keys(complexData));
      }
      console.error(`   Full error:`, error);
      if ((error?.message || '').includes('no such table')) {
        return res.status(404).json({ success: false, error: `Table ${tableName} does not exist` });
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update record
  app.put(`/api/${tableName}/:id`, async (req, res) => {
    try {
      // Create a mutable copy of req.body to avoid const assignment issues
      let data = { ...req.body };
      
      // Clean branch names - remove trailing "0" if present
      if (tableName === 'branches' && data.branchName) {
        data.branchName = data.branchName.trim().replace(/0+$/, '').trim();
      }
      
      // Special handling for LR booking tables - store complex data in 'data' column
      const isLRTable = tableName === 'lrBookings' || tableName === 'ptlLRBookings' || tableName === 'ftlLRBookings';
      
      // Special handling for vendor tables
      const isVendorTable = tableName === 'otherVendors' || tableName === 'marketVehicleVendors';
      
      let updateData = { ...data };
      let complexData = {};
      
      if (isVendorTable) {
        // Vendor tables: normalize + only update real columns (prevents "no such column: companyName")
        const columnSet = await getTableColumns(tableName);
        updateData = normalizeVendorPayload(tableName, updateData, columnSet);

        const filtered = {};
        const unknown = {};
        Object.keys(updateData).forEach(k => {
          if (k === 'id' || k === 'createdAt' || k === 'updatedAt') return;
          if (!columnSet.has(k)) {
            unknown[k] = updateData[k];
            return;
          }
          filtered[k] = updateData[k];
        });

        if (columnSet.has('data') && Object.keys(unknown).length > 0) {
          const existing = await dbGet(`SELECT data FROM ${tableName} WHERE id = ?`, [req.params.id]);
          let existingData = {};
          if (existing && existing.data) {
            try { existingData = JSON.parse(existing.data); } catch (e) { existingData = {}; }
          }
          let providedData = {};
          if (filtered.data && typeof filtered.data === 'string') {
            try { providedData = JSON.parse(filtered.data); } catch (e) { providedData = {}; }
          } else if (filtered.data && typeof filtered.data === 'object') {
            providedData = filtered.data;
          }
          filtered.data = JSON.stringify({ ...existingData, ...providedData, ...unknown });
        }

        updateData = filtered;
      } else if (isLRTable) {
        // Extract complex fields to store in 'data' column
        const complexFields = ['cftEntries', 'consignor', 'consignee', 'charges', 'deliveryPoints', 'pickupPoints', 'formData'];
        complexFields.forEach(field => {
          if (data[field] !== undefined) {
            complexData[field] = data[field];
            delete updateData[field];
          }
        });
        
        // Store all complex data in 'data' column as JSON
        if (Object.keys(complexData).length > 0) {
          updateData.data = JSON.stringify(complexData);
        }
      }

      // For non-LR, non-vendor tables: normalize and filter to actual DB columns
      if (!isVendorTable && !isLRTable) {
        const columnSet = await getTableColumns(tableName);
        if (tableName === 'clients') {
          updateData = normalizeClientPayload(updateData, columnSet);
        }

        const filtered = {};
        const unknown = {};
        Object.keys(updateData).forEach(k => {
          if (k === 'id' || k === 'createdAt') return;
          if (!columnSet.has(k)) {
            unknown[k] = updateData[k];
            return;
          }
          filtered[k] = updateData[k];
        });

        // Merge unknown fields into 'data' column if supported
        if (columnSet.has('data') && Object.keys(unknown).length > 0) {
          const existing = await dbGet(`SELECT data FROM ${tableName} WHERE id = ?`, [req.params.id]);
          let existingData = {};
          if (existing && existing.data) {
            try { existingData = JSON.parse(existing.data); } catch (e) { existingData = {}; }
          }
          let providedData = {};
          if (filtered.data && typeof filtered.data === 'string') {
            try { providedData = JSON.parse(filtered.data); } catch (e) { providedData = {}; }
          } else if (filtered.data && typeof filtered.data === 'object') {
            providedData = filtered.data;
          }
          filtered.data = JSON.stringify({ ...existingData, ...providedData, ...unknown });
        }

        updateData = filtered;
      }
      
      // Filter out fields not in database schema
      // Users table doesn't have: lastLogin, remarks
      const keys = Object.keys(updateData).filter(k => {
        // Skip id, lastLogin, remarks (not in users table), and auto-managed timestamps
        if (k === 'id' || k === 'lastLogin' || k === 'remarks' || k === 'createdAt' || k === 'updatedAt') return false;
        return true;
      });
      
      // Convert remaining complex objects/arrays to JSON strings for TEXT columns
      // List of fields that should be stored as JSON
      const jsonFieldsForUpdate = ['consignor', 'consignee', 'data', 'cftEntries', 'charges', 'deliveryPoints', 'pickupPoints', 'nearbyCities', 'odaLocations', 'contactDetails', 'address', 'bankDetails', 'salaryDetails', 'owner', 'insurance', 'tp', 'fitness', 'permit', 'accessPermissions', 'primaryContact', 'paymentTerms', 'rateDetails', 'vehicleTypes', 'serviceAreas'];
      
      const values = keys.map(k => {
        const value = updateData[k];
        // If value is object or array, or if it's a known JSON field, stringify it
        if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
          return JSON.stringify(value);
        }
        // If it's a known JSON field that's already a string, keep it as is
        if (jsonFieldsForUpdate.includes(k) && typeof value === 'string') {
          return value;
        }
        return value;
      });
      
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const updateValues = [...values, req.params.id];

      const query = `UPDATE ${tableName} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      await dbRun(query, updateValues);
      
      const updatedRecord = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      
      // Parse JSON fields back to objects
      if (updatedRecord) {
        // For LR tables, parse 'data' column and merge back
        if (isLRTable && updatedRecord.data) {
          try {
            const parsedData = JSON.parse(updatedRecord.data);
            Object.assign(updatedRecord, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // For vendor tables, parse 'data' column and merge back
        if (isVendorTable && updatedRecord.data) {
          try {
            const parsedData = JSON.parse(updatedRecord.data);
            Object.assign(updatedRecord, parsedData);
          } catch (e) {
            // Not JSON, keep as is
          }
        }
        
        // Parse other JSON fields
        const jsonFields = ['consignor', 'consignee', 'data', 'cftEntries', 'charges', 'deliveryPoints', 'pickupPoints', 'nearbyCities', 'odaLocations', 'owner', 'insurance', 'tp', 'fitness', 'permit', 'accessPermissions'];
        jsonFields.forEach(field => {
          if (updatedRecord[field] && typeof updatedRecord[field] === 'string' && field !== 'data') {
            try {
              updatedRecord[field] = JSON.parse(updatedRecord[field]);
            } catch (e) {
              // Not JSON, keep as string
            }
          }
        });
      }
      
      // Clean branch names - remove trailing "0" if present
      if (tableName === 'branches' && updatedRecord.branchName) {
        updatedRecord.branchName = updatedRecord.branchName.trim().replace(/0+$/, '').trim();
      }
      
      res.json({ success: true, data: updatedRecord });
    } catch (error) {
      if ((error?.message || '').includes('no such table')) {
        return res.status(404).json({ success: false, error: `Table ${tableName} does not exist` });
      }
      console.error(`Error updating ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Delete record
  app.delete(`/api/${tableName}/:id`, async (req, res) => {
    try {
      await dbRun(`DELETE FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json({ success: true, message: 'Record deleted successfully' });
    } catch (error) {
      if ((error?.message || '').includes('no such table')) {
        return res.status(404).json({ success: false, error: `Table ${tableName} does not exist` });
      }
      console.error(`Error deleting ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

// Create CRUD routes for all tables
const tables = [
  'users', 'branches', 'cities', 'vehicles', 'drivers', 'staff', 'staffAttendance',
  'lrBookings', 'ftlLRBookings', 'ptlLRBookings', 'manifests', 'trips',
  'invoices', 'payments', 'pods', 'clients', 'accounts', 'expenseTypes',
  'branchExpenses',
  'branchAccounts',
  'vehicleMaintenance',
  'marketVehicleVendors', 'otherVendors', 'clientRates'
];

tables.forEach(table => createCRUDRoutes(table));

// ========== CLIENT DEPENDENCY MANAGEMENT ==========

// Check client dependencies before deletion
app.get('/api/clients/:id/dependencies', async (req, res) => {
  try {
    const clientId = req.params.id;
    const ident = await getClientIdentityById(clientId);
    if (!ident) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const clientCode = ident.code;
    const clientName = ident.name;
    const dependencies = {
      lrBookings: [],
      ftlLRBookings: [],
      ptlLRBookings: [],
      invoices: [],
      clientRates: [],
      payments: []
    };

    // Check LR Bookings (consignor/consignee in data column)
    const lrBookings = await dbAll('SELECT id, lrNumber, data FROM lrBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of lrBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          if ((parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) ||
              (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId))) {
            dependencies.lrBookings.push({ id: lr.id, lrNumber: lr.lrNumber });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Check FTL LR Bookings
    const ftlBookings = await dbAll('SELECT id, lrNumber, data FROM ftlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of ftlBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          if ((parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) ||
              (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId))) {
            dependencies.ftlLRBookings.push({ id: lr.id, lrNumber: lr.lrNumber });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Check PTL LR Bookings
    const ptlBookings = await dbAll('SELECT id, lrNumber, data FROM ptlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of ptlBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          if ((parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) ||
              (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId))) {
            dependencies.ptlLRBookings.push({ id: lr.id, lrNumber: lr.lrNumber });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Check Invoices (clientId or clientName in data)
    const invoices = await dbAll('SELECT id, invoiceNumber, data FROM invoices WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const inv of invoices) {
      if (inv.data) {
        try {
          const parsed = JSON.parse(inv.data);
          if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
              (parsed.clientCode === clientCode) ||
              (parsed.clientName && clientName && parsed.clientName === clientName)) {
            dependencies.invoices.push({ id: inv.id, invoiceNumber: inv.invoiceNumber });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Check Client Rates (clientId or clientCode) - if table exists
    try {
      const clientRates = await dbAll('SELECT id, clientId, clientCode FROM clientRates WHERE clientId = ? OR clientCode = ?', [clientId, clientCode]);
      dependencies.clientRates = clientRates.map(r => ({ id: r.id, clientId: r.clientId, clientCode: r.clientCode }));
    } catch (e) {
      // clientRates table might not exist
      dependencies.clientRates = [];
    }

    // Check Payments (clientId or clientName in data)
    const payments = await dbAll('SELECT id, paymentNumber, data FROM payments WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const pay of payments) {
      if (pay.data) {
        try {
          const parsed = JSON.parse(pay.data);
          if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
              (parsed.clientCode === clientCode) ||
              (parsed.clientName && clientName && parsed.clientName === clientName)) {
            dependencies.payments.push({ id: pay.id, paymentNumber: pay.paymentNumber });
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    const totalDependencies = 
      dependencies.lrBookings.length +
      dependencies.ftlLRBookings.length +
      dependencies.ptlLRBookings.length +
      dependencies.invoices.length +
      dependencies.clientRates.length +
      dependencies.payments.length;

    res.json({
      success: true,
      hasDependencies: totalDependencies > 0,
      totalCount: totalDependencies,
      dependencies
    });
  } catch (error) {
    console.error('Error checking client dependencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete client and clear all dependencies
app.delete('/api/clients/:id/with-dependencies', async (req, res) => {
  try {
    const clientId = req.params.id;
    const { clearReferences = false } = req.body; // If true, nullify references instead of preventing deletion

    const ident = await getClientIdentityById(clientId);
    if (!ident) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const clientCode = ident.code;
    const clientName = ident.name;

    if (!clearReferences) {
      // Check dependencies first by calling the dependency check logic
      const ident2 = await getClientIdentityById(clientId);
      if (!ident2) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
      const clientCode = ident2.code;
      
      // Quick check for any dependencies
      const lrCount = await dbGet('SELECT COUNT(*) as count FROM lrBookings WHERE data LIKE ?', [`%${clientCode}%`]);
      const ftlCount = await dbGet('SELECT COUNT(*) as count FROM ftlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
      const ptlCount = await dbGet('SELECT COUNT(*) as count FROM ptlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
      const invCount = await dbGet('SELECT COUNT(*) as count FROM invoices WHERE data LIKE ?', [`%${clientCode}%`]);
      let rateCount = { count: 0 };
      try {
        rateCount = await dbGet('SELECT COUNT(*) as count FROM clientRates WHERE clientId = ? OR clientCode = ?', [clientId, clientCode]);
      } catch (e) {
        // clientRates table might not exist
      }
      const payCount = await dbGet('SELECT COUNT(*) as count FROM payments WHERE data LIKE ?', [`%${clientCode}%`]);
      
      const totalCount = (lrCount?.count || 0) + (ftlCount?.count || 0) + (ptlCount?.count || 0) + 
                        (invCount?.count || 0) + (rateCount?.count || 0) + (payCount?.count || 0);
      
      if (totalCount > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete client with existing dependencies',
          totalCount: totalCount
        });
      }
    }

    // Clear references in LR Bookings
    const lrBookings = await dbAll('SELECT id, data FROM lrBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of lrBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          let updated = false;
          if (parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) {
            parsed.consignor = null;
            updated = true;
          }
          if (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId)) {
            parsed.consignee = null;
            updated = true;
          }
          if (updated) {
            await dbRun('UPDATE lrBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Clear references in FTL LR Bookings
    const ftlBookings = await dbAll('SELECT id, data FROM ftlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of ftlBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          let updated = false;
          if (parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) {
            parsed.consignor = null;
            updated = true;
          }
          if (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId)) {
            parsed.consignee = null;
            updated = true;
          }
          if (updated) {
            await dbRun('UPDATE ftlLRBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Clear references in PTL LR Bookings
    const ptlBookings = await dbAll('SELECT id, data FROM ptlLRBookings WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const lr of ptlBookings) {
      if (lr.data) {
        try {
          const parsed = JSON.parse(lr.data);
          let updated = false;
          if (parsed.consignor && (parsed.consignor.code === clientCode || parsed.consignor.id === clientId)) {
            parsed.consignor = null;
            updated = true;
          }
          if (parsed.consignee && (parsed.consignee.code === clientCode || parsed.consignee.id === clientId)) {
            parsed.consignee = null;
            updated = true;
          }
          if (updated) {
            await dbRun('UPDATE ptlLRBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Delete client rates (if table exists)
    try {
      await dbRun('DELETE FROM clientRates WHERE clientId = ? OR clientCode = ?', [clientId, clientCode]);
    } catch (e) {
      // clientRates table might not exist, ignore
      console.log('clientRates table not found, skipping');
    }

    // Clear references in Invoices
    const invoices = await dbAll('SELECT id, data FROM invoices WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const inv of invoices) {
      if (inv.data) {
        try {
          const parsed = JSON.parse(inv.data);
          if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
              (parsed.clientCode === clientCode)) {
            parsed.clientId = null;
            parsed.clientCode = null;
            parsed.clientName = `[DELETED] ${parsed.clientName || clientName || ''}`;
            await dbRun('UPDATE invoices SET data = ? WHERE id = ?', [JSON.stringify(parsed), inv.id]);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Clear references in Payments
    const payments = await dbAll('SELECT id, data FROM payments WHERE data LIKE ?', [`%${clientCode}%`]);
    for (const pay of payments) {
      if (pay.data) {
        try {
          const parsed = JSON.parse(pay.data);
          if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
              (parsed.clientCode === clientCode)) {
            parsed.clientId = null;
            parsed.clientCode = null;
            parsed.clientName = `[DELETED] ${parsed.clientName || clientName || ''}`;
            await dbRun('UPDATE payments SET data = ? WHERE id = ?', [JSON.stringify(parsed), pay.id]);
          }
        } catch (e) {
          // Not JSON, skip
        }
      }
    }

    // Finally delete the client
    await dbRun('DELETE FROM clients WHERE id = ?', [clientId]);
    
    // Also try to delete from tbbClients if exists
    try {
      await dbRun('DELETE FROM tbbClients WHERE id = ?', [clientId]);
    } catch (e) {
      // Table might not exist, ignore
    }

    res.json({
      success: true,
      message: 'Client deleted and all references cleared',
      clearedReferences: {
        lrBookings: lrBookings.length,
        ftlLRBookings: ftlBookings.length,
        ptlLRBookings: ptlBookings.length,
        invoices: invoices.length,
        clientRates: (await dbAll('SELECT COUNT(*) as count FROM clientRates WHERE clientId = ? OR clientCode = ?', [clientId, clientCode]))[0]?.count || 0,
        payments: payments.length
      }
    });
  } catch (error) {
    console.error('Error deleting client with dependencies:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update client and all references
app.put('/api/clients/:id/with-references', async (req, res) => {
  try {
    const clientId = req.params.id;
    const updateData = req.body;

    // Get old client data
    const oldIdent = await getClientIdentityById(clientId);
    if (!oldIdent) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    const oldClientCode = oldIdent.code;
    const oldCompanyName = oldIdent.name;

    // Normalize + filter client update to actual DB columns
    const clientCols = await getTableColumns('clients');
    let normalizedUpdate = normalizeClientPayload(updateData, clientCols);

    // If clients table has a data column, merge unknown fields into it
    if (clientCols.has('data')) {
      const existing = await dbGet('SELECT data FROM clients WHERE id = ?', [clientId]);
      let existingData = {};
      if (existing && existing.data) {
        try { existingData = JSON.parse(existing.data); } catch (e) { existingData = {}; }
      }
      let providedData = {};
      if (normalizedUpdate.data && typeof normalizedUpdate.data === 'string') {
        try { providedData = JSON.parse(normalizedUpdate.data); } catch (e) { providedData = {}; }
      }
      normalizedUpdate.data = JSON.stringify({ ...existingData, ...providedData });
    }

    const newClientCode = normalizedUpdate.clientCode || normalizedUpdate.code || oldClientCode;
    const newCompanyName = normalizedUpdate.companyName || normalizedUpdate.clientName || oldCompanyName;

    // Update client
    const keys = Object.keys(normalizedUpdate)
      .filter(k => k !== 'id' && k !== 'createdAt' && clientCols.has(k));
    if (keys.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid client fields to update' });
    }
    const jsonFieldsForUpdate = ['address', 'data'];
    const values = keys.map(k => {
      const value = normalizedUpdate[k];
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        return JSON.stringify(value);
      }
      if (jsonFieldsForUpdate.includes(k) && typeof value === 'string') {
        return value;
      }
      return value;
    });
    const setClause = keys.map(k => `${k} = ?`).join(', ');
    const updateValues = [...values, clientId];
    await dbRun(`UPDATE clients SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`, updateValues);

    // Update references if client code or name changed
    if (oldClientCode !== newClientCode || oldCompanyName !== newCompanyName) {
      // Update LR Bookings
      const lrBookings = await dbAll('SELECT id, data FROM lrBookings WHERE data LIKE ?', [`%${oldClientCode}%`]);
      for (const lr of lrBookings) {
        if (lr.data) {
          try {
            const parsed = JSON.parse(lr.data);
            let updated = false;
            if (parsed.consignor && (parsed.consignor.code === oldClientCode || parsed.consignor.id === clientId)) {
              parsed.consignor.code = newClientCode;
              parsed.consignor.name = newCompanyName;
              parsed.consignor.id = clientId;
              updated = true;
            }
            if (parsed.consignee && (parsed.consignee.code === oldClientCode || parsed.consignee.id === clientId)) {
              parsed.consignee.code = newClientCode;
              parsed.consignee.name = newCompanyName;
              parsed.consignee.id = clientId;
              updated = true;
            }
            if (updated) {
              await dbRun('UPDATE lrBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }

      // Update FTL LR Bookings
      const ftlBookings = await dbAll('SELECT id, data FROM ftlLRBookings WHERE data LIKE ?', [`%${oldClientCode}%`]);
      for (const lr of ftlBookings) {
        if (lr.data) {
          try {
            const parsed = JSON.parse(lr.data);
            let updated = false;
            if (parsed.consignor && (parsed.consignor.code === oldClientCode || parsed.consignor.id === clientId)) {
              parsed.consignor.code = newClientCode;
              parsed.consignor.name = newCompanyName;
              parsed.consignor.id = clientId;
              updated = true;
            }
            if (parsed.consignee && (parsed.consignee.code === oldClientCode || parsed.consignee.id === clientId)) {
              parsed.consignee.code = newClientCode;
              parsed.consignee.name = newCompanyName;
              parsed.consignee.id = clientId;
              updated = true;
            }
            if (updated) {
              await dbRun('UPDATE ftlLRBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }

      // Update PTL LR Bookings
      const ptlBookings = await dbAll('SELECT id, data FROM ptlLRBookings WHERE data LIKE ?', [`%${oldClientCode}%`]);
      for (const lr of ptlBookings) {
        if (lr.data) {
          try {
            const parsed = JSON.parse(lr.data);
            let updated = false;
            if (parsed.consignor && (parsed.consignor.code === oldClientCode || parsed.consignor.id === clientId)) {
              parsed.consignor.code = newClientCode;
              parsed.consignor.name = newCompanyName;
              parsed.consignor.id = clientId;
              updated = true;
            }
            if (parsed.consignee && (parsed.consignee.code === oldClientCode || parsed.consignee.id === clientId)) {
              parsed.consignee.code = newClientCode;
              parsed.consignee.name = newCompanyName;
              parsed.consignee.id = clientId;
              updated = true;
            }
            if (updated) {
              await dbRun('UPDATE ptlLRBookings SET data = ? WHERE id = ?', [JSON.stringify(parsed), lr.id]);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }

      // Update Client Rates (if table exists)
      try {
        await dbRun('UPDATE clientRates SET clientCode = ? WHERE clientId = ? OR clientCode = ?', [newClientCode, clientId, oldClientCode]);
      } catch (e) {
        // clientRates table might not exist, ignore
        console.log('clientRates table not found, skipping');
      }

      // Update Invoices
      const invoices = await dbAll('SELECT id, data FROM invoices WHERE data LIKE ?', [`%${oldClientCode}%`]);
      for (const inv of invoices) {
        if (inv.data) {
          try {
            const parsed = JSON.parse(inv.data);
            if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
                (parsed.clientCode === oldClientCode)) {
              parsed.clientCode = newClientCode;
              parsed.clientName = newCompanyName;
              await dbRun('UPDATE invoices SET data = ? WHERE id = ?', [JSON.stringify(parsed), inv.id]);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }

      // Update Payments
      const payments = await dbAll('SELECT id, data FROM payments WHERE data LIKE ?', [`%${oldClientCode}%`]);
      for (const pay of payments) {
        if (pay.data) {
          try {
            const parsed = JSON.parse(pay.data);
            if ((parsed.clientId && parsed.clientId.toString() === clientId.toString()) ||
                (parsed.clientCode === oldClientCode)) {
              parsed.clientCode = newClientCode;
              parsed.clientName = newCompanyName;
              await dbRun('UPDATE payments SET data = ? WHERE id = ?', [JSON.stringify(parsed), pay.id]);
            }
          } catch (e) {
            // Not JSON, skip
          }
        }
      }
    }

    const updatedClient = await dbGet('SELECT * FROM clients WHERE id = ?', [clientId]);
    res.json({ success: true, data: updatedClient });
  } catch (error) {
    console.error('Error updating client with references:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ========== MOBILE APP API ENDPOINTS ==========

// Mobile Check-In
app.post('/api/mobile/checkin', async (req, res) => {
  try {
    const { staffId, location, deviceInfo, timestamp } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ success: false, error: 'staffId is required' });
    }

    // Get staff details
    const staff = await dbGet('SELECT * FROM staff WHERE id = ?', [staffId]);
    if (!staff) {
      return res.status(404).json({ success: false, error: 'Staff not found' });
    }

    // Get branch details
    const branch = staff.branch ? await dbGet('SELECT * FROM branches WHERE id = ?', [staff.branch]) : null;

    const today = new Date().toISOString().split('T')[0];
    const checkInTime = timestamp ? new Date(timestamp).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);

    // Check if attendance record exists for today
    const existing = await dbGet(
      'SELECT * FROM staffAttendance WHERE staffId = ? AND attendanceDate = ?',
      [staffId, today]
    );

    if (existing) {
      // Update existing record
      await dbRun(
        `UPDATE staffAttendance SET 
          status = 'Present',
          checkInTime = ?,
          location = ?,
          deviceInfo = ?,
          isMobileApp = 1,
          updatedAt = CURRENT_TIMESTAMP
        WHERE id = ?`,
        [checkInTime, JSON.stringify(location), JSON.stringify(deviceInfo), existing.id]
      );
      res.json({ success: true, message: 'Check-in updated', data: { id: existing.id } });
    } else {
      // Create new record
      const result = await dbRun(
        `INSERT INTO staffAttendance 
        (staffId, staffName, branchId, branchName, attendanceDate, status, checkInTime, location, deviceInfo, isMobileApp)
        VALUES (?, ?, ?, ?, ?, 'Present', ?, ?, ?, 1)`,
        [
          staffId,
          staff.staffName,
          staff.branch,
          branch?.branchName || '',
          today,
          checkInTime,
          JSON.stringify(location),
          JSON.stringify(deviceInfo)
        ]
      );
      res.json({ success: true, message: 'Check-in recorded', data: { id: result.id } });
    }
  } catch (error) {
    console.error('Error in mobile check-in:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile Check-Out
app.post('/api/mobile/checkout', async (req, res) => {
  try {
    const { staffId, location, deviceInfo, timestamp } = req.body;
    
    if (!staffId) {
      return res.status(400).json({ success: false, error: 'staffId is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const checkOutTime = timestamp ? new Date(timestamp).toTimeString().slice(0, 5) : new Date().toTimeString().slice(0, 5);

    // Find today's attendance record
    const existing = await dbGet(
      'SELECT * FROM staffAttendance WHERE staffId = ? AND attendanceDate = ?',
      [staffId, today]
    );

    if (!existing) {
      return res.status(404).json({ success: false, error: 'No check-in found for today' });
    }

    // Update check-out time
    await dbRun(
      `UPDATE staffAttendance SET 
        checkOutTime = ?,
        location = ?,
        deviceInfo = ?,
        updatedAt = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [checkOutTime, JSON.stringify(location), JSON.stringify(deviceInfo), existing.id]
    );

    res.json({ success: true, message: 'Check-out recorded', data: { id: existing.id } });
  } catch (error) {
    console.error('Error in mobile check-out:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile LR Booking
app.post('/api/mobile/lrBooking', async (req, res) => {
  try {
    const lrData = req.body;
    
    // Use existing LR booking endpoint logic
    const keys = Object.keys(lrData).filter(k => k !== 'id');
    const values = keys.map(k => {
      if (typeof lrData[k] === 'object') {
        return JSON.stringify(lrData[k]);
      }
      return lrData[k];
    });
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');

    const query = `INSERT INTO lrBookings (${columns}) VALUES (${placeholders})`;
    const result = await dbRun(query, values);

    res.json({ success: true, message: 'LR booking created from mobile', data: { id: result.id } });
  } catch (error) {
    console.error('Error in mobile LR booking:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile Delivery Update
app.post('/api/mobile/delivery/:lrId', async (req, res) => {
  try {
    const { lrId } = req.params;
    const deliveryData = req.body;

    // Update LR booking with delivery information
    const updateFields = Object.keys(deliveryData).map(key => `${key} = ?`).join(', ');
    const values = Object.values(deliveryData).map(v => typeof v === 'object' ? JSON.stringify(v) : v);
    values.push(lrId);

    await dbRun(
      `UPDATE lrBookings SET ${updateFields}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Delivery updated from mobile' });
  } catch (error) {
    console.error('Error in mobile delivery update:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mobile POD Upload
app.post('/api/mobile/pod', async (req, res) => {
  try {
    const podData = req.body;
    
    // Create POD record
    const keys = Object.keys(podData).filter(k => k !== 'id');
    const values = keys.map(k => {
      if (typeof podData[k] === 'object') {
        return JSON.stringify(podData[k]);
      }
      return podData[k];
    });
    const placeholders = keys.map(() => '?').join(', ');
    const columns = keys.join(', ');

    const query = `INSERT INTO pods (${columns}) VALUES (${placeholders})`;
    const result = await dbRun(query, values);

    res.json({ success: true, message: 'POD uploaded from mobile', data: { id: result.id } });
  } catch (error) {
    console.error('Error in mobile POD upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Bulk operations
app.post('/api/bulk/:tableName', async (req, res) => {
  try {
    const { tableName } = req.params;
    const records = req.body;
    
    if (!Array.isArray(records)) {
      return res.status(400).json({ success: false, error: 'Expected array of records' });
    }

    const results = [];
    for (const record of records) {
      const keys = Object.keys(record).filter(k => k !== 'id');
      const values = keys.map(k => record[k]);
      const placeholders = keys.map(() => '?').join(', ');
      const columns = keys.join(', ');

      const query = `INSERT OR REPLACE INTO ${tableName} (${columns}) VALUES (${placeholders})`;
      await dbRun(query, values);
      results.push(record);
    }

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    console.error(`Error bulk inserting ${req.params.tableName}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
// Root API endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: 'TMS Backend API is running',
    database: dbPath,
    timestamp: new Date().toISOString(),
    endpoints: [
      '/api/health',
      '/api/branches',
      '/api/cities',
      '/api/clients',
      '/api/vehicles',
      '/api/drivers',
      '/api/staff',
      '/api/lrBookings',
      '/api/manifests',
      '/api/trips',
      '/api/invoices',
      '/api/pods'
    ]
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'TMS Backend API is running',
    database: dbPath,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 TMS Backend Server running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Database: ${dbPath}`);
  console.log(`🌐 API Health: http://localhost:${PORT}/api/health`);
  console.log(`\n📝 Available endpoints:`);
  tables.forEach(table => {
    console.log(`   - GET/POST/PUT/DELETE /api/${table}`);
  });
  console.log(`\n✅ Server ready! Your data is now stored in database.\n`);
});

// ========== DRIVER LICENSE VERIFICATION API ==========
// API Setu Driver License Verification (Consent-based API)
app.post('/api/driver-license/verify', async (req, res) => {
  try {
    console.log('📥 Received license verification request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { txnId, format, certificateParameters, consentArtifact } = req.body;
    
    if (!certificateParameters || !certificateParameters.dlno || !certificateParameters.DOB) {
      console.error('❌ Missing required parameters:', {
        hasCertificateParameters: !!certificateParameters,
        hasDlno: !!certificateParameters?.dlno,
        hasDOB: !!certificateParameters?.DOB
      });
      return res.status(400).json({ 
        success: false, 
        error: 'Driver license number and DOB are required',
        received: {
          certificateParameters: !!certificateParameters,
          dlno: certificateParameters?.dlno,
          DOB: certificateParameters?.DOB
        }
      });
    }

    // API Setu Sandbox endpoint
    const licenseApiUrl = process.env.DRIVER_LICENSE_API_URL || 'https://sandbox.api-setu.in/certificate/v3/transport/drvlc';
    const apiKey = process.env.DRIVER_LICENSE_API_KEY || 'demokey123456ABCD789';
    const clientId = process.env.DRIVER_LICENSE_CLIENT_ID || 'in.gov.sandbox';

    // Request format - use JSON for easier parsing (can also use 'xml' or 'pdf')
    const requestFormat = format || 'json';
    
    // Set Accept header based on format
    let acceptHeader = 'application/json';
    if (requestFormat === 'xml') {
      acceptHeader = 'application/xml';
    } else if (requestFormat === 'pdf') {
      acceptHeader = 'application/pdf';
    }

    console.log('🔍 Verifying driver license:', certificateParameters.dlno);

    // Forward the request to API Setu
    try {
      // Use https module for Node.js compatibility (works on all Node versions)
      const https = require('https');
      const url = require('url');
      
      const requestPayload = {
        txnId: txnId || `txn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        format: requestFormat,
        certificateParameters,
        consentArtifact
      };

      const requestData = JSON.stringify(requestPayload);
      const parsedUrl = new url.URL(licenseApiUrl);
      
      const options = {
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: parsedUrl.pathname,
        method: 'POST',
        headers: {
          'Accept': acceptHeader,
          'Content-Type': 'application/json',
          'X-APISETU-APIKEY': apiKey,
          'X-APISETU-CLIENTID': clientId,
          'Content-Length': Buffer.byteLength(requestData)
        }
      };

      console.log('🔍 Calling API Setu:', licenseApiUrl);
      console.log('📋 License Number:', certificateParameters.dlno);

      // Make HTTPS request
      const apiResponse = await new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              try {
                let data;
                const contentType = res.headers['content-type'] || '';
                
                if (requestFormat === 'json' || contentType.includes('application/json')) {
                  data = JSON.parse(responseData);
                } else if (requestFormat === 'xml' || contentType.includes('application/xml') || contentType.includes('text/xml')) {
                  // For XML, return the raw XML string - frontend can parse if needed
                  // In production, you might want to use xml2js library here
                  data = { 
                    xml: responseData, 
                    format: 'xml',
                    raw: responseData
                  };
                  
                  // Try to extract basic info from XML if possible (simple regex parsing)
                  const nameMatch = responseData.match(/<Name[^>]*>([^<]+)<\/Name>/i);
                  const dlnoMatch = responseData.match(/<DLNo[^>]*>([^<]+)<\/DLNo>/i);
                  const dobMatch = responseData.match(/<DOB[^>]*>([^<]+)<\/DOB>/i);
                  
                  if (nameMatch || dlnoMatch) {
                    data.parsed = {
                      name: nameMatch ? nameMatch[1] : '',
                      licenseNumber: dlnoMatch ? dlnoMatch[1] : '',
                      dob: dobMatch ? dobMatch[1] : ''
                    };
                  }
                } else if (requestFormat === 'pdf' || contentType.includes('application/pdf')) {
                  // PDF format - return as base64
                  data = { 
                    pdf: Buffer.from(responseData).toString('base64'), 
                    format: 'pdf',
                    contentType: 'application/pdf'
                  };
                } else {
                  // Unknown format, try JSON first
                  try {
                    data = JSON.parse(responseData);
                  } catch (e) {
                    data = { raw: responseData, format: 'unknown' };
                  }
                }
                resolve({ status: res.statusCode, data });
              } catch (parseError) {
                console.error('Parse error:', parseError);
                reject(new Error('Failed to parse API response: ' + parseError.message));
              }
            } else {
              console.error(`❌ API Setu returned ${res.statusCode}`);
              console.error('Response:', responseData.substring(0, 500));
              reject(new Error(`API returned ${res.statusCode}: ${responseData.substring(0, 200)}`));
            }
          });
        });

        req.on('error', (error) => {
          console.error('❌ HTTPS request error:', error.message);
          reject(error);
        });

        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout - API took too long to respond'));
        });

        req.write(requestData);
        req.end();
      });

      console.log('✅ License verified successfully');
      res.json({ success: true, data: apiResponse.data });
    } catch (apiError) {
      console.error('License API error:', apiError.message);
      
      // FALLBACK: Return mock data for testing when API is unavailable
      console.warn('⚠️ API unavailable, using mock data:', apiError.message);
      console.error('Full error:', apiError);
      
      // Extract license number from request for mock data
      const dlno = certificateParameters?.dlno || 'UNKNOWN';
      const dob = certificateParameters?.DOB || '';
      
      const mockData = {
        name: certificateParameters?.FullName || 'Demo User',
        fatherName: 'Father Name',
        dob: dob,
        address: 'Sample Address',
        city: 'Sample City',
        state: 'Sample State',
        pincode: '123456',
        licenseNumber: dlno,
        dlno: dlno,
        issueDate: '2015-01-01',
        expiryDate: '2035-01-01',
        validTill: '2035-01-01',
        licenseType: 'LMV-NT',
        cov: 'LMV-NT',
        bloodGroup: 'B+',
        status: 'ACTIVE',
        vehicleClasses: ['LMV-NT', 'MCWG'],
        covDetails: [
          { cov: 'LMV-NT', issueDate: '2015-01-01', validTill: '2035-01-01' }
        ]
      };
      
      res.json({ 
        success: true, 
        data: mockData,
        message: 'Using mock data - API unavailable. Check API credentials and network.',
        error: apiError.message,
        isMock: true,
        apiError: apiError.toString()
      });
    }
  } catch (error) {
    console.error('Error in driver license verification:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('✅ Database connection closed');
    }
    process.exit(0);
  });
});

