# Setup Missing Database Tables and Storage Bucket

## Issue Summary

The application is missing the following database resources:
1. `egg_sales` table (404 error)
2. `egg_stock_initial` table (404 error)
3. `cattle-images` storage bucket (400 error)

## Solution

### Step 1: Create Missing Database Tables

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Open the file `create_egg_sales_and_stock_tables.sql` from this project
4. Copy and paste the entire SQL script into the SQL Editor
5. Click **Run** to execute the script

This will create:
- `egg_sales` table for tracking egg sales
- `egg_stock_initial` table for initial stock setup
- Required indexes and RLS policies

### Step 2: Create Storage Bucket

1. In Supabase Dashboard, navigate to **Storage**
2. Click **New bucket**
3. Configure the bucket:
   - **Name**: `cattle-images`
   - **Public bucket**: ✅ Yes (recommended for public image access)
   - **File size limit**: 5MB (or your preferred limit)
   - **Allowed MIME types**: `image/*` (optional but recommended)
4. Click **Create bucket**

### Step 3: Set Up Storage Policies

1. In Supabase Dashboard, go to **SQL Editor**
2. Open the file `setup_cattle_images_storage.sql` from this project
3. Copy and paste the entire SQL script into the SQL Editor
4. Click **Run** to execute the script

This will create the necessary RLS policies for the storage bucket.

## Verification

After completing the setup:

1. **For Tables**: Navigate to the Poultry Management > Layers Analysis tab. You should no longer see 404 errors in the console.

2. **For Storage**: Try uploading an image in the Cattle Management page. The upload should succeed without "Bucket not found" errors.

## Notes

- The application now handles missing tables/bucket gracefully and will show warnings in the console instead of breaking
- Empty arrays are set when tables don't exist, allowing the app to continue functioning
- Image uploads will fail gracefully with an alert message if the bucket doesn't exist

