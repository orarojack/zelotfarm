# Staff Login Guide - Zealot AgriWorks Management System

## How to Login

### Step 1: Get Your Login Credentials

Your admin will provide you with:
- **Email Address**: Your work email address
- **Default Password**: A temporary password (format: `{YourFirstName}{Year}!`)

**Example:**
- Name: John Doe
- Email: `john@zealotagriworks.com`
- Default Password: `john2024!`

### Step 2: Access the Login Page

1. **Open your web browser** (Chrome, Firefox, Safari, or Edge)
2. **Go to the login page**:
   - If you have the website URL, navigate to: `https://yourdomain.com/admin/login`
   - Or ask your admin for the login URL

### Step 3: Enter Your Credentials

1. **Enter your Email** in the email field
2. **Enter your Password** (the default password provided by admin)
3. **Click "Sign In"** button

### Step 4: First-Time Login

**Important:** After your first login, you should change your password:

1. Once logged in, look at the **bottom of the left sidebar**
2. Click on **"Profile Settings"**
3. Scroll to **"Change Password"** section
4. Enter:
   - Your current password (the default one)
   - Your new password (choose a strong password)
   - Confirm your new password
5. Click **"Change Password"**

## Login URL

The login page is located at:
```
/admin/login
```

If you're on the main website, you can:
- Add `/admin/login` to the end of the website URL
- Or ask your admin for the direct login link

## Troubleshooting

### "Invalid login credentials" Error

**Possible causes:**
- Wrong email or password
- Email not confirmed (check your email inbox)
- Account not created yet

**Solutions:**
1. Double-check your email and password
2. Make sure you're using the exact email provided by admin
3. Check if you received a confirmation email (if required)
4. Contact your admin if you still can't login

### "Email not confirmed" Error

**This should NOT happen** - Email confirmation is disabled for staff accounts.

**If you see this error:**
1. Contact your admin immediately
2. Admin should verify email confirmation is disabled in Supabase settings
3. Admin may need to manually confirm your account in Supabase Dashboard

### "User not found" Error

**Solution:**
- Your account might not be created yet
- Contact your admin to verify your account was created

### Forgot Your Password

**Contact your admin** to reset your password. They can:
- Reset your password from the admin panel
- Provide you with a new temporary password

## Security Tips

1. **Change Default Password**: Always change your default password after first login
2. **Use Strong Passwords**: 
   - At least 6 characters (more is better)
   - Mix of letters, numbers, and symbols
   - Don't use personal information
3. **Don't Share Credentials**: Never share your login credentials with anyone
4. **Log Out**: Always log out when finished, especially on shared computers

## What You'll See After Login

After successful login, you'll see:
- **Dashboard**: Overview of your role-specific information
- **Sidebar Menu**: Navigation to different sections based on your role
- **Your Role**: Displayed at the bottom of the sidebar

### Available Sections (Based on Your Role)

- **Super Admin**: Full access to all sections
- **Branch Manager**: Farms, Cattle, Milking, Poultry, Inventory, Finance, Reports
- **Vet**: Cattle, Reports
- **Storekeeper**: Inventory, Reports
- **Accountant**: Finance, Staff, Reports
- **Field Staff**: Milking, Poultry

## Need Help?

If you're having trouble logging in:
1. **Check this guide** for common solutions
2. **Contact your admin** or IT support
3. **Verify your credentials** with your admin

## Quick Reference

- **Login URL**: `/admin/login`
- **Password Change**: Profile Settings → Change Password
- **Support**: Contact your admin

---

**Remember:** Keep your login credentials secure and change your default password immediately after first login!

