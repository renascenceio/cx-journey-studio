import { generateText, Output } from "ai"
import { z } from "zod"

const pillarRatingSchema = z.object({
  name: z.string().describe("Pillar name, e.g. Recognition, Integrity, Expectations, Empathy, Emotions, Resolution, Speed, Effort, Enablement, Convenience"),
  score: z.number().min(0).max(10).describe("Score from 0 to 10"),
  group: z.enum(["higher_order", "basic_order"]).describe("higher_order: Recognition, Integrity, Expectations, Empathy, Emotions. basic_order: Resolution, Speed, Effort, Enablement, Convenience"),
})

const radarDimensionSchema = z.object({
  axis: z.string().describe("Label for this radar dimension"),
  value: z.number().min(0).max(100).describe("Value 0-100"),
})

const radarChartSchema = z.object({
  label: z.string().describe("Chart title, e.g. Values, Channels, Needs"),
  dimensions: z.array(radarDimensionSchema).min(3).describe("At least 3 dimensions for the radar chart"),
})

const importedArchetypeSchema = z.object({
  name: z.string().describe("Short, evocative archetype name like 'Home, Sweet Home' or 'Smart & Savvy'"),
  role: z.string().describe("Functional role, e.g. 'Online Shopper', 'Property Buyer', 'Healthcare Patient'"),
  subtitle: z.string().nullable().describe("Latin-inspired motto or tagline, e.g. 'Familia Ante Omnia (Family Over All)'"),
  category: z.enum(["e-commerce", "banking", "healthcare", "saas", "real_estate", "insurance", "hospitality", "telecommunications"]).describe("Industry category"),
  description: z.string().describe("First-person narrative: 'I am...' paragraph describing who they are"),
  goalsNarrative: z.string().describe("First-person narrative: 'I want...' paragraph describing their goals"),
  needsNarrative: z.string().describe("First-person narrative: 'I do...' paragraph describing their behaviors and needs"),
  touchpointsNarrative: z.string().describe("First-person narrative: 'I use...' paragraph describing their channels and touchpoints"),
  goals: z.array(z.string()).describe("List of key goals"),
  frustrations: z.array(z.string()).describe("List of key frustrations/pain points"),
  behaviors: z.array(z.string()).describe("List of observable behaviors"),
  expectations: z.array(z.string()).describe("What they expect from the experience"),
  barriers: z.array(z.string()).describe("Barriers preventing them from achieving goals"),
  drivers: z.array(z.string()).describe("What motivates and drives their decisions"),
  importantSteps: z.array(z.string()).describe("Key steps in their journey"),
  triggers: z.array(z.string()).describe("Events or situations that trigger engagement"),
  mindset: z.array(z.string()).describe("Personality traits and attitudes, e.g. Analytical, Cautious, Caring"),
  solutionPrinciples: z.array(z.string()).describe("Design principles written as: 'Because they [insight], the experience must be [principle].'"),
  valueMetric: z.string().nullable().describe("Market value metric, e.g. '50B', '2.4B', or null if unknown"),
  basePercentage: z.string().nullable().describe("Market base percentage, e.g. '50%', '34%', or null if unknown"),
  pillarRatings: z.array(pillarRatingSchema).describe("10 pillar ratings across higher and basic order pillars"),
  radarCharts: z.array(radarChartSchema).min(1).describe("1-3 radar charts showing key dimensions like Values, Channels, Needs"),
  tags: z.array(z.string()).describe("Relevant tags for categorization"),
  confidence: z.number().min(0).max(100).describe("Confidence score 0-100 for the quality of the import"),
  notes: z.string().nullable().describe("Notes about assumptions or ambiguities during parsing"),
})

export async function POST(req: Request) {
  try {
    const { content, sourceType, fileName } = await req.json()

    if (!content || typeof content !== "string") {
      return Response.json({ error: "No content provided" }, { status: 400 })
    }

    const systemPrompt = `You are an expert CX Archetype import and enrichment engine. Your job is to analyze any kind of customer archetype, persona, or user profile content and extract a rich, structured archetype from it.

You understand all persona and archetype frameworks including:
- Buyer personas (HubSpot style, with demographics and behaviors)
- User personas (UX research style, with goals, frustrations, scenarios)
- Customer archetypes (behavioral-driven, with motivations and mindsets)
- Empathy maps (says/thinks/does/feels quadrants)
- Jobs to Be Done profiles
- Behavioral segmentation profiles
- Psychographic profiles
- Customer DNA / Value proposition canvas segments
- McKinsey archetype models with pillar ratings
- Slide-based persona decks

PARSING AND ENRICHMENT RULES:
1. Extract the core identity: name, role, and generate a memorable subtitle/motto
2. Write rich first-person narratives for each dimension (I am / I want / I do / I use). Even if the source is brief bullet points, expand them into thoughtful paragraphs
3. Extract and ENRICH lists: goals, frustrations, behaviors, expectations, barriers, drivers, important steps, triggers, mindset. If the source only provides 2-3 items, infer additional relevant ones from context
4. Generate solution principles in the format: "Because they [insight], the experience must be [principle]."
5. Infer pillar ratings (0-10) based on context clues:
   - Higher order: Recognition, Integrity, Expectations, Empathy, Emotions
   - Basic order: Resolution, Speed, Effort, Enablement, Convenience
6. Create 1-3 radar charts with relevant dimensions (Values, Channels, Needs, Information Sources, etc.)
7. Assign appropriate industry category
8. Generate market value/base metrics if enough context exists, otherwise null
9. If the source material is sparse (e.g. just a name and a few bullet points), ENRICH heavily with plausible details that match the persona's context
10. The confidence score reflects both source quality AND your enrichment confidence

SOURCE TYPE: ${sourceType || "unknown"}
${fileName ? `FILE NAME: ${fileName}` : ""}
`

    const { output } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      output: Output.object({
        schema: importedArchetypeSchema,
      }),
      messages: [
        {
          role: "user",
          content: `Parse and enrich the following ${sourceType || "content"} into a fully structured customer archetype:\n\n---\n${content}\n---`,
        },
      ],
      system: systemPrompt,
    })

    return Response.json({ archetype: output })
  } catch (error) {
    console.error("[import-archetype] Error:", error)
    return Response.json(
      { error: "Failed to parse archetype content. Please try again or adjust the content." },
      { status: 500 }
    )
  }
}
