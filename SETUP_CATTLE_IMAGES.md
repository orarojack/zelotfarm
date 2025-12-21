# Cattle Images Storage Setup

This document explains how to set up Supabase Storage for cattle images.

## Prerequisites

- Supabase project with storage enabled
- Admin access to your Supabase project

## Steps

1. **Create Storage Bucket**
   - Go to your Supabase project dashboard
   - Navigate to Storage section
   - Click "New bucket"
   - Name it: `cattle-images`
   - Set it to **Public** (or configure RLS policies for authenticated users)
   - Click "Create bucket"

2. **Configure Storage Policies (if using RLS)**
   
   If your bucket is private, add policies to allow:
   - Authenticated users to upload files
   - Public read access (or authenticated read access)

   Example RLS policies:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload cattle images"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'cattle-images');

   -- Allow public read access
   CREATE POLICY "Public can read cattle images"
   ON storage.objects FOR SELECT
   TO public
   USING (bucket_id = 'cattle-images');
   ```

3. **Run Database Migration**
   - Execute `add_image_url_to_cattle.sql` to add the `image_url` column to the cattle table

4. **Test the Feature**
   - Go to Cattle Management page
   - Click "Add Cattle"
   - Try uploading an image via drag & drop or file picker
   - Verify the image appears in the detail view when viewing a cow

## Notes

- Maximum file size: 5MB
- Supported formats: All image formats (JPEG, PNG, GIF, WebP, etc.)
- Images are stored in the `cattle-images` bucket under the `cattle/` folder
- File names are automatically generated to prevent conflicts

