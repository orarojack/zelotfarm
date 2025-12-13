# Fix for Infinite Recursion Error in Users Table

## Problem
The error `infinite recursion detected in policy for relation "users"` occurs because the RLS policies on the `users` table try to read from the `users` table itself to check permissions, creating a circular dependency.

## Solution

Run the fix SQL script to update the RLS policies:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New query"

### Step 2: Run the Fix Script
1. Open the file `fix_users_rls.sql` in this project
2. Copy the entire contents
3. Paste into Supabase SQL Editor
4. Click "Run" or press Ctrl+Enter

### Step 3: Verify the Fix
After running the script, try logging in again. The error should be resolved.

## What the Fix Does

1. **Drops the problematic policies** that cause recursion
2. **Creates security definer functions** that can bypass RLS to check user roles:
   - `get_user_role_safe()` - Gets user role without triggering RLS
   - `is_super_admin()` - Checks if user is Super Admin without triggering RLS
3. **Creates new policies** that use these functions to avoid recursion:
   - Users can read their own record (simple check, no recursion)
   - Super Admin access uses the security definer function
   - Allows authenticated users to insert their own record
   - Allows users to update their own record

## Alternative Quick Fix (If Above Doesn't Work)

If you need a quick temporary fix, you can temporarily disable RLS on the users table:

```sql
-- TEMPORARY: Disable RLS on users table (NOT RECOMMENDED FOR PRODUCTION)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

**Warning**: This removes all security on the users table. Only use this for testing, then re-enable RLS with the proper fix.

To re-enable:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- Then run the fix_users_rls.sql script
```

## Why This Happens

RLS policies are evaluated every time a query runs. When a policy on the `users` table tries to query the `users` table to check permissions, it triggers the policy evaluation again, which queries `users` again, creating an infinite loop.

Security definer functions run with the privileges of the function creator (usually a superuser), so they can bypass RLS checks, breaking the recursion cycle.

## Testing

After applying the fix:
1. Try logging in with your credentials
2. You should be able to access the dashboard
3. Check the browser console - the recursion error should be gone

If you still see errors, check:
- That the functions were created successfully
- That the policies were dropped and recreated
- That your user record exists in the `users` table

