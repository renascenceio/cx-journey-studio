import { generateText, Output } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { detectPredominantLanguage, getLanguageInstruction } from "@/lib/language-detection"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Fetch AI prompt from database by category
async function getPrompt(category: string): Promise<{ system_prompt: string; example_output?: string } | null> {
  try {
    const supabase = await createClient()
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
  const { type, context, language: explicitLanguage } = await req.json()
  
  // Detect language from context
  const contextText = context?.touchpointDescription || context?.archetypeName || context?.journeyTitle || ""
  const langResult = detectPredominantLanguage(context?.journeyTitle, contextText, explicitLanguage)
  const languageInstruction = getLanguageInstruction(langResult)

  if (type === "pain-point-solutions") {
    // Fetch custom prompt from database
    const promptConfig = await getPrompt("journey_solutions")
    const systemPrompt = promptConfig?.system_prompt || "You are René AI, a CX solutions expert."
    
    // Build comprehensive context
    const archetypeInfo = context.archetype ? `
CUSTOMER ARCHETYPE:
- Name: ${context.archetype.name}
- Role: ${context.archetype.role || "Customer"}
${context.archetype.goals?.length ? `- Goals: ${context.archetype.goals.join(", ")}` : ""}
${context.archetype.frustrations?.length ? `- Frustrations: ${context.archetype.frustrations.join(", ")}` : ""}
${context.archetype.expectations?.length ? `- Expectations: ${context.archetype.expectations.join(", ")}` : ""}
` : ""

    const journeyInfo = context.journeyCategory ? `
JOURNEY CONTEXT:
- Industry: ${context.journeyCategory}
- Journey Title: ${context.journeyTitle || "N/A"}
` : ""

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      system: systemPrompt,
      output: Output.object({
        schema: z.object({
          solutions: z.array(
            z.object({
              title: z.string(),
              description: z.string(),
              effort: z.enum(["low", "medium", "high"]),
              impact: z.enum(["low", "medium", "high"]),
              category: z.string(),
            })
          ),
        }),
      }),
      prompt: `Given the following context, suggest 3-5 practical solutions.

LANGUAGE REQUIREMENT:
${languageInstruction}

${journeyInfo}${archetypeInfo}
TOUCHPOINT DETAILS:
- Description: ${context.touchpointDescription}
- Channel: ${context.channel}
- Pain Points: ${context.painPoints?.join("; ") || "General improvement needed"}
- Highlights: ${context.highlights?.join("; ") || "None identified"}
- Emotional Score: ${context.emotionalScore}/5
- Stage: ${context.stageName || "Unknown"}
- Step: ${context.stepName || "Unknown"}

Provide actionable solutions that address the specific pain points while considering the customer archetype's goals and expectations. Categories should be like: "Process Improvement", "Technology", "Training", "Communication", "Design", "Automation".`,
    })

    return NextResponse.json(result.output)
  }

  if (type === "touchpoint-improvements") {
    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      output: Output.object({
        schema: z.object({
          suggestions: z.array(
            z.object({
              area: z.string(),
              suggestion: z.string(),
              rationale: z.string(),
            })
          ),
        }),
      }),
      prompt: `You are a CX improvement expert. Suggest 3-4 improvements for this touchpoint.

LANGUAGE REQUIREMENT:
${languageInstruction}

Touchpoint: ${context.touchpointDescription}
Channel: ${context.channel}
Current Emotional Score: ${context.emotionalScore}/5
Pain Points: ${context.painPoints?.join("; ") || "None identified"}
Highlights: ${context.highlights?.join("; ") || "None identified"}

Provide specific, actionable improvement suggestions with clear rationale.`,
    })

    return NextResponse.json(result.output)
  }

  if (type === "archetype-stage-solution") {
    try {
      // Fetch custom prompt from database
      const promptConfig = await getPrompt("archetype_solutions")
      const systemPrompt = promptConfig?.system_prompt || "You are René AI, a CX solutions expert."
      const exampleOutput = promptConfig?.example_output || ""
      
      // Build full archetype context
      const archetypeDetails = `
ARCHETYPE PROFILE:
- Name: ${context.archetypeName}
${context.archetypeDescription ? `- Description: ${context.archetypeDescription}` : ""}
${context.archetypeRole ? `- Role: ${context.archetypeRole}` : ""}
${context.archetypeGoals?.length ? `- Goals: ${context.archetypeGoals.join(", ")}` : ""}
${context.archetypeFrustrations?.length ? `- Frustrations: ${context.archetypeFrustrations.join(", ")}` : ""}
${context.archetypeExpectations?.length ? `- Expectations: ${context.archetypeExpectations.join(", ")}` : ""}
${context.archetypeBehaviors?.length ? `- Behaviors: ${context.archetypeBehaviors.join(", ")}` : ""}
${context.archetypeMindset?.length ? `- Mindset: ${context.archetypeMindset.join(", ")}` : ""}
`

      const journeyDetails = context.journeyCategory ? `
JOURNEY CONTEXT:
- Industry: ${context.journeyCategory}
- Journey: ${context.journeyTitle || "N/A"}
` : ""

      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: systemPrompt,
        output: Output.object({
          schema: z.object({
            solution: z.string(),
          }),
        }),
        prompt: `Generate a solution for the following context:

LANGUAGE REQUIREMENT:
${languageInstruction}

${archetypeDetails}${journeyDetails}
SOLUTION PRINCIPLE (this is what your solution MUST address):
"${context.principle}"

JOURNEY STAGE: ${context.stageName}
${context.stageDescription ? `STAGE DESCRIPTION: ${context.stageDescription}` : ""}

${exampleOutput ? `EXAMPLE OF A GOOD SOLUTION:\n${exampleOutput}\n` : ""}
Generate a concise but detailed solution (2-4 sentences) that DIRECTLY addresses the Solution Principle above for this archetype during the ${context.stageName} stage. Consider the archetype's goals, frustrations, and expectations.`,
      })

      return NextResponse.json(result.output || { solution: "" })
    } catch (error) {
      console.error("[v0] archetype-stage-solution error:", error)
      return NextResponse.json({ error: "Failed to generate solution" }, { status: 500 })
    }
  }

  if (type === "archetype-all-solutions") {
    try {
      // Fetch custom prompt from database
      const promptConfig = await getPrompt("archetype_solutions")
      const systemPrompt = promptConfig?.system_prompt || "You are René AI, a CX solutions expert."
      
      const cells = context.cells as Array<{
        principleIndex: number
        principle: string
        stageId: string
        stageName: string
        stageDescription?: string
      }>
      
      // Build comprehensive archetype profile
      const archetypeProfile = `
ARCHETYPE PROFILE:
- Name: ${context.archetypeName}
${context.archetypeRole ? `- Role: ${context.archetypeRole}` : ""}
${context.archetypeDescription ? `- Description: ${context.archetypeDescription}` : ""}
${context.archetypeGoals?.length ? `- Goals: ${context.archetypeGoals.join(", ")}` : ""}
${context.archetypeFrustrations?.length ? `- Frustrations: ${context.archetypeFrustrations.join(", ")}` : ""}
${context.archetypeExpectations?.length ? `- Expectations: ${context.archetypeExpectations.join(", ")}` : ""}
${context.archetypeBehaviors?.length ? `- Behaviors: ${context.archetypeBehaviors.join(", ")}` : ""}
${context.archetypeBarriers?.length ? `- Barriers: ${context.archetypeBarriers.join(", ")}` : ""}
${context.archetypeDrivers?.length ? `- Drivers: ${context.archetypeDrivers.join(", ")}` : ""}
${context.archetypeMindset?.length ? `- Mindset: ${context.archetypeMindset.join(", ")}` : ""}
`

      const journeyProfile = context.journeyCategory ? `
JOURNEY CONTEXT:
- Industry: ${context.journeyCategory}
- Journey: ${context.journeyTitle || "N/A"}
${context.journeyDescription ? `- Description: ${context.journeyDescription}` : ""}
` : ""

      const result = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        system: systemPrompt,
        output: Output.object({
          schema: z.object({
            solutions: z.array(z.object({
              principleIndex: z.number(),
              stageId: z.string(),
              solution: z.string(),
            })),
          }),
        }),
        prompt: `Generate solutions for each combination of solution principle and journey stage.

LANGUAGE REQUIREMENT:
${languageInstruction}

${archetypeProfile}${journeyProfile}
IMPORTANT: Each solution must DIRECTLY address its specific Solution Principle while considering the archetype's goals, frustrations, and expectations. Do not generate generic UX or accessibility advice unless the principle specifically mentions it.

For each of the following principle+stage combinations, generate a concise but specific solution (2-3 sentences):

${cells.map((c, i) => `${i + 1}. Principle: "${c.principle}" → Stage: "${c.stageName}" (stageId: ${c.stageId}, principleIndex: ${c.principleIndex})`).join("\n")}`,
      })

      return NextResponse.json(result.output)
    } catch (error) {
      console.error("[v0] archetype-all-solutions error:", error)
      return NextResponse.json({ error: "Failed to generate solutions" }, { status: 500 })
    }
  }

  return NextResponse.json({ error: "Unknown suggestion type" }, { status: 400 })
}
