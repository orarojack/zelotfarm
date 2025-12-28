-- =====================================================
-- Poultry Module - Migrate Customers Table
-- =====================================================
-- Run this to add poultry-specific columns to existing customers table
-- This handles the case where customers table exists from ecommerce module
-- =====================================================

-- Add customer_code column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'customer_code'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_code TEXT UNIQUE;
  END IF;
END $$;

-- Add customer_name column if it doesn't exist (rename from full_name if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'customer_name'
  ) THEN
    -- If full_name exists, we can add customer_name and copy data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'full_name'
    ) THEN
      ALTER TABLE customers ADD COLUMN customer_name TEXT;
      UPDATE customers SET customer_name = full_name WHERE customer_name IS NULL;
    ELSE
      ALTER TABLE customers ADD COLUMN customer_name TEXT NOT NULL;
    END IF;
  END IF;
END $$;

-- Add contact_phone column if it doesn't exist (rename from phone if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'contact_phone'
  ) THEN
    -- If phone exists, rename it or add new column
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'phone'
    ) THEN
      ALTER TABLE customers ADD COLUMN contact_phone TEXT;
      UPDATE customers SET contact_phone = phone WHERE contact_phone IS NULL;
    ELSE
      ALTER TABLE customers ADD COLUMN contact_phone TEXT;
    END IF;
  END IF;
END $$;

-- Add contact_email column if it doesn't exist (rename from email if needed)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'contact_email'
  ) THEN
    -- If email exists, add contact_email and copy data
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'customers' AND column_name = 'email'
    ) THEN
      ALTER TABLE customers ADD COLUMN contact_email TEXT;
      UPDATE customers SET contact_email = email WHERE contact_email IS NULL;
    ELSE
      ALTER TABLE customers ADD COLUMN contact_email TEXT;
    END IF;
  END IF;
END $$;

-- Add customer_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'customer_type'
  ) THEN
    ALTER TABLE customers ADD COLUMN customer_type TEXT CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor'));
  END IF;
END $$;

-- Add payment_terms column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'payment_terms'
  ) THEN
    ALTER TABLE customers ADD COLUMN payment_terms TEXT;
  END IF;
END $$;

-- Add notes column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'notes'
  ) THEN
    ALTER TABLE customers ADD COLUMN notes TEXT;
  END IF;
END $$;

-- Ensure customer_code has unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'customers_customer_code_key'
  ) THEN
    ALTER TABLE customers ADD CONSTRAINT customers_customer_code_key UNIQUE (customer_code);
  END IF;
END $$;

