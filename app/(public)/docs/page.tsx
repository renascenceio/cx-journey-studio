import { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { 
  BookOpen, 
  Sparkles, 
  Map, 
  Users, 
  Palette, 
  Shield, 
  Zap,
  FileText,
  Video,
  ArrowRight,
  ExternalLink
} from "lucide-react"

export const metadata: Metadata = {
  title: "Documentation | René Studio",
  description: "Learn how to use René Studio to map, understand, and transform customer experience journeys.",
}

const categories = [
  {
    title: "Getting Started",
    description: "Learn the basics of René Studio",
    icon: BookOpen,
    links: [
      { title: "Quick Start Guide", href: "/docs/quick-start", description: "Get up and running in 5 minutes" },
      { title: "Creating Your First Journey", href: "/docs/first-journey", description: "Step-by-step journey creation" },
      { title: "Understanding the Canvas", href: "/docs/canvas", description: "Navigate the journey canvas" },
      { title: "Inviting Team Members", href: "/docs/team", description: "Collaborate with your team" },
    ],
  },
  {
    title: "AI Features",
    description: "Leverage AI to enhance your work",
    icon: Sparkles,
    links: [
      { title: "Generate with René AI", href: "/docs/ai-generate", description: "Auto-generate journey content" },
      { title: "Enhance with AI", href: "/docs/ai-enhance", description: "Improve existing journeys" },
      { title: "AI Language Detection", href: "/docs/ai-language", description: "Multi-language AI generation" },
      { title: "Custom AI Prompts", href: "/docs/ai-prompts", description: "Customize AI behavior" },
    ],
  },
  {
    title: "Journey Mapping",
    description: "Create comprehensive journey maps",
    icon: Map,
    links: [
      { title: "Stages & Steps", href: "/docs/stages-steps", description: "Structure your journey" },
      { title: "Touchpoints", href: "/docs/touchpoints", description: "Map customer interactions" },
      { title: "Pain Points & Highlights", href: "/docs/pain-highlights", description: "Identify opportunities" },
      { title: "Emotional Scoring", href: "/docs/emotional-scoring", description: "Track customer sentiment" },
    ],
  },
  {
    title: "Archetypes",
    description: "Build customer personas",
    icon: Users,
    links: [
      { title: "Creating Archetypes", href: "/docs/archetypes", description: "Define customer personas" },
      { title: "Archetype Properties", href: "/docs/archetype-properties", description: "Detailed persona attributes" },
      { title: "Linking to Journeys", href: "/docs/archetype-journeys", description: "Connect personas to journeys" },
      { title: "AI-Generated Archetypes", href: "/docs/ai-archetypes", description: "Generate personas with AI" },
    ],
  },
  {
    title: "Customization",
    description: "Make René Studio your own",
    icon: Palette,
    links: [
      { title: "Workspace Settings", href: "/docs/workspace", description: "Configure your workspace" },
      { title: "Branding & Themes", href: "/docs/branding", description: "Customize appearance" },
      { title: "Export Options", href: "/docs/export", description: "Export your work" },
      { title: "Templates", href: "/docs/templates", description: "Save and reuse journeys" },
    ],
  },
  {
    title: "Administration",
    description: "Manage your organization",
    icon: Shield,
    links: [
      { title: "User Management", href: "/docs/users", description: "Manage team access" },
      { title: "Roles & Permissions", href: "/docs/roles", description: "Control access levels" },
      { title: "Billing & Plans", href: "/docs/billing", description: "Manage your subscription" },
      { title: "Security", href: "/docs/security", description: "Security best practices" },
    ],
  },
]

const quickLinks = [
  { title: "API Reference", href: "/docs/api", icon: Zap, description: "Integrate with our API" },
  { title: "Changelog", href: "/docs/changelog", icon: FileText, description: "Latest updates" },
  { title: "Video Tutorials", href: "/docs/videos", icon: Video, description: "Watch and learn" },
]

export default function DocsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-6">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Documentation
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need to know about using René Studio to create 
              exceptional customer journey maps.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button asChild>
                <Link href="/docs/quick-start">
                  Quick Start
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/docs/api">
                  API Reference
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="grid gap-4 sm:grid-cols-3">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <link.icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium text-foreground">{link.title}</div>
                  <div className="text-sm text-muted-foreground">{link.description}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-2">
          {categories.map((category) => (
            <div key={category.title} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <category.icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">{category.title}</h2>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="ml-[52px] space-y-1">
                {category.links.map((link) => (
                  <Link
                    key={link.title}
                    href={link.href}
                    className="block rounded-lg p-3 -ml-3 transition-colors hover:bg-muted"
                  >
                    <div className="font-medium text-foreground text-sm">{link.title}</div>
                    <div className="text-sm text-muted-foreground">{link.description}</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Help CTA */}
      <section className="border-t border-border bg-muted/30">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-foreground">Need more help?</h2>
            <p className="mt-2 text-muted-foreground">
              Can&apos;t find what you&apos;re looking for? Our support team is here to help.
            </p>
            <Button className="mt-6" variant="outline" asChild>
              <Link href="/contact">Contact Support</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
