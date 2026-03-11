import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// GET - List all collaborators for a journey
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get journey first to verify access and get org_id
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("id, organization_id")
    .eq("id", journeyId)
    .single()

  if (journeyError || !journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  // Get collaborators - simple query first
  const { data: rawCollaborators, error } = await supabase
    .from("journey_collaborators")
    .select("*")
    .eq("journey_id", journeyId)
    .order("invited_at", { ascending: false })

  if (error) {
    console.error("[v0] Collaborators query error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Get profile info for internal collaborators
  const profileIds = (rawCollaborators || []).filter(c => c.profile_id).map(c => c.profile_id)
  let profiles: Record<string, { id: string; name: string; email: string; avatar: string | null; role: string }> = {}
  
  if (profileIds.length > 0) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("id, name, email, avatar, role")
      .in("id", profileIds)
    
    if (profileData) {
      profiles = Object.fromEntries(profileData.map(p => [p.id, p]))
    }
  }

  // Merge profile info into collaborators
  const collaborators = (rawCollaborators || []).map(c => ({
    ...c,
    profile: c.profile_id ? profiles[c.profile_id] || null : null
  }))

  // Get organization members who are not yet collaborators

  // Get all org members
  const { data: allMembers } = await supabase
    .from("profiles")
    .select("id, name, email, avatar, role")
    .eq("organization_id", journey.organization_id)

  // Filter out existing collaborators
  const existingProfileIds = new Set(profileIds)
  const availableMembers = (allMembers || []).filter(m => !existingProfileIds.has(m.id))

  return NextResponse.json({ 
    collaborators: collaborators || [],
    availableMembers: availableMembers || []
  })
}

// POST - Add a collaborator
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { profileId, externalEmail, externalName, role = "viewer" } = body

  // Validate input
  if (!profileId && !externalEmail) {
    return NextResponse.json({ error: "Either profileId or externalEmail is required" }, { status: 400 })
  }

  // Check for duplicates
  if (profileId) {
    const { data: existing } = await supabase
      .from("journey_collaborators")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("profile_id", profileId)
      .single()

    if (existing) {
      return NextResponse.json({ error: "This member is already a collaborator" }, { status: 409 })
    }
  } else if (externalEmail) {
    const { data: existing } = await supabase
      .from("journey_collaborators")
      .select("id")
      .eq("journey_id", journeyId)
      .eq("external_email", externalEmail)
      .single()

    if (existing) {
      return NextResponse.json({ error: "This email is already a collaborator" }, { status: 409 })
    }
  }

  // Insert collaborator
  const { data, error } = await supabase
    .from("journey_collaborators")
    .insert({
      journey_id: journeyId,
      profile_id: profileId || null,
      external_email: externalEmail || null,
      external_name: externalName || null,
      role,
      is_external: !profileId,
      invited_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send notification to the added collaborator (internal only)
  if (profileId) {
    // Get inviter's name
    const { data: inviterProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    
    // Get journey title
    const { data: journeyData } = await supabase
      .from("journeys")
      .select("title")
      .eq("id", journeyId)
      .single()
    
    const inviterName = inviterProfile?.name || "Someone"
    const journeyTitle = journeyData?.title || "a journey"
    
    await supabase.from("notifications").insert({
      user_id: profileId,
      type: "share",
      message: `${inviterName} added you as a collaborator on "${journeyTitle}"`,
      link: `/journeys/${journeyId}/canvas`,
    })
  }

  return NextResponse.json({ success: true, collaborator: data })
}

// PATCH - Update a collaborator's role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { collaboratorId, role } = await request.json()

  if (!collaboratorId || !role) {
    return NextResponse.json({ error: "collaboratorId and role are required" }, { status: 400 })
  }

  const { error } = await supabase
    .from("journey_collaborators")
    .update({ role })
    .eq("id", collaboratorId)
    .eq("journey_id", journeyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

// DELETE - Remove a collaborator
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const collaboratorId = searchParams.get("collaboratorId")

  if (!collaboratorId) {
    return NextResponse.json({ error: "collaboratorId is required" }, { status: 400 })
  }

  // Get the collaborator's profile_id before deleting (for notification)
  const { data: collaborator } = await supabase
    .from("journey_collaborators")
    .select("profile_id")
    .eq("id", collaboratorId)
    .eq("journey_id", journeyId)
    .single()

  const { error } = await supabase
    .from("journey_collaborators")
    .delete()
    .eq("id", collaboratorId)
    .eq("journey_id", journeyId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send notification to the removed collaborator (internal only)
  if (collaborator?.profile_id && collaborator.profile_id !== user.id) {
    // Get remover's name
    const { data: removerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", user.id)
      .single()
    
    // Get journey title
    const { data: journeyData } = await supabase
      .from("journeys")
      .select("title")
      .eq("id", journeyId)
      .single()
    
    const removerName = removerProfile?.name || "Someone"
    const journeyTitle = journeyData?.title || "a journey"
    
    await supabase.from("notifications").insert({
      user_id: collaborator.profile_id,
      type: "share",
      message: `${removerName} removed you as a collaborator from "${journeyTitle}"`,
      link: `/journeys`,
    })
  }

  return NextResponse.json({ success: true })
}
