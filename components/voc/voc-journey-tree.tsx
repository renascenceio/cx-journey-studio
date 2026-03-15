"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Layers, GitBranch, Radio, ThumbsUp, Gauge, Scale, MessageSquare } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { VoCStageMetric, VoCStepMetric, VoCTouchpointMetric } from "@/lib/types"

interface VoCJourneyTreeProps {
  stages: VoCStageMetric[]
  onSelectElement?: (type: "stage" | "step" | "touchpoint", id: string) => void
}

function ScoreBadge({ 
  value, 
  type 
}: { 
  value: number | null
  type: "nps" | "csat" | "ces" | "sentiment" 
}) {
  if (value === null) return <Badge variant="outline" className="text-[10px]">N/A</Badge>
  
  let color = "bg-muted text-muted-foreground"
  let displayValue = ""
  
  switch (type) {
    case "nps":
      color = value >= 50 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              value >= 0 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      displayValue = value > 0 ? `+${value}` : `${value}`
      break
    case "csat":
      color = value >= 4 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              value >= 3 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      displayValue = value.toFixed(1)
      break
    case "ces":
      color = value <= 3 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              value <= 5 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      displayValue = value.toFixed(1)
      break
    case "sentiment":
      color = value >= 0.6 ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
              value >= 0.4 ? "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" :
              "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      displayValue = `${(value * 100).toFixed(0)}%`
      break
  }
  
  return <Badge className={cn("text-[10px] font-normal", color)}>{displayValue}</Badge>
}

function TouchpointRow({ touchpoint, onSelect }: { touchpoint: VoCTouchpointMetric; onSelect?: () => void }) {
  return (
    <div 
      className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onSelect}
    >
      <Radio className="h-3 w-3 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground truncate flex-1">{touchpoint.channel}</span>
      <div className="flex items-center gap-1">
        <ScoreBadge value={touchpoint.nps} type="nps" />
        <ScoreBadge value={touchpoint.csat} type="csat" />
        <ScoreBadge value={touchpoint.ces} type="ces" />
      </div>
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
        {touchpoint.feedbackCount}
      </span>
    </div>
  )
}

function StepRow({ step, onSelect, onSelectTouchpoint }: { 
  step: VoCStepMetric
  onSelect?: () => void
  onSelectTouchpoint?: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const hasTouchpoints = step.touchpoints && step.touchpoints.length > 0
  
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div 
          className="flex items-center gap-2 py-2 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={(e) => {
            if (!hasTouchpoints) {
              e.preventDefault()
              onSelect?.()
            }
          }}
        >
          {hasTouchpoints ? (
            open ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <div className="w-3.5" />
          )}
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-sm truncate flex-1">{step.stepName}</span>
          <div className="flex items-center gap-1">
            <ScoreBadge value={step.nps} type="nps" />
            <ScoreBadge value={step.csat} type="csat" />
            <ScoreBadge value={step.ces} type="ces" />
          </div>
          <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
            {step.feedbackCount}
          </span>
        </div>
      </CollapsibleTrigger>
      {hasTouchpoints && (
        <CollapsibleContent>
          <div className="ml-8 border-l pl-2 space-y-0.5">
            {step.touchpoints.map(tp => (
              <TouchpointRow 
                key={tp.touchpointId} 
                touchpoint={tp}
                onSelect={() => onSelectTouchpoint?.(tp.touchpointId)}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

function StageRow({ stage, onSelect, onSelectStep, onSelectTouchpoint }: { 
  stage: VoCStageMetric
  onSelect?: () => void
  onSelectStep?: (id: string) => void
  onSelectTouchpoint?: (id: string) => void
}) {
  const [open, setOpen] = useState(true)
  const hasSteps = stage.steps && stage.steps.length > 0
  
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="border rounded-lg">
      <CollapsibleTrigger asChild>
        <div 
          className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {hasSteps ? (
            open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <div className="w-4" />
          )}
          <Layers className="h-4 w-4 text-primary shrink-0" />
          <span className="font-medium truncate flex-1">{stage.stageName}</span>
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-0.5">
              <ThumbsUp className="h-3 w-3 text-muted-foreground" />
              <ScoreBadge value={stage.nps} type="nps" />
            </div>
            <div className="flex items-center gap-0.5">
              <Gauge className="h-3 w-3 text-muted-foreground" />
              <ScoreBadge value={stage.csat} type="csat" />
            </div>
            <div className="flex items-center gap-0.5">
              <Scale className="h-3 w-3 text-muted-foreground" />
              <ScoreBadge value={stage.ces} type="ces" />
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground ml-2">
            <MessageSquare className="h-3 w-3" />
            {stage.feedbackCount}
          </div>
        </div>
      </CollapsibleTrigger>
      {hasSteps && (
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-0.5">
            {stage.steps.map(step => (
              <StepRow 
                key={step.stepId} 
                step={step}
                onSelect={() => onSelectStep?.(step.stepId)}
                onSelectTouchpoint={onSelectTouchpoint}
              />
            ))}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

export function VoCJourneyTree({ stages, onSelectElement }: VoCJourneyTreeProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Journey Performance</CardTitle>
        <CardDescription>
          VoC metrics across stages, steps, and touchpoints
        </CardDescription>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
          <div className="flex items-center gap-1">
            <ThumbsUp className="h-3 w-3" />
            <span>NPS</span>
          </div>
          <div className="flex items-center gap-1">
            <Gauge className="h-3 w-3" />
            <span>CSAT (1-5)</span>
          </div>
          <div className="flex items-center gap-1">
            <Scale className="h-3 w-3" />
            <span>CES (1-7)</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {stages.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No stages found. Add stages to your journey to see VoC metrics.
          </div>
        ) : (
          stages.map(stage => (
            <StageRow 
              key={stage.stageId} 
              stage={stage}
              onSelect={() => onSelectElement?.("stage", stage.stageId)}
              onSelectStep={(id) => onSelectElement?.("step", id)}
              onSelectTouchpoint={(id) => onSelectElement?.("touchpoint", id)}
            />
          ))
        )}
      </CardContent>
    </Card>
  )
}
