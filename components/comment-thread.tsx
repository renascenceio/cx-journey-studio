"use client"

import { useState } from "react"
import type { Comment } from "@/lib/types"
// getUserById removed - using comment.authorName directly
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { CheckCircle2, MessageSquare, Pencil, ThumbsUp, Eye, Flame, PartyPopper, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

const emojiMap: Record<string, { icon: React.ElementType; label: string }> = {
  thumbsup: { icon: ThumbsUp, label: "Thumbs up" },
  eyes: { icon: Eye, label: "Looking into it" },
  fire: { icon: Flame, label: "Fire" },
  tada: { icon: PartyPopper, label: "Celebrate" },
  warning: { icon: AlertTriangle, label: "Warning" },
}

function highlightMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\w+)/g)
  return parts.map((part, i) =>
    part.startsWith("@") ? (
      <span key={i} className="font-semibold text-primary">{part}</span>
    ) : (
      <span key={i}>{part}</span>
    )
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

interface CommentThreadProps {
  comment: Comment
  replies: Comment[]
  onReply?: (parentId: string, content: string) => void
  onResolve?: (commentId: string) => void
  onReact?: (commentId: string, emoji: string) => void
  canResolve?: boolean
  canReply?: boolean
  compact?: boolean
}

function SingleComment({
  comment,
  onReact,
  isReply,
  compact,
}: {
  comment: Comment
  onReact?: (commentId: string, emoji: string) => void
  isReply?: boolean
  compact?: boolean
}) {
  const authorName = comment.authorName || "Unknown"
  const initials = authorName.split(" ").map((n) => n[0]).join("") || "?"

  return (
    <div className={cn("flex gap-2.5", isReply && "ml-8 pl-3 border-l-2 border-border/60")}>
      <Avatar className={cn("shrink-0", compact ? "h-6 w-6" : "h-7 w-7")}>
        <AvatarFallback className={cn("text-[10px] font-medium bg-muted", compact && "text-[9px]")}>
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold text-foreground">{authorName}</span>
          <span className="text-[10px] text-muted-foreground">{formatTime(comment.createdAt)}</span>
          {comment.editedAt && (
            <span className="text-[10px] text-muted-foreground italic flex items-center gap-0.5">
              <Pencil className="h-2.5 w-2.5" /> edited
            </span>
          )}
          {comment.resolved && (
            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 gap-0.5 text-emerald-600 border-emerald-200 dark:text-emerald-400 dark:border-emerald-800">
              <CheckCircle2 className="h-2.5 w-2.5" /> Resolved
            </Badge>
          )}
        </div>
        <p className={cn("text-xs text-muted-foreground mt-0.5 leading-relaxed", compact && "text-[11px]")}>
          {highlightMentions(comment.content)}
        </p>
        {comment.reactions && comment.reactions.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            {comment.reactions.map((r) => {
              const emoji = emojiMap[r.emoji]
              if (!emoji) return null
              const Icon = emoji.icon
              return (
                <TooltipProvider key={r.emoji}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => onReact?.(comment.id, r.emoji)}
                        className="flex items-center gap-1 rounded-full border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted transition-colors"
                      >
                        <Icon className="h-3 w-3" />
                        <span>{r.userIds.length}</span>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      {r.userIds.map(() => "User").join(", ")}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export function CommentThread({
  comment,
  replies,
  onReply,
  onResolve,
  onReact,
  canResolve = true,
  canReply = true,
  compact = false,
}: CommentThreadProps) {
  const [showReplyInput, setShowReplyInput] = useState(false)
  const [replyText, setReplyText] = useState("")

  const handleSubmitReply = () => {
    if (replyText.trim() && onReply) {
      onReply(comment.id, replyText.trim())
      setReplyText("")
      setShowReplyInput(false)
    }
  }

  return (
    <div className={cn("space-y-2", compact ? "py-2" : "py-3")}>
      <SingleComment comment={comment} onReact={onReact} compact={compact} />

      {replies.map((reply) => (
        <SingleComment key={reply.id} comment={reply} onReact={onReact} isReply compact={compact} />
      ))}

      {(canReply || canResolve) && (
        <div className={cn("flex items-center gap-2", replies.length > 0 ? "ml-8 pl-3" : "ml-9")}>
          {canReply && !showReplyInput && (
            <button
              onClick={() => setShowReplyInput(true)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageSquare className="h-3 w-3" /> Reply
            </button>
          )}
          {canResolve && !comment.resolved && (
            <button
              onClick={() => onResolve?.(comment.id)}
              className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              <CheckCircle2 className="h-3 w-3" /> Resolve
            </button>
          )}
        </div>
      )}

      {showReplyInput && (
        <div className="ml-8 pl-3 border-l-2 border-border/60">
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className="w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            rows={2}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleSubmitReply()
            }}
            autoFocus
          />
          <div className="flex items-center justify-between mt-1.5">
            <span className="text-[10px] text-muted-foreground">Cmd+Enter to submit</span>
            <div className="flex gap-1.5">
              <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={() => setShowReplyInput(false)}>
                Cancel
              </Button>
              <Button size="sm" className="h-6 text-[10px] px-2.5" onClick={handleSubmitReply} disabled={!replyText.trim()}>
                Reply
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
