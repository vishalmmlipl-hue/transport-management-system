#!/bin/bash
# Migration script to add new columns to drivers table

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"

echo "🔧 Migrating drivers table to add new fields..."
echo ""

# Check if columns already exist
check_column() {
    local col_name=$1
    if sqlite3 "$DB_PATH" "PRAGMA table_info(drivers);" | grep -q "$col_name"; then
        echo "  ✅ Column $col_name already exists"
        return 0
    else
        return 1
    fi
}

# Add columns if they don't exist
add_column() {
    local col_name=$1
    local col_type=$2
    if ! check_column "$col_name"; then
        echo "  ➕ Adding column: $col_name"
        sqlite3 "$DB_PATH" "ALTER TABLE drivers ADD COLUMN $col_name $col_type;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "  ✅ Added $col_name"
        else
            echo "  ❌ Error adding $col_name"
        fi
    fi
}

# Add all new columns
add_column "nickName" "TEXT"
add_column "fatherName" "TEXT"
add_column "alternateMobile" "TEXT"
add_column "city" "TEXT"
add_column "state" "TEXT"
add_column "pincode" "TEXT"
add_column "licenseExpiryDate" "TEXT"
add_column "licenseIssueDate" "TEXT"
add_column "licenseType" "TEXT"
add_column "bloodGroup" "TEXT"
add_column "dateOfBirth" "TEXT"
add_column "gender" "TEXT"
add_column "aadharNumber" "TEXT"
add_column "emailId" "TEXT"
add_column "emergencyContactName" "TEXT"
add_column "emergencyContactNumber" "TEXT"
add_column "salary" "TEXT"
add_column "salaryType" "TEXT"
add_column "joinDate" "TEXT"
add_column "remarks" "TEXT"
add_column "data" "TEXT"

# Remove UNIQUE constraint from licenseNumber if it exists (make it optional)
echo ""
echo "🔧 Making licenseNumber optional (removing UNIQUE constraint if needed)..."
sqlite3 "$DB_PATH" "CREATE TABLE IF NOT EXISTS drivers_new (
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
);" 2>/dev/null

# Copy data if new table was created
if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='drivers_new';" | grep -q "drivers_new"; then
    echo "  📋 Copying data to new table..."
    sqlite3 "$DB_PATH" "INSERT INTO drivers_new SELECT 
      id, driverName, NULL as nickName, NULL as fatherName, mobile, NULL as alternateMobile, address,
      NULL as city, NULL as state, NULL as pincode, licenseNumber, NULL as licenseExpiryDate, NULL as licenseIssueDate,
      NULL as licenseType, NULL as bloodGroup, NULL as dateOfBirth, NULL as gender, NULL as aadharNumber,
      NULL as emailId, NULL as emergencyContactName, NULL as emergencyContactNumber, NULL as salary,
      NULL as salaryType, NULL as joinDate, status, NULL as remarks, NULL as data, createdAt, updatedAt
      FROM drivers;" 2>/dev/null
    
    echo "  🔄 Replacing old table..."
    sqlite3 "$DB_PATH" "DROP TABLE drivers; ALTER TABLE drivers_new RENAME TO drivers;" 2>/dev/null
    echo "  ✅ Table migrated successfully"
else
    echo "  ℹ️  Using ALTER TABLE to add columns (safer for existing data)"
fi

echo ""
echo "✅ Migration complete!"
echo ""
echo "📊 Current drivers table structure:"
sqlite3 "$DB_PATH" "PRAGMA table_info(drivers);"
