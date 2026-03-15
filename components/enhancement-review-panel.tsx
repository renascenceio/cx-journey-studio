"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Sparkles,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowRight,
  Layers,
  GitCommit,
  MessageSquare,
  Zap,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import type { EnhancementChange, EnhancementChangeType, EnhancementTargetType } from "@/lib/types"
import { applyEnhancementChanges } from "@/lib/actions/enhancement"

interface EnhancementReviewPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  journeyId: string
  journeyTitle: string
  changes: EnhancementChange[]
  summary: string
  onComplete: (appliedChangeIds: string[]) => void
}

type ChangeStatus = "pending" | "accepted" | "rejected" | "edited"

interface ChangeWithStatus extends EnhancementChange {
  status: ChangeStatus
  editedData?: EnhancementChange["data"]
}

const CHANGE_TYPE_CONFIG: Record<EnhancementChangeType, { icon: typeof Plus; label: string; color: string }> = {
  add: { icon: Plus, label: "Add", color: "text-green-600 bg-green-100 dark:bg-green-900/30" },
  modify: { icon: Pencil, label: "Modify", color: "text-amber-600 bg-amber-100 dark:bg-amber-900/30" },
  remove: { icon: Trash2, label: "Remove", color: "text-red-600 bg-red-100 dark:bg-red-900/30" },
}

const TARGET_TYPE_CONFIG: Record<EnhancementTargetType, { icon: typeof Layers; label: string }> = {
  stage: { icon: Layers, label: "Stage" },
  step: { icon: GitCommit, label: "Step" },
  touchpoint: { icon: MessageSquare, label: "Touchpoint" },
  painPoint: { icon: Zap, label: "Pain Point" },
  highlight: { icon: Star, label: "Highlight" },
}

export function EnhancementReviewPanel({
  open,
  onOpenChange,
  journeyId,
  journeyTitle,
  changes: initialChanges,
  summary,
  onComplete,
}: EnhancementReviewPanelProps) {
  const [changesWithStatus, setChangesWithStatus] = useState<ChangeWithStatus[]>(() =>
    initialChanges.map(c => ({ ...c, status: "pending" }))
  )
  const [isApplying, setIsApplying] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)

  // Group changes by stage for better organization
  const groupedChanges = useMemo(() => {
    const groups: Record<string, ChangeWithStatus[]> = {}
    
    for (const change of changesWithStatus) {
      const key = change.location.stageName || "General"
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(change)
    }
    
    return groups
  }, [changesWithStatus])

  // Statistics
  const stats = useMemo(() => {
    const pending = changesWithStatus.filter(c => c.status === "pending").length
    const accepted = changesWithStatus.filter(c => c.status === "accepted" || c.status === "edited").length
    const rejected = changesWithStatus.filter(c => c.status === "rejected").length
    return { pending, accepted, rejected, total: changesWithStatus.length }
  }, [changesWithStatus])

  const updateChangeStatus = (changeId: string, status: ChangeStatus) => {
    setChangesWithStatus(prev =>
      prev.map(c => c.id === changeId ? { ...c, status } : c)
    )
  }

  const updateChangeData = (changeId: string, editedData: EnhancementChange["data"]) => {
    setChangesWithStatus(prev =>
      prev.map(c => c.id === changeId ? { ...c, status: "edited", editedData } : c)
    )
    setEditingId(null)
  }

  const acceptAll = () => {
    setChangesWithStatus(prev =>
      prev.map(c => c.status === "pending" ? { ...c, status: "accepted" } : c)
    )
  }

  const rejectAll = () => {
    setChangesWithStatus(prev =>
      prev.map(c => c.status === "pending" ? { ...c, status: "rejected" } : c)
    )
  }

  const toggleExpanded = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApplyChanges = async () => {
    const changesToApply = changesWithStatus
      .filter(c => c.status === "accepted" || c.status === "edited")
      .map(c => ({
        ...c,
        data: c.editedData || c.data,
      }))

    if (changesToApply.length === 0) {
      toast.error("No changes selected to apply")
      return
    }

    setIsApplying(true)

    try {
      const result = await applyEnhancementChanges(journeyId, changesToApply)

      if (result.success) {
        toast.success(`Applied ${result.appliedCount} changes successfully`)
        onComplete(result.appliedChangeIds)
        onOpenChange(false)
      } else {
        toast.error(`Applied ${result.appliedCount} changes, ${result.failedCount} failed`)
        if (result.errors.length > 0) {
          console.error("Change errors:", result.errors)
        }
        onComplete(result.appliedChangeIds)
      }
    } catch (error) {
      console.error("Failed to apply changes:", error)
      toast.error("Failed to apply changes")
    } finally {
      setIsApplying(false)
    }
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 90) return <Badge variant="default" className="bg-green-600">High</Badge>
    if (confidence >= 70) return <Badge variant="default" className="bg-amber-600">Medium</Badge>
    return <Badge variant="secondary">Low</Badge>
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review Suggested Changes
          </SheetTitle>
          <SheetDescription>
            {summary}
          </SheetDescription>
        </SheetHeader>

        {/* Stats Bar */}
        <div className="px-6 py-3 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{stats.pending}</span> pending
            </span>
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="font-medium">{stats.accepted}</span> accepted
            </span>
            <span className="flex items-center gap-1.5">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="font-medium">{stats.rejected}</span> rejected
            </span>
          </div>
          
          {stats.pending > 0 && (
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={acceptAll}>
                Accept All
              </Button>
              <Button variant="ghost" size="sm" onClick={rejectAll}>
                Reject All
              </Button>
            </div>
          )}
        </div>

        {/* Changes List */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {Object.entries(groupedChanges).map(([stageName, stageChanges]) => (
              <div key={stageName} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Layers className="h-4 w-4" />
                  {stageName}
                  <Badge variant="secondary" className="ml-auto">
                    {stageChanges.length}
                  </Badge>
                </h3>
                
                <div className="space-y-2">
                  {stageChanges.map(change => {
                    const typeConfig = CHANGE_TYPE_CONFIG[change.type]
                    const targetConfig = TARGET_TYPE_CONFIG[change.targetType]
                    const TypeIcon = typeConfig.icon
                    const TargetIcon = targetConfig.icon
                    const isExpanded = expandedIds.has(change.id)
                    const isEditing = editingId === change.id

                    return (
                      <Collapsible
                        key={change.id}
                        open={isExpanded}
                        onOpenChange={() => toggleExpanded(change.id)}
                      >
                        <div
                          className={cn(
                            "border rounded-lg overflow-hidden transition-colors",
                            change.status === "accepted" && "border-green-500/50 bg-green-50/50 dark:bg-green-900/10",
                            change.status === "edited" && "border-amber-500/50 bg-amber-50/50 dark:bg-amber-900/10",
                            change.status === "rejected" && "border-red-500/50 bg-red-50/50 dark:bg-red-900/10 opacity-60"
                          )}
                        >
                          {/* Header */}
                          <CollapsibleTrigger asChild>
                            <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                              {isExpanded ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              
                              <div className={cn("p-1.5 rounded", typeConfig.color)}>
                                <TypeIcon className="h-3.5 w-3.5" />
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm truncate">
                                    {change.type === "add" && `Add ${targetConfig.label}`}
                                    {change.type === "modify" && `Modify ${targetConfig.label}`}
                                    {change.type === "remove" && `Remove ${targetConfig.label}`}
                                  </span>
                                  {getConfidenceBadge(change.confidence)}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">
                                  {change.data.name || change.data.description || change.data.channel || ""}
                                </p>
                              </div>

                              {/* Quick Actions */}
                              <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                {change.status === "pending" && (
                                  <>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-100"
                                            onClick={() => updateChangeStatus(change.id, "accepted")}
                                          >
                                            <Check className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Accept</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                    
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                            onClick={() => updateChangeStatus(change.id, "rejected")}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Reject</TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </>
                                )}
                                
                                {(change.status === "accepted" || change.status === "edited" || change.status === "rejected") && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 text-xs"
                                    onClick={() => updateChangeStatus(change.id, "pending")}
                                  >
                                    Undo
                                  </Button>
                                )}
                              </div>
                            </div>
                          </CollapsibleTrigger>

                          {/* Expanded Content */}
                          <CollapsibleContent>
                            <Separator />
                            <div className="p-3 space-y-3 bg-muted/30">
                              {/* Reasoning */}
                              <div>
                                <p className="text-xs font-medium text-muted-foreground mb-1">Reasoning</p>
                                <p className="text-sm">{change.reasoning}</p>
                              </div>

                              {/* Location Context */}
                              {(change.location.stepName || change.location.touchpointChannel) && (
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">Location</p>
                                  <div className="flex items-center gap-2 text-sm">
                                    {change.location.stageName && (
                                      <Badge variant="outline">{change.location.stageName}</Badge>
                                    )}
                                    {change.location.stepName && (
                                      <>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <Badge variant="outline">{change.location.stepName}</Badge>
                                      </>
                                    )}
                                    {change.location.touchpointChannel && (
                                      <>
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <Badge variant="outline">{change.location.touchpointChannel}</Badge>
                                      </>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Original vs New (for modify) */}
                              {change.type === "modify" && change.originalData && (
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Current</p>
                                    <div className="text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                                      {change.originalData.name || change.originalData.description || change.originalData.channel}
                                    </div>
                                  </div>
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Proposed</p>
                                    <div className="text-sm p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                                      {change.editedData?.name || change.editedData?.description || change.editedData?.channel ||
                                       change.data.name || change.data.description || change.data.channel}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Edit Form */}
                              {isEditing ? (
                                <EditChangeForm
                                  change={change}
                                  onSave={(data) => updateChangeData(change.id, data)}
                                  onCancel={() => setEditingId(null)}
                                />
                              ) : (
                                change.status === "pending" && change.type !== "remove" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditingId(change.id)}
                                  >
                                    <Pencil className="h-3 w-3 mr-1.5" />
                                    Edit before accepting
                                  </Button>
                                )
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-background">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
              Cancel
            </Button>
            <Button
              onClick={handleApplyChanges}
              disabled={isApplying || stats.accepted === 0}
            >
              {isApplying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Applying...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Apply {stats.accepted} Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

// Edit Form Component
function EditChangeForm({
  change,
  onSave,
  onCancel,
}: {
  change: ChangeWithStatus
  onSave: (data: EnhancementChange["data"]) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState(change.editedData || change.data)

  return (
    <div className="space-y-3 p-3 border rounded-lg bg-background">
      {(change.targetType === "stage" || change.targetType === "step") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Name</label>
          <Input
            value={formData.name || ""}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter name..."
          />
        </div>
      )}
      
      {(change.targetType === "step" || change.targetType === "touchpoint" || 
        change.targetType === "painPoint" || change.targetType === "highlight") && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Description</label>
          <Textarea
            value={formData.description || ""}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter description..."
            rows={3}
          />
        </div>
      )}
      
      {change.targetType === "touchpoint" && (
        <div className="space-y-1.5">
          <label className="text-xs font-medium">Channel</label>
          <Input
            value={formData.channel || ""}
            onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
            placeholder="e.g., Website, Mobile App..."
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>
        <Button size="sm" onClick={() => onSave(formData)}>
          Save Changes
        </Button>
      </div>
    </div>
  )
}
