import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id, role").eq("id", user.id).single()

  // Admin / support agents see all org tickets, users see their own
  const isAgent = profile?.role === "admin" || profile?.role === "project_manager"

  let query = supabase
    .from("support_tickets")
    .select("*")
    .order("created_at", { ascending: false })

  if (isAgent && profile?.organization_id) {
    query = query.eq("organization_id", profile.organization_id)
  } else {
    query = query.eq("created_by", user.id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  const body = await request.json()

  // Calculate SLA deadline (48 hours for critical, 72 for high, 1 week for medium/low)
  const slaHours = body.priority === "critical" ? 48 : body.priority === "high" ? 72 : 168
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      subject: body.subject,
      description: body.description || "",
      category: body.category || "general",
      priority: body.priority || "medium",
      organization_id: profile?.organization_id,
      created_by: user.id,
      sla_deadline: slaDeadline,
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
