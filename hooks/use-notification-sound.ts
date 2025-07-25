"use client"

import { useCallback, useRef } from 'react'

interface UseNotificationSoundOptions {
  enabled?: boolean
  volume?: number
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { enabled = true, volume = 0.5 } = options
  const audioContextRef = useRef<AudioContext | null>(null)

  // Initialize audio context on first use
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current && typeof window !== 'undefined') {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      } catch (error) {
        console.warn('AudioContext not supported:', error)
      }
    }
    return audioContextRef.current
  }, [])

  // Create a simple notification beep using Web Audio API
  const playNotificationBeep = useCallback((frequency = 800, duration = 200) => {
    if (!enabled) return

    const audioContext = initAudioContext()
    if (!audioContext) return

    try {
      // Create oscillator for the beep sound
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      // Configure the sound
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      oscillator.type = 'sine'

      // Create envelope for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01)
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration / 1000)

      // Play the sound
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.warn('Error playing notification sound:', error)
    }
  }, [enabled, volume, initAudioContext])

  // Play a pleasant two-tone notification (like iPhone notification)
  const playOrderNotification = useCallback(() => {
    if (!enabled) return

    // Play first tone
    playNotificationBeep(880, 150)
    
    // Play second tone after a short delay
    setTimeout(() => {
      playNotificationBeep(660, 150)
    }, 160)
  }, [enabled, playNotificationBeep])

  // Play a simple success sound
  const playSuccessSound = useCallback(() => {
    if (!enabled) return
    playNotificationBeep(1000, 100)
  }, [enabled, playNotificationBeep])

  // Play a warning sound
  const playWarningSound = useCallback(() => {
    if (!enabled) return
    playNotificationBeep(400, 300)
  }, [enabled, playNotificationBeep])

  return {
    playOrderNotification,
    playSuccessSound,
    playWarningSound,
    playNotificationBeep,
  }
}