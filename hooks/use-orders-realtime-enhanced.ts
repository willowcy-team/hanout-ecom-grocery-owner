"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
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
  reconnectInterval?: number
  maxReconnectAttempts?: number
  heartbeatInterval?: number
}

export function useOrdersRealtimeEnhanced(options: UseOrdersRealtimeOptions = {}) {
  const { 
    onOrderInsert, 
    onOrderUpdate, 
    onOrderDelete, 
    enableNotifications = true,
    enableSounds = true,
    reconnectInterval = 3000, // 3 seconds
    maxReconnectAttempts = 10,
    heartbeatInterval = 30000 // 30 seconds
  } = options
  
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')
  const [reconnectAttempts, setReconnectAttempts] = useState(0)
  const [lastChangeTimestamp, setLastChangeTimestamp] = useState<Date | null>(null)
  const [lastHeartbeat, setLastHeartbeat] = useState<Date | null>(null)
  
  // Refs to store current values and avoid stale closures
  const channelRef = useRef<any>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isUnmountedRef = useRef(false)
  const reconnectAttemptsRef = useRef(0)
  const isConnectingRef = useRef(false)
  
  const { toast } = useToast()
  const { playOrderNotification, playSuccessSound, playWarningSound } = useNotificationSound({
    enabled: enableSounds
  })

  // Manual reconnect function
  const manualReconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    setReconnectAttempts(0)
    connectToSupabase()
  }, [])

  const connectToSupabase = useCallback(() => {
    if (isUnmountedRef.current || isConnectingRef.current) return
    
    isConnectingRef.current = true
    console.log('🚀 Setting up realtime subscription for orders...')
    console.log('🔍 Supabase URL:', supabase.supabaseUrl)
    console.log('🔍 Supabase Key (first 20 chars):', supabase.supabaseKey?.substring(0, 20) + '...')
    setConnectionStatus('connecting')
    
    // Cleanup existing connection
    if (channelRef.current) {
      console.log('🔌 Cleaning up realtime channel...')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
    
    try {
      // Test basic connection first
      console.log('🧪 Testing basic Supabase connection...')
      
      // Create realtime channel with simpler config
      const channel = supabase
        .channel('admin-orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          (payload: any) => {
            if (isUnmountedRef.current) return
            
            const { eventType, new: newRecord, old: oldRecord } = payload
            
            console.log('🔄 Realtime order change:', eventType, newRecord?.id || oldRecord?.id)
            setLastChangeTimestamp(new Date())
            setLastHeartbeat(new Date())

            switch (eventType) {
              case 'INSERT':
                if (newRecord && onOrderInsert) {
                  onOrderInsert(newRecord as Order)
                  if (enableNotifications) {
                    toast({
                      title: 'Order Update',
                      description: `New order received: #${newRecord.id.slice(0, 8)}`,
                      variant: 'default',
                    })
                  }
                  if (enableSounds) playOrderNotification()
                }
                break
                
              case 'UPDATE':
                if (newRecord && oldRecord && onOrderUpdate) {
                  onOrderUpdate(newRecord as Order, oldRecord as Order)
                  const statusChanged = newRecord.status !== oldRecord.status
                  if (statusChanged && enableNotifications) {
                    toast({
                      title: 'Order Update',
                      description: `Order #${newRecord.id.slice(0, 8)} status changed to ${newRecord.status}`,
                      variant: 'default',
                    })
                    if (newRecord.status === 'completed' && enableSounds) {
                      playSuccessSound()
                    }
                  }
                }
                break
                
              case 'DELETE':
                if (oldRecord && onOrderDelete) {
                  onOrderDelete(oldRecord.id)
                  if (enableNotifications) {
                    toast({
                      title: 'Order Update',
                      description: `Order #${oldRecord.id.slice(0, 8)} was deleted`,
                      variant: 'destructive',
                    })
                  }
                  if (enableSounds) playWarningSound()
                }
                break
            }
          }
        )
        .subscribe((status) => {
          if (isUnmountedRef.current) {
            console.log('🚫 Component unmounted, ignoring status:', status)
            return
          }
          
          console.log('📡 Realtime subscription status:', status)
          console.log('📊 Status details:', { 
            status, 
            channelRef: !!channelRef.current,
            isUnmounted: isUnmountedRef.current,
            isConnecting: isConnectingRef.current,
            timestamp: new Date().toISOString()
          })
          
          switch (status) {
            case 'SUBSCRIBED':
              console.log('✅ Successfully subscribed to realtime updates!')
              isConnectingRef.current = false
              setIsConnected(true)
              setConnectionStatus('connected')
              setReconnectAttempts(0)
              reconnectAttemptsRef.current = 0
              setLastHeartbeat(new Date())
              
              if (enableNotifications) {
                toast({
                  title: 'Connection Success',
                  description: reconnectAttemptsRef.current > 0 ? 'Reconnected to live order updates' : 'Connected to live order updates',
                  variant: 'default',
                })
              }
              
              // Set up heartbeat monitoring
              if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current)
              }
              
              heartbeatIntervalRef.current = setInterval(() => {
                if (isUnmountedRef.current) return
                
                const now = new Date()
                const lastActivity = lastHeartbeat || lastChangeTimestamp
                
                // If no activity for 2x heartbeat interval, consider connection stale
                if (lastActivity && (now.getTime() - lastActivity.getTime()) > (heartbeatInterval * 2)) {
                  console.log('💔 Heartbeat timeout detected, reconnecting...')
                  attemptReconnection()
                }
              }, heartbeatInterval)
              break
              
            case 'CHANNEL_ERROR':
              console.error('❌ Channel error occurred')
              isConnectingRef.current = false
              setIsConnected(false)
              setConnectionStatus('error')
              if (enableNotifications) {
                toast({
                  title: 'Connection Error',
                  description: 'Channel error - attempting to reconnect',
                  variant: 'destructive',
                })
              }
              attemptReconnection()
              break
              
            case 'TIMED_OUT':
              console.error('⏰ Connection timed out')
              isConnectingRef.current = false
              setIsConnected(false)
              setConnectionStatus('error')
              if (enableNotifications) {
                toast({
                  title: 'Connection Timeout',
                  description: 'Connection timed out - attempting to reconnect',
                  variant: 'destructive',
                })
              }
              attemptReconnection()
              break
              
            case 'CLOSED':
              console.error('🔒 Connection closed')
              isConnectingRef.current = false
              setIsConnected(false)
              setConnectionStatus('error')
              if (enableNotifications) {
                toast({
                  title: 'Connection Closed',
                  description: 'Connection closed - attempting to reconnect',
                  variant: 'destructive',
                })
              }
              attemptReconnection()
              break
              
            default:
              console.log('❓ Unknown subscription status:', status)
              isConnectingRef.current = false
          }
        })
      
      channelRef.current = channel
      console.log('🔗 Channel created and stored in ref')
      
    } catch (error) {
      console.error('💥 Error setting up realtime connection:', error)
      isConnectingRef.current = false
      setConnectionStatus('error')
      setIsConnected(false)
      attemptReconnection()
    }
  }, [onOrderInsert, onOrderUpdate, onOrderDelete, enableNotifications, enableSounds, toast, playOrderNotification, playSuccessSound, playWarningSound, heartbeatInterval])

  const attemptReconnection = useCallback(() => {
    if (isUnmountedRef.current) return
    
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached')
      setConnectionStatus('error')
      if (enableNotifications) {
        toast({
          title: 'Order Update',
          description: 'Failed to reconnect. Please refresh the page.',
          variant: 'destructive',
        })
      }
      return
    }
    
    reconnectAttemptsRef.current += 1
    setReconnectAttempts(reconnectAttemptsRef.current)
    
    console.log(`🔄 Attempting to reconnect... (${reconnectAttemptsRef.current}/${maxReconnectAttempts})`)
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
    }
    
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000)
    
    reconnectTimeoutRef.current = setTimeout(() => {
      if (!isUnmountedRef.current) {
        connectToSupabase()
      }
    }, delay)
  }, [maxReconnectAttempts, reconnectInterval, enableNotifications, toast])

  // Event handlers
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden && !isUnmountedRef.current && !isConnected) {
      console.log('👁️ Tab became visible, checking connection...')
      connectToSupabase()
    }
  }, [isConnected])

  const handleOnline = useCallback(() => {
    if (!isUnmountedRef.current) {
      console.log('🌐 Network connection restored')
      connectToSupabase()
    }
  }, [])

  const handleOffline = useCallback(() => {
    if (!isUnmountedRef.current) {
      console.log('📡 Network connection lost')
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [])

  const cleanup = useCallback(() => {
    if (channelRef.current) {
      console.log('🔌 Cleaning up realtime channel...')
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current)
      heartbeatIntervalRef.current = null
    }
  }, [])

  useEffect(() => {
    isUnmountedRef.current = false
    
    // Delay initial connection to avoid React StrictMode issues
    const timer = setTimeout(() => {
      if (!isUnmountedRef.current) {
        connectToSupabase()
      }
    }, 100)
    
    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Cleanup on unmount
    return () => {
      isUnmountedRef.current = true
      clearTimeout(timer)
      
      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      // Cleanup connections and timers
      cleanup()
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, []) // Empty dependency array - only run once

  return {
    isConnected,
    connectionStatus,
    reconnectAttempts,
    lastChangeTimestamp,
    lastHeartbeat,
    manualReconnect,
  }
}

// Enhanced hook for orders list with persistent connection
export function useOrdersRealtimeListEnhanced() {
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

  // Handle new order notifications
  const handleOrderInsertWithNotification = useCallback((newOrder: Order) => {
    handleOrderInsert(newOrder)
    
    // Trigger notification for new pending orders
    if (newOrder.status === 'pending') {
      // Dispatch custom event for notification system
      if (typeof window !== 'undefined') {
        const event = new CustomEvent('newOrders', { 
          detail: { count: 1, order: newOrder } 
        })
        window.dispatchEvent(event)
      }
    }
  }, [handleOrderInsert])

  // Set up enhanced realtime subscription
  const { 
    isConnected, 
    connectionStatus, 
    reconnectAttempts, 
    lastChangeTimestamp,
    lastHeartbeat,
    manualReconnect 
  } = useOrdersRealtimeEnhanced({
    onOrderInsert: handleOrderInsertWithNotification,
    onOrderUpdate: handleOrderUpdate,
    onOrderDelete: handleOrderDelete,
    enableNotifications: false, // Disable built-in notifications - using NotificationProvider
    enableSounds: false, // Disable built-in sounds - using NotificationProvider
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
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
    connectionStatus,
    reconnectAttempts,
    lastChangeTimestamp,
    lastHeartbeat,
    refreshOrders,
    manualReconnect,
    setOrders, // For manual updates (like status changes)
  }
}