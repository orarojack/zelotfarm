# Setup Checklist - Zealot AgriWorks Management System

## Initial Setup

- [ ] Create Supabase project
- [ ] Run `database_setup.sql` in Supabase SQL Editor
- [ ] Run `ecommerce_schema.sql` for e-commerce tables
- [ ] Run `ecommerce_cart_orders.sql` for cart and orders
- [ ] Configure `.env` file with Supabase credentials
- [ ] Install dependencies: `npm install` or `pnpm install`

## Authentication Setup

### ⚠️ CRITICAL: Disable Email Confirmation for Staff

- [ ] Go to Supabase Dashboard → Authentication → Settings → Auth
- [ ] Find "Enable email confirmations" under "Email Auth"
- [ ] **DISABLE** this setting (turn it OFF)
- [ ] Click "Save"
- [ ] Verify the setting is OFF

**Why?** Staff should login immediately without email confirmation.

**See `DISABLE_EMAIL_CONFIRMATION.md` for detailed instructions.**

### Create First Admin User

- [ ] Create user in Supabase Dashboard → Authentication → Users
- [ ] Create record in `users` table with role "Super Admin"
- [ ] Test login at `/admin/login`

## Database Setup

- [ ] All tables created successfully
- [ ] RLS policies applied
- [ ] Indexes created
- [ ] Test data inserted (optional, using `demo_data_simple.sql`)

## Testing

### Staff Account Creation
- [ ] Login as admin
- [ ] Go to Staff Management
- [ ] Create a new staff member
- [ ] Check "Create login account"
- [ ] Verify credentials are displayed
- [ ] Test login with those credentials (should work immediately)

### Staff Login
- [ ] Go to `/admin/login`
- [ ] Enter staff credentials
- [ ] Should login successfully without email confirmation
- [ ] Verify role-specific dashboard appears

### Password Change
- [ ] Login as staff member
- [ ] Go to Profile Settings
- [ ] Change password
- [ ] Logout and login with new password

## E-commerce Setup

- [ ] Product categories created
- [ ] Sample products added
- [ ] Live bids configured (if using)
- [ ] Test customer signup/login
- [ ] Test cart functionality
- [ ] Test checkout process

## Security Checklist

- [ ] RLS policies are properly configured
- [ ] Service role key is NOT exposed in client code
- [ ] Environment variables are set correctly
- [ ] Default passwords are being changed by staff
- [ ] Role-based access control is working

## Documentation

- [ ] Read `STAFF_ACCOUNT_CREATION.md`
- [ ] Read `STAFF_LOGIN_GUIDE.md`
- [ ] Read `DISABLE_EMAIL_CONFIRMATION.md`
- [ ] Share login guide with staff members

## Production Deployment

- [ ] Set up production Supabase project
- [ ] Configure production environment variables
- [ ] Set up custom domain (if needed)
- [ ] Configure email templates (for customers, if using)
- [ ] Set up monitoring and logging
- [ ] Test all functionality in production environment

---

**Remember:** Email confirmation MUST be disabled for staff accounts to work properly!

