#!/bin/bash
# Simple script to clean branch names - removes trailing "0"
# Run: bash clean-branch-names-now.sh

cd /home/mmlipl/htdocs/mmlipl.in/server

echo "🔧 Cleaning branch names..."

sqlite3 tms_database.db << 'EOF'
-- Show before
SELECT 'BEFORE:' as Info;
SELECT id, branchName FROM branches;

-- Clean: Remove trailing zeros
UPDATE branches SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Show after
SELECT 'AFTER:' as Info;
SELECT id, branchName FROM branches;
EOF

echo ""
echo "✅ Done! Restarting server..."
pm2 restart mmlipl-api

echo "✅ Complete! Refresh your browser."
