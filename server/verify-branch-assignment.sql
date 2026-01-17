-- SQL script to verify branch assignment changes are compatible
-- Run this on the server to check for any issues

-- 1. Check users table schema
SELECT 'Users Table Schema:' as Info;
PRAGMA table_info(users);

-- 2. Check current users and their branch assignments
SELECT 'Current Users and Branch Assignments:' as Info;
SELECT id, username, userRole, branch, 
       CASE 
         WHEN branch = 'all' OR branch = 'ALL' THEN 'All Branches'
         WHEN branch IS NULL OR branch = '' THEN 'No Branch Assigned'
         ELSE 'Specific Branch: ' || branch
       END as branchStatus
FROM users
ORDER BY userRole, username;

-- 3. Check if any users have branch values that are not 'all' or valid branch IDs
SELECT 'Users with Invalid Branch References:' as Info;
SELECT u.id, u.username, u.userRole, u.branch
FROM users u
LEFT JOIN branches b ON u.branch = b.id OR (u.branch = 'all' OR u.branch = 'ALL')
WHERE u.branch IS NOT NULL 
  AND u.branch != ''
  AND u.branch != 'all'
  AND u.branch != 'ALL'
  AND b.id IS NULL;

-- 4. Check branches table to see valid branch IDs
SELECT 'Valid Branch IDs:' as Info;
SELECT id, branchCode, branchName FROM branches ORDER BY id;

-- 5. Count users by branch assignment type
SELECT 'User Count by Branch Assignment Type:' as Info;
SELECT 
  CASE 
    WHEN branch = 'all' OR branch = 'ALL' THEN 'All Branches'
    WHEN branch IS NULL OR branch = '' THEN 'No Branch Assigned'
    ELSE 'Specific Branch'
  END as assignmentType,
  COUNT(*) as userCount
FROM users
GROUP BY assignmentType;

-- 6. Check for any foreign key constraints (SQLite doesn't enforce by default, but good to check)
SELECT 'Foreign Key Constraints (if any):' as Info;
SELECT sql FROM sqlite_master 
WHERE type = 'table' 
  AND sql LIKE '%FOREIGN KEY%'
  AND sql LIKE '%branch%';
