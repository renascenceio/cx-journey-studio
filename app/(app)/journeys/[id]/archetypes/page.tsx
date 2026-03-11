"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import useSWR from "swr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Textarea } from "@/components/ui/textarea"
import { useJourney } from "@/hooks/use-journey"
import { useArchetypes } from "@/hooks/use-archetypes"
import { GenerateArchetypesDialog } from "@/components/generate-archetypes-dialog"
import { 
  Plus, 
  Sparkles, 
  Users, 
  Library, 
  ExternalLink, 
  Lightbulb,
  MoreHorizontal,
  Trash2,
  Globe,
  Crown,
  User,
  ChevronRight,
  Check,
  Loader2,
  Wand2,
  X,
  Pencil,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import type { Archetype } from "@/lib/types"

import { getInitials } from "@/lib/utils"

// Infer category from journey tags
function inferCategoryFromTags(tags: string[]): string {
  const categoryMapping: Record<string, string> = {
    "e-commerce": "e-commerce",
    "ecommerce": "e-commerce",
    "retail": "e-commerce",
    "shopping": "e-commerce",
    "banking": "banking",
    "finance": "banking",
    "fintech": "banking",
    "healthcare": "healthcare",
    "medical": "healthcare",
    "health": "healthcare",
    "saas": "saas",
    "software": "saas",
    "real_estate": "real_estate",
    "real-estate": "real_estate",
    "property": "real_estate",
    "insurance": "insurance",
    "hospitality": "hospitality",
    "hotel": "hospitality",
    "travel": "hospitality",
    "telecommunications": "telecommunications",
    "telecom": "telecommunications",
  }
  
  for (const tag of tags) {
    const lowerTag = tag.toLowerCase()
    if (categoryMapping[lowerTag]) {
      return categoryMapping[lowerTag]
    }
  }
  return "e-commerce" // Default
}

const categoryColors: Record<string, string> = {
  "e-commerce": "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300",
  banking: "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300",
  healthcare: "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300",
  saas: "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300",
  real_estate: "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300",
  insurance: "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300",
  hospitality: "bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300",
  telecommunications: "bg-teal-100 text-teal-700 border-teal-200 dark:bg-teal-900/30 dark:text-teal-300",
}

interface SolutionEntry {
  id: string // unique ID for this solution entry
  archetypeId: string
  principleIndex: number
  stageId: string
  solution: string
  solutionId?: string
  appliedId?: string
}

// Add Archetype from Library Dialog
function AddArchetypeDialog({ 
  journeyId,
  journeyCategory,
  existingArchetypeIds,
  onAdd 
}: { 
  journeyId: string
  journeyCategory?: string
  existingArchetypeIds: string[]
  onAdd: (archetypeId: string) => void 
}) {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<"my" | "public" | "studio">("my")
  const [selectedId, setSelectedId] = useState<string>("")
  const { archetypes: allArchetypes } = useArchetypes()
  
  // Filter by category if journey has one
  const categoryFilteredArchetypes = journeyCategory 
    ? allArchetypes.filter(a => a.category === journeyCategory)
    : allArchetypes
  
  const myArchetypes = categoryFilteredArchetypes.filter(a => (a.visibility === "private" || !a.visibility) && !existingArchetypeIds.includes(a.id))
  const publicArchetypes = categoryFilteredArchetypes.filter(a => a.visibility === "public" && !existingArchetypeIds.includes(a.id))
  const studioArchetypes = categoryFilteredArchetypes.filter(a => a.visibility === "studio" && !existingArchetypeIds.includes(a.id))
  
  const currentList = tab === "my" ? myArchetypes : tab === "public" ? publicArchetypes : studioArchetypes
  
  function handleAdd() {
    if (!selectedId) return
    onAdd(selectedId)
    setSelectedId("")
    setOpen(false)
    toast.success("Archetype added to journey")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <Library className="h-3.5 w-3.5" />
          Add Archetype
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Archetype from Library</DialogTitle>
          <DialogDescription>Select an existing archetype to add to this journey.</DialogDescription>
        </DialogHeader>
        
        <Tabs value={tab} onValueChange={(v) => { setTab(v as typeof tab); setSelectedId("") }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="my" className="gap-1 text-xs">
              <User className="h-3 w-3" />
              My ({myArchetypes.length})
            </TabsTrigger>
            <TabsTrigger value="public" className="gap-1 text-xs">
              <Globe className="h-3 w-3" />
              Public ({publicArchetypes.length})
            </TabsTrigger>
            <TabsTrigger value="studio" className="gap-1 text-xs">
              <Crown className="h-3 w-3" />
              Studio ({studioArchetypes.length})
            </TabsTrigger>
          </TabsList>
          
          <div className="mt-4 max-h-64 overflow-y-auto">
            {currentList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Users className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {tab === "my" && "No archetypes available in your library."}
                  {tab === "public" && "No public archetypes available."}
                  {tab === "studio" && "No studio archetypes available yet."}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {currentList.map((archetype) => (
                  <button
                    key={archetype.id}
                    onClick={() => setSelectedId(archetype.id)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border p-3 text-left transition-colors",
                      selectedId === archetype.id 
                        ? "border-primary bg-primary/5" 
                        : "border-border/60 hover:border-primary/30 hover:bg-muted/50"
                    )}
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(archetype.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{archetype.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{archetype.role}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] shrink-0", categoryColors[archetype.category])}>
                      {archetype.category.replace(/_/g, " ")}
                    </Badge>
                    {selectedId === archetype.id && (
                      <Check className="h-4 w-4 text-primary shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </Tabs>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!selectedId}>
            Add to Journey
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Inline Solution Cell - displays solutions directly in the cell like journey canvas
function InlineSolutionCell({ 
  existingSolutions,
  onDelete,
  onEdit,
  onAdd,
  onGenerateAI,
  onSelect,
  selectedId,
  generating,
}: { 
  existingSolutions: SolutionEntry[]
  onDelete: (solutionId: string) => void
  onEdit: (sol: SolutionEntry) => void
  onAdd: () => void
  onGenerateAI: () => void
  onSelect: (sol: SolutionEntry) => void
  selectedId?: string
  generating?: boolean
}) {
  return (
    <div className="flex flex-col gap-1.5 p-1.5 min-h-[80px]">
      {/* Existing Solutions */}
      {existingSolutions.map((sol) => (
        <div 
          key={sol.id} 
          onClick={() => onSelect(sol)}
          className={cn(
            "group flex items-start gap-1 rounded p-1.5 cursor-pointer transition-colors",
            selectedId === sol.id 
              ? "bg-primary/20 ring-1 ring-primary" 
              : "bg-primary/5 hover:bg-primary/10"
          )}
        >
          <Lightbulb className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
          <p className="text-[9px] text-foreground leading-tight flex-1 line-clamp-3">{sol.solution}</p>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(sol) }}
              className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <Pencil className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(sol.id) }}
              className="h-4 w-4 flex items-center justify-center text-muted-foreground hover:text-destructive"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        </div>
      ))}
      
      {/* Action buttons */}
      <div className="flex items-center gap-1 mt-auto">
        <button
          onClick={onAdd}
          className="flex-1 flex items-center justify-center gap-1 rounded border border-dashed border-primary/30 py-1 text-[9px] text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-2.5 w-2.5" />
          Add
        </button>
        <button
          onClick={onGenerateAI}
          disabled={generating}
          className="flex items-center justify-center gap-1 rounded border border-dashed border-amber-500/30 py-1 px-2 text-[9px] text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Wand2 className="h-2.5 w-2.5" />
          )}
          AI
        </button>
      </div>
    </div>
  )
}

// Edit Solution Dialog
function EditSolutionDialog({
  open,
  onOpenChange,
  solution,
  onSave,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  solution: SolutionEntry | null
  onSave: (text: string) => void
  saving?: boolean
}) {
  const [text, setText] = useState("")
  
  // Update text when dialog opens with a solution
  if (open && solution && text !== solution.solution && text === "") {
    setText(solution.solution)
  }
  
  // Reset text when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setText("")
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Solution</DialogTitle>
        </DialogHeader>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
          placeholder="Enter solution..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(text); handleOpenChange(false) }} disabled={!text.trim() || saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Add Solution Dialog
function AddSolutionDialog({
  open,
  onOpenChange,
  context,
  onSave,
  saving,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: { archetypeName: string; principle: string; stageName: string } | null
  onSave: (text: string) => void
  saving?: boolean
}) {
  const [text, setText] = useState("")

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) setText("") }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Solution</DialogTitle>
          <DialogDescription>
            Add a solution for how this principle applies to the stage.
          </DialogDescription>
        </DialogHeader>
        {context && (
          <div className="space-y-2">
            <div className="rounded-md bg-muted/50 p-2">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Context</p>
              <p className="text-xs text-foreground">{context.archetypeName} - {context.stageName}</p>
            </div>
            <div className="rounded-md bg-primary/5 p-2">
              <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-0.5">Principle</p>
              <p className="text-xs text-foreground leading-relaxed">{context.principle}</p>
            </div>
          </div>
        )}
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="resize-none"
          placeholder="Describe how this principle should be implemented in this stage..."
        />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onSave(text); setText(""); onOpenChange(false) }} disabled={!text.trim() || saving}>
            {saving ? "Saving..." : "Add Solution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Database solution entry type
interface DbSolutionEntry {
  id: string
  archetype_id: string
  journey_id: string
  principle_index: number
  stage_id: string
  solution_text: string
  solution_id?: string
  applied_id?: string
}

export default function JourneyArchetypesPage() {
  const params = useParams()
  const journeyId = params.id as string
  const { journey, isLoading, mutate } = useJourney(journeyId)
  
  // Fetch persisted archetype solutions from database
  const fetcher = async (url: string) => {
    const res = await fetch(url)
    const data = await res.json()
    return Array.isArray(data) ? data : []
  }
  const { data: dbSolutions = [], mutate: mutateSolutions } = useSWR<DbSolutionEntry[]>(
    `/api/journeys/${journeyId}/archetype-solutions`,
    fetcher
  )
  
  // Convert DB solutions to local format
  const solutions: SolutionEntry[] = dbSolutions.map(s => ({
    id: s.id,
    archetypeId: s.archetype_id,
    principleIndex: s.principle_index,
    stageId: s.stage_id,
    solution: s.solution_text,
    solutionId: s.solution_id,
    appliedId: s.applied_id,
  }))
  
  const [saving, setSaving] = useState(false)
  const [generatingCell, setGeneratingCell] = useState<string | null>(null)
  const [generatingAll, setGeneratingAll] = useState<string | null>(null)
  
  // Dialog state for edit/add
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingSolution, setEditingSolution] = useState<SolutionEntry | null>(null)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addContext, setAddContext] = useState<{
    archetypeId: string
    archetypeName: string
    principleIndex: number
    principle: string
    stageId: string
    stageName: string
  } | null>(null)
  
  // Selected solution for right pane (like journey canvas)
  const [selectedSolution, setSelectedSolution] = useState<SolutionEntry | null>(null)
  
  function getSolutions(archetypeId: string, principleIndex: number, stageId: string): SolutionEntry[] {
    return solutions.filter(
      s => s.archetypeId === archetypeId && s.principleIndex === principleIndex && s.stageId === stageId
    )
  }
  
  async function saveSolution(
    archetypeId: string, 
    principleIndex: number, 
    stageId: string, 
    solution: string,
    archetypeName: string,
    principle: string,
    stageName: string,
    editId?: string
  ) {
    setSaving(true)
    try {
      if (editId) {
        // Update existing solution in database
        const res = await fetch(`/api/journeys/${journeyId}/archetype-solutions`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editId, solutionText: solution }),
        })
        if (!res.ok) throw new Error("Failed to update solution")
        await mutateSolutions()
        toast.success("Solution updated")
      } else {
        // 1. Create the solution in the solutions library
        const solutionRes = await fetch("/api/solutions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `${archetypeName}: ${stageName}`,
            description: solution,
            category: "archetype",
            tags: [archetypeName.toLowerCase(), stageName.toLowerCase(), "archetype-solution"],
            metadata: { archetypeId, principleIndex, principle },
          }),
        })
        
        if (!solutionRes.ok) throw new Error("Failed to save solution")
        const { id: solutionId } = await solutionRes.json()
        
        // 2. Apply it to the journey stage (General row)
        const applyRes = await fetch(`/api/journeys/${journeyId}/apply-solution`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            solutionId,
            stageId,
            notes: `From archetype "${archetypeName}" - Principle: ${principle}`,
          }),
        })
        
        const appliedData = applyRes.ok ? await applyRes.json() : null
        
        // 3. Save to archetype_solutions table for persistence
        const archSolRes = await fetch(`/api/journeys/${journeyId}/archetype-solutions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            archetypeId,
            principleIndex,
            stageId,
            solutionText: solution,
            solutionId,
            appliedId: appliedData?.id,
          }),
        })
        
        if (!archSolRes.ok) throw new Error("Failed to persist solution")
        
        await mutateSolutions()
        toast.success("Solution saved and applied to journey", {
          description: "This solution will appear in the Canvas Solutions row and Roadmap."
        })
      }
    } catch (error) {
      console.error("Failed to save solution:", error)
      toast.error("Failed to save solution")
    } finally {
      setSaving(false)
    }
  }
  
  async function deleteSolution(solutionEntryId: string) {
    const entry = solutions.find(s => s.id === solutionEntryId)
    if (!entry) return
    
    try {
      // Delete from applied solutions if it exists
      if (entry.appliedId) {
        await fetch(`/api/journeys/${journeyId}/apply-solution?id=${entry.appliedId}`, {
          method: "DELETE",
        })
      }
      
      // Delete from archetype_solutions table
      await fetch(`/api/journeys/${journeyId}/archetype-solutions?solutionId=${solutionEntryId}`, {
        method: "DELETE",
      })
      
      await mutateSolutions()
      if (selectedSolution?.id === solutionEntryId) {
        setSelectedSolution(null)
      }
      toast.success("Solution removed")
    } catch (error) {
      console.error("Failed to delete solution:", error)
      toast.error("Failed to delete solution")
    }
  }
  
  async function generateAISolution(
    archetypeId: string,
    principleIndex: number,
    stageId: string,
    archetypeName: string,
    archetypeDescription: string | undefined,
    principle: string,
    stageName: string,
    stageDescription: string | undefined
  ) {
    const cellKey = `${archetypeId}-${principleIndex}-${stageId}`
    setGeneratingCell(cellKey)
    
    try {
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "archetype-stage-solution",
          context: {
            archetypeName,
            archetypeDescription,
            principle,
            stageName,
            stageDescription,
          },
        }),
      })
      
      if (!res.ok) throw new Error("Failed to generate solution")
      const data = await res.json()
      
      if (data.solution) {
        await saveSolution(archetypeId, principleIndex, stageId, data.solution, archetypeName, principle, stageName)
      }
    } catch (error) {
      console.error("Failed to generate AI solution:", error)
      toast.error("Failed to generate solution")
    } finally {
      setGeneratingCell(null)
    }
  }
  
  async function generateAllSolutions(archetype: Archetype) {
    if (!stages.length || !archetype.solutionPrinciples.length) return
    
    setGeneratingAll(archetype.id)
    
    try {
      // Build list of all cells that need solutions
      const cells = archetype.solutionPrinciples.flatMap((principle, principleIndex) =>
        stages.map(stage => ({
          principleIndex,
          principle,
          stageId: stage.id,
          stageName: stage.name,
          stageDescription: "",
        }))
      )
      
      const res = await fetch("/api/ai/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "archetype-all-solutions",
          context: {
            archetypeName: archetype.name,
            archetypeDescription: archetype.description,
            archetypeGoals: archetype.goals,
            archetypeFrustrations: archetype.frustrations,
            cells,
          },
        }),
      })
      
      if (!res.ok) throw new Error("Failed to generate solutions")
      const data = await res.json()
      
      if (data.solutions && Array.isArray(data.solutions)) {
        // Save each generated solution
        for (const sol of data.solutions) {
          const cell = cells.find(c => c.principleIndex === sol.principleIndex && c.stageId === sol.stageId)
          if (cell && sol.solution) {
            await saveSolution(
              archetype.id,
              sol.principleIndex,
              sol.stageId,
              sol.solution,
              archetype.name,
              cell.principle,
              cell.stageName
            )
          }
        }
        toast.success(`Generated ${data.solutions.length} solutions for ${archetype.name}`)
      }
    } catch (error) {
      console.error("Failed to generate all solutions:", error)
      toast.error("Failed to generate solutions")
    } finally {
      setGeneratingAll(null)
    }
  }
  
  async function handleAddArchetype(archetypeId: string) {
    try {
      // Clone the archetype to this journey
      const res = await fetch(`/api/archetypes/${archetypeId}/clone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetJourneyId: journeyId }),
      })
      if (!res.ok) throw new Error("Failed to add archetype")
      toast.success("Archetype added to journey")
      mutate()
    } catch (error) {
      console.error(error)
      toast.error("Failed to add archetype")
    }
  }
  
  async function handleRemoveArchetype(archetypeId: string) {
    try {
      const res = await fetch(`/api/archetypes/${archetypeId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Failed to remove archetype")
      toast.success("Archetype removed from journey")
      mutate()
    } catch (error) {
      console.error(error)
      toast.error("Failed to remove archetype")
    }
  }

  if (isLoading || !journey) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const stages = journey.stages || []
  const archetypes = journey.archetypes || []

  return (
    <div className="flex h-full">
      {/* Main content area */}
      <div className={cn(
        "flex-1 overflow-auto px-4 py-6 lg:px-6 transition-all duration-300",
        selectedSolution ? "pr-0" : ""
      )}>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Archetypes & Solutions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Map solution principles from archetypes to journey stages.
            </p>
          </div>
          <div className="flex items-center gap-2">
  <AddArchetypeDialog
  journeyId={journeyId}
  journeyCategory={journey?.category}
  existingArchetypeIds={archetypes.map(a => a.id)}
  onAdd={handleAddArchetype}
            />
<GenerateArchetypesDialog
              journeyId={journeyId}
              journeyCategory={journey.category || inferCategoryFromTags(journey.tags)}
              existingArchetypes={archetypes.map(a => ({
                id: a.id,
                name: a.name,
                role: a.role,
                description: a.description,
                tags: a.tags,
              }))}
              onArchetypesCreated={() => mutate()}
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                Create New
              </Button>
            </GenerateArchetypesDialog>
          </div>
        </div>

      {archetypes.length === 0 ? (
        <Card className="border-border/60 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-sm font-medium text-foreground mb-1">No Archetypes Assigned</h3>
            <p className="text-xs text-muted-foreground text-center max-w-sm mb-4">
              Add archetypes to this journey to start mapping solution principles to stages.
            </p>
            <div className="flex items-center gap-2">
  <AddArchetypeDialog
  journeyId={journeyId}
  journeyCategory={journey?.category}
  existingArchetypeIds={[]}
  onAdd={handleAddArchetype}
              />
<GenerateArchetypesDialog
                  journeyId={journeyId}
                  journeyCategory={journey.category || inferCategoryFromTags(journey.tags)}
                  existingArchetypes={[]}
                  onArchetypesCreated={() => mutate()}
                >
                  <Button size="sm" className="gap-1.5">
                    <Sparkles className="h-3.5 w-3.5" />
                    Create Archetype
                  </Button>
                </GenerateArchetypesDialog>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          {archetypes.map((archetype) => (
            <Card key={archetype.id} className="border-border/60 overflow-hidden">
              {/* Archetype Header */}
              <CardHeader className="bg-muted/30 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
                        {getInitials(archetype.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{archetype.name}</CardTitle>
                        <Badge variant="outline" className={cn("text-[9px]", categoryColors[archetype.category])}>
                          {archetype.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{archetype.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {archetype.solutionPrinciples.length > 0 && stages.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5 text-xs"
                        onClick={() => generateAllSolutions(archetype)}
                        disabled={generatingAll === archetype.id}
                      >
                        {generatingAll === archetype.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Wand2 className="h-3.5 w-3.5" />
                        )}
                        {generatingAll === archetype.id ? "Generating..." : "Generate All"}
                      </Button>
                    )}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/archetypes/${archetype.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View Profile</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          View Full Profile
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleRemoveArchetype(archetype.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-2" />
                          Remove from Journey
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {/* Solution Principles Matrix - Scrollable Canvas Layout */}
                {archetype.solutionPrinciples.length === 0 ? (
                  <div className="flex items-center justify-center py-8 text-center">
                    <div>
                      <Lightbulb className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No solution principles defined for this archetype.</p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto border-t border-border/40">
                    {/* Stage Headers Row */}
                    <div className="flex gap-0 border-b border-border bg-muted/30 sticky top-0 z-10">
                      <div className="w-64 shrink-0 p-2 flex items-center border-r border-border/40">
                        <Badge variant="secondary" className="text-[10px]">Solution Principles</Badge>
                      </div>
                      {stages.map((stage, idx) => (
                        <div key={stage.id} className="flex-1 min-w-48 p-2 border-r border-border/40 last:border-r-0">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center h-5 w-5 rounded bg-foreground/10 text-[10px] font-bold text-foreground">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-semibold text-foreground truncate">{stage.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {/* Principle Rows */}
                    {archetype.solutionPrinciples.map((principle, principleIdx) => (
                      <div key={principleIdx} className="flex gap-0 border-b border-border/40 last:border-b-0">
                        {/* Principle Label */}
                        <div className="w-64 shrink-0 p-2 border-r border-border/40 bg-background">
                          <div className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary mt-0.5">
                              {principleIdx + 1}
                            </span>
                            <p className="text-[11px] leading-relaxed text-foreground">{principle}</p>
                          </div>
                        </div>
                        
                        {/* Stage Cells */}
                        {stages.map((stage) => {
                          const cellKey = `${archetype.id}-${principleIdx}-${stage.id}`
                          const cellSolutions = getSolutions(archetype.id, principleIdx, stage.id)
                          return (
                            <div key={stage.id} className="flex-1 min-w-48 border-r border-border/30 last:border-r-0">
                              <InlineSolutionCell
                                existingSolutions={cellSolutions}
                                onDelete={deleteSolution}
                                onEdit={(sol) => {
                                  setEditingSolution(sol)
                                  setEditDialogOpen(true)
                                }}
                                onAdd={() => {
                                  setAddContext({
                                    archetypeId: archetype.id,
                                    archetypeName: archetype.name,
                                    principleIndex: principleIdx,
                                    principle,
                                    stageId: stage.id,
                                    stageName: stage.name,
                                  })
                                  setAddDialogOpen(true)
                                }}
                                onGenerateAI={() => generateAISolution(archetype.id, principleIdx, stage.id, archetype.name, archetype.description, principle, stage.name, "")}
                                onSelect={(sol) => setSelectedSolution(sol)}
                                selectedId={selectedSolution?.id}
                                generating={generatingCell === cellKey}
                              />
                            </div>
                          )
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Edit Solution Dialog */}
      <EditSolutionDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        solution={editingSolution}
        onSave={(text) => {
          if (editingSolution) {
            // Find the original context from the solution entry
            const entry = solutions.find(s => s.id === editingSolution.id)
            if (entry) {
              const arch = archetypes.find(a => a.id === entry.archetypeId)
              if (arch) {
                const stage = stages.find(s => s.id === entry.stageId)
                saveSolution(
                  entry.archetypeId,
                  entry.principleIndex,
                  entry.stageId,
                  text,
                  arch.name,
                  arch.solutionPrinciples[entry.principleIndex],
                  stage?.name || "",
                  entry.id
                )
              }
            }
          }
        }}
        saving={saving}
      />
      
      {/* Add Solution Dialog */}
      <AddSolutionDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        context={addContext ? {
          archetypeName: addContext.archetypeName,
          principle: addContext.principle,
          stageName: addContext.stageName,
        } : null}
        onSave={(text) => {
          if (addContext) {
            saveSolution(
              addContext.archetypeId,
              addContext.principleIndex,
              addContext.stageId,
              text,
              addContext.archetypeName,
              addContext.principle,
              addContext.stageName
            )
          }
        }}
        saving={saving}
      />
      
        {/* Summary Stats */}
        {archetypes.length > 0 && (
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{archetypes.length}</p>
                <p className="text-xs text-muted-foreground">Archetypes</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">
                  {archetypes.reduce((sum, a) => sum + a.solutionPrinciples.length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Solution Principles</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{stages.length}</p>
                <p className="text-xs text-muted-foreground">Stages</p>
              </CardContent>
            </Card>
            <Card className="border-border/60">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-primary">{solutions.length}</p>
                <p className="text-xs text-muted-foreground">Solutions Mapped</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      
      {/* Right Pane - Selected Solution Details */}
      {selectedSolution && (
        <div className="w-80 shrink-0 border-l border-border bg-muted/20 overflow-y-auto">
          <div className="sticky top-0 bg-muted/20 border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Solution Details</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setSelectedSolution(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Solution Content */}
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Solution</p>
              <p className="text-sm text-foreground leading-relaxed">{selectedSolution.solution}</p>
            </div>
            
            {/* Context Info */}
            {(() => {
              const arch = archetypes.find(a => a.id === selectedSolution.archetypeId)
              const stage = stages.find(s => s.id === selectedSolution.stageId)
              const principle = arch?.solutionPrinciples[selectedSolution.principleIndex]
              return (
                <>
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Archetype</p>
                    <p className="text-xs font-medium text-foreground">{arch?.name || "Unknown"}</p>
                  </div>
                  
                  <div className="rounded-md bg-muted/50 p-3">
                    <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Stage</p>
                    <p className="text-xs font-medium text-foreground">{stage?.name || "Unknown"}</p>
                  </div>
                  
                  {principle && (
                    <div className="rounded-md bg-primary/5 p-3">
                      <p className="text-[9px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Solution Principle</p>
                      <p className="text-xs text-foreground leading-relaxed">{principle}</p>
                    </div>
                  )}
                </>
              )
            })()}
            
            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 gap-1.5"
                onClick={() => {
                  setEditingSolution(selectedSolution)
                  setEditDialogOpen(true)
                }}
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1.5 text-destructive hover:text-destructive"
                onClick={() => deleteSolution(selectedSolution.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
