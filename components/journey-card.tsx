"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MiniEmotionalArc } from "@/components/mini-emotional-arc"
import { getEmotionalArc, getAllTouchPoints, opportunities } from "@/lib/data-utils"
import type { Journey, JourneyViewMode } from "@/lib/types"
import { Activity, Eye, EyeOff, ExternalLink, GitBranch, Layers, Users, Lightbulb, ThumbsUp, Globe } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

const typeColors: Record<Journey["type"], string> = {
  current: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  future: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  template: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  deployed: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
}

const statusLabels: Record<Journey["status"], string> = {
  draft: "Draft",
  in_progress: "In Progress",
  review: "In Review",
  approved: "Approved",
  deployed: "Deployed",
  archived: "Archived",
}

const categoryLabels: Record<string, string> = {
  airlines: "Airlines",
  automotive: "Automotive",
  banking: "Banking",
  "e-commerce": "E-Commerce",
  education: "Education",
  fintech: "Fintech",
  fitness: "Fitness & Wellness",
  government: "Government",
  grocery: "Grocery",
  healthcare: "Healthcare",
  hospitality: "Hospitality",
  insurance: "Insurance",
  logistics: "Logistics",
  luxury: "Luxury Goods",
  media: "Media & Entertainment",
  pharma: "Pharmaceuticals",
  property_management: "Property Management",
  real_estate: "Real Estate",
  retail: "Retail",
  saas: "SaaS",
  telecommunications: "Telecom",
  travel: "Travel & Tourism",
  utilities: "Utilities",
  wealth_management: "Wealth Management",
}

import { getInitials } from "@/lib/utils"

interface JourneyCardProps {
  journey: Journey
  variant?: JourneyViewMode
  onPeek?: (journey: Journey) => void
}

export function JourneyCard({ journey, variant = "comprehensive", onPeek }: JourneyCardProps) {
  const emotionalArc = getEmotionalArc(journey)
  const touchPointCount = getAllTouchPoints(journey).length
  const stepCount = journey.stages.reduce((sum, s) => sum + s.steps.length, 0)
  const solutionsCount = (journey.type === "future" || journey.type === "deployed") ? opportunities.length : 0
  const updatedAt = new Date(journey.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
  const collabAvatars = journey.collaborators
    .slice(0, 3)
    .map((c) => ({ name: c.name || c.email || "Unknown", id: c.id || c.userId }))
    .filter(Boolean)

  const journeyHref = `/journeys/${journey.id}`

  // -- Simple variant: compact horizontal row --
  if (variant === "simple") {
    return (
      <div className="group flex items-center gap-4 rounded-lg border border-border/60 bg-card px-4 py-3 transition-colors hover:border-primary/30 hover:bg-accent/30">
        <div className="flex flex-1 items-center gap-3 min-w-0">
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] font-medium ${typeColors[journey.type]}`}
          >
            {journey.type.charAt(0).toUpperCase() + journey.type.slice(1)}
          </Badge>
          {journey.category && (
            <Badge variant="secondary" className="shrink-0 text-[10px] font-normal">
              {categoryLabels[journey.category] || journey.category}
            </Badge>
          )}
          <Link href={journeyHref} className="truncate text-sm font-medium text-foreground hover:text-primary transition-colors hover:underline">
            {journey.title}
          </Link>
          <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
            {statusLabels[journey.status]}
          </span>
        </div>
        <div className="hidden items-center gap-4 text-[11px] text-muted-foreground md:flex">
          <span>{journey.stages.length} stages</span>
          <span>{stepCount} steps</span>
          <span>{touchPointCount} tp</span>
          {solutionsCount > 0 && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Lightbulb className="h-3 w-3" />
              {solutionsCount}
            </span>
          )}
        </div>
        {/* JDS-043: Public/Upvote indicators */}
        <div className="hidden items-center gap-2 md:flex">
          {journey.is_public && (
            <span className="flex items-center gap-1 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 dark:bg-green-900/20 dark:text-green-300">
              <Globe className="h-2.5 w-2.5" />
              Public
            </span>
          )}
          {(journey.upvotes ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ThumbsUp className="h-3 w-3" />
              {journey.upvotes}
            </span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-muted-foreground">{updatedAt}</span>

        {/* Action buttons */}
        <div className="flex items-center gap-0.5 shrink-0">
          {onPeek && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => onPeek(journey)}
                    aria-label="Quick view"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Quick view</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 transition-opacity group-hover:opacity-100" asChild>
                  <Link href={journeyHref} aria-label="Open journey">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">Open journey</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {journey.type === "deployed" && journey.healthStatus && (
          <div className={`h-2 w-2 shrink-0 rounded-full ${
            journey.healthStatus === "healthy" ? "bg-green-500" :
            journey.healthStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
          }`} />
        )}
      </div>
    )
  }

  // -- Comprehensive variant: full card --
  return (
    <Card className="group h-full border-border/60 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
      <CardContent className="flex flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <Link
              href={journeyHref}
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors hover:underline line-clamp-1"
            >
              {journey.title}
            </Link>
            <div className="mt-1.5 flex items-center gap-2 flex-wrap">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${typeColors[journey.type]}`}
              >
                {journey.type.charAt(0).toUpperCase() + journey.type.slice(1)}
              </Badge>
              {journey.category && (
                <Badge variant="secondary" className="text-[10px] font-normal">
                  {categoryLabels[journey.category] || journey.category}
                </Badge>
              )}
              <span className="text-[11px] text-muted-foreground">
                {statusLabels[journey.status]}
              </span>
            </div>
          </div>
          {journey.type === "deployed" && journey.healthStatus && (
            <div className={`flex h-2 w-2 rounded-full shrink-0 mt-1.5 ${
              journey.healthStatus === "healthy" ? "bg-green-500" :
              journey.healthStatus === "warning" ? "bg-yellow-500" : "bg-red-500"
            }`} />
          )}
        </div>

        {/* Description */}
        {journey.description && (
          <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
            {journey.description}
          </p>
        )}

        {/* Mini emotional arc */}
        <div className="flex items-center justify-center py-1">
          <MiniEmotionalArc data={emotionalArc} width={200} height={40} />
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1">
            <Layers className="h-3 w-3" />
            {journey.stages.length} stages
          </span>
          <span className="flex items-center gap-1">
            <GitBranch className="h-3 w-3" />
            {stepCount} steps
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3" />
            {touchPointCount} tp
          </span>
          {solutionsCount > 0 && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Lightbulb className="h-3 w-3" />
              {solutionsCount} solutions
            </span>
          )}
          {/* JDS-043: Public + Upvotes */}
          {journey.is_public && (
            <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
              <Globe className="h-3 w-3" />
              Public
            </span>
          )}
          {(journey.upvotes ?? 0) > 0 && (
            <span className="flex items-center gap-1">
              <ThumbsUp className="h-3 w-3" />
              {journey.upvotes}
            </span>
          )}
        </div>

        {/* Footer: collaborators, date, and action buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1.5">
              {collabAvatars.map((user) => (
                <Avatar key={user.id} className="h-5 w-5 border border-background">
                  <AvatarFallback className="bg-primary/10 text-[8px] font-medium text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
              ))}
            </div>
            {journey.collaborators.length > 3 && (
              <span className="text-[10px] text-muted-foreground">
                +{journey.collaborators.length - 3}
              </span>
            )}
            {journey.collaborators.length === 0 && (
              <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                No team
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <span className="text-[11px] text-muted-foreground mr-1">
              {updatedAt}
            </span>
            {onPeek && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onPeek(journey)}
                      aria-label="Quick view"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">Quick view</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <Link href={journeyHref} aria-label="Open journey">
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">Open journey</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
