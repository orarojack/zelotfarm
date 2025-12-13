# Cart and Orders Setup Guide

## Overview
This guide explains how to set up the e-commerce cart and order management system for customers.

## Database Setup

### Step 1: Run the Cart and Orders Schema
Run the SQL script in Supabase SQL Editor:

```sql
-- Run: ecommerce_cart_orders.sql
```

This creates the following tables:
- `customers` - Customer accounts (separate from admin users)
- `cart_items` - Shopping cart items
- `orders` - Customer orders
- `order_items` - Individual items in each order

### Step 2: Verify RLS Policies
The script includes Row Level Security (RLS) policies that:
- Allow customers to manage their own cart and orders
- Allow admins to view all orders
- Allow public signup for new customers

## Features Implemented

### Customer Features
1. **Signup/Login**
   - `/customer/signup` - Create new customer account
   - `/customer/login` - Login to existing account
   - Uses Supabase Auth for authentication

2. **Shopping Cart**
   - `/customer/cart` - View and manage cart items
   - Add products from Featured Products page
   - Add live bids from Live Bids page
   - Update quantities
   - Remove items
   - Shows cart count in header

3. **Checkout**
   - `/customer/checkout` - Complete order placement
   - Shipping address form
   - Payment method selection
   - Order summary
   - Free shipping for orders over KES 5,000

4. **Order Tracking**
   - `/customer/orders` - View all orders
   - `/customer/orders/:id` - View order details
   - Order status tracking
   - Order history

### Admin Features
1. **Orders Management**
   - `/admin/orders` - View all customer orders
   - Search by order number, customer name, or email
   - Filter by status
   - View order details
   - Update order status (pending → confirmed → processing → shipped → delivered)
   - Cancel orders

## How It Works

### Customer Flow
1. **Browse Products**
   - Customer browses featured products or live bids
   - Clicks "Add to Cart"
   - If not logged in, redirected to login page
   - If logged in, item added to cart

2. **Manage Cart**
   - View cart items
   - Update quantities
   - Remove items
   - Proceed to checkout

3. **Checkout**
   - Enter shipping information
   - Select payment method
   - Review order summary
   - Place order
   - Cart is cleared
   - Redirected to order confirmation

4. **Track Orders**
   - View all orders in customer portal
   - Click on order to see details
   - Track order status

### Admin Flow
1. **View Orders**
   - Navigate to Admin → Orders
   - See all customer orders
   - Search and filter orders

2. **Manage Orders**
   - Click "View" to see order details
   - Update order status as it progresses
   - View customer information
   - View order items and totals

## Order Status Flow

```
pending → confirmed → processing → shipped → delivered
                              ↓
                         cancelled
```

- **pending**: Order just placed, awaiting confirmation
- **confirmed**: Order confirmed by admin
- **processing**: Order being prepared
- **shipped**: Order shipped to customer
- **delivered**: Order delivered to customer
- **cancelled**: Order cancelled (can happen at any stage)

## Database Tables

### customers
- Stores customer account information
- Linked to Supabase Auth users via `id`
- Fields: email, full_name, phone, address, etc.

### cart_items
- Stores items in customer shopping cart
- Can contain products or live bids
- Automatically cleared when order is placed
- Fields: customer_id, product_id/bid_id, quantity, unit_price

### orders
- Stores customer orders
- Auto-generates order number (ORD-YYYYMMDD-XXXXX)
- Tracks status and payment information
- Fields: order_number, customer_id, status, total_amount, shipping info

### order_items
- Stores individual items in each order
- Snapshot of product/bid at time of order
- Fields: order_id, product_id/bid_id, item_name, quantity, prices

## Testing

### Test Customer Signup
1. Go to `/customer/signup`
2. Fill in form and submit
3. Should create account and redirect to orders page

### Test Adding to Cart
1. Login as customer
2. Browse products on homepage
3. Click "Add to Cart" on a product
4. Should see cart count increase in header
5. Go to `/customer/cart` to see items

### Test Checkout
1. Add items to cart
2. Go to `/customer/checkout`
3. Fill in shipping information
4. Select payment method
5. Place order
6. Should redirect to order confirmation

### Test Order Tracking
1. As customer, go to `/customer/orders`
2. Should see all your orders
3. Click on an order to see details

### Test Admin Orders
1. Login as admin
2. Go to Admin → Orders
3. Should see all customer orders
4. Click "View" to see order details
5. Update order status

## Notes

- Cart items are stored in database (persistent across sessions)
- Cart is automatically cleared when order is placed
- Order numbers are auto-generated and unique
- Free shipping for orders over KES 5,000
- Order items store snapshot prices (prices can change after order)
- Customers can only see their own orders
- Admins can see all orders

## Troubleshooting

### "Please login to add items to cart"
- Customer must be logged in to add items
- Redirects to login page if not authenticated

### Cart not showing items
- Check if customer is logged in
- Check browser console for errors
- Verify RLS policies allow customer to read their cart

### Order not appearing
- Check if order was created successfully
- Verify RLS policies allow customer to read their orders
- Check order status (cancelled orders may be filtered)

### Admin can't see orders
- Verify admin user has role "Super Admin" or "Branch Manager"
- Check RLS policies for orders table
- Verify admin is logged in correctly

