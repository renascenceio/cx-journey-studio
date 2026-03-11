import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch AI prompts (optionally by category)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  
  const supabase = await createClient()
  
  let query = supabase.from("ai_prompts").select("*")
  
  if (category) {
    query = query.eq("category", category)
  }
  
  const { data, error } = await query.order("created_at", { ascending: true })
  
  if (error) {
    console.error("[v0] Failed to fetch AI prompts:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // If fetching single category, return just that prompt
  if (category && data?.length === 1) {
    return NextResponse.json(data[0])
  }
  
  return NextResponse.json(data || [])
}

// PUT - Update an AI prompt (by id or category)
export async function PUT(request: Request) {
  const { id, category, system_prompt, example_output, name, description } = await request.json()
  
  if (!id && !category) {
    return NextResponse.json({ error: "Prompt ID or category is required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  let query = supabase
    .from("ai_prompts")
    .update({
      system_prompt,
      example_output,
      name,
      description,
      updated_at: new Date().toISOString(),
    })
  
  // Use category if provided, otherwise use id
  if (category) {
    query = query.eq("category", category)
  } else {
    query = query.eq("id", id)
  }
  
  const { data, error } = await query.select().single()
  
  if (error) {
    console.error("[v0] Failed to update AI prompt:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
