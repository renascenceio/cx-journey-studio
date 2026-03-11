import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    const { data: plans, error } = await supabase
      .from("plans")
      .select("*")
      .order("price_monthly", { ascending: true })
    
    if (error) {
      console.error("Plans fetch error:", error)
      // Return default plans if table doesn't exist
      return NextResponse.json({
        plans: [
          { id: "free", name: "Free", price_monthly: 0, price_yearly: 0, journey_limit: 3, team_member_limit: 1, ai_credits_monthly: 50, version_history_days: 7, features: { templates: "community", export: ["pdf"], collaboration: false, analytics: false, customBranding: false, sso: false, api: false }, is_active: true },
          { id: "starter", name: "Starter", price_monthly: 19, price_yearly: 15, journey_limit: 15, team_member_limit: 5, ai_credits_monthly: 500, version_history_days: 30, features: { templates: "full", export: ["pdf", "png", "csv"], collaboration: true, analytics: "basic", customBranding: false, sso: false, api: false }, is_active: true },
          { id: "business", name: "Business", price_monthly: 49, price_yearly: 39, journey_limit: -1, team_member_limit: 25, ai_credits_monthly: 2000, version_history_days: 90, features: { templates: "full_custom", export: ["pdf", "png", "csv", "json"], collaboration: true, analytics: "advanced", customBranding: true, sso: false, api: true }, is_active: true },
          { id: "enterprise", name: "Enterprise", price_monthly: -1, price_yearly: -1, journey_limit: -1, team_member_limit: -1, ai_credits_monthly: -1, version_history_days: -1, features: { templates: "custom_dev", export: ["all"], collaboration: true, analytics: "enterprise", customBranding: true, sso: true, api: true }, is_active: true },
        ]
      })
    }
    
    return NextResponse.json({ plans })
  } catch (error) {
    console.error("Plans API error:", error)
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 })
  }
}
