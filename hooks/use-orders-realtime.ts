"use client"

import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Order } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useNotificationSound } from '@/hooks/use-notification-sound'

interface RealtimeOrderChange {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new: Order | null
  old: Order | null
}

interface UseOrdersRealtimeOptions {
  onOrderInsert?: (order: Order) => void
  onOrderUpdate?: (order: Order, oldOrder: Order) => void
  onOrderDelete?: (orderId: string) => void
  enableNotifications?: boolean
  enableSounds?: boolean
}

export function useOrdersRealtime(options: UseOrdersRealtimeOptions = {}) {
  const { 
    onOrderInsert, 
    onOrderUpdate, 
    onOrderDelete, 
    enableNotifications = true,
    enableSounds = true 
  } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<Date | null>(null)
  const { toast } = useToast()
  const { playOrderNotification, playSuccessSound, playWarningSound } = useNotificationSound({
    enabled: enableSounds
  })

  const showNotification = useCallback((message: string, type: 'success' | 'info' | 'warning' = 'info') => {
    if (enableNotifications) {
      toast({
        title: 'Order Update',
        description: message,
        variant: type === 'success' ? 'default' : 'destructive',
      })
    }
  }, [enableNotifications, toast])

  const handleOrderChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    console.log('🔄 Realtime order change:', eventType, newRecord?.id || oldRecord?.id)
    setLastChangeTimestamp(new Date())

    switch (eventType) {
      case 'INSERT':
        if (newRecord && onOrderInsert) {
          onOrderInsert(newRecord as Order)
          showNotification(`New order received: #${newRecord.id.slice(0, 8)}`, 'success')
          playOrderNotification() // Play sound for new orders
        }
        break
        
      case 'UPDATE':
        if (newRecord && oldRecord && onOrderUpdate) {
          onOrderUpdate(newRecord as Order, oldRecord as Order)
          const statusChanged = newRecord.status !== oldRecord.status
          if (statusChanged) {
            showNotification(
              `Order #${newRecord.id.slice(0, 8)} status changed to ${newRecord.status}`,
              'info'
            )
            // Play success sound for completed orders
            if (newRecord.status === 'completed') {
              playSuccessSound()
            }
          }
        }
        break
        
      case 'DELETE':
        if (oldRecord && onOrderDelete) {
          onOrderDelete(oldRecord.id)
          showNotification(`Order #${oldRecord.id.slice(0, 8)} was deleted`, 'warning')
          playWarningSound()
        }
        break
    }
  }, [onOrderInsert, onOrderUpdate, onOrderDelete, showNotification])

  useEffect(() => {
    console.log('🚀 Setting up realtime subscription for orders...')
    
    // Create realtime channel for orders
    const channel = supabase
      .channel('admin-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'orders',
        },
        handleOrderChange
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        setIsConnected(status === 'SUBSCRIBED')
        
        if (status === 'SUBSCRIBED') {
          showNotification('Connected to live order updates', 'success')
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          showNotification('Lost connection to live updates', 'warning')
        }
      })

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Cleaning up realtime subscription...')
      supabase.removeChannel(channel)
      setIsConnected(false)
    }
  }, [handleOrderChange, showNotification])

  return {
    isConnected,
    lastChangeTimestamp,
  }
}

// Hook for orders list that automatically updates the state
export function useOrdersRealtimeList() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch initial orders
  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data)
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  // Handle realtime changes
  const handleOrderInsert = useCallback((newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev])
  }, [])

  const handleOrderUpdate = useCallback((updatedOrder: Order) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === updatedOrder.id ? updatedOrder : order
      )
    )
  }, [])

  const handleOrderDelete = useCallback((deletedOrderId: string) => {
    setOrders(prev => prev.filter(order => order.id !== deletedOrderId))
  }, [])

  // Set up realtime subscription
  const { isConnected, lastChangeTimestamp } = useOrdersRealtime({
    onOrderInsert: handleOrderInsert,
    onOrderUpdate: handleOrderUpdate,
    onOrderDelete: handleOrderDelete,
    enableNotifications: true,
    enableSounds: true,
  })

  // Initial fetch
  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // Manual refresh function
  const refreshOrders = useCallback(() => {
    fetchOrders()
  }, [fetchOrders])

  return {
    orders,
    loading,
    isConnected,
    lastChangeTimestamp,
    refreshOrders,
    setOrders, // For manual updates (like status changes)
  }
}