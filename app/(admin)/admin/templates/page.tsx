"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Plus, BookTemplate, Pencil, Trash2, Copy, Search } from "lucide-react"
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
}

export default function AdminTemplatesPage() {
  const { data, isLoading } = useSWR<Template[]>("/api/admin/templates", fetcher)
  const templates = Array.isArray(data) ? data : []

  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formTitle, setFormTitle] = useState("")
  const [formDesc, setFormDesc] = useState("")
  const [formTags, setFormTags] = useState("")
  const [formStages, setFormStages] = useState("Awareness, Engagement, Outcome")
  const [saving, setSaving] = useState(false)

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingId(null)
    setFormTitle("")
    setFormDesc("")
    setFormTags("")
    setFormStages("Awareness, Engagement, Outcome")
    setDialogOpen(true)
  }

  function openEdit(t: Template) {
    setEditingId(t.id)
    setFormTitle(t.name)
    setFormDesc(t.description)
    setFormTags(t.category)
    setFormStages(t.stages.map((s) => s.name).join(", "))
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!formTitle.trim()) return
    setSaving(true)
    try {
      const body = {
        name: formTitle,
        description: formDesc,
        category: formTags.trim() || "general",
        stages: formStages.split(",").map((s) => s.trim()).filter(Boolean).map((s) => ({ name: s, steps: [] })),
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
    toast.success("Template deleted")
  }

  async function handleDuplicate(t: Template) {
    await fetch("/api/admin/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: `${t.name} (Copy)`, description: t.description, category: t.category, stages: t.stages }),
    })
    mutate("/api/admin/templates")
    toast.success("Template duplicated")
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Journey Templates</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create and manage reusable journey templates for all users</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search templates..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Templates list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <BookTemplate className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No templates yet</p>
            <p className="text-xs text-muted-foreground">Create your first journey template to get started.</p>
            <Button onClick={openCreate} size="sm" className="mt-2 gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((t) => (
            <Card key={t.id} className="border-border/60">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{t.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">{t.stages?.length || 0} stages</Badge>
                    <Badge variant="outline" className="text-[10px] capitalize">{t.category}</Badge>
                    {t.is_public && <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">Public</Badge>}
                  </div>
                  {t.description && (
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{t.description}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Created {new Date(t.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(t)}>
                    <Pencil className="h-3.5 w-3.5" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDuplicate(t)}>
                    <Copy className="h-3.5 w-3.5" />
                    <span className="sr-only">Duplicate</span>
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(t.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Template" : "Create Template"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update this journey template."
                : "Create a new journey template with default stages. Users can clone this to start a new journey."}
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
            {!editingId && (
              <div className="flex flex-col gap-2">
                <Label htmlFor="tmpl-stages">Default Stages (comma-separated)</Label>
                <Input id="tmpl-stages" value={formStages} onChange={(e) => setFormStages(e.target.value)} placeholder="Awareness, Engagement, Outcome" />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tmpl-tags">Category</Label>
              <Input id="tmpl-tags" value={formTags} onChange={(e) => setFormTags(e.target.value)} placeholder="saas, retail, support, healthcare, hr" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!formTitle.trim() || saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
