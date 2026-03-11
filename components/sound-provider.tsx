"use client"

import { createContext, useContext, type ReactNode } from "react"
import { useSounds, type SoundEvent, type SoundPreferences, preloadCommonSounds } from "@/hooks/use-sounds"
import { useEffect } from "react"

interface SoundContextValue {
  play: (event: SoundEvent) => void
  preferences: SoundPreferences
  isLoaded: boolean
  toggleSounds: () => void
  toggleCategory: (category: keyof SoundPreferences["categories"]) => void
  setVolume: (volume: number) => void
}

const SoundContext = createContext<SoundContextValue | null>(null)

export function SoundProvider({ children }: { children: ReactNode }) {
  const sounds = useSounds()
  
  // Preload common sounds on first user interaction
  useEffect(() => {
    const handleInteraction = () => {
      preloadCommonSounds()
      // Only need to preload once
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
    
    window.addEventListener("click", handleInteraction)
    window.addEventListener("keydown", handleInteraction)
    
    return () => {
      window.removeEventListener("click", handleInteraction)
      window.removeEventListener("keydown", handleInteraction)
    }
  }, [])
  
  return (
    <SoundContext.Provider value={sounds}>
      {children}
    </SoundContext.Provider>
  )
}

export function useSound() {
  const context = useContext(SoundContext)
  if (!context) {
    // Return a no-op function if not in provider (for SSR or outside provider)
    return {
      play: () => {},
      preferences: {
        enabled: false,
        volume: 0.5,
        categories: {
          success: false,
          notification: false,
          action: false,
          alert: false,
          ai: false,
        },
      },
      isLoaded: false,
      toggleSounds: () => {},
      toggleCategory: () => {},
      setVolume: () => {},
    }
  }
  return context
}

// Export the SoundEvent type for consumers
export type { SoundEvent }
