# Poultry Module Database Setup Instructions

## Overview
This guide will help you set up the complete database schema for the Poultry Management Module in your Supabase project.

## Prerequisites
- Access to your Supabase project SQL Editor
- Admin/owner permissions on the Supabase project
- Existing base tables (farms, users, staff, inventory_items) should already be set up

## Setup Steps

### Step 1: Run the Main Schema
1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `poultry_complete_schema.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

**What this does:**
- Creates all tables for the poultry module
- Sets up indexes for performance
- Creates database functions for auto-calculations
- Creates triggers for automatic field calculations
- Enables Row Level Security (RLS) on all tables

**Expected result:** You should see "Success. No rows returned" or similar success message.

### Step 2: Run the RLS Policies
1. Still in the SQL Editor
2. Open the file: `poultry_rls_policies.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run**

**What this does:**
- Creates comprehensive Row Level Security policies
- Sets up access control based on user roles:
  - **Super Admin**: Full access to all tables
  - **Branch Manager**: Access to assigned farms
  - **Vet**: Access to health/vaccination records
  - **Field Staff**: Access to production records
  - **Accountant**: Access to financial records
  - **Storekeeper**: Access to feed/inventory records
- Others get read-only access

**Expected result:** You should see "Success. No rows returned" or similar success message.

### Step 3: Verify Setup
Run this query to verify all tables were created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'poultry_houses',
  'poultry_batches',
  'batch_stock_movements',
  'feed_issuance',
  'vaccinations',
  'poultry_medications',
  'egg_collections_enhanced',
  'broiler_production',
  'broiler_sales',
  'layer_production',
  'layer_sales',
  'customers',
  'poultry_orders',
  'poultry_order_items',
  'invoices',
  'invoice_items',
  'payments',
  'chart_of_accounts',
  'journal_entries',
  'journal_entry_lines',
  'budgets',
  'assets',
  'asset_depreciation'
)
ORDER BY table_name;
```

You should see all 23 tables listed.

### Step 4: Verify RLS Policies
Run this query to verify RLS policies were created:

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename LIKE 'poultry%' OR tablename IN (
  'broiler_production', 'broiler_sales', 'layer_production', 
  'layer_sales', 'customers', 'poultry_orders', 'poultry_order_items',
  'invoices', 'invoice_items', 'payments', 'chart_of_accounts',
  'journal_entries', 'journal_entry_lines', 'budgets', 'assets', 'asset_depreciation'
)
ORDER BY tablename, policyname;
```

You should see multiple policies for each table.

## Troubleshooting

### Error: "relation already exists"
- Some tables might already exist from previous setup
- The `CREATE TABLE IF NOT EXISTS` statements should handle this
- If you get errors, you can drop existing tables first (be careful - this deletes data!)

### Error: "function already exists"
- The functions might already exist
- The `CREATE OR REPLACE FUNCTION` statements should handle this
- This is safe to ignore or re-run

### Error: "policy already exists"
- If you've run the RLS policies before, you might get this error
- Drop existing policies first:
```sql
-- Drop all existing policies (be careful!)
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON ' || quote_ident(r.tablename);
    END LOOP;
END $$;
```
- Then re-run `poultry_rls_policies.sql`

### Error: "permission denied"
- Make sure you're running as the database owner/admin
- Check that you have the necessary permissions in Supabase

## What Gets Created

### Tables (23 total):
1. **poultry_houses** - Poultry house/pen locations
2. **poultry_batches** - Batch/flock records (Broilers & Layers)
3. **batch_stock_movements** - Daily stock tracking
4. **feed_issuance** - Feed allocation to batches
5. **vaccinations** - Vaccination schedule and records
6. **poultry_medications** - Medication/treatment records
7. **egg_collections_enhanced** - Egg collection with grading
8. **broiler_production** - Broiler growth tracking
9. **broiler_sales** - Broiler sales records
10. **layer_production** - Layer production tracking
11. **layer_sales** - Layer sales (eggs, spent hens, manure)
12. **customers** - Customer management
13. **poultry_orders** - Order management
14. **poultry_order_items** - Order line items
15. **invoices** - Invoice management
16. **invoice_items** - Invoice line items
17. **payments** - Payment records
18. **chart_of_accounts** - Financial accounts
19. **journal_entries** - Journal entries
20. **journal_entry_lines** - Journal entry lines
21. **budgets** - Budget planning
22. **assets** - Asset management
23. **asset_depreciation** - Depreciation records

### Functions:
- `generate_batch_flock_id()` - Auto-generates batch IDs
- `calculate_closing_stock()` - Auto-calculates closing stock
- `calculate_feed_cost()` - Auto-calculates feed costs
- `calculate_vaccination_cost()` - Auto-calculates vaccination costs
- `calculate_net_book_value()` - Auto-calculates asset net book value
- `is_super_admin_poultry()` - Helper for RLS policies
- `get_staff_farm_id_poultry()` - Helper for RLS policies

### Triggers:
- `trg_generate_batch_flock_id` - Generates batch IDs automatically
- `trg_calculate_closing_stock` - Calculates closing stock automatically
- `trg_calculate_feed_cost` - Calculates feed costs automatically
- `trg_calculate_vaccination_cost` - Calculates vaccination costs automatically
- `trg_calculate_net_book_value` - Calculates net book value automatically

### Indexes:
- Performance indexes on frequently queried columns (farm_id, batch_id, dates, etc.)

## Next Steps

After running the database setup:

1. **Test the application** - Navigate to the Poultry Management section
2. **Create a test batch** - Try creating a batch to verify everything works
3. **Check permissions** - Test with different user roles to ensure RLS is working
4. **Review RLS policies** - Adjust policies if needed based on your specific requirements

## Support

If you encounter any issues:
1. Check the Supabase logs for detailed error messages
2. Verify all prerequisite tables exist (farms, users, staff, inventory_items)
3. Ensure your user has the correct role in the `users` table
4. Check that RLS policies match your role structure

