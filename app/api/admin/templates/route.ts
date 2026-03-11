import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role, organization_id").eq("id", user.id).single()
  if (!profile || (profile.role !== "admin" && profile.role !== "journey_master")) return null
  return { userId: user.id, orgId: profile.organization_id }
}

// GET supports ?scope=my|public (defaults to public)
export async function GET(request: Request) {
  const supabase = await createClient()
  const url = new URL(request.url)
  const scope = url.searchParams.get("scope") || "public"

  if (scope === "my") {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json([], { status: 200 })

    const { data } = await supabase
      .from("journey_templates")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: false })

    return NextResponse.json(data || [])
  }

  // Default: public templates
  const { data } = await supabase
    .from("journey_templates")
    .select("*")
    .eq("is_public", true)
    .order("created_at", { ascending: false })

  return NextResponse.json(data || [])
}

// POST is admin-only
export async function POST(request: Request) {
  const supabase = await createClient()
  const admin = await verifyAdmin(supabase)
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await request.json()
  const { name, description, category, stages } = body

  const { data, error } = await supabase
    .from("journey_templates")
    .insert({
      name: name || "Untitled Template",
      description: description || "",
      category: category || "general",
      stages: stages || [],
      is_public: true,
      created_by: admin.userId,
      organization_id: admin.orgId,
    })
    .select("id")
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
