-- =====================================================
-- Zealot AgriWorks Management System - COMPLETE DATABASE SETUP
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- This includes all tables, migrations, and updates
-- Run ALL sections in order
-- =====================================================

-- =====================================================
-- SECTION 1: MAIN DATABASE SETUP
-- Run the entire database_setup.sql file first
-- =====================================================
-- (See database_setup.sql file for full content)
-- This creates all base tables, indexes, triggers, and RLS policies

-- =====================================================
-- SECTION 2: MIGRATIONS - Run these in order
-- =====================================================

-- Migration 1: Update Farm Type to include 'Other'
-- =====================================================
ALTER TABLE farms DROP CONSTRAINT IF EXISTS farms_type_check;
ALTER TABLE farms ADD CONSTRAINT farms_type_check CHECK (type IN ('Dairy', 'Broiler', 'Layer', 'Other'));

-- Migration 2: Add cow_name and insurance_id to cattle (replacing tag_id)
-- =====================================================
-- Add new columns
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS cow_name TEXT;
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS insurance_id TEXT;

-- Update existing records (if any) to populate new columns from old tag_id
UPDATE cattle SET cow_name = tag_id, insurance_id = tag_id WHERE tag_id IS NOT NULL AND (cow_name IS NULL OR insurance_id IS NULL);

-- Make new columns NOT NULL and add UNIQUE constraint to insurance_id (only if no existing data conflicts)
-- If you have existing data, you may need to handle NULLs first
DO $$
BEGIN
    -- Only add constraints if all rows have values
    IF NOT EXISTS (SELECT 1 FROM cattle WHERE cow_name IS NULL OR insurance_id IS NULL) THEN
        ALTER TABLE cattle ALTER COLUMN cow_name SET NOT NULL;
        ALTER TABLE cattle ALTER COLUMN insurance_id SET NOT NULL;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cattle_insurance_id_key') THEN
            ALTER TABLE cattle ADD CONSTRAINT cattle_insurance_id_key UNIQUE (insurance_id);
        END IF;
    END IF;
END $$;

-- Migration 3: Add image_url to cattle
-- =====================================================
ALTER TABLE cattle ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add index for better search performance
CREATE INDEX IF NOT EXISTS idx_cattle_cow_name ON cattle(cow_name);

-- Migration 4: Add milk_status to milking_records
-- =====================================================
ALTER TABLE milking_records ADD COLUMN IF NOT EXISTS milk_status TEXT DEFAULT 'Consumption';

-- Update existing records to have default status
UPDATE milking_records SET milk_status = 'Consumption' WHERE milk_status IS NULL;

-- Make it NOT NULL after updating
ALTER TABLE milking_records ALTER COLUMN milk_status SET NOT NULL;
ALTER TABLE milking_records ALTER COLUMN milk_status SET DEFAULT 'Consumption';

-- Update or add CHECK constraint
ALTER TABLE milking_records DROP CONSTRAINT IF EXISTS milking_records_milk_status_check;
ALTER TABLE milking_records ADD CONSTRAINT milking_records_milk_status_check CHECK (milk_status IN ('Consumption', 'Colostrum'));

-- Migration 5: Add egg_status to egg_collections
-- =====================================================
ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS egg_status TEXT DEFAULT 'Good';

-- Update existing records to have default status
UPDATE egg_collections SET egg_status = 'Good' WHERE egg_status IS NULL;

-- Make it NOT NULL after updating
ALTER TABLE egg_collections ALTER COLUMN egg_status SET NOT NULL;
ALTER TABLE egg_collections ALTER COLUMN egg_status SET DEFAULT 'Good';

-- Update or add CHECK constraint
ALTER TABLE egg_collections DROP CONSTRAINT IF EXISTS egg_collections_egg_status_check;
ALTER TABLE egg_collections ADD CONSTRAINT egg_collections_egg_status_check CHECK (egg_status IN ('Good', 'Broken', 'Spoiled'));

-- Migration 5b: Add broken_count and spoiled_count to egg_collections
-- =====================================================
ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS broken_count INTEGER DEFAULT 0;
ALTER TABLE egg_collections ADD COLUMN IF NOT EXISTS spoiled_count INTEGER DEFAULT 0;

-- Update existing records:
-- If egg_status is 'Broken', set broken_count = number_of_eggs
-- If egg_status is 'Spoiled', set spoiled_count = number_of_eggs
-- If egg_status is 'Good', broken_count and spoiled_count remain 0
UPDATE egg_collections 
SET broken_count = CASE WHEN egg_status = 'Broken' THEN number_of_eggs ELSE COALESCE(broken_count, 0) END,
    spoiled_count = CASE WHEN egg_status = 'Spoiled' THEN number_of_eggs ELSE COALESCE(spoiled_count, 0) END
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

-- Migration 6: Update cattle status to include 'Active', 'Deceased', 'Sold'
-- =====================================================
ALTER TABLE cattle DROP CONSTRAINT IF EXISTS cattle_status_check;
ALTER TABLE cattle ADD CONSTRAINT cattle_status_check CHECK (status IN ('Calf', 'Heifer', 'Cow', 'Bull', 'Active', 'Deceased', 'Sold'));

-- =====================================================
-- SECTION 3: NEW TABLES FOR EGG SALES AND STOCK TRACKING
-- =====================================================

-- Create egg_sales table
CREATE TABLE IF NOT EXISTS egg_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2),
  total_amount DECIMAL(10, 2),
  customer TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create egg_stock_initial table (one record per farm for initial setup)
CREATE TABLE IF NOT EXISTS egg_stock_initial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE UNIQUE,
  initial_stock INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_egg_sales_farm_id ON egg_sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_egg_sales_date ON egg_sales(date);
CREATE INDEX IF NOT EXISTS idx_egg_stock_initial_farm_id ON egg_stock_initial(farm_id);

-- Create trigger for updating updated_at (ensure the function exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for new tables
DROP TRIGGER IF EXISTS update_egg_sales_updated_at ON egg_sales;
CREATE TRIGGER update_egg_sales_updated_at BEFORE UPDATE ON egg_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_egg_stock_initial_updated_at ON egg_stock_initial;
CREATE TRIGGER update_egg_stock_initial_updated_at BEFORE UPDATE ON egg_stock_initial
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE egg_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_stock_initial ENABLE ROW LEVEL SECURITY;

-- RLS Policies for egg_sales
DROP POLICY IF EXISTS "Super Admin full access on egg sales" ON egg_sales;
CREATE POLICY "Super Admin full access on egg sales"
  ON egg_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

DROP POLICY IF EXISTS "Branch Manager and Field Staff access egg sales" ON egg_sales;
CREATE POLICY "Branch Manager and Field Staff access egg sales"
  ON egg_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = egg_sales.farm_id OR s.farm_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Read access to egg sales" ON egg_sales;
CREATE POLICY "Read access to egg sales"
  ON egg_sales FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for egg_stock_initial
DROP POLICY IF EXISTS "Super Admin full access on egg stock initial" ON egg_stock_initial;
CREATE POLICY "Super Admin full access on egg stock initial"
  ON egg_stock_initial FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

DROP POLICY IF EXISTS "Branch Manager and Field Staff access egg stock initial" ON egg_stock_initial;
CREATE POLICY "Branch Manager and Field Staff access egg stock initial"
  ON egg_stock_initial FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = egg_stock_initial.farm_id OR s.farm_id IS NULL)
    )
  );

DROP POLICY IF EXISTS "Read access to egg stock initial" ON egg_stock_initial;
CREATE POLICY "Read access to egg stock initial"
  ON egg_stock_initial FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check cattle table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cattle'
ORDER BY ordinal_position;

-- Check if new columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'cattle' 
AND column_name IN ('cow_name', 'insurance_id', 'image_url');

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'milking_records' 
AND column_name = 'milk_status';

SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'egg_collections' 
AND column_name = 'egg_status';

-- Check if new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('egg_sales', 'egg_stock_initial');

-- =====================================================
-- END OF SETUP
-- =====================================================

