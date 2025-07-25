"use client"

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useOrdersRealtimeListEnhanced } from '@/hooks/use-orders-realtime-enhanced'
import type { Order } from '@/lib/supabase'

interface OrdersContextType {
  orders: Order[]
  loading: boolean
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  reconnectAttempts: number
  lastChangeTimestamp: Date | null
  lastHeartbeat: Date | null
  pendingOrdersCount: number
  refreshOrders: () => void
  manualReconnect: () => void
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>
  newOrderIds: Set<string>
  markOrderAsSeen: (orderId: string) => void
}

const OrdersContext = createContext<OrdersContextType | undefined>(undefined)

interface OrdersProviderProps {
  children: React.ReactNode
}

export function OrdersProvider({ children }: OrdersProviderProps) {
  const { 
    orders, 
    loading, 
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastChangeTimestamp,
    lastHeartbeat,
    refreshOrders,
    manualReconnect,
    setOrders 
  } = useOrdersRealtimeListEnhanced()

  // Track new orders that haven't been "seen" yet
  const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set())

  // Calculate pending orders count
  const pendingOrdersCount = orders.filter(order => order.status === 'pending').length

  // Track new orders when they arrive
  useEffect(() => {
    const currentOrderIds = new Set(orders.map(order => order.id))
    const previousOrderIds = new Set([...newOrderIds].filter(id => 
      orders.some(order => order.id === id)
    ))

    // Find newly added orders
    const addedOrderIds = new Set(
      orders
        .filter(order => order.status === 'pending' && !previousOrderIds.has(order.id))
        .map(order => order.id)
    )

    if (addedOrderIds.size > 0) {
      setNewOrderIds(prev => new Set([...prev, ...addedOrderIds]))
      
      // Auto-remove "new" status after 10 seconds to prevent permanent highlights
      setTimeout(() => {
        setNewOrderIds(prev => {
          const updated = new Set(prev)
          addedOrderIds.forEach(id => updated.delete(id))
          return updated
        })
      }, 10000)
    }
  }, [orders, newOrderIds])

  // Function to manually mark an order as seen
  const markOrderAsSeen = (orderId: string) => {
    setNewOrderIds(prev => {
      const updated = new Set(prev)
      updated.delete(orderId)
      return updated
    })
  }

  const value: OrdersContextType = {
    orders,
    loading,
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastChangeTimestamp,
    lastHeartbeat,
    pendingOrdersCount,
    refreshOrders,
    manualReconnect,
    setOrders,
    newOrderIds,
    markOrderAsSeen,
  }

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  )
}

export function useOrders() {
  const context = useContext(OrdersContext)
  if (context === undefined) {
    throw new Error('useOrders must be used within an OrdersProvider')
  }
  return context
}

// Hook specifically for the pending orders count (for sidebar)
export function usePendingOrdersCount() {
  const { pendingOrdersCount, isConnected, connectionStatus, reconnectAttempts } = useOrders()
  return { pendingOrdersCount, isConnected, connectionStatus, reconnectAttempts }
}