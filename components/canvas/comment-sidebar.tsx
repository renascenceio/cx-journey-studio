"use client"

import { useState, useMemo, useCallback } from "react"
import { X, Filter, MessageSquare, CheckCircle2, CircleDot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CommentThread } from "@/components/comment-thread"
import { CommentComposer } from "@/components/comment-composer"
import { useJourneyComments } from "@/hooks/use-journey"
import type { Comment, Stage } from "@/lib/types"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { addComment, resolveComment } from "@/lib/actions/data"
import { mutate } from "swr"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type FilterTab = "all" | "open" | "resolved"

interface CommentSidebarProps {
  journeyId: string
  stages: Stage[]
  open: boolean
  onClose: () => void
  highlightStageId?: string | null
  highlightStepId?: string | null
  highlightTouchpointId?: string | null
  onClearHighlight?: () => void
  onNavigateToTouchpoint?: (touchpointId: string, stageId: string, stepId: string) => void
}

export function CommentSidebar({
  journeyId,
  stages,
  open,
  onClose,
  highlightStageId,
  highlightStepId,
  highlightTouchpointId,
  onClearHighlight,
  onNavigateToTouchpoint,
}: CommentSidebarProps) {
  const [filterTab, setFilterTab] = useState<FilterTab>("all")
  const [localComments, setLocalComments] = useState<Comment[]>([])

  const { comments: fetchedComments } = useJourneyComments(journeyId)
  
  // Fetch collaborators for @mentions
  const { data: collabData } = useSWR<{
    collaborators: Array<{ profile?: { id: string; name: string; email: string; role: string } }>
    availableMembers: Array<{ id: string; name: string; email: string; role: string }>
  }>(`/api/journeys/${journeyId}/collaborators`, fetcher)
  
  // Combine collaborators and available members for mention suggestions
  const teamMembers = useMemo(() => {
    const members: Array<{ id: string; name: string; email?: string; role?: string }> = []
    
    // Add collaborators with profiles
    collabData?.collaborators?.forEach((c) => {
      if (c.profile) {
        members.push({
          id: c.profile.id,
          name: c.profile.name,
          email: c.profile.email,
          role: c.profile.role,
        })
      }
    })
    
    // Add available organization members
    collabData?.availableMembers?.forEach((m) => {
      if (!members.some((mem) => mem.id === m.id)) {
        members.push({
          id: m.id,
          name: m.name,
          email: m.email,
          role: m.role,
        })
      }
    })
    
    return members
  }, [collabData])

  const allComments = useMemo(() => {
    return [...fetchedComments, ...localComments]
  }, [fetchedComments, localComments])

  // Root-level comments only (not replies)
  const rootComments = useMemo(() => {
    let filtered = allComments.filter((c) => !c.parentId)

    // Filter by tab only (no longer filter by stage/step/touchpoint)
    if (filterTab === "open") {
      filtered = filtered.filter((c) => !c.resolved)
    } else if (filterTab === "resolved") {
      filtered = filtered.filter((c) => c.resolved)
    }

    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [allComments, filterTab])
  
  // Check if a comment matches the highlighted context
  const isCommentHighlighted = useCallback((comment: Comment): boolean => {
    if (highlightTouchpointId) {
      return comment.touchpointId === highlightTouchpointId
    } else if (highlightStepId) {
      // Highlight comments for this step OR any touchpoint in this step
      if (comment.stepId === highlightStepId) return true
      const stage = stages.find(s => s.id === highlightStageId)
      const step = stage?.steps.find(s => s.id === highlightStepId)
      const tpIds = step?.touchPoints.map(tp => tp.id) || []
      return comment.touchpointId ? tpIds.includes(comment.touchpointId) : false
    } else if (highlightStageId) {
      // Highlight comments for this stage OR any step/touchpoint in this stage
      if (comment.stageId === highlightStageId) return true
      const stage = stages.find(s => s.id === highlightStageId)
      const stepIds = stage?.steps.map(s => s.id) || []
      const tpIds = stage?.steps.flatMap(s => s.touchPoints.map(tp => tp.id)) || []
      if (comment.stepId && stepIds.includes(comment.stepId)) return true
      if (comment.touchpointId && tpIds.includes(comment.touchpointId)) return true
      return false
    }
    return false
  }, [highlightTouchpointId, highlightStepId, highlightStageId, stages])
  
  // Sort highlighted comments to the top
  const sortedComments = useMemo(() => {
    if (!highlightStageId && !highlightStepId && !highlightTouchpointId) {
      return rootComments
    }
    
    const highlighted = rootComments.filter(c => isCommentHighlighted(c))
    const others = rootComments.filter(c => !isCommentHighlighted(c))
    return [...highlighted, ...others]
  }, [rootComments, highlightStageId, highlightStepId, highlightTouchpointId, isCommentHighlighted])

  function getReplies(parentId: string): Comment[] {
    return allComments
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  function getStageName(stageId?: string): string {
    if (!stageId) return ""
    return stages.find((s) => s.id === stageId)?.name || ""
  }

  function getStepName(stageId?: string, stepId?: string): string {
    if (!stageId || !stepId) return ""
    const stage = stages.find((s) => s.id === stageId)
    if (!stage) return ""
    return stage.steps.find((s) => s.id === stepId)?.name || ""
  }

  function getTouchpointDescription(touchpointId?: string): string {
    if (!touchpointId) return ""
    for (const stage of stages) {
      for (const step of stage.steps) {
        const tp = step.touchPoints.find((t) => t.id === touchpointId)
        if (tp) return tp.description.substring(0, 40) + (tp.description.length > 40 ? "..." : "")
      }
    }
    return ""
  }

  function getTouchpointContext(touchpointId?: string): { 
    stageName: string
    stepName: string
    tpDesc: string
    stageId: string
    stepId: string
    touchpointId: string
  } | null {
    if (!touchpointId) return null
    for (const stage of stages) {
      for (const step of stage.steps) {
        const tp = step.touchPoints.find((t) => t.id === touchpointId)
        if (tp) {
          return {
            stageName: stage.name,
            stepName: step.name,
            tpDesc: tp.description.substring(0, 30) + (tp.description.length > 30 ? "..." : ""),
            stageId: stage.id,
            stepId: step.id,
            touchpointId: tp.id,
          }
        }
      }
    }
    return null
  }

  async function handleNewComment(content: string, mentions: string[]) {
    try {
      await addComment({
        journeyId,
        content,
        stageId: highlightStageId || undefined,
        stepId: highlightStepId || undefined,
        touchpointId: highlightTouchpointId || undefined,
        mentions,
      })
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success("Comment added")
    } catch {
      // Fallback to local state if server action fails
      const newComment: Comment = {
        id: `cmt-new-${Date.now()}`,
        journeyId,
        content,
        authorId: "user-1",
        mentions,
        resolved: false,
        createdAt: new Date().toISOString(),
        stageId: highlightStageId || undefined,
        stepId: highlightStepId || undefined,
        touchpointId: highlightTouchpointId || undefined,
      }
      setLocalComments((prev) => [...prev, newComment])
      toast.success("Comment added locally")
    }
  }

  async function handleReply(parentId: string, content: string) {
    try {
      await addComment({
        journeyId,
        content,
        parentId,
      })
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success("Reply added")
    } catch {
      const parent = allComments.find((c) => c.id === parentId)
      const newReply: Comment = {
        id: `cmt-reply-${Date.now()}`,
        journeyId,
        content,
        authorId: "user-1",
        mentions: [],
        resolved: false,
        createdAt: new Date().toISOString(),
        parentId,
        stageId: parent?.stageId,
        stepId: parent?.stepId,
      }
      setLocalComments((prev) => [...prev, newReply])
      toast.success("Reply added locally")
    }
  }

  async function handleResolve(commentId: string) {
    try {
      await resolveComment(commentId, journeyId)
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success("Comment resolved")
    } catch {
      toast.error("Failed to resolve comment")
    }
  }

  const highlightLabel = highlightTouchpointId
    ? (() => {
        const ctx = getTouchpointContext(highlightTouchpointId)
        return ctx ? `${ctx.stageName} > ${ctx.tpDesc}` : "Touchpoint"
      })()
    : highlightStageId
      ? `${getStageName(highlightStageId)}${highlightStepId ? ` > ${getStepName(highlightStageId, highlightStepId)}` : ""}`
      : null
      
  const highlightedCount = rootComments.filter(c => isCommentHighlighted(c)).length

  const openCount = allComments.filter((c) => !c.parentId && !c.resolved).length
  const resolvedCount = allComments.filter((c) => !c.parentId && c.resolved).length

  if (!open) return null

  return (
    <div className="absolute right-0 top-0 bottom-0 w-80 border-l border-border bg-background shadow-lg z-20 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Comments</h3>
          <span className="text-[10px] text-muted-foreground">
            ({rootComments.length})
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
          <span className="sr-only">Close comments</span>
        </Button>
      </div>

      {/* Highlight context */}
      {highlightLabel && (
        <div className="flex items-center justify-between border-b border-border bg-primary/5 px-3 py-1.5">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Filter className="h-3 w-3 text-primary" />
            <span className="font-medium text-foreground">{highlightLabel}</span>
            <span className="text-primary">({highlightedCount})</span>
          </div>
          <button
            onClick={onClearHighlight}
            className="text-[10px] text-primary hover:underline"
          >
            Clear
          </button>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex items-center gap-0.5 border-b border-border px-3 py-1.5">
        {([
          { key: "all" as FilterTab, label: "All", count: openCount + resolvedCount },
          { key: "open" as FilterTab, label: "Open", count: openCount, icon: CircleDot },
          { key: "resolved" as FilterTab, label: "Resolved", count: resolvedCount, icon: CheckCircle2 },
        ]).map(({ key, label, count, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setFilterTab(key)}
            className={cn(
              "flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium transition-colors",
              filterTab === key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {Icon && <Icon className="h-3 w-3" />}
            {label}
            <span className={cn(
              "ml-0.5 text-[9px]",
              filterTab === key ? "opacity-80" : "opacity-60"
            )}>
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-3">
        {rootComments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-xs text-muted-foreground">No comments yet</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              Be the first to start a discussion
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {sortedComments.map((comment, index) => {
              const stageName = getStageName(comment.stageId)
              const tpContext = comment.touchpointId ? getTouchpointContext(comment.touchpointId) : null
              const isHighlighted = isCommentHighlighted(comment)
              const showBreadcrumb = stageName || tpContext
              
              // Show separator between highlighted and non-highlighted
              const prevComment = index > 0 ? sortedComments[index - 1] : null
              const showSeparator = prevComment && isCommentHighlighted(prevComment) && !isHighlighted

              return (
                <div key={comment.id}>
                  {showSeparator && (
                    <div className="py-2 px-3 bg-muted/30 border-y border-border">
                      <span className="text-[9px] text-muted-foreground">Other comments</span>
                    </div>
                  )}
                  <div className={cn(
                    isHighlighted && "bg-primary/5 border-l-2 border-l-primary"
                  )}>
                    {showBreadcrumb && (
                      <div className="pt-2 pb-0 px-3 flex items-center gap-1">
                        {tpContext ? (
                          <>
                            <button
                              onClick={() => onNavigateToTouchpoint?.(tpContext.touchpointId, tpContext.stageId, tpContext.stepId)}
                              className="text-[9px] font-medium text-primary hover:underline bg-muted rounded px-1.5 py-0.5"
                            >
                              {tpContext.stageName}
                            </button>
                            <span className="text-[9px] text-muted-foreground">{">"}</span>
                            <button
                              onClick={() => onNavigateToTouchpoint?.(tpContext.touchpointId, tpContext.stageId, tpContext.stepId)}
                              className="text-[9px] font-medium text-primary hover:underline bg-muted rounded px-1.5 py-0.5 truncate max-w-[120px]"
                              title={tpContext.tpDesc}
                            >
                              {tpContext.tpDesc}
                            </button>
                          </>
                        ) : stageName ? (
                          <span className="text-[9px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                            {stageName}
                          </span>
                        ) : null}
                      </div>
                    )}
                    <CommentThread
                      comment={comment}
                      replies={getReplies(comment.id)}
                      onReply={handleReply}
                      onResolve={handleResolve}
                      onReact={() => {}}
                      compact
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-border px-3 py-2.5">
        <CommentComposer
          onSubmit={handleNewComment}
          placeholder={highlightLabel ? `Comment on ${highlightLabel}...` : "Add a comment..."}
          compact
          teamMembers={teamMembers}
        />
      </div>
    </div>
  )
}
