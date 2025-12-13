-- =====================================================
-- Dynamic Role and Permissions Management System
-- =====================================================
-- Run this script in Supabase SQL Editor

-- Custom Roles table (extends the default roles)
CREATE TABLE IF NOT EXISTS custom_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  is_system_role BOOLEAN DEFAULT FALSE, -- System roles cannot be deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default system roles
INSERT INTO custom_roles (name, description, is_system_role)
VALUES 
  ('Super Admin', 'Full access to all modules and settings', true),
  ('Branch Manager', 'Manage assigned farms and operations', true),
  ('Vet', 'Manage cattle health and treatments', true),
  ('Storekeeper', 'Manage inventory and stock', true),
  ('Accountant', 'Manage finances, salaries, and expenses', true),
  ('Field Staff', 'Record daily operations (milking, eggs)', true)
ON CONFLICT (name) DO NOTHING;

-- Role Permissions table (maps roles to modules)
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID REFERENCES custom_roles(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL, -- Denormalized for easier queries
  module_path TEXT NOT NULL, -- e.g., '/admin/cattle', '/admin/milking'
  module_name TEXT NOT NULL, -- e.g., 'Cattle', 'Milking'
  can_view BOOLEAN DEFAULT TRUE,
  can_create BOOLEAN DEFAULT FALSE,
  can_update BOOLEAN DEFAULT FALSE,
  can_delete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(role_id, module_path)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_name ON role_permissions(role_name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_module_path ON role_permissions(module_path);

-- Update users table to reference custom_roles
-- First, add a column to link to custom_roles (optional, for custom roles)
ALTER TABLE users ADD COLUMN IF NOT EXISTS custom_role_id UUID REFERENCES custom_roles(id) ON DELETE SET NULL;

-- Function to get user's effective role (custom or default)
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
  custom_role_name TEXT;
BEGIN
  -- First check if user has a custom role
  SELECT cr.name INTO custom_role_name
  FROM users u
  JOIN custom_roles cr ON u.custom_role_id = cr.id
  WHERE u.id = user_uuid;
  
  IF custom_role_name IS NOT NULL THEN
    RETURN custom_role_name;
  END IF;
  
  -- Otherwise return the default role from users.role
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid;
  
  RETURN COALESCE(user_role, '');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for custom_roles
ALTER TABLE custom_roles ENABLE ROW LEVEL SECURITY;

-- Create a security definer function to check if user is super admin
-- This bypasses RLS to avoid infinite recursion
CREATE OR REPLACE FUNCTION is_super_admin_for_roles(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
  custom_role_name TEXT;
BEGIN
  -- First check default role
  SELECT role INTO user_role
  FROM users
  WHERE id = user_uuid
  LIMIT 1;
  
  IF user_role = 'Super Admin' THEN
    RETURN true;
  END IF;
  
  -- Then check custom role (only if custom_role_id exists)
  SELECT cr.name INTO custom_role_name
  FROM users u
  JOIN custom_roles cr ON u.custom_role_id = cr.id
  WHERE u.id = user_uuid
  LIMIT 1;
  
  RETURN COALESCE(custom_role_name = 'Super Admin', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Super Admin full access on custom_roles" ON custom_roles;

CREATE POLICY "Super Admin full access on custom_roles"
  ON custom_roles FOR ALL
  TO authenticated
  USING (is_super_admin_for_roles(auth.uid()));

-- All authenticated users can read custom roles (needed for joins)
-- This is safe because role names are not sensitive
DROP POLICY IF EXISTS "Users can read custom roles" ON custom_roles;

CREATE POLICY "Users can read custom roles"
  ON custom_roles FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for role_permissions
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super Admin full access on role_permissions"
  ON role_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND (users.role = 'Super Admin' OR EXISTS (
        SELECT 1 FROM custom_roles cr
        WHERE cr.id = users.custom_role_id
        AND cr.name = 'Super Admin'
      ))
    )
  );

-- All authenticated users can read their own role permissions
CREATE POLICY "Users can read own role permissions"
  ON role_permissions FOR SELECT
  TO authenticated
  USING (
    role_name = (
      SELECT COALESCE(cr.name, u.role)
      FROM users u
      LEFT JOIN custom_roles cr ON u.custom_role_id = cr.id
      WHERE u.id = auth.uid()
    )
  );

-- Insert default permissions for system roles
-- This will be done via the UI, but we can add some defaults here
DO $$
DECLARE
  super_admin_id UUID;
  branch_manager_id UUID;
  vet_id UUID;
  storekeeper_id UUID;
  accountant_id UUID;
  field_staff_id UUID;
BEGIN
  -- Get role IDs
  SELECT id INTO super_admin_id FROM custom_roles WHERE name = 'Super Admin';
  SELECT id INTO branch_manager_id FROM custom_roles WHERE name = 'Branch Manager';
  SELECT id INTO vet_id FROM custom_roles WHERE name = 'Vet';
  SELECT id INTO storekeeper_id FROM custom_roles WHERE name = 'Storekeeper';
  SELECT id INTO accountant_id FROM custom_roles WHERE name = 'Accountant';
  SELECT id INTO field_staff_id FROM custom_roles WHERE name = 'Field Staff';

  -- Super Admin: Full access to all modules
  IF super_admin_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (super_admin_id, 'Super Admin', '/admin', 'Dashboard', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/farms', 'Farms', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/cattle', 'Cattle', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/milking', 'Milking', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/poultry', 'Poultry', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/inventory', 'Inventory', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/finance', 'Finance', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/staff', 'Staff', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/users', 'Users', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/reports', 'Reports', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/approvals', 'Approvals', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/ecommerce', 'Ecommerce', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/orders', 'Orders', true, true, true, true),
      (super_admin_id, 'Super Admin', '/admin/profile', 'Profile', true, true, true, true)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;

  -- Branch Manager permissions
  IF branch_manager_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (branch_manager_id, 'Branch Manager', '/admin', 'Dashboard', true, false, false, false),
      (branch_manager_id, 'Branch Manager', '/admin/farms', 'Farms', true, false, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/cattle', 'Cattle', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/milking', 'Milking', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/poultry', 'Poultry', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/inventory', 'Inventory', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/finance', 'Finance', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/staff', 'Staff', true, false, false, false),
      (branch_manager_id, 'Branch Manager', '/admin/reports', 'Reports', true, false, false, false),
      (branch_manager_id, 'Branch Manager', '/admin/approvals', 'Approvals', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/ecommerce', 'Ecommerce', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/orders', 'Orders', true, true, true, false),
      (branch_manager_id, 'Branch Manager', '/admin/profile', 'Profile', true, true, true, false)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;

  -- Vet permissions
  IF vet_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (vet_id, 'Vet', '/admin', 'Dashboard', true, false, false, false),
      (vet_id, 'Vet', '/admin/cattle', 'Cattle', true, false, true, false),
      (vet_id, 'Vet', '/admin/reports', 'Reports', true, false, false, false),
      (vet_id, 'Vet', '/admin/profile', 'Profile', true, true, true, false)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;

  -- Storekeeper permissions
  IF storekeeper_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (storekeeper_id, 'Storekeeper', '/admin', 'Dashboard', true, false, false, false),
      (storekeeper_id, 'Storekeeper', '/admin/inventory', 'Inventory', true, true, true, false),
      (storekeeper_id, 'Storekeeper', '/admin/reports', 'Reports', true, false, false, false),
      (storekeeper_id, 'Storekeeper', '/admin/profile', 'Profile', true, true, true, false)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;

  -- Accountant permissions
  IF accountant_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (accountant_id, 'Accountant', '/admin', 'Dashboard', true, false, false, false),
      (accountant_id, 'Accountant', '/admin/finance', 'Finance', true, true, true, true),
      (accountant_id, 'Accountant', '/admin/staff', 'Staff', true, false, false, false),
      (accountant_id, 'Accountant', '/admin/reports', 'Reports', true, false, false, false),
      (accountant_id, 'Accountant', '/admin/profile', 'Profile', true, true, true, false)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;

  -- Field Staff permissions
  IF field_staff_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, role_name, module_path, module_name, can_view, can_create, can_update, can_delete)
    VALUES 
      (field_staff_id, 'Field Staff', '/admin', 'Dashboard', true, false, false, false),
      (field_staff_id, 'Field Staff', '/admin/milking', 'Milking', true, true, false, false),
      (field_staff_id, 'Field Staff', '/admin/poultry', 'Poultry', true, true, false, false),
      (field_staff_id, 'Field Staff', '/admin/profile', 'Profile', true, true, true, false)
    ON CONFLICT (role_id, module_path) DO NOTHING;
  END IF;
END $$;

