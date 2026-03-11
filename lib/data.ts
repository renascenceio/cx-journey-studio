import { createClient } from "@/lib/supabase/server"
import type {
  Journey,
  Stage,
  Step,
  TouchPoint,
  PainPoint,
  Highlight,
  Evidence,
  Archetype,
  PillarRating,
  RadarChart,
  Comment,
  ActivityLogEntry,
  JourneyVersion,
  Solution,
  DashboardStats,
  User,
  Organization,
  Team,
  Notification,
  HealthIndicator,
  Opportunity,
  GapAnalysisEntry,
} from "@/lib/types"

// ---- Helpers ----

function buildJourneyFromRows(
  journeyRow: Record<string, unknown>,
  stages: Record<string, unknown>[],
  steps: Record<string, unknown>[],
  touchPoints: Record<string, unknown>[],
  painPoints: Record<string, unknown>[],
  highlights: Record<string, unknown>[],
  evidenceRows: Record<string, unknown>[],
  archetypes: Archetype[],
  collaborators: { id: string; userId: string; name: string; email: string; avatar?: string; role: string }[] = [],
  ): Journey {
  const builtStages: Stage[] = stages
    .filter((s) => s.journey_id === journeyRow.id)
    .sort((a, b) => (a.order as number) - (b.order as number))
    .map((s) => {
      const stageSteps: Step[] = steps
        .filter((st) => st.stage_id === s.id)
        .sort((a, b) => (a.order as number) - (b.order as number))
        .map((st) => {
          const stepTps: TouchPoint[] = touchPoints
            .filter((tp) => tp.step_id === st.id)
            .map((tp) => ({
              id: tp.id as string,
              channel: tp.channel as string,
              description: tp.description as string,
              emotionalScore: tp.emotional_score as number,
              painPoints: painPoints
                .filter((pp) => pp.touch_point_id === tp.id)
                .map((pp) => ({
                  id: pp.id as string,
                  description: pp.description as string,
                  severity: pp.severity as PainPoint["severity"],
                  emotionalScore: pp.emotional_score as number | undefined,
                  isAiGenerated: pp.is_ai_generated as boolean | undefined,
                })),
              highlights: highlights
                .filter((h) => h.touch_point_id === tp.id)
                .map((h) => ({
                  id: h.id as string,
                  description: h.description as string,
                  impact: h.impact as Highlight["impact"],
                  emotionalScore: h.emotional_score as number | undefined,
                  isAiGenerated: h.is_ai_generated as boolean | undefined,
                })),
              evidence: evidenceRows
                .filter((e) => e.touch_point_id === tp.id)
                .map((e) => ({
                  id: e.id as string,
                  type: e.type as Evidence["type"],
                  url: e.url as string,
                  label: e.label as string,
                })),
            }))
          return {
            id: st.id as string,
            name: st.name as string,
            description: (st.description as string) || "",
            order: (st.order as number) ?? 0,
            touchPoints: stepTps,
          }
        })
      return {
        id: s.id as string,
        name: s.name as string,
        order: (s.order as number) ?? 0,
        steps: stageSteps,
      }
    })

  return {
    id: journeyRow.id as string,
    title: journeyRow.title as string,
    description: (journeyRow.description as string) || "",
    type: journeyRow.type as Journey["type"],
    category: (journeyRow.category as string) || "retail",
    status: journeyRow.status as Journey["status"],
    ownerId: journeyRow.owner_id as string,
    organizationId: journeyRow.organization_id as string,
    teamId: journeyRow.team_id as string,
    tags: Array.isArray(journeyRow.tags) ? journeyRow.tags : [],
    stages: builtStages,
    collaborators,
    archetypes,
    healthStatus: (journeyRow.health_status as Journey["healthStatus"]) || undefined,
    lastHealthCheck: (journeyRow.last_health_check as string) || undefined,
    linkedCurrentJourneyId: (journeyRow.linked_current_journey_id as string) || undefined,
    is_public: (journeyRow.is_public as boolean) ?? false,
    upvotes: (journeyRow.upvotes as number) ?? 0,
    createdAt: journeyRow.created_at as string,
    updatedAt: journeyRow.updated_at as string,
  }
}

// ---- Query Functions ----

export async function getJourneys(): Promise<Journey[]> {
  try {
    const supabase = await createClient()
    
    // Get current user's organization to filter journeys
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()
    
    if (!profile?.organization_id) return []
    
    const { data: rows } = await supabase
      .from("journeys")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .order("updated_at", { ascending: false })
    if (!rows || rows.length === 0) return []

  const journeyIds = rows.map((r) => r.id)

  const [stagesRes, archetypesRes] = await Promise.all([
    supabase.from("stages").select("*").in("journey_id", journeyIds).order("order"),
    supabase.from("archetypes").select("*").in("journey_id", journeyIds),
  ])

  // Fetch pillar ratings and radar charts for archetypes
  const allArcIds = (archetypesRes.data || []).map((a) => a.id)
  const [pillarsRes, radarsRes] = allArcIds.length > 0
    ? await Promise.all([
        supabase.from("pillar_ratings").select("*").in("archetype_id", allArcIds),
        supabase.from("radar_charts").select("*").in("archetype_id", allArcIds),
      ])
    : [{ data: [] }, { data: [] }]

  const allRadarIds = (radarsRes.data || []).map((r) => r.id)
  const dimsRes = allRadarIds.length > 0
    ? await supabase.from("radar_dimensions").select("*").in("radar_chart_id", allRadarIds)
    : { data: [] }

  const stageIds = (stagesRes.data || []).map((s) => s.id)

  const stepsRes = stageIds.length > 0
    ? await supabase.from("steps").select("*").in("stage_id", stageIds).order("order")
    : { data: [] }

  const stepIds = (stepsRes.data || []).map((s) => s.id)

  const tpRes = stepIds.length > 0
    ? await supabase.from("touch_points").select("*").in("step_id", stepIds)
    : { data: [] }

  const tpIds = (tpRes.data || []).map((tp) => tp.id)

  const [ppRes, hlRes, evRes] = tpIds.length > 0
    ? await Promise.all([
        supabase.from("pain_points").select("*").in("touch_point_id", tpIds),
        supabase.from("highlights").select("*").in("touch_point_id", tpIds),
        supabase.from("evidence").select("*").in("touch_point_id", tpIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // Fetch collaborators for all journeys
  const collaboratorsRes = journeyIds.length > 0
    ? await supabase
        .from("journey_collaborators")
        .select(`
          id,
          journey_id,
          profile_id,
          external_email,
          external_name,
          role,
          is_external,
          profiles:profile_id (id, name, email, avatar)
        `)
        .in("journey_id", journeyIds)
    : { data: [] }

  return rows.map((row) => {
    const journeyArchetypes = (archetypesRes.data || [])
      .filter((a) => a.journey_id === row.id)
      .map((a) => mapArchetype(a, pillarsRes.data || [], radarsRes.data || [], dimsRes.data || []))
    
    // Map collaborators for this journey
const journeyCollaborators = (collaboratorsRes.data || [])
    .filter((c) => c.journey_id === row.id)
    .map((c) => {
      const profile = c.profiles as { id: string; name: string; email: string; avatar: string | null } | null
      const odId = c.profile_id || c.id
      return {
        id: odId,
        userId: odId,
        name: c.is_external ? (c.external_name || "External") : (profile?.name || "Unknown"),
        email: c.is_external ? (c.external_email || "") : (profile?.email || ""),
        avatar: profile?.avatar || undefined,
        role: c.role || "viewer",
      }
    })
    
    return buildJourneyFromRows(
      row,
      stagesRes.data || [],
      stepsRes.data || [],
      tpRes.data || [],
      ppRes.data || [],
      hlRes.data || [],
      evRes.data || [],
      journeyArchetypes,
      journeyCollaborators
    )
  })
  } catch (error) {
    console.error("[getJourneys] Error:", error)
    return []
  }
}

export async function getJourneyById(id: string): Promise<Journey | null> {
  try {
    const supabase = await createClient()
    const { data: row } = await supabase.from("journeys").select("*").eq("id", id).single()
    if (!row) return null

  const [stagesRes, archetypesRes] = await Promise.all([
    supabase.from("stages").select("*").eq("journey_id", id).order("order"),
    supabase.from("archetypes").select("*").eq("journey_id", id),
  ])

  const arcIds = (archetypesRes.data || []).map((a) => a.id)
  const [pillarsRes2, radarsRes2] = arcIds.length > 0
    ? await Promise.all([
        supabase.from("pillar_ratings").select("*").in("archetype_id", arcIds),
        supabase.from("radar_charts").select("*").in("archetype_id", arcIds),
      ])
    : [{ data: [] }, { data: [] }]

  const radarIds2 = (radarsRes2.data || []).map((r) => r.id)
  const dimsRes2 = radarIds2.length > 0
    ? await supabase.from("radar_dimensions").select("*").in("radar_chart_id", radarIds2)
    : { data: [] }

  const stageIds = (stagesRes.data || []).map((s) => s.id)
  const stepsRes = stageIds.length > 0
    ? await supabase.from("steps").select("*").in("stage_id", stageIds).order("order")
    : { data: [] }

  const stepIds = (stepsRes.data || []).map((s) => s.id)
  const tpRes = stepIds.length > 0
    ? await supabase.from("touch_points").select("*").in("step_id", stepIds)
    : { data: [] }

  const tpIds = (tpRes.data || []).map((tp) => tp.id)

  const [ppRes, hlRes, evRes] = tpIds.length > 0
    ? await Promise.all([
        supabase.from("pain_points").select("*").in("touch_point_id", tpIds),
        supabase.from("highlights").select("*").in("touch_point_id", tpIds),
        supabase.from("evidence").select("*").in("touch_point_id", tpIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // Fetch collaborators for this journey
  const collaboratorsRes = await supabase
    .from("journey_collaborators")
    .select(`
      id,
      journey_id,
      profile_id,
      external_email,
      external_name,
      role,
      is_external,
      profiles:profile_id (id, name, email, avatar)
    `)
    .eq("journey_id", id)

  const journeyCollaborators = (collaboratorsRes.data || []).map((c) => {
    const profile = c.profiles as { id: string; name: string; email: string; avatar: string | null } | null
    const oderId = c.profile_id || c.id
    return {
      id: oderId,
      userId: oderId,
      name: c.is_external ? (c.external_name || "External") : (profile?.name || "Unknown"),
      email: c.is_external ? (c.external_email || "") : (profile?.email || ""),
      avatar: profile?.avatar || undefined,
      role: c.role || "viewer",
    }
  })

  const journeyArchetypes = (archetypesRes.data || []).map((a) =>
    mapArchetype(a, pillarsRes2.data || [], radarsRes2.data || [], dimsRes2.data || [])
  )
  return buildJourneyFromRows(
      row,
      stagesRes.data || [],
      stepsRes.data || [],
      tpRes.data || [],
      ppRes.data || [],
      hlRes.data || [],
      evRes.data || [],
      journeyArchetypes,
      journeyCollaborators
    )
  } catch (error) {
    console.error("[getJourneyById] Error:", error)
    return null
  }
}

export async function getJourneysByType(type: Journey["type"]): Promise<Journey[]> {
  const all = await getJourneys()
  return all.filter((j) => j.type === type)
}

export async function getUserById(id: string): Promise<User | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("id, name, email, avatar, role, organization_id, created_at")
    .eq("id", id)
    .single()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    avatar: data.avatar || undefined,
    role: data.role as User["role"],
    teamIds: [],
    organizationId: data.organization_id || "",
    createdAt: data.created_at,
  }
}

export async function getUsers(): Promise<User[]> {
  const supabase = await createClient()
  
  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) return []
  
  // Get all users who are members of the same organization
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", profile.organization_id)
  
  if (!members || members.length === 0) return []
  
  const memberIds = members.map(m => m.user_id)
  
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .in("id", memberIds)
  if (!data) return []
  return data.map((d) => ({
    id: d.id,
    name: d.name,
    email: d.email,
    avatar: d.avatar || undefined,
    role: d.role as User["role"],
    teamIds: [],
    organizationId: d.organization_id || "",
    createdAt: d.created_at,
  }))
}

export async function getOrganization(): Promise<Organization | null> {
  const supabase = await createClient()
  const { data } = await supabase.from("organizations").select("*").limit(1).single()
  if (!data) return null
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    plan: data.plan as Organization["plan"],
    createdAt: data.created_at,
  }
}

export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient()
  
  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) return []
  
  const { data } = await supabase
    .from("teams")
    .select("*")
    .eq("organization_id", profile.organization_id)
  if (!data) return []
  return data.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description || "",
    organizationId: t.organization_id,
    createdAt: t.created_at,
  }))
}

export async function getCommentsForJourney(journeyId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(id, name, email, avatar, role)")
    .eq("journey_id", journeyId)
    .order("created_at", { ascending: false })
  if (!data) return []
  return data.map(mapComment)
}

export async function getCommentsForStage(journeyId: string, stageId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(id, name, email, avatar, role)")
    .eq("journey_id", journeyId)
    .eq("stage_id", stageId)
    .order("created_at", { ascending: false })
  if (!data) return []
  return data.map(mapComment)
}

export async function getCommentsForStep(journeyId: string, stepId: string): Promise<Comment[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("comments")
    .select("*, author:profiles!comments_author_id_fkey(id, name, email, avatar, role)")
    .eq("journey_id", journeyId)
    .eq("step_id", stepId)
    .order("created_at", { ascending: false })
  if (!data) return []
  return data.map(mapComment)
}

export async function getUnresolvedCommentCount(journeyId: string): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from("comments")
    .select("id", { count: "exact", head: true })
    .eq("journey_id", journeyId)
    .eq("resolved", false)
  return count || 0
}

function mapComment(row: Record<string, unknown>): Comment {
  const author = row.author as Record<string, unknown> | null
  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    content: row.content as string,
    authorId: row.author_id as string,
    authorName: (author?.name as string) || "Unknown",
    authorAvatar: (author?.avatar as string) || undefined,
    mentions: (row.mentions as string[]) || [],
    resolved: row.resolved as boolean,
    parentId: (row.parent_id as string) || undefined,
    stageId: (row.stage_id as string) || undefined,
    stepId: (row.step_id as string) || undefined,
    touchpointId: (row.touchpoint_id as string) || undefined,
    reactions: (row.reactions as Comment["reactions"]) || [],
    editedAt: (row.edited_at as string) || undefined,
    createdAt: row.created_at as string,
  }
}

export async function getActivityLog(journeyId?: string): Promise<ActivityLogEntry[]> {
  const supabase = await createClient()
  
  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) return []
  
  let query = supabase
    .from("activity_log")
    .select("*, actor:profiles!activity_log_actor_id_fkey(id, name, avatar)")
    .eq("organization_id", profile.organization_id)
    .order("timestamp", { ascending: false })
    .limit(50)

  if (journeyId) {
    query = query.eq("journey_id", journeyId)
  }

  const { data } = await query
  if (!data) return []

  return data.map((row) => {
    const actor = row.actor as Record<string, unknown> | null
    return {
      id: row.id,
      action: row.action as ActivityLogEntry["action"],
      actorId: row.actor_id,
      actorName: (actor?.name as string) || "Unknown",
      actorAvatar: (actor?.avatar as string) || undefined,
      journeyId: row.journey_id || undefined,
      details: row.details || "",
      stageId: row.stage_id || undefined,
      stepId: row.step_id || undefined,
      commentPreview: row.comment_preview || undefined,
      timestamp: row.timestamp,
    }
  })
}

export async function getNotifications(): Promise<Notification[]> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)
  if (!data) return []
  return data.map((n) => ({
    id: n.id,
    type: n.type as Notification["type"],
    message: n.message,
    read: n.read,
    link: n.link || undefined,
    createdAt: n.created_at,
  }))
}

export async function getVersionsForJourney(journeyId: string): Promise<JourneyVersion[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("journey_versions")
    .select("*, creator:profiles!journey_versions_created_by_fkey(id, name, avatar)")
    .eq("journey_id", journeyId)
    .order("version_number", { ascending: false })
  if (!data) return []
  return data.map((v) => {
    const creator = v.creator as Record<string, unknown> | null
    return {
      id: v.id,
      journeyId: v.journey_id,
      versionNumber: v.version_number,
      versionLabel: v.version_label || undefined,
      changeType: v.change_type || undefined,
      label: v.label || undefined,
      snapshot: v.snapshot,
      createdBy: v.created_by,
      createdByName: (creator?.name as string) || "Unknown",
      createdByAvatar: (creator?.avatar as string) || undefined,
      changesSummary: v.changes_summary || "",
      createdAt: v.created_at,
    }
  })
}

export async function getSolutions(): Promise<Solution[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("solutions").select("*").order("relevance", { ascending: false })
  if (!data) return []
  return data.map(mapSolution)
}

export async function getPlatformSolutions(): Promise<Solution[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("solutions").select("*").eq("is_crowd", false).order("relevance", { ascending: false })
  if (!data) return []
  return data.map(mapSolution)
}

export async function getCrowdSolutions(): Promise<Solution[]> {
  const supabase = await createClient()
  const { data } = await supabase.from("solutions").select("*").eq("is_crowd", true).order("relevance", { ascending: false })
  if (!data) return []
  return data.map(mapSolution)
}

/** Fetch platform, crowd, and user's own solutions in one query */
export async function getAllSolutions(): Promise<{ platform: Solution[]; crowd: Solution[]; my: Solution[] }> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch solutions
  const { data, error } = await supabase
    .from("solutions")
    .select("*")
    .order("relevance", { ascending: false })
  
  if (error || !data) {
    console.error("[v0] getAllSolutions error:", error)
    return { platform: [], crowd: [], my: [] }
  }
  
  // Fetch creator profiles separately
  const creatorIds = [...new Set(data.filter(s => s.created_by).map(s => s.created_by))]
  let profilesMap: Record<string, { full_name?: string; company?: string }> = {}
  
  if (creatorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, company")
      .in("id", creatorIds)
    
    if (profiles) {
      profilesMap = Object.fromEntries(profiles.map(p => [p.id, { full_name: p.full_name, company: p.company }]))
    }
  }
  
  const all = data.map((row) => ({
    ...mapSolution(row),
    creatorName: row.created_by ? profilesMap[row.created_by]?.full_name : undefined,
    creatorCompany: row.created_by ? profilesMap[row.created_by]?.company : undefined,
  }))
  
  return {
    platform: all.filter((s) => !s.isCrowd && !s.createdBy),
    crowd: all.filter((s) => s.isCrowd || s.isPublic),
    my: user ? all.filter((s) => s.createdBy === user.id) : [],
  }
}

function mapSolution(row: Record<string, unknown>): Solution {
  return {
    id: row.id as string,
    title: (row.title as string) || "",
    category: (row.category as Solution["category"]) || "behavioral",
    description: (row.description as string) || "",
    source: (row.source as string) || "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    relevance: (row.relevance as number) ?? 0,
    upvotes: (row.upvotes as number) ?? 0,
    saved: (row.saved as boolean) ?? false,
    publishedAt: (row.published_at as string) || new Date().toISOString(),
    isCrowd: (row.is_crowd as boolean) ?? false,
    isPublic: (row.is_public as boolean) ?? false,
    createdBy: (row.created_by as string) || undefined,
    industry: (row.industry as string) || undefined,
    applicableStage: (row.applicable_stage as string) || undefined,
    contributorOrg: (row.contributor_org as string) || undefined,
    impact_score: (row.impact_score as number) || undefined,
    impact_verified: (row.impact_verified as boolean) ?? false,
    impact: (row.impact as Solution["impact"]) || undefined,
    effort: (row.effort as Solution["effort"]) || undefined,
  }
}

export async function getAllArchetypes(): Promise<Archetype[]> {
  const supabase = await createClient()
  
  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  // Fetch archetypes: user's own archetypes + org archetypes + public + studio (platform-wide)
  // Use OR filter to get: user's created archetypes OR org's archetypes OR public OR studio visibility
  const { data: rows } = await supabase
    .from("archetypes")
    .select("*")
    .or(
      profile?.organization_id 
        ? `created_by.eq.${user.id},organization_id.eq.${profile.organization_id},visibility.eq.public,visibility.eq.studio`
        : `created_by.eq.${user.id},visibility.eq.public,visibility.eq.studio`
    )
  if (!rows || rows.length === 0) return []

  const archetypeIds = rows.map((r) => r.id)

  const [pillarsRes, radarRes] = await Promise.all([
    supabase.from("pillar_ratings").select("*").in("archetype_id", archetypeIds),
    supabase.from("radar_charts").select("*").in("archetype_id", archetypeIds),
  ])

  const radarIds = (radarRes.data || []).map((r) => r.id)
  const dimRes = radarIds.length > 0
    ? await supabase.from("radar_dimensions").select("*").in("radar_chart_id", radarIds)
    : { data: [] }

  return rows.map((row) => mapArchetype(row, pillarsRes.data || [], radarRes.data || [], dimRes.data || []))
}

export async function getArchetypeById(id: string): Promise<Archetype | null> {
  const supabase = await createClient()
  const { data: row } = await supabase.from("archetypes").select("*").eq("id", id).single()
  if (!row) return null

  const [pillarsRes, radarRes] = await Promise.all([
    supabase.from("pillar_ratings").select("*").eq("archetype_id", id),
    supabase.from("radar_charts").select("*").eq("archetype_id", id),
  ])

  const radarIds = (radarRes.data || []).map((r) => r.id)
  const dimRes = radarIds.length > 0
    ? await supabase.from("radar_dimensions").select("*").in("radar_chart_id", radarIds)
    : { data: [] }

  return mapArchetype(row, pillarsRes.data || [], radarRes.data || [], dimRes.data || [])
}

function mapArchetype(
  row: Record<string, unknown>,
  pillars: Record<string, unknown>[],
  radars: Record<string, unknown>[],
  dimensions: Record<string, unknown>[]
): Archetype {
  const arcPillars: PillarRating[] = pillars
    .filter((p) => p.archetype_id === row.id)
    .map((p) => ({
      name: p.name as string,
      score: Number(p.score),
      group: p.group as PillarRating["group"],
    }))

  const arcRadars: RadarChart[] = radars
    .filter((r) => r.archetype_id === row.id)
    .map((r) => ({
      label: r.label as string,
      dimensions: dimensions
        .filter((d) => d.radar_chart_id === r.id)
        .map((d) => ({
          axis: d.axis as string,
          value: Number(d.value),
        })),
    }))

  return {
    id: row.id as string,
    journeyId: row.journey_id as string,
    name: row.name as string,
    role: row.role as string,
    subtitle: (row.subtitle as string) || undefined,
    category: row.category as Archetype["category"],
    visibility: (row.visibility as Archetype["visibility"]) || "private",
    avatar: (row.avatar as string) || undefined,
    description: (row.description as string) || "",
    goalsNarrative: (row.goals_narrative as string) || "",
    needsNarrative: (row.needs_narrative as string) || "",
    touchpointsNarrative: (row.touchpoints_narrative as string) || "",
    goals: Array.isArray(row.goals) ? row.goals : [],
    frustrations: Array.isArray(row.frustrations) ? row.frustrations : [],
    behaviors: Array.isArray(row.behaviors) ? row.behaviors : [],
    expectations: Array.isArray(row.expectations) ? row.expectations : [],
    barriers: Array.isArray(row.barriers) ? row.barriers : [],
    drivers: Array.isArray(row.drivers) ? row.drivers : [],
    importantSteps: Array.isArray(row.important_steps) ? row.important_steps : [],
    triggers: Array.isArray(row.triggers) ? row.triggers : [],
    mindset: Array.isArray(row.mindset) ? row.mindset : [],
    solutionPrinciples: Array.isArray(row.solution_principles) ? row.solution_principles : [],
    valueMetric: (row.value_metric as string) || undefined,
    basePercentage: (row.base_percentage as string) || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    pillarRatings: arcPillars,
    radarCharts: arcRadars,
  }
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  
  // Get current user's organization
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return {
      totalJourneys: 0,
      activeCollaborators: 1,
      avgEmotionalScore: 0,
      avgEmotionalScoreTrend: 0,
      deployedJourneys: 0,
      healthyDeployed: 0,
    }
  }
  
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) {
    return {
      totalJourneys: 0,
      activeCollaborators: 1,
      avgEmotionalScore: 0,
      avgEmotionalScoreTrend: 0,
      deployedJourneys: 0,
      healthyDeployed: 0,
    }
  }
  
  const orgId = profile.organization_id
  
  const [allJourneys, deployedJourneys, memberCount] = await Promise.all([
    supabase.from("journeys").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
    supabase.from("journeys").select("id, health_status", { count: "exact" }).eq("organization_id", orgId).eq("status", "deployed"),
    supabase.from("organization_members").select("id", { count: "exact", head: true }).eq("organization_id", orgId),
  ])
  
  const deployedCount = deployedJourneys.count || 0
  const healthyCount = (deployedJourneys.data || []).filter(
    (j) => j.health_status === "healthy" || !j.health_status
  ).length
  
  return {
    totalJourneys: allJourneys.count || 0,
    activeCollaborators: memberCount.count || 1,
    avgEmotionalScore: 0,
    avgEmotionalScoreTrend: 0,
    deployedJourneys: deployedCount,
    healthyDeployed: healthyCount,
  }
}

// ---- Pure utility functions (no DB needed) ----

export function getEmotionalArc(journey: Journey) {
  const arc: { stage: string; step: string; score: number; channel: string }[] = []
  for (const stage of journey.stages) {
    for (const step of stage.steps) {
      for (const tp of step.touchPoints) {
        arc.push({
          stage: stage.name,
          step: step.name,
          score: tp.emotionalScore,
          channel: tp.channel,
        })
      }
    }
  }
  return arc
}

export function getAllTouchPoints(journey: Journey): Array<TouchPoint & { stageName: string; stepName: string }> {
  const result: Array<TouchPoint & { stageName: string; stepName: string }> = []
  for (const stage of journey.stages) {
    for (const step of stage.steps) {
      for (const tp of step.touchPoints) {
        result.push({ ...tp, stageName: stage.name, stepName: step.name })
      }
    }
  }
  return result
}

export function getEmotionalScoreColor(score: number): string {
  if (score >= 3) return "text-green-600"
  if (score >= 1) return "text-emerald-500"
  if (score >= -1) return "text-yellow-500"
  if (score >= -3) return "text-orange-500"
  return "text-red-500"
}

export function getEmotionalScoreBg(score: number): string {
  if (score >= 3) return "bg-green-100 text-green-700"
  if (score >= 1) return "bg-emerald-100 text-emerald-700"
  if (score >= -1) return "bg-yellow-100 text-yellow-700"
  if (score >= -3) return "bg-orange-100 text-orange-700"
  return "bg-red-100 text-red-700"
}

export function getHealthStatusColor(status: string): string {
  switch (status) {
    case "healthy": return "text-green-600"
    case "warning": return "text-yellow-500"
    case "critical": return "text-red-500"
    default: return "text-muted-foreground"
  }
}

export function getHealthStatusBg(status: string): string {
  switch (status) {
    case "healthy": return "bg-green-100 text-green-700"
    case "warning": return "bg-yellow-100 text-yellow-700"
    case "critical": return "bg-red-100 text-red-700"
    default: return "bg-muted text-muted-foreground"
  }
}

// ---- Static data that stays in code for now (no DB table needed) ----

export const healthIndicators: HealthIndicator[] = [
  { label: "Data Freshness", value: 92, status: "healthy", description: "Last data update was 2 hours ago" },
  { label: "Coverage", value: 78, status: "warning", description: "3 stages missing touchpoint data" },
  { label: "Feedback Score", value: 85, status: "healthy", description: "Based on recent NPS surveys" },
]

export const opportunities: Opportunity[] = [
  { id: "opp-1", title: "Simplify onboarding flow", description: "Reduce steps in the registration process to decrease drop-off. Analysis shows 40% of users abandon at step 3.", impact: "high", effort: "medium", stage: "Onboarding", priority: 1, status: "proposed" },
  { id: "opp-2", title: "Add live chat support", description: "Introduce real-time support during checkout to address cart abandonment. Expected to reduce abandonment by 15%.", impact: "medium", effort: "high", stage: "Purchase", priority: 2, status: "in_progress" },
  { id: "opp-3", title: "Personalized recommendations", description: "Use browsing history to provide tailored product suggestions. Can increase average order value by 20%.", impact: "high", effort: "high", stage: "Exploration", priority: 3, status: "proposed" },
  { id: "opp-4", title: "Streamline returns process", description: "Simplify the return initiation flow from 5 steps to 2. Will improve post-purchase satisfaction scores.", impact: "medium", effort: "low", stage: "Post-Purchase", priority: 4, status: "proposed" },
]

export const gapAnalysisData: GapAnalysisEntry[] = [
  { stage: "Awareness", current: 65, target: 90, gap: 25, priority: "high" },
  { stage: "Consideration", current: 70, target: 85, gap: 15, priority: "medium" },
  { stage: "Purchase", current: 50, target: 90, gap: 40, priority: "high" },
  { stage: "Onboarding", current: 80, target: 95, gap: 15, priority: "low" },
  { stage: "Usage", current: 75, target: 90, gap: 15, priority: "medium" },
  { stage: "Support", current: 60, target: 85, gap: 25, priority: "high" },
]
