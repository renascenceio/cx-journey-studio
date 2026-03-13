"use client"

import { Plus, ArrowLeft, ArrowRight, MessageSquare, Trash2, Pencil, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StepCard } from "@/components/canvas/step-card"
import { AddStepDialog, DeleteConfirmDialog } from "@/components/canvas/canvas-dialogs"
import type { Stage, TouchPoint } from "@/lib/types"
import { cn } from "@/lib/utils"
import { deleteStage, updateStage, getStageWithChildren, restoreStage } from "@/lib/actions/data"
import { calculateTouchPointScore } from "@/lib/data-utils"
import { mutate } from "swr"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { showUndoToast } from "@/components/undo-toast"

function stageAvgScore(stage: Stage): number {
  const scores = stage.steps.flatMap((s) => s.touchPoints.map((tp) => calculateTouchPointScore(tp)))
  if (scores.length === 0) return 0
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

function scoreBg(score: number) {
  if (score <= -2) return "bg-red-100 dark:bg-red-900/20"
  if (score <= 0) return "bg-orange-50 dark:bg-orange-900/10"
  if (score <= 2) return "bg-yellow-50 dark:bg-yellow-900/10"
  return "bg-green-50 dark:bg-green-900/10"
}

function scoreText(score: number) {
  if (score <= -2) return "text-red-600 dark:text-red-400"
  if (score <= 0) return "text-orange-600 dark:text-orange-400"
  if (score <= 2) return "text-yellow-600 dark:text-yellow-400"
  return "text-green-600 dark:text-green-400"
}

interface StageColumnProps {
  stage: Stage
  stageIndex: number
  journeyId: string
  onTouchPointClick: (tp: TouchPoint) => void
  filterChannel: string
  editMode: boolean
  onMoveStageLeft?: () => void
  onMoveStageRight?: () => void
  isFirst?: boolean
  isLast?: boolean
  onReorderStep?: (fromIndex: number, toIndex: number) => void
  commentCount?: number
  onCommentClick?: () => void
  getStepCommentCount?: (stepId: string) => number
  onStepCommentClick?: (stepId: string) => void
  highlightedTouchpointId?: string | null
  // Drag-and-drop props
  isDragging?: boolean
  isDragOver?: boolean
  onDragStart?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
  onDragEnd?: () => void
}

export function StageColumn({
  stage,
  stageIndex,
  journeyId,
  onTouchPointClick,
  filterChannel,
  editMode,
  onMoveStageLeft,
  onMoveStageRight,
  isFirst,
  isLast,
  onReorderStep,
  commentCount = 0,
  onCommentClick,
  getStepCommentCount,
  onStepCommentClick,
  highlightedTouchpointId,
  // Drag-and-drop
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
}: StageColumnProps) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(stage.name)
  
  // Local drag-drop state for steps
  const [draggedStepIdx, setDraggedStepIdx] = useState<number | null>(null)
  const [dragOverStepIdx, setDragOverStepIdx] = useState<number | null>(null)
  
  function handleStepDragStart(e: React.DragEvent, idx: number) {
    if (!editMode) return
    e.stopPropagation() // Prevent stage drag
    setDraggedStepIdx(idx)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", `step-${idx}`)
  }
  
  function handleStepDragOver(e: React.DragEvent, idx: number) {
    if (!editMode || draggedStepIdx === null || draggedStepIdx === idx) return
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = "move"
    setDragOverStepIdx(idx)
  }
  
  function handleStepDragLeave() {
    setDragOverStepIdx(null)
  }
  
  function handleStepDrop(e: React.DragEvent, targetIdx: number) {
    e.preventDefault()
    e.stopPropagation()
    if (!editMode || draggedStepIdx === null || draggedStepIdx === targetIdx) return
    
    // Call the reorder callback
    if (onReorderStep) {
      onReorderStep(draggedStepIdx, targetIdx)
    }
    
    setDraggedStepIdx(null)
    setDragOverStepIdx(null)
  }
  
  function handleStepDragEnd() {
    setDraggedStepIdx(null)
    setDragOverStepIdx(null)
  }
  const avg = stageAvgScore(stage)
  const totalTps = stage.steps.reduce(
    (sum, step) =>
      sum +
      (filterChannel === "all"
        ? step.touchPoints.length
        : step.touchPoints.filter((tp) => tp.channel === filterChannel).length),
    0
  )

  const stageNumber = stageIndex + 1

  return (
    <div 
      className={cn(
        "flex w-72 shrink-0 flex-col rounded-xl border border-border/60 bg-muted/30 overflow-hidden transition-all",
        editMode && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-50 ring-2 ring-primary",
        isDragOver && "ring-2 ring-primary ring-offset-2 border-primary"
      )}
      draggable={editMode}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
    >
      {/* Stage header */}
      <div className={`flex items-center justify-between px-3 py-3 border-b border-border/40 ${scoreBg(avg)}`}>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {editMode && (
            <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 cursor-grab" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {isRenaming && editMode ? (
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={async () => {
                    if (renameValue.trim() && renameValue !== stage.name) {
                      await updateStage(stage.id, journeyId, renameValue.trim())
                      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                      toast.success("Stage renamed")
                    }
                    setIsRenaming(false)
                  }}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter") {
                      (e.target as HTMLInputElement).blur()
                    } else if (e.key === "Escape") {
                      setRenameValue(stage.name)
                      setIsRenaming(false)
                    }
                  }}
                  className="h-6 text-sm font-semibold px-1 py-0"
                  autoFocus
                />
              ) : (
                <h3
                  className={cn("text-sm font-semibold text-foreground truncate", editMode && "cursor-pointer hover:underline")}
                  onDoubleClick={() => editMode && setIsRenaming(true)}
                >
                  {stageNumber}. {stage.name}
                </h3>
              )}
              {editMode && !isRenaming && (
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setIsRenaming(true)}>
                    <Pencil className="h-2.5 w-2.5" />
                    <span className="sr-only">Rename stage</span>
                  </Button>
                  <DeleteConfirmDialog
                    title="Delete Stage"
                    description={`Delete "${stage.name}" and all its steps and touch points?`}
                    onConfirm={async () => {
                      // Get full stage data before deleting for undo
                      const stageData = await getStageWithChildren(stage.id)
                      if (!stageData) return
                      
                      // Delete immediately
                      await deleteStage(stage.id, journeyId)
                      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                      
                      // Show undo toast
                      showUndoToast({
                        message: "Stage deleted",
                        description: `"${stage.name}" and all its contents have been removed.`,
                        duration: 10000,
                        onUndo: async () => {
                          await restoreStage(stageData, journeyId)
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                        },
                      })
                    }}
                  >
                    <Button variant="ghost" size="icon" className="h-5 w-5 text-destructive/70 hover:text-destructive">
                      <Trash2 className="h-2.5 w-2.5" />
                      <span className="sr-only">Delete stage</span>
                    </Button>
                  </DeleteConfirmDialog>
                </div>
              )}
            </div>
            <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{stage.steps.length} steps</span>
              <span className="text-muted-foreground/40">|</span>
              <span>{totalTps} Touchpoints</span>
            </div>
          </div>
        </div>
        {/* Right side: Score on top, comments below, centered vertically */}
        <div className="flex flex-col items-center justify-center gap-1 shrink-0 ml-2">
          <span className={`text-base font-bold font-mono leading-none ${scoreText(avg)}`}>
            {avg > 0 ? "+" : ""}{avg.toFixed(1)}
          </span>
          {commentCount > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); onCommentClick?.() }}
              className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <MessageSquare className="h-2.5 w-2.5" />
              {commentCount}
            </button>
          )}
        </div>
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-2.5 p-2.5 flex-1 overflow-y-auto">
        {stage.steps.map((step, stepIdx) => (
          <StepCard
            key={step.id}
            step={step}
            stageNumber={stageNumber}
            stepIndex={stepIdx}
            journeyId={journeyId}
            onTouchPointClick={onTouchPointClick}
            filterChannel={filterChannel}
            editMode={editMode}
            onMoveUp={
              editMode && stepIdx > 0 && onReorderStep
                ? () => onReorderStep(stepIdx, stepIdx - 1)
                : undefined
            }
            onMoveDown={
              editMode && stepIdx < stage.steps.length - 1 && onReorderStep
                ? () => onReorderStep(stepIdx, stepIdx + 1)
                : undefined
            }
            commentCount={getStepCommentCount?.(step.id) ?? 0}
            onCommentClick={() => onStepCommentClick?.(step.id)}
            highlightedTouchpointId={highlightedTouchpointId}
            // Drag-and-drop props for steps
            isDragging={draggedStepIdx === stepIdx}
            isDragOver={dragOverStepIdx === stepIdx}
            onDragStart={(e) => handleStepDragStart(e, stepIdx)}
            onDragOver={(e) => handleStepDragOver(e, stepIdx)}
            onDragLeave={handleStepDragLeave}
            onDrop={(e) => handleStepDrop(e, stepIdx)}
            onDragEnd={handleStepDragEnd}
          />
        ))}
        {editMode && (
          <AddStepDialog stageId={stage.id} journeyId={journeyId} stageName={stage.name}>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-full justify-center gap-1 text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60"
            >
              <Plus className="h-3 w-3" />
              Add Step
            </Button>
          </AddStepDialog>
        )}
      </div>
    </div>
  )
}
