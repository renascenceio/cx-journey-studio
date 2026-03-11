import { createClient, createAdminClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { workspaceId } = await request.json()
  
  if (!workspaceId) {
    return NextResponse.json({ error: "Workspace ID required" }, { status: 400 })
  }

  // Use admin client to bypass RLS
  const adminClient = createAdminClient()

  // Verify user is a member of this workspace
  const { data: membership } = await adminClient
    .from("organization_members")
    .select("id")
    .eq("organization_id", workspaceId)
    .eq("user_id", user.id)
    .single()

  if (!membership) {
    return NextResponse.json({ error: "Not a member of this workspace" }, { status: 403 })
  }

  // Update user's active workspace
  const { error } = await adminClient
    .from("profiles")
    .update({ organization_id: workspaceId })
    .eq("id", user.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
