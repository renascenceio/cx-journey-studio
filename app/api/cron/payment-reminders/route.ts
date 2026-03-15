import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/server"
import { sendEmail, emailTemplates } from "@/lib/email"

// This cron job runs daily to:
// 1. Send Day 3 and Day 5 reminder emails
// 2. Downgrade accounts on Day 7
// Configure in vercel.json: { "crons": [{ "path": "/api/cron/payment-reminders", "schedule": "0 9 * * *" }] }

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const adminClient = createAdminClient()
  const now = new Date()
  const results = { reminders: 0, downgrades: 0, errors: [] as string[] }

  try {
    // Get all organizations with payment failures
    const { data: failedOrgs } = await adminClient
      .from("organizations")
      .select("id, name, plan, payment_failed_at, grace_period_ends_at, last_payment_reminder_at, previous_plan_id")
      .not("payment_failed_at", "is", null)

    if (!failedOrgs || failedOrgs.length === 0) {
      return NextResponse.json({ message: "No pending payment issues", ...results })
    }

    for (const org of failedOrgs) {
      try {
        const failedAt = new Date(org.payment_failed_at)
        const gracePeriodEnds = org.grace_period_ends_at ? new Date(org.grace_period_ends_at) : null
        const lastReminder = org.last_payment_reminder_at ? new Date(org.last_payment_reminder_at) : null
        
        const daysSinceFailed = Math.floor((now.getTime() - failedAt.getTime()) / (1000 * 60 * 60 * 24))

        // Get admins for this org
        const { data: admins } = await adminClient
          .from("profiles")
          .select("id, name, email")
          .eq("organization_id", org.id)
          .in("role", ["admin", "journey_master"])

        const retryUrl = `https://rene.cx/settings/billing?retry=true`
        const upgradeUrl = `https://rene.cx/settings/billing`

        // Day 3: Send first reminder (if not already sent on day 3+)
        if (daysSinceFailed >= 3 && daysSinceFailed < 5) {
          const shouldSendDay3 = !lastReminder || 
            Math.floor((lastReminder.getTime() - failedAt.getTime()) / (1000 * 60 * 60 * 24)) < 3

          if (shouldSendDay3 && admins) {
            for (const admin of admins) {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: "Payment Reminder - 4 Days Left",
                  html: emailTemplates.paymentFailedDay3(admin.name || "there", retryUrl),
                })
              }
            }

            await adminClient
              .from("organizations")
              .update({ last_payment_reminder_at: now.toISOString() })
              .eq("id", org.id)

            await adminClient.from("payment_events").insert({
              organization_id: org.id,
              event_type: "reminder_sent",
              metadata: { day: 3, reminderType: "day3" },
            })

            results.reminders++
          }
        }

        // Day 5: Send final warning (if not already sent on day 5+)
        if (daysSinceFailed >= 5 && daysSinceFailed < 7) {
          const shouldSendDay5 = !lastReminder || 
            Math.floor((lastReminder.getTime() - failedAt.getTime()) / (1000 * 60 * 60 * 24)) < 5

          if (shouldSendDay5 && admins) {
            for (const admin of admins) {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: "URGENT: Only 2 Days Left to Update Payment",
                  html: emailTemplates.paymentFailedDay5(admin.name || "there", retryUrl),
                })
              }
            }

            await adminClient
              .from("organizations")
              .update({ last_payment_reminder_at: now.toISOString() })
              .eq("id", org.id)

            await adminClient.from("payment_events").insert({
              organization_id: org.id,
              event_type: "reminder_sent",
              metadata: { day: 5, reminderType: "day5_final_warning" },
            })

            results.reminders++
          }
        }

        // Day 7+: Downgrade to Free (if grace period has ended)
        if (gracePeriodEnds && now >= gracePeriodEnds && org.plan !== "free") {
          const previousPlan = org.plan

          // Downgrade the organization
          await adminClient
            .from("organizations")
            .update({
              plan: "free",
              previous_plan_id: previousPlan,
              // Keep payment_failed_at for reference, clear grace period
              grace_period_ends_at: null,
              last_payment_reminder_at: null,
            })
            .eq("id", org.id)

          // Log downgrade event
          await adminClient.from("payment_events").insert({
            organization_id: org.id,
            event_type: "downgraded_to_free",
            metadata: { previousPlan, reason: "grace_period_expired" },
          })

          // Send downgrade notification email
          if (admins) {
            const planLabel = previousPlan === "pro" ? "Pro" : previousPlan === "enterprise" ? "Enterprise" : previousPlan
            
            for (const admin of admins) {
              if (admin.email) {
                await sendEmail({
                  to: admin.email,
                  subject: "Your Account Has Been Downgraded to Free",
                  html: emailTemplates.accountDowngraded(admin.name || "there", planLabel, upgradeUrl),
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
                title: "Account Downgraded",
                message: `Your workspace has been downgraded to the Free plan. Your content is safe, but some features may be restricted.`,
                link: "/settings/billing",
                metadata: { urgent: true, category: "billing" },
              })
            }
          }

          results.downgrades++
        }
      } catch (error) {
        results.errors.push(`Error processing org ${org.id}: ${error}`)
      }
    }

    return NextResponse.json({
      message: "Cron job completed",
      processedOrgs: failedOrgs.length,
      ...results,
    })
  } catch (error) {
    console.error("[Payment Cron] Error:", error)
    return NextResponse.json({ error: "Cron job failed", details: String(error) }, { status: 500 })
  }
}
