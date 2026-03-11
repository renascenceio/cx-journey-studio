import {
  Plane, Car, Landmark, ShoppingCart, GraduationCap, Wallet, Dumbbell, Building2, Apple, Heart, 
  Hotel, Shield, Truck, Gem, Tv, Pill, Building, Home, Store, Cloud, Radio, Briefcase, Globe, Zap,
  type LucideIcon,
} from "lucide-react"

export interface Industry {
  value: string
  label: string
  icon: LucideIcon
}

// All industries sorted alphabetically with icons
export const INDUSTRIES: Industry[] = [
  { value: "airlines", label: "Airlines", icon: Plane },
  { value: "automotive", label: "Automotive", icon: Car },
  { value: "banking", label: "Banking", icon: Landmark },
  { value: "e-commerce", label: "E-Commerce", icon: ShoppingCart },
  { value: "education", label: "Education", icon: GraduationCap },
  { value: "fintech", label: "Fintech", icon: Wallet },
  { value: "fitness", label: "Fitness & Wellness", icon: Dumbbell },
  { value: "government", label: "Government", icon: Building2 },
  { value: "grocery", label: "Grocery", icon: Apple },
  { value: "healthcare", label: "Healthcare", icon: Heart },
  { value: "hospitality", label: "Hospitality", icon: Hotel },
  { value: "insurance", label: "Insurance", icon: Shield },
  { value: "logistics", label: "Logistics", icon: Truck },
  { value: "luxury", label: "Luxury Goods", icon: Gem },
  { value: "media", label: "Media & Entertainment", icon: Tv },
  { value: "pharma", label: "Pharmaceuticals", icon: Pill },
  { value: "property_management", label: "Property Management", icon: Building },
  { value: "real_estate", label: "Real Estate", icon: Home },
  { value: "retail", label: "Retail", icon: Store },
  { value: "saas", label: "SaaS", icon: Cloud },
  { value: "telecommunications", label: "Telecom", icon: Radio },
  { value: "travel", label: "Travel & Tourism", icon: Globe },
  { value: "utilities", label: "Utilities", icon: Zap },
  { value: "wealth_management", label: "Wealth Management", icon: Briefcase },
]

// Quick lookup for label by value
export const industryLabels: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map(i => [i.value, i.label])
)

// Quick lookup for icon by value
export const industryIcons: Record<string, LucideIcon> = Object.fromEntries(
  INDUSTRIES.map(i => [i.value, i.icon])
)

// Helper function to format an industry value to display label
export function formatIndustry(value: string | undefined | null): string {
  if (!value) return ""
  // Check if it's a known industry value
  if (industryLabels[value]) return industryLabels[value]
  // Otherwise, convert snake_case/kebab-case to Title Case
  return value
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Get icon component for an industry
export function getIndustryIcon(value: string | undefined | null): LucideIcon | null {
  if (!value) return null
  return industryIcons[value] || null
}
