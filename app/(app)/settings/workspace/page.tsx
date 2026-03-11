"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { Building2, Sparkles, AlertTriangle, Loader2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { updateWorkspace } from "@/lib/actions/data"
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
import { useRouter } from "next/navigation"

const planFeatures: Record<string, string[]> = {
  free: ["3 journeys", "1 workspace member", "Basic export"],
  pro: ["Unlimited journeys", "10 workspace members", "PDF export", "Versioning", "Priority support"],
  enterprise: ["Unlimited everything", "Unlimited members", "SSO", "Custom integrations", "Dedicated support", "SLA"],
}

export default function WorkspaceSettingsPage() {
  const { workspace, refreshWorkspaces, workspaces } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)

  // Initialize logoUrl from workspace when it loads
  useEffect(() => {
    if (workspace?.logo) {
      setLogoUrl(workspace.logo)
    }
  }, [workspace?.logo])

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/") && file.type !== "image/svg+xml") { toast.error("Please select an image file"); return }
    if (file.size > 1 * 1024 * 1024) { toast.error("File must be under 1MB"); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("purpose", "workspace-logo")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setLogoUrl(data.url)
      toast.success("Logo updated")
    } catch {
      toast.error("Failed to upload logo")
    } finally {
      setUploading(false)
    }
  }

  if (!workspace) {
    return <p className="text-sm text-muted-foreground">No workspace selected</p>
  }

  const plan = workspace.plan

  return (
    <div className="flex flex-col gap-6">
      <Toaster />

      {/* Workspace Info */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Workspace Details
          </CardTitle>
          <CardDescription>Manage your workspace name, slug, and logo</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-4 mb-2">
            {logoUrl ? (
              <img src={logoUrl} alt="Workspace logo" className="h-14 w-14 rounded-lg object-cover" />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary">
                {workspace.name.charAt(0)}
              </div>
            )}
            <div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              <Button variant="outline" size="sm" onClick={() => logoRef.current?.click()} disabled={uploading}>
                {uploading ? "Uploading..." : "Upload Logo"}
              </Button>
              <p className="text-[11px] text-muted-foreground mt-1">SVG, PNG, or JPG. Max 1MB.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-name">Workspace Name</Label>
              <Input id="ws-name" ref={nameRef} defaultValue={workspace.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-slug">Slug</Label>
              <Input id="ws-slug" defaultValue={workspace.slug} className="bg-muted/50" />
            </div>
          </div>
          <Button
            className="self-start gap-2"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                await updateWorkspace({ 
                  name: nameRef.current?.value || workspace.name,
                  logo: logoUrl || undefined,
                })
                await refreshWorkspaces()
                toast.success("Workspace updated")
              } catch { toast.error("Failed to update workspace") }
              finally { setSaving(false) }
            }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Plan & Usage
          </CardTitle>
          <CardDescription>Current plan and workspace usage</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-foreground capitalize">{plan} Plan</p>
                <Badge variant="secondary" className="text-[10px] capitalize">{plan}</Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(planFeatures[plan] ?? []).map((f) => (
                  <span key={f} className="text-[11px] text-muted-foreground bg-muted rounded px-2 py-0.5">{f}</span>
                ))}
              </div>
            </div>
            {plan !== "enterprise" && (
              <Button size="sm">
                Upgrade
              </Button>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.memberCount}</p>
              <p className="text-xs text-muted-foreground">Members</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.journeyCount}</p>
              <p className="text-xs text-muted-foreground">Journeys</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.archetypeCount}</p>
              <p className="text-xs text-muted-foreground">Archetypes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>Permanently delete this workspace and all its data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              This action cannot be undone. All journeys, archetypes, and team data will be permanently deleted.
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              Delete Workspace
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Workspace
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to permanently delete <span className="font-semibold text-foreground">{workspace.name}</span> and all its data including:
              </p>
              <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                <li>{workspace.journeyCount} journey{workspace.journeyCount !== 1 ? "s" : ""}</li>
                <li>{workspace.memberCount} team member{workspace.memberCount !== 1 ? "s" : ""}</li>
                <li>All archetypes and templates</li>
                <li>All comments and collaboration history</li>
              </ul>
              <p className="font-medium text-destructive">This action cannot be undone.</p>
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-sm">
                  Type <span className="font-mono font-semibold">{workspace.name}</span> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Enter workspace name"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleteConfirmText !== workspace.name || deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async (e) => {
                e.preventDefault()
                setDeleting(true)
                try {
                  const res = await fetch(`/api/workspaces?id=${workspace.id}`, {
                    method: "DELETE",
                  })
                  const data = await res.json()
                  
                  if (res.ok) {
                    toast.success("Workspace deleted")
                    setDeleteDialogOpen(false)
                    setDeleteConfirmText("")
                    
                    if (data.switchTo) {
                      window.location.href = "/dashboard"
                    } else {
                      // No other workspace - redirect to create one
                      window.location.href = "/onboarding"
                    }
                  } else {
                    toast.error(data.error || "Failed to delete workspace")
                  }
                } catch {
                  toast.error("Failed to delete workspace")
                } finally {
                  setDeleting(false)
                }
              }}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Workspace"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
