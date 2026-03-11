"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import {
  Route,
  Users,
  TrendingUp,
  Activity,
  Plus,
  BookTemplate,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { StatCard } from "@/components/stat-card"
import { JourneyCard } from "@/components/journey-card"
import { CreateJourneyDialog } from "@/components/create-journey-dialog"
import { getInitials } from "@/lib/utils"
import type { Journey } from "@/lib/types"

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
}

export function DashboardClient({
  currentUserName,
  recentJourneys,
  activityLog,
  dashboardStats,
}: DashboardClientProps) {
  const t = useTranslations()

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-6 lg:px-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {t("dashboard.welcome")}, {currentUserName.split(" ")[0]}
          </h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
        <CreateJourneyDialog>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {t("dashboard.newJourney")}
          </Button>
        </CreateJourneyDialog>
      </div>

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
    </div>
  )
}
