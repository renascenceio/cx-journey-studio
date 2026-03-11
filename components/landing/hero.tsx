"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"

export function LandingHero() {
  const { isAuthenticated, isLoading } = useAuth()
  const t = useTranslations()

  return (
    <section className="relative overflow-hidden">
      {/* Subtle top glow */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_0%,var(--color-primary)/0.05,transparent_70%)]" />

      <div className="relative mx-auto max-w-6xl px-6 pb-0 pt-24 md:pt-32">
        {/* Two-column headline block inspired by Vercel */}
        <div className="grid gap-8 md:grid-cols-2 md:gap-12 lg:gap-16">
          {/* Left: Headline */}
          <div className="flex flex-col justify-center">
            <h1 className="text-balance text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t("landing.hero.title")}
            </h1>
          </div>

          {/* Right: Description + CTA */}
          <div className="flex flex-col justify-center gap-6">
            <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              {t("landing.hero.subtitle")}
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {!isLoading && isAuthenticated ? (
                <>
                  <Button size="lg" className="h-12 px-8 text-base" asChild>
                    <Link href="/dashboard">
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      {t("landing.hero.goToDashboard")}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base"
                    asChild
                  >
                    <Link href="/journeys">{t("landing.hero.viewJourneys")}</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button size="lg" className="h-12 px-8 text-base" asChild>
                    <Link href="/signup">
                      {t("landing.hero.startFree")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 px-8 text-base"
                    asChild
                  >
                    <Link href="/login">{t("landing.hero.signIn")}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Impact metrics row */}
        <div className="mt-16 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border/60 bg-border/60 md:grid-cols-4">
          {[
            {
              stat: "72%",
              label: t("impactMetrics.fasterMapping"),
              company: "Meridian Health",
            },
            {
              stat: "+34 pts",
              label: t("impactMetrics.npsImprovement"),
              company: "NovaPay",
            },
            {
              stat: "3x",
              label: t("impactMetrics.crossTeamAlignment"),
              company: "Catalyst Retail",
            },
            {
              stat: "40%",
              label: t("impactMetrics.churnReduction"),
              company: "Vertex Labs",
            },
          ].map((item) => (
            <div
              key={item.company}
              className="flex flex-col gap-2 bg-card p-5 md:p-6"
            >
              <span className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {item.stat}
              </span>
              <span className="text-sm leading-snug text-muted-foreground">
                {item.label}
              </span>
              <span className="mt-auto pt-2 text-xs font-semibold tracking-tight text-muted-foreground/50">
                {item.company}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
