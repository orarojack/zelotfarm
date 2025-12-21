-- Migration: Add cow_name column to cattle table
-- This script adds a cow_name field to the cattle table

ALTER TABLE cattle ADD COLUMN IF NOT EXISTS cow_name TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_cattle_cow_name ON cattle(cow_name);

