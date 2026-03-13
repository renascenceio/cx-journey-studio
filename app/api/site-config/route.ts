import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const supabase = await createClient()
  
  // Get all config rows - logos are stored in JSONB 'value' column
  const { data, error } = await supabase
    .from("site_config")
    .select("key, value")
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Build combined config object
  const config: Record<string, unknown> = {}
  
  for (const row of data || []) {
    // Add values from each row's JSONB value
    if (row.value && typeof row.value === "object") {
      const valueObj = row.value as Record<string, unknown>
      Object.assign(config, valueObj)
      
      // Logo URLs are stored inside branding row's JSONB value
      if (row.key === "branding") {
        if (valueObj.logo_light_url) config.logo_light_url = valueObj.logo_light_url
        if (valueObj.logo_dark_url) config.logo_dark_url = valueObj.logo_dark_url
        if (valueObj.logo_mark_light_url) config.logo_mark_light_url = valueObj.logo_mark_light_url
        if (valueObj.logo_mark_dark_url) config.logo_mark_dark_url = valueObj.logo_mark_dark_url
      }
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
