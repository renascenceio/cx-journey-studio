import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function verifyAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (!profile || (profile.role !== "admin" && profile.role !== "journey_master")) return null
  return user.id
}

export async function GET() {
  const supabase = await createClient()
  const adminId = await verifyAdmin(supabase)
  if (!adminId) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email, role, organization_id, created_at, organizations(name)")
    .order("created_at", { ascending: false })

  const users = (profiles || []).map((p) => ({
    id: p.id,
    name: p.name || "Unknown",
    email: p.email || "",
    role: p.role || "contributor",
    orgName: (p.organizations as { name: string } | null)?.name || "",
    createdAt: p.created_at,
  }))

  return NextResponse.json({ users })
}
