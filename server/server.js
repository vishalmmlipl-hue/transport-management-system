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

// Generic CRUD endpoints for any table
const createCRUDRoutes = (tableName) => {
  // Get all records
  app.get(`/api/${tableName}`, async (req, res) => {
    try {
      const rows = await dbAll(`SELECT * FROM ${tableName} ORDER BY createdAt DESC`);
      res.json({ success: true, data: rows });
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Get single record by ID
  app.get(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const row = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      if (row) {
        res.json({ success: true, data: row });
      } else {
        res.status(404).json({ success: false, error: 'Record not found' });
      }
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Create new record
  app.post(`/api/${tableName}`, async (req, res) => {
    try {
      const data = req.body;
      const keys = Object.keys(data).filter(k => k !== 'id');
      const values = keys.map(k => data[k]);
      const placeholders = keys.map(() => '?').join(', ');
      const columns = keys.join(', ');

      const query = `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders})`;
      const result = await dbRun(query, values);
      
      const newRecord = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [result.id]);
      res.json({ success: true, data: newRecord });
    } catch (error) {
      console.error(`Error creating ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Update record
  app.put(`/api/${tableName}/:id`, async (req, res) => {
    try {
      const data = req.body;
      const keys = Object.keys(data).filter(k => k !== 'id');
      const setClause = keys.map(k => `${k} = ?`).join(', ');
      const values = [...keys.map(k => data[k]), req.params.id];

      const query = `UPDATE ${tableName} SET ${setClause}, updatedAt = CURRENT_TIMESTAMP WHERE id = ?`;
      await dbRun(query, values);
      
      const updatedRecord = await dbGet(`SELECT * FROM ${tableName} WHERE id = ?`, [req.params.id]);
      res.json({ success: true, data: updatedRecord });
    } catch (error) {
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
      console.error(`Error deleting ${tableName}:`, error);
      res.status(500).json({ success: false, error: error.message });
    }
  });
};

// Create CRUD routes for all tables
const tables = [
  'users', 'branches', 'cities', 'vehicles', 'drivers', 'staff',
  'lrBookings', 'ftlLRBookings', 'ptlLRBookings', 'manifests', 'trips',
  'invoices', 'payments', 'pods', 'clients', 'accounts', 'expenseTypes',
  'branchExpenses', 'marketVehicleVendors', 'otherVendors'
];

tables.forEach(table => createCRUDRoutes(table));

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

