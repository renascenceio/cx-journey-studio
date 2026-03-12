"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
  Brain,
  Repeat,
  Factory,
  Cpu,
  UsersRound,
  Leaf,
  Search,
  Sparkles,
  ThumbsUp,
  Bookmark,
  BookmarkCheck,
  ArrowUpDown,
  Send,
  Globe,
  Target,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { useRouter } from "next/navigation"
import { deleteSolution, updateSolution } from "@/lib/actions/data"
import { Pencil, Trash2, MoreVertical, Loader2, User, Crown } from "lucide-react"
import type { SolutionCategory, Solution, Journey } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ApplySolutionDialog } from "@/components/apply-solution-dialog"
import { INDUSTRIES, formatIndustry, getIndustryIcon } from "@/lib/industries"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Check, ChevronDown } from "lucide-react"

const categories: { value: SolutionCategory | "all"; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "all", label: "All Types", icon: Globe },
  { value: "behavioral", label: "Behavioral", icon: Brain },
  { value: "rituals", label: "Rituals", icon: Repeat },
  { value: "industrial", label: "Industrial", icon: Factory },
  { value: "technological", label: "Technological", icon: Cpu },
  { value: "social", label: "Social", icon: UsersRound },
  { value: "environmental", label: "Environmental", icon: Leaf },
]

function getCategoryIcon(category: SolutionCategory) {
  switch (category) {
    case "behavioral": return Brain
    case "rituals": return Repeat
    case "industrial": return Factory
    case "technological": return Cpu
    case "social": return UsersRound
    case "environmental": return Leaf
    case "archetype": return Target
    default: return Brain
  }
}

function getCategoryColor(category: SolutionCategory) {
  switch (category) {
    case "behavioral": return "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
    case "rituals": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
    case "industrial": return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
    case "technological": return "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
    case "social": return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
    case "environmental": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
    case "archetype": return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
    default: return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
  }
}

type SortMode = "relevance" | "upvotes" | "newest"

function SolutionCard({ solution, futureJourneys, showActions, onDeleted }: {
  solution: Solution
  futureJourneys: Journey[]
  showActions?: boolean
  onDeleted?: (id: string) => void
}) {
  const t = useTranslations()
  const router = useRouter()
  const [upvoted, setUpvoted] = useState(false)
  const [saved, setSaved] = useState(solution.saved)
  const [upvoteCount, setUpvoteCount] = useState(solution.upvotes)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editTitle, setEditTitle] = useState(solution.title)
  const [editDesc, setEditDesc] = useState(solution.description)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [applyOpen, setApplyOpen] = useState(false)
  const Icon = getCategoryIcon(solution.category)

  return (
    <Card className="group relative flex flex-col transition-shadow hover:shadow-md">
      {showActions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="absolute right-2 top-2 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="h-3.5 w-3.5" />
              <span className="sr-only">Solution actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setEditTitle(solution.title); setEditDesc(solution.description); setEditOpen(true) }}>
              <Pencil className="mr-2 h-3.5 w-3.5" />Edit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <CardHeader className="flex-row items-start gap-3 pb-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${getCategoryColor(solution.category)}`}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-sm font-semibold leading-tight text-foreground pr-8">{solution.title}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="secondary" className="text-[10px] font-normal capitalize">
              {solution.category}
            </Badge>
            {solution.industry && (
              <Badge variant="outline" className="text-[10px] font-normal">
                {formatIndustry(solution.industry)}
              </Badge>
            )}
            {solution.impact && (
              <Badge variant="outline" className={cn("text-[10px] font-normal", 
                solution.impact === "high" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" :
                solution.impact === "medium" ? "border-amber-500 text-amber-600 dark:text-amber-400" :
                "border-slate-400 text-slate-500"
              )}>
                {solution.impact} impact
              </Badge>
            )}
            {solution.effort && (
              <Badge variant="outline" className={cn("text-[10px] font-normal", 
                solution.effort === "low" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" :
                solution.effort === "medium" ? "border-amber-500 text-amber-600 dark:text-amber-400" :
                "border-red-500 text-red-500"
              )}>
                {solution.effort} effort
              </Badge>
            )}
            {solution.isCrowd && (
              <Badge variant="outline" className="text-[10px] font-normal">
                Community
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-3 pt-0">
        <p className="text-xs leading-relaxed text-muted-foreground">{solution.description}</p>

        {solution.isCrowd && solution.contributorOrg && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <UsersRound className="h-3 w-3" />
            <span>{solution.contributorOrg}</span>
{solution.industry && (
                  <>
                    <span className="text-border">|</span>
                    <span>{formatIndustry(solution.industry)}</span>
                  </>
                )}
          </div>
        )}

        {!solution.isCrowd && (
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <User className="h-3 w-3" />
            <span>
              {solution.creatorName || solution.creatorCompany ? (
                <>
                  {solution.creatorName && <span className="font-medium">{solution.creatorName}</span>}
                  {solution.creatorName && solution.creatorCompany && <span> at </span>}
                  {solution.creatorCompany && <span>{solution.creatorCompany}</span>}
                </>
              ) : solution.source?.startsWith("adapted:") ? (
                "Adapted solution"
              ) : solution.source === "user" ? (
                "User created"
              ) : (
                solution.source || "Platform"
              )}
            </span>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {solution.tags.slice(0, 4).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px] font-normal px-1.5 py-0">
              {tag}
            </Badge>
          ))}
          {solution.tags.length > 4 && (
            <span className="text-[10px] text-muted-foreground">+{solution.tags.length - 4}</span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <Button
              variant={upvoted ? "default" : "ghost"}
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => {
                setUpvoted(!upvoted)
                setUpvoteCount((c) => (upvoted ? c - 1 : c + 1))
              }}
            >
              <ThumbsUp className="h-3 w-3" />
              {upvoteCount}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => {
                setSaved(!saved)
                toast.success(saved ? t("solutions.removedFromSaved") : t("solutions.savedToCollection"))
              }}
            >
              {saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              {saved ? t("solutions.saved") : t("common.save")}
            </Button>
          </div>

          <Button variant="outline" size="sm" className="h-7 gap-1 px-2 text-xs" onClick={() => setApplyOpen(true)}>
            <Send className="h-3 w-3" />
            {t("common.apply")}
          </Button>
        </div>
  </CardContent>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("solutions.editSolution")}</DialogTitle>
            <DialogDescription>{t("solutions.editSolutionDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor={`edit-title-${solution.id}`} className="text-sm">{t("solutions.title")}</Label>
              <Input id={`edit-title-${solution.id}`} value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-9" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor={`edit-desc-${solution.id}`} className="text-sm">{t("solutions.description")}</Label>
              <Textarea id={`edit-desc-${solution.id}`} value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
            <Button
              disabled={!editTitle.trim() || saving}
              onClick={async () => {
                setSaving(true)
                try {
                  await updateSolution(solution.id, { title: editTitle, description: editDesc })
                  toast.success(t("solutions.solutionUpdated"))
                  setEditOpen(false)
                  router.refresh()
                } catch {
                  toast.error(t("solutions.failedToUpdate"))
                } finally {
                  setSaving(false)
                }
              }}
            >
              {saving ? t("common.saving") : t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Apply Solution Dialog */}
      <ApplySolutionDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        solutionId={solution.id}
        solutionTitle={solution.title}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("solutions.deleteSolution")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("solutions.deleteSolutionConfirm", { title: solution.title })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
              onClick={async () => {
                setDeleting(true)
                try {
                  await deleteSolution(solution.id)
                  toast.success(t("solutions.solutionDeleted"))
                  onDeleted?.(solution.id)
                  router.refresh()
                } catch {
                  toast.error(t("solutions.failedToDelete"))
                } finally {
                  setDeleting(false)
                  setDeleteOpen(false)
                }
              }}
            >
              {deleting ? t("common.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  </Card>
  )
  }
  
interface SolutionsClientProps {
  platformSolutions: Solution[]
  crowdSolutions: Solution[]
  mySolutions: Solution[]
  futureJourneys: Journey[]
}

export function SolutionsClient({ platformSolutions, crowdSolutions, mySolutions, futureJourneys }: SolutionsClientProps) {
  const t = useTranslations()
  const [activeCategory, setActiveCategory] = useState<SolutionCategory | "all">("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortMode>("relevance")
  const [aiQuery, setAiQuery] = useState("")
  const [savedOnly, setSavedOnly] = useState(false)
  const [selectedIndustry, setSelectedIndustry] = useState<string>("all")
  const [impactFilter, setImpactFilter] = useState<string>("all")
  const [effortFilter, setEffortFilter] = useState<string>("all")

  // Use shared industries from lib/industries.ts

  function filterAndSort(items: Solution[]) {
    let filtered = items
    if (activeCategory !== "all") {
      filtered = filtered.filter((s) => s.category === activeCategory)
    }
    if (search) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      )
    }
    if (savedOnly) {
      filtered = filtered.filter((s) => s.saved)
    }
    if (selectedIndustry !== "all") {
      filtered = filtered.filter((s) => s.industry === selectedIndustry)
    }
    if (impactFilter !== "all") {
      filtered = filtered.filter((s) => s.impact === impactFilter)
    }
    if (effortFilter !== "all") {
      filtered = filtered.filter((s) => s.effort === effortFilter)
    }
    switch (sort) {
      case "upvotes":
        return [...filtered].sort((a, b) => b.upvotes - a.upvotes)
      case "newest":
        return [...filtered].sort(
          (a, b) =>
            new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
        )
      default:
        return [...filtered].sort((a, b) => b.relevance - a.relevance)
    }
  }

  const platformItems = useMemo(() => filterAndSort(platformSolutions), [activeCategory, search, sort, savedOnly, selectedIndustry, impactFilter, effortFilter, platformSolutions])
  const crowdItems = useMemo(() => filterAndSort(crowdSolutions), [activeCategory, search, sort, savedOnly, selectedIndustry, impactFilter, effortFilter, crowdSolutions])
  const myItems = useMemo(() => filterAndSort(mySolutions), [activeCategory, search, sort, savedOnly, selectedIndustry, impactFilter, effortFilter, mySolutions])

  const [aiSearching, setAiSearching] = useState(false)
  const [aiResults, setAiResults] = useState<Solution[]>([])
  
  async function handleAiSearch() {
    if (!aiQuery.trim()) return
    setAiSearching(true)
    try {
      // Search using the search API
      const res = await fetch(`/api/search?q=${encodeURIComponent(aiQuery)}&limit=30`)
      if (res.ok) {
        const data = await res.json()
        // Filter to only solution results
        const solutionResults = data.results?.filter((r: { type: string }) => r.type === "solution") || []
        if (solutionResults.length > 0) {
          // Map to Solution format - filter from all solutions
          const allSolutions = [...platformSolutions, ...crowdSolutions, ...mySolutions]
          const matchedSolutions = solutionResults
            .map((r: { id: string }) => allSolutions.find(s => s.id === r.id))
            .filter(Boolean) as Solution[]
          setAiResults(matchedSolutions)
          toast.success(`Found ${matchedSolutions.length} matching solution(s)`)
        } else {
          setAiResults([])
          toast.info("No solutions found matching your query", {
            description: "Try different keywords or browse the categories below"
          })
        }
      }
    } catch {
      toast.error("Search failed")
    } finally {
      setAiSearching(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <Toaster />

      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("solutions.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("solutions.subtitle")}
        </p>
      </div>

      {/* AI Search */}
      <Card className="border-dashed">
        <CardContent className="flex items-center gap-3 py-3">
          <Sparkles className="h-5 w-5 shrink-0 text-primary" />
          <Input
            placeholder={t("solutions.aiSearchPlaceholder")}
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAiSearch()}
            className="h-9 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
          <Button
            size="sm"
            className="h-8 shrink-0 gap-1.5"
            onClick={handleAiSearch}
            disabled={!aiQuery.trim() || aiSearching}
          >
            {aiSearching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {aiSearching ? t("solutions.searching") : t("solutions.search")}
          </Button>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="platform" className="flex flex-col gap-4">
        <TabsList className="h-auto p-1 w-fit">
          <TabsTrigger value="platform" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
            <Crown className="h-3.5 w-3.5" />
            <span>{t("templates.studio")}</span>
            <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{platformItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="crowd" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
            <UsersRound className="h-3.5 w-3.5" />
            <span>{t("archetypes.public")}</span>
            <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{crowdItems.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="my" className="gap-2 px-4 py-2 data-[state=active]:bg-background">
            <User className="h-3.5 w-3.5" />
            <span>{t("solutions.mySolutions")}</span>
            <Badge variant="secondary" className="ml-1 text-[9px] px-1.5 h-5">{myItems.length}</Badge>
          </TabsTrigger>
        </TabsList>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("solutions.searchSolutions")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 pl-8 text-xs"
            />
          </div>
<Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 w-36 justify-between text-xs">
              {activeCategory === "all" ? (
                <span className="text-muted-foreground">{t("solutions.allTypes")}</span>
              ) : (
                <span className="flex items-center gap-2">
                  {(() => {
                    const cat = categories.find(c => c.value === activeCategory)
                    const CatIcon = cat?.icon || Globe
                    return <CatIcon className="h-3.5 w-3.5" />
                  })()}
                  {categories.find(c => c.value === activeCategory)?.label}
                </span>
              )}
              <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <Command>
              <CommandInput placeholder="Search types..." className="h-9" />
              <CommandList>
                <CommandEmpty>No type found.</CommandEmpty>
                <CommandGroup className="max-h-64 overflow-auto">
                  {categories.map((cat) => {
                    const CatIcon = cat.icon
                    return (
                      <CommandItem
                        key={cat.value}
                        value={cat.label}
                        onSelect={() => setActiveCategory(cat.value as SolutionCategory | "all")}
                        className="flex items-center gap-2"
                      >
                        <CatIcon className="h-4 w-4 text-muted-foreground" />
                        <span>{cat.label}</span>
                        {activeCategory === cat.value && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                    )
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-44 justify-between text-xs">
                {selectedIndustry === "all" ? (
                  <span className="text-muted-foreground">{t("solutions.allIndustries")}</span>
                ) : (
                  <span className="flex items-center gap-2">
                    {(() => {
                      const Icon = getIndustryIcon(selectedIndustry)
                      return Icon ? <Icon className="h-3.5 w-3.5" /> : null
                    })()}
                    {formatIndustry(selectedIndustry)}
                  </span>
                )}
                <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandInput placeholder="Search industries..." className="h-9" />
                <CommandList>
                  <CommandEmpty>No industry found.</CommandEmpty>
                  <CommandGroup className="max-h-64 overflow-auto">
                    <CommandItem
                      value="all"
                      onSelect={() => setSelectedIndustry("all")}
                      className="flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span>All Industries</span>
                      {selectedIndustry === "all" && <Check className="ml-auto h-4 w-4" />}
                    </CommandItem>
                    {INDUSTRIES.map((ind) => {
                      const IndIcon = ind.icon
                      return (
                        <CommandItem
                          key={ind.value}
                          value={ind.label}
                          onSelect={() => setSelectedIndustry(ind.value)}
                          className="flex items-center gap-2"
                        >
                          <IndIcon className="h-4 w-4 text-muted-foreground" />
                          <span>{ind.label}</span>
                          {selectedIndustry === ind.value && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          <Select value={impactFilter} onValueChange={setImpactFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Impact" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Impact</SelectItem>
              <SelectItem value="high">High Impact</SelectItem>
              <SelectItem value="medium">Medium Impact</SelectItem>
              <SelectItem value="low">Low Impact</SelectItem>
            </SelectContent>
          </Select>
          <Select value={effortFilter} onValueChange={setEffortFilter}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <SelectValue placeholder="Effort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Any Effort</SelectItem>
              <SelectItem value="low">Low Effort</SelectItem>
              <SelectItem value="medium">Medium Effort</SelectItem>
              <SelectItem value="high">High Effort</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => setSort(v as SortMode)}>
            <SelectTrigger className="h-8 w-32 text-xs">
              <ArrowUpDown className="mr-1.5 h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="upvotes">Most Upvoted</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={savedOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setSavedOnly(!savedOnly)}
            className="h-8 gap-1.5 text-xs"
          >
            <Bookmark className="h-3.5 w-3.5" />
            Saved
          </Button>
          {(savedOnly || selectedIndustry !== "all" || impactFilter !== "all" || effortFilter !== "all" || activeCategory !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSavedOnly(false); setSelectedIndustry("all"); setImpactFilter("all"); setEffortFilter("all"); setActiveCategory("all") }}
              className="h-8 text-xs text-primary"
            >
              Clear filters
            </Button>
          )}
        </div>

        {/* AI Search Results */}
        {aiResults.length > 0 && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="py-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">AI Search Results</span>
                  <Badge variant="secondary" className="text-[10px]">{aiResults.length} found</Badge>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setAiResults([])}>
                  Clear Results
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {aiResults.slice(0, 6).map((sol) => (
                  <SolutionCard key={sol.id} solution={sol} futureJourneys={futureJourneys} />
                ))}
              </div>
              {aiResults.length > 6 && (
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Showing 6 of {aiResults.length} results. Refine your search to see more specific matches.
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <TabsContent value="platform" className="mt-0">
          {platformItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Sparkles className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No platform solutions found matching your filters</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {platformItems.map((sol) => (
                <SolutionCard key={sol.id} solution={sol} futureJourneys={futureJourneys} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="crowd" className="mt-0">
          {crowdItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <UsersRound className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No public solutions found matching your filters</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {crowdItems.map((sol) => (
                <SolutionCard key={sol.id} solution={sol} futureJourneys={futureJourneys} showActions />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="my" className="mt-0">
          {myItems.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Bookmark className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">You haven&apos;t created any solutions yet</p>
              <p className="text-xs text-muted-foreground/70">Solutions you create will appear here</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {myItems.map((sol) => (
                <SolutionCard key={sol.id} solution={sol} futureJourneys={futureJourneys} showActions />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
