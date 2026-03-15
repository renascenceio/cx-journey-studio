"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Zap, Building2, Crown, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Plan definitions
const PLANS = {
  free: {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: 0,
    priceYearly: 0,
    period: "forever",
    description: "For individuals exploring CX journey mapping.",
    features: [
      "Up to 3 journeys",
      "1 team member",
      "50 AI credits/month",
      "7-day version history",
    ],
    cta: "Get Started",
    ctaHref: "/signup",
    variant: "outline" as const,
    popular: false,
    hasTrial: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: 19,
    priceYearly: 15,
    period: "per user/month",
    description: "For small teams starting their CX practice.",
    features: [
      "Up to 15 journeys",
      "Up to 5 team members",
      "500 AI credits/month",
      "30-day version history",
      "Real-time collaboration",
      "Basic analytics",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup?plan=starter",
    variant: "default" as const,
    popular: false,
    hasTrial: true,
  },
  business: {
    id: "business",
    name: "Business",
    icon: Building2,
    price: 49,
    priceYearly: 39,
    period: "per user/month",
    description: "For teams building a serious CX practice.",
    features: [
      "Unlimited journeys",
      "Up to 25 team members",
      "2,000 AI credits/month",
      "90-day version history",
      "Real-time collaboration",
      "Advanced analytics",
      "Custom branding",
      "API access",
    ],
    cta: "Start Free Trial",
    ctaHref: "/signup?plan=business",
    variant: "default" as const,
    popular: true,
    hasTrial: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    icon: Crown,
    price: -1,
    priceYearly: -1,
    period: "contact us",
    description: "For organizations scaling CX across teams.",
    features: [
      "Unlimited journeys",
      "Unlimited team members",
      "Custom AI credits",
      "Unlimited version history",
      "Enterprise collaboration",
      "Enterprise analytics",
      "SSO & SAML",
      "Dedicated success manager",
    ],
    cta: "Contact Sales",
    ctaHref: "/contact?type=enterprise",
    variant: "outline" as const,
    popular: false,
    hasTrial: false,
  },
}

export function PricingCards() {
  const { user, workspace: organization } = useAuth()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)
  const plansList = [PLANS.free, PLANS.starter, PLANS.business, PLANS.enterprise]

  // Check if user already had a trial
  const hadTrial = organization?.trial_started_at !== null
  const currentPlan = organization?.plan_id || "free"

  async function handleStartTrial(planId: string) {
    if (!user) {
      // Not logged in - redirect to signup
      window.location.href = `/signup?plan=${planId}`
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

  function getCtaText(plan: typeof PLANS.starter) {
    if (plan.id === currentPlan) return "Current Plan"
    if (plan.hasTrial && !hadTrial) return "Start Free Trial"
    if (plan.hasTrial) return "Subscribe"
    return plan.cta
  }

  function isDisabled(plan: typeof PLANS.starter) {
    return plan.id === currentPlan
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {plansList.map((plan) => {
        const Icon = plan.icon
        const isLoading = loadingPlan === plan.id
        const disabled = isDisabled(plan)

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
                  {plan.price === -1 ? "Custom" : plan.price === 0 ? "$0" : `$${plan.price}`}
                </span>
                <span className="text-sm text-muted-foreground">
                  {plan.period}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {plan.description}
              </p>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <ul className="flex flex-1 flex-col gap-2.5">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Trial badge for paid plans */}
              {plan.hasTrial && !hadTrial && !disabled && (
                <Badge variant="secondary" className="mt-4 w-fit text-xs">
                  14-day free trial
                </Badge>
              )}

              {plan.hasTrial && user ? (
                <Button
                  variant={plan.variant}
                  className="mt-4 w-full"
                  onClick={() => handleStartTrial(plan.id)}
                  disabled={disabled || isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {getCtaText(plan)}
                </Button>
              ) : (
                <Button
                  variant={plan.variant}
                  className="mt-4 w-full"
                  asChild
                  disabled={disabled}
                >
                  <Link href={plan.ctaHref}>{getCtaText(plan)}</Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
