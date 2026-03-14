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

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const activeTab = params.tab || "overview"
  
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

  // Prepare analytics data
  const journeyPerformance = allJourneys
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

  const totalTouchPoints = allJourneys.reduce((sum, j) => 
    sum + j.stages.flatMap(s => s.steps.flatMap(st => st.touchPoints)).length, 0
  )
  const totalPainPoints = allJourneys.reduce((sum, j) => 
    sum + j.stages.flatMap(s => s.steps.flatMap(st => st.touchPoints.flatMap(tp => tp.painPoints))).length, 0
  )

  return (
    <DashboardClient
      currentUserName={currentUserName}
      recentJourneys={recentJourneys}
      activityLog={activityLog}
      dashboardStats={dashboardStats}
      activeTab={activeTab}
      analyticsData={{
        journeyPerformance,
        totalTouchPoints,
        totalPainPoints,
      }}
    />
  )
}
