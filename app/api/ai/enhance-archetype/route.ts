import { generateText, Output } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"
import { smartDetectLanguage, getLanguageInstruction } from "@/lib/language-detection"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const changeSchema = z.object({
  field: z.string().describe("The archetype field to update"),
  currentValue: z.union([z.string(), z.array(z.string())]).nullable().describe("Current value of the field"),
  suggestedValue: z.union([z.string(), z.array(z.string())]).describe("Suggested new value"),
  reasoning: z.string().describe("Brief explanation for this suggestion"),
})

const enhancementSchema = z.object({
  changes: z.array(changeSchema).describe("List of suggested changes"),
  summary: z.string().describe("Brief summary of all enhancements"),
})

export async function POST(request: Request) {
  try {
    const { 
      archetypeId, 
      archetype, 
      inputContent, 
      inputType,
      language: explicitLanguage,
      languagePromptPrefix,
    } = await request.json()

    if (!archetypeId || !archetype || !inputContent) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Smart language detection
    const langResult = smartDetectLanguage({
      prompt: inputContent,
      title: archetype.name,
      description: archetype.description,
      userSelection: explicitLanguage,
    })

    const languageInstruction = getLanguageInstruction({
      detectedLanguage: langResult.language,
      languageName: langResult.languageName,
      confidence: langResult.confidence,
      script: "Latin",
    })

    // Build current archetype context
    const archetypeContext = `
CURRENT ARCHETYPE: "${archetype.name}"
Category: ${archetype.category || "Not specified"}
${archetype.description ? `Description: ${archetype.description}` : ""}
${archetype.goals?.length ? `Goals: ${archetype.goals.join(", ")}` : ""}
${archetype.needs?.length ? `Needs: ${archetype.needs.join(", ")}` : ""}
${archetype.painPoints?.length ? `Pain Points: ${archetype.painPoints.join(", ")}` : ""}
${archetype.behaviors?.length ? `Behaviors: ${archetype.behaviors.join(", ")}` : ""}
${archetype.motivations?.length ? `Motivations: ${archetype.motivations.join(", ")}` : ""}
${archetype.triggers?.length ? `Triggers: ${archetype.triggers.join(", ")}` : ""}
${archetype.barriers?.length ? `Barriers: ${archetype.barriers.join(", ")}` : ""}
${archetype.preferredChannels?.length ? `Preferred Channels: ${archetype.preferredChannels.join(", ")}` : ""}
${archetype.quote ? `Quote: "${archetype.quote}"` : ""}
${archetype.background ? `Background: ${archetype.background}` : ""}
${archetype.demographics ? `Demographics: ${archetype.demographics}` : ""}
`.trim()

    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      output: Output.object({ schema: enhancementSchema }),
      system: `You are a CX (Customer Experience) expert analyzing customer research data to enhance customer archetype profiles.

LANGUAGE REQUIREMENT:
${languageInstruction}

Your task is to analyze the provided input content and suggest specific improvements to the customer archetype.

ARCHETYPE FIELDS YOU CAN UPDATE:
- description: A narrative describing this customer archetype (string)
- goals: What this archetype wants to achieve (array of strings)
- needs: Underlying requirements driving their behavior (array of strings)
- painPoints: Frustrations and challenges they face (array of strings)
- behaviors: How they typically act and make decisions (array of strings)
- motivations: What drives their actions (array of strings)
- triggers: Events or situations that prompt action (array of strings)
- barriers: Obstacles preventing them from achieving goals (array of strings)
- preferredChannels: How they prefer to interact (array of strings)
- quote: A representative quote from this archetype (string)
- background: Their personal/professional background (string)
- demographics: Age, location, occupation, etc. (string)

GUIDELINES:
1. Only suggest changes where the input content provides relevant new information
2. Preserve existing good content - enhance rather than replace entirely
3. For array fields, add new items or improve existing ones
4. Be specific and actionable in your suggestions
5. Provide clear reasoning for each change
6. If input doesn't provide relevant info for a field, don't suggest changes for it
7. Maintain consistency with the archetype's established identity`,
      prompt: `Analyze the following ${inputType} content and suggest enhancements for this customer archetype:

${archetypeContext}

---

INPUT CONTENT TO ANALYZE:
${inputContent}

---

Based on this input, suggest specific improvements to the archetype fields. Only suggest changes where you have meaningful new information to add.`,
    })

    if (!output) {
      return NextResponse.json(
        { error: "Failed to generate enhancements" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      changes: output.changes,
      summary: output.summary,
      language: langResult.language,
    })

  } catch (error) {
    console.error("[enhance-archetype] Error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Enhancement failed" },
      { status: 500 }
    )
  }
}
