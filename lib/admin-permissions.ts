"use server"

import { createClient } from "@/lib/supabase/server"

// The only super admin email - hardcoded for maximum security
export const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

// Admin types in order of privilege
export type AdminType = "super_admin" | "site_admin" | "workspace_admin" | "none"

// All available admin permissions
export const ADMIN_PERMISSIONS = {
  // Dashboard & Analytics
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_FINANCE: "view_finance",
  
  // User Management
  MANAGE_USERS: "manage_users",
  MANAGE_BILLING: "manage_billing",
  
  // Content Management
  MANAGE_TEMPLATES: "manage_templates",
  MANAGE_SOLUTIONS: "manage_solutions",
  MANAGE_LEGAL: "manage_legal",
  MANAGE_LINEAGE: "manage_lineage",
  MANAGE_TRENDS: "manage_trends",
  MANAGE_CROWDSOURCE: "manage_crowdsource",
  
  // Brand & Notifications
  MANAGE_BRAND: "manage_brand",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  
  // Configuration
  MANAGE_CONFIG: "manage_config",
  MANAGE_AI_PROMPTS: "manage_ai_prompts",
  MANAGE_TRANSLATIONS: "manage_translations",
  
  // System
  MANAGE_SUPPORT: "manage_support",
  VIEW_SYSTEM_STATUS: "view_system_status",
  MANAGE_ADMIN_ACCESS: "manage_admin_access",
} as const

export type Permission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS]

// Permission groups for easier assignment
export const PERMISSION_GROUPS = {
  content_manager: [
    ADMIN_PERMISSIONS.MANAGE_TEMPLATES,
    ADMIN_PERMISSIONS.MANAGE_SOLUTIONS,
    ADMIN_PERMISSIONS.MANAGE_LEGAL,
    ADMIN_PERMISSIONS.MANAGE_TRENDS,
    ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE,
  ],
  brand_manager: [
    ADMIN_PERMISSIONS.MANAGE_BRAND,
    ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS,
  ],
  support_manager: [
    ADMIN_PERMISSIONS.MANAGE_SUPPORT,
    ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS,
  ],
  analytics_viewer: [
    ADMIN_PERMISSIONS.VIEW_DASHBOARD,
    ADMIN_PERMISSIONS.VIEW_ANALYTICS,
  ],
  full_site_admin: Object.values(ADMIN_PERMISSIONS).filter(
    p => p !== ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS
  ),
}

// Map admin panel sections to required permissions
export const SECTION_PERMISSIONS: Record<string, Permission[]> = {
  // Dashboard
  "/admin": [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
  "/admin/analytics": [ADMIN_PERMISSIONS.VIEW_ANALYTICS],
  "/admin/finance": [ADMIN_PERMISSIONS.VIEW_FINANCE],
  
  // Users
  "/admin/users": [ADMIN_PERMISSIONS.MANAGE_USERS],
  "/admin/billing": [ADMIN_PERMISSIONS.MANAGE_BILLING],
  "/admin/credits-faq": [ADMIN_PERMISSIONS.MANAGE_BILLING],
  
  // Content
  "/admin/templates": [ADMIN_PERMISSIONS.MANAGE_TEMPLATES],
  "/admin/solutions": [ADMIN_PERMISSIONS.MANAGE_SOLUTIONS],
  "/admin/legal": [ADMIN_PERMISSIONS.MANAGE_LEGAL],
  "/admin/lineage": [ADMIN_PERMISSIONS.MANAGE_LINEAGE],
  "/admin/trends": [ADMIN_PERMISSIONS.MANAGE_TRENDS],
  "/admin/crowdsource": [ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE],
  
  // Brand
  "/admin/brand": [ADMIN_PERMISSIONS.MANAGE_BRAND],
  "/admin/notifications": [ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS],
  
  // Configuration
  "/admin/config": [ADMIN_PERMISSIONS.MANAGE_CONFIG],
  "/admin/ai-prompts": [ADMIN_PERMISSIONS.MANAGE_AI_PROMPTS],
  "/admin/translations": [ADMIN_PERMISSIONS.MANAGE_TRANSLATIONS],
  
  // System
  "/admin/support": [ADMIN_PERMISSIONS.MANAGE_SUPPORT],
  "/admin/status": [ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS],
  "/admin/access": [ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS],
}

export interface AdminInfo {
  type: AdminType
  permissions: Permission[]
  organizationId?: string // For workspace admins
}

/**
 * Check if a user is the super admin
 */
export async function isSuperAdmin(userId: string): Promise<boolean> {
  const supabase = await createClient()
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single()
  
  return profile?.email === SUPER_ADMIN_EMAIL
}

/**
 * Get admin info for a user - their type and permissions
 */
export async function getAdminInfo(userId: string): Promise<AdminInfo> {
  const supabase = await createClient()
  
  // Check if super admin first
  const { data: profile } = await supabase
    .from("profiles")
    .select("email, organization_id")
    .eq("id", userId)
    .single()
  
  if (profile?.email === SUPER_ADMIN_EMAIL) {
    return {
      type: "super_admin",
      permissions: Object.values(ADMIN_PERMISSIONS),
    }
  }
  
  // Check if site admin
  const { data: siteAdmin } = await supabase
    .from("site_admins")
    .select("permissions, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()
  
  if (siteAdmin) {
    return {
      type: "site_admin",
      permissions: siteAdmin.permissions as Permission[],
    }
  }
  
  // Check if workspace admin
  const { data: workspaceAdmin } = await supabase
    .from("workspace_admins")
    .select("permissions, organization_id, is_active")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single()
  
  if (workspaceAdmin) {
    return {
      type: "workspace_admin",
      permissions: workspaceAdmin.permissions as Permission[],
      organizationId: workspaceAdmin.organization_id,
    }
  }
  
  return {
    type: "none",
    permissions: [],
  }
}

/**
 * Check if a user has a specific permission
 */
export async function hasPermission(userId: string, permission: Permission): Promise<boolean> {
  const adminInfo = await getAdminInfo(userId)
  
  // Super admin has all permissions
  if (adminInfo.type === "super_admin") {
    return true
  }
  
  return adminInfo.permissions.includes(permission)
}

/**
 * Check if a user has any of the specified permissions
 */
export async function hasAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
  const adminInfo = await getAdminInfo(userId)
  
  if (adminInfo.type === "super_admin") {
    return true
  }
  
  return permissions.some(p => adminInfo.permissions.includes(p))
}

/**
 * Check if a user can access a specific admin section
 */
export async function canAccessSection(userId: string, path: string): Promise<boolean> {
  const adminInfo = await getAdminInfo(userId)
  
  // Super admin can access everything
  if (adminInfo.type === "super_admin") {
    return true
  }
  
  // No admin access
  if (adminInfo.type === "none") {
    return false
  }
  
  // Get required permissions for the path
  const requiredPermissions = SECTION_PERMISSIONS[path]
  
  // If no specific permissions required, allow dashboard access
  if (!requiredPermissions) {
    return adminInfo.permissions.includes(ADMIN_PERMISSIONS.VIEW_DASHBOARD)
  }
  
  // Check if user has any of the required permissions
  return requiredPermissions.some(p => adminInfo.permissions.includes(p))
}

/**
 * Get all sections a user can access
 */
export async function getAccessibleSections(userId: string): Promise<string[]> {
  const adminInfo = await getAdminInfo(userId)
  
  // Super admin can access everything
  if (adminInfo.type === "super_admin") {
    return Object.keys(SECTION_PERMISSIONS)
  }
  
  // No admin access
  if (adminInfo.type === "none") {
    return []
  }
  
  // Filter sections based on permissions
  return Object.entries(SECTION_PERMISSIONS)
    .filter(([, requiredPermissions]) => 
      requiredPermissions.some(p => adminInfo.permissions.includes(p))
    )
    .map(([path]) => path)
}

/**
 * Grant site admin access to a user (super admin only)
 */
export async function grantSiteAdmin(
  grantedByUserId: string,
  targetUserId: string,
  permissions: Permission[],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify granter is super admin
  if (!await isSuperAdmin(grantedByUserId)) {
    return { success: false, error: "Only super admin can grant site admin access" }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("site_admins")
    .upsert({
      user_id: targetUserId,
      permissions,
      granted_by: grantedByUserId,
      granted_at: new Date().toISOString(),
      is_active: true,
      notes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id",
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Revoke site admin access (super admin only)
 */
export async function revokeSiteAdmin(
  revokedByUserId: string,
  targetUserId: string
): Promise<{ success: boolean; error?: string }> {
  if (!await isSuperAdmin(revokedByUserId)) {
    return { success: false, error: "Only super admin can revoke site admin access" }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("site_admins")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", targetUserId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Grant workspace admin access (super admin or site admin with manage_admin_access)
 */
export async function grantWorkspaceAdmin(
  grantedByUserId: string,
  targetUserId: string,
  organizationId: string,
  permissions: Permission[],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  // Verify granter has permission
  const hasAccess = await hasPermission(grantedByUserId, ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS)
  if (!hasAccess) {
    return { success: false, error: "You don't have permission to grant workspace admin access" }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("workspace_admins")
    .upsert({
      user_id: targetUserId,
      organization_id: organizationId,
      permissions,
      granted_by: grantedByUserId,
      granted_at: new Date().toISOString(),
      is_active: true,
      notes,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,organization_id",
    })
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}

/**
 * Revoke workspace admin access
 */
export async function revokeWorkspaceAdmin(
  revokedByUserId: string,
  targetUserId: string,
  organizationId: string
): Promise<{ success: boolean; error?: string }> {
  const hasAccess = await hasPermission(revokedByUserId, ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS)
  if (!hasAccess) {
    return { success: false, error: "You don't have permission to revoke workspace admin access" }
  }
  
  const supabase = await createClient()
  
  const { error } = await supabase
    .from("workspace_admins")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("user_id", targetUserId)
    .eq("organization_id", organizationId)
  
  if (error) {
    return { success: false, error: error.message }
  }
  
  return { success: true }
}
