-- =====================================================
-- Zealot AgriWorks - Simple Demo Data
-- =====================================================
-- This is a simpler version that works better with Supabase
-- Run this AFTER running database_setup.sql and creating at least one user

-- IMPORTANT: Before running, get your user ID:
-- SELECT id FROM auth.users LIMIT 1;
-- Then replace 'USER_ID_HERE' below with that ID

-- =====================================================
-- 1. FARMS
-- =====================================================

INSERT INTO farms (name, type, location) VALUES
('Githunguri Kahunira', 'Dairy', 'Githunguri'),
('Mutuya Farm', 'Dairy', 'Mutuya'),
('Githunguri Broilers', 'Broiler', 'Githunguri'),
('Mutuya Layers', 'Layer', 'Mutuya')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. STAFF MEMBERS
-- =====================================================

-- First, let's insert staff and get their IDs
DO $$
DECLARE
  ghk_farm_id UUID;
  mty_farm_id UUID;
  layer_farm_id UUID;
  broiler_farm_id UUID;
  admin_staff_id UUID;
  manager1_staff_id UUID;
  manager2_staff_id UUID;
  vet1_staff_id UUID;
  vet2_staff_id UUID;
  store1_staff_id UUID;
  store2_staff_id UUID;
  accountant_staff_id UUID;
  field1_staff_id UUID;
  field2_staff_id UUID;
  field3_staff_id UUID;
  field4_staff_id UUID;
  field5_staff_id UUID;
BEGIN
  -- Get farm IDs
  SELECT id INTO ghk_farm_id FROM farms WHERE name = 'Githunguri Kahunira';
  SELECT id INTO mty_farm_id FROM farms WHERE name = 'Mutuya Farm';
  SELECT id INTO layer_farm_id FROM farms WHERE name = 'Mutuya Layers';
  SELECT id INTO broiler_farm_id FROM farms WHERE name = 'Githunguri Broilers';

  -- Insert staff
  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Njuguna Isaac', 'isaaczealot2024@gmail.com', '+254708500722', 'Super Admin', NULL, 150000, 'Bank Transfer', 20000, 5000, true)
  RETURNING id INTO admin_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Ezekiel Maina', 'ezekiel.maina@zealotagriworks.com', '+254712345678', 'Branch Manager', ghk_farm_id, 80000, 'MPesa', 10000, 3000, true)
  RETURNING id INTO manager1_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Mary Wanjiku', 'mary.wanjiku@zealotagriworks.com', '+254723456789', 'Branch Manager', mty_farm_id, 80000, 'Bank Transfer', 10000, 3000, true)
  RETURNING id INTO manager2_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Dr. James Kariuki', 'james.kariuki@zealotagriworks.com', '+254734567890', 'Vet', ghk_farm_id, 70000, 'Bank Transfer', 5000, 2000, true)
  RETURNING id INTO vet1_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Dr. Sarah Njeri', 'sarah.njeri@zealotagriworks.com', '+254745678901', 'Vet', mty_farm_id, 70000, 'MPesa', 5000, 2000, true)
  RETURNING id INTO vet2_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Peter Kamau', 'peter.kamau@zealotagriworks.com', '+254756789012', 'Storekeeper', ghk_farm_id, 45000, 'Cash', 3000, 1000, true)
  RETURNING id INTO store1_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Grace Muthoni', 'grace.muthoni@zealotagriworks.com', '+254767890123', 'Storekeeper', mty_farm_id, 45000, 'MPesa', 3000, 1000, true)
  RETURNING id INTO store2_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('David Ochieng', 'david.ochieng@zealotagriworks.com', '+254778901234', 'Accountant', NULL, 60000, 'Bank Transfer', 5000, 2500, true)
  RETURNING id INTO accountant_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('John Mwangi', 'john.mwangi@zealotagriworks.com', '+254789012345', 'Field Staff', ghk_farm_id, 35000, 'MPesa', 2000, 500, true)
  RETURNING id INTO field1_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Jane Wambui', 'jane.wambui@zealotagriworks.com', '+254790123456', 'Field Staff', ghk_farm_id, 35000, 'Cash', 2000, 500, true)
  RETURNING id INTO field2_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Paul Otieno', 'paul.otieno@zealotagriworks.com', '+254701234567', 'Field Staff', mty_farm_id, 35000, 'MPesa', 2000, 500, true)
  RETURNING id INTO field3_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Ruth Achieng', 'ruth.achieng@zealotagriworks.com', '+254712345678', 'Field Staff', layer_farm_id, 35000, 'Cash', 2000, 500, true)
  RETURNING id INTO field4_staff_id;

  INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active)
  VALUES ('Simon Kipchoge', 'simon.kipchoge@zealotagriworks.com', '+254723456789', 'Field Staff', broiler_farm_id, 35000, 'MPesa', 2000, 500, true)
  RETURNING id INTO field5_staff_id;

  RAISE NOTICE 'Staff inserted successfully';
END $$;

-- =====================================================
-- 3. CATTLE RECORDS
-- =====================================================

DO $$
DECLARE
  ghk_farm_id UUID;
  mty_farm_id UUID;
  bull1_id UUID;
  bull2_id UUID;
BEGIN
  SELECT id INTO ghk_farm_id FROM farms WHERE name = 'Githunguri Kahunira';
  SELECT id INTO mty_farm_id FROM farms WHERE name = 'Mutuya Farm';

  -- Githunguri Kahunira Cattle
  INSERT INTO cattle (tag_id, farm_id, breed, gender, status, birth_date, birth_weight, notes) VALUES
  ('GHK-001', ghk_farm_id, 'Friesian', 'Female', 'Cow', '2018-03-15', 38.5, 'High milk producer'),
  ('GHK-002', ghk_farm_id, 'Friesian', 'Female', 'Cow', '2019-01-20', 40.2, 'Good breeding history'),
  ('GHK-003', ghk_farm_id, 'Ayrshire', 'Female', 'Cow', '2018-11-10', 36.8, 'Regular milker'),
  ('GHK-004', ghk_farm_id, 'Friesian', 'Female', 'Cow', '2019-05-25', 39.1, NULL),
  ('GHK-005', ghk_farm_id, 'Ayrshire', 'Female', 'Cow', '2020-02-14', 37.5, NULL),
  ('GHK-006', ghk_farm_id, 'Friesian', 'Female', 'Heifer', '2021-06-10', 35.2, 'First calf expected soon'),
  ('GHK-007', ghk_farm_id, 'Ayrshire', 'Female', 'Heifer', '2021-08-22', 34.8, NULL),
  ('GHK-008', ghk_farm_id, 'Friesian', 'Female', 'Calf', '2023-12-15', 32.5, 'Born healthy'),
  ('GHK-009', ghk_farm_id, 'Friesian', 'Male', 'Calf', '2023-11-20', 35.0, 'For sale'),
  ('GHK-010', ghk_farm_id, 'Ayrshire', 'Male', 'Calf', '2023-10-05', 33.2, NULL);

  INSERT INTO cattle (tag_id, farm_id, breed, gender, status, birth_date, birth_weight, notes)
  VALUES ('GHK-BULL-001', ghk_farm_id, 'Friesian', 'Male', 'Bull', '2017-04-10', 42.0, 'Breeding bull')
  RETURNING id INTO bull1_id;

  -- Mutuya Farm Cattle
  INSERT INTO cattle (tag_id, farm_id, breed, gender, status, birth_date, birth_weight, notes) VALUES
  ('MTY-001', mty_farm_id, 'Friesian', 'Female', 'Cow', '2018-07-12', 39.5, NULL),
  ('MTY-002', mty_farm_id, 'Friesian', 'Female', 'Cow', '2019-03-18', 38.8, 'Excellent producer'),
  ('MTY-003', mty_farm_id, 'Ayrshire', 'Female', 'Cow', '2019-09-25', 37.2, NULL),
  ('MTY-004', mty_farm_id, 'Friesian', 'Female', 'Cow', '2020-01-30', 40.1, NULL),
  ('MTY-005', mty_farm_id, 'Friesian', 'Female', 'Heifer', '2021-11-15', 36.0, NULL),
  ('MTY-006', mty_farm_id, 'Ayrshire', 'Female', 'Heifer', '2022-02-20', 35.5, NULL),
  ('MTY-007', mty_farm_id, 'Friesian', 'Male', 'Calf', '2023-12-10', 34.5, 'For sale'),
  ('MTY-008', mty_farm_id, 'Friesian', 'Female', 'Calf', '2024-01-05', 33.8, NULL);

  RAISE NOTICE 'Cattle inserted successfully';
END $$;

-- =====================================================
-- 4. SAMPLE MILKING RECORDS (Last 7 days)
-- =====================================================

-- Note: This creates sample records. For full 30 days, you may want to run a loop
-- or use the more complex version in demo_data.sql

INSERT INTO milking_records (farm_id, cow_id, date, session, milk_yield, staff_id, created_by)
SELECT 
  f.id,
  c.id,
  CURRENT_DATE - (n || ' days')::INTERVAL,
  CASE (n % 3)
    WHEN 0 THEN 'Morning'
    WHEN 1 THEN 'Afternoon'
    ELSE 'Evening'
  END,
  CASE (n % 3)
    WHEN 0 THEN 15.5 + (random() * 4.5) -- Morning: 15.5-20L
    WHEN 1 THEN 12.0 + (random() * 4.0) -- Afternoon: 12-16L
    ELSE 13.0 + (random() * 5.0) -- Evening: 13-18L
  END,
  (SELECT id FROM staff WHERE name = 'John Mwangi' LIMIT 1),
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN cattle c
CROSS JOIN generate_series(0, 6) n
WHERE f.name = 'Githunguri Kahunira'
  AND c.farm_id = f.id
  AND c.status IN ('Cow', 'Heifer')
  AND c.gender = 'Female'
LIMIT 50;

-- =====================================================
-- 5. EGG COLLECTIONS (Last 7 days)
-- =====================================================

INSERT INTO egg_collections (farm_id, date, number_of_eggs, trays, staff_id, created_by)
SELECT 
  f.id,
  CURRENT_DATE - (n || ' days')::INTERVAL,
  800 + (random() * 200)::INT,
  40 + (random() * 10)::INT,
  (SELECT id FROM staff WHERE name = 'Ruth Achieng' LIMIT 1),
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN generate_series(0, 6) n
WHERE f.name = 'Mutuya Layers';

-- =====================================================
-- 6. BROILER BATCHES
-- =====================================================

INSERT INTO broiler_batches (farm_id, batch_number, start_date, initial_count, current_count, average_weight, feed_consumption, mortality, notes)
SELECT 
  id,
  'BR-2024-001',
  '2024-01-15',
  1000,
  950,
  2.5,
  2500,
  50,
  'First batch of the year'
FROM farms WHERE name = 'Githunguri Broilers'
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. INVENTORY ITEMS
-- =====================================================

DO $$
DECLARE
  ghk_farm_id UUID;
  mty_farm_id UUID;
  layer_farm_id UUID;
  broiler_farm_id UUID;
BEGIN
  SELECT id INTO ghk_farm_id FROM farms WHERE name = 'Githunguri Kahunira';
  SELECT id INTO mty_farm_id FROM farms WHERE name = 'Mutuya Farm';
  SELECT id INTO layer_farm_id FROM farms WHERE name = 'Mutuya Layers';
  SELECT id INTO broiler_farm_id FROM farms WHERE name = 'Githunguri Broilers';

  INSERT INTO inventory_items (farm_id, name, category, unit, quantity, min_stock_level, unit_price, supplier) VALUES
  (ghk_farm_id, 'Dairy Meal 18%', 'Feeds', 'kg', 5000, 1000, 65.00, 'Unga Feeds Ltd'),
  (ghk_farm_id, 'Hay Bales', 'Feeds', 'pieces', 200, 50, 800.00, 'Local Supplier'),
  (mty_farm_id, 'Dairy Meal 18%', 'Feeds', 'kg', 3000, 1000, 65.00, 'Unga Feeds Ltd'),
  (layer_farm_id, 'Layer Mash', 'Feeds', 'kg', 4000, 1500, 55.00, 'Unga Feeds Ltd'),
  (broiler_farm_id, 'Broiler Starter', 'Feeds', 'kg', 2000, 800, 70.00, 'Unga Feeds Ltd'),
  (ghk_farm_id, 'Antibiotics - Penicillin', 'Drugs', 'vials', 50, 20, 450.00, 'Vet Supplies Kenya'),
  (ghk_farm_id, 'FMD Vaccine', 'Vaccines', 'doses', 100, 30, 250.00, 'Vet Supplies Kenya'),
  (ghk_farm_id, 'Milking Machine Parts', 'Equipment', 'pieces', 15, 5, 1200.00, 'Farm Equipment Ltd');

  RAISE NOTICE 'Inventory items inserted';
END $$;

-- =====================================================
-- 8. SAMPLE EXPENSES
-- =====================================================

INSERT INTO expenses (farm_id, date, amount, description, category, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - (random() * 30)::INT,
  (500 + (random() * 2000))::NUMERIC(10,2),
  'Dairy meal purchase',
  'Feeds',
  'MPesa',
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Dairy'
LIMIT 10;

-- =====================================================
-- 9. SAMPLE REVENUE
-- =====================================================

INSERT INTO revenue (farm_id, date, amount, customer, revenue_type, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - (random() * 30)::INT,
  (5000 + (random() * 10000))::NUMERIC(10,2),
  'Brookside Dairy',
  'Milk',
  'Bank Transfer',
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Dairy'
LIMIT 10;

-- =====================================================
-- COMPLETION
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Demo data inserted successfully!';
  RAISE NOTICE 'You can now test the system.';
END $$;

