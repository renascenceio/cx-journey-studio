import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * B12: Ownership Transfer - Accept/Decline/Cancel
 * 
 * PATCH - Accept or decline a transfer request
 * DELETE - Cancel a transfer request (sender only)
 */

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { action } = body // "accept" | "decline"

  if (!["accept", "decline"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  }

  // Get the transfer request
  const { data: transfer, error: fetchError } = await supabase
    .from("transfer_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (fetchError || !transfer) {
    return NextResponse.json({ error: "Transfer request not found" }, { status: 404 })
  }

  // Verify the user is the recipient
  const isRecipient = transfer.to_user_id === user.id || 
    (transfer.to_email && transfer.to_email.toLowerCase() === user.email?.toLowerCase())

  if (!isRecipient) {
    return NextResponse.json({ error: "You are not the recipient of this transfer" }, { status: 403 })
  }

  // Check if already resolved or expired
  if (transfer.status !== "pending") {
    return NextResponse.json({ error: `Transfer is already ${transfer.status}` }, { status: 400 })
  }

  if (new Date(transfer.expires_at) < new Date()) {
    await supabase
      .from("transfer_requests")
      .update({ status: "expired", resolved_at: new Date().toISOString() })
      .eq("id", id)
    return NextResponse.json({ error: "Transfer request has expired" }, { status: 400 })
  }

  if (action === "decline") {
    // Simply update status to declined
    await supabase
      .from("transfer_requests")
      .update({ 
        status: "declined", 
        resolved_at: new Date().toISOString(),
        to_user_id: user.id // Ensure recipient is recorded
      })
      .eq("id", id)

    // Notify the sender
    await supabase.from("notifications").insert({
      user_id: transfer.from_user_id,
      type: "transfer_declined",
      title: "Transfer Declined",
      message: `Your transfer request for ${transfer.asset_type} "${transfer.asset_name}" was declined`,
      metadata: { transferId: id, assetType: transfer.asset_type, assetId: transfer.asset_id },
    })

    return NextResponse.json({ success: true, message: "Transfer declined" })
  }

  // Accept transfer - perform the actual ownership change
  const { asset_type, asset_id, from_user_id, previous_owner_role } = transfer

  try {
    if (asset_type === "workspace") {
      // Transfer workspace ownership
      await supabase
        .from("organizations")
        .update({ owner_id: user.id })
        .eq("id", asset_id)

      // Update previous owner's role in workspace_members
      await supabase
        .from("workspace_members")
        .upsert({
          organization_id: asset_id,
          user_id: from_user_id,
          role: previous_owner_role || "contributor",
        }, { onConflict: "organization_id,user_id" })

      // Ensure new owner is admin
      await supabase
        .from("workspace_members")
        .upsert({
          organization_id: asset_id,
          user_id: user.id,
          role: "admin",
        }, { onConflict: "organization_id,user_id" })

    } else if (asset_type === "journey") {
      // Transfer journey ownership
      await supabase
        .from("journeys")
        .update({ created_by: user.id })
        .eq("id", asset_id)

    } else if (asset_type === "archetype") {
      // Transfer archetype ownership
      await supabase
        .from("archetypes")
        .update({ created_by: user.id })
        .eq("id", asset_id)
    }

    // Update transfer request status
    await supabase
      .from("transfer_requests")
      .update({ 
        status: "accepted", 
        resolved_at: new Date().toISOString(),
        to_user_id: user.id
      })
      .eq("id", id)

    // Notify the sender
    await supabase.from("notifications").insert({
      user_id: from_user_id,
      type: "transfer_accepted",
      title: "Transfer Accepted",
      message: `Your transfer of ${asset_type} "${transfer.asset_name}" was accepted`,
      metadata: { transferId: id, assetType: asset_type, assetId: asset_id },
    })

    // Log activity
    await supabase.from("activity_log").insert({
      action: "transfer_completed",
      actor_id: user.id,
      details: `Accepted ownership transfer of ${asset_type} "${transfer.asset_name}" from previous owner`,
    })

    return NextResponse.json({ success: true, message: "Transfer accepted. You are now the owner." })

  } catch (err) {
    console.error("Transfer error:", err)
    return NextResponse.json({ error: "Failed to complete transfer" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Get the transfer request
  const { data: transfer } = await supabase
    .from("transfer_requests")
    .select("*")
    .eq("id", id)
    .single()

  if (!transfer) {
    return NextResponse.json({ error: "Transfer request not found" }, { status: 404 })
  }

  // Only sender can cancel
  if (transfer.from_user_id !== user.id) {
    return NextResponse.json({ error: "Only the sender can cancel this transfer" }, { status: 403 })
  }

  // Can only cancel pending transfers
  if (transfer.status !== "pending") {
    return NextResponse.json({ error: `Cannot cancel a ${transfer.status} transfer` }, { status: 400 })
  }

  await supabase
    .from("transfer_requests")
    .update({ status: "cancelled", resolved_at: new Date().toISOString() })
    .eq("id", id)

  // Notify recipient if they exist
  if (transfer.to_user_id) {
    await supabase.from("notifications").insert({
      user_id: transfer.to_user_id,
      type: "transfer_cancelled",
      title: "Transfer Cancelled",
      message: `The transfer request for ${transfer.asset_type} "${transfer.asset_name}" was cancelled by the owner`,
      metadata: { transferId: id },
    })
  }

  return NextResponse.json({ success: true, message: "Transfer cancelled" })
}
