import { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Users, Sparkles, Globe, Target } from "lucide-react"

export const metadata: Metadata = {
  title: "About | René Studio",
  description: "Learn about René Studio - the platform for mapping, understanding, and transforming customer experience journeys.",
}

const values = [
  {
    icon: Users,
    title: "Customer-Centric",
    description: "We believe every business decision should start with understanding the customer experience.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Insights",
    description: "We leverage AI to surface patterns and opportunities that would take humans weeks to discover.",
  },
  {
    icon: Globe,
    title: "Global Perspective",
    description: "Built by a diverse team with experience across industries and cultures worldwide.",
  },
  {
    icon: Target,
    title: "Actionable Outcomes",
    description: "Every feature is designed to drive real improvements in customer experience metrics.",
  },
]

const stats = [
  { value: "10K+", label: "Journeys Mapped" },
  { value: "500+", label: "Organizations" },
  { value: "50+", label: "Countries" },
  { value: "95%", label: "Satisfaction Rate" },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-6 py-24 sm:py-32">
          <div className="max-w-3xl">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Transforming how organizations understand their customers
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              René Studio was built by Renascence, a customer experience consultancy based in Dubai. 
              After years of creating journey maps manually for clients across the Middle East and beyond, 
              we built the tool we always wished existed.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Button asChild>
                <Link href="/pricing">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/contact">Contact Us</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">Our Story</h2>
            <div className="mt-6 space-y-4 text-muted-foreground leading-relaxed">
              <p>
                Renascence was founded in Dubai with a mission to help organizations deliver exceptional 
                customer experiences. Over the years, we&apos;ve worked with hundreds of companies across 
                banking, retail, healthcare, and government sectors.
              </p>
              <p>
                We noticed a pattern: every engagement started with mapping the customer journey. 
                Teams would spend weeks in workshops, filling whiteboards with sticky notes, 
                only to struggle with maintaining and sharing those insights.
              </p>
              <p>
                René Studio was born from this frustration. We built a platform that combines the 
                depth of professional journey mapping with the power of AI, making it possible for 
                any team to create, analyze, and act on customer insights.
              </p>
            </div>
          </div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-primary/20">René</div>
                <div className="mt-2 text-sm text-muted-foreground">Est. 2024</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">What We Believe</h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Our values guide every feature we build and every interaction we have.
            </p>
          </div>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-foreground">{value.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl bg-primary/5 border border-primary/10 p-8 sm:p-12 text-center">
          <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
            Ready to transform your customer experience?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Join thousands of teams using René Studio to map, understand, and improve their customer journeys.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/pricing">
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/contact">Talk to Sales</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
