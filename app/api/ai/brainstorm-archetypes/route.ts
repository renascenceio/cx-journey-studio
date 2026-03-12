import { generateText, Output } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// B15: Map model IDs to Anthropic model identifiers
const MODEL_MAP: Record<string, string> = {
  "claude-haiku-4.5": "claude-3-5-haiku-20241022",
  "claude-sonnet-4.5": "claude-sonnet-4-20250514",
  "claude-opus-4.6": "claude-3-opus-20240229",
}

const ideaSchema = z.object({
  name: z.string().describe("Short evocative archetype title like 'Home, Sweet Home', 'Time is Money' - NOT a personal name"),
  subtitle: z.string().describe("Latin-inspired motto, e.g., 'Familia Ante Omnia (Family Over All)'"),
  role: z.string().describe("Functional role, e.g., 'Value-Driven Shopper', 'Premium Experience Seeker'"),
  description: z.string().describe("2-3 sentence overview of who this archetype is and what drives them"),
  keyTrait: z.string().describe("Single defining characteristic, e.g., 'Family-focused', 'Time-conscious', 'Budget-savvy'"),
})

const brainstormSchema = z.object({
  ideas: z.array(ideaSchema).describe("9 distinct archetype ideas"),
})

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { category, context, targetAudience, count = 9, modelId } = await request.json()

    if (!category) {
      return NextResponse.json({ error: "Category is required" }, { status: 400 })
    }

    // B15: Use selected model or default to Sonnet
    const anthropicModel = MODEL_MAP[modelId] || MODEL_MAP["claude-sonnet-4.5"]

    const { output } = await generateText({
      model: anthropic(anthropicModel),
      output: Output.object({ schema: brainstormSchema }),
      system: `You are a CX strategist brainstorming customer archetype ideas.

CRITICAL RULES:
1. Names are DESCRIPTIVE TITLES - NEVER personal names
   GOOD: "Home, Sweet Home", "Smart & Savvy", "Time is Money", "Living the Dream", "Quality First"
   BAD: "John Smith", "Sarah Chen", "Michael Brown"
2. Create DIVERSE archetypes covering different needs, motivations, and behaviors
3. Each archetype should be distinct and memorable
4. Subtitles should be Latin-inspired mottos that capture their essence

Generate ${count} unique archetype ideas for the ${category} industry.`,
      prompt: `Generate ${count} distinct archetype ideas for the ${category} industry.

${targetAudience ? `Target audience focus: ${targetAudience}` : ""}
${context ? `Additional context: ${context}` : ""}

Create a diverse mix of archetypes that represent different customer segments, motivations, and behaviors in this industry. Each should have a memorable name (NOT a personal name), a Latin-inspired subtitle, and a clear differentiating trait.`,
    })

    return NextResponse.json({ ideas: output?.ideas || [] })
  } catch (error) {
    console.error("Brainstorm error:", error)
    return NextResponse.json({ error: "Failed to brainstorm archetypes" }, { status: 500 })
  }
}
