import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: journeyId } = await params
    const body = await request.json()
    const versionId = body?.versionId
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    // Get user profile for org
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()
    
    if (profileError) {
      return NextResponse.json({ error: "Profile error: " + profileError.message }, { status: 400 })
    }
    
    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }
    
    // Get the original journey
    const { data: originalJourney, error: journeyError } = await supabase
      .from("journeys")
      .select("title, description, type, category, team_id")
      .eq("id", journeyId)
      .single()
    
    if (journeyError || !originalJourney) {
      console.error("Journey fetch error:", journeyError)
      return NextResponse.json({ error: "Journey not found" }, { status: 404 })
    }
    
    // Get the version info for naming (optional - if versionId provided)
    let versionLabel = "copy"
    if (versionId) {
      const { data: version } = await supabase
        .from("journey_versions")
        .select("version_number")
        .eq("id", versionId)
        .single()
      
      if (version) {
        versionLabel = `v${version.version_number} copy`
      }
    }
    
    // Get user's team (first team in org) or fall back to original journey's team
    const { data: teamMembership } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", user.id)
      .limit(1)
      .single()
    
    const teamId = teamMembership?.team_id || originalJourney.team_id
    
    // Create new journey
    const { data: newJourney, error: createError } = await supabase
      .from("journeys")
      .insert({
        title: `${originalJourney.title} (${versionLabel})`,
        description: originalJourney.description,
        type: originalJourney.type,
        category: originalJourney.category,
        status: "draft",
        organization_id: profile.organization_id,
        owner_id: user.id,
        team_id: teamId,
      })
      .select("id")
      .single()
    
    if (createError || !newJourney) {
      console.error("Journey creation error:", createError)
      return NextResponse.json({ error: createError?.message || "Failed to create journey" }, { status: 500 })
    }
    
    // Get all stages, steps, touchpoints from the original journey
    const { data: stages } = await supabase
      .from("stages")
      .select("id, name, order")
      .eq("journey_id", journeyId)
      .order("order")
    
    // Copy all stages, steps, touchpoints from original journey to new journey
    for (const stage of stages || []) {
      const { data: newStage, error: stageError } = await supabase.from("stages").insert({
        journey_id: newJourney.id,
        name: stage.name || "Untitled Stage",
        order: stage.order || 0,
      }).select("id").single()
      
      if (stageError || !newStage) {
        console.error("Stage creation error:", stageError)
        continue
      }
      
      const { data: steps } = await supabase
        .from("steps")
        .select("id, name, description, order")
        .eq("stage_id", stage.id)
        .order("order")
      
      for (const step of steps || []) {
        const { data: newStep, error: stepError } = await supabase.from("steps").insert({
          stage_id: newStage.id,
          name: step.name || "Untitled Step",
          description: step.description || null,
          order: step.order || 0,
        }).select("id").single()
        
        if (stepError || !newStep) {
          console.error("Step creation error:", stepError)
          continue
        }
        
        const { data: touchPoints } = await supabase
          .from("touch_points")
          .select("id, channel, description, emotional_score")
          .eq("step_id", step.id)
        
        for (const tp of touchPoints || []) {
          const { data: newTp, error: tpError } = await supabase.from("touch_points").insert({
            step_id: newStep.id,
            channel: tp.channel || "other",
            description: tp.description || "",
            emotional_score: tp.emotional_score ?? 0,
          }).select("id").single()
          
          if (tpError || !newTp) {
            console.error("Touchpoint creation error:", tpError)
            continue
          }
          
          // Copy pain points
          const { data: painPoints } = await supabase
            .from("pain_points")
            .select("description, severity, emotional_score")
            .eq("touch_point_id", tp.id)
          
          for (const pp of painPoints || []) {
            await supabase.from("pain_points").insert({
              touch_point_id: newTp.id,
              description: pp.description || "",
              severity: pp.severity || "medium",
              emotional_score: pp.emotional_score,
            })
          }
          
          // Copy highlights
          const { data: highlights } = await supabase
            .from("highlights")
            .select("description, impact, emotional_score")
            .eq("touch_point_id", tp.id)
          
          for (const h of highlights || []) {
            await supabase.from("highlights").insert({
              touch_point_id: newTp.id,
              description: h.description || "",
              impact: h.impact || "medium",
              emotional_score: h.emotional_score,
            })
          }
          
          // Copy evidence
          const { data: evidence } = await supabase
            .from("evidence")
            .select("type, label, url")
            .eq("touch_point_id", tp.id)
          
          for (const e of evidence || []) {
            await supabase.from("evidence").insert({
              touch_point_id: newTp.id,
              type: e.type || "other",
              label: e.label || "",
              url: e.url || "",
            })
          }
        }
      }
    }
    
    revalidatePath("/journeys")
    return NextResponse.json({ journeyId: newJourney.id })
  } catch (error) {
    console.error("Duplicate journey error:", error)
    const message = error instanceof Error ? error.message : "Unknown error"
    const stack = error instanceof Error ? error.stack : undefined
    console.error("Error stack:", stack)
    return NextResponse.json({ error: `Failed to duplicate journey: ${message}` }, { status: 500 })
  }
}
