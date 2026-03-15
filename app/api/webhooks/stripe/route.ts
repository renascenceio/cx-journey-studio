import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, emailTemplates } from "@/lib/email"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ""

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature") || ""

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("[Stripe Webhook] Error verifying signature:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const adminClient = createAdminClient()

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutCompleted(adminClient, session)
        break
      }

      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionCreated(adminClient, subscription)
        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdated(adminClient, subscription)
        break
      }

      case "customer.subscription.trial_will_end": {
        const subscription = event.data.object as Stripe.Subscription
        await handleTrialWillEnd(adminClient, subscription)
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(adminClient, invoice)
        break
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(adminClient, invoice)
        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(adminClient, subscription)
        break
      }

      default:
        // Unhandled event type
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[Stripe Webhook] Error processing event:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handleCheckoutCompleted(
  adminClient: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const organizationId = session.metadata?.organization_id
  const planId = session.metadata?.plan_id
  
  if (!organizationId) {
    console.log("[Stripe Webhook] No organization_id in checkout session metadata")
    return
  }

  // Update organization plan
  await adminClient
    .from("organizations")
    .update({
      plan: planId || "starter",
      stripe_subscription_id: session.subscription as string,
    })
    .eq("id", organizationId)

  console.log(`[Stripe Webhook] Checkout completed for org ${organizationId}, plan: ${planId}`)
}

async function handleSubscriptionCreated(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const organizationId = subscription.metadata?.organization_id
  
  if (!organizationId) {
    console.log("[Stripe Webhook] No organization_id in subscription metadata")
    return
  }

  const isTrialing = subscription.status === "trialing"
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null

  // Update organization with subscription info
  await adminClient
    .from("organizations")
    .update({
      stripe_subscription_id: subscription.id,
      subscription_status: subscription.status,
      trial_started_at: isTrialing ? new Date().toISOString() : null,
      trial_ends_at: trialEnd?.toISOString() || null,
    })
    .eq("id", organizationId)

  // If trialing, send welcome email with trial info
  if (isTrialing) {
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id, name, email")
      .eq("organization_id", organizationId)
      .in("role", ["admin", "journey_master"])

    if (admins && admins.length > 0) {
      const trialEndDate = trialEnd?.toLocaleDateString("en-US", { 
        month: "long", 
        day: "numeric", 
        year: "numeric" 
      }) || ""

      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: "Welcome to Your 14-Day Free Trial!",
            html: emailTemplates.trialStarted(admin.name || "there", trialEndDate),
          })
        }
      }
    }

    // Create in-app notification
    const { data: members } = await adminClient
      .from("profiles")
      .select("id")
      .eq("organization_id", organizationId)

    if (members) {
      for (const member of members) {
        await adminClient.from("notifications").insert({
          user_id: member.id,
          type: "system",
          title: "Trial Started",
          message: `Your 14-day free trial has started! Trial ends on ${trialEnd?.toLocaleDateString()}.`,
          link: "/settings/billing",
          metadata: { category: "billing" },
        })
      }
    }
  }

  console.log(`[Stripe Webhook] Subscription created for org ${organizationId}, status: ${subscription.status}`)
}

async function handleSubscriptionUpdated(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  
  // Find organization by Stripe customer ID
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, plan, subscription_status")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  const newStatus = subscription.status
  const previousStatus = org.subscription_status

  // Update subscription status
  await adminClient
    .from("organizations")
    .update({
      subscription_status: newStatus,
      // Clear payment failure flags if subscription becomes active
      ...(newStatus === "active" ? {
        payment_failed_at: null,
        payment_failure_count: 0,
        grace_period_ends_at: null,
      } : {}),
    })
    .eq("id", org.id)

  // If transitioning from trialing to active, send success email
  if (previousStatus === "trialing" && newStatus === "active") {
    const { data: admins } = await adminClient
      .from("profiles")
      .select("id, name, email")
      .eq("organization_id", org.id)
      .in("role", ["admin", "journey_master"])

    if (admins && admins.length > 0) {
      for (const admin of admins) {
        if (admin.email) {
          await sendEmail({
            to: admin.email,
            subject: "Your René Studio Subscription is Now Active",
            html: emailTemplates.trialConverted(admin.name || "there"),
          })
        }
      }
    }
  }

  console.log(`[Stripe Webhook] Subscription updated for org ${org.id}: ${previousStatus} -> ${newStatus}`)
}

async function handleTrialWillEnd(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  const trialEnd = subscription.trial_end ? new Date(subscription.trial_end * 1000) : null
  
  // Find organization by Stripe customer ID
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, name, plan")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  // Get admin users for this organization
  const { data: admins } = await adminClient
    .from("profiles")
    .select("id, name, email")
    .eq("organization_id", org.id)
    .in("role", ["admin", "journey_master"])

  const trialEndDate = trialEnd?.toLocaleDateString("en-US", { 
    month: "long", 
    day: "numeric", 
    year: "numeric" 
  }) || "soon"

  // Send trial ending email (3 days before)
  if (admins && admins.length > 0) {
    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: "Your Trial Ends in 3 Days",
          html: emailTemplates.trialEnding(admin.name || "there", trialEndDate, `https://rene.cx/settings/billing`),
        })
      }
    }
  }

  // Create in-app notification
  const { data: members } = await adminClient
    .from("profiles")
    .select("id")
    .eq("organization_id", org.id)

  if (members) {
    for (const member of members) {
      await adminClient.from("notifications").insert({
        user_id: member.id,
        type: "system",
        title: "Trial Ending Soon",
        message: `Your free trial ends on ${trialEndDate}. Add a payment method to continue using premium features.`,
        link: "/settings/billing",
        metadata: { urgent: true, category: "billing" },
      })
    }
  }

  console.log(`[Stripe Webhook] Trial will end for org ${org.id} on ${trialEndDate}`)
}

async function handlePaymentFailed(
  adminClient: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  
  // Find organization by Stripe customer ID
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, name, plan, payment_failure_count")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) {
    console.log("[Stripe Webhook] No organization found for customer:", customerId)
    return
  }

  const failureCount = (org.payment_failure_count || 0) + 1
  const gracePeriodEnds = new Date()
  gracePeriodEnds.setDate(gracePeriodEnds.getDate() + 7)

  // Update organization with payment failure info
  await adminClient
    .from("organizations")
    .update({
      payment_failed_at: new Date().toISOString(),
      payment_failure_count: failureCount,
      grace_period_ends_at: gracePeriodEnds.toISOString(),
      previous_plan_id: org.plan, // Store current plan before potential downgrade
    })
    .eq("id", org.id)

  // Log payment event
  await adminClient.from("payment_events").insert({
    organization_id: org.id,
    event_type: "payment_failed",
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string,
    amount_cents: invoice.amount_due,
    currency: invoice.currency,
    failure_reason: invoice.last_finalization_error?.message || "Unknown",
    metadata: { attempt: failureCount },
  })

  // Get admin users for this organization to send email
  const { data: admins } = await adminClient
    .from("profiles")
    .select("id, name, email")
    .eq("organization_id", org.id)
    .in("role", ["admin", "journey_master"])

  // Send Day 0 email to all admins
  if (admins && admins.length > 0) {
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: invoice.currency.toUpperCase(),
    }).format(invoice.amount_due / 100)

    const retryUrl = `https://rene.cx/settings/billing?retry=true`

    for (const admin of admins) {
      if (admin.email) {
        await sendEmail({
          to: admin.email,
          subject: "Payment Failed - Action Required",
          html: emailTemplates.paymentFailedDay0(admin.name || "there", amount, retryUrl),
        })
      }
    }
  }

  // Create in-app notification for all org members
  const { data: members } = await adminClient
    .from("profiles")
    .select("id")
    .eq("organization_id", org.id)

  if (members) {
    for (const member of members) {
      await adminClient.from("notifications").insert({
        user_id: member.id,
        type: "system",
        title: "Payment Failed",
        message: "Your workspace payment failed. Please update your payment method within 7 days to avoid service interruption.",
        link: "/settings/billing",
        metadata: { urgent: true, category: "billing" },
      })
    }
  }
}

async function handlePaymentSucceeded(
  adminClient: ReturnType<typeof createAdminClient>,
  invoice: Stripe.Invoice
) {
  const customerId = invoice.customer as string
  
  // Find organization by Stripe customer ID
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, payment_failed_at, previous_plan_id")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  // If there was a pending payment failure, clear it
  if (org.payment_failed_at) {
    await adminClient
      .from("organizations")
      .update({
        payment_failed_at: null,
        payment_failure_count: 0,
        grace_period_ends_at: null,
        last_payment_reminder_at: null,
        // Keep previous_plan_id in case we need to reference it
      })
      .eq("id", org.id)

    // Log payment success event
    await adminClient.from("payment_events").insert({
      organization_id: org.id,
      event_type: "payment_succeeded",
      stripe_invoice_id: invoice.id,
      amount_cents: invoice.amount_due,
      currency: invoice.currency,
    })

    // Clear billing notifications for this org
    const { data: members } = await adminClient
      .from("profiles")
      .select("id")
      .eq("organization_id", org.id)

    if (members) {
      for (const member of members) {
        await adminClient
          .from("notifications")
          .delete()
          .eq("user_id", member.id)
          .eq("type", "system")
          .ilike("message", "%payment%")
      }
    }
  }
}

async function handleSubscriptionDeleted(
  adminClient: ReturnType<typeof createAdminClient>,
  subscription: Stripe.Subscription
) {
  const customerId = subscription.customer as string
  
  // Find organization
  const { data: org } = await adminClient
    .from("organizations")
    .select("id, plan")
    .eq("stripe_customer_id", customerId)
    .single()

  if (!org) return

  // Downgrade to free
  await adminClient
    .from("organizations")
    .update({
      plan: "free",
      previous_plan_id: org.plan,
    })
    .eq("id", org.id)

  // Log downgrade event
  await adminClient.from("payment_events").insert({
    organization_id: org.id,
    event_type: "downgraded_to_free",
    metadata: { previousPlan: org.plan, reason: "subscription_deleted" },
  })
}
