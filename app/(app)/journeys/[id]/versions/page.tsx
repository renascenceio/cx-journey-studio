"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useMemo } from "react"
import { useJourney, useJourneyVersions } from "@/hooks/use-journey"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { History, Eye, RotateCcw, GitCompareArrows, Clock, ArrowRight, Plus, Minus, Pencil, CheckCircle2, Loader2, Target, Copy, Info, AlertTriangle, HelpCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { restoreJourneyVersion } from "@/lib/actions/data"
import { mutate } from "swr"
import type { JourneyVersion } from "@/lib/types"

// Version retention policy - following industry best practices (similar to GitHub, Figma, Notion)
const VERSION_POLICY = {
  // Maximum versions to keep per journey (Figma keeps ~30 days, GitHub unlimited paid)
  maxVersionsToKeep: 50,
  // How long to keep versions (90 days = 3 months, industry standard)
  retentionDays: 90,
  // If many versions created in short time, keep only the last N from that burst
  burstWindow: 60, // minutes
  burstMaxVersions: 5,
  // Grace period - never delete versions newer than this
  gracePeriodDays: 7,
}

import { getInitials } from "@/lib/utils"

function relativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  const diffMonths = Math.floor(diffDays / 30)
  if (diffMins < 1) return "just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  if (diffMonths < 12) return `${diffMonths}mo ago`
  return `${Math.floor(diffMonths / 12)}y ago`
}

// Generate detailed diff data by comparing version snapshots
function generateDiffData(oldVersion: JourneyVersion, newVersion: JourneyVersion) {
  const diffs: { type: "added" | "removed" | "modified"; section: string; detail: string; subDetail?: string }[] = []
  
  const oldStages = oldVersion.snapshot.stages || []
  const newStages = newVersion.snapshot.stages || []
  
  // Build lookup maps for old data
  const oldStageMap = new Map(oldStages.map(s => [s.id, s]))
  const newStageMap = new Map(newStages.map(s => [s.id, s]))
  
  // Find added/removed stages
  for (const stage of newStages) {
    if (!oldStageMap.has(stage.id)) {
      diffs.push({ type: "added", section: "Stage", detail: `"${stage.name}" added` })
    }
  }
  for (const stage of oldStages) {
    if (!newStageMap.has(stage.id)) {
      diffs.push({ type: "removed", section: "Stage", detail: `"${stage.name}" removed` })
    }
  }
  
  // Check for stage order/name changes
  const oldStageOrder = oldStages.map(s => s.id).join(",")
  const newStageOrder = newStages.map(s => s.id).join(",")
  if (oldStageOrder !== newStageOrder && oldStages.length === newStages.length) {
    diffs.push({ type: "modified", section: "Stages", detail: "Stage order changed" })
  }
  
  // Compare steps within each stage
  for (const newStage of newStages) {
    const oldStage = oldStageMap.get(newStage.id)
    if (!oldStage) continue
    
    // Stage name changed
    if (oldStage.name !== newStage.name) {
      diffs.push({ type: "modified", section: "Stage", detail: `Renamed from "${oldStage.name}" to "${newStage.name}"` })
    }
    
    const oldStepMap = new Map(oldStage.steps.map(s => [s.id, s]))
    const newStepMap = new Map(newStage.steps.map(s => [s.id, s]))
    
    // Find added/removed steps
    for (const step of newStage.steps) {
      if (!oldStepMap.has(step.id)) {
        diffs.push({ type: "added", section: "Step", detail: `"${step.name}"`, subDetail: `in ${newStage.name}` })
      }
    }
    for (const step of oldStage.steps) {
      if (!newStepMap.has(step.id)) {
        diffs.push({ type: "removed", section: "Step", detail: `"${step.name}"`, subDetail: `from ${newStage.name}` })
      }
    }
    
    // Check step order changes
    const oldStepOrder = oldStage.steps.map(s => s.id).join(",")
    const newStepOrder = newStage.steps.map(s => s.id).join(",")
    if (oldStepOrder !== newStepOrder && oldStage.steps.length === newStage.steps.length) {
      diffs.push({ type: "modified", section: "Steps", detail: `Reordered`, subDetail: `in ${newStage.name}` })
    }
    
    // Compare touchpoints within each step
    for (const newStep of newStage.steps) {
      const oldStep = oldStepMap.get(newStep.id)
      if (!oldStep) continue
      
      // Step name changed
      if (oldStep.name !== newStep.name) {
        diffs.push({ type: "modified", section: "Step", detail: `Renamed from "${oldStep.name}" to "${newStep.name}"`, subDetail: `in ${newStage.name}` })
      }
      
      const oldTpMap = new Map(oldStep.touchPoints.map(tp => [tp.id, tp]))
      const newTpMap = new Map(newStep.touchPoints.map(tp => [tp.id, tp]))
      
      // Find added/removed touchpoints
      for (const tp of newStep.touchPoints) {
        if (!oldTpMap.has(tp.id)) {
          diffs.push({ type: "added", section: "Touchpoint", detail: `"${tp.channel}"`, subDetail: `in ${newStep.name} → ${newStage.name}` })
        }
      }
      for (const tp of oldStep.touchPoints) {
        if (!newTpMap.has(tp.id)) {
          diffs.push({ type: "removed", section: "Touchpoint", detail: `"${tp.channel}"`, subDetail: `from ${newStep.name} → ${newStage.name}` })
        }
      }
      
      // Compare touchpoint content
      for (const newTp of newStep.touchPoints) {
        const oldTp = oldTpMap.get(newTp.id)
        if (!oldTp) continue
        
        if (oldTp.emotionalScore !== newTp.emotionalScore) {
          diffs.push({ type: "modified", section: "Score", detail: `"${newTp.channel}" changed from ${oldTp.emotionalScore} to ${newTp.emotionalScore}`, subDetail: `in ${newStep.name}` })
        }
        
        // Compare pain points
        const oldPpIds = new Set((oldTp.painPoints || []).map(p => p.id))
        const newPpIds = new Set((newTp.painPoints || []).map(p => p.id))
        for (const pp of (newTp.painPoints || [])) {
          if (!oldPpIds.has(pp.id)) {
            diffs.push({ type: "added", section: "Pain Point", detail: `"${pp.description?.slice(0, 30)}${(pp.description?.length || 0) > 30 ? "..." : ""}"`, subDetail: `on ${newTp.channel}` })
          }
        }
        for (const pp of (oldTp.painPoints || [])) {
          if (!newPpIds.has(pp.id)) {
            diffs.push({ type: "removed", section: "Pain Point", detail: `"${pp.description?.slice(0, 30)}${(pp.description?.length || 0) > 30 ? "..." : ""}"`, subDetail: `from ${newTp.channel}` })
          }
        }
        
        // Compare highlights
        const oldHlIds = new Set((oldTp.highlights || []).map(h => h.id))
        const newHlIds = new Set((newTp.highlights || []).map(h => h.id))
        for (const hl of (newTp.highlights || [])) {
          if (!oldHlIds.has(hl.id)) {
            diffs.push({ type: "added", section: "Highlight", detail: `"${hl.description?.slice(0, 30)}${(hl.description?.length || 0) > 30 ? "..." : ""}"`, subDetail: `on ${newTp.channel}` })
          }
        }
        for (const hl of (oldTp.highlights || [])) {
          if (!newHlIds.has(hl.id)) {
            diffs.push({ type: "removed", section: "Highlight", detail: `"${hl.description?.slice(0, 30)}${(hl.description?.length || 0) > 30 ? "..." : ""}"`, subDetail: `from ${newTp.channel}` })
          }
        }
      }
    }
  }
  
  // If no specific diffs found, do a deep JSON comparison
  if (diffs.length === 0) {
    const oldJson = JSON.stringify(oldVersion.snapshot)
    const newJson = JSON.stringify(newVersion.snapshot)
    if (oldJson !== newJson) {
      diffs.push({ type: "modified", section: "Content", detail: "Journey content modified" })
    }
  }
  
  // If no differences found, show that
  if (diffs.length === 0) {
    diffs.push({ type: "modified", section: "No changes", detail: "These versions appear to be identical" })
  }
  
  return diffs
}

export default function VersionsPage() {
  const params = useParams()
  const router = useRouter()
  const journeyId = params.id as string
  const { journey, isLoading } = useJourney(journeyId)
  const { versions } = useJourneyVersions(journeyId)
  const [snapshotOpen, setSnapshotOpen] = useState(false)
  const [selectedVersion, setSelectedVersion] = useState<JourneyVersion | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareVersion, setCompareVersion] = useState<JourneyVersion | null>(null)
  const [restoreOpen, setRestoreOpen] = useState(false)
  const [restoreVersion, setRestoreVersion] = useState<JourneyVersion | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [restoreMode, setRestoreMode] = useState<"overwrite" | "duplicate">("overwrite")
  
  // Calculate version stats for policy display
  const versionStats = useMemo(() => {
    if (!versions.length) return null
    const now = new Date()
    const oldestVersion = versions[versions.length - 1]
    const newestVersion = versions[0]
    const oldestDate = new Date(oldestVersion?.createdAt)
    const daysSinceOldest = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24))
    
    // Check for burst versions (many created within burst window)
    const recentVersions = versions.filter(v => {
      const created = new Date(v.createdAt)
      const minutesAgo = (now.getTime() - created.getTime()) / (1000 * 60)
      return minutesAgo <= VERSION_POLICY.burstWindow
    })
    
    return {
      total: versions.length,
      daysSinceOldest,
      recentBurst: recentVersions.length,
      willPruneCount: Math.max(0, versions.length - VERSION_POLICY.maxVersionsToKeep),
      oldVersionsCount: versions.filter(v => {
        const created = new Date(v.createdAt)
        const daysOld = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        return daysOld > VERSION_POLICY.retentionDays
      }).length,
    }
  }, [versions])

  if (!journey || versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <History className="h-10 w-10 text-muted-foreground/40 mb-4" />
        <p className="text-sm font-medium text-foreground">No version history</p>
        <p className="text-xs text-muted-foreground mt-1">Versions will appear here as changes are saved</p>
      </div>
    )
  }

  const currentVersion = versions[0]

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 lg:px-6">
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-foreground">Version History</h2>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="p-0 bg-background border shadow-lg [&_*]:list-none">
                    <div className="p-3 text-xs w-72">
                      <p className="font-semibold text-foreground mb-3">Semantic Versioning</p>
                      <table className="w-full">
                        <tbody>
                          <tr>
                            <td className="py-1.5 pr-3 align-top">
                              <Badge className="bg-emerald-100 text-emerald-700 text-[9px] w-14 justify-center">Minor</Badge>
                            </td>
                            <td className="py-1.5 text-muted-foreground align-top">
                              Small content or structural changes (v1.1, v1.2...)
                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pr-3 align-top">
                              <Badge className="bg-amber-100 text-amber-700 text-[9px] w-14 justify-center">Medium</Badge>
                            </td>
<td className="py-1.5 text-muted-foreground align-top">
                                              30%+ of journey enhanced or deleted (v1 to v2)
                                            </td>
                          </tr>
                          <tr>
                            <td className="py-1.5 pr-3 align-top">
                              <Badge className="bg-red-100 text-red-700 text-[9px] w-14 justify-center">Major</Badge>
                            </td>
                            <td className="py-1.5 text-muted-foreground align-top">
                              Journey regenerated or restructured (v1 to v2)
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-sm text-muted-foreground">
              {versions.length} versions of this journey have been saved
            </p>
          </div>
          {versionStats && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Info className="h-3.5 w-3.5" />
              <span>Versions kept for {VERSION_POLICY.retentionDays} days, max {VERSION_POLICY.maxVersionsToKeep} per journey</span>
            </div>
          )}
        </div>
        {versionStats && versionStats.willPruneCount > 0 && (
          <Alert variant="default" className="mt-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200 text-xs">
              {versionStats.willPruneCount} older version{versionStats.willPruneCount > 1 ? "s" : ""} may be automatically archived to stay within the {VERSION_POLICY.maxVersionsToKeep} version limit.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-6 top-0 bottom-0 w-px bg-border" />

        <div className="flex flex-col gap-0">
          {versions.map((version, index) => {
            const authorName = version.createdByName || "Unknown"
            const isCurrent = index === 0
            return (
              <div key={version.id} className="relative flex gap-4 pb-8">
                {/* Timeline dot */}
                <div className={cn(
                  "relative z-10 mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2",
                  isCurrent
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground"
                )}>
<span className="text-xs font-bold">v{version.versionLabel || version.versionNumber}</span>
  </div>
  
  {/* Card */}
  <Card className={cn(
  "flex-1 transition-shadow hover:shadow-md",
  isCurrent && "border-primary/30 bg-primary/[0.02]"
  )}>
  <CardContent className="p-4">
  <div className="flex items-start justify-between gap-4">
  <div className="flex-1 min-w-0">
  <div className="flex items-center gap-2 mb-1 flex-wrap">
  <span className="text-sm font-semibold text-foreground">
  Version {version.versionLabel || version.versionNumber}
  </span>
  {version.changeType && (
  <Badge 
    className={cn(
      "text-[9px] h-5 capitalize",
      version.changeType === "minor" && "bg-emerald-100 text-emerald-700 hover:bg-emerald-100",
      version.changeType === "medium" && "bg-amber-100 text-amber-700 hover:bg-amber-100",
      version.changeType === "major" && "bg-red-100 text-red-700 hover:bg-red-100"
    )}
  >
    {version.changeType}
  </Badge>
  )}
  {version.label && (
  <Badge variant={isCurrent ? "default" : "secondary"} className="text-[10px] h-5">
  {version.label}
  </Badge>
  )}
  {isCurrent && (
  <Badge variant="outline" className="text-[10px] h-5 border-primary/40 text-primary">
  Current
  </Badge>
  )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {version.changesSummary}
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-xs text-muted-foreground">
                          {authorName && (
                            <div className="flex items-center gap-1.5">
                              <Avatar className="h-4 w-4">
                                <AvatarFallback className="bg-primary/10 text-[7px] font-medium text-primary">
                                  {getInitials(authorName)}
                                </AvatarFallback>
                              </Avatar>
                              <span>{authorName}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{relativeTime(version.createdAt)}</span>
                          </div>
                          <span className="text-muted-foreground/40">|</span>
                          <span>
                            {new Date(version.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 gap-1.5 text-xs"
                          onClick={() => { setSelectedVersion(version); setSnapshotOpen(true) }}
                        >
                          <Eye className="h-3 w-3" />
                          <span className="hidden sm:inline">View</span>
                        </Button>
                        {!isCurrent && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-xs"
                              onClick={() => { setCompareVersion(version); setCompareOpen(true) }}
                            >
                              <GitCompareArrows className="h-3 w-3" />
                              <span className="hidden sm:inline">Compare</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1.5 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950/30"
                              onClick={() => { setRestoreVersion(version); setRestoreOpen(true) }}
                            >
                              <RotateCcw className="h-3 w-3" />
                              <span className="hidden sm:inline">Restore</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      </div>

      {/* View Snapshot Dialog - Enhanced Design */}
      <Dialog open={snapshotOpen} onOpenChange={setSnapshotOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="pb-4 border-b border-border">
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10">
                <History className="h-5 w-5 text-primary" />
              </div>
              <div>
<span className="text-lg">Version {selectedVersion?.versionLabel || selectedVersion?.versionNumber} Snapshot</span>
  {selectedVersion?.changeType && (
  <Badge 
    className={cn(
      "ml-2 text-[10px] capitalize",
      selectedVersion.changeType === "minor" && "bg-emerald-100 text-emerald-700",
      selectedVersion.changeType === "medium" && "bg-amber-100 text-amber-700",
      selectedVersion.changeType === "major" && "bg-red-100 text-red-700"
    )}
  >
    {selectedVersion.changeType}
  </Badge>
  )}
  {selectedVersion?.label && (
  <Badge variant="secondary" className="ml-2 text-xs">{selectedVersion.label}</Badge>
  )}
                <p className="text-sm font-normal text-muted-foreground mt-0.5">
                  {selectedVersion?.changesSummary || "No description"}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>
          
          {selectedVersion && (
            <div className="flex-1 overflow-y-auto">
              {/* Summary Stats */}
              {selectedVersion.snapshot?.stages ? (
              <div className="grid grid-cols-5 gap-3 p-4 bg-muted/30 border-b border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedVersion.snapshot.stages.length}</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Stages</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedVersion.snapshot.stages.reduce((s, st) => s + (st.steps?.length || 0), 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Steps</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-foreground">
                    {selectedVersion.snapshot.stages.reduce((s, st) => s + (st.steps?.reduce((ss, stp) => ss + (stp.touchPoints?.length || 0), 0) || 0), 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Touchpoints</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-500">
                    {selectedVersion.snapshot.stages.reduce((s, st) => s + (st.steps?.reduce((ss, stp) => ss + (stp.touchPoints?.reduce((sp, tp) => sp + (tp.painPoints?.length || 0), 0) || 0), 0) || 0), 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Pain Points</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-500">
                    {selectedVersion.snapshot.stages.reduce((s, st) => s + (st.steps?.reduce((ss, stp) => ss + (stp.touchPoints?.reduce((sh, tp) => sh + (tp.highlights?.length || 0), 0) || 0), 0) || 0), 0)}
                  </p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Highlights</p>
                </div>
              </div>
              ) : (
              <div className="p-6 text-center text-muted-foreground">
                <p className="text-sm">This version has incomplete snapshot data.</p>
                <p className="text-xs mt-1">Version was created before full snapshot support.</p>
              </div>
              )}

              {/* Journey Structure */}
              {selectedVersion.snapshot?.stages && (
              <div className="p-4">
                <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  Journey Structure
                </h4>
                <div className="flex flex-col gap-4">
                  {selectedVersion.snapshot.stages.map((stage, stageIdx) => (
                    <div key={stage.id} className="rounded-lg border border-border overflow-hidden">
                      {/* Stage Header */}
                      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-bold text-primary">{stageIdx + 1}.</span>
                          <span className="text-sm font-semibold text-foreground">{stage.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>{stage.steps?.length || 0} steps</span>
                          <span className="text-muted-foreground/40">|</span>
                          <span>{stage.steps?.reduce((t, s) => t + (s.touchPoints?.length || 0), 0) || 0} touchpoints</span>
                        </div>
                      </div>
                      
                      {/* Steps */}
                      <div className="p-3 flex flex-col gap-2">
                        {(stage.steps || []).map((step, stepIdx) => (
                          <div key={step.id} className="rounded-md bg-background border border-border/60 p-3">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 rounded px-1.5 py-0.5">
                                  {stageIdx + 1}.{stepIdx + 1}
                                </span>
                                <span className="text-xs font-medium text-foreground">{step.name}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">{step.touchPoints?.length || 0} tp</span>
                            </div>
                            
                            {/* Touchpoints preview */}
                            {(step.touchPoints?.length || 0) > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {(step.touchPoints || []).slice(0, 5).map((tp) => {
                                  const score = tp.emotional_score as number
                                  return (
                                    <div 
                                      key={tp.id} 
                                      className={cn(
                                        "text-[10px] rounded px-2 py-1 border flex items-center gap-1.5",
                                        score <= -2 ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/50" :
                                        score <= 0 ? "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/50" :
                                        score <= 2 ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/50" :
                                        "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/50"
                                      )}
                                    >
                                      <span className="text-foreground truncate max-w-[100px]">{tp.channel}</span>
                                      <span className={cn(
                                        "font-mono font-bold text-[9px]",
                                        score >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                      )}>
                                        {score > 0 ? "+" : ""}{score}
                                      </span>
                                      {(tp.painPoints?.length || 0) > 0 && (
                                        <span className="text-red-500 text-[9px]">{tp.painPoints?.length}P</span>
                                      )}
                                      {(tp.highlights?.length || 0) > 0 && (
                                        <span className="text-emerald-500 text-[9px]">{tp.highlights?.length}H</span>
                                      )}
                                    </div>
                                  )
                                })}
                                {(step.touchPoints?.length || 0) > 5 && (
                                  <span className="text-[10px] text-muted-foreground px-2 py-1">
                                    +{(step.touchPoints?.length || 0) - 5} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              )}
            </div>
          )}
          
          <DialogFooter className="border-t border-border pt-4">
            <Button variant="outline" onClick={() => setSnapshotOpen(false)}>Close</Button>
            <Button 
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => {
                setSnapshotOpen(false)
                if (selectedVersion) {
                  setRestoreVersion(selectedVersion)
                  setRestoreOpen(true)
                }
              }}
            >
              <RotateCcw className="mr-2 h-3.5 w-3.5" />
              Restore This Version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Compare Dialog */}
      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Compare Versions
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
<Badge variant="outline" className="text-xs">v{compareVersion?.versionLabel || compareVersion?.versionNumber}</Badge>
  <ArrowRight className="h-3 w-3" />
  <Badge variant="default" className="text-xs">v{currentVersion.versionLabel || currentVersion.versionNumber} (Current)</Badge>
            </DialogDescription>
          </DialogHeader>
          
          {/* Author attribution */}
          {compareVersion && currentVersion.createdByName && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <Avatar className="h-5 w-5">
                <AvatarFallback className="text-[9px]">{getInitials(currentVersion.createdByName)}</AvatarFallback>
              </Avatar>
              <span>
                <span className="font-medium text-foreground">{currentVersion.createdByName}</span> made changes in v{currentVersion.versionNumber}
              </span>
            </div>
          )}
          
          {compareVersion && (() => {
            const diffs = generateDiffData(compareVersion, currentVersion)
            const hasNoChanges = diffs.length === 1 && diffs[0].section === "No changes"
            return (
            <div className="flex flex-col gap-2">
              {diffs.map((diff, i) => (
                <div key={i} className={cn(
                  "flex items-start gap-3 rounded-md p-3 text-sm",
                  diff.type === "added" && "bg-green-50 dark:bg-green-950/20",
                  diff.type === "removed" && "bg-red-50 dark:bg-red-950/20",
                  diff.type === "modified" && "bg-amber-50 dark:bg-amber-950/20",
                )}>
                  <div className={cn(
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    diff.type === "added" && "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
                    diff.type === "removed" && "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
                    diff.type === "modified" && "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
                  )}>
                    {diff.type === "added" && <Plus className="h-3 w-3" />}
                    {diff.type === "removed" && <Minus className="h-3 w-3" />}
                    {diff.type === "modified" && <Pencil className="h-3 w-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <span className="font-medium text-foreground">{diff.section}:</span>{" "}
                      <span className="text-foreground/80">{diff.detail}</span>
                    </div>
                    {diff.subDetail && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">{diff.subDetail}</p>
                    )}
                  </div>
                </div>
              ))}
              {!hasNoChanges && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  {diffs.length} change{diffs.length !== 1 ? "s" : ""} between version {compareVersion.versionNumber} and {currentVersion.versionNumber}
                </p>
              )}
            </div>
            )
          })()}
        </DialogContent>
      </Dialog>

      {/* Restore Confirmation Dialog */}
      <Dialog open={restoreOpen} onOpenChange={(open) => { setRestoreOpen(open); if (!open) setRestoreMode("overwrite") }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Recover Version {restoreVersion?.versionNumber}</DialogTitle>
            <DialogDescription>
              Choose how to recover this version{restoreVersion?.label && ` ("${restoreVersion.label}")`}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <RadioGroup value={restoreMode} onValueChange={(v) => setRestoreMode(v as "overwrite" | "duplicate")} className="gap-3">
              <div className={cn(
                "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                restoreMode === "overwrite" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
              )} onClick={() => setRestoreMode("overwrite")}>
                <RadioGroupItem value="overwrite" id="overwrite" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="overwrite" className="font-medium text-foreground cursor-pointer">
                    <RotateCcw className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                    Restore to current journey
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Replace the current journey state with this version. A backup version will be created automatically before restoring.
                  </p>
                </div>
              </div>
              
              <div className={cn(
                "flex items-start gap-3 rounded-lg border p-4 cursor-pointer transition-colors",
                restoreMode === "duplicate" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/50"
              )} onClick={() => setRestoreMode("duplicate")}>
                <RadioGroupItem value="duplicate" id="duplicate" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="duplicate" className="font-medium text-foreground cursor-pointer">
                    <Copy className="inline h-4 w-4 mr-1.5 -mt-0.5" />
                    Create a duplicate journey
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Create a new journey from this version, keeping the current journey unchanged. Perfect for exploring alternatives.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRestoreOpen(false)} disabled={restoring}>Cancel</Button>
            <Button
              className={restoreMode === "duplicate" ? "" : "bg-amber-600 hover:bg-amber-700 text-white"}
              disabled={restoring}
              onClick={async () => {
                if (!restoreVersion) return
                setRestoring(true)
                try {
                  if (restoreMode === "duplicate") {
                    const res = await fetch(`/api/journeys/${journeyId}/duplicate`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ versionId: restoreVersion.id }),
                    })
                    if (!res.ok) {
                      const err = await res.json()
                      throw new Error(err.error || "Failed to duplicate")
                    }
                    const result = await res.json()
                    mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                    setRestoreOpen(false)
                    toast.success(`Created duplicate journey`, {
                      description: `New journey created from version ${restoreVersion.versionNumber}.`,
                      icon: <CheckCircle2 className="h-4 w-4" />,
                      action: {
                        label: "Open",
                        onClick: () => router.push(`/journeys/${result.journeyId}/canvas`),
                      },
                    })
                  } else {
                    await restoreJourneyVersion(journeyId, restoreVersion.id)
                    mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                    setRestoreOpen(false)
                    toast.success(`Restored to version ${restoreVersion.versionNumber}`, {
                      description: "Current state was saved as a new version before restoring.",
                      icon: <CheckCircle2 className="h-4 w-4" />,
                    })
                  }
                } catch {
                  toast.error(restoreMode === "duplicate" ? "Failed to create duplicate" : "Failed to restore version")
                } finally {
                  setRestoring(false)
                }
              }}
            >
              {restoring ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : restoreMode === "duplicate" ? (
                <Copy className="mr-2 h-3.5 w-3.5" />
              ) : (
                <RotateCcw className="mr-2 h-3.5 w-3.5" />
              )}
              {restoring ? "Processing..." : restoreMode === "duplicate" ? "Create Duplicate" : "Restore Version"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
