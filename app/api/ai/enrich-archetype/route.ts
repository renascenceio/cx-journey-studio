import { generateText, Output } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const fullArchetypeSchema = z.object({
  name: z.string(),
  role: z.string(),
  subtitle: z.string().nullable(),
  description: z.string().describe("First-person 'I am...' narrative"),
  goalsNarrative: z.string().describe("First-person 'I want...' narrative"),
  needsNarrative: z.string().describe("First-person 'I do...' narrative"),
  touchpointsNarrative: z.string().describe("First-person 'I use...' narrative"),
  goals: z.array(z.string()).describe("4-5 goals"),
  frustrations: z.array(z.string()).describe("4-5 frustrations"),
  behaviors: z.array(z.string()).describe("4-5 behaviors"),
  expectations: z.array(z.string()).describe("4-5 expectations"),
  barriers: z.array(z.string()).describe("4-5 barriers"),
  drivers: z.array(z.string()).describe("4-5 drivers"),
  triggers: z.array(z.string()).describe("3-4 triggers"),
  mindset: z.array(z.string()).describe("4-6 mindset traits"),
  importantSteps: z.array(z.string()).describe("4-5 important steps"),
  solutionPrinciples: z.array(z.string()).describe("3-5 solution principles in format: 'Because they [insight], the experience must be [principle].'"),
  tags: z.array(z.string()).describe("5-7 tags"),
  pillarRatings: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(10),
    group: z.enum(["higher_order", "basic_order"]),
  })).describe("10 pillar ratings"),
  radarCharts: z.array(z.object({
    label: z.string(),
    dimensions: z.array(z.object({
      axis: z.string(),
      value: z.number().min(0).max(100),
    })),
  })).describe("3 radar charts with category-specific dimensions"),
})

export const maxDuration = 60

export async function POST(request: Request) {
  try {
    const { idea, category } = await request.json()

    if (!idea) {
      return NextResponse.json({ error: "Idea is required" }, { status: 400 })
    }

    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      output: Output.object({ schema: fullArchetypeSchema }),
      system: `You are a CX expert creating a detailed customer archetype.

PILLAR RATINGS (all 0-10 scale, must include all 10):
Higher Order: Recognition, Integrity, Expectations, Empathy, Emotions
Basic Order: Resolution, Speed, Effort, Enablement, Convenience

RADAR CHARTS - Create 3 charts with axes specific to ${category}:
1. VALUES/MISSIONS - What drives their decisions (5-7 axes)
2. NEEDS/SERVICES - What support they need (6-8 axes)
3. TOUCHPOINTS - Channels they use (6-8 axes)

SOLUTION PRINCIPLES must follow: "Because they [insight], the experience must be [principle]."

All narratives should be first-person (I am..., I want..., I do..., I use...).`,
      prompt: `Create a full detailed archetype for the ${category} industry based on this idea:

Name: ${idea.name}
Role: ${idea.role}
Subtitle: ${idea.subtitle}
Description: ${idea.description}
Key Trait: ${idea.keyTrait}

Expand this into a complete archetype with:
- Complete first-person narratives (Description starting with "I am...", Goals "I want...", Needs "I do...", Touchpoints "I use...")
- All lists (goals, frustrations, behaviors, expectations, barriers, drivers, triggers, mindset, importantSteps)
- 3-5 solution principles in the required format
- All 10 pillar ratings
- 3 radar charts with ${category}-specific axes
- 5-7 relevant tags`,
    })

    return NextResponse.json({ archetype: output })
  } catch (error) {
    console.error("Enrich single error:", error)
    return NextResponse.json({ error: "Failed to enrich archetype" }, { status: 500 })
  }
}
