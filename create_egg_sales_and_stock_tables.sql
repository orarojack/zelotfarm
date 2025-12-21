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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_egg_sales_farm_id ON egg_sales(farm_id);
CREATE INDEX IF NOT EXISTS idx_egg_sales_date ON egg_sales(date);
CREATE INDEX IF NOT EXISTS idx_egg_stock_initial_farm_id ON egg_stock_initial(farm_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_egg_sales_updated_at BEFORE UPDATE ON egg_sales
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_egg_stock_initial_updated_at BEFORE UPDATE ON egg_stock_initial
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE egg_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE egg_stock_initial ENABLE ROW LEVEL SECURITY;

-- RLS Policies for egg_sales
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

CREATE POLICY "Read access to egg sales"
  ON egg_sales FOR SELECT
  TO authenticated
  USING (true);

-- RLS Policies for egg_stock_initial
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

CREATE POLICY "Read access to egg stock initial"
  ON egg_stock_initial FOR SELECT
  TO authenticated
  USING (true);

