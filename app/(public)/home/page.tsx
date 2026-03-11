import type { Metadata } from "next"
import { LandingHero } from "@/components/landing/hero"
import { LandingProductPreview } from "@/components/landing/product-preview"
import { LandingFeatures } from "@/components/landing/features"
import { LandingHowItWorks } from "@/components/landing/how-it-works"
import { LandingSocialProof } from "@/components/landing/social-proof"
import { LandingCta } from "@/components/landing/cta"

export const metadata: Metadata = {
  title: "CX Journey Mapping Studio",
  description:
    "Map, understand, and transform every customer experience journey. Collaborative journey mapping with emotional arc visualization, customer archetypes, and real-time health monitoring.",
}

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <LandingHero />
      <LandingProductPreview />
      <LandingSocialProof />
      <LandingFeatures />
      <LandingHowItWorks />
      <LandingCta />
    </div>
  )
}
