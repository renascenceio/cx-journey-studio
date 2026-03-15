"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { PLANS, PLAN_ORDER, getFeatureDisplayText, formatPrice, requiresCheckout, type PlanId } from "@/lib/plans"

export function PricingCards() {
  const { user, workspace: organization } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const currentPlan = (organization?.plan || "free") as PlanId

  async function handleSubscribe(planId: string) {
    if (!user) {
      // Not logged in - redirect to signup
      window.location.href = `/signup?plan=${planId}`
      return
    }

    if (!requiresCheckout(planId)) {
      // Enterprise - redirect to contact
      window.location.href = `/contact?type=enterprise`
      return
    }

    setLoadingPlan(planId)
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      })

      if (!res.ok) throw new Error("Failed to create checkout session")

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch {
      toast.error("Failed to start checkout. Please try again.")
    } finally {
      setLoadingPlan(null)
    }
  }

  function getCtaText(planId: PlanId) {
    if (planId === currentPlan) return "Current Plan"
    if (planId === "free") return "Get Started"
    if (planId === "enterprise") return "Contact Sales"
    return "Subscribe"
  }

  function isDisabled(planId: PlanId) {
    return planId === currentPlan || planId === "free"
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {PLAN_ORDER.map((planId) => {
        const plan = PLANS[planId]
        const Icon = plan.icon
        const isLoading = loadingPlan === planId
        const disabled = isDisabled(planId)
        const features = getFeatureDisplayText(plan)

        return (
          <Card
            key={plan.id}
            className={`relative flex flex-col ${
              plan.popular ? "border-primary shadow-lg shadow-primary/10 scale-[1.02]" : "border-border/60"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
                Most Popular
              </div>
            )}
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${plan.popular ? "bg-primary/10" : "bg-muted"}`}>
                  <Icon className={`h-4 w-4 ${plan.popular ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <CardTitle className="text-lg font-semibold text-foreground">
                  {plan.name}
                </CardTitle>
              </div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">
                  {formatPrice(plan.priceMonthly)}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.priceMonthly > 0 ? "per user/month" : plan.priceMonthly === 0 ? "forever" : "contact us"}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-2.5">
                {features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {requiresCheckout(plan.id) && user ? (
                <Button
                  variant={plan.buttonVariant}
                  className="mt-6 w-full"
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={disabled || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getCtaText(plan.id)}
                </Button>
              ) : (
                <Button
                  variant={plan.buttonVariant}
                  className="mt-6 w-full"
                  asChild
                  disabled={disabled && plan.id !== "free"}
                >
                  <Link href={plan.ctaHref}>{getCtaText(plan.id)}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
