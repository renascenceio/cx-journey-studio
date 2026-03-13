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
  Plus, BookTemplate, Pencil, Trash2, Copy, Search, MoreHorizontal, 
  LayoutGrid, List, TableIcon, Download, Upload, Eye, EyeOff,
  ChevronDown, Filter, SortAsc, SortDesc, CheckSquare, Square
} from "lucide-react"
import useSWR, { mutate } from "swr"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface Template {
  id: string
  name: string
  description: string
  category: string
  stages: { name: string; steps: string[] }[]
  is_public: boolean
  created_at: string
  updated_at?: string
}

type ViewMode = "grid" | "list" | "table"
type SortField = "name" | "category" | "created_at" | "stages"
type SortOrder = "asc" | "desc"

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "saas", label: "SaaS" },
  { value: "retail", label: "Retail" },
  { value: "healthcare", label: "Healthcare" },
  { value: "finance", label: "Finance" },
  { value: "hospitality", label: "Hospitality" },
  { value: "education", label: "Education" },
  { value: "general", label: "General" },
]

export default function AdminTemplatesPage() {
  const { data, isLoading } = useSWR<Template[]>("/api/admin/templates", fetcher)
  const templates = Array.isArray(data) ? data : []

  // View and filter state
  const [viewMode, setViewMode] = useState<ViewMode>("grid")
  const [search, setSearch] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [publicFilter, setPublicFilter] = useState<"all" | "public" | "private">("all")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")
  
  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  
  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formCategory, setFormCategory] = useState("general")
  const [formStages, setFormStages] = useState("Awareness, Engagement, Outcome")
  const [formPublic, setFormPublic] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Bulk edit dialog
  const [bulkEditOpen, setBulkEditOpen] = useState(false)
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkPublic, setBulkPublic] = useState<boolean | null>(null)

  // Filter and sort
  const filtered = useMemo(() => {
    let result = templates.filter((t) => {
      const matchesSearch = t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === "all" || t.category === categoryFilter
      const matchesPublic = publicFilter === "all" || 
        (publicFilter === "public" && t.is_public) ||
        (publicFilter === "private" && !t.is_public)
      return matchesSearch && matchesCategory && matchesPublic
    })
    
    // Sort
    result.sort((a, b) => {
      let comparison = 0
      switch (sortField) {
        case "name":
          comparison = a.name.localeCompare(b.name)
          break
        case "category":
          comparison = a.category.localeCompare(b.category)
          break
        case "created_at":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          break
        case "stages":
          comparison = (a.stages?.length || 0) - (b.stages?.length || 0)
          break
      }
      return sortOrder === "asc" ? comparison : -comparison
    })
    
    return result
  }, [templates, search, categoryFilter, publicFilter, sortField, sortOrder])

  const allSelected = filtered.length > 0 && filtered.every(t => selectedIds.has(t.id))
  const someSelected = selectedIds.size > 0

  function toggleSelect(id: string) {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setSelectedIds(newSet)
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(t => t.id)))
    }
  }

  function openCreate() {
    setEditingId(null)
    setFormTitle("")
    setFormDesc("")
    setFormCategory("general")
    setFormStages("Awareness, Engagement, Outcome")
    setFormPublic(false)
    setDialogOpen(true)
  }

  function openEdit(t: Template) {
    setEditingId(t.id)
    setFormTitle(t.name)
    setFormDesc(t.description)
    setFormCategory(t.category)
    setFormStages(t.stages.map((s) => s.name).join(", "))
    setFormPublic(t.is_public)
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      const body = {
        name: formTitle,
        description: formDesc,
        category: formCategory,
        stages: formStages.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s, steps: [] })),
        is_public: formPublic,
      }
      if (editingId) {
        await fetch(`/api/admin/templates/${editingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        toast.success("Template updated")
      } else {
        await fetch("/api/admin/templates", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
        toast.success("Template created")
      }
      mutate("/api/admin/templates")
      setDialogOpen(false)
    } catch {
      toast.error("Failed to save template")
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template permanently?")) return
    await fetch(`/api/admin/templates/${id}`, { method: "DELETE" })
    mutate("/api/admin/templates")
    setSelectedIds(prev => {
      const newSet = new Set(prev)
      newSet.delete(id)
      return newSet
    })
    toast.success("Template deleted")
  }

  async function handleDuplicate(t: Template) {
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${t.name} (Copy)`, description: t.description, category: t.category, stages: t.stages, is_public: false }),
    })
    mutate("/api/admin/templates")
    toast.success("Template duplicated")
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0) return
    if (!confirm(`Delete ${selectedIds.size} selected template(s) permanently?`)) return
    
    for (const id of selectedIds) {
      await fetch(`/api/admin/templates/${id}`, { method: "DELETE" })
    }
    mutate("/api/admin/templates")
    setSelectedIds(new Set())
    toast.success(`${selectedIds.size} templates deleted`)
  }

  async function handleBulkEdit() {
    if (selectedIds.size === 0) return
    
    for (const id of selectedIds) {
      const body: Record<string, unknown> = {}
      if (bulkCategory) body.category = bulkCategory
      if (bulkPublic !== null) body.is_public = bulkPublic
      
      if (Object.keys(body).length > 0) {
        await fetch(`/api/admin/templates/${id}`, { 
          method: "PATCH", 
          headers: { "Content-Type": "application/json" }, 
          body: JSON.stringify(body) 
        })
      }
    }
    
    mutate("/api/admin/templates")
    setBulkEditOpen(false)
    setBulkCategory("")
    setBulkPublic(null)
    setSelectedIds(new Set())
    toast.success(`${selectedIds.size} templates updated`)
  }

  async function handleBulkTogglePublic(makePublic: boolean) {
    if (selectedIds.size === 0) return
    
    for (const id of selectedIds) {
      await fetch(`/api/admin/templates/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ is_public: makePublic }) 
      })
    }
    
    mutate("/api/admin/templates")
    toast.success(`${selectedIds.size} templates ${makePublic ? "published" : "unpublished"}`)
  }

  function exportTemplates() {
    const toExport = selectedIds.size > 0 
      ? templates.filter(t => selectedIds.has(t.id))
      : templates
    const blob = new Blob([JSON.stringify(toExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `templates-export-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    toast.success(`Exported ${toExport.length} templates`)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Journey Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage {templates.length} reusable journey templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportTemplates}>
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
          <Button onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        </div>
      </div>

      {/* Filters and View Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={publicFilter} onValueChange={(v) => setPublicFilter(v as typeof publicFilter)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="public">Public</SelectItem>
              <SelectItem value="private">Private</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                {sortOrder === "asc" ? <SortAsc className="h-4 w-4 mr-1.5" /> : <SortDesc className="h-4 w-4 mr-1.5" />}
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("asc") }}>
                Name (A-Z)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("name"); setSortOrder("desc") }}>
                Name (Z-A)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("desc") }}>
                Newest First
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("created_at"); setSortOrder("asc") }}>
                Oldest First
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setSortField("category"); setSortOrder("asc") }}>
                Category
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { setSortField("stages"); setSortOrder("desc") }}>
                Most Stages
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          {/* View Toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-r-none"
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-none border-x"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "secondary" : "ghost"}
              size="sm"
              className="rounded-l-none"
              onClick={() => setViewMode("table")}
            >
              <TableIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-2">
          <div className="flex items-center gap-2">
            <Checkbox 
              checked={allSelected} 
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm font-medium">{selectedIds.size} selected</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setBulkEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkTogglePublic(true)}>
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              Publish
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleBulkTogglePublic(false)}>
              <EyeOff className="h-3.5 w-3.5 mr-1.5" />
              Unpublish
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* Templates Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookTemplate className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No templates found</p>
            <p className="text-xs text-muted-foreground">
              {search || categoryFilter !== "all" ? "Try adjusting your filters" : "Create your first journey template to get started."}
            </p>
            <Button onClick={openCreate} size="sm" className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "table" ? (
        /* Table View */
        <Card className="border-border/60">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox checked={allSelected} onCheckedChange={toggleSelectAll} />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Stages</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((t) => (
                <TableRow key={t.id} className={selectedIds.has(t.id) ? "bg-muted/50" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedIds.has(t.id)} 
                      onCheckedChange={() => toggleSelect(t.id)} 
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{t.name}</p>
                      {t.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs capitalize">{t.category}</Badge>
                  </TableCell>
                  <TableCell>{t.stages?.length || 0}</TableCell>
                  <TableCell>
                    {t.is_public ? (
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Public</Badge>
                    ) : (
                      <Badge variant="outline">Private</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(t.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                          <Copy className="h-4 w-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDelete(t.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <Card 
              key={t.id} 
              className={`border-border/60 transition-all hover:shadow-md cursor-pointer ${selectedIds.has(t.id) ? "ring-2 ring-primary" : ""}`}
              onClick={() => toggleSelect(t.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedIds.has(t.id)} 
                      onCheckedChange={() => toggleSelect(t.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookTemplate className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(t) }}>
                        <Pencil className="h-4 w-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(t) }}>
                        <Copy className="h-4 w-4 mr-2" /> Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id) }}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-base mt-2">{t.name}</CardTitle>
                <CardDescription className="line-clamp-2">{t.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-[10px] capitalize">{t.category}</Badge>
                  <Badge variant="outline" className="text-[10px]">{t.stages?.length || 0} stages</Badge>
                  {t.is_public && (
                    <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      Public
                    </Badge>
                  )}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{new Date(t.created_at).toLocaleDateString()}</span>
                  {t.stages && t.stages.length > 0 && (
                    <span className="truncate max-w-[150px]">{t.stages.map(s => s.name).join(" → ")}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* List View */
        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <Card 
              key={t.id} 
              className={`border-border/60 transition-all hover:shadow-sm ${selectedIds.has(t.id) ? "ring-2 ring-primary" : ""}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox 
                  checked={selectedIds.has(t.id)} 
                  onCheckedChange={() => toggleSelect(t.id)}
                />
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookTemplate className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{t.name}</h3>
                    <Badge variant="secondary" className="text-[10px] capitalize">{t.category}</Badge>
                    <Badge variant="outline" className="text-[10px]">{t.stages?.length || 0} stages</Badge>
                    {t.is_public && (
                      <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        Public
                      </Badge>
                    )}
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-4 text-[10px] text-muted-foreground">
                    <span>Created {new Date(t.created_at).toLocaleDateString()}</span>
                    {t.stages && t.stages.length > 0 && (
                      <span className="hidden sm:inline">Stages: {t.stages.map(s => s.name).join(", ")}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>{filtered.length} of {templates.length} templates</span>
        <span>{templates.filter(t => t.is_public).length} public</span>
        <span>{templates.filter(t => !t.is_public).length} private</span>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this journey template."
                : "Create a new journey template. Users can clone this to start a new journey."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="tmpl-title">Template Name</Label>
              <Input id="tmpl-title" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. SaaS Onboarding Journey" autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="tmpl-desc">Description</Label>
              <Textarea id="tmpl-desc" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} placeholder="Describe the purpose and use case..." rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="tmpl-category">Category</Label>
                <Select value={formCategory} onValueChange={setFormCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.filter(c => c.value !== "all").map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Visibility</Label>
                <div className="flex items-center gap-2 h-10">
                  <Switch checked={formPublic} onCheckedChange={setFormPublic} />
                  <span className="text-sm">{formPublic ? "Public" : "Private"}</span>
                </div>
              </div>
            </div>
            {!editingId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="tmpl-stages">Default Stages (comma-separated)</Label>
                <Input id="tmpl-stages" value={formStages} onChange={(e) => setFormStages(e.target.value)} placeholder="Awareness, Engagement, Outcome" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formTitle.trim() || saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Edit Dialog */}
      <Dialog open={bulkEditOpen} onOpenChange={setBulkEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Edit {selectedIds.size} Templates</DialogTitle>
            <DialogDescription>
              Update category and visibility for selected templates. Leave fields empty to keep current values.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Keep current" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current</SelectItem>
                  {CATEGORIES.filter(c => c.value !== "all").map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Visibility</Label>
              <Select 
                value={bulkPublic === null ? "" : bulkPublic ? "public" : "private"} 
                onValueChange={(v) => setBulkPublic(v === "" ? null : v === "public")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Keep current" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Keep current</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkEditOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkEdit}>
              Update {selectedIds.size} Templates
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
