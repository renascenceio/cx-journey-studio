import { generateText, Output } from "ai"
import { z } from "zod"

const touchPointSchema = z.object({
  channel: z.string().describe("The channel where this touchpoint occurs, e.g. Website, Mobile App, Email, Phone, In-Store, Chat, Social Media"),
  description: z.string().describe("Description of what happens at this touchpoint"),
  emotionalScore: z.number().min(-5).max(5).describe("Emotional score from -5 (very negative) to +5 (very positive)"),
  painPoints: z.array(z.object({
    description: z.string(),
    severity: z.enum(["low", "medium", "high", "critical"]),
  })).describe("Pain points at this touchpoint"),
  highlights: z.array(z.object({
    description: z.string(),
    impact: z.enum(["low", "medium", "high"]),
  })).describe("Positive highlights at this touchpoint"),
})

const stepSchema = z.object({
  name: z.string().describe("Name of the step"),
  description: z.string().nullable().describe("Optional description of the step"),
  touchPoints: z.array(touchPointSchema).describe("Touchpoints within this step"),
})

const stageSchema = z.object({
  name: z.string().describe("Name of the stage"),
  steps: z.array(stepSchema).min(1).describe("Steps within this stage"),
})

const importedJourneySchema = z.object({
  title: z.string().describe("Title of the journey"),
  description: z.string().nullable().describe("Description of the journey"),
  stages: z.array(stageSchema).min(1).describe("All stages in the journey, in order"),
  suggestedTags: z.array(z.string()).describe("Suggested tags for this journey based on the content"),
  suggestedType: z.enum(["current", "future", "template"]).describe("Suggested journey type based on the content"),
  confidence: z.number().min(0).max(100).describe("Confidence score 0-100 for how well the import engine understood the source material"),
  notes: z.string().nullable().describe("Any notes about ambiguities or assumptions made during parsing"),
})

export async function POST(req: Request) {
  try {
    const { content, sourceType, fileName } = await req.json()

    if (!content || typeof content !== "string") {
      return Response.json({ error: "No content provided" }, { status: 400 })
    }

    const systemPrompt = `You are an expert CX Journey Mapping import engine. Your job is to analyze any kind of customer journey content and extract a structured journey map from it.

You understand all journey mapping frameworks and formats including:
- Service blueprints (with frontstage/backstage)
- Experience maps and empathy maps
- Customer Decision Journeys (McKinsey)
- JTBD (Jobs to be Done) journey maps
- Linear step-by-step journey documents
- Tabular/CSV journey data
- Slide-based journey presentations
- Markdown/text journey descriptions
- Swimlane diagrams described in text

PARSING RULES:
1. Identify STAGES (major phases like Awareness, Consideration, Purchase, Onboarding, Retention)
2. Within each stage, identify STEPS (specific actions or sub-phases)
3. Within each step, identify TOUCHPOINTS (specific interactions on specific channels)
4. Assign emotional scores based on context clues (positive language = positive score, pain points = negative)
5. Extract pain points and highlights from the content
6. If the source is ambiguous, make reasonable assumptions and note them
7. If the source is a CSV, parse columns intelligently (column headers often indicate stages or data dimensions)
8. Channels should be one of: Website, Mobile App, Email, Phone, In-Store, Chat, Social Media, SMS, Push Notification, Direct Mail, or other contextually appropriate channel names
9. Generate sensible step names and descriptions even if the source doesn't explicitly name them
10. The confidence score should reflect how structured and clear the source material was

SOURCE TYPE: ${sourceType || "unknown"}
${fileName ? `FILE NAME: ${fileName}` : ""}
`

    const { output } = await generateText({
      model: "anthropic/claude-sonnet-4.6",
      output: Output.object({
        schema: importedJourneySchema,
      }),
      messages: [
        {
          role: "user",
          content: `Parse the following ${sourceType || "content"} into a structured customer journey map:\n\n---\n${content}\n---`,
        },
      ],
      system: systemPrompt,
    })

    return Response.json({ journey: output })
  } catch (error) {
    console.error("[import-journey] Error:", error)
    return Response.json(
      { error: "Failed to parse journey content. Please try again or adjust the content." },
      { status: 500 }
    )
  }
}
