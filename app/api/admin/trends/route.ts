import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data, error } = await supabase
    .from("cx_trends")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    // If table doesn't exist yet, return empty array
    if (error.code === "42P01") {
      return NextResponse.json([])
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  
  const { data, error } = await supabase
    .from("cx_trends")
    .insert({
      title: body.title,
      description: body.description,
      impact_score: body.impact_score || 5,
      proof: body.proof,
      source: body.source,
      source_url: body.source_url,
      categories: body.categories || [],
      is_ai_generated: body.is_ai_generated || false,
      is_published: false,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const ids = body.ids as string[]

  if (!ids || ids.length === 0) {
    return NextResponse.json({ error: "No IDs provided" }, { status: 400 })
  }

  const { error } = await supabase
    .from("cx_trends")
    .delete()
    .in("id", ids)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: ids.length })
}
