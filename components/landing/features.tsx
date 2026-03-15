"use client"

import {
  Route,
  TrendingUp,
  UserCircle,
  Sparkles,
  LayoutGrid,
  Activity,
  BarChart3,
  GripVertical,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

// Mini visualization components for the features
function JourneyPreviewViz() {
  const stages = [
    { name: "Awareness", color: "bg-chart-1" },
    { name: "Consider", color: "bg-chart-2" },
    { name: "Purchase", color: "bg-chart-4" },
    { name: "Retention", color: "bg-chart-5" },
  ]
  return (
    <div className="flex gap-1.5 mt-3 mb-1">
      {stages.map((s, i) => (
        <div key={s.name} className="flex-1 rounded border border-border/50 bg-muted/30 p-1.5">
          <div className={`h-1 w-6 rounded-full ${s.color} mb-1.5`} />
          <div className="space-y-0.5">
            <div className="h-1 w-full rounded bg-border/50" />
            <div className="h-1 w-3/4 rounded bg-border/50" />
          </div>
        </div>
      ))}
    </div>
  )
}

function EmotionalArcViz() {
  const stages = ["Awareness", "Consider", "Purchase", "Onboard", "Retain"]
  const scores = [3, -1, 2, 4, 3]
  const width = 280
  const height = 100
  const padX = 20
  const padY = 16
  const innerW = width - padX * 2
  const innerH = height - padY * 2
  const range = 10

  const points = scores.map((s, i) => ({
    x: padX + (i / (scores.length - 1)) * innerW,
    y: padY + ((5 - s) / range) * innerH,
    score: s,
    stage: stages[i],
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
    <div className="mt-4 mb-2 rounded-lg border border-border/50 bg-muted/20 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-24">
        <defs>
          <linearGradient id="arc-grad-v2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity={0.3} />
            <stop offset="50%" stopColor="var(--color-chart-2)" stopOpacity={0.1} />
            <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        {/* Neutral baseline */}
        <line x1={padX} y1={height/2} x2={width-padX} y2={height/2} stroke="currentColor" strokeOpacity={0.15} strokeDasharray="4 4" />
        {/* Positive zone label */}
        <text x={padX - 2} y={padY + 4} fontSize="7" fill="currentColor" opacity={0.4} textAnchor="end">+</text>
        {/* Negative zone label */}
        <text x={padX - 2} y={height - padY - 2} fontSize="7" fill="currentColor" opacity={0.4} textAnchor="end">-</text>
        {/* Area fill */}
        <path d={`${pathD} L ${points[points.length - 1].x} ${height/2} L ${points[0].x} ${height/2} Z`} fill="url(#arc-grad-v2)" />
        {/* Main line */}
        <path d={pathD} fill="none" stroke="var(--color-primary)" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        {/* Data points with sentiment colors */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={5} fill={p.score >= 2 ? "var(--color-chart-1)" : p.score < 0 ? "var(--color-chart-4)" : "var(--color-chart-2)"} />
            <circle cx={p.x} cy={p.y} r={2.5} fill="white" />
            <text x={p.x} y={height - 4} fontSize="7" fill="currentColor" opacity={0.5} textAnchor="middle">{p.stage}</text>
          </g>
        ))}
      </svg>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-2">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-chart-1" />
          <span className="text-[8px] text-muted-foreground">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-chart-2" />
          <span className="text-[8px] text-muted-foreground">Neutral</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-chart-4" />
          <span className="text-[8px] text-muted-foreground">Pain Point</span>
        </div>
      </div>
    </div>
  )
}

function ViewModesViz() {
  return (
    <div className="flex gap-2 mt-3 mb-1">
      <div className="flex-1 rounded border border-primary/30 bg-primary/5 p-1.5">
        <div className="flex gap-1">
          {[1,2,3].map(i => <div key={i} className="h-5 flex-1 rounded bg-border/50" />)}
        </div>
        <p className="text-[7px] text-center mt-1 text-primary font-medium">Columns</p>
      </div>
      <div className="flex-1 rounded border border-border/50 bg-muted/30 p-1.5">
        <div className="space-y-1">
          {[1,2].map(i => <div key={i} className="h-2 w-full rounded bg-border/50" />)}
        </div>
        <p className="text-[7px] text-center mt-1 text-muted-foreground">Swimlane</p>
      </div>
      <div className="flex-1 rounded border border-border/50 bg-muted/30 p-1.5">
        <div className="flex items-center gap-0.5">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-2 w-2 rounded-full bg-border/60" />
          ))}
        </div>
        <p className="text-[7px] text-center mt-1 text-muted-foreground">Timeline</p>
      </div>
    </div>
  )
}

function ArchetypeViz() {
  const pillars = [
    { name: "Tech Comfort", value: 0.85 },
    { name: "Price Sensitive", value: 0.4 },
    { name: "Brand Loyal", value: 0.7 },
    { name: "Research Heavy", value: 0.95 },
  ]
  return (
    <div className="mt-4 mb-2 rounded-lg border border-border/50 bg-muted/20 p-3">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-chart-1/30 to-chart-2/30 flex items-center justify-center shrink-0">
          <UserCircle className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-foreground">Tech-Savvy Shopper</p>
          <p className="text-[9px] text-muted-foreground mb-2">Research-driven, values reviews</p>
          <div className="space-y-1.5">
            {pillars.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="text-[7px] text-muted-foreground w-16 truncate">{p.name}</span>
                <div className="flex-1 bg-muted/50 rounded-full h-1.5">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-chart-1 to-chart-2" 
                    style={{width: `${p.value*100}%`}} 
                  />
                </div>
                <span className="text-[7px] text-muted-foreground w-6 text-right">{Math.round(p.value*100)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function AiGenerateViz() {
  return (
    <div className="mt-3 mb-1 rounded border border-primary/20 bg-primary/5 p-2">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Sparkles className="h-3 w-3 text-primary" />
        <span className="text-[8px] text-primary font-medium">René AI</span>
      </div>
      <div className="space-y-1">
        <div className="h-1.5 w-full rounded bg-primary/20" />
        <div className="h-1.5 w-3/4 rounded bg-primary/15" />
        <div className="h-1.5 w-1/2 rounded bg-primary/10" />
      </div>
    </div>
  )
}

function HealthMetricsViz() {
  const metrics = [
    { label: "JIS", value: 72, color: "text-chart-1" },
    { label: "NPS", value: 42, color: "text-chart-2" },
    { label: "CSAT", value: 78, color: "text-chart-4" },
  ]
  return (
    <div className="flex gap-2 mt-3 mb-1">
      {metrics.map(m => (
        <div key={m.label} className="flex-1 rounded border border-border/50 bg-muted/30 p-1.5 text-center">
          <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
          <p className="text-[7px] text-muted-foreground">{m.label}</p>
        </div>
      ))}
    </div>
  )
}

function GapAnalysisViz() {
  return (
    <div className="flex gap-2 mt-3 mb-1">
      <div className="flex-1 rounded border border-border/50 bg-muted/30 p-1.5">
        <p className="text-[7px] text-muted-foreground mb-1">Current</p>
        <div className="h-5 w-full rounded bg-chart-2/30" />
      </div>
      <div className="flex items-center">
        <TrendingUp className="h-3 w-3 text-chart-1" />
      </div>
      <div className="flex-1 rounded border border-chart-1/30 bg-chart-1/10 p-1.5">
        <p className="text-[7px] text-chart-1 mb-1">Future</p>
        <div className="h-5 w-full rounded bg-chart-1/40" />
      </div>
    </div>
  )
}

function TemplatesViz() {
  const templates = [
    { name: "E-Commerce", stages: 5, color: "bg-chart-1", icon: "🛒" },
    { name: "SaaS Onboarding", stages: 4, color: "bg-chart-2", icon: "💻" },
    { name: "Banking", stages: 6, color: "bg-chart-4", icon: "🏦" },
  ]
  return (
    <div className="mt-4 mb-2 space-y-2">
      {templates.map((t) => (
        <div key={t.name} className="flex items-center gap-2 rounded-lg border border-border/50 bg-muted/20 p-2 hover:border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer group">
          <div className={`h-8 w-8 rounded-md ${t.color}/20 flex items-center justify-center text-sm`}>
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium text-foreground truncate">{t.name}</p>
            <p className="text-[8px] text-muted-foreground">{t.stages} stages</p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: t.stages }).map((_, i) => (
              <div key={i} className={`h-1.5 w-1.5 rounded-full ${t.color}/50`} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const features = [
  {
    icon: Route,
    title: "Drag-and-Drop Journey Canvas",
    description:
      "Build structured journey maps with numbered stages and hierarchical steps. Drag stages, reorder steps, and add touch points with channels and sentiment scores.",
    size: "large" as const,
    viz: JourneyPreviewViz,
  },
  {
    icon: LayoutGrid,
    title: "Three Visualization Modes",
    description:
      "Switch between Columns for detailed editing, Swimlane for channel analysis, and Timeline for linear progression. Each view offers a different lens on journey data.",
    size: "large" as const,
    viz: ViewModesViz,
  },
  {
    icon: TrendingUp,
    title: "Emotional Arc Visualization",
    description:
      "Plot customer sentiment across every stage on a smooth curve. Identify emotional highs, pain points, and neutral zones with stage-by-stage scoring.",
    size: "medium" as const,
    viz: EmotionalArcViz,
  },
  {
    icon: UserCircle,
    title: "Customer Archetypes",
    description:
      "Define rich customer profiles with pillar ratings, radar charts, and narrative descriptions. Filter by industry for relevant insights.",
    size: "medium" as const,
    viz: ArchetypeViz,
  },
  {
    icon: Sparkles,
    title: "René AI-Powered Generation",
    description:
      "Describe a journey stage in natural language and let René AI generate steps, touchpoints, pain points, and highlights.",
    size: "medium" as const,
    viz: AiGenerateViz,
  },
  {
    icon: Activity,
    title: "Journey Health Monitoring",
    description:
      "Track Journey Index Score, NPS, CSAT, and CES in real time with trend indicators and period-over-period change.",
    size: "small" as const,
    viz: HealthMetricsViz,
  },
  {
    icon: BarChart3,
    title: "Gap Analysis",
    description:
      "Compare current-state and future-state journeys side by side. Identify gaps and build the business case for CX investment.",
    size: "small" as const,
    viz: GapAnalysisViz,
  },
  {
    icon: GripVertical,
    title: "Templates & Quick Start",
    description:
      "Start from pre-built journey templates for e-commerce, banking, healthcare, SaaS, and more.",
    size: "small" as const,
    viz: TemplatesViz,
  },
]

export function LandingFeatures() {
  return (
    <section id="features" className="scroll-mt-20">
      <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">
            Capabilities
          </p>
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Everything your CX team needs in one place
          </h2>
          <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
            From journey mapping to live health monitoring, Journey Studio gives
            your team the complete toolkit for customer experience management.
          </p>
        </div>

        {/* Bento grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Row 1: two large cards spanning 2 cols each */}
          {features
            .filter((f) => f.size === "large")
            .map((feature) => (
              <Card
                key={feature.title}
                className="border-border/60 transition-colors hover:border-primary/20 hover:bg-accent/30 lg:col-span-2"
              >
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  {feature.viz && <feature.viz />}
                </CardContent>
              </Card>
            ))}

          {/* Row 2: three medium cards */}
          {features
            .filter((f) => f.size === "medium")
            .map((feature, i) => (
              <Card
                key={feature.title}
                className={`border-border/60 transition-colors hover:border-primary/20 hover:bg-accent/30 ${i === 0 ? "lg:col-span-2" : ""}`}
              >
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  {feature.viz && <feature.viz />}
                </CardContent>
              </Card>
            ))}

          {/* Row 3: three small cards */}
          {features
            .filter((f) => f.size === "small")
            .map((feature, i, arr) => (
              <Card
                key={feature.title}
                className={`border-border/60 transition-colors hover:border-primary/20 hover:bg-accent/30 ${i === arr.length - 1 ? "lg:col-span-2" : ""}`}
              >
                <CardContent className="flex flex-col gap-3 p-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-foreground">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                  {feature.viz && <feature.viz />}
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </section>
  )
}
