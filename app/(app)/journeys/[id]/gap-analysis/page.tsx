"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  getEmotionalArc,
  getAllTouchPoints,
  getEffectivePainPoints,
  getEffectiveHighlights,
} from "@/lib/data-utils"
import { useJourney } from "@/hooks/use-journey"
import { useJourneys } from "@/hooks/use-journeys"
import { cn } from "@/lib/utils"
import { ArrowUp, Lightbulb, TrendingUp, Target, Check, Info, GitCompare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useState } from "react"

export default function GapAnalysisPage() {
  const params = useParams()
  const { journey, isLoading } = useJourney(params.id as string)
  const { journeys: allJourneys } = useJourneys()
  const [compareId, setCompareId] = useState<string | null>(null)
  const { journey: compareJourney } = useJourney(compareId || "")

  if (isLoading || !journey) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  // Build list of other journeys to compare against
  const comparableJourneys = (allJourneys || []).filter((j) => j.id !== journey.id)

  const currentArc = compareJourney ? getEmotionalArc(compareJourney) : []
  const futureArc = getEmotionalArc(journey)

  // Derive gap analysis from real touchpoint data
  const allTps = getAllTouchPoints(journey)
  const dynamicGaps = allTps.map((tp) => {
    const painCount = getEffectivePainPoints(tp).length
    const highlightCount = getEffectiveHighlights(tp).length
    // Current = raw score normalized to 0-100; Future = projected improvement
    const normalized = ((tp.emotionalScore + 5) / 10) * 100
    const futureScore = Math.min(100, normalized + (painCount > 0 ? painCount * 15 : 5))
    return {
      touchPointName: tp.description.slice(0, 60),
      stageName: tp.stageName,
      currentScore: tp.emotionalScore,
      futureScore: Math.round(futureScore / 10),
      gap: Math.round((futureScore - normalized) / 10),
    }
  }).filter((g) => g.gap > 0)

  const sortedGaps = [...dynamicGaps].sort((a, b) => b.gap - a.gap)
  const avgGap = dynamicGaps.length > 0 ? dynamicGaps.reduce((s, g) => s + g.gap, 0) / dynamicGaps.length : 0
  const maxGap = sortedGaps[0]

  // Derive opportunities from pain points
  const dynamicOpportunities = allTps
    .filter((tp) => tp.emotionalScore < 0)
    .sort((a, b) => a.emotionalScore - b.emotionalScore)
    .slice(0, 5)
    .map((tp, i) => ({
      id: `opp-${tp.id}`,
      title: `Improve: ${tp.description.slice(0, 50)}`,
      description: `This touchpoint in "${tp.stageName}" has a score of ${tp.emotionalScore}. Addressing the ${getEffectivePainPoints(tp).length} pain point(s) could significantly improve the customer experience.`,
      impact: (tp.emotionalScore <= -3 ? "high" : "medium") as "high" | "medium",
      effort: (i < 2 ? "medium" : "high") as "low" | "medium" | "high",
      projectedScoreImprovement: Math.abs(tp.emotionalScore),
    }))

  // Chart for dual arc
  const chartW = 800
  const chartH = 250
  const padX = 50
  const padY = 25
  const innerW = chartW - padX * 2
  const innerH = chartH - padY * 2

  function buildPath(data: { stageName: string; score: number }[]) {
    const points = data.map((d, i) => ({
      x: padX + (i / Math.max(data.length - 1, 1)) * innerW,
      y: padY + ((5 - d.score) / 10) * innerH,
    }))
    return points
      .map((p, i) => {
        if (i === 0) return `M ${p.x} ${p.y}`
        const prev = points[i - 1]
        const cpx = (prev.x + p.x) / 2
        return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
      })
      .join(" ")
  }

  return (
    <div className="mx-auto max-w-7xl p-6">
      <Toaster />
      <div className="flex flex-col gap-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                Avg Gap Score
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-52 text-xs">Mean difference between future and current emotional scores across all analyzed touchpoints.</TooltipContent></Tooltip></TooltipProvider>
              </p>
              <p className="text-2xl font-bold text-primary mt-1">+{avgGap.toFixed(1)}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Biggest Gap</p>
              <p className="text-2xl font-bold text-foreground mt-1">+{maxGap?.gap || 0}</p>
              <p className="text-[10px] text-muted-foreground truncate">{maxGap?.touchPointName}</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Opportunities</p>
              <p className="text-2xl font-bold text-foreground mt-1">{dynamicOpportunities.length}</p>
              <p className="text-[10px] text-muted-foreground">identified</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Touchpoints</p>
              <p className="text-2xl font-bold text-foreground mt-1">{allTps.length}</p>
              <p className="text-[10px] text-muted-foreground">analyzed</p>
            </CardContent>
          </Card>
        </div>

        {/* Emotional Arc Comparison */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <GitCompare className="h-4 w-4" />
                Emotional Arc {currentArc.length > 0 ? "Comparison" : ""}
              </CardTitle>
              <div className="flex items-center gap-4">
                {/* Journey comparison selector */}
                <Select value={compareId || "none"} onValueChange={(v) => setCompareId(v === "none" ? null : v)}>
                  <SelectTrigger className="h-7 w-48 text-[11px]">
                    <SelectValue placeholder="Compare with..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No comparison</SelectItem>
                    {comparableJourneys.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        <span className="truncate">{j.title}</span>
                        <Badge variant="outline" className="ml-1.5 text-[8px] capitalize">{j.type}</Badge>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-3 text-[10px]">
                  {currentArc.length > 0 && (
                    <span className="flex items-center gap-1.5">
                      <span className="h-0.5 w-4 rounded bg-muted-foreground" />
                      {compareJourney?.title || "Comparison"}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <span className="h-0.5 w-4 rounded bg-primary" />
                    {journey.title}
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <svg width={chartW} height={chartH + 40} viewBox={`0 0 ${chartW} ${chartH + 40}`} className="w-full min-w-[500px]">
                  {/* Y axis */}
                  {[-5, -3, 0, 3, 5].map((val) => {
                    const y = padY + ((5 - val) / 10) * innerH
                    return (
                      <g key={val}>
                        <text x={padX - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                          {val > 0 ? `+${val}` : val}
                        </text>
                        <line x1={padX} y1={y} x2={chartW - padX} y2={y} stroke="currentColor" strokeOpacity={0.06} strokeDasharray="3 3" />
                      </g>
                    )
                  })}

                  {/* Zero line */}
                  <line x1={padX} y1={padY + (5 / 10) * innerH} x2={chartW - padX} y2={padY + (5 / 10) * innerH} stroke="currentColor" strokeOpacity={0.15} />

                  {/* Current arc */}
                  <path d={buildPath(currentArc)} fill="none" stroke="currentColor" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />

                  {/* Future arc */}
                  <path d={buildPath(futureArc)} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" strokeDasharray="6 3" />

                  {/* Current points */}
                  {currentArc.map((d, i) => {
                    const x = padX + (i / Math.max(currentArc.length - 1, 1)) * innerW
                    const y = padY + ((5 - d.score) / 10) * innerH
                    return (
                      <g key={`c-${d.stageName}`}>
                        <circle cx={x} cy={y} r={3} fill="currentColor" opacity={0.4} />
                        <text x={x} y={chartH - padY + 25} textAnchor="middle" className="fill-muted-foreground text-[9px]">
                          {d.stageName}
                        </text>
                      </g>
                    )
                  })}

                  {/* Future points */}
                  {futureArc.map((d, i) => {
                    const x = padX + (i / Math.max(futureArc.length - 1, 1)) * innerW
                    const y = padY + ((5 - d.score) / 10) * innerH
                    return <circle key={`f-${d.stageName}`} cx={x} cy={y} r={3} fill="var(--color-primary)" />
                  })}
                </svg>
              </div>
            </CardContent>
          </Card>

        {/* Full Emotional Arc (restored from emotional-arc page) */}
        {allTps.length > 0 && (() => {
          const scores = allTps.map((tp) => tp.emotionalScore)
          const arcMin = Math.min(-5, ...scores)
          const arcMax = Math.max(5, ...scores)
          const arcRange = arcMax - arcMin || 1
          const arcW = 1100, arcH = 350, aPadX = 60, aPadY = 30
          const aInnerW = arcW - aPadX * 2, aInnerH = arcH - aPadY * 2
          const arcPts = allTps.map((tp, i) => ({
            x: aPadX + (i / Math.max(allTps.length - 1, 1)) * aInnerW,
            y: aPadY + ((arcMax - tp.emotionalScore) / arcRange) * aInnerH,
            score: tp.emotionalScore,
            stage: tp.stageName,
          }))
          const arcPathD = arcPts.map((p, i) => {
            if (i === 0) return `M ${p.x} ${p.y}`
            const prev = arcPts[i - 1]
            const cpx = (prev.x + p.x) / 2
            return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
          }).join(" ")
          const arcAreaD = `${arcPathD} L ${arcPts[arcPts.length - 1].x} ${arcH - aPadY} L ${arcPts[0].x} ${arcH - aPadY} Z`
          // Stage boundaries
          const sBounds: { name: string; startIdx: number; endIdx: number }[] = []
          let idx = 0
          for (const stage of journey.stages) {
            const count = stage.steps.reduce((s, st) => s + st.touchPoints.length, 0)
            if (count > 0) { sBounds.push({ name: stage.name, startIdx: idx, endIdx: idx + count - 1 }); idx += count }
          }
          const colorFill = (s: number) => s <= -3 ? "#dc2626" : s <= -1 ? "#f97316" : s <= 1 ? "#eab308" : s <= 3 ? "#10b981" : "#16a34a"

          return (
            <Card className="border-border/60">
              <CardHeader className="pb-0">
                <CardTitle className="text-sm font-medium">Full Emotional Arc</CardTitle>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="overflow-x-auto">
                  <svg width={arcW} height={arcH + 50} viewBox={`0 0 ${arcW} ${arcH + 50}`} className="w-full min-w-[600px]">
                    {[-5, -3, 0, 3, 5].map((val) => {
                      const y = aPadY + ((arcMax - val) / arcRange) * aInnerH
                      return (
                        <g key={val}>
                          <text x={aPadX - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">{val > 0 ? `+${val}` : val}</text>
                          <line x1={aPadX} y1={y} x2={arcW - aPadX} y2={y} stroke="currentColor" strokeOpacity={val === 0 ? 0.15 : 0.05} strokeDasharray={val === 0 ? undefined : "3 3"} />
                        </g>
                      )
                    })}
                    {sBounds.map((sb, i) => {
                      if (i === 0) return null
                      const x = (arcPts[sb.startIdx].x + arcPts[sb.startIdx - 1].x) / 2
                      return <line key={sb.name} x1={x} y1={aPadY - 10} x2={x} y2={arcH - aPadY + 10} stroke="currentColor" strokeOpacity={0.1} strokeDasharray="4 4" />
                    })}
                    {sBounds.map((sb) => {
                      const cx = (arcPts[sb.startIdx].x + arcPts[sb.endIdx].x) / 2
                      return <text key={sb.name} x={cx} y={arcH - aPadY + 25} textAnchor="middle" className="fill-muted-foreground text-[10px] font-medium">{sb.name}</text>
                    })}
                    <defs>
                      <linearGradient id="gap-arc-grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                        <stop offset="50%" stopColor="#eab308" stopOpacity={0.05} />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity={0.15} />
                      </linearGradient>
                    </defs>
                    <path d={arcAreaD} fill="url(#gap-arc-grad)" />
                    <path d={arcPathD} fill="none" stroke="var(--color-primary)" strokeWidth={2} strokeLinecap="round" />
                    {arcPts.map((p, i) => (
                      <g key={allTps[i].id}>
                        <circle cx={p.x} cy={p.y} r={4} fill={colorFill(p.score)} opacity={0.25} />
                        <circle cx={p.x} cy={p.y} r={2.5} fill={colorFill(p.score)} />
                        <title>{`${p.stage}: ${p.score > 0 ? "+" : ""}${p.score}\n${allTps[i].description}`}</title>
                      </g>
                    ))}
                  </svg>
                </div>
              </CardContent>
            </Card>
          )
        })()}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Gap table */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Target className="h-4 w-4" />
                Gap Breakdown
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-60 text-xs">
                      Shows the difference between current and future emotional scores for each touchpoint. A larger gap indicates greater improvement potential.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {sortedGaps.map((gap) => (
                  <div key={gap.touchPointName} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{gap.touchPointName}</p>
                        <p className="text-[10px] text-muted-foreground">{gap.stageName}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs shrink-0 ml-4">
                        <span className="font-mono text-red-500">{gap.currentScore > 0 ? "+" : ""}{gap.currentScore}</span>
                        <ArrowUp className="h-3 w-3 text-primary" />
                        <span className="font-mono text-green-500">+{gap.futureScore}</span>
                        <Badge variant="secondary" className="text-[10px] font-bold">
                          +{gap.gap}
                        </Badge>
                      </div>
                    </div>
                    <Progress value={(gap.gap / 10) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                <Lightbulb className="h-4 w-4" />
                AI-Identified Opportunities
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-60 text-xs">
                      Opportunities identified by AI analysis comparing current and future journey emotional scores. Projected improvement shows estimated score lift per touchpoint.
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {dynamicOpportunities.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No negative touchpoints found - great job!</p>
              )}
              {dynamicOpportunities.map((opp) => (
                <div key={opp.id} className="rounded-lg border border-border/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-semibold text-foreground">{opp.title}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-xs font-bold text-primary">+{opp.projectedScoreImprovement}</span>
                    </div>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{opp.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] capitalize",
                          opp.impact === "high"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                        )}
                      >
                        {opp.impact} impact
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] capitalize",
                          opp.effort === "low"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                            : opp.effort === "medium"
                            ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                        )}
                      >
                        {opp.effort} effort
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 gap-1.5 text-[11px] text-primary hover:text-primary-foreground hover:bg-primary"
                      onClick={() => toast.success(`"${opp.title}" applied to journey`)}
                    >
                      <Check className="h-3 w-3" />
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
