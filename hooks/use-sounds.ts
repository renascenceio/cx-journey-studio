"use client"

import { useCallback, useEffect, useState } from "react"
import { SOUND_LIBRARY, getSoundUrl, EVENT_CATEGORY_MAP } from "@/lib/sound-library"

// Sound event types for the application
export type SoundEvent =
  // Success/Completion
  | "success"           // Generic success
  | "journey-created"   // Journey created
  | "stage-added"       // Stage added to journey
  | "solution-applied"  // Solution applied to pain point
  | "archetype-added"   // Archetype generated/added
  | "save-complete"     // Save completed
  | "export-complete"   // Export completed
  | "workspace-switch"  // Workspace switched
  // Notifications
  | "notification"      // Generic notification
  | "comment-received"  // New comment
  | "mention"           // User mentioned
  | "collaborator-joined" // Someone joined
  // Actions
  | "click"             // Button click
  | "open"              // Modal/dropdown open
  | "close"             // Modal/dropdown close
  | "tab-switch"        // Tab switched
  | "drag-start"        // Started dragging
  | "drop"              // Item dropped
  // Alerts
  | "error"             // Error occurred
  | "warning"           // Warning
  | "delete"            // Delete action
  // AI
  | "ai-start"          // AI generation started
  | "ai-complete"       // AI generation completed
  | "ai-thinking"       // AI processing

// Sound URLs - using simple, royalty-free sounds
// These can be replaced with custom sounds
const SOUND_URLS: Record<SoundEvent, string> = {
  // Success sounds - bright, positive tones
  "success": "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3",
  "journey-created": "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3",
  "stage-added": "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3",
  "solution-applied": "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3",
  "archetype-added": "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3",
  "save-complete": "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3",
  "export-complete": "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3",
  "workspace-switch": "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3",
  
  // Notification sounds - attention-grabbing but not jarring
  "notification": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
  "comment-received": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
  "mention": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
  "collaborator-joined": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
  
  // Action sounds - subtle, quick
  "click": "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3",
  "open": "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3",
  "close": "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3",
  "tab-switch": "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3",
  "drag-start": "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3",
  "drop": "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3",
  
  // Alert sounds
  "error": "https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3",
  "warning": "https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3",
  "delete": "https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3",
  
  // AI sounds - futuristic, processing feel
  "ai-start": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
  "ai-complete": "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3",
  "ai-thinking": "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3",
}

// Default volume levels for different sound categories
const DEFAULT_VOLUMES: Record<string, number> = {
  success: 0.5,
  notification: 0.6,
  action: 0.3,
  alert: 0.7,
  ai: 0.5,
}

// Storage key for sound preferences
const SOUND_PREFS_KEY = "jds_sound_preferences"

export interface SoundPreferences {
  enabled: boolean
  volume: number // 0-1
  categories: {
    success: boolean
    notification: boolean
    action: boolean
    alert: boolean
    ai: boolean
  }
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 0.5,
  categories: {
    success: true,
    notification: true,
    action: false, // Micro-interactions off by default
    alert: true,
    ai: true,
  },
}

// Admin-configured sound settings (fetched from site_config)
interface AdminSoundConfig {
  enabled: boolean
  globalVolume: number
  categories: {
    [key: string]: {
      enabled: boolean
      volume: number
      soundId: string
    }
  }
}

function getCategory(event: SoundEvent): keyof SoundPreferences["categories"] {
  if (["success", "journey-created", "stage-added", "solution-applied", "archetype-added", "save-complete", "export-complete", "workspace-switch"].includes(event)) {
    return "success"
  }
  if (["notification", "comment-received", "mention", "collaborator-joined"].includes(event)) {
    return "notification"
  }
  if (["click", "open", "close", "tab-switch", "drag-start", "drop"].includes(event)) {
    return "action"
  }
  if (["error", "warning", "delete"].includes(event)) {
    return "alert"
  }
  return "ai"
}

// Audio cache to avoid re-loading sounds
const audioCache = new Map<SoundEvent, HTMLAudioElement>()

function preloadSound(event: SoundEvent): HTMLAudioElement | null {
  if (typeof window === "undefined") return null
  
  if (audioCache.has(event)) {
    return audioCache.get(event)!
  }
  
  const audio = new Audio(SOUND_URLS[event])
  audio.preload = "auto"
  audioCache.set(event, audio)
  return audio
}

export function useSounds() {
  const [preferences, setPreferences] = useState<SoundPreferences>(DEFAULT_PREFERENCES)
  const [adminConfig, setAdminConfig] = useState<AdminSoundConfig | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  
  // Load admin sound config from site-config API
  useEffect(() => {
    if (typeof window === "undefined") return
    
    fetch("/api/site-config")
      .then(r => r.json())
      .then(data => {
        if (data.soundsConfig) {
          setAdminConfig(data.soundsConfig)
        }
      })
      .catch(() => {
        // Ignore errors - use defaults
      })
  }, [])
  
  // Load user preferences from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return
    
    try {
      const stored = localStorage.getItem(SOUND_PREFS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsed })
      }
    } catch {
      // Ignore errors
    }
    setIsLoaded(true)
  }, [])
  
  // Save preferences to localStorage
  const updatePreferences = useCallback((updates: Partial<SoundPreferences>) => {
    setPreferences(prev => {
      const next = { ...prev, ...updates }
      if (typeof window !== "undefined") {
        localStorage.setItem(SOUND_PREFS_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])
  
  // Play a sound
  const play = useCallback((event: SoundEvent) => {
    if (typeof window === "undefined") return
    if (!preferences.enabled) return
    
    // Check admin config if sounds are globally disabled
    if (adminConfig && !adminConfig.enabled) return
    
    const category = getCategory(event)
    if (!preferences.categories[category]) return
    
    // Check if category is disabled in admin config
    if (adminConfig?.categories[category] && !adminConfig.categories[category].enabled) return
    
    // Respect reduced motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    
    try {
      // Get sound URL from admin config if available, otherwise use default
      let soundUrl: string
      let categoryVolume = DEFAULT_VOLUMES[category] || 0.5
      
      if (adminConfig?.categories[category]) {
        const adminCat = adminConfig.categories[category]
        const soundId = adminCat.soundId
        if (soundId === "none") return // Sound disabled for this category
        
        soundUrl = getSoundUrl(category, soundId)
        categoryVolume = adminCat.volume * (adminConfig.globalVolume || 1)
      } else {
        soundUrl = SOUND_URLS[event]
      }
      
      if (!soundUrl) return
      
      const audio = new Audio(soundUrl)
      audio.volume = preferences.volume * categoryVolume
      audio.play().catch(() => {
        // Ignore autoplay restrictions
      })
    } catch {
      // Ignore errors
    }
  }, [preferences, adminConfig])
  
  // Toggle all sounds
  const toggleSounds = useCallback(() => {
    updatePreferences({ enabled: !preferences.enabled })
  }, [preferences.enabled, updatePreferences])
  
  // Toggle a category
  const toggleCategory = useCallback((category: keyof SoundPreferences["categories"]) => {
    updatePreferences({
      categories: {
        ...preferences.categories,
        [category]: !preferences.categories[category],
      },
    })
  }, [preferences.categories, updatePreferences])
  
  // Set volume
  const setVolume = useCallback((volume: number) => {
    updatePreferences({ volume: Math.max(0, Math.min(1, volume)) })
  }, [updatePreferences])
  
  return {
    play,
    preferences,
    isLoaded,
    toggleSounds,
    toggleCategory,
    setVolume,
    updatePreferences,
  }
}

// Preload common sounds on first interaction
export function preloadCommonSounds() {
  const commonSounds: SoundEvent[] = ["success", "notification", "error", "click"]
  commonSounds.forEach(preloadSound)
}
