"use client"

import { useState, useRef, useEffect, useCallback } from "react"
// users removed -- mention suggestions handled inline
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface TeamMember {
  id: string
  name: string
  email?: string
  avatar?: string | null
  role?: string
}

interface CommentComposerProps {
  onSubmit: (content: string, mentions: string[]) => void
  placeholder?: string
  compact?: boolean
  autoFocus?: boolean
  currentUserId?: string
  teamMembers?: TeamMember[]
}

export function CommentComposer({
  onSubmit,
  placeholder = "Add a comment...",
  compact = false,
  autoFocus = false,
  currentUserId = "user-1",
  teamMembers = [],
}: CommentComposerProps) {
  const [text, setText] = useState("")
  const [showMentions, setShowMentions] = useState(false)
  const [mentionFilter, setMentionFilter] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [trackedMentions, setTrackedMentions] = useState<string[]>([])
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const initials = currentUserId?.slice(0, 2).toUpperCase() || "?"

  // Filter team members based on mention search
  const filteredMembers = teamMembers.filter((u) =>
    u.name.toLowerCase().includes(mentionFilter.toLowerCase())
  )

  const handleTextChange = useCallback((value: string, pos: number) => {
    setText(value)
    setCursorPosition(pos)

    // Check if we're in a mention trigger
    const before = value.slice(0, pos)
    const match = before.match(/@(\w*)$/)
    if (match) {
      setShowMentions(true)
      setMentionFilter(match[1])
      setMentionIndex(0)
    } else {
      setShowMentions(false)
      setMentionFilter("")
    }
  }, [])

  const insertMention = useCallback((user: typeof teamMembers[0]) => {
    const before = text.slice(0, cursorPosition)
    const after = text.slice(cursorPosition)
    const mentionStart = before.lastIndexOf("@")
    const newText = before.slice(0, mentionStart) + `@${user.name.split(" ")[0]} ` + after
    setText(newText)
    setTrackedMentions((prev) => [...prev, user.id])
    setShowMentions(false)
    textareaRef.current?.focus()
  }, [text, cursorPosition])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (showMentions && filteredMembers.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex((prev) => Math.min(prev + 1, filteredMembers.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex((prev) => Math.max(prev - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertMention(filteredMembers[mentionIndex])
        return
      }
      if (e.key === "Escape") {
        setShowMentions(false)
        return
      }
    }

    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (text.trim()) {
      onSubmit(text.trim(), trackedMentions)
      setText("")
      setTrackedMentions([])
    }
  }

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [autoFocus])

  return (
    <div className={cn("relative", compact ? "px-0" : "px-0")}>
      <div className="flex gap-2">
        <Avatar className={cn("shrink-0 mt-0.5", compact ? "h-5 w-5" : "h-6 w-6")}>
          <AvatarFallback className={cn("text-[9px] font-medium bg-primary/10 text-primary", compact && "text-[8px]")}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => handleTextChange(e.target.value, e.target.selectionStart || 0)}
              onKeyDown={handleKeyDown}
              onClick={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart || 0)}
              placeholder={placeholder}
              className={cn(
                "w-full rounded-md border border-border bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none transition-colors",
                compact ? "min-h-[28px]" : "min-h-[48px]"
              )}
              rows={compact ? 1 : 2}
            />

            {/* @mention autocomplete dropdown */}
            {showMentions && filteredMembers.length > 0 && (
              <div className="absolute bottom-full left-0 mb-1 w-56 rounded-md border border-border bg-popover shadow-lg z-50 py-1 max-h-40 overflow-y-auto">
                {filteredMembers.map((user, i) => (
                  <button
                    key={user.id}
                    onMouseDown={(e) => {
                      e.preventDefault()
                      insertMention(user)
                    }}
                    className={cn(
                      "flex items-center gap-2 w-full px-2.5 py-1.5 text-left text-xs hover:bg-accent transition-colors",
                      i === mentionIndex && "bg-accent"
                    )}
                  >
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[8px] font-medium bg-muted">
                        {user.name.split(" ").map((n) => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium text-foreground">{user.name}</span>
                      {user.role && <span className="ml-1.5 text-muted-foreground capitalize">{user.role.replace("_", " ")}</span>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-1">
            <span className="text-[10px] text-muted-foreground">
              Type @ to mention{compact ? "" : " -- Cmd+Enter to submit"}
            </span>
            <Button
              size="sm"
              className="h-6 text-[10px] px-2.5"
              onClick={handleSubmit}
              disabled={!text.trim()}
            >
              Comment
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
