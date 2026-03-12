import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

/**
 * B5: Cross-Journey Solution Aggregation
 * 
 * This endpoint scans all journeys in the organization and creates roadmap
 * initiatives for any applied solutions that don't already have corresponding
 * initiatives. This allows teams to aggregate solutions from all journeys
 * (not just "future" type) into the roadmap.
 */

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: "No organization" }, { status: 400 })

  // Get all applied solutions for the organization's journeys
  const { data: appliedSolutions, error: fetchError } = await supabase
    .from("applied_solutions")
    .select(`
      id,
      journey_id,
      solution_id,
      notes,
      created_at,
      solutions!inner(id, title, description),
      journeys!inner(id, title, type, organization_id)
    `)
    .eq("journeys.organization_id", profile.organization_id)
    .eq("status", "active")

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  if (!appliedSolutions || appliedSolutions.length === 0) {
    return NextResponse.json({ 
      synced: 0, 
      skipped: 0, 
      message: "No applied solutions found to sync" 
    })
  }

  // Get existing roadmap initiatives to avoid duplicates
  const { data: existingInitiatives } = await supabase
    .from("roadmap_initiatives")
    .select("solution_id, journey_id")
    .eq("organization_id", profile.organization_id)

  const existingPairs = new Set(
    (existingInitiatives || []).map(i => `${i.solution_id}:${i.journey_id}`)
  )

  // Get next priority number
  const { data: maxPriorityResult } = await supabase
    .from("roadmap_initiatives")
    .select("priority")
    .eq("organization_id", profile.organization_id)
    .order("priority", { ascending: false })
    .limit(1)
  
  let nextPriority = maxPriorityResult && maxPriorityResult.length > 0 
    ? maxPriorityResult[0].priority + 1 
    : 1

  // Create initiatives for solutions that don't have them yet
  const toCreate: Array<{
    title: string
    description: string
    priority: number
    status: string
    journey_id: string
    solution_id: string
    responsible: string
    accountable: string
    consulted: string
    informed: string
    organization_id: string
    created_by: string
  }> = []

  let skipped = 0

  for (const applied of appliedSolutions) {
    const pairKey = `${applied.solution_id}:${applied.journey_id}`
    
    if (existingPairs.has(pairKey)) {
      skipped++
      continue
    }

    // Type assertions for the joined data
    const solution = applied.solutions as unknown as { id: string; title: string; description: string }
    const journey = applied.journeys as unknown as { id: string; title: string; type: string }

    toCreate.push({
      title: solution.title || "Applied Solution",
      description: `${solution.description || ""}\n\nFrom "${journey.title}" journey (${journey.type}).${applied.notes ? `\n\nNotes: ${applied.notes}` : ""}`.trim(),
      priority: nextPriority++,
      status: journey.type === "deployed" ? "completed" : "planned",
      journey_id: applied.journey_id,
      solution_id: applied.solution_id,
      responsible: "Product Team",
      accountable: "CX Director",
      consulted: "Engineering, Design",
      informed: "Stakeholders",
      organization_id: profile.organization_id,
      created_by: user.id,
    })
  }

  if (toCreate.length === 0) {
    return NextResponse.json({ 
      synced: 0, 
      skipped, 
      message: "All applied solutions already have roadmap initiatives" 
    })
  }

  // Batch insert new initiatives
  const { error: insertError } = await supabase
    .from("roadmap_initiatives")
    .insert(toCreate)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({ 
    synced: toCreate.length, 
    skipped,
    message: `Successfully synced ${toCreate.length} initiative${toCreate.length !== 1 ? "s" : ""} from journeys` 
  })
}

/**
 * GET: Returns a summary of solutions that can be synced
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) return NextResponse.json({ error: "No organization" }, { status: 400 })

  // Count applied solutions
  const { count: totalApplied } = await supabase
    .from("applied_solutions")
    .select("id, journeys!inner(organization_id)", { count: "exact", head: true })
    .eq("journeys.organization_id", profile.organization_id)
    .eq("status", "active")

  // Count existing initiatives
  const { count: existingCount } = await supabase
    .from("roadmap_initiatives")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", profile.organization_id)

  // Get applied solutions grouped by journey type
  const { data: byType } = await supabase
    .from("applied_solutions")
    .select("journeys!inner(type, organization_id)")
    .eq("journeys.organization_id", profile.organization_id)
    .eq("status", "active")

  const typeCounts = (byType || []).reduce((acc, item) => {
    const journey = item.journeys as unknown as { type: string }
    const type = journey.type || "unknown"
    acc[type] = (acc[type] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    totalAppliedSolutions: totalApplied || 0,
    existingInitiatives: existingCount || 0,
    byJourneyType: typeCounts,
  })
}
