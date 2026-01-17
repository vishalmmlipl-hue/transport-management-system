/**
 * Migration script to add missing columns to staff table
 * Run this on the server: node update-staff-table.js
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'tms_database.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error opening database:', err.message);
    process.exit(1);
  }
  console.log('✅ Connected to SQLite database');
});

// Add missing columns to staff table
const addColumns = [
  'ALTER TABLE staff ADD COLUMN fatherName TEXT',
  'ALTER TABLE staff ADD COLUMN dateOfBirth TEXT',
  'ALTER TABLE staff ADD COLUMN bloodGroup TEXT',
  'ALTER TABLE staff ADD COLUMN contactDetails TEXT',
  'ALTER TABLE staff ADD COLUMN aadharNumber TEXT',
  'ALTER TABLE staff ADD COLUMN panNumber TEXT',
  'ALTER TABLE staff ADD COLUMN bankDetails TEXT',
  'ALTER TABLE staff ADD COLUMN salaryType TEXT',
  'ALTER TABLE staff ADD COLUMN salaryDetails TEXT',
  'ALTER TABLE staff ADD COLUMN joiningDate TEXT',
  'ALTER TABLE staff ADD COLUMN remarks TEXT',
  'ALTER TABLE staff ADD COLUMN data TEXT'
];

db.serialize(() => {
  console.log('🔧 Adding missing columns to staff table...');
  
  addColumns.forEach((sql, index) => {
    db.run(sql, (err) => {
      if (err) {
        // Column might already exist, that's okay
        if (err.message.includes('duplicate column')) {
          console.log(`   ✓ Column already exists (${index + 1}/${addColumns.length})`);
        } else {
          console.error(`   ❌ Error: ${err.message}`);
        }
      } else {
        console.log(`   ✅ Added column (${index + 1}/${addColumns.length})`);
      }
    });
  });
  
  setTimeout(() => {
    console.log('\n✅ Staff table update complete!');
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  }, 2000);
});
