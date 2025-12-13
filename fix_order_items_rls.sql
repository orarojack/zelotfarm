-- Fix RLS Policy for order_items table
-- Run this to add the missing INSERT policy for order_items

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Customers can create order items for own orders" ON order_items;

-- Create INSERT policy for customers
CREATE POLICY "Customers can create order items for own orders"
  ON order_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.customer_id::text = auth.uid()::text
    )
  );

-- Verify the policy was created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'order_items'
ORDER BY policyname;

