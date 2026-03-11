"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Pencil } from "lucide-react"
import { cn } from "@/lib/utils"

interface InlineRenameTitleProps {
  value: string
  onRename: (newValue: string) => Promise<void>
  className?: string
  editable?: boolean
}

export function InlineRenameTitle({ value, onRename, className, editable = true }: InlineRenameTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { setDraft(value) }, [value])
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  const handleSave = useCallback(async () => {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      setDraft(value)
      return
    }
    setSaving(true)
    try {
      await onRename(trimmed)
      setEditing(false)
    } catch {
      setDraft(value)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }, [draft, value, onRename])

  if (!editable) {
    return <h1 className={cn("text-2xl font-bold tracking-tight text-foreground", className)}>{value}</h1>
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className={cn(
          "text-2xl font-bold tracking-tight text-foreground bg-transparent border-b-2 border-primary/50 outline-none py-0.5 px-0 w-full max-w-lg",
          saving && "opacity-60",
          className
        )}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleSave}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSave()
          if (e.key === "Escape") { setDraft(value); setEditing(false) }
        }}
        disabled={saving}
      />
    )
  }

  return (
    <h1
      className={cn(
        "group text-2xl font-bold tracking-tight text-foreground cursor-pointer flex items-center gap-2",
        className
      )}
      onDoubleClick={() => setEditing(true)}
      title="Double-click to rename"
    >
      <span className="text-balance">{value}</span>
      <Pencil className="h-3.5 w-3.5 text-muted-foreground/0 group-hover:text-muted-foreground/50 transition-colors shrink-0" />
    </h1>
  )
}
