"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Target, Clock, CheckCircle2, PauseCircle, AlertCircle,
  Zap, Trophy, Clock4, XCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Initiative {
  id: string
  title: string
  description: string
  priority: number
  status: "planned" | "in_progress" | "completed" | "on_hold" | "pending_approval"
  journey_id: string | null
  solution_id: string | null
  journeys: { id: string; title: string } | null
  solutions: { id: string; title: string } | null
  responsible: string
  impact_score?: number
  effort_score?: number
  start_date: string | null
  end_date: string | null
}

interface ImpactEffortMatrixProps {
  initiatives: Initiative[]
  onEdit: (initiative: Initiative) => void
  onUpdateScores?: (id: string, impact: number, effort: number) => Promise<void>
}

const statusConfig: Record<string, { color: string; bgColor: string; borderColor: string; icon: typeof Target }> = {
  planned: { color: "text-muted-foreground", bgColor: "bg-muted/80", borderColor: "border-muted-foreground/30", icon: Target },
  in_progress: { color: "text-primary", bgColor: "bg-primary/20", borderColor: "border-primary/50", icon: Clock },
  pending_approval: { color: "text-violet-600", bgColor: "bg-violet-100 dark:bg-violet-900/40", borderColor: "border-violet-400/50", icon: AlertCircle },
  completed: { color: "text-emerald-600", bgColor: "bg-emerald-100 dark:bg-emerald-900/40", borderColor: "border-emerald-400/50", icon: CheckCircle2 },
  on_hold: { color: "text-amber-600", bgColor: "bg-amber-100 dark:bg-amber-900/40", borderColor: "border-amber-400/50", icon: PauseCircle },
}

// Quadrants
const quadrants = [
  { 
    key: "quick-wins", 
    label: "Quick Wins", 
    description: "High impact, low effort - do first",
    icon: Zap,
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-50/50 dark:bg-emerald-900/10",
    position: "top-left"
  },
  { 
    key: "major-projects", 
    label: "Major Projects", 
    description: "High impact, high effort - plan carefully",
    icon: Trophy,
    color: "text-primary",
    bgColor: "bg-primary/5",
    position: "top-right"
  },
  { 
    key: "fill-ins", 
    label: "Fill-Ins", 
    description: "Low impact, low effort - do when time permits",
    icon: Clock4,
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-50/50 dark:bg-amber-900/10",
    position: "bottom-left"
  },
  { 
    key: "time-sinks", 
    label: "Time Sinks", 
    description: "Low impact, high effort - avoid or delegate",
    icon: XCircle,
    color: "text-red-600 dark:text-red-400",
    bgColor: "bg-red-50/50 dark:bg-red-900/10",
    position: "bottom-right"
  },
]

export function ImpactEffortMatrix({ initiatives, onEdit }: ImpactEffortMatrixProps) {
  // Calculate positions based on impact and effort scores
  // Default to middle (5,5) if no scores
  const positionedInitiatives = useMemo(() => {
    return initiatives.map(init => ({
      ...init,
      impact: init.impact_score ?? 5,
      effort: init.effort_score ?? 5,
    }))
  }, [initiatives])

  // Group into quadrants
  const grouped = useMemo(() => {
    const result: Record<string, typeof positionedInitiatives> = {
      "quick-wins": [],
      "major-projects": [],
      "fill-ins": [],
      "time-sinks": [],
    }

    positionedInitiatives.forEach(init => {
      const highImpact = init.impact >= 5
      const highEffort = init.effort >= 5

      if (highImpact && !highEffort) {
        result["quick-wins"].push(init)
      } else if (highImpact && highEffort) {
        result["major-projects"].push(init)
      } else if (!highImpact && !highEffort) {
        result["fill-ins"].push(init)
      } else {
        result["time-sinks"].push(init)
      }
    })

    return result
  }, [positionedInitiatives])

  return (
    <div className="space-y-4">
      {/* Matrix Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Y-axis label */}
        <div className="col-span-2 flex items-center justify-center pb-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">IMPACT</span>
            <span className="text-primary">High →</span>
          </div>
        </div>

        {quadrants.map((quadrant) => {
          const QuadrantIcon = quadrant.icon
          const items = grouped[quadrant.key] || []

          return (
            <Card 
              key={quadrant.key} 
              className={cn(
                "min-h-[200px] border-border/60 transition-all",
                quadrant.bgColor
              )}
            >
              <CardHeader className="pb-2 pt-3 px-3">
                <div className="flex items-center gap-2">
                  <QuadrantIcon className={cn("h-4 w-4", quadrant.color)} />
                  <CardTitle className={cn("text-sm font-semibold", quadrant.color)}>
                    {quadrant.label}
                  </CardTitle>
                  <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                    {items.length}
                  </Badge>
                </div>
                <CardDescription className="text-[10px]">{quadrant.description}</CardDescription>
              </CardHeader>
              <CardContent className="px-3 pb-3">
                <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                  {items.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground text-center py-4">
                      No initiatives in this quadrant
                    </p>
                  ) : (
                    items.map((initiative) => {
                      const config = statusConfig[initiative.status]
                      const StatusIcon = config.icon

                      return (
                        <TooltipProvider key={initiative.id}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                className={cn(
                                  "w-full flex items-center gap-2 p-2 rounded-md border text-left transition-all hover:shadow-sm",
                                  config.bgColor,
                                  config.borderColor
                                )}
                                onClick={() => onEdit(initiative)}
                              >
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-background/80 text-[10px] font-bold">
                                  {initiative.priority}
                                </span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium truncate">{initiative.title}</p>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <StatusIcon className={cn("h-3 w-3", config.color)} />
                                    <span className="text-[9px] text-muted-foreground">
                                      I:{initiative.impact} E:{initiative.effort}
                                    </span>
                                  </div>
                                </div>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                              <p className="font-medium">{initiative.title}</p>
                              {initiative.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {initiative.description}
                                </p>
                              )}
                              <div className="flex gap-3 mt-2 text-[10px]">
                                <span>Impact: <strong>{initiative.impact}/10</strong></span>
                                <span>Effort: <strong>{initiative.effort}/10</strong></span>
                              </div>
                              {initiative.responsible && (
                                <p className="text-[10px] text-muted-foreground mt-1">
                                  Responsible: {initiative.responsible}
                                </p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}

        {/* X-axis label */}
        <div className="col-span-2 flex items-center justify-center pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium">EFFORT</span>
            <span className="text-primary">High →</span>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-muted-foreground">
        <span className="font-medium">Priority Legend:</span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3 text-emerald-500" /> Quick Wins = Do First
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-3 w-3 text-primary" /> Major Projects = Plan Carefully
        </span>
        <span className="flex items-center gap-1">
          <Clock4 className="h-3 w-3 text-amber-500" /> Fill-Ins = When Time Permits
        </span>
        <span className="flex items-center gap-1">
          <XCircle className="h-3 w-3 text-red-500" /> Time Sinks = Avoid
        </span>
      </div>
    </div>
  )
}
