#!/bin/bash
# Script to verify drivers table structure

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"

echo "🔍 Checking drivers table structure..."
echo ""

sqlite3 "$DB_PATH" "PRAGMA table_info(drivers);"

echo ""
echo "✅ Drivers table structure check complete!"
