"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Route,
  UserCircle,
  LayoutTemplate,
  Lightbulb,
  Milestone,
  BarChart3,
  Settings,
  Users,
  Building2,
  HelpCircle,
  Search,
  Plus,
  Layers,
  ArrowRight,
  AlertCircle,
  Star,
  Loader2,
  Command,
  Sparkles,
  TrendingUp,
  Zap,
  Clock,
  ChevronRight,
  CornerDownLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import useSWR from "swr"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

// Pages and actions are defined inside the component to use translations

// Icons for different result types
const typeConfig: Record<string, { icon: typeof Route; gradient: string; bgLight: string; bgDark: string }> = {
  journey: { icon: Route, gradient: "from-emerald-500 to-teal-500", bgLight: "bg-emerald-50", bgDark: "dark:bg-emerald-950/50" },
  solution: { icon: Lightbulb, gradient: "from-amber-500 to-orange-500", bgLight: "bg-amber-50", bgDark: "dark:bg-amber-950/50" },
  archetype: { icon: UserCircle, gradient: "from-violet-500 to-purple-500", bgLight: "bg-violet-50", bgDark: "dark:bg-violet-950/50" },
  template: { icon: LayoutTemplate, gradient: "from-blue-500 to-indigo-500", bgLight: "bg-blue-50", bgDark: "dark:bg-blue-950/50" },
  stage: { icon: Layers, gradient: "from-cyan-500 to-blue-500", bgLight: "bg-cyan-50", bgDark: "dark:bg-cyan-950/50" },
  step: { icon: ArrowRight, gradient: "from-slate-400 to-slate-500", bgLight: "bg-slate-50", bgDark: "dark:bg-slate-900/50" },
  pain_point: { icon: AlertCircle, gradient: "from-red-500 to-rose-500", bgLight: "bg-red-50", bgDark: "dark:bg-red-950/50" },
  highlight: { icon: Star, gradient: "from-yellow-500 to-amber-500", bgLight: "bg-yellow-50", bgDark: "dark:bg-yellow-950/50" },
}

interface SearchResult {
  id: string
  type: string
  title: string
  description: string
  url: string
  meta: Record<string, unknown>
  relevance: number
}

interface SearchResponse {
  results: SearchResult[]
  categories: Record<string, number>
  total: number
  query: string
}

interface SpotlightSearchProps {
  trigger?: React.ReactNode
}

export function SpotlightSearch({ trigger }: SpotlightSearchProps) {
  const t = useTranslations()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  
  // Quick actions/pages (always available) - defined inside component for translations
  const pages = [
    { name: t("spotlightPages.dashboard"), icon: LayoutDashboard, href: "/dashboard", keywords: ["home", "overview", "main"], description: t("spotlightPages.dashboardDesc") },
    { name: t("spotlightPages.journeys"), icon: Route, href: "/journeys", keywords: ["maps", "customer", "cx"], description: t("spotlightPages.journeysDesc") },
    { name: t("spotlightPages.archetypes"), icon: UserCircle, href: "/archetypes", keywords: ["personas", "users", "customers"], description: t("spotlightPages.archetypesDesc") },
    { name: t("spotlightPages.templates"), icon: LayoutTemplate, href: "/templates", keywords: ["presets", "starting"], description: t("spotlightPages.templatesDesc") },
    { name: t("spotlightPages.solutions"), icon: Lightbulb, href: "/solutions", keywords: ["ideas", "fixes", "improvements"], description: t("spotlightPages.solutionsDesc") },
    { name: t("spotlightPages.roadmap"), icon: Milestone, href: "/roadmap", keywords: ["initiatives", "planning", "timeline"], description: t("spotlightPages.roadmapDesc") },
    { name: t("spotlightPages.analytics"), icon: BarChart3, href: "/analytics", keywords: ["metrics", "data", "reports"], description: t("spotlightPages.analyticsDesc") },
    { name: t("spotlightPages.settings"), icon: Settings, href: "/settings", keywords: ["preferences", "config"], description: t("spotlightPages.settingsDesc") },
    { name: t("spotlightPages.team"), icon: Users, href: "/settings/team", keywords: ["members", "people", "invite"], description: t("spotlightPages.teamDesc") },
    { name: t("spotlightPages.workspace"), icon: Building2, href: "/settings/workspace", keywords: ["organization", "company"], description: t("spotlightPages.workspaceDesc") },
    { name: t("spotlightPages.helpCenter"), icon: HelpCircle, href: "/faq", keywords: ["support", "questions", "docs"], description: t("spotlightPages.helpCenterDesc") },
  ]

  // Quick actions
  const actions = [
    { name: t("spotlight.createJourney"), icon: Plus, action: "create-journey", keywords: ["new", "add", "journey"], color: "emerald" },
    { name: t("spotlight.newArchetype"), icon: Plus, action: "create-archetype", keywords: ["add", "persona", "archetype"], color: "violet" },
    { name: t("spotlight.addSolution"), icon: Plus, action: "create-solution", keywords: ["add", "idea", "solution"], color: "amber" },
  ]
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(query, 150)

  // Comprehensive search API
  const { data: searchData, isLoading } = useSWR<SearchResponse>(
    open && debouncedQuery.length >= 2 ? `/api/search?q=${encodeURIComponent(debouncedQuery)}&limit=25` : null,
    fetcher
  )

  // Register keyboard shortcut
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open])

  // Reset state when closing
  useEffect(() => {
    if (!open) {
      setQuery("")
      setSelectedIndex(0)
    }
  }, [open])

  const runCommand = useCallback((command: () => void) => {
    setOpen(false)
    command()
  }, [])

  // Build flat list of all selectable items
  const buildItemsList = useCallback(() => {
    const items: { type: string; data: unknown; onSelect: () => void }[] = []
    
    const showSearchResults = debouncedQuery.length >= 2
    
    if (showSearchResults && searchData?.results) {
      // Group results
      const grouped: Record<string, SearchResult[]> = {}
      for (const result of searchData.results) {
        if (!grouped[result.type]) grouped[result.type] = []
        grouped[result.type].push(result)
      }
      
      for (const [type, results] of Object.entries(grouped)) {
        for (const result of results.slice(0, 5)) {
          items.push({
            type: "result",
            data: result,
            onSelect: () => runCommand(() => router.push(result.url))
          })
        }
      }
    } else {
      // Actions
      const filteredActions = query.length >= 1 
        ? actions.filter(a => a.name.toLowerCase().includes(query.toLowerCase()) || a.keywords.some(k => k.includes(query.toLowerCase())))
        : actions
      
      for (const action of filteredActions) {
        items.push({
          type: "action",
          data: action,
          onSelect: () => {
            if (action.action === "create-journey") runCommand(() => router.push("/journeys?create=true"))
            else if (action.action === "create-archetype") runCommand(() => router.push("/archetypes?create=true"))
            else if (action.action === "create-solution") runCommand(() => router.push("/solutions?create=true"))
          }
        })
      }
      
      // Pages
      const filteredPages = query.length >= 1 
        ? pages.filter(p => p.name.toLowerCase().includes(query.toLowerCase()) || p.keywords.some(k => k.includes(query.toLowerCase())))
        : pages.slice(0, 6)
      
      for (const page of filteredPages) {
        items.push({
          type: "page",
          data: page,
          onSelect: () => runCommand(() => router.push(page.href))
        })
      }
    }
    
    return items
  }, [debouncedQuery, searchData, query, runCommand, router])

  const items = buildItemsList()

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return
      
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex(i => Math.min(i + 1, items.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex(i => Math.max(i - 1, 0))
      } else if (e.key === "Enter" && items[selectedIndex]) {
        e.preventDefault()
        items[selectedIndex].onSelect()
      } else if (e.key === "Escape") {
        e.preventDefault()
        setOpen(false)
      }
    }
    
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, items, selectedIndex])

  // Reset selected index when items change
  useEffect(() => {
    setSelectedIndex(0)
  }, [debouncedQuery])

  // Scroll selected item into view
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const item = list.querySelector(`[data-index="${selectedIndex}"]`)
    if (item) {
      item.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  // Filter pages based on query
  const filteredPages = query.length >= 1 ? pages.filter((page) => {
    const q = query.toLowerCase()
    return page.name.toLowerCase().includes(q) || page.keywords.some((k) => k.includes(q))
  }) : pages.slice(0, 6)

  // Filter actions based on query
  const filteredActions = query.length >= 1 ? actions.filter((action) => {
    const q = query.toLowerCase()
    return action.name.toLowerCase().includes(q) || action.keywords.some((k) => k.includes(q))
  }) : actions

  // Group search results by type
  const groupedResults: Record<string, SearchResult[]> = {}
  if (searchData?.results) {
    for (const result of searchData.results) {
      if (!groupedResults[result.type]) groupedResults[result.type] = []
      groupedResults[result.type].push(result)
    }
  }

  const hasSearchResults = Object.keys(groupedResults).length > 0
  const showSearchResults = debouncedQuery.length >= 2

  const categoryLabels: Record<string, string> = {
    journey: t("nav.journeys"),
    solution: t("nav.solutions"),
    archetype: t("nav.archetypes"),
    template: t("nav.templates"),
    stage: t("journey.stages"),
    step: t("journey.step"),
    pain_point: t("journey.painPoints"),
    highlight: t("journey.highlights"),
  }

  let itemIndex = -1

  return (
    <>
      {trigger ? (
        <div onClick={() => setOpen(true)}>{trigger}</div>
      ) : (
        <div className="group relative">
          {/* Apple-style animated gradient border on hover with blur */}
          <div className="absolute -inset-[2px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 overflow-hidden blur-[3px]">
            <div 
              className="absolute inset-0 bg-[conic-gradient(from_var(--gradient-angle),theme(colors.primary/0.5),theme(colors.violet.500/0.6),theme(colors.pink.500/0.6),theme(colors.amber.500/0.5),theme(colors.emerald.500/0.5),theme(colors.primary/0.5))] animate-gradient-rotate"
              style={{ '--gradient-angle': '0deg' } as React.CSSProperties}
            />
          </div>
          <Button
            variant="outline"
            className="relative h-9 w-52 justify-start gap-2.5 rounded-xl border-transparent bg-muted/30 text-sm text-muted-foreground transition-all group-hover:bg-background group-hover:border-transparent lg:w-64"
            onClick={() => setOpen(true)}
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-primary/20 to-primary/5 group-hover:from-primary/30 group-hover:to-violet-500/10 transition-all">
              <Search className="h-3 w-3 text-primary" />
            </div>
            <span className="flex-1 text-left font-normal">{t("spotlight.placeholder")}</span>
            <kbd className="pointer-events-none hidden h-5 select-none items-center gap-0.5 rounded-md border border-border/50 bg-background px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 shadow-sm sm:flex">
              <Command className="h-2.5 w-2.5" />K
            </kbd>
          </Button>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 shadow-2xl sm:max-w-[680px] rounded-2xl border-border/50 bg-background/95 backdrop-blur-xl">
          <VisuallyHidden>
            <DialogTitle>Spotlight Search</DialogTitle>
          </VisuallyHidden>
          
          {/* Decorative top gradient */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          
          {/* Search Header */}
          <div className="relative border-b border-border/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent">
                <Search className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <Input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("spotlight.searchPlaceholder")}
                  className="h-10 border-0 bg-transparent px-0 text-base shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
                />
              </div>
              {isLoading && (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              )}
              {query && !isLoading && (
                <Badge variant="secondary" className="h-6 gap-1 rounded-md bg-muted/50 px-2 text-[10px] font-medium">
                  <Sparkles className="h-3 w-3" />
                  {t("spotlight.aiPowered")}
                </Badge>
              )}
            </div>
            
            {/* Quick filter chips */}
            {!showSearchResults && (
              <div className="flex items-center gap-2 border-t border-border/30 bg-muted/20 px-4 py-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">{t("spotlight.quickFilters")}:</span>
                <div className="flex items-center gap-1.5">
                  {[
                    { label: t("spotlight.journeys"), query: "type:journey" },
                    { label: t("spotlight.solutions"), query: "type:solution" },
                    { label: t("spotlight.painPoints"), query: "type:pain_point" },
                  ].map((filter) => (
                    <button
                      key={filter.label}
                      onClick={() => setQuery(filter.query)}
                      className="rounded-full bg-background/60 px-2.5 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Results Area */}
          <div ref={listRef} className="max-h-[420px] overflow-y-auto overscroll-contain">
            {/* Loading State */}
            {isLoading && showSearchResults && (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <div className="relative">
                  <div className="h-12 w-12 rounded-full border-2 border-primary/20" />
                  <div className="absolute inset-0 h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">{t("spotlight.searching")}</p>
              </div>
            )}

            {/* Empty State */}
            {showSearchResults && !isLoading && !hasSearchResults && (
              <div className="flex flex-col items-center justify-center gap-4 py-16">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted/50">
                  <Search className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">{t("spotlight.noResults")}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t("spotlight.noResultsDesc")}</p>
                </div>
              </div>
            )}

            {/* Search Results */}
            {showSearchResults && !isLoading && hasSearchResults && (
              <div className="py-2">
                {/* Results summary */}
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    {searchData?.total || 0} {t("spotlight.resultsFound")}
                  </span>
                  <div className="flex items-center gap-1">
                    {Object.entries(searchData?.categories || {}).slice(0, 4).map(([cat, count]) => (
                      <Badge key={cat} variant="outline" className="h-5 rounded-md px-1.5 text-[10px]">
                        {count} {categoryLabels[cat]?.toLowerCase() || cat}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {Object.entries(groupedResults).map(([type, results]) => {
                  const config = typeConfig[type] || typeConfig.journey
                  const IconComponent = config.icon
                  
                  return (
                    <div key={type} className="px-2 py-1">
                      <div className="flex items-center gap-2 px-2 py-1.5">
                        <div className={cn("h-1 w-1 rounded-full bg-gradient-to-r", config.gradient)} />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                          {categoryLabels[type] || type}
                        </span>
                      </div>
                      
                      <div className="space-y-0.5">
                        {results.slice(0, 5).map((result) => {
                          itemIndex++
                          const currentIndex = itemIndex
                          const isSelected = selectedIndex === currentIndex
                          
                          return (
                            <button
                              key={result.id}
                              data-index={currentIndex}
                              onClick={() => runCommand(() => router.push(result.url))}
                              onMouseEnter={() => setSelectedIndex(currentIndex)}
                              className={cn(
                                "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                                isSelected 
                                  ? "bg-primary/10 shadow-sm" 
                                  : "hover:bg-muted/50"
                              )}
                            >
                              <div className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
                                isSelected ? `bg-gradient-to-br ${config.gradient} text-white shadow-md` : `${config.bgLight} ${config.bgDark}`
                              )}>
                                <IconComponent className={cn("h-4 w-4", !isSelected && "text-muted-foreground")} />
                              </div>
                              
                              <div className="min-w-0 flex-1">
                                <p className={cn(
                                  "truncate font-medium",
                                  isSelected ? "text-foreground" : "text-foreground/80"
                                )}>
                                  {result.title}
                                </p>
                                {result.description && (
                                  <p className="truncate text-xs text-muted-foreground">
                                    {result.description}
                                  </p>
                                )}
                                {result.meta?.journeyTitle && (
                                  <p className="truncate text-[10px] text-muted-foreground/60">
                                    {t("spotlight.inJourney")} {result.meta.journeyTitle as string}
                                  </p>
                                )}
                              </div>
                              
                              {result.meta?.severity && (
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "h-5 rounded-md text-[10px]",
                                    result.meta.severity === "critical" && "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/50 dark:text-red-400",
                                    result.meta.severity === "major" && "border-orange-200 bg-orange-50 text-orange-600 dark:border-orange-800 dark:bg-orange-950/50 dark:text-orange-400",
                                    result.meta.severity === "minor" && "border-yellow-200 bg-yellow-50 text-yellow-600 dark:border-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-400",
                                  )}
                                >
                                  {result.meta.severity as string}
                                </Badge>
                              )}
                              
                              <ChevronRight className={cn(
                                "h-4 w-4 shrink-0 transition-all",
                                isSelected ? "text-primary opacity-100 translate-x-0" : "text-muted-foreground opacity-0 -translate-x-1"
                              )} />
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* Quick Actions & Pages (Default State) */}
            {!showSearchResults && (
              <div className="py-2">
                {/* Quick Actions */}
                {filteredActions.length > 0 && (
                  <div className="px-2 py-1">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {t("spotlight.quickActions")}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 px-1">
                      {filteredActions.map((action) => {
                        itemIndex++
                        const currentIndex = itemIndex
                        const isSelected = selectedIndex === currentIndex
                        
                        return (
                          <button
                            key={action.action}
                            data-index={currentIndex}
                            onClick={() => {
                              if (action.action === "create-journey") runCommand(() => router.push("/journeys?create=true"))
                              else if (action.action === "create-archetype") runCommand(() => router.push("/archetypes?create=true"))
                              else if (action.action === "create-solution") runCommand(() => router.push("/solutions?create=true"))
                            }}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={cn(
                              "group flex flex-col items-center gap-2 rounded-xl p-4 text-center transition-all",
                              isSelected 
                                ? "bg-primary/10 shadow-sm" 
                                : "bg-muted/30 hover:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl transition-all",
                              isSelected 
                                ? `bg-gradient-to-br ${action.color === "emerald" ? "from-emerald-500 to-teal-500" : action.color === "violet" ? "from-violet-500 to-purple-500" : "from-amber-500 to-orange-500"} text-white shadow-md` 
                                : "bg-background shadow-sm"
                            )}>
                              <Plus className={cn("h-5 w-5", !isSelected && "text-muted-foreground")} />
                            </div>
                            <span className={cn(
                              "text-xs font-medium",
                              isSelected ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {action.name}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Recent / Pages */}
                {filteredPages.length > 0 && (
                  <div className="px-2 py-1 mt-2">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                        {t("spotlight.pages")}
                      </span>
                    </div>
                    
                    <div className="space-y-0.5">
                      {filteredPages.map((page) => {
                        itemIndex++
                        const currentIndex = itemIndex
                        const isSelected = selectedIndex === currentIndex
                        
                        return (
                          <button
                            key={page.href}
                            data-index={currentIndex}
                            onClick={() => runCommand(() => router.push(page.href))}
                            onMouseEnter={() => setSelectedIndex(currentIndex)}
                            className={cn(
                              "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all",
                              isSelected 
                                ? "bg-primary/10 shadow-sm" 
                                : "hover:bg-muted/50"
                            )}
                          >
                            <div className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all",
                              isSelected 
                                ? "bg-primary text-primary-foreground shadow-md" 
                                : "bg-muted/50"
                            )}>
                              <page.icon className={cn("h-4 w-4", !isSelected && "text-muted-foreground")} />
                            </div>
                            
                            <div className="min-w-0 flex-1">
                              <p className={cn(
                                "font-medium",
                                isSelected ? "text-foreground" : "text-foreground/80"
                              )}>
                                {page.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {page.description}
                              </p>
                            </div>
                            
                            <ChevronRight className={cn(
                              "h-4 w-4 shrink-0 transition-all",
                              isSelected ? "text-primary opacity-100 translate-x-0" : "text-muted-foreground opacity-0 -translate-x-1"
                            )} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Pro tips */}
                <div className="mx-4 mt-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                      <TrendingUp className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-foreground">{t("spotlight.proTip")}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {t("spotlight.proTipDesc")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-border/50 bg-muted/20 px-4 py-2.5">
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <kbd className="flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-background text-[10px] shadow-sm">
                  <ArrowRight className="h-2.5 w-2.5 -rotate-90" />
                </kbd>
                <kbd className="flex h-5 w-5 items-center justify-center rounded border border-border/50 bg-background text-[10px] shadow-sm">
                  <ArrowRight className="h-2.5 w-2.5 rotate-90" />
                </kbd>
                <span>{t("spotlight.navigate")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="flex h-5 items-center justify-center rounded border border-border/50 bg-background px-1.5 text-[10px] shadow-sm">
                  <CornerDownLeft className="h-2.5 w-2.5" />
                </kbd>
                <span>{t("spotlight.select")}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <kbd className="flex h-5 items-center justify-center rounded border border-border/50 bg-background px-1.5 text-[10px] shadow-sm">
                  esc
                </kbd>
                <span>{t("common.close")}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
              <Sparkles className="h-3 w-3" />
              <span>{t("spotlight.poweredByAi")}</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
