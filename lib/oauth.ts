"use client"

import { getSupabaseClient } from "@/lib/supabase/client"

export type OAuthProvider = "google" | "azure"

// OAuth redirect URLs
function getRedirectUrl() {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/auth/callback`
}

/**
 * Initiate OAuth sign in with Google
 */
export async function signInWithGoogle() {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: getRedirectUrl(),
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  })
  
  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Initiate OAuth sign in with Microsoft (Azure AD)
 */
export async function signInWithMicrosoft() {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "azure",
    options: {
      redirectTo: getRedirectUrl(),
      scopes: "email profile openid",
    },
  })
  
  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Link an OAuth provider to existing account
 */
export async function linkOAuthProvider(provider: OAuthProvider) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.linkIdentity({
    provider: provider,
    options: {
      redirectTo: `${getRedirectUrl()}?linked=${provider}`,
    },
  })
  
  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Unlink an OAuth provider from account
 */
export async function unlinkOAuthProvider(identityId: string) {
  const supabase = getSupabaseClient()
  
  const { error } = await supabase.auth.unlinkIdentity({
    id: identityId,
  } as { id: string })
  
  if (error) {
    throw new Error(error.message)
  }
}

/**
 * Get linked identities for current user
 */
export async function getLinkedIdentities() {
  const supabase = getSupabaseClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return []
  }
  
  return user.identities || []
}

/**
 * Check if a provider is linked
 */
export async function isProviderLinked(provider: OAuthProvider): Promise<boolean> {
  const identities = await getLinkedIdentities()
  return identities.some(i => i.provider === provider)
}

/**
 * Get provider display info
 */
export function getProviderInfo(provider: string) {
  const providers: Record<string, { name: string; icon: string; color: string }> = {
    email: {
      name: "Email",
      icon: "mail",
      color: "text-muted-foreground",
    },
    google: {
      name: "Google",
      icon: "google",
      color: "text-[#4285F4]",
    },
    azure: {
      name: "Microsoft",
      icon: "microsoft",
      color: "text-[#00A4EF]",
    },
  }
  
  return providers[provider] || { name: provider, icon: "key", color: "text-muted-foreground" }
}
