"use client"

import { useCallback, useRef } from 'react'

interface UseNotificationSoundOptions {
  enabled?: boolean
  volume?: number
}

export function useNotificationSound(options: UseNotificationSoundOptions = {}) {
  const { enabled = true, volume = 0.7 } = options
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Initialize or update audio element
  const getAudio = useCallback(() => {
    if (typeof window === 'undefined') return null
    
    if (!audioRef.current) {
      try {
        const audio = new Audio('/audio/level-up.mp3')
        audio.preload = 'auto'
        audioRef.current = audio
      } catch (error) {
        console.warn('Audio not supported:', error)
        return null
      }
    }
    
    // Always update volume
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
    
    return audioRef.current
  }, [volume])

  // Play the level-up.mp3 sound
  const playLevelUpSound = useCallback(() => {
    if (!enabled) return

    const audio = getAudio()
    if (!audio) return

    try {
      // Reset to beginning and play
      audio.currentTime = 0
      const playPromise = audio.play()
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Could not play notification sound:', error)
        })
      }
    } catch (error) {
      console.warn('Error playing notification sound:', error)
    }
  }, [enabled, getAudio])

  // Use level-up sound for all notification types
  const playOrderNotification = useCallback(() => {
    playLevelUpSound()
  }, [playLevelUpSound])

  const playSuccessSound = useCallback(() => {
    playLevelUpSound()
  }, [playLevelUpSound])

  const playWarningSound = useCallback(() => {
    playLevelUpSound()
  }, [playLevelUpSound])

  const playNotificationBeep = useCallback(() => {
    playLevelUpSound()
  }, [playLevelUpSound])

  return {
    playOrderNotification,
    playSuccessSound,
    playWarningSound,
    playNotificationBeep,
    playLevelUpSound,
  }
}