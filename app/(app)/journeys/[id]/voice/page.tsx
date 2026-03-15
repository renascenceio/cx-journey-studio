"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { BarChart3, Database, MessageSquare, Activity, Info } from "lucide-react"
import { VoCMetricCards } from "@/components/voc/voc-metric-cards"
import { VoCStageChart } from "@/components/voc/voc-stage-chart"
import { VoCJourneyTree } from "@/components/voc/voc-journey-tree"
import { VoCFeedbackList } from "@/components/voc/voc-feedback-list"
import { VoCDataSourceManager } from "@/components/voc/voc-data-source-manager"
import type { VoCJourneyStats, VoCDataSource } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then(res => res.json())

export default function VoicePage() {
  const params = useParams()
  const journeyId = params.id as string
  const [chartMetric, setChartMetric] = useState<"nps" | "csat" | "ces" | "sentiment">("nps")
  
  // Fetch journey details
  const { data: journeyData } = useSWR(
    journeyId ? `/api/journeys/${journeyId}` : null,
    fetcher
  )
  
  // Fetch VoC metrics
  const { data: metricsData, error: metricsError, isLoading: metricsLoading, mutate: mutateMetrics } = useSWR<{ stats: VoCJourneyStats; isDemo: boolean }>(
    journeyId ? `/api/voc/metrics?journeyId=${journeyId}` : null,
    fetcher
  )
  
  // Fetch data sources
  const { data: sourcesData, mutate: mutateSources } = useSWR<{ dataSources: VoCDataSource[] }>(
    journeyId ? `/api/voc/data-sources?journeyId=${journeyId}` : null,
    fetcher
  )

  const stats = metricsData?.stats
  const isDemo = metricsData?.isDemo
  const dataSources = sourcesData?.dataSources || []
  const organizationId = journeyData?.journey?.organizationId || ""

  if (metricsLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (metricsError) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error loading VoC data</AlertTitle>
          <AlertDescription>
            Failed to load Voice of Customer metrics. Please try again.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Activity className="h-6 w-6 text-primary" />
            Voice of Customer
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track customer feedback and satisfaction across the journey
          </p>
        </div>
        {isDemo && (
          <Badge variant="secondary" className="gap-1">
            <Info className="h-3 w-3" />
            Demo Data
          </Badge>
        )}
      </div>

      {/* Demo Alert */}
      {isDemo && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Demo Mode</AlertTitle>
          <AlertDescription>
            You&apos;re viewing sample VoC data. Connect a data source to see your actual customer feedback.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Database className="h-4 w-4" />
            Data Sources
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Metric Cards */}
          {stats && (
            <VoCMetricCards
              nps={stats.overallNps}
              npsChange={stats.npsChange}
              npsSampleSize={stats.npsSampleSize}
              csat={stats.overallCsat}
              csatChange={stats.csatChange}
              csatSampleSize={stats.csatSampleSize}
              ces={stats.overallCes}
              cesChange={stats.cesChange}
              cesSampleSize={stats.cesSampleSize}
              sentiment={stats.overallSentiment}
              sentimentChange={stats.sentimentChange}
            />
          )}

          {/* Chart and Tree */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Stage Chart */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Performance by Stage</h3>
                <Select value={chartMetric} onValueChange={(v) => setChartMetric(v as any)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nps">NPS</SelectItem>
                    <SelectItem value="csat">CSAT</SelectItem>
                    <SelectItem value="ces">CES</SelectItem>
                    <SelectItem value="sentiment">Sentiment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {stats && stats.stageMetrics.length > 0 && (
                <VoCStageChart stages={stats.stageMetrics} metric={chartMetric} />
              )}
            </div>

            {/* Journey Tree */}
            {stats && (
              <VoCJourneyTree 
                stages={stats.stageMetrics}
                onSelectElement={(type, id) => {
                  console.log("Selected:", type, id)
                }}
              />
            )}
          </div>

          {/* Recent Feedback Preview */}
          {stats && stats.recentFeedback.length > 0 && (
            <VoCFeedbackList feedback={stats.recentFeedback} maxHeight="300px" />
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-6">
          {stats ? (
            <VoCFeedbackList feedback={stats.recentFeedback} maxHeight="600px" />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              No feedback data available. Connect a data source to import customer feedback.
            </div>
          )}
        </TabsContent>

        {/* Data Sources Tab */}
        <TabsContent value="sources" className="space-y-6">
          <VoCDataSourceManager
            dataSources={dataSources}
            journeyId={journeyId}
            organizationId={organizationId}
            onRefresh={() => {
              mutateSources()
              mutateMetrics()
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
