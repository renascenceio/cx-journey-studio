/**
 * Web Audio API Sound Generator
 * Generates UI sounds programmatically without external files
 */

type OscillatorType = "sine" | "square" | "sawtooth" | "triangle"

interface ToneOptions {
  frequency: number
  duration: number
  type?: OscillatorType
  volume?: number
  attack?: number
  decay?: number
  fadeOut?: boolean
}

interface SoundDefinition {
  name: string
  description: string
  generate: (ctx: AudioContext, volume: number) => void
}

// Audio context singleton
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

// Base function to play a tone
function playTone(options: ToneOptions): void {
  const ctx = getAudioContext()
  const {
    frequency,
    duration,
    type = "sine",
    volume = 0.3,
    attack = 0.01,
    decay = 0.1,
    fadeOut = true
  } = options

  const oscillator = ctx.createOscillator()
  const gainNode = ctx.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(ctx.destination)

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)

  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime)
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + attack)
  
  if (fadeOut) {
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  } else {
    gainNode.gain.setValueAtTime(volume, ctx.currentTime + duration - decay)
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration)
  }

  oscillator.start(ctx.currentTime)
  oscillator.stop(ctx.currentTime + duration)
}

// Play a sequence of tones
function playSequence(tones: ToneOptions[], delay = 0): void {
  const ctx = getAudioContext()
  let time = ctx.currentTime + delay

  tones.forEach((tone) => {
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.type = tone.type || "sine"
    oscillator.frequency.setValueAtTime(tone.frequency, time)

    const volume = tone.volume ?? 0.3
    const attack = tone.attack ?? 0.01
    
    gainNode.gain.setValueAtTime(0, time)
    gainNode.gain.linearRampToValueAtTime(volume, time + attack)
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + tone.duration)

    oscillator.start(time)
    oscillator.stop(time + tone.duration)

    time += tone.duration * 0.8 // Slight overlap for smoother sound
  })
}

// Generate noise (for clicks, etc)
function playNoise(duration: number, volume = 0.1): void {
  const ctx = getAudioContext()
  const bufferSize = ctx.sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
  const data = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1))
  }

  const source = ctx.createBufferSource()
  const gainNode = ctx.createGain()
  
  source.buffer = buffer
  source.connect(gainNode)
  gainNode.connect(ctx.destination)
  
  gainNode.gain.setValueAtTime(volume, ctx.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
  
  source.start()
}

// ============================================
// SOUND DEFINITIONS
// ============================================

export const GENERATED_SOUNDS: Record<string, Record<string, SoundDefinition>> = {
  success: {
    "chime-1": {
      name: "Gentle Chime",
      description: "Soft, pleasant chime",
      generate: (_, vol) => {
        playSequence([
          { frequency: 523, duration: 0.15, volume: vol * 0.4 },
          { frequency: 659, duration: 0.2, volume: vol * 0.5 },
        ])
      }
    },
    "chime-2": {
      name: "Bright Bell",
      description: "Clear, bright bell tone",
      generate: (_, vol) => {
        playSequence([
          { frequency: 880, duration: 0.1, volume: vol * 0.3 },
          { frequency: 1108, duration: 0.15, volume: vol * 0.4 },
          { frequency: 1318, duration: 0.25, volume: vol * 0.3 },
        ])
      }
    },
    "chime-3": {
      name: "Success Ding",
      description: "Classic success ding",
      generate: (_, vol) => {
        playTone({ frequency: 880, duration: 0.3, volume: vol * 0.5, type: "sine" })
      }
    },
    "chime-4": {
      name: "Achievement",
      description: "Triumphant achievement sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 392, duration: 0.1, volume: vol * 0.4 },
          { frequency: 523, duration: 0.1, volume: vol * 0.5 },
          { frequency: 659, duration: 0.1, volume: vol * 0.5 },
          { frequency: 784, duration: 0.3, volume: vol * 0.6 },
        ])
      }
    },
    "chime-5": {
      name: "Positive Pop",
      description: "Quick positive pop",
      generate: (_, vol) => {
        playTone({ frequency: 600, duration: 0.08, volume: vol * 0.4, type: "sine" })
        setTimeout(() => playTone({ frequency: 800, duration: 0.1, volume: vol * 0.3 }), 50)
      }
    },
    "chime-6": {
      name: "Level Up",
      description: "Game-style level up",
      generate: (_, vol) => {
        playSequence([
          { frequency: 262, duration: 0.08, volume: vol * 0.3, type: "square" },
          { frequency: 330, duration: 0.08, volume: vol * 0.3, type: "square" },
          { frequency: 392, duration: 0.08, volume: vol * 0.3, type: "square" },
          { frequency: 523, duration: 0.15, volume: vol * 0.4, type: "square" },
        ])
      }
    },
    "chime-7": {
      name: "Sparkle",
      description: "Magical sparkle sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 1200, duration: 0.05, volume: vol * 0.2 },
          { frequency: 1600, duration: 0.05, volume: vol * 0.25 },
          { frequency: 2000, duration: 0.08, volume: vol * 0.2 },
          { frequency: 2400, duration: 0.1, volume: vol * 0.15 },
        ])
      }
    },
    "chime-8": {
      name: "Complete",
      description: "Task complete sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 440, duration: 0.12, volume: vol * 0.4 },
          { frequency: 554, duration: 0.12, volume: vol * 0.45 },
          { frequency: 659, duration: 0.2, volume: vol * 0.5 },
        ])
      }
    },
  },

  notification: {
    "notify-1": {
      name: "Soft Ping",
      description: "Gentle notification ping",
      generate: (_, vol) => {
        playTone({ frequency: 1000, duration: 0.15, volume: vol * 0.35, type: "sine" })
      }
    },
    "notify-2": {
      name: "Message Pop",
      description: "Quick message pop",
      generate: (_, vol) => {
        playTone({ frequency: 700, duration: 0.08, volume: vol * 0.4, type: "sine" })
      }
    },
    "notify-3": {
      name: "Bubble",
      description: "Bubbly notification",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(vol * 0.4, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      }
    },
    "notify-4": {
      name: "Attention",
      description: "Attention-grabbing tone",
      generate: (_, vol) => {
        playSequence([
          { frequency: 880, duration: 0.1, volume: vol * 0.4 },
          { frequency: 880, duration: 0.1, volume: vol * 0.4 },
        ])
      }
    },
    "notify-5": {
      name: "Gentle Alert",
      description: "Soft alert sound",
      generate: (_, vol) => {
        playTone({ frequency: 600, duration: 0.2, volume: vol * 0.3, type: "sine" })
      }
    },
    "notify-6": {
      name: "Ding Dong",
      description: "Doorbell style",
      generate: (_, vol) => {
        playSequence([
          { frequency: 830, duration: 0.15, volume: vol * 0.4 },
          { frequency: 622, duration: 0.2, volume: vol * 0.35 },
        ])
      }
    },
    "notify-7": {
      name: "Blip",
      description: "Short electronic blip",
      generate: (_, vol) => {
        playTone({ frequency: 1200, duration: 0.05, volume: vol * 0.35, type: "square" })
      }
    },
    "notify-8": {
      name: "Chime",
      description: "Simple chime notification",
      generate: (_, vol) => {
        playTone({ frequency: 1047, duration: 0.18, volume: vol * 0.4, type: "sine" })
      }
    },
  },

  action: {
    "click-1": {
      name: "Soft Click",
      description: "Subtle click sound",
      generate: (_, vol) => {
        playNoise(0.03, vol * 0.15)
      }
    },
    "click-2": {
      name: "Tap",
      description: "Light tap sound",
      generate: (_, vol) => {
        playTone({ frequency: 1800, duration: 0.02, volume: vol * 0.2, type: "sine" })
      }
    },
    "click-3": {
      name: "Switch",
      description: "Toggle switch sound",
      generate: (_, vol) => {
        playTone({ frequency: 800, duration: 0.04, volume: vol * 0.25, type: "square" })
      }
    },
    "click-4": {
      name: "Pop",
      description: "Quick pop",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05)
        gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)
        osc.start()
        osc.stop(ctx.currentTime + 0.05)
      }
    },
    "click-5": {
      name: "Minimal",
      description: "Very subtle click",
      generate: (_, vol) => {
        playNoise(0.015, vol * 0.08)
      }
    },
    "click-6": {
      name: "Button",
      description: "Button press sound",
      generate: (_, vol) => {
        playTone({ frequency: 600, duration: 0.03, volume: vol * 0.2, type: "triangle" })
      }
    },
    "click-7": {
      name: "Swoosh",
      description: "Quick swoosh transition",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(200, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }
    },
    "click-8": {
      name: "Slide",
      description: "Sliding panel sound",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(500, ctx.currentTime + 0.12)
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15)
        osc.start()
        osc.stop(ctx.currentTime + 0.15)
      }
    },
  },

  alert: {
    "alert-1": {
      name: "Warning",
      description: "Standard warning tone",
      generate: (_, vol) => {
        playSequence([
          { frequency: 440, duration: 0.15, volume: vol * 0.5, type: "sawtooth" },
          { frequency: 440, duration: 0.15, volume: vol * 0.5, type: "sawtooth" },
        ])
      }
    },
    "alert-2": {
      name: "Error",
      description: "Error indication",
      generate: (_, vol) => {
        playTone({ frequency: 200, duration: 0.25, volume: vol * 0.4, type: "square" })
      }
    },
    "alert-3": {
      name: "Gentle Warning",
      description: "Soft warning",
      generate: (_, vol) => {
        playSequence([
          { frequency: 330, duration: 0.12, volume: vol * 0.35 },
          { frequency: 262, duration: 0.15, volume: vol * 0.3 },
        ])
      }
    },
    "alert-4": {
      name: "Attention",
      description: "Get attention sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 600, duration: 0.08, volume: vol * 0.4, type: "square" },
          { frequency: 600, duration: 0.08, volume: vol * 0.4, type: "square" },
          { frequency: 600, duration: 0.08, volume: vol * 0.4, type: "square" },
        ])
      }
    },
    "alert-5": {
      name: "Negative",
      description: "Negative feedback sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 400, duration: 0.12, volume: vol * 0.4 },
          { frequency: 300, duration: 0.18, volume: vol * 0.35 },
        ])
      }
    },
    "alert-6": {
      name: "Denied",
      description: "Access denied sound",
      generate: (_, vol) => {
        playTone({ frequency: 150, duration: 0.3, volume: vol * 0.4, type: "square" })
      }
    },
    "alert-7": {
      name: "Buzz",
      description: "Short buzz alert",
      generate: (_, vol) => {
        playTone({ frequency: 100, duration: 0.1, volume: vol * 0.3, type: "sawtooth" })
      }
    },
    "alert-8": {
      name: "Beep",
      description: "Simple beep alert",
      generate: (_, vol) => {
        playTone({ frequency: 800, duration: 0.15, volume: vol * 0.4, type: "square" })
      }
    },
  },

  ai: {
    "ai-1": {
      name: "Processing",
      description: "AI starting sound",
      generate: (_, vol) => {
        playSequence([
          { frequency: 200, duration: 0.08, volume: vol * 0.25 },
          { frequency: 400, duration: 0.08, volume: vol * 0.3 },
          { frequency: 600, duration: 0.1, volume: vol * 0.35 },
        ])
      }
    },
    "ai-2": {
      name: "Magic",
      description: "Magical processing",
      generate: (_, vol) => {
        playSequence([
          { frequency: 523, duration: 0.06, volume: vol * 0.2 },
          { frequency: 784, duration: 0.06, volume: vol * 0.25 },
          { frequency: 1047, duration: 0.06, volume: vol * 0.3 },
          { frequency: 1319, duration: 0.1, volume: vol * 0.25 },
        ])
      }
    },
    "ai-3": {
      name: "Tech Whoosh",
      description: "Futuristic whoosh",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(100, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      }
    },
    "ai-4": {
      name: "Digital",
      description: "Digital processing",
      generate: (_, vol) => {
        playSequence([
          { frequency: 800, duration: 0.04, volume: vol * 0.25, type: "square" },
          { frequency: 1000, duration: 0.04, volume: vol * 0.25, type: "square" },
          { frequency: 1200, duration: 0.04, volume: vol * 0.25, type: "square" },
          { frequency: 1600, duration: 0.06, volume: vol * 0.3, type: "square" },
        ])
      }
    },
    "ai-5": {
      name: "Complete",
      description: "AI completion chime",
      generate: (_, vol) => {
        playSequence([
          { frequency: 659, duration: 0.1, volume: vol * 0.35 },
          { frequency: 880, duration: 0.15, volume: vol * 0.4 },
          { frequency: 1047, duration: 0.2, volume: vol * 0.35 },
        ])
      }
    },
    "ai-6": {
      name: "Thinking",
      description: "Contemplative sound",
      generate: (_, vol) => {
        playTone({ frequency: 440, duration: 0.3, volume: vol * 0.2, type: "sine" })
      }
    },
    "ai-7": {
      name: "Sci-Fi",
      description: "Sci-fi computer sound",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sawtooth"
        osc.frequency.setValueAtTime(800, ctx.currentTime)
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.05)
        osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1)
        osc.frequency.setValueAtTime(1000, ctx.currentTime + 0.15)
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
        osc.start()
        osc.stop(ctx.currentTime + 0.2)
      }
    },
    "ai-8": {
      name: "Neural",
      description: "Neural network vibe",
      generate: (_, vol) => {
        for (let i = 0; i < 5; i++) {
          setTimeout(() => {
            playTone({ frequency: 400 + Math.random() * 800, duration: 0.04, volume: vol * 0.15 })
          }, i * 30)
        }
      }
    },
  },

  navigation: {
    "nav-1": {
      name: "Page Turn",
      description: "Page flip sound",
      generate: (_, vol) => {
        playNoise(0.08, vol * 0.12)
      }
    },
    "nav-2": {
      name: "Slide",
      description: "Slide transition",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(400, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.1)
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12)
        osc.start()
        osc.stop(ctx.currentTime + 0.12)
      }
    },
    "nav-3": {
      name: "Fade",
      description: "Fade transition",
      generate: (_, vol) => {
        playTone({ frequency: 500, duration: 0.15, volume: vol * 0.15, attack: 0.05 })
      }
    },
    "nav-4": {
      name: "Zoom",
      description: "Zoom in/out",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.setValueAtTime(300, ctx.currentTime)
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(vol * 0.2, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }
    },
    "nav-5": {
      name: "Swipe",
      description: "Swipe gesture",
      generate: (_, vol) => {
        const ctx = getAudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.type = "sine"
        osc.frequency.setValueAtTime(600, ctx.currentTime)
        osc.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.08)
        gain.gain.setValueAtTime(vol * 0.15, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
        osc.start()
        osc.stop(ctx.currentTime + 0.1)
      }
    },
  },

  ambient: {
    "ambient-1": {
      name: "Soft Hum",
      description: "Gentle background hum",
      generate: (_, vol) => {
        playTone({ frequency: 100, duration: 2, volume: vol * 0.08, type: "sine", fadeOut: false })
      }
    },
    "ambient-2": {
      name: "Tone",
      description: "Ambient tone",
      generate: (_, vol) => {
        playTone({ frequency: 220, duration: 1.5, volume: vol * 0.1, type: "sine", fadeOut: false })
      }
    },
    "ambient-3": {
      name: "Deep",
      description: "Deep ambient sound",
      generate: (_, vol) => {
        playTone({ frequency: 80, duration: 2, volume: vol * 0.1, type: "sine", fadeOut: false })
      }
    },
    "ambient-4": {
      name: "Warm",
      description: "Warm ambient tone",
      generate: (_, vol) => {
        playTone({ frequency: 165, duration: 1.5, volume: vol * 0.1, type: "triangle", fadeOut: false })
      }
    },
  },
}

/**
 * Play a generated sound by category and sound ID
 */
export function playGeneratedSound(categoryId: string, soundId: string, volume = 0.5): void {
  if (soundId === "none") return
  
  const category = GENERATED_SOUNDS[categoryId]
  if (!category) return
  
  const sound = category[soundId]
  if (!sound) return

  try {
    const ctx = getAudioContext()
    // Resume context if suspended (required for autoplay policy)
    if (ctx.state === "suspended") {
      ctx.resume()
    }
    sound.generate(ctx, volume)
  } catch (e) {
    console.warn("Failed to play sound:", e)
  }
}

/**
 * Test if audio is available
 */
export function isAudioAvailable(): boolean {
  try {
    return typeof AudioContext !== "undefined" || typeof (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext !== "undefined"
  } catch {
    return false
  }
}
