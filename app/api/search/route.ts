import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")?.toLowerCase().trim() || ""
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [], categories: {} })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Get user's organization for filtering
  let orgId: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single()
    orgId = profile?.organization_id || null
  }

  // Parallel queries for all searchable content
  const [
    journeysRes,
    solutionsRes,
    archetypesRes,
    templatesRes,
    stagesRes,
    stepsRes,
    painPointsRes,
    highlightsRes,
  ] = await Promise.all([
    // Search journeys
    supabase
      .from("journeys")
      .select("id, title, description, type, status, category, tags")
      .or(orgId ? `organization_id.eq.${orgId},is_public.eq.true` : `is_public.eq.true`)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search solutions
    supabase
      .from("solutions")
      .select("id, title, description, category, tags")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search archetypes
    supabase
      .from("archetypes")
      .select("id, name, role, description, category, journey_id")
      .or(
        user && orgId
          ? `created_by.eq.${user.id},organization_id.eq.${orgId},visibility.eq.public,visibility.eq.studio`
          : `visibility.eq.public,visibility.eq.studio`
      )
      .or(`name.ilike.%${query}%,role.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search templates (journeys marked as template type)
    supabase
      .from("journeys")
      .select("id, title, description, category, tags")
      .eq("type", "template")
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search stages within journeys
    supabase
      .from("stages")
      .select("id, name, description, journey_id, journeys!inner(title, organization_id, is_public)")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search steps within stages
    supabase
      .from("steps")
      .select("id, name, description, stage_id, stages!inner(journey_id, journeys!inner(title))")
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit),
    
    // Search pain points
    supabase
      .from("pain_points")
      .select("id, text, severity, step_id, steps!inner(name, stage_id, stages!inner(journey_id, journeys!inner(title)))")
      .ilike("text", `%${query}%`)
      .limit(limit),
    
    // Search highlights
    supabase
      .from("highlights")
      .select("id, text, step_id, steps!inner(name, stage_id, stages!inner(journey_id, journeys!inner(title)))")
      .ilike("text", `%${query}%`)
      .limit(limit),
  ])

  // Format results by category
  const results: SearchResult[] = []
  const categories: Record<string, number> = {}

  // Process journeys
  if (journeysRes.data) {
    const items = journeysRes.data.map((j) => ({
      id: j.id,
      type: "journey" as const,
      title: j.title,
      description: j.description?.slice(0, 120) || "",
      url: `/journeys/${j.id}`,
      meta: { type: j.type, status: j.status, category: j.category },
      relevance: calculateRelevance(query, j.title, j.description, j.tags),
    }))
    results.push(...items)
    categories["Journeys"] = items.length
  }

  // Process solutions
  if (solutionsRes.data) {
    const items = solutionsRes.data.map((s) => ({
      id: s.id,
      type: "solution" as const,
      title: s.title,
      description: s.description?.slice(0, 120) || "",
      url: `/solutions?highlight=${s.id}`,
      meta: { category: s.category },
      relevance: calculateRelevance(query, s.title, s.description, s.tags),
    }))
    results.push(...items)
    categories["Solutions"] = items.length
  }

  // Process archetypes
  if (archetypesRes.data) {
    const items = archetypesRes.data.map((a) => ({
      id: a.id,
      type: "archetype" as const,
      title: a.name,
      description: `${a.role || ""} - ${a.description?.slice(0, 100) || ""}`.trim(),
      url: a.journey_id ? `/journeys/${a.journey_id}/archetypes` : `/archetypes`,
      meta: { category: a.category },
      relevance: calculateRelevance(query, a.name, a.description, [a.role || ""]),
    }))
    results.push(...items)
    categories["Archetypes"] = items.length
  }

  // Process templates
  if (templatesRes.data) {
    const items = templatesRes.data.map((t) => ({
      id: t.id,
      type: "template" as const,
      title: t.title,
      description: t.description?.slice(0, 120) || "",
      url: `/templates?preview=${t.id}`,
      meta: { category: t.category },
      relevance: calculateRelevance(query, t.title, t.description, t.tags),
    }))
    results.push(...items)
    categories["Templates"] = items.length
  }

  // Process stages
  if (stagesRes.data) {
    const items = stagesRes.data.map((s) => ({
      id: s.id,
      type: "stage" as const,
      title: s.name,
      description: s.description?.slice(0, 120) || "",
      url: `/journeys/${s.journey_id}/canvas`,
      meta: { journeyTitle: (s.journeys as { title: string })?.title },
      relevance: calculateRelevance(query, s.name, s.description, []),
    }))
    results.push(...items)
    categories["Stages"] = items.length
  }

  // Process steps
  if (stepsRes.data) {
    const items = stepsRes.data.map((s) => {
      const stage = s.stages as { journey_id: string; journeys: { title: string } }
      return {
        id: s.id,
        type: "step" as const,
        title: s.name,
        description: s.description?.slice(0, 120) || "",
        url: `/journeys/${stage?.journey_id}/canvas`,
        meta: { journeyTitle: stage?.journeys?.title },
        relevance: calculateRelevance(query, s.name, s.description, []),
      }
    })
    results.push(...items)
    categories["Steps"] = items.length
  }

  // Process pain points
  if (painPointsRes.data) {
    const items = painPointsRes.data.map((p) => {
      const step = p.steps as { name: string; stage_id: string; stages: { journey_id: string; journeys: { title: string } } }
      return {
        id: p.id,
        type: "pain_point" as const,
        title: `Pain Point: ${p.text.slice(0, 50)}${p.text.length > 50 ? "..." : ""}`,
        description: `Severity: ${p.severity} - Found in "${step?.name || "Unknown step"}"`,
        url: `/journeys/${step?.stages?.journey_id}/canvas`,
        meta: { severity: p.severity, journeyTitle: step?.stages?.journeys?.title },
        relevance: calculateRelevance(query, p.text, "", []) * (p.severity === "critical" ? 1.2 : 1),
      }
    })
    results.push(...items)
    categories["Pain Points"] = items.length
  }

  // Process highlights
  if (highlightsRes.data) {
    const items = highlightsRes.data.map((h) => {
      const step = h.steps as { name: string; stage_id: string; stages: { journey_id: string; journeys: { title: string } } }
      return {
        id: h.id,
        type: "highlight" as const,
        title: `Highlight: ${h.text.slice(0, 50)}${h.text.length > 50 ? "..." : ""}`,
        description: `Found in "${step?.name || "Unknown step"}"`,
        url: `/journeys/${step?.stages?.journey_id}/canvas`,
        meta: { journeyTitle: step?.stages?.journeys?.title },
        relevance: calculateRelevance(query, h.text, "", []),
      }
    })
    results.push(...items)
    categories["Highlights"] = items.length
  }

  // Sort by relevance and limit
  results.sort((a, b) => b.relevance - a.relevance)
  const topResults = results.slice(0, limit)

  return NextResponse.json({
    results: topResults,
    categories,
    total: results.length,
    query,
  })
}

interface SearchResult {
  id: string
  type: "journey" | "solution" | "archetype" | "template" | "stage" | "step" | "pain_point" | "highlight"
  title: string
  description: string
  url: string
  meta: Record<string, unknown>
  relevance: number
}

// Calculate relevance score for ranking results
function calculateRelevance(
  query: string,
  title: string | null,
  description: string | null,
  tags: string[] | null
): number {
  let score = 0
  const q = query.toLowerCase()
  const t = (title || "").toLowerCase()
  const d = (description || "").toLowerCase()
  const tagStr = (tags || []).join(" ").toLowerCase()

  // Exact title match is highest
  if (t === q) score += 100
  // Title starts with query
  else if (t.startsWith(q)) score += 80
  // Title contains query
  else if (t.includes(q)) score += 60

  // Description contains query
  if (d.includes(q)) score += 30

  // Tags contain query
  if (tagStr.includes(q)) score += 20

  // Word boundary matches
  const words = q.split(/\s+/)
  for (const word of words) {
    if (word.length >= 2) {
      if (t.includes(word)) score += 10
      if (d.includes(word)) score += 5
    }
  }

  return score
}
