"use client"

import { useAuth } from "@/lib/auth-provider"
import type { UserRole } from "@/lib/types"

export interface PermissionSet {
  canEdit: boolean
  canDelete: boolean
  canInvite: boolean
  canDeploy: boolean
  canExport: boolean
  canImport: boolean
  canManageTeam: boolean
  canViewSettings: boolean
  canManageBilling: boolean
  canChangeRoles: boolean
  canRestoreVersion: boolean
  canManageRoadmap?: boolean
  canApproveCompletion?: boolean
}

const ROLE_PERMISSIONS: Record<UserRole, PermissionSet> = {
  admin: {
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canDeploy: true,
    canExport: true,
    canImport: true,
    canManageTeam: true,
    canViewSettings: true,
    canManageBilling: true,
    canChangeRoles: true,
    canRestoreVersion: true,
    canManageRoadmap: true,
    canApproveCompletion: true,
  },
  project_manager: {
    canEdit: true,
    canDelete: false,
    canInvite: true,
    canDeploy: true,
    canExport: true,
    canImport: true,
    canManageTeam: true,
    canViewSettings: true,
    canManageBilling: false,
    canChangeRoles: false,
    canRestoreVersion: true,
    canManageRoadmap: true,
    canApproveCompletion: true,
  },
  journey_master: {
    canEdit: true,
    canDelete: true,
    canInvite: true,
    canDeploy: true,
    canExport: true,
    canImport: true,
    canManageTeam: true,
    canViewSettings: true,
    canManageBilling: true,
    canChangeRoles: true,
    canRestoreVersion: true,
    canManageRoadmap: true,
    canApproveCompletion: true,
  },
  contributor: {
    canEdit: true,
    canDelete: false,
    canInvite: false,
    canDeploy: false,
    canExport: true,
    canImport: true,
    canManageTeam: false,
    canViewSettings: false,
    canManageBilling: false,
    canChangeRoles: false,
    canRestoreVersion: false,
  },
  viewer: {
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canDeploy: false,
    canExport: true,
    canImport: false,
    canManageTeam: false,
    canViewSettings: false,
    canManageBilling: false,
    canChangeRoles: false,
    canRestoreVersion: false,
  },
  external: {
    canEdit: false,
    canDelete: false,
    canInvite: false,
    canDeploy: false,
    canExport: false,
    canImport: false,
    canManageTeam: false,
    canViewSettings: false,
    canManageBilling: false,
    canChangeRoles: false,
    canRestoreVersion: false,
  },
}

export function getPermissions(role: UserRole): PermissionSet {
  return ROLE_PERMISSIONS[role]
}

export function usePermissions(): PermissionSet & { role: UserRole | null } {
  const { user } = useAuth()
  const role = user?.role ?? null
  const perms = role ? ROLE_PERMISSIONS[role] : ROLE_PERMISSIONS.external
  return { ...perms, role }
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  project_manager: "Project Manager",
  journey_master: "Journey Master",
  contributor: "Contributor",
  viewer: "Viewer",
  external: "External",
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  admin: "Full platform access including admin panel, site config, user management, and billing",
  project_manager: "Manages the roadmap, assigns owners, approves completions, and coordinates across teams",
  journey_master: "Full access to all features including team management, billing, and deployment",
  contributor: "Can edit journeys and archetypes, import data, and export reports",
  viewer: "Read-only access with the ability to export reports",
  external: "Limited read-only access to shared journeys",
}

export const ROLE_COLORS: Record<UserRole, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  project_manager: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-300",
  journey_master: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  contributor: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  viewer: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300",
  external: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800/30 dark:text-zinc-400",
}
