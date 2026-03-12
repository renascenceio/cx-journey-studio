import {
  Plane, Car, Landmark, ShoppingCart, GraduationCap, Wallet, Dumbbell, Building2, Apple, Heart, 
  Hotel, Shield, Truck, Gem, Tv, Pill, Building, Home, Store, Cloud, Radio, Briefcase, Globe, Zap,
  type LucideIcon,
} from "lucide-react"

export interface Industry {
  value: string
  labelKey: string // i18n key: industries.{value}
  icon: LucideIcon
}

// All industries sorted alphabetically with icons
// Labels are now i18n keys: industries.{value}
export const INDUSTRIES: Industry[] = [
  { value: "airlines", labelKey: "industries.airlines", icon: Plane },
  { value: "automotive", labelKey: "industries.automotive", icon: Car },
  { value: "banking", labelKey: "industries.banking", icon: Landmark },
  { value: "e-commerce", labelKey: "industries.ecommerce", icon: ShoppingCart },
  { value: "education", labelKey: "industries.education", icon: GraduationCap },
  { value: "fintech", labelKey: "industries.fintech", icon: Wallet },
  { value: "fitness", labelKey: "industries.fitness", icon: Dumbbell },
  { value: "government", labelKey: "industries.government", icon: Building2 },
  { value: "grocery", labelKey: "industries.grocery", icon: Apple },
  { value: "healthcare", labelKey: "industries.healthcare", icon: Heart },
  { value: "hospitality", labelKey: "industries.hospitality", icon: Hotel },
  { value: "insurance", labelKey: "industries.insurance", icon: Shield },
  { value: "logistics", labelKey: "industries.logistics", icon: Truck },
  { value: "luxury", labelKey: "industries.luxury", icon: Gem },
  { value: "media", labelKey: "industries.media", icon: Tv },
  { value: "pharma", labelKey: "industries.pharma", icon: Pill },
  { value: "property_management", labelKey: "industries.propertyManagement", icon: Building },
  { value: "real_estate", labelKey: "industries.realEstate", icon: Home },
  { value: "retail", labelKey: "industries.retail", icon: Store },
  { value: "saas", labelKey: "industries.saas", icon: Cloud },
  { value: "telecommunications", labelKey: "industries.telecom", icon: Radio },
  { value: "travel", labelKey: "industries.travel", icon: Globe },
  { value: "utilities", labelKey: "industries.utilities", icon: Zap },
  { value: "wealth_management", labelKey: "industries.wealthManagement", icon: Briefcase },
]

// Quick lookup for labelKey by value
export const industryLabelKeys: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map(i => [i.value, i.labelKey])
)

// Quick lookup for icon by value
export const industryIcons: Record<string, LucideIcon> = Object.fromEntries(
  INDUSTRIES.map(i => [i.value, i.icon])
)

// Helper function to get i18n key for an industry value
export function getIndustryLabelKey(value: string | undefined | null): string {
  if (!value) return ""
  // Check if it's a known industry value
  if (industryLabelKeys[value]) return industryLabelKeys[value]
  // Otherwise, return a dynamic key
  return `industries.${value.replace(/[-_]/g, "")}`
}

// Get icon component for an industry
export function getIndustryIcon(value: string | undefined | null): LucideIcon | null {
  if (!value) return null
  return industryIcons[value] || null
}
