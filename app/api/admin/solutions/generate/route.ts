import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { generateText } from "ai"
import { gateway } from "@ai-sdk/gateway"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { description, industry } = body

    const industryContext = industry 
      ? `Focus specifically on the ${industry.replace(/_/g, " ")} industry.`
      : "This should be applicable across multiple industries."

    const systemPrompt = `You are a CX solutions expert. Generate a solution catalog entry based on the user's description.

${industryContext}

Respond in JSON format with these fields:
{
  "title": "Solution name (concise, professional)",
  "vendor": "Company/vendor name (can be fictional or leave as 'Various')",
  "description": "Detailed description of what the solution does and its benefits (2-3 paragraphs)",
  "category": "One of: analytics, feedback, engagement, personalization, automation, cx-strategy, journey-mapping, voice-of-customer, other",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "relevance": 85,
  "url": ""
}`

    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      system: systemPrompt,
      prompt: `Create a CX solution catalog entry for: ${description}`,
      maxTokens: 1500
    })

    // Parse the JSON response
    let solutionData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        solutionData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[Solutions Generate] Parse error:", parseError)
      solutionData = {
        title: description.slice(0, 50),
        vendor: "Various",
        description: description,
        category: "other",
        tags: ["cx", "solution"],
        relevance: 80,
        url: ""
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from("cx_solutions")
      .insert({
        title: solutionData.title,
        vendor: solutionData.vendor || "Various",
        description: solutionData.description,
        category: solutionData.category || "other",
        tags: solutionData.tags || [],
        relevance: solutionData.relevance || 80,
        is_crowd: false,
        is_trend: false,
        url: solutionData.url || "",
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error("[Solutions Generate] Insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error("[Solutions Generate] Unexpected error:", err)
    return NextResponse.json({ error: "Failed to generate solution" }, { status: 500 })
  }
}
