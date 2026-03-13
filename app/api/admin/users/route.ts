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

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, avatar, role, organization_id, created_at, organizations(name)")
    .order("created_at", { ascending: false })

  // Get extended data for each user
  const users = await Promise.all((profiles || []).map(async (p) => {
    // Get journey count
    const { count: journeyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("owner_id", p.id)

    // Get workspace count (teams user is member of)
    const { count: workspaceCount } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("user_id", p.id)

    // Get last journey activity
    const { data: lastJourney } = await supabase
      .from("journeys")
      .select("updated_at")
      .eq("owner_id", p.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return {
      id: p.id,
      name: p.name || "Unknown",
      email: p.email || "",
      avatar: p.avatar || null,
      role: p.role || "contributor",
      orgName: (p.organizations as { name: string } | null)?.name || "",
      orgId: p.organization_id,
      createdAt: p.created_at,
      lastLoginAt: null, // Would come from auth logs
      journeyCount: journeyCount || 0,
      workspaceCount: workspaceCount || 0,
      creditsUsed: 0, // Placeholder
      creditsBalance: 100, // Placeholder
      language: "English",
      timezone: "UTC",
      country: null,
      lastActivityAt: lastJourney?.updated_at || null,
      isActive: true,
    }
  }))

  return NextResponse.json({ users })
}
