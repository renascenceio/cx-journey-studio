import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { smartDetectLanguage, getLanguageInstruction } from "@/lib/language-detection"
import type { EnhancementChange, EnhancementChangeType, EnhancementTargetType } from "@/lib/types"
import { v4 as uuid } from "uuid"

interface JourneyStage {
  id: string
  name: string
  order: number
  steps: JourneyStep[]
}

interface JourneyStep {
  id: string
  name: string
  description: string
  order: number
  touchPoints: JourneyTouchpoint[]
}

interface JourneyTouchpoint {
  id: string
  channel: string
  description: string
  emotional_score: number
  painPoints: { id: string; description: string; severity: string }[]
  highlights: { id: string; description: string; impact: string }[]
}

interface AIChange {
  type: "add" | "modify" | "remove"
  targetType: "stage" | "step" | "touchpoint" | "painPoint" | "highlight"
  targetId?: string
  parentId?: string
  confidence: number
  reasoning: string
  data: {
    name?: string
    description?: string
    order?: number
    channel?: string
    emotionalScore?: number
    severity?: string
    impact?: string
  }
  location: {
    stageName?: string
    stepName?: string
    touchpointChannel?: string
  }
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  const { journeyId, input, language: explicitLanguage } = await req.json()
  
  if (!journeyId || !input?.content) {
    return NextResponse.json({ error: "Missing journeyId or input content" }, { status: 400 })
  }

  // Fetch current journey data
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .select("id, title, description, category, type")
    .eq("id", journeyId)
    .single()

  if (journeyError || !journey) {
    return NextResponse.json({ error: "Journey not found" }, { status: 404 })
  }

  // Fetch current stages with all nested data
  const { data: stages, error: stagesError } = await supabase
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

  if (stagesError) {
    return NextResponse.json({ error: "Failed to fetch journey data" }, { status: 500 })
  }

  // Smart language detection
  const langResult = smartDetectLanguage({
    prompt: input.content,
    title: journey.title,
    description: journey.description,
    userSelection: explicitLanguage,
  })
  
  const languageInstruction = getLanguageInstruction({
    detectedLanguage: langResult.language,
    languageName: langResult.languageName,
    confidence: langResult.confidence,
    script: "Latin",
  })

  // Build current journey structure for context
  const currentJourneyContext = buildJourneyContext(stages as JourneyStage[])

  try {
    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `You are René AI, a CX journey enhancement expert. Analyze the provided input and suggest specific changes to improve the existing customer journey.

LANGUAGE REQUIREMENT:
${languageInstruction}

CURRENT JOURNEY: "${journey.title}"
Category: ${journey.category || "general"}
${journey.description ? `Description: ${journey.description}` : ""}

CURRENT JOURNEY STRUCTURE:
${currentJourneyContext}

USER INPUT TO ANALYZE:
"""
${input.content}
"""
${input.fileName ? `\nFile name: ${input.fileName}` : ""}
${input.type === "voice" ? "\n(This was transcribed from voice input)" : ""}

TASK: Analyze the user's input and suggest specific, actionable changes to the journey. The input might contain:
- Customer feedback or complaints
- Research findings or survey results
- Competitor analysis
- Internal observations
- New requirements or features
- Pain points discovered during testing
- Suggestions for improvement

Return a JSON array of changes. Each change should be one of:
1. ADD: Add a new stage, step, touchpoint, pain point, or highlight
2. MODIFY: Change an existing element (rename, update description, change score, etc.)
3. REMOVE: Suggest removing an element that's no longer relevant

JSON SCHEMA:
{
  "changes": [
    {
      "type": "add" | "modify" | "remove",
      "targetType": "stage" | "step" | "touchpoint" | "painPoint" | "highlight",
      "targetId": "existing-id (for modify/remove)",
      "parentId": "parent-id (for add - e.g., step_id for touchpoint)",
      "confidence": 0-100,
      "reasoning": "Clear explanation of why this change is suggested based on the input",
      "data": {
        "name": "for stages/steps",
        "description": "for steps/touchpoints/painPoints/highlights",
        "order": 0,
        "channel": "for touchpoints",
        "emotionalScore": -5 to 5,
        "severity": "low|medium|high|critical (for painPoints)",
        "impact": "low|medium|high (for highlights)"
      },
      "location": {
        "stageName": "Parent stage name for context",
        "stepName": "Parent step name for context",
        "touchpointChannel": "Parent touchpoint channel for context"
      }
    }
  ],
  "summary": "Brief overall summary of the suggested enhancements"
}

GUIDELINES:
- Be specific: Reference actual content from the input
- Be conservative: Only suggest changes that are clearly supported by the input
- Provide reasoning: Explain why each change addresses something from the input
- Use appropriate confidence scores:
  - 90-100: Very clear and explicit requirement
  - 70-89: Strong implication from input
  - 50-69: Reasonable inference
  - Below 50: Speculative (avoid these)
- For modifications, always reference the existing targetId
- For additions, always specify the parentId
- Keep text in the same language as the journey (${langResult.languageName})

IMPORTANT: Return ONLY valid JSON, no markdown code blocks, no explanation outside JSON.`,
    })

    // Parse AI response
    let aiResponse: { changes: AIChange[]; summary: string }
    try {
      const text = result.text.trim()
      console.log("[v0] Raw AI response text:", text.substring(0, 500))
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      aiResponse = JSON.parse(jsonStr)
      console.log("[v0] Parsed AI response - changes:", aiResponse.changes?.length, "summary:", aiResponse.summary?.substring(0, 100))
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError, "Text:", result.text)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    if (!aiResponse.changes || !Array.isArray(aiResponse.changes)) {
      console.log("[v0] Invalid response format - changes:", aiResponse.changes)
      return NextResponse.json({ error: "Invalid AI response format" }, { status: 500 })
    }

    // Enrich changes with IDs and validate
    const enrichedChanges: EnhancementChange[] = aiResponse.changes
      .filter(c => c.confidence >= 50) // Filter low confidence
      .map(change => ({
        id: uuid(),
        type: change.type as EnhancementChangeType,
        targetType: change.targetType as EnhancementTargetType,
        targetId: change.targetId,
        parentId: change.parentId,
        confidence: change.confidence,
        reasoning: change.reasoning,
        data: {
          name: change.data?.name,
          description: change.data?.description,
          order: change.data?.order,
          channel: change.data?.channel,
          emotionalScore: change.data?.emotionalScore,
          severity: change.data?.severity as "low" | "medium" | "high" | "critical" | undefined,
          impact: change.data?.impact as "low" | "medium" | "high" | undefined,
        },
        originalData: findOriginalData(stages as JourneyStage[], change),
        location: {
          stageName: change.location?.stageName,
          stageId: findStageId(stages as JourneyStage[], change.location?.stageName),
          stepName: change.location?.stepName,
          stepId: findStepId(stages as JourneyStage[], change.location?.stepName),
          touchpointChannel: change.location?.touchpointChannel,
          touchpointId: change.targetType === "touchpoint" ? change.targetId : undefined,
        },
      }))

    return NextResponse.json({
      success: true,
      changes: enrichedChanges,
      summary: aiResponse.summary,
      inputType: input.type,
      language: langResult.language,
    })

  } catch (error) {
    console.error("[v0] AI Enhancement Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "AI enhancement failed" },
      { status: 500 }
    )
  }
}

function buildJourneyContext(stages: JourneyStage[]): string {
  if (!stages || stages.length === 0) {
    return "No stages defined yet."
  }

  return stages.map(stage => {
    const stepsContext = stage.steps?.map(step => {
      const tpContext = step.touchPoints?.map(tp => {
        const ppContext = tp.painPoints?.map(pp => `      - Pain Point [${pp.id}]: "${pp.description}" (${pp.severity})`).join("\n") || ""
        const hlContext = tp.highlights?.map(hl => `      - Highlight [${hl.id}]: "${hl.description}" (${hl.impact})`).join("\n") || ""
        return `    - Touchpoint [${tp.id}]: ${tp.channel} (Score: ${tp.emotional_score})
      "${tp.description}"
${ppContext}${hlContext}`
      }).join("\n") || "    No touchpoints"
      
      return `  - Step [${step.id}]: "${step.name}"
    Description: ${step.description || "N/A"}
${tpContext}`
    }).join("\n") || "  No steps"
    
    return `Stage [${stage.id}]: "${stage.name}" (Order: ${stage.order})
${stepsContext}`
  }).join("\n\n")
}

function findOriginalData(stages: JourneyStage[], change: AIChange): EnhancementChange["originalData"] | undefined {
  if (change.type === "add") return undefined
  
  for (const stage of stages) {
    if (change.targetType === "stage" && stage.id === change.targetId) {
      return { name: stage.name }
    }
    for (const step of stage.steps || []) {
      if (change.targetType === "step" && step.id === change.targetId) {
        return { name: step.name, description: step.description }
      }
      for (const tp of step.touchPoints || []) {
        if (change.targetType === "touchpoint" && tp.id === change.targetId) {
          return { channel: tp.channel, description: tp.description, emotionalScore: tp.emotional_score }
        }
        for (const pp of tp.painPoints || []) {
          if (change.targetType === "painPoint" && pp.id === change.targetId) {
            return { description: pp.description, severity: pp.severity as "low" | "medium" | "high" | "critical" }
          }
        }
        for (const hl of tp.highlights || []) {
          if (change.targetType === "highlight" && hl.id === change.targetId) {
            return { description: hl.description, impact: hl.impact as "low" | "medium" | "high" }
          }
        }
      }
    }
  }
  return undefined
}

function findStageId(stages: JourneyStage[], stageName?: string): string | undefined {
  if (!stageName) return undefined
  const stage = stages.find(s => s.name.toLowerCase() === stageName.toLowerCase())
  return stage?.id
}

function findStepId(stages: JourneyStage[], stepName?: string): string | undefined {
  if (!stepName) return undefined
  for (const stage of stages) {
    const step = stage.steps?.find(s => s.name.toLowerCase() === stepName.toLowerCase())
    if (step) return step.id
  }
  return undefined
}
