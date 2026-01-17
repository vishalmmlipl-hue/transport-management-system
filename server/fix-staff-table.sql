-- Fix staff table - add missing columns
-- Run this with: sqlite3 tms_database.db < fix-staff-table.sql

-- Add missing columns if they don't exist
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN in older versions
-- So we'll try to add them and ignore errors if they already exist

-- Add fatherName
ALTER TABLE staff ADD COLUMN fatherName TEXT;

-- Add dateOfBirth
ALTER TABLE staff ADD COLUMN dateOfBirth TEXT;

-- Add bloodGroup
ALTER TABLE staff ADD COLUMN bloodGroup TEXT;

-- Add contactDetails (if not already exists as JSON)
-- Check if column exists first by trying to add it
ALTER TABLE staff ADD COLUMN contactDetails TEXT;

-- Add address (if not already exists as JSON)
ALTER TABLE staff ADD COLUMN address TEXT;

-- Add aadharNumber
ALTER TABLE staff ADD COLUMN aadharNumber TEXT;

-- Add panNumber
ALTER TABLE staff ADD COLUMN panNumber TEXT;

-- Add bankDetails (if not already exists as JSON)
ALTER TABLE staff ADD COLUMN bankDetails TEXT;

-- Add salaryType
ALTER TABLE staff ADD COLUMN salaryType TEXT;

-- Add salaryDetails (if not already exists as JSON)
ALTER TABLE staff ADD COLUMN salaryDetails TEXT;

-- Add joiningDate
ALTER TABLE staff ADD COLUMN joiningDate TEXT;

-- Add remarks
ALTER TABLE staff ADD COLUMN remarks TEXT;

-- Add data column for JSON storage
ALTER TABLE staff ADD COLUMN data TEXT;

-- Verify the table structure
.schema staff
