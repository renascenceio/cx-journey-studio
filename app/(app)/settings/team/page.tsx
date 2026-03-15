"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MOCK_TEAM_MEMBERS, useAuth } from "@/lib/auth-provider"
import { ROLE_LABELS, ROLE_COLORS, ROLE_DESCRIPTIONS, usePermissions } from "@/lib/permissions"
import { cn } from "@/lib/utils"
import { MoreHorizontal, Mail, UserPlus, Shield, Clock, Trash2, Trophy, TrendingUp, TrendingDown, Minus, Flame, Info, Crown, Medal, Award } from "lucide-react"
import { toast } from "sonner"
import { computeLeaderboard, SCORING_EXPLANATION } from "@/lib/contribution-score"
import type { ContributorScore } from "@/lib/contribution-score"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Toaster } from "@/components/ui/sonner"
import type { UserRole } from "@/lib/types"

import { getInitials } from "@/lib/utils"

function relativeTime(dateStr: string): string {
  const now = new Date("2026-02-22T12:00:00Z")
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffHours / 24)
  if (diffHours < 1) return "Just now"
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 30) return `${diffDays}d ago`
  return `${Math.floor(diffDays / 30)}mo ago`
}

export default function TeamSettingsPage() {
  const t = useTranslations("team")
  const { user } = useAuth()
  const { canManageTeam, canChangeRoles } = usePermissions()
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<UserRole>("contributor")
  const [removeOpen, setRemoveOpen] = useState(false)
  const [removeMember, setRemoveMember] = useState<string | null>(null)

  const activeMembers = MOCK_TEAM_MEMBERS.filter((m) => m.status === "active")
  const invitedMembers = MOCK_TEAM_MEMBERS.filter((m) => m.status === "invited")

  return (
    <div className="flex flex-col gap-6">
      <Toaster />

      {/* Team Members */}
      <Card className="border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">{t("teamMembers")}</CardTitle>
            <CardDescription>{t("activeMembers", { count: activeMembers.length })}</CardDescription>
          </div>
          {canManageTeam && (
            <Button size="sm" className="gap-1.5" onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-3.5 w-3.5" />
              {t("inviteMember")}
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col divide-y divide-border">
            {activeMembers.map((member) => (
              <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                    {member.id === user?.id && (
                      <Badge variant="outline" className="text-[9px] h-4">You</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </div>
                <Badge variant="secondary" className={cn("text-[10px] shrink-0", ROLE_COLORS[member.role])}>
                  {ROLE_LABELS[member.role]}
                </Badge>
                <span className="hidden sm:inline text-[11px] text-muted-foreground shrink-0 w-16 text-right">
                  {relativeTime(member.lastActive)}
                </span>
                {canChangeRoles && member.id !== user?.id && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
<DropdownMenuContent align="end">
                                      <DropdownMenuItem onClick={() => toast.success(`${member.name} updated to Master`)}>
                                        <Shield className="mr-2 h-3.5 w-3.5" />
                                        {t("makeJourneyMaster")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast.success(`${member.name} updated to Contributor`)}>
                                        {t("makeContributor")}
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => toast.success(`${member.name} updated to Viewer`)}>
                                        {t("makeViewer")}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() => { setRemoveMember(member.name); setRemoveOpen(true) }}
                                      >
                                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                                        {t("removeMember")}
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contribution Leaderboard */}
      <ContributionLeaderboard />

      {/* Pending Invitations */}
      {invitedMembers.length > 0 && (
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("pendingInvitations")}
            </CardTitle>
            <CardDescription>{invitedMembers.length} pending</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col divide-y divide-border">
              {invitedMembers.map((member) => (
                <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-muted text-xs font-medium text-muted-foreground">
                      {getInitials(member.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px]">Invited</Badge>
                  <Badge variant="secondary" className={cn("text-[10px]", ROLE_COLORS[member.role])}>
                    {ROLE_LABELS[member.role]}
                  </Badge>
                  {canManageTeam && (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toast.success(`Resent invite to ${member.email}`)}>
                        {t("resend")}
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => toast.success(`Revoked invite for ${member.email}`)}>
                        {t("revoke")}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Role Descriptions */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base">{t("roleDescriptions")}</CardTitle>
          <CardDescription>{t("roleDescriptionsDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {(["journey_master", "contributor", "viewer", "external"] as UserRole[]).map((role) => (
              <div key={role} className="rounded-lg border border-border p-3">
                <Badge variant="secondary" className={cn("text-[10px] mb-2", ROLE_COLORS[role])}>
                  {ROLE_LABELS[role]}
                </Badge>
                <p className="text-xs text-muted-foreground leading-relaxed">{ROLE_DESCRIPTIONS[role]}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Invite Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("inviteMember")}</DialogTitle>
            <DialogDescription>{t("inviteByEmailDesc")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-email">{t("emailAddress")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="invite-role">{t("role")}</Label>
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as UserRole)}>
                <SelectTrigger id="invite-role" className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="external">External</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                setInviteOpen(false)
                toast.success(t("invitationSent", { email: inviteEmail }))
                setInviteEmail("")
              }}
              disabled={!inviteEmail}
              className="gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              {t("sendInvitation")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation */}
      <Dialog open={removeOpen} onOpenChange={setRemoveOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("removeMember")}</DialogTitle>
            <DialogDescription>
              {t("removeMemberConfirm", { name: removeMember || "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRemoveOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => { setRemoveOpen(false); toast.success(`${removeMember} has been removed`) }}
            >
              {t("removeMember")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}


// ========================
// Contribution Leaderboard
// ========================

const BADGE_CONFIG = {
  gold: { icon: Crown, color: "text-amber-500", bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-200 dark:border-amber-800/40", label: "Champion" },
  silver: { icon: Medal, color: "text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/40", border: "border-slate-200 dark:border-slate-700/40", label: "Runner-up" },
  bronze: { icon: Award, color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-100 dark:bg-orange-900/30", border: "border-orange-200 dark:border-orange-800/40", label: "Rising Star" },
}

const TREND_ICON = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

const TREND_COLOR = {
  up: "text-emerald-600 dark:text-emerald-400",
  down: "text-red-500 dark:text-red-400",
  stable: "text-muted-foreground",
}

const CATEGORY_COLORS: Record<string, string> = {
  edits: "bg-blue-500",
  comments: "bg-amber-500",
  versions: "bg-violet-500",
  reviews: "bg-emerald-500",
  sharing: "bg-cyan-500",
  resolves: "bg-pink-500",
}

function ContributionLeaderboard() {
  const t = useTranslations("team")
  // Pass empty arrays for now -- will be populated when data flows through API
  const leaderboard = computeLeaderboard([], [], [], MOCK_TEAM_MEMBERS)
  const maxScore = leaderboard[0]?.total || 1

  return (
    <Card className="border-border/60 overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-amber-100 dark:bg-amber-900/30">
            <Trophy className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle className="text-base">{t("contributionRace")}</CardTitle>
            <CardDescription>{t("contributionRaceDesc")}</CardDescription>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                <Info className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs whitespace-pre-line text-xs leading-relaxed p-3">
              {SCORING_EXPLANATION}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Race visualization */}
        <div className="flex flex-col">
          {leaderboard.map((entry, idx) => {
            const pct = Math.max(8, (entry.total / maxScore) * 100)
            const badgeConf = entry.badge ? BADGE_CONFIG[entry.badge] : null
            const TrendIcon = TREND_ICON[entry.trend]

            return (
              <div
                key={entry.userId}
                className={cn(
                  "flex items-center gap-3 px-6 py-3 transition-colors",
                  idx === 0 && "bg-amber-50/50 dark:bg-amber-950/10",
                  idx % 2 !== 0 && idx !== 0 && "bg-muted/20"
                )}
              >
                {/* Rank */}
                <div className="flex items-center justify-center h-7 w-7 shrink-0">
                  {badgeConf ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className={cn("flex items-center justify-center h-7 w-7 rounded-full", badgeConf.bg, badgeConf.border, "border")}>
                            <badgeConf.icon className={cn("h-3.5 w-3.5", badgeConf.color)} />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">{badgeConf.label}</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground font-mono">{entry.rank}</span>
                  )}
                </div>

                {/* Avatar + name */}
                <div className="flex items-center gap-2.5 w-40 shrink-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className={cn(
                      "text-xs font-medium",
                      idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : "bg-primary/10 text-primary"
                    )}>
                      {getInitials(entry.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-foreground truncate">{entry.name}</span>
                    <div className="flex items-center gap-1">
                      <Badge variant="secondary" className={cn("text-[8px] h-3.5 px-1", ROLE_COLORS[entry.role as keyof typeof ROLE_COLORS])}>
                        {ROLE_LABELS[entry.role as keyof typeof ROLE_LABELS]}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Race bar */}
                <div className="flex-1 min-w-0">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="relative h-7 rounded-full bg-muted/60 overflow-hidden cursor-default">
                          <div
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out flex items-center",
                              idx === 0 ? "bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-600" :
                              idx === 1 ? "bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500" :
                              idx === 2 ? "bg-gradient-to-r from-orange-300 to-orange-400 dark:from-orange-700 dark:to-orange-600" :
                              "bg-gradient-to-r from-primary/40 to-primary/60"
                            )}
                            style={{ width: `${pct}%` }}
                          >
                            {/* Inline score */}
                            <span className={cn(
                              "absolute right-2 text-[11px] font-bold font-mono tabular-nums",
                              pct > 30 ? "text-white dark:text-white" : "text-foreground"
                            )}>
                              {entry.total} pts
                            </span>
                          </div>
                          {pct <= 30 && (
                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] font-bold font-mono tabular-nums text-muted-foreground">
                              {entry.total} pts
                            </span>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs p-3">
                        <div className="flex flex-col gap-1.5">
                          <p className="font-semibold text-foreground mb-1">Score Breakdown</p>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            <span className="text-muted-foreground">Edits:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.edits}</span>
                            <span className="text-muted-foreground">Comments:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.comments}</span>
                            <span className="text-muted-foreground">Versions:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.versions}</span>
                            <span className="text-muted-foreground">Reviews:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.reviews}</span>
                            <span className="text-muted-foreground">Sharing:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.sharing}</span>
                            <span className="text-muted-foreground">Resolves:</span>
                            <span className="font-mono font-medium text-right">{entry.breakdown.resolves}</span>
                          </div>
                          <div className="border-t border-border pt-1.5 mt-1 flex justify-between">
                            <span className="text-muted-foreground">Raw total:</span>
                            <span className="font-mono font-medium">{entry.raw}</span>
                          </div>
                          {entry.streakMultiplier > 1 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Streak ({entry.streakDays}d):</span>
                              <span className="font-mono font-medium text-amber-600 dark:text-amber-400">{entry.streakMultiplier}x</span>
                            </div>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Streak + trend */}
                <div className="flex items-center gap-2 shrink-0 w-20 justify-end">
                  {entry.streakDays >= 3 && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-0.5">
                            <Flame className={cn("h-3.5 w-3.5", entry.streakDays >= 5 ? "text-red-500" : "text-amber-500")} />
                            <span className="text-[10px] font-bold font-mono">{entry.streakDays}d</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="text-xs">
                          {entry.streakDays}-day active streak ({entry.streakMultiplier}x multiplier)
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  <TrendIcon className={cn("h-3.5 w-3.5", TREND_COLOR[entry.trend])} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Category legend */}
        <div className="flex items-center gap-4 px-6 py-3 border-t border-border/60 bg-muted/20">
          <span className="text-[10px] font-medium text-muted-foreground mr-1">Categories:</span>
          {Object.entries(CATEGORY_COLORS).map(([key, bg]) => (
            <div key={key} className="flex items-center gap-1">
              <div className={cn("h-2 w-2 rounded-full", bg)} />
              <span className="text-[10px] text-muted-foreground capitalize">{key}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
