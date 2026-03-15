import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { PricingCards } from "@/components/pricing-cards"

export const metadata: Metadata = {
  title: "Pricing - René Studio",
  description: "Choose the perfect plan for your customer journey mapping needs.",
}

// Plan definitions - these should match database plans
export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    icon: Sparkles,
    price: 0,
    priceYearly: 0,
    period: "forever",
    description: "For individuals exploring CX journey mapping.",
    journeyLimit: 3,
    teamMemberLimit: 1,
    aiCreditsMonthly: 50,
    features: {
      journeys: "Up to 3 journeys",
      teamMembers: "1 team member",
      emotionalArc: "Basic emotional arc",
      templates: "Community templates only",
      export: "Export to PDF",
      collaboration: false,
      aiInsights: "50 AI credits/month",
      versioning: "7-day version history",
      support: "Community support",
      analytics: false,
      customBranding: false,
      sso: false,
      api: false,
      dedicatedManager: false,
    },
    cta: "Get Started",
    ctaHref: "/signup",
    variant: "outline" as const,
    popular: false,
  },
  starter: {
    id: "starter",
    name: "Starter",
    icon: Zap,
    price: 19,
    priceYearly: 15,
    period: "per user/month",
    description: "For small teams starting their CX practice.",
    journeyLimit: 15,
    teamMemberLimit: 5,
    aiCreditsMonthly: 500,
    features: {
      journeys: "Up to 15 journeys",
      teamMembers: "Up to 5 team members",
      emotionalArc: "Advanced emotional arc",
      templates: "Full template library",
      export: "Export to PDF, PNG, CSV",
      collaboration: "Real-time collaboration",
      aiInsights: "500 AI credits/month",
      versioning: "30-day version history",
      support: "Email support",
      analytics: "Basic analytics",
      customBranding: false,
      sso: false,
      api: false,
      dedicatedManager: false,
    },
    cta: "Start Free Trial",
    ctaHref: "/signup?plan=starter",
    variant: "default" as const,
    popular: false,
  },
  business: {
    id: "business",
    name: "Business",
    icon: Building2,
    price: 49,
    priceYearly: 39,
    period: "per user/month",
    description: "For teams building a serious CX practice.",
    journeyLimit: -1, // unlimited
    teamMemberLimit: 25,
    aiCreditsMonthly: 2000,
    features: {
      journeys: "Unlimited journeys",
      teamMembers: "Up to 25 team members",
      emotionalArc: "Advanced emotional arc with benchmarks",
      templates: "Full template library + custom",
      export: "All export formats",
      collaboration: "Real-time collaboration",
      aiInsights: "2,000 AI credits/month",
      versioning: "90-day version history",
      support: "Priority support",
      analytics: "Advanced analytics & reports",
      customBranding: "Custom branding",
      sso: false,
      api: "API access",
      dedicatedManager: false,
    },
    cta: "Start Free Trial",
    ctaHref: "/signup?plan=business",
    variant: "default" as const,
    popular: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    icon: Crown,
    price: -1, // custom
    priceYearly: -1,
    period: "contact us",
    description: "For organizations scaling CX across teams.",
    journeyLimit: -1,
    teamMemberLimit: -1,
    aiCreditsMonthly: -1, // custom
    features: {
      journeys: "Unlimited journeys",
      teamMembers: "Unlimited team members",
      emotionalArc: "Enterprise emotional intelligence suite",
      templates: "Custom template development",
      export: "All formats + custom integrations",
      collaboration: "Enterprise collaboration tools",
      aiInsights: "Custom AI credits",
      versioning: "Unlimited version history",
      support: "24/7 dedicated support",
      analytics: "Enterprise analytics & BI integrations",
      customBranding: "White-label option",
      sso: "SSO & SAML",
      api: "Full API access",
      dedicatedManager: "Dedicated success manager",
    },
    cta: "Contact Sales",
    ctaHref: "/contact?type=enterprise",
    variant: "outline" as const,
    popular: false,
  },
}

const featureComparison = [
  { name: "Journeys", free: "3", starter: "15", business: "Unlimited", enterprise: "Unlimited" },
  { name: "Team members", free: "1", starter: "5", business: "25", enterprise: "Unlimited" },
  { name: "AI credits/month", free: "50", starter: "500", business: "2,000", enterprise: "Custom" },
  { name: "Version history", free: "7 days", starter: "30 days", business: "90 days", enterprise: "Unlimited" },
  { name: "Templates", free: "Community", starter: "Full library", business: "Full + custom", enterprise: "Custom dev" },
  { name: "Real-time collaboration", free: false, starter: true, business: true, enterprise: true },
  { name: "Advanced analytics", free: false, starter: false, business: true, enterprise: true },
  { name: "Custom branding", free: false, starter: false, business: true, enterprise: true },
  { name: "API access", free: false, starter: false, business: true, enterprise: true },
  { name: "SSO & SAML", free: false, starter: false, business: false, enterprise: true },
  { name: "Dedicated success manager", free: false, starter: false, business: false, enterprise: true },
  { name: "SLA guarantee", free: false, starter: false, business: false, enterprise: true },
]

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-20 md:py-28">
      {/* Header */}
      <div className="mx-auto mb-14 max-w-2xl text-center">
        <Badge variant="secondary" className="mb-4">Pricing</Badge>
        <h1 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-pretty text-lg leading-relaxed text-muted-foreground">
          Start free, upgrade when you need more power. All plans include a 14-day free trial.
        </p>
      </div>

      {/* Pricing Cards */}
      <PricingCards />

      {/* AI Credits Note */}
      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Need more AI credits? <Link href="/settings/billing" className="text-primary hover:underline">Top up anytime</Link> at $10 per 1,000 credits.
        </p>
      </div>

      {/* Feature Comparison Table */}
      <div className="mt-20">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Compare all features
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-4 px-4 text-left text-sm font-semibold text-foreground">Feature</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-foreground">Free</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-foreground">Starter</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-foreground bg-primary/5">Business</th>
                <th className="py-4 px-4 text-center text-sm font-semibold text-foreground">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {featureComparison.map((feature, idx) => (
                <tr key={feature.name} className={idx % 2 === 0 ? "bg-muted/30" : ""}>
                  <td className="py-3 px-4 text-sm text-foreground">{feature.name}</td>
                  <td className="py-3 px-4 text-center text-sm">
                    {typeof feature.free === "boolean" ? (
                      feature.free ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{feature.free}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {typeof feature.starter === "boolean" ? (
                      feature.starter ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{feature.starter}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm bg-primary/5">
                    {typeof feature.business === "boolean" ? (
                      feature.business ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                    ) : (
                      <span className="text-foreground font-medium">{feature.business}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center text-sm">
                    {typeof feature.enterprise === "boolean" ? (
                      feature.enterprise ? <Check className="h-4 w-4 text-primary mx-auto" /> : <X className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                    ) : (
                      <span className="text-muted-foreground">{feature.enterprise}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-20 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-foreground mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Can I change plans at any time?</h3>
            <p className="text-sm text-muted-foreground">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we&apos;ll prorate the difference.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">What happens when I run out of AI credits?</h3>
            <p className="text-sm text-muted-foreground">You can top up AI credits anytime from your settings. Credits are $10 per 1,000 and never expire. Your monthly allocation resets on your billing date.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Is there a free trial?</h3>
            <p className="text-sm text-muted-foreground">Yes! All paid plans come with a 14-day free trial. No credit card required to start.</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">What payment methods do you accept?</h3>
            <p className="text-sm text-muted-foreground">We accept all major credit cards, and enterprise customers can pay via invoice.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold text-foreground mb-4">Ready to transform your customer journeys?</h2>
        <p className="text-muted-foreground mb-8">Start mapping better experiences today.</p>
        <div className="flex items-center justify-center gap-4">
          <Button size="lg" asChild>
            <Link href="/signup">Get Started Free</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/contact?type=demo">Request Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
