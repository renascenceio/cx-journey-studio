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

const features = [
  {
    icon: Route,
    title: "Drag-and-Drop Journey Canvas",
    description:
      "Build structured journey maps with numbered stages (1, 2, 3) and hierarchical steps (1.1, 1.2). Toggle edit mode to drag stages left and right, reorder steps up and down, and add touch points with channels and sentiment scores.",
    size: "large" as const,
  },
  {
    icon: LayoutGrid,
    title: "Three Visualization Modes",
    description:
      "Switch between Columns for detailed stage editing, Swimlane for channel-by-stage analysis, and Timeline for a linear node-chain progression. Each view offers a different lens on the same journey data.",
    size: "large" as const,
  },
  {
    icon: TrendingUp,
    title: "Emotional Arc Visualization",
    description:
      "Plot customer sentiment across every stage on a smooth, interactive curve. Identify emotional highs, pain points, and neutral zones at a glance with stage-by-stage scoring from -5 to +5.",
    size: "medium" as const,
  },
  {
    icon: UserCircle,
    title: "Customer Archetypes",
    description:
      "Define rich customer profiles with pillar ratings, radar charts, narrative descriptions (I am / I want / I do / I use), expectations, barriers, drivers, mindset, and solution principles. Filter by industry -- e-commerce, banking, healthcare, real estate, and more.",
    size: "medium" as const,
  },
  {
    icon: Sparkles,
    title: "René AI-Powered Generation",
    description:
      "Describe a journey stage in natural language and let René AI generate steps, touchpoints, pain points, and highlights. Review the output, tweak it, then add to your canvas.",
    size: "medium" as const,
  },
  {
    icon: Activity,
    title: "Journey Health Monitoring",
    description:
      "Track Journey Index Score, NPS, CSAT, and CES in real time with trend indicators and period-over-period change. Drill into touch point-level performance and health status alerts.",
    size: "small" as const,
  },
  {
    icon: BarChart3,
    title: "Gap Analysis",
    description:
      "Compare current-state and future-state journeys side by side. Identify opportunity gaps, prioritize improvements, and build the business case for CX investment.",
    size: "small" as const,
  },
  {
    icon: GripVertical,
    title: "Templates & Quick Start",
    description:
      "Start from pre-built journey templates for e-commerce, banking, healthcare, SaaS, and more. Customize stages, steps, and touch points to match your organization.",
    size: "small" as const,
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
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </section>
  )
}
