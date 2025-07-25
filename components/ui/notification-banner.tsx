"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Bell, X, VolumeX, Volume2 } from 'lucide-react'
import { useNotifications } from '@/contexts/notification-context'
import { cn } from '@/lib/utils'

export function NotificationBanner() {
  const { 
    hasPermission, 
    isSupported, 
    settings, 
    requestPermission,
    playNotificationSound 
  } = useNotifications()
  
  const [showBanner, setShowBanner] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    // Show banner if notifications are supported but permission not granted
    if (isSupported && !hasPermission && settings.enabled) {
      // Delay showing banner slightly for better UX
      const timer = setTimeout(() => {
        setShowBanner(true)
        setIsAnimating(true)
      }, 2000)
      
      return () => clearTimeout(timer)
    }
  }, [isSupported, hasPermission, settings.enabled])

  const handleRequestPermission = async () => {
    const granted = await requestPermission()
    if (granted) {
      setIsAnimating(false)
      setTimeout(() => setShowBanner(false), 300)
    }
  }

  const handleTestSound = () => {
    playNotificationSound()
  }

  const handleDismiss = () => {
    setIsAnimating(false)
    setTimeout(() => setShowBanner(false), 300)
  }

  if (!showBanner || !isSupported) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className={cn(
        "border-orange-200 bg-gradient-to-r from-orange-50 to-yellow-50 shadow-xl transition-all duration-300 ease-out",
        isAnimating ? "translate-x-0 opacity-100" : "translate-x-full opacity-0"
      )}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full flex items-center justify-center">
                <Bell className="h-5 w-5 text-white animate-pulse" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-orange-900 mb-1">
                Enable Order Notifications 🔔
              </h3>
              <p className="text-xs text-orange-700 mb-3">
                Get instant alerts with sound when new orders arrive. Stay on top of your business!
              </p>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={handleRequestPermission}
                  className="bg-orange-600 hover:bg-orange-700 text-white text-xs h-7"
                >
                  <Bell className="h-3 w-3 mr-1" />
                  Enable Now
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestSound}
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs h-7"
                  title="Test notification sound"
                >
                  {settings.sound ? (
                    <Volume2 className="h-3 w-3" />
                  ) : (
                    <VolumeX className="h-3 w-3" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}