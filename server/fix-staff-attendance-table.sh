#!/bin/bash

# Script to add staffAttendance table if it doesn't exist
# Run this on the server: bash fix-staff-attendance-table.sh

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"

echo "🔍 Checking if staffAttendance table exists..."

# Check if table exists
if sqlite3 "$DB_PATH" "SELECT name FROM sqlite_master WHERE type='table' AND name='staffAttendance';" | grep -q "staffAttendance"; then
    echo "✅ staffAttendance table already exists"
else
    echo "📝 Creating staffAttendance table..."
    
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

    if [ $? -eq 0 ]; then
        echo "✅ staffAttendance table created successfully"
    else
        echo "❌ Error creating staffAttendance table"
        exit 1
    fi
fi

echo "✅ Done!"
