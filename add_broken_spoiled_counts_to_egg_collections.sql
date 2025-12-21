-- Migration: Add broken_count and spoiled_count columns to egg_collections
-- This allows tracking mixed egg collections (some good, some broken, some spoiled) in a single record

-- Add new columns
ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS broken_count INTEGER DEFAULT 0;
ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS spoiled_count INTEGER DEFAULT 0;

-- Update existing records:
-- If egg_status is 'Broken', set broken_count = number_of_eggs
-- If egg_status is 'Spoiled', set spoiled_count = number_of_eggs
-- If egg_status is 'Good', broken_count and spoiled_count remain 0
UPDATE egg_collections 
SET broken_count = CASE WHEN egg_status = 'Broken' THEN number_of_eggs ELSE 0 END,
    spoiled_count = CASE WHEN egg_status = 'Spoiled' THEN number_of_eggs ELSE 0 END
WHERE broken_count IS NULL OR spoiled_count IS NULL;

-- Make columns NOT NULL with default 0
ALTER TABLE egg_collections ALTER COLUMN broken_count SET NOT NULL;
ALTER TABLE egg_collections ALTER COLUMN broken_count SET DEFAULT 0;
ALTER TABLE egg_collections ALTER COLUMN spoiled_count SET NOT NULL;
ALTER TABLE egg_collections ALTER COLUMN spoiled_count SET DEFAULT 0;

-- Add check constraint to ensure broken_count + spoiled_count <= number_of_eggs
ALTER TABLE egg_collections DROP CONSTRAINT IF EXISTS egg_collections_counts_check;
ALTER TABLE egg_collections ADD CONSTRAINT egg_collections_counts_check 
  CHECK (broken_count >= 0 AND spoiled_count >= 0 AND (broken_count + spoiled_count) <= number_of_eggs);


