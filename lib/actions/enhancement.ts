"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { EnhancementChange } from "@/lib/types"
import { v4 as uuid } from "uuid"

export interface ApplyChangesResult {
  success: boolean
  appliedCount: number
  failedCount: number
  appliedChangeIds: string[]
  errors: { changeId: string; error: string }[]
}

export async function applyEnhancementChanges(
  journeyId: string,
  changes: EnhancementChange[]
): Promise<ApplyChangesResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, appliedCount: 0, failedCount: changes.length, appliedChangeIds: [], errors: [{ changeId: "auth", error: "Not authenticated" }] }
  }

  const appliedChangeIds: string[] = []
  const errors: { changeId: string; error: string }[] = []

  for (const change of changes) {
    try {
      switch (change.type) {
        case "add":
          await applyAddChange(supabase, journeyId, change)
          break
        case "modify":
          await applyModifyChange(supabase, change)
          break
        case "remove":
          await applyRemoveChange(supabase, change)
          break
      }
      appliedChangeIds.push(change.id)
    } catch (error) {
      errors.push({ 
        changeId: change.id, 
        error: error instanceof Error ? error.message : "Unknown error" 
      })
    }
  }

  // Create version snapshot after changes
  await createVersionSnapshot(supabase, journeyId, user.id, changes.length, appliedChangeIds.length)

  revalidatePath(`/journeys/${journeyId}`)
  revalidatePath(`/journeys/${journeyId}/canvas`)

  return {
    success: errors.length === 0,
    appliedCount: appliedChangeIds.length,
    failedCount: errors.length,
    appliedChangeIds,
    errors,
  }
}

async function applyAddChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  journeyId: string,
  change: EnhancementChange
) {
  switch (change.targetType) {
    case "stage": {
      // Get current max order
      const { data: stages } = await supabase
        .from("stages")
        .select("order")
        .eq("journey_id", journeyId)
        .order("order", { ascending: false })
        .limit(1)
      
      const maxOrder = stages?.[0]?.order ?? -1
      
      await supabase.from("stages").insert({
        id: uuid(),
        journey_id: journeyId,
        name: change.data.name || "New Stage",
        order: change.data.order ?? maxOrder + 1,
      })
      break
    }
    
    case "step": {
      if (!change.parentId) throw new Error("parentId required for step")
      
      // Get current max order in stage
      const { data: steps } = await supabase
        .from("steps")
        .select("order")
        .eq("stage_id", change.parentId)
        .order("order", { ascending: false })
        .limit(1)
      
      const maxOrder = steps?.[0]?.order ?? -1
      
      await supabase.from("steps").insert({
        id: uuid(),
        stage_id: change.parentId,
        name: change.data.name || "New Step",
        description: change.data.description,
        order: change.data.order ?? maxOrder + 1,
      })
      break
    }
    
    case "touchpoint": {
      if (!change.parentId) throw new Error("parentId required for touchpoint")
      
      await supabase.from("touch_points").insert({
        id: uuid(),
        step_id: change.parentId,
        channel: change.data.channel || "Website",
        description: change.data.description || "",
        emotional_score: change.data.emotionalScore ?? 0,
      })
      break
    }
    
    case "painPoint": {
      if (!change.parentId) throw new Error("parentId required for painPoint")
      
      await supabase.from("pain_points").insert({
        id: uuid(),
        touch_point_id: change.parentId,
        description: change.data.description || "",
        severity: change.data.severity || "medium",
        is_ai_generated: true,
      })
      break
    }
    
    case "highlight": {
      if (!change.parentId) throw new Error("parentId required for highlight")
      
      await supabase.from("highlights").insert({
        id: uuid(),
        touch_point_id: change.parentId,
        description: change.data.description || "",
        impact: change.data.impact || "medium",
        is_ai_generated: true,
      })
      break
    }
  }
}

async function applyModifyChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  change: EnhancementChange
) {
  if (!change.targetId) throw new Error("targetId required for modify")
  
  switch (change.targetType) {
    case "stage": {
      const updates: Record<string, unknown> = {}
      if (change.data.name) updates.name = change.data.name
      if (change.data.order !== undefined) updates.order = change.data.order
      
      await supabase.from("stages").update(updates).eq("id", change.targetId)
      break
    }
    
    case "step": {
      const updates: Record<string, unknown> = {}
      if (change.data.name) updates.name = change.data.name
      if (change.data.description) updates.description = change.data.description
      if (change.data.order !== undefined) updates.order = change.data.order
      
      await supabase.from("steps").update(updates).eq("id", change.targetId)
      break
    }
    
    case "touchpoint": {
      const updates: Record<string, unknown> = {}
      if (change.data.channel) updates.channel = change.data.channel
      if (change.data.description) updates.description = change.data.description
      if (change.data.emotionalScore !== undefined) updates.emotional_score = change.data.emotionalScore
      
      await supabase.from("touch_points").update(updates).eq("id", change.targetId)
      break
    }
    
    case "painPoint": {
      const updates: Record<string, unknown> = {}
      if (change.data.description) updates.description = change.data.description
      if (change.data.severity) updates.severity = change.data.severity
      
      await supabase.from("pain_points").update(updates).eq("id", change.targetId)
      break
    }
    
    case "highlight": {
      const updates: Record<string, unknown> = {}
      if (change.data.description) updates.description = change.data.description
      if (change.data.impact) updates.impact = change.data.impact
      
      await supabase.from("highlights").update(updates).eq("id", change.targetId)
      break
    }
  }
}

async function applyRemoveChange(
  supabase: Awaited<ReturnType<typeof createClient>>,
  change: EnhancementChange
) {
  if (!change.targetId) throw new Error("targetId required for remove")
  
  const tableMap = {
    stage: "stages",
    step: "steps",
    touchpoint: "touch_points",
    painPoint: "pain_points",
    highlight: "highlights",
  }
  
  const table = tableMap[change.targetType]
  if (!table) throw new Error(`Unknown target type: ${change.targetType}`)
  
  await supabase.from(table).delete().eq("id", change.targetId)
}

async function createVersionSnapshot(
  supabase: Awaited<ReturnType<typeof createClient>>,
  journeyId: string,
  userId: string,
  totalChanges: number,
  appliedChanges: number
) {
  // Fetch current journey state
  const { data: stages } = await supabase
    .from("stages")
    .select(`
      id, name, order,
      steps:steps(
        id, name, description, order,
        touchPoints:touch_points(
          id, channel, description, emotional_score,
          painPoints:pain_points(id, description, severity),
          highlights:highlights(id, description, impact)
        )
      )
    `)
    .eq("journey_id", journeyId)
    .order("order")

  // Get latest version number
  const { data: latestVersion } = await supabase
    .from("journey_versions")
    .select("version_number, version_label")
    .eq("journey_id", journeyId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1
  
  // Calculate next version label (minor change for enhancement)
  const currentLabel = latestVersion?.version_label || "1.0"
  const [major, minor] = currentLabel.split(".").map(Number)
  const nextLabel = `${major}.${(minor || 0) + 1}`

  await supabase.from("journey_versions").insert({
    journey_id: journeyId,
    version_number: nextVersionNumber,
    version_label: nextLabel,
    change_type: "medium",
    label: "AI Enhancement",
    snapshot: { stages },
    created_by: userId,
    changes_summary: `Applied ${appliedChanges} of ${totalChanges} AI-suggested enhancements.`,
  })
}
