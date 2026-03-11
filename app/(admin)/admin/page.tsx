"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Route, BookTemplate, CreditCard, Activity, TrendingUp, Database, Loader2 } from "lucide-react"
import { toast } from "sonner"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function AdminOverviewPage() {
  const t = useTranslations()
  const { data: stats, mutate } = useSWR("/api/admin/stats", fetcher)
  const [seeding, setSeeding] = useState(false)

  async function handleSeedDemo() {
    setSeeding(true)
    try {
      const res = await fetch("/api/admin/seed-demo", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Demo data seeded: ${data.created?.journeys || 0} journeys, ${data.created?.archetypes || 0} archetypes, ${data.created?.solutions || 0} solutions created`)
        mutate()
      } else {
        toast.error(data.error || "Seed failed")
      }
    } catch { toast.error("Failed to seed demo data") }
    finally { setSeeding(false) }
  }

  const cards = [
    { label: t("admin.stats.totalUsers"), value: stats?.totalUsers ?? "--", icon: Users, description: t("admin.stats.registeredAccounts"), color: "text-blue-500" },
    { label: t("admin.stats.totalJourneys"), value: stats?.totalJourneys ?? "--", icon: Route, description: t("admin.stats.acrossAllOrgs"), color: "text-emerald-500" },
    { label: t("admin.stats.templates"), value: stats?.totalTemplates ?? "--", icon: BookTemplate, description: t("admin.stats.availableTemplates"), color: "text-amber-500" },
    { label: t("admin.stats.organizations"), value: stats?.totalOrgs ?? "--", icon: Activity, description: t("admin.stats.activeWorkspaces"), color: "text-primary" },
    { label: t("admin.stats.activeSessions"), value: stats?.activeSessions ?? "--", icon: TrendingUp, description: t("admin.stats.last24Hours"), color: "text-green-500" },
    { label: t("admin.stats.revenueMrr"), value: stats?.mrr ? `$${stats.mrr}` : "--", icon: CreditCard, description: t("admin.stats.monthlyRecurring"), color: "text-pink-500" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("admin.overview")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("admin.overviewDesc")}</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={handleSeedDemo} disabled={seeding}>
          {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
          {seeding ? t("admin.seeding") : t("admin.seedDemoData")}
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Card key={card.label} className="border-border/60">
            <CardContent className="flex items-start gap-4 p-5">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{card.value}</p>
                <p className="text-sm font-medium text-foreground">{card.label}</p>
                <p className="text-xs text-muted-foreground">{card.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent activity */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("admin.recentPlatformActivity")}</CardTitle>
          <CardDescription>{t("admin.latestActionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          {!stats?.recentActivity || stats.recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t("admin.noRecentActivity")}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {stats.recentActivity.map((entry: { id: string; details: string; action: string; timestamp: string }) => (
                <div key={entry.id} className="flex items-start justify-between rounded-lg border border-border/50 p-3">
                  <div>
                    <p className="text-sm text-foreground">{entry.details}</p>
                    <Badge variant="secondary" className="mt-1 text-[10px]">{entry.action}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(entry.timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
