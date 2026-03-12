// Sound library with categorized, royalty-free sounds
// Each sound has an id, name, url, and category
// All sounds are from freesound.org (Creative Commons licensed)

export interface SoundOption {
  id: string
  name: string
  url: string
  description?: string
}

export interface SoundCategory {
  id: string
  name: string
  description: string
  icon: string // Lucide icon name
  sounds: SoundOption[]
}

// Sound URLs - using reliable publicly available sounds
// Most from pixabay.com (royalty-free) and other free sound sources
export const SOUND_LIBRARY: SoundCategory[] = [
  {
    id: "success",
    name: "Success",
    description: "Positive completion sounds for successful actions",
    icon: "CheckCircle",
    sounds: [
      { id: "chime-1", name: "Gentle Chime", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3", description: "Soft, pleasant chime" },
      { id: "chime-2", name: "Bright Bell", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_7625e88d23.mp3", description: "Clear, bright bell tone" },
      { id: "chime-3", name: "Success Ding", url: "https://cdn.pixabay.com/audio/2021/08/04/audio_0625c1539c.mp3", description: "Classic success ding" },
      { id: "chime-4", name: "Achievement", url: "https://cdn.pixabay.com/audio/2022/11/21/audio_fe0c31c88a.mp3", description: "Triumphant achievement sound" },
      { id: "chime-5", name: "Positive Pop", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_d1d212d909.mp3", description: "Quick positive pop" },
      { id: "chime-6", name: "Level Up", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_942694de94.mp3", description: "Game-style level up" },
      { id: "chime-7", name: "Sparkle", url: "https://cdn.pixabay.com/audio/2022/07/19/audio_21a80f1bb3.mp3", description: "Magical sparkle sound" },
      { id: "chime-8", name: "Complete", url: "https://cdn.pixabay.com/audio/2024/02/19/audio_e79e659753.mp3", description: "Task complete sound" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "notification",
    name: "Notification",
    description: "Alert sounds for new notifications and messages",
    icon: "Bell",
    sounds: [
      { id: "notify-1", name: "Soft Ping", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_66b7b3a943.mp3", description: "Gentle notification ping" },
      { id: "notify-2", name: "Message Pop", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_715f616c1e.mp3", description: "Quick message pop" },
      { id: "notify-3", name: "Bubble", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_ea754db23d.mp3", description: "Bubbly notification" },
      { id: "notify-4", name: "Attention", url: "https://cdn.pixabay.com/audio/2024/03/09/audio_f2bc1db4e9.mp3", description: "Attention-grabbing tone" },
      { id: "notify-5", name: "Gentle Alert", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_3bef0ae7b5.mp3", description: "Soft alert sound" },
      { id: "notify-6", name: "Ding Dong", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_9be4d57b8f.mp3", description: "Doorbell style" },
      { id: "notify-7", name: "Blip", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_8cb2f88af2.mp3", description: "Short electronic blip" },
      { id: "notify-8", name: "Chime", url: "https://cdn.pixabay.com/audio/2023/01/06/audio_0d8e6d6725.mp3", description: "Simple chime notification" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "action",
    name: "UI Actions",
    description: "Subtle sounds for clicks, opens, and micro-interactions",
    icon: "MousePointerClick",
    sounds: [
      { id: "click-1", name: "Soft Click", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_a58e69dd3d.mp3", description: "Subtle click sound" },
      { id: "click-2", name: "Tap", url: "https://cdn.pixabay.com/audio/2022/10/26/audio_e55d80ec3f.mp3", description: "Light tap sound" },
      { id: "click-3", name: "Switch", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_63e3cc4e2b.mp3", description: "Toggle switch sound" },
      { id: "click-4", name: "Pop", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_35b2c32a79.mp3", description: "Quick pop" },
      { id: "click-5", name: "Minimal", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_06712e58ab.mp3", description: "Very subtle click" },
      { id: "click-6", name: "Button", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_1ff4f5c2c7.mp3", description: "Button press sound" },
      { id: "click-7", name: "Swoosh", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_2e62fd76a4.mp3", description: "Quick swoosh transition" },
      { id: "click-8", name: "Slide", url: "https://cdn.pixabay.com/audio/2024/03/28/audio_cdd21c9c00.mp3", description: "Sliding panel sound" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "alert",
    name: "Alerts",
    description: "Warning and error sounds",
    icon: "AlertTriangle",
    sounds: [
      { id: "alert-1", name: "Warning", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_d4d85b1f76.mp3", description: "Standard warning tone" },
      { id: "alert-2", name: "Error", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_942c47f7c5.mp3", description: "Error indication" },
      { id: "alert-3", name: "Gentle Warning", url: "https://cdn.pixabay.com/audio/2024/03/22/audio_0e7eb2c63f.mp3", description: "Soft warning" },
      { id: "alert-4", name: "Attention", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_5ee77e16da.mp3", description: "Get attention sound" },
      { id: "alert-5", name: "Negative", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_805b70c2dc.mp3", description: "Negative feedback sound" },
      { id: "alert-6", name: "Denied", url: "https://cdn.pixabay.com/audio/2024/02/27/audio_c9f2fefa3a.mp3", description: "Access denied sound" },
      { id: "alert-7", name: "Buzz", url: "https://cdn.pixabay.com/audio/2022/07/20/audio_8f8d35cf31.mp3", description: "Short buzz alert" },
      { id: "alert-8", name: "Beep", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_9c32c4c7f0.mp3", description: "Simple beep alert" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "ai",
    name: "AI Events",
    description: "Sounds for AI generation start and completion",
    icon: "Sparkles",
    sounds: [
      { id: "ai-1", name: "Processing", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_e29bc04ed6.mp3", description: "AI starting sound" },
      { id: "ai-2", name: "Magic", url: "https://cdn.pixabay.com/audio/2022/01/18/audio_c5a01cb3cc.mp3", description: "Magical processing" },
      { id: "ai-3", name: "Tech Whoosh", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_d5e8e54d70.mp3", description: "Futuristic whoosh" },
      { id: "ai-4", name: "Digital", url: "https://cdn.pixabay.com/audio/2024/04/03/audio_19c00cdbdb.mp3", description: "Digital processing" },
      { id: "ai-5", name: "Complete", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a73467.mp3", description: "AI completion chime" },
      { id: "ai-6", name: "Thinking", url: "https://cdn.pixabay.com/audio/2022/12/13/audio_8c48d25e9d.mp3", description: "Contemplative sound" },
      { id: "ai-7", name: "Sci-Fi", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_b31db768ea.mp3", description: "Sci-fi computer sound" },
      { id: "ai-8", name: "Neural", url: "https://cdn.pixabay.com/audio/2023/09/19/audio_1a9f6e73c7.mp3", description: "Neural network vibe" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "navigation",
    name: "Navigation",
    description: "Sounds for page transitions and navigation",
    icon: "Navigation",
    sounds: [
      { id: "nav-1", name: "Page Turn", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_1d623ea3e2.mp3", description: "Page flip sound" },
      { id: "nav-2", name: "Slide", url: "https://cdn.pixabay.com/audio/2022/03/15/audio_2e62fd76a4.mp3", description: "Slide transition" },
      { id: "nav-3", name: "Fade", url: "https://cdn.pixabay.com/audio/2022/03/10/audio_3bef0ae7b5.mp3", description: "Fade transition" },
      { id: "nav-4", name: "Zoom", url: "https://cdn.pixabay.com/audio/2022/10/30/audio_e1b3c3e9bd.mp3", description: "Zoom in/out" },
      { id: "nav-5", name: "Swipe", url: "https://cdn.pixabay.com/audio/2022/03/24/audio_d1d212d909.mp3", description: "Swipe gesture" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "ambient",
    name: "Ambient",
    description: "Background and ambient sounds for focus",
    icon: "Wind",
    sounds: [
      { id: "ambient-1", name: "Soft Hum", url: "https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3", description: "Gentle background hum" },
      { id: "ambient-2", name: "Nature", url: "https://cdn.pixabay.com/audio/2022/06/07/audio_e6fb4e5d6e.mp3", description: "Nature ambient" },
      { id: "ambient-3", name: "Rain", url: "https://cdn.pixabay.com/audio/2022/05/13/audio_257112ffc5.mp3", description: "Rain sounds" },
      { id: "ambient-4", name: "Focus", url: "https://cdn.pixabay.com/audio/2022/08/31/audio_20a3f3d9d4.mp3", description: "Focus ambiance" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
]

// Helper to get a sound URL by category and sound ID
export function getSoundUrl(categoryId: string, soundId: string): string {
  const category = SOUND_LIBRARY.find(c => c.id === categoryId)
  if (!category) return ""
  const sound = category.sounds.find(s => s.id === soundId)
  return sound?.url || ""
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
  
  const url = getSoundUrl(categoryId, categoryConfig.soundId)
  if (!url) return
  
  try {
    const audio = new Audio(url)
    audio.volume = config.globalVolume * categoryConfig.volume
    audio.play().catch(() => {
      // Audio play was blocked - user hasn't interacted with page yet
    })
  } catch {
    // Audio creation failed
  }
}
