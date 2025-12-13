# Supabase Authentication Setup Guide

## Email Confirmation Settings

### ⚠️ IMPORTANT: Staff Accounts

**Staff accounts MUST have email confirmation DISABLED.**

Staff members should be able to login immediately after their accounts are created by admins, without email verification.

**See `DISABLE_EMAIL_CONFIRMATION.md` for detailed setup instructions.**

### For Customers (E-commerce)

You can choose whether customers need to confirm their emails:

#### Option 1: Disable Email Confirmation (Easier for Customers)

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Settings** → **Auth**
3. Under **Email Auth**, find **"Enable email confirmations"**
4. **Disable** this option
5. Click **Save**

This allows customers to sign in immediately after signup without email confirmation.

#### Option 2: Keep Email Confirmation Enabled (More Secure)

If you keep email confirmation enabled for customers:

1. Customers will receive a confirmation email after signup
2. They must click the confirmation link before they can sign in
3. The app will show an appropriate error message if they try to sign in before confirming

**Note:** If you disable email confirmation, it applies to BOTH staff and customers. For production, consider using Supabase Admin API to handle staff accounts separately.

## Testing Authentication

### Test Signup Flow

1. Go to `/customer/signup` or checkout page
2. Fill in the signup form
3. If email confirmation is **disabled**: You'll be signed in immediately
4. If email confirmation is **enabled**: You'll see a message to check your email

### Test Signin Flow

1. Go to `/customer/login` or checkout page
2. Enter your email and password
3. If email is not confirmed: You'll see "Please check your email and confirm your account"
4. If credentials are wrong: You'll see "Invalid email or password"

## Common Issues

### Issue: "400 Bad Request" on Sign In

**Possible Causes:**
1. Email confirmation required but not completed
2. Wrong email/password
3. User doesn't exist

**Solutions:**
- Check Supabase Dashboard → Authentication → Users to see if user exists
- Check if email confirmation is required
- Verify credentials are correct

### Issue: "Email already registered"

**Solution:**
- User should sign in instead of signing up
- Or use "Forgot Password" to reset password

### Issue: User created but can't sign in

**Possible Causes:**
1. Email confirmation required
2. Customer record not created in database

**Solutions:**
- Check if email confirmation is enabled
- Check Supabase Dashboard → Table Editor → customers to see if record exists
- If customer record is missing, create it manually:

```sql
-- Replace with actual user ID from auth.users
INSERT INTO customers (id, email, full_name)
VALUES (
  'user-uuid-from-auth-users',
  'customer@example.com',
  'Customer Name'
);
```

## Production Recommendations

1. **Enable email confirmation** for security
2. **Set up email templates** in Supabase Dashboard → Authentication → Email Templates
3. **Configure SMTP** if using custom email domain
4. **Enable rate limiting** to prevent abuse
5. **Set up password reset** flow

## Development Recommendations

1. **Disable email confirmation** for faster testing
2. **Use test emails** that you can access
3. **Check Supabase logs** for detailed error messages
4. **Use Supabase Dashboard** to manually verify users

