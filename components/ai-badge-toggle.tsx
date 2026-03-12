"use client"

import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Crown, Lock } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface AIBadgeToggleProps {
  /** Current visibility state */
  isHidden: boolean
  /** Callback when toggle changes */
  onChange: (hidden: boolean) => void
  /** Whether user has PRO plan to use this feature */
  isPro?: boolean
  /** Whether the asset is AI generated (only show toggle for AI content) */
  isAiGenerated?: boolean
  /** Size variant */
  size?: "sm" | "md"
  /** Additional class names */
  className?: string
}

/**
 * Toggle component for PRO users to hide/show AI badge on assets
 * Feature B8 - PRO Feature AI Badge Removal
 */
export function AIBadgeToggle({
  isHidden,
  onChange,
  isPro = false,
  isAiGenerated = true,
  size = "sm",
  className,
}: AIBadgeToggleProps) {
  const t = useTranslations("ai")

  // Only show toggle for AI-generated content
  if (!isAiGenerated) {
    return null
  }

  // Non-PRO users see locked state
  if (!isPro) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-2 opacity-60 cursor-not-allowed",
                size === "sm" && "text-xs",
                size === "md" && "text-sm",
                className
              )}
            >
              <Lock className={cn(size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
              <span className="text-muted-foreground">{t("hideBadge")}</span>
              <Badge variant="outline" className="text-[9px] gap-0.5 px-1.5 py-0 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800">
                <Crown className="h-2.5 w-2.5" />
                PRO
              </Badge>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs max-w-[200px]">
            <p>Upgrade to PRO to hide AI badges from your assets</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3",
        size === "sm" && "text-xs",
        size === "md" && "text-sm",
        className
      )}
    >
      <div className="flex items-center gap-2">
        <Sparkles className={cn(
          "text-violet-500",
          size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
        )} />
        <Label
          htmlFor="ai-badge-toggle"
          className={cn(
            "cursor-pointer",
            size === "sm" && "text-xs",
            size === "md" && "text-sm"
          )}
        >
          {isHidden ? t("showBadge") : t("hideBadge")}
        </Label>
      </div>
      <Switch
        id="ai-badge-toggle"
        checked={!isHidden}
        onCheckedChange={(checked) => onChange(!checked)}
        className="scale-75"
      />
      {isHidden && (
        <span className="text-muted-foreground text-[10px]">
          {t("badgeHidden")}
        </span>
      )}
    </div>
  )
}

/**
 * Inline AI badge with toggle capability for PRO users
 */
export function AIBadgeWithToggle({
  isAiGenerated,
  isHidden,
  isPro,
  onToggle,
  size = "sm",
  className,
}: {
  isAiGenerated?: boolean
  isHidden?: boolean
  isPro?: boolean
  onToggle?: (hidden: boolean) => void
  size?: "sm" | "md"
  className?: string
}) {
  const t = useTranslations("ai")
  const [localHidden, setLocalHidden] = useState(isHidden ?? false)

  // Not AI generated, don't show anything
  if (!isAiGenerated) {
    return null
  }

  // Hidden state
  if (localHidden || isHidden) {
    if (isPro && onToggle) {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setLocalHidden(false)
                  onToggle(false)
                }}
                className={cn(
                  "text-muted-foreground hover:text-foreground transition-colors",
                  size === "sm" && "text-[9px]",
                  size === "md" && "text-[10px]",
                  className
                )}
              >
                <Sparkles className={cn(
                  "opacity-30 hover:opacity-60",
                  size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"
                )} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="text-xs">
              {t("showBadge")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
    return null
  }

  // Visible state
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className={cn(
              "gap-1 font-normal",
              size === "sm" && "text-[9px] px-1.5 py-0.5",
              size === "md" && "text-[10px] px-2 py-0.5",
              "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
              isPro && onToggle && "cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50",
              className
            )}
            onClick={isPro && onToggle ? () => {
              setLocalHidden(true)
              onToggle(true)
            } : undefined}
          >
            <Sparkles className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
            {t("generatedBadge")}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{t("generatedBadgeTooltip")}</p>
          {isPro && onToggle && (
            <p className="text-muted-foreground mt-1">{t("hideBadge")}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
