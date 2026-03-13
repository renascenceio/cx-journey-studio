import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getSiteLogos() {
  // Disable caching to always fetch fresh logo URLs
  noStore()
  
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("site_config")
    .select("logo_light_url, logo_dark_url, logo_mark_light_url, logo_mark_dark_url, value")
    .eq("key", "branding")
    .single()
  
  const siteName = await supabase
    .from("site_config")
    .select("value")
    .eq("key", "site_name")
    .single()

  return {
    logoLight: data?.logo_light_url || null,
    logoDark: data?.logo_dark_url || null,
    logoMarkLight: data?.logo_mark_light_url || null,
    logoMarkDark: data?.logo_mark_dark_url || null,
    siteName: siteName.data?.value || "René Studio",
  }
}
