-- Migration: Add egg_status column to egg_collections table
-- This script adds an egg_status field to track egg condition

ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS egg_status TEXT DEFAULT 'Good' CHECK (egg_status IN ('Good', 'Broken', 'Spoiled'));

