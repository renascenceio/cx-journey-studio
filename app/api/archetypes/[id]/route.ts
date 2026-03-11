import { getArchetypeById } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const archetype = await getArchetypeById(id)
  if (!archetype) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(archetype)
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const update: Record<string, unknown> = {}
  const allowedFields = [
    "name", "role", "subtitle", "description", "category",
    "goals", "frustrations", "behaviors", "expectations",
    "barriers", "drivers", "important_steps", "triggers", "mindset",
    "solution_principles", "goals_narrative", "needs_narrative",
    "touchpoints_narrative", "value_metric", "base_percentage", "visibility",
  ]
  for (const field of allowedFields) {
    if (body[field] !== undefined) update[field] = body[field]
  }

  const { error } = await supabase.from("archetypes").update(update).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Handle pillar_ratings update (delete and re-insert)
  if (body.pillar_ratings && Array.isArray(body.pillar_ratings)) {
    const { error: deleteError } = await supabase.from("pillar_ratings").delete().eq("archetype_id", id)
    if (deleteError) {
      console.error("[archetypes] Failed to delete pillar_ratings:", deleteError)
      return NextResponse.json({ error: `Failed to delete pillar ratings: ${deleteError.message}` }, { status: 500 })
    }
    
    if (body.pillar_ratings.length > 0) {
      const pillarInserts = body.pillar_ratings.map((p: { name: string; score: number; group: string }) => ({
        archetype_id: id,
        name: p.name,
        score: p.score,
        group: p.group,
      }))
      const { error: pillarError } = await supabase.from("pillar_ratings").insert(pillarInserts)
      if (pillarError) return NextResponse.json({ error: pillarError.message }, { status: 500 })
    }
  }

  // Handle radar_charts update (delete and re-insert with dimensions)
  if (body.radar_charts && Array.isArray(body.radar_charts)) {
    // First delete existing radar dimensions (via cascade or manually)
    const { data: existingCharts } = await supabase
      .from("radar_charts")
      .select("id")
      .eq("archetype_id", id)
    
    if (existingCharts && existingCharts.length > 0) {
      const chartIds = existingCharts.map(c => c.id)
      const { error: dimDeleteError } = await supabase.from("radar_dimensions").delete().in("radar_chart_id", chartIds)
      if (dimDeleteError) {
        console.error("[archetypes] Failed to delete radar_dimensions:", dimDeleteError)
        return NextResponse.json({ error: `Failed to delete radar dimensions: ${dimDeleteError.message}` }, { status: 500 })
      }
    }
    
    const { error: chartDeleteError } = await supabase.from("radar_charts").delete().eq("archetype_id", id)
    if (chartDeleteError) {
      console.error("[archetypes] Failed to delete radar_charts:", chartDeleteError)
      return NextResponse.json({ error: `Failed to delete radar charts: ${chartDeleteError.message}` }, { status: 500 })
    }
    
    // Insert new radar charts and dimensions
    for (const chart of body.radar_charts) {
      const { data: newChart, error: chartError } = await supabase
        .from("radar_charts")
        .insert({ archetype_id: id, label: chart.label })
        .select("id")
        .single()
      
      if (chartError) return NextResponse.json({ error: chartError.message }, { status: 500 })
      
      if (chart.dimensions && chart.dimensions.length > 0) {
        const dimInserts = chart.dimensions.map((d: { axis: string; value: number }) => ({
          radar_chart_id: newChart.id,
          axis: d.axis,
          value: d.value,
        }))
        const { error: dimError } = await supabase.from("radar_dimensions").insert(dimInserts)
        if (dimError) return NextResponse.json({ error: dimError.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Delete related data first (cascades should handle this but being explicit)
  await supabase.from("radar_charts").delete().eq("archetype_id", id)
  await supabase.from("pillar_ratings").delete().eq("archetype_id", id)
  
  const { error } = await supabase.from("archetypes").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
