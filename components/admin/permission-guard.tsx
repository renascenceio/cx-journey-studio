"use client"

import { ReactNode } from "react"
import { useAdminPermissions, type Permission } from "@/hooks/use-admin-permissions"
import { Shield } from "lucide-react"

interface PermissionGuardProps {
  children: ReactNode
  permissions: Permission[]
  requireAll?: boolean // If true, requires ALL permissions. If false (default), requires ANY permission
  fallback?: ReactNode
}

export function PermissionGuard({ 
  children, 
  permissions, 
  requireAll = false,
  fallback 
}: PermissionGuardProps) {
  const { isSuperAdmin, hasPermission, hasAnyPermission, isLoading } = useAdminPermissions()
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }
  
  // Super admin always has access
  if (isSuperAdmin) {
    return <>{children}</>
  }
  
  // Check permissions
  const hasAccess = requireAll 
    ? permissions.every(p => hasPermission(p))
    : hasAnyPermission(permissions)
  
  if (!hasAccess) {
    return fallback || (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Access Restricted</h2>
        <p className="text-muted-foreground text-center max-w-md">
          You don't have permission to access this section. Contact your administrator if you need access.
        </p>
      </div>
    )
  }
  
  return <>{children}</>
}
