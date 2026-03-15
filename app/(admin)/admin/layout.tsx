"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
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
  ChevronDown,
  Search,
  Palette,
  FolderOpen,
  Building2,
  FolderKanban,
  PenLine,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Toaster } from "@/components/ui/sonner"
import { useTheme } from "next-themes"
import { Input } from "@/components/ui/input"
import { useAdminPermissions, ADMIN_PERMISSIONS, type Permission } from "@/hooks/use-admin-permissions"

// The only email with full admin access
const SUPER_ADMIN_EMAIL = "aslan@renascence.io"

// Map nav items to required permissions
const NAV_PERMISSIONS: Record<string, Permission[]> = {
  "/admin": [ADMIN_PERMISSIONS.VIEW_DASHBOARD],
  "/admin/analytics": [ADMIN_PERMISSIONS.VIEW_ANALYTICS],
  "/admin/finance": [ADMIN_PERMISSIONS.VIEW_FINANCE],
  "/admin/users": [ADMIN_PERMISSIONS.MANAGE_USERS],
  "/admin/billing": [ADMIN_PERMISSIONS.MANAGE_BILLING],
  "/admin/credits-faq": [ADMIN_PERMISSIONS.MANAGE_BILLING],
  "/admin/templates": [ADMIN_PERMISSIONS.MANAGE_TEMPLATES],
  "/admin/solutions": [ADMIN_PERMISSIONS.MANAGE_SOLUTIONS],
  "/admin/legal": [ADMIN_PERMISSIONS.MANAGE_LEGAL],
  "/admin/lineage": [ADMIN_PERMISSIONS.MANAGE_LINEAGE],
  "/admin/trends": [ADMIN_PERMISSIONS.MANAGE_TRENDS],
  "/admin/crowdsource": [ADMIN_PERMISSIONS.MANAGE_CROWDSOURCE],
  "/admin/brand": [ADMIN_PERMISSIONS.MANAGE_BRAND],
  "/admin/notifications": [ADMIN_PERMISSIONS.MANAGE_NOTIFICATIONS],
  "/admin/config": [ADMIN_PERMISSIONS.MANAGE_CONFIG],
  "/admin/ai-prompts": [ADMIN_PERMISSIONS.MANAGE_AI_PROMPTS],
  "/admin/translations": [ADMIN_PERMISSIONS.MANAGE_TRANSLATIONS],
  "/admin/support": [ADMIN_PERMISSIONS.MANAGE_SUPPORT],
  "/admin/status": [ADMIN_PERMISSIONS.VIEW_SYSTEM_STATUS],
  "/admin/access": [ADMIN_PERMISSIONS.MANAGE_ADMIN_ACCESS],
}

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  segment: string | null
  alert?: boolean // Show alert dot (e.g., for payment issues)
}

interface NavSectionConfig {
  title: string
  icon: React.ComponentType<{ className?: string }>
  items: NavItem[]
  defaultOpen?: boolean
}

const adminNavSections: NavSectionConfig[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    defaultOpen: true,
    items: [
      { label: "Overview", href: "/admin", icon: LayoutDashboard, segment: null },
      { label: "Analytics", href: "/admin/analytics", icon: BarChart3, segment: "analytics" },
      { label: "Finance", href: "/admin/finance", icon: Banknote, segment: "finance" },
    ],
  },
  {
    title: "Users & Organizations",
    icon: Users,
    defaultOpen: true,
    items: [
      { label: "Individuals", href: "/admin/users", icon: Users, segment: "users" },
      { label: "Organizations", href: "/admin/organizations", icon: Building2, segment: "organizations" },
      { label: "Workspaces", href: "/admin/workspaces", icon: FolderKanban, segment: "workspaces" },
      { label: "Billing & Plans", href: "/admin/billing", icon: CreditCard, segment: "billing", alert: true },
      { label: "Credits FAQ", href: "/admin/credits-faq", icon: Calculator, segment: "credits-faq" },
    ],
  },
  {
    title: "Content",
    icon: FolderOpen,
    defaultOpen: true,
    items: [
      { label: "Templates", href: "/admin/templates", icon: BookTemplate, segment: "templates" },
      { label: "Solutions", href: "/admin/solutions", icon: Lightbulb, segment: "solutions" },
      { label: "Trends", href: "/admin/trends", icon: BarChart3, segment: "trends" },
      { label: "Crowdsource", href: "/admin/crowdsource", icon: Users, segment: "crowdsource" },
      { label: "Words", href: "/admin/words", icon: PenLine, segment: "words" },
      { label: "Legal", href: "/admin/legal", icon: FileText, segment: "legal" },
      { label: "Lineage", href: "/admin/lineage", icon: Fingerprint, segment: "lineage" },
    ],
  },
  {
    title: "Brand",
    icon: Palette,
    defaultOpen: false,
    items: [
      { label: "Brand Settings", href: "/admin/brand", icon: Palette, segment: "brand" },
      { label: "Notifications", href: "/admin/notifications", icon: Bell, segment: "notifications" },
    ],
  },
  {
    title: "Configuration",
    icon: Settings,
    defaultOpen: false,
    items: [
      { label: "General", href: "/admin/config", icon: Settings, segment: "config" },
      { label: "AI Prompts", href: "/admin/ai-prompts", icon: Sparkles, segment: "ai-prompts" },
      { label: "Translations", href: "/admin/translations", icon: Languages, segment: "translations" },
    ],
  },
  {
    title: "System",
    icon: Activity,
    defaultOpen: false,
    items: [
      { label: "Support", href: "/admin/support", icon: Headphones, segment: "support" },
      { label: "System Status", href: "/admin/status", icon: Activity, segment: "status" },
      { label: "Admin Access", href: "/admin/access", icon: Crown, segment: "access" },
    ],
  },
]

// Flatten all nav items for search
const allNavItems = adminNavSections.flatMap(section => 
  section.items.map(item => ({ ...item, section: section.title }))
)

// Collapsible section component
function NavSectionItem({ 
  section, 
  isActive, 
  expandedSections, 
  toggleSection,
  hasPaymentIssue,
}: { 
  section: NavSectionConfig
  isActive: (nav: NavItem) => boolean
  expandedSections: Record<string, boolean>
  toggleSection: (title: string) => void
  hasPaymentIssue?: boolean
}) {
  const isExpanded = expandedSections[section.title] ?? section.defaultOpen
  const hasActiveItem = section.items.some(isActive)
  
  return (
    <div className="mb-1">
      <button
        onClick={() => toggleSection(section.title)}
        className={cn(
          "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
          hasActiveItem ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <div className="flex items-center gap-2">
          <section.icon className="h-3.5 w-3.5" />
          {section.title}
        </div>
        <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isExpanded && "rotate-180")} />
      </button>
      {isExpanded && (
        <div className="mt-1 space-y-0.5 pl-2">
{section.items.map((nav) => (
  <Link
  key={nav.href}
  href={nav.href}
  className={cn(
  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
  isActive(nav)
  ? "bg-primary/10 font-medium text-primary"
  : "text-muted-foreground hover:bg-accent hover:text-foreground"
  )}
  >
  <nav.icon className="h-3.5 w-3.5" />
  <span className="flex-1">{nav.label}</span>
  {nav.alert && hasPaymentIssue && (
    <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
  )}
  </Link>
  ))}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(() => {
    // Initialize with defaultOpen values
    const initial: Record<string, boolean> = {}
    adminNavSections.forEach(section => {
      initial[section.title] = section.defaultOpen ?? false
    })
    return initial
  })
  const { user, isAuthenticated, isLoading, workspace } = useAuth()
  const { getLogoMark, config } = useSiteConfig()
  const { resolvedTheme } = useTheme()
  const { isSuperAdmin, hasAnyPermission, isAnyAdmin, isLoading: permissionsLoading } = useAdminPermissions()
  
  // Check if user can access a nav item
  const canAccessNav = (href: string): boolean => {
    if (isSuperAdmin) return true
    const required = NAV_PERMISSIONS[href]
    if (!required) return true
    return hasAnyPermission(required)
  }
  
  // Filter sections and items based on permissions
  const filteredNavSections = useMemo(() => {
    if (isSuperAdmin) return adminNavSections
    
    return adminNavSections
      .map(section => ({
        ...section,
        items: section.items.filter(item => canAccessNav(item.href))
      }))
      .filter(section => section.items.length > 0)
  }, [isSuperAdmin, hasAnyPermission])
  
  // Filter nav items based on search (with permission check)
  const filteredNavItems = useMemo(() => {
    if (!searchQuery) return []
    const query = searchQuery.toLowerCase()
    return allNavItems
      .filter(item => canAccessNav(item.href))
      .filter(item => 
        item.label.toLowerCase().includes(query) ||
        item.section.toLowerCase().includes(query)
      )
  }, [searchQuery, isSuperAdmin, hasAnyPermission])
  
  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }))
  }
  
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

  // Check admin access - super admin check via email first, then permissions hook
  // Use email check directly to avoid race conditions with the permissions API
  const isSuperAdminByEmail = user?.email === SUPER_ADMIN_EMAIL
  const hasAdminAccess = isSuperAdminByEmail || isSuperAdmin || isAnyAdmin
  if (!hasAdminAccess && !permissionsLoading) {
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
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3" suppressHydrationWarning>
          {logoMark ? (
            <Image
              src={logoMark}
              alt={config?.siteName || "René Studio"}
              width={28}
              height={28}
              className="h-7 w-7 rounded-md object-contain"
              priority
            />
          ) : (
            <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              R
            </div>
          )}
          <div>
            <p className="text-sm font-semibold text-foreground">René Studio</p>
            <p className="text-[10px] text-muted-foreground">Control Panel</p>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search menu..."
              className="h-8 pl-8 text-xs bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex flex-1 flex-col gap-1 px-2 py-3 overflow-y-auto">
          {searchQuery ? (
            // Search results
            <div className="space-y-1">
              {filteredNavItems.length === 0 ? (
                <p className="px-3 py-2 text-xs text-muted-foreground">No results found</p>
              ) : (
                filteredNavItems.map((nav) => (
                  <Link
                    key={nav.href}
                    href={nav.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                      isActive(nav)
                        ? "bg-primary/10 font-medium text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                    onClick={() => setSearchQuery("")}
                  >
                    <nav.icon className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span>{nav.label}</span>
                      <span className="text-[10px] text-muted-foreground">{nav.section}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
) : (
  // Sectioned navigation (filtered by permissions)
  filteredNavSections.map((section) => (
<NavSectionItem
  key={section.title}
  section={section}
  isActive={isActive}
  expandedSections={expandedSections}
  hasPaymentIssue={workspace?.paymentStatus?.paymentFailed}
                toggleSection={toggleSection}
              />
            ))
          )}
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
