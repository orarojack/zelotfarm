# Demo Data Instructions

## Overview
Two demo data SQL files are provided:
1. **`demo_data.sql`** - Comprehensive data with 30-60 days of records
2. **`demo_data_simple.sql`** - Simpler version with 7 days of sample data (recommended to start)

## Prerequisites

1. ✅ Run `database_setup.sql` first
2. ✅ Create at least one user in Supabase Auth
3. ✅ Link that user to the `users` table (see LOGIN_GUIDE.md)

## Quick Start (Recommended)

### Step 1: Run Simple Demo Data
1. Open Supabase SQL Editor
2. Copy and paste contents of `demo_data_simple.sql`
3. Run the script
4. This creates:
   - 4 farms (as specified)
   - 15 staff members
   - 19 cattle
   - 7 days of milking records
   - 7 days of egg collections
   - Sample inventory, expenses, and revenue

### Step 2: Verify Data
Run these queries to verify:

```sql
-- Check farms
SELECT * FROM farms;

-- Check staff
SELECT name, role, farm_id FROM staff;

-- Check cattle
SELECT tag_id, breed, status FROM cattle;

-- Check milking records
SELECT COUNT(*) as total_records FROM milking_records;
```

## Full Demo Data

If you want more comprehensive data (30-60 days of records):

1. Open Supabase SQL Editor
2. Copy and paste contents of `demo_data.sql`
3. **Note**: Some queries use `generate_series` which may need adjustment
4. Run the script

## Demo Data Includes

### Farms (4)
- ✅ Githunguri Kahunira (Dairy)
- ✅ Mutuya Farm (Dairy)
- ✅ Githunguri Broilers (Broiler)
- ✅ Mutuya Layers (Layer)

### Staff (15 members)
- ✅ 1 Super Admin (Njuguna Isaac - Managing Director)
- ✅ 2 Branch Managers (Ezekiel Maina, Mary Wanjiku)
- ✅ 2 Vets (Dr. James Kariuki, Dr. Sarah Njeri)
- ✅ 2 Storekeepers
- ✅ 1 Accountant
- ✅ 7 Field Staff

### Cattle (19 animals)
- ✅ 10 cows/heifers at Githunguri Kahunira
- ✅ 8 cows/heifers at Mutuya Farm
- ✅ 1 breeding bull
- ✅ Various calves

### Production Data
- ✅ Milking records (multiple sessions per day)
- ✅ Egg collections (daily)
- ✅ Broiler batches
- ✅ Inventory items
- ✅ Expenses and revenue
- ✅ Casual wages
- ✅ Health records
- ✅ Breeding records

## Testing the System

After inserting demo data:

1. **Login** with your admin credentials
2. **Dashboard** - Should show revenue, expenses, milk production
3. **Farms** - View all 4 farms
4. **Cattle** - See 19 cattle records
5. **Milking** - View milking records by session
6. **Poultry** - Check egg collections and broiler batches
7. **Inventory** - View stock levels
8. **Finance** - See expenses and revenue
9. **Staff** - View all staff members
10. **Reports** - Generate reports with real data

## Customizing Demo Data

You can modify the SQL files to:
- Change dates (currently uses CURRENT_DATE)
- Adjust quantities
- Add more records
- Change farm assignments

## Troubleshooting

### Error: "relation does not exist"
- Make sure you ran `database_setup.sql` first

### Error: "foreign key violation"
- Make sure farms are created before staff/cattle
- Make sure staff are created before milking records

### Error: "permission denied"
- Check RLS policies
- Make sure you're logged in as a user with proper permissions

### No data showing
- Check that you have a user record in the `users` table
- Verify RLS policies allow reading
- Check browser console for errors

## Next Steps

After demo data is loaded:
1. Test all modules
2. Generate reports
3. Try different user roles
4. Test the approval workflow
5. Export data to PDF

Enjoy testing the system! 🚀

