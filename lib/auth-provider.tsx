"use client"

// Auth Provider v6 - Uses shared singleton Supabase client with lock disabled
import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import type { User, UserRole, Workspace } from "@/lib/types"
import type { User as SupabaseUser } from "@supabase/supabase-js"

// --- Team members type (kept for team pages) ---
export interface TeamMember {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  joinedAt: string
  lastActive: string
  status: "active" | "invited" | "deactivated"
}

export const MOCK_TEAM_MEMBERS: TeamMember[] = []

// --- Auth Context ---
interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  workspace: Workspace | null
  workspaces: Workspace[]
  login: (email: string, password: string) => Promise<boolean>
  signup: (name: string, email: string, password: string, orgName: string) => Promise<boolean>
  logout: () => void
  switchWorkspace: (orgId: string) => void
  refreshWorkspaces: () => Promise<void>
  supabaseUser: SupabaseUser | null
}

const AuthContext = createContext<AuthContextValue | null>(null)

function mapToAppUser(
  supaUser: SupabaseUser,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  profile: Record<string, any> | null
): User {
  // Ensure we preserve the admin role - don't default to contributor if role is set
  const userRole = profile?.role as UserRole
  
  return {
    id: supaUser.id,
    name: profile?.name || supaUser.user_metadata?.name || supaUser.email?.split("@")[0] || "User",
    email: profile?.email || supaUser.email || "",
    avatar: profile?.avatar_url || profile?.avatar || undefined,
    role: userRole || "contributor",
    teamIds: [],
    organizationId: profile?.organization_id || "",
    createdAt: supaUser.created_at || new Date().toISOString(),
  }
}

// LocalStorage keys for persisting workspace during page transitions
const WORKSPACE_STORAGE_KEY = "jds_active_workspace"
const WORKSPACES_STORAGE_KEY = "jds_workspaces"
const USER_STORAGE_KEY = "jds_user"

function getStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(USER_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function storeUser(user: User | null) {
  if (typeof window === "undefined") return
  try {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
    } else {
      localStorage.removeItem(USER_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

function getStoredWorkspace(): Workspace | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function getStoredWorkspaces(): Workspace[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem(WORKSPACES_STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function storeWorkspace(ws: Workspace | null) {
  if (typeof window === "undefined") return
  try {
    if (ws) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(ws))
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY)
    }
  } catch {
    // Ignore storage errors
  }
}

function storeWorkspaces(wsList: Workspace[]) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(WORKSPACES_STORAGE_KEY, JSON.stringify(wsList))
  } catch {
    // Ignore storage errors
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Don't initialize from localStorage - always verify with Supabase first
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [initialized, setInitialized] = useState(false)
  const [isLoadingWorkspaces, setIsLoadingWorkspaces] = useState(false)
  const loadingRef = useRef(false)

  const supabase = getSupabaseClient()

  // Fetch workspaces from API (server-side, bypasses RLS issues)
  const fetchWorkspaces = useCallback(async (): Promise<{ workspaces: Workspace[], activeWorkspaceId: string | null }> => {
    try {
      const res = await fetch("/api/workspaces", { 
        method: "GET",
        credentials: "include",
        cache: "no-store"
      })
      if (!res.ok) {
        return { workspaces: [], activeWorkspaceId: null }
      }
      const data = await res.json()
      const wsList: Workspace[] = (data.workspaces || []).map((w: Record<string, unknown>) => ({
        id: w.id as string,
        name: w.name as string,
        slug: w.slug as string,
        logo: (w.logo as string) || undefined,
        plan: (w.plan as "free" | "pro" | "enterprise") || "free",
        teamIds: [],
        createdAt: w.createdAt as string,
        memberCount: (w.memberCount as number) || 1,
        journeyCount: (w.journeyCount as number) || 0,
        archetypeCount: 0,
      }))
      return { workspaces: wsList, activeWorkspaceId: data.activeWorkspaceId }
    } catch {
      return { workspaces: [], activeWorkspaceId: null }
    }
  }, [])

  // Load user profile from Supabase
  const loadUserProfile = useCallback(async (sUser: SupabaseUser) => {
    // First try with all columns, if that fails try with fewer columns
    let profile = null
    
    const { data, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", sUser.id)
      .single()
    
    if (profileError) {
      console.error("Error loading profile:", profileError)
    } else {
      profile = data
    }

    const appUser = mapToAppUser(sUser, profile)

    // Fetch team memberships
    const { data: teamMemberships } = await supabase
      .from("team_members")
      .select("team_id")
      .eq("user_id", sUser.id)

    if (teamMemberships) {
      appUser.teamIds = teamMemberships.map((tm) => tm.team_id)
    }

    return appUser
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Load all user data
  const loadUserData = useCallback(async (sUser: SupabaseUser) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoadingWorkspaces(true)

    try {
      setSupabaseUser(sUser)

      // Load user profile and workspaces in parallel
      const [appUser, wsData] = await Promise.all([
        loadUserProfile(sUser),
        fetchWorkspaces()
      ])

      setUser(appUser)
      storeUser(appUser) // Cache user with role to prevent flicker
      setWorkspaces(wsData.workspaces)
      storeWorkspaces(wsData.workspaces)

      // Set active workspace
      if (wsData.workspaces.length > 0) {
        const active = wsData.workspaces.find((w) => w.id === wsData.activeWorkspaceId) ?? wsData.workspaces[0]
        setWorkspace(active)
        storeWorkspace(active)
      } else {
        setWorkspace(null)
        storeWorkspace(null)
      }
    } catch (error) {
      console.error("[AuthContext] Error loading user data:", error)
    } finally {
      loadingRef.current = false
      setIsLoadingWorkspaces(false)
    }
  }, [loadUserProfile, fetchWorkspaces])

  // Refresh workspaces only
  const refreshWorkspaces = useCallback(async () => {
    if (loadingRef.current) return
    loadingRef.current = true
    setIsLoadingWorkspaces(true)

    try {
      const wsData = await fetchWorkspaces()
      setWorkspaces(wsData.workspaces)
      storeWorkspaces(wsData.workspaces)

      if (wsData.workspaces.length > 0) {
        const active = wsData.workspaces.find((w) => w.id === wsData.activeWorkspaceId) ?? wsData.workspaces[0]
        setWorkspace(active)
        storeWorkspace(active)
      } else {
        setWorkspace(null)
        storeWorkspace(null)
      }
    } finally {
      loadingRef.current = false
      setIsLoadingWorkspaces(false)
    }
  }, [fetchWorkspaces])

  // Initialize auth state
  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user: sUser } } = await supabase.auth.getUser()
        
        if (sUser) {
          await loadUserData(sUser)
        }
        // If no user, just mark as initialized - onAuthStateChange will handle any subsequent login
      } catch {
        // Auth session missing is normal for unauthenticated users
        // Don't log error, just mark as initialized
      }
      setInitialized(true)
    }

    init()

    // Subscribe to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserData(session.user)
      } else if (event === "SIGNED_OUT") {
        // Clear all cached data on sign out
        setUser(null)
        setSupabaseUser(null)
        setWorkspace(null)
        setWorkspaces([])
        storeUser(null)
        storeWorkspace(null)
        storeWorkspaces([])
        
        // Redirect to login page if we're on a protected route
        if (typeof window !== "undefined") {
          const path = window.location.pathname
          const isProtectedRoute = path.startsWith("/dashboard") || 
                                   path.startsWith("/journeys") || 
                                   path.startsWith("/archetypes") ||
                                   path.startsWith("/settings") ||
                                   path.startsWith("/workspace") ||
                                   path.startsWith("/team") ||
                                   path.startsWith("/admin")
          if (isProtectedRoute) {
            window.location.replace("/login")
          }
        }
      }
    })

    return () => subscription.unsubscribe()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return !error
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const signup = useCallback(async (name: string, email: string, password: string, _orgName: string): Promise<boolean> => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/auth/callback`,
        data: { name },
      },
    })
    return !error
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const logout = useCallback(async () => {
    // Clear all state FIRST to prevent any flash
    setUser(null)
    setSupabaseUser(null)
    setWorkspace(null)
    setWorkspaces([])
    
    // Clear all localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem(USER_STORAGE_KEY)
      localStorage.removeItem(WORKSPACE_STORAGE_KEY)
      localStorage.removeItem(WORKSPACES_STORAGE_KEY)
      localStorage.removeItem("sb-access-token")
      localStorage.removeItem("sb-refresh-token")
      // Clear all Supabase-related storage
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key)
        }
      })
    }
    
    // Sign out from Supabase
    try {
      await supabase.auth.signOut({ scope: "global" })
    } catch (e) {
      // Ignore errors
    }
    
    // Redirect after everything is cleared
    // Use replace to prevent back button returning to protected route
    window.location.replace("/login")
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Switch workspace - updates local state immediately, then syncs with server
  const switchWorkspace = useCallback((orgId: string) => {
    // Find the workspace in our list
    const targetWorkspace = workspaces.find((w) => w.id === orgId)
    if (!targetWorkspace || orgId === workspace?.id) return

    // Update local state AND localStorage immediately for instant feedback
    // This ensures no flicker during page reload
    setWorkspace(targetWorkspace)
    storeWorkspace(targetWorkspace)

    // Then update the server and do a hard refresh to load new data
    fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: orgId }),
    }).then(() => {
      // Hard refresh to ensure all server components reload with new workspace
      window.location.href = "/dashboard"
    }).catch(() => {
      // On error, still try to refresh
      window.location.href = "/dashboard"
    })
  }, [workspaces, workspace?.id])

  // Show loading state while auth initializes
  if (!initialized) {
    return (
      <AuthContext.Provider
        value={{
          user: null,
          isAuthenticated: false,
          isLoading: true,
          workspace: null,
          workspaces: [],
          login: async () => false,
          signup: async () => false,
          logout: () => {},
          switchWorkspace: () => {},
          refreshWorkspaces: async () => {},
          supabaseUser: null,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isLoadingWorkspaces,
        workspace,
        workspaces,
        login,
        signup,
        logout,
        switchWorkspace,
        refreshWorkspaces,
        supabaseUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      workspace: null,
      workspaces: [],
      login: async () => false,
      signup: async () => false,
      logout: () => {},
      switchWorkspace: () => {},
      refreshWorkspaces: async () => {},
      supabaseUser: null,
    }
  }
  return ctx
}
