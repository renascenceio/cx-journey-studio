"use client"

import useSWR from "swr"

// Default logos - always use these as fallback to prevent flickering
const DEFAULT_LOGOS = {
  light: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-light-TKrukgyff9qYn05XX01mnhB1RP7Wrb.png",
  dark: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logo-dark-xOhDTEdqNvUAZaKUpWWdevckyCXaMX.png",
  markLight: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logomark-light-IhqbmEuQwYjHrb2rJf3aAzBLZ7TbDV.png",
  markDark: "https://py47xstuktdkxylm.public.blob.vercel-storage.com/logos/logomark-dark-j1hSjCo5bIOlFJWH2t8l3LU3LfLqYN.png",
}

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
    // Always returns a logo (configured or default) to prevent flickering
    getLogo: (theme: "light" | "dark") => {
      const defaultLogo = theme === "dark" ? DEFAULT_LOGOS.dark : DEFAULT_LOGOS.light
      if (!data) return defaultLogo // Return default while loading
      const url = theme === "dark" ? data.logo_dark_url : data.logo_light_url
      return url || defaultLogo
    },
    getLogoMark: (theme: "light" | "dark") => {
      const defaultMark = theme === "dark" ? DEFAULT_LOGOS.markDark : DEFAULT_LOGOS.markLight
      if (!data) return defaultMark
      const url = theme === "dark" ? data.logo_mark_dark_url : data.logo_mark_light_url
      return url || defaultMark
    },
    site_name: data?.siteName || "René Studio",
  }
}
