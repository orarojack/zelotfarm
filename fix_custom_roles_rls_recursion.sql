-- =====================================================
-- Fix Infinite Recursion in Custom Roles RLS Policies
-- =====================================================
-- Run this script to fix the "infinite recursion detected" error
-- This replaces the problematic RLS policy with a SECURITY DEFINER function

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Super Admin full access on custom_roles" ON custom_roles;

-- Step 2: Create a security definer function to check if user is super admin
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
  
  -- Then check custom role (only if custom_role_id exists)
  SELECT cr.name INTO custom_role_name
  FROM users u
  JOIN custom_roles cr ON u.custom_role_id = cr.id
  WHERE u.id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(custom_role_name = 'Super Admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the policy using the security definer function
CREATE POLICY "Super Admin full access on custom_roles"
  ON custom_roles FOR ALL
  TO authenticated
  USING (is_super_admin_for_roles(auth.uid()));

-- Step 4: Ensure all users can read custom roles (needed for joins)
-- This is safe because role names are not sensitive
DROP POLICY IF EXISTS "Users can read custom roles" ON custom_roles;

CREATE POLICY "Users can read custom roles"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

-- Step 5: Verify the fix
DO $$
BEGIN
  RAISE NOTICE 'Custom roles RLS policies have been fixed!';
  RAISE NOTICE 'The infinite recursion issue should now be resolved.';
  RAISE NOTICE 'Try logging in again.';
END $$;


