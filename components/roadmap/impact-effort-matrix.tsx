"use client"

import { useMemo, useState, useCallback, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Target, Clock, CheckCircle2, PauseCircle, AlertCircle,
  Zap, Trophy, Clock4, XCircle, ArrowUp, ArrowRight, GripVertical,
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

// Quadrant score mappings
const quadrantScores: Record<string, { impact: number; effort: number }> = {
  "quick-wins": { impact: 7, effort: 3 },      // High impact, low effort
  "major-projects": { impact: 7, effort: 7 },  // High impact, high effort
  "fill-ins": { impact: 3, effort: 3 },        // Low impact, low effort
  "time-sinks": { impact: 3, effort: 7 },      // Low impact, high effort
}

const statusConfig: Record<string, { color: string; dotColor: string; icon: typeof Target }> = {
  planned: { color: "text-slate-600 dark:text-slate-400", dotColor: "bg-slate-400", icon: Target },
  in_progress: { color: "text-blue-600 dark:text-blue-400", dotColor: "bg-blue-500", icon: Clock },
  pending_approval: { color: "text-violet-600 dark:text-violet-400", dotColor: "bg-violet-500", icon: AlertCircle },
  completed: { color: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500", icon: CheckCircle2 },
  on_hold: { color: "text-amber-600 dark:text-amber-400", dotColor: "bg-amber-500", icon: PauseCircle },
}

// Standard prioritization matrix layout:
// Y-axis: Impact (Low at bottom, High at top)
// X-axis: Effort (Low at left, High at right)
//
// | High Impact | Quick Wins      | Major Projects  |
// |             | (Low Effort)    | (High Effort)   |
// |-------------|-----------------|-----------------|
// | Low Impact  | Fill-Ins        | Time Sinks      |
// |             | (Low Effort)    | (High Effort)   |

const quadrantConfig = {
  "quick-wins": { 
    label: "Quick Wins", 
    subtitle: "High Impact, Low Effort",
    icon: Zap,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-950/40 dark:to-emerald-900/20",
    border: "border-emerald-200/60 dark:border-emerald-800/40",
    action: "Do First",
  },
  "major-projects": { 
    label: "Major Projects", 
    subtitle: "High Impact, High Effort",
    icon: Trophy,
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/40 dark:to-blue-900/20",
    border: "border-blue-200/60 dark:border-blue-800/40",
    action: "Plan Carefully",
  },
  "fill-ins": { 
    label: "Fill-Ins", 
    subtitle: "Low Impact, Low Effort",
    icon: Clock4,
    color: "text-slate-500 dark:text-slate-400",
    bg: "bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900/40 dark:to-slate-800/20",
    border: "border-slate-200/60 dark:border-slate-700/40",
    action: "Do Later",
  },
  "time-sinks": { 
    label: "Time Sinks", 
    subtitle: "Low Impact, High Effort",
    icon: XCircle,
    color: "text-red-500 dark:text-red-400",
    bg: "bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20",
    border: "border-red-200/60 dark:border-red-800/40",
    action: "Avoid",
  },
}

export function ImpactEffortMatrix({ initiatives, onEdit, onUpdateScores }: ImpactEffortMatrixProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverQuadrant, setDragOverQuadrant] = useState<string | null>(null)
  const dragIdRef = useRef<string | null>(null)

  // Drag handlers
  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    e.stopPropagation()
    setDraggedId(id)
    dragIdRef.current = id
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
    e.dataTransfer.setData("application/x-matrix-id", id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, quadrant: string) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDragOverQuadrant(quadrant)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    const relatedTarget = e.relatedTarget as HTMLElement
    if (!relatedTarget || !e.currentTarget.contains(relatedTarget)) {
      setDragOverQuadrant(null)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, quadrant: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    let id = e.dataTransfer.getData("application/x-matrix-id") || e.dataTransfer.getData("text/plain")
    if (!id) id = dragIdRef.current
    
    setDraggedId(null)
    setDragOverQuadrant(null)
    dragIdRef.current = null
    
    if (!id || !onUpdateScores) return
    
    const scores = quadrantScores[quadrant]
    if (scores) {
      try {
        await onUpdateScores(id, scores.impact, scores.effort)
      } catch (error) {
        console.error("Failed to update scores:", error)
      }
    }
  }, [onUpdateScores])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverQuadrant(null)
    dragIdRef.current = null
  }, [])

  // Calculate positions based on impact and effort scores
  const positionedInitiatives = useMemo(() => {
    return initiatives.map(init => ({
      ...init,
      impact: init.impact_score ?? 5,
      effort: init.effort_score ?? 5,
    }))
  }, [initiatives])

  // Group into quadrants based on standard impact-effort matrix
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

    // Sort each quadrant by priority
    Object.keys(result).forEach(key => {
      result[key].sort((a, b) => a.priority - b.priority)
    })

    return result
  }, [positionedInitiatives])

  const renderQuadrant = (key: string) => {
    const config = quadrantConfig[key as keyof typeof quadrantConfig]
    const items = grouped[key] || []
    const Icon = config.icon
    const isDropTarget = dragOverQuadrant === key

    return (
      <div 
        className={cn(
          "relative rounded-xl border p-4 transition-all min-h-[220px]",
          config.bg,
          config.border,
          isDropTarget && "ring-2 ring-primary ring-offset-2 border-primary"
        )}
        onDragOver={(e) => handleDragOver(e, key)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, key)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={cn("p-1.5 rounded-lg bg-background/80 shadow-sm", config.color)}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={cn("text-sm font-semibold", config.color)}>{config.label}</h3>
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-[10px] font-medium px-1.5 py-0 h-4",
                    config.color
                  )}
                >
                  {items.length}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground">{config.subtitle}</p>
            </div>
          </div>
        </div>

        {/* Action tag - moved below header */}
        <div className="mb-2">
          <span className={cn("text-[9px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-background/60", config.color)}>
            {config.action}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-xs text-muted-foreground/60">
              {onUpdateScores ? "Drag items here" : "No initiatives"}
            </div>
          ) : (
            items.map((initiative) => {
              const status = statusConfig[initiative.status]
              const StatusIcon = status.icon
              const isDragged = draggedId === initiative.id

              return (
                <TooltipProvider key={initiative.id}>
                  <Tooltip delayDuration={200}>
                    <TooltipTrigger asChild>
                      <div
                        draggable={!!onUpdateScores}
                        onDragStart={(e) => handleDragStart(e, initiative.id)}
                        onDragEnd={handleDragEnd}
                        className={cn(
                          "w-full flex items-center gap-2 p-2.5 rounded-lg bg-background/90 border border-border/50 text-left transition-all hover:bg-background hover:shadow-md hover:border-border group",
                          onUpdateScores && "cursor-grab active:cursor-grabbing",
                          isDragged && "opacity-50 ring-2 ring-primary"
                        )}
                      >
                        {/* Drag handle */}
                        {onUpdateScores && (
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                        )}
                        
                        {/* Priority badge */}
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-muted text-[11px] font-bold text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          #{initiative.priority}
                        </span>
                        
                        {/* Content */}
                        <button
                          className="flex-1 min-w-0 text-left"
                          onClick={() => onEdit(initiative)}
                        >
                          <p className="text-xs font-medium truncate group-hover:text-primary transition-colors">
                            {initiative.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <div className="flex items-center gap-1">
                              <span className={cn("h-1.5 w-1.5 rounded-full", status.dotColor)} />
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {initiative.status.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground/60">|</span>
                            <span className="text-[10px] text-muted-foreground">
                              I:{initiative.impact} E:{initiative.effort}
                            </span>
                          </div>
                        </button>

                        {/* Status icon */}
                        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0 opacity-50 group-hover:opacity-100", status.color)} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs p-3">
                      <div className="space-y-2">
                        <p className="font-medium text-sm">{initiative.title}</p>
                        {initiative.description && (
                          <p className="text-xs text-muted-foreground line-clamp-3">
                            {initiative.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] pt-1 border-t border-border/50">
                          <span>Impact: <strong className="text-primary">{initiative.impact}/10</strong></span>
                          <span>Effort: <strong className="text-primary">{initiative.effort}/10</strong></span>
                        </div>
                        {initiative.responsible && (
                          <p className="text-[10px] text-muted-foreground">
                            Owner: {initiative.responsible}
                          </p>
                        )}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Matrix Container */}
      <div className="relative">
        {/* Y-axis label */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 -translate-x-full">
          <div className="flex flex-col items-center gap-1 text-[10px] text-muted-foreground">
            <ArrowUp className="h-3 w-3" />
            <span className="font-medium tracking-wider [writing-mode:vertical-lr] rotate-180">
              IMPACT
            </span>
          </div>
        </div>

        {/* Matrix Grid - proper layout */}
        <div className="grid grid-cols-2 gap-3 ml-6">
          {/* Row 1: High Impact (Quick Wins | Major Projects) */}
          {renderQuadrant("quick-wins")}
          {renderQuadrant("major-projects")}
          
          {/* Row 2: Low Impact (Fill-Ins | Time Sinks) */}
          {renderQuadrant("fill-ins")}
          {renderQuadrant("time-sinks")}
        </div>

        {/* X-axis label */}
        <div className="flex items-center justify-center gap-1.5 mt-3 ml-6 text-[10px] text-muted-foreground">
          <span className="font-medium tracking-wider">EFFORT</span>
          <ArrowRight className="h-3 w-3" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-[10px] text-muted-foreground border-t border-border/40 ml-6">
        {Object.entries(quadrantConfig).map(([key, config]) => {
          const Icon = config.icon
          return (
            <span key={key} className="flex items-center gap-1.5">
              <Icon className={cn("h-3 w-3", config.color)} />
              <span className="font-medium">{config.label}</span>
              <span className="text-muted-foreground/60">= {config.action}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}
