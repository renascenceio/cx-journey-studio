import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const CREDIT_PACKAGES: Record<string, { credits: number; price: number }> = {
  small: { credits: 100, price: 5 },
  medium: { credits: 500, price: 20 },
  large: { credits: 1500, price: 50 },
  xlarge: { credits: 5000, price: 150 },
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  
  const { packageId } = await request.json()
  const pkg = CREDIT_PACKAGES[packageId]
  
  if (!pkg) {
    return NextResponse.json({ error: "Invalid package" }, { status: 400 })
  }
  
  // Get user's org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) {
    return NextResponse.json({ error: "No organization" }, { status: 400 })
  }
  
  // In production, this would integrate with Stripe for payment
  // For now, we'll just add the credits
  
  // Upsert credits
  const { data: existingCredits } = await supabase
    .from("ai_credits")
    .select("credits_purchased")
    .eq("organization_id", profile.organization_id)
    .single()
  
  const newPurchased = (existingCredits?.credits_purchased || 0) + pkg.credits
  
  const { error: creditsError } = await supabase
    .from("ai_credits")
    .upsert({
      organization_id: profile.organization_id,
      credits_purchased: newPurchased,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "organization_id",
    })
  
  if (creditsError) {
    return NextResponse.json({ error: "Failed to add credits" }, { status: 500 })
  }
  
  // Log transaction
  await supabase.from("ai_credit_transactions").insert({
    organization_id: profile.organization_id,
    user_id: user.id,
    amount: pkg.credits,
    type: "purchase",
    description: `Purchased ${pkg.credits} credits ($${pkg.price})`,
  })
  
  return NextResponse.json({ success: true, credits: pkg.credits })
}
