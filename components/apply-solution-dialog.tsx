"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, MapPin, Layers, Footprints, Radio, AlertTriangle, Sparkles } from "lucide-react"
import { toast } from "sonner"
import type { Journey, Stage, Step, TouchPoint } from "@/lib/types"
import useSWR from "swr"
import { useSound } from "@/components/sound-provider"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface ApplySolutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  solutionId: string
  solutionTitle: string
  /** If provided, pre-select this journey */
  preselectedJourneyId?: string
  onApplied?: () => void
}

export function ApplySolutionDialog({
  open,
  onOpenChange,
  solutionId,
  solutionTitle,
  preselectedJourneyId,
  onApplied,
}: ApplySolutionDialogProps) {
  const { data: journeys = [] } = useSWR<Journey[]>(open ? "/api/journeys" : null, fetcher)

  const [selectedJourneyId, setSelectedJourneyId] = useState("")
  const [selectedStageId, setSelectedStageId] = useState("")
  const [selectedStepId, setSelectedStepId] = useState("")
  const [selectedTouchpointId, setSelectedTouchpointId] = useState("")
  const [selectedPainPointId, setSelectedPainPointId] = useState("")
  const [selectedHighlightId, setSelectedHighlightId] = useState("")
  const [notes, setNotes] = useState("")
  const [applying, setApplying] = useState(false)
  const { play } = useSound()

  // Pre-select journey if provided
  useEffect(() => {
    if (preselectedJourneyId && journeys.length > 0) {
      setSelectedJourneyId(preselectedJourneyId)
    }
  }, [preselectedJourneyId, journeys])

  // Reset cascading selects when parent changes
  useEffect(() => { setSelectedStageId(""); setSelectedStepId(""); setSelectedTouchpointId(""); setSelectedPainPointId(""); setSelectedHighlightId("") }, [selectedJourneyId])
  useEffect(() => { setSelectedStepId(""); setSelectedTouchpointId(""); setSelectedPainPointId(""); setSelectedHighlightId("") }, [selectedStageId])
  useEffect(() => { setSelectedTouchpointId(""); setSelectedPainPointId(""); setSelectedHighlightId("") }, [selectedStepId])
  useEffect(() => { setSelectedPainPointId(""); setSelectedHighlightId("") }, [selectedTouchpointId])

  const selectedJourney = useMemo(() => journeys.find((j) => j.id === selectedJourneyId), [journeys, selectedJourneyId])
  const stages: Stage[] = selectedJourney?.stages ?? []
  const selectedStage = useMemo(() => stages.find((s) => s.id === selectedStageId), [stages, selectedStageId])
  const steps: Step[] = selectedStage?.steps ?? []
  const selectedStep = useMemo(() => steps.find((s) => s.id === selectedStepId), [steps, selectedStepId])
  const touchpoints: TouchPoint[] = selectedStep?.touchPoints ?? []
  const selectedTouchpoint = useMemo(() => touchpoints.find((tp) => tp.id === selectedTouchpointId), [touchpoints, selectedTouchpointId])
  const painPoints = selectedTouchpoint?.painPoints ?? []
  const highlights = selectedTouchpoint?.highlights ?? []

  async function handleApply() {
    if (!selectedJourneyId || !selectedStageId) return
    setApplying(true)
    try {
      const res = await fetch(`/api/journeys/${selectedJourneyId}/apply-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solutionId,
          stageId: selectedStageId,
          stepId: selectedStepId || undefined,
          touchpointId: selectedTouchpointId || undefined,
          painPointId: selectedPainPointId || undefined,
          highlightId: selectedHighlightId || undefined,
          notes: notes.trim() || undefined,
        }),
      })
      const responseData = await res.json().catch(() => ({}))
      if (res.ok) {
        play("solution-applied")
        toast.success(`"${solutionTitle}" applied successfully`)
        onOpenChange(false)
        onApplied?.()
        // Reset
        setSelectedJourneyId("")
        setNotes("")
      } else {
        play("error")
        toast.error(responseData.error || "Failed to apply solution")
      }
    } catch {
      play("error")
      toast.error("Failed to apply solution")
    } finally {
      setApplying(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-primary" />
            Apply Solution
          </DialogTitle>
          <DialogDescription>
            Choose where to apply <span className="font-medium text-foreground">&ldquo;{solutionTitle}&rdquo;</span>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          {/* Journey selector */}
          <div className="flex flex-col gap-2">
            <Label className="flex items-center gap-1.5 text-xs font-medium">
              <MapPin className="h-3 w-3 text-primary" />
              Journey <span className="text-destructive">*</span>
            </Label>
            <Select value={selectedJourneyId} onValueChange={setSelectedJourneyId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Select a journey..." />
              </SelectTrigger>
              <SelectContent>
                {journeys.map((j) => (
                  <SelectItem key={j.id} value={j.id}>
                    <div className="flex items-center gap-2">
                      <span>{j.title}</span>
                      <Badge variant="outline" className="text-[9px] capitalize">{j.type}</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Stage selector */}
          {stages.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Layers className="h-3 w-3 text-amber-600" />
                Stage <span className="text-destructive">*</span>
              </Label>
              <Select value={selectedStageId} onValueChange={setSelectedStageId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a stage..." />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step selector (optional) */}
          {steps.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Footprints className="h-3 w-3 text-emerald-600" />
                Step <span className="text-[10px] text-muted-foreground">(optional)</span>
              </Label>
              <Select value={selectedStepId} onValueChange={setSelectedStepId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a step..." />
                </SelectTrigger>
                <SelectContent>
                  {steps.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Touchpoint selector (optional) */}
          {touchpoints.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Radio className="h-3 w-3 text-sky-600" />
                Touchpoint <span className="text-[10px] text-muted-foreground">(optional)</span>
              </Label>
              <Select value={selectedTouchpointId} onValueChange={setSelectedTouchpointId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a touchpoint..." />
                </SelectTrigger>
                <SelectContent>
                  {touchpoints.map((tp) => (
                    <SelectItem key={tp.id} value={tp.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[280px]">{tp.description}</span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] shrink-0 ${tp.emotionalScore < 0 ? "text-destructive" : "text-emerald-600"}`}
                        >
                          {tp.emotionalScore > 0 ? "+" : ""}{tp.emotionalScore}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Pain Point selector (optional) */}
          {painPoints.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <AlertTriangle className="h-3 w-3 text-destructive" />
                Pain Point <span className="text-[10px] text-muted-foreground">(optional)</span>
              </Label>
              <Select value={selectedPainPointId} onValueChange={(v) => { setSelectedPainPointId(v); setSelectedHighlightId("") }}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a pain point..." />
                </SelectTrigger>
                <SelectContent>
                  {painPoints.map((pp) => (
                    <SelectItem key={pp.id} value={pp.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[280px]">{pp.description}</span>
                        <Badge variant="destructive" className="text-[9px] shrink-0 capitalize">{pp.severity}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Highlight selector (optional) */}
          {highlights.length > 0 && !selectedPainPointId && (
            <div className="flex flex-col gap-2">
              <Label className="flex items-center gap-1.5 text-xs font-medium">
                <Sparkles className="h-3 w-3 text-emerald-600" />
                Highlight <span className="text-[10px] text-muted-foreground">(optional)</span>
              </Label>
              <Select value={selectedHighlightId} onValueChange={setSelectedHighlightId}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select a highlight..." />
                </SelectTrigger>
                <SelectContent>
                  {highlights.map((h) => (
                    <SelectItem key={h.id} value={h.id}>
                      <div className="flex items-center gap-2">
                        <span className="truncate max-w-[280px]">{h.description}</span>
                        <Badge className="text-[9px] shrink-0 bg-emerald-100 text-emerald-700 capitalize">{h.impact}</Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Notes */}
          <div className="flex flex-col gap-2">
            <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why are you applying this solution here?"
              rows={2}
              className="text-sm"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            disabled={!selectedJourneyId || !selectedStageId || applying}
            onClick={handleApply}
            className="gap-1.5"
          >
            {applying ? "Applying..." : "Apply Solution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
