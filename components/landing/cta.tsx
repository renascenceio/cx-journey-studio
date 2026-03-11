"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, LayoutDashboard } from "lucide-react"
import { useAuth } from "@/lib/auth-provider"

export function LandingCta() {
  const { isAuthenticated, isLoading } = useAuth()

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,var(--color-primary)/0.06,transparent_60%)]" />
      <div className="relative mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Ready to see every journey clearly?
          </h2>
          <p className="max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
            Join CX teams already using Journey Studio to map archetypes,
            visualize emotional arcs, and improve NPS, CSAT, and CES across
            every touch point.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {!isLoading && isAuthenticated ? (
              <>
                <Button size="lg" asChild>
                  <Link href="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Go to Dashboard
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/journeys">View Journeys</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link href="/signup">
                    Start Free Today
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/login">Sign In</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
