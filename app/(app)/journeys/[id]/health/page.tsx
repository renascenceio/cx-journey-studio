"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  healthIndicators,
  getHealthStatusColor,
  getHealthStatusBg,
} from "@/lib/data-utils"
import { useJourney } from "@/hooks/use-journey"
import { cn } from "@/lib/utils"
import { Activity, CheckCircle2, AlertTriangle, XCircle, Clock, Info, Gauge, TrendingUp, TrendingDown, Minus } from "lucide-react"

const statusIcons: Record<string, typeof CheckCircle2> = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  critical: XCircle,
  unknown: Clock,
}

// Simulated journey-level scores
const journeyScores = {
  journeyIndex: { value: 72, prev: 68, label: "Journey Index", description: "Composite score (0-100) derived from emotional arc average, pain point density, and health indicator performance. Weighted: 40% emotional, 30% health, 30% pain points." },
  nps: { value: 42, prev: 38, label: "NPS", description: "Net Promoter Score (-100 to 100). Calculated from the percentage of promoters minus detractors surveyed across all touch points in this journey." },
  csat: { value: 78, prev: 81, label: "CSAT", description: "Customer Satisfaction Score (0-100%). Based on post-interaction satisfaction surveys weighted by touch point traffic volume." },
  ces: { value: 3.2, prev: 3.5, label: "CES", description: "Customer Effort Score (1-7, lower is better). Average effort rating reported by customers completing key tasks in this journey." },
}

function TrendIndicator({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  const diff = current - previous
  const isPositive = inverse ? diff < 0 : diff > 0
  const isNegative = inverse ? diff > 0 : diff < 0
  if (diff === 0) return <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground"><Minus className="h-3 w-3" /> 0</span>
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-medium", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {diff > 0 ? "+" : ""}{typeof current === "number" && current % 1 !== 0 ? diff.toFixed(1) : diff}
    </span>
  )
}

export default function HealthPage() {
  const params = useParams()
  const { journey, isLoading } = useJourney(params.id as string)
  if (isLoading || !journey) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  const healthyCount = healthIndicators.filter((h) => h.status === "healthy").length
  const warningCount = healthIndicators.filter((h) => h.status === "warning").length
  const criticalCount = healthIndicators.filter((h) => h.status === "critical").length
  const overallHealth = criticalCount > 0 ? "critical" : warningCount > 0 ? "warning" : "healthy"

  const OverallIcon = statusIcons[overallHealth]

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex flex-col gap-6">
        {/* Top row: Journey Index + NPS/CSAT/CES + Overall Status */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {/* Journey Index Score - large prominent card */}
          <Card className="border-primary/20 bg-primary/[0.03] dark:bg-primary/[0.06] col-span-2 lg:col-span-1">
            <CardContent className="flex flex-col items-center justify-center gap-1 p-5">
              <div className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                <Gauge className="h-3.5 w-3.5" />
                {journeyScores.journeyIndex.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-64 text-xs">
                      {journeyScores.journeyIndex.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-4xl font-bold text-primary font-mono">{journeyScores.journeyIndex.value}</span>
                <span className="text-xs text-muted-foreground mb-1">/100</span>
              </div>
              <TrendIndicator current={journeyScores.journeyIndex.value} previous={journeyScores.journeyIndex.prev} />
            </CardContent>
          </Card>

          {/* NPS */}
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center gap-1 p-5">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {journeyScores.nps.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56 text-xs">
                      {journeyScores.nps.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <span className={cn(
                "text-3xl font-bold font-mono",
                journeyScores.nps.value >= 50 ? "text-emerald-600 dark:text-emerald-400" :
                journeyScores.nps.value >= 0 ? "text-yellow-600 dark:text-yellow-400" :
                "text-red-600 dark:text-red-400"
              )}>
                {journeyScores.nps.value > 0 ? "+" : ""}{journeyScores.nps.value}
              </span>
              <TrendIndicator current={journeyScores.nps.value} previous={journeyScores.nps.prev} />
            </CardContent>
          </Card>

          {/* CSAT */}
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center gap-1 p-5">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {journeyScores.csat.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56 text-xs">
                      {journeyScores.csat.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-end gap-1">
                <span className={cn(
                  "text-3xl font-bold font-mono",
                  journeyScores.csat.value >= 80 ? "text-emerald-600 dark:text-emerald-400" :
                  journeyScores.csat.value >= 60 ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                )}>
                  {journeyScores.csat.value}
                </span>
                <span className="text-xs text-muted-foreground mb-1">%</span>
              </div>
              <TrendIndicator current={journeyScores.csat.value} previous={journeyScores.csat.prev} />
            </CardContent>
          </Card>

          {/* CES */}
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center gap-1 p-5">
              <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {journeyScores.ces.label}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-56 text-xs">
                      {journeyScores.ces.description}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex items-end gap-1">
                <span className={cn(
                  "text-3xl font-bold font-mono",
                  journeyScores.ces.value <= 3 ? "text-emerald-600 dark:text-emerald-400" :
                  journeyScores.ces.value <= 5 ? "text-yellow-600 dark:text-yellow-400" :
                  "text-red-600 dark:text-red-400"
                )}>
                  {journeyScores.ces.value}
                </span>
                <span className="text-xs text-muted-foreground mb-1">/7</span>
              </div>
              <TrendIndicator current={journeyScores.ces.value} previous={journeyScores.ces.prev} inverse />
            </CardContent>
          </Card>

          {/* Overall Status */}
          <Card className={cn("border-border/60", getHealthStatusBg(overallHealth))}>
            <CardContent className="flex flex-col items-center justify-center gap-1 p-5">
              <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Status</div>
              <OverallIcon className={cn("h-8 w-8", getHealthStatusColor(overallHealth))} />
              <span className={cn("text-sm font-bold capitalize", getHealthStatusColor(overallHealth))}>{overallHealth}</span>
              <p className="text-[10px] text-muted-foreground text-center mt-0.5">
                {healthyCount}h / {warningCount}w / {criticalCount}c
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Last health check */}
        {journey.lastHealthCheck && (
          <p className="text-xs text-muted-foreground -mt-3">
            Last health check: {new Date(journey.lastHealthCheck).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
          </p>
        )}

        {/* Metric cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {healthIndicators.map((indicator) => {
            const Icon = statusIcons[indicator.status]
            const pct = indicator.unit === "%"
              ? indicator.value
              : Math.min(100, (indicator.value / indicator.threshold) * 100)
            const isInverse = ["Appointment No-Show Rate", "Digital Form Error Rate", "Avg Wait Time (Check-in)"].includes(indicator.metric)

            return (
              <Card key={indicator.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground">{indicator.metric}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Threshold: {indicator.threshold}{indicator.unit}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] capitalize shrink-0",
                        getHealthStatusBg(indicator.status),
                        getHealthStatusColor(indicator.status)
                      )}
                    >
                      <Icon className="h-2.5 w-2.5 mr-1" />
                      {indicator.status}
                    </Badge>
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={cn("text-2xl font-bold font-mono", getHealthStatusColor(indicator.status))}>
                      {indicator.value}
                    </span>
                    <span className="text-xs text-muted-foreground mb-1">{indicator.unit}</span>
                  </div>
                  <Progress
                    value={isInverse ? 100 - pct : pct}
                    className={cn("mt-2 h-1.5")}
                  />
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
