-- =====================================================
-- Zealot AgriWorks Management System - Database Setup
-- =====================================================
-- Run this script in your Supabase SQL Editor
-- Make sure to run all statements in order

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. CORE TABLES (No dependencies)
-- =====================================================

-- Farms table
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Dairy', 'Broiler', 'Layer')),
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table (must be created before users table)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff')),
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  monthly_salary NUMERIC,
  payment_method TEXT CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  allowances NUMERIC DEFAULT 0,
  deductions NUMERIC DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (links to Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff')),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. CATTLE MANAGEMENT TABLES
-- =====================================================

-- Cattle table
CREATE TABLE IF NOT EXISTS cattle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT NOT NULL UNIQUE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  breed TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('Male', 'Female')),
  status TEXT NOT NULL CHECK (status IN ('Calf', 'Heifer', 'Cow', 'Bull')),
  birth_date DATE NOT NULL,
  birth_weight NUMERIC,
  mother_tag TEXT,
  father_tag TEXT,
  sale_date DATE,
  death_date DATE,
  sale_price NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cattle weights tracking
CREATE TABLE IF NOT EXISTS cattle_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_id UUID REFERENCES cattle(id) ON DELETE CASCADE,
  weight NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cattle health records
CREATE TABLE IF NOT EXISTS cattle_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_id UUID REFERENCES cattle(id) ON DELETE CASCADE,
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('Vaccination', 'Treatment', 'Checkup')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  vet_name TEXT,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Breeding records
CREATE TABLE IF NOT EXISTS breeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cow_id UUID REFERENCES cattle(id) ON DELETE CASCADE,
  bull_id UUID REFERENCES cattle(id) ON DELETE SET NULL,
  breeding_date DATE NOT NULL,
  expected_calving_date DATE,
  actual_calving_date DATE,
  calf_tag TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. DAIRY MILKING TABLE
-- =====================================================

-- Milking records
CREATE TABLE IF NOT EXISTS milking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  cow_id UUID REFERENCES cattle(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon', 'Evening')),
  milk_yield NUMERIC NOT NULL,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. POULTRY MANAGEMENT TABLES
-- =====================================================

-- Egg collections
CREATE TABLE IF NOT EXISTS egg_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  number_of_eggs INTEGER NOT NULL,
  trays INTEGER,
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Broiler batches
CREATE TABLE IF NOT EXISTS broiler_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  batch_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  initial_count INTEGER NOT NULL,
  current_count INTEGER NOT NULL,
  average_weight NUMERIC,
  feed_consumption NUMERIC,
  mortality INTEGER DEFAULT 0,
  fcr NUMERIC,
  harvest_date DATE,
  harvest_count INTEGER,
  harvest_weight NUMERIC,
  revenue NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Inventory items
CREATE TABLE IF NOT EXISTS inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feeds', 'Drugs', 'Vaccines', 'Equipment', 'Other')),
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  min_stock_level NUMERIC NOT NULL DEFAULT 0,
  unit_price NUMERIC,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory_items(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('In', 'Out', 'Transfer')),
  quantity NUMERIC NOT NULL,
  date DATE NOT NULL,
  to_farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. FINANCE TABLES
-- =====================================================

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feeds', 'Drugs & Vaccines', 'Staff Salaries', 'Casual Wages', 'Fuel & Transport', 'Repairs', 'Services', 'Miscellaneous')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue
CREATE TABLE IF NOT EXISTS revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  customer TEXT,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('Milk', 'Eggs', 'Broilers', 'Male Calves', 'Heifers', 'Other Products')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Casual wages
CREATE TABLE IF NOT EXISTS casual_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  task TEXT NOT NULL,
  hours NUMERIC,
  days NUMERIC,
  rate NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 7. STAFF MANAGEMENT TABLES
-- =====================================================

-- Staff attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  hours_worked NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 8. AUDIT LOGS TABLE
-- =====================================================

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 9. INDEXES FOR PERFORMANCE
-- =====================================================

-- Farms indexes
CREATE INDEX IF NOT EXISTS idx_farms_type ON farms(type);

-- Cattle indexes
CREATE INDEX IF NOT EXISTS idx_cattle_farm_id ON cattle(farm_id);
CREATE INDEX IF NOT EXISTS idx_cattle_tag_id ON cattle(tag_id);
CREATE INDEX IF NOT EXISTS idx_cattle_status ON cattle(status);
CREATE INDEX IF NOT EXISTS idx_cattle_gender ON cattle(gender);

-- Milking records indexes
CREATE INDEX IF NOT EXISTS idx_milking_records_date ON milking_records(date);
CREATE INDEX IF NOT EXISTS idx_milking_records_farm_id ON milking_records(farm_id);
CREATE INDEX IF NOT EXISTS idx_milking_records_cow_id ON milking_records(cow_id);
CREATE INDEX IF NOT EXISTS idx_milking_records_staff_id ON milking_records(staff_id);

-- Egg collections indexes
CREATE INDEX IF NOT EXISTS idx_egg_collections_date ON egg_collections(date);
CREATE INDEX IF NOT EXISTS idx_egg_collections_farm_id ON egg_collections(farm_id);

-- Broiler batches indexes
CREATE INDEX IF NOT EXISTS idx_broiler_batches_farm_id ON broiler_batches(farm_id);
CREATE INDEX IF NOT EXISTS idx_broiler_batches_start_date ON broiler_batches(start_date);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_items_farm_id ON inventory_items(farm_id);
CREATE INDEX IF NOT EXISTS idx_inventory_items_category ON inventory_items(category);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_farm_id ON expenses(farm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_farm_id ON revenue(farm_id);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue(revenue_type);
CREATE INDEX IF NOT EXISTS idx_casual_wages_date ON casual_wages(date);
CREATE INDEX IF NOT EXISTS idx_casual_wages_staff_id ON casual_wages(staff_id);

-- Staff indexes
CREATE INDEX IF NOT EXISTS idx_staff_farm_id ON staff(farm_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON staff(role);
CREATE INDEX IF NOT EXISTS idx_staff_is_active ON staff(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_staff_id ON staff_attendance(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_attendance_date ON staff_attendance(date);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_requires_approval ON audit_logs(requires_approval);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_staff_id ON users(staff_id);

-- =====================================================
-- 10. FUNCTIONS FOR UPDATED_AT TIMESTAMP
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_farms_updated_at BEFORE UPDATE ON farms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cattle_updated_at BEFORE UPDATE ON cattle
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_breeding_updated_at BEFORE UPDATE ON breeding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_milking_records_updated_at BEFORE UPDATE ON milking_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_egg_collections_updated_at BEFORE UPDATE ON egg_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_broiler_batches_updated_at BEFORE UPDATE ON broiler_batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_updated_at BEFORE UPDATE ON revenue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_casual_wages_updated_at BEFORE UPDATE ON casual_wages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle_weights ENABLE ROW LEVEL SECURITY;
ALTER TABLE cattle_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE breeding ENABLE ROW LEVEL SECURITY;
ALTER TABLE milking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE broiler_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE casual_wages ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to get user role (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get staff farm_id (security definer to avoid RLS recursion)
CREATE OR REPLACE FUNCTION get_staff_farm_id(user_uuid UUID)
RETURNS UUID AS $$
DECLARE
  farm_uuid UUID;
BEGIN
  SELECT s.farm_id INTO farm_uuid
  FROM users u 
  JOIN staff s ON u.staff_id = s.id 
  WHERE u.id = user_uuid
  LIMIT 1;
  
  RETURN farm_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS POLICIES FOR FARMS
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on farms"
  ON farms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

-- Branch Manager: Access to assigned farms
CREATE POLICY "Branch Manager access to assigned farms"
  ON farms FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Branch Manager'
      AND (s.farm_id = farms.id OR s.farm_id IS NULL)
    )
  );

-- Others: Read access to all farms
CREATE POLICY "Read access to farms"
  ON farms FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- RLS POLICIES FOR STAFF
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on staff"
  ON staff FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

-- Branch Manager and Accountant: Read access
CREATE POLICY "Branch Manager and Accountant read staff"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Branch Manager', 'Accountant')
    )
  );

-- All authenticated users: Read their own staff record
CREATE POLICY "Users can read own staff record"
  ON staff FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.staff_id = staff.id
    )
  );

-- =====================================================
-- RLS POLICIES FOR USERS
-- =====================================================
-- Note: We use security definer functions to avoid infinite recursion

-- Create security definer function to check if user is super admin
-- This bypasses RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_super_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  RETURN user_role = 'Super Admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Users can read their own record (simple check, no recursion)
CREATE POLICY "Users can read own record"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Super Admin: Full access (uses security definer function to avoid recursion)
CREATE POLICY "Super Admin full access on users"
  ON users FOR ALL
  TO authenticated
  USING (is_super_admin(auth.uid()));

-- Allow authenticated users to insert their own record
CREATE POLICY "Allow authenticated users to insert"
  ON users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "Users can update own record"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- RLS POLICIES FOR CATTLE
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on cattle"
  ON cattle FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

-- Branch Manager and Vet: Full access to assigned farms
CREATE POLICY "Branch Manager and Vet access cattle"
  ON cattle FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Vet')
      AND (s.farm_id = cattle.farm_id OR s.farm_id IS NULL)
    )
  );

-- Others: Read access
CREATE POLICY "Read access to cattle"
  ON cattle FOR SELECT
  TO authenticated
  USING (true);

-- Similar policies for cattle_weights, cattle_health, breeding
CREATE POLICY "Cattle weights access"
  ON cattle_weights FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cattle
      WHERE cattle.id = cattle_weights.cattle_id
    )
  );

CREATE POLICY "Cattle health access"
  ON cattle_health FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cattle
      WHERE cattle.id = cattle_health.cattle_id
    )
  );

CREATE POLICY "Breeding access"
  ON breeding FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM cattle
      WHERE cattle.id = breeding.cow_id
    )
  );

-- =====================================================
-- RLS POLICIES FOR MILKING RECORDS
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on milking"
  ON milking_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

-- Branch Manager and Field Staff: Access to assigned farms
CREATE POLICY "Branch Manager and Field Staff access milking"
  ON milking_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = milking_records.farm_id OR s.farm_id IS NULL)
    )
  );

-- Others: Read access
CREATE POLICY "Read access to milking"
  ON milking_records FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- RLS POLICIES FOR POULTRY
-- =====================================================

-- Similar policies for egg_collections and broiler_batches
CREATE POLICY "Super Admin full access on egg collections"
  ON egg_collections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Branch Manager and Field Staff access egg collections"
  ON egg_collections FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = egg_collections.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to egg collections"
  ON egg_collections FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Super Admin full access on broiler batches"
  ON broiler_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Branch Manager and Field Staff access broiler batches"
  ON broiler_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = broiler_batches.farm_id OR s.farm_id IS NULL)
    )
  );

-- =====================================================
-- RLS POLICIES FOR INVENTORY
-- =====================================================

CREATE POLICY "Super Admin full access on inventory"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Branch Manager and Storekeeper access inventory"
  ON inventory_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Storekeeper')
      AND (s.farm_id = inventory_items.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to inventory"
  ON inventory_items FOR SELECT
  TO authenticated
  USING (true);

-- Similar for stock_movements
CREATE POLICY "Stock movements access"
  ON stock_movements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM inventory_items
      WHERE inventory_items.id = stock_movements.inventory_id
    )
  );

-- =====================================================
-- RLS POLICIES FOR FINANCE
-- =====================================================

CREATE POLICY "Super Admin full access on expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Accountant and Branch Manager access expenses"
  ON expenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Accountant', 'Branch Manager')
    )
  );

CREATE POLICY "Read access to expenses"
  ON expenses FOR SELECT
  TO authenticated
  USING (true);

-- Similar for revenue
CREATE POLICY "Super Admin full access on revenue"
  ON revenue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

CREATE POLICY "Accountant and Branch Manager access revenue"
  ON revenue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Accountant', 'Branch Manager')
    )
  );

CREATE POLICY "Read access to revenue"
  ON revenue FOR SELECT
  TO authenticated
  USING (true);

-- Similar for casual_wages
CREATE POLICY "Casual wages access"
  ON casual_wages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Accountant', 'Branch Manager')
    )
  );

-- =====================================================
-- RLS POLICIES FOR STAFF ATTENDANCE
-- =====================================================

CREATE POLICY "Staff attendance access"
  ON staff_attendance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND (
        u.role = 'Super Admin'
        OR u.staff_id = staff_attendance.staff_id
      )
    )
  );

-- =====================================================
-- RLS POLICIES FOR AUDIT LOGS
-- =====================================================

CREATE POLICY "Super Admin and Branch Manager access audit logs"
  ON audit_logs FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Branch Manager')
    )
  );

CREATE POLICY "Users can read own audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'All tables, indexes, triggers, and RLS policies have been created.';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Create your first admin user in Supabase Auth';
  RAISE NOTICE '2. Insert a record in the users table linking to auth.users';
  RAISE NOTICE '3. Optionally create a staff record and link it';
END $$;

