# How to Login to Zealot AgriWorks Management System

## Step 1: Create Your First Admin User

Before you can login, you need to create a user account in Supabase. There are two ways to do this:

### Method 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Navigate to Authentication**
   - Click on "Authentication" in the left sidebar
   - Click on "Users" tab

3. **Add a New User**
   - Click "Add user" or "Invite user" button
   - Enter the email address (e.g., `admin@zealotagriworks.com`)
   - Enter a password (make it strong!)
   - Click "Create user"

4. **Note the User ID**
   - After creating the user, you'll see a UUID (like `123e4567-e89b-12d3-a456-426614174000`)
   - Copy this ID - you'll need it in the next step

### Method 2: Using SQL (Alternative)

You can also create a user directly via SQL in the Supabase SQL Editor:

```sql
-- This creates a user in auth.users
-- Note: You'll need to use Supabase Auth API or Dashboard to set the password
-- The password should be set through the Dashboard or Auth API
```

## Step 2: Link User to System (Create User Record)

After creating the user in Supabase Auth, you need to create a corresponding record in the `users` table:

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

2. **Run this SQL** (Replace with your actual values):

```sql
-- Replace 'USER_ID_FROM_AUTH' with the UUID you copied in Step 1
-- Replace 'admin@zealotagriworks.com' with your actual email
-- Replace 'Super Admin' with the role you want (Super Admin, Branch Manager, etc.)

INSERT INTO users (id, email, role)
VALUES (
  'USER_ID_FROM_AUTH',  -- The UUID from auth.users
  'admin@zealotagriworks.com',
  'Super Admin'
);
```

3. **(Optional) Create Staff Record**

If you want to link the user to a staff record:

```sql
-- First create the staff record
INSERT INTO staff (name, email, role, is_active)
VALUES (
  'Admin User',
  'admin@zealotagriworks.com',
  'Super Admin',
  true
)
RETURNING id;

-- Then update the users table to link to staff
-- Replace STAFF_ID with the ID returned from above
UPDATE users 
SET staff_id = 'STAFF_ID'
WHERE email = 'admin@zealotagriworks.com';
```

## Step 3: Access the Login Page

1. **Start the Development Server** (if not already running):
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

2. **Open Your Browser**
   - Navigate to: `http://localhost:5173/admin/login`
   - Or go to `http://localhost:5173` and click on any admin link (it will redirect to login)

## Step 4: Login

1. **Enter Your Credentials**
   - **Email**: The email you used when creating the user (e.g., `admin@zealotagriworks.com`)
   - **Password**: The password you set in Supabase Auth

2. **Click "Sign In"**

3. **You'll be redirected to the Dashboard** if login is successful

## Troubleshooting

### Error: "Invalid login credentials"
- **Check**: Make sure the email and password are correct
- **Solution**: Reset the password in Supabase Dashboard → Authentication → Users → Reset password

### Error: "User not found in users table"
- **Check**: Make sure you ran Step 2 (created record in `users` table)
- **Solution**: Run the INSERT statement from Step 2

### Error: "Failed to fetch user data"
- **Check**: Make sure your `.env` file has correct Supabase credentials
- **Check**: Make sure RLS policies allow reading from `users` table
- **Solution**: Verify your Supabase URL and anon key in `.env` file

### Can't see the login page
- **Check**: Make sure the dev server is running
- **Check**: Make sure you're going to `/admin/login` route
- **Solution**: Try `http://localhost:5173/admin/login` directly

## Quick Setup Script

Here's a complete SQL script to set up your first admin user (run this after creating the user in Supabase Auth):

```sql
-- Step 1: Get your user ID from auth.users
-- Run this first to see your user ID:
SELECT id, email FROM auth.users;

-- Step 2: Replace 'YOUR_USER_ID_HERE' with the actual ID from above
-- Then run this:
DO $$
DECLARE
  user_uuid UUID;
  staff_uuid UUID;
BEGIN
  -- Get the user ID (replace with your actual user ID)
  user_uuid := 'YOUR_USER_ID_HERE'::UUID;
  
  -- Create staff record
  INSERT INTO staff (name, email, role, is_active)
  VALUES (
    'Admin User',
    (SELECT email FROM auth.users WHERE id = user_uuid),
    'Super Admin',
    true
  )
  RETURNING id INTO staff_uuid;
  
  -- Create user record
  INSERT INTO users (id, email, role, staff_id)
  VALUES (
    user_uuid,
    (SELECT email FROM auth.users WHERE id = user_uuid),
    'Super Admin',
    staff_uuid
  )
  ON CONFLICT (id) DO UPDATE
  SET role = 'Super Admin', staff_id = staff_uuid;
  
  RAISE NOTICE 'Admin user created successfully!';
END $$;
```

## Available User Roles

You can assign any of these roles when creating a user:

- **Super Admin** - Full access to everything
- **Branch Manager** - Manage assigned farms
- **Vet** - Record treatments and vaccinations
- **Storekeeper** - Manage inventory
- **Accountant** - Manage finances, salaries, wages
- **Field Staff** - Record milk, eggs, broilers

## Password Reset

If you forget your password:

1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Click on the user
4. Click "Reset password" or "Send password reset email"
5. Check your email for the reset link

## Security Notes

- Always use strong passwords
- Never share your admin credentials
- Use different roles for different users based on their responsibilities
- Regularly review user access in Supabase Dashboard

