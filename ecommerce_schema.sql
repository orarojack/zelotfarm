-- =====================================================
-- Ecommerce Tables for Front Page Products
-- =====================================================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon_name TEXT, -- Name of the icon from lucide-react
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ecommerce Products (Featured Products)
CREATE TABLE IF NOT EXISTS ecommerce_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL, -- /tray, /liter, /kg, etc.
  stock_quantity NUMERIC(10,2) NOT NULL DEFAULT 0,
  stock_unit TEXT NOT NULL, -- trays, liters, kg, pieces, etc.
  location TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL, -- Link to farm if applicable
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Live Bids (Auction Products)
CREATE TABLE IF NOT EXISTS live_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  starting_price NUMERIC(10,2) NOT NULL,
  current_price NUMERIC(10,2) NOT NULL,
  unit TEXT NOT NULL,
  available_quantity TEXT NOT NULL, -- e.g., "50 trays available"
  location TEXT NOT NULL,
  image_url TEXT,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_bids INTEGER DEFAULT 0,
  is_trending BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_ecommerce_products_category ON ecommerce_products(category_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_farm ON ecommerce_products(farm_id);
CREATE INDEX IF NOT EXISTS idx_ecommerce_products_featured ON ecommerce_products(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_live_bids_active ON live_bids(is_active, end_time);
CREATE INDEX IF NOT EXISTS idx_live_bids_trending ON live_bids(is_trending, is_active);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_product_categories_updated_at BEFORE UPDATE ON product_categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ecommerce_products_updated_at BEFORE UPDATE ON ecommerce_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_live_bids_updated_at BEFORE UPDATE ON live_bids
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ecommerce_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_bids ENABLE ROW LEVEL SECURITY;

-- Product Categories: Public read, Admin write
CREATE POLICY "Public can read categories"
  ON product_categories FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admin can manage categories"
  ON product_categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Branch Manager')
    )
  );

-- Ecommerce Products: Public read, Admin write
CREATE POLICY "Public can read active products"
  ON ecommerce_products FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

CREATE POLICY "Admin can manage products"
  ON ecommerce_products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Branch Manager')
    )
  );

-- Live Bids: Public read, Admin write
CREATE POLICY "Public can read active bids"
  ON live_bids FOR SELECT
  TO authenticated, anon
  USING (is_active = true AND end_time > NOW());

CREATE POLICY "Admin can manage live bids"
  ON live_bids FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('Super Admin', 'Branch Manager')
    )
  );

-- =====================================================
-- INITIAL CATEGORIES
-- =====================================================

INSERT INTO product_categories (name, icon_name, display_order) VALUES
('Eggs', 'Egg', 1),
('Dairy Products', 'Milk', 2),
('Beef & Red Meat', 'Beef', 3),
('Poultry & Chicken', 'Drumstick', 4),
('Fish & Seafood', 'Fish', 5),
('Honey & Bee Products', 'Droplets', 6),
('Processed Meat', 'PackagePlus', 7),
('Animal Feed', 'Wheat', 8),
('Livestock Vegetables', 'Carrot', 9),
('Organic Livestock', 'Leaf', 10),
('Live Animals', 'Heart', 11),
('Livestock Equipment', 'Scaling', 12)
ON CONFLICT (name) DO NOTHING;

