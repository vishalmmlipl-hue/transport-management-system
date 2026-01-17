#!/bin/bash

# Fix vehicles table by adding missing columns
# This script safely adds columns to the vehicles table

DB_PATH="/home/mmlipl/htdocs/mmlipl.in/server/tms_database.db"

echo "🔧 Fixing vehicles table structure..."

# Function to add column if it doesn't exist
add_column_if_not_exists() {
    local column_name=$1
    local column_type=$2
    
    # Check if column exists
    if sqlite3 "$DB_PATH" "PRAGMA table_info(vehicles);" | grep -q "$column_name"; then
        echo "✅ Column '$column_name' already exists"
    else
        echo "➕ Adding column '$column_name'..."
        sqlite3 "$DB_PATH" "ALTER TABLE vehicles ADD COLUMN $column_name $column_type;" 2>/dev/null
        if [ $? -eq 0 ]; then
            echo "✅ Added column '$column_name'"
        else
            echo "⚠️  Failed to add column '$column_name' (may already exist)"
        fi
    fi
}

# Add all missing columns
add_column_if_not_exists "ownershipType" "TEXT"
add_column_if_not_exists "capacityUnit" "TEXT"
add_column_if_not_exists "owner" "TEXT"
add_column_if_not_exists "insurance" "TEXT"
add_column_if_not_exists "tp" "TEXT"
add_column_if_not_exists "fitness" "TEXT"
add_column_if_not_exists "permit" "TEXT"
add_column_if_not_exists "rcBook" "TEXT"
add_column_if_not_exists "remarks" "TEXT"
add_column_if_not_exists "data" "TEXT"

echo ""
echo "📋 Current vehicles table structure:"
sqlite3 "$DB_PATH" "PRAGMA table_info(vehicles);"

echo ""
echo "✅ Vehicles table fixed!"
echo "🔄 Restarting backend server..."
pm2 restart mmlipl-api
