"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { 
  Fingerprint, 
  GitFork, 
  Sparkles, 
  Upload, 
  LayoutTemplate, 
  Copy, 
  Shield,
  User,
  Calendar,
  Hash
} from "lucide-react"
import type { AssetLineage } from "@/lib/asset-lineage"

interface AssetLineageBadgeProps {
  lineage: AssetLineage
  /** Size variant */
  size?: "sm" | "md"
  /** Whether to show full details or just badge */
  showDetails?: boolean
  /** Additional class names */
  className?: string
}

const sourceIcons: Record<AssetLineage["source_type"], typeof Sparkles> = {
  original: Fingerprint,
  ai_generated: Sparkles,
  imported: Upload,
  template: LayoutTemplate,
  duplicated: Copy,
}

const sourceColors: Record<AssetLineage["source_type"], string> = {
  original: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  ai_generated: "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-800",
  imported: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800",
  template: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
  duplicated: "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-800",
}

/**
 * Badge showing asset source type and lineage info
 * Part of the Asset Immutable ID & IP Tracking system (B3)
 */
export function AssetLineageBadge({
  lineage,
  size = "sm",
  showDetails = false,
  className,
}: AssetLineageBadgeProps) {
  const t = useTranslations("assetLineage")
  const SourceIcon = sourceIcons[lineage.source_type]

  const badge = (
    <Badge
      variant="outline"
      className={cn(
        "gap-1 font-normal cursor-pointer",
        size === "sm" && "text-[9px] px-1.5 py-0.5",
        size === "md" && "text-[10px] px-2 py-0.5",
        sourceColors[lineage.source_type],
        className
      )}
    >
      <SourceIcon className={cn(size === "sm" ? "h-2.5 w-2.5" : "h-3 w-3")} />
      {t(lineage.source_type === "ai_generated" ? "aiGenerated" : 
         lineage.source_type === "template" ? "fromTemplate" : 
         lineage.source_type)}
      {lineage.lineage_depth > 0 && (
        <span className="opacity-60">
          <GitFork className="h-2 w-2 inline ml-0.5" />
          {lineage.lineage_depth}
        </span>
      )}
    </Badge>
  )

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{badge}</TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            <p>{t("createdBy", { name: lineage.original_creator_email || "Unknown" })}</p>
            {lineage.lineage_depth > 0 && (
              <p className="text-muted-foreground">{t("derivationDepth", { depth: lineage.lineage_depth })}</p>
            )}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{badge}</PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-primary" />
              {t("lineageInfo")}
            </h4>
            <Badge variant="secondary" className="text-[9px]">
              {t("ipProtected")}
            </Badge>
          </div>

          <div className="space-y-2 text-xs">
            {/* Original Creator */}
            <div className="flex items-start gap-2">
              <User className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("originalCreator")}</p>
                <p className="font-medium">{lineage.original_creator_email || lineage.original_creator_id}</p>
              </div>
            </div>

            {/* Source Type */}
            <div className="flex items-start gap-2">
              <SourceIcon className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("sourceType")}</p>
                <p className="font-medium">{t(lineage.source_type === "ai_generated" ? "aiGenerated" : 
                   lineage.source_type === "template" ? "fromTemplate" : 
                   lineage.source_type)}</p>
              </div>
            </div>

            {/* Created Date */}
            <div className="flex items-start gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("createdOn", { date: "" })}</p>
                <p className="font-medium">{new Date(lineage.original_created_at).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Content UUID */}
            <div className="flex items-start gap-2">
              <Hash className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-muted-foreground">{t("contentId")}</p>
                <p className="font-mono text-[10px] text-muted-foreground">{lineage.content_uuid.slice(0, 8)}...</p>
              </div>
            </div>

            {/* Derivation Info */}
            {lineage.lineage_depth > 0 && (
              <div className="flex items-start gap-2 pt-1 border-t border-border">
                <GitFork className="h-3.5 w-3.5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-muted-foreground">{t("derivative")}</p>
                  <p className="font-medium">{t("derivationDepth", { depth: lineage.lineage_depth })}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/**
 * Compact inline display of asset provenance
 */
export function AssetProvenance({
  lineage,
  className,
}: {
  lineage: AssetLineage
  className?: string
}) {
  const t = useTranslations("assetLineage")

  return (
    <div className={cn("flex items-center gap-1.5 text-[10px] text-muted-foreground", className)}>
      <Shield className="h-3 w-3" />
      <span>{t("createdBy", { name: lineage.original_creator_email || "Unknown" })}</span>
      {lineage.lineage_depth > 0 && (
        <>
          <span className="text-border">•</span>
          <GitFork className="h-2.5 w-2.5" />
          <span>{t("derivationDepth", { depth: lineage.lineage_depth })}</span>
        </>
      )}
    </div>
  )
}
