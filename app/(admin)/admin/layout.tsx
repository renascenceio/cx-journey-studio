"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-provider"
import { useSiteConfig } from "@/hooks/use-site-config"
import {
  LayoutDashboard,
  BookTemplate,
  Users,
  CreditCard,
  Settings,
  ArrowLeft,
  Shield,
  Lightbulb,
  Globe,
  Headphones,
  Sparkles,
  Calculator,
  Languages,
  BarChart3,
  Banknote,
  Activity,
  Fingerprint,
  Bell,
  FileText,
  Crown,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "next-themes"

const adminNav = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, segment: null },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3, segment: "analytics" },
  { label: "Finance", href: "/admin/finance", icon: Banknote, segment: "finance" },
  { label: "Lineage", href: "/admin/lineage", icon: Fingerprint, segment: "lineage" },
  { label: "Templates", href: "/admin/templates", icon: BookTemplate, segment: "templates" },
  { label: "Users", href: "/admin/users", icon: Users, segment: "users" },
  { label: "Solutions", href: "/admin/solutions", icon: Lightbulb, segment: "solutions" },
  { label: "AI Prompts", href: "/admin/ai-prompts", icon: Sparkles, segment: "ai-prompts" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, segment: "notifications" },
  { label: "Billing & Plans", href: "/admin/billing", icon: CreditCard, segment: "billing" },
  { label: "Credits FAQ", href: "/admin/credits-faq", icon: Calculator, segment: "credits-faq" },
  { label: "Site Config", href: "/admin/config", icon: Settings, segment: "config" },
  { label: "Legal Content", href: "/admin/legal", icon: FileText, segment: "legal" },
  { label: "Translations", href: "/admin/translations", icon: Languages, segment: "translations" },
  { label: "Support", href: "/admin/support", icon: Headphones, segment: "support" },
  { label: "System Status", href: "/admin/status", icon: Activity, segment: "status" },
  { label: "Admin Access", href: "/admin/access", icon: Crown, segment: "access" },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const { user, isAuthenticated, isLoading } = useAuth()
  const { getLogoMark, config } = useSiteConfig()
  const { resolvedTheme } = useTheme()
  
  // Wait for mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Use "light" as server-side default, then switch to resolved theme after mount
  const theme = mounted && resolvedTheme === "dark" ? "dark" : "light"
  
  // getLogoMark now always returns a logo (configured or default)
  const logoMark = getLogoMark(theme)

  // Only show loading on initial mount when we don't have a user yet
  // Don't show loading during workspace refresh (which also sets isLoading)
  const showLoading = isLoading && !user

  // Show spinner only while auth is loading initially
  if (showLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Checking access...</p>
        </div>
      </div>
    )
  }

  // Not logged in - redirect hint
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Not Signed In</h2>
            <p className="mt-1 text-sm text-muted-foreground">Please sign in to access the admin panel.</p>
          </div>
          <Link href="/login" className="text-sm text-primary hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === "admin" || user?.role === "journey_master"
  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <Shield className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
            <p className="mt-1 text-sm text-muted-foreground">You need admin privileges to access this panel.</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-primary hover:underline"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  function isActive(nav: { href: string; segment: string | null }) {
    if (nav.segment === null) return pathname === "/admin"
    return pathname.startsWith(`/admin/${nav.segment}`)
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Toaster />
      {/* Sidebar */}
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col border-r border-border bg-muted/30">
        {/* Sidebar header */}
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
          <Image
            src={logoMark}
            alt={config?.siteName || "René Studio"}
            width={28}
            height={28}
            className="h-7 w-7 rounded-md object-contain"
            priority
          />
          <div>
            <p className="text-sm font-semibold text-foreground">René Studio</p>
            <p className="text-[10px] text-muted-foreground">Control Panel</p>
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-0.5 px-2 py-3">
          {adminNav.map((nav) => (
            <Link
              key={nav.href}
              href={nav.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                isActive(nav)
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <nav.icon className="h-4 w-4" />
              {nav.label}
            </Link>
          ))}
        </nav>

        {/* Back to app */}
        <div className="border-t border-border px-2 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to App
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-5xl px-6 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
