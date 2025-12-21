# Database Schema Reference

This document outlines the database tables required for the Zealot AgriWorks Management System. Use this as a reference when setting up your Supabase database.

## Core Tables

### farms
```sql
CREATE TABLE farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Dairy', 'Broiler', 'Layer', 'Other')),
  location TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### cattle
```sql
CREATE TABLE cattle (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id TEXT NOT NULL UNIQUE,
  farm_id UUID REFERENCES farms(id),
  cow_name TEXT,
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
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### milking_records
```sql
CREATE TABLE milking_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  cow_id UUID REFERENCES cattle(id),
  date DATE NOT NULL,
  session TEXT NOT NULL CHECK (session IN ('Morning', 'Afternoon', 'Evening')),
  milk_yield NUMERIC NOT NULL,
  milk_status TEXT NOT NULL DEFAULT 'Consumption' CHECK (milk_status IN ('Consumption', 'Colostrum')),
  staff_id UUID REFERENCES staff(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### egg_collections
```sql
CREATE TABLE egg_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  date DATE NOT NULL,
  number_of_eggs INTEGER NOT NULL,
  egg_status TEXT NOT NULL DEFAULT 'Good' CHECK (egg_status IN ('Good', 'Broken', 'Spoiled')),
  trays INTEGER,
  staff_id UUID REFERENCES staff(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### broiler_batches
```sql
CREATE TABLE broiler_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  batch_number TEXT NOT NULL,
  start_date DATE NOT NULL,
  initial_count INTEGER NOT NULL,
  current_count INTEGER NOT NULL,
  average_weight NUMERIC,
  feed_consumption NUMERIC,
  mortality INTEGER,
  fcr NUMERIC,
  harvest_date DATE,
  harvest_count INTEGER,
  harvest_weight NUMERIC,
  revenue NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### inventory_items
```sql
CREATE TABLE inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feeds', 'Drugs', 'Vaccines', 'Equipment', 'Other')),
  unit TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  min_stock_level NUMERIC NOT NULL,
  unit_price NUMERIC,
  supplier TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### stock_movements
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID REFERENCES inventory_items(id),
  farm_id UUID REFERENCES farms(id),
  movement_type TEXT NOT NULL CHECK (movement_type IN ('In', 'Out', 'Transfer')),
  quantity NUMERIC NOT NULL,
  date DATE NOT NULL,
  to_farm_id UUID REFERENCES farms(id),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### expenses
```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Feeds', 'Drugs & Vaccines', 'Staff Salaries', 'Casual Wages', 'Fuel & Transport', 'Repairs', 'Services', 'Miscellaneous')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### revenue
```sql
CREATE TABLE revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID REFERENCES farms(id),
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  customer TEXT,
  revenue_type TEXT NOT NULL CHECK (revenue_type IN ('Milk', 'Eggs', 'Broilers', 'Male Calves', 'Heifers', 'Other Products')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### staff
```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff')),
  farm_id UUID REFERENCES farms(id),
  monthly_salary NUMERIC,
  payment_method TEXT CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  allowances NUMERIC,
  deductions NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### casual_wages
```sql
CREATE TABLE casual_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  farm_id UUID REFERENCES farms(id),
  date DATE NOT NULL,
  task TEXT NOT NULL,
  hours NUMERIC,
  days NUMERIC,
  rate NUMERIC NOT NULL,
  total NUMERIC NOT NULL,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('MPesa', 'Cash', 'Bank Transfer', 'Cheque')),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('Super Admin', 'Branch Manager', 'Vet', 'Storekeeper', 'Accountant', 'Field Staff')),
  staff_id UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### audit_logs (Optional - for approval workflow)
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE')),
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES auth.users(id),
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Additional Tables (Optional)

### cattle_weights
```sql
CREATE TABLE cattle_weights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_id UUID REFERENCES cattle(id),
  weight NUMERIC NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### cattle_health
```sql
CREATE TABLE cattle_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cattle_id UUID REFERENCES cattle(id),
  treatment_type TEXT NOT NULL CHECK (treatment_type IN ('Vaccination', 'Treatment', 'Checkup')),
  description TEXT NOT NULL,
  date DATE NOT NULL,
  vet_name TEXT,
  cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### breeding
```sql
CREATE TABLE breeding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cow_id UUID REFERENCES cattle(id),
  bull_id UUID REFERENCES cattle(id),
  breeding_date DATE NOT NULL,
  expected_calving_date DATE,
  actual_calving_date DATE,
  calf_tag TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### staff_attendance
```sql
CREATE TABLE staff_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id),
  date DATE NOT NULL,
  check_in TIME,
  check_out TIME,
  hours_worked NUMERIC,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS)

Enable RLS on all tables and create policies based on user roles. Example:

```sql
ALTER TABLE farms ENABLE ROW LEVEL SECURITY;

-- Super Admin can do everything
CREATE POLICY "Super Admin full access" ON farms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'Super Admin'
    )
  );

-- Branch Manager can manage assigned farms
CREATE POLICY "Branch Manager access" ON farms
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users u
      JOIN staff s ON u.staff_id = s.id
      WHERE u.id = auth.uid()
      AND s.role = 'Branch Manager'
      AND s.farm_id = farms.id
    )
  );
```

## Indexes

Create indexes for better performance:

```sql
CREATE INDEX idx_cattle_farm_id ON cattle(farm_id);
CREATE INDEX idx_milking_records_date ON milking_records(date);
CREATE INDEX idx_milking_records_farm_id ON milking_records(farm_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_revenue_date ON revenue(date);
CREATE INDEX idx_staff_farm_id ON staff(farm_id);
```

## Notes

1. All timestamps use `TIMESTAMP WITH TIME ZONE` for proper timezone handling
2. Use UUIDs for all primary keys for better scalability
3. Foreign keys ensure referential integrity
4. CHECK constraints enforce data validation at the database level
5. Enable RLS on all tables for security
6. Create appropriate indexes for frequently queried columns

