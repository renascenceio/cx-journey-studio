import { createClient } from "@/lib/supabase/server"
import { unstable_noStore as noStore } from "next/cache"

export async function getSiteLogos() {
  // Disable caching to always fetch fresh logo URLs
  noStore()
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("site_config")
    .select("logo_light_url, logo_dark_url, logo_mark_light_url, logo_mark_dark_url, value")
    .eq("key", "branding")
    .single()
  
  // Log for debugging
  if (error) {
    console.log("[v0] getSiteLogos - No branding row found:", error.message)
  } else {
    console.log("[v0] getSiteLogos - Found logos:", { 
      light: data?.logo_light_url ? "SET" : "NULL", 
      dark: data?.logo_dark_url ? "SET" : "NULL" 
    })
  }
  
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
