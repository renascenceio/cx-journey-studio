import { generateText } from "ai"
import { createAnthropic } from "@ai-sdk/anthropic"

export async function POST(req: Request) {
  try {
    const { touchPoint, stageName, stepName, journeyTitle, context, industry } = await req.json()

    // Handle both old touchpoint-based and new context-based generation
    const prompt = touchPoint 
      ? `Journey: ${journeyTitle || "Customer Journey"}
Stage: ${stageName || "Unknown"}
Step: ${stepName || "Unknown"}

Touch Point: ${touchPoint.description}
Channel: ${touchPoint.channel}
Emotional Score: ${touchPoint.emotionalScore} (scale: -5 to +5)

Pain Points:
${touchPoint.painPoints?.map((pp: { severity: string; description: string }) => `- [${pp.severity.toUpperCase()}] ${pp.description}`).join("\n") || "None identified"}

Highlights:
${touchPoint.highlights?.map((hl: { impact: string; description: string }) => `- [${hl.impact.toUpperCase()} impact] ${hl.description}`).join("\n") || "None identified"}

Generate 4-6 practical solutions to improve this touch point.`
      : `Industry: ${industry || "General"}
Context: ${context || "General customer experience improvement"}

Generate 4-6 practical, actionable CX solutions for this context. Consider:
- Behavioral solutions (psychology, nudges, habits)
- Ritual solutions (memorable moments, traditions)
- Industrial solutions (process efficiency, operations)
- Technological solutions (digital tools, automation)
- Social solutions (community, human connection)
- Environmental solutions (physical space, ambiance)

Be specific and actionable, not generic advice.`

    const anthropic = createAnthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const result = await generateText({
      model: anthropic("claude-sonnet-4-20250514"),
      prompt: `You are a senior CX (Customer Experience) strategist and service design expert.

Generate practical, actionable solutions to improve customer experiences.

Guidelines:
- Focus on pain points and opportunities for improvement
- Balance quick wins with strategic improvements
- Reference CX best practices, behavioral psychology, and service design principles
- Be specific and tailored to the context
- Distribute solutions across different categories for variety

${prompt}

Respond ONLY with a JSON array of 4-6 solutions in this exact format:
[
  {"title": "Solution title", "description": "2-3 sentence explanation", "category": "behavioral", "impact": "high", "effort": "low"},
  ...
]

Categories must be one of: behavioral, rituals, industrial, technological, social, environmental
Impact must be one of: high, medium, low (how much it will improve the customer experience)
Effort must be one of: high, medium, low (how much effort to implement - low is easiest)

Aim for a good mix - include at least one "quick win" (high impact, low effort).

IMPORTANT: Return ONLY the JSON array, no markdown, no explanation.`,
    })

    // Parse the JSON from the response
    let solutions: Array<{ title: string; description: string; category: string; impact?: string; effort?: string }>
    try {
      const text = result.text.trim()
      const jsonStr = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim()
      solutions = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error("[v0] JSON parse error:", parseError, "Text:", result.text)
      return Response.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    // Add unique IDs for frontend selection
    const solutionsWithIds = solutions.map((sol, idx) => ({
      ...sol,
      id: `generated-${Date.now()}-${idx}`,
    }))

    return Response.json({ solutions: solutionsWithIds })
  } catch (error) {
    console.error("[v0] Generate solutions error:", error)
    return Response.json({ error: "Failed to generate solutions", details: String(error) }, { status: 500 })
  }
}
