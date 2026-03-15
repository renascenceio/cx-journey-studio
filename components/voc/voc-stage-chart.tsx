"use client"

import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { VoCStageMetric } from "@/lib/types"

interface VoCStageChartProps {
  stages: VoCStageMetric[]
  metric: "nps" | "csat" | "ces" | "sentiment"
}

export function VoCStageChart({ stages, metric }: VoCStageChartProps) {
  const chartData = stages.map(stage => ({
    name: stage.stageName.length > 12 ? stage.stageName.slice(0, 12) + "..." : stage.stageName,
    fullName: stage.stageName,
    value: stage[metric],
    feedbackCount: stage.feedbackCount,
  }))

  const metricConfig = {
    nps: {
      label: "NPS Score",
      color: "#3b82f6",
      domain: [-100, 100] as [number, number],
      reference: 0,
    },
    csat: {
      label: "CSAT Score",
      color: "#10b981",
      domain: [0, 5] as [number, number],
      reference: 3,
    },
    ces: {
      label: "CES Score",
      color: "#f59e0b",
      domain: [1, 7] as [number, number],
      reference: 4,
    },
    sentiment: {
      label: "Sentiment",
      color: "#8b5cf6",
      domain: [0, 1] as [number, number],
      reference: 0.5,
    },
  }

  const config = metricConfig[metric]

  return (
    <Card>
      <CardHeader>
        <CardTitle>{config.label} by Stage</CardTitle>
        <CardDescription>
          Performance across journey stages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer
          config={{
            value: {
              label: config.label,
              color: config.color,
            },
          }}
          className="h-[300px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis 
                domain={config.domain}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => (
                      <div className="flex flex-col gap-1">
                        <span className="font-medium">{item.payload.fullName}</span>
                        <span>{config.label}: {typeof value === 'number' ? value.toFixed(1) : value}</span>
                        <span className="text-muted-foreground text-xs">
                          {item.payload.feedbackCount} responses
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <ReferenceLine 
                y={config.reference} 
                stroke="#888" 
                strokeDasharray="3 3"
                label={{ value: "Target", position: "right", fontSize: 10 }}
              />
              <Bar
                dataKey="value"
                fill={config.color}
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
