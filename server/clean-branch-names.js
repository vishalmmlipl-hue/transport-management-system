/**
 * Script to clean branch names - remove trailing "0" from all branch names
 * Run: node server/clean-branch-names.js
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

// Helper function to run queries
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

async function cleanBranchNames() {
  try {
    console.log('🔍 Fetching all branches...');
    const branches = await dbAll('SELECT id, branchName FROM branches');
    
    console.log(`📋 Found ${branches.length} branches`);
    
    let cleanedCount = 0;
    
    for (const branch of branches) {
      if (!branch.branchName) continue;
      
      // Remove trailing "0" from branch name
      const originalName = branch.branchName.trim();
      const cleanedName = originalName.replace(/0+$/, '').trim();
      
      // Only update if the name actually changed
      if (cleanedName !== originalName && cleanedName.length > 0) {
        console.log(`  ✏️  "${originalName}" → "${cleanedName}"`);
        await dbRun('UPDATE branches SET branchName = ? WHERE id = ?', [cleanedName, branch.id]);
        cleanedCount++;
      }
    }
    
    console.log(`\n✅ Cleaned ${cleanedCount} branch names`);
    console.log('✅ All branch names are now clean!');
    
  } catch (error) {
    console.error('❌ Error cleaning branch names:', error);
  } finally {
    db.close((err) => {
      if (err) {
        console.error('❌ Error closing database:', err.message);
      } else {
        console.log('✅ Database connection closed');
      }
      process.exit(0);
    });
  }
}

// Run the cleanup
cleanBranchNames();
