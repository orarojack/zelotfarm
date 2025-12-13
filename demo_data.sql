-- =====================================================
-- Zealot AgriWorks - Demo Data
-- =====================================================
-- This script inserts realistic demo data for testing
-- Run this AFTER running database_setup.sql
-- Make sure you have at least one user created in auth.users

-- =====================================================
-- 1. FARMS
-- =====================================================

INSERT INTO farms (name, type, location) VALUES
('Githunguri Kahunira', 'Dairy', 'Githunguri'),
('Mutuya Farm', 'Dairy', 'Mutuya'),
('Githunguri Broilers', 'Broiler', 'Githunguri'),
('Mutuya Layers', 'Layer', 'Mutuya')
ON CONFLICT DO NOTHING;

-- Get farm IDs for reference (you'll need these for other inserts)
-- Run: SELECT id, name FROM farms; to get the IDs

-- =====================================================
-- 2. STAFF MEMBERS
-- =====================================================

-- Note: Replace farm_id values with actual IDs from farms table
-- Get farm IDs first:
-- SELECT id, name FROM farms;

-- For this demo, we'll use a subquery to get farm IDs
INSERT INTO staff (name, email, phone, role, farm_id, monthly_salary, payment_method, allowances, deductions, is_active) VALUES
-- Super Admin (no farm assignment)
('Njuguna Isaac', 'isaaczealot2024@gmail.com', '+254708500722', 'Super Admin', NULL, 150000, 'Bank Transfer', 20000, 5000, true),

-- Branch Managers
('Ezekiel Maina', 'ezekiel.maina@zealotagriworks.com', '+254712345678', 'Branch Manager', 
 (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 80000, 'MPesa', 10000, 3000, true),
('Mary Wanjiku', 'mary.wanjiku@zealotagriworks.com', '+254723456789', 'Branch Manager',
 (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 80000, 'Bank Transfer', 10000, 3000, true),

-- Vets
('Dr. James Kariuki', 'james.kariuki@zealotagriworks.com', '+254734567890', 'Vet',
 (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 70000, 'Bank Transfer', 5000, 2000, true),
('Dr. Sarah Njeri', 'sarah.njeri@zealotagriworks.com', '+254745678901', 'Vet',
 (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 70000, 'MPesa', 5000, 2000, true),

-- Storekeepers
('Peter Kamau', 'peter.kamau@zealotagriworks.com', '+254756789012', 'Storekeeper',
 (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 45000, 'Cash', 3000, 1000, true),
('Grace Muthoni', 'grace.muthoni@zealotagriworks.com', '+254767890123', 'Storekeeper',
 (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 45000, 'MPesa', 3000, 1000, true),

-- Accountants
('David Ochieng', 'david.ochieng@zealotagriworks.com', '+254778901234', 'Accountant', NULL, 60000, 'Bank Transfer', 5000, 2500, true),

-- Field Staff
('John Mwangi', 'john.mwangi@zealotagriworks.com', '+254789012345', 'Field Staff',
 (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 35000, 'MPesa', 2000, 500, true),
('Jane Wambui', 'jane.wambui@zealotagriworks.com', '+254790123456', 'Field Staff',
 (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 35000, 'Cash', 2000, 500, true),
('Paul Otieno', 'paul.otieno@zealotagriworks.com', '+254701234567', 'Field Staff',
 (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 35000, 'MPesa', 2000, 500, true),
('Ruth Achieng', 'ruth.achieng@zealotagriworks.com', '+254712345678', 'Field Staff',
 (SELECT id FROM farms WHERE name = 'Mutuya Layers'), 35000, 'Cash', 2000, 500, true),
('Simon Kipchoge', 'simon.kipchoge@zealotagriworks.com', '+254723456789', 'Field Staff',
 (SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 35000, 'MPesa', 2000, 500, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CATTLE RECORDS (Dairy Farms)
-- =====================================================

-- Githunguri Kahunira Farm Cattle
INSERT INTO cattle (tag_id, farm_id, breed, gender, status, birth_date, birth_weight, mother_tag, father_tag, notes) VALUES
-- Mature Cows
('GHK-001', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Female', 'Cow', '2018-03-15', 38.5, NULL, NULL, 'High milk producer'),
('GHK-002', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Female', 'Cow', '2019-01-20', 40.2, NULL, NULL, 'Good breeding history'),
('GHK-003', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Ayrshire', 'Female', 'Cow', '2018-11-10', 36.8, NULL, NULL, 'Regular milker'),
('GHK-004', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Female', 'Cow', '2019-05-25', 39.1, NULL, NULL, NULL),
('GHK-005', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Ayrshire', 'Female', 'Cow', '2020-02-14', 37.5, NULL, NULL, NULL),
-- Heifers
('GHK-006', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Female', 'Heifer', '2021-06-10', 35.2, 'GHK-001', NULL, 'First calf expected soon'),
('GHK-007', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Ayrshire', 'Female', 'Heifer', '2021-08-22', 34.8, 'GHK-003', NULL, NULL),
-- Calves
('GHK-008', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Female', 'Calf', '2023-12-15', 32.5, 'GHK-002', NULL, 'Born healthy'),
('GHK-009', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Male', 'Calf', '2023-11-20', 35.0, 'GHK-001', NULL, 'For sale'),
('GHK-010', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Ayrshire', 'Male', 'Calf', '2023-10-05', 33.2, 'GHK-003', NULL, NULL),
-- Bull
('GHK-BULL-001', (SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Friesian', 'Male', 'Bull', '2017-04-10', 42.0, NULL, NULL, 'Breeding bull')

-- Mutuya Farm Cattle
UNION ALL
SELECT tag_id, farm_id, breed, gender, status, birth_date, birth_weight, mother_tag, father_tag, notes FROM (VALUES
('MTY-001', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Female', 'Cow', '2018-07-12', 39.5, NULL, NULL, NULL),
('MTY-002', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Female', 'Cow', '2019-03-18', 38.8, NULL, NULL, 'Excellent producer'),
('MTY-003', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Ayrshire', 'Female', 'Cow', '2019-09-25', 37.2, NULL, NULL, NULL),
('MTY-004', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Female', 'Cow', '2020-01-30', 40.1, NULL, NULL, NULL),
('MTY-005', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Female', 'Heifer', '2021-11-15', 36.0, 'MTY-001', NULL, NULL),
('MTY-006', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Ayrshire', 'Female', 'Heifer', '2022-02-20', 35.5, 'MTY-003', NULL, NULL),
('MTY-007', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Male', 'Calf', '2023-12-10', 34.5, 'MTY-002', NULL, 'For sale'),
('MTY-008', (SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Friesian', 'Female', 'Calf', '2024-01-05', 33.8, 'MTY-004', NULL, NULL)
) AS t(tag_id, farm_id, breed, gender, status, birth_date, birth_weight, mother_tag, father_tag, notes)
ON CONFLICT (tag_id) DO NOTHING;

-- =====================================================
-- 4. MILKING RECORDS (Last 30 days)
-- =====================================================

-- Helper function to get staff IDs (we'll use subqueries)
-- Morning milking records for Githunguri Kahunira
INSERT INTO milking_records (farm_id, cow_id, date, session, milk_yield, staff_id, notes, created_by)
SELECT 
  f.id,
  c.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  'Morning',
  (12 + random() * 8)::NUMERIC(10,2), -- Random yield between 12-20 liters
  (SELECT id FROM staff WHERE name = 'John Mwangi' LIMIT 1),
  NULL,
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN cattle c
WHERE f.name = 'Githunguri Kahunira'
  AND c.farm_id = f.id
  AND c.status IN ('Cow', 'Heifer')
  AND c.gender = 'Female'
LIMIT 150; -- Limit to avoid too many records

-- Afternoon milking records
INSERT INTO milking_records (farm_id, cow_id, date, session, milk_yield, staff_id, notes, created_by)
SELECT 
  f.id,
  c.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  'Afternoon',
  (10 + random() * 6)::NUMERIC(10,2), -- Random yield between 10-16 liters
  (SELECT id FROM staff WHERE name = 'Jane Wambui' LIMIT 1),
  NULL,
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN cattle c
WHERE f.name = 'Githunguri Kahunira'
  AND c.farm_id = f.id
  AND c.status IN ('Cow', 'Heifer')
  AND c.gender = 'Female'
LIMIT 150;

-- Evening milking records
INSERT INTO milking_records (farm_id, cow_id, date, session, milk_yield, staff_id, notes, created_by)
SELECT 
  f.id,
  c.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  'Evening',
  (11 + random() * 7)::NUMERIC(10,2), -- Random yield between 11-18 liters
  (SELECT id FROM staff WHERE name = 'John Mwangi' LIMIT 1),
  NULL,
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN cattle c
WHERE f.name = 'Githunguri Kahunira'
  AND c.farm_id = f.id
  AND c.status IN ('Cow', 'Heifer')
  AND c.gender = 'Female'
LIMIT 150;

-- Mutuya Farm milking records (sample)
INSERT INTO milking_records (farm_id, cow_id, date, session, milk_yield, staff_id, notes, created_by)
SELECT 
  f.id,
  c.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 14), -- Last 15 days
  CASE (random() * 3)::INT
    WHEN 0 THEN 'Morning'
    WHEN 1 THEN 'Afternoon'
    ELSE 'Evening'
  END,
  (10 + random() * 8)::NUMERIC(10,2),
  (SELECT id FROM staff WHERE name = 'Paul Otieno' LIMIT 1),
  NULL,
  (SELECT id FROM users LIMIT 1)
FROM farms f
CROSS JOIN cattle c
WHERE f.name = 'Mutuya Farm'
  AND c.farm_id = f.id
  AND c.status IN ('Cow', 'Heifer')
  AND c.gender = 'Female'
LIMIT 100;

-- =====================================================
-- 5. POULTRY - EGG COLLECTIONS (Layers)
-- =====================================================

-- Mutuya Layers - Daily egg collections for last 30 days
INSERT INTO egg_collections (farm_id, date, number_of_eggs, trays, staff_id, notes, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  (800 + (random() * 200)::INT), -- 800-1000 eggs per day
  (40 + (random() * 10)::INT), -- 40-50 trays
  (SELECT id FROM staff WHERE name = 'Ruth Achieng' LIMIT 1),
  NULL,
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.name = 'Mutuya Layers';

-- =====================================================
-- 6. POULTRY - BROILER BATCHES
-- =====================================================

INSERT INTO broiler_batches (farm_id, batch_number, start_date, initial_count, current_count, average_weight, feed_consumption, mortality, fcr, notes) VALUES
((SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 'BR-2024-001', '2024-01-15', 1000, 950, 2.5, 2500, 50, 2.63, 'First batch of the year'),
((SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 'BR-2024-002', '2024-02-20', 1200, 1180, 2.8, 3000, 20, 2.54, 'Good growth rate'),
((SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 'BR-2024-003', CURRENT_DATE - INTERVAL '15 days', 1000, 980, 1.8, 1800, 20, NULL, 'Current batch - growing well')
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. INVENTORY ITEMS
-- =====================================================

INSERT INTO inventory_items (farm_id, name, category, unit, quantity, min_stock_level, unit_price, supplier, notes) VALUES
-- Feeds
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Dairy Meal 18%', 'Feeds', 'kg', 5000, 1000, 65.00, 'Unga Feeds Ltd', 'High quality dairy feed'),
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Hay Bales', 'Feeds', 'pieces', 200, 50, 800.00, 'Local Supplier', 'Dry season feed'),
((SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Dairy Meal 18%', 'Feeds', 'kg', 3000, 1000, 65.00, 'Unga Feeds Ltd', NULL),
((SELECT id FROM farms WHERE name = 'Mutuya Layers'), 'Layer Mash', 'Feeds', 'kg', 4000, 1500, 55.00, 'Unga Feeds Ltd', 'Layer feed'),
((SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 'Broiler Starter', 'Feeds', 'kg', 2000, 800, 70.00, 'Unga Feeds Ltd', NULL),
((SELECT id FROM farms WHERE name = 'Githunguri Broilers'), 'Broiler Finisher', 'Feeds', 'kg', 1500, 600, 68.00, 'Unga Feeds Ltd', NULL),

-- Drugs & Vaccines
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Antibiotics - Penicillin', 'Drugs', 'vials', 50, 20, 450.00, 'Vet Supplies Kenya', 'For treatment'),
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'FMD Vaccine', 'Vaccines', 'doses', 100, 30, 250.00, 'Vet Supplies Kenya', 'Foot and Mouth Disease'),
((SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'Antibiotics - Penicillin', 'Drugs', 'vials', 40, 20, 450.00, 'Vet Supplies Kenya', NULL),
((SELECT id FROM farms WHERE name = 'Mutuya Farm'), 'FMD Vaccine', 'Vaccines', 'doses', 80, 30, 250.00, 'Vet Supplies Kenya', NULL),

-- Equipment
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Milking Machine Parts', 'Equipment', 'pieces', 15, 5, 1200.00, 'Farm Equipment Ltd', 'Spare parts'),
((SELECT id FROM farms WHERE name = 'Githunguri Kahunira'), 'Feed Troughs', 'Equipment', 'pieces', 25, 10, 2500.00, 'Farm Equipment Ltd', NULL),
((SELECT id FROM farms WHERE name = 'Mutuya Layers'), 'Egg Trays', 'Equipment', 'pieces', 200, 100, 150.00, 'Local Supplier', NULL)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. STOCK MOVEMENTS
-- =====================================================

-- Stock In movements
INSERT INTO stock_movements (inventory_id, farm_id, movement_type, quantity, date, notes, created_by)
SELECT 
  i.id,
  i.farm_id,
  'In',
  (100 + (random() * 200)::INT),
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30)::INT,
  'Stock replenishment',
  (SELECT id FROM users LIMIT 1)
FROM inventory_items i
WHERE i.category = 'Feeds'
LIMIT 10;

-- Stock Out movements
INSERT INTO stock_movements (inventory_id, farm_id, movement_type, quantity, date, notes, created_by)
SELECT 
  i.id,
  i.farm_id,
  'Out',
  (50 + (random() * 100)::INT),
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30)::INT,
  'Daily usage',
  (SELECT id FROM users LIMIT 1)
FROM inventory_items i
WHERE i.category = 'Feeds'
LIMIT 15;

-- =====================================================
-- 9. EXPENSES (Last 60 days)
-- =====================================================

INSERT INTO expenses (farm_id, date, amount, description, category, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 60)::INT,
  (500 + (random() * 2000))::NUMERIC(10,2),
  CASE (random() * 7)::INT
    WHEN 0 THEN 'Dairy meal purchase'
    WHEN 1 THEN 'Veterinary services'
    WHEN 2 THEN 'Fuel for farm vehicle'
    WHEN 3 THEN 'Farm equipment repair'
    WHEN 4 THEN 'Hay purchase'
    WHEN 5 THEN 'Vaccination program'
    ELSE 'Miscellaneous farm supplies'
  END,
  CASE (random() * 7)::INT
    WHEN 0 THEN 'Feeds'
    WHEN 1 THEN 'Drugs & Vaccines'
    WHEN 2 THEN 'Fuel & Transport'
    WHEN 3 THEN 'Repairs'
    WHEN 4 THEN 'Feeds'
    WHEN 5 THEN 'Drugs & Vaccines'
    ELSE 'Miscellaneous'
  END,
  CASE (random() * 4)::INT
    WHEN 0 THEN 'MPesa'
    WHEN 1 THEN 'Cash'
    WHEN 2 THEN 'Bank Transfer'
    ELSE 'Cheque'
  END,
  (SELECT id FROM users LIMIT 1)
FROM farms f
LIMIT 50;

-- Staff Salaries (Monthly)
INSERT INTO expenses (farm_id, date, amount, description, category, payment_method, created_by)
SELECT 
  s.farm_id,
  DATE_TRUNC('month', CURRENT_DATE)::DATE,
  s.monthly_salary + COALESCE(s.allowances, 0) - COALESCE(s.deductions, 0),
  'Monthly salary for ' || s.name,
  'Staff Salaries',
  s.payment_method,
  (SELECT id FROM users LIMIT 1)
FROM staff s
WHERE s.monthly_salary IS NOT NULL
  AND s.is_active = true;

-- =====================================================
-- 10. REVENUE (Last 60 days)
-- =====================================================

-- Milk Sales
INSERT INTO revenue (farm_id, date, amount, customer, revenue_type, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 60)::INT,
  (5000 + (random() * 10000))::NUMERIC(10,2),
  CASE (random() * 3)::INT
    WHEN 0 THEN 'Brookside Dairy'
    WHEN 1 THEN 'New KCC'
    ELSE 'Local Market'
  END,
  'Milk',
  CASE (random() * 3)::INT
    WHEN 0 THEN 'MPesa'
    WHEN 1 THEN 'Bank Transfer'
    ELSE 'Cash'
  END,
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Dairy'
LIMIT 40;

-- Egg Sales
INSERT INTO revenue (farm_id, date, amount, customer, revenue_type, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 60)::INT,
  (3000 + (random() * 5000))::NUMERIC(10,2),
  CASE (random() * 2)::INT
    WHEN 0 THEN 'Local Market'
    ELSE 'Retail Shops'
  END,
  'Eggs',
  CASE (random() * 2)::INT
    WHEN 0 THEN 'MPesa'
    ELSE 'Cash'
  END,
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Layer'
LIMIT 30;

-- Broiler Sales
INSERT INTO revenue (farm_id, date, amount, customer, revenue_type, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 60)::INT,
  (15000 + (random() * 25000))::NUMERIC(10,2),
  'Local Market',
  'Broilers',
  CASE (random() * 2)::INT
    WHEN 0 THEN 'MPesa'
    ELSE 'Bank Transfer'
  END,
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Broiler'
LIMIT 10;

-- Male Calf Sales
INSERT INTO revenue (farm_id, date, amount, customer, revenue_type, payment_method, created_by)
SELECT 
  f.id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 60)::INT,
  (8000 + (random() * 5000))::NUMERIC(10,2),
  'Local Buyer',
  'Male Calves',
  'Cash',
  (SELECT id FROM users LIMIT 1)
FROM farms f
WHERE f.type = 'Dairy'
LIMIT 5;

-- =====================================================
-- 11. CASUAL WAGES
-- =====================================================

INSERT INTO casual_wages (staff_id, farm_id, date, task, hours, days, rate, total, payment_method, created_by)
SELECT 
  s.id,
  s.farm_id,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 30)::INT,
  CASE (random() * 4)::INT
    WHEN 0 THEN 'Fence repair'
    WHEN 1 THEN 'Feed distribution'
    WHEN 2 THEN 'Cleaning and maintenance'
    ELSE 'General farm work'
  END,
  CASE WHEN (random() * 2)::INT = 0 THEN NULL ELSE (4 + (random() * 4))::NUMERIC(10,2) END,
  CASE WHEN (random() * 2)::INT = 1 THEN NULL ELSE 1 END,
  500.00,
  CASE 
    WHEN (random() * 2)::INT = 0 THEN (4 + (random() * 4))::NUMERIC(10,2) * 500
    ELSE 1 * 500
  END,
  'Cash',
  (SELECT id FROM users LIMIT 1)
FROM staff s
WHERE s.role = 'Field Staff'
  AND s.farm_id IS NOT NULL
LIMIT 20;

-- =====================================================
-- 12. CATTLE HEALTH RECORDS
-- =====================================================

INSERT INTO cattle_health (cattle_id, treatment_type, description, date, vet_name, cost)
SELECT 
  c.id,
  CASE (random() * 3)::INT
    WHEN 0 THEN 'Vaccination'
    WHEN 1 THEN 'Treatment'
    ELSE 'Checkup'
  END,
  CASE (random() * 3)::INT
    WHEN 0 THEN 'FMD Vaccination'
    WHEN 1 THEN 'Antibiotic treatment for infection'
    ELSE 'Routine health check'
  END,
  CURRENT_DATE - INTERVAL '1 day' * (random() * 90)::INT,
  CASE (random() * 2)::INT
    WHEN 0 THEN 'Dr. James Kariuki'
    ELSE 'Dr. Sarah Njeri'
  END,
  (500 + (random() * 2000))::NUMERIC(10,2)
FROM cattle c
WHERE c.farm_id IN (SELECT id FROM farms WHERE type = 'Dairy')
LIMIT 30;

-- =====================================================
-- 13. CATTLE WEIGHTS
-- =====================================================

INSERT INTO cattle_weights (cattle_id, weight, date, notes)
SELECT 
  c.id,
  (200 + (random() * 300))::NUMERIC(10,2), -- Weight between 200-500 kg
  CURRENT_DATE - INTERVAL '1 day' * (random() * 180)::INT,
  'Monthly weight tracking'
FROM cattle c
WHERE c.status IN ('Calf', 'Heifer')
LIMIT 25;

-- =====================================================
-- 14. BREEDING RECORDS
-- =====================================================

INSERT INTO breeding (cow_id, bull_id, breeding_date, expected_calving_date, actual_calving_date, calf_tag, notes)
SELECT 
  c.id,
  (SELECT id FROM cattle WHERE status = 'Bull' AND farm_id = c.farm_id LIMIT 1),
  CURRENT_DATE - INTERVAL '1 day' * (200 + (random() * 100))::INT,
  CURRENT_DATE - INTERVAL '1 day' * (100 + (random() * 50))::INT,
  CASE WHEN (random() * 2)::INT = 0 THEN NULL 
       ELSE CURRENT_DATE - INTERVAL '1 day' * (90 + (random() * 30))::INT 
  END,
  CASE WHEN (random() * 2)::INT = 0 THEN NULL 
       ELSE 'CALF-' || (random() * 1000)::INT 
  END,
  'Natural breeding'
FROM cattle c
WHERE c.gender = 'Female' 
  AND c.status IN ('Cow', 'Heifer')
  AND c.farm_id IN (SELECT id FROM farms WHERE type = 'Dairy')
LIMIT 15;

-- =====================================================
-- 15. STAFF ATTENDANCE (Last 30 days)
-- =====================================================

INSERT INTO staff_attendance (staff_id, date, check_in, check_out, hours_worked, notes)
SELECT 
  s.id,
  CURRENT_DATE - INTERVAL '1 day' * generate_series(0, 29),
  '07:00:00'::TIME + (random() * INTERVAL '30 minutes'),
  '17:00:00'::TIME - (random() * INTERVAL '30 minutes'),
  8.0 + (random() * 2)::NUMERIC(10,2),
  NULL
FROM staff s
WHERE s.is_active = true
  AND s.role IN ('Field Staff', 'Storekeeper', 'Vet')
LIMIT 300;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE 'Demo data inserted successfully!';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- Farms: 4';
  RAISE NOTICE '- Staff: 15 members';
  RAISE NOTICE '- Cattle: 19 animals';
  RAISE NOTICE '- Milking records: ~550 records';
  RAISE NOTICE '- Egg collections: 30 records';
  RAISE NOTICE '- Broiler batches: 3 batches';
  RAISE NOTICE '- Inventory items: 13 items';
  RAISE NOTICE '- Expenses: ~50+ records';
  RAISE NOTICE '- Revenue: ~85 records';
  RAISE NOTICE '- Casual wages: 20 records';
  RAISE NOTICE 'You can now test the system with realistic data!';
END $$;

