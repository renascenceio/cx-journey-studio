import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) return NextResponse.json([])

  const { data } = await supabase
    .from("roadmap_initiatives")
    .select("*, journeys:journey_id(id, title), solutions:solution_id(id, title)")
    .eq("organization_id", profile.organization_id)
    .order("priority", { ascending: true })

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: "No org" }, { status: 400 })

  const body = await request.json()
  
  // Get next priority number
  const { data: existing } = await supabase
    .from("roadmap_initiatives")
    .select("priority")
    .eq("organization_id", profile.organization_id)
    .order("priority", { ascending: false })
    .limit(1)
  
  const nextPriority = existing && existing.length > 0 ? existing[0].priority + 1 : 1

  const { data, error } = await supabase
    .from("roadmap_initiatives")
    .insert({
      title: body.title,
      description: body.description || "",
      priority: nextPriority,
      status: "planned",
      journey_id: body.journeyId || null,
      solution_id: body.solutionId || null,
      responsible: body.responsible || "Product Team",
      accountable: body.accountable || "CX Director",
      consulted: body.consulted || "Engineering, Design",
      informed: body.informed || "Stakeholders",
      start_date: body.startDate || null,
      end_date: body.endDate || null,
      organization_id: profile.organization_id,
      created_by: user.id,
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}

export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { id, ...updates } = body

  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // Map camelCase to snake_case
  const dbUpdates: Record<string, unknown> = {}
  if (updates.title !== undefined) dbUpdates.title = updates.title
  if (updates.description !== undefined) dbUpdates.description = updates.description
  if (updates.priority !== undefined) dbUpdates.priority = updates.priority
  if (updates.status !== undefined) dbUpdates.status = updates.status
  if (updates.responsible !== undefined) dbUpdates.responsible = updates.responsible
  if (updates.accountable !== undefined) dbUpdates.accountable = updates.accountable
  if (updates.consulted !== undefined) dbUpdates.consulted = updates.consulted
  if (updates.informed !== undefined) dbUpdates.informed = updates.informed
  if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
  if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
  if (updates.approvedBy !== undefined) dbUpdates.approved_by = updates.approvedBy
  if (updates.approvedAt !== undefined) dbUpdates.approved_at = updates.approvedAt
  if (updates.impact_score !== undefined) dbUpdates.impact_score = updates.impact_score
  if (updates.effort_score !== undefined) dbUpdates.effort_score = updates.effort_score

  const { error } = await supabase
    .from("roadmap_initiatives")
    .update(dbUpdates)
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

  // First get the roadmap item to find solution_id and journey_id
  const { data: roadmapItem } = await supabase
    .from("roadmap_initiatives")
    .select("solution_id, journey_id")
    .eq("id", id)
    .single()

  const { error } = await supabase
    .from("roadmap_initiatives")
    .delete()
    .eq("id", id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Also delete the applied solution if this roadmap item was linked to one
  if (roadmapItem?.solution_id && roadmapItem?.journey_id) {
    await supabase
      .from("applied_solutions")
      .delete()
      .eq("solution_id", roadmapItem.solution_id)
      .eq("journey_id", roadmapItem.journey_id)
  }

  return NextResponse.json({ success: true })
}
