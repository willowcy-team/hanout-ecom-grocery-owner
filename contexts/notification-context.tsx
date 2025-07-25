"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { useNotificationSound } from '@/hooks/use-notification-sound'
import { useToast } from '@/hooks/use-toast'
import { ShoppingCart, Eye } from 'lucide-react'

interface NotificationSettings {
  enabled: boolean
  sound: boolean
  desktop: boolean
  volume: number
}

interface NotificationContextType {
  settings: NotificationSettings
  hasPermission: boolean
  isSupported: boolean
  updateSettings: (newSettings: Partial<NotificationSettings>) => void
  requestPermission: () => Promise<boolean>
  playNotificationSound: () => void
  showNotification: (title: string, options?: NotificationOptions) => void
  showOrderNotification: (orderCount: number) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

interface NotificationProviderProps {
  children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    sound: true,
    desktop: true,
    volume: 0.7
  })
  const [hasPermission, setHasPermission] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  // Use the consolidated audio system
  const { playLevelUpSound } = useNotificationSound({
    enabled: settings.sound,
    volume: settings.volume
  })

  // Use toast system
  const { toast } = useToast()

  // Initialize notification support and permissions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('Notification' in window)
      
      if ('Notification' in window) {
        setHasPermission(Notification.permission === 'granted')
      }

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('notification-settings')
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings)
          setSettings(prev => ({ ...prev, ...parsed }))
        } catch (error) {
          console.error('Failed to parse notification settings:', error)
        }
      }
    }
  }, [])

  // Define functions before effects - DISABLED in favor of toast system
  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    // Only play our custom sound, no desktop notifications
    if (settings.enabled && settings.sound) {
      playLevelUpSound()
    }
    
    // COMPLETELY DISABLE desktop notifications to prevent Chrome's default sound
    console.log('Desktop notifications disabled - using toast system instead')
    return
  }, [settings, playLevelUpSound])

  const showOrderNotification = useCallback((orderCount: number) => {
    const title = orderCount === 1 ? 'New Order Received! 🛒' : `${orderCount} New Orders Received! 🛒`
    const body = orderCount === 1 
      ? 'A new order is waiting for your attention'
      : `${orderCount} new orders are waiting for your attention`

    // Play our custom level-up sound
    if (settings.enabled && settings.sound) {
      playLevelUpSound()
    }

    // Show toast notification (always visible if notifications enabled)
    if (settings.enabled) {
      toast({
        variant: "order" as any,
        title: (
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-200">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-xs font-bold text-white">{orderCount}</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-gray-900 text-sm">
                  {orderCount === 1 ? 'New Order Received!' : `${orderCount} New Orders!`}
                </span>
                <div className="px-2 py-0.5 bg-orange-600 text-white text-xs font-semibold rounded-full animate-pulse">
                  NEW
                </div>
              </div>
              <div className="text-gray-600 text-sm">
                {orderCount === 1 
                  ? 'A customer is waiting for confirmation' 
                  : `${orderCount} customers waiting for confirmation`
                }
              </div>
            </div>
          </div>
        ),
        action: (
          <button 
            onClick={() => window.location.href = '/orders'}
            className="flex items-center gap-2 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-200"
          >
            <Eye className="h-4 w-4" />
            View Orders
          </button>
        ) as any,
        duration: 5000,
      })
    }
  }, [settings.enabled, settings.sound, playLevelUpSound, toast])

  // Listen for new order events in a separate effect
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleNewOrders = (event: CustomEvent) => {
      const { count } = event.detail
      if (settings.enabled && count > 0) {
        showOrderNotification(count)
      }
    }

    window.addEventListener('newOrders', handleNewOrders as EventListener)
    
    return () => {
      window.removeEventListener('newOrders', handleNewOrders as EventListener)
    }
  }, [settings.enabled, showOrderNotification])

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('notification-settings', JSON.stringify(settings))
    }
  }, [settings])

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }))
  }, [])

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser')
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      const granted = permission === 'granted'
      setHasPermission(granted)
      
      if (granted) {
        // Show a welcome toast instead of desktop notification
        console.log('Notification permission granted - using toast system')
        // Play welcome sound
        if (settings.sound) {
          playLevelUpSound()
        }
      }
      
      return granted
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }, [isSupported, settings.sound, playLevelUpSound])

  const playNotificationSound = useCallback(() => {
    if (settings.sound) {
      playLevelUpSound()
    }
  }, [settings.sound, playLevelUpSound])

  return (
    <NotificationContext.Provider
      value={{
        settings,
        hasPermission,
        isSupported,
        updateSettings,
        requestPermission,
        playNotificationSound,
        showNotification,
        showOrderNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}