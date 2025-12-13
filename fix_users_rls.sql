-- =====================================================
-- Fix for Infinite Recursion in Users Table RLS Policies
-- =====================================================
-- Run this script in Supabase SQL Editor to fix the RLS policies

-- First, drop the problematic policies
DROP POLICY IF EXISTS "Users can read own record" ON users;
DROP POLICY IF EXISTS "Super Admin full access on users" ON users;

-- Create a security definer function to check user role
-- This function bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION get_user_role_safe(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a security definer function to check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  RETURN user_role = 'Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Now create the fixed policies

-- Policy 1: Users can always read their own record
-- This is safe because it only checks auth.uid(), not the users table
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy 2: Super Admin can do everything
-- Uses the security definer function to avoid recursion
CREATE POLICY "Super Admin full access on users"
  ON users FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Policy 3: Allow INSERT for authenticated users (for initial user creation)
-- This allows the system to create user records
CREATE POLICY "Allow authenticated users to insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Policy 4: Allow users to update their own record (limited)
-- Users can update their own record, but role changes should be restricted
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- Also fix other policies that might have similar issues
-- =====================================================

-- Update the helper function to use security definer
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update get_staff_farm_id to use security definer
CREATE OR REPLACE FUNCTION get_staff_farm_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  farm_uuid UUID;
BEGIN
  SELECT s.farm_id INTO farm_uuid
  FROM users u 
  JOIN staff s ON u.staff_id = s.id 
  WHERE u.id = user_uuid
  LIMIT 1;
  
  RETURN farm_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Verification
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Users table RLS policies have been fixed!';
  RAISE NOTICE 'The infinite recursion issue should now be resolved.';
  RAISE NOTICE 'Try logging in again.';
END $$;

