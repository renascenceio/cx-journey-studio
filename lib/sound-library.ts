// Sound library with categorized sounds
// All sounds are generated programmatically using Web Audio API - no external files needed!

import { GENERATED_SOUNDS, playGeneratedSound } from "./sound-generator"

export interface SoundOption {
  id: string
  name: string
  description?: string
}

export interface SoundCategory {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  sounds: SoundOption[]
}

// Build SOUND_LIBRARY from GENERATED_SOUNDS
export const SOUND_LIBRARY: SoundCategory[] = [
  {
    id: "success",
    name: "Success",
    description: "Positive completion sounds for successful actions",
    icon: "CheckCircle",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.success || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "notification",
    name: "Notification",
    description: "Alert sounds for new notifications and messages",
    icon: "Bell",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.notification || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "action",
    name: "UI Actions",
    description: "Subtle sounds for clicks, opens, and micro-interactions",
    icon: "MousePointerClick",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.action || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "alert",
    name: "Alerts",
    description: "Warning and error sounds",
    icon: "AlertTriangle",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.alert || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "ai",
    name: "AI Events",
    description: "Sounds for AI generation start and completion",
    icon: "Sparkles",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.ai || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    description: "Sounds for page transitions and navigation",
    icon: "Navigation",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.navigation || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
  {
    id: "ambient",
    name: "Ambient",
    description: "Background and ambient sounds for focus",
    icon: "Wind",
    sounds: [
      ...Object.entries(GENERATED_SOUNDS.ambient || {}).map(([id, sound]) => ({
        id,
        name: sound.name,
        description: sound.description,
      })),
      { id: "none", name: "No Sound", description: "Disable this category" },
    ],
  },
]

// Helper to play a sound by category and sound ID
export function playSound(categoryId: string, soundId: string, volume = 0.5): void {
  if (soundId === "none") return
  playGeneratedSound(categoryId, soundId, volume)
}

// Helper to get sound options for a category
export function getSoundOptions(categoryId: string): SoundOption[] {
  const category = SOUND_LIBRARY.find(c => c.id === categoryId)
  return category?.sounds || []
}

// Helper to get category info
export function getCategoryInfo(categoryId: string): SoundCategory | undefined {
  return SOUND_LIBRARY.find(c => c.id === categoryId)
}

// Sound event to category mapping - expanded with more events
export const EVENT_CATEGORY_MAP: Record<string, string> = {
  // Success events
  "success": "success",
  "journey-created": "success",
  "journey-saved": "success",
  "journey-published": "success",
  "stage-added": "success",
  "stage-completed": "success",
  "step-added": "success",
  "step-completed": "success",
  "solution-applied": "success",
  "solution-created": "success",
  "archetype-added": "success",
  "archetype-created": "success",
  "save-complete": "success",
  "export-complete": "success",
  "import-complete": "success",
  "workspace-created": "success",
  "workspace-switch": "success",
  "template-applied": "success",
  "upload-complete": "success",
  "copy-complete": "success",
  "undo-complete": "success",
  "redo-complete": "success",
  
  // Notification events
  "notification": "notification",
  "comment-received": "notification",
  "comment-reply": "notification",
  "mention": "notification",
  "collaborator-joined": "notification",
  "collaborator-left": "notification",
  "share-received": "notification",
  "invite-sent": "notification",
  "invite-received": "notification",
  "message-received": "notification",
  "update-available": "notification",
  "reminder": "notification",
  
  // Action events
  "click": "action",
  "open": "action",
  "close": "action",
  "tab-switch": "action",
  "panel-open": "action",
  "panel-close": "action",
  "modal-open": "action",
  "modal-close": "action",
  "drag-start": "action",
  "drag-end": "action",
  "drop": "action",
  "select": "action",
  "deselect": "action",
  "expand": "action",
  "collapse": "action",
  "toggle": "action",
  "hover": "action",
  "focus": "action",
  "scroll": "action",
  "resize": "action",
  
  // Alert events
  "error": "alert",
  "warning": "alert",
  "delete": "alert",
  "delete-confirm": "alert",
  "validation-error": "alert",
  "connection-lost": "alert",
  "session-expired": "alert",
  "permission-denied": "alert",
  "limit-reached": "alert",
  "conflict": "alert",
  
  // AI events
  "ai-start": "ai",
  "ai-complete": "ai",
  "ai-thinking": "ai",
  "ai-generating": "ai",
  "ai-analyzing": "ai",
  "ai-suggestion": "ai",
  "ai-error": "ai",
  "ai-stream-start": "ai",
  "ai-stream-end": "ai",
  
  // Navigation events
  "page-enter": "navigation",
  "page-exit": "navigation",
  "route-change": "navigation",
  "back": "navigation",
  "forward": "navigation",
  "menu-open": "navigation",
  "menu-close": "navigation",
  "sidebar-toggle": "navigation",
}

// Play a sound for an event
export function playSoundForEvent(
  eventName: string, 
  config: { enabled: boolean; globalVolume: number; categories: Record<string, { enabled: boolean; volume: number; soundId: string }> }
): void {
  if (!config.enabled) return
  
  const categoryId = EVENT_CATEGORY_MAP[eventName]
  if (!categoryId) return
  
  const categoryConfig = config.categories[categoryId]
  if (!categoryConfig?.enabled) return
  
  const volume = config.globalVolume * categoryConfig.volume
  playGeneratedSound(categoryId, categoryConfig.soundId, volume)
}
