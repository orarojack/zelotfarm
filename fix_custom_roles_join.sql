-- =====================================================
-- Fix Custom Roles Join Issue
-- =====================================================
-- This script ensures the custom_roles table exists and has proper RLS policies
-- Run this if you're getting 500 errors when fetching user data

-- Step 1: Create custom_roles table if it doesn't exist
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Add custom_role_id column to users table if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL;

-- Step 3: Enable RLS on custom_roles
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies for custom_roles
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Super Admin full access on custom_roles" ON custom_roles;
DROP POLICY IF EXISTS "Users can read custom roles" ON custom_roles;

-- Create a security definer function to check if user is super admin
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_super_admin_for_roles(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  custom_role_name TEXT;
BEGIN
  -- First check default role
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  IF user_role = 'Super Admin' THEN
    RETURN true;
  END IF;
  
  -- Then check custom role
  SELECT cr.name INTO custom_role_name
  FROM users u
  JOIN custom_roles cr ON u.custom_role_id = cr.id
  WHERE u.id = user_uuid
  LIMIT 1;
  
  RETURN custom_role_name = 'Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy 1: Super Admin can do everything (uses security definer function to avoid recursion)
CREATE POLICY "Super Admin full access on custom_roles"
  ON custom_roles FOR ALL
  TO authenticated
  USING (is_super_admin_for_roles(auth.uid()));

-- Policy 2: All authenticated users can read custom roles (needed for the join)
-- This is safe because role names are not sensitive
CREATE POLICY "Users can read custom roles"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Insert default system roles if they don't exist
INSERT INTO custom_roles (name, description, is_system_role)
VALUES 
  ('Super Admin', 'Full access to all modules and settings', true),
  ('Branch Manager', 'Manage assigned farms and operations', true),
  ('Vet', 'Manage cattle health and treatments', true),
  ('Storekeeper', 'Manage inventory and stock', true),
  ('Accountant', 'Manage finances, salaries, and expenses', true),
  ('Field Staff', 'Record daily operations (milking, eggs)', true)
ON CONFLICT (name) DO NOTHING;

-- Step 6: Verify the setup
DO $$
BEGIN
  RAISE NOTICE 'Custom roles table setup complete!';
  RAISE NOTICE 'You can now fetch user data with custom role joins.';
END $$;

-- Verification query (run this to check):
-- SELECT 
--   u.id,
--   u.email,
--   u.role,
--   cr.name as custom_role_name
-- FROM users u
-- LEFT JOIN custom_roles cr ON u.custom_role_id = cr.id
-- LIMIT 5;

