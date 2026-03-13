"use client"

import Link from "next/link"
import { useTranslations } from "next-intl"
import { usePathname, useRouter } from "next/navigation"
import {
  Bell,
  Sun,
  Moon,
  Search,
  Home,
  ArrowLeft,
  ChevronRight,
  MessageSquare,
  AtSign,
  RefreshCw,
  UserPlus,
  AlertTriangle,
  Info,
  LayoutDashboard,
  Route,
  Users,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  LayoutTemplate,
  Lightbulb,
  Milestone,
  ChevronsUpDown,
  Check,
  Plus,
  Shield,
  HelpCircle,
  X,
  Menu,
  Building2,
} from "lucide-react"
import type { NotificationType, Workspace } from "@/lib/types"

// Notification styling by type
const NOTIFICATION_STYLES: Record<NotificationType, { icon: typeof Bell; bgColor: string; iconColor: string }> = {
  comment: { icon: MessageSquare, bgColor: "bg-blue-100 dark:bg-blue-950", iconColor: "text-blue-600 dark:text-blue-400" },
  mention: { icon: AtSign, bgColor: "bg-violet-100 dark:bg-violet-950", iconColor: "text-violet-600 dark:text-violet-400" },
  status_change: { icon: RefreshCw, bgColor: "bg-amber-100 dark:bg-amber-950", iconColor: "text-amber-600 dark:text-amber-400" },
  share: { icon: UserPlus, bgColor: "bg-emerald-100 dark:bg-emerald-950", iconColor: "text-emerald-600 dark:text-emerald-400" },
  health_alert: { icon: AlertTriangle, bgColor: "bg-red-100 dark:bg-red-950", iconColor: "text-red-600 dark:text-red-400" },
  system: { icon: Info, bgColor: "bg-slate-100 dark:bg-slate-800", iconColor: "text-slate-600 dark:text-slate-400" },
}
import { useTheme } from "next-themes"
import type { Notification } from "@/lib/types"
import useSWR from "swr"
import { useAuth } from "@/lib/auth-provider"

const fetcher = (url: string) => fetch(url).then((r) => r.json())
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect } from "react"
import { CreateWorkspaceDialog } from "@/components/create-workspace-dialog"
import { SpotlightSearch } from "@/components/spotlight-search"


const mainNavItems = [
  { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
  { key: "journeys", href: "/journeys", icon: Route },
  { key: "archetypes", href: "/archetypes", icon: UserCircle },
  { key: "templates", href: "/templates", icon: LayoutTemplate },
  { key: "solutions", href: "/solutions", icon: Lightbulb },
  { key: "roadmap", href: "/roadmap", icon: Milestone },
  { key: "analytics", href: "/analytics", icon: BarChart3 },
]



import { getInitials } from "@/lib/utils"

const planBadge: Record<string, string> = {
  free: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  pro: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  enterprise: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
}

export function AppTopbar() {
  const t = useTranslations()
  const pathname = usePathname()
  const router = useRouter()
  
  // Fetch notifications
  const { data: notifications = [], mutate: mutateNotifications } = useSWR<Notification[]>("/api/notifications", fetcher, {
    refreshInterval: 30000, // Refresh every 30 seconds
  })
  const unreadCount = notifications.filter((n) => !n.read).length
  
  // Mark notification as read and navigate
  async function handleNotificationClick(notif: Notification) {
    if (!notif.read) {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: notif.id }),
      })
      mutateNotifications()
    }
    if (notif.link) {
      router.push(notif.link)
    }
  }
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [createWsOpen, setCreateWsOpen] = useState(false)
  const { theme, setTheme } = useTheme()
  const { user, workspace, workspaces, switchWorkspace, logout, isLoading, isAuthenticated } = useAuth()
  
  // Use state for cached values to avoid hydration mismatch
  const [cachedWorkspace, setCachedWorkspace] = useState<Workspace | null>(null)
  const [cachedWorkspaces, setCachedWorkspaces] = useState<Workspace[]>([])
  const [hydrated, setHydrated] = useState(false)
  
  // Load from localStorage after hydration
  useEffect(() => {
    setHydrated(true)
    try {
      const storedWs = localStorage.getItem("jds_active_workspace")
      if (storedWs) setCachedWorkspace(JSON.parse(storedWs))
      const storedList = localStorage.getItem("jds_workspaces")
      if (storedList) setCachedWorkspaces(JSON.parse(storedList))
    } catch {
      // Ignore localStorage errors
    }
  }, [])
  
  // Update cache when auth context updates
  useEffect(() => {
    if (workspace) setCachedWorkspace(workspace)
    if (workspaces.length > 0) setCachedWorkspaces(workspaces)
  }, [workspace, workspaces])
  
  // Use auth context values if available, otherwise fall back to cached
  const displayWorkspace = workspace || cachedWorkspace
  const displayWorkspaces = workspaces.length > 0 ? workspaces : cachedWorkspaces

  const [roadmapCount, setRoadmapCount] = useState(0)

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRoadmapCount(data.length) })
      .catch(() => {})
  }, [])

  // Don't show anything if user is not loaded yet - prevents "Guest" flash
  const displayName = user?.name || user?.email?.split("@")[0] || ""
  const displayEmail = user?.email ?? ""
  const displayRole = user?.role ?? "viewer"

  function isActive(href: string) {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href.split("?")[0])
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/60">
      <div className="flex h-14 items-center gap-4 px-4 lg:px-6">
        {/* Workspace Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex shrink-0 items-center gap-2 rounded-md px-1.5 py-1 hover:bg-accent/50 transition-colors outline-none">
              {/* Show workspace logo if set, otherwise show default logo mark */}
              {displayWorkspace?.logo ? (
                <img
                  src={displayWorkspace.logo}
                  alt={displayWorkspace.name}
                  className="h-7 w-7 rounded-lg object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
              )}
              <div className="hidden lg:flex flex-col items-start">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold tracking-tight text-foreground leading-none">
                    {displayWorkspace?.name || "Loading..."}
                  </span>
                  <ChevronsUpDown className="h-3 w-3 text-muted-foreground" />
                </div>
                <span className={cn("text-[10px] font-medium rounded px-1 -ml-0.5 leading-relaxed capitalize", planBadge[displayWorkspace?.plan ?? "free"])}>
                  {displayWorkspace?.plan ?? "free"}
                </span>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">{t("workspace.workspaces")}</DropdownMenuLabel>
            {displayWorkspaces.length === 0 && isLoading ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {t("workspace.loading")}
              </div>
            ) : displayWorkspaces.length === 0 ? (
              <div className="px-2 py-3 text-center text-sm text-muted-foreground">
                {t("common.noData")}
              </div>
            ) : (
              displayWorkspaces.map((w) => (
                <DropdownMenuItem
                  key={w.id}
                  onClick={() => switchWorkspace(w.id)}
                  className="flex items-center gap-3 py-2"
                >
                  {w.logo ? (
                    <img src={w.logo} alt={w.name} className="h-8 w-8 rounded-md object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-xs font-semibold text-foreground">
                      {w.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{w.name}</span>
                      {w.id === displayWorkspace?.id && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {w.memberCount} member{w.memberCount !== 1 ? "s" : ""} · {w.journeyCount} journey{w.journeyCount !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <Badge variant="secondary" className={cn("text-[9px] capitalize shrink-0", planBadge[w.plan])}>
                    {w.plan}
                  </Badge>
                </DropdownMenuItem>
              ))
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 text-muted-foreground" onClick={() => setCreateWsOpen(true)}>
              <Plus className="h-3.5 w-3.5" />
              {t("workspace.createWorkspace")}
            </DropdownMenuItem>
            <DropdownMenuItem asChild className="gap-2 text-muted-foreground">
              <Link href="/settings/workspace">
                <Building2 className="h-3.5 w-3.5" />
                {t("settings.workspaceSettings")}
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-0.5 md:flex">
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const label = t(`nav.${item.key}`)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
                {item.key === "roadmap" && roadmapCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="flex-1" />

        {/* Search */}
        <div className="hidden items-center md:flex">
          <SpotlightSearch />
        </div>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative h-8 w-8">
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">{unreadCount > 0 ? `${unreadCount} unread notifications` : "Notifications"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-96">
              <div className="flex items-center justify-between px-2 py-1.5">
                <DropdownMenuLabel className="p-0">{t("notifications.title")}</DropdownMenuLabel>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                    {unreadCount} {t("notifications.new")}
                  </span>
                )}
              </div>
              <DropdownMenuSeparator />
{notifications.length === 0 ? (
    <div className="py-6 text-center">
      <Bell className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
      <p className="text-sm text-muted-foreground">{t("notifications.empty")}</p>
    </div>
  ) : (
    notifications.slice(0, 5).map((notif) => {
      const style = NOTIFICATION_STYLES[notif.type] || NOTIFICATION_STYLES.system
      const IconComponent = style.icon
      return (
        <DropdownMenuItem 
          key={notif.id} 
          className={cn(
            "flex items-start gap-3 py-3 px-3 cursor-pointer",
            !notif.read && "bg-primary/5"
          )}
          onClick={() => handleNotificationClick(notif)}
        >
          <div className={cn("shrink-0 rounded-full p-2", style.bgColor)}>
            <IconComponent className={cn("h-4 w-4", style.iconColor)} />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className={cn(
              "text-sm leading-snug",
              notif.read ? "text-muted-foreground" : "font-medium text-foreground"
            )}>
              {notif.message}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {new Date(notif.createdAt).toLocaleDateString("en-US", { 
                month: "short", 
                day: "numeric", 
                hour: "numeric", 
                minute: "2-digit" 
              })}
            </p>
          </div>
          {!notif.read && (
            <div className="shrink-0 h-2 w-2 rounded-full bg-primary mt-2" />
          )}
        </DropdownMenuItem>
      )
    })
  )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="justify-center text-xs text-primary hover:text-primary cursor-pointer py-2"
                    onClick={() => router.push("/settings/notifications")}
                  >
                    {t("notifications.viewAll")}
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Profile dropdown - only show if user is authenticated */}
          {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="sr-only">Profile menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{displayName}</span>
                    <Badge variant="secondary" className={cn("text-[9px] h-4", ROLE_COLORS[displayRole])}>
                      {ROLE_LABELS[displayRole]}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{displayEmail}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings"><Settings className="mr-2 h-4 w-4" />{t("nav.settings")}</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings/team"><Users className="mr-2 h-4 w-4" />{t("nav.team")}</Link>
              </DropdownMenuItem>
              {user?.role === "admin" || user?.role === "journey_master" ? (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="text-primary">
                      <Shield className="mr-2 h-4 w-4" />{t("nav.admin")}
                    </Link>
                  </DropdownMenuItem>
                </>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href="/faq">
                  <HelpCircle className="mr-2 h-4 w-4" />{t("nav.faq")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/support">
                  <HelpCircle className="mr-2 h-4 w-4" />{t("nav.support")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => logout()}>
                <LogOut className="mr-2 h-4 w-4" />{t("nav.logout")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          ) : null}

          <Button variant="ghost" size="icon" className="h-8 w-8 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background p-4 md:hidden">
          <nav className="flex flex-col gap-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon
              const label = t(`nav.${item.key}`)
              return (
                <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}
                  className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href) ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                  )}>
                  <Icon className="h-4 w-4" />{label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-3 pt-3 border-t border-border">
            <SpotlightSearch
              trigger={
                <Button variant="outline" className="w-full justify-start gap-2 text-muted-foreground">
                  <Search className="h-3.5 w-3.5" />
                  {t("spotlight.placeholder")}
                </Button>
              }
            />
          </div>
        </div>
      )}
      {/* Create Workspace Dialog */}
      <CreateWorkspaceDialog open={createWsOpen} onOpenChange={setCreateWsOpen} />
    </header>
  )
}
