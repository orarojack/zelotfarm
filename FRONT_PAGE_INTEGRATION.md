# Front Page Database Integration

## Overview
All products displayed on the front page are now fetched from the database instead of using hardcoded data. Admins can manage these products through the Ecommerce admin panel.

## Updated Components

### 1. FeaturedProducts.tsx
- **Fetches from**: `ecommerce_products` table
- **Filters**: 
  - `is_active = true`
  - Ordered by: featured first, then display_order, then created_at
  - Limit: 18 products
- **Displays**:
  - Product name, price, stock, location
  - Product image
  - Featured badge (if marked as featured)
  - Add to cart button

### 2. LiveBids.tsx
- **Fetches from**: `live_bids` table
- **Filters**:
  - `is_active = true`
  - `end_time > NOW()` (only active auctions)
  - Ordered by: trending first, then end_time
  - Limit: 6 bids
- **Features**:
  - Real-time countdown timer (updates every second)
  - Calculates time left from `end_time`
  - Shows trending badge
  - Auto-refreshes every 30 seconds
  - Shows price increase percentage

### 3. Categories.tsx
- **Fetches from**: `product_categories` table
- **Filters**:
  - `is_active = true`
  - Ordered by: `display_order`
- **Features**:
  - Dynamic icon loading from lucide-react
  - Falls back to Circle icon if icon not found

## Database Tables Required

Make sure you've run `ecommerce_schema.sql` which creates:
- `product_categories`
- `ecommerce_products`
- `live_bids`

## How It Works

### For Admins:
1. Login to admin panel
2. Go to **Admin → Ecommerce**
3. Add/edit products, live bids, or categories
4. Changes appear on front page immediately (after refresh)

### For Front Page:
1. Components fetch data on mount
2. Live bids auto-refresh every 30 seconds
3. Countdown timers update every second
4. Loading states shown while fetching
5. Empty states shown if no data

## Data Flow

```
Admin Panel (Ecommerce) 
    ↓
Creates/Updates Products
    ↓
Supabase Database
    ↓
Front Page Components Fetch
    ↓
Display to Users
```

## Features

### Real-time Updates
- Live bids countdown updates every second
- Live bids list refreshes every 30 seconds
- Products update on page refresh

### Error Handling
- Loading states while fetching
- Empty states when no data
- Image fallbacks if URL fails
- Console errors logged for debugging

### Performance
- Limited queries (18 products, 6 bids)
- Efficient ordering and filtering
- Image lazy loading ready

## Testing

1. **Add a product**:
   - Go to Admin → Ecommerce → Products
   - Add a new product
   - Mark as "Featured" and "Active"
   - Refresh front page
   - Product should appear

2. **Add a live bid**:
   - Go to Admin → Ecommerce → Live Bids
   - Add a new bid
   - Set end time in the future
   - Mark as "Active"
   - Refresh front page
   - Bid should appear with countdown

3. **Manage categories**:
   - Go to Admin → Ecommerce → Categories
   - Edit category icon names
   - Front page will use the icons

## Notes

- Products must have `is_active = true` to appear
- Live bids must have `end_time > NOW()` to appear
- Categories must have `is_active = true` to appear
- Image URLs should be publicly accessible
- If no products/bids exist, empty states are shown
- All data is fetched client-side (no server needed)

## Troubleshooting

### Products not showing:
- Check `is_active = true` in database
- Check browser console for errors
- Verify RLS policies allow public read access

### Live bids not showing:
- Check `is_active = true` and `end_time > NOW()`
- Verify end_time is in the future
- Check browser console for errors

### Icons not showing:
- Verify icon name matches lucide-react icon name
- Check iconMap in Categories.tsx
- Default icon (Circle) will be used if not found

