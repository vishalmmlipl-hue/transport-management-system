#!/bin/bash

# Script to check database location and verify data
# Run this on the server

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"
SERVER_DIR="/home/mmlipl/htdocs/mmlipl.in/server"

echo "🔍 Checking database location and data..."
echo ""

# Check if database file exists
if [ -f "$DB_PATH" ]; then
    echo "✅ Database file exists at: $DB_PATH"
    echo "📊 Database size: $(du -h "$DB_PATH" | cut -f1)"
    echo ""
    
    # Check tables
    echo "📋 Tables in database:"
    sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;" | while read table; do
        count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;" 2>/dev/null || echo "0")
        echo "  - $table: $count records"
    done
    echo ""
    
    # Check if staffAttendance table exists
    if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='staffAttendance';" | grep -q "staffAttendance"; then
        echo "✅ staffAttendance table exists"
    else
        echo "❌ staffAttendance table does NOT exist - will create it"
        echo ""
        echo "Creating staffAttendance table..."
        sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS staffAttendance (
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
);
EOF
        echo "✅ staffAttendance table created"
    fi
    
    echo ""
    echo "📊 Sample data counts:"
    echo "  - Branches: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM branches;" 2>/dev/null || echo "0")"
    echo "  - Cities: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM cities;" 2>/dev/null || echo "0")"
    echo "  - Vehicles: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM vehicles;" 2>/dev/null || echo "0")"
    echo "  - Drivers: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM drivers;" 2>/dev/null || echo "0")"
    echo "  - Staff: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM staff;" 2>/dev/null || echo "0")"
    echo "  - LR Bookings: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM lrBookings;" 2>/dev/null || echo "0")"
    echo "  - Manifests: $(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM manifests;" 2>/dev/null || echo "0")"
    
else
    echo "❌ Database file NOT found at: $DB_PATH"
    echo ""
    echo "🔍 Searching for database files..."
    find /home/mmlipl -name "tms_database.db" 2>/dev/null | head -5
    echo ""
    echo "💡 If database is missing, you may need to restore from backup or reinitialize"
fi

echo ""
echo "✅ Check complete!"
