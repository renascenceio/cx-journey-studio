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

  // Fetch lineage records from journeys (they have content_uuid fields)
  const { data: journeys } = await supabase
    .from("journeys")
    .select("id, title, content_uuid, original_creator_id, created_at, source_type, lineage_depth, profiles!inner(email)")
    .order("created_at", { ascending: false })
    .limit(500)

  // Build lineage records
  const records = (journeys || []).map((j: Record<string, unknown>) => ({
    id: j.id,
    content_uuid: j.content_uuid || j.id,
    parent_uuid: null,
    original_creator_email: (j.profiles as { email?: string })?.email || "Unknown",
    original_created_at: j.created_at,
    source_type: j.source_type || "original",
    lineage_depth: j.lineage_depth || 0,
    asset_type: "journey",
    asset_title: j.title,
  }))

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
