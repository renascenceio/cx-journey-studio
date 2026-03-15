import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET: Fetch all workspaces for the current user
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ workspaces: [], activeWorkspaceId: null })
  }

  // Use admin client to bypass RLS for reading organization memberships
  const adminClient = createAdminClient()

  // Get user's profile to know their active workspace
  const { data: profile } = await adminClient
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  // Get all organization memberships for this user (using admin client to bypass RLS)
  const { data: memberships } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)

  const orgIds = memberships?.map((m) => m.organization_id) ?? []
  
  // Also include the profile's org if not already in the list
  if (profile?.organization_id && !orgIds.includes(profile.organization_id)) {
    orgIds.unshift(profile.organization_id)
  }

  if (orgIds.length === 0) {
    return NextResponse.json({ workspaces: [], activeWorkspaceId: null })
  }

  // Get all organizations with payment, trial, and AI settings
  const { data: orgs } = await adminClient
    .from("organizations")
    .select("id, name, slug, plan, logo, created_at, preferred_ai_model, ai_settings, payment_failed_at, grace_period_ends_at, previous_plan_id, stripe_customer_id, stripe_subscription_id, subscription_status, trial_started_at, trial_ends_at")
    .in("id", orgIds)

  if (!orgs || orgs.length === 0) {
    return NextResponse.json({ workspaces: [], activeWorkspaceId: null })
  }

  // Get counts, credits, and other data for each org
  const workspaces = await Promise.all(
    orgs.map(async (org) => {
      const [journeyCount, memberCount, creditsData] = await Promise.all([
        adminClient.from("journeys").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
        adminClient.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", org.id),
        adminClient.from("ai_credits").select("credits_used, credits_monthly_allowance, credits_purchased").eq("organization_id", org.id).single(),
      ])
      
      // Build credits object
      const credits = creditsData.data ? {
        used: creditsData.data.credits_used || 0,
        total: creditsData.data.credits_monthly_allowance || 50,
        purchased: creditsData.data.credits_purchased || 0,
      } : { used: 0, total: 50, purchased: 0 }
      
      // Build payment status object
      const paymentStatus = org.payment_failed_at ? {
        paymentFailed: true,
        paymentFailedAt: org.payment_failed_at,
        gracePeriodEndsAt: org.grace_period_ends_at,
        previousPlan: org.previous_plan_id,
      } : { paymentFailed: false }
      
      return {
        id: org.id,
        name: org.name,
        slug: org.slug,
        logo: org.logo || null,
        plan: org.plan,
        plan_id: org.plan,
        createdAt: org.created_at,
        memberCount: memberCount.count || 1,
        journeyCount: journeyCount.count || 0,
        // Workspace-scoped credits and settings
        credits,
        preferredAiModel: org.preferred_ai_model || "openai/gpt-4o-mini",
        aiSettings: org.ai_settings || {},
        paymentStatus,
        // Trial & subscription fields
        stripe_customer_id: org.stripe_customer_id || null,
        stripe_subscription_id: org.stripe_subscription_id || null,
        subscription_status: org.subscription_status || "inactive",
        trial_started_at: org.trial_started_at || null,
        trial_ends_at: org.trial_ends_at || null,
      }
    })
  )

  return NextResponse.json({ 
    workspaces, 
    activeWorkspaceId: profile?.organization_id || workspaces[0]?.id || null 
  })
}

// POST: Create a new workspace
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminClient = createAdminClient()
  const { name, logo } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 })

  // Create the organization with unique slug
  const baseSlug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
  const uniqueSlug = `${baseSlug}-${Date.now().toString(36)}`
  
  const { data: org, error } = await adminClient
    .from("organizations")
    .insert({ 
      name: name.trim(), 
      slug: uniqueSlug, 
      plan: "free",
      logo: logo || null,
    })
    .select("id, name, slug, plan, logo")
    .single()

  if (error) {
    console.error("[v0] Organization creation error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Add creator as a member (admin role)
  const { error: memberError } = await adminClient.from("organization_members").insert({
    organization_id: org.id,
    user_id: user.id,
    role: "admin",
  })
  
  if (memberError) {
    console.error("[v0] Member insert error:", memberError)
    // Rollback - delete the organization if member insert fails
    await adminClient.from("organizations").delete().eq("id", org.id)
    return NextResponse.json({ error: "Failed to add you as workspace member" }, { status: 500 })
  }

  // Create a default team for the workspace (required for creating journeys)
  const { data: team, error: teamError } = await adminClient.from("teams").insert({
    name: "Default Team",
    description: `Default team for ${name.trim()}`,
    organization_id: org.id,
  }).select("id").single()
  
  if (teamError) {
    console.error("[v0] Team creation error:", teamError)
  } else if (team) {
    // Add creator to the default team
    await adminClient.from("team_members").insert({
      team_id: team.id,
      user_id: user.id,
    })
  }

  // Switch the user's active workspace to the new one
  const { error: profileError } = await adminClient.from("profiles").update({ organization_id: org.id }).eq("id", user.id)
  
  if (profileError) {
    console.error("[v0] Profile update error:", profileError)
  }

  return NextResponse.json({ 
    id: org.id, 
    name: org.name,
    slug: org.slug,
    plan: org.plan,
    logo: org.logo,
  })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const adminClient = createAdminClient()
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get("id")
  
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
  }

  // Check if user is admin of this workspace
  const { data: membership } = await adminClient
    .from("organization_members")
    .select("role")
    .eq("organization_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  if (!membership || membership.role !== "admin") {
    return NextResponse.json({ error: "Only admins can delete workspaces" }, { status: 403 })
  }

  // Get user's other workspaces to switch to
  const { data: otherMemberships } = await adminClient
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .neq("organization_id", workspaceId)

  // Delete the workspace (cascades to teams, journeys, etc.)
  const { error } = await adminClient
    .from("organizations")
    .delete()
    .eq("id", workspaceId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Switch user to another workspace if they have one
  if (otherMemberships && otherMemberships.length > 0) {
    await adminClient
      .from("profiles")
      .update({ organization_id: otherMemberships[0].organization_id })
      .eq("id", user.id)
    
    return NextResponse.json({ 
      success: true, 
      switchTo: otherMemberships[0].organization_id 
    })
  }

  // User has no other workspaces
  await adminClient
    .from("profiles")
    .update({ organization_id: null })
    .eq("id", user.id)

  return NextResponse.json({ success: true, switchTo: null })
}
