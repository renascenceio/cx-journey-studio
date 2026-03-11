import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface GeneratedPainPoint {
  description: string
  severity: "low" | "medium" | "high" | "critical"
}

interface GeneratedHighlight {
  description: string
  impact: "low" | "medium" | "high"
}

interface GeneratedTouchpoint {
  channel: string
  description: string
  emotionalScore: number
  painPoints?: GeneratedPainPoint[]
  highlights?: GeneratedHighlight[]
}

interface GeneratedStep {
  name: string
  description: string
  touchpoints: GeneratedTouchpoint[]
}

interface GeneratedStage {
  name: string
  steps: GeneratedStep[]
}

interface GeneratedJourney {
  stages: GeneratedStage[]
}

// Fetch custom AI prompt from database
async function getCustomPrompt(supabase: Awaited<ReturnType<typeof createClient>>, category: string): Promise<{ system_prompt: string; example_output?: string } | null> {
  try {
    const { data } = await supabase
      .from("ai_prompts")
      .select("system_prompt, example_output")
      .eq("category", category)
      .single()
    return data
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { journeyId, title, description, options } = await req.json()
  
  // Default options - generate everything if not specified
  const generateOptions = {
    stages: true,
    steps: options?.steps ?? true,
    touchpoints: options?.touchpoints ?? true,
    painPoints: options?.painPoints ?? true,
    highlights: options?.highlights ?? true,
  }

  if (!journeyId || !title) {
    return NextResponse.json({ error: "Missing journeyId or title" }, { status: 400 })
  }

  // Fetch FULL journey context including category, archetypes, etc.
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select(`
      id, 
      organization_id, 
      title, 
      description, 
      category, 
      type, 
      tags
    `)
    .eq("id", journeyId)
    .single()

  if (journeyError || !journey) {
    console.error("[v0] Journey fetch error:", journeyError)
    return NextResponse.json({ error: "Journey not found or access denied" }, { status: 404 })
  }

  // Fetch linked archetypes for this journey
  const { data: archetypes } = await supabase
    .from("archetypes")
    .select(`
      id,
      name,
      role,
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
      solution_principles
    `)
    .eq("journey_id", journeyId)

  // Fetch custom AI prompt for journey generation
  const customPrompt = await getCustomPrompt(supabase, "journey_generation")

  try {
  // Generate journey content with AI using Anthropic directly
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
  
  // Build dynamic prompt based on options
  const stepsInstruction = generateOptions.steps 
    ? "Generate as many steps per stage as makes sense for the journey (no artificial limits)"
    : "Do NOT generate steps - leave the steps array empty"
  
  const touchpointsInstruction = generateOptions.touchpoints && generateOptions.steps
    ? "Generate as many touchpoints per step as makes sense for realistic customer interactions"
    : "Do NOT generate touchpoints - leave the touchpoints array empty"
  
  const painPointsInstruction = generateOptions.painPoints && generateOptions.touchpoints && generateOptions.steps
    ? `Pain Points Rules:
- For touchpoints with NEGATIVE emotionalScore (< 0): Include 1-2 painPoints describing specific frustrations
- severity for painPoints: "low", "medium", "high", "critical" (more negative score = higher severity)
- Pain points explain WHY the experience is negative (confusing UI, slow loading, unclear pricing, etc.)`
    : "Do NOT generate painPoints - omit the painPoints property"

  const highlightsInstruction = generateOptions.highlights && generateOptions.touchpoints && generateOptions.steps
    ? `Highlights Rules:
- For touchpoints with POSITIVE emotionalScore (> 0): Include 1-2 highlights describing what works well
- impact for highlights: "low", "medium", "high" (more positive score = higher impact)
- Highlights explain WHY the experience is positive (easy navigation, fast response, clear information, etc.)`
    : "Do NOT generate highlights - omit the highlights property"

  // Build archetype context if available
  const archetypeContext = archetypes && archetypes.length > 0 
    ? `
CUSTOMER ARCHETYPES (design the journey for these personas):
${archetypes.map((a, i) => `
Archetype ${i + 1}: ${a.name} (${a.role || "Customer"})
${a.description ? `- Description: ${a.description}` : ""}
${a.goals && a.goals.length > 0 ? `- Goals: ${a.goals.join(", ")}` : ""}
${a.frustrations && a.frustrations.length > 0 ? `- Frustrations: ${a.frustrations.join(", ")}` : ""}
${a.behaviors && a.behaviors.length > 0 ? `- Behaviors: ${a.behaviors.join(", ")}` : ""}
${a.expectations && a.expectations.length > 0 ? `- Expectations: ${a.expectations.join(", ")}` : ""}
${a.barriers && a.barriers.length > 0 ? `- Barriers: ${a.barriers.join(", ")}` : ""}
${a.drivers && a.drivers.length > 0 ? `- Drivers: ${a.drivers.join(", ")}` : ""}
${a.triggers && a.triggers.length > 0 ? `- Triggers: ${a.triggers.join(", ")}` : ""}
${a.touchpoints_narrative ? `- Preferred Touchpoints: ${a.touchpoints_narrative}` : ""}
`).join("\n")}`
    : ""

  // Build custom system prompt section
  const customSystemPrompt = customPrompt?.system_prompt 
    ? `\n\nADDITIONAL INSTRUCTIONS FROM ADMIN:\n${customPrompt.system_prompt}`
    : ""

  const result = await generateText({
    model: anthropic("claude-sonnet-4-20250514"),
    prompt: `You are René AI, a world-class CX journey design expert. Generate a customer journey map structure as JSON.

JOURNEY CONTEXT:
- Title: ${title}
- Category/Industry: ${journey.category || "general"}
${journey.description ? `- Description: ${journey.description}` : ""}
${journey.type ? `- Journey Type: ${journey.type}` : ""}
${journey.tags && journey.tags.length > 0 ? `- Tags: ${journey.tags.join(", ")}` : ""}
${archetypeContext}${customSystemPrompt}

Generate a JSON object with this exact structure:
{
  "stages": [
    {
      "name": "Simple Stage Name (e.g., Awareness, Research, Application, Onboarding)",
      "steps": [
        {
          "name": "Short action phrase (e.g., Contacts support, Reviews documentation)",
          "description": "Full context: Customer [action] to [intent/purpose] - explaining what they do and why",
          "touchpoints": [
            {
              "channel": "Website",
              "description": "Interaction description",
              "emotionalScore": 2,
              "painPoints": [
                {
                  "description": "What frustrates the customer at this touchpoint",
                  "severity": "medium"
                }
              ],
              "highlights": [
                {
                  "description": "What delights the customer at this touchpoint",
                  "impact": "high"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
}

STAGE NAMES:
- Stage names should be SIMPLE, one or two words: "Awareness", "Research", "Consideration", "Application", "Onboarding", "Usage", "Support", "Renewal", "Advocacy"
- DO NOT include action/intent in stage names
- Stage names represent phases in the customer lifecycle, not actions

STEP NAME GRAMMAR (CRITICAL):
- Step NAMES should be SHORT action phrases (2-4 words): "Contacts support", "Reviews documentation", "Compares offerings", "Submits application"
- DO NOT include "Customer" in the step name
- DO NOT include the intent in the step name - keep it brief

STEP DESCRIPTION GRAMMAR (CRITICAL):
- Step DESCRIPTIONS must include BOTH action AND intent
- Follow the pattern: "Customer [action] to [intent/purpose]"
- Examples:
  - Name: "Compares offerings" → Description: "Customer compares Mashreq offerings to competitors to understand value differences and make an informed decision"
  - Name: "Reviews terms" → Description: "Customer reviews account terms and conditions to evaluate commitment requirements before proceeding"
  - Name: "Contacts support" → Description: "Customer contacts support team to resolve account access issues and get help with login problems"
  - Name: "Submits application" → Description: "Customer submits account application to begin the account opening process"

Requirements:
- Generate 5-12 stages covering the customer lifecycle (adapt to the industry - include stages like Awareness, Research, Consideration, Decision, Purchase, Onboarding, Usage, Support, Renewal, Loyalty, Advocacy as appropriate)
- ${stepsInstruction}
- ${touchpointsInstruction}
- emotionalScore: integer from -5 (very negative) to +5 (very positive)
- Channels: Website, Mobile App, Email, Phone, Live Chat, Social Media, Physical Store, SMS, In-Person, Documentation, Community Forum, etc.
- Vary emotional scores realistically - not everything is positive, include friction points

${painPointsInstruction}

${highlightsInstruction}

IMPORTANT: Return ONLY the JSON object, no markdown, no explanation.`,
  })

  // Parse the JSON from the response
  let journeyData: GeneratedJourney
  try {
    const text = result.text.trim()
    // Remove any markdown code blocks if present
    const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
    journeyData = JSON.parse(jsonStr)
  } catch (parseError) {
    console.error("[v0] JSON parse error:", parseError, "Text:", result.text)
    return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
  }

  if (!journeyData.stages || journeyData.stages.length === 0) {
    return NextResponse.json({ error: "AI generation failed - no stages" }, { status: 500 })
  }

  // Import version utilities for semantic versioning
  const { calculateVersionChange } = await import("@/lib/utils")

  // Capture current state before deleting for versioning
  const { data: existingStages } = await supabase
    .from("stages")
    .select(`
      id, name, order,
      steps:steps(
        id, name, description, order,
        touchPoints:touch_points(
          id, channel, description, emotional_score,
          painPoints:pain_points(id, description, severity),
          highlights:highlights(id, description, impact)
        )
      )
    `)
    .eq("journey_id", journeyId)
    .order("order")

  // Get current version info for semantic versioning
  const { data: latestVersion } = await supabase
    .from("journey_versions")
    .select("version_number, version_label, snapshot")
    .eq("journey_id", journeyId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()

  // Delete existing comments (they reference old touchpoints/steps/stages)
  await supabase.from("comments").delete().eq("journey_id", journeyId)

  // Delete existing stages (cascades to steps, touchpoints, etc.)
  await supabase.from("stages").delete().eq("journey_id", journeyId)

  // Insert new stages, steps, and touchpoints
  for (let stageIdx = 0; stageIdx < journeyData.stages.length; stageIdx++) {
    const stage = journeyData.stages[stageIdx]
    
    const { data: newStage, error: stageError } = await supabase
      .from("stages")
      .insert({
        journey_id: journeyId,
        name: stage.name,
        order: stageIdx,
      })
      .select("id")
      .single()

    if (stageError || !newStage) continue

    for (let stepIdx = 0; stepIdx < stage.steps.length; stepIdx++) {
      const step = stage.steps[stepIdx]
      
      const { data: newStep, error: stepError } = await supabase
        .from("steps")
        .insert({
          stage_id: newStage.id,
          name: step.name,
          description: step.description,
          order: stepIdx,
        })
        .select("id")
        .single()

      if (stepError || !newStep) continue

      for (const tp of step.touchpoints) {
        const { data: newTouchpoint, error: tpError } = await supabase
          .from("touch_points")
          .insert({
            step_id: newStep.id,
            channel: tp.channel,
            description: tp.description,
            emotional_score: tp.emotionalScore,
          })
          .select("id")
          .single()

        if (tpError || !newTouchpoint) continue

        // Insert pain points (if enabled)
        if (generateOptions.painPoints && tp.painPoints && tp.painPoints.length > 0) {
          for (const pp of tp.painPoints) {
            await supabase.from("pain_points").insert({
              touch_point_id: newTouchpoint.id,
              description: pp.description,
              severity: pp.severity,
              is_ai_generated: true,
            })
          }
        }

        // Insert highlights (if enabled)
        if (generateOptions.highlights && tp.highlights && tp.highlights.length > 0) {
          for (const hl of tp.highlights) {
            await supabase.from("highlights").insert({
              touch_point_id: newTouchpoint.id,
              description: hl.description,
              impact: hl.impact,
              is_ai_generated: true,
            })
          }
        }
      }
    }
  }

  // Create a version snapshot of the newly generated journey (this is a major change)
  // Fetch the newly created data for the snapshot
  const { data: newStages } = await supabase
    .from("stages")
    .select(`
      id, name, order,
      steps:steps(
        id, name, description, order,
        touchPoints:touch_points(
          id, channel, description, emotional_score,
          painPoints:pain_points(id, description, severity),
          highlights:highlights(id, description, impact)
        )
      )
    `)
    .eq("journey_id", journeyId)
    .order("order")

  // Build snapshot for the new version
  const newSnapshot = {
    stages: (newStages || []).map(stage => ({
      id: stage.id,
      name: stage.name,
      order: stage.order,
      steps: (stage.steps || []).map((step: { id: string; name: string; description: string; order: number; touchPoints?: Array<{ id: string; channel: string; description: string; emotional_score: number; painPoints?: Array<{ id: string; description: string; severity: string }>; highlights?: Array<{ id: string; description: string; impact: string }> }> }) => ({
        id: step.id,
        name: step.name,
        description: step.description,
        order: step.order,
        touchPoints: (step.touchPoints || []).map((tp: { id: string; channel: string; description: string; emotional_score: number; painPoints?: Array<{ id: string; description: string; severity: string }>; highlights?: Array<{ id: string; description: string; impact: string }> }) => ({
          id: tp.id,
          channel: tp.channel,
          description: tp.description,
          emotional_score: tp.emotional_score,
          painPoints: tp.painPoints || [],
          highlights: tp.highlights || [],
        })),
      })),
    })),
  }

  // Calculate semantic version - regeneration is always a MAJOR change
  const currentVersionLabel = latestVersion?.version_label || (latestVersion ? `${latestVersion.version_number}.0` : "1.0")
  const versionChange = calculateVersionChange(
    existingStages && existingStages.length > 0 ? { stages: existingStages } : null,
    newSnapshot,
    currentVersionLabel,
    true // isRegeneration = true, forces major version bump
  )

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1

  // Create the version record
  await supabase.from("journey_versions").insert({
    journey_id: journeyId,
    version_number: nextVersionNumber,
    version_label: versionChange.nextVersionLabel,
    change_type: "major", // AI regeneration is always major
    label: "AI Regeneration",
    snapshot: newSnapshot,
    created_by: user.id,
    changes_summary: `Journey regenerated from scratch using AI. Generated ${journeyData.stages.length} stages with ${journeyData.stages.reduce((s: number, st: GeneratedStage) => s + st.steps.length, 0)} steps and ${journeyData.stages.reduce((s: number, st: GeneratedStage) => s + st.steps.reduce((ss: number, step: GeneratedStep) => ss + step.touchpoints.length, 0), 0)} touchpoints.`,
  })

  revalidatePath(`/journeys/${journeyId}`)
  revalidatePath(`/journeys/${journeyId}/versions`)

  return NextResponse.json({
    success: true,
    stagesCount: journeyData.stages.length,
    stepsCount: journeyData.stages.reduce((s: number, st: GeneratedStage) => s + st.steps.length, 0),
    touchpointsCount: journeyData.stages.reduce((s: number, st: GeneratedStage) => s + st.steps.reduce((ss: number, step: GeneratedStep) => ss + step.touchpoints.length, 0), 0),
    versionLabel: versionChange.nextVersionLabel,
  })
  } catch (error) {
    console.error("[v0] AI Generation Error:", error)
    const errorMessage = error instanceof Error ? error.message : "AI generation failed"
    const errorDetails = error instanceof Error ? error.stack : String(error)
    console.error("[v0] Error details:", errorDetails)
    return NextResponse.json(
      { error: errorMessage, details: errorDetails },
      { status: 500 }
    )
  }
}
