import type { Metadata } from "next"
import {
  getJourneys,
  getActivityLog,
  getDashboardStats,
} from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { DashboardClient } from "./dashboard-client"

export const metadata: Metadata = {
  title: "Dashboard",
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const [allJourneys, activityLog, dashboardStats, profile] = await Promise.all([
    getJourneys(),
    getActivityLog(),
    getDashboardStats(),
    authUser
      ? supabase
          .from("profiles")
          .select("name")
          .eq("id", authUser.id)
          .single()
          .then((r) => r.data)
      : null,
  ])

  const currentUserName = profile?.name || authUser?.email?.split("@")[0] || "User"

  const recentJourneys = allJourneys
    .filter((j) => j.type !== "template")
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 3)

  return (
    <DashboardClient
      currentUserName={currentUserName}
      recentJourneys={recentJourneys}
      activityLog={activityLog}
      dashboardStats={dashboardStats}
    />
  )
}
