-- Migration: Add milk_status column to milking_records table
-- This script adds a milk_status field to track if milk is for consumption or colostrum

ALTER TABLE milking_records ADD COLUMN IF NOT EXISTS milk_status TEXT DEFAULT 'Consumption' CHECK (milk_status IN ('Consumption', 'Colostrum'));

