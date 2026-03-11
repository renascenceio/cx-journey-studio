// Sound library with categorized, royalty-free sounds
// Each sound has an id, name, url, and category

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

// Sound URLs from freesound.org (royalty-free)
export const SOUND_LIBRARY: SoundCategory[] = [
  {
    id: "success",
    name: "Success",
    description: "Positive completion sounds for successful actions",
    icon: "CheckCircle",
    sounds: [
      { id: "chime-1", name: "Gentle Chime", url: "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3", description: "Soft, pleasant chime" },
      { id: "chime-2", name: "Bright Bell", url: "https://cdn.freesound.org/previews/256/256113_3263906-lq.mp3", description: "Clear, bright bell tone" },
      { id: "chime-3", name: "Success Ding", url: "https://cdn.freesound.org/previews/341/341695_5858296-lq.mp3", description: "Classic success ding" },
      { id: "chime-4", name: "Achievement", url: "https://cdn.freesound.org/previews/270/270404_5123851-lq.mp3", description: "Triumphant achievement sound" },
      { id: "chime-5", name: "Positive Pop", url: "https://cdn.freesound.org/previews/242/242501_1015240-lq.mp3", description: "Quick positive pop" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "notification",
    name: "Notification",
    description: "Alert sounds for new notifications and messages",
    icon: "Bell",
    sounds: [
      { id: "notify-1", name: "Soft Ping", url: "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3", description: "Gentle notification ping" },
      { id: "notify-2", name: "Message Pop", url: "https://cdn.freesound.org/previews/536/536420_11943129-lq.mp3", description: "Quick message pop" },
      { id: "notify-3", name: "Bubble", url: "https://cdn.freesound.org/previews/320/320181_5260872-lq.mp3", description: "Bubbly notification" },
      { id: "notify-4", name: "Attention", url: "https://cdn.freesound.org/previews/411/411089_5121236-lq.mp3", description: "Attention-grabbing tone" },
      { id: "notify-5", name: "Gentle Alert", url: "https://cdn.freesound.org/previews/338/338226_5865517-lq.mp3", description: "Soft alert sound" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "action",
    name: "UI Actions",
    description: "Subtle sounds for clicks, opens, and micro-interactions",
    icon: "MousePointerClick",
    sounds: [
      { id: "click-1", name: "Soft Click", url: "https://cdn.freesound.org/previews/156/156031_2703579-lq.mp3", description: "Subtle click sound" },
      { id: "click-2", name: "Tap", url: "https://cdn.freesound.org/previews/264/264981_4486188-lq.mp3", description: "Light tap sound" },
      { id: "click-3", name: "Switch", url: "https://cdn.freesound.org/previews/446/446100_9159316-lq.mp3", description: "Toggle switch sound" },
      { id: "click-4", name: "Pop", url: "https://cdn.freesound.org/previews/256/256116_3263906-lq.mp3", description: "Quick pop" },
      { id: "click-5", name: "Minimal", url: "https://cdn.freesound.org/previews/242/242502_1015240-lq.mp3", description: "Very subtle click" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "alert",
    name: "Alerts",
    description: "Warning and error sounds",
    icon: "AlertTriangle",
    sounds: [
      { id: "alert-1", name: "Warning", url: "https://cdn.freesound.org/previews/142/142608_1840739-lq.mp3", description: "Standard warning tone" },
      { id: "alert-2", name: "Error Buzz", url: "https://cdn.freesound.org/previews/415/415209_6090639-lq.mp3", description: "Error indication" },
      { id: "alert-3", name: "Gentle Warning", url: "https://cdn.freesound.org/previews/350/350873_4502151-lq.mp3", description: "Soft warning" },
      { id: "alert-4", name: "Attention", url: "https://cdn.freesound.org/previews/220/220206_1015240-lq.mp3", description: "Get attention sound" },
      { id: "alert-5", name: "Uh Oh", url: "https://cdn.freesound.org/previews/277/277403_4486188-lq.mp3", description: "Playful error sound" },
      { id: "none", name: "No Sound", url: "", description: "Disable this category" },
    ],
  },
  {
    id: "ai",
    name: "AI Events",
    description: "Sounds for AI generation start and completion",
    icon: "Sparkles",
    sounds: [
      { id: "ai-1", name: "Processing", url: "https://cdn.freesound.org/previews/352/352661_4019029-lq.mp3", description: "AI starting sound" },
      { id: "ai-2", name: "Magic", url: "https://cdn.freesound.org/previews/270/270319_5123851-lq.mp3", description: "Magical processing" },
      { id: "ai-3", name: "Tech Whoosh", url: "https://cdn.freesound.org/previews/387/387232_7255534-lq.mp3", description: "Futuristic whoosh" },
      { id: "ai-4", name: "Digital", url: "https://cdn.freesound.org/previews/253/253172_4597795-lq.mp3", description: "Digital processing" },
      { id: "ai-5", name: "Complete", url: "https://cdn.freesound.org/previews/320/320655_5260872-lq.mp3", description: "AI completion chime" },
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

// Sound event to category mapping
export const EVENT_CATEGORY_MAP: Record<string, string> = {
  // Success events
  "success": "success",
  "journey-created": "success",
  "stage-added": "success",
  "solution-applied": "success",
  "archetype-added": "success",
  "save-complete": "success",
  "export-complete": "success",
  "workspace-switch": "success",
  
  // Notification events
  "notification": "notification",
  "comment-received": "notification",
  "mention": "notification",
  "collaborator-joined": "notification",
  
  // Action events
  "click": "action",
  "open": "action",
  "close": "action",
  "tab-switch": "action",
  "drag-start": "action",
  "drop": "action",
  
  // Alert events
  "error": "alert",
  "warning": "alert",
  "delete": "alert",
  
  // AI events
  "ai-start": "ai",
  "ai-complete": "ai",
  "ai-thinking": "ai",
}
