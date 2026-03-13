import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  
  // Get all config rows - logos are stored as separate columns
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value, logo_light_url, logo_dark_url, logo_mark_light_url, logo_mark_dark_url")
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Build combined config object
  const config: Record<string, unknown> = {}
  
  for (const row of data || []) {
    // Add values from each row's JSONB value
    if (row.value && typeof row.value === "object") {
      Object.assign(config, row.value as Record<string, unknown>)
    }
    
    // Logo URLs are stored as separate columns on branding row
    if (row.key === "branding") {
      if (row.logo_light_url) config.logo_light_url = row.logo_light_url
      if (row.logo_dark_url) config.logo_dark_url = row.logo_dark_url
      if (row.logo_mark_light_url) config.logo_mark_light_url = row.logo_mark_light_url
      if (row.logo_mark_dark_url) config.logo_mark_dark_url = row.logo_mark_dark_url
    }
    
    // Sound config - stored as the full value object
    if (row.key === "sounds") {
      config.soundsConfig = row.value
    }
  }
  
  return NextResponse.json(config, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  })
}
