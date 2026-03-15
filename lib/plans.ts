import { Sparkles, Zap, Building2, Crown, type LucideIcon } from "lucide-react"

// Centralized plan configuration
// This is the single source of truth for all pricing and plan logic

export type PlanId = "free" | "starter" | "business" | "enterprise"

export interface PlanLimits {
  journeys: number        // -1 = unlimited
  teamMembers: number     // -1 = unlimited
  aiCreditsMonthly: number // -1 = custom/unlimited
  versionHistoryDays: number // -1 = unlimited
}

export interface PlanFeatures {
  templates: "community" | "full" | "full_custom" | "custom_dev"
  exportFormats: string[]
  collaboration: boolean
  analytics: false | "basic" | "advanced" | "enterprise"
  customBranding: boolean
  sso: boolean
  apiAccess: boolean
  dedicatedSupport: boolean
  prioritySupport: boolean
}

export interface Plan {
  id: PlanId
  name: string
  description: string
  icon: LucideIcon
  // Pricing
  priceMonthly: number    // -1 = custom/contact sales
  priceYearly: number     // -1 = custom/contact sales
  stripePriceIds?: {
    monthly?: string
    yearly?: string
  }
  // Limits
  limits: PlanLimits
  // Features
  features: PlanFeatures
  // UI
  popular: boolean
  ctaText: string
  ctaHref: string
  buttonVariant: "default" | "outline" | "secondary"
}

// Stripe Price IDs (set in Stripe Dashboard)
const STRIPE_PRICES = {
  starter: {
    monthly: "price_1TBAawRWXtNLtlsksjG3K5Vh",
    yearly: undefined, // Add when created
  },
  business: {
    monthly: "price_1TBAaxRWXtNLtlskjMUFNfxs",
    yearly: undefined, // Add when created
  },
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "For individuals exploring CX journey mapping.",
    icon: Sparkles,
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      journeys: 3,
      teamMembers: 1,
      aiCreditsMonthly: 50,
      versionHistoryDays: 7,
    },
    features: {
      templates: "community",
      exportFormats: ["pdf"],
      collaboration: false,
      analytics: false,
      customBranding: false,
      sso: false,
      apiAccess: false,
      dedicatedSupport: false,
      prioritySupport: false,
    },
    popular: false,
    ctaText: "Get Started",
    ctaHref: "/signup",
    buttonVariant: "outline",
  },
  starter: {
    id: "starter",
    name: "Starter",
    description: "For small teams starting their CX practice.",
    icon: Zap,
    priceMonthly: 19,
    priceYearly: 15,
    stripePriceIds: STRIPE_PRICES.starter,
    limits: {
      journeys: 15,
      teamMembers: 5,
      aiCreditsMonthly: 500,
      versionHistoryDays: 30,
    },
    features: {
      templates: "full",
      exportFormats: ["pdf", "png", "csv"],
      collaboration: true,
      analytics: "basic",
      customBranding: false,
      sso: false,
      apiAccess: false,
      dedicatedSupport: false,
      prioritySupport: false,
    },
    popular: false,
    ctaText: "Subscribe",
    ctaHref: "/signup?plan=starter",
    buttonVariant: "default",
  },
  business: {
    id: "business",
    name: "Business",
    description: "For teams building a serious CX practice.",
    icon: Building2,
    priceMonthly: 49,
    priceYearly: 39,
    stripePriceIds: STRIPE_PRICES.business,
    limits: {
      journeys: -1, // Unlimited
      teamMembers: 25,
      aiCreditsMonthly: 2000,
      versionHistoryDays: 90,
    },
    features: {
      templates: "full_custom",
      exportFormats: ["pdf", "png", "csv", "json"],
      collaboration: true,
      analytics: "advanced",
      customBranding: true,
      sso: false,
      apiAccess: true,
      dedicatedSupport: false,
      prioritySupport: true,
    },
    popular: true,
    ctaText: "Subscribe",
    ctaHref: "/signup?plan=business",
    buttonVariant: "default",
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations scaling CX across teams.",
    icon: Crown,
    priceMonthly: -1, // Custom pricing
    priceYearly: -1,
    limits: {
      journeys: -1,
      teamMembers: -1, // Unlimited, typically starts at 50+ users
      aiCreditsMonthly: -1, // Custom
      versionHistoryDays: -1, // Unlimited
    },
    features: {
      templates: "custom_dev",
      exportFormats: ["pdf", "png", "csv", "json", "figma"],
      collaboration: true,
      analytics: "enterprise",
      customBranding: true,
      sso: true,
      apiAccess: true,
      dedicatedSupport: true,
      prioritySupport: true,
    },
    popular: false,
    ctaText: "Contact Sales",
    ctaHref: "/contact?type=enterprise",
    buttonVariant: "outline",
  },
}

// Enterprise minimum is typically 50+ users in industry standard
export const ENTERPRISE_MIN_USERS = 50

// Helper functions
export function getPlan(planId: string): Plan {
  return PLANS[planId as PlanId] || PLANS.free
}

export function getPlanLimit(planId: string, limit: keyof PlanLimits): number {
  const plan = getPlan(planId)
  return plan.limits[limit]
}

export function hasFeature(planId: string, feature: keyof PlanFeatures): boolean {
  const plan = getPlan(planId)
  const value = plan.features[feature]
  return value === true || (typeof value === "string" && value !== "false")
}

export function canUpgrade(currentPlanId: string, targetPlanId: string): boolean {
  const planOrder: PlanId[] = ["free", "starter", "business", "enterprise"]
  const currentIndex = planOrder.indexOf(currentPlanId as PlanId)
  const targetIndex = planOrder.indexOf(targetPlanId as PlanId)
  return targetIndex > currentIndex
}

export function getUpgradePath(currentPlanId: string): PlanId | null {
  const planOrder: PlanId[] = ["free", "starter", "business", "enterprise"]
  const currentIndex = planOrder.indexOf(currentPlanId as PlanId)
  if (currentIndex < planOrder.length - 1) {
    return planOrder[currentIndex + 1]
  }
  return null
}

export function formatLimit(value: number, suffix?: string): string {
  if (value === -1) return "Unlimited"
  return suffix ? `${value} ${suffix}` : value.toString()
}

export function formatPrice(price: number): string {
  if (price === -1) return "Custom"
  if (price === 0) return "Free"
  return `$${price}`
}

// Get Stripe Price ID for a plan
export function getStripePriceId(planId: string, billingCycle: "monthly" | "yearly" = "monthly"): string | null {
  const plan = getPlan(planId)
  return plan.stripePriceIds?.[billingCycle] || null
}

// Check if plan requires Stripe checkout
export function requiresCheckout(planId: string): boolean {
  return planId !== "free" && planId !== "enterprise"
}

// Get feature display text
export function getFeatureDisplayText(plan: Plan): string[] {
  const features: string[] = []
  const { limits, features: f } = plan

  features.push(formatLimit(limits.journeys, limits.journeys === 1 ? "journey" : "journeys"))
  features.push(formatLimit(limits.teamMembers, limits.teamMembers === 1 ? "team member" : "team members"))
  features.push(`${formatLimit(limits.aiCreditsMonthly)} AI credits/month`)
  features.push(`${formatLimit(limits.versionHistoryDays, "day")} version history`)

  if (f.collaboration) features.push("Real-time collaboration")
  if (f.analytics === "basic") features.push("Basic analytics")
  if (f.analytics === "advanced") features.push("Advanced analytics")
  if (f.analytics === "enterprise") features.push("Enterprise analytics")
  if (f.customBranding) features.push("Custom branding")
  if (f.apiAccess) features.push("API access")
  if (f.sso) features.push("SSO & SAML")
  if (f.dedicatedSupport) features.push("Dedicated success manager")

  return features
}

// Plan order for comparisons
export const PLAN_ORDER: PlanId[] = ["free", "starter", "business", "enterprise"]
export const PAID_PLANS: PlanId[] = ["starter", "business"]
export const ALL_PLAN_IDS = Object.keys(PLANS) as PlanId[]
