"use server"

// B15: AI Model Selection & Cost Transparency
// Backend abstract interface for AI providers with Anthropic implementation

export type AIProvider = "anthropic" | "openai" | "google" // Extensible for future

export type SpeedIndicator = "fast" | "medium" | "slow"
export type QualityIndicator = "good" | "great" | "best"

export interface AIModel {
  id: string
  name: string
  provider: AIProvider
  description: string
  speed: SpeedIndicator
  quality: QualityIndicator
  creditsPerGeneration: number // Base credits for a typical generation
  inputTokenCost: number // Cost per 1K input tokens in credits
  outputTokenCost: number // Cost per 1K output tokens in credits
  maxTokens: number
  isDefault?: boolean
  isAvailable: boolean
}

// Claude models (only provider currently shown to users)
export const AI_MODELS: AIModel[] = [
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    description: "Fast and efficient for simple tasks",
    speed: "fast",
    quality: "good",
    creditsPerGeneration: 2,
    inputTokenCost: 0.25,
    outputTokenCost: 1.25,
    maxTokens: 8192,
    isAvailable: true,
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    description: "Balanced performance and quality",
    speed: "medium",
    quality: "great",
    creditsPerGeneration: 5,
    inputTokenCost: 3,
    outputTokenCost: 15,
    maxTokens: 8192,
    isDefault: true,
    isAvailable: true,
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    provider: "anthropic",
    description: "Highest quality for complex tasks",
    speed: "slow",
    quality: "best",
    creditsPerGeneration: 15,
    inputTokenCost: 15,
    outputTokenCost: 75,
    maxTokens: 8192,
    isAvailable: true,
  },
]

// Stub interfaces for future providers (not shown to users yet)
const OPENAI_MODELS: AIModel[] = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "openai",
    description: "Fast and affordable",
    speed: "fast",
    quality: "good",
    creditsPerGeneration: 2,
    inputTokenCost: 0.15,
    outputTokenCost: 0.6,
    maxTokens: 16384,
    isAvailable: false, // Not enabled
  },
]

const GOOGLE_MODELS: AIModel[] = [
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "google",
    description: "Google's multimodal model",
    speed: "medium",
    quality: "great",
    creditsPerGeneration: 4,
    inputTokenCost: 0.5,
    outputTokenCost: 1.5,
    maxTokens: 32768,
    isAvailable: false, // Not enabled
  },
]

// Provider interface methods
export function getAvailableModels(provider?: AIProvider): AIModel[] {
  let models = AI_MODELS.filter(m => m.isAvailable)
  
  if (provider) {
    models = models.filter(m => m.provider === provider)
  }
  
  return models
}

export function getDefaultModel(): AIModel {
  return AI_MODELS.find(m => m.isDefault) || AI_MODELS[0]
}

export function getModelById(id: string): AIModel | undefined {
  return [...AI_MODELS, ...OPENAI_MODELS, ...GOOGLE_MODELS].find(m => m.id === id)
}

export function estimateCost(
  modelId: string,
  estimatedInputTokens: number = 1000,
  estimatedOutputTokens: number = 2000
): number {
  const model = getModelById(modelId)
  if (!model) return 0
  
  // Calculate based on token costs
  const inputCost = (estimatedInputTokens / 1000) * model.inputTokenCost
  const outputCost = (estimatedOutputTokens / 1000) * model.outputTokenCost
  
  // Use the higher of: base credits or calculated token cost
  return Math.max(model.creditsPerGeneration, Math.ceil(inputCost + outputCost))
}

// Task-based cost estimation (what users typically see)
export type GenerationTask = 
  | "archetype" 
  | "journey" 
  | "stage" 
  | "touchpoint" 
  | "solution" 
  | "template"
  | "enrich"
  | "suggest"

const TASK_TOKEN_ESTIMATES: Record<GenerationTask, { input: number; output: number }> = {
  archetype: { input: 500, output: 1500 },
  journey: { input: 1000, output: 4000 },
  stage: { input: 300, output: 800 },
  touchpoint: { input: 200, output: 500 },
  solution: { input: 600, output: 1200 },
  template: { input: 800, output: 3000 },
  enrich: { input: 1000, output: 2000 },
  suggest: { input: 400, output: 1000 },
}

export function estimateTaskCost(modelId: string, task: GenerationTask): number {
  const estimate = TASK_TOKEN_ESTIMATES[task]
  return estimateCost(modelId, estimate.input, estimate.output)
}

// Speed and quality labels for UI
export function getSpeedLabel(speed: SpeedIndicator): string {
  switch (speed) {
    case "fast": return "Fast (~5s)"
    case "medium": return "Medium (~15s)"
    case "slow": return "Slower (~30s)"
  }
}

export function getQualityLabel(quality: QualityIndicator): string {
  switch (quality) {
    case "good": return "Good"
    case "great": return "Great"
    case "best": return "Best"
  }
}
