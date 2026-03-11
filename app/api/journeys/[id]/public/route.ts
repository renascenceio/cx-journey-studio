import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  // Get the journey with is_public check
  const { data: journey, error } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", id)
    .eq("is_public", true)
    .single()

  if (error || !journey) {
    return NextResponse.json(
      { error: "Journey not found or is private" },
      { status: 404 }
    )
  }

  // Get stages
  const { data: stages } = await supabase
    .from("stages")
    .select("*")
    .eq("journey_id", id)
    .order("order")

  // Get steps for all stages
  const stageIds = stages?.map((s) => s.id) || []
  const { data: steps } = await supabase
    .from("steps")
    .select("*")
    .in("stage_id", stageIds.length > 0 ? stageIds : ["__none__"])
    .order("order")

  // Get touchpoints for all steps
  const stepIds = steps?.map((s) => s.id) || []
  const { data: touchPoints } = await supabase
    .from("touch_points")
    .select("*")
    .in("step_id", stepIds.length > 0 ? stepIds : ["__none__"])

  // Get pain points and highlights
  const tpIds = touchPoints?.map((tp) => tp.id) || []
  const { data: painPoints } = await supabase
    .from("pain_points")
    .select("*")
    .in("touch_point_id", tpIds.length > 0 ? tpIds : ["__none__"])

  const { data: highlights } = await supabase
    .from("highlights")
    .select("*")
    .in("touch_point_id", tpIds.length > 0 ? tpIds : ["__none__"])

  // Build the nested structure
  const stagesWithSteps = (stages || []).map((stage) => ({
    id: stage.id,
    name: stage.name,
    order: stage.order,
    steps: (steps || [])
      .filter((step) => step.stage_id === stage.id)
      .map((step) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        order: step.order,
        touchPoints: (touchPoints || [])
          .filter((tp) => tp.step_id === step.id)
          .map((tp) => ({
            id: tp.id,
            channel: tp.channel,
            description: tp.description,
            emotionalScore: tp.emotional_score,
            painPoints: (painPoints || [])
              .filter((pp) => pp.touch_point_id === tp.id)
              .map((pp) => ({
                id: pp.id,
                description: pp.description,
                severity: pp.severity,
                emotionalScore: pp.emotional_score,
              })),
            highlights: (highlights || [])
              .filter((h) => h.touch_point_id === tp.id)
              .map((h) => ({
                id: h.id,
                description: h.description,
                impact: h.impact,
                emotionalScore: h.emotional_score,
              })),
          })),
      })),
  }))

  return NextResponse.json({
    id: journey.id,
    title: journey.title,
    description: journey.description,
    type: journey.type,
    status: journey.status,
    persona: journey.persona,
    tags: journey.tags || [],
    stages: stagesWithSteps,
  })
}
