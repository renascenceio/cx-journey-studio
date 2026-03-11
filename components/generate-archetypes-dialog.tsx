"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Sparkles, Loader2, Check, ChevronDown, ChevronUp, Lightbulb, Target, Users } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"
import { useSound } from "@/components/sound-provider"

interface GeneratedArchetype {
  name: string
  role: string
  subtitle: string | null
  description: string
  goalsNarrative: string
  needsNarrative: string
  touchpointsNarrative: string
  goals: string[]
  frustrations: string[]
  behaviors: string[]
  expectations: string[]
  barriers: string[]
  drivers: string[]
  triggers: string[]
  mindset: string[]
  importantSteps: string[]
  solutionPrinciples: string[]
  tags: string[]
  valueMetric: string | null
  basePercentage: string | null
  pillarRatings: { name: string; score: number; group: "higher_order" | "basic_order" }[]
  radarCharts: { label: string; dimensions: { axis: string; value: number }[] }[]
}

interface ExistingArchetype {
  id: string
  name: string
  role?: string
  description?: string
  tags?: string[]
}

interface GenerateArchetypesDialogProps {
  children: React.ReactNode
  journeyId: string
  journeyCategory?: string
  existingArchetypes?: ExistingArchetype[]
  onArchetypesCreated?: () => void
}

function ArchetypeCard({ 
  archetype, 
  selected, 
  onToggle 
}: { 
  archetype: GeneratedArchetype
  selected: boolean
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn(
      "rounded-lg border transition-all",
      selected 
        ? "border-primary bg-primary/5 shadow-sm" 
        : "border-border/60 hover:border-border"
    )}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4">
        <Checkbox 
          checked={selected} 
          onCheckedChange={onToggle}
          className="mt-1"
        />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-sm font-bold text-foreground uppercase tracking-wide">{archetype.name}</h4>
          </div>
          {archetype.subtitle && (
            <p className="text-xs text-primary font-medium mt-0.5">{archetype.subtitle}</p>
          )}
          <p className="text-[10px] text-muted-foreground mt-0.5">{archetype.role}</p>
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{archetype.description}</p>
        </div>
      </div>

      {/* Expand/Collapse */}
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-center gap-1 py-2 text-xs text-muted-foreground hover:text-foreground border-t border-border/40 transition-colors">
            {expanded ? (
              <><ChevronUp className="h-3 w-3" /> Hide Details</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Show Details</>
            )}
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4">
            {/* Narratives */}
            <div className="space-y-2">
              <div className="rounded bg-muted/50 p-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Goals (I want)</p>
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">{archetype.goalsNarrative}</p>
              </div>
              <div className="rounded bg-muted/50 p-2">
                <p className="text-[10px] font-semibold uppercase text-muted-foreground mb-1">Needs (I do)</p>
                <p className="text-[11px] text-foreground leading-relaxed line-clamp-3">{archetype.needsNarrative}</p>
              </div>
            </div>

            {/* Drivers & Barriers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                  <Target className="h-3 w-3 text-emerald-500" />
                  Drivers
                </p>
                <ul className="space-y-1">
                  {archetype.drivers.slice(0, 4).map((driver, i) => (
                    <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      {driver}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">Barriers</p>
                <ul className="space-y-1">
                  {archetype.barriers.slice(0, 4).map((barrier, i) => (
                    <li key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-red-500 mt-1.5 shrink-0" />
                      {barrier}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Solution Principles */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                <Lightbulb className="h-3 w-3 text-primary" />
                Solution Principles
              </p>
              <div className="space-y-1.5">
                {archetype.solutionPrinciples.slice(0, 3).map((principle, i) => (
                  <div key={i} className="flex items-start gap-2 rounded bg-primary/5 p-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[9px] font-bold text-primary">
                      {i + 1}
                    </span>
                    <p className="text-[11px] text-foreground leading-relaxed">{principle}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Mindset */}
            <div className="flex flex-wrap gap-1">
              {archetype.mindset.map((trait, i) => (
                <Badge key={i} variant="outline" className="text-[9px]">{trait}</Badge>
              ))}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}

export function GenerateArchetypesDialog({ 
  children, 
  journeyId,
  journeyCategory = "e-commerce",
  existingArchetypes = [],
  onArchetypesCreated 
}: GenerateArchetypesDialogProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<"input" | "select">("input")
  const [prompt, setPrompt] = useState("")
  const [generating, setGenerating] = useState(false)
  const [generatedArchetypes, setGeneratedArchetypes] = useState<GeneratedArchetype[]>([])
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set())
  const [saving, setSaving] = useState(false)
  const { play } = useSound()

  // Use journey category directly - no selector needed
  const category = journeyCategory

  function reset() {
    setStep("input")
    setPrompt("")
    setGeneratedArchetypes([])
    setSelectedIndices(new Set())
  }

  async function handleGenerate() {
    if (!prompt.trim()) return
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/generate-archetype", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          prompt, 
          category, 
          generateMultiple: true,
          existingArchetypes: existingArchetypes.map(a => ({
            name: a.name,
            role: a.role,
            description: a.description,
            tags: a.tags,
          })),
        }),
      })
      if (!res.ok) throw new Error("Generation failed")
      const { archetypes } = await res.json()
      if (archetypes && archetypes.length > 0) {
        setGeneratedArchetypes(archetypes)
        setSelectedIndices(new Set([0])) // Select first by default
        setStep("select")
        play("ai-complete")
        toast.success(`Generated ${archetypes.length} archetypes!`)
      } else {
        throw new Error("No archetypes generated")
      }
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate archetypes. Please try again.")
    } finally {
      setGenerating(false)
    }
  }

  function toggleSelection(index: number) {
    setSelectedIndices(prev => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  async function handleSave() {
    if (selectedIndices.size === 0) {
      toast.error("Please select at least one archetype")
      return
    }

    setSaving(true)
    try {
      const selectedArchetypes = Array.from(selectedIndices).map(i => generatedArchetypes[i])
      
      // Create each selected archetype in the database (linked to the journey)
      for (const archetype of selectedArchetypes) {
        const createRes = await fetch("/api/archetypes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            journey_id: journeyId,
            name: archetype.name,
            role: archetype.role,
            subtitle: archetype.subtitle,
            category,
            description: archetype.description,
            goals_narrative: archetype.goalsNarrative,
            needs_narrative: archetype.needsNarrative,
            touchpoints_narrative: archetype.touchpointsNarrative,
            goals: archetype.goals,
            frustrations: archetype.frustrations,
            behaviors: archetype.behaviors,
            expectations: archetype.expectations,
            barriers: archetype.barriers,
            drivers: archetype.drivers,
            triggers: archetype.triggers,
            mindset: archetype.mindset,
            important_steps: archetype.importantSteps,
            solution_principles: archetype.solutionPrinciples,
            tags: archetype.tags,
            value_metric: archetype.valueMetric,
            base_percentage: archetype.basePercentage,
            pillar_ratings: archetype.pillarRatings,
            radar_charts: archetype.radarCharts,
          }),
        })

        if (!createRes.ok) {
          const err = await createRes.json()
          console.error("[v0] Failed to create archetype:", archetype.name)
          console.error("[v0] Error details:", JSON.stringify(err, null, 2))
          const errorMsg = err.error?.message || err.error || `Failed to create archetype: ${archetype.name}`
          throw new Error(errorMsg)
        }
        console.log("[v0] Created archetype:", archetype.name)
      }

      play("archetype-added")
      toast.success(`Created ${selectedArchetypes.length} archetype(s) and linked to journey!`)
      setOpen(false)
      reset()
      onArchetypesCreated?.()
    } catch (error) {
      console.error(error)
      toast.error("Failed to save archetypes. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset() }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={cn(
        "transition-all",
        step === "select" ? "sm:max-w-3xl" : "sm:max-w-lg"
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            {step === "input" ? "Generate Archetypes" : "Select Archetypes"}
          </DialogTitle>
          <DialogDescription>
            {step === "input" 
              ? `Generate customer archetypes for ${category.replace(/_/g, " ")} journeys. Describe your target customers to get started.`
              : "Review the generated archetypes and select which ones to add to your journey."
            }
          </DialogDescription>
        </DialogHeader>

        {step === "input" ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium text-primary">Category: {category.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Archetypes will be generated for this journey's category</p>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Describe your target customers</Label>
              <Textarea
                placeholder="e.g., First-time home buyers looking for family homes. They prioritize security, good schools, and community. They research extensively online but value face-to-face interactions with agents..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={5}
                className="resize-none"
              />
              <p className="text-[10px] text-muted-foreground">
                Be specific about demographics, motivations, behaviors, and pain points. We'll generate 3 distinct behavioral archetypes.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 py-2 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {selectedIndices.size} of {generatedArchetypes.length} selected
              </p>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => {
                  if (selectedIndices.size === generatedArchetypes.length) {
                    setSelectedIndices(new Set())
                  } else {
                    setSelectedIndices(new Set(generatedArchetypes.map((_, i) => i)))
                  }
                }}
              >
                {selectedIndices.size === generatedArchetypes.length ? "Deselect All" : "Select All"}
              </Button>
            </div>

            {generatedArchetypes.map((archetype, index) => (
              <ArchetypeCard
                key={index}
                archetype={archetype}
                selected={selectedIndices.has(index)}
                onToggle={() => toggleSelection(index)}
              />
            ))}
          </div>
        )}

        <DialogFooter>
          {step === "select" && (
            <Button variant="outline" onClick={() => setStep("input")} disabled={saving}>
              Back
            </Button>
          )}
          <Button variant="outline" onClick={() => setOpen(false)} disabled={generating || saving}>
            Cancel
          </Button>
          {step === "input" ? (
            <Button onClick={handleGenerate} disabled={!prompt.trim() || generating} className="gap-1.5">
              {generating ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generating...</>
              ) : (
                <><Sparkles className="h-3.5 w-3.5" />Generate Archetypes</>
              )}
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={selectedIndices.size === 0 || saving} className="gap-1.5">
              {saving ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" />Saving...</>
              ) : (
                <><Check className="h-3.5 w-3.5" />Add {selectedIndices.size} to Journey</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
