import { getSolutions } from "@/lib/data"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const savedOnly = searchParams.get("saved") === "true"
  const solutions = await getSolutions()
  if (savedOnly) {
    return NextResponse.json(solutions.filter((s) => s.saved))
  }
  return NextResponse.json(solutions)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await request.json()
  const { title, description, category, tags, metadata, industry, impact, effort } = body
  
  if (!title || !description) {
    return NextResponse.json({ error: "title and description are required" }, { status: 400 })
  }
  
  // Database check constraint only allows these categories:
  // 'behavioral', 'rituals', 'industrial', 'technological', 'social', 'environmental', 'archetype'
  const allowedCategories = ["behavioral", "rituals", "industrial", "technological", "social", "environmental", "archetype"]
  const isArchetypeSolution = metadata?.archetypeId || category === "archetype"
  const finalCategory = isArchetypeSolution ? "archetype" : (allowedCategories.includes(category) ? category : "behavioral")
  
  // Validate impact and effort values
  const allowedLevels = ["high", "medium", "low"]
  const finalImpact = allowedLevels.includes(impact) ? impact : null
  const finalEffort = allowedLevels.includes(effort) ? effort : null
  
  // Insert into solutions table
  const { data, error } = await supabase
    .from("solutions")
    .insert({
      title,
      description,
      category: finalCategory,
      tags: tags || [],
      saved: true,
      source: isArchetypeSolution ? `archetype:${metadata?.archetypeId || 'unknown'}` : "user",
      relevance: 80,
      upvotes: 0,
      is_crowd: false,
      created_by: user.id,
      industry: industry || null,
      impact: finalImpact,
      effort: finalEffort,
    })
    .select("id")
    .single()
    
  if (error) {
    console.error("Failed to create solution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ id: data.id })
}

// Update a solution (title, description)
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  
  const body = await request.json()
  const { id, title, description, industry, impact, effort } = body
  
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 })
  }
  
  // Verify user owns this solution (via created_by field)
  const { data: existing } = await supabase
    .from("solutions")
    .select("created_by")
    .eq("id", id)
    .single()
  
  if (!existing || existing.created_by !== user.id) {
    return NextResponse.json({ error: "Not authorized to edit this solution" }, { status: 403 })
  }
  
  // Validate impact and effort values
  const allowedLevels = ["high", "medium", "low"]
  
  // Build update object with only provided fields
  const updates: Record<string, unknown> = {}
  if (title !== undefined) updates.title = title
  if (description !== undefined) updates.description = description
  if (industry !== undefined) updates.industry = industry
  if (impact !== undefined) updates.impact = allowedLevels.includes(impact) ? impact : null
  if (effort !== undefined) updates.effort = allowedLevels.includes(effort) ? effort : null
  
  const { error } = await supabase
    .from("solutions")
    .update(updates)
    .eq("id", id)
  
  if (error) {
    console.error("Failed to update solution:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
