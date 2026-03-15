"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Plus, Sparkles, Star, AlertTriangle, Zap, TrendingDown, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useJourney } from "@/hooks/use-journey"
import { StageColumn } from "@/components/canvas/stage-column"
import { AddStageDialog } from "@/components/canvas/canvas-dialogs"
import { CanvasToolbar } from "@/components/canvas/canvas-toolbar"
import type { CanvasViewMode } from "@/components/canvas/canvas-toolbar"
import { TouchPointDetailPanel } from "@/components/touch-point-detail-panel"
import { MiniEmotionalArc } from "@/components/mini-emotional-arc"
import { getEmotionalArc, getEffectivePainPoints, getEffectiveHighlights } from "@/lib/data-utils"
import { useJourneyComments } from "@/hooks/use-journey"
import type { TouchPoint, Stage } from "@/lib/types"
import { CommentSidebar } from "@/components/canvas/comment-sidebar"
import { Info, ArrowRight, Lightbulb, X as XIcon, Check, Target, Search, Bookmark, Pencil, Loader2, Languages, RefreshCw, Bell } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ExportDialog } from "@/components/export-dialog"

export default function CanvasPage() {
  const params = useParams()
  const journeyId = params.id as string
  const { journey, isLoading, mutate } = useJourney(journeyId)
  const { comments } = useJourneyComments(journeyId)
  const scrollRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)

  const [zoom, setZoom] = useState(100)
  const [filterChannel, setFilterChannel] = useState("all")
  const [editMode, setEditMode] = useState(false)
  const [viewMode, setViewMode] = useState<CanvasViewMode>("default")
  const [selectedTouchPointInfo, setSelectedTouchPointInfo] = useState<{
    touchPointId: string
    stageName: string
    stepName: string
    stageId: string
    stepId: string
  } | null>(null)

  // Compute fresh touchpoint from journey data whenever it updates (enables live updates in panel)
  const selectedTouchPoint = useMemo(() => {
    if (!selectedTouchPointInfo || !journey) return null
    for (const stage of journey.stages) {
      for (const step of stage.steps) {
        const tp = step.touchPoints.find((t) => t.id === selectedTouchPointInfo.touchPointId)
        if (tp) {
          return {
            touchPoint: tp,
            stageName: selectedTouchPointInfo.stageName,
            stepName: selectedTouchPointInfo.stepName,
            stageId: selectedTouchPointInfo.stageId,
            stepId: selectedTouchPointInfo.stepId,
          }
        }
      }
    }
    return null
  }, [selectedTouchPointInfo, journey])

  // AI stage dialog
  const [aiDialogOpen, setAiDialogOpen] = useState(false)
  const [aiStageName, setAiStageName] = useState("")
  const [aiDescription, setAiDescription] = useState("")
  const [aiGenerating, setAiGenerating] = useState(false)

  function handleAiGenerate() {
    if (!aiStageName.trim() || !aiDescription.trim()) return
    setAiGenerating(true)
    setTimeout(() => {
      toast.success(`Stage "${aiStageName}" generated with AI`)
      setAiGenerating(false)
      setAiDialogOpen(false)
      setAiStageName("")
      setAiDescription("")
    }, 2000)
  }

  // Comment sidebar state
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [commentFilterStageId, setCommentFilterStageId] = useState<string | null>(null)
  const [commentFilterStepId, setCommentFilterStepId] = useState<string | null>(null)
  const [commentFilterTouchpointId, setCommentFilterTouchpointId] = useState<string | null>(null)
  const [highlightedTouchpointId, setHighlightedTouchpointId] = useState<string | null>(null)

  // Applied solutions + in-context picker
  const fetcher = async (url: string) => {
    const res = await fetch(url)
    const data = await res.json()
    // If response is an error object, return empty array
    if (!Array.isArray(data)) return []
    return data
  }
  const { data: appliedSolutionsRaw, mutate: mutateApplied } = useSWR<
    { id: string; solution_id: string; stage_id: string; step_id: string | null; touchpoint_id: string | null; pain_point_id: string | null; highlight_id: string | null; notes: string; solutions: { title: string; description: string; category: string; impact_score?: number; impact_verified?: boolean } }[]
  >(`/api/journeys/${journeyId}/apply-solution`, fetcher)
  const appliedSolutions = Array.isArray(appliedSolutionsRaw) ? appliedSolutionsRaw : []
  const { data: solutionLibraryRaw, mutate: mutateSolutions } = useSWR<
    { id: string; title: string; description: string; category: string; tags: string[]; effort?: string; impact?: string; impact_score?: number; impact_verified?: boolean }[]
  >("/api/solutions?saved=true", fetcher)
  const solutionLibrary = Array.isArray(solutionLibraryRaw) ? solutionLibraryRaw : []
  const [applyModalStageId, setApplyModalStageId] = useState<string | null>(null)
  const [applyModalStepId, setApplyModalStepId] = useState<string | null>(null)
  const [applyModalTouchpointId, setApplyModalTouchpointId] = useState<string | null>(null)
  const [applyModalPainPointId, setApplyModalPainPointId] = useState<string | null>(null)
  const [applyModalHighlightId, setApplyModalHighlightId] = useState<string | null>(null)
  const [applySearch, setApplySearch] = useState("")
  const [applyingId, setApplyingId] = useState<string | null>(null)
  const [solutionModalTab, setSolutionModalTab] = useState<"pick" | "generate" | "provide">("pick")
  const [provideSolutionName, setProvideSolutionName] = useState("")
  const [provideSolutionDesc, setProvideSolutionDesc] = useState("")
  const [providingCustom, setProvidingCustom] = useState(false)
  const [generateContext, setGenerateContext] = useState("")
  const [generatedSolutions, setGeneratedSolutions] = useState<Array<{ id: string; title: string; description: string; category: string; impact?: string; effort?: string }>>([])
  const [selectedSolutions, setSelectedSolutions] = useState<Set<string>>(new Set())
  const [savedGeneratedIds, setSavedGeneratedIds] = useState<Set<string>>(new Set())
  const [isGenerating, setIsGenerating] = useState(false)
  const [editingSolution, setEditingSolution] = useState(false)
  const [editSolutionTitle, setEditSolutionTitle] = useState("")
  const [editSolutionDesc, setEditSolutionDesc] = useState("")
  
  const [savingSolution, setSavingSolution] = useState(false)
  const [selectedAppliedSolution, setSelectedAppliedSolution] = useState<{
    id: string
    solution_id: string
    stage_id: string
    step_id: string | null
    touchpoint_id: string | null
    pain_point_id: string | null
    highlight_id: string | null
    notes: string
    solutions: { title: string; description: string; category: string; impact_score?: number; impact_verified?: boolean }
  } | null>(null)

  async function handleDeleteAppliedSolution(appliedId: string) {
    try {
      const res = await fetch(`/api/journeys/${journeyId}/apply-solution?id=${appliedId}`, {
        method: "DELETE",
      })
      if (res.ok) {
        mutateApplied()
        setSelectedAppliedSolution(null)
        toast.success("Solution removed")
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Failed to remove solution")
      }
    } catch (err) {
      console.error("[v0] Delete applied solution error:", err)
      toast.error("Failed to remove solution")
    }
  }

  async function handleCreateRoadmapIssue(solutionId: string, solutionTitle: string) {
    try {
      const res = await fetch("/api/roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Implement: ${solutionTitle}`,
          description: `Roadmap issue created from applied solution "${solutionTitle}" on journey canvas.`,
          solutionId,
          journeyId: journeyId,
        }),
      })
      if (res.ok) toast.success("Roadmap issue created")
      else toast.error("Failed to create roadmap issue")
    } catch { toast.error("Failed to create roadmap issue") }
  }

  async function handleApplySolution(solutionId: string, stageId: string, stepId?: string | null, touchpointId?: string | null, painPointId?: string | null, highlightId?: string | null) {
    setApplyingId(solutionId)
    try {
      const res = await fetch(`/api/journeys/${journeyId}/apply-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          solutionId, 
          stageId,
          stepId: stepId || undefined,
          touchpointId: touchpointId || undefined,
          painPointId: painPointId || undefined,
          highlightId: highlightId || undefined,
        }),
      })
      if (res.ok) {
        mutateApplied()
        mutateSolutions()
        // Roadmap initiative is auto-created by the API for future journeys
      } else {
        const errorData = await res.json().catch(() => ({}))
        console.error("[v0] Apply solution failed:", errorData)
        toast.error(errorData.error || "Failed to apply solution")
      }
    } catch {
      toast.error("Failed to apply solution")
    } finally {
      setApplyingId(null)
    }
  }

  // Local mutable stage order for reordering
  const [stageOrder, setStageOrder] = useState<string[] | null>(null)
  
  // Drag-and-drop state for stages
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null)
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null)

  const orderedStages = useMemo(() => {
    if (!journey || !stageOrder) return journey?.stages ?? []
    return stageOrder
      .map((id) => journey.stages.find((s) => s.id === id))
      .filter(Boolean) as Stage[]
  }, [journey, stageOrder])

  // Extract all unique channels
  const channels = useMemo(() => {
    if (!journey) return []
    const set = new Set<string>()
    journey.stages.forEach((s) =>
      s.steps.forEach((st) =>
        st.touchPoints.forEach((tp) => set.add(tp.channel))
      )
    )
    return Array.from(set).sort()
  }, [journey])

  const emotionalArc = journey ? getEmotionalArc(journey) : []
  const unresolvedCount = comments.filter((c) => !c.resolved).length

  if (isLoading || !journey) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  function openCommentsForStage(stageId: string) {
    setCommentFilterStageId(stageId)
    setCommentFilterStepId(null)
    setCommentsOpen(true)
  }

  function openCommentsForStep(stageId: string, stepId: string) {
    setCommentFilterStageId(stageId)
    setCommentFilterStepId(stepId)
    setCommentsOpen(true)
  }

  function handleTouchPointClick(tp: TouchPoint, stageName: string, stepName: string, stageId: string, stepId: string) {
    setSelectedTouchPointInfo({ touchPointId: tp.id, stageName, stepName, stageId, stepId })
  }

  function moveStage(fromIdx: number, toIdx: number) {
    const ids = (stageOrder || journey.stages.map((s) => s.id)).slice()
    const [moved] = ids.splice(fromIdx, 1)
    ids.splice(toIdx, 0, moved)
    setStageOrder(ids)
  }
  
  // Drag-and-drop handlers for stages
  function handleStageDragStart(e: React.DragEvent, stageId: string) {
    if (!editMode) return
    setDraggedStageId(stageId)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", stageId)
  }
  
  function handleStageDragOver(e: React.DragEvent, stageId: string) {
    if (!editMode || !draggedStageId || draggedStageId === stageId) return
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverStageId(stageId)
  }
  
  function handleStageDragLeave() {
    setDragOverStageId(null)
  }
  
  function handleStageDrop(e: React.DragEvent, targetStageId: string) {
    e.preventDefault()
    if (!editMode || !draggedStageId || draggedStageId === targetStageId) return
    
    const ids = (stageOrder || journey.stages.map((s) => s.id)).slice()
    const fromIdx = ids.indexOf(draggedStageId)
    const toIdx = ids.indexOf(targetStageId)
    
    if (fromIdx !== -1 && toIdx !== -1) {
      ids.splice(fromIdx, 1)
      ids.splice(toIdx, 0, draggedStageId)
      setStageOrder(ids)
    }
    
    setDraggedStageId(null)
    setDragOverStageId(null)
  }
  
  function handleStageDragEnd() {
    setDraggedStageId(null)
    setDragOverStageId(null)
  }

  // handleAddStage is now handled by AddStageDialog wrapper

  // Score helpers for swimlane/timeline
  function scoreColor(score: number) {
    if (score <= -3) return "bg-red-500"
    if (score <= -1) return "bg-orange-400"
    if (score <= 1) return "bg-yellow-400"
    if (score <= 3) return "bg-emerald-400"
    return "bg-green-500"
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col">
      {/* Toolbar */}
      <CanvasToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(150, z + 10))}
        onZoomOut={() => setZoom((z) => Math.max(50, z - 10))}
        onZoomReset={() => setZoom(100)}
        filterChannel={filterChannel}
        onFilterChannel={setFilterChannel}
        channels={channels}
        editMode={editMode}
        onToggleEditMode={async () => {
          if (editMode) {
            // Exiting edit mode - create a version only if changes were made
            try {
              const { createAutoJourneyVersion } = await import("@/lib/actions/data")
              const result = await createAutoJourneyVersion(journeyId, "Edit session changes")
              if (result.noChanges) {
                toast.info("No changes detected", {
                  description: "Edit mode closed without creating a new version."
                })
              } else {
                toast.success(`Version ${result.versionLabel || result.versionNumber} saved`, {
                  description: `${result.changeType ? result.changeType.charAt(0).toUpperCase() + result.changeType.slice(1) + " changes" : "Your changes"} have been versioned.`
                })
              }
            } catch {
              // Don't block the edit mode toggle if versioning fails
            }
          }
          setEditMode((e) => !e)
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddStage={() => {}}
        onExport={() => setExportDialogOpen(true)}
        commentsOpen={commentsOpen}
        onToggleComments={() => {
          setCommentsOpen((o) => !o)
          if (!commentsOpen) {
            setCommentFilterStageId(null)
            setCommentFilterStepId(null)
          }
        }}
        unresolvedCommentCount={unresolvedCount}
      />

      {/* Canvas area */}
<div className="flex-1 relative overflow-hidden">
        <div
          ref={(el) => {
            (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = el
            ;(canvasRef as React.MutableRefObject<HTMLDivElement | null>).current = el
          }}
          className={cn("absolute inset-0 overflow-x-auto overflow-y-auto bg-muted/20", commentsOpen && "right-80")}
        >
        {/* ========= DEFAULT: Column View ========= */}
        {viewMode === "default" && (
          <div
            data-export-target="journey-canvas"
            className="flex gap-4 p-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            {orderedStages.map((stage, idx) => (
              <StageColumn
                key={stage.id}
                stage={stage}
                stageIndex={idx}
                journeyId={journeyId}
                filterChannel={filterChannel}
                editMode={editMode}
                isFirst={idx === 0}
                isLast={idx === orderedStages.length - 1}
                onMoveStageLeft={() => moveStage(idx, idx - 1)}
                onMoveStageRight={() => moveStage(idx, idx + 1)}
                // Drag-and-drop props
                isDragging={draggedStageId === stage.id}
                isDragOver={dragOverStageId === stage.id}
                onDragStart={(e) => handleStageDragStart(e, stage.id)}
                onDragOver={(e) => handleStageDragOver(e, stage.id)}
                onDragLeave={handleStageDragLeave}
                onDrop={(e) => handleStageDrop(e, stage.id)}
                onDragEnd={handleStageDragEnd}
                onReorderStep={async (from, to) => {
                  const { reorderSteps } = await import("@/lib/actions/data")
                  const sortedSteps = [...stage.steps].sort((a, b) => a.sortOrder - b.sortOrder)
                  const stepIds = sortedSteps.map((s) => s.id)
                  const [moved] = stepIds.splice(from, 1)
                  stepIds.splice(to, 0, moved)
                  try {
                    await reorderSteps(stage.id, journeyId, stepIds)
                    mutate()
                    toast.success(`Step reordered in "${stage.name}"`)
                  } catch {
                    toast.error("Failed to reorder step")
                  }
                }}
                onTouchPointClick={(tp) => {
                  const step = stage.steps.find((s) =>
                    s.touchPoints.some((t) => t.id === tp.id)
                  )
                  handleTouchPointClick(tp, stage.name, step?.name || "", stage.id, step?.id || "")
                }}
                commentCount={comments.filter((c) => {
                  if (c.parentId) return false // Skip replies
                  if (c.stageId === stage.id) return true // Direct stage comments
                  // Include touchpoint comments from this stage
                  const touchpointIds = stage.steps.flatMap(s => s.touchPoints.map(tp => tp.id))
                  if (c.touchpointId && touchpointIds.includes(c.touchpointId)) return true
                  // Include step comments from this stage
                  const stepIds = stage.steps.map(s => s.id)
                  if (c.stepId && stepIds.includes(c.stepId)) return true
                  return false
                }).length}
                onCommentClick={() => openCommentsForStage(stage.id)}
                getStepCommentCount={(stepId) => {
                  const step = stage.steps.find(s => s.id === stepId)
                  const tpIds = step?.touchPoints.map(tp => tp.id) || []
                  return comments.filter((c) => {
                    if (c.parentId) return false
                    if (c.stepId === stepId) return true
                    if (c.touchpointId && tpIds.includes(c.touchpointId)) return true
                    return false
                  }).length
                }}
                onStepCommentClick={(stepId) => openCommentsForStep(stage.id, stepId)}
                highlightedTouchpointId={highlightedTouchpointId}
              />
            ))}

            {/* Add stage placeholder */}
            {editMode && (
              <div className="flex w-72 shrink-0 flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/40 bg-background/50 py-12">
                <AddStageDialog journeyId={journeyId} journeyTitle={journey?.title}>
                  <Button
                    variant="ghost"
                    className="gap-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-4 w-4" />
                    Add Stage
                  </Button>
                </AddStageDialog>
              </div>
            )}
          </div>
        )}

        {/* ========= SWIMLANE VIEW ========= */}
        {viewMode === "swimlane" && (
          <div
            data-export-target="journey-canvas"
            className="p-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            {/* Header row with stage names */}
            <div className="flex gap-0 mb-0">
              <div className="w-32 shrink-0 p-2" />
              {orderedStages.map((stage, idx) => (
                <div key={stage.id} className="flex-1 min-w-48 p-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded bg-foreground/10 text-[10px] font-bold text-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">{stage.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Channel rows */}
            {["all", ...channels].filter((c) => c === "all" ? false : true).map((channel) => (
              <div key={channel} className="flex gap-0 border-b border-border/40">
                <div className="w-32 shrink-0 p-2 flex items-start">
                  <Badge variant="secondary" className="text-[10px] mt-1">{channel}</Badge>
                </div>
                {orderedStages.map((stage) => {
                  const tps = stage.steps.flatMap((s) =>
                    s.touchPoints.filter((tp) => tp.channel === channel)
                  )
                  return (
                    <div key={stage.id} className="flex-1 min-w-48 p-2 border-l border-border/30">
                      <div className="flex flex-col gap-1.5">
                        {tps.length === 0 ? (
                          <span className="text-[10px] text-muted-foreground/40 py-2">--</span>
                        ) : (
                          tps.map((tp) => (
                            <button
                              key={tp.id}
                              id={`touchpoint-${tp.id}`}
                              onClick={() => {
                                const step = stage.steps.find((s) =>
                                  s.touchPoints.some((t) => t.id === tp.id)
                                )
                                handleTouchPointClick(tp, stage.name, step?.name || "", stage.id, step?.id || "")
                              }}
                              className={cn(
                                "text-left rounded border border-border/50 p-2 hover:border-primary/40 hover:shadow-sm transition-all bg-card",
                                highlightedTouchpointId === tp.id && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
                              )}
                            >
                              <div className="flex items-start gap-1.5">
                                <div className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", scoreColor(tp.emotionalScore))} />
                                <p className="text-[10px] leading-relaxed text-foreground line-clamp-2">{tp.description}</p>
                              </div>
                              <span className={cn(
                                "text-[10px] font-mono font-bold mt-1 inline-block",
                                tp.emotionalScore >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                              )}>
                                {tp.emotionalScore > 0 ? "+" : ""}{tp.emotionalScore}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        )}

        {/* ========= TIMELINE VIEW ========= */}
        {viewMode === "timeline" && (
          <div
            data-export-target="journey-canvas"
            className="p-6"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            <div className="relative">
              {/* Horizontal connector line */}
              <div className="absolute top-8 left-0 right-0 h-px bg-border" />

              <div className="flex gap-0">
                {orderedStages.map((stage, idx) => {
                  const allTps = stage.steps.flatMap((s) =>
                    filterChannel === "all" ? s.touchPoints : s.touchPoints.filter((tp) => tp.channel === filterChannel)
                  )
                  const avg = allTps.length > 0
                    ? allTps.reduce((sum, tp) => sum + tp.emotionalScore, 0) / allTps.length
                    : 0

                  return (
                    <div key={stage.id} className="flex-1 min-w-40 relative">
                      {/* Stage dot */}
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "relative z-10 flex items-center justify-center h-16 w-16 rounded-full border-2",
                          avg >= 2 ? "border-green-400 bg-green-50 dark:bg-green-900/20" :
                          avg >= 0 ? "border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20" :
                          avg >= -2 ? "border-orange-400 bg-orange-50 dark:bg-orange-900/20" :
                          "border-red-400 bg-red-50 dark:bg-red-900/20"
                        )}>
                          <div className="text-center">
                            <span className="block text-[10px] font-bold text-muted-foreground">{idx + 1}</span>
                            <span className={cn(
                              "block text-sm font-bold font-mono",
                              avg >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                            )}>
                              {avg > 0 ? "+" : ""}{avg.toFixed(1)}
                            </span>
                          </div>
                        </div>

                        {/* Stage label */}
                        <h3 className="mt-3 text-xs font-semibold text-foreground text-center px-2">{stage.name}</h3>
                        <span className="text-[10px] text-muted-foreground mt-0.5">
                          {stage.steps.length} steps / {allTps.length} tp
                        </span>

                        {/* Step list */}
                        <div className="mt-3 flex flex-col gap-1 w-full px-2">
                          {stage.steps.map((step, si) => (
                            <div key={step.id} className="rounded border border-border/50 p-2 bg-card">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-mono font-bold text-primary bg-primary/10 rounded px-1 py-0.5">
                                  {idx + 1}.{si + 1}
                                </span>
                                <span className="text-[10px] font-medium text-foreground truncate">{step.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Arrow connector */}
                      {idx < orderedStages.length - 1 && (
                        <ArrowRight className="absolute top-[26px] -right-2 h-4 w-4 text-muted-foreground/50 z-10" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========= MOMENTS OF TRUTH VIEW ========= */}
        {viewMode === "moments" && (() => {
          // Extract all touch points with context
          const allTpsWithContext = orderedStages.flatMap((stage, si) =>
            stage.steps.flatMap((step, sti) =>
              (filterChannel === "all" ? step.touchPoints : step.touchPoints.filter((tp) => tp.channel === filterChannel)).map((tp) => ({
                tp,
                stage,
                step,
                stageIdx: si,
                stepIdx: sti,
              }))
            )
          )

          // Score each touch point for "moment of truth" importance:
          // Extreme emotions (high or low), critical pain points, high-impact highlights
          const scored = allTpsWithContext.map((item) => {
            let motScore = 0
            // Extreme emotional score (both positive & negative are moments that matter)
            motScore += Math.abs(item.tp.emotionalScore) * 2
            // Critical/high pain points weigh heavily
            item.tp.painPoints.forEach((pp) => {
              if (pp.severity === "critical") motScore += 5
              else if (pp.severity === "high") motScore += 3
              else if (pp.severity === "medium") motScore += 1
            })
            // High highlights also matter
            item.tp.highlights.forEach((hl) => {
              if (hl.impact === "high") motScore += 3
              else if (hl.impact === "medium") motScore += 1
            })
            return { ...item, motScore }
          })

          // Sort by moment score descending, take top moments (80% rule)
          const sorted = scored.sort((a, b) => b.motScore - a.motScore)
          const topCount = Math.max(3, Math.ceil(sorted.length * 0.3)) // top ~30% are MOT
          const moments = sorted.slice(0, topCount)

          return (
            <div
              className="p-6 max-w-5xl mx-auto"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                    <Star className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Moments of Truth</h2>
                    <p className="text-[11px] text-muted-foreground">
                      {moments.length} critical touch points out of {sorted.length} total -- the moments that define 80% of the experience
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Pain Moments
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Delight Moments
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                    <div className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Mixed / High Stakes
                  </div>
                </div>
              </div>

              {/* Moments grid */}
              <div className="grid gap-3">
                {moments.map((m, idx) => {
                  const isNegative = m.tp.emotionalScore < -1
                  const isPositive = m.tp.emotionalScore > 1
                  const criticalPains = m.tp.painPoints.filter((pp) => pp.severity === "critical" || pp.severity === "high")
                  const highHighlights = m.tp.highlights.filter((hl) => hl.impact === "high")

                  return (
                    <button
                      key={m.tp.id}
                      id={`touchpoint-${m.tp.id}`}
                      onClick={() => handleTouchPointClick(m.tp, m.stage.name, m.step.name, m.stage.id, m.step.id)}
                      className={cn(
                        "relative text-left rounded-xl border-2 p-4 transition-all hover:shadow-md",
                        isNegative
                          ? "border-red-200 bg-red-50/50 hover:border-red-300 dark:border-red-800/50 dark:bg-red-950/20 dark:hover:border-red-700/50"
                          : isPositive
                          ? "border-emerald-200 bg-emerald-50/50 hover:border-emerald-300 dark:border-emerald-800/50 dark:bg-emerald-950/20 dark:hover:border-emerald-700/50"
                          : "border-amber-200 bg-amber-50/50 hover:border-amber-300 dark:border-amber-800/50 dark:bg-amber-950/20 dark:hover:border-amber-700/50",
                        highlightedTouchpointId === m.tp.id && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
                      )}
                    >
                      {/* Rank badge */}
                      <div className={cn(
                        "absolute -top-2.5 -left-2.5 flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold border-2 border-background shadow-sm",
                        idx === 0 ? "bg-amber-500 text-white" :
                        idx < 3 ? "bg-foreground text-background" :
                        "bg-muted text-foreground"
                      )}>
                        {idx + 1}
                      </div>

                      <div className="flex items-start gap-4">
                        {/* Left: score + icon */}
                        <div className="flex flex-col items-center gap-1 shrink-0 pt-0.5">
                          <div className={cn(
                            "flex items-center justify-center h-10 w-10 rounded-lg",
                            isNegative ? "bg-red-100 dark:bg-red-900/40" :
                            isPositive ? "bg-emerald-100 dark:bg-emerald-900/40" :
                            "bg-amber-100 dark:bg-amber-900/40"
                          )}>
                            {isNegative ? (
                              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
                            ) : isPositive ? (
                              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            )}
                          </div>
                          <span className={cn(
                            "text-lg font-bold font-mono tabular-nums",
                            isNegative ? "text-red-600 dark:text-red-400" :
                            isPositive ? "text-emerald-600 dark:text-emerald-400" :
                            "text-amber-600 dark:text-amber-400"
                          )}>
                            {m.tp.emotionalScore > 0 ? "+" : ""}{m.tp.emotionalScore}
                          </span>
                        </div>

                        {/* Right: content */}
                        <div className="flex-1 min-w-0">
                          {/* Breadcrumb */}
                          <div className="flex items-center gap-1 mb-1">
                            <span className="text-[9px] font-mono font-bold bg-foreground/10 rounded px-1.5 py-0.5 text-foreground">
                              {m.stageIdx + 1}.{m.stepIdx + 1}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate">
                              {m.stage.name} &rsaquo; {m.step.name}
                            </span>
                          </div>

                          {/* Description */}
                          <p className="text-sm font-medium text-foreground leading-snug mb-2">
                            {m.tp.description}
                          </p>

                          {/* Tags row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            <Badge variant="secondary" className="text-[9px] h-5">
                              {m.tp.channel}
                            </Badge>
                            {m.tp.painPoints.length > 0 && (
                              <Badge variant="outline" className={cn("text-[9px] h-5 gap-1", criticalPains.length > 0 ? "border-red-300 text-red-700 dark:text-red-400" : "")}>
                                <AlertTriangle className="h-2.5 w-2.5" />
                                {m.tp.painPoints.length} pain{m.tp.painPoints.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            {m.tp.highlights.length > 0 && (
                              <Badge variant="outline" className={cn("text-[9px] h-5 gap-1", highHighlights.length > 0 ? "border-emerald-300 text-emerald-700 dark:text-emerald-400" : "")}>
                                <Sparkles className="h-2.5 w-2.5" />
                                {m.tp.highlights.length} highlight{m.tp.highlights.length !== 1 ? "s" : ""}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[9px] h-5 gap-1">
                              <Star className="h-2.5 w-2.5 text-amber-500" />
                              MOT Score: {m.motScore}
                            </Badge>
                          </div>

                          {/* Top pain point preview */}
                          {criticalPains.length > 0 && (
                            <div className="rounded-md bg-red-100/50 dark:bg-red-900/20 border border-red-200/60 dark:border-red-800/40 px-3 py-2">
                              <p className="text-[11px] text-red-700 dark:text-red-300 leading-relaxed line-clamp-2">
                                <span className="font-semibold uppercase text-[9px] mr-1">{criticalPains[0].severity}:</span>
                                {criticalPains[0].description}
                              </p>
                            </div>
                          )}

                          {/* Top highlight preview */}
                          {!criticalPains.length && highHighlights.length > 0 && (
                            <div className="rounded-md bg-emerald-100/50 dark:bg-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 px-3 py-2">
                              <p className="text-[11px] text-emerald-700 dark:text-emerald-300 leading-relaxed line-clamp-2">
                                <span className="font-semibold uppercase text-[9px] mr-1">{highHighlights[0].impact} impact:</span>
                                {highHighlights[0].description}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Not-a-moment section */}
              {sorted.length > topCount && (
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {sorted.length - topCount} other touch points are not classified as Moments of Truth
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {sorted.slice(topCount).map((m) => (
                      <button
                        key={m.tp.id}
                        id={`touchpoint-${m.tp.id}`}
                        onClick={() => handleTouchPointClick(m.tp, m.stage.name, m.step.name, m.stage.id, m.step.id)}
                        className={cn(
                          "rounded-md border border-border/60 bg-card px-2.5 py-1.5 text-[10px] text-muted-foreground hover:text-foreground hover:border-border transition-colors",
                          highlightedTouchpointId === m.tp.id && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
                        )}
                      >
                        {m.tp.description.slice(0, 40)}{m.tp.description.length > 40 ? "..." : ""}
                        <span className="ml-1.5 font-mono font-bold">
                          {m.tp.emotionalScore > 0 ? "+" : ""}{m.tp.emotionalScore}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })()}
        {/* ========= SOLUTIONS LANE VIEW ========= */}
        {viewMode === "solutions" && (
          <div
            className="p-4"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            {/* Header row with stage names */}
            <div className="flex gap-0 mb-0">
              <div className="w-36 shrink-0 p-2 border-b border-border">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Lane</span>
              </div>
              {orderedStages.map((stage, idx) => (
                <div key={stage.id} className="flex-1 min-w-52 p-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center h-5 w-5 rounded bg-foreground/10 text-[10px] font-bold text-foreground">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-foreground truncate">{stage.name}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Steps row */}
            <div className="flex gap-0 border-b border-border/40">
              <div className="w-36 shrink-0 p-2 flex items-start">
                <Badge variant="secondary" className="text-[10px] mt-1">Steps</Badge>
              </div>
              {orderedStages.map((stage) => (
                <div key={stage.id} className="flex-1 min-w-52 p-2 border-l border-border/30">
                  <div className="flex flex-col gap-1">
                    {stage.steps.map((step) => (
                      <div key={step.id} className="rounded border border-border/50 p-1.5 bg-card text-[10px] text-foreground">
                        {step.name}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pain Points with Solutions row */}
            <div className="flex gap-0 border-b border-border/40">
              <div className="w-36 shrink-0 p-2 flex items-start">
                <Badge variant="outline" className="text-[10px] mt-1 border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                  <AlertTriangle className="mr-1 h-2.5 w-2.5" />
                  Pain Points
                </Badge>
              </div>
              {orderedStages.map((stage) => {
                // Use getEffectivePainPoints to include derived pain points from negative emotional scores
                const painsWithTouchpoint = stage.steps.flatMap((s) =>
                  s.touchPoints.flatMap((tp) => {
                    const effectivePains = getEffectivePainPoints(tp)
                    return effectivePains.map(pp => ({ 
                      ...pp, 
                      touchpointId: tp.id, 
                      touchpointChannel: tp.channel, 
                      stepId: s.id,
                      touchpointDescription: tp.description
                    }))
                  })
                )
                return (
                  <div key={stage.id} className="flex-1 min-w-52 p-2 border-l border-border/30">
                    <div className="flex flex-col gap-2">
                      {painsWithTouchpoint.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <span className="text-[10px] text-muted-foreground/40">No pain points identified</span>
                          <p className="text-[9px] text-muted-foreground/60 text-center px-2">
                            Pain points are derived from touchpoints with negative emotional scores
                          </p>
                        </div>
                      ) : (
                        painsWithTouchpoint.map((pp) => {
                          // For derived pain points (from emotional scores), match by touchpoint_id
                          // For explicit pain points, match by pain_point_id
                          const isDerived = pp.id.startsWith("derived-")
                          const painSolutions = appliedSolutions.filter((a) => 
                            isDerived 
                              ? (a.touchpoint_id === pp.touchpointId && a.stage_id === stage.id && !a.pain_point_id)
                              : a.pain_point_id === pp.id
                          )
                          return (
                            <div key={pp.id} className="rounded border border-red-100 bg-red-50/30 dark:border-red-900/30 dark:bg-red-900/10">
                              <div className="p-2 border-b border-red-100/50 dark:border-red-900/20">
                                <div className="flex items-start gap-1.5">
                                  <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", 
                                    pp.severity === "critical" ? "bg-red-600" : 
                                    pp.severity === "high" ? "bg-red-500" : 
                                    pp.severity === "medium" ? "bg-orange-500" : "bg-yellow-500"
                                  )} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] text-red-700 dark:text-red-300 line-clamp-2">{pp.description}</p>
                                    <span className="text-[9px] text-red-500/60 capitalize">{pp.severity} - {pp.touchpointChannel}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="p-1.5 space-y-1">
                                {painSolutions.map((sol) => (
                                  <div 
                                    key={sol.id} 
                                    className="group flex items-start gap-1 rounded bg-primary/5 p-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                                    onClick={() => setSelectedAppliedSolution(sol)}
                                  >
                                    <Lightbulb className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-foreground line-clamp-1 flex-1">{sol.solutions?.title}</p>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteAppliedSolution(sol.id) }}
                                      className="opacity-0 group-hover:opacity-100 h-3.5 w-3.5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                      <XIcon className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => { 
                                    setApplyModalStageId(stage.id)
                                    setApplyModalStepId(pp.stepId)
                                    setApplyModalTouchpointId(pp.touchpointId)
                                    setApplyModalPainPointId(pp.id)
                                    setApplyModalHighlightId(null)
                                    setApplySearch("") 
                                  }}
                                  className="w-full flex items-center justify-center gap-1 rounded border border-dashed border-primary/30 py-1 text-[9px] text-primary hover:bg-primary/5 transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                  Add Solution
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Highlights with Solutions row */}
            <div className="flex gap-0 border-b border-border/40">
              <div className="w-36 shrink-0 p-2 flex items-start">
                <Badge variant="outline" className="text-[10px] mt-1 border-emerald-200 text-emerald-600 dark:border-emerald-800 dark:text-emerald-400">
                  <Sparkles className="mr-1 h-2.5 w-2.5" />
                  Highlights
                </Badge>
              </div>
              {orderedStages.map((stage) => {
                // Use getEffectiveHighlights to include derived highlights from positive emotional scores
                const highlightsWithTouchpoint = stage.steps.flatMap((s) =>
                  s.touchPoints.flatMap((tp) => {
                    const effectiveHighlights = getEffectiveHighlights(tp)
                    return effectiveHighlights.map(h => ({ 
                      ...h, 
                      touchpointId: tp.id, 
                      touchpointChannel: tp.channel, 
                      stepId: s.id,
                      touchpointDescription: tp.description
                    }))
                  })
                )
                return (
                  <div key={stage.id} className="flex-1 min-w-52 p-2 border-l border-border/30">
                    <div className="flex flex-col gap-2">
                      {highlightsWithTouchpoint.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <span className="text-[10px] text-muted-foreground/40">No highlights identified</span>
                          <p className="text-[9px] text-muted-foreground/60 text-center px-2">
                            Highlights are derived from touchpoints with positive emotional scores
                          </p>
                        </div>
                      ) : (
                        highlightsWithTouchpoint.map((h) => {
                          // For derived highlights (from emotional scores), match by touchpoint_id
                          // For explicit highlights, match by highlight_id
                          const isDerived = h.id.startsWith("derived-")
                          const highlightSolutions = appliedSolutions.filter((a) => 
                            isDerived 
                              ? (a.touchpoint_id === h.touchpointId && a.stage_id === stage.id && !a.highlight_id && !a.pain_point_id)
                              : a.highlight_id === h.id
                          )
                          return (
                            <div key={h.id} className="rounded border border-emerald-100 bg-emerald-50/30 dark:border-emerald-900/30 dark:bg-emerald-900/10">
                              <div className="p-2 border-b border-emerald-100/50 dark:border-emerald-900/20">
                                <div className="flex items-start gap-1.5">
                                  <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", 
                                    h.impact === "high" ? "bg-emerald-600" : 
                                    h.impact === "medium" ? "bg-emerald-500" : "bg-emerald-400"
                                  )} />
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[10px] text-emerald-700 dark:text-emerald-300 line-clamp-2">{h.description}</p>
                                    <span className="text-[9px] text-emerald-500/60 capitalize">{h.impact} impact - {h.touchpointChannel}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="p-1.5 space-y-1">
                                {highlightSolutions.map((sol) => (
                                  <div 
                                    key={sol.id} 
                                    className="group flex items-start gap-1 rounded bg-primary/5 p-1.5 cursor-pointer hover:bg-primary/10 transition-colors"
                                    onClick={() => setSelectedAppliedSolution(sol)}
                                  >
                                    <Lightbulb className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                                    <p className="text-[9px] text-foreground line-clamp-1 flex-1">{sol.solutions?.title}</p>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); handleDeleteAppliedSolution(sol.id) }}
                                      className="opacity-0 group-hover:opacity-100 h-3.5 w-3.5 flex items-center justify-center text-muted-foreground hover:text-destructive transition-opacity"
                                    >
                                      <XIcon className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                                <button
                                  onClick={() => { 
                                    setApplyModalStageId(stage.id)
                                    setApplyModalStepId(h.stepId)
                                    setApplyModalTouchpointId(h.touchpointId)
                                    setApplyModalPainPointId(null)
                                    setApplyModalHighlightId(h.id)
                                    setApplySearch("") 
                                  }}
                                  className="w-full flex items-center justify-center gap-1 rounded border border-dashed border-primary/30 py-1 text-[9px] text-primary hover:bg-primary/5 transition-colors"
                                >
                                  <Plus className="h-2.5 w-2.5" />
                                  Add Solution
                                </button>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* General Stage Solutions */}
            <div className="flex gap-0 border-b-2 border-primary/20 bg-primary/[0.02]">
              <div className="w-36 shrink-0 p-2 flex items-start">
                <Badge className="text-[10px] mt-1 bg-primary/10 text-primary border-primary/20">
                  <Zap className="mr-1 h-2.5 w-2.5" />
                  General
                </Badge>
              </div>
              {orderedStages.map((stage) => {
                // Show only solutions NOT attached to a pain point, highlight, OR touchpoint (for derived items)
                const stageApplied = appliedSolutions.filter((a) => a.stage_id === stage.id && !a.pain_point_id && !a.highlight_id && !a.touchpoint_id)
                return (
                  <div key={stage.id} className="flex-1 min-w-52 p-2 border-l border-primary/10">
                    <div className="flex flex-col gap-1.5">
                      {stageApplied.map((a) => (
                        <div 
                          key={a.id} 
                          className="group rounded border border-primary/20 bg-primary/5 p-2 cursor-pointer hover:border-primary/40 transition-colors"
                          onClick={() => setSelectedAppliedSolution(a)}
                        >
                          <div className="flex items-start gap-1.5">
                            <Lightbulb className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-medium text-foreground line-clamp-1">{a.solutions?.title || "Solution"}</p>
                              <p className="text-[9px] text-muted-foreground line-clamp-1">{a.solutions?.description}</p>
                            </div>
                            <button
                              title="Create Roadmap Issue"
                              onClick={(e) => { e.stopPropagation(); handleCreateRoadmapIssue(a.solution_id, a.solutions?.title || "Solution") }}
                              className="shrink-0 rounded p-0.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            >
                              <Target className="h-3 w-3" />
                            </button>
                            <button
                              title="Remove solution"
                              onClick={(e) => { e.stopPropagation(); handleDeleteAppliedSolution(a.id) }}
                              className="opacity-0 group-hover:opacity-100 shrink-0 rounded p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                            >
                              <XIcon className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => { 
                          setApplyModalStageId(stage.id)
                          setApplyModalStepId(null)
                          setApplyModalTouchpointId(null)
                          setApplyModalPainPointId(null)
                          setApplyModalHighlightId(null)
                          setApplySearch("") 
                        }}
                        className="flex items-center gap-1.5 rounded border-2 border-dashed border-primary/30 p-2 text-left hover:bg-primary/5 transition-colors"
                      >
                        <Plus className="h-3 w-3 text-primary shrink-0" />
                        <span className="text-[10px] font-medium text-primary">Apply Stage Solution</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Apply Solution Modal - Full Screen Overlay */}
            {applyModalStageId && (
              <div 
                className="fixed inset-0 z-[9999] flex items-start justify-center bg-black/60 pt-[10vh]" 
                onClick={() => { 
                  setApplyModalStageId(null)
                  setApplyModalPainPointId(null)
                  setApplyModalHighlightId(null)
                  setGeneratedSolutions([])
                  setSelectedSolutions(new Set())
                  setSavedGeneratedIds(new Set())
                  setGenerateContext("")
                  setSolutionModalTab("pick")
                }}
              >
                <div 
                  className="w-full max-w-4xl h-[55vh] rounded-xl border border-border bg-background shadow-2xl flex flex-col" 
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-border px-5 py-3 shrink-0">
                    <div className="flex items-center gap-4">
                      <h3 className="text-base font-semibold text-foreground">Add Solution</h3>
                      <Badge variant={applyModalPainPointId ? "destructive" : applyModalHighlightId ? "default" : "secondary"} className="text-[10px]">
                        {applyModalPainPointId ? "Pain Point" : applyModalHighlightId ? "Highlight" : orderedStages.find((s) => s.id === applyModalStageId)?.name}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8" 
                      onClick={() => { 
                        setApplyModalStageId(null)
                        setApplyModalPainPointId(null)
                        setApplyModalHighlightId(null)
                        setGeneratedSolutions([])
                        setSelectedSolutions(new Set())
                        setSavedGeneratedIds(new Set())
                      }}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex border-b border-border shrink-0">
                    <button
                      onClick={() => setSolutionModalTab("pick")}
                      className={cn(
                        "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors",
                        solutionModalTab === "pick" 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Pick Solution
                    </button>
                    <button
                      onClick={() => setSolutionModalTab("generate")}
                      className={cn(
                        "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors",
                        solutionModalTab === "generate" 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Generate Solution
                    </button>
                    <button
                      onClick={() => setSolutionModalTab("provide")}
                      className={cn(
                        "px-5 py-2.5 text-sm font-medium border-b-2 transition-colors",
                        solutionModalTab === "provide" 
                          ? "border-primary text-primary" 
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      Provide Solution
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 overflow-hidden flex flex-col">
                    {solutionModalTab === "pick" ? (
                      <>
                        {/* Search */}
                        <div className="px-5 py-3 border-b border-border bg-muted/20 shrink-0">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Search existing solutions..."
                              value={applySearch}
                              onChange={(e) => setApplySearch(e.target.value)}
                              className="h-9 pl-9 text-sm"
                            />
                          </div>
                        </div>
                        
                        {/* Solutions Grid */}
                        <div className="flex-1 overflow-y-auto p-4">
                          <div className="grid grid-cols-2 gap-3">
                            {solutionLibrary
                              .filter((s) => s.category !== "archetype")
                              .filter((s) => {
                                if (!applySearch.trim()) return true
                                return (
                                  s.title.toLowerCase().includes(applySearch.toLowerCase()) ||
                                  s.description?.toLowerCase().includes(applySearch.toLowerCase()) ||
                                  s.category?.toLowerCase().includes(applySearch.toLowerCase())
                                )
                              })
                              .map((sol) => {
                                const alreadyApplied = appliedSolutions.some(
                                  (a) => a.solution_id === sol.id && a.stage_id === applyModalStageId &&
                                    (applyModalPainPointId ? a.pain_point_id === applyModalPainPointId : 
                                     applyModalHighlightId ? a.highlight_id === applyModalHighlightId :
                                     !a.pain_point_id && !a.highlight_id)
                                )
                                const isSelected = selectedSolutions.has(sol.id)
                                return (
                                  <button
                                    key={sol.id}
                                    disabled={alreadyApplied}
                                    onClick={() => {
                                      const newSet = new Set(selectedSolutions)
                                      if (isSelected) {
                                        newSet.delete(sol.id)
                                      } else {
                                        newSet.add(sol.id)
                                      }
                                      setSelectedSolutions(newSet)
                                    }}
                                    className={cn(
                                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                                      alreadyApplied
                                        ? "border-muted bg-muted/30 opacity-50 cursor-not-allowed"
                                        : isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                                    )}>
                                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">{sol.title}</span>
                                        {alreadyApplied && <Badge variant="secondary" className="text-[9px]">Applied</Badge>}
                                        {sol.impact_score ? (
                                          <Badge variant="default" className="text-[9px] bg-emerald-600">
                                            +{sol.impact_score}% impact
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[9px] text-muted-foreground">Idea</Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-muted-foreground">{sol.description}</p>
                                      <Badge variant="outline" className="text-[9px] capitalize mt-2">{sol.category}</Badge>
                                    </div>
                                  </button>
                                )
                              })}
                          </div>
                          {solutionLibrary.filter(s => s.category !== "archetype").length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12">
                              <Lightbulb className="h-10 w-10 text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground mb-1">No solutions in library</p>
                              <p className="text-xs text-muted-foreground/70">Switch to Generate tab to create new solutions</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : solutionModalTab === "generate" ? (
                      <>
                        {/* Generate Tab */}
                        <div className="px-5 py-4 border-b border-border bg-muted/20 shrink-0">
                          <label className="text-xs font-medium text-muted-foreground mb-2 block">
                            Provide context for AI (optional)
                          </label>
                          <div className="flex gap-3">
                            <Input
                              placeholder="e.g., Customer struggles with checkout process, needs faster payment options..."
                              value={generateContext}
                              onChange={(e) => setGenerateContext(e.target.value)}
                              className="flex-1 h-9 text-sm"
                            />
                            <Button
                              size="sm"
                              className="h-9 gap-2"
                              disabled={isGenerating}
                              onClick={async () => {
                                setIsGenerating(true)
                                setGeneratedSolutions([])
                                setSavedGeneratedIds(new Set())
                                try {
                                  const stageName = orderedStages.find(s => s.id === applyModalStageId)?.name
                                  const baseContext = applyModalPainPointId 
                                    ? `Pain point in ${stageName} stage`
                                    : applyModalHighlightId 
                                    ? `Highlight in ${stageName} stage`
                                    : `${stageName} stage`
                                  const fullContext = generateContext ? `${baseContext}. ${generateContext}` : baseContext
                                  
                                  const res = await fetch("/api/generate-solutions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      journeyId,
                                      context: fullContext,
                                      industry: journey.archetype?.industry || "general",
                                      returnSolutions: true,
                                    }),
                                  })
                                  if (res.ok) {
                                    const data = await res.json()
                                    setGeneratedSolutions(data.solutions || [])
                                    toast.success("Solutions generated!")
                                  } else {
                                    toast.error("Failed to generate solutions")
                                  }
                                } catch {
                                  toast.error("Failed to generate solutions")
                                } finally {
                                  setIsGenerating(false)
                                }
                              }}
                            >
                              {isGenerating ? (
                                <>
                                  <div className="h-3.5 w-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                  Generating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5" />
                                  Generate Solutions
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Generated Solutions */}
                        <div className="flex-1 overflow-y-auto p-4">
                          {generatedSolutions.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3">
                              {generatedSolutions.map((sol) => {
                                const isSelected = selectedSolutions.has(sol.id)
                                return (
                                  <button
                                    key={sol.id}
                                    onClick={() => {
                                      const newSet = new Set(selectedSolutions)
                                      if (isSelected) {
                                        newSet.delete(sol.id)
                                      } else {
                                        newSet.add(sol.id)
                                      }
                                      setSelectedSolutions(newSet)
                                    }}
                                    className={cn(
                                      "flex items-start gap-3 rounded-lg border p-3 text-left transition-all",
                                      isSelected
                                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                                        : "border-border hover:border-primary/40 hover:bg-muted/30"
                                    )}
                                  >
                                    <div className={cn(
                                      "h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5",
                                      isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"
                                    )}>
                                      {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm font-medium text-foreground">{sol.title}</span>
                                        <Badge variant="outline" className="text-[9px] text-amber-600 border-amber-300">New Idea</Badge>
                                      </div>
                                      <p className="text-xs text-muted-foreground">{sol.description}</p>
                                      <div className="flex flex-wrap gap-1 mt-2">
                                        <Badge variant="outline" className="text-[9px] capitalize">{sol.category}</Badge>
                                        {sol.impact && (
                                          <Badge variant="outline" className={cn("text-[9px]", 
                                            sol.impact === "high" ? "border-emerald-500 text-emerald-600" :
                                            sol.impact === "medium" ? "border-amber-500 text-amber-600" :
                                            "border-slate-400 text-slate-500"
                                          )}>
                                            {sol.impact} impact
                                          </Badge>
                                        )}
                                        {sol.effort && (
                                          <Badge variant="outline" className={cn("text-[9px]", 
                                            sol.effort === "low" ? "border-emerald-500 text-emerald-600" :
                                            sol.effort === "medium" ? "border-amber-500 text-amber-600" :
                                            "border-red-500 text-red-500"
                                          )}>
                                            {sol.effort} effort
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-12">
                              <Sparkles className="h-10 w-10 text-muted-foreground/30 mb-3" />
                              <p className="text-sm text-muted-foreground mb-1">No solutions generated yet</p>
                              <p className="text-xs text-muted-foreground/70">Add context above and click Generate</p>
                            </div>
                          )}
                        </div>
                      </>
                    ) : solutionModalTab === "provide" ? (
                      <>
                        {/* Provide Solution Form */}
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Solution Name</Label>
                            <Input
                              placeholder="e.g., Mobile App Onboarding Flow"
                              value={provideSolutionName}
                              onChange={(e) => setProvideSolutionName(e.target.value)}
                              className="h-10"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Description</Label>
                            <Textarea
                              placeholder="Describe how this solution addresses the customer pain point or enhances the experience..."
                              value={provideSolutionDesc}
                              onChange={(e) => setProvideSolutionDesc(e.target.value)}
                              rows={6}
                              className="resize-none"
                            />
                          </div>
                          <div className="pt-2">
                            <Button
                              onClick={async () => {
                                if (!provideSolutionName.trim() || !provideSolutionDesc.trim()) {
                                  toast.error("Please provide both name and description")
                                  return
                                }
                                setProvidingCustom(true)
                                try {
                                  // Save to solutions library with journey's industry
                                  const saveRes = await fetch("/api/solutions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      title: provideSolutionName,
                                      description: provideSolutionDesc,
                                      category: "behavioral", // Default valid category
                                      tags: ["custom", "user-provided"],
                                      industry: journey?.category || null,
                                    }),
                                  })
                                  if (!saveRes.ok) throw new Error("Failed to save solution")
                                  const { id: solutionId } = await saveRes.json()
                                  
                                  // Apply to the current context
                                  await handleApplySolution(solutionId, applyModalStageId!, applyModalStepId, applyModalTouchpointId, applyModalPainPointId, applyModalHighlightId)
                                  
                                  // Reset and close
                                  setProvideSolutionName("")
                                  setProvideSolutionDesc("")
                                  setApplyModalStageId(null)
                                  setApplyModalPainPointId(null)
                                  setApplyModalHighlightId(null)
                                  mutateSolutions()
                                  toast.success("Solution created and applied!")
                                } catch (err) {
                                  console.error("[v0] Error providing solution:", err)
                                  toast.error("Failed to create solution")
                                } finally {
                                  setProvidingCustom(false)
                                }
                              }}
                              disabled={!provideSolutionName.trim() || !provideSolutionDesc.trim() || providingCustom}
                              className="w-full"
                            >
                              {providingCustom ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-2" />
                                  Create & Apply Solution
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>

                  {/* Footer with Apply Button */}
                  {selectedSolutions.size > 0 && solutionModalTab !== "provide" && (
                    <div className="border-t border-border px-5 py-3 bg-muted/20 flex items-center justify-between shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {selectedSolutions.size} solution{selectedSolutions.size > 1 ? "s" : ""} selected
                      </span>
                      <div className="flex items-center gap-2">
                        {solutionModalTab === "generate" && generatedSolutions.length > 0 && (() => {
                          const unsavedSelected = [...selectedSolutions].filter(id => !savedGeneratedIds.has(id))
                          return unsavedSelected.length > 0 ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                const toSave = generatedSolutions.filter(s => selectedSolutions.has(s.id) && !savedGeneratedIds.has(s.id))
                                const newSavedIds = new Set(savedGeneratedIds)
                                for (const sol of toSave) {
                                  await fetch("/api/solutions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      title: sol.title,
                                      description: sol.description,
                                      category: sol.category,
                                      tags: [],
                                    }),
                                  })
                                  newSavedIds.add(sol.id)
                                }
                                setSavedGeneratedIds(newSavedIds)
                                mutateSolutions()
                                toast.success(`${toSave.length} solution(s) saved to library!`)
                              }}
                            >
                              <Bookmark className="h-3.5 w-3.5 mr-1.5" />
                              Save to Library
                            </Button>
                          ) : null
                        })()}
                        <Button
                          size="sm"
                          onClick={async () => {
                            const allSolutions = solutionModalTab === "pick" 
                              ? solutionLibrary.filter(s => selectedSolutions.has(s.id))
                              : generatedSolutions.filter(s => selectedSolutions.has(s.id))
                            
                            let successCount = 0
                            for (const sol of allSolutions) {
                              try {
                                if (solutionModalTab === "generate") {
                                  // Save generated solution first
                                  const saveRes = await fetch("/api/solutions", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      title: sol.title,
                                      description: sol.description,
                                      category: sol.category,
                                      tags: [],
                                    }),
                                  })
                                  if (saveRes.ok) {
                                    const data = await saveRes.json()
                                    if (data.id) {
                                      await handleApplySolution(data.id, applyModalStageId!, applyModalStepId, applyModalTouchpointId, applyModalPainPointId, applyModalHighlightId)
                                      successCount++
                                    }
                                  } else {
                                    console.error("[v0] Failed to save solution:", await saveRes.text())
                                  }
                                } else {
                                  await handleApplySolution(sol.id, applyModalStageId!, applyModalStepId, applyModalTouchpointId, applyModalPainPointId, applyModalHighlightId)
                                  successCount++
                                }
                              } catch (err) {
                                console.error("[v0] Error applying solution:", err)
                              }
                            }
                            
                            setApplyModalStageId(null)
                            setApplyModalPainPointId(null)
                            setApplyModalHighlightId(null)
                            setGeneratedSolutions([])
                            setSelectedSolutions(new Set())
                            setSavedGeneratedIds(new Set())
                            if (successCount > 0) {
                              toast.success(`${successCount} solution(s) applied!`)
                            }
                          }}
                        >
                          Apply {selectedSolutions.size} Solution{selectedSolutions.size > 1 ? "s" : ""}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Emotional Score row */}
            <div className="flex gap-0">
              <div className="w-36 shrink-0 p-2 flex items-start">
                <Badge variant="secondary" className="text-[10px] mt-1">Emotion</Badge>
              </div>
              {orderedStages.map((stage) => {
                const allTps = stage.steps.flatMap((s) => s.touchPoints)
                const avg = allTps.length > 0
                  ? allTps.reduce((sum, tp) => sum + tp.emotionalScore, 0) / allTps.length
                  : 0
                return (
                  <div key={stage.id} className="flex-1 min-w-52 p-2 border-l border-border/30 flex items-center">
                    <div className={cn("h-3 w-3 rounded-full mr-2", scoreColor(avg))} />
                    <span className={cn(
                      "text-sm font-mono font-bold",
                      avg >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {avg > 0 ? "+" : ""}{avg.toFixed(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ========= LINGO VIEW ========= */}
        {viewMode === "lingo" && (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-md w-full text-center border border-dashed border-border rounded-lg p-8 bg-card">
              <div className="mx-auto w-16 h-16 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-6">
                <Languages className="h-8 w-8 text-violet-600 dark:text-violet-400" />
              </div>
              
              <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 mb-4">
                Coming Soon
              </span>
              
              <h2 className="text-xl font-semibold mb-3">Lingo</h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Create a shared vocabulary for this journey. Define terms, acronyms, and phrases that matter to your customers.
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => toast.success("We'll notify you when Lingo is available!")}
              >
                <Bell className="h-3.5 w-3.5" />
                Notify Me
              </Button>
            </div>
          </div>
        )}

        {/* ========= RITUALS VIEW ========= */}
        {viewMode === "rituals" && (
          <div className="flex items-center justify-center min-h-[60vh] p-6">
            <div className="max-w-md w-full text-center border border-dashed border-border rounded-lg p-8 bg-card">
              <div className="mx-auto w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mb-6">
                <RefreshCw className="h-8 w-8 text-rose-600 dark:text-rose-400" />
              </div>
              
              <span className="inline-block rounded-full bg-amber-100 dark:bg-amber-900/30 px-3 py-1 text-xs font-medium text-amber-700 dark:text-amber-300 mb-4">
                Coming Soon
              </span>
              
              <h2 className="text-xl font-semibold mb-3">Rituals</h2>
              
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Establish recurring customer rituals and ceremonies. Build habits and routines that strengthen customer relationships.
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => toast.success("We'll notify you when Rituals is available!")}
              >
                <Bell className="h-3.5 w-3.5" />
                Notify Me
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comment Sidebar */}
<CommentSidebar
  journeyId={journey.id}
  stages={journey.stages}
  open={commentsOpen}
  onClose={() => setCommentsOpen(false)}
  highlightStageId={commentFilterStageId}
  highlightStepId={commentFilterStepId}
  highlightTouchpointId={commentFilterTouchpointId}
  onClearHighlight={() => {
    setCommentFilterStageId(null)
    setCommentFilterStepId(null)
    setCommentFilterTouchpointId(null)
  }}
  onNavigateToTouchpoint={(touchpointId, stageId, stepId) => {
    // Highlight the touchpoint
    setHighlightedTouchpointId(touchpointId)
    
    // Scroll to the touchpoint element
    setTimeout(() => {
      const element = document.getElementById(`touchpoint-${touchpointId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" })
      }
    }, 100)
    
    // Remove highlight after 3 seconds
    setTimeout(() => {
      setHighlightedTouchpointId(null)
    }, 3000)
  }}
/>
      </div>

      {/* Bottom emotional arc bar */}
      <div className="flex items-center gap-4 border-t border-border bg-background px-4 py-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground shrink-0 flex items-center gap-1.5">
          Emotional Arc
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground/50 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-52 text-xs">
                Average emotional score per stage. Values range from -5 (very negative) to +5 (very positive).
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </span>
        <div className="flex-1 flex items-center justify-center">
          <MiniEmotionalArc data={emotionalArc} width={500} height={36} />
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {emotionalArc.map((point) => (
            <span key={point.stageName} className="text-[9px] text-muted-foreground text-center">
              <span className={`block font-mono font-bold ${point.score >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {point.score > 0 ? "+" : ""}{point.score}
              </span>
            </span>
          ))}
        </div>
      </div>

      {/* Touch point detail panel */}
<TouchPointDetailPanel
  touchPoint={selectedTouchPoint?.touchPoint ?? null}
  open={!!selectedTouchPoint}
  onClose={() => setSelectedTouchPointInfo(null)}
  onDelete={() => { setSelectedTouchPointInfo(null); mutate() }}
  stageName={selectedTouchPoint?.stageName}
  stepName={selectedTouchPoint?.stepName}
  stageId={selectedTouchPoint?.stageId}
  stepId={selectedTouchPoint?.stepId}
  journeyId={journeyId}
  onOpenComments={(touchpointId) => {
    setCommentFilterTouchpointId(touchpointId)
    setCommentFilterStageId(selectedTouchPoint?.stageId || null)
    setCommentFilterStepId(selectedTouchPoint?.stepId || null)
    setCommentsOpen(true)
  }}
/>

      {/* Applied Solution Detail Panel */}
      {selectedAppliedSolution && (
        <div className="fixed inset-y-0 right-0 w-96 border-l border-border bg-background shadow-xl z-50 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold text-foreground">Applied Solution</h3>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7"
              onClick={() => setSelectedAppliedSolution(null)}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Solution Info */}
            <div className="space-y-3">
              {editingSolution ? (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Title</Label>
                    <Input
                      value={editSolutionTitle}
                      onChange={(e) => setEditSolutionTitle(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-muted-foreground">Description</Label>
                    <Textarea
                      value={editSolutionDesc}
                      onChange={(e) => setEditSolutionDesc(e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setEditingSolution(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      disabled={savingSolution || !editSolutionTitle.trim()}
                      onClick={async () => {
                        setSavingSolution(true)
                        try {
                          await fetch("/api/solutions", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              id: selectedAppliedSolution.solution_id,
                              title: editSolutionTitle,
                              description: editSolutionDesc,
                            }),
                          })
                          mutateSolutions()
                          mutateApplied()
                          setEditingSolution(false)
                          toast.success("Solution updated")
                        } catch {
                          toast.error("Failed to update solution")
                        } finally {
                          setSavingSolution(false)
                        }
                      }}
                    >
                      {savingSolution ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="flex items-start justify-between">
                      <h4 className="text-base font-semibold text-foreground">{selectedAppliedSolution.solutions?.title}</h4>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 shrink-0"
                        onClick={() => {
                          setEditSolutionTitle(selectedAppliedSolution.solutions?.title || "")
                          setEditSolutionDesc(selectedAppliedSolution.solutions?.description || "")
                          setEditingSolution(true)
                        }}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] capitalize">{selectedAppliedSolution.solutions?.category}</Badge>
                      {selectedAppliedSolution.solutions?.impact_verified ? (
                        <Badge variant="default" className="text-[10px] bg-emerald-600">
                          +{selectedAppliedSolution.solutions?.impact_score}% verified impact
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-muted-foreground">Idea</Badge>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Description</label>
                    <p className="text-sm text-foreground mt-1">{selectedAppliedSolution.solutions?.description}</p>
                  </div>
                </>
              )}
            </div>

            {/* Application Context */}
            <div className="space-y-3 pt-3 border-t border-border">
              <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Applied To</h5>
              
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Stage</span>
                  <span className="text-xs font-medium text-foreground">
                    {orderedStages.find(s => s.id === selectedAppliedSolution.stage_id)?.name || "Unknown"}
                  </span>
                </div>
                
                {selectedAppliedSolution.touchpoint_id && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Touchpoint</span>
                    <span className="text-xs font-medium text-foreground">Associated</span>
                  </div>
                )}
                
                {selectedAppliedSolution.pain_point_id && (
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">Pain Point</span>
                    <Badge variant="destructive" className="text-[9px]">Fixing Pain</Badge>
                  </div>
                )}
                
                {selectedAppliedSolution.highlight_id && (
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">Highlight</span>
                    <Badge className="text-[9px] bg-emerald-600">Enhancing</Badge>
                  </div>
                )}
                
                {!selectedAppliedSolution.pain_point_id && !selectedAppliedSolution.highlight_id && !selectedAppliedSolution.touchpoint_id && (
                  <div className="flex items-start justify-between">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <Badge variant="secondary" className="text-[9px]">General Stage Solution</Badge>
                  </div>
                )}
              </div>

              {selectedAppliedSolution.notes && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <p className="text-sm text-foreground mt-1">{selectedAppliedSolution.notes}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-3 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={() => handleCreateRoadmapIssue(selectedAppliedSolution.solution_id, selectedAppliedSolution.solutions?.title || "Solution")}
              >
                <Target className="h-4 w-4" />
                Add to Roadmap
              </Button>
            </div>
          </div>

          {/* Footer with Delete */}
          <div className="border-t border-border p-4">
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => handleDeleteAppliedSolution(selectedAppliedSolution.id)}
            >
              Remove Applied Solution
            </Button>
          </div>
        </div>
      )}

      {/* AI Stage Dialog */}
      <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Add Stage
            </DialogTitle>
            <DialogDescription>
              Create a new stage manually or describe it and let AI generate steps and touch points for you.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="stage-name" className="text-sm font-medium">Stage Name</Label>
              <Input
                id="stage-name"
                placeholder="e.g., Post-Purchase Support"
                value={aiStageName}
                onChange={(e) => setAiStageName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="stage-desc" className="text-sm font-medium">
                Describe the stage for AI
                <span className="text-muted-foreground font-normal ml-1">(optional)</span>
              </Label>
              <Textarea
                id="stage-desc"
                placeholder="Describe what happens in this stage, the customer actions, channels involved, expected emotions... AI will generate steps and touch points based on your description."
                className="min-h-28 text-sm"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setAiDialogOpen(false)
                if (aiStageName.trim()) {
                  toast.success(`Stage "${aiStageName}" added`)
                }
                setAiStageName("")
                setAiDescription("")
              }}
              disabled={!aiStageName.trim()}
            >
              Add Manually
            </Button>
            <Button
              onClick={handleAiGenerate}
              disabled={!aiStageName.trim() || !aiDescription.trim() || aiGenerating}
              className="gap-1.5"
            >
              {aiGenerating ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  Generate with AI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      {exportDialogOpen && journey && (
        <ExportDialog 
          type="journey" 
          data={journey} 
          elementRef={canvasRef}
          title={journey.title}
        >
          <span className="hidden" />
        </ExportDialog>
      )}
      {exportDialogOpen && journey && (
        <div className="fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setExportDialogOpen(false)} />
          <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-xl border p-6 w-full max-w-md z-50">
            <ExportDialogContent 
              type="journey" 
              data={journey} 
              elementRef={canvasRef}
              onClose={() => setExportDialogOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

// Inline export dialog content for canvas page
function ExportDialogContent({ 
  type, 
  data, 
  elementRef, 
  onClose 
}: { 
  type: "journey" | "archetype"
  data: import("@/lib/types").Journey | import("@/lib/types").Archetype
  elementRef?: React.RefObject<HTMLElement | null>
  onClose: () => void 
}) {
  const [format, setFormat] = useState<"csv" | "pdf" | "png" | "svg">("csv")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [exporting, setExporting] = useState(false)
  
  const itemName = type === "journey" ? (data as import("@/lib/types").Journey).title : (data as import("@/lib/types").Archetype).name
  
  async function handleExport() {
    setExporting(true)
    const { journeyToCSV, journeyMetadataToCSV, downloadCSV, downloadPNG, downloadPDF, downloadSVGFromElement, sanitizeFilename } = await import("@/lib/export-utils")
    const filename = sanitizeFilename(itemName)
    
    try {
      switch (format) {
        case "csv":
          if (type === "journey") {
            const journey = data as import("@/lib/types").Journey
            let content = journeyToCSV(journey)
            if (includeMetadata) {
              content = journeyMetadataToCSV(journey) + "\n\n" + content
            }
            downloadCSV(content, `${filename}-journey.csv`)
          }
          toast.success("CSV exported successfully")
          break
          
        case "pdf":
          if (elementRef?.current) {
            await downloadPDF(elementRef.current, `${filename}.pdf`, itemName)
            toast.success("PDF exported successfully")
          } else {
            window.print()
            toast.success("Print dialog opened")
          }
          break
          
        case "png":
          if (elementRef?.current) {
            await downloadPNG(elementRef.current, `${filename}.png`)
            toast.success("PNG exported successfully")
          } else {
            toast.error("No content element available for export")
          }
          break
          
        case "svg":
          if (elementRef?.current) {
            await downloadSVGFromElement(elementRef.current, `${filename}.svg`)
            toast.success("SVG exported successfully")
          } else {
            toast.error("No content element available for export")
          }
          break
      }
      
      onClose()
    } catch (error) {
      console.error("Export failed:", error)
      toast.error("Export failed. Please try again.")
    } finally {
      setExporting(false)
    }
  }
  
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Export Journey</h2>
        <p className="text-sm text-muted-foreground">Choose a format to export {itemName}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        {(["csv", "pdf", "png", "svg"] as const).map((f) => (
          <label
            key={f}
            className={cn(
              "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
              format === f ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"
            )}
          >
            <input
              type="radio"
              name="format"
              value={f}
              checked={format === f}
              onChange={() => setFormat(f)}
              className="sr-only"
            />
            <div>
              <p className="text-sm font-medium uppercase">{f}</p>
              <p className="text-[10px] text-muted-foreground">
                {f === "csv" && "Spreadsheet data"}
                {f === "pdf" && "Print / Save as PDF"}
                {f === "png" && "High-res image"}
                {f === "svg" && "Vector graphic"}
              </p>
            </div>
          </label>
        ))}
      </div>
      
      {format === "csv" && type === "journey" && (
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
            className="rounded border-border"
          />
          Include journey metadata
        </label>
      )}
      
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={handleExport} disabled={exporting} className="gap-2">
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            "Download"
          )}
        </Button>
      </div>
    </div>
  )
}
