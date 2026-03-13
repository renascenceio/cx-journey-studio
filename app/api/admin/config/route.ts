import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function isAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  return profile?.role === "admin" || profile?.role === "journey_master"
}

export async function GET() {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { data, error } = await supabase.from("site_config").select("*")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Flatten all config into a single object for the frontend
  const config: Record<string, unknown> = {}
  for (const row of data || []) {
    if (typeof row.value === "object" && row.value !== null && !Array.isArray(row.value)) {
      Object.assign(config, row.value as Record<string, unknown>)
    } else {
      config[row.key] = row.value
    }
    
    // Include logo URLs from branding row
    if (row.key === "branding") {
      if (row.logo_light_url) config.logoLightUrl = row.logo_light_url
      if (row.logo_dark_url) config.logoDarkUrl = row.logo_dark_url
      if (row.logo_mark_light_url) config.logoMarkLightUrl = row.logo_mark_light_url
      if (row.logo_mark_dark_url) config.logoMarkDarkUrl = row.logo_mark_dark_url
      if (row.login_logo_light_url) config.loginLogoLightUrl = row.login_logo_light_url
      if (row.login_logo_dark_url) config.loginLogoDarkUrl = row.login_logo_dark_url
    }
  }
  return NextResponse.json(config)
}

export async function PUT(req: Request) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json()
  const { key, value } = body

  if (!key || value === undefined) {
    return NextResponse.json({ error: "Missing key or value" }, { status: 400 })
  }

  const { error } = await supabase
    .from("site_config")
    .update({ value, updated_at: new Date().toISOString() })
    .eq("key", key)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// PATCH: Merge fields into the appropriate config rows
export async function PATCH(req: Request) {
  const supabase = await createClient()
  if (!(await isAdmin(supabase))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const body = await req.json()

  // Map incoming fields to config keys
  const generalFields = ["site_name", "site_description", "support_email"]
  const featureFields = ["enable_signups", "enable_ai", "enable_crowd_solutions", "maintenance_mode"]
  const billingFields = ["registration_cost", "stripe_publishable_key", "stripe_secret_key", "ai_credit_fee_percentage"]
  const brandingFields = ["primary_color", "custom_css", "max_journeys_per_user"]
  const apiKeyFields = ["openai_key"]
  const soundFields = ["sounds_config"]

  const updates: Record<string, Record<string, unknown>> = {}

  for (const [k, v] of Object.entries(body)) {
    if (v === undefined) continue
    const camelKey = k.replace(/_([a-z])/g, (_: string, c: string) => c.toUpperCase())
    if (generalFields.includes(k)) {
      updates.general = updates.general || {}
      updates.general[camelKey] = v
    } else if (featureFields.includes(k)) {
      updates.features = updates.features || {}
      updates.features[camelKey] = v
    } else if (billingFields.includes(k)) {
      updates.billing = updates.billing || {}
      updates.billing[camelKey] = v
    } else if (brandingFields.includes(k)) {
      updates.branding = updates.branding || {}
      updates.branding[camelKey] = v
    } else if (apiKeyFields.includes(k)) {
      updates.apiKeys = updates.apiKeys || {}
      updates.apiKeys[camelKey] = v
    } else if (soundFields.includes(k)) {
      // Sounds config is stored as a full object, not merged field by field
      updates.sounds = v as Record<string, unknown>
    }
  }

  // Merge each config key
  for (const [configKey, fieldsToMerge] of Object.entries(updates)) {
    const { data: existing } = await supabase
      .from("site_config")
      .select("value")
      .eq("key", configKey)
      .single()

    const merged = { ...(existing?.value as Record<string, unknown> || {}), ...fieldsToMerge }
    await supabase
      .from("site_config")
      .update({ value: merged, updated_at: new Date().toISOString() })
      .eq("key", configKey)
  }

  return NextResponse.json({ success: true })
}
