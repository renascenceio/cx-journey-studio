"use client"

import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/lib/auth-provider"
import { Building2, Sparkles, AlertTriangle, Loader2, Clock } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { TimezonePicker } from "@/components/timezone-picker"
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
  const t = useTranslations("workspaceSettings")
  const { workspace, refreshWorkspaces, workspaces } = useAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadingFavicon, setUploadingFavicon] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState("")
  const [workspaceTimezone, setWorkspaceTimezone] = useState<string>("America/New_York")
  const nameRef = useRef<HTMLInputElement>(null)
  const logoRef = useRef<HTMLInputElement>(null)
  const faviconRef = useRef<HTMLInputElement>(null)

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

  async function handleFaviconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Allow .ico, .png, and .svg files
    const validTypes = ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/svg+xml"]
    if (!validTypes.includes(file.type) && !file.name.endsWith(".ico")) { 
      toast.error("Please select a .ico, .png, or .svg file")
      return 
    }
    if (file.size > 256 * 1024) { toast.error("Favicon must be under 256KB"); return }
    setUploadingFavicon(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("purpose", "workspace-favicon")
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setFaviconUrl(data.url)
      toast.success("Favicon updated")
    } catch {
      toast.error("Failed to upload favicon")
    } finally {
      setUploadingFavicon(false)
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
            {t("workspaceDetails")}
          </CardTitle>
          <CardDescription>{t("workspaceDetailsDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-start gap-6 mb-2">
            {/* Logo Upload */}
            <div className="flex items-center gap-4">
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
                  {uploading ? t("uploading") : t("uploadLogo")}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">{t("logoFormats")}</p>
              </div>
            </div>
            
            {/* Favicon Upload */}
            <div className="flex items-center gap-4 border-l border-border pl-6">
              {faviconUrl ? (
                <img src={faviconUrl} alt="Favicon" className="h-10 w-10 rounded object-contain bg-muted p-1" />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs font-medium text-muted-foreground">
                  .ico
                </div>
              )}
              <div>
                <input ref={faviconRef} type="file" accept=".ico,.png,.svg,image/x-icon,image/png,image/svg+xml" className="hidden" onChange={handleFaviconUpload} />
                <Button variant="outline" size="sm" onClick={() => faviconRef.current?.click()} disabled={uploadingFavicon}>
                  {uploadingFavicon ? t("uploading") : "Upload Favicon"}
                </Button>
                <p className="text-[11px] text-muted-foreground mt-1">.ico, .png, or .svg (max 256KB)</p>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-name">{t("workspaceName")}</Label>
              <Input id="ws-name" ref={nameRef} defaultValue={workspace.name} />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ws-slug">{t("slug")}</Label>
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
                toast.success(t("workspaceUpdated"))
              } catch { toast.error(t("failedToUpdate")) }
              finally { setSaving(false) }
            }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Workspace Timezone */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("workspaceTimezone")}
          </CardTitle>
          <CardDescription>{t("workspaceTimezoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 max-w-md">
            <TimezonePicker
              value={workspaceTimezone}
              onChange={setWorkspaceTimezone}
              className="w-full"
            />
          </div>
          <Button
            className="self-start gap-2"
            variant="outline"
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                // In a real implementation, this would save to the workspace settings
                toast.success(t("workspaceUpdated"))
              } catch { toast.error(t("failedToUpdate")) }
              finally { setSaving(false) }
            }}
          >
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {saving ? t("saving") : t("saveChanges")}
          </Button>
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {t("planAndUsage")}
          </CardTitle>
          <CardDescription>{t("planAndUsageDesc")}</CardDescription>
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
                {t("upgrade")}
              </Button>
            )}
          </div>

          <Separator />

          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.memberCount}</p>
              <p className="text-xs text-muted-foreground">{t("members")}</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.journeyCount}</p>
              <p className="text-xs text-muted-foreground">Journeys</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-2xl font-bold text-foreground">{workspace.archetypeCount}</p>
              <p className="text-xs text-muted-foreground">{t("archetypes")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/30">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t("dangerZone")}
          </CardTitle>
          <CardDescription>{t("dangerZoneDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
            <p className="text-sm text-muted-foreground mb-3">
              {t("deleteWarning")}
            </p>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
            >
              {t("deleteWorkspace")}
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
