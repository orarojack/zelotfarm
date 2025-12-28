-- =====================================================
-- Poultry Management System - RLS Policies
-- =====================================================
-- Run this AFTER running poultry_complete_schema.sql
-- This creates comprehensive RLS policies for all poultry tables
-- =====================================================

-- Helper function to check if user is Super Admin (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION is_super_admin_poultry(user_uuid UUID)
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

-- Helper function to get staff farm_id
CREATE OR REPLACE FUNCTION get_staff_farm_id_poultry(user_uuid UUID)
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
-- POULTRY HOUSES RLS POLICIES
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on poultry_houses"
  ON poultry_houses FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

-- Branch Manager: Access to assigned farms
CREATE POLICY "Branch Manager access poultry_houses"
  ON poultry_houses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Branch Manager'
      AND (s.farm_id = poultry_houses.farm_id OR s.farm_id IS NULL)
    )
  );

-- Others: Read access
CREATE POLICY "Read access to poultry_houses"
  ON poultry_houses FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- POULTRY BATCHES RLS POLICIES
-- =====================================================

-- Super Admin: Full access
CREATE POLICY "Super Admin full access on poultry_batches"
  ON poultry_batches FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

-- Branch Manager, Vet, Field Staff: Access to assigned farms
CREATE POLICY "Staff access poultry_batches"
  ON poultry_batches FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Vet', 'Field Staff')
      AND (s.farm_id = poultry_batches.farm_id OR s.farm_id IS NULL)
    )
  );

-- Others: Read access
CREATE POLICY "Read access to poultry_batches"
  ON poultry_batches FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- BATCH STOCK MOVEMENTS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on batch_stock_movements"
  ON batch_stock_movements FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access batch_stock_movements"
  ON batch_stock_movements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON batch_stock_movements.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Vet', 'Field Staff')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to batch_stock_movements"
  ON batch_stock_movements FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- FEED ISSUANCE RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on feed_issuance"
  ON feed_issuance FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access feed_issuance"
  ON feed_issuance FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON feed_issuance.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Storekeeper', 'Field Staff')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to feed_issuance"
  ON feed_issuance FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- VACCINATIONS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on vaccinations"
  ON vaccinations FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Vet and Branch Manager access vaccinations"
  ON vaccinations FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON vaccinations.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Vet')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to vaccinations"
  ON vaccinations FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- POULTRY MEDICATIONS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on poultry_medications"
  ON poultry_medications FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Vet and Branch Manager access poultry_medications"
  ON poultry_medications FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON poultry_medications.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Vet')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to poultry_medications"
  ON poultry_medications FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- EGG COLLECTIONS ENHANCED RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on egg_collections_enhanced"
  ON egg_collections_enhanced FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access egg_collections_enhanced"
  ON egg_collections_enhanced FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = egg_collections_enhanced.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to egg_collections_enhanced"
  ON egg_collections_enhanced FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- BROILER PRODUCTION RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on broiler_production"
  ON broiler_production FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access broiler_production"
  ON broiler_production FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON broiler_production.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to broiler_production"
  ON broiler_production FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- BROILER SALES RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on broiler_sales"
  ON broiler_sales FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access broiler_sales"
  ON broiler_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON broiler_sales.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff', 'Accountant')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to broiler_sales"
  ON broiler_sales FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- LAYER PRODUCTION RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on layer_production"
  ON layer_production FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access layer_production"
  ON layer_production FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON layer_production.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to layer_production"
  ON layer_production FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- LAYER SALES RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on layer_sales"
  ON layer_sales FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access layer_sales"
  ON layer_sales FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_batches pb ON layer_sales.batch_id = pb.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff', 'Accountant')
      AND (s.farm_id = pb.farm_id OR s.farm_id IS NULL)
    )
  );

CREATE POLICY "Read access to layer_sales"
  ON layer_sales FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- CUSTOMERS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on customers"
  ON customers FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Branch Manager and Accountant access customers"
  ON customers FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Accountant')
    )
  );

CREATE POLICY "Read access to customers"
  ON customers FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- POULTRY ORDERS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on poultry_orders"
  ON poultry_orders FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access poultry_orders"
  ON poultry_orders FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff', 'Accountant')
    )
  );

CREATE POLICY "Read access to poultry_orders"
  ON poultry_orders FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- POULTRY ORDER ITEMS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on poultry_order_items"
  ON poultry_order_items FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Staff access poultry_order_items"
  ON poultry_order_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN poultry_orders po ON poultry_order_items.order_id = po.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Field Staff', 'Accountant')
    )
  );

CREATE POLICY "Read access to poultry_order_items"
  ON poultry_order_items FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- INVOICES RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant and Branch Manager access invoices"
  ON invoices FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Accountant')
    )
  );

CREATE POLICY "Read access to invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- INVOICE ITEMS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on invoice_items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant and Branch Manager access invoice_items"
  ON invoice_items FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN invoices inv ON invoice_items.invoice_id = inv.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Accountant')
    )
  );

CREATE POLICY "Read access to invoice_items"
  ON invoice_items FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- PAYMENTS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on payments"
  ON payments FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant and Branch Manager access payments"
  ON payments FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role IN ('Branch Manager', 'Accountant')
    )
  );

CREATE POLICY "Read access to payments"
  ON payments FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- CHART OF ACCOUNTS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on chart_of_accounts"
  ON chart_of_accounts FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access chart_of_accounts"
  ON chart_of_accounts FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to chart_of_accounts"
  ON chart_of_accounts FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- JOURNAL ENTRIES RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on journal_entries"
  ON journal_entries FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access journal_entries"
  ON journal_entries FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to journal_entries"
  ON journal_entries FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- JOURNAL ENTRY LINES RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on journal_entry_lines"
  ON journal_entry_lines FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access journal_entry_lines"
  ON journal_entry_lines FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN journal_entries je ON journal_entry_lines.journal_entry_id = je.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to journal_entry_lines"
  ON journal_entry_lines FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- BUDGETS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access budgets"
  ON budgets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to budgets"
  ON budgets FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- ASSETS RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on assets"
  ON assets FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access assets"
  ON assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to assets"
  ON assets FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- ASSET DEPRECIATION RLS POLICIES
-- =====================================================

CREATE POLICY "Super Admin full access on asset_depreciation"
  ON asset_depreciation FOR ALL
  TO authenticated
  USING (is_super_admin_poultry(auth.uid()));

CREATE POLICY "Accountant access asset_depreciation"
  ON asset_depreciation FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      JOIN assets a ON asset_depreciation.asset_id = a.id
      WHERE u.id = auth.uid()
      AND s.role = 'Accountant'
    )
  );

CREATE POLICY "Read access to asset_depreciation"
  ON asset_depreciation FOR SELECT
  TO authenticated
  USING (true);

