# Setup Guide for Zealot AgriWorks Management System

## Environment Variables

Create a `.env` file in the root directory with the following content:

```env
VITE_SUPABASE_URL=your_supabase_project_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### How to Get Supabase Credentials

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Create a new project
3. Go to Project Settings > API
4. Copy the following:
   - **Project URL** → Use as `VITE_SUPABASE_URL`
   - **anon/public key** → Use as `VITE_SUPABASE_ANON_KEY`

### Example .env file:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4eHh4eHh4eHh4eHh4eHh4eHgiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0NTI5ODg4OCwiZXhwIjoxOTYwODc0ODg4fQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Database Setup

1. Run the SQL scripts from `DATABASE_SCHEMA.md` in your Supabase SQL Editor
2. Enable Row Level Security (RLS) on all tables
3. Set up authentication:
   - Go to Authentication > Users in Supabase
   - Create your first admin user
   - The user will be automatically linked to the `users` table

## Initial User Setup

After creating a user in Supabase Auth, you need to create a corresponding record in the `users` table:

```sql
-- Insert user record (replace with actual user ID from auth.users)
INSERT INTO users (id, email, role)
VALUES (
  'user-uuid-from-auth-users',
  'admin@example.com',
  'Super Admin'
);

-- Optionally link to staff table
INSERT INTO staff (name, email, role, is_active)
VALUES (
  'Admin User',
  'admin@example.com',
  'Super Admin',
  true
);

-- Update users table to link staff
UPDATE users 
SET staff_id = (SELECT id FROM staff WHERE email = 'admin@example.com')
WHERE email = 'admin@example.com';
```

## Running the Application

1. Install dependencies:
```bash
npm install
# or
pnpm install
```

2. Start the development server:
```bash
npm run dev
# or
pnpm dev
```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

4. Login with your Supabase Auth credentials

## User Roles and Permissions

The system supports the following roles:

- **Super Admin**: Full access to all features
- **Branch Manager**: Manage assigned farms, animals, inventory, finance
- **Vet**: Record treatments and vaccinations, view reports
- **Storekeeper**: Manage inventory and stock movements
- **Accountant**: Manage finances, salaries, wages, reports
- **Field Staff**: Record milk, eggs, broilers, attendance

## Approval Workflow

- Records can be edited/deleted within 30 minutes without approval
- After 30 minutes, changes require approval from a Super Admin or Branch Manager
- Pending approvals are shown in the Approvals page
- Only users with appropriate permissions can approve changes

## Troubleshooting

### Authentication Issues
- Ensure Supabase Auth is enabled in your project
- Check that RLS policies allow authenticated users to access tables
- Verify user exists in both `auth.users` and `users` table

### Permission Errors
- Check user role in the `users` table
- Verify RLS policies match the role permissions
- Ensure `staff_id` is linked if user has a staff role

### Database Connection
- Verify `.env` file has correct Supabase URL and key
- Check Supabase project is active and not paused
- Ensure database tables are created correctly

