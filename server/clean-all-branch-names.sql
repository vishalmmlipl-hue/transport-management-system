-- Clean all branch names in database - remove trailing "0"
-- Run this on server: sqlite3 tms_database.db < clean-all-branch-names.sql

-- Clean branches table
UPDATE branches SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Clean branch names in other tables that might have branchName field
UPDATE staff SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';
UPDATE staffAttendance SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';
UPDATE lrSeries SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Verify the cleanup
SELECT 'Branches:' as TableName, id, branchName FROM branches;
SELECT 'Staff:' as TableName, id, branchName FROM staff WHERE branchName IS NOT NULL;
SELECT 'Staff Attendance:' as TableName, id, branchName FROM staffAttendance WHERE branchName IS NOT NULL;
SELECT 'LR Series:' as TableName, id, branchName FROM lrSeries WHERE branchName IS NOT NULL;
