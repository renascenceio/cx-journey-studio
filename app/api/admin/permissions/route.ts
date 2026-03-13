import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

const ALL_PERMISSIONS = [
  "view_dashboard",
  "view_analytics",
  "view_finance",
  "manage_users",
  "manage_billing",
  "manage_templates",
  "manage_solutions",
  "manage_legal",
  "manage_lineage",
  "manage_trends",
  "manage_crowdsource",
  "manage_brand",
  "manage_notifications",
  "manage_config",
  "manage_ai_prompts",
  "manage_translations",
  "manage_support",
  "view_system_status",
  "manage_admin_access",
]

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId")
  
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 })
  }
  
  const supabase = await createClient()
  
  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, organization_id")
    .eq("id", userId)
    .single()
  
  // Check if super admin
  if (profile?.email === SUPER_ADMIN_EMAIL) {
    return NextResponse.json({
      type: "super_admin",
      permissions: ALL_PERMISSIONS,
    })
  }
  
  // Check if site admin
  const { data: siteAdmin } = await supabase
    .from("site_admins")
    .select("permissions, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()
  
  if (siteAdmin) {
    return NextResponse.json({
      type: "site_admin",
      permissions: siteAdmin.permissions || [],
    })
  }
  
  // Check if workspace admin
  const { data: workspaceAdmin } = await supabase
    .from("workspace_admins")
    .select("permissions, organization_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()
  
  if (workspaceAdmin) {
    return NextResponse.json({
      type: "workspace_admin",
      permissions: workspaceAdmin.permissions || [],
      organizationId: workspaceAdmin.organization_id,
    })
  }
  
  // No admin access
  return NextResponse.json({
    type: "none",
    permissions: [],
  })
}
