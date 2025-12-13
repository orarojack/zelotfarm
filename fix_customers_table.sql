-- Fix customers table: Remove password_hash column
-- Run this if you already created the customers table with password_hash

-- Drop the NOT NULL constraint and column if it exists
ALTER TABLE customers DROP COLUMN IF EXISTS password_hash;

-- If the column doesn't exist, this will do nothing
-- The customers table should only store profile info, not passwords
-- Supabase Auth handles password storage separately

