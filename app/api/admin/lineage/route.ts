import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()

  // Check admin access
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // Fetch lineage records from journeys
  const { data: journeys, error: journeysError } = await supabase
    .from("journeys")
    .select(`
      id, title, content_uuid, original_creator_id, created_at, source_type, lineage_depth, owner_id,
      owner:profiles!journeys_owner_id_fkey(email, name)
    `)
    .order("created_at", { ascending: false })
    .limit(300)

  // Fetch lineage records from archetypes
  const { data: archetypes, error: archetypesError } = await supabase
    .from("archetypes")
    .select(`
      id, name, content_uuid, original_creator_id, created_at, source_type, lineage_depth, created_by,
      creator:profiles!archetypes_created_by_fkey(email, name)
    `)
    .order("created_at", { ascending: false })
    .limit(200)

  // Build journey lineage records
  const journeyRecords = (journeys || []).map((j: Record<string, unknown>) => ({
    id: j.id,
    content_uuid: j.content_uuid || j.id,
    parent_uuid: null,
    original_creator_email: (j.owner as { email?: string })?.email || "Unknown",
    original_creator_name: (j.owner as { name?: string })?.name || "Unknown User",
    original_created_at: j.created_at,
    source_type: j.source_type || "original",
    lineage_depth: j.lineage_depth || 0,
    asset_type: "journey",
    asset_title: j.title,
  }))

  // Build archetype lineage records
  const archetypeRecords = (archetypes || []).map((a: Record<string, unknown>) => ({
    id: a.id,
    content_uuid: a.content_uuid || a.id,
    parent_uuid: null,
    original_creator_email: (a.creator as { email?: string })?.email || "Unknown",
    original_creator_name: (a.creator as { name?: string })?.name || "Unknown User",
    original_created_at: a.created_at,
    source_type: a.source_type || "original",
    lineage_depth: a.lineage_depth || 0,
    asset_type: "archetype",
    asset_title: a.name,
  }))

  // Combine all records
  const records = [...journeyRecords, ...archetypeRecords].sort(
    (a, b) => new Date(b.original_created_at).getTime() - new Date(a.original_created_at).getTime()
  )

  // Calculate stats
  const stats = {
    total: records.length,
    bySourceType: records.reduce((acc: Record<string, number>, r) => {
      acc[r.source_type] = (acc[r.source_type] || 0) + 1
      return acc
    }, {}),
    byAssetType: records.reduce((acc: Record<string, number>, r) => {
      acc[r.asset_type] = (acc[r.asset_type] || 0) + 1
      return acc
    }, {}),
    aiGenerated: records.filter((r) => r.source_type === "ai_generated").length,
    derivatives: records.filter((r) => r.lineage_depth > 0).length,
  }

  return NextResponse.json({ records, stats })
}
