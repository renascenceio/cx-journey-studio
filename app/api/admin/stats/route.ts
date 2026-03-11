import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Verify admin role
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || (profile.role !== "admin" && profile.role !== "journey_master")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [users, journeys, templates, orgs, activity] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("journeys").select("id", { count: "exact", head: true }),
    supabase.from("journey_templates").select("id", { count: "exact", head: true }),
    supabase.from("organizations").select("id", { count: "exact", head: true }),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(10),
  ])

  return NextResponse.json({
    totalUsers: users.count ?? 0,
    totalJourneys: journeys.count ?? 0,
    totalTemplates: templates.count ?? 0,
    totalOrgs: orgs.count ?? 0,
    activeSessions: 0,
    mrr: 0,
    recentActivity: (activity.data || []).map((a) => ({
      id: a.id,
      action: a.action,
      details: a.details,
      timestamp: a.created_at,
    })),
  })
}
