"use client"

import useSWR from "swr"
import { useAuth } from "@/lib/auth-provider"

// The only super admin email - must match server-side constant
export const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

export type AdminType = "super_admin" | "site_admin" | "workspace_admin" | "none"

export const ADMIN_PERMISSIONS = {
  VIEW_DASHBOARD: "view_dashboard",
  VIEW_ANALYTICS: "view_analytics",
  VIEW_FINANCE: "view_finance",
  MANAGE_USERS: "manage_users",
  MANAGE_BILLING: "manage_billing",
  MANAGE_TEMPLATES: "manage_templates",
  MANAGE_SOLUTIONS: "manage_solutions",
  MANAGE_LEGAL: "manage_legal",
  MANAGE_LINEAGE: "manage_lineage",
  MANAGE_TRENDS: "manage_trends",
  MANAGE_CROWDSOURCE: "manage_crowdsource",
  MANAGE_BRAND: "manage_brand",
  MANAGE_NOTIFICATIONS: "manage_notifications",
  MANAGE_CONFIG: "manage_config",
  MANAGE_AI_PROMPTS: "manage_ai_prompts",
  MANAGE_TRANSLATIONS: "manage_translations",
  MANAGE_SUPPORT: "manage_support",
  VIEW_SYSTEM_STATUS: "view_system_status",
  MANAGE_ADMIN_ACCESS: "manage_admin_access",
} as const

export type Permission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS]

export interface AdminInfo {
  type: AdminType
  permissions: Permission[]
  organizationId?: string
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch admin info")
  return res.json()
}

export function useAdminPermissions() {
  const { user, isAuthenticated } = useAuth()
  
  const { data, error, isLoading, mutate } = useSWR<AdminInfo>(
    isAuthenticated && user?.id ? `/api/admin/permissions?userId=${user.id}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  )
  
  // Quick check for super admin based on email
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL
  
  // If super admin, return full permissions immediately
  if (isSuperAdmin) {
    return {
      adminInfo: {
        type: "super_admin" as AdminType,
        permissions: Object.values(ADMIN_PERMISSIONS) as Permission[],
      },
      isLoading: false,
      error: null,
      isSuperAdmin: true,
      isSiteAdmin: false,
      isWorkspaceAdmin: false,
      isAnyAdmin: true,
      hasPermission: () => true,
      hasAnyPermission: () => true,
      canAccessSection: () => true,
      mutate,
    }
  }
  
  const adminInfo: AdminInfo = data || { type: "none", permissions: [] }
  
  const hasPermission = (permission: Permission): boolean => {
    if (adminInfo.type === "super_admin") return true
    return adminInfo.permissions.includes(permission)
  }
  
  const hasAnyPermission = (permissions: Permission[]): boolean => {
    if (adminInfo.type === "super_admin") return true
    return permissions.some(p => adminInfo.permissions.includes(p))
  }
  
  // Section to permissions mapping
  const sectionPermissions: Record<string, Permission[]> = {
    "/admin": [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
    "/admin/analytics": [ADMIN_PERMISSIONS.VIEW_ANALYTICS],
    "/admin/finance": [ADMIN_PERMISSIONS.VIEW_FINANCE],
    "/admin/users": [ADMIN_PERMISSIONS.MANAGE_USERS],
    "/admin/billing": [ADMIN_PERMISSIONS.MANAGE_BILLING],
    "/admin/credits-faq": [ADMIN_PERMISSIONS.MANAGE_BILLING],
    "/admin/templates": [ADMIN_PERMISSIONS.MANAGE_TEMPLATES],
    "/admin/solutions": [ADMIN_PERMISSIONS.MANAGE_SOLUTIONS],
    "/admin/legal": [ADMIN_PERMISSIONS.MANAGE_LEGAL],
    "/admin/lineage": [ADMIN_PERMISSIONS.MANAGE_LINEAGE],
    "/admin/trends": [ADMIN_PERMISSIONS.MANAGE_TRENDS],
    "/admin/crowdsource": [ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE],
    "/admin/brand": [ADMIN_PERMISSIONS.MANAGE_BRAND],
    "/admin/notifications": [ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS],
    "/admin/config": [ADMIN_PERMISSIONS.MANAGE_CONFIG],
    "/admin/ai-prompts": [ADMIN_PERMISSIONS.MANAGE_AI_PROMPTS],
    "/admin/translations": [ADMIN_PERMISSIONS.MANAGE_TRANSLATIONS],
    "/admin/support": [ADMIN_PERMISSIONS.MANAGE_SUPPORT],
    "/admin/status": [ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS],
    "/admin/access": [ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS],
  }
  
  const canAccessSection = (path: string): boolean => {
    if (adminInfo.type === "super_admin") return true
    if (adminInfo.type === "none") return false
    
    const required = sectionPermissions[path]
    if (!required) return hasPermission(ADMIN_PERMISSIONS.VIEW_DASHBOARD)
    
    return required.some(p => adminInfo.permissions.includes(p))
  }
  
  return {
    adminInfo,
    isLoading,
    error,
    isSuperAdmin: adminInfo.type === "super_admin",
    isSiteAdmin: adminInfo.type === "site_admin",
    isWorkspaceAdmin: adminInfo.type === "workspace_admin",
    isAnyAdmin: adminInfo.type !== "none",
    hasPermission,
    hasAnyPermission,
    canAccessSection,
    mutate,
  }
}
