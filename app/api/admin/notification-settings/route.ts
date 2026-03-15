import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET - Fetch notification settings for the organization
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Fetch all notification settings for this organization
    const { data: settings, error } = await supabase
      .from("notification_settings")
      .select("*")
      .eq("organization_id", profile.organization_id)

    if (error) {
      console.error("[API] Error fetching notification settings:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (error) {
    console.error("[API] Exception in GET notification-settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Save notification settings
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { settings } = body as { 
      settings: Array<{ 
        event_type: string
        email_enabled: boolean
        in_app_enabled: boolean 
      }> 
    }

    if (!settings || !Array.isArray(settings)) {
      return NextResponse.json({ error: "Invalid settings format" }, { status: 400 })
    }

    // Get user's organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Upsert each setting
    for (const setting of settings) {
      const { error } = await supabase
        .from("notification_settings")
        .upsert({
          organization_id: profile.organization_id,
          event_type: setting.event_type,
          email_enabled: setting.email_enabled,
          in_app_enabled: setting.in_app_enabled,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: "organization_id,event_type"
        })

      if (error) {
        console.error("[API] Error saving notification setting:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: "Settings saved" })
  } catch (error) {
    console.error("[API] Exception in POST notification-settings:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
