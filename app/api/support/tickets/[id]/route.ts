import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params

  const { data: ticket } = await supabase.from("support_tickets").select("*").eq("id", id).single()
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const { data: messages } = await supabase
    .from("support_ticket_messages")
    .select("*")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ ticket, messages: messages || [] })
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const updates: Record<string, unknown> = {}
  if (body.status !== undefined) {
    updates.status = body.status
    if (body.status === "resolved") updates.resolved_at = new Date().toISOString()
  }
  if (body.assignedTo !== undefined) updates.assigned_to = body.assignedTo
  if (body.priority !== undefined) updates.priority = body.priority
  updates.updated_at = new Date().toISOString()

  const { error } = await supabase.from("support_tickets").update(updates).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// Post a message to the ticket thread
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const body = await request.json()

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  const senderType = profile?.role === "admin" || profile?.role === "project_manager" ? "agent" : "user"

  const { data, error } = await supabase
    .from("support_ticket_messages")
    .insert({
      ticket_id: id,
      sender_id: user.id,
      sender_type: senderType,
      message: body.message,
    })
    .select("*")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
