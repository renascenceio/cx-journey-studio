import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getSiteLogos() {
  // Disable caching to always fetch fresh logo URLs
  noStore()
  
  const supabase = await createClient()
  
  // Logos are stored in the JSONB 'value' column of the branding row
  const { data: branding } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "branding")
    .single()
  
  const { data: siteNameRow } = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "general")
    .single()

  // Extract logo URLs from the JSONB value
  const brandingValue = branding?.value as Record<string, string> | null

  return {
    logoLight: brandingValue?.logo_light_url || null,
    logoDark: brandingValue?.logo_dark_url || null,
    logoMarkLight: brandingValue?.logo_mark_light_url || null,
    logoMarkDark: brandingValue?.logo_mark_dark_url || null,
    siteName: (siteNameRow?.value as { siteName?: string })?.siteName || "René Studio",
  }
}
