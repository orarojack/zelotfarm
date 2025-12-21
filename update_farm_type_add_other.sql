-- Migration: Add 'Other' as a valid farm type
-- This script updates the farms table to allow 'Other' as a farm type option

-- Step 1: Drop the existing constraint
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_type_check;

-- Step 2: Add the new constraint with 'Other' included
ALTER TABLE farms ADD CONSTRAINT farms_type_check CHECK (type IN ('Dairy', 'Broiler', 'Layer', 'Other'));

