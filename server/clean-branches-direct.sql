-- Direct SQL commands to clean branch names
-- Run: sqlite3 tms_database.db < clean-branches-direct.sql

-- First, let's see what we have
SELECT 'Before cleanup:' as Status;
SELECT id, branchName FROM branches;

-- Clean branches table - remove trailing zeros
UPDATE branches SET branchName = TRIM(REPLACE(branchName || ' ', '0 ', '')) WHERE branchName LIKE '%0';
UPDATE branches SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Also try a more aggressive approach
UPDATE branches SET branchName = REPLACE(branchName, '0', '') WHERE branchName LIKE '%0' AND branchName NOT LIKE '%10%' AND branchName NOT LIKE '%20%' AND branchName NOT LIKE '%30%';
-- Actually, that's too aggressive. Let's be more careful.

-- Better approach: Remove only trailing zeros
UPDATE branches SET branchName = RTRIM(branchName, '0') WHERE branchName LIKE '%0';

-- Verify after cleanup
SELECT 'After cleanup:' as Status;
SELECT id, branchName FROM branches;
