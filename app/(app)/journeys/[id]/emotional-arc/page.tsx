"use client"

import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  getAllTouchPoints,
  getEmotionalScoreColor,
  getEmotionalScoreBg,
  getEffectivePainPoints,
  getEffectiveHighlights,
} from "@/lib/data-utils"
import { useJourney } from "@/hooks/use-journey"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Info } from "lucide-react"

function scoreColorFill(score: number) {
  if (score <= -3) return "#dc2626"
  if (score <= -1) return "#f97316"
  if (score <= 1) return "#eab308"
  if (score <= 3) return "#10b981"
  return "#16a34a"
}

export default function EmotionalArcPage() {
  const params = useParams()
  const { journey, isLoading } = useJourney(params.id as string)
  if (isLoading || !journey) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  // Flatten all touchpoints in order with stage info
  const allTps = getAllTouchPoints(journey)

  if (allTps.length === 0) {
    return (
      <div className="mx-auto max-w-7xl p-6">
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <p className="text-sm font-medium text-foreground">No touchpoints yet</p>
            <p className="text-xs text-muted-foreground text-center max-w-sm">
              Add touchpoints to your journey stages to see the emotional arc visualization. Each touchpoint needs an emotional score (-5 to +5).
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const scores = allTps.map((tp) => tp.emotionalScore)
  const min = Math.min(-5, ...scores)
  const max = Math.max(5, ...scores)
  const range = max - min || 1

  // Chart dimensions
  const chartW = 1100
  const chartH = 420
  const padX = 60
  const padY = 36
  const innerW = chartW - padX * 2
  const innerH = chartH - padY * 2

  const points = allTps.map((tp, i) => ({
    x: padX + (i / Math.max(allTps.length - 1, 1)) * innerW,
    y: padY + ((max - tp.emotionalScore) / range) * innerH,
    score: tp.emotionalScore,
    name: tp.description,
    stage: tp.stageName,
    step: tp.stepName,
    channel: tp.channel,
  }))

  // Build smooth path
  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cpx = (prev.x + p.x) / 2
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(" ")

  // Gradient fill path
  const areaD = `${pathD} L ${points[points.length - 1].x} ${chartH - padY} L ${points[0].x} ${chartH - padY} Z`

  // Zero line Y
  const zeroY = padY + ((max - 0) / range) * innerH

  // Stage boundaries
  const stageBoundaries: { name: string; startIdx: number; endIdx: number }[] = []
  let idx = 0
  for (const stage of journey.stages) {
    const count = stage.steps.reduce((s, st) => s + st.touchPoints.length, 0)
    stageBoundaries.push({ name: stage.name, startIdx: idx, endIdx: idx + count - 1 })
    idx += count
  }

  // Average score
  const avgScore = allTps.length > 0
    ? allTps.reduce((s, tp) => s + tp.emotionalScore, 0) / allTps.length
    : 0

  // Score distribution
  const negative = allTps.filter((tp) => tp.emotionalScore < 0).length
  const neutral = allTps.filter((tp) => tp.emotionalScore >= 0 && tp.emotionalScore <= 1).length
  const positive = allTps.filter((tp) => tp.emotionalScore > 1).length

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="flex flex-col gap-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                Avg Score
                <TooltipProvider><Tooltip><TooltipTrigger asChild><Info className="h-3 w-3 text-muted-foreground/50 cursor-help" /></TooltipTrigger><TooltipContent className="max-w-52 text-xs">Mean emotional score across all touchpoints (-5 to +5).</TooltipContent></Tooltip></TooltipProvider>
              </p>
              <p className={cn("text-2xl font-bold font-mono mt-1", avgScore >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400")}>
                {avgScore > 0 ? "+" : ""}{avgScore.toFixed(1)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Negative</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{negative}</p>
              <p className="text-[10px] text-muted-foreground">touchpoints</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Neutral</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{neutral}</p>
              <p className="text-[10px] text-muted-foreground">touchpoints</p>
            </CardContent>
          </Card>
          <Card className="border-border/60">
            <CardContent className="p-4">
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Positive</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{positive}</p>
              <p className="text-[10px] text-muted-foreground">touchpoints</p>
            </CardContent>
          </Card>
        </div>

        {/* Full arc chart */}
        <Card className="border-border/60">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm font-medium">Full Emotional Arc</CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="overflow-x-auto">
              <svg width={chartW} height={chartH + 60} viewBox={`0 0 ${chartW} ${chartH + 60}`} className="w-full min-w-[700px]">
                {/* Y-axis labels */}
                {[-5, -3, -1, 0, 1, 3, 5].map((val) => {
                  const y = padY + ((max - val) / range) * innerH
                  return (
                    <g key={val}>
                      <text x={padX - 8} y={y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                        {val > 0 ? `+${val}` : val}
                      </text>
                      <line
                        x1={padX}
                        y1={y}
                        x2={chartW - padX}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity={val === 0 ? 0.15 : 0.05}
                        strokeDasharray={val === 0 ? undefined : "3 3"}
                      />
                    </g>
                  )
                })}

                {/* Stage separators */}
                {stageBoundaries.map((sb, i) => {
                  if (i === 0) return null
                  const x = (points[sb.startIdx].x + points[sb.startIdx - 1].x) / 2
                  return (
                    <line
                      key={sb.name}
                      x1={x}
                      y1={padY - 10}
                      x2={x}
                      y2={chartH - padY + 10}
                      stroke="currentColor"
                      strokeOpacity={0.1}
                      strokeDasharray="4 4"
                    />
                  )
                })}

                {/* Stage labels */}
                {stageBoundaries.map((sb) => {
                  const startX = points[sb.startIdx].x
                  const endX = points[sb.endIdx].x
                  const cx = (startX + endX) / 2
                  return (
                    <text
                      key={sb.name}
                      x={cx}
                      y={chartH - padY + 30}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[10px] font-medium"
                    >
                      {sb.name}
                    </text>
                  )
                })}

                {/* Zero line */}
                <line
                  x1={padX}
                  y1={zeroY}
                  x2={chartW - padX}
                  y2={zeroY}
                  stroke="currentColor"
                  strokeOpacity={0.2}
                  strokeWidth={1}
                />

                {/* Area fill */}
                <defs>
                  <linearGradient id="arc-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
                    <stop offset="50%" stopColor="#eab308" stopOpacity={0.05} />
                    <stop offset="100%" stopColor="#dc2626" stopOpacity={0.15} />
                  </linearGradient>
                </defs>
                <path d={areaD} fill="url(#arc-gradient)" />

                {/* Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  strokeLinecap="round"
                />

                {/* Points */}
                {points.map((p, i) => (
                  <g key={allTps[i].id}>
                    <circle cx={p.x} cy={p.y} r={5} fill={scoreColorFill(p.score)} opacity={0.2} />
                    <circle cx={p.x} cy={p.y} r={3} fill={scoreColorFill(p.score)} />
                    <title>{`${p.stage} > ${p.step}: ${p.score > 0 ? "+" : ""}${p.score}\n${p.name}`}</title>
                  </g>
                ))}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Touchpoint breakdown table */}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Touchpoint Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4">Stage</th>
                    <th className="py-2 pr-4">Step</th>
                    <th className="py-2 pr-4">Touchpoint</th>
                    <th className="py-2 pr-4 text-right">Score</th>
                    <th className="py-2 pr-4 text-right">Pain Points</th>
                    <th className="py-2 text-right">Highlights</th>
                  </tr>
                </thead>
                <tbody>
                  {allTps.map((tp) => (
                    <tr key={tp.id} className="border-b border-border/40">
                      <td className="py-2 pr-4 text-muted-foreground">{tp.stageName}</td>
                      <td className="py-2 pr-4 font-medium text-foreground">{tp.stepName}</td>
                      <td className="py-2 pr-4">
                        <Badge variant="secondary" className="text-[10px]">{tp.channel}</Badge>
                      </td>
                      <td className={cn("py-2 pr-4 text-right font-mono font-bold", getEmotionalScoreColor(tp.emotionalScore))}>
                        {tp.emotionalScore > 0 ? "+" : ""}{tp.emotionalScore}
                      </td>
                      <td className="py-2 pr-4 text-right text-red-500">
                        {getEffectivePainPoints(tp).length > 0 ? getEffectivePainPoints(tp).length : "-"}
                      </td>
                      <td className="py-2 text-right text-emerald-500">
                        {getEffectiveHighlights(tp).length > 0 ? getEffectiveHighlights(tp).length : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
