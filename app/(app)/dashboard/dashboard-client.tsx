"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Route,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Plus,
  BookTemplate,
  ArrowRight,
  BarChart3,
  Target,
  FileQuestion,
  LayoutDashboard,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatCard } from "@/components/stat-card"
import { JourneyCard } from "@/components/journey-card"
import { CreateJourneyDialog } from "@/components/create-journey-dialog"
import { getInitials, cn } from "@/lib/utils"
import type { Journey } from "@/lib/types"

interface JourneyPerformance {
  id: string
  name: string
  score: number
  touchPoints: number
  painPoints: number
  status: string
}

interface DashboardClientProps {
  currentUserName: string
  recentJourneys: Journey[]
  activityLog: Array<{
    id: string
    actorName: string | null
    details: string
    timestamp: string
  }>
  dashboardStats: {
    totalJourneys: number
    activeCollaborators: number
    avgEmotionalScore: number
    avgEmotionalScoreTrend: number
    deployedJourneys: number
    healthyDeployed: number
  }
  activeTab: string
  analyticsData: {
    journeyPerformance: JourneyPerformance[]
    totalTouchPoints: number
    totalPainPoints: number
  }
}

function scoreColor(score: number) {
  if (score >= 2) return "text-green-600 dark:text-green-400"
  if (score >= 0) return "text-emerald-600 dark:text-emerald-400"
  if (score >= -1) return "text-yellow-600 dark:text-yellow-400"
  return "text-red-600 dark:text-red-400"
}

export function DashboardClient({
  currentUserName,
  recentJourneys,
  activityLog,
  dashboardStats,
  activeTab,
  analyticsData,
}: DashboardClientProps) {
  const t = useTranslations()
  const router = useRouter()

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  
  const handleTabChange = (value: string) => {
    router.push(`/dashboard${value === "overview" ? "" : `?tab=${value}`}`)
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      {/* Header with Tabs */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("dashboard.welcome")}, {currentUserName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="overview" className="gap-1.5">
                <LayoutDashboard className="h-4 w-4" />
                {t("dashboard.overview")}
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-1.5">
                <BarChart3 className="h-4 w-4" />
                {t("analytics.title")}
              </TabsTrigger>
            </TabsList>
          </Tabs>
      </div>

      {activeTab === "overview" ? (
        <>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("dashboard.stats.totalJourneys")}
          value={dashboardStats.totalJourneys}
          icon={Route}
        />
        <StatCard
          title={t("dashboard.stats.activeCollaborators")}
          value={dashboardStats.activeCollaborators}
          icon={Users}
        />
        <StatCard
          title={t("dashboard.stats.avgEmotionalScore")}
          value={dashboardStats.avgEmotionalScore.toFixed(1)}
          icon={TrendingUp}
          trend={{
            value: dashboardStats.avgEmotionalScoreTrend,
            label: t("dashboard.stats.vsLastMonth"),
          }}
        />
        <StatCard
          title={t("dashboard.stats.deployedJourneys")}
          value={dashboardStats.deployedJourneys}
          icon={Activity}
          description={`${dashboardStats.healthyDeployed} ${t("dashboard.stats.healthy")}`}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Journeys */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {t("dashboard.recentJourneys")}
            </h2>
            {recentJourneys.length > 0 && (
              <Button variant="ghost" size="sm" asChild>
                <Link href="/journeys">
                  {t("common.viewAll")}
                  <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            )}
          </div>
          {recentJourneys.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {recentJourneys.map((journey) => (
                <JourneyCard key={journey.id} journey={journey} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-4">
                  <Route className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {t("dashboard.noJourneys")}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-xs">
                  {t("dashboard.noJourneysDesc")}
                </p>
                <CreateJourneyDialog>
                  <Button size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("dashboard.createJourney")}
                  </Button>
                </CreateJourneyDialog>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Feed */}
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t("dashboard.recentActivity")}
          </h2>
          <Card className="border-border/60">
            <CardContent className="flex flex-col gap-0 p-0">
              {activityLog.length > 0 ? (
                activityLog.slice(0, 5).map((entry, index) => (
                  <div
                    key={entry.id}
                    className={`flex items-start gap-3 px-4 py-3.5 ${
                      index < Math.min(activityLog.length, 5) - 1
                        ? "border-b border-border/60"
                        : ""
                    }`}
                  >
                    <Avatar className="mt-0.5 h-7 w-7 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">
                        {entry.actorName ? getInitials(entry.actorName) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-0.5">
                      <p className="text-xs leading-relaxed text-foreground">
                        {entry.details}
                      </p>
                      <time className="text-[11px] text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleDateString(
                          undefined,
                          {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                          }
                        )}
                      </time>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                  <Activity className="h-8 w-8 text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">{t("dashboard.noActivity")}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {t("dashboard.noActivityDesc")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-foreground">{t("dashboard.quickActions")}</h2>
        <div className="flex flex-wrap gap-3">
          <CreateJourneyDialog>
            <Button variant="outline">
              <Plus className="mr-2 h-4 w-4" />
              {t("dashboard.newJourney")}
            </Button>
          </CreateJourneyDialog>
          <Button variant="outline" asChild>
            <Link href="/templates">
              <BookTemplate className="mr-2 h-4 w-4" />
              {t("dashboard.browseTemplates")}
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/solutions">
              <TrendingUp className="mr-2 h-4 w-4" />
              {t("dashboard.viewSolutions")}
            </Link>
          </Button>
        </div>
      </div>
      </>
      ) : (
        /* Analytics Tab */
        <>
          {/* Analytics Stats row */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title={t("analytics.totalJourneys")}
              value={dashboardStats.totalJourneys}
              icon={Route}
            />
            <StatCard
              title={t("analytics.activeUsers")}
              value={dashboardStats.activeCollaborators}
              icon={Users}
            />
            <StatCard
              title={t("analytics.avgEmotionalScore")}
              value={dashboardStats.avgEmotionalScore > 0 ? `+${dashboardStats.avgEmotionalScore.toFixed(1)}` : dashboardStats.avgEmotionalScore.toFixed(1)}
              icon={TrendingUp}
            />
            <StatCard
              title={t("analytics.painPointsIdentified")}
              value={analyticsData.totalPainPoints}
              icon={Target}
            />
          </div>

          {/* Journey Performance Table */}
          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                {t("analytics.journeyPerformance")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analyticsData.journeyPerformance.length > 0 ? (
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
                      {analyticsData.journeyPerformance.map((jp) => (
                        <tr key={jp.id} className="border-b border-border/40">
                          <td className="py-3 pr-4">
                            <Link href={`/journeys/${jp.id}/canvas`} className="font-medium text-foreground hover:text-primary transition-colors">
                              {jp.name}
                            </Link>
                          </td>
                          <td className={cn("py-3 pr-4 text-right font-mono font-bold", scoreColor(jp.score))}>
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
                  <CreateJourneyDialog>
                    <Button>{t("dashboard.createJourney")}</Button>
                  </CreateJourneyDialog>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Placeholder Charts */}
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
        </>
      )}
    </div>
  )
}
