"use client"

import { Badge } from "@/components/ui/badge"

const stages = [
  { name: "Awareness", score: 3, steps: 4, color: "bg-chart-1" },
  { name: "Consideration", score: -1, steps: 5, color: "bg-chart-2" },
  { name: "Onboarding", score: 1, steps: 3, color: "bg-chart-4" },
  { name: "First Value", score: 4, steps: 6, color: "bg-chart-1" },
  { name: "Retention", score: 3, steps: 4, color: "bg-chart-5" },
]

const metrics = [
  { label: "Journey Index", value: "72", suffix: "/100", change: "+4" },
  { label: "NPS", value: "+42", suffix: "", change: "+6" },
  { label: "CSAT", value: "78", suffix: "%", change: "+3" },
  { label: "CES", value: "3.2", suffix: "/7", change: "-0.4" },
]

export function HeroJourneyPreview() {
  const minScore = -5
  const maxScore = 5
  const range = maxScore - minScore
  const width = 500
  const height = 140
  const padX = 36
  const padY = 20
  const innerW = width - padX * 2
  const innerH = height - padY * 2

  const points = stages.map((s, i) => ({
    x: padX + (i / (stages.length - 1)) * innerW,
    y: padY + ((maxScore - s.score) / range) * innerH,
  }))

  const pathD = points
    .map((p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`
      const prev = points[i - 1]
      const cpx = (prev.x + p.x) / 2
      return `C ${cpx} ${prev.y}, ${cpx} ${p.y}, ${p.x} ${p.y}`
    })
    .join(" ")

  return (
    <div className="p-4 md:p-6">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-primary/60" />
          <span className="text-sm font-semibold text-foreground">
            E-Commerce Purchase Journey
          </span>
          <Badge variant="secondary" className="text-[10px]">
            Deployed
          </Badge>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <div className="flex gap-1">
            {["Columns", "Swimlane", "Timeline"].map((v) => (
              <span
                key={v}
                className={`rounded px-2.5 py-1 text-[10px] font-medium ${v === "Columns" ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}
              >
                {v}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Metrics bar */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg border border-border/40 bg-muted/30 px-3 py-2"
          >
            <p className="text-[10px] font-medium text-muted-foreground">
              {m.label}
            </p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold text-foreground">
                {m.value}
              </span>
              <span className="text-xs text-muted-foreground">{m.suffix}</span>
              <span
                className={`ml-auto text-[10px] font-medium ${m.change.startsWith("+") ? "text-chart-1" : "text-chart-2"}`}
              >
                {m.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Stages + Arc */}
      <div className="mt-4 flex gap-4">
        {/* Stage columns */}
        <div className="hidden flex-1 gap-2 lg:flex">
          {stages.map((stage, i) => (
            <div
              key={stage.name}
              className="flex-1 rounded-lg border border-border/40 bg-muted/20 p-2.5"
            >
              <div className="mb-2 flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-[10px] font-semibold text-foreground">
                  {i + 1}. {stage.name}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                {Array.from({ length: Math.min(stage.steps, 3) }).map(
                  (_, j) => (
                    <div
                      key={j}
                      className="h-5 rounded border border-border/30 bg-muted/60"
                    />
                  ),
                )}
                {stage.steps > 3 && (
                  <span className="text-center text-[9px] text-muted-foreground">
                    +{stage.steps - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Emotional arc */}
        <div className="min-w-0 flex-1 lg:max-w-[280px]">
          <p className="mb-1.5 text-[10px] font-medium text-muted-foreground">
            Emotional Arc
          </p>
          <div className="rounded-lg border border-border/40 bg-muted/20 p-2">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full"
              role="img"
              aria-label="Emotional arc curve"
            >
              <line
                x1={padX}
                y1={padY + (maxScore / range) * innerH}
                x2={width - padX}
                y2={padY + (maxScore / range) * innerH}
                stroke="currentColor"
                strokeOpacity={0.08}
                strokeDasharray="3 3"
              />
              <defs>
                <linearGradient id="hero-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0.15}
                  />
                  <stop
                    offset="100%"
                    stopColor="var(--color-primary)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <path
                d={`${pathD} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`}
                fill="url(#hero-grad)"
              />
              <path
                d={pathD}
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth={2}
                strokeLinecap="round"
              />
              {points.map((p, i) => (
                <g key={stages[i].name}>
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={3}
                    fill="var(--color-card)"
                    stroke="var(--color-primary)"
                    strokeWidth={1.5}
                  />
                  <text
                    x={p.x}
                    y={height - 4}
                    textAnchor="middle"
                    className="fill-muted-foreground text-[8px]"
                  >
                    {stages[i].name}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
