-- =====================================================
-- Storage Bucket Setup for Cattle Images
-- =====================================================
-- This script sets up RLS policies for the cattle-images bucket
-- 
-- IMPORTANT: First create the bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name: cattle-images
-- 4. Public bucket: YES (if you want images publicly accessible)
-- 5. File size limit: 5MB (or your preferred limit)
-- 6. Allowed MIME types: image/* (optional, but recommended)
-- =====================================================

-- Enable RLS on storage.objects (if not already enabled)
-- Note: RLS is enabled by default on storage buckets

-- Policy 1: Allow authenticated users to upload images
CREATE POLICY IF NOT EXISTS "Allow authenticated users to upload cattle images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'cattle-images' AND
  (storage.foldername(name))[1] = 'cattle'
);

-- Policy 2: Allow authenticated users to update their uploaded images
CREATE POLICY IF NOT EXISTS "Allow authenticated users to update cattle images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cattle-images' AND
  (storage.foldername(name))[1] = 'cattle'
);

-- Policy 3: Allow authenticated users to delete their uploaded images
CREATE POLICY IF NOT EXISTS "Allow authenticated users to delete cattle images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cattle-images' AND
  (storage.foldername(name))[1] = 'cattle'
);

-- Policy 4: Allow public read access (if bucket is public)
-- If your bucket is private, remove this policy
CREATE POLICY IF NOT EXISTS "Allow public read access to cattle images"
ON storage.objects FOR SELECT
TO public
USING (
  bucket_id = 'cattle-images'
);

-- Policy 5: Allow authenticated users to read all cattle images
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read cattle images"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'cattle-images'
);

-- =====================================================
-- Alternative: Simpler policy for public bucket
-- =====================================================
-- If you prefer a simpler setup and your bucket is public,
-- you can use these policies instead:

-- For public bucket with full authenticated access:
/*
CREATE POLICY IF NOT EXISTS "Full access to cattle-images for authenticated users"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'cattle-images')
WITH CHECK (bucket_id = 'cattle-images');

CREATE POLICY IF NOT EXISTS "Public read access to cattle-images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'cattle-images');
*/

-- =====================================================
-- Verification Query
-- =====================================================
-- Run this to check if policies exist:
SELECT * FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%cattle%';


