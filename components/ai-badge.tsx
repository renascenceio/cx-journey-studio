"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Sparkles } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface AIBadgeProps {
  /** Whether the badge should be shown (can be overridden by privileged domain) */
  show?: boolean
  /** Size variant */
  size?: "sm" | "md"
  /** Additional class names */
  className?: string
  /** Whether this is for a PRO user who can toggle the badge (B8) */
  canToggle?: boolean
  /** Current toggle state for PRO users */
  isHidden?: boolean
  /** Callback when PRO user toggles badge visibility */
  onToggle?: (hidden: boolean) => void
}

/**
 * AI Badge component that displays "AI Generated" indicator
 * - Respects privileged domain settings (B7)
 * - Can be toggled by PRO users (B8)
 */
export function AIBadge({
  show = true,
  size = "sm",
  className,
  canToggle = false,
  isHidden = false,
  onToggle,
}: AIBadgeProps) {
  const t = useTranslations("ai")

  // Don't render if explicitly hidden or if badge shouldn't show
  if (!show || isHidden) {
    return null
  }

  const badge = (
    <Badge
      variant="secondary"
      className={cn(
        "gap-1 font-normal",
        size === "sm" && "text-[9px] px-1.5 py-0.5",
        size === "md" && "text-[10px] px-2 py-0.5",
        "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
        canToggle && "cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-900/50",
        className
      )}
      onClick={canToggle && onToggle ? () => onToggle(true) : undefined}
    >
      <Sparkles className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {t("generatedBadge")}
    </Badge>
  )

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent side="top" className="text-xs">
          <p>{t("generatedBadgeTooltip")}</p>
          {canToggle && (
            <p className="text-muted-foreground mt-1">{t("hideBadge")}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Hook to check if AI badge should be shown for a user
 * Uses privileged domain check
 */
export function useAIBadgeVisibility(
  userEmail: string | null | undefined,
  assetBadgeOverride?: boolean
): boolean {
  // Per-asset override takes precedence (PRO feature B8)
  if (assetBadgeOverride === false) {
    return false
  }

  // For client-side check, we use a simple domain check
  // The server-side shouldShowAIBadge function handles the full check
  if (!userEmail) return true

  const domain = userEmail.split("@")[1]?.toLowerCase()
  if (!domain) return true

  // Client-side privileged domain check
  const PRIVILEGED_DOMAINS = ["renascence.io", "renascence.ae", "renascence.com"]
  const isPrivileged = PRIVILEGED_DOMAINS.some(pd => domain === pd || domain.endsWith(`.${pd}`))

  return !isPrivileged
}

/**
 * Wrapper component that conditionally renders AI badge based on user permissions
 */
export function ConditionalAIBadge({
  userEmail,
  assetBadgeOverride,
  ...props
}: AIBadgeProps & {
  userEmail: string | null | undefined
  assetBadgeOverride?: boolean
}) {
  const shouldShow = useAIBadgeVisibility(userEmail, assetBadgeOverride)

  if (!shouldShow) {
    return null
  }

  return <AIBadge {...props} />
}
