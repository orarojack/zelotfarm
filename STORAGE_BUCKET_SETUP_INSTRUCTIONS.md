# Storage Bucket Setup Instructions for Cattle Images

## Problem
If you're getting the error: `StorageApiError: Bucket not found`, follow these steps to properly set up the storage bucket.

## Step-by-Step Setup

### Step 1: Create the Bucket in Supabase Dashboard

1. **Go to your Supabase Dashboard**
2. **Navigate to Storage** (left sidebar)
3. **Click "New bucket"** button
4. **Configure the bucket:**
   - **Bucket name**: `cattle-images` (must be exactly this, case-sensitive)
   - **Public bucket**: **YES** (toggle ON - this allows public read access)
   - **File size limit**: `5242880` (5MB in bytes) or your preferred limit
   - **Allowed MIME types**: `image/*` (optional, but recommended for security)

5. **Click "Create bucket"**

### Step 2: Set Up Storage Policies (RLS)

After creating the bucket, run the SQL script `setup_cattle_images_storage.sql` in your Supabase SQL Editor to set up Row Level Security policies.

**OR** manually create policies in Supabase Dashboard:

1. Go to **Storage** → **Policies**
2. Select the `cattle-images` bucket
3. Click "New policy"

#### Policy 1: Allow Uploads
- **Policy name**: `Allow authenticated users to upload cattle images`
- **Allowed operation**: `INSERT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cattle-images' AND
(storage.foldername(name))[1] = 'cattle'
```

#### Policy 2: Allow Updates
- **Policy name**: `Allow authenticated users to update cattle images`
- **Allowed operation**: `UPDATE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cattle-images' AND
(storage.foldername(name))[1] = 'cattle'
```

#### Policy 3: Allow Deletes
- **Policy name**: `Allow authenticated users to delete cattle images`
- **Allowed operation**: `DELETE`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cattle-images' AND
(storage.foldername(name))[1] = 'cattle'
```

#### Policy 4: Allow Public Read (if bucket is public)
- **Policy name**: `Allow public read access to cattle images`
- **Allowed operation**: `SELECT`
- **Target roles**: `public`
- **Policy definition**:
```sql
bucket_id = 'cattle-images'
```

#### Policy 5: Allow Authenticated Read
- **Policy name**: `Allow authenticated users to read cattle images`
- **Allowed operation**: `SELECT`
- **Target roles**: `authenticated`
- **Policy definition**:
```sql
bucket_id = 'cattle-images'
```

### Step 3: Verify Bucket Configuration

Check the following:

1. **Bucket name is exactly**: `cattle-images` (no spaces, exact case)
2. **Bucket exists**: You can see it in the Storage dashboard
3. **Policies are active**: Check the Policies tab for the bucket
4. **Public access**: If you want images publicly accessible, make sure the bucket is set to public

## Troubleshooting

### Error: "Bucket not found"

**Possible causes:**
1. ✅ Bucket name doesn't match exactly - must be `cattle-images` (case-sensitive)
2. ✅ Bucket doesn't exist - create it first
3. ✅ Wrong Supabase project - make sure you're using the correct project
4. ✅ RLS policies blocking access - check policies are set up correctly

### Error: "new row violates row-level security policy"

**Solution:**
- Make sure you've run the storage policies SQL script
- Check that the user is authenticated
- Verify policies allow INSERT operation

### Images upload but don't display

**Solution:**
- Check if bucket is set to **Public**
- Verify public read policy exists
- Check that image URLs are being generated correctly

## Quick Check Script

Run this in your Supabase SQL Editor to verify everything is set up:

```sql
-- Check if bucket exists (this might not work directly, but you can check in Dashboard)
-- Check policies
SELECT * 
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects' 
AND policyname LIKE '%cattle%';
```

## Alternative: Simpler Setup (Public Bucket)

If you want a simpler setup and your bucket is public, use these two policies:

1. **Full authenticated access**:
   - Operation: `ALL`
   - Roles: `authenticated`
   - Policy: `bucket_id = 'cattle-images'`

2. **Public read**:
   - Operation: `SELECT`
   - Roles: `public`
   - Policy: `bucket_id = 'cattle-images'`

## Testing

After setup, test by:
1. Going to the Cattle page
2. Clicking "Add New Cattle"
3. Try uploading an image
4. Check browser console for any errors

If you still get errors, check:
- Browser console for detailed error messages
- Network tab to see the actual API request
- Supabase logs in the Dashboard


