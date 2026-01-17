#!/bin/bash

# Fix staff table by adding missing columns
# This script safely adds columns to the staff table

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"

echo "🔧 Fixing staff table structure..."

# Function to add column if it doesn't exist
add_column_if_not_exists() {
    local column_name=$1
    local column_type=$2
    
    # Check if column exists
    if sqlite3 "$DB_PATH" "PRAGMA table_info(staff);" | grep -q "$column_name"; then
        echo "✅ Column '$column_name' already exists"
    else
        echo "➕ Adding column '$column_name'..."
        sqlite3 "$DB_PATH" "ALTER TABLE staff ADD COLUMN $column_name $column_type;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Added column '$column_name'"
        else
            echo "⚠️  Failed to add column '$column_name' (may already exist)"
        fi
    fi
}

# Add all missing columns
add_column_if_not_exists "fatherName" "TEXT"
add_column_if_not_exists "dateOfBirth" "TEXT"
add_column_if_not_exists "bloodGroup" "TEXT"
add_column_if_not_exists "contactDetails" "TEXT"
add_column_if_not_exists "address" "TEXT"
add_column_if_not_exists "aadharNumber" "TEXT"
add_column_if_not_exists "panNumber" "TEXT"
add_column_if_not_exists "bankDetails" "TEXT"
add_column_if_not_exists "salaryType" "TEXT"
add_column_if_not_exists "salaryDetails" "TEXT"
add_column_if_not_exists "joiningDate" "TEXT"
add_column_if_not_exists "remarks" "TEXT"
add_column_if_not_exists "data" "TEXT"

echo ""
echo "📋 Current staff table structure:"
sqlite3 "$DB_PATH" "PRAGMA table_info(staff);"

echo ""
echo "✅ Staff table fixed!"
echo "🔄 Restarting backend server..."
pm2 restart mmlipl-api
