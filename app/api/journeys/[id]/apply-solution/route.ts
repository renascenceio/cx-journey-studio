import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { solutionId, stageId, stepId, touchpointId, painPointId, highlightId, notes, adaptedTitle, adaptedDescription } = body

  if (!solutionId || !stageId) {
    return NextResponse.json({ error: "solutionId and stageId are required" }, { status: 400 })
  }

  // Helper to check if an ID is a valid UUID (not a derived ID like "derived-pp-xxx")
  const isValidUuid = (id: string | null | undefined): boolean => {
    if (!id) return false
    // Derived IDs start with "derived-pp-" or "derived-hl-" and should be treated as null
    if (id.startsWith("derived-")) return false
    // Basic UUID format check
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    return uuidRegex.test(id)
  }

  // Fetch the journey to get its industry/category
  const { data: journey } = await supabase
    .from("journeys")
    .select("category, type, title, organization_id")
    .eq("id", journeyId)
    .single()
  
  // Fetch the original solution to check if industry differs
  const { data: originalSolution } = await supabase
    .from("solutions")
    .select("*")
    .eq("id", solutionId)
    .single()

  let finalSolutionId = solutionId

  // If the journey has a different industry than the solution, or user adapted the solution,
  // create a copy of the solution for this user with the journey's industry
  if (originalSolution && (
    (journey?.category && originalSolution.industry !== journey.category) ||
    adaptedTitle || adaptedDescription
  )) {
    const { data: adaptedSolution, error: adaptError } = await supabase
      .from("solutions")
      .insert({
        title: adaptedTitle || originalSolution.title,
        description: adaptedDescription || originalSolution.description,
        category: originalSolution.category,
        tags: originalSolution.tags || [],
        saved: true,
        source: `adapted:${solutionId}`,
        relevance: originalSolution.relevance || 80,
        upvotes: 0,
        is_crowd: false,
        created_by: user.id,
        industry: journey?.category || originalSolution.industry,
        impact: originalSolution.impact,
        effort: originalSolution.effort,
      })
      .select("id")
      .single()
    
    if (adaptedSolution && !adaptError) {
      finalSolutionId = adaptedSolution.id
    }
  }

  // Record the solution application
  const { data, error } = await supabase
    .from("applied_solutions")
    .insert({
      journey_id: journeyId,
      solution_id: finalSolutionId,
      stage_id: stageId,
      step_id: isValidUuid(stepId) ? stepId : null,
      touchpoint_id: isValidUuid(touchpointId) ? touchpointId : null,
      pain_point_id: isValidUuid(painPointId) ? painPointId : null,
      highlight_id: isValidUuid(highlightId) ? highlightId : null,
      applied_by: user.id,
      notes: notes || "",
      status: "active",
    })
    .select("id")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Log activity
  await supabase.from("activity_log").insert({
    action: "edited",
    actor_id: user.id,
    journey_id: journeyId,
    details: `Applied a solution to stage`,
  })

  // Create a new journey version when a solution is applied
  // Fetch the full journey data for the snapshot
  const { getJourneyById } = await import("@/lib/data")
  const fullJourney = await getJourneyById(journeyId)
  
  // Import version utilities
  const { calculateVersionChange } = await import("@/lib/utils")
  
  // Get solution title for the version label
  const solutionTitle = originalSolution?.title || "Solution"
  
  // Get current version info including version_label for semantic versioning
  const { data: latestVersion } = await supabase
    .from("journey_versions")
    .select("version_number, version_label, snapshot")
    .eq("journey_id", journeyId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()
  
  const nextVersionNumber = latestVersion ? latestVersion.version_number + 1 : 1
  
  // Determine the current version label - use stored label, or derive from version_number if not set
  const currentVersionLabel = latestVersion?.version_label || (latestVersion ? `${latestVersion.version_number}.0` : "1.0")
  
  // Build the snapshot - include stages if available, otherwise store minimal info
  const snapshot = fullJourney && fullJourney.stages && fullJourney.stages.length > 0
    ? {
        stages: fullJourney.stages.map(stage => ({
          id: stage.id,
          name: stage.name,
          order: stage.order,
          steps: (stage.steps || []).map(step => ({
            id: step.id,
            name: step.name,
            description: step.description,
            order: step.order,
            touchPoints: (step.touchPoints || []).map(tp => ({
              id: tp.id,
              channel: tp.channel,
              description: tp.description,
              emotional_score: tp.emotionalScore,
              painPoints: tp.painPoints || [],
              highlights: tp.highlights || [],
              evidence: tp.evidence || [],
            })),
          })),
        })),
        appliedSolutionMeta: {
          applied_solution_id: data.id,
          solution_id: finalSolutionId,
          solution_title: solutionTitle,
          stage_id: stageId,
          pain_point_id: painPointId || null,
          highlight_id: highlightId || null,
        },
      }
    : {
        appliedSolutionMeta: {
          applied_solution_id: data.id,
          solution_id: finalSolutionId,
          solution_title: solutionTitle,
          stage_id: stageId,
          pain_point_id: painPointId || null,
          highlight_id: highlightId || null,
        },
      }
  
  // Calculate semantic version (applying a solution is a minor change)
  const versionChange = calculateVersionChange(
    latestVersion?.snapshot as Parameters<typeof calculateVersionChange>[0],
    snapshot as Parameters<typeof calculateVersionChange>[1],
    currentVersionLabel,
    false // Not a regeneration
  )
  
  // Applying a solution is always a minor change
  const changeType = "minor"
  const versionLabel = versionChange.nextVersionLabel
  
  await supabase.from("journey_versions").insert({
    journey_id: journeyId,
    version_number: nextVersionNumber,
    version_label: versionLabel,
    change_type: changeType,
    label: `Applied: ${solutionTitle.substring(0, 40)}${solutionTitle.length > 40 ? "..." : ""}`,
    snapshot,
    created_by: user.id,
    changes_summary: `Applied solution "${solutionTitle}" to the journey.${notes ? ` Notes: ${notes}` : ""}`,
  })

  // Create roadmap initiative for future journeys
  if (journey?.type === "future") {
    // Get the solution details (use the adapted/final solution)
    const { data: solution } = await supabase
      .from("solutions")
      .select("title, description")
      .eq("id", finalSolutionId)
      .single()

    // Get next priority number
    const { data: existing } = await supabase
      .from("roadmap_initiatives")
      .select("priority")
      .eq("organization_id", journey.organization_id)
      .order("priority", { ascending: false })
      .limit(1)
    
    const nextPriority = existing && existing.length > 0 ? existing[0].priority + 1 : 1

    // Create roadmap initiative
    await supabase.from("roadmap_initiatives").insert({
      title: solution?.title || "Applied Solution",
      description: `${solution?.description || ""}\n\nApplied to "${journey.title}" future journey.${notes ? `\n\nNotes: ${notes}` : ""}`.trim(),
      priority: nextPriority,
      status: "planned",
      journey_id: journeyId,
      solution_id: finalSolutionId,
      responsible: "Product Team",
      accountable: "CX Director",
      consulted: "Engineering, Design",
      informed: "Stakeholders",
      organization_id: journey.organization_id,
      created_by: user.id,
    })
  }

  return NextResponse.json({ id: data.id })
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("applied_solutions")
    .select("*, solutions(title, description, category, impact_score, impact_verified, impact, effort)")
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json([], { status: 200 }) // Return empty array instead of error to prevent UI crash
  }

  return NextResponse.json(data || [])
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: journeyId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const url = new URL(request.url)
  const appliedId = url.searchParams.get("id")

  if (!appliedId) {
    return NextResponse.json({ error: "Applied solution ID required" }, { status: 400 })
  }

  // First get the applied solution to find the solution_id
  const { data: appliedSolution } = await supabase
    .from("applied_solutions")
    .select("solution_id")
    .eq("id", appliedId)
    .eq("journey_id", journeyId)
    .single()

  const { error } = await supabase
    .from("applied_solutions")
    .delete()
    .eq("id", appliedId)
    .eq("journey_id", journeyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also delete any roadmap initiatives that reference this solution in this journey
  if (appliedSolution?.solution_id) {
    await supabase
      .from("roadmap_initiatives")
      .delete()
      .eq("solution_id", appliedSolution.solution_id)
      .eq("journey_id", journeyId)
  }

  // Log activity
  await supabase.from("activity_log").insert({
    action: "edited",
    actor_id: user.id,
    journey_id: journeyId,
    details: `Removed an applied solution`,
  })

  // Create a new journey version when a solution is removed
  // Fetch the full journey data for the snapshot
  const { getJourneyById } = await import("@/lib/data")
  const fullJourney = await getJourneyById(journeyId)
  
  if (fullJourney) {
    const { calculateVersionChange } = await import("@/lib/utils")
    
    const { data: latestVersion } = await supabase
      .from("journey_versions")
      .select("version_number, version_label, snapshot")
      .eq("journey_id", journeyId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()
    
    const nextVersion = latestVersion ? latestVersion.version_number + 1 : 1
    const currentVersionLabel = latestVersion?.version_label || (latestVersion ? `${latestVersion.version_number}.0` : "1.0")
    
    // Build the full snapshot with stages (use snake_case for versions page compatibility)
    const snapshot = {
      stages: fullJourney.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        order: stage.order,
        steps: stage.steps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          order: step.order,
          touchPoints: step.touchPoints.map(tp => ({
            id: tp.id,
            channel: tp.channel,
            description: tp.description,
            emotional_score: tp.emotionalScore,
            painPoints: tp.painPoints || [],
            highlights: tp.highlights || [],
            evidence: tp.evidence || [],
          })),
        })),
      })),
      removedSolutionMeta: {
        removed_applied_solution_id: appliedId,
      },
    }
    
    // Calculate semantic version (removing a solution is a minor change)
    const versionChange = calculateVersionChange(
      latestVersion?.snapshot as Parameters<typeof calculateVersionChange>[0],
      snapshot as Parameters<typeof calculateVersionChange>[1],
      currentVersionLabel,
      false
    )
    
    await supabase.from("journey_versions").insert({
      journey_id: journeyId,
      version_number: nextVersion,
      version_label: versionChange.nextVersionLabel,
      change_type: "minor",
      label: `Removed applied solution`,
      snapshot,
      created_by: user.id,
      changes_summary: `Removed an applied solution from the journey.`,
    })
  }

  return NextResponse.json({ success: true })
}
