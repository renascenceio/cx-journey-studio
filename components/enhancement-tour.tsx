"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { 
  ChevronLeft, 
  ChevronRight, 
  X, 
  Check,
  Sparkles,
  Plus,
  Pencil,
  Trash2,
} from "lucide-react"

export interface TourStep {
  id: string
  targetId: string // Element ID to highlight
  type: "add" | "modify" | "remove"
  targetType: "stage" | "step" | "touchpoint" | "painPoint" | "highlight"
  title: string
  description: string
  position?: "top" | "bottom" | "left" | "right"
}

interface EnhancementTourProps {
  steps: TourStep[]
  onComplete: () => void
  onDismiss: () => void
}

export function EnhancementTour({ steps, onComplete, onDismiss }: EnhancementTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 })
  const [tooltipSide, setTooltipSide] = useState<"top" | "bottom" | "left" | "right">("bottom")
  const [isVisible, setIsVisible] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const currentStep = steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const progress = ((currentStepIndex + 1) / steps.length) * 100

  // Position tooltip near target element
  const positionTooltip = useCallback(() => {
    if (!currentStep) return

    const targetElement = document.getElementById(currentStep.targetId) ||
      document.querySelector(`[data-tour-id="${currentStep.targetId}"]`)

    if (!targetElement) {
      // If target not found, try scrolling to stage/step
      const stageElement = document.querySelector(`[data-stage-id="${currentStep.targetId}"]`)
      if (stageElement) {
        stageElement.scrollIntoView({ behavior: "smooth", block: "center" })
      }
      return
    }

    const rect = targetElement.getBoundingClientRect()
    const tooltipWidth = 320
    const tooltipHeight = 200
    const padding = 16
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    // Scroll element into view if needed
    if (rect.top < 0 || rect.bottom > viewportHeight) {
      targetElement.scrollIntoView({ behavior: "smooth", block: "center" })
      // Wait for scroll to complete
      setTimeout(() => positionTooltip(), 300)
      return
    }

    // Determine best position
    let side: "top" | "bottom" | "left" | "right" = currentStep.position || "bottom"
    let top = 0
    let left = 0

    // Calculate positions for each side
    const positions = {
      bottom: {
        top: rect.bottom + padding,
        left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
        fits: rect.bottom + padding + tooltipHeight < viewportHeight,
      },
      top: {
        top: rect.top - padding - tooltipHeight,
        left: rect.left + (rect.width / 2) - (tooltipWidth / 2),
        fits: rect.top - padding - tooltipHeight > 0,
      },
      right: {
        top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
        left: rect.right + padding,
        fits: rect.right + padding + tooltipWidth < viewportWidth,
      },
      left: {
        top: rect.top + (rect.height / 2) - (tooltipHeight / 2),
        left: rect.left - padding - tooltipWidth,
        fits: rect.left - padding - tooltipWidth > 0,
      },
    }

    // Find best fitting position
    if (!positions[side].fits) {
      const alternatives: Array<"bottom" | "top" | "right" | "left"> = ["bottom", "top", "right", "left"]
      for (const alt of alternatives) {
        if (positions[alt].fits) {
          side = alt
          break
        }
      }
    }

    top = positions[side].top
    left = positions[side].left

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, viewportWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, viewportHeight - tooltipHeight - padding))

    setTooltipPosition({ top, left })
    setTooltipSide(side)
    setIsVisible(true)

    // Highlight target element
    targetElement.classList.add("tour-highlight")
    targetElement.setAttribute("data-tour-active", "true")

    return () => {
      targetElement.classList.remove("tour-highlight")
      targetElement.removeAttribute("data-tour-active")
    }
  }, [currentStep])

  useEffect(() => {
    setIsVisible(false)
    const cleanup = positionTooltip()
    
    // Add resize listener
    window.addEventListener("resize", positionTooltip)
    window.addEventListener("scroll", positionTooltip, true)

    return () => {
      window.removeEventListener("resize", positionTooltip)
      window.removeEventListener("scroll", positionTooltip, true)
      if (cleanup) cleanup()
      
      // Clean up all tour highlights
      document.querySelectorAll(".tour-highlight").forEach(el => {
        el.classList.remove("tour-highlight")
        el.removeAttribute("data-tour-active")
      })
    }
  }, [currentStepIndex, positionTooltip])

  const goNext = () => {
    if (isLastStep) {
      onComplete()
    } else {
      setCurrentStepIndex(i => i + 1)
    }
  }

  const goPrev = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(i => i - 1)
    }
  }

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "ArrowRight" || e.key === "Enter") {
      goNext()
    } else if (e.key === "ArrowLeft") {
      goPrev()
    } else if (e.key === "Escape") {
      onDismiss()
    }
  }, [isLastStep, isFirstStep])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  if (!mounted || !currentStep) return null

  const TypeIcon = currentStep.type === "add" ? Plus : currentStep.type === "modify" ? Pencil : Trash2
  const typeColors = {
    add: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    modify: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    remove: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  }

  return createPortal(
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[9998]"
        onClick={onDismiss}
      />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={cn(
          "fixed z-[9999] w-80 bg-popover border rounded-lg shadow-lg",
          "transition-all duration-200",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Change {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-muted">
          <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className={cn("p-2 rounded-md", typeColors[currentStep.type])}>
              <TypeIcon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{currentStep.title}</h4>
              <Badge variant="secondary" className="mt-1 text-xs">
                {currentStep.targetType}
              </Badge>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {currentStep.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-3 border-t bg-muted/50">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={goPrev}
            disabled={isFirstStep}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          
          <Button size="sm" onClick={goNext}>
            {isLastStep ? (
              <>
                <Check className="h-4 w-4 mr-1" />
                Finish Tour
              </>
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Styles for highlighted elements */}
      <style jsx global>{`
        .tour-highlight {
          position: relative;
          z-index: 9997 !important;
          box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 0 0 8px hsl(var(--primary) / 0.1);
          border-radius: 8px;
          animation: tour-pulse 2s ease-in-out infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px hsl(var(--primary) / 0.3), 0 0 0 8px hsl(var(--primary) / 0.1);
          }
          50% {
            box-shadow: 0 0 0 6px hsl(var(--primary) / 0.4), 0 0 0 12px hsl(var(--primary) / 0.15);
          }
        }
      `}</style>
    </>,
    document.body
  )
}

// Helper to create tour steps from applied changes
export function createTourSteps(appliedChangeIds: string[], changes: Array<{
  id: string
  type: "add" | "modify" | "remove"
  targetType: "stage" | "step" | "touchpoint" | "painPoint" | "highlight"
  targetId?: string
  data: { name?: string; description?: string; channel?: string }
  location: { stageName?: string; stepName?: string; touchpointChannel?: string; stageId?: string; stepId?: string }
  reasoning: string
}>): TourStep[] {
  return appliedChangeIds
    .map(id => changes.find(c => c.id === id))
    .filter(Boolean)
    .map((change, index) => {
      // Determine target element ID
      let targetId = change!.targetId || change!.location.stepId || change!.location.stageId || ""
      
      // Create descriptive title
      const titles: Record<string, Record<string, string>> = {
        add: {
          stage: `New Stage Added: ${change!.data.name}`,
          step: `New Step Added: ${change!.data.name}`,
          touchpoint: `New Touchpoint: ${change!.data.channel}`,
          painPoint: "New Pain Point Added",
          highlight: "New Highlight Added",
        },
        modify: {
          stage: `Stage Updated: ${change!.data.name}`,
          step: `Step Updated: ${change!.data.name}`,
          touchpoint: `Touchpoint Updated: ${change!.data.channel}`,
          painPoint: "Pain Point Updated",
          highlight: "Highlight Updated",
        },
        remove: {
          stage: "Stage Removed",
          step: "Step Removed",
          touchpoint: "Touchpoint Removed",
          painPoint: "Pain Point Removed",
          highlight: "Highlight Removed",
        },
      }

      return {
        id: change!.id,
        targetId,
        type: change!.type,
        targetType: change!.targetType,
        title: titles[change!.type][change!.targetType],
        description: change!.reasoning,
        position: index % 2 === 0 ? "bottom" : "right",
      } as TourStep
    })
}
