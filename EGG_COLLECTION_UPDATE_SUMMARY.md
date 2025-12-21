# Egg Collection Update - Broken and Spoiled Tracking

## What Changed

The egg collection form now allows you to specify broken and spoiled eggs separately instead of selecting a single status for all eggs.

## Database Changes

**New Migration File**: `add_broken_spoiled_counts_to_egg_collections.sql`

This adds two new columns to the `egg_collections` table:
- `broken_count` (INTEGER, default 0) - Number of broken eggs
- `spoiled_count` (INTEGER, default 0) - Number of spoiled eggs

**Constraint Added**: 
- Ensures `broken_count + spoiled_count <= number_of_eggs`
- Both counts must be >= 0

## How It Works Now

### Before:
- You selected one status for ALL eggs (Good, Broken, or Spoiled)
- Example: 200 eggs all marked as "Good"

### After:
- Enter **Total Eggs Collected** (e.g., 200)
- Enter **Broken Eggs** separately (e.g., 5)
- Enter **Spoiled Eggs** separately (e.g., 10)
- **Good Eggs** are automatically calculated (200 - 5 - 10 = 185)

### Example:
If you collect 200 eggs:
- Total Eggs: 200
- Broken: 5
- Spoiled: 10
- **Good Eggs (auto-calculated): 185**

## Form Changes

The form now has:
1. **Total Eggs Collected** - Enter the total number
2. **Broken Eggs** - Enter how many are broken
3. **Spoiled Eggs** - Enter how many are spoiled
4. **Good Eggs** - Automatically calculated and displayed
5. **Trays** - Still auto-calculated based on total eggs

## Table Display

The egg collections table now shows separate columns:
- **Total Eggs** - The total collected
- **Good** - Number of good eggs (green)
- **Broken** - Number of broken eggs (red)
- **Spoiled** - Number of spoiled eggs (orange)
- **Trays** - Auto-calculated tray count

## Validation

The form validates:
- Total eggs must be > 0
- Broken + Spoiled cannot exceed Total
- Broken and Spoiled counts cannot be negative
- Good eggs calculation must be >= 0

## Analysis Integration

The **Layers Analysis** tab automatically uses:
- `broken_count` for broken eggs
- `spoiled_count` for spoiled eggs
- These are summed up correctly in the daily analysis

## SQL to Run

Run this migration on your new Supabase database:

```sql
-- See: add_broken_spoiled_counts_to_egg_collections.sql
```

Or it's included in `COMPLETE_DATABASE_SETUP.sql` under "Migration 5b"

## Backward Compatibility

- Existing records with only `egg_status` will have `broken_count` and `spoiled_count` set based on their status
- The `egg_status` column is kept for backward compatibility but is now auto-calculated based on majority (if broken > good and spoiled, status = "Broken", etc.)


