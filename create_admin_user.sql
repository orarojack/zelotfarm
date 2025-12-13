-- =====================================================
-- Create Admin User Record
-- =====================================================
-- This script helps you create a user record in the users table
-- for an existing Supabase Auth user

-- STEP 1: Find your Supabase Auth user ID
-- Run this query first to see all auth users and their emails:
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC;

-- STEP 2: Replace the values below with your actual information
-- Then run the INSERT statement

-- Example: Creating a Super Admin user
-- Replace 'YOUR_AUTH_USER_ID_HERE' with the UUID from Step 1
-- Replace 'your-email@example.com' with your actual email
-- Replace 'Super Admin' with the role you want (Super Admin, Branch Manager, etc.)

DO $$
DECLARE
  auth_user_id UUID;
  auth_user_email TEXT;
  user_role TEXT := 'Super Admin'; -- Change this to your desired role
  staff_record_id UUID;
BEGIN
  -- ==========================================
  -- REPLACE THESE VALUES WITH YOUR ACTUAL DATA
  -- ==========================================
  -- Option 1: Use your email to find the auth user
  auth_user_email := 'your-email@example.com'; -- REPLACE WITH YOUR EMAIL
  
  -- Get the auth user ID from email
  SELECT id INTO auth_user_id
  FROM auth.users
  WHERE email = auth_user_email
  LIMIT 1;
  
  -- If email method doesn't work, use Option 2 below
  -- Option 2: Use the auth user ID directly
  -- auth_user_id := 'YOUR_AUTH_USER_ID_HERE'::UUID; -- REPLACE WITH YOUR UUID FROM STEP 1
  
  -- ==========================================
  -- END OF VALUES TO REPLACE
  -- ==========================================
  
  -- Check if auth user exists
  IF auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user not found. Please check your email or user ID.';
  END IF;
  
  -- Get the email from auth.users
  SELECT email INTO auth_user_email
  FROM auth.users
  WHERE id = auth_user_id;
  
  RAISE NOTICE 'Found auth user: % (ID: %)', auth_user_email, auth_user_id;
  
  -- Check if user record already exists
  IF EXISTS (SELECT 1 FROM users WHERE id = auth_user_id) THEN
    RAISE NOTICE 'User record already exists. Updating role...';
    
    UPDATE users
    SET 
      email = auth_user_email,
      role = user_role,
      updated_at = NOW()
    WHERE id = auth_user_id;
    
    RAISE NOTICE 'User record updated successfully!';
  ELSE
    -- Create optional staff record (if you want to link to staff table)
    -- This is optional - you can skip this if you don't need it
    INSERT INTO staff (name, email, role, is_active)
    VALUES (
      'Admin User', -- Change this to your name
      auth_user_email,
      user_role,
      true
    )
    RETURNING id INTO staff_record_id;
    
    RAISE NOTICE 'Created staff record: %', staff_record_id;
    
    -- Create user record
    INSERT INTO users (id, email, role, staff_id)
    VALUES (
      auth_user_id,
      auth_user_email,
      user_role,
      staff_record_id
    );
    
    RAISE NOTICE 'User record created successfully!';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUCCESS! You can now log in with:';
  RAISE NOTICE 'Email: %', auth_user_email;
  RAISE NOTICE 'Role: %', user_role;
  RAISE NOTICE '========================================';
  
END $$;

-- =====================================================
-- QUICK METHOD: If you know your auth user ID
-- =====================================================
-- Uncomment and use this simpler version if you have your auth user ID:

/*
INSERT INTO users (id, email, role)
VALUES (
  'YOUR_AUTH_USER_ID_HERE'::UUID,  -- Replace with your auth user ID
  'your-email@example.com',         -- Replace with your email
  'Super Admin'                     -- Replace with your desired role
)
ON CONFLICT (id) DO UPDATE
SET 
  email = EXCLUDED.email,
  role = EXCLUDED.role;
*/


