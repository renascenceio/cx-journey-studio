import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * B12: Ownership Transfer API
 * 
 * GET - List transfer requests (incoming and outgoing)
 * POST - Create a new transfer request
 */

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type") // "incoming" | "outgoing" | "all"

  let query = supabase
    .from("transfer_requests")
    .select(`
      *,
      from_profile:profiles!transfer_requests_from_user_id_fkey(id, full_name, email, avatar_url),
      to_profile:profiles!transfer_requests_to_user_id_fkey(id, full_name, email, avatar_url)
    `)
    .order("created_at", { ascending: false })

  if (type === "incoming") {
    query = query.or(`to_user_id.eq.${user.id},to_email.eq.${user.email}`)
  } else if (type === "outgoing") {
    query = query.eq("from_user_id", user.id)
  } else {
    // All transfers involving this user
    query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id},to_email.eq.${user.email}`)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Mark expired requests
  const now = new Date()
  const processed = (data || []).map(req => {
    if (req.status === "pending" && new Date(req.expires_at) < now) {
      return { ...req, status: "expired" }
    }
    return req
  })

  return NextResponse.json(processed)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { assetType, assetId, assetName, toEmail, toUserId, message, previousOwnerRole } = body

  if (!assetType || !assetId || !assetName) {
    return NextResponse.json({ error: "assetType, assetId, and assetName are required" }, { status: 400 })
  }

  if (!toEmail && !toUserId) {
    return NextResponse.json({ error: "Either toEmail or toUserId is required" }, { status: 400 })
  }

  // Verify the user owns the asset
  let isOwner = false
  
  if (assetType === "workspace") {
    const { data: org } = await supabase
      .from("organizations")
      .select("owner_id")
      .eq("id", assetId)
      .single()
    isOwner = org?.owner_id === user.id
  } else if (assetType === "journey") {
    const { data: journey } = await supabase
      .from("journeys")
      .select("created_by")
      .eq("id", assetId)
      .single()
    isOwner = journey?.created_by === user.id
  } else if (assetType === "archetype") {
    const { data: archetype } = await supabase
      .from("archetypes")
      .select("created_by")
      .eq("id", assetId)
      .single()
    isOwner = archetype?.created_by === user.id
  }

  if (!isOwner) {
    return NextResponse.json({ error: "You don't own this asset" }, { status: 403 })
  }

  // Check for existing pending transfer
  const { data: existing } = await supabase
    .from("transfer_requests")
    .select("id")
    .eq("asset_type", assetType)
    .eq("asset_id", assetId)
    .eq("status", "pending")
    .single()

  if (existing) {
    return NextResponse.json({ error: "A pending transfer already exists for this asset" }, { status: 400 })
  }

  // Look up recipient user if email provided
  let recipientUserId = toUserId
  if (toEmail && !toUserId) {
    const { data: recipient } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", toEmail.toLowerCase())
      .single()
    recipientUserId = recipient?.id || null
  }

  // Create the transfer request
  const { data, error } = await supabase
    .from("transfer_requests")
    .insert({
      asset_type: assetType,
      asset_id: assetId,
      asset_name: assetName,
      from_user_id: user.id,
      to_user_id: recipientUserId,
      to_email: toEmail?.toLowerCase() || null,
      message: message || null,
      previous_owner_role: previousOwnerRole || "contributor",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create notification for recipient
  if (recipientUserId) {
    await supabase.from("notifications").insert({
      user_id: recipientUserId,
      type: "transfer_request",
      title: "Ownership Transfer Request",
      message: `You have been invited to take ownership of ${assetType} "${assetName}"`,
      metadata: { transferId: data.id, assetType, assetId, assetName },
    })
  }

  // Log activity
  await supabase.from("activity_log").insert({
    action: "transfer_initiated",
    actor_id: user.id,
    details: `Initiated ownership transfer of ${assetType} "${assetName}" to ${toEmail || "user"}`,
  })

  return NextResponse.json({ id: data.id, message: "Transfer request created" })
}
