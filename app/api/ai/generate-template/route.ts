import { generateText, Output } from "ai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"

// B15: Map model IDs to Anthropic model identifiers
const MODEL_MAP: Record<string, string> = {
  "claude-haiku-4.5": "claude-3-5-haiku-20241022",
  "claude-sonnet-4.5": "claude-3-5-sonnet-20241022",
  "claude-opus-4.6": "claude-3-opus-20240229",
}

const templateSchema = z.object({
  name: z.string().describe("Template name"),
  description: z.string().describe("2-3 sentence description of this journey template"),
  category: z.string().describe("One of: e-commerce, banking, healthcare, saas, real_estate, insurance, hospitality, telecommunications"),
  stages: z.array(z.object({
    name: z.string().describe("Stage name like 'Awareness', 'Consideration', etc."),
    description: z.string().describe("Brief description of what happens in this stage"),
    steps: z.array(z.object({
      name: z.string().describe("Step name"),
      touchPoints: z.array(z.object({
        description: z.string(),
        channel: z.string().describe("Channel like web, mobile, email, phone, in-person, social"),
        emotionalScore: z.number().describe("Score from -5 to 5"),
      })),
    })),
  })).describe("4-6 journey stages with steps and touch points"),
})

export async function POST(request: Request) {
  try {
    const { prompt, industry, modelId } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // B15: Use selected model or default to Sonnet
    const anthropicModel = MODEL_MAP[modelId] || MODEL_MAP["claude-sonnet-4.5"]
    
    const { output } = await generateText({
      model: anthropic(anthropicModel),
      output: Output.object({ schema: templateSchema }),
      messages: [
        {
          role: "system",
          content: `You are a CX journey mapping expert. Generate a detailed, realistic journey template for the "${industry || "general"}" industry. Include realistic emotional scores that show both positive and negative moments. The template should be immediately usable for customer journey mapping.`,
        },
        {
          role: "user",
          content: `Generate a complete journey template based on: "${prompt}"\n\nInclude 4-6 stages, each with relevant steps and touch points. Make emotional scores realistic -- not all positive. Include typical pain points with negative scores.`,
        },
      ],
    })

    return NextResponse.json({ template: output })
  } catch (error) {
    console.error("AI template generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate template" },
      { status: 500 }
    )
  }
}
