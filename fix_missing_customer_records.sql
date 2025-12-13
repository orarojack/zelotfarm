-- Fix Missing Customer Records
-- Run this if you have users in auth.users but no corresponding records in customers table

-- This will create customer records for all auth users that don't have a customer record
-- It uses the email from auth.users and creates a basic customer record

INSERT INTO customers (id, email, full_name, is_active)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'Customer ' || SUBSTRING(au.id::text, 1, 8)) as full_name,
  true as is_active
FROM auth.users au
LEFT JOIN customers c ON au.id = c.id
WHERE c.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the records were created
SELECT id, email, full_name, created_at 
FROM customers 
ORDER BY created_at DESC;

