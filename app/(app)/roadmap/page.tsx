"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  Download, Target, Clock, CheckCircle2, PauseCircle,
  Hash, ChevronDown, ChevronRight, Lightbulb, Map as MapIcon,
  Plus, Pencil, Trash2, MoreHorizontal, ShieldCheck, AlertCircle,
  List, LayoutGrid, GanttChartSquare, RefreshCw,
} from "lucide-react"
import { KanbanBoard } from "@/components/roadmap/kanban-board"
import { TimelineView } from "@/components/roadmap/timeline-view"
import { cn } from "@/lib/utils"
import { useProfile } from "@/hooks/use-profile"
import { getPermissions } from "@/lib/permissions"
import useSWR from "swr"

interface Initiative {
  id: string
  title: string
  description: string
  priority: number
  status: "planned" | "in_progress" | "completed" | "on_hold" | "pending_approval"
  journey_id: string | null
  solution_id: string | null
  journeys: { id: string; title: string } | null
  solutions: { id: string; title: string } | null
  responsible: string
  accountable: string
  consulted: string
  informed: string
  start_date: string | null
  end_date: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

const statusConfig: Record<string, { label: string; color: string; icon: typeof Target }> = {
  planned: { label: "Planned", color: "bg-muted text-muted-foreground", icon: Target },
  in_progress: { label: "In Progress", color: "bg-primary/10 text-primary", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400", icon: AlertCircle },
  completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle2 },
  on_hold: { label: "On Hold", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: PauseCircle },
}

const emptyForm = {
  title: "", description: "", responsible: "Product Team", accountable: "CX Director",
  consulted: "Engineering, Design", informed: "Stakeholders", startDate: "", endDate: "",
}

export default function RoadmapPage() {
  const { profile } = useProfile()
  const perms = getPermissions(profile?.role || "viewer")

  const [initiatives, setInitiatives] = useState<Initiative[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>("all")
  const [viewMode, setViewMode] = useState<"list" | "kanban" | "timeline">("list")

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)

  // Inline editing state
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  const reload = useCallback(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => setInitiatives(Array.isArray(data) ? data : []))
  }, [])

  useEffect(() => {
    fetch("/api/roadmap")
      .then((r) => r.json())
      .then((data) => {
        setInitiatives(Array.isArray(data) ? data : [])
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const canManageRoadmap = perms.canManageRoadmap || perms.canEdit
  const canApprove = perms.canApproveCompletion

  // Workspace members for RASCI picker
  const wsFetcher = (url: string) => fetch(url).then((r) => r.json())
  const { data: wsMembers = [] } = useSWR<{ id: string; full_name: string; email: string; role: string }[]>("/api/workspace-members", wsFetcher)

  async function handleMarkDone(id: string) {
    const res = await fetch("/api/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: "pending_approval" }),
    })
    if (res.ok) { toast.success("Submitted for approval"); reload() }
    else toast.error("Failed to submit")
  }

  async function handleSave() {
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch("/api/roadmap", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...form }),
        })
        if (!res.ok) throw new Error("Update failed")
        toast.success("Initiative updated")
      } else {
        const res = await fetch("/api/roadmap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        })
        if (!res.ok) throw new Error("Create failed")
        toast.success("Initiative created")
      }
      setDialogOpen(false)
      setEditingId(null)
      setForm(emptyForm)
      reload()
    } catch { toast.error("Failed to save initiative") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/roadmap?id=${id}`, { method: "DELETE" })
    if (res.ok) { toast.success("Initiative deleted"); reload() }
    else toast.error("Failed to delete initiative")
  }

  async function handleStatusChange(id: string, newStatus: string) {
    const res = await fetch("/api/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    })
    if (res.ok) { toast.success("Status updated"); reload() }
    else toast.error("Failed to update status")
  }

  async function handleApprove(id: string) {
    const res = await fetch("/api/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id,
        status: "completed",
        approvedBy: profile?.full_name || profile?.email || "PM",
        approvedAt: new Date().toISOString(),
      }),
    })
    if (res.ok) { toast.success("Initiative approved and marked completed"); reload() }
    else toast.error("Failed to approve")
  }

  async function handleInlineEdit(id: string, field: string, value: string) {
    setEditingField(null)
    const res = await fetch("/api/roadmap", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    })
    if (res.ok) reload()
    else toast.error("Failed to update")
  }

  function openEdit(initiative: Initiative) {
    setEditingId(initiative.id)
    setForm({
      title: initiative.title,
      description: initiative.description,
      responsible: initiative.responsible,
      accountable: initiative.accountable,
      consulted: initiative.consulted,
      informed: initiative.informed,
      startDate: initiative.start_date || "",
      endDate: initiative.end_date || "",
    })
    setDialogOpen(true)
  }

  // B5: Sync solutions from all journeys
  async function handleSyncFromJourneys() {
    setSyncing(true)
    try {
      const res = await fetch("/api/roadmap/sync", { method: "POST" })
      const data = await res.json()
      if (res.ok) {
        if (data.synced > 0) {
          toast.success(`Synced ${data.synced} initiatives from journeys`)
          reload()
        } else {
          toast.info("Already in sync")
        }
      } else {
        toast.error(data.error || "Sync failed")
      }
    } catch {
      toast.error("Sync failed")
    } finally {
      setSyncing(false)
    }
  }

  const filtered = filter === "all" ? initiatives : initiatives.filter((i) => i.status === filter)
  const stats = {
    total: initiatives.length,
    planned: initiatives.filter((i) => i.status === "planned").length,
    in_progress: initiatives.filter((i) => i.status === "in_progress").length,
    pending_approval: initiatives.filter((i) => i.status === "pending_approval").length,
    completed: initiatives.filter((i) => i.status === "completed").length,
  }

  function handleDownload() {
    const rows = [
      ["#", "Initiative", "Status", "Journey", "Responsible", "Accountable", "Consulted", "Informed", "Start", "End"],
      ...initiatives.map((i) => [
        String(i.priority), i.title, i.status,
        i.journeys?.title || "-", i.responsible, i.accountable, i.consulted, i.informed,
        i.start_date || "-", i.end_date || "-",
      ]),
    ]
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "roadmap.csv"
    a.click()
    URL.revokeObjectURL(url)
    toast.success("Downloaded as CSV")
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 lg:px-6">
      <Toaster />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Product Roadmap</h1>
          <p className="text-sm text-muted-foreground">
            Plan, track and manage CX initiatives across your journeys
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5 rounded-r-none"
              onClick={() => setViewMode("list")}
            >
              <List className="h-3.5 w-3.5" />
              <span className="sr-only">List view</span>
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5 rounded-none border-x"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="sr-only">Kanban view</span>
            </Button>
            <Button
              variant={viewMode === "timeline" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5 rounded-l-none"
              onClick={() => setViewMode("timeline")}
            >
              <GanttChartSquare className="h-3.5 w-3.5" />
              <span className="sr-only">Timeline view</span>
            </Button>
          </div>
          {canManageRoadmap && (
            <>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5" 
                onClick={handleSyncFromJourneys}
                disabled={syncing}
              >
                <RefreshCw className={cn("h-3.5 w-3.5", syncing && "animate-spin")} />
                Sync from Journeys
              </Button>
              <Button size="sm" className="gap-1.5" onClick={() => { setEditingId(null); setForm(emptyForm); setDialogOpen(true) }}>
                <Plus className="h-3.5 w-3.5" />
                Add Initiative
              </Button>
            </>
          )}
          <Button variant="outline" size="sm" className="gap-1.5" onClick={handleDownload} disabled={initiatives.length === 0}>
            <Download className="h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-4">
        {([
          { label: "Total Initiatives", value: stats.total, icon: Hash },
          { label: "Planned", value: stats.planned, icon: Target },
          { label: "In Progress", value: stats.in_progress, icon: Clock },
          { label: "Completed", value: stats.completed, icon: CheckCircle2 },
        ] as const).map((stat) => (
          <Card key={stat.label} className="border-border/60">
            <CardContent className="flex items-center gap-3 py-3 px-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {["all", "planned", "in_progress", "pending_approval", "completed", "on_hold"].map((s) => (
          <Button key={s} variant={filter === s ? "default" : "outline"} size="sm" className="h-7 text-xs capitalize" onClick={() => setFilter(s)}>
            {s === "all" ? "All" : statusConfig[s]?.label || s.replace("_", " ")}
            {s === "pending_approval" && stats.pending_approval > 0 && (
              <Badge className="ml-1.5 h-4 px-1 text-[9px] bg-violet-500 text-white">{stats.pending_approval}</Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Initiatives list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-border/60">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <MapIcon className="h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No initiatives yet</p>
            <p className="text-xs text-muted-foreground max-w-sm">
              Add initiatives from your solutions or create new ones to track your CX roadmap.
            </p>
            <Button variant="outline" size="sm" className="mt-2" asChild>
              <Link href="/solutions">Browse Solutions</Link>
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === "kanban" ? (
        <KanbanBoard
          initiatives={filtered}
          onStatusChange={handleStatusChange}
          onEdit={openEdit}
          onDelete={handleDelete}
          canEdit={canManageRoadmap}
        />
      ) : viewMode === "timeline" ? (
        <TimelineView
          initiatives={filtered}
          onEdit={openEdit}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((initiative) => {
            const config = statusConfig[initiative.status]
            const StatusIcon = config.icon
            const isExpanded = expandedId === initiative.id

            return (
              <Card key={initiative.id} className="border-border/60 transition-all hover:border-border">
                <CardContent className="p-0">
                  {/* Main row */}
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    onClick={() => setExpandedId(isExpanded ? null : initiative.id)}
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-bold text-foreground">
                      {initiative.priority}
                    </span>
                    {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{initiative.title}</p>
                      {initiative.journeys && (
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapIcon className="h-3 w-3" />
                          {initiative.journeys.title}
                        </p>
                      )}
                      {initiative.solutions && (
                        <p className="text-[11px] text-primary/70 flex items-center gap-1 mt-0.5">
                          <Lightbulb className="h-3 w-3" />
                          {initiative.solutions.title}
                        </p>
                      )}
                    </div>
                    <Badge className={cn("shrink-0 text-[10px] font-normal gap-1", config.color)}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </Badge>
                    {initiative.start_date && (
                      <span className="shrink-0 text-[10px] text-muted-foreground hidden sm:inline">
                        {new Date(initiative.start_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                        {initiative.end_date && (
                          <> - {new Date(initiative.end_date).toLocaleDateString("en", { month: "short", day: "numeric" })}</>
                        )}
                      </span>
                    )}

                    {/* Actions dropdown */}
                    {canManageRoadmap && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <MoreHorizontal className="h-3.5 w-3.5" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openEdit(initiative) }}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {["planned", "in_progress", "pending_approval", "on_hold"].filter(s => s !== initiative.status).map((s) => (
                            <DropdownMenuItem key={s} onClick={(e) => { e.stopPropagation(); handleStatusChange(initiative.id, s) }}>
                              {statusConfig[s] && (() => { const Icon = statusConfig[s].icon; return <Icon className="mr-2 h-3.5 w-3.5" /> })()}
                              {statusConfig[s]?.label || s}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={(e) => { e.stopPropagation(); handleDelete(initiative.id) }}
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </button>

                  {/* Expanded section with editable RASCI */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 py-3 space-y-3">
                      {initiative.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">{initiative.description}</p>
                      )}

                      {/* Approval banner for pending items */}
                      {/* Mark as Done action for in_progress items (any team member) */}
                      {initiative.status === "in_progress" && (
                        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-foreground">Ready to submit?</p>
                            <p className="text-[10px] text-muted-foreground">Mark this initiative as done to send it for PM approval.</p>
                          </div>
                          <Button size="sm" className="h-7 text-xs gap-1" onClick={() => handleMarkDone(initiative.id)}>
                            <CheckCircle2 className="h-3 w-3" />
                            Mark as Done
                          </Button>
                        </div>
                      )}

                      {initiative.status === "pending_approval" && canApprove && (
                        <div className="flex items-center gap-3 rounded-lg border-2 border-violet-200 bg-violet-50 p-3 dark:border-violet-800 dark:bg-violet-900/10">
                          <ShieldCheck className="h-5 w-5 text-violet-600 dark:text-violet-400 shrink-0" />
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-violet-800 dark:text-violet-200">Approval Required</p>
                            <p className="text-[10px] text-violet-600 dark:text-violet-300">This initiative is awaiting PM approval to be marked as completed.</p>
                          </div>
                          <Button size="sm" className="h-7 text-xs gap-1 bg-violet-600 hover:bg-violet-700 text-white" onClick={() => handleApprove(initiative.id)}>
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </Button>
                        </div>
                      )}
                      {initiative.status === "pending_approval" && !canApprove && (
                        <div className="flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50/50 p-2 dark:border-violet-800 dark:bg-violet-900/10">
                          <AlertCircle className="h-4 w-4 text-violet-500 shrink-0" />
                          <p className="text-[10px] text-violet-600 dark:text-violet-300">Awaiting approval from a Project Manager or Admin.</p>
                        </div>
                      )}

                      {/* Approved badge */}
                      {initiative.approved_by && (
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="h-3 w-3" />
                          Approved by {initiative.approved_by}
                          {initiative.approved_at && <> on {new Date(initiative.approved_at).toLocaleDateString()}</>}
                        </div>
                      )}

                      {/* Editable RASCI grid */}
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {([
                          { label: "Responsible", field: "responsible", value: initiative.responsible, color: "text-primary" },
                          { label: "Accountable", field: "accountable", value: initiative.accountable, color: "text-amber-600 dark:text-amber-400" },
                          { label: "Consulted", field: "consulted", value: initiative.consulted, color: "text-emerald-600 dark:text-emerald-400" },
                          { label: "Informed", field: "informed", value: initiative.informed, color: "text-muted-foreground" },
                        ] as const).map((rasci) => (
                          <div key={rasci.label} className="rounded-md bg-muted/50 p-2">
                            <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{rasci.label}</p>
                            {editingField?.id === initiative.id && editingField?.field === rasci.field ? (
                              <Input
                                autoFocus
                                className="h-6 mt-0.5 text-xs"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleInlineEdit(initiative.id, rasci.field, editValue)}
                                onKeyDown={(e) => { if (e.key === "Enter") handleInlineEdit(initiative.id, rasci.field, editValue); if (e.key === "Escape") setEditingField(null) }}
                              />
                            ) : (
                              <p
                                className={cn("text-xs font-medium mt-0.5 cursor-pointer hover:underline", rasci.color, !canManageRoadmap && "cursor-default hover:no-underline")}
                                onClick={() => { if (canManageRoadmap) { setEditingField({ id: initiative.id, field: rasci.field }); setEditValue(rasci.value || "") } }}
                              >
                                {rasci.value || "-"}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Links */}
                      <div className="flex items-center gap-2">
                        {initiative.journeys && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" asChild>
                            <Link href={`/journeys/${initiative.journeys.id}`}>
                              <MapIcon className="h-3 w-3" /> View Journey
                            </Link>
                          </Button>
                        )}
                        {initiative.solutions && (
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" asChild>
                            <Link href="/solutions">
                              <Lightbulb className="h-3 w-3" /> View Solution
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
      {/* Add / Edit Initiative Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Initiative" : "Add Initiative"}</DialogTitle>
            <DialogDescription>
              {editingId ? "Update this roadmap initiative." : "Create a new roadmap initiative with RASCI assignments."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Initiative name" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the initiative..." rows={3} className="resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([
                { label: "Responsible", key: "responsible" as const, color: "text-primary" },
                { label: "Accountable", key: "accountable" as const, color: "text-amber-600 dark:text-amber-400" },
                { label: "Consulted", key: "consulted" as const, color: "text-emerald-600 dark:text-emerald-400" },
                { label: "Informed", key: "informed" as const, color: "text-muted-foreground" },
              ] as const).map((rasci) => (
                <div key={rasci.key} className="flex flex-col gap-2">
                  <Label className={cn("text-xs", rasci.color)}>{rasci.label}</Label>
                  {wsMembers.length > 0 ? (
                    <Select
                      value={form[rasci.key]}
                      onValueChange={(val) => setForm({ ...form, [rasci.key]: val })}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder={`Select ${rasci.label.toLowerCase()}...`} />
                      </SelectTrigger>
                      <SelectContent>
                        {wsMembers.map((m) => (
                          <SelectItem key={m.id} value={m.full_name || m.email}>
                            {m.full_name || m.email}
                          </SelectItem>
                        ))}
                        <SelectItem value="__custom__">Custom...</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={form[rasci.key]}
                      onChange={(e) => setForm({ ...form, [rasci.key]: e.target.value })}
                      className="h-8 text-xs"
                      placeholder={rasci.label}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="h-8 text-xs" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="h-8 text-xs" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? "Saving..." : editingId ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
