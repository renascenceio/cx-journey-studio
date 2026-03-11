import { getAllArchetypes } from "@/lib/data"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const archetypes = await getAllArchetypes()
  return NextResponse.json(archetypes)
}

// Create a new archetype with pillar ratings and radar charts
export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const {
    journey_id,
    name,
    role,
    subtitle,
    category,
    description,
    goals_narrative,
    needs_narrative,
    touchpoints_narrative,
    goals,
    frustrations,
    behaviors,
    expectations,
    barriers,
    drivers,
    triggers,
    mindset,
    important_steps,
    solution_principles,
    tags,
    value_metric,
    base_percentage,
    pillar_ratings,
    radar_charts,
  } = body

  try {
    // Get current user - profiles.id = auth.uid() in this schema
    const { data: { user } } = await supabase.auth.getUser()
    
    // Debug: check user's org
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user?.id || "")
      .single()
    
    console.log("[v0] Creating archetype with data:", {
      journey_id,
      name,
      category,
      user_id: user?.id,
      user_org_id: profile?.organization_id,
    })
    
    // Also verify the journey exists and belongs to user's org
    if (journey_id) {
      const { data: journey, error: journeyError } = await supabase
        .from("journeys")
        .select("id, organization_id")
        .eq("id", journey_id)
        .single()
      
      console.log("[v0] Journey check:", { 
        journey_id, 
        journey_exists: !!journey, 
        journey_org: journey?.organization_id,
        user_org: profile?.organization_id,
        match: journey?.organization_id === profile?.organization_id
      })
    }
    
    // 1. Insert archetype with visibility default and organization_id
    const { data: archetype, error: archetypeError } = await supabase
      .from("archetypes")
      .insert({
        journey_id: journey_id || null, // Can be null for library archetypes
        created_by: user?.id || null, // profiles.id = auth.uid()
        organization_id: profile?.organization_id || null, // Set org so it shows in My Archetypes
        name,
        role,
        subtitle: subtitle || null,
        category,
        description,
        goals_narrative: goals_narrative || description,
        needs_narrative: needs_narrative || description,
        touchpoints_narrative: touchpoints_narrative || description,
        goals: goals || [],
        frustrations: frustrations || [],
        behaviors: behaviors || [],
        expectations: expectations || [],
        barriers: barriers || [],
        drivers: drivers || [],
        triggers: triggers || [],
        mindset: mindset || [],
        important_steps: important_steps || [],
        solution_principles: solution_principles || [],
        tags: tags || [],
        value_metric: value_metric || null,
        base_percentage: base_percentage || null,
        visibility: "private", // Default visibility
      })
      .select("id")
      .single()

    if (archetypeError) {
      console.error("[v0] Archetype insert error:", JSON.stringify(archetypeError, null, 2))
      console.error("[v0] Error code:", archetypeError.code)
      console.error("[v0] Error message:", archetypeError.message)
      console.error("[v0] Error details:", archetypeError.details)
      console.error("[v0] Error hint:", archetypeError.hint)
      throw archetypeError
    }
    
    console.log("[v0] Archetype created successfully:", archetype.id)

    // 2. Insert pillar ratings
    if (pillar_ratings && pillar_ratings.length > 0) {
      const pillarInserts = pillar_ratings.map((p: { name: string; score: number; group: string }) => ({
        archetype_id: archetype.id,
        name: p.name,
        score: p.score,
        group: p.group,
      }))
      const { error: pillarError } = await supabase.from("pillar_ratings").insert(pillarInserts)
      if (pillarError) throw pillarError
    }

    // 3. Insert radar charts and dimensions
    if (radar_charts && radar_charts.length > 0) {
      for (const chart of radar_charts) {
        const { data: radarChart, error: radarError } = await supabase
          .from("radar_charts")
          .insert({
            archetype_id: archetype.id,
            label: chart.label,
          })
          .select("id")
          .single()

        if (radarError) throw radarError

        if (chart.dimensions && chart.dimensions.length > 0) {
          const dimInserts = chart.dimensions.map((d: { axis: string; value: number }) => ({
            radar_chart_id: radarChart.id,
            axis: d.axis,
            value: d.value,
          }))
          await supabase.from("radar_dimensions").insert(dimInserts)
        }
      }
    }

    return NextResponse.json({ id: archetype.id })
  } catch (error: unknown) {
    console.error("[archetypes] POST error:", error)
    // Return full error details for debugging
    const errorDetails = {
      message: error instanceof Error ? error.message : "Failed to create archetype",
      code: (error as { code?: string })?.code,
      details: (error as { details?: string })?.details,
      hint: (error as { hint?: string })?.hint,
    }
    return NextResponse.json({ error: errorDetails }, { status: 500 })
  }
}
