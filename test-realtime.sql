-- Test script for realtime functionality
-- Run these commands in your Supabase SQL editor to test the realtime orders system

-- 1. First, ensure realtime is enabled for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS orders;

-- 2. Create a test order (this should appear in admin app immediately)
INSERT INTO orders (
  id,
  customer_phone,
  customer_residence,
  customer_apartment,
  items,
  total,
  delivery_method,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '+212612345678',
  'Test Residence A',
  '101',
  '[
    {
      "id": "test-item-1",
      "name": "Test Product",
      "quantity": 2,
      "price": 25.50
    },
    {
      "id": "test-item-2", 
      "name": "Another Test Product",
      "quantity": 1,
      "price": 15.00
    }
  ]'::jsonb,
  66.00,
  'delivery',
  'pending',
  NOW(),
  NOW()
);

-- 3. Wait a few seconds, then update the order status (should trigger realtime update)
-- Replace 'ORDER_ID_HERE' with the actual ID of the order you just created
-- You can find it by running: SELECT id FROM orders ORDER BY created_at DESC LIMIT 1;

-- UPDATE orders 
-- SET 
--   status = 'in-progress',
--   updated_at = NOW()
-- WHERE id = 'ORDER_ID_HERE';

-- 4. Wait a few more seconds, then complete the order
-- UPDATE orders 
-- SET 
--   status = 'completed',
--   updated_at = NOW()
-- WHERE id = 'ORDER_ID_HERE';

-- 5. Create another test order with different details
INSERT INTO orders (
  id,
  customer_phone,
  customer_residence,
  customer_apartment,
  items,
  total,
  delivery_method,
  status,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '+212698765432',
  'Test Residence B',
  '205',
  '[
    {
      "id": "test-item-3",
      "name": "Premium Product",
      "quantity": 1,
      "price": 75.00
    }
  ]'::jsonb,
  75.00,
  'pickup',
  'pending',
  NOW(),
  NOW()
);

-- 6. Optional: Clean up test orders after testing
-- DELETE FROM orders WHERE customer_phone IN ('+212612345678', '+212698765432');

-- 7. Check that realtime is working by viewing all orders
SELECT 
  id,
  customer_phone,
  status,
  total,
  delivery_method,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;

-- Expected behavior in admin app:
-- 1. New orders should appear immediately without refresh
-- 2. Status changes should update in real-time
-- 3. You should hear notification sounds (if enabled)
-- 4. Toast notifications should appear for each change
-- 5. The "Live Updates" badge should show as connected (green)
-- 6. Last update timestamp should update with each change