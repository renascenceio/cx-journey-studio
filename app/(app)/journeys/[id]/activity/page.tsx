"use client"

import { useParams } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useJourney, useJourneyActivity } from "@/hooks/use-journey"
import {
  PenLine,
  MessageSquare,
  RefreshCw,
  Plus,
  Rocket,
  Share2,
  Archive,
  AtSign,
  Filter,
} from "lucide-react"
import type { ActivityAction } from "@/lib/types"
import { useState } from "react"
import { cn } from "@/lib/utils"

const actionIcons: Record<ActivityAction, typeof PenLine> = {
  created: Plus,
  edited: PenLine,
  commented: MessageSquare,
  status_changed: RefreshCw,
  deployed: Rocket,
  shared: Share2,
  archived: Archive,
  mentioned_you: AtSign,
}

const actionColors: Record<ActivityAction, string> = {
  created: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  edited: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  commented: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  status_changed: "bg-primary/10 text-primary",
  deployed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  shared: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
  archived: "bg-muted text-muted-foreground",
  mentioned_you: "bg-primary/15 text-primary",
}

type ActivityFilter = "all" | "comments" | "edits" | "status" | "deployments"

const filterConfig: { key: ActivityFilter; label: string; actions: ActivityAction[] }[] = [
  { key: "all", label: "All", actions: [] },
  { key: "comments", label: "Comments", actions: ["commented", "mentioned_you"] },
  { key: "edits", label: "Edits", actions: ["edited", "created"] },
  { key: "status", label: "Status", actions: ["status_changed"] },
  { key: "deployments", label: "Deployments", actions: ["deployed", "shared"] },
]

import { getInitials } from "@/lib/utils"

function formatRelativeTime(dateStr: string) {
  const date = new Date(dateStr)
  const now = new Date("2026-02-22T12:00:00Z") // Mock "now"
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export default function ActivityPage() {
  const params = useParams()
  const journeyId = params.id as string
  const { journey, isLoading } = useJourney(journeyId)
  const { activity: allActivity } = useJourneyActivity(journeyId)
  const [activeFilter, setActiveFilter] = useState<ActivityFilter>("all")
  const [visibleCount, setVisibleCount] = useState(10)

  if (isLoading || !journey) return (
    <div className="flex items-center justify-center py-24">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )

  const activity = allActivity.filter((entry) => {
    if (activeFilter === "all") return true
    const config = filterConfig.find((f) => f.key === activeFilter)
    return config ? config.actions.includes(entry.action) : true
  }).slice(0, visibleCount)

  // Group by date
  const grouped = activity.reduce<Record<string, typeof activity>>((acc, entry) => {
    const date = new Date(entry.timestamp).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    if (!acc[date]) acc[date] = []
    acc[date].push(entry)
    return acc
  }, {})

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="flex flex-col gap-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Activity Log</h2>
          <p className="text-sm text-muted-foreground">
            {allActivity.length} event{allActivity.length !== 1 ? "s" : ""} recorded
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
          {filterConfig.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => { setActiveFilter(key); setVisibleCount(10) }}
              className={cn(
                "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                activeFilter === key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {activity.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-sm text-muted-foreground">No activity recorded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(grouped).map(([date, entries]) => (
              <div key={date}>
                <p className="text-xs font-medium text-muted-foreground mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                  {date}
                </p>
                <div className="flex flex-col gap-0">
                  {entries.map((entry, i) => {
                    const actorName = entry.actorName || "Unknown"
                    const Icon = actionIcons[entry.action]
                    return (
                      <div key={entry.id} className="flex gap-3 relative">
                        {/* Timeline line */}
                        {i < entries.length - 1 && (
                          <div className="absolute left-[15px] top-8 bottom-0 w-px bg-border/60" />
                        )}
                        {/* Icon */}
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${actionColors[entry.action]}`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        {/* Content */}
                        <div className="flex-1 min-w-0 pb-6">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="bg-primary/10 text-[8px] font-medium text-primary">
                                {getInitials(actorName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium text-foreground">{actorName}</span>
                            <Badge variant="secondary" className="text-[9px] capitalize">
                              {entry.action.replace("_", " ")}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground ml-auto shrink-0">
                              {formatRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                          <p className={cn(
                            "mt-1 text-xs leading-relaxed text-muted-foreground",
                            entry.action === "mentioned_you" && "text-foreground font-medium"
                          )}>
                            {entry.details}
                          </p>
                          {/* Stage/step breadcrumb */}
                          {(entry.stageId || entry.stepId) && (
                            <div className="mt-1">
                              <span className="text-[9px] font-medium text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                                {journey.stages.find((s) => s.id === entry.stageId)?.name || ""}
                                {entry.stepId && (() => {
                                  const stage = journey.stages.find((s) => s.id === entry.stageId)
                                  const step = stage?.steps.find((s) => s.id === entry.stepId)
                                  return step ? ` > ${step.name}` : ""
                                })()}
                              </span>
                            </div>
                          )}
                          {/* Comment preview quote */}
                          {entry.commentPreview && (
                            <div className="mt-1.5 border-l-2 border-border pl-2.5 py-1">
                              <p className="text-[11px] text-muted-foreground italic leading-relaxed line-clamp-2">
                                {entry.commentPreview}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Load more */}
            {visibleCount < allActivity.length && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setVisibleCount((c) => c + 10)}
                  className="rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground bg-muted hover:text-foreground hover:bg-muted/80 transition-colors"
                >
                  Load more ({allActivity.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
