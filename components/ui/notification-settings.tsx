"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog'
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Monitor, 
  Play, 
  Settings as SettingsIcon,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { useNotifications } from '@/contexts/notification-context'
import { Badge } from '@/components/ui/badge'

export function NotificationSettings() {
  const { 
    settings, 
    hasPermission, 
    isSupported, 
    updateSettings, 
    requestPermission, 
    playNotificationSound,
    showOrderNotification 
  } = useNotifications()
  
  const [isOpen, setIsOpen] = useState(false)

  const handleVolumeChange = (value: number[]) => {
    updateSettings({ volume: value[0] })
  }

  const handleTestNotification = () => {
    // Test the toast notification specifically
    showOrderNotification(1)
  }

  const getPermissionStatus = () => {
    if (!isSupported) {
      return { icon: XCircle, text: 'Not Supported', color: 'text-red-600 bg-red-50' }
    }
    if (hasPermission) {
      return { icon: CheckCircle, text: 'Enabled', color: 'text-green-600 bg-green-50' }
    }
    return { icon: AlertCircle, text: 'Disabled', color: 'text-yellow-600 bg-yellow-50' }
  }

  const permissionStatus = getPermissionStatus()

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bell className="h-4 w-4" />
          Notifications
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Permission Status */}
          <Card className="border-gray-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between">
                Browser Permission
                <Badge className={`${permissionStatus.color} border-0 text-xs`}>
                  <permissionStatus.icon className="h-3 w-3 mr-1" />
                  {permissionStatus.text}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {!hasPermission && isSupported && (
                <div className="space-y-3">
                  <p className="text-xs text-gray-600">
                    Allow notifications to receive instant alerts for new orders
                  </p>
                  <Button 
                    onClick={requestPermission} 
                    size="sm" 
                    className="w-full bg-orange-600 hover:bg-orange-700"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Enable Browser Notifications
                  </Button>
                </div>
              )}
              
              {!isSupported && (
                <p className="text-xs text-gray-500">
                  Your browser doesn't support notifications
                </p>
              )}
              
              {hasPermission && (
                <p className="text-xs text-green-600">
                  ✓ Browser notifications are enabled
                </p>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Enable Notifications</Label>
                <p className="text-xs text-gray-500">Turn on/off all notifications</p>
              </div>
              <Switch
                checked={settings.enabled}
                onCheckedChange={(checked) => updateSettings({ enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop Notifications
                </Label>
                <p className="text-xs text-gray-500">Show popup notifications</p>
              </div>
              <Switch
                checked={settings.desktop}
                onCheckedChange={(checked) => updateSettings({ desktop: checked })}
                disabled={!settings.enabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium flex items-center gap-2">
                  {settings.sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  Sound Alerts
                </Label>
                <p className="text-xs text-gray-500">Play sound for notifications</p>
              </div>
              <Switch
                checked={settings.sound}
                onCheckedChange={(checked) => updateSettings({ sound: checked })}
                disabled={!settings.enabled}
              />
            </div>

            {/* Volume Control */}
            {settings.sound && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Volume</Label>
                  <span className="text-xs text-gray-500">{Math.round(settings.volume * 100)}%</span>
                </div>
                <div className="flex items-center space-x-3">
                  <VolumeX className="h-4 w-4 text-gray-400" />
                  <Slider
                    value={[settings.volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    min={0}
                    step={0.1}
                    className="flex-1"
                  />
                  <Volume2 className="h-4 w-4 text-gray-400" />
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={playNotificationSound}
                  className="w-full gap-2"
                  disabled={!settings.sound}
                >
                  <Play className="h-3 w-3" />
                  Test Sound
                </Button>
              </div>
            )}
          </div>

          {/* Test Notification */}
          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-orange-900">Test Notifications</Label>
                <p className="text-xs text-orange-700">
                  Send a test notification to see how it works
                </p>
                <Button
                  onClick={handleTestNotification}
                  size="sm"
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={!settings.enabled}
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Send Test Notification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}