# Ecommerce Management Setup

## Overview
The Ecommerce module allows admins to manage products and live bids displayed on the front page of the website.

## Database Setup

### Step 1: Run Ecommerce Schema
1. Open Supabase SQL Editor
2. Copy and paste the contents of `ecommerce_schema.sql`
3. Run the script

This will create:
- `product_categories` table
- `ecommerce_products` table (for Featured Products)
- `live_bids` table (for Live Bids/Auctions)
- Initial product categories
- RLS policies

## Features

### 1. Product Categories
- Manage product categories
- Set display order
- Assign icon names (from lucide-react)
- Enable/disable categories

### 2. Ecommerce Products (Featured Products)
- Add/edit/delete products
- Set price, stock, location
- Link to farms and categories
- Mark as featured
- Set display order
- Upload product images (via URL)
- Enable/disable products

### 3. Live Bids (Auctions)
- Create auction listings
- Set starting and current prices
- Set start and end times
- Track total bids
- Mark as trending
- Link to farms and categories

## Access

- **Super Admin**: Full access
- **Branch Manager**: Full access
- **Other roles**: No access (can be customized)

## Usage

### Adding a Product
1. Go to Admin → Ecommerce → Products tab
2. Click "Add Product"
3. Fill in:
   - Product name
   - Price and unit
   - Stock quantity and unit
   - Location
   - Category (optional)
   - Farm (optional)
   - Image URL
   - Description
4. Mark as "Featured" if you want it on the homepage
5. Click "Create"

### Adding a Live Bid
1. Go to Admin → Ecommerce → Live Bids tab
2. Click "Add Live Bid"
3. Fill in:
   - Product name
   - Starting price and current price
   - Unit
   - Available quantity
   - Location
   - Start and end times
   - Category (optional)
   - Image URL
4. Mark as "Trending" for hot deals
5. Click "Create"

### Managing Categories
1. Go to Admin → Ecommerce → Categories tab
2. Click "Add Category"
3. Fill in:
   - Category name
   - Icon name (from lucide-react, e.g., "Egg", "Milk")
   - Display order
4. Click "Create"

## Front Page Integration

The front page components (`FeaturedProducts.tsx` and `LiveBids.tsx`) can be updated to fetch data from the database instead of using hardcoded data.

### Example Query for Featured Products:
```typescript
const { data: products } = await supabase
  .from('ecommerce_products')
  .select('*')
  .eq('is_featured', true)
  .eq('is_active', true)
  .order('display_order')
  .limit(18);
```

### Example Query for Live Bids:
```typescript
const { data: bids } = await supabase
  .from('live_bids')
  .select('*')
  .eq('is_active', true)
  .gt('end_time', new Date().toISOString())
  .order('end_time', { ascending: true })
  .limit(6);
```

## Next Steps

1. Run `ecommerce_schema.sql` in Supabase
2. Add products through the admin panel
3. (Optional) Update front page components to fetch from database
4. Test the ecommerce management interface

## Notes

- Products can be linked to farms for tracking
- Image URLs should be publicly accessible
- Live bids automatically become inactive after end_time
- Categories are pre-populated with common livestock categories

