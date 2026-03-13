import { createClient } from "@/lib/supabase/server"

export async function getSiteLogos() {
  const supabase = await createClient()
  
  const { data } = await supabase
    .from("site_config")
    .select("logo_light_url, logo_dark_url, logo_mark_light_url, logo_mark_dark_url, login_logo_light_url, login_logo_dark_url, value")
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
    // Login logos fall back to regular logos
    loginLogoLight: data?.login_logo_light_url || data?.logo_light_url || null,
    loginLogoDark: data?.login_logo_dark_url || data?.logo_dark_url || null,
    siteName: siteName.data?.value || "René Studio",
  }
}
