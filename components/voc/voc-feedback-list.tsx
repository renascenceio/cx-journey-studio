"use client"

import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThumbsUp, ThumbsDown, Minus, MessageSquare, Layers, GitBranch, Radio, MapPin } from "lucide-react"
import { cn } from "@/lib/utils"
import type { VoCFeedback } from "@/lib/types"

interface VoCFeedbackListProps {
  feedback: VoCFeedback[]
  maxHeight?: string
}

function SentimentIcon({ sentiment }: { sentiment: string | null }) {
  if (sentiment === "positive") {
    return <ThumbsUp className="h-4 w-4 text-green-600" />
  }
  if (sentiment === "negative") {
    return <ThumbsDown className="h-4 w-4 text-red-600" />
  }
  return <Minus className="h-4 w-4 text-muted-foreground" />
}

function FeedbackTypeLabel({ type }: { type: string }) {
  const colors: Record<string, string> = {
    survey: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    review: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    support: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    social: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    other: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
  }
  
  return (
    <Badge className={cn("text-[10px] capitalize", colors[type] || colors.other)}>
      {type}
    </Badge>
  )
}

function TargetElementBadge({ item }: { item: VoCFeedback }) {
  const targetType = item.targetType
  const metadata = item.metadata as Record<string, unknown> | null
  
  let icon = <MapPin className="h-3 w-3" />
  let label = "Journey"
  let color = "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200"
  
  if (targetType === "stage") {
    icon = <Layers className="h-3 w-3" />
    label = (metadata?.stageName as string) || "Stage"
    color = "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200"
  } else if (targetType === "step") {
    icon = <GitBranch className="h-3 w-3" />
    label = (metadata?.stepDescription as string) || (metadata?.stageName as string) || "Step"
    color = "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
  } else if (targetType === "touchpoint") {
    icon = <Radio className="h-3 w-3" />
    label = (metadata?.channel as string) || "Touchpoint"
    color = "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200"
  }
  
  return (
    <Badge className={cn("text-[10px] gap-1", color)}>
      {icon}
      <span className="truncate max-w-[100px]">{label}</span>
    </Badge>
  )
}

function FeedbackItem({ item }: { item: VoCFeedback }) {
  const initials = item.respondentId 
    ? item.respondentId.slice(0, 2).toUpperCase() 
    : "AN"
  
  return (
    <div className="flex gap-3 p-3 border-b last:border-b-0">
      <Avatar className="h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs bg-muted">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <SentimentIcon sentiment={item.sentiment} />
          <TargetElementBadge item={item} />
          <FeedbackTypeLabel type={item.feedbackType} />
          {item.npsScore !== null && (
            <Badge variant="outline" className="text-[10px]">
              NPS: {item.npsScore}
            </Badge>
          )}
          {item.csatScore !== null && (
            <Badge variant="outline" className="text-[10px]">
              CSAT: {item.csatScore}/5
            </Badge>
          )}
          {item.cesScore !== null && (
            <Badge variant="outline" className="text-[10px]">
              CES: {item.cesScore}/7
            </Badge>
          )}
        </div>
        {item.textContent && (
          <p className="text-sm text-foreground line-clamp-3">
            {item.textContent}
          </p>
        )}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {formatDistanceToNow(new Date(item.respondedAt), { addSuffix: true })}
          </span>
          {item.tags && item.tags.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1 flex-wrap">
                {item.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                    {tag}
                  </span>
                ))}
                {item.tags.length > 3 && (
                  <span className="text-[10px]">+{item.tags.length - 3}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function VoCFeedbackList({ feedback, maxHeight = "400px" }: VoCFeedbackListProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recent Feedback
            </CardTitle>
            <CardDescription>
              Latest customer responses
            </CardDescription>
          </div>
          <Badge variant="secondary">{feedback.length}</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {feedback.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No feedback available yet. Connect a data source to see customer feedback.
          </div>
        ) : (
          <ScrollArea style={{ maxHeight }}>
            <div className="divide-y">
              {feedback.map(item => (
                <FeedbackItem key={item.id} item={item} />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
