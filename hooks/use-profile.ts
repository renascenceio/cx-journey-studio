"use client"

import { useAuth } from "@/lib/auth-provider"

/**
 * Convenience hook that returns the authenticated user's profile fields
 * needed for permission checks (role, name, email, etc.)
 */
export function useProfile() {
  const { user, isLoading } = useAuth()

  return {
    profile: user
      ? {
          id: user.id,
          full_name: user.name,
          email: user.email,
          role: user.role,
          organization_id: user.organizationId,
        }
      : null,
    isLoading,
  }
}
