"use client"

import { HeroJourneyPreview } from "@/components/landing/hero-journey-preview"

export function LandingProductPreview() {
  return (
    <section className="relative">
      <div className="mx-auto max-w-6xl px-6 py-12 md:py-16">
        <div className="relative">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -inset-4 rounded-2xl bg-primary/[0.03] blur-2xl" />
          <div className="relative rounded-xl border border-border/60 bg-card shadow-2xl shadow-primary/5">
            <HeroJourneyPreview />
          </div>
        </div>
      </div>
    </section>
  )
}
