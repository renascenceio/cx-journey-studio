import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get user's profile for organization_id
  let organizationId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()
    organizationId = profile?.organization_id || null
  }

  // Fetch all solutions (platform, crowd, and user's own)
  const { data: allSolutions, error } = await supabase
    .from("solutions")
    .select("id, title, description, category, tags, relevance, is_crowd, is_public, created_by")
    .order("relevance", { ascending: false })
    .limit(100)

  if (error) {
    console.error("[v0] Solutions search error:", error)
    return NextResponse.json({ platform: [], crowd: [], my: [] })
  }

  const platform = allSolutions?.filter(s => !s.is_crowd && !s.created_by) || []
  const crowd = allSolutions?.filter(s => s.is_crowd || s.is_public) || []
  const my = user ? allSolutions?.filter(s => s.created_by === user.id) || [] : []

  return NextResponse.json({ platform, crowd, my })
}
