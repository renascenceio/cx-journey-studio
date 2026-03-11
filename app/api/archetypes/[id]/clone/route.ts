import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Clone an archetype to a different journey
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { targetJourneyId } = await request.json()
  if (!targetJourneyId) {
    return NextResponse.json({ error: "Target journey ID required" }, { status: 400 })
  }

  try {
    // 1. Get the source archetype
    const { data: source, error: sourceError } = await supabase
      .from("archetypes")
      .select("*")
      .eq("id", id)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: "Archetype not found" }, { status: 404 })
    }

    // 2. Create new archetype with same data but new journey_id
    const { id: _id, journey_id: _journeyId, created_at: _createdAt, updated_at: _updatedAt, ...archetypeData } = source
    
    const { data: newArchetype, error: insertError } = await supabase
      .from("archetypes")
      .insert({
        ...archetypeData,
        journey_id: targetJourneyId,
      })
      .select("id")
      .single()

    if (insertError) throw insertError

    // 3. Clone pillar ratings
    const { data: pillars } = await supabase
      .from("pillar_ratings")
      .select("*")
      .eq("archetype_id", id)

    if (pillars && pillars.length > 0) {
      const pillarInserts = pillars.map(p => ({
        archetype_id: newArchetype.id,
        name: p.name,
        score: p.score,
        group: p.group,
      }))
      await supabase.from("pillar_ratings").insert(pillarInserts)
    }

    // 4. Clone radar charts and dimensions
    const { data: radars } = await supabase
      .from("radar_charts")
      .select("*")
      .eq("archetype_id", id)

    if (radars && radars.length > 0) {
      for (const radar of radars) {
        const { data: newRadar } = await supabase
          .from("radar_charts")
          .insert({
            archetype_id: newArchetype.id,
            label: radar.label,
          })
          .select("id")
          .single()

        if (newRadar) {
          const { data: dims } = await supabase
            .from("radar_dimensions")
            .select("*")
            .eq("radar_chart_id", radar.id)

          if (dims && dims.length > 0) {
            const dimInserts = dims.map(d => ({
              radar_chart_id: newRadar.id,
              axis: d.axis,
              value: d.value,
            }))
            await supabase.from("radar_dimensions").insert(dimInserts)
          }
        }
      }
    }

    return NextResponse.json({ id: newArchetype.id })
  } catch (error) {
    console.error("[archetypes/clone] Error:", error)
    return NextResponse.json({ error: "Failed to clone archetype" }, { status: 500 })
  }
}
