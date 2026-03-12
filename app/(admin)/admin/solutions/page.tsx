"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search, Lightbulb, ExternalLink } from "lucide-react"
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
  url: string
  createdAt: string
}

export default function AdminSolutionsPage() {
  const t = useTranslations()
  const { data, isLoading } = useSWR<{ solutions: SolutionRecord[] }>("/api/admin/solutions", fetcher)
  const solutions = data?.solutions || []
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ title: "", vendor: "", description: "", category: "analytics", tags: "", relevance: "80", isCrowd: false, url: "" })
  const [saving, setSaving] = useState(false)

  const filtered = solutions.filter((s) =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.vendor.toLowerCase().includes(search.toLowerCase()) ||
    s.category.toLowerCase().includes(search.toLowerCase())
  )

  function openCreate() {
    setEditingId(null)
    setForm({ title: "", vendor: "", description: "", category: "analytics", tags: "", relevance: "80", isCrowd: false, url: "" })
    setDialogOpen(true)
  }

  function openEdit(s: SolutionRecord) {
    setEditingId(s.id)
    setForm({ title: s.title, vendor: s.vendor, description: s.description, category: s.category, tags: s.tags.join(", "), relevance: String(s.relevance), isCrowd: s.isCrowd, url: s.url || "" })
    setDialogOpen(true)
  }

  async function handleSave() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      const body = {
        title: form.title, vendor: form.vendor, description: form.description, category: form.category,
        tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
        relevance: parseInt(form.relevance) || 80, is_crowd: form.isCrowd, url: form.url,
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
    toast.success("Solution deleted")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Solutions Catalog</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage platform and crowd-sourced solutions visible to all users</p>
        </div>
        <Button onClick={openCreate} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Add Solution
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search solutions..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Badge variant="secondary" className="text-xs">{solutions.filter((s) => !s.isCrowd).length} platform</Badge>
        <Badge variant="outline" className="text-xs">{solutions.filter((s) => s.isCrowd).length} crowd</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-border/60">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <Lightbulb className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm font-medium text-foreground">No solutions yet</p>
            <Button onClick={openCreate} size="sm" className="mt-2 gap-1.5"><Plus className="h-3.5 w-3.5" />Add Solution</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((s) => (
            <Card key={s.id} className="border-border/60">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{s.title}</h3>
                    <Badge variant="secondary" className="text-[10px]">{s.category}</Badge>
                    {s.isCrowd && <Badge variant="outline" className="text-[10px]">Crowd</Badge>}
                    <span className="text-[10px] text-muted-foreground">by {s.vendor}</span>
                  </div>
                  {s.description && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{s.description}</p>}
                  <div className="mt-1.5 flex gap-1.5">
                    {s.tags.map((t) => <span key={t} className="text-[10px] text-muted-foreground bg-muted rounded px-1.5 py-0.5">{t}</span>)}
                    <span className="text-[10px] text-muted-foreground">Relevance: {s.relevance}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-4">
                  {s.url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <a href={s.url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/70 hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
                    <SelectItem value="analytics">Analytics</SelectItem>
                    <SelectItem value="feedback">Feedback</SelectItem>
                    <SelectItem value="engagement">Engagement</SelectItem>
                    <SelectItem value="personalization">Personalization</SelectItem>
                    <SelectItem value="automation">Automation</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
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
            <div className="flex items-center gap-2">
              <Switch checked={form.isCrowd} onCheckedChange={(v) => setForm({ ...form, isCrowd: v })} />
              <Label className="text-sm">Crowd-sourced solution</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t("common.cancel")}</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>{saving ? t("common.saving") : editingId ? t("common.update") : t("common.create")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
