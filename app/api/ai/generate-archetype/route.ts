import { generateText, Output } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { smartDetectLanguage, getLanguageInstruction } from "@/lib/language-detection"

const anthropic = createAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Schema matching the actual database structure and CX methodology
const archetypeSchema = z.object({
  // Name is a descriptive title like "HOME, SWEET HOME" or "SMART & SAVVY" - NOT a personal name
  name: z.string().describe("Short, evocative archetype title like 'Home, Sweet Home', 'Smart & Savvy', 'Time is Money' - NOT a personal name"),
  role: z.string().describe("Functional role in the journey, e.g. 'Online Shopper', 'Property Buyer', 'Healthcare Patient'"),
  subtitle: z.string().nullable().describe("Latin-inspired motto or tagline, e.g. 'Familia Ante Omnia (Family Over All)', 'Carpe Pretium (Seize the Deal)'"),
  
  // First-person narratives
  description: z.string().describe("First-person 'I am...' narrative paragraph describing who they are"),
  goalsNarrative: z.string().describe("First-person 'I want...' narrative paragraph describing their goals"),
  needsNarrative: z.string().describe("First-person 'I do...' narrative paragraph describing their behaviors and needs"),
  touchpointsNarrative: z.string().describe("First-person 'I use...' narrative paragraph describing their channels and touchpoints"),
  
  // Lists
  goals: z.array(z.string()).describe("3-5 key goals"),
  frustrations: z.array(z.string()).describe("3-5 key frustrations/pain points"),
  behaviors: z.array(z.string()).describe("3-5 observable behaviors"),
  expectations: z.array(z.string()).describe("3-5 expectations from the experience"),
  barriers: z.array(z.string()).describe("3-5 barriers preventing them from achieving goals"),
  drivers: z.array(z.string()).describe("3-5 motivations and drivers influencing decisions"),
  triggers: z.array(z.string()).describe("3-5 events or situations that trigger engagement"),
  mindset: z.array(z.string()).describe("4-6 personality traits/attitudes, e.g. Analytical, Cautious, Caring, Proactive"),
  importantSteps: z.array(z.string()).describe("3-5 key steps in their journey"),
  
  // Solution principles in specific format
  solutionPrinciples: z.array(z.string()).describe("3-5 design principles in format: 'Because they [insight], the experience must be [principle].'"),
  
  tags: z.array(z.string()).describe("4-6 descriptive tags for categorization"),
  valueMetric: z.string().nullable().describe("Market value metric like '50B', '2.4B' or null"),
  basePercentage: z.string().nullable().describe("Market base percentage like '50%', '34%' or null"),
  
  // 10 Pillar ratings - 5 higher order, 5 basic order
  pillarRatings: z.array(z.object({
    name: z.string(),
    score: z.number().min(0).max(10),
    group: z.enum(["higher_order", "basic_order"]),
  })).describe("10 pillar ratings: higher_order (Recognition, Integrity, Expectations, Empathy, Emotions) and basic_order (Resolution, Speed, Effort, Enablement, Convenience)"),
  
  // Radar charts with category-specific dimensions
  radarCharts: z.array(z.object({
    label: z.string(),
    dimensions: z.array(z.object({
      axis: z.string(),
      value: z.number().min(0).max(100),
    })),
  })).describe("2-3 radar charts: one for Values/Missions, one for Needs/Services, one for Touchpoints/Channels - all with category-specific axis labels"),
})

const multipleArchetypesSchema = z.object({
  archetypes: z.array(archetypeSchema).describe("3 distinct customer archetypes"),
})

// Fetch custom prompt from database
async function getCustomPrompt(): Promise<{ system_prompt: string; example_output?: string } | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from("ai_prompts")
      .select("system_prompt, example_output")
      .eq("category", "archetype_generation")
      .single()
    return data
  } catch {
    return null
  }
}

interface ExistingArchetypeInput {
  name: string
  role?: string
  description?: string
  tags?: string[]
}

export async function POST(request: Request) {
  try {
    const { prompt, category, generateMultiple, journeyContext, existingArchetypes, language: explicitLanguage } = await request.json() as {
      prompt: string
      category: string
      generateMultiple?: boolean
      journeyContext?: {
        title?: string
        description?: string
        type?: string
        tags?: string[]
      }
      existingArchetypes?: ExistingArchetypeInput[]
      language?: string
    }

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Smart language detection with priority:
    // 1. Explicit request in prompt ("generate in Spanish", "en español")
    // 2. Language detected from content (title/description)
    // 3. User's manual selection
    // 4. Default to English
    const langResult = smartDetectLanguage({
      prompt,
      title: journeyContext?.title,
      description: journeyContext?.description,
      userSelection: explicitLanguage,
    })
    
    console.log("[v0] Language detection result:", {
      language: langResult.language,
      source: langResult.source,
      reasoning: langResult.reasoning,
    })
    
    const languageInstruction = getLanguageInstruction({
      detectedLanguage: langResult.language,
      languageName: langResult.languageName,
      confidence: langResult.confidence,
      script: "Latin", // Will be overridden by the function if needed
    })

    // Fetch custom prompt from database if available
    const customPromptData = await getCustomPrompt()
    
    // Build context from journey if provided
    const journeyInfo = journeyContext ? `
JOURNEY CONTEXT:
- Journey Title: ${journeyContext.title || "N/A"}
- Journey Description: ${journeyContext.description || "N/A"}
- Journey Type: ${journeyContext.type || "N/A"}
${journeyContext.tags?.length ? `- Tags: ${journeyContext.tags.join(", ")}` : ""}
` : ""

    // Build existing archetypes context to avoid duplicates
    const existingArchetypesInfo = existingArchetypes && existingArchetypes.length > 0 ? `
EXISTING ARCHETYPES (DO NOT CREATE SIMILAR ONES):
The following archetypes already exist for this journey. You MUST create COMPLETELY DIFFERENT archetypes that do NOT overlap with these:
${existingArchetypes.map((a, i) => `
${i + 1}. "${a.name}" (${a.role || "no role"})
   Description: ${a.description || "N/A"}
   Tags: ${a.tags?.join(", ") || "none"}
`).join("")}

CRITICAL: Generate archetypes that represent DIFFERENT customer segments, behaviors, motivations, and needs than the existing ones listed above. Avoid similar names, roles, or characteristics.
` : ""

    const customInstructions = customPromptData?.system_prompt 
      ? `\n\nADDITIONAL INSTRUCTIONS FROM ADMIN:\n${customPromptData.system_prompt}`
      : ""

    const systemPrompt = `You are René AI, a CX (Customer Experience) expert creating behavioral customer archetypes following McKinsey CX methodology.

LANGUAGE REQUIREMENT:
${languageInstruction}

${journeyInfo}${existingArchetypesInfo}${customInstructions}

CRITICAL RULES:
1. Archetype names are DESCRIPTIVE TITLES (e.g., "Home, Sweet Home", "Smart & Savvy", "Time is Money") - NEVER personal names like "John Smith"
2. Subtitles should be Latin-inspired mottos (e.g., "Familia Ante Omnia (Family Over All)")
3. All narratives are first-person: Description (I am...), Goals (I want...), Needs (I do...), Touchpoints (I use...)
4. Solution Principles MUST follow format: "Because they [insight], the experience must be [principle]."

PILLAR RATINGS (all 0-10 scale):
- Higher Order: Recognition, Integrity, Expectations, Empathy, Emotions
- Basic Order: Resolution, Speed, Effort, Enablement, Convenience

RADAR CHARTS - Generate 3 charts with CATEGORY-SPECIFIC axes:
1. Values/Missions chart: axes relevant to what drives decisions in ${category} (e.g., for Real Estate: Recognition, New Image, Future Growth, New Lifestyle, Family Place)
2. Needs/Services chart: axes for what services/support they need (e.g., Service & Support, Content & Inspiration, Offers & Price, Payment Options, Guidance & Advice, Enablement & Tools, Risks & Reassurance, Information)
3. Touchpoints chart: axes for channels they use (e.g., for Real Estate: Online Search, Showrooms, Developer Website, Broker Website, Social Media, Aggregators, Community Website, Family & Friends)

Make archetypes feel real, specific, and useful for journey mapping.`

    if (generateMultiple) {
      // Build the prompt based on whether existing archetypes exist
      const existingNote = existingArchetypes && existingArchetypes.length > 0
        ? `\n\nIMPORTANT: ${existingArchetypes.length} archetype(s) already exist for this journey (${existingArchetypes.map(a => `"${a.name}"`).join(", ")}). You MUST create 3 COMPLETELY DIFFERENT archetypes that do not overlap with these existing ones. Focus on untapped customer segments, different motivations, or contrasting behaviors.`
        : ""

      // Generate 3 archetypes at once
      const { output } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        output: Output.object({ schema: multipleArchetypesSchema }),
        system: systemPrompt,
        prompt: `Generate 3 distinct customer archetypes for the "${category}" industry based on this context: "${prompt}"${existingNote}

Create archetypes that represent different behavioral segments. Examples of segment types (adapt to the industry):
- A family/security-focused segment (e.g., "Home, Sweet Home" for real estate)
- A value/efficiency-focused segment (e.g., "Smart & Savvy" for deal-seekers)
- A premium/experience-focused segment (e.g., "Living the Dream" for aspirational buyers)
- A convenience/time-focused segment (e.g., "Time is Money" for busy professionals)
- A social/community-focused segment (e.g., "Better Together" for social connectors)

REMEMBER:
- Names are descriptive titles, NOT personal names
- Each archetype needs 10 pillar ratings and 3 radar charts with category-specific axes
- Solution principles must follow "Because they [insight], the experience must be [principle]" format
${existingArchetypes && existingArchetypes.length > 0 ? "- DO NOT create archetypes similar to the existing ones listed in the system context" : ""}`,
      })

      return NextResponse.json({ archetypes: output?.archetypes || [] })
    } else {
      // Generate single archetype
      const { output } = await generateText({
        model: anthropic("claude-sonnet-4-20250514"),
        output: Output.object({ schema: archetypeSchema }),
        system: systemPrompt,
        prompt: `Generate a detailed customer archetype for the "${category}" industry based on: "${prompt}"

REMEMBER: Name must be a descriptive title (NOT a personal name), include all 10 pillar ratings, and 3 radar charts with category-specific axes.`,
      })

      return NextResponse.json({ archetype: output })
    }
  } catch (error) {
    console.error("AI archetype generation error:", error)
    return NextResponse.json(
      { error: "Failed to generate archetype" },
      { status: 500 }
    )
  }
}
