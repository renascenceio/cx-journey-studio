import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getSiteLogos() {
  // Disable caching to always fetch fresh logo URLs
  noStore()
  
  const supabase = await createClient()
  
  // Logos are stored as separate columns on the branding row
  const { data: branding } = await supabase
    .from("site_config")
    .select("logo_light_url, logo_dark_url, logo_mark_light_url, logo_mark_dark_url")
    .eq("key", "branding")
    .single()
  
  const { data: siteNameRow } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "general")
    .single()

  return {
    logoLight: branding?.logo_light_url || null,
    logoDark: branding?.logo_dark_url || null,
    logoMarkLight: branding?.logo_mark_light_url || null,
    logoMarkDark: branding?.logo_mark_dark_url || null,
    siteName: (siteNameRow?.value as { siteName?: string })?.siteName || "René Studio",
  }
}
