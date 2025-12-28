-- =====================================================
-- Poultry Management System - Complete Database Schema
-- =====================================================
-- This schema implements the complete Poultry Module specification
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- SECTION 1: Batch & Production Management
-- =====================================================

-- Poultry houses/pens (for better location tracking)
CREATE TABLE IF NOT EXISTS poultry_houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  house_type TEXT CHECK (house_type IN ('Broiler House', 'Layer House', 'Mixed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Poultry batches/flocks (unified table for both Broilers and Layers)
CREATE TABLE IF NOT EXISTS poultry_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_flock_id TEXT NOT NULL UNIQUE, -- Auto-generated unique ID
  production_type TEXT NOT NULL CHECK (production_type IN ('Broiler', 'Layer')),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  house_id UUID REFERENCES poultry_houses(id) ON DELETE SET NULL,
  breed_strain TEXT NOT NULL,
  source TEXT, -- Chick or pullet source
  placement_date DATE NOT NULL,
  initial_quantity INTEGER NOT NULL,
  age_at_placement INTEGER, -- For layers (in days)
  production_phase TEXT, -- For layers (Pullet, Layer, etc.)
  expected_market_date DATE, -- For broilers
  expected_laying_period INTEGER, -- For layers (in days)
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Active', 'Suspended', 'Closed')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily stock movement records for batches
CREATE TABLE IF NOT EXISTS batch_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_stock INTEGER NOT NULL,
  mortalities INTEGER DEFAULT 0,
  culls INTEGER DEFAULT 0,
  closing_stock INTEGER NOT NULL, -- Auto-calculated: opening - mortalities - culls
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, date) -- One record per batch per day
);

-- =====================================================
-- SECTION 2 & 3: Feed Issuance to Batches
-- =====================================================

-- Feed issuance to batches/flocks
CREATE TABLE IF NOT EXISTS feed_issuance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuance_reference TEXT NOT NULL UNIQUE, -- Auto-generated
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  feed_type TEXT NOT NULL,
  supplier TEXT,
  issuance_date DATE NOT NULL,
  quantity_kg NUMERIC NOT NULL,
  quantity_bags NUMERIC, -- Optional
  bags_per_kg NUMERIC DEFAULT 50, -- Conversion factor (e.g., 1 bag = 50kg)
  unit_cost NUMERIC,
  total_cost NUMERIC, -- Auto-calculated
  inventory_item_id UUID REFERENCES inventory_items(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 4: Health, Medication & Vaccination
-- =====================================================

-- Vaccination schedule and records
CREATE TABLE IF NOT EXISTS vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  vaccination_date DATE NOT NULL,
  birds_age_days INTEGER NOT NULL,
  vaccine_name TEXT NOT NULL,
  disease_target TEXT NOT NULL,
  administration_method TEXT NOT NULL CHECK (administration_method IN ('Oral', 'Injection', 'Water', 'Spray', 'Eye Drop', 'Wing Web', 'Other')),
  dosage TEXT NOT NULL, -- Amount per bird or per kg
  number_of_birds INTEGER NOT NULL,
  manufacturer TEXT,
  batch_number TEXT, -- Vaccine batch number
  expiry_date DATE,
  cost_per_dosage NUMERIC,
  total_cost NUMERIC, -- Auto-calculated: cost_per_dosage * number_of_birds
  veterinary_name TEXT,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'Completed', 'Overdue')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication/treatment records
CREATE TABLE IF NOT EXISTS poultry_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  treatment_date DATE NOT NULL,
  medication_name TEXT NOT NULL,
  disease_condition TEXT,
  administration_method TEXT,
  dosage TEXT,
  number_of_birds INTEGER,
  withdrawal_period_days INTEGER, -- Important for food safety
  cost NUMERIC,
  veterinary_name TEXT,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 5: Egg Collection & Grading
-- =====================================================

-- Enhanced egg collections with grading
CREATE TABLE IF NOT EXISTS egg_collections_enhanced (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE, -- Link to flock
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  branch TEXT, -- Branch/warehouse location
  collection_date DATE NOT NULL,
  collection_time TIME,
  total_eggs_collected INTEGER NOT NULL,
  grade_a_quantity INTEGER DEFAULT 0, -- Large, clean, perfect
  grade_b_quantity INTEGER DEFAULT 0, -- Medium, minor defect
  grade_c_quantity INTEGER DEFAULT 0, -- Small, irregular
  dirty_eggs_quantity INTEGER DEFAULT 0, -- Unsuitable for premium sale
  average_egg_weight_g NUMERIC, -- Average weight per egg in grams
  storage_temperature_c NUMERIC, -- Storage temperature in Celsius
  notes TEXT,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT grade_validation CHECK (
    (grade_a_quantity + grade_b_quantity + grade_c_quantity + dirty_eggs_quantity) <= total_eggs_collected
  )
);

-- =====================================================
-- SECTION 6: Broilers - Production & Sales
-- =====================================================

-- Broiler production records (daily growth tracking)
CREATE TABLE IF NOT EXISTS broiler_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  average_weight_kg NUMERIC,
  daily_gain_kg NUMERIC, -- Auto-calculated
  total_feed_consumed_kg NUMERIC,
  mortality_count INTEGER DEFAULT 0,
  current_count INTEGER NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, date)
);

-- Broiler sales and disposal
CREATE TABLE IF NOT EXISTS broiler_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  quantity INTEGER NOT NULL,
  average_weight_kg NUMERIC,
  total_weight_kg NUMERIC, -- Auto-calculated
  unit_price NUMERIC, -- Price per kg
  total_amount NUMERIC, -- Auto-calculated
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT, -- For backward compatibility
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'M-Pesa', 'Cheque', 'Card')),
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partially Paid', 'Fully Paid')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 7: Layers - Production & Sales
-- =====================================================

-- Layer production tracking
CREATE TABLE IF NOT EXISTS layer_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  eggs_per_bird NUMERIC, -- Eggs per bird for the day
  production_percentage NUMERIC, -- Auto-calculated: (eggs_collected / current_bird_count) * 100
  total_eggs INTEGER NOT NULL,
  current_bird_count INTEGER NOT NULL,
  feed_consumed_kg NUMERIC,
  feed_cost_per_egg NUMERIC, -- Auto-calculated
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(batch_id, date)
);

-- Layer sales (eggs, spent hens, manure)
CREATE TABLE IF NOT EXISTS layer_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('Eggs', 'Spent Hens', 'Manure', 'Other')),
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL, -- 'eggs', 'birds', 'kg', etc.
  unit_price NUMERIC,
  total_amount NUMERIC, -- Auto-calculated
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  customer_name TEXT,
  payment_method TEXT CHECK (payment_method IN ('Cash', 'Bank Transfer', 'M-Pesa', 'Cheque', 'Card')),
  payment_status TEXT DEFAULT 'Pending' CHECK (payment_status IN ('Pending', 'Partially Paid', 'Fully Paid')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 8: Sales & Order Management
-- =====================================================

-- Customers table (if not exists from ecommerce)
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT UNIQUE, -- Auto-generated unique identifier
  customer_name TEXT NOT NULL,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  customer_type TEXT CHECK (customer_type IN ('Retail', 'Wholesale', 'Distributor')),
  payment_terms TEXT, -- e.g., "Net 30", "Cash on Delivery"
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders table (enhanced for poultry products)
CREATE TABLE IF NOT EXISTS poultry_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_reference TEXT NOT NULL UNIQUE, -- Auto-generated
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  order_date DATE NOT NULL,
  delivery_date DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Confirmed', 'Dispatched', 'Delivered', 'Cancelled')),
  total_amount NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order items (eggs, broilers, layers, feed, etc.)
CREATE TABLE IF NOT EXISTS poultry_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES poultry_orders(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL CHECK (item_type IN ('Eggs', 'Broilers', 'Layers', 'Feed', 'Other')),
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL, -- Auto-calculated
  batch_id UUID REFERENCES poultry_batches(id) ON DELETE SET NULL, -- Link to source batch
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE, -- Auto-generated
  order_id UUID REFERENCES poultry_orders(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  invoice_date DATE NOT NULL,
  billing_address TEXT,
  subtotal NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL, -- Auto-calculated
  status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Sent', 'Paid', 'Overdue')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoice items
CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  unit_price NUMERIC NOT NULL,
  total_price NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_reference TEXT NOT NULL UNIQUE, -- Auto-generated
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('Cash', 'Bank Transfer', 'M-Pesa', 'Cheque', 'Card')),
  amount_paid NUMERIC NOT NULL,
  outstanding_balance NUMERIC, -- Auto-calculated
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Partially Paid', 'Fully Paid')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SECTION 9: Financial Management
-- =====================================================

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_code TEXT NOT NULL UNIQUE,
  account_name TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('Asset', 'Liability', 'Equity', 'Revenue', 'Expense')),
  parent_account_id UUID REFERENCES chart_of_accounts(id) ON DELETE SET NULL,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_reference TEXT NOT NULL UNIQUE, -- Auto-generated
  entry_date DATE NOT NULL,
  description TEXT NOT NULL,
  total_debit NUMERIC NOT NULL,
  total_credit NUMERIC NOT NULL,
  -- Validation: debit = credit enforced at application level or via trigger
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT debit_credit_balance CHECK (total_debit = total_credit)
);

-- Journal Entry Lines
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id UUID REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  debit_amount NUMERIC DEFAULT 0,
  credit_amount NUMERIC DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT debit_or_credit CHECK (
    (debit_amount > 0 AND credit_amount = 0) OR 
    (credit_amount > 0 AND debit_amount = 0)
  )
);

-- Budget Planning
CREATE TABLE IF NOT EXISTS budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_reference TEXT NOT NULL UNIQUE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  account_id UUID REFERENCES chart_of_accounts(id) ON DELETE CASCADE,
  planned_amount NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assets Management
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_code TEXT NOT NULL UNIQUE,
  asset_name TEXT NOT NULL,
  asset_category TEXT NOT NULL CHECK (asset_category IN ('Land', 'Building', 'Equipment', 'Vehicle', 'Furniture', 'Other')),
  purchase_date DATE NOT NULL,
  purchase_cost NUMERIC NOT NULL,
  depreciation_method TEXT NOT NULL CHECK (depreciation_method IN ('Straight-line', 'Reducing Balance', 'Units of Production', 'None')),
  useful_life_years NUMERIC,
  depreciation_rate_percent NUMERIC, -- For reducing balance
  accumulated_depreciation NUMERIC DEFAULT 0,
  net_book_value NUMERIC, -- Auto-calculated: purchase_cost - accumulated_depreciation
  location TEXT,
  assigned_department TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Asset Depreciation Records
CREATE TABLE IF NOT EXISTS asset_depreciation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  depreciation_date DATE NOT NULL,
  depreciation_amount NUMERIC NOT NULL,
  accumulated_depreciation NUMERIC NOT NULL,
  net_book_value NUMERIC NOT NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_poultry_batches_farm_id ON poultry_batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_poultry_batches_production_type ON poultry_batches(production_type);
CREATE INDEX IF NOT EXISTS idx_poultry_batches_status ON poultry_batches(status);
CREATE INDEX IF NOT EXISTS idx_batch_stock_movements_batch_id ON batch_stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_stock_movements_date ON batch_stock_movements(date);
CREATE INDEX IF NOT EXISTS idx_feed_issuance_batch_id ON feed_issuance(batch_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_batch_id ON vaccinations(batch_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_status ON vaccinations(status);
CREATE INDEX IF NOT EXISTS idx_egg_collections_enhanced_batch_id ON egg_collections_enhanced(batch_id);
CREATE INDEX IF NOT EXISTS idx_broiler_production_batch_id ON broiler_production(batch_id);
CREATE INDEX IF NOT EXISTS idx_broiler_sales_batch_id ON broiler_sales(batch_id);
CREATE INDEX IF NOT EXISTS idx_layer_production_batch_id ON layer_production(batch_id);
CREATE INDEX IF NOT EXISTS idx_layer_sales_batch_id ON layer_sales(batch_id);
CREATE INDEX IF NOT EXISTS idx_poultry_orders_customer_id ON poultry_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);

-- =====================================================
-- FUNCTIONS & TRIGGERS for Auto-calculations
-- =====================================================

-- Function to generate batch/flock ID
CREATE OR REPLACE FUNCTION generate_batch_flock_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.batch_flock_id IS NULL OR NEW.batch_flock_id = '' THEN
    NEW.batch_flock_id := 'BATCH-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTR(NEW.id::TEXT, 1, 8);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_batch_flock_id
  BEFORE INSERT ON poultry_batches
  FOR EACH ROW
  EXECUTE FUNCTION generate_batch_flock_id();

-- Function to generate feed issuance reference
CREATE OR REPLACE FUNCTION generate_feed_issuance_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  issuance_count INTEGER;
BEGIN
  IF NEW.issuance_reference IS NULL OR NEW.issuance_reference = '' THEN
    SELECT COUNT(*) + 1 INTO issuance_count
    FROM feed_issuance
    WHERE DATE(issuance_date) = NEW.issuance_date;
    
    new_reference := 'FEED-' || TO_CHAR(NEW.issuance_date, 'YYYYMMDD') || '-' || LPAD(issuance_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM feed_issuance WHERE issuance_reference = new_reference) LOOP
      issuance_count := issuance_count + 1;
      new_reference := 'FEED-' || TO_CHAR(NEW.issuance_date, 'YYYYMMDD') || '-' || LPAD(issuance_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.issuance_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_feed_issuance_reference
  BEFORE INSERT ON feed_issuance
  FOR EACH ROW
  EXECUTE FUNCTION generate_feed_issuance_reference();

-- Function to generate order reference
CREATE OR REPLACE FUNCTION generate_order_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  order_count INTEGER;
BEGIN
  IF NEW.order_reference IS NULL OR NEW.order_reference = '' THEN
    SELECT COUNT(*) + 1 INTO order_count
    FROM poultry_orders
    WHERE DATE(order_date) = NEW.order_date;
    
    new_reference := 'ORD-' || TO_CHAR(NEW.order_date, 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM poultry_orders WHERE order_reference = new_reference) LOOP
      order_count := order_count + 1;
      new_reference := 'ORD-' || TO_CHAR(NEW.order_date, 'YYYYMMDD') || '-' || LPAD(order_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.order_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_order_reference
  BEFORE INSERT ON poultry_orders
  FOR EACH ROW
  EXECUTE FUNCTION generate_order_reference();

-- Function to generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  new_invoice_number TEXT;
  invoice_count INTEGER;
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    SELECT COUNT(*) + 1 INTO invoice_count
    FROM invoices
    WHERE DATE(invoice_date) = NEW.invoice_date;
    
    new_invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYYYMMDD') || '-' || LPAD(invoice_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM invoices WHERE invoice_number = new_invoice_number) LOOP
      invoice_count := invoice_count + 1;
      new_invoice_number := 'INV-' || TO_CHAR(NEW.invoice_date, 'YYYYMMDD') || '-' || LPAD(invoice_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.invoice_number := new_invoice_number;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION generate_invoice_number();

-- Function to generate payment reference
CREATE OR REPLACE FUNCTION generate_payment_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  payment_count INTEGER;
BEGIN
  IF NEW.payment_reference IS NULL OR NEW.payment_reference = '' THEN
    SELECT COUNT(*) + 1 INTO payment_count
    FROM payments
    WHERE DATE(payment_date) = NEW.payment_date;
    
    new_reference := 'PAY-' || TO_CHAR(NEW.payment_date, 'YYYYMMDD') || '-' || LPAD(payment_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM payments WHERE payment_reference = new_reference) LOOP
      payment_count := payment_count + 1;
      new_reference := 'PAY-' || TO_CHAR(NEW.payment_date, 'YYYYMMDD') || '-' || LPAD(payment_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.payment_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_payment_reference
  BEFORE INSERT ON payments
  FOR EACH ROW
  EXECUTE FUNCTION generate_payment_reference();

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  customer_count INTEGER;
BEGIN
  IF NEW.customer_code IS NULL OR NEW.customer_code = '' THEN
    SELECT COUNT(*) + 1 INTO customer_count
    FROM customers;
    
    new_code := 'CUST-' || LPAD(customer_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM customers WHERE customer_code = new_code) LOOP
      customer_count := customer_count + 1;
      new_code := 'CUST-' || LPAD(customer_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.customer_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_customer_code
  BEFORE INSERT ON customers
  FOR EACH ROW
  EXECUTE FUNCTION generate_customer_code();

-- Function to generate budget reference
CREATE OR REPLACE FUNCTION generate_budget_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  budget_count INTEGER;
BEGIN
  IF NEW.budget_reference IS NULL OR NEW.budget_reference = '' THEN
    SELECT COUNT(*) + 1 INTO budget_count
    FROM budgets
    WHERE period_start = NEW.period_start;
    
    new_reference := 'BUD-' || TO_CHAR(NEW.period_start, 'YYYYMMDD') || '-' || LPAD(budget_count::TEXT, 3, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM budgets WHERE budget_reference = new_reference) LOOP
      budget_count := budget_count + 1;
      new_reference := 'BUD-' || TO_CHAR(NEW.period_start, 'YYYYMMDD') || '-' || LPAD(budget_count::TEXT, 3, '0');
    END LOOP;
    
    NEW.budget_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_budget_reference
  BEFORE INSERT ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION generate_budget_reference();

-- Function to generate journal entry reference
CREATE OR REPLACE FUNCTION generate_journal_entry_reference()
RETURNS TRIGGER AS $$
DECLARE
  new_reference TEXT;
  entry_count INTEGER;
BEGIN
  IF NEW.entry_reference IS NULL OR NEW.entry_reference = '' THEN
    SELECT COUNT(*) + 1 INTO entry_count
    FROM journal_entries
    WHERE DATE(entry_date) = NEW.entry_date;
    
    new_reference := 'JE-' || TO_CHAR(NEW.entry_date, 'YYYYMMDD') || '-' || LPAD(entry_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM journal_entries WHERE entry_reference = new_reference) LOOP
      entry_count := entry_count + 1;
      new_reference := 'JE-' || TO_CHAR(NEW.entry_date, 'YYYYMMDD') || '-' || LPAD(entry_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.entry_reference := new_reference;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_journal_entry_reference
  BEFORE INSERT ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION generate_journal_entry_reference();

-- Function to generate asset code
CREATE OR REPLACE FUNCTION generate_asset_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  asset_count INTEGER;
BEGIN
  IF NEW.asset_code IS NULL OR NEW.asset_code = '' THEN
    SELECT COUNT(*) + 1 INTO asset_count
    FROM assets;
    
    new_code := 'AST-' || LPAD(asset_count::TEXT, 4, '0');
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM assets WHERE asset_code = new_code) LOOP
      asset_count := asset_count + 1;
      new_code := 'AST-' || LPAD(asset_count::TEXT, 4, '0');
    END LOOP;
    
    NEW.asset_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_generate_asset_code
  BEFORE INSERT ON assets
  FOR EACH ROW
  EXECUTE FUNCTION generate_asset_code();

-- Function to auto-calculate closing stock
CREATE OR REPLACE FUNCTION calculate_closing_stock()
RETURNS TRIGGER AS $$
BEGIN
  NEW.closing_stock := NEW.opening_stock - COALESCE(NEW.mortalities, 0) - COALESCE(NEW.culls, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_closing_stock
  BEFORE INSERT OR UPDATE ON batch_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION calculate_closing_stock();

-- Function to auto-calculate feed issuance total cost
CREATE OR REPLACE FUNCTION calculate_feed_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.unit_cost IS NOT NULL AND NEW.quantity_kg IS NOT NULL THEN
    NEW.total_cost := NEW.unit_cost * NEW.quantity_kg;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_feed_cost
  BEFORE INSERT OR UPDATE ON feed_issuance
  FOR EACH ROW
  EXECUTE FUNCTION calculate_feed_cost();

-- Function to auto-calculate vaccination total cost
CREATE OR REPLACE FUNCTION calculate_vaccination_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost_per_dosage IS NOT NULL AND NEW.number_of_birds IS NOT NULL THEN
    NEW.total_cost := NEW.cost_per_dosage * NEW.number_of_birds;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_vaccination_cost
  BEFORE INSERT OR UPDATE ON vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION calculate_vaccination_cost();

-- Function to auto-calculate net book value for assets
CREATE OR REPLACE FUNCTION calculate_net_book_value()
RETURNS TRIGGER AS $$
BEGIN
  NEW.net_book_value := NEW.purchase_cost - COALESCE(NEW.accumulated_depreciation, 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_calculate_net_book_value
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION calculate_net_book_value();

-- Function to update updated_at timestamp (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER trg_update_poultry_houses_updated_at
  BEFORE UPDATE ON poultry_houses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_poultry_batches_updated_at
  BEFORE UPDATE ON poultry_batches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_batch_stock_movements_updated_at
  BEFORE UPDATE ON batch_stock_movements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_feed_issuance_updated_at
  BEFORE UPDATE ON feed_issuance
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_vaccinations_updated_at
  BEFORE UPDATE ON vaccinations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_poultry_medications_updated_at
  BEFORE UPDATE ON poultry_medications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_egg_collections_enhanced_updated_at
  BEFORE UPDATE ON egg_collections_enhanced
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_broiler_production_updated_at
  BEFORE UPDATE ON broiler_production
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_broiler_sales_updated_at
  BEFORE UPDATE ON broiler_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_layer_production_updated_at
  BEFORE UPDATE ON layer_production
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_layer_sales_updated_at
  BEFORE UPDATE ON layer_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_poultry_orders_updated_at
  BEFORE UPDATE ON poultry_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_chart_of_accounts_updated_at
  BEFORE UPDATE ON chart_of_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_journal_entries_updated_at
  BEFORE UPDATE ON journal_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE poultry_houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE poultry_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_issuance ENABLE ROW LEVEL SECURITY;
ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE poultry_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_collections_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE broiler_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE broiler_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE layer_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE poultry_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE poultry_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_depreciation ENABLE ROW LEVEL SECURITY;

-- NOTE: RLS policies are created in a separate file: poultry_rls_policies.sql
-- Run that file AFTER running this schema to set up comprehensive access control
-- The policies follow the same pattern as your existing database_setup.sql

-- =====================================================
-- COMMENTS for Documentation
-- =====================================================

COMMENT ON TABLE poultry_batches IS 'Main table for tracking both Broiler batches and Layer flocks. Each batch is a unique production unit.';
COMMENT ON COLUMN poultry_batches.batch_flock_id IS 'Auto-generated unique identifier for each batch/flock';
COMMENT ON COLUMN poultry_batches.status IS 'Status affects which operations can be done: Planned, Active, Suspended, Closed';
COMMENT ON TABLE batch_stock_movements IS 'Daily stock movement tracking: opening, mortalities, culls, closing stock per batch';
COMMENT ON TABLE feed_issuance IS 'Feed issuance from store to batch with full cost allocation and FCR linkage';
COMMENT ON TABLE vaccinations IS 'Vaccination schedule and records with alerts for overdue vaccinations';
COMMENT ON TABLE egg_collections_enhanced IS 'Egg collection with grading: Grade A (Large, clean), Grade B (Medium), Grade C (Small), Dirty eggs';
COMMENT ON TABLE poultry_orders IS 'Customer orders for poultry products with status tracking';
COMMENT ON TABLE invoices IS 'Invoices linked to orders with auto-calculated totals, tax, discounts';
COMMENT ON TABLE payments IS 'Payment records linked to invoices with outstanding balance tracking';

