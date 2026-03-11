"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, GripVertical, ArrowUp, ArrowDown, MessageSquare, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { TouchPointItem } from "@/components/canvas/touch-point-item"
import { Button } from "@/components/ui/button"
import { AddTouchPointDialog, DeleteConfirmDialog } from "@/components/canvas/canvas-dialogs"
import { deleteStep, getStepWithChildren, restoreStep } from "@/lib/actions/data"
import { mutate } from "swr"
import type { Step, TouchPoint } from "@/lib/types"
import { showUndoToast } from "@/components/undo-toast"

interface StepCardProps {
  step: Step
  stageNumber: number
  stepIndex: number
  journeyId: string
  onTouchPointClick: (tp: TouchPoint) => void
  filterChannel: string
  editMode: boolean
  onMoveUp?: () => void
  onMoveDown?: () => void
  commentCount?: number
  onCommentClick?: () => void
  highlightedTouchpointId?: string | null
}

export function StepCard({
  step,
  stageNumber,
  stepIndex,
  journeyId,
  onTouchPointClick,
  filterChannel,
  editMode,
  onMoveUp,
  onMoveDown,
  commentCount = 0,
  onCommentClick,
  highlightedTouchpointId,
}: StepCardProps) {
  const [expanded, setExpanded] = useState(true)

  const filteredTps = filterChannel === "all"
    ? step.touchPoints
    : step.touchPoints.filter((tp) => tp.channel === filterChannel)

  const stepNumber = `${stageNumber}.${stepIndex + 1}`

  return (
    <div className="rounded-lg border border-border/60 bg-background">
      {/* Step header */}
      <div className="flex items-center gap-0">
        {editMode && (
          <div className="flex flex-col items-center border-r border-border/40 px-0.5 py-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={onMoveUp}
              disabled={!onMoveUp}
            >
              <ArrowUp className="h-2.5 w-2.5" />
              <span className="sr-only">Move up</span>
            </Button>
            <GripVertical className="h-3 w-3 text-muted-foreground/50" />
            <Button
              variant="ghost"
              size="icon"
              className="h-4 w-4"
              onClick={onMoveDown}
              disabled={!onMoveDown}
            >
              <ArrowDown className="h-2.5 w-2.5" />
              <span className="sr-only">Move down</span>
            </Button>
          </div>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-start gap-2 px-3 py-2 text-left hover:bg-accent/30 transition-colors overflow-hidden"
        >
          {expanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="shrink-0 text-[10px] font-mono font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                {stepNumber}
              </span>
              <p className="text-xs font-medium text-foreground truncate flex-1 min-w-0">{step.name}</p>
            </div>
            {step.description && (
              <p 
                className="text-[10px] text-muted-foreground line-clamp-2 leading-relaxed cursor-help"
                title={step.description}
              >
                {step.description}
              </p>
            )}
            {/* Badges row - always visible below content */}
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {filteredTps.length} touchpoint{filteredTps.length !== 1 ? "s" : ""}
              </span>
              {commentCount > 0 && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCommentClick?.() }}
                  className="flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-medium text-primary hover:bg-primary/20 transition-colors"
                >
                  <MessageSquare className="h-2.5 w-2.5" />
                  {commentCount}
                </button>
              )}
            </div>
          </div>
        </button>
      </div>

      {/* Touch points */}
      {expanded && (
        <div className="flex flex-col gap-1.5 px-2.5 pb-2.5">
          {filteredTps.map((tp) => (
            <TouchPointItem
              key={tp.id}
              touchPoint={tp}
              journeyId={journeyId}
              onClick={() => onTouchPointClick(tp)}
              editMode={editMode}
              isHighlighted={highlightedTouchpointId === tp.id}
            />
          ))}
          {filteredTps.length === 0 && (
            <p className="py-2 text-center text-[10px] text-muted-foreground">
              No touch points{filterChannel !== "all" ? ` for ${filterChannel}` : ""}
            </p>
          )}
          {editMode && (
            <div className="flex gap-1">
              <AddTouchPointDialog stepId={step.id} journeyId={journeyId} stepName={step.name}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 flex-1 justify-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Plus className="h-2.5 w-2.5" />
                  Add Touchpoint
                </Button>
              </AddTouchPointDialog>
              <DeleteConfirmDialog
                title="Delete Step"
                description={`Delete "${step.name}" and all its touch points?`}
                onConfirm={async () => {
                  // Get full step data before deleting for undo
                  const stepData = await getStepWithChildren(step.id)
                  if (!stepData) return
                  
                  await deleteStep(step.id, journeyId)
                  mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                  
                  // Show undo toast
                  showUndoToast({
                    message: "Step deleted",
                    description: `"${step.name}" has been removed.`,
                    duration: 10000,
                    onUndo: async () => {
                      await restoreStep(stepData, journeyId)
                      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                    },
                  })
                }}
              >
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/60 hover:text-destructive shrink-0">
                  <Trash2 className="h-2.5 w-2.5" />
                  <span className="sr-only">Delete step</span>
                </Button>
              </DeleteConfirmDialog>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
