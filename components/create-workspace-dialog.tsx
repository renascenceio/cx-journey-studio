"use client"

import { useState, useRef } from "react"
import { useTranslations } from "next-intl"
import { Building2, Upload, X, Check, Sparkles, Users, FolderKanban, Rocket } from "lucide-react"
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/lib/auth-provider"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface CreateWorkspaceDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
}

type CreationStep = "input" | "creating" | "success"

const MIN_ANIMATION_TIME = 2500 // Minimum time to show the full animation

export function CreateWorkspaceDialog({ open, onOpenChange, redirectTo = "/dashboard" }: CreateWorkspaceDialogProps) {
  const t = useTranslations()
  
  const PROGRESS_STEPS = [
    { label: t("createWorkspace.settingUp"), icon: Building2 },
    { label: t("createWorkspace.configuringPermissions"), icon: Users },
    { label: t("createWorkspace.creatingTeam"), icon: FolderKanban },
    { label: t("createWorkspace.finalizing"), icon: Sparkles },
  ]
  const [name, setName] = useState("")
  const [logo, setLogo] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [step, setStep] = useState<CreationStep>("input")
  const [progressIndex, setProgressIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [createdWorkspaceName, setCreatedWorkspaceName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { switchWorkspace, refreshWorkspaces } = useAuth()

  function resetForm() {
    setName("")
    setLogo(null)
    setLogoFile(null)
    setStep("input")
    setProgressIndex(0)
    setProgress(0)
    setCreatedWorkspaceName("")
  }

  async function handleLogoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (!file.type.startsWith("image/")) {
      toast.error(t("createWorkspace.pleaseSelectImage"))
      return
    }
    
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("createWorkspace.imageMustBeLess"))
      return
    }
    
    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogo(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile) return null
    
    try {
      const formData = new FormData()
      formData.append("file", logoFile)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      return data.url
    } catch {
      return null
    }
  }

  async function handleCreate() {
    if (!name.trim()) return
    
    setStep("creating")
    setCreatedWorkspaceName(name.trim())
    setProgressIndex(0)
    setProgress(0)

    const animationStartTime = Date.now()

    // Start progress animation - runs through all steps smoothly
    const stepDuration = MIN_ANIMATION_TIME / PROGRESS_STEPS.length
    let currentStepIndex = 0
    
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - animationStartTime
      const targetProgress = Math.min((elapsed / MIN_ANIMATION_TIME) * 100, 95)
      setProgress(targetProgress)
      
      // Update step index based on elapsed time
      const newStepIndex = Math.min(
        Math.floor(elapsed / stepDuration),
        PROGRESS_STEPS.length - 1
      )
      if (newStepIndex !== currentStepIndex) {
        currentStepIndex = newStepIndex
        setProgressIndex(newStepIndex)
      }
    }, 50)

    try {
      // Upload logo first if selected
      let logoUrl: string | null = null
      if (logoFile) {
        logoUrl = await uploadLogo()
      }

      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), logo: logoUrl }),
      })
      const data = await res.json()
      
      if (res.ok && data.id) {
        // Wait for minimum animation time to complete
        const elapsed = Date.now() - animationStartTime
        const remainingTime = Math.max(0, MIN_ANIMATION_TIME - elapsed)
        
        await new Promise(resolve => setTimeout(resolve, remainingTime))
        
        clearInterval(progressInterval)
        setProgress(100)
        setProgressIndex(PROGRESS_STEPS.length - 1)
        
        // Brief pause at 100% before success
        await new Promise(resolve => setTimeout(resolve, 300))
        
        await refreshWorkspaces()
        await switchWorkspace(data.id)
        
        // Show success state
        setStep("success")
      } else {
        clearInterval(progressInterval)
        toast.error(data.error || "Failed to create workspace")
        setStep("input")
      }
    } catch {
      clearInterval(progressInterval)
      toast.error("Failed to create workspace")
      setStep("input")
    }
  }

  function handleGoToWorkspace() {
    onOpenChange(false)
    resetForm()
    window.location.href = redirectTo
  }

  // Prevent closing during creation
  function handleOpenChange(newOpen: boolean) {
    if (step === "creating") return
    onOpenChange(newOpen)
    if (!newOpen) resetForm()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg overflow-hidden p-0">
        {step === "input" && (
          <div className="p-6">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">{t("createWorkspace.title")}</h2>
                <p className="text-sm text-muted-foreground">{t("createWorkspace.subtitle")}</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              {/* Logo upload - centered */}
              <div className="flex flex-col items-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "relative h-20 w-20 rounded-2xl border-2 border-dashed border-muted-foreground/20 hover:border-primary/40 transition-all duration-200 flex items-center justify-center overflow-hidden bg-muted/20 hover:bg-muted/40",
                    logo && "border-solid border-primary/30 bg-transparent"
                  )}
                >
                  {logo ? (
                    <>
                      <img src={logo} alt="Logo preview" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setLogo(null); setLogoFile(null) }}
                        className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:bg-destructive/90 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground/50" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <p className="text-xs text-muted-foreground">
                  {logo ? t("createWorkspace.clickToChangeLogo") : t("createWorkspace.uploadLogo")}
                </p>
              </div>

              {/* Name input */}
              <div className="space-y-2">
                <Label htmlFor="ws-name" className="text-sm font-medium">{t("createWorkspace.workspaceName")}</Label>
                <Input
                  id="ws-name"
                  placeholder={t("createWorkspace.workspaceNamePlaceholder")}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && name.trim() && handleCreate()}
                  className="h-11"
                  autoFocus
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                {t("common.cancel")}
              </Button>
              <Button disabled={!name.trim()} onClick={handleCreate} className="flex-1 gap-2">
                <Rocket className="h-4 w-4" />
                {t("createWorkspace.create")}
              </Button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="p-8 flex flex-col items-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              {(() => {
                const StepIcon = PROGRESS_STEPS[progressIndex]?.icon || Building2
                return <StepIcon className="h-8 w-8 text-primary animate-pulse" />
              })()}
            </div>
            
            <h2 className="text-xl font-semibold mb-2">{t("createWorkspace.creating", { name: createdWorkspaceName })}</h2>
            <p className="text-sm text-muted-foreground mb-8">
              {PROGRESS_STEPS[progressIndex]?.label || t("createWorkspace.settingUp")}
            </p>

            {/* Progress bar */}
            <div className="w-full max-w-xs mb-6">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-200 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">{Math.round(progress)}%</p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {PROGRESS_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all duration-300",
                    i < progressIndex ? "bg-primary" : i === progressIndex ? "bg-primary animate-pulse" : "bg-muted"
                  )}
                />
              ))}
            </div>
          </div>
        )}

        {step === "success" && (
          <div className="p-8 flex flex-col items-center text-center">
            <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center mb-6">
              <Check className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
            </div>
            
            <h2 className="text-2xl font-semibold mb-2">{t("createWorkspace.congratulations")}</h2>
            <p className="text-muted-foreground mb-2">
              {t("createWorkspace.workspaceReady", { name: createdWorkspaceName })}
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              {t("createWorkspace.startCreating")}
            </p>

            <Button onClick={handleGoToWorkspace} size="lg" className="gap-2 px-8">
              <Rocket className="h-4 w-4" />
              {t("createWorkspace.goToWorkspace")}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
