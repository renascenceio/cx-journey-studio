import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Route,
  Activity,
  Target,
  FileQuestion,
} from "lucide-react"
import { getJourneys, getUsers, getDashboardStats } from "@/lib/data"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getTranslations } from "next-intl/server"

function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  iconType 
}: { 
  title: string
  value: string
  change?: string
  trend?: "up" | "down"
  iconType: "route" | "users" | "trending" | "target"
}) {
  return (
    <Card className="border-border/60">
      <CardContent className="flex items-start justify-between p-5">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">{title}</span>
          <span className="text-2xl font-bold text-foreground">{value}</span>
          {change && trend && (
            <span className={`flex items-center gap-1 text-xs ${trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {change}
            </span>
          )}
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          {iconType === "route" && <Route className="h-5 w-5 text-primary" />}
          {iconType === "users" && <Users className="h-5 w-5 text-primary" />}
          {iconType === "trending" && <TrendingUp className="h-5 w-5 text-primary" />}
          {iconType === "target" && <Target className="h-5 w-5 text-primary" />}
        </div>
      </CardContent>
    </Card>
  )
}

function scoreColor(score: number) {
  if (score >= 2) return "text-green-600 dark:text-green-400"
  if (score >= 0) return "text-emerald-600 dark:text-emerald-400"
  if (score >= -1) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export default async function AnalyticsPage() {
  const [journeys, users, stats, t] = await Promise.all([
    getJourneys(),
    getUsers(),
    getDashboardStats(),
    getTranslations(),
  ])

  // Calculate journey performance metrics
  const journeyPerformance = journeys
    .filter(j => j.type !== "template")
    .slice(0, 10)
    .map(journey => {
      const touchPoints = journey.stages.flatMap(s => 
        s.steps.flatMap(st => st.touchPoints)
      )
      const avgScore = touchPoints.length > 0 
        ? touchPoints.reduce((sum, tp) => sum + tp.emotionalScore, 0) / touchPoints.length 
        : 0
      const painPoints = journey.stages.flatMap(s => 
        s.steps.flatMap(st => st.touchPoints.flatMap(tp => tp.painPoints))
      ).length
      
      return {
        id: journey.id,
        name: journey.title,
        score: avgScore,
        touchPoints: touchPoints.length,
        painPoints,
        status: journey.status,
      }
    })

  // Calculate aggregate stats
  const totalTouchPoints = journeys.reduce((sum, j) => 
    sum + j.stages.flatMap(s => s.steps.flatMap(st => st.touchPoints)).length, 0
  )
  const totalPainPoints = journeys.reduce((sum, j) => 
    sum + j.stages.flatMap(s => s.steps.flatMap(st => st.touchPoints.flatMap(tp => tp.painPoints))).length, 0
  )
  const allScores = journeys.flatMap(j => 
    j.stages.flatMap(s => s.steps.flatMap(st => st.touchPoints.map(tp => tp.emotionalScore)))
  )
  const avgEmotionalScore = allScores.length > 0 
    ? allScores.reduce((a, b) => a + b, 0) / allScores.length 
    : 0

  const hasData = journeys.length > 0

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {t("analytics.title")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {t("analytics.subtitle")}
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard 
          title={t("analytics.totalJourneys")} 
          value={stats.totalJourneys.toString()} 
          iconType="route" 
        />
        <MetricCard 
          title={t("analytics.activeUsers")} 
          value={stats.activeCollaborators.toString()} 
          iconType="users" 
        />
        <MetricCard 
          title={t("analytics.avgEmotionalScore")} 
          value={avgEmotionalScore > 0 ? `+${avgEmotionalScore.toFixed(1)}` : avgEmotionalScore.toFixed(1)} 
          iconType="trending" 
        />
        <MetricCard 
          title={t("analytics.painPointsIdentified")} 
          value={totalPainPoints.toString()} 
          iconType="target" 
        />
      </div>

      {/* Journey performance table */}
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            {t("analytics.journeyPerformance")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {hasData ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="py-3 pr-4">{t("analytics.journey")}</th>
                    <th className="py-3 pr-4 text-right">{t("analytics.score")}</th>
                    <th className="py-3 pr-4 text-right">{t("analytics.touchpoints")}</th>
                    <th className="py-3 pr-4 text-right">{t("analytics.painPoints")}</th>
                    <th className="py-3">{t("analytics.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {journeyPerformance.map((jp) => (
                    <tr key={jp.id} className="border-b border-border/40">
                      <td className="py-3 pr-4">
                        <Link href={`/journeys/${jp.id}/canvas`} className="font-medium text-foreground hover:text-primary transition-colors">
                          {jp.name}
                        </Link>
                      </td>
                      <td className={`py-3 pr-4 text-right font-mono font-bold ${scoreColor(jp.score)}`}>
                        {jp.score > 0 ? "+" : ""}{jp.score.toFixed(1)}
                      </td>
                      <td className="py-3 pr-4 text-right text-muted-foreground">{jp.touchPoints}</td>
                      <td className="py-3 pr-4 text-right text-red-500">{jp.painPoints}</td>
                      <td className="py-3">
                        <Badge variant="secondary" className="text-[10px] capitalize">
                          {jp.status.replace("_", " ")}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileQuestion className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">{t("analytics.noJourneys")}</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t("analytics.noJourneysDesc")}
              </p>
              <Button asChild>
                <Link href="/journeys">{t("dashboard.createJourney")}</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Placeholder for charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Activity className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics.emotionalScoreTrends")}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t("analytics.emotionalScoreTrendsDesc")}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <BarChart3 className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">
              {t("analytics.channelDistribution")}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {t("analytics.channelDistributionDesc")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
