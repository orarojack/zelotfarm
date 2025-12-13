# Staff Account Creation Guide

## Overview

Admins can create login accounts for staff members directly from the Staff Management page. When creating a new staff member, admins can optionally create a login account with default credentials.

## How It Works

### For Admins

1. **Navigate to Staff Management**: Go to `/admin/staff` in the admin panel
2. **Add New Staff Member**: Click "Add Staff Member" button
3. **Fill in Staff Details**: Complete the staff information form
4. **Create Login Account**: Check the "Create login account for this staff member" checkbox
   - **Note**: Email is required when creating an account
5. **Submit**: Click "Create" to save the staff member and create the account
6. **Share Credentials**: The system will display the default credentials:
   - Email: The email address provided
   - Default Password: Generated as `{firstName}{currentYear}!` (e.g., `john2024!`)

### Default Password Format

The default password is automatically generated using the format:
```
{FirstName}{CurrentYear}!
```

Example:
- Staff Name: "John Doe"
- Year: 2024
- Default Password: `john2024!`

### For Staff Members

1. **Receive Credentials**: Get the default login credentials from the admin
2. **First Login**: 
   - Go to `/admin/login`
   - Enter the email and default password
   - **Note**: Email confirmation is disabled, so you can login immediately
3. **Change Password**: 
   - After logging in, go to Profile Settings (click your name in the sidebar)
   - Navigate to "Change Password" section
   - Enter current password and new password
   - Click "Change Password"

## Important Notes

### Email Confirmation - MUST BE DISABLED

**⚠️ IMPORTANT: Staff accounts should NOT require email confirmation**

**Setup Required:**
1. Go to Supabase Dashboard → Authentication → Settings → Auth
2. Find "Enable email confirmations" under "Email Auth" section
3. **DISABLE** this setting (turn it OFF)
4. Click "Save"

**Why?**
- Staff should be able to login immediately after account creation
- Admin provides credentials directly to staff
- No need for email verification step
- Faster onboarding process

**See `DISABLE_EMAIL_CONFIRMATION.md` for detailed setup instructions.**

### Security Considerations

1. **Default Passwords**: Default passwords should be changed immediately after first login
2. **Password Policy**: New passwords must be at least 6 characters long
3. **Account Security**: Staff members should use strong, unique passwords

### Troubleshooting

**Issue: "User already registered" error**
- This means a Supabase Auth user with that email already exists
- The system will attempt to link the existing account to the staff record
- If linking fails, you may need to manually create the user record in the `users` table

**Issue: Email confirmation required**
- This should NOT happen if email confirmation is properly disabled
- If it does, check Supabase Dashboard → Authentication → Settings
- Ensure "Enable email confirmations" is OFF
- See `DISABLE_EMAIL_CONFIRMATION.md` for setup instructions

**Issue: Cannot create account**
- Ensure the email field is filled when "Create login account" is checked
- Check that the email format is valid
- Verify Supabase Auth is properly configured

## Production Recommendations

For production environments, consider:

1. **Edge Function**: Create a Supabase Edge Function to handle user creation using the service role key
   - This allows more control over the process
   - Can auto-confirm users without email verification
   - Better error handling

2. **Password Reset**: Implement a password reset flow for staff who forget their passwords

3. **Account Management**: Add functionality to:
   - Reset staff passwords from admin panel
   - Deactivate/reactivate staff accounts
   - View account status

## Database Schema

The system uses two tables:

1. **`staff`**: Contains staff member information (name, role, salary, etc.)
2. **`users`**: Links Supabase Auth users to staff records
   - `id`: References `auth.users(id)`
   - `email`: User's email address
   - `role`: Staff role (determines permissions)
   - `staff_id`: References `staff(id)`

## Example Workflow

1. Admin creates staff member "Jane Smith" with email "jane@example.com"
2. Admin checks "Create login account"
3. System generates password: `jane2024!`
4. System creates:
   - Staff record in `staff` table
   - Supabase Auth user
   - User record in `users` table linking them together
5. Admin shares credentials with Jane
6. Jane logs in and changes password in Profile Settings

