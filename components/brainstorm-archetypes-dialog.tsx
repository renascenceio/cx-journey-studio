"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Loader2, 
  Sparkles, 
  ArrowRight, 
  Check, 
  Users,
  ChevronDown,
} from "lucide-react"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { INDUSTRIES } from "@/lib/industries"

// Use shared INDUSTRIES from lib/industries.ts
const CATEGORIES = INDUSTRIES

// Basic idea type (stage 1)
interface ArchetypeIdea {
  id: string
  name: string
  subtitle: string
  role: string
  description: string
  keyTrait: string
  selected: boolean
}

// Full archetype type (stage 2)
interface GeneratedArchetype {
  name: string
  role: string
  subtitle: string
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
  pillarRatings: { name: string; score: number; group: string }[]
  radarCharts: { label: string; dimensions: { axis: string; value: number }[] }[]
}

interface BrainstormArchetypesDialogProps {
  children: React.ReactNode
  onArchetypesCreated?: () => void
}

export function BrainstormArchetypesDialog({ children, onArchetypesCreated }: BrainstormArchetypesDialogProps) {
  const t = useTranslations()
  const [open, setOpen] = useState(false)
  const [stage, setStage] = useState<"input" | "ideas" | "enriching" | "complete">("input")
  
  // Form state
  const [category, setCategory] = useState("")
  const [context, setContext] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  
  // Ideas state
  const [ideas, setIdeas] = useState<ArchetypeIdea[]>([])
  const [generating, setGenerating] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [enrichProgress, setEnrichProgress] = useState<{ current: number; total: number; name: string } | null>(null)
  
  const selectedCount = ideas.filter(i => i.selected).length

  const handleGenerateIdeas = async () => {
    if (!category) {
      toast.error("Please select a category")
      return
    }
    
    setGenerating(true)
    try {
      const res = await fetch("/api/ai/brainstorm-archetypes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          category, 
          context, 
          targetAudience,
          count: 9 
        }),
      })
      
      if (!res.ok) {
        throw new Error("Failed to generate ideas")
      }
      
      const { ideas: generatedIdeas } = await res.json()
      setIdeas(generatedIdeas.map((idea: Omit<ArchetypeIdea, "id" | "selected">, idx: number) => ({
        ...idea,
        id: `idea-${idx}`,
        selected: false,
      })))
      setStage("ideas")
    } catch (error) {
      console.error(error)
      toast.error("Failed to generate archetype ideas")
    } finally {
      setGenerating(false)
    }
  }

  const toggleIdea = (id: string) => {
    setIdeas(prev => prev.map(idea => 
      idea.id === id ? { ...idea, selected: !idea.selected } : idea
    ))
  }

  const handleEnrichAndSave = async () => {
    const selectedIdeas = ideas.filter(i => i.selected)
    if (selectedIdeas.length === 0) {
      toast.error("Please select at least one archetype to create")
      return
    }
    
    setStage("enriching")
    setEnriching(true)
    
    try {
      // Enrich and save each selected idea one at a time
      let savedCount = 0
      const totalCount = selectedIdeas.length
      
      for (let i = 0; i < selectedIdeas.length; i++) {
        const idea = selectedIdeas[i]
        setEnrichProgress({ current: i + 1, total: totalCount, name: idea.name })
        
        // Enrich single idea into full archetype
        const enrichRes = await fetch("/api/ai/enrich-archetype", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idea, category }),
        })
        
        if (!enrichRes.ok) {
          console.error("Failed to enrich:", idea.name)
          continue
        }
        
        const { archetype } = await enrichRes.json() as { archetype: GeneratedArchetype }
        
        // Save the enriched archetype
        const createRes = await fetch("/api/archetypes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
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
            pillar_ratings: archetype.pillarRatings,
            radar_charts: archetype.radarCharts,
          }),
        })
        
        if (createRes.ok) {
          savedCount++
        } else {
          const errData = await createRes.json()
          console.error("[v0] Failed to save archetype:", idea.name, errData)
        }
      }
      
      if (savedCount === 0) {
        throw new Error("Failed to save any archetypes - check console for details")
      }
      
      setStage("complete")
      toast.success(`${savedCount} archetypes created successfully`)
      onArchetypesCreated?.()
      
      // Reset and close after delay
      setTimeout(() => {
        setOpen(false)
        resetDialog()
      }, 1500)
      
    } catch (error) {
      console.error(error)
      toast.error("Failed to create archetypes")
      setStage("ideas")
    } finally {
      setEnriching(false)
      setEnrichProgress(null)
    }
  }

  const resetDialog = () => {
    setStage("input")
    setCategory("")
    setContext("")
    setTargetAudience("")
    setIdeas([])
    setEnrichProgress(null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetDialog() }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {stage === "input" && "Brainstorm Archetypes"}
            {stage === "ideas" && "Select Archetypes to Create"}
            {stage === "enriching" && "Creating Your Archetypes"}
            {stage === "complete" && "Archetypes Created"}
          </DialogTitle>
          <DialogDescription>
            {stage === "input" && "Describe what kind of archetypes you want to create and we'll generate ideas for you."}
            {stage === "ideas" && `Select the archetypes you'd like to fully develop. ${selectedCount} selected.`}
            {stage === "enriching" && "We're enriching your selected archetypes with detailed profiles..."}
            {stage === "complete" && "Your archetypes have been created and added to the library."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4">
          {/* Stage 1: Input Form */}
          {stage === "input" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <Label>Industry Category *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-between">
                      <span className="flex items-center gap-2">
                        {(() => {
                          const cat = CATEGORIES.find(c => c.value === category)
if (cat) {
                          const Icon = cat.icon
                          return <><Icon className="h-3.5 w-3.5" />{t(cat.labelKey)}</>
                        }
                        return "Select a category..."
                        })()}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-3" align="start">
                    <div className="flex gap-4">
                      {(() => {
                        const columns: typeof CATEGORIES[] = []
                        for (let i = 0; i < CATEGORIES.length; i += 8) {
                          columns.push(CATEGORIES.slice(i, i + 8))
                        }
                        return columns.map((col, colIdx) => (
                          <div key={colIdx} className="flex flex-col gap-0.5">
                            {col.map(cat => {
                              const Icon = cat.icon
                              return (
                                <button
                                  key={cat.value}
                                  onClick={() => setCategory(cat.value)}
                                  className={cn(
                                    "flex items-center gap-2 text-left text-xs px-2 py-1.5 rounded-md transition-colors whitespace-nowrap",
                                    category === cat.value 
                                      ? "bg-primary text-primary-foreground" 
                                      : "hover:bg-muted"
                                  )}
                                >
<Icon className="h-3.5 w-3.5 shrink-0" />
                                {t(cat.labelKey)}
                              </button>
                              )
                            })}
                          </div>
                        ))
                      })()}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="flex flex-col gap-2">
                <Label>Target Audience (optional)</Label>
                <Input
                  placeholder="e.g., first-time home buyers, premium customers, young professionals..."
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <Label>Additional Context (optional)</Label>
                <Textarea
                  placeholder="Describe any specific characteristics, behaviors, or segments you want to explore. For example: 'Focus on digital-native customers who prefer mobile interactions' or 'Include both cost-conscious and premium segments'..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          {/* Stage 2: Ideas Grid */}
          {stage === "ideas" && (
            <div className="grid grid-cols-3 gap-3">
              {ideas.map((idea) => (
                <Card 
                  key={idea.id}
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    idea.selected 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:border-muted-foreground/20"
                  )}
                  onClick={() => toggleIdea(idea.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-foreground">{idea.name}</h4>
                        {idea.subtitle && (
                          <p className="text-[10px] text-muted-foreground italic">{idea.subtitle}</p>
                        )}
                      </div>
                      <Checkbox 
                        checked={idea.selected}
                        className="mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleIdea(idea.id)}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{idea.role}</p>
                    <p className="text-xs text-foreground/80 line-clamp-3">{idea.description}</p>
                    <Badge variant="secondary" className="mt-2 text-[9px]">{idea.keyTrait}</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          
          {/* Stage 3: Enriching */}
          {stage === "enriching" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              {enrichProgress ? (
                <>
                  <p className="text-lg font-medium text-foreground">
                    Creating archetype {enrichProgress.current} of {enrichProgress.total}
                  </p>
                  <p className="text-sm text-primary font-medium">{enrichProgress.name}</p>
                  <div className="w-64 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${(enrichProgress.current / enrichProgress.total) * 100}%` }}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Preparing archetypes...</p>
              )}
              <div className="flex flex-wrap justify-center gap-2 max-w-md mt-2">
                {ideas.filter(i => i.selected).map((idea, idx) => (
                  <Badge 
                    key={idea.id} 
                    variant={enrichProgress && idx < enrichProgress.current ? "default" : "outline"}
                    className={enrichProgress && idx < enrichProgress.current ? "bg-green-500" : ""}
                  >
                    {idea.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {/* Stage 4: Complete */}
          {stage === "complete" && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-lg font-medium text-foreground">Archetypes Created!</p>
              <p className="text-sm text-muted-foreground">
                {selectedCount} new archetypes have been added to your library.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          {stage === "input" && (
            <Button onClick={handleGenerateIdeas} disabled={generating || !category}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Ideas...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate 9 Ideas
                </>
              )}
            </Button>
          )}
          
          {stage === "ideas" && (
            <div className="flex items-center gap-3 w-full justify-between">
              <Button variant="outline" onClick={() => setStage("input")}>
                Back
              </Button>
              <Button onClick={handleEnrichAndSave} disabled={selectedCount === 0}>
                <ArrowRight className="h-4 w-4 mr-2" />
                Create {selectedCount} Archetype{selectedCount !== 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
