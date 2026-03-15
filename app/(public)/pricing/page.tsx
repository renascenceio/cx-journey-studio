import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X } from "lucide-react"
import { PricingCards } from "@/components/pricing-cards"
import { PLANS, ENTERPRISE_MIN_USERS } from "@/lib/plans"

export const metadata: Metadata = {
  title: "Pricing - René Studio",
  description: "Choose the perfect plan for your customer journey mapping needs.",
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
          Start free forever, upgrade when you need more power. No credit card required.
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
            <h3 className="text-sm font-semibold text-foreground mb-2">Can I try before I buy?</h3>
            <p className="text-sm text-muted-foreground">Absolutely! Our Free plan gives you full access to core features forever. Upgrade to a paid plan when you need more journeys, team members, or AI credits.</p>
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
