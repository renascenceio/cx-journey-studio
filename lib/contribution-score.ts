import type { ActivityLogEntry, Comment, JourneyVersion } from "@/lib/types"
import type { ActivityAction } from "@/lib/types"

// ========================
// Contribution Scoring Algorithm
// ========================

const ACTION_WEIGHTS: Partial<Record<ActivityAction, number>> = {
  created: 3,
  edited: 3,
  commented: 2,
  mentioned_you: 0,
  status_changed: 3,
  deployed: 2,
  shared: 2,
  archived: 1,
}

export const SCORING_EXPLANATION = `CX Impact Score (CIS) measures each member's contribution across five weighted categories:

\u2022 Journey Edits (create/edit): +3 pts each
\u2022 Comments (top-level): +2 pts, (replies): +1 pt
\u2022 Version Snapshots: +4 pts each
\u2022 Reviews (status changes): +3 pts each
\u2022 Sharing & Deployments: +2 pts each

Bonuses:
\u2022 Streak (active 5+ of last 7 days): 1.25\u00d7 multiplier
\u2022 Streak (active 3-4 of last 7 days): 1.1\u00d7 multiplier
\u2022 Resolved comments: +1 pt each`

export interface ContributorScore {
  userId: string
  name: string
  email: string
  role: string
  raw: number
  streakDays: number
  streakMultiplier: number
  total: number
  breakdown: {
    edits: number
    comments: number
    versions: number
    reviews: number
    sharing: number
    resolves: number
  }
  rank: number
  badge: "gold" | "silver" | "bronze" | null
  trend: "up" | "down" | "stable"
}

function getStreakDays(
  userId: string,
  activityLogData: ActivityLogEntry[],
  commentsData: Comment[]
): number {
  const now = new Date()
  const last7 = new Set<string>()

  activityLogData.forEach((a) => {
    if (a.actorId !== userId) return
    const date = new Date(a.timestamp)
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diff < 7) last7.add(date.toISOString().slice(0, 10))
  })

  commentsData.forEach((c) => {
    if (c.authorId !== userId) return
    const date = new Date(c.createdAt)
    const diff = Math.floor((now.getTime() - date.getTime()) / 86400000)
    if (diff < 7) last7.add(date.toISOString().slice(0, 10))
  })

  return last7.size
}

export function computeLeaderboard(
  activityLogData: ActivityLogEntry[],
  commentsData: Comment[],
  versionsData: JourneyVersion[],
  teamMembers: { id: string; name: string; email: string; role: string; status: string }[]
): ContributorScore[] {
  const scores: Record<
    string,
    {
      edits: number
      comments: number
      versions: number
      reviews: number
      sharing: number
      resolves: number
    }
  > = {}

  function ensure(uid: string) {
    if (!scores[uid]) {
      scores[uid] = { edits: 0, comments: 0, versions: 0, reviews: 0, sharing: 0, resolves: 0 }
    }
  }

  activityLogData.forEach((entry) => {
    ensure(entry.actorId)
    const weight = ACTION_WEIGHTS[entry.action] ?? 0
    if (entry.action === "created" || entry.action === "edited") {
      scores[entry.actorId].edits += weight
    } else if (entry.action === "commented") {
      scores[entry.actorId].comments += weight
    } else if (entry.action === "status_changed") {
      scores[entry.actorId].reviews += weight
    } else if (entry.action === "shared" || entry.action === "deployed") {
      scores[entry.actorId].sharing += weight
    }
  })

  commentsData.forEach((c) => {
    ensure(c.authorId)
    scores[c.authorId].comments += c.parentId ? 1 : 2
    if (c.resolved) {
      scores[c.authorId].resolves += 1
    }
  })

  versionsData.forEach((v) => {
    ensure(v.createdBy)
    scores[v.createdBy].versions += 4
  })

  const board: ContributorScore[] = teamMembers
    .filter((m) => m.status === "active")
    .map((member) => {
      ensure(member.id)
      const b = scores[member.id]
      const raw = b.edits + b.comments + b.versions + b.reviews + b.sharing + b.resolves
      const streak = getStreakDays(member.id, activityLogData, commentsData)
      const multiplier = streak >= 5 ? 1.25 : streak >= 3 ? 1.1 : 1
      const total = Math.round(raw * multiplier)

      return {
        userId: member.id,
        name: member.name,
        email: member.email,
        role: member.role,
        raw,
        streakDays: streak,
        streakMultiplier: multiplier,
        total,
        breakdown: b,
        rank: 0,
        badge: null,
        trend: "stable" as const,
      }
    })

  board.sort((a, b) => b.total - a.total)
  board.forEach((entry, idx) => {
    entry.rank = idx + 1
    if (idx === 0) entry.badge = "gold"
    else if (idx === 1) entry.badge = "silver"
    else if (idx === 2) entry.badge = "bronze"
  })

  if (board.length > 0) board[0].trend = "up"
  if (board.length > 1) board[1].trend = "up"
  if (board.length > 2) board[board.length - 1].trend = "down"

  return board
}
