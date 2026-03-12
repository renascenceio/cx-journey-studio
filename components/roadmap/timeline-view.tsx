"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Target, Clock, CheckCircle2, PauseCircle, AlertCircle,
  ChevronLeft, ChevronRight, Calendar,
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
  start_date: string | null
  end_date: string | null
}

interface TimelineViewProps {
  initiatives: Initiative[]
  onEdit: (initiative: Initiative) => void
}

const statusConfig: Record<string, { color: string; bgColor: string; icon: typeof Target }> = {
  planned: { color: "bg-muted-foreground", bgColor: "bg-muted/50", icon: Target },
  in_progress: { color: "bg-primary", bgColor: "bg-primary/10", icon: Clock },
  pending_approval: { color: "bg-violet-500", bgColor: "bg-violet-100 dark:bg-violet-900/30", icon: AlertCircle },
  completed: { color: "bg-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/30", icon: CheckCircle2 },
  on_hold: { color: "bg-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/30", icon: PauseCircle },
}

type ViewMode = "month" | "quarter"

export function TimelineView({ initiatives, onEdit }: TimelineViewProps) {
  const t = useTranslations()
  const [viewMode, setViewMode] = useState<ViewMode>("month")
  const [currentDate, setCurrentDate] = useState(new Date())

  // Filter initiatives with dates
  const withDates = useMemo(() => 
    initiatives.filter(i => i.start_date && i.end_date),
    [initiatives]
  )

  const withoutDates = useMemo(() =>
    initiatives.filter(i => !i.start_date || !i.end_date),
    [initiatives]
  )

  // Calculate date range for the view
  const { startDate, endDate, days, weekStarts } = useMemo(() => {
    const today = new Date(currentDate)
    
    if (viewMode === "month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      const dayCount = end.getDate()
      const daysArray = Array.from({ length: dayCount }, (_, i) => new Date(start.getFullYear(), start.getMonth(), i + 1))
      
      // Get week start dates for header
      const weeks: Date[] = []
      let d = new Date(start)
      while (d <= end) {
        if (d.getDay() === 0 || weeks.length === 0) {
          weeks.push(new Date(d))
        }
        d.setDate(d.getDate() + 1)
      }
      
      return { startDate: start, endDate: end, days: daysArray, weekStarts: weeks }
    } else {
      // Quarter view
      const quarterStart = Math.floor(today.getMonth() / 3) * 3
      const start = new Date(today.getFullYear(), quarterStart, 1)
      const end = new Date(today.getFullYear(), quarterStart + 3, 0)
      
      // Generate weeks for the quarter
      const weeks: Date[] = []
      let d = new Date(start)
      while (d <= end) {
        weeks.push(new Date(d))
        d.setDate(d.getDate() + 7)
      }
      
      return { startDate: start, endDate: end, days: weeks, weekStarts: weeks }
    }
  }, [currentDate, viewMode])

  // Navigate
  const goBack = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() - 3)
    }
    setCurrentDate(newDate)
  }

  const goForward = () => {
    const newDate = new Date(currentDate)
    if (viewMode === "month") {
      newDate.setMonth(newDate.getMonth() + 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 3)
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => setCurrentDate(new Date())

  // Calculate position and width for an initiative
  const getBarStyle = (initiative: Initiative) => {
    if (!initiative.start_date || !initiative.end_date) return null
    
    const iStart = new Date(initiative.start_date)
    const iEnd = new Date(initiative.end_date)
    
    // Check if initiative overlaps with current view
    if (iEnd < startDate || iStart > endDate) return null
    
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    const effectiveStart = iStart < startDate ? startDate : iStart
    const effectiveEnd = iEnd > endDate ? endDate : iEnd
    
    const startOffset = (effectiveStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    const duration = (effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24) + 1
    
    const leftPercent = (startOffset / totalDays) * 100
    const widthPercent = (duration / totalDays) * 100
    
    return {
      left: `${leftPercent}%`,
      width: `${Math.max(widthPercent, 3)}%`, // Minimum 3% width for visibility
    }
  }

  // Format header
  const headerLabel = viewMode === "month"
    ? currentDate.toLocaleDateString("en", { month: "long", year: "numeric" })
    : `Q${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}`

  // Today marker position
  const today = new Date()
  const todayPosition = useMemo(() => {
    if (today < startDate || today > endDate) return null
    const totalDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24) + 1
    const offset = (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    return `${(offset / totalDays) * 100}%`
  }, [today, startDate, endDate])

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 min-w-[140px]" onClick={goToToday}>
            <Calendar className="h-3.5 w-3.5 mr-1.5" />
            {headerLabel}
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={goForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "month" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("month")}
          >
            {t("roadmap.timeline.month")}
          </Button>
          <Button
            variant={viewMode === "quarter" ? "default" : "outline"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => setViewMode("quarter")}
          >
            {t("roadmap.timeline.quarter")}
          </Button>
        </div>
      </div>

      {/* Timeline Grid */}
      <Card className="border-border/60 overflow-hidden">
        <CardContent className="p-0">
          {/* Date header */}
          <div className="border-b border-border/40 bg-muted/30">
            <div className="flex">
              <div className="w-48 shrink-0 border-r border-border/40 px-3 py-2">
                <span className="text-xs font-medium text-muted-foreground">Initiative</span>
              </div>
              <div className="flex-1 relative">
                <div className="flex">
                  {viewMode === "month" ? (
                    // Day headers for month view
                    days.map((day, i) => (
                      <div
                        key={i}
                        className={cn(
                          "flex-1 text-center py-1.5 border-r border-border/20 last:border-r-0",
                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                        )}
                      >
                        <span className="text-[9px] text-muted-foreground">
                          {day.getDate()}
                        </span>
                      </div>
                    ))
                  ) : (
                    // Week headers for quarter view
                    weekStarts.map((week, i) => (
                      <div key={i} className="flex-1 text-center py-1.5 border-r border-border/20 last:border-r-0">
                        <span className="text-[9px] text-muted-foreground">
                          {week.toLocaleDateString("en", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Initiatives rows */}
          {withDates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-8 w-8 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                {t("roadmap.timeline.noDateRange")}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {withDates.map((initiative) => {
                const barStyle = getBarStyle(initiative)
                const config = statusConfig[initiative.status]

                return (
                  <div key={initiative.id} className="flex hover:bg-muted/20 transition-colors">
                    {/* Initiative name column */}
                    <div className="w-48 shrink-0 border-r border-border/40 px-3 py-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              className="text-left w-full"
                              onClick={() => onEdit(initiative)}
                            >
                              <p className="text-xs font-medium text-foreground truncate hover:underline">
                                {initiative.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {initiative.responsible}
                              </p>
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-xs">
                            <p className="font-medium">{initiative.title}</p>
                            {initiative.description && (
                              <p className="text-xs text-muted-foreground mt-1">{initiative.description}</p>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    {/* Timeline bar area */}
                    <div className="flex-1 relative py-2 px-1">
                      {/* Today marker */}
                      {todayPosition && (
                        <div
                          className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
                          style={{ left: todayPosition }}
                        />
                      )}

                      {barStyle && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={cn(
                                  "absolute h-6 rounded-md cursor-pointer transition-all hover:scale-y-110",
                                  config.bgColor
                                )}
                                style={{ ...barStyle, top: "50%", transform: "translateY(-50%)" }}
                                onClick={() => onEdit(initiative)}
                              >
                                <div className={cn("h-full rounded-md", config.color)} style={{ width: "100%" }}>
                                  <span className="text-[9px] text-white font-medium px-1.5 truncate block leading-6">
                                    {initiative.title}
                                  </span>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="font-medium">{initiative.title}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(initiative.start_date!).toLocaleDateString()} - {new Date(initiative.end_date!).toLocaleDateString()}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Show count of initiatives without dates */}
          {withoutDates.length > 0 && (
            <div className="border-t border-border/40 px-4 py-2 bg-muted/20">
              <p className="text-[10px] text-muted-foreground">
                + {withoutDates.length} initiative{withoutDates.length !== 1 ? "s" : ""} without dates
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
