import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single()
  if (!profile || (profile.role !== "admin" && profile.role !== "journey_master")) return null
  return { userId: user.id, orgId: profile.organization_id }
}

export async function GET() {
  const supabase = await createClient()
  const admin = await verifyAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data } = await supabase
    .from("solutions")
    .select("*")
    .order("relevance", { ascending: false })

  const solutions = (data || []).map((s) => ({
    id: s.id,
    title: s.title,
    vendor: s.vendor || "",
    description: s.description || "",
    category: s.category || "other",
    tags: s.tags || [],
    relevance: s.relevance || 0,
    isCrowd: s.is_crowd || false,
    url: s.url || "",
    createdAt: s.created_at,
  }))

  return NextResponse.json({ solutions })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await verifyAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { error } = await supabase.from("solutions").insert({
    title: body.title,
    vendor: body.vendor || "",
    description: body.description || "",
    category: body.category || "other",
    tags: body.tags || [],
    relevance: body.relevance || 80,
    is_crowd: body.is_crowd || false,
    url: body.url || "",
    organization_id: admin.orgId,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
