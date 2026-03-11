"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { addStage, addStep, addTouchPoint, deleteStage, deleteStep } from "@/lib/actions/data"
import { toast } from "sonner"
import { mutate } from "swr"
import { Sparkles, Loader2 } from "lucide-react"

interface AddStageDialogProps {
  journeyId: string
  journeyTitle?: string
  children: React.ReactNode
}

export function AddStageDialog({ journeyId, journeyTitle, children }: AddStageDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiPreview, setAiPreview] = useState<{ steps: { name: string; description: string; touchpoints: { channel: string; description: string; emotionalScore: number }[] }[] } | null>(null)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await addStage(journeyId, name.trim())
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(`Stage "${name}" added`)
      setName("")
      setDescription("")
      setAiPreview(null)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add stage")
    } finally {
      setLoading(false)
    }
  }

  async function generateWithAI() {
    if (!name.trim()) {
      toast.error("Enter a stage name first")
      return
    }
    setAiLoading(true)
    try {
      const res = await fetch("/api/ai/generate-stage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName: name.trim(),
          description: description.trim() || name.trim(),
          journeyTitle: journeyTitle || "Customer Journey",
        }),
      })
      if (!res.ok) throw new Error("Failed")
      const data = await res.json()
      setAiPreview(data)
      toast.success(`René AI generated ${data.steps?.length || 0} steps for "${name}"`)
    } catch {
      toast.error("René AI generation failed. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  async function handleSubmitWithAI() {
    if (!name.trim() || !aiPreview) return
    setLoading(true)
    try {
      const stageId = await addStage(journeyId, name.trim())
      // Create each AI-generated step and its touchpoints
      for (const step of aiPreview.steps) {
        const stepId = await addStep(stageId, journeyId, step.name, step.description)
        for (const tp of step.touchpoints) {
          await addTouchPoint(stepId, journeyId, {
            description: tp.description,
            channel: tp.channel,
            emotionalScore: tp.emotionalScore,
          })
        }
      }
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(`Stage "${name}" created with ${aiPreview.steps.length} René AI-generated steps`)
      setName("")
      setDescription("")
      setAiPreview(null)
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create stage with René AI content")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setAiPreview(null); setDescription("") } }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Stage</DialogTitle>
          <DialogDescription>Add a new stage to this journey. Stages represent major phases of the experience.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="stage-name">Stage Name</Label>
            <Input
              id="stage-name"
              placeholder="e.g. Discovery, Onboarding, Purchase"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !aiPreview && handleSubmit()}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="stage-desc">Description (optional, helps AI)</Label>
            <Input
              id="stage-desc"
              placeholder="e.g. Customer discovers our product through ads, search..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* AI Preview */}
          {aiPreview && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.03] p-3 max-h-60 overflow-y-auto">
              <p className="text-[10px] font-medium uppercase tracking-wider text-primary mb-2">René AI-Generated Steps Preview</p>
              <div className="flex flex-col gap-2">
                {aiPreview.steps.map((step, i) => (
                  <div key={i} className="rounded-md bg-background border border-border/60 p-2.5">
                    <p className="text-xs font-medium text-foreground">{step.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{step.description}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {step.touchpoints.map((tp, j) => (
                        <span key={j} className="rounded bg-muted px-1.5 py-0.5 text-[9px] text-muted-foreground">
                          {tp.channel} ({tp.emotionalScore > 0 ? "+" : ""}{tp.emotionalScore})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {!aiPreview ? (
            <>
              <Button variant="outline" onClick={generateWithAI} disabled={!name.trim() || aiLoading} className="gap-1.5">
                {aiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {aiLoading ? "Generating..." : "Generate with René AI"}
              </Button>
              <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
                {loading ? "Adding..." : "Add Empty Stage"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setAiPreview(null)}>Discard</Button>
              <Button onClick={handleSubmitWithAI} disabled={loading} className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {loading ? "Creating..." : "Create with René AI Content"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddStepDialogProps {
  stageId: string
  journeyId: string
  stageName: string
  children: React.ReactNode
}

export function AddStepDialog({ stageId, journeyId, stageName, children }: AddStepDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    if (!name.trim()) return
    setLoading(true)
    try {
      await addStep(stageId, journeyId, name.trim(), description.trim() || undefined)
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(`Step "${name}" added to ${stageName}`)
      setName("")
      setDescription("")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add step")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Step to {stageName}</DialogTitle>
          <DialogDescription>Steps represent specific actions or moments within a stage.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="step-name">Step Name</Label>
            <Input
              id="step-name"
              placeholder="e.g. Browse Products, Complete Form"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="step-desc">Description (optional)</Label>
            <Textarea
              id="step-desc"
              placeholder="What happens at this step?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || loading}>
            {loading ? "Adding..." : "Add Step"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AddTouchPointDialogProps {
  stepId: string
  journeyId: string
  stepName: string
  children: React.ReactNode
}

export function AddTouchPointDialog({ stepId, journeyId, stepName, children }: AddTouchPointDialogProps) {
  const [open, setOpen] = useState(false)
  const [channel, setChannel] = useState("Web")
  const [description, setDescription] = useState("")
  const [score, setScore] = useState([0])
  const [loading, setLoading] = useState(false)

  function scoreLabel(val: number) {
    if (val <= -4) return "Very Negative"
    if (val <= -2) return "Negative"
    if (val <= -1) return "Slightly Negative"
    if (val === 0) return "Neutral"
    if (val <= 1) return "Slightly Positive"
    if (val <= 3) return "Positive"
    return "Very Positive"
  }

  function scoreColorClass(val: number) {
    if (val <= -3) return "text-red-600 dark:text-red-400"
    if (val <= -1) return "text-orange-500 dark:text-orange-400"
    if (val <= 1) return "text-yellow-500 dark:text-yellow-400"
    if (val <= 3) return "text-emerald-500 dark:text-emerald-400"
    return "text-green-600 dark:text-green-400"
  }

  async function handleSubmit() {
    if (!description.trim()) return
    setLoading(true)
    try {
      await addTouchPoint(stepId, journeyId, {
        channel,
        description: description.trim(),
        emotionalScore: 0, // Will be calculated from pain points and highlights
      })
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success("Touchpoint added")
      setDescription("")
      setScore([0])
      setChannel("Web")
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add touch point")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Touchpoint</DialogTitle>
          <DialogDescription>Add a customer interaction point to "{stepName}".</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="tp-channel">Touchpoint Type</Label>
            <div className="relative">
              <Input
                id="tp-channel"
                placeholder="e.g. Web, Mobile, Email, or type custom..."
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                list="channel-suggestions"
                autoComplete="off"
              />
              <datalist id="channel-suggestions">
                {["Web", "Mobile App", "Email", "Phone", "Live Chat", "Social Media", "Physical Store", "SMS", "In-App", "Self-Service Portal", "Kiosk", "Mail"].map((ch) => (
                  <option key={ch} value={ch} />
                ))}
              </datalist>
            </div>
            <p className="text-[10px] text-muted-foreground">Select a suggestion or type a custom touchpoint type</p>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="tp-desc">Description</Label>
            <Textarea
              id="tp-desc"
              placeholder="Describe this customer interaction..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <p className="text-[10px] text-muted-foreground bg-muted/50 rounded p-2">
            The touchpoint's emotional score will be calculated automatically based on its pain points and highlights.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!description.trim() || loading}>
            {loading ? "Adding..." : "Add Touchpoint"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface DeleteConfirmDialogProps {
  title: string
  description: string
  onConfirm: () => Promise<void>
  children: React.ReactNode
}

export function DeleteConfirmDialog({ title, description, onConfirm, children }: DeleteConfirmDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleConfirm() {
    setLoading(true)
    try {
      await onConfirm()
      setOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
