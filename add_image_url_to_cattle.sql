-- Migration: Add image_url column to cattle table
-- This script adds an image_url field to store cattle images

ALTER TABLE cattle ADD COLUMN IF NOT EXISTS image_url TEXT;

