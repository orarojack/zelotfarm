# Fix "Account Setup Required" Error

## Problem

You're seeing this message:
> "Account Setup Required - Your account is authenticated, but your user record is not found in the system."

This means your Supabase Auth account exists, but there's no corresponding record in the `users` table.

## Solution

### Method 1: Using SQL Script (Recommended)

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

2. **Find Your Auth User ID**
   
   Run this query first to see your auth user:
   ```sql
   SELECT id, email, created_at 
   FROM auth.users 
   ORDER BY created_at DESC;
   ```
   
   Copy your `id` (UUID) and `email` from the results.

3. **Run the Setup Script**
   
   Open `create_admin_user.sql` and:
   - Replace `'your-email@example.com'` with your actual email
   - Replace `'Super Admin'` with your desired role (if different)
   - Run the script

   OR use this quick version (replace the values):
   ```sql
   INSERT INTO users (id, email, role)
   VALUES (
     'YOUR_AUTH_USER_ID_HERE'::UUID,  -- Paste your UUID from step 2
     'your-email@example.com',         -- Your email
     'Super Admin'                     -- Your role
   )
   ON CONFLICT (id) DO UPDATE
   SET 
     email = EXCLUDED.email,
     role = EXCLUDED.role;
   ```

4. **Verify the Record**
   
   Run this to confirm:
   ```sql
   SELECT * FROM users WHERE email = 'your-email@example.com';
   ```

5. **Try Logging In Again**
   - Go to `/admin/login`
   - Use your email and password
   - You should now be able to log in!

### Method 2: Using Supabase Dashboard

1. **Get Your Auth User ID**
   - Go to Supabase Dashboard → Authentication → Users
   - Find your user and copy the UUID

2. **Create User Record via SQL**
   - Go to SQL Editor
   - Run the INSERT statement from Method 1

### Method 3: Quick Fix for Multiple Users

If you have multiple auth users that need user records:

```sql
-- This creates user records for ALL auth users that don't have one
-- They'll all be set as 'Super Admin' - you can change roles later

INSERT INTO users (id, email, role)
SELECT 
  au.id,
  au.email,
  'Super Admin' as role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

**⚠️ Warning**: This sets everyone as Super Admin. Change roles individually after running this.

## Available Roles

You can use any of these roles:
- `Super Admin` - Full access to everything
- `Branch Manager` - Manage farms and operations
- `Vet` - Manage cattle health
- `Storekeeper` - Manage inventory
- `Accountant` - Manage finances
- `Field Staff` - Record daily operations

Or any custom role you've created in the Roles & Permissions page.

## Troubleshooting

### Issue: "relation 'users' does not exist"
**Solution**: Run `database_setup.sql` first to create all tables.

### Issue: "duplicate key value violates unique constraint"
**Solution**: The user record already exists. Try logging in - it should work now.

### Issue: Still can't log in after creating record
**Solution**: 
1. Clear browser cache and cookies
2. Try logging out and back in
3. Check browser console for errors
4. Verify the user record exists: `SELECT * FROM users WHERE email = 'your-email';`

### Issue: Wrong role assigned
**Solution**: Update the role:
```sql
UPDATE users 
SET role = 'Super Admin'  -- Change to desired role
WHERE email = 'your-email@example.com';
```

## Verification Queries

Check if everything is set up correctly:

```sql
-- 1. Check auth user exists
SELECT id, email FROM auth.users WHERE email = 'your-email@example.com';

-- 2. Check user record exists
SELECT * FROM users WHERE email = 'your-email@example.com';

-- 3. Check if they match
SELECT 
  au.id as auth_id,
  au.email as auth_email,
  u.id as user_id,
  u.email as user_email,
  u.role
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'your-email@example.com';
```

If the last query shows both `auth_id` and `user_id` matching, you're all set!

## Still Having Issues?

1. **Check RLS Policies**: Make sure RLS policies allow you to read your own user record
2. **Check Browser Console**: Look for any JavaScript errors
3. **Verify Environment Variables**: Make sure `.env` has correct Supabase URL and key
4. **Check Network Tab**: See if API calls are failing

If none of these work, the issue might be with the RLS policies. Run `fix_users_rls.sql` to ensure policies are set up correctly.



