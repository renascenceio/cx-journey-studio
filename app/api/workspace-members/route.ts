import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!profile?.organization_id) return NextResponse.json([])

  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, role, avatar")
    .eq("organization_id", profile.organization_id)
    .order("name", { ascending: true })

  return NextResponse.json(data || [])
}
