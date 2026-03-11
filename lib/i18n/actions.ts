"use server"

import { cookies } from "next/headers"
import { createClient } from "@/lib/supabase/server"
import { locales, LOCALE_COOKIE, type Locale } from "./config"

// Set locale preference in cookie and optionally in user profile
export async function setLocale(locale: Locale) {
  console.log("[v0] setLocale server action called with:", locale)
  
  if (!locales.includes(locale)) {
    console.log("[v0] Invalid locale:", locale)
    throw new Error(`Invalid locale: ${locale}`)
  }

  // Set cookie for immediate effect
  const cookieStore = await cookies()
  console.log("[v0] Setting cookie LOCALE:", locale)
  cookieStore.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
  })
  console.log("[v0] Cookie set successfully")

  // Also save to user profile if authenticated
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase
      .from("profiles")
      .update({ preferred_language: locale })
      .eq("id", user.id)
  }

  return { success: true }
}

// Get locale from user profile (for authenticated users)
export async function getUserLocale(): Promise<Locale | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_language")
    .eq("id", user.id)
    .single()
  
  if (profile?.preferred_language && locales.includes(profile.preferred_language as Locale)) {
    return profile.preferred_language as Locale
  }
  
  return null
}
