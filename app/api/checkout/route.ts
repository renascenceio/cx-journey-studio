import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

// Price IDs for each plan (configured in Stripe)
const PRICE_IDS: Record<string, { monthly: string; yearly?: string }> = {
  starter: {
    monthly: "price_1TBAawRWXtNLtlsksjG3K5Vh",
  },
  business: {
    monthly: "price_1TBAaxRWXtNLtlskjMUFNfxs",
  },
}

// Trial period in days
const TRIAL_DAYS = 14

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { planId, billingCycle = "monthly" } = body

    if (!planId || !PRICE_IDS[planId]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 })
    }

    const priceId = PRICE_IDS[planId][billingCycle as keyof typeof PRICE_IDS[string]] || PRICE_IDS[planId].monthly

    // Get user's profile and organization
    const adminClient = createAdminClient()
    const { data: profile } = await adminClient
      .from("profiles")
      .select("id, name, email, organization_id")
      .eq("id", user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: "No organization found" }, { status: 400 })
    }

    // Get or create Stripe customer
    const { data: org } = await adminClient
      .from("organizations")
      .select("id, name, stripe_customer_id, plan, trial_started_at, trial_ends_at")
      .eq("id", profile.organization_id)
      .single()

    if (!org) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 })
    }

    let customerId = org.stripe_customer_id

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: profile.email || user.email,
        name: profile.name || undefined,
        metadata: {
          organization_id: org.id,
          user_id: user.id,
        },
      })
      customerId = customer.id

      // Save customer ID to organization
      await adminClient
        .from("organizations")
        .update({ stripe_customer_id: customerId })
        .eq("id", org.id)
    }

    // Check if user has already had a trial
    const hadTrial = org.trial_started_at !== null

    // Create checkout session with trial (only if no previous trial)
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://rene.cx"}/settings/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://rene.cx"}/pricing?canceled=true`,
      metadata: {
        organization_id: org.id,
        plan_id: planId,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          organization_id: org.id,
          plan_id: planId,
        },
        // Only add trial if user hasn't had one before
        ...(hadTrial ? {} : { trial_period_days: TRIAL_DAYS }),
      },
      allow_promotion_codes: true,
    }

    const session = await stripe.checkout.sessions.create(sessionParams)

    return NextResponse.json({ 
      url: session.url,
      sessionId: session.id,
      hasTrial: !hadTrial,
    })
  } catch (error) {
    console.error("[Checkout API] Error:", error)
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    )
  }
}
