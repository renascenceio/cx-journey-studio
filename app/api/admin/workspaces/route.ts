import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  const { data: profile } = await supabase.from("profiles").select("email, role").eq("id", user.id).single()
  if (!profile) return null
  
  if (profile.email !== SUPER_ADMIN_EMAIL && profile.role !== "admin" && profile.role !== "journey_master") {
    return null
  }
  
  return user.id
}

export async function GET() {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Get all teams (workspaces) with organization info
  const { data: teams } = await supabase
    .from("teams")
    .select(`
      *,
      organizations (
        id,
        name,
        logo
      )
    `)
    .order("created_at", { ascending: false })

  if (!teams) {
    return NextResponse.json({ workspaces: [] })
  }

  // Get counts for each workspace
  const workspaces = await Promise.all(teams.map(async (team) => {
    // Get member count
    const { count: memberCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)

    // Get journey count
    const { count: journeyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)

    // Get active journey count
    const { count: activeJourneyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)
      .in("status", ["draft", "in_progress", "review"])

    // Get completed journey count
    const { count: completedJourneyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("team_id", team.id)
      .in("status", ["approved", "deployed"])

    // Get last activity
    const { data: lastJourney } = await supabase
      .from("journeys")
      .select("updated_at")
      .eq("team_id", team.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    const org = team.organizations as { id: string; name: string; logo: string | null } | null

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      organization_id: team.organization_id,
      organization_name: org?.name || "Unknown",
      organization_logo: org?.logo || null,
      created_at: team.created_at,
      memberCount: memberCount || 0,
      journeyCount: journeyCount || 0,
      activeJourneyCount: activeJourneyCount || 0,
      completedJourneyCount: completedJourneyCount || 0,
      lastActivityAt: lastJourney?.updated_at || null,
      creatorName: "Unknown", // Would need to track this
      creatorEmail: "",
    }
  }))

  return NextResponse.json({ workspaces })
}
