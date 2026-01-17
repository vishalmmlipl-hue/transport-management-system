#!/bin/bash
# Script to clean all branch names in database
# Run: bash fix-branch-names.sh

cd /home/mmlipl/htdocs/mmlipl.in/server

echo "🔧 Cleaning branch names in database..."

sqlite3 tms_database.db << 'EOF'
-- Clean branches table
UPDATE branches SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Clean branch names in other tables
UPDATE staff SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0' AND branchName IS NOT NULL;
UPDATE staffAttendance SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0' AND branchName IS NOT NULL;

-- Verify cleanup
SELECT 'Branches after cleanup:' as Info;
SELECT id, branchName FROM branches;

SELECT 'Total branches cleaned:' as Info, COUNT(*) as Count FROM branches WHERE branchName NOT LIKE '%0';
EOF

echo ""
echo "✅ Branch names cleaned!"
echo "🔄 Restarting backend server..."
pm2 restart mmlipl-api

echo ""
echo "✅ Done! Branch names should now be clean."
