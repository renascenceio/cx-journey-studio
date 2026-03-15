"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, TrendingDown, Minus, ThumbsUp, Gauge, Scale } from "lucide-react"
import { cn } from "@/lib/utils"

interface MetricCardProps {
  title: string
  value: number | null
  change: number | null
  sampleSize: number
  format: "nps" | "csat" | "ces" | "sentiment"
  icon?: React.ReactNode
}

function formatValue(value: number | null, format: string): string {
  if (value === null) return "N/A"
  
  switch (format) {
    case "nps":
      return value > 0 ? `+${value.toFixed(0)}` : value.toFixed(0)
    case "csat":
      return value.toFixed(1)
    case "ces":
      return value.toFixed(1)
    case "sentiment":
      return `${(value * 100).toFixed(0)}%`
    default:
      return value.toString()
  }
}

function getChangeColor(change: number | null, format: string): string {
  if (change === null) return "text-muted-foreground"
  
  // For CES, lower is better
  if (format === "ces") {
    return change < 0 ? "text-green-600" : change > 0 ? "text-red-600" : "text-muted-foreground"
  }
  
  // For NPS, CSAT, sentiment - higher is better
  return change > 0 ? "text-green-600" : change < 0 ? "text-red-600" : "text-muted-foreground"
}

function getScoreColor(value: number | null, format: string): string {
  if (value === null) return "text-muted-foreground"
  
  switch (format) {
    case "nps":
      if (value >= 50) return "text-green-600"
      if (value >= 0) return "text-amber-600"
      return "text-red-600"
    case "csat":
      if (value >= 4) return "text-green-600"
      if (value >= 3) return "text-amber-600"
      return "text-red-600"
    case "ces":
      if (value <= 3) return "text-green-600"
      if (value <= 5) return "text-amber-600"
      return "text-red-600"
    case "sentiment":
      if (value >= 0.6) return "text-green-600"
      if (value >= 0.4) return "text-amber-600"
      return "text-red-600"
    default:
      return ""
  }
}

function MetricCard({ title, value, change, sampleSize, format, icon }: MetricCardProps) {
  const TrendIcon = change === null ? Minus : change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus
  const changeColor = getChangeColor(change, format)
  const valueColor = getScoreColor(value, format)
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={cn("text-2xl font-bold", valueColor)}>
          {formatValue(value, format)}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
          <span className={cn("flex items-center gap-0.5", changeColor)}>
            <TrendIcon className="h-3 w-3" />
            {change !== null ? (
              format === "sentiment" 
                ? `${change > 0 ? "+" : ""}${(change * 100).toFixed(0)}%`
                : `${change > 0 ? "+" : ""}${change.toFixed(1)}`
            ) : "—"}
          </span>
          <span>vs last period</span>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {sampleSize.toLocaleString()} responses
        </div>
      </CardContent>
    </Card>
  )
}

interface VoCMetricCardsProps {
  nps: number | null
  npsChange: number | null
  npsSampleSize: number
  csat: number | null
  csatChange: number | null
  csatSampleSize: number
  ces: number | null
  cesChange: number | null
  cesSampleSize: number
  sentiment: number | null
  sentimentChange: number | null
}

export function VoCMetricCards({
  nps,
  npsChange,
  npsSampleSize,
  csat,
  csatChange,
  csatSampleSize,
  ces,
  cesChange,
  cesSampleSize,
  sentiment,
  sentimentChange,
}: VoCMetricCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard
        title="Net Promoter Score"
        value={nps}
        change={npsChange}
        sampleSize={npsSampleSize}
        format="nps"
        icon={<ThumbsUp className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Customer Satisfaction"
        value={csat}
        change={csatChange}
        sampleSize={csatSampleSize}
        format="csat"
        icon={<Gauge className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Customer Effort Score"
        value={ces}
        change={cesChange}
        sampleSize={cesSampleSize}
        format="ces"
        icon={<Scale className="h-4 w-4 text-muted-foreground" />}
      />
      <MetricCard
        title="Overall Sentiment"
        value={sentiment}
        change={sentimentChange}
        sampleSize={npsSampleSize}
        format="sentiment"
        icon={
          <div className={cn(
            "h-4 w-4 rounded-full",
            sentiment !== null && sentiment >= 0.6 ? "bg-green-500" :
            sentiment !== null && sentiment >= 0.4 ? "bg-amber-500" : "bg-red-500"
          )} />
        }
      />
    </div>
  )
}
