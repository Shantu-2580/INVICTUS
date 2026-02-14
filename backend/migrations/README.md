-- Quick migration runner script
-- Run this to apply the migration for adding revision and description fields to PCBs

-- Step 1: Connect to your database using psql or your preferred tool
-- Step 2: Run the migration file

-- Option 1: Using psql command line
-- psql -U your_username -d your_database_name -f migrations/001_add_pcb_fields.sql

-- Option 2: Using Node.js (if you have db connection)
-- node runMigration.js

-- For your convenience, here's the migration again:
ALTER TABLE pcbs 
ADD COLUMN IF NOT EXISTS revision VARCHAR(50),
ADD COLUMN IF NOT EXISTS description TEXT;
