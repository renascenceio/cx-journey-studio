"use client"

import { useEffect, useState, useRef } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Undo2, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface UndoToastOptions {
  message: string
  description?: string
  duration?: number // in milliseconds, default 10000 (10 seconds)
  onUndo: () => Promise<void> | void
  onExpire?: () => Promise<void> | void
}

interface UndoToastContentProps {
  message: string
  description?: string
  duration: number
  onUndo: () => void
  onDismiss: () => void
  toastId: string | number
}

function UndoToastContent({
  message,
  description,
  duration,
  onUndo,
  onDismiss,
  toastId,
}: UndoToastContentProps) {
  const [timeLeft, setTimeLeft] = useState(duration)
  const [isUndoing, setIsUndoing] = useState(false)
  const startTimeRef = useRef(Date.now())
  const frameRef = useRef<number>()

  const progress = (timeLeft / duration) * 100

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current
      const remaining = Math.max(0, duration - elapsed)
      setTimeLeft(remaining)

      if (remaining > 0) {
        frameRef.current = requestAnimationFrame(animate)
      }
    }

    frameRef.current = requestAnimationFrame(animate)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [duration])

  const handleUndo = async () => {
    if (isUndoing) return
    setIsUndoing(true)
    if (frameRef.current) {
      cancelAnimationFrame(frameRef.current)
    }
    try {
      await onUndo()
      toast.dismiss(toastId)
    } catch {
      setIsUndoing(false)
    }
  }

  const seconds = Math.ceil(timeLeft / 1000)

  return (
    <div className="flex flex-col w-full gap-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{message}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            className="h-7 gap-1.5 text-xs font-medium"
            onClick={handleUndo}
            disabled={isUndoing}
          >
            <Undo2 className="h-3 w-3" />
            Undo {seconds > 0 && `(${seconds}s)`}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {/* Progress bar */}
      <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all ease-linear rounded-full",
            progress > 30 ? "bg-primary" : progress > 10 ? "bg-amber-500" : "bg-red-500"
          )}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export function showUndoToast({
  message,
  description,
  duration = 10000,
  onUndo,
  onExpire,
}: UndoToastOptions): string | number {
  let resolved = false
  let toastId: string | number

  const handleUndo = async () => {
    if (resolved) return
    resolved = true
    await onUndo()
  }

  const handleDismiss = () => {
    if (!resolved && onExpire) {
      resolved = true
      onExpire()
    }
    toast.dismiss(toastId)
  }

  toastId = toast.custom(
    (id) => (
      <UndoToastContent
        message={message}
        description={description}
        duration={duration}
        onUndo={handleUndo}
        onDismiss={() => handleDismiss()}
        toastId={id}
      />
    ),
    {
      duration: duration + 500, // Add buffer to let animation complete
      onAutoClose: () => {
        if (!resolved && onExpire) {
          resolved = true
          onExpire()
        }
      },
      className: "bg-background border border-border shadow-lg rounded-lg p-4 w-full max-w-md",
    }
  )

  return toastId
}

// Helper to create a pending delete that can be undone
export function createPendingDelete<T>({
  item,
  itemType,
  itemName,
  onDelete,
  onRestore,
}: {
  item: T
  itemType: string
  itemName: string
  onDelete: () => Promise<void>
  onRestore: (item: T) => Promise<void>
}) {
  let deleted = false

  showUndoToast({
    message: `${itemType} deleted`,
    description: `"${itemName}" has been removed.`,
    duration: 10000,
    onUndo: async () => {
      if (deleted) {
        // Item was already deleted, restore it
        await onRestore(item)
      }
      // If not deleted yet, just cancel - don't do anything
      deleted = false
    },
    onExpire: async () => {
      if (!deleted) {
        // Timer expired without undo, perform actual delete
        deleted = true
        await onDelete()
      }
    },
  })

  // Return function to immediately delete (for cases where we need sync delete)
  return () => {
    if (!deleted) {
      deleted = true
      return onDelete()
    }
    return Promise.resolve()
  }
}
