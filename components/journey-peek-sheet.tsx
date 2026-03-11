"use client"

import Link from "next/link"
import {
  ChevronRight,
  ArrowRight,
  Rocket,
  Copy,
  Layers,
  GitBranch,
  Activity,
  Lightbulb,
  Info,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { MiniEmotionalArc } from "@/components/mini-emotional-arc"
import { getEmotionalArc, getAllTouchPoints, opportunities } from "@/lib/data-utils"
import type { Journey } from "@/lib/types"
import { toast } from "sonner"
import { updateJourneyStatus } from "@/lib/actions/data"
import { mutate } from "swr"
import { useState } from "react"

const typeColors: Record<Journey["type"], string> = {
  current:
    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  future:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  template:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  deployed:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
}

const statusLabels: Record<Journey["status"], string> = {
  draft: "Draft",
  in_progress: "In Progress",
  review: "In Review",
  approved: "Approved",
  deployed: "Deployed",
  archived: "Archived",
}

interface JourneyPeekSheetProps {
  journey: Journey | null
  open: boolean
  onClose: () => void
}

export function JourneyPeekSheet({
  journey,
  open,
  onClose,
}: JourneyPeekSheetProps) {
  const [promoting, setPromoting] = useState(false)
  const [deploying, setDeploying] = useState(false)

  if (!journey) return null

  const emotionalArc = getEmotionalArc(journey)
  const touchPointCount = getAllTouchPoints(journey).length
  const stepCount = journey.stages.reduce((sum, s) => sum + s.steps.length, 0)
  const painPointCount = getAllTouchPoints(journey).reduce(
    (s, tp) => s + tp.painPoints.length,
    0
  )
  const solutionsCount =
    journey.type === "future" || journey.type === "deployed"
      ? opportunities.length
      : 0
  const avgScore =
    touchPointCount > 0
      ? getAllTouchPoints(journey).reduce(
          (s, tp) => s + tp.emotionalScore,
          0
        ) / touchPointCount
      : 0

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border px-5 pb-4 pt-6">
          <SheetHeader className="space-y-1 text-left">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-[10px] font-medium ${typeColors[journey.type]}`}
              >
                {journey.type.charAt(0).toUpperCase() + journey.type.slice(1)}
              </Badge>
              <span className="text-[11px] text-muted-foreground">
                {statusLabels[journey.status]}
              </span>
              {journey.type === "deployed" && journey.healthStatus && (
                <div
                  className={`ml-auto h-2 w-2 rounded-full ${
                    journey.healthStatus === "healthy"
                      ? "bg-green-500"
                      : journey.healthStatus === "warning"
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                />
              )}
            </div>
            <SheetTitle className="text-base leading-tight">
              {journey.title}
            </SheetTitle>
            {journey.description && (
              <SheetDescription className="text-xs leading-relaxed">
                {journey.description}
              </SheetDescription>
            )}
          </SheetHeader>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: "Stages", value: journey.stages.length, icon: Layers },
              { label: "Steps", value: stepCount, icon: GitBranch },
              { label: "Touch Pts", value: touchPointCount, icon: Activity },
              ...(solutionsCount > 0
                ? [
                    {
                      label: "Solutions",
                      value: solutionsCount,
                      icon: Lightbulb,
                    },
                  ]
                : [
                    {
                      label: "Pain Pts",
                      value: painPointCount,
                      icon: Info,
                    },
                  ]),
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 px-2 py-2"
              >
                <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-sm font-bold text-foreground">
                  {stat.value}
                </span>
                <span className="text-[9px] text-muted-foreground">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emotional arc */}
        <div className="flex flex-col gap-2 border-b border-border px-5 py-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Emotional Arc
            </h4>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                </TooltipTrigger>
                <TooltipContent className="max-w-52 text-xs">
                  Average emotional score per stage (-5 to +5).
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="flex justify-center rounded-lg border border-border/60 bg-muted/20 p-3">
            <MiniEmotionalArc data={emotionalArc} width={320} height={50} />
          </div>
          <div className="flex items-center justify-between px-2">
            {emotionalArc.map((point) => (
              <span key={point.stageName} className="text-center">
                <span
                  className={`block text-[10px] font-mono font-bold ${point.score >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                >
                  {point.score > 0 ? "+" : ""}
                  {point.score}
                </span>
                <span className="block text-[8px] text-muted-foreground">
                  {point.stageName}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* Stage / Step tree */}
        <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-5 py-4">
          <h4 className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Journey Structure
          </h4>
          <div className="flex flex-col gap-1">
            {journey.stages.map((stage, si) => (
              <div key={stage.id} className="flex flex-col">
                <div className="flex items-center gap-2 rounded-md bg-accent/50 px-3 py-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {si + 1}
                  </span>
                  <span className="text-xs font-semibold text-foreground">
                    {stage.name}
                  </span>
                  <span className="ml-auto text-[10px] text-muted-foreground">
                    {stage.steps.length} steps
                  </span>
                </div>
                <div className="ml-5 flex flex-col border-l border-border/40">
                  {stage.steps.map((step) => (
                    <div
                      key={step.id}
                      className="flex items-center gap-2 py-1.5 pl-4"
                    >
                      <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/40" />
                      <span className="text-[11px] text-muted-foreground">
                        {step.name}
                      </span>
                      <span className="ml-auto text-[9px] text-muted-foreground/50">
                        {step.touchPoints.length} tp
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 border-t border-border px-5 py-4">
          <Button asChild className="w-full gap-2">
            <Link href={`/journeys/${journey.id}`} onClick={onClose}>
              Open Full Journey
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex gap-2">
            {journey.type === "current" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                disabled={promoting}
                onClick={async () => {
                  setPromoting(true)
                  try {
                    await updateJourneyStatus(journey.id, "draft", "future")
                    mutate((key: unknown) => typeof key === "string" && key.includes("/api/journeys"))
                    toast.success(
                      `"${journey.title}" promoted to Future Journey`,
                      {
                        action: {
                          label: "View Promoted Journey",
                          onClick: () => { window.location.href = `/journeys/${journey.id}` },
                        },
                      }
                    )
                    onClose()
                  } catch {
                    toast.error("Failed to promote journey. Please try again.")
                  } finally {
                    setPromoting(false)
                  }
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                {promoting ? "Promoting..." : "Promote to Future"}
              </Button>
            )}
            {journey.type === "future" && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                disabled={deploying}
                onClick={async () => {
                  setDeploying(true)
                  try {
                    await updateJourneyStatus(journey.id, "deployed")
                    mutate((key: unknown) => typeof key === "string" && key.includes("/api/journeys"))
                    toast.success(
                      `"${journey.title}" deployed successfully`,
                      {
                        action: {
                          label: "View Deployed Journey",
                          onClick: () => { window.location.href = `/journeys/${journey.id}` },
                        },
                      }
                    )
                    onClose()
                  } catch {
                    toast.error("Failed to deploy journey. Please try again.")
                  } finally {
                    setDeploying(false)
                  }
                }}
              >
                <Rocket className="h-3.5 w-3.5" />
                {deploying ? "Deploying..." : "Deploy Journey"}
              </Button>
            )}
            {(journey.type === "current" || journey.type === "future") && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => {
                  toast.success(`"${journey.title}" saved as template`)
                  onClose()
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Save as Template
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
