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
    const { prompt } = body

    const systemPrompt = `You are a CX (Customer Experience) trends expert. Generate 3 relevant CX trends based on the given topic or generate general CX trends if no topic is provided.

For each trend, provide:
1. A concise, impactful title
2. A detailed description (2-3 sentences)
3. An impact score (1-10, where 10 is highest impact)
4. Proof/evidence supporting the trend
5. Source (reputable publication, research, or industry report)
6. Relevant categories from: Customer Experience, Digital Transformation, AI & Automation, Personalization, Omnichannel, Employee Experience, Sustainability, Voice of Customer, Self-Service, Data & Analytics

Respond in JSON format:
{
  "trends": [
    {
      "title": "Trend title",
      "description": "Detailed description",
      "impact_score": 8,
      "proof": "Evidence or statistics",
      "source": "Source name",
      "categories": ["Category1", "Category2"]
    }
  ]
}`

    const userPrompt = prompt 
      ? `Generate CX trends related to: ${prompt}`
      : "Generate 3 current and emerging CX trends for 2024-2025"

    const { text } = await generateText({
      model: gateway("anthropic/claude-sonnet-4"),
      system: systemPrompt,
      prompt: userPrompt,
      maxTokens: 3000
    })

    // Parse the JSON response
    let trendsData
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        trendsData = JSON.parse(jsonMatch[0])
      } else {
        throw new Error("No JSON found in response")
      }
    } catch (parseError) {
      console.error("[Trends Generate] Parse error:", parseError)
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 })
    }

    const createdTrends = []
    
    for (const trend of trendsData.trends || []) {
      const { data, error } = await supabase
        .from("cx_trends")
        .insert({
          title: trend.title,
          description: trend.description,
          impact_score: Math.min(10, Math.max(1, trend.impact_score || 7)),
          proof: trend.proof || "",
          source: trend.source || "AI Generated",
          source_url: trend.source_url || null,
          categories: trend.categories || ["Customer Experience"],
          is_ai_generated: true,
          is_published: false,
          created_by: user.id
        })
        .select()
        .single()

      if (!error && data) {
        createdTrends.push(data)
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: createdTrends.length,
      trends: createdTrends 
    })
  } catch (err) {
    console.error("[Trends Generate] Unexpected error:", err)
    return NextResponse.json({ error: "Failed to generate trends" }, { status: 500 })
  }
}
