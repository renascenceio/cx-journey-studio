"use client"

import { useState, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import {
  Target, Clock, CheckCircle2, PauseCircle, AlertCircle,
  Lightbulb, Map as MapIcon, MoreHorizontal, Pencil, Trash2, GripVertical,
  MessageSquare, TrendingUp, Zap, Calendar, User,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface Initiative {
  id: string
  title: string
  description: string
  priority: number
  status: "planned" | "in_progress" | "completed" | "on_hold" | "pending_approval"
  journey_id: string | null
  solution_id: string | null
  journeys: { id: string; title: string } | null
  solutions: { id: string; title: string } | null
  responsible: string
  accountable: string
  start_date: string | null
  end_date: string | null
  impact_score?: number
  effort_score?: number
  comments_count?: number
}

interface KanbanBoardProps {
  initiatives: Initiative[]
  onStatusChange: (id: string, newStatus: string) => Promise<void>
  onEdit: (initiative: Initiative) => void
  onDelete: (id: string) => void
  canEdit: boolean
}

const statusConfig: Record<string, { label: string; color: string; bgColor: string; icon: typeof Target }> = {
  planned: { label: "Planned", color: "text-muted-foreground", bgColor: "bg-muted/30", icon: Target },
  in_progress: { label: "In Progress", color: "text-primary", bgColor: "bg-primary/5", icon: Clock },
  pending_approval: { label: "Pending Approval", color: "text-violet-600 dark:text-violet-400", bgColor: "bg-violet-50 dark:bg-violet-900/10", icon: AlertCircle },
  completed: { label: "Completed", color: "text-emerald-600 dark:text-emerald-400", bgColor: "bg-emerald-50 dark:bg-emerald-900/10", icon: CheckCircle2 },
  on_hold: { label: "On Hold", color: "text-amber-600 dark:text-amber-400", bgColor: "bg-amber-50 dark:bg-amber-900/10", icon: PauseCircle },
}

const STATUSES = ["planned", "in_progress", "pending_approval", "completed", "on_hold"] as const

export function KanbanBoard({ initiatives, onStatusChange, onEdit, onDelete, canEdit }: KanbanBoardProps) {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)

  const handleDragStart = useCallback((e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("text/plain", id)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, status: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(status)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null)
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("text/plain")
    setDraggedId(null)
    setDragOverColumn(null)
    
    const initiative = initiatives.find(i => i.id === id)
    if (initiative && initiative.status !== newStatus && canEdit) {
      await onStatusChange(id, newStatus)
    }
  }, [initiatives, onStatusChange, canEdit])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverColumn(null)
  }, [])

  // Group initiatives by status
  const byStatus = STATUSES.reduce((acc, status) => {
    acc[status] = initiatives.filter(i => i.status === status)
    return acc
  }, {} as Record<string, Initiative[]>)

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {STATUSES.map((status) => {
        const config = statusConfig[status]
        const StatusIcon = config.icon
        const items = byStatus[status] || []
        const isDropTarget = dragOverColumn === status

        return (
          <div
            key={status}
            className={cn(
              "flex-shrink-0 w-72 rounded-lg border border-border/60 transition-all",
              config.bgColor,
              isDropTarget && "ring-2 ring-primary ring-offset-2"
            )}
            onDragOver={(e) => handleDragOver(e, status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, status)}
          >
            {/* Column Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
              <StatusIcon className={cn("h-4 w-4", config.color)} />
              <span className={cn("text-sm font-medium", config.color)}>
                {config.label}
              </span>
              <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-[10px]">
                {items.length}
              </Badge>
            </div>

            {/* Column Content */}
            <div className="p-2 space-y-2 min-h-[200px]">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-xs text-muted-foreground">
                    Drag items here
                  </p>
                </div>
              ) : (
                items.map((initiative) => (
                  <Card
                    key={initiative.id}
                    draggable={canEdit}
                    onDragStart={(e) => handleDragStart(e, initiative.id)}
                    onDragEnd={handleDragEnd}
                    className={cn(
                      "cursor-grab active:cursor-grabbing border-border/60 transition-all hover:border-border hover:shadow-sm",
                      draggedId === initiative.id && "opacity-50 ring-2 ring-primary"
                    )}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        {canEdit && (
                          <GripVertical className="h-4 w-4 text-muted-foreground/50 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground line-clamp-2">
                                {initiative.title}
                              </p>
                              {initiative.description && (
                                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-1">
                                  {initiative.description}
                                </p>
                              )}
                              {initiative.journeys && (
                                <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-1.5">
                                  <MapIcon className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{initiative.journeys.title}</span>
                                </p>
                              )}
                              {initiative.solutions && (
                                <p className="text-[10px] text-primary/70 flex items-center gap-1 mt-0.5">
                                  <Lightbulb className="h-3 w-3 shrink-0" />
                                  <span className="truncate">{initiative.solutions.title}</span>
                                </p>
                              )}
                            </div>
                            {canEdit && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0">
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => onEdit(initiative)}>
                                    <Pencil className="mr-2 h-3.5 w-3.5" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => onDelete(initiative.id)}
                                  >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>

                          {/* Impact/Effort scores */}
                          {(initiative.impact_score || initiative.effort_score) && (
                            <div className="flex items-center gap-3 mt-2 py-1.5 px-2 bg-muted/50 rounded">
                              {initiative.impact_score && (
                                <div className="flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3 text-emerald-500" />
                                  <span className="text-[10px] font-medium">Impact: {initiative.impact_score}/5</span>
                                </div>
                              )}
                              {initiative.effort_score && (
                                <div className="flex items-center gap-1">
                                  <Zap className="h-3 w-3 text-amber-500" />
                                  <span className="text-[10px] font-medium">Effort: {initiative.effort_score}/5</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Meta info row */}
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {/* Priority Badge */}
                            <Badge 
                              variant={initiative.priority <= 3 ? "default" : "outline"} 
                              className={cn(
                                "h-5 px-1.5 text-[9px] font-medium",
                                initiative.priority === 1 && "bg-red-500 hover:bg-red-600",
                                initiative.priority === 2 && "bg-orange-500 hover:bg-orange-600",
                                initiative.priority === 3 && "bg-yellow-500 hover:bg-yellow-600 text-yellow-950"
                              )}
                            >
                              P{initiative.priority}
                            </Badge>
                            
                            {/* Responsible */}
                            {initiative.responsible && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <User className="h-3 w-3" />
                                <span className="truncate max-w-[80px]">{initiative.responsible}</span>
                              </div>
                            )}
                            
                            {/* Date */}
                            {initiative.start_date && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(initiative.start_date).toLocaleDateString("en", { month: "short", day: "numeric" })}
                                </span>
                              </div>
                            )}
                            
                            {/* Comments indicator */}
                            {(initiative.comments_count ?? 0) > 0 && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
                                <MessageSquare className="h-3 w-3" />
                                <span>{initiative.comments_count}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}

              {/* Drop zone indicator */}
              {isDropTarget && draggedId && (
                <div className="h-16 border-2 border-dashed border-primary/50 rounded-lg flex items-center justify-center">
                  <p className="text-xs text-primary">Drop here</p>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
