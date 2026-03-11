"use client"

import { ZoomIn, ZoomOut, Maximize2, Plus, Filter, Pencil, Eye, LayoutGrid, MessageSquare, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type CanvasViewMode = "default" | "swimlane" | "timeline" | "moments" | "solutions"

interface CanvasToolbarProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
  onZoomReset: () => void
  filterChannel: string
  onFilterChannel: (channel: string) => void
  channels: string[]
  editMode: boolean
  onToggleEditMode: () => void
  viewMode: CanvasViewMode
  onViewModeChange: (mode: CanvasViewMode) => void
  onAddStage: () => void
  commentsOpen?: boolean
  onToggleComments?: () => void
  unresolvedCommentCount?: number
  onExport?: () => void
}

export function CanvasToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  filterChannel,
  onFilterChannel,
  channels,
  editMode,
  onToggleEditMode,
  viewMode,
  onViewModeChange,
  onAddStage,
  commentsOpen,
  onToggleComments,
  unresolvedCommentCount = 0,
  onExport,
}: CanvasToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b border-border bg-background px-4 py-2">
      <div className="flex items-center gap-2">
        {/* 1. Touchpoint filter - always first */}
        <Select value={filterChannel} onValueChange={onFilterChannel}>
          <SelectTrigger className="h-7 w-44 text-xs">
            <Filter className="mr-1.5 h-3 w-3 shrink-0" />
            <SelectValue placeholder="Touchpoint Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Touchpoints</SelectItem>
            {channels.map((ch) => (
              <SelectItem key={ch} value={ch}>
                {ch}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="h-4 w-px bg-border" />

        {/* 2. View mode switcher tabs */}
        <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
          {(["default", "swimlane", "timeline", "moments", "solutions"] as const).map((mode) => (
            <TooltipProvider key={mode}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onViewModeChange(mode)}
                    className={cn(
                      "rounded px-2 py-1 text-[10px] font-medium transition-colors capitalize",
                      viewMode === mode
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent",
                      mode === "moments" && viewMode !== mode && "text-amber-600 dark:text-amber-400",
                      mode === "solutions" && viewMode !== mode && "text-blue-600 dark:text-blue-400"
                    )}
                  >
                    {mode === "default" ? "Master" : mode === "swimlane" ? "Swimlane" : mode === "timeline" ? "Timeline" : mode === "moments" ? "Moments" : "Solutions"}
                  </button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {mode === "default" && "Master view - Vertical columns per stage (editable)"}
                  {mode === "swimlane" && "Horizontal rows by channel"}
                  {mode === "timeline" && "Compact timeline strip"}
                  {mode === "moments" && "Moments of Truth -- the critical touch points that define the experience"}
                  {mode === "solutions" && "Solutions lane -- see applied solutions mapped to journey stages"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        {/* 3. Edit mode toggle - only shown on Master view, matching tabs height */}
        {viewMode === "default" && (
          <>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-0.5 rounded-md border border-border p-0.5">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={onToggleEditMode}
                      className={cn(
                        "rounded px-2 py-1 text-[10px] font-medium transition-colors flex items-center gap-1",
                        editMode
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {editMode ? <Pencil className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                      {editMode ? "Editing" : "View Only"}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {editMode ? "Switch to view mode" : "Switch to edit mode to reorder stages and steps"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </>
        )}


      </div>

      <div className="flex items-center gap-1">
        {/* Export button */}
        {onExport && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1.5 text-xs"
                    onClick={onExport}
                  >
                    <Download className="h-3 w-3" />
                    Export
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  Export journey as CSV, PDF, PNG, or SVG
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="h-4 w-px bg-border mx-1" />
          </>
        )}

        {/* Comments toggle */}
        {onToggleComments && (
          <>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={commentsOpen ? "default" : "ghost"}
                    size="sm"
                    className={cn("h-7 gap-1.5 text-xs relative", commentsOpen && "bg-primary text-primary-foreground")}
                    onClick={onToggleComments}
                  >
                    <MessageSquare className="h-3 w-3" />
                    Comments
                    {unresolvedCommentCount > 0 && (
                      <span className={cn(
                        "flex items-center justify-center h-4 min-w-4 rounded-full text-[9px] font-bold px-1",
                        commentsOpen
                          ? "bg-primary-foreground text-primary"
                          : "bg-primary text-primary-foreground"
                      )}>
                        {unresolvedCommentCount}
                      </span>
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {commentsOpen ? "Hide comment sidebar" : "Show comments on this journey"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="h-4 w-px bg-border mx-1" />
          </>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomOut} disabled={zoom <= 50}>
          <ZoomOut className="h-3.5 w-3.5" />
          <span className="sr-only">Zoom out</span>
        </Button>
        <button
          onClick={onZoomReset}
          className="min-w-10 rounded px-1.5 py-0.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          {zoom}%
        </button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomIn} disabled={zoom >= 150}>
          <ZoomIn className="h-3.5 w-3.5" />
          <span className="sr-only">Zoom in</span>
        </Button>
        <div className="h-4 w-px bg-border mx-1" />
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onZoomReset}>
          <Maximize2 className="h-3.5 w-3.5" />
          <span className="sr-only">Fit to view</span>
        </Button>
      </div>
    </div>
  )
}
