"use client"

import useSWR from "swr"

export interface SiteConfig {
  siteName?: string
  siteDescription?: string
  supportEmail?: string
  logo_light_url?: string | null
  logo_dark_url?: string | null
  logo_mark_light_url?: string | null
  logo_mark_dark_url?: string | null
  [key: string]: unknown
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { 
    cache: "no-store",
    headers: { 
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  })
  return res.json()
}

export function useSiteConfig() {
  const { data, error, isLoading, mutate } = useSWR<SiteConfig>(
    "/api/site-config",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      dedupingInterval: 1000, // Dedupe for 1 second only
      refreshInterval: 30000, // Refresh every 30 seconds
    }
  )

  return {
    config: data,
    isLoading,
    isError: error,
    mutate,
    // Helper to get the appropriate logo based on theme
    // Returns null while loading to prevent flicker
    getLogo: (theme: "light" | "dark") => {
      if (!data) return null // Return null while loading to prevent flicker
      const url = theme === "dark" ? data.logo_dark_url : data.logo_light_url
      return url || null // Return null if no logo configured
    },
    getLogoMark: (theme: "light" | "dark") => {
      if (!data) return null
      return theme === "dark" ? data.logo_mark_dark_url : data.logo_mark_light_url
    },
    site_name: data?.siteName || "René Studio",
  }
}
