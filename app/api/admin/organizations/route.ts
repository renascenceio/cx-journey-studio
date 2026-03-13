import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  
  // Check if super admin
  const { data: profile } = await supabase.from("profiles").select("email, role").eq("id", user.id).single()
  if (!profile) return null
  
  // Only super admin or admin role can access
  if (profile.email !== SUPER_ADMIN_EMAIL && profile.role !== "admin" && profile.role !== "journey_master") {
    return null
  }
  
  return user.id
}

export async function GET() {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  // Get all organizations
  const { data: orgs } = await supabase
    .from("organizations")
    .select("*")
    .order("created_at", { ascending: false })

  if (!orgs) {
    return NextResponse.json({ organizations: [] })
  }

  // Get counts for each organization
  const organizations = await Promise.all(orgs.map(async (org) => {
    // Get user count
    const { count: userCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)

    // Get workspace (team) count
    const { count: workspaceCount } = await supabase
      .from("teams")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)

    // Get journey count
    const { count: journeyCount } = await supabase
      .from("journeys")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", org.id)

    // Get last journey activity
    const { data: lastJourney } = await supabase
      .from("journeys")
      .select("updated_at")
      .eq("organization_id", org.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .single()

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      logo: org.logo,
      plan: org.plan,
      created_at: org.created_at,
      userCount: userCount || 0,
      workspaceCount: workspaceCount || 0,
      journeyCount: journeyCount || 0,
      totalPayments: 0, // Would come from Stripe integration
      monthlyExpenses: org.plan === "free" ? 0 : org.plan === "pro" ? 49 : 199,
      creditsBalance: 1000, // Placeholder
      invoiceCount: 0, // Would come from Stripe
      mainLanguage: "English",
      languages: ["en"],
      lastActivityAt: lastJourney?.updated_at || null,
    }
  }))

  return NextResponse.json({ organizations })
}
