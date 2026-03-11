import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  // Get user's org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) {
    return NextResponse.json({ used: 0, total: 50, purchased: 0 })
  }
  
  // Get or create credits record
  const { data: credits, error } = await supabase
    .from("ai_credits")
    .select("*")
    .eq("organization_id", profile.organization_id)
    .single()
  
  if (error || !credits) {
    // Create default credits if not exists
    const { data: newCredits } = await supabase
      .from("ai_credits")
      .insert({
        organization_id: profile.organization_id,
        credits_purchased: 0,
        credits_used: 0,
        credits_monthly_allowance: 50,
      })
      .select()
      .single()
    
    return NextResponse.json({
      used: 0,
      total: newCredits?.credits_monthly_allowance || 50,
      purchased: 0,
    })
  }
  
  return NextResponse.json({
    used: credits.credits_used,
    total: credits.credits_monthly_allowance,
    purchased: credits.credits_purchased,
  })
}
