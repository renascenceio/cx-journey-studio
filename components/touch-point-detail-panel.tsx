"use client"

import { useTranslations } from "next-intl"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { TouchPoint } from "@/lib/types"
import {
  AlertTriangle,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Video,
  BarChart3,
  FileSpreadsheet,
  MessageSquare,
  Radio,
  Paperclip,
  Lightbulb,
  Loader2,
  Zap,
  Palette,
  Cpu,
  RefreshCw,
  Mail,
  User,
  Trash2,
  Plus,
  Bot,
  ExternalLink,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useJourneyComments } from "@/hooks/use-journey"
import { CommentThread } from "@/components/comment-thread"
import { CommentComposer } from "@/components/comment-composer"
import type { Comment } from "@/lib/types"
import { useState, useMemo, useEffect, useRef } from "react"
import { toast } from "sonner"
import { addComment, addEvidence, deleteTouchPoint, addPainPoint, addHighlight, deletePainPoint, deleteHighlight, updatePainPoint, updateHighlight, getTouchPointWithChildren, restoreTouchPoint } from "@/lib/actions/data"
import { getEffectivePainPoints, getEffectiveHighlights, calculateTouchPointScore } from "@/lib/data-utils"
import useSWR, { mutate } from "swr"
import { showUndoToast } from "@/components/undo-toast"

function scoreColor(score: number) {
  if (score <= -3) return "text-red-600 dark:text-red-400"
  if (score <= -1) return "text-orange-500 dark:text-orange-400"
  if (score <= 1) return "text-yellow-500 dark:text-yellow-400"
  if (score <= 3) return "text-emerald-500 dark:text-emerald-400"
  return "text-green-600 dark:text-green-400"
}

function scoreBgGradient(score: number) {
  // Map -5 to +5 to a percentage for the track fill
  const pct = ((score + 5) / 10) * 100
  return pct
}

function severityColor(severity: string) {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
    case "high":
      return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
    case "medium":
      return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function impactColor(impact: string) {
  switch (impact) {
    case "high":
      return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
    case "medium":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
    default:
      return "bg-muted text-muted-foreground"
  }
}

function evidenceIcon(type: string) {
  switch (type) {
    case "screenshot":
      return ImageIcon
    case "recording":
      return Video
    case "analytics":
      return BarChart3
    case "survey":
      return FileSpreadsheet
    case "document":
      return FileText
    default:
      return Paperclip
  }
}

interface TouchPointDetailPanelProps {
  touchPoint: TouchPoint | null
  open: boolean
  onClose: () => void
  onDelete?: () => void
  stageName?: string
  stepName?: string
  stageId?: string
  stepId?: string
  journeyId?: string
  onOpenComments?: (touchpointId: string) => void
}

export function TouchPointDetailPanel({
  touchPoint,
  open,
  onClose,
  onDelete,
  stageName,
  stepName,
  stageId,
  stepId,
  journeyId,
  onOpenComments,
}: TouchPointDetailPanelProps) {
  const t = useTranslations()
  const [localComments, setLocalComments] = useState<Comment[]>([])
  const [uploading, setUploading] = useState(false)
  const evidenceFileRef = useRef<HTMLInputElement>(null)
  const [solutions, setSolutions] = useState<{
    solutions: { title: string; description: string; impact: string; effort: string; category: string }[]
    summary: string
  } | null>(null)
  const [solutionsLoading, setSolutionsLoading] = useState(false)
  const [solutionsError, setSolutionsError] = useState<string | null>(null)

  // Solution library + applied solutions for this touchpoint
  const swrFetcher = (url: string) => fetch(url).then((r) => r.json())
  const { data: solutionLibrary = [] } = useSWR<{ id: string; title: string; description: string; category: string }[]>("/api/solutions?saved=true", swrFetcher)
  const { data: tpApplied = [], mutate: mutateTpApplied } = useSWR<{ id: string; solution_id: string; touchpoint_id: string | null; solutions: { title: string; category: string } }[]>(
    journeyId ? `/api/journeys/${journeyId}/apply-solution` : null,
    swrFetcher
  )
  
  // Fetch collaborators for @mentions
  const { data: collabData } = useSWR<{
    collaborators: Array<{ profile?: { id: string; name: string; email: string; role: string } }>
    availableMembers: Array<{ id: string; name: string; email: string; role: string }>
  }>(journeyId ? `/api/journeys/${journeyId}/collaborators` : null, swrFetcher)
  
  // Combine collaborators and available members for mention suggestions
  const teamMembers = useMemo(() => {
    const members: Array<{ id: string; name: string; email?: string; role?: string }> = []
    
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
  const [applyingTpSolution, setApplyingTpSolution] = useState(false)
  const [tpSolSearch, setTpSolSearch] = useState("")
  
  // Add pain point / highlight dialogs
  const [addPainOpen, setAddPainOpen] = useState(false)
  const [addHighlightOpen, setAddHighlightOpen] = useState(false)
  const [newPainDesc, setNewPainDesc] = useState("")
  const [newPainSeverity, setNewPainSeverity] = useState<string>("medium")
  const [newHighlightDesc, setNewHighlightDesc] = useState("")
  const [newHighlightImpact, setNewHighlightImpact] = useState<string>("medium")
  const [newPainScore, setNewPainScore] = useState<number[]>([-3])
  const [newHighlightScore, setNewHighlightScore] = useState<number[]>([3])
  const [addingPain, setAddingPain] = useState(false)
  const [addingHighlight, setAddingHighlight] = useState(false)

  const touchpointApplied = useMemo(() => {
    if (!touchPoint?.id) return []
    return tpApplied.filter((a) => a.touchpoint_id === touchPoint.id)
  }, [tpApplied, touchPoint?.id])

  async function handleApplyToTouchpoint(solutionId: string) {
    if (!journeyId || !touchPoint) return
    setApplyingTpSolution(true)
    try {
      // Find stage/step for this touchpoint by looking at journey data
      const res = await fetch(`/api/journeys/${journeyId}/apply-solution`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ solutionId, stageId: stageId || touchPoint.id, stepId, touchpointId: touchPoint.id }),
      })
      if (res.ok) { mutateTpApplied(); toast.success("Solution applied to touchpoint") }
      else toast.error("Failed to apply solution")
    } catch { toast.error("Failed to apply solution") }
    finally { setApplyingTpSolution(false) }
  }

  // Reset solutions when touchpoint changes
  useEffect(() => {
    setSolutions(null)
    setSolutionsError(null)
    setSolutionsLoading(false)
  }, [touchPoint?.id])

  async function generateSolutions() {
    if (!touchPoint) return
    setSolutionsLoading(true)
    setSolutionsError(null)
    try {
      const res = await fetch("/api/generate-solutions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          touchPoint: {
            description: touchPoint.description,
            channel: touchPoint.channel,
            emotionalScore: touchPoint.emotionalScore,
            painPoints: touchPoint.painPoints,
            highlights: touchPoint.highlights,
          },
          stageName,
          stepName,
          journeyTitle: journeyId,
        }),
      })
      if (!res.ok) throw new Error("Failed to generate solutions")
      const data = await res.json()
      setSolutions(data.solutions)
    } catch {
      setSolutionsError("Could not generate solutions. Please try again.")
    } finally {
      setSolutionsLoading(false)
    }
  }

  async function handleEvidenceUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !touchPoint || !journeyId) return
    if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("purpose", "evidence")
      const uploadRes = await fetch("/api/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) throw new Error("Upload failed")
      const { url } = await uploadRes.json()
      const ext = file.name.split(".").pop()?.toLowerCase() || ""
      let evidenceType: "screenshot" | "recording" | "survey" | "analytics" | "document" = "document"
      if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) evidenceType = "screenshot"
      else if (["mp4", "mov", "webm", "avi"].includes(ext)) evidenceType = "recording"
      else if (["csv", "xlsx", "xls"].includes(ext)) evidenceType = "analytics"
      await addEvidence(touchPoint.id, journeyId, { type: evidenceType, url, label: file.name })
      mutate((key: unknown) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(`Evidence "${file.name}" attached`)
    } catch {
      toast.error("Failed to upload evidence")
    } finally {
      setUploading(false)
      if (evidenceFileRef.current) evidenceFileRef.current.value = ""
    }
  }

  const { comments: fetchedComments } = useJourneyComments(journeyId || undefined)

  const relevantComments = useMemo(() => {
    if (!journeyId) return []
    // Only show comments scoped to this touchpoint (or unscoped local ones)
    const allComments = [...fetchedComments, ...localComments]
    if (!touchPoint?.id) return allComments
    return allComments.filter(
      (c) => c.touchpointId === touchPoint.id || (!c.touchpointId && localComments.includes(c))
    )
  }, [journeyId, fetchedComments, localComments, touchPoint?.id])

  const rootComments = useMemo(() => {
    return relevantComments.filter((c) => !c.parentId).slice(0, 10)
  }, [relevantComments])

  if (!touchPoint) return null

  function getReplies(parentId: string): Comment[] {
    return relevantComments
      .filter((c) => c.parentId === parentId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  }

  async function handleNewComment(content: string, mentions: string[]) {
    if (!journeyId) return
    try {
      await addComment({ journeyId, content, mentions, touchpointId: touchPoint?.id })
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(t("comments.commentAdded"))
    } catch {
      const newComment: Comment = {
        id: `cmt-tp-${Date.now()}`, journeyId: journeyId || "", content,
        authorId: "user-1", mentions, resolved: false, createdAt: new Date().toISOString(),
      }
      setLocalComments((prev) => [...prev, newComment])
    }
  }

  async function handleReply(parentId: string, content: string) {
    if (!journeyId) return
    try {
      await addComment({ journeyId, content, parentId, touchpointId: touchPoint?.id })
      mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
      toast.success(t("comments.replyAdded"))
    } catch {
      const newReply: Comment = {
        id: `cmt-tp-reply-${Date.now()}`, journeyId: journeyId || "", content,
        authorId: "user-1", mentions: [], resolved: false, createdAt: new Date().toISOString(), parentId,
      }
      setLocalComments((prev) => [...prev, newReply])
    }
  }

  const effectivePainPoints = getEffectivePainPoints(touchPoint)
  const effectiveHighlights = getEffectiveHighlights(touchPoint)
  
  // Calculate the dynamic score from pain points and highlights
  const calculatedScore = calculateTouchPointScore(touchPoint)
  const fillPct = scoreBgGradient(calculatedScore)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        {/* Header */}
        <div className="border-b border-border bg-accent/30 px-6 pt-6 pb-4">
          <SheetHeader className="space-y-2">
            {(stageName || stepName) && (
              <SheetDescription className="flex items-center gap-1.5 text-[11px]">
                {stageName && <span>{stageName}</span>}
                {stageName && stepName && <span className="text-border">/</span>}
                {stepName && <span>{stepName}</span>}
              </SheetDescription>
            )}
            {/* Touchpoint Name - prominent */}
            <SheetTitle className="text-lg font-bold leading-snug">{touchPoint.channel}</SheetTitle>
            {/* Intent/Description - secondary */}
            <p className="text-sm text-muted-foreground leading-relaxed">{touchPoint.description}</p>
            {/* Sentiment Classification Badge */}
            <div className="flex items-center gap-2 pt-1">
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-[10px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                  onClick={async () => {
                    if (!journeyId) return
                    try {
                      // Get full touchpoint data before deleting for undo
                      const tpData = await getTouchPointWithChildren(touchPoint.id)
                      if (!tpData) return
                      
                      await deleteTouchPoint(touchPoint.id, journeyId)
                      onDelete()
                      onClose()
                      
                      // Show undo toast
                      showUndoToast({
                        message: "Touchpoint deleted",
                        description: `"${touchPoint.channel}" has been removed.`,
                        duration: 10000,
                        onUndo: async () => {
                          await restoreTouchPoint(tpData, journeyId)
                          mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                        },
                      })
                    } catch {
                      toast.error("Failed to delete touchpoint")
                    }
                  }}
                >
                  <Trash2 className="h-3 w-3" />
                  Delete
                </Button>
              )}
{calculatedScore < 0 ? (
  <Badge variant="outline" className="text-[10px] font-medium bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
  <AlertTriangle className="h-3 w-3 mr-1" />
  Pain Point
  </Badge>
) : calculatedScore === 0 ? (
                <Badge variant="outline" className="text-[10px] font-medium bg-muted text-muted-foreground">
                  Neutral
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] font-medium bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Highlight
                </Badge>
              )}
            </div>
          </SheetHeader>

          {/* Channel + Score bar */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-muted-foreground" />
              <Badge variant="secondary" className="text-xs font-normal">
                {touchPoint.channel}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground">{t("touchpoint.emotionalScore")}</span>
<span className={cn("text-lg font-bold font-mono tabular-nums", scoreColor(calculatedScore))}>
{calculatedScore > 0 ? "+" : ""}
{calculatedScore}
  </span>
            </div>
          </div>

          {/* Score track */}
          <div className="mt-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-medium text-red-500">-5</span>
              <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${fillPct}%`,
                    background: `linear-gradient(to right, oklch(0.55 0.22 27), oklch(0.70 0.15 80), oklch(0.55 0.19 155))`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full border-2 border-background bg-foreground shadow-sm"
                  style={{ left: `calc(${fillPct}% - 7px)` }}
                />
              </div>
              <span className="text-[10px] font-medium text-green-500">+5</span>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col gap-5">
            {/* Pain Points */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                <h4 className="text-xs font-semibold text-foreground">
                  {t("touchpoint.painPoints")}
                </h4>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {effectivePainPoints.length}
                </Badge>
                <Dialog open={addPainOpen} onOpenChange={setAddPainOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[10px] gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Plus className="h-3 w-3" />
                      {t("common.add")}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>{t("touchpoint.addPainPoint")}</DialogTitle>
                      <DialogDescription>{t("touchpoint.addPainPointDesc")}</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                      <div className="flex flex-col gap-2">
                        <Label>{t("touchpoint.description")}</Label>
                        <Textarea
                          placeholder={t("touchpoint.painPointPlaceholder")}
                          value={newPainDesc}
                          onChange={(e) => setNewPainDesc(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>{t("touchpoint.severity")}</Label>
                        <Select value={newPainSeverity} onValueChange={setNewPainSeverity}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label>Experience Score</Label>
                          <span className="text-sm font-bold font-mono text-red-600 dark:text-red-400">
                            {newPainScore[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-red-500 font-medium">-5</span>
                          <Slider
                            value={newPainScore}
                            onValueChange={setNewPainScore}
                            min={-5}
                            max={0}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-muted-foreground font-medium">0</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddPainOpen(false)}>Cancel</Button>
                      <Button
                        disabled={!newPainDesc.trim() || addingPain}
                        onClick={async () => {
                          if (!journeyId || !touchPoint) return
                          setAddingPain(true)
                          try {
                            await addPainPoint(touchPoint.id, journeyId, newPainDesc.trim(), newPainSeverity, newPainScore[0])
                            mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                            toast.success("Pain point added")
                            setAddPainOpen(false)
                            setNewPainDesc("")
                            setNewPainSeverity("medium")
                            setNewPainScore([-3])
                          } catch {
                            toast.error("Failed to add pain point")
                          } finally {
                            setAddingPain(false)
                          }
                        }}
                      >
                        {addingPain ? "Adding..." : "Add Pain Point"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {effectivePainPoints.length === 0 ? (
                <p className="text-xs text-muted-foreground">No pain points identified</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {effectivePainPoints.map((pp) => {
                    // Filter comments that mention this pain point ID or contain its description text
                    const ppComments = relevantComments.filter(
                      (c) => c.content.toLowerCase().includes(pp.description.toLowerCase().slice(0, 20))
                    )
                    return (
                      <div
                        key={pp.id}
                        className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-3 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={cn(
                                "mt-0.5 shrink-0 text-[9px] font-semibold capitalize",
                                severityColor(pp.severity)
                              )}
                            >
                              {pp.severity}
                            </Badge>
                            {pp.isAiGenerated ? (
                              <Bot className="h-3 w-3 text-muted-foreground/60" />
                            ) : (
                              <User className="h-3 w-3 text-muted-foreground/60" />
                            )}
                          </div>
                          <p className="text-xs leading-relaxed text-foreground flex-1">
                            {pp.description}
                          </p>
                          <button
                            onClick={async () => {
                              if (!journeyId) return
                              try {
                                await deletePainPoint(pp.id, journeyId)
                                mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                                toast.success("Pain point deleted")
                              } catch {
                                toast.error("Failed to delete pain point")
                              }
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        {ppComments.length > 0 && (
                          <div className="ml-6 mt-1 flex flex-col gap-1 border-l-2 border-red-200 dark:border-red-800/50 pl-2.5">
                            <span className="text-[9px] font-medium text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="h-2.5 w-2.5" />
                              {ppComments.length} comment{ppComments.length !== 1 ? "s" : ""}
                            </span>
                            {ppComments.slice(0, 2).map((c) => (
                              <p key={c.id} className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                                <span className="font-medium text-foreground">{c.authorName || "User"}:</span> {c.content}
                              </p>
                            ))}
                            {ppComments.length > 2 && (
                              <span className="text-[9px] text-primary cursor-pointer hover:underline">
                                +{ppComments.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                        {pp.emotionalScore !== undefined && (
                          <div className="flex justify-end mt-2">
                            <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400">Score: {pp.emotionalScore}</span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* Highlights */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Sparkles className="h-3.5 w-3.5 text-emerald-500" />
                <h4 className="text-xs font-semibold text-foreground">
                  Highlights
                </h4>
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                  {effectiveHighlights.length}
                </Badge>
                <Dialog open={addHighlightOpen} onOpenChange={setAddHighlightOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-[10px] gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
                      <Plus className="h-3 w-3" />
                      Add
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Add Highlight</DialogTitle>
                      <DialogDescription>Describe a positive moment or delight the customer experiences at this touchpoint.</DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-2">
                      <div className="flex flex-col gap-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="What delights the customer at this moment?"
                          value={newHighlightDesc}
                          onChange={(e) => setNewHighlightDesc(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Impact</Label>
                        <Select value={newHighlightImpact} onValueChange={setNewHighlightImpact}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <Label>Experience Score</Label>
                          <span className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            +{newHighlightScore[0]}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-muted-foreground font-medium">0</span>
                          <Slider
                            value={newHighlightScore}
                            onValueChange={setNewHighlightScore}
                            min={0}
                            max={5}
                            step={1}
                            className="flex-1"
                          />
                          <span className="text-xs text-emerald-500 font-medium">+5</span>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setAddHighlightOpen(false)}>Cancel</Button>
                      <Button
                        disabled={!newHighlightDesc.trim() || addingHighlight}
                        onClick={async () => {
                          if (!journeyId || !touchPoint) return
                          setAddingHighlight(true)
                          try {
                            await addHighlight(touchPoint.id, journeyId, newHighlightDesc.trim(), newHighlightImpact, newHighlightScore[0])
                            mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                            toast.success("Highlight added")
                            setAddHighlightOpen(false)
                            setNewHighlightDesc("")
                            setNewHighlightImpact("medium")
                            setNewHighlightScore([3])
                          } catch {
                            toast.error("Failed to add highlight")
                          } finally {
                            setAddingHighlight(false)
                          }
                        }}
                      >
                        {addingHighlight ? "Adding..." : "Add Highlight"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              {effectiveHighlights.length === 0 ? (
                <p className="text-xs text-muted-foreground">No highlights identified</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {effectiveHighlights.map((hl) => (
                    <div
                      key={hl.id}
                      className="flex flex-col gap-1.5 rounded-lg border border-border/60 bg-card p-3 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center gap-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "mt-0.5 shrink-0 text-[9px] font-semibold capitalize",
                              impactColor(hl.impact)
                            )}
                          >
                            {hl.impact}
                          </Badge>
                            {hl.isAiGenerated ? (
                              <Bot className="h-3 w-3 text-muted-foreground/60" />
                            ) : (
                              <User className="h-3 w-3 text-muted-foreground/60" />
                            )}
                        </div>
                        <p className="text-xs leading-relaxed text-foreground flex-1">
                          {hl.description}
                        </p>
                        <button
                          onClick={async () => {
                            if (!journeyId) return
                            try {
                              await deleteHighlight(hl.id, journeyId)
                              mutate((key: string) => typeof key === "string" && key.includes("/api/journeys"))
                              toast.success("Highlight deleted")
                            } catch {
                              toast.error("Failed to delete highlight")
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                      {hl.emotionalScore !== undefined && (
                        <div className="flex justify-end mt-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">Score: +{hl.emotionalScore}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            <Separator />

            {/* Evidence */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">
                  Evidence
                </h4>
                <Badge variant="secondary" className="ml-auto h-4 px-1.5 text-[10px]">
                  {touchPoint.evidence.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-primary"
                  disabled={uploading}
                  onClick={() => evidenceFileRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "+ Add"}
                </Button>
              </div>
              <input
                ref={evidenceFileRef}
                type="file"
                className="hidden"
                accept="image/*,video/*,.pdf,.doc,.docx,.csv,.xlsx,.xls"
                onChange={handleEvidenceUpload}
              />
              <p className="text-[10px] text-muted-foreground/50 -mt-1 mb-1">Accepted: images, video, PDF, CSV, Excel. Max 10 MB.</p>
              {touchPoint.evidence.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6">
                <p className="text-xs text-muted-foreground">No evidence attached</p>
                <button
                  className="mt-1 text-xs text-primary hover:underline disabled:opacity-50"
                  disabled={uploading}
                  onClick={() => evidenceFileRef.current?.click()}
                >
                  {uploading ? "Uploading..." : "Attach evidence"}
                </button>
                <p className="mt-1 text-[10px] text-muted-foreground/60">Max file size: 10 MB</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {touchPoint.evidence.map((ev) => {
                    const Icon = evidenceIcon(ev.type)
                    return (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2.5 rounded-md border border-border/60 bg-card px-3 py-2.5 transition-colors hover:bg-accent/50"
                      >
                        <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="flex-1 truncate text-xs text-foreground">
                          {ev.label}
                        </span>
                        <Badge variant="outline" className="shrink-0 text-[9px] capitalize">
                          {ev.type}
                        </Badge>
                      </a>
                    )
                  })}
                </div>
              )}
            </section>

            <Separator />

            {/* Comments -- Threaded */}
            <section>
              <div className="flex items-center gap-1.5 mb-3">
                <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />
                <h4 className="text-xs font-semibold text-foreground">
                  Discussion
                </h4>
                {rootComments.length > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                    {rootComments.length}
                  </Badge>
                )}
                {onOpenComments && touchPoint && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground gap-1"
                    onClick={() => onOpenComments(touchPoint.id)}
                  >
                    <ExternalLink className="h-2.5 w-2.5" />
                    Open in sidebar
                  </Button>
                )}
              </div>
              {rootComments.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-6 mb-3">
                  <p className="text-xs text-muted-foreground">No comments yet</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-0.5">Start a discussion below</p>
                </div>
              ) : (
                <div className="divide-y divide-border/40 mb-3">
                  {rootComments.map((comment) => (
                    <CommentThread
                      key={comment.id}
                      comment={comment}
                      replies={getReplies(comment.id)}
                      onReply={handleReply}
                      onResolve={() => toast.success("Comment resolved")}
                      onReact={() => {}}
                    />
                  ))}
                </div>
              )}
<CommentComposer
  onSubmit={handleNewComment}
  placeholder="Add a comment..."
  compact
  teamMembers={teamMembers}
/>
            </section>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
