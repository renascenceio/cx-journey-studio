import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { createClient } from "@/lib/supabase/server"

const logoPathMap: Record<string, string> = {
  logoLight: "logo-light",
  logoDark: "logo-dark",
  logoMarkLight: "logo-mark-light",
  logoMarkDark: "logo-mark-dark",
  loginLogoLight: "login-logo-light",
  loginLogoDark: "login-logo-dark",
}

const configKeyMap: Record<string, string> = {
  logoLight: "logo_light_url",
  logoDark: "logo_dark_url",
  logoMarkLight: "logo_mark_light_url",
  logoMarkDark: "logo_mark_dark_url",
  loginLogoLight: "login_logo_light_url",
  loginLogoDark: "login_logo_dark_url",
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
    const configKey = configKeyMap[type]
    if (configKey) {
      const { error: updateError } = await supabase
        .from("site_config")
        .update({ [configKey]: blob.url, updated_at: new Date().toISOString() })
        .eq("key", "branding")
      
      if (updateError) {
        console.error("Config update error:", updateError)
        return NextResponse.json({ error: "Failed to save logo URL" }, { status: 500 })
      }
    }
    
    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error("Logo upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
