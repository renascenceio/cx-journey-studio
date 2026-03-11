"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Sparkles, Loader2 } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createArchetype } from "@/lib/actions/data"
import { useSound } from "@/components/sound-provider"
import type { Journey } from "@/lib/types"
import { INDUSTRIES } from "@/lib/industries"

interface CreateArchetypeDialogProps {
  children: React.ReactNode
  journeys: Journey[]
}

// Use shared INDUSTRIES from lib/industries.ts
const CATEGORIES = INDUSTRIES

export function CreateArchetypeDialog({ children, journeys }: CreateArchetypeDialogProps) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [role, setRole] = useState("")
  const [subtitle, setSubtitle] = useState("")
  const [category, setCategory] = useState("e-commerce")
  const [journeyId, setJourneyId] = useState(journeys[0]?.id || "")
  const [description, setDescription] = useState("")
  const [goalsInput, setGoalsInput] = useState("")
  const [frustrationsInput, setFrustrationsInput] = useState("")
  const [isPending, startTransition] = useTransition()
  const [mode, setMode] = useState<"manual" | "ai">("manual")
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)
  // Extra AI-populated fields stored for submission
  const [aiExtras, setAiExtras] = useState<Record<string, string[]>>({})
  const [aiNarratives, setAiNarratives] = useState<Record<string, string>>({})
  const router = useRouter()
  const { play } = useSound()

  async function handleAiGenerate() {
    if (!aiPrompt.trim() || !category) return
    setAiGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, category }),
      })
      if (!res.ok) throw new Error("Generation failed")
      const { archetype } = await res.json()
      if (archetype) {
        setName(archetype.name || "")
        setRole(archetype.role || "")
        setSubtitle(archetype.subtitle || "")
        setDescription(archetype.description || "")
        setGoalsInput((archetype.goals || []).join(", "))
        setFrustrationsInput((archetype.frustrations || []).join(", "))
        // Store all extra fields from AI
        setAiExtras({
          behaviors: archetype.behaviors || [],
          expectations: archetype.expectations || [],
          barriers: archetype.barriers || [],
          drivers: archetype.drivers || [],
          importantSteps: archetype.importantSteps || [],
          triggers: archetype.triggers || [],
          mindset: archetype.mindset || [],
          solutionPrinciples: archetype.solutionPrinciples || [],
        })
        setAiNarratives({
          goalsNarrative: archetype.goalsNarrative || "",
          needsNarrative: archetype.needsNarrative || "",
          touchpointsNarrative: archetype.touchpointsNarrative || "",
        })
        setMode("manual")
        play("ai-complete")
        toast.success("Archetype generated! Review and adjust the fields below.")
      }
    } catch {
      toast.error("René AI generation failed. Check your API key in admin settings.")
    } finally {
      setAiGenerating(false)
    }
  }

  function resetForm() {
    setName("")
    setRole("")
    setSubtitle("")
    setCategory("e-commerce")
    setJourneyId(journeys[0]?.id || "")
    setDescription("")
    setGoalsInput("")
    setFrustrationsInput("")
  }

  function handleSubmit() {
    if (!name.trim() || !role.trim() || !journeyId) return

    const goals = goalsInput.split(",").map((g) => g.trim()).filter(Boolean)
    const frustrations = frustrationsInput.split(",").map((f) => f.trim()).filter(Boolean)

    startTransition(async () => {
      try {
        await createArchetype({
          journeyId,
          name: name.trim(),
          role: role.trim(),
          subtitle: subtitle.trim() || undefined,
          category,
          description: description.trim() || undefined,
          goals,
          frustrations,
          behaviors: aiExtras.behaviors || [],
          expectations: aiExtras.expectations || [],
          barriers: aiExtras.barriers || [],
          drivers: aiExtras.drivers || [],
          importantSteps: aiExtras.importantSteps || [],
          triggers: aiExtras.triggers || [],
          mindset: aiExtras.mindset || [],
          solutionPrinciples: aiExtras.solutionPrinciples || [],
          goalsNarrative: aiNarratives.goalsNarrative || undefined,
          needsNarrative: aiNarratives.needsNarrative || undefined,
          touchpointsNarrative: aiNarratives.touchpointsNarrative || undefined,
        })
        play("archetype-added")
        toast.success("Archetype created successfully")
        setOpen(false)
        resetForm()
        router.refresh()
      } catch {
        play("error")
        toast.error("Failed to create archetype. Please make sure you are logged in.")
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Create Archetype</DialogTitle>
          <DialogDescription>
            Define a new customer archetype to map personas across your journeys.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle: Manual vs AI */}
        <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
          <button
            onClick={() => setMode("manual")}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "manual" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Manual
          </button>
          <button
            onClick={() => setMode("ai")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              mode === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            René AI
          </button>
        </div>

        {mode === "ai" && (
          <div className="flex flex-col gap-3 rounded-lg border border-primary/20 bg-primary/[0.02] p-4">
            <div className="flex flex-col gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" sideOffset={4} className="z-[110]">
                  {CATEGORIES.map((c) => {
                    const Icon = c.icon
                    return (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5" />
                          {c.label}
                        </span>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Describe the persona you want to create</Label>
              <Textarea
                placeholder="e.g., A busy working parent in their 30s who values convenience and speed when shopping online for their family. They're price-sensitive but willing to pay more for quality..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
            <Button
              onClick={handleAiGenerate}
              disabled={!aiPrompt.trim() || aiGenerating}
              className="gap-1.5"
            >
              {aiGenerating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Generate Archetype</>
              )}
            </Button>
            <p className="text-[10px] text-muted-foreground">
              René AI will generate all fields. You can review and edit before saving.
            </p>
          </div>
        )}

        <div className="flex flex-col gap-4 py-2 max-h-[60vh] overflow-y-auto pr-1" style={{ display: mode === "ai" && !name ? "none" : "flex" }}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="arch-name">Name</Label>
              <Input
                id="arch-name"
                placeholder="e.g., Sarah Chen"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="arch-role">Role / Persona</Label>
              <Input
                id="arch-role"
                placeholder="e.g., Tech-Savvy Shopper"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-subtitle">Subtitle (optional)</Label>
            <Input
              id="arch-subtitle"
              placeholder="e.g., Expects fast, seamless digital experiences"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-journey">Linked Journey</Label>
            <Select value={journeyId} onValueChange={setJourneyId}>
              <SelectTrigger id="arch-journey">
                <SelectValue placeholder="Select journey" />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="z-[110]">
                {journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="arch-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" sideOffset={4} className="z-[110]">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-desc">Description (optional)</Label>
            <Textarea
              id="arch-desc"
              placeholder="Brief description of this persona..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="resize-none"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-goals">Goals (comma-separated)</Label>
            <Input
              id="arch-goals"
              placeholder="e.g., Find deals quickly, Fast checkout"
              value={goalsInput}
              onChange={(e) => setGoalsInput(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="arch-frustrations">Frustrations (comma-separated)</Label>
            <Input
              id="arch-frustrations"
              placeholder="e.g., Slow pages, Complex forms"
              value={frustrationsInput}
              onChange={(e) => setFrustrationsInput(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || !role.trim() || !journeyId || isPending}>
            {isPending ? "Creating..." : "Create Archetype"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
