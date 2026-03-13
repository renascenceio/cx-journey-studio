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
      dedupingInterval: 1000,
      refreshInterval: 30000,
    }
  )

  return {
    config: data,
    isLoading,
    isError: error,
    mutate,
    // Helper to get the appropriate logo based on theme
    // Returns null if no logo is configured (no fallbacks)
    getLogo: (theme: "light" | "dark") => {
      if (!data) return null // Return null while loading
      const url = theme === "dark" ? data.logo_dark_url : data.logo_light_url
      return url || null
    },
    getLogoMark: (theme: "light" | "dark") => {
      if (!data) return null
      const url = theme === "dark" ? data.logo_mark_dark_url : data.logo_mark_light_url
      return url || null
    },
    site_name: data?.siteName || "René Studio",
  }
}
