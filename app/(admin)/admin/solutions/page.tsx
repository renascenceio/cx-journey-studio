"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { 
  Plus, Pencil, Trash2, Search, Lightbulb, ExternalLink, MoreHorizontal,
  LayoutGrid, List, TableIcon, Download, Filter, SortAsc, SortDesc,
  TrendingUp, Users as UsersIcon, Star, Globe, Sparkles, Loader2
} from "lucide-react"
import { INDUSTRIES } from "@/lib/industries"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface SolutionRecord {
  id: string
  title: string
  vendor: string
  description: string
  category: string
  tags: string[]
  relevance: number
  isCrowd: boolean
  isTrend?: boolean
  url: string
  createdAt: string
}

type ViewMode = "grid" | "list" | "table"
type SortField = "title" | "category" | "relevance" | "createdAt" | "vendor"
type SortOrder = "asc" | "desc"

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "analytics", label: "Analytics" },
  { value: "feedback", label: "Feedback" },
  { value: "engagement", label: "Engagement" },
  { value: "personalization", label: "Personalization" },
  { value: "automation", label: "Automation" },
  { value: "cx-strategy", label: "CX Strategy" },
  { value: "journey-mapping", label: "Journey Mapping" },
  { value: "voice-of-customer", label: "Voice of Customer" },
  { value: "other", label: "Other" },
]

export default function AdminSolutionsPage() {
  const { data, isLoading } = useSWR<{ solutions: SolutionRecord[] }>("/api/admin/solutions", fetcher)
  const solutions = data?.solutions || []

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState<"all" | "platform" | "crowd" | "trend">("all")
  const [sortField, setSortField] = useState<SortField>("relevance")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  
  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ 
    title: "", vendor: "", description: "", category: "analytics", 
    tags: "", relevance: "80", isCrowd: false, isTrend: false, url: "" 
  })
  const [saving, setSaving] = useState(false)
  
  // Bulk edit dialog
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkRelevance, setBulkRelevance] = useState("")
  
  // AI Generate dialog
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiDescription, setAiDescription] = useState("")
  const [aiIndustry, setAiIndustry] = useState("any")
  const [aiGenerating, setAiGenerating] = useState(false)

  // Filter and sort
  const filtered = useMemo(() => {
    let result = solutions.filter((s) => {
      const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
        s.vendor.toLowerCase().includes(search.toLowerCase()) ||
        s.description?.toLowerCase().includes(search.toLowerCase()) ||
        s.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchesCategory = categoryFilter === "all" || s.category === categoryFilter
      const matchesType = typeFilter === "all" || 
        (typeFilter === "platform" && !s.isCrowd && !s.isTrend) ||
        (typeFilter === "crowd" && s.isCrowd) ||
        (typeFilter === "trend" && s.isTrend)
      return matchesSearch && matchesCategory && matchesType
    })
    
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "title":
          comparison = a.title.localeCompare(b.title)
          break
        case "vendor":
          comparison = a.vendor.localeCompare(b.vendor)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "relevance":
          comparison = a.relevance - b.relevance
          break
        case "createdAt":
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    return result
  }, [solutions, search, categoryFilter, typeFilter, sortField, sortOrder])

  const allSelected = filtered.length > 0 && filtered.every(s => selectedIds.has(s.id))
  const someSelected = selectedIds.size > 0

  // Stats
  const stats = useMemo(() => ({
    total: solutions.length,
    platform: solutions.filter(s => !s.isCrowd && !s.isTrend).length,
    crowd: solutions.filter(s => s.isCrowd).length,
    trend: solutions.filter(s => s.isTrend).length,
    avgRelevance: Math.round(solutions.reduce((acc, s) => acc + s.relevance, 0) / solutions.length || 0),
  }), [solutions])

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  function toggleSelectAll() {
    if (allSelected) setSelectedIds(new Set())
    else setSelectedIds(new Set(filtered.map(s => s.id)))
  }

  function openCreate() {
    setEditingId(null)
    setForm({ title: "", vendor: "", description: "", category: "analytics", tags: "", relevance: "80", isCrowd: false, isTrend: false, url: "" })
    setDialogOpen(true)
  }

  function openEdit(s: SolutionRecord) {
    setEditingId(s.id)
    setForm({ 
      title: s.title, vendor: s.vendor, description: s.description, category: s.category, 
      tags: s.tags.join(", "), relevance: String(s.relevance), isCrowd: s.isCrowd, 
      isTrend: s.isTrend || false, url: s.url || "" 
    })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const body = {
        title: form.title, vendor: form.vendor, description: form.description, category: form.category,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        relevance: parseInt(form.relevance) || 80, is_crowd: form.isCrowd, is_trend: form.isTrend, url: form.url,
      }
      if (editingId) {
        await fetch(`/api/admin/solutions/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        toast.success("Solution updated")
      } else {
        await fetch("/api/admin/solutions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        toast.success("Solution created")
      }
      mutate("/api/admin/solutions")
      setDialogOpen(false)
    } catch { toast.error("Failed to save") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this solution permanently?")) return
    await fetch(`/api/admin/solutions/${id}`, { method: "DELETE" })
    mutate("/api/admin/solutions")
    setSelectedIds(prev => { const newSet = new Set(prev); newSet.delete(id); return newSet })
    toast.success("Solution deleted")
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected solution(s)?`)) return
    try {
      // Use batch delete endpoint for reliability
      const res = await fetch("/api/admin/solutions/batch-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      })
      if (!res.ok) throw new Error("Batch delete failed")
      mutate("/api/admin/solutions")
      setSelectedIds(new Set())
      toast.success(`${selectedIds.size} solutions deleted`)
    } catch (error) {
      toast.error("Failed to delete solutions")
    }
  }

  async function handleBulkEdit() {
    if (selectedIds.size === 0) return
    for (const id of selectedIds) {
      const body: Record<string, unknown> = {}
      if (bulkCategory) body.category = bulkCategory
      if (bulkRelevance) body.relevance = parseInt(bulkRelevance)
      if (Object.keys(body).length > 0) {
        await fetch(`/api/admin/solutions/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      }
    }
    mutate("/api/admin/solutions")
    setBulkEditOpen(false)
    setBulkCategory("")
    setBulkRelevance("")
    setSelectedIds(new Set())
    toast.success(`${selectedIds.size} solutions updated`)
  }

  async function handleAIGenerate() {
    if (!aiDescription.trim()) {
      toast.error("Please enter a description")
      return
    }
    setAiGenerating(true)
    try {
      const res = await fetch("/api/admin/solutions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: aiDescription,
          industry: aiIndustry === "any" ? null : aiIndustry
        })
      })
      if (!res.ok) throw new Error("Generation failed")
      const result = await res.json()
      mutate("/api/admin/solutions")
      setAiDialogOpen(false)
      setAiDescription("")
      setAiIndustry("any")
      toast.success(`Generated solution: ${result.title || "New solution"}`)
    } catch (error) {
      toast.error("Failed to generate solution")
    } finally {
      setAiGenerating(false)
    }
  }

  function exportSolutions() {
    const toExport = selectedIds.size > 0 ? solutions.filter(s => selectedIds.has(s.id)) : solutions
    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `solutions-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    toast.success(`Exported ${toExport.length} solutions`)
  }

  function getTypeIcon(s: SolutionRecord) {
    if (s.isTrend) return <TrendingUp className="h-4 w-4 text-orange-500" />
    if (s.isCrowd) return <UsersIcon className="h-4 w-4 text-purple-500" />
    return <Globe className="h-4 w-4 text-blue-500" />
  }

  function getTypeBadge(s: SolutionRecord) {
    if (s.isTrend) return <Badge className="text-[10px] bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Trend</Badge>
    if (s.isCrowd) return <Badge className="text-[10px] bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Crowd</Badge>
    return <Badge variant="secondary" className="text-[10px]">Platform</Badge>
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Solutions Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage {stats.total} solutions across all categories
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportSolutions}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
<Button variant="outline" onClick={() => setAiDialogOpen(true)} className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Generate
              </Button>
              <Button onClick={openCreate} className="gap-1.5">
                <Plus className="h-4 w-4" />
                Add Solution
              </Button>
            </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.platform}</p>
              <p className="text-xs text-muted-foreground">Platform Solutions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <UsersIcon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.crowd}</p>
              <p className="text-xs text-muted-foreground">Crowd-sourced</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.trend}</p>
              <p className="text-xs text-muted-foreground">Trends</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Star className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.avgRelevance}%</p>
              <p className="text-xs text-muted-foreground">Avg Relevance</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search solutions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[160px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as typeof typeFilter)}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="platform">Platform</SelectItem>
              <SelectItem value="crowd">Crowd</SelectItem>
              <SelectItem value="trend">Trends</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-1.5" /> : <SortDesc className="h-4 w-4 mr-1.5" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortField("relevance"); setSortOrder("desc") }}>Highest Relevance</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("relevance"); setSortOrder("asc") }}>Lowest Relevance</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField("title"); setSortOrder("asc") }}>Title (A-Z)</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("vendor"); setSortOrder("asc") }}>Vendor (A-Z)</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField("createdAt"); setSortOrder("desc") }}>Newest First</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("category"); setSortOrder("asc") }}>Category</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="flex items-center border rounded-md">
            <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="sm" className="rounded-r-none" onClick={() => setViewMode("grid")}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="sm" className="rounded-none border-x" onClick={() => setViewMode("list")}>
              <List className="h-4 w-4" />
            </Button>
            <Button variant={viewMode === "table" ? "secondary" : "ghost"} size="sm" className="rounded-l-none" onClick={() => setViewMode("table")}>
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {someSelected && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>Clear</Button>
          </div>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Lightbulb className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No solutions found</p>
            <p className="text-xs text-muted-foreground">
              {search || categoryFilter !== "all" ? "Try adjusting your filters" : "Add your first solution to get started."}
            </p>
            <Button onClick={openCreate} size="sm" className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Add Solution
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"><Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} /></TableHead>
                <TableHead>Solution</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Relevance</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => (
                <TableRow key={s.id} className={selectedIds.has(s.id) ? "bg-muted/50" : ""}>
                  <TableCell><Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        {getTypeIcon(s)}
                      </div>
                      <div>
                        <p className="font-medium">{s.title}</p>
                        <p className="text-xs text-muted-foreground">{s.vendor}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{s.category}</Badge></TableCell>
                  <TableCell>{getTypeBadge(s)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.relevance}%` }} />
                      </div>
                      <span className="text-xs text-muted-foreground">{s.relevance}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 flex-wrap max-w-[150px]">
                      {s.tags?.slice(0, 2).map(t => (
                        <span key={t} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{t}</span>
                      ))}
                      {s.tags?.length > 2 && <span className="text-[10px] text-muted-foreground">+{s.tags.length - 2}</span>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {s.url && <DropdownMenuItem asChild><a href={s.url} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" /> Visit</a></DropdownMenuItem>}
                        <DropdownMenuItem onClick={() => openEdit(s)}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <Card 
              key={s.id} 
              className={`border-border/60 transition-all hover:shadow-md cursor-pointer ${selectedIds.has(s.id) ? "ring-2 ring-primary" : ""}`}
              onClick={() => toggleSelect(s.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} onClick={(e) => e.stopPropagation()} />
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getTypeIcon(s)}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {s.url && <DropdownMenuItem asChild><a href={s.url} target="_blank" rel="noopener"><ExternalLink className="h-4 w-4 mr-2" /> Visit</a></DropdownMenuItem>}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(s) }}><Pencil className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }} className="text-destructive"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base mt-2">{s.title}</CardTitle>
                <CardDescription className="text-xs">{s.vendor}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                {s.description && <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{s.description}</p>}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {getTypeBadge(s)}
                  <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${s.relevance}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{s.relevance}%</span>
                  </div>
                  {s.url && (
                    <Button variant="ghost" size="sm" className="h-7 text-xs" asChild onClick={(e) => e.stopPropagation()}>
                      <a href={s.url} target="_blank" rel="noopener"><ExternalLink className="h-3 w-3 mr-1" /> Visit</a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <Card key={s.id} className={`border-border/60 transition-all hover:shadow-sm ${selectedIds.has(s.id) ? "ring-2 ring-primary" : ""}`}>
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  {getTypeIcon(s)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{s.title}</h3>
                    {getTypeBadge(s)}
                    <Badge variant="outline" className="text-[10px] capitalize">{s.category}</Badge>
                    <span className="text-[10px] text-muted-foreground">by {s.vendor}</span>
                  </div>
                  {s.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                  <div className="mt-1.5 flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full" style={{ width: `${s.relevance}%` }} />
                      </div>
                      <span className="text-[10px] text-muted-foreground">{s.relevance}%</span>
                    </div>
                    <div className="flex gap-1">
                      {s.tags?.slice(0, 3).map(t => (
                        <span key={t} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {s.url && <Button variant="ghost" size="icon" className="h-8 w-8" asChild><a href={s.url} target="_blank" rel="noopener"><ExternalLink className="h-3.5 w-3.5" /></a></Button>}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{filtered.length} of {solutions.length} solutions</span>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Solution" : "Add Solution"}</DialogTitle>
            <DialogDescription>Manage the solution catalog entry visible to all users.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Hotjar" autoFocus />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Vendor</Label>
                <Input value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} placeholder="e.g. Hotjar Inc" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== "all").map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Relevance Score (0-100)</Label>
                <Input type="number" min={0} max={100} value={form.relevance} onChange={(e) => setForm({ ...form, relevance: e.target.value })} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>URL</Label>
              <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="https://..." />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Tags (comma-separated)</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="analytics, heatmaps, ux" />
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.isCrowd} onCheckedChange={(v) => setForm({ ...form, isCrowd: v, isTrend: v ? false : form.isTrend })} />
                <Label className="text-sm">Crowd-sourced</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isTrend} onCheckedChange={(v) => setForm({ ...form, isTrend: v, isCrowd: v ? false : form.isCrowd })} />
                <Label className="text-sm">Trend</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>{saving ? "Saving..." : editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedIds.size} Solutions</DialogTitle>
            <DialogDescription>Update category and relevance for selected solutions.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger><SelectValue placeholder="Keep current" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current</SelectItem>
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Relevance Score</Label>
              <Input type="number" min={0} max={100} value={bulkRelevance} onChange={(e) => setBulkRelevance(e.target.value)} placeholder="Keep current" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEdit}>Update {selectedIds.size} Solutions</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Generate Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              AI Generate Solution
            </DialogTitle>
            <DialogDescription>
              Describe the solution you need and AI will create a catalog entry for you.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Description / Topic</Label>
              <Textarea
                placeholder="e.g., A tool that helps analyze customer feedback sentiment in real-time..."
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Industry Focus</Label>
              <Select value={aiIndustry} onValueChange={setAiIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any Industry</SelectItem>
                  {INDUSTRIES.map(ind => (
                    <SelectItem key={ind.value} value={ind.value}>
                      {ind.value.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Select an industry to tailor the solution, or leave as "Any" for general solutions.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAiDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAIGenerate} disabled={!aiDescription.trim() || aiGenerating} className="gap-1.5">
              {aiGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
