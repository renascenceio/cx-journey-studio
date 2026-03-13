import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

const logoPathMap: Record<string, string> = {
  logoLight: "logo-light",
  logoDark: "logo-dark",
  logoMarkLight: "logo-mark-light",
  logoMarkDark: "logo-mark-dark",
}

const configKeyMap: Record<string, string> = {
  logoLight: "logo_light_url",
  logoDark: "logo_dark_url",
  logoMarkLight: "logo_mark_light_url",
  logoMarkDark: "logo_mark_dark_url",
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check if user is admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single()
    
    if (profile?.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }
    
    const formData = await request.formData()
    const file = formData.get("file") as File
    const type = formData.get("type") as string
    
    if (!file || !type) {
      return NextResponse.json({ error: "Missing file or type" }, { status: 400 })
    }
    
    const filename = logoPathMap[type]
    if (!filename) {
      return NextResponse.json({ error: "Invalid logo type" }, { status: 400 })
    }
    
    // Get file extension
    const ext = file.name.split(".").pop() || "png"
    
    // Upload to Vercel Blob
    const blob = await put(`logos/${filename}.${ext}`, file, {
      access: "public",
      addRandomSuffix: true, // Add suffix to bust cache
    })
    
    // Save URL to site_config in database (on the 'branding' row)
    // Store in the JSONB 'value' column since that's what the schema supports
    const configKey = configKeyMap[type]
    if (configKey) {
      // First, try to get existing branding row
      const { data: existing } = await supabase
        .from("site_config")
        .select("*")
        .eq("key", "branding")
        .single()
      
      if (existing) {
        // Update existing row - merge new logo URL into existing value object
        const currentValue = typeof existing.value === 'object' ? existing.value : {}
        const newValue = { ...currentValue, [configKey]: blob.url }
        
        const { error: updateError } = await supabase
          .from("site_config")
          .update({ value: newValue, updated_at: new Date().toISOString() })
          .eq("key", "branding")
        
        if (updateError) {
          console.error("Config update error:", updateError)
          return NextResponse.json({ error: "Failed to save logo URL" }, { status: 500 })
        }
      } else {
        // Insert new branding row with logo URL in JSONB value
        const { error: insertError } = await supabase
          .from("site_config")
          .insert({ 
            key: "branding", 
            value: { [configKey]: blob.url },
            updated_at: new Date().toISOString() 
          })
        
        if (insertError) {
          console.error("Config insert error:", insertError)
          return NextResponse.json({ error: "Failed to save logo URL" }, { status: 500 })
        }
      }
    }
    
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
