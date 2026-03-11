"use client"

import { useState } from "react"
import Link from "next/link"
import { BrainstormArchetypesDialog } from "@/components/brainstorm-archetypes-dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Search,
  Target,
  Frown,
  Eye,
  Users,
  ExternalLink,
  Filter,
  Lightbulb,
  Upload,
  Sparkles,
  Globe,
  Crown,
  User,
  Trash2,
  ChevronDown,
  Zap,
  ShieldCheck,
  Link2,
  Activity,
  MoreHorizontal,
  GlobeIcon,
  type LucideIcon,
} from "lucide-react"
import { INDUSTRIES, industryLabels } from "@/lib/industries"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts"
import { useArchetypes } from "@/hooks/use-archetypes"
import { useJourneys } from "@/hooks/use-journeys"
import { ArchetypeImportDialog } from "@/components/archetype-import-dialog"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import type { Archetype, ArchetypeCategory } from "@/lib/types"
import { cn } from "@/lib/utils"

// Use shared INDUSTRIES from lib/industries.ts
const CATEGORIES = INDUSTRIES

const categoryLabels = industryLabels

const categoryColors: Record<string, string> = {
  "e-commerce": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  banking: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800",
  healthcare: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800",
  saas: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
  real_estate: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  insurance: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800",
  hospitality: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  telecommunications: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
  wealth_management: "bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-800",
  fintech: "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800",
  retail: "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-800",
  luxury: "bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  grocery: "bg-lime-100 text-lime-700 border-lime-200 dark:bg-lime-900/30 dark:text-lime-300 dark:border-lime-800",
  property_management: "bg-stone-100 text-stone-700 border-stone-200 dark:bg-stone-900/30 dark:text-stone-300 dark:border-stone-800",
  pharma: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 dark:bg-fuchsia-900/30 dark:text-fuchsia-300 dark:border-fuchsia-800",
  fitness: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  media: "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  travel: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800",
  airlines: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
  automotive: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/30 dark:text-slate-300 dark:border-slate-800",
  logistics: "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-300 dark:border-zinc-800",
  education: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
  government: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800",
  utilities: "bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-900/30 dark:text-neutral-300 dark:border-neutral-800",
}

const categoryIcons: Record<string, string> = {
  "e-commerce": "bg-blue-500",
  banking: "bg-emerald-500",
  healthcare: "bg-rose-500",
  saas: "bg-violet-500",
  real_estate: "bg-amber-500",
  insurance: "bg-sky-500",
  hospitality: "bg-orange-500",
  telecommunications: "bg-teal-500",
  wealth_management: "bg-indigo-500",
  fintech: "bg-cyan-500",
  retail: "bg-pink-500",
  luxury: "bg-yellow-500",
  grocery: "bg-lime-500",
  property_management: "bg-stone-500",
  pharma: "bg-fuchsia-500",
  fitness: "bg-green-500",
  media: "bg-red-500",
  travel: "bg-purple-500",
  airlines: "bg-blue-500",
  automotive: "bg-slate-500",
  logistics: "bg-zinc-500",
  education: "bg-amber-500",
  government: "bg-gray-500",
  utilities: "bg-neutral-500",
}

import { getInitials } from "@/lib/utils"

/* ── Pillar dot scale ── */
function PillarDotScale({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-[3px]">
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-colors",
            i < score ? "bg-primary" : "bg-muted-foreground/15"
          )}
        />
      ))}
    </div>
  )
}

/* ── Pillar rating section with Higher / Basic Order groups ── */
function PillarRatingsSection({ archetype }: { archetype: Archetype }) {
  const higherOrder = archetype.pillarRatings.filter((p) => p.group === "higher_order")
  const basicOrder = archetype.pillarRatings.filter((p) => p.group === "basic_order")

  return (
    <div className="flex flex-col gap-4">
      {higherOrder.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Higher Order</p>
          <div className="flex flex-col gap-2">
            {higherOrder.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground w-28 shrink-0">{p.name}</span>
                <PillarDotScale score={p.score} />
                <span className="text-[10px] font-semibold text-foreground w-5 text-right">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {basicOrder.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Basic Order</p>
          <div className="flex flex-col gap-2">
            {basicOrder.map((p) => (
              <div key={p.name} className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-foreground w-28 shrink-0">{p.name}</span>
                <PillarDotScale score={p.score} />
                <span className="text-[10px] font-semibold text-foreground w-5 text-right">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Radar chart ── */
function ArchetypeRadarChart({ chart }: { chart: Archetype["radarCharts"][number] }) {
  const data = chart.dimensions.map((d) => ({
    axis: d.axis,
    value: d.value,
    fullMark: 100,
  }))

  return (
    <div className="flex flex-col items-center gap-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{chart.label}</p>
      <ResponsiveContainer width="100%" height={180}>
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="var(--color-border)" strokeDasharray="3 3" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fontSize: 9, fill: "var(--color-muted-foreground)" }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <Radar
            name={chart.label}
            dataKey="value"
            stroke="var(--color-primary)"
            fill="var(--color-primary)"
            fillOpacity={0.15}
            strokeWidth={1.5}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function ArchetypesPage() {
  const { archetypes: allArchetypes, isLoading, mutate } = useArchetypes()
  const { journeys: allJourneys } = useJourneys()

  function getJourneysForArchetype(archetypeId: string) {
    return allJourneys.filter((j) => j.archetypes.some((a) => a.id === archetypeId))
  }

  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false)
  const [peekArchetype, setPeekArchetype] = useState<Archetype | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [visibilityTab, setVisibilityTab] = useState<"my" | "public" | "studio">("my")
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  // Filter archetypes by visibility tab
  const myArchetypes = allArchetypes.filter(a => a.visibility === "private" || !a.visibility)
  const publicArchetypes = allArchetypes.filter(a => a.visibility === "public")
  const studioArchetypes = allArchetypes.filter(a => a.visibility === "studio")

  // Get base archetypes based on visibility tab
  const baseArchetypes = visibilityTab === "my" ? myArchetypes 
    : visibilityTab === "public" ? publicArchetypes 
    : studioArchetypes
  
  // Delete archetype handler
  async function handleDeleteArchetype(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/archetypes/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Failed to delete")
      toast.success("Archetype deleted")
      mutate()
    } catch {
      toast.error("Failed to delete archetype")
    } finally {
      setDeletingId(null)
    }
  }
  
  // Toggle visibility handler
  async function handleToggleVisibility(archetype: Archetype) {
    const newVisibility = archetype.visibility === "public" ? "private" : "public"
    try {
      const res = await fetch(`/api/archetypes/${archetype.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visibility: newVisibility }),
      })
      if (!res.ok) throw new Error("Failed to update")
      toast.success(newVisibility === "public" ? "Archetype is now public" : "Archetype is now private")
      mutate()
    } catch {
      toast.error("Failed to update visibility")
    }
  }
    
  const filtered = baseArchetypes.filter((a) => {
    const matchesSearch =
      search === "" ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.role.toLowerCase().includes(search.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
    const matchesCategory = selectedCategory === "all" || a.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
      <Toaster />
      <ArchetypeImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImportComplete={(archetype) => {
          toast.success(`Archetype "${archetype.name}" imported successfully`, {
            description: `${archetype.goals.length} goals, ${archetype.pillarRatings.length} pillar ratings, ${archetype.solutionPrinciples.length} solution principles extracted and enriched.`,
          })
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Archetypes</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Define and manage customer archetypes used across your journeys.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setImportOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Import
          </Button>
          <BrainstormArchetypesDialog onArchetypesCreated={() => mutate()}>
            <Button size="sm" className="gap-1.5">
              <Sparkles className="h-3.5 w-3.5" />
              Brainstorm Archetypes
            </Button>
          </BrainstormArchetypesDialog>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search archetypes..."
            className="h-8 pl-8 text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Popover open={categoryDropdownOpen} onOpenChange={setCategoryDropdownOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-52 justify-between text-xs">
                  <span className="flex items-center gap-2">
                    {selectedCategory !== "all" && (() => {
                      const cat = CATEGORIES.find(c => c.value === selectedCategory)
                      if (cat) {
                        const Icon = cat.icon
                        return <Icon className="h-3.5 w-3.5" />
                      }
                      return null
                    })()}
                    {selectedCategory === "all" ? `All Categories (${allArchetypes.length})` : (categoryLabels[selectedCategory] || selectedCategory)}
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="flex gap-4">
                  {(() => {
                    const allItems = [
                      { value: "all", label: "All", icon: null as LucideIcon | null, count: allArchetypes.length },
                      ...CATEGORIES.map(cat => ({
                        value: cat.value,
                        label: cat.label,
                        icon: cat.icon as LucideIcon | null,
                        count: allArchetypes.filter(a => a.category === cat.value).length
                      }))
                    ]
                    const columns: typeof allItems[] = []
                    for (let i = 0; i < allItems.length; i += 8) {
                      columns.push(allItems.slice(i, i + 8))
                    }
                    return columns.map((col, colIdx) => (
                      <div key={colIdx} className="flex flex-col gap-0.5">
                        {col.map(item => {
                          const Icon = item.icon
                          return (
                            <button
                              key={item.value}
                              onClick={() => { setSelectedCategory(item.value); setCategoryDropdownOpen(false) }}
                              className={cn(
                                "flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
                                selectedCategory === item.value
                                  ? "bg-primary text-primary-foreground"
                                  : "hover:bg-muted"
                              )}
                            >
                              {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
                              {item.label}{item.count > 0 ? ` (${item.count})` : ""}
                            </button>
                          )
                        })}
                      </div>
                    ))
                  })()}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Visibility Tabs */}
      <div className="mt-6">
        <Tabs value={visibilityTab} onValueChange={(v) => setVisibilityTab(v as typeof visibilityTab)}>
          <TabsList className="h-auto p-1 w-fit">
            <TabsTrigger value="my" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
              <User className="h-3.5 w-3.5" />
              <span>My Archetypes</span>
              <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{myArchetypes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
              <Globe className="h-3.5 w-3.5" />
              <span>Public</span>
              <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{publicArchetypes.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="studio" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
              <Crown className="h-3.5 w-3.5" />
              <span>Studio</span>
              <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{studioArchetypes.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <p className="text-xs text-muted-foreground mt-3">
            {visibilityTab === "my" && "Archetypes you've created or imported for your organization."}
            {visibilityTab === "public" && "Community archetypes shared by other users."}
            {visibilityTab === "studio" && "Premium archetypes curated by the Journey Studio team."}
          </p>
        </Tabs>
      </div>

      {/* Grid */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((archetype) => {
          const relatedJourneys = getJourneysForArchetype(archetype.id)
          const higherOrder = archetype.pillarRatings.filter((p) => p.group === "higher_order")
          const basicOrder = archetype.pillarRatings.filter((p) => p.group === "basic_order")

          return (
            <Card
              key={archetype.id}
              className="group border-border/60 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5"
            >
              <CardContent className="flex flex-col gap-3 p-5">
                {/* Header with avatar */}
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                      {getInitials(archetype.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <Link href={`/archetypes/${archetype.id}`}>
                      <h3 className="text-sm font-semibold text-foreground line-clamp-1 hover:text-primary transition-colors cursor-pointer">
                        {archetype.name}
                      </h3>
                    </Link>
                    <p className="text-xs text-muted-foreground">{archetype.role}</p>
                    {archetype.subtitle && (
                      <p className="text-[10px] text-muted-foreground/70 italic mt-0.5 line-clamp-1">{archetype.subtitle}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {archetype.visibility === "public" && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center justify-center h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                              <GlobeIcon className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="text-xs">Public archetype</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <Badge variant="outline" className={cn("text-[9px] font-medium", categoryColors[archetype.category] || "bg-gray-100 text-gray-700")}>
                      {categoryLabels[archetype.category] || archetype.category}
                    </Badge>
                  </div>
                </div>

                <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
                  {archetype.description}
                </p>

                {/* All 10 pillars in two columns */}
                {archetype.pillarRatings.length > 0 && (
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">Higher Order</p>
                      {higherOrder.map((p) => (
                        <div key={p.name} className="flex items-center justify-between gap-1">
                          <span className="text-[9px] text-muted-foreground truncate flex-1">{p.name}</span>
                          <div className="flex items-center gap-[1px]">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div key={i} className={cn("h-1 w-1 rounded-full", i < p.score ? "bg-primary" : "bg-muted-foreground/15")} />
                            ))}
                          </div>
                          <span className="text-[8px] font-medium text-foreground w-2 text-right">{p.score}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-0.5">Basic Order</p>
                      {basicOrder.map((p) => (
                        <div key={p.name} className="flex items-center justify-between gap-1">
                          <span className="text-[9px] text-muted-foreground truncate flex-1">{p.name}</span>
                          <div className="flex items-center gap-[1px]">
                            {Array.from({ length: 10 }, (_, i) => (
                              <div key={i} className={cn("h-1 w-1 rounded-full", i < p.score ? "bg-primary" : "bg-muted-foreground/15")} />
                            ))}
                          </div>
                          <span className="text-[8px] font-medium text-foreground w-2 text-right">{p.score}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-muted-foreground flex-wrap">
                  <span className="flex items-center gap-1"><Target className="h-3 w-3" />{archetype.goals.length} goals</span>
                  <span className="flex items-center gap-1"><Frown className="h-3 w-3" />{archetype.frustrations.length} pain pts</span>
                  <span className="flex items-center gap-1"><Lightbulb className="h-3 w-3" />{archetype.solutionPrinciples.length} principles</span>
                </div>

                <div className="flex flex-wrap gap-1">
                  {archetype.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[9px]">{tag}</Badge>
                  ))}
                  {archetype.tags.length > 4 && (
                    <Badge variant="secondary" className="text-[9px]">+{archetype.tags.length - 4}</Badge>
                  )}
                </div>

                <div className="flex items-center justify-between border-t border-border/50 pt-2">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {relatedJourneys.length} {relatedJourneys.length === 1 ? "journey" : "journeys"}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* 3-dot menu */}
                    <AlertDialog>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem 
                            className="flex items-center justify-between cursor-pointer"
                            onSelect={(e) => {
                              e.preventDefault()
                              handleToggleVisibility(archetype)
                            }}
                          >
                            <span className="flex items-center gap-2">
                              <GlobeIcon className="h-3.5 w-3.5" />
                              {archetype.visibility === "public" ? "Make private" : "Make public"}
                            </span>
                            <Switch 
                              checked={archetype.visibility === "public"} 
                              className="scale-75 pointer-events-none"
                            />
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer">
                              <Trash2 className="h-3.5 w-3.5 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Archetype</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete &quot;{archetype.name}&quot;? This action cannot be undone and will remove the archetype from all journeys.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => handleDeleteArchetype(archetype.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    {/* Quick view button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPeekArchetype(archetype)}>
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Quick View</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    {/* Full profile button */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/archetypes/${archetype.id}`}>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">Full Profile</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="mt-12 flex flex-col items-center gap-2 text-center">
          <Users className="h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No archetypes match your filters.</p>
        </div>
      )}

      {/* ──────────────── Quick View Sheet ──────────────── */}
      <Sheet open={!!peekArchetype} onOpenChange={(open) => !open && setPeekArchetype(null)}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg overflow-hidden">
          {peekArchetype && (() => {
            const relatedJourneys = getJourneysForArchetype(peekArchetype.id)
            return (
              <>
                {/* Header */}
                <div className="flex flex-col gap-4 border-b border-border px-5 pb-4 pt-6">
                  <SheetHeader className="space-y-0 text-left">
                    <Badge variant="outline" className={cn("w-fit text-[10px] font-medium mb-2", categoryColors[peekArchetype.category])}>
                      {categoryLabels[peekArchetype.category]}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-11 w-11 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                          {getInitials(peekArchetype.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <SheetTitle className="text-base leading-tight">{peekArchetype.name}</SheetTitle>
                        <SheetDescription className="text-xs">{peekArchetype.role}</SheetDescription>
                        {peekArchetype.subtitle && (
                          <p className="text-[10px] text-muted-foreground/70 italic">{peekArchetype.subtitle}</p>
                        )}
                      </div>
                    </div>
                  </SheetHeader>

                  {/* Stats row */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: "Goals", value: peekArchetype.goals.length, icon: Target },
                      { label: "Pain Pts", value: peekArchetype.frustrations.length, icon: Frown },
                      { label: "Behaviors", value: peekArchetype.behaviors.length, icon: Activity },
                      { label: "Journeys", value: relatedJourneys.length, icon: Users },
                    ].map((stat) => (
                      <div key={stat.label} className="flex flex-col items-center gap-0.5 rounded-md bg-muted/50 px-2 py-2">
                        <stat.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm font-bold text-foreground">{stat.value}</span>
                        <span className="text-[9px] text-muted-foreground">{stat.label}</span>
                      </div>
                    ))}
                  </div>
                  {peekArchetype.valueMetric && peekArchetype.valueMetric !== "N/A" && (
                    <div className="flex items-center gap-6 text-[11px] text-muted-foreground">
                      <span>Value: <span className="font-semibold text-foreground">{peekArchetype.valueMetric}</span></span>
                      <span>Base: <span className="font-semibold text-foreground">{peekArchetype.basePercentage}</span></span>
                    </div>
                  )}
                </div>

                {/* Scrollable content */}
                <div className="flex flex-1 flex-col overflow-y-auto">
                  {/* Narratives */}
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">I am (Description)</h4>
                    <p className="text-xs leading-relaxed text-foreground">{peekArchetype.description}</p>
                  </div>
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">I want (Goals)</h4>
                    <p className="text-xs leading-relaxed text-foreground">{peekArchetype.goalsNarrative}</p>
                  </div>
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">I do (Needs)</h4>
                    <p className="text-xs leading-relaxed text-foreground">{peekArchetype.needsNarrative}</p>
                  </div>
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">I use (Touchpoints)</h4>
                    <p className="text-xs leading-relaxed text-foreground">{peekArchetype.touchpointsNarrative}</p>
                  </div>

                  {/* Radar Charts */}
                  {peekArchetype.radarCharts.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Radar Charts</h4>
                      <div className={cn("grid gap-3", peekArchetype.radarCharts.length > 1 ? "grid-cols-2" : "grid-cols-1")}>
                        {peekArchetype.radarCharts.map((chart, i) => (
                          <ArchetypeRadarChart key={i} chart={chart} />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 10 CX Pillar Ratings -- grouped */}
                  {peekArchetype.pillarRatings.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-3 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" /> 10 CX Pillar Ratings
                      </h4>
                      <PillarRatingsSection archetype={peekArchetype} />
                    </div>
                  )}

                  {/* Expectations */}
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Target className="h-3 w-3" /> Expectations
                    </h4>
                    <div className="flex flex-col gap-1">
                      {peekArchetype.expectations.map((e, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md bg-blue-50/50 px-3 py-1.5 dark:bg-blue-900/10">
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-blue-500 shrink-0" />
                          <span className="text-xs text-foreground">{e}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Barriers */}
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Frown className="h-3 w-3" /> Barriers
                    </h4>
                    <div className="flex flex-col gap-1">
                      {peekArchetype.barriers.map((b, i) => (
                        <div key={i} className="flex items-start gap-2 rounded-md bg-red-50/50 px-3 py-1.5 dark:bg-red-900/10">
                          <span className="mt-0.5 h-1 w-1 rounded-full bg-red-500 shrink-0" />
                          <span className="text-xs text-foreground">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Solution Principles */}
                  <div className="border-b border-border/50 px-5 py-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Lightbulb className="h-3 w-3" /> Solution Principles
                    </h4>
                    <div className="flex flex-col gap-2">
                      {peekArchetype.solutionPrinciples.map((sp, i) => (
                        <div key={i} className="flex items-start gap-2.5 rounded-md bg-primary/5 px-3 py-2 dark:bg-primary/10">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-xs leading-relaxed text-foreground">{sp}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Drivers */}
                  {peekArchetype.drivers.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <Zap className="h-3 w-3" /> Drivers
                      </h4>
                      <div className="flex flex-col gap-1">
                        {peekArchetype.drivers.map((d, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md bg-emerald-50/50 px-3 py-1.5 dark:bg-emerald-900/10">
                            <span className="mt-0.5 h-1 w-1 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-xs text-foreground">{d}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Important Steps */}
                  {peekArchetype.importantSteps.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <Activity className="h-3 w-3" /> Important Steps
                      </h4>
                      <div className="flex flex-col gap-1">
                        {peekArchetype.importantSteps.map((s, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-1.5">
                            <span className="mt-0.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                            <span className="text-xs text-foreground">{s}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Triggers */}
                  {peekArchetype.triggers.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <Zap className="h-3 w-3" /> Triggers
                      </h4>
                      <div className="flex flex-col gap-1">
                        {peekArchetype.triggers.map((t, i) => (
                          <div key={i} className="flex items-start gap-2 rounded-md bg-amber-50/50 px-3 py-1.5 dark:bg-amber-900/10">
                            <span className="mt-0.5 h-1 w-1 rounded-full bg-amber-500 shrink-0" />
                            <span className="text-xs text-foreground">{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mindset */}
                  {peekArchetype.mindset.length > 0 && (
                    <div className="border-b border-border/50 px-5 py-4">
                      <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        <ShieldCheck className="h-3 w-3" /> Mindset
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {peekArchetype.mindset.map((m, i) => (
                          <Badge key={i} variant="secondary" className="text-[10px]">{m}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Journeys */}
                  <div className="px-5 py-4">
                    <h4 className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                      <Link2 className="h-3 w-3" /> Linked Journeys
                    </h4>
                    {relatedJourneys.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">Not linked to any journeys yet.</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {relatedJourneys.map((j) => (
                          <div key={j.id} className="flex items-center gap-2 rounded-md border border-border/60 bg-card px-3 py-2.5">
                            <Badge variant="outline" className="text-[9px] capitalize shrink-0">{j.type}</Badge>
                            <span className="text-xs font-medium text-foreground truncate flex-1">{j.title}</span>
                            <Badge variant="secondary" className="text-[9px] capitalize shrink-0">{j.status.replace("_", " ")}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex gap-2 border-t border-border px-5 py-4">
                  <Link href={`/archetypes/${peekArchetype.id}`} className="flex-1">
                    <Button className="w-full gap-2" size="sm">
                      <ExternalLink className="h-3.5 w-3.5" />
                      View Full Profile
                    </Button>
                  </Link>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
