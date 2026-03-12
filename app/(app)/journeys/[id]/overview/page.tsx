"use client"

import { useTranslations } from "next-intl"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MiniEmotionalArc } from "@/components/mini-emotional-arc"
import {
  getEmotionalArc,
  getAllTouchPoints,
  opportunities,
} from "@/lib/data-utils"
import { useJourney, useJourneyActivity, useJourneyComments } from "@/hooks/use-journey"
import Link from "next/link"
import {
  Layers,
  GitBranch,
  Activity,
  MessageSquare,
  AlertTriangle,
  Sparkles,
  Calendar,
  User,
  Info,
  Lightbulb,
  UserPlus,
  Mail,
  Eye,
  EyeOff,
  Plus,
  ExternalLink,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { InlineRenameTitle } from "@/components/inline-rename-title"
import { cn } from "@/lib/utils"
import { useJourneys } from "@/hooks/use-journeys"
import { renameJourney } from "@/lib/actions/data"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { getInitials } from "@/lib/utils"
import { getIndustryLabelKey } from "@/lib/industries"

export default function JourneyOverviewPage() {
  const t = useTranslations()
  const params = useParams()
  const journeyId = params.id as string
  const { journey, isLoading, mutate } = useJourney(journeyId)
  const { activity: recentActivityAll } = useJourneyActivity(journeyId)
  const { comments } = useJourneyComments(journeyId)
  const { journeys } = useJourneys()

  if (isLoading || !journey) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const stages = journey.stages || []
  const emotionalArc = getEmotionalArc(journey)
  const allTouchPoints = getAllTouchPoints(journey)
  const stepCount = stages.reduce((s, st) => s + (st.steps?.length || 0), 0)
  const painPointCount = allTouchPoints.reduce((s, tp) => s + (tp.painPoints?.length || 0), 0)
  const highlightCount = allTouchPoints.reduce((s, tp) => s + (tp.highlights?.length || 0), 0)
  const avgScore = allTouchPoints.length > 0
    ? allTouchPoints.reduce((s, tp) => s + tp.emotionalScore, 0) / allTouchPoints.length
    : 0
  const recentActivity = recentActivityAll.slice(0, 5)
  const commentCount = comments.length

  const solutionsCount = (journey.type === "future" || journey.type === "deployed") ? opportunities.length : 0

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviting, setInviting] = useState(false)

  const baseStats = [
    { label: "Stages", value: stages.length, icon: Layers, link: null },
    { label: "Steps", value: stepCount, icon: GitBranch, link: null },
    { label: "Touchpoints", value: allTouchPoints.length, icon: Activity, link: null },
    { label: "Pain Points", value: painPointCount, icon: AlertTriangle, link: null },
    { label: "Highlights", value: highlightCount, icon: Sparkles, link: null },
    { label: "Comments", value: commentCount, icon: MessageSquare, link: null },
  ]

  const stats = solutionsCount > 0
    ? [...baseStats, { label: "Solutions", value: solutionsCount, icon: Lightbulb as typeof Layers, link: `/journeys/${journey.id}/gap-analysis` }]
    : baseStats

  return (
    <div className="mx-auto max-w-7xl p-6">
      {/* Inline-renameable title */}
      <div className="mb-6 flex items-center gap-3">
        <InlineRenameTitle
          value={journey.title}
          onRename={async (newTitle) => {
            await renameJourney(journeyId, newTitle)
            mutate()
          }}
        />
        <Badge variant="outline" className="capitalize text-[10px]">{journey.type}</Badge>
        <Badge variant="secondary" className="text-[10px]">
          {journey.category ? t(getIndustryLabelKey(journey.category)) : "No Category"}
        </Badge>
        <Badge variant="outline" className="capitalize text-[10px] text-muted-foreground">{journey.status}</Badge>
        {/* JDS-042: Visibility toggle */}
        <button
          onClick={async () => {
            try {
              const { toggleJourneyVisibility } = await import("@/lib/actions/data")
              const result = await toggleJourneyVisibility(journeyId)
              mutate()
              const { toast } = await import("sonner")
              toast.success(result.isPublic ? "Journey is now public" : "Journey is now private")
            } catch { /* handled */ }
          }}
          className={cn(
            "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium transition-colors border",
            journey.is_public
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "border-border bg-muted/50 text-muted-foreground"
          )}
        >
          {journey.is_public ? <Eye className="h-2.5 w-2.5" /> : <EyeOff className="h-2.5 w-2.5" />}
          {journey.is_public ? "Public" : "Private"}
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-7">
            {stats.map((stat) => {
              const inner = (
                <CardContent className="flex flex-col items-center gap-1 p-3">
                  <stat.icon className={`h-4 w-4 ${stat.link ? "text-primary" : "text-muted-foreground"}`} />
                  <span className="text-lg font-bold text-foreground">{stat.value}</span>
                  <span className={`text-[10px] ${stat.link ? "text-primary font-medium" : "text-muted-foreground"}`}>{stat.label}</span>
                </CardContent>
              )
              return stat.link ? (
                <Link key={stat.label} href={stat.link}>
                  <Card className="border-border/60 cursor-pointer transition-all hover:border-primary/40 hover:shadow-sm">{inner}</Card>
                </Link>
              ) : (
                <Card key={stat.label} className="border-border/60">{inner}</Card>
              )
            })}
          </div>

          <Card className="border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                Emotional Arc
                <TooltipProvider><Tooltip><TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
                </TooltipTrigger><TooltipContent side="right" className="max-w-60 text-xs">
                  Average emotional score per stage on a -5 to +5 scale.
                </TooltipContent></Tooltip></TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {emotionalArc.length >= 2 ? (
                <>
                  <div className="flex items-center justify-center py-2">
                    <MiniEmotionalArc data={emotionalArc} width={600} height={100} />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground px-4">
                    {emotionalArc.map((point) => (
                      <span key={point.stageName} className="text-center">
                        <span className="block font-medium text-foreground">{point.score > 0 ? "+" : ""}{point.score}</span>
                        <span className="text-[10px]">{point.stageName}</span>
                      </span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
                  {stages.length === 0 
                    ? "No stages yet. Add stages to see the emotional arc."
                    : "Add more stages to visualize the emotional arc."}
                </div>
              )}
            </CardContent>
          </Card>

          {journey.description && (
            <Card className="border-border/60">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Description</CardTitle></CardHeader>
              <CardContent><p className="text-sm leading-relaxed text-muted-foreground">{journey.description}</p></CardContent>
            </Card>
          )}

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Archetypes</CardTitle>
              <Link href={`/journeys/${journeyId}/archetypes`}>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
                  <ExternalLink className="h-3 w-3" />
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {journey.archetypes.length === 0 && (
                <p className="text-xs text-muted-foreground py-4 text-center">No archetypes assigned yet. Add one to define who this journey is for.</p>
              )}
              {journey.archetypes.map((archetype) => (
                <div key={archetype.id} className="flex flex-col gap-2 rounded-lg border border-border/60 p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                        {getInitials(archetype.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{archetype.name}</p>
                        <Badge variant="secondary" className="text-[9px] capitalize">{archetype.category.replace(/_/g, " ").replace(/-/g, " ")}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{archetype.role}</p>
                    </div>
                    <Link href={`/archetypes/${archetype.id}`} className="text-[11px] text-primary hover:underline">View Profile</Link>
                  </div>
                  {archetype.subtitle && <p className="text-[10px] text-muted-foreground/70 italic -mt-1">{archetype.subtitle}</p>}
                  <p className="text-xs leading-relaxed text-muted-foreground">{archetype.description}</p>
                  {archetype.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {archetype.tags.map((tag) => <Badge key={tag} variant="outline" className="text-[9px]">{tag}</Badge>)}
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-3 mt-1">
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Goals</p>
                      <ul className="flex flex-col gap-0.5">
                        {archetype.goals.map((goal, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-green-500 mt-0.5">+</span> {goal}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Frustrations</p>
                      <ul className="flex flex-col gap-0.5">
                        {archetype.frustrations.map((f, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-red-500 mt-0.5">-</span> {f}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-1">Behaviors</p>
                      <ul className="flex flex-col gap-0.5">
                        {archetype.behaviors.map((b, i) => <li key={i} className="text-xs text-foreground flex items-start gap-1.5"><span className="text-blue-500 mt-0.5">~</span> {b}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Details</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><User className="h-3.5 w-3.5" /> Owner</span>
                <span className="font-medium text-foreground">{"Owner"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  Avg. Score
                  <TooltipProvider><Tooltip><TooltipTrigger asChild>
                    <Info className="h-3 w-3 text-muted-foreground/60 cursor-help" />
                  </TooltipTrigger><TooltipContent side="left" className="max-w-60 text-xs">Average emotional score across all touchpoints (-5 to +5).</TooltipContent></Tooltip></TooltipProvider>
                </span>
                <span className={`font-mono font-bold ${avgScore >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {avgScore > 0 ? "+" : ""}{avgScore.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Created</span>
                <span className="text-foreground">{new Date(journey.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground">{new Date(journey.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Tags</span>
                <div className="flex flex-wrap gap-1 justify-end">
                  {journey.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-[10px]">{tag}</Badge>)}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Collaborators ({journey.collaborators.length})</CardTitle>
              <Button variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-3 w-3" />
                Invite
              </Button>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {journey.collaborators.length === 0 ? (
                <p className="text-xs text-muted-foreground">No collaborators yet. Invite team members to get started.</p>
              ) : (
                journey.collaborators.map((collab) => (
                  <div key={collab.userId} className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7"><AvatarFallback className="bg-primary/10 text-[10px] font-medium text-primary">{getInitials(collab.userId.slice(0, 2))}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0"><p className="text-[10px] text-muted-foreground capitalize">{collab.role.replace("_", " ")}</p></div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Invite Collaborator Dialog */}
          <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Collaborator</DialogTitle>
                <DialogDescription>
                  Add team members to this journey by email or select from your workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="invite-email">Email Address</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setInviteOpen(false); setInviteEmail("") }}>
                  Cancel
                </Button>
                <Button
                  disabled={!inviteEmail.trim() || inviting}
                  onClick={async () => {
                    setInviting(true)
                    try {
                      const res = await fetch(`/api/journeys/${journeyId}/collaborators`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: inviteEmail.trim() }),
                      })
                      if (res.ok) {
                        toast.success(`Invitation sent to ${inviteEmail}`)
                        setInviteOpen(false)
                        setInviteEmail("")
                      } else {
                        toast.error("Failed to send invitation")
                      }
                    } catch {
                      toast.error("Failed to send invitation")
                    } finally {
                      setInviting(false)
                    }
                  }}
                >
                  <Mail className="mr-1.5 h-3.5 w-3.5" />
                  {inviting ? "Sending..." : "Send Invite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Card className="border-border/60">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Recent Activity</CardTitle></CardHeader>
            <CardContent className="flex flex-col gap-3">
              {recentActivity.length === 0 ? (
                <p className="text-xs text-muted-foreground">No recent activity</p>
              ) : (
                recentActivity.map((entry) => (
                  <div key={entry.id} className="flex items-start gap-2.5">
                    <Avatar className="h-5 w-5 mt-0.5"><AvatarFallback className="bg-primary/10 text-[8px] font-medium text-primary">{entry.actorName ? getInitials(entry.actorName) : "?"}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed">{entry.details}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(entry.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
