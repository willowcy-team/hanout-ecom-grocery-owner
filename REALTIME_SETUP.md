# Realtime Setup for Admin App

This document explains how to enable realtime functionality for the admin app to receive live updates when orders change in the database.

## Prerequisites

- Supabase project set up
- Orders table created in the database
- Admin app with realtime hooks implemented

## 1. Enable Realtime Replication

### Via Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Replication**
3. Find the **supabase_realtime** publication
4. Toggle ON the `orders` table

### Via SQL (Alternative):

```sql
-- Enable realtime for the orders table
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
```

## 2. Row Level Security (RLS) Considerations

Since you're using the admin app, make sure you have proper RLS policies or use the service role key for admin operations.

### Option A: Disable RLS for Orders (Admin Only)
```sql
-- Only if this is a pure admin app with no public access
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
```

### Option B: Create Admin RLS Policies
```sql
-- Enable RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Create policy for admin access (adjust based on your auth setup)
CREATE POLICY "Admin can view all orders" ON orders
  FOR SELECT USING (true);
  
CREATE POLICY "Admin can update all orders" ON orders
  FOR UPDATE USING (true);
```

## 3. Test Realtime Connection

After enabling replication:

1. Open the admin app orders page
2. You should see a "Live Updates" badge with a green wifi icon
3. Test by manually updating an order status in the database:

```sql
-- Test update
UPDATE orders 
SET status = 'completed' 
WHERE id = 'some-order-id';
```

4. The admin app should automatically reflect the change without refresh

## 4. Features Implemented

The realtime system provides:

- ✅ **Live Order Updates**: New orders appear automatically
- ✅ **Status Change Notifications**: Toast notifications when orders are updated
- ✅ **Connection Status**: Visual indicator of realtime connection
- ✅ **Auto Refresh**: Orders list updates in real-time
- ✅ **Manual Refresh**: Backup refresh button
- ✅ **Error Handling**: Graceful handling of connection issues

## 5. Events Monitored

The system listens to:

- **INSERT**: New orders are automatically added to the list
- **UPDATE**: Order changes (especially status changes) are reflected immediately
- **DELETE**: Removed orders are automatically removed from the list

## 6. Troubleshooting

### Connection Issues
- Check that `orders` table is enabled in Replication settings
- Verify RLS policies allow your app to read from the orders table
- Check browser console for realtime connection errors

### Missing Updates
- Ensure the Supabase client has the correct project URL and anon key
- Verify that changes are actually being made to the database
- Check that the orders table structure matches the TypeScript interface

### Performance
- The system uses efficient delta updates (only changed records are transmitted)
- Connection status is shown to users
- Automatic reconnection on connection loss

## 7. Code Structure

- **Hook**: `hooks/use-orders-realtime.ts` - Core realtime functionality
- **Component**: `app/orders/page.tsx` - Orders page with realtime integration
- **Types**: `lib/supabase.ts` - Order interface definitions

## 8. Next Steps

Consider implementing:
- Sound notifications for new orders
- Browser notifications (with user permission)
- Realtime for other entities (products, customers)
- Dashboard with live metrics