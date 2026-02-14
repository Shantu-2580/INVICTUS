-- Migration: Add revision and description fields to PCBs table
-- Date: 2026-02-14

ALTER TABLE pcbs 
ADD COLUMN revision VARCHAR(50),
ADD COLUMN description TEXT;

-- Update existing PCBs to have NULL values (optional fields)
-- No data migration needed as these are new optional fields
