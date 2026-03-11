"use client"

import { AlertTriangle, Sparkles, ChevronDown, ChevronRight, Plus, Trash2, Bot, User } from "lucide-react"
import { cn } from "@/lib/utils"
import type { TouchPoint, PainPoint, Highlight } from "@/lib/types"
import { getEffectivePainPoints, getEffectiveHighlights, calculateTouchPointScore } from "@/lib/data-utils"
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
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { addPainPoint, addHighlight, deletePainPoint, deleteHighlight } from "@/lib/actions/data"
import { toast } from "sonner"
import { mutate } from "swr"

function scoreColor(score: number) {
  if (score <= -3) return "bg-red-500"
  if (score <= -1) return "bg-orange-400"
  if (score <= 1) return "bg-yellow-400"
  if (score <= 3) return "bg-emerald-400"
  return "bg-green-500"
}

function scoreBorder(score: number) {
  if (score <= -3) return "border-red-200 dark:border-red-800/50"
  if (score <= -1) return "border-orange-200 dark:border-orange-800/50"
  if (score <= 1) return "border-yellow-200 dark:border-yellow-800/50"
  if (score <= 3) return "border-emerald-200 dark:border-emerald-800/50"
  return "border-green-200 dark:border-green-800/50"
}

function severityColor(severity: string) {
  if (severity === "critical") return "bg-red-600"
  if (severity === "high") return "bg-red-500"
  if (severity === "medium") return "bg-orange-500"
  return "bg-yellow-500"
}

function impactColor(impact: string) {
  if (impact === "high") return "bg-emerald-600"
  if (impact === "medium") return "bg-emerald-500"
  return "bg-emerald-400"
}

interface TouchPointItemProps {
  touchPoint: TouchPoint
  journeyId: string
  onClick: () => void
  onPainPointClick?: (pp: PainPoint) => void
  onHighlightClick?: (h: Highlight) => void
  editMode?: boolean
  isHighlighted?: boolean
}

export function TouchPointItem({ 
  touchPoint,
  journeyId,
  onClick,
  onPainPointClick,
  onHighlightClick,
  editMode,
  isHighlighted,
}: TouchPointItemProps) {
  const painPoints = getEffectivePainPoints(touchPoint)
  const highlights = getEffectiveHighlights(touchPoint)
  const [expanded, setExpanded] = useState(true)
  const hasChildren = painPoints.length > 0 || highlights.length > 0
  
  // Calculate the dynamic score based on pain points and highlights
  const calculatedScore = calculateTouchPointScore(touchPoint)
  
  // Add pain point dialog state
  const [addPainOpen, setAddPainOpen] = useState(false)
  const [newPainDesc, setNewPainDesc] = useState("")
  const [newPainSeverity, setNewPainSeverity] = useState("medium")
  const [newPainScore, setNewPainScore] = useState([-2])
  const [addingPain, setAddingPain] = useState(false)
  
  // Add highlight dialog state
  const [addHighlightOpen, setAddHighlightOpen] = useState(false)
  const [newHighlightDesc, setNewHighlightDesc] = useState("")
  const [newHighlightImpact, setNewHighlightImpact] = useState("medium")
  const [newHighlightScore, setNewHighlightScore] = useState([3])
  const [addingHighlight, setAddingHighlight] = useState(false)

  return (
    <div 
      id={`touchpoint-${touchPoint.id}`}
      className={cn(
        "rounded-md border transition-all bg-card",
        scoreBorder(calculatedScore),
        isHighlighted && "ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse"
      )}
    >
      {/* Touchpoint header - clickable to open detail panel */}
      <button
        onClick={onClick}
        className="w-full text-left p-2.5 hover:bg-accent/30 transition-colors rounded-t-md"
      >
        <div className="flex items-start gap-2">
          <div className={cn("mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full", scoreColor(calculatedScore))} />
          <div className="flex-1 min-w-0">
            {/* Top row: Name + Score/Type in top right */}
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-semibold text-foreground line-clamp-1">
                {touchPoint.channel}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                {painPoints.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-red-500">
                    {painPoints.length} pain{painPoints.length > 1 ? "s" : ""}
                  </span>
                )}
                {highlights.length > 0 && (
                  <span className="flex items-center gap-0.5 text-[9px] text-emerald-500">
                    {highlights.length} highlight{highlights.length > 1 ? "s" : ""}
                  </span>
                )}
                <span className={cn(
                  "text-[10px] font-mono font-bold",
                  calculatedScore >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                )}>
                  {calculatedScore > 0 ? "+" : ""}{calculatedScore}
                </span>
              </div>
            </div>
            {/* Description - secondary */}
            <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">
              {touchPoint.description}
            </p>
          </div>
        </div>
      </button>

      {/* Nested Pain Points & Highlights */}
      {(hasChildren || editMode) && (
        <div className="border-t border-border/40">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center gap-1 px-2.5 py-1.5 text-[10px] text-muted-foreground hover:bg-accent/20 transition-colors"
          >
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            <span>Pain Points & Highlights</span>
          </button>
          
          {expanded && (
            <div className="px-2.5 pb-2 space-y-1.5">
              {/* Pain Points */}
              {painPoints.map((pp) => (
                <div
                  key={pp.id}
                  className="w-full flex items-start gap-2 p-1.5 rounded border border-red-200/50 bg-red-50/50 dark:bg-red-900/10 dark:border-red-800/30 hover:border-red-300 transition-colors group"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onPainPointClick?.(pp) }}
                    className="flex-1 flex items-start gap-2 text-left"
                  >
                    <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", severityColor(pp.severity))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-red-700 dark:text-red-400 line-clamp-2">{pp.description}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-red-500/70 capitalize">{pp.severity}</span>
                        {pp.isAiGenerated ? (
                          <Bot className="h-2.5 w-2.5 text-red-400/70" />
                        ) : (
                          <User className="h-2.5 w-2.5 text-red-400/70" />
                        )}
                      </div>
                    </div>
                  </button>
                  {editMode && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await deletePainPoint(pp.id, journeyId)
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                          toast.success("Pain point deleted")
                        } catch {
                          toast.error("Failed to delete")
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all shrink-0"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}
              
              {/* Highlights */}
              {highlights.map((h) => (
                <div
                  key={h.id}
                  className="w-full flex items-start gap-2 p-1.5 rounded border border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-900/10 dark:border-emerald-800/30 hover:border-emerald-300 transition-colors group"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); onHighlightClick?.(h) }}
                    className="flex-1 flex items-start gap-2 text-left"
                  >
                    <div className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", impactColor(h.impact))} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-emerald-700 dark:text-emerald-400 line-clamp-2">{h.description}</p>
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] text-emerald-500/70 capitalize">{h.impact} impact</span>
                        {h.isAiGenerated ? (
                          <Bot className="h-2.5 w-2.5 text-emerald-400/70" />
                        ) : (
                          <User className="h-2.5 w-2.5 text-emerald-400/70" />
                        )}
                      </div>
                    </div>
                  </button>
                  {editMode && (
                    <button
                      onClick={async (e) => {
                        e.stopPropagation()
                        try {
                          await deleteHighlight(h.id, journeyId)
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                          toast.success("Highlight deleted")
                        } catch {
                          toast.error("Failed to delete")
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all shrink-0"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
              ))}

              {/* Add buttons with inline dialogs */}
              {editMode && (
                <div className="flex gap-1 pt-1">
                  {/* Add Pain Point Dialog */}
                  <Dialog open={addPainOpen} onOpenChange={setAddPainOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation() }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded border border-dashed border-red-200 dark:border-red-800/50 transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Pain Point
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                      <DialogHeader>
                        <DialogTitle>Add Pain Point</DialogTitle>
                        <DialogDescription>Describe a frustration or issue the customer experiences at &quot;{touchPoint.channel}&quot;.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="What frustrates the customer at this moment?"
                            value={newPainDesc}
                            onChange={(e) => setNewPainDesc(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Severity</Label>
                          <Select value={newPainSeverity} onValueChange={setNewPainSeverity}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                              <SelectItem value="critical">Critical</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center justify-between">
                            <span>Emotional Score</span>
                            <span className="text-xs font-mono text-red-600">{newPainScore[0]}</span>
                          </Label>
                          <Slider
                            min={-5}
                            max={-1}
                            step={1}
                            value={newPainScore}
                            onValueChange={setNewPainScore}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddPainOpen(false)}>Cancel</Button>
                        <Button
                          variant="destructive"
                          disabled={!newPainDesc.trim() || addingPain}
                          onClick={async () => {
                            setAddingPain(true)
                            try {
                              await addPainPoint(touchPoint.id, journeyId, newPainDesc.trim(), newPainSeverity, newPainScore[0])
                              mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                              toast.success("Pain point added")
                              setAddPainOpen(false)
                              setNewPainDesc("")
                              setNewPainSeverity("medium")
                              setNewPainScore([-2])
                            } catch {
                              toast.error("Failed to add pain point")
                            } finally {
                              setAddingPain(false)
                            }
                          }}
                        >
                          {addingPain ? "Adding..." : "Add Pain Point"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Add Highlight Dialog */}
                  <Dialog open={addHighlightOpen} onOpenChange={setAddHighlightOpen}>
                    <DialogTrigger asChild>
                      <button
                        onClick={(e) => { e.stopPropagation() }}
                        className="flex-1 flex items-center justify-center gap-1 py-1 text-[9px] text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded border border-dashed border-emerald-200 dark:border-emerald-800/50 transition-colors"
                      >
                        <Plus className="h-2.5 w-2.5" />
                        Highlight
                      </button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
                      <DialogHeader>
                        <DialogTitle>Add Highlight</DialogTitle>
                        <DialogDescription>Describe a positive moment at &quot;{touchPoint.channel}&quot;.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4 py-2">
                        <div className="flex flex-col gap-2">
                          <Label>Description</Label>
                          <Textarea
                            placeholder="What delights the customer at this moment?"
                            value={newHighlightDesc}
                            onChange={(e) => setNewHighlightDesc(e.target.value)}
                            rows={3}
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label>Impact</Label>
                          <Select value={newHighlightImpact} onValueChange={setNewHighlightImpact}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="low">Low</SelectItem>
                              <SelectItem value="medium">Medium</SelectItem>
                              <SelectItem value="high">High</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label className="flex items-center justify-between">
                            <span>Emotional Score</span>
                            <span className="text-xs font-mono text-emerald-600">+{newHighlightScore[0]}</span>
                          </Label>
                          <Slider
                            min={1}
                            max={5}
                            step={1}
                            value={newHighlightScore}
                            onValueChange={setNewHighlightScore}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setAddHighlightOpen(false)}>Cancel</Button>
                        <Button
                          disabled={!newHighlightDesc.trim() || addingHighlight}
                          onClick={async () => {
                            setAddingHighlight(true)
                            try {
                              await addHighlight(touchPoint.id, journeyId, newHighlightDesc.trim(), newHighlightImpact, newHighlightScore[0])
                              mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                              toast.success("Highlight added")
                              setAddHighlightOpen(false)
                              setNewHighlightDesc("")
                              setNewHighlightImpact("medium")
                              setNewHighlightScore([3])
                            } catch {
                              toast.error("Failed to add highlight")
                            } finally {
                              setAddingHighlight(false)
                            }
                          }}
                        >
                          {addingHighlight ? "Adding..." : "Add Highlight"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
