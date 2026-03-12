"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Zap, Sparkles, Crown, Clock, Star, Coins } from "lucide-react"
import { cn } from "@/lib/utils"

// B15: AI Model Selection & Cost Transparency

export type SpeedIndicator = "fast" | "medium" | "slow"
export type QualityIndicator = "good" | "great" | "best"

export interface AIModel {
  id: string
  name: string
  description: string
  speed: SpeedIndicator
  quality: QualityIndicator
  creditsPerGeneration: number
  isDefault?: boolean
}

// Client-side model list (synced with server lib/ai-models.ts)
const AI_MODELS: AIModel[] = [
  {
    id: "claude-haiku-4.5",
    name: "Claude Haiku 4.5",
    description: "Fast and efficient for simple tasks",
    speed: "fast",
    quality: "good",
    creditsPerGeneration: 2,
  },
  {
    id: "claude-sonnet-4.5",
    name: "Claude Sonnet 4.5",
    description: "Balanced performance and quality",
    speed: "medium",
    quality: "great",
    creditsPerGeneration: 5,
    isDefault: true,
  },
  {
    id: "claude-opus-4.6",
    name: "Claude Opus 4.6",
    description: "Highest quality for complex tasks",
    speed: "slow",
    quality: "best",
    creditsPerGeneration: 15,
  },
]

interface AIModelSelectorProps {
  value?: string
  onChange?: (modelId: string) => void
  taskType?: string
  showCostEstimate?: boolean
  className?: string
  compact?: boolean
}

export function AIModelSelector({
  value,
  onChange,
  taskType,
  showCostEstimate = true,
  className,
  compact = false,
}: AIModelSelectorProps) {
  const t = useTranslations()
  const [selectedModel, setSelectedModel] = useState<string>(
    value || AI_MODELS.find(m => m.isDefault)?.id || AI_MODELS[0].id
  )

  useEffect(() => {
    if (value) setSelectedModel(value)
  }, [value])

  const handleChange = (modelId: string) => {
    setSelectedModel(modelId)
    onChange?.(modelId)
  }

  const model = AI_MODELS.find(m => m.id === selectedModel)

  const getSpeedIcon = (speed: SpeedIndicator) => {
    switch (speed) {
      case "fast": return <Zap className="h-3 w-3 text-green-500" />
      case "medium": return <Clock className="h-3 w-3 text-amber-500" />
      case "slow": return <Clock className="h-3 w-3 text-orange-500" />
    }
  }

  const getQualityIcon = (quality: QualityIndicator) => {
    switch (quality) {
      case "good": return <Star className="h-3 w-3 text-muted-foreground" />
      case "great": return <Sparkles className="h-3 w-3 text-blue-500" />
      case "best": return <Crown className="h-3 w-3 text-amber-500" />
    }
  }

  const getSpeedLabel = (speed: SpeedIndicator) => {
    switch (speed) {
      case "fast": return t("aiModel.speedFast")
      case "medium": return t("aiModel.speedMedium")
      case "slow": return t("aiModel.speedSlow")
    }
  }

  const getQualityLabel = (quality: QualityIndicator) => {
    switch (quality) {
      case "good": return t("aiModel.qualityGood")
      case "great": return t("aiModel.qualityGreat")
      case "best": return t("aiModel.qualityBest")
    }
  }

  if (compact) {
    return (
      <Select value={selectedModel} onValueChange={handleChange}>
        <SelectTrigger className={cn("w-[180px] h-8 text-xs", className)}>
          <SelectValue placeholder={t("aiModel.selectModel")} />
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((m) => (
            <SelectItem key={m.id} value={m.id} className="text-xs">
              <div className="flex items-center gap-2">
                {getQualityIcon(m.quality)}
                <span>{m.name}</span>
                <span className="text-muted-foreground">~{m.creditsPerGeneration}cr</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{t("aiModel.selectModel")}</Label>
      <Select value={selectedModel} onValueChange={handleChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("aiModel.selectModel")} />
        </SelectTrigger>
        <SelectContent>
          {AI_MODELS.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    {getQualityIcon(m.quality)}
                    <span className="font-medium">{m.name}</span>
                    {m.isDefault && (
                      <Badge variant="secondary" className="text-[10px] h-4">
                        {t("aiModel.recommended")}
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{m.description}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {model && showCostEstimate && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  {getSpeedIcon(model.speed)}
                  <span>{getSpeedLabel(model.speed)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("aiModel.speedTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  {getQualityIcon(model.quality)}
                  <span>{getQualityLabel(model.quality)}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("aiModel.qualityTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1">
                  <Coins className="h-3 w-3 text-amber-500" />
                  <span>~{model.creditsPerGeneration} {t("aiModel.credits")}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("aiModel.costTooltip")}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}
    </div>
  )
}

// Hook to manage AI model selection state
export function useAIModel(defaultModel?: string) {
  const [modelId, setModelId] = useState<string>(
    defaultModel || AI_MODELS.find(m => m.isDefault)?.id || AI_MODELS[0].id
  )

  const model = AI_MODELS.find(m => m.id === modelId)
  const estimatedCredits = model?.creditsPerGeneration || 5

  return {
    modelId,
    setModelId,
    model,
    estimatedCredits,
    models: AI_MODELS,
  }
}

// Cost confirmation component
interface CostConfirmationProps {
  modelName: string
  estimatedCredits: number
  userCredits?: number
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}

export function CostConfirmation({
  modelName,
  estimatedCredits,
  userCredits,
  onConfirm,
  onCancel,
  isLoading,
}: CostConfirmationProps) {
  const t = useTranslations()
  const hasEnoughCredits = userCredits === undefined || userCredits >= estimatedCredits

  return (
    <div className="flex flex-col gap-3 p-4 rounded-lg bg-muted/50 border">
      <div className="flex items-center gap-2 text-sm">
        <Coins className="h-4 w-4 text-amber-500" />
        <span>
          {t("aiModel.costConfirmation", { credits: estimatedCredits, model: modelName })}
        </span>
      </div>
      
      {userCredits !== undefined && (
        <div className="text-xs text-muted-foreground">
          {t("aiModel.yourBalance")}: <span className={cn(
            "font-medium",
            hasEnoughCredits ? "text-green-600" : "text-destructive"
          )}>{userCredits} {t("aiModel.credits")}</span>
        </div>
      )}

      {!hasEnoughCredits && (
        <p className="text-xs text-destructive">
          {t("aiModel.insufficientCredits")}
        </p>
      )}
    </div>
  )
}
