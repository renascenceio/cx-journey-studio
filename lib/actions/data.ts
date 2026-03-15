"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

// Helper to log activity with organization_id
async function logActivity(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  action: string,
  details: string,
  journeyId?: string,
  extra?: { stage_id?: string; step_id?: string; comment_preview?: string }
) {
  // Get user's organization_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", userId)
    .single()
  
  await supabase.from("activity_log").insert({
    action,
    actor_id: userId,
    journey_id: journeyId,
    details,
    organization_id: profile?.organization_id,
    ...extra,
  })
}

// Helper to create notifications
async function createNotification(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  type: "comment" | "mention" | "status_change" | "share" | "health_alert" | "system",
  message: string,
  link?: string
) {
  await supabase.from("notifications").insert({
    user_id: userId,
    type,
    message,
    link,
  })
}
/** When a deployed journey is edited, auto-promote it to "future" status */
async function autoPromoteDeployed(supabase: Awaited<ReturnType<typeof createClient>>, journeyId: string) {
  const { data } = await supabase
    .from("journeys")
    .select("status")
    .eq("id", journeyId)
    .single()
  if (data?.status === "deployed") {
    await supabase
      .from("journeys")
      .update({ type: "future", status: "draft" })
      .eq("id", journeyId)
  }
}

export async function createJourney(formData: {
  title: string
  description?: string
  type: "current" | "future" | "deployed"
  category?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get user's profile for org/team
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!profile?.organization_id) throw new Error("No organization found")

  // Get first team in org
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .limit(1)
    .single()

  const { data: journey, error } = await supabase
    .from("journeys")
    .insert({
      title: formData.title,
      description: formData.description || "",
      type: formData.type,
      category: formData.category || "retail",
      status: "draft",
      owner_id: user.id,
      organization_id: profile.organization_id,
      team_id: team?.id,
      tags: formData.tags || [],
      health_status: "unknown",
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Add creator as collaborator
  await supabase.from("collaborators").insert({
    journey_id: journey.id,
    user_id: user.id,
    role: "journey_master",
  })

  // Log activity
  await logActivity(supabase, user.id, "created", `Created ${formData.title}`, journey.id)

  // Add 3 default stages
  const defaultStages = ["Awareness", "Engagement", "Outcome"]
  for (let i = 0; i < defaultStages.length; i++) {
    await supabase.from("stages").insert({
      journey_id: journey.id,
      name: defaultStages[i],
      order: i,
    })
  }

  revalidatePath("/journeys")
  revalidatePath("/dashboard")

  return { id: journey.id }
}

export async function createJourneyFromImport(parsedJourney: {
  title: string
  description: string | null
  stages: {
    name: string
    steps: {
      name: string
      description: string | null
      touchPoints: {
        channel: string
        description: string
        emotionalScore: number
        painPoints: { description: string; severity: string }[]
        highlights: { description: string; impact: string }[]
      }[]
    }[]
  }[]
  suggestedTags: string[]
  suggestedType: "current" | "future" | "template"
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get user's profile for org/team
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!profile?.organization_id) throw new Error("No organization found")

  // Get first team in org
  const { data: team } = await supabase
    .from("teams")
    .select("id")
    .eq("organization_id", profile.organization_id)
    .limit(1)
    .single()

  // Map template type to current (templates are just current journeys used as templates)
  const journeyType = parsedJourney.suggestedType === "template" ? "current" : parsedJourney.suggestedType

  // Create the journey
  const { data: journey, error: journeyError } = await supabase
    .from("journeys")
    .insert({
      title: parsedJourney.title,
      description: parsedJourney.description || "",
      type: journeyType,
      category: "retail",
      status: "draft",
      owner_id: user.id,
      organization_id: profile.organization_id,
      team_id: team?.id,
      tags: parsedJourney.suggestedTags || [],
      health_status: "unknown",
    })
    .select("id")
    .single()

  if (journeyError) throw new Error(journeyError.message)

  // Add creator as collaborator
  await supabase.from("collaborators").insert({
    journey_id: journey.id,
    user_id: user.id,
    role: "journey_master",
  })

  // Create all stages, steps, touchpoints, pain points, and highlights
  for (let stageOrder = 0; stageOrder < parsedJourney.stages.length; stageOrder++) {
    const stage = parsedJourney.stages[stageOrder]

    const { data: stageData, error: stageError } = await supabase
      .from("stages")
      .insert({
        journey_id: journey.id,
        name: stage.name,
        order: stageOrder,
      })
      .select("id")
      .single()

    if (stageError) {
      console.error("Stage insert error:", stageError)
      continue
    }

    for (let stepOrder = 0; stepOrder < stage.steps.length; stepOrder++) {
      const step = stage.steps[stepOrder]

      const { data: stepData, error: stepError } = await supabase
        .from("steps")
        .insert({
          stage_id: stageData.id,
          name: step.name,
          description: step.description || "",
          order: stepOrder,
        })
        .select("id")
        .single()

      if (stepError) {
        console.error("Step insert error:", stepError)
        continue
      }

      for (const touchPoint of step.touchPoints) {
        const { data: tpData, error: tpError } = await supabase
          .from("touch_points")
          .insert({
            step_id: stepData.id,
            channel: touchPoint.channel,
            description: touchPoint.description,
            emotional_score: touchPoint.emotionalScore,
          })
          .select("id")
          .single()

        if (tpError) {
          console.error("TouchPoint insert error:", tpError)
          continue
        }

        // Insert pain points
        for (const painPoint of touchPoint.painPoints) {
          await supabase.from("pain_points").insert({
            touch_point_id: tpData.id,
            description: painPoint.description,
            severity: painPoint.severity,
          })
        }

        // Insert highlights
        for (const highlight of touchPoint.highlights) {
          await supabase.from("highlights").insert({
            touch_point_id: tpData.id,
            description: highlight.description,
            impact: highlight.impact,
          })
        }
      }
    }
  }

  // Log activity
  await logActivity(supabase, user.id, "created", `Imported "${parsedJourney.title}" with ${parsedJourney.stages.length} stages`, journey.id)

  revalidatePath("/journeys")
  revalidatePath("/dashboard")

  return { id: journey.id }
}

export async function createArchetype(formData: {
  journeyId: string
  name: string
  role: string
  subtitle?: string
  category: string
  description?: string
  goals?: string[]
  frustrations?: string[]
  behaviors?: string[]
  expectations?: string[]
  barriers?: string[]
  drivers?: string[]
  importantSteps?: string[]
  triggers?: string[]
  mindset?: string[]
  solutionPrinciples?: string[]
  goalsNarrative?: string
  needsNarrative?: string
  touchpointsNarrative?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: archetype, error } = await supabase
    .from("archetypes")
    .insert({
      journey_id: formData.journeyId,
      name: formData.name,
      role: formData.role,
      subtitle: formData.subtitle || null,
      category: formData.category,
      description: formData.description || null,
      goals: formData.goals || [],
      frustrations: formData.frustrations || [],
      behaviors: formData.behaviors || [],
      expectations: formData.expectations || [],
      barriers: formData.barriers || [],
      drivers: formData.drivers || [],
      important_steps: formData.importantSteps || [],
      triggers: formData.triggers || [],
      mindset: formData.mindset || [],
      solution_principles: formData.solutionPrinciples || [],
      goals_narrative: formData.goalsNarrative || null,
      needs_narrative: formData.needsNarrative || null,
      touchpoints_narrative: formData.touchpointsNarrative || null,
      tags: [],
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Log activity
  await logActivity(supabase, user.id, "edited", `Added archetype "${formData.name}"`, formData.journeyId)

  revalidatePath("/archetypes")
  revalidatePath(`/journeys/${formData.journeyId}`)

  return { id: archetype.id }
}

export async function addComment(formData: {
  journeyId: string
  content: string
  stageId?: string
  stepId?: string
  touchpointId?: string
  parentId?: string
  mentions?: string[]
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get current user profile for the notification message
  const { data: profile } = await supabase
    .from("profiles")
    .select("name")
    .eq("id", user.id)
    .single()
  
  const authorName = profile?.name || "Someone"

  // Get journey title for the notification
  const { data: journey } = await supabase
    .from("journeys")
    .select("title")
    .eq("id", formData.journeyId)
    .single()
  
  const journeyTitle = journey?.title || "a journey"

  const { error } = await supabase.from("comments").insert({
    journey_id: formData.journeyId,
    content: formData.content,
    author_id: user.id,
    stage_id: formData.stageId || null,
    step_id: formData.stepId || null,
    touchpoint_id: formData.touchpointId || null,
    parent_id: formData.parentId || null,
    mentions: formData.mentions || [],
  })

  if (error) throw new Error(error.message)

  // Send notifications to mentioned users
  if (formData.mentions && formData.mentions.length > 0) {
    console.log("[v0] Processing mentions:", formData.mentions, "Current user:", user.id)
    for (const mentionedUserId of formData.mentions) {
      // Don't notify yourself
      if (mentionedUserId !== user.id) {
        console.log("[v0] Creating mention notification for:", mentionedUserId)
        await createNotification(
          supabase,
          mentionedUserId,
          "mention",
          `${authorName} mentioned you in a comment on "${journeyTitle}"`,
          `/journeys/${formData.journeyId}/canvas`
        )
      } else {
        console.log("[v0] Skipping self-mention notification for:", mentionedUserId)
      }
    }
  }

  revalidatePath(`/journeys/${formData.journeyId}`)
}

export async function resolveComment(commentId: string, journeyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("comments").update({ resolved: true }).eq("id", commentId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function updateJourneyStatus(journeyId: string, status: string, typeOverride?: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const update: Record<string, string> = { status }

  // When deploying, also change type to "deployed"
  if (status === "deployed") {
    update.type = "deployed"
  }
  // When promoting to "review" from current, move type to "future"
  if (typeOverride) {
    update.type = typeOverride
  }

  const { error } = await supabase.from("journeys").update(update).eq("id", journeyId)
  if (error) throw new Error(error.message)

  // Log activity
  await logActivity(supabase, user.id, "status_changed", `Status changed to ${status}${typeOverride ? `, type changed to ${typeOverride}` : ""}`, journeyId)

  // JDS-041: Auto-create a version snapshot on promotion/demotion
  if (typeOverride || status === "deployed") {
    const targetType = typeOverride || "deployed"
    // Get current version number
    const { data: latest } = await supabase
      .from("journey_versions")
      .select("version_number")
      .eq("journey_id", journeyId)
      .order("version_number", { ascending: false })
      .limit(1)
      .single()
    const nextVer = latest ? latest.version_number + 1 : 1
    await supabase.from("journey_versions").insert({
      journey_id: journeyId,
      version_number: nextVer,
      label: `Auto: ${targetType === "deployed" ? "Deployed" : targetType.charAt(0).toUpperCase() + targetType.slice(1)} (v${nextVer})`,
      snapshot: { status, type: targetType, auto: true },
      created_by: user.id,
      changes_summary: `Automatically versioned on ${typeOverride ? "type change" : "deployment"} to ${targetType}.`,
    })
  }

  revalidatePath(`/journeys/${journeyId}`)
  revalidatePath("/journeys")
  revalidatePath("/dashboard")
}

export async function createJourneyVersion(
  journeyId: string, 
  label: string, 
  snapshot: object, 
  changesSummary: string,
  options?: {
    isRegeneration?: boolean
    changeType?: "minor" | "medium" | "major"
    versionLabel?: string
  }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Import version utilities
  const { calculateVersionChange } = await import("@/lib/utils")

  // Get the latest version with its snapshot and version label
  const { data: latest } = await supabase
    .from("journey_versions")
    .select("version_number, snapshot, version_label, change_type")
    .eq("journey_id", journeyId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single()

  const nextVersionNumber = latest ? latest.version_number + 1 : 1
  
  // Determine the current version label - use stored label, or derive from version_number if not set
  const currentVersionLabel = latest?.version_label || (latest ? `${latest.version_number}.0` : "1.0")
  
  // Calculate semantic version
  const versionChange = calculateVersionChange(
    latest?.snapshot as { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null,
    snapshot as { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null,
    currentVersionLabel,
    options?.isRegeneration || false
  )
  
  // Use provided values or calculated ones
  const finalChangeType = options?.changeType || versionChange.changeType
  const finalVersionLabel = options?.versionLabel || versionChange.nextVersionLabel

  const { error } = await supabase.from("journey_versions").insert({
    journey_id: journeyId,
    version_number: nextVersionNumber,
    version_label: finalVersionLabel,
    change_type: finalChangeType,
    label,
    snapshot,
    created_by: user.id,
    changes_summary: changesSummary,
  })

  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}/versions`)
}

// ========================
// Canvas CRUD Actions
// ========================

export async function addStage(journeyId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await autoPromoteDeployed(supabase, journeyId)

  // Get next order number
  const { data: stages } = await supabase
    .from("stages")
    .select("order")
    .eq("journey_id", journeyId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = stages && stages.length > 0 ? stages[0].order + 1 : 0

  const { data, error } = await supabase
    .from("stages")
    .insert({ journey_id: journeyId, name, order: nextOrder })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  await logActivity(supabase, user.id, "edited", `Added stage "${name}"`, journeyId)

  revalidatePath(`/journeys/${journeyId}`)
  return { id: data.id }
}

export async function updateStage(stageId: string, journeyId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("stages").update({ name }).eq("id", stageId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function deleteStage(stageId: string, journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("stages").delete().eq("id", stageId)
  if (error) throw new Error(error.message)

  await logActivity(supabase, user.id, "edited", "Deleted a stage", journeyId)

  revalidatePath(`/journeys/${journeyId}`)
}

// Get full stage data for undo functionality
export async function getStageWithChildren(stageId: string) {
  const supabase = await createClient()
  
  // Get stage
  const { data: stage } = await supabase
    .from("stages")
    .select("*")
    .eq("id", stageId)
    .single()
  
  if (!stage) return null
  
  // Get steps
  const { data: steps } = await supabase
    .from("steps")
    .select("*")
    .eq("stage_id", stageId)
  
  // Get touchpoints for each step
  const stepIds = steps?.map(s => s.id) || []
  const { data: touchPoints } = stepIds.length > 0
    ? await supabase
        .from("touch_points")
        .select("*")
        .in("step_id", stepIds)
    : { data: [] }
  
  // Get pain points and highlights for each touchpoint
  const tpIds = touchPoints?.map(tp => tp.id) || []
  const { data: painPoints } = tpIds.length > 0
    ? await supabase.from("pain_points").select("*").in("touch_point_id", tpIds)
    : { data: [] }
  const { data: highlights } = tpIds.length > 0
    ? await supabase.from("highlights").select("*").in("touch_point_id", tpIds)
    : { data: [] }
  
  return { stage, steps: steps || [], touchPoints: touchPoints || [], painPoints: painPoints || [], highlights: highlights || [] }
}

// Restore a deleted stage with all its children
export async function restoreStage(stageData: {
  stage: Record<string, unknown>
  steps: Record<string, unknown>[]
  touchPoints: Record<string, unknown>[]
  painPoints: Record<string, unknown>[]
  highlights: Record<string, unknown>[]
}, journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  // Restore stage
  await supabase.from("stages").insert(stageData.stage)
  
  // Restore steps
  if (stageData.steps.length > 0) {
    await supabase.from("steps").insert(stageData.steps)
  }
  
  // Restore touchpoints
  if (stageData.touchPoints.length > 0) {
    await supabase.from("touch_points").insert(stageData.touchPoints)
  }
  
  // Restore pain points
  if (stageData.painPoints.length > 0) {
    await supabase.from("pain_points").insert(stageData.painPoints)
  }
  
  // Restore highlights
  if (stageData.highlights.length > 0) {
    await supabase.from("highlights").insert(stageData.highlights)
  }
  
  await logActivity(supabase, user.id, "edited", "Restored a stage", journeyId)
  
  revalidatePath(`/journeys/${journeyId}`)
}

export async function reorderStages(journeyId: string, stageIds: string[]) {
  const supabase = await createClient()
  for (let i = 0; i < stageIds.length; i++) {
    await supabase.from("stages").update({ order: i }).eq("id", stageIds[i])
  }
  revalidatePath(`/journeys/${journeyId}`)
}

export async function addStep(stageId: string, journeyId: string, name: string, description?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await autoPromoteDeployed(supabase, journeyId)

  const { data: steps } = await supabase
    .from("steps")
    .select("order")
    .eq("stage_id", stageId)
    .order("order", { ascending: false })
    .limit(1)

  const nextOrder = steps && steps.length > 0 ? steps[0].order + 1 : 0

  const { data, error } = await supabase
    .from("steps")
    .insert({ stage_id: stageId, name, description: description || "", order: nextOrder })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  await logActivity(supabase, user.id, "edited", `Added step "${name}"`, journeyId)

  revalidatePath(`/journeys/${journeyId}`)
  return { id: data.id }
}

export async function updateStep(stepId: string, journeyId: string, data: { name?: string; description?: string }) {
  const supabase = await createClient()
  const { error } = await supabase.from("steps").update(data).eq("id", stepId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function deleteStep(stepId: string, journeyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("steps").delete().eq("id", stepId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function reorderSteps(stageId: string, journeyId: string, stepIds: string[]) {
  const supabase = await createClient()
  for (let i = 0; i < stepIds.length; i++) {
    await supabase.from("steps").update({ order: i }).eq("id", stepIds[i])
  }
  revalidatePath(`/journeys/${journeyId}`)
}

export async function addTouchPoint(stepId: string, journeyId: string, data: {
  channel: string; description: string; emotionalScore: number
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  await autoPromoteDeployed(supabase, journeyId)

  const { data: tp, error } = await supabase
    .from("touch_points")
    .insert({
      step_id: stepId,
      channel: data.channel,
      description: data.description,
      emotional_score: data.emotionalScore,
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  await logActivity(supabase, user.id, "edited", `Added touch point in ${data.channel}`, journeyId)

  revalidatePath(`/journeys/${journeyId}`)
  return { id: tp.id }
}

export async function updateTouchPoint(tpId: string, journeyId: string, data: {
  channel?: string; description?: string; emotionalScore?: number
}) {
  const supabase = await createClient()
  const update: Record<string, unknown> = {}
  if (data.channel !== undefined) update.channel = data.channel
  if (data.description !== undefined) update.description = data.description
  if (data.emotionalScore !== undefined) update.emotional_score = data.emotionalScore

  const { error } = await supabase.from("touch_points").update(update).eq("id", tpId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function deleteTouchPoint(tpId: string, journeyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("touch_points").delete().eq("id", tpId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function duplicateJourney(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Get original journey
  const { data: original } = await supabase.from("journeys").select("*").eq("id", journeyId).single()
  if (!original) throw new Error("Journey not found")

  // Create copy
  const { data: newJourney, error } = await supabase
    .from("journeys")
    .insert({
      title: `${original.title} (Copy)`,
      description: original.description,
      type: original.type,
      status: "draft",
      owner_id: user.id,
      organization_id: original.organization_id,
      team_id: original.team_id,
      tags: original.tags,
      health_status: "unknown",
    })
    .select("id")
    .single()

  if (error) throw new Error(error.message)

  // Copy stages, steps, touchpoints
  const { data: stages } = await supabase.from("stages").select("*").eq("journey_id", journeyId).order("order")
  for (const stage of stages || []) {
    const { data: newStage } = await supabase
      .from("stages")
      .insert({ journey_id: newJourney.id, name: stage.name, order: stage.order })
      .select("id")
      .single()

    if (!newStage) continue

    const { data: steps } = await supabase.from("steps").select("*").eq("stage_id", stage.id).order("order")
    for (const step of steps || []) {
      const { data: newStep } = await supabase
        .from("steps")
        .insert({ stage_id: newStage.id, name: step.name, description: step.description, order: step.order })
        .select("id")
        .single()

      if (!newStep) continue

      const { data: tps } = await supabase.from("touch_points").select("*").eq("step_id", step.id)
      for (const tp of tps || []) {
        await supabase.from("touch_points").insert({
          step_id: newStep.id,
          channel: tp.channel,
          description: tp.description,
          emotional_score: tp.emotional_score,
        })
      }
    }
  }

  // Add collaborator
  await supabase.from("collaborators").insert({
    journey_id: newJourney.id, user_id: user.id, role: "journey_master",
  })

  await logActivity(supabase, user.id, "created", `Duplicated from "${original.title}"`, newJourney.id)

  revalidatePath("/journeys")
  revalidatePath("/dashboard")
  return { id: newJourney.id }
}

// Get full touchpoint data for undo functionality
export async function getTouchPointWithChildren(tpId: string) {
  const supabase = await createClient()
  
  const { data: touchPoint } = await supabase
    .from("touch_points")
    .select("*")
    .eq("id", tpId)
    .single()
  
  if (!touchPoint) return null
  
  const { data: painPoints } = await supabase
    .from("pain_points")
    .select("*")
    .eq("touch_point_id", tpId)
  
  const { data: highlights } = await supabase
    .from("highlights")
    .select("*")
    .eq("touch_point_id", tpId)
  
  const { data: evidence } = await supabase
    .from("evidence")
    .select("*")
    .eq("touch_point_id", tpId)
  
  return { touchPoint, painPoints: painPoints || [], highlights: highlights || [], evidence: evidence || [] }
}

// Restore a deleted touchpoint with all its children
export async function restoreTouchPoint(tpData: {
  touchPoint: Record<string, unknown>
  painPoints: Record<string, unknown>[]
  highlights: Record<string, unknown>[]
  evidence: Record<string, unknown>[]
}, journeyId: string) {
  const supabase = await createClient()
  
  await supabase.from("touch_points").insert(tpData.touchPoint)
  
  if (tpData.painPoints.length > 0) {
    await supabase.from("pain_points").insert(tpData.painPoints)
  }
  
  if (tpData.highlights.length > 0) {
    await supabase.from("highlights").insert(tpData.highlights)
  }
  
  if (tpData.evidence.length > 0) {
    await supabase.from("evidence").insert(tpData.evidence)
  }
  
  revalidatePath(`/journeys/${journeyId}`)
}

// Get full step data for undo functionality
export async function getStepWithChildren(stepId: string) {
  const supabase = await createClient()
  
  const { data: step } = await supabase
    .from("steps")
    .select("*")
    .eq("id", stepId)
    .single()
  
  if (!step) return null
  
  const { data: touchPoints } = await supabase
    .from("touch_points")
    .select("*")
    .eq("step_id", stepId)
  
  const tpIds = touchPoints?.map(tp => tp.id) || []
  const { data: painPoints } = tpIds.length > 0
    ? await supabase.from("pain_points").select("*").in("touch_point_id", tpIds)
    : { data: [] }
  const { data: highlights } = tpIds.length > 0
    ? await supabase.from("highlights").select("*").in("touch_point_id", tpIds)
    : { data: [] }
  const { data: evidence } = tpIds.length > 0
    ? await supabase.from("evidence").select("*").in("touch_point_id", tpIds)
    : { data: [] }
  
  return { step, touchPoints: touchPoints || [], painPoints: painPoints || [], highlights: highlights || [], evidence: evidence || [] }
}

// Restore a deleted step with all its children
export async function restoreStep(stepData: {
  step: Record<string, unknown>
  touchPoints: Record<string, unknown>[]
  painPoints: Record<string, unknown>[]
  highlights: Record<string, unknown>[]
  evidence: Record<string, unknown>[]
}, journeyId: string) {
  const supabase = await createClient()
  
  await supabase.from("steps").insert(stepData.step)
  
  if (stepData.touchPoints.length > 0) {
    await supabase.from("touch_points").insert(stepData.touchPoints)
  }
  
  if (stepData.painPoints.length > 0) {
    await supabase.from("pain_points").insert(stepData.painPoints)
  }
  
  if (stepData.highlights.length > 0) {
    await supabase.from("highlights").insert(stepData.highlights)
  }
  
  if (stepData.evidence.length > 0) {
    await supabase.from("evidence").insert(stepData.evidence)
  }
  
  revalidatePath(`/journeys/${journeyId}`)
}

export async function addEvidence(touchPointId: string, journeyId: string, data: {
  type: "screenshot" | "recording" | "survey" | "analytics" | "document"
  url: string
  label: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("evidence").insert({
    touch_point_id: touchPointId,
    type: data.type,
    url: data.url,
    label: data.label,
  })
  if (error) throw new Error(error.message)

  await logActivity(supabase, user.id, "edited", `Attached evidence "${data.label}"`, journeyId)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function toggleJourneyVisibility(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: journey } = await supabase
    .from("journeys")
    .select("is_public")
    .eq("id", journeyId)
    .single()

  if (!journey) throw new Error("Journey not found")

  const newVisibility = !journey.is_public
  const { error } = await supabase
    .from("journeys")
    .update({ is_public: newVisibility })
    .eq("id", journeyId)

  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
  revalidatePath(`/journeys`)
  return { isPublic: newVisibility }
}

export async function updatePainPoint(painPointId: string, journeyId: string, data: { description?: string; severity?: string; emotionalScore?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const updateData: Record<string, unknown> = {}
  if (data.description !== undefined) updateData.description = data.description
  if (data.severity !== undefined) updateData.severity = data.severity
  if (data.emotionalScore !== undefined) updateData.emotional_score = data.emotionalScore
  
  const { error } = await supabase
    .from("pain_points")
    .update(updateData)
    .eq("id", painPointId)
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function deletePainPoint(painPointId: string, journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { error } = await supabase
    .from("pain_points")
    .delete()
    .eq("id", painPointId)
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function updateHighlight(highlightId: string, journeyId: string, data: { description?: string; impact?: string; emotionalScore?: number }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const updateData: Record<string, unknown> = {}
  if (data.description !== undefined) updateData.description = data.description
  if (data.impact !== undefined) updateData.impact = data.impact
  if (data.emotionalScore !== undefined) updateData.emotional_score = data.emotionalScore
  
  const { error } = await supabase
    .from("highlights")
    .update(updateData)
    .eq("id", highlightId)
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function deleteHighlight(highlightId: string, journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { error } = await supabase
    .from("highlights")
    .delete()
    .eq("id", highlightId)
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function createAutoJourneyVersion(journeyId: string, changesSummary: string = "Manual save"): Promise<{ versionNumber: number; versionLabel?: string; changeType?: string; noChanges?: boolean }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  // Get current journey data for snapshot
  const { data: journey } = await supabase
    .from("journeys")
    .select("*")
    .eq("id", journeyId)
    .single()
  
  if (!journey) throw new Error("Journey not found")
  
  // Get all stages, steps, touchpoints, etc. for snapshot
  const { data: stages } = await supabase.from("stages").select("*").eq("journey_id", journeyId).order("order")
  const stageIds = stages?.map(s => s.id) || []
  const { data: steps } = await supabase.from("steps").select("*").in("stage_id", stageIds.length ? stageIds : ["__none__"]).order("order")
  const stepIds = steps?.map(s => s.id) || []
  const { data: touchPoints } = await supabase.from("touch_points").select("*").in("step_id", stepIds.length ? stepIds : ["__none__"])
  const tpIds = touchPoints?.map(tp => tp.id) || []
  const { data: painPoints } = await supabase.from("pain_points").select("*").in("touch_point_id", tpIds.length ? tpIds : ["__none__"])
  const { data: highlights } = await supabase.from("highlights").select("*").in("touch_point_id", tpIds.length ? tpIds : ["__none__"])
  const { data: evidence } = await supabase.from("evidence").select("*").in("touch_point_id", tpIds.length ? tpIds : ["__none__"])
  
  // Build snapshot object
  const snapshot = {
    journey,
    stages: (stages || []).map(stage => ({
      ...stage,
      steps: (steps || []).filter(step => step.stage_id === stage.id).map(step => ({
        ...step,
        touchPoints: (touchPoints || []).filter(tp => tp.step_id === step.id).map(tp => ({
          ...tp,
          painPoints: (painPoints || []).filter(pp => pp.touch_point_id === tp.id),
          highlights: (highlights || []).filter(h => h.touch_point_id === tp.id),
          evidence: (evidence || []).filter(e => e.touch_point_id === tp.id),
        })),
      })),
    })),
  }
  
// Import version utilities
  const { calculateVersionChange } = await import("@/lib/utils")
  
  // Get latest version to compare
  const { data: latestVersion } = await supabase
  .from("journey_versions")
  .select("version_number, snapshot, version_label")
  .eq("journey_id", journeyId)
  .order("version_number", { ascending: false })
  .limit(1)
  .single()
  
  // Compare current snapshot with latest version to detect actual changes
  if (latestVersion?.snapshot) {
  // Use JSON stringify for deep comparison - this catches ALL changes including:
  // - Order changes (steps moved)
  // - Content changes (names, descriptions, scores)
  // - Added/removed items at any level
  const prevJson = JSON.stringify(latestVersion.snapshot)
  const currJson = JSON.stringify(snapshot)
  
  if (prevJson === currJson) {
  // Truly identical - no changes at all
  return { versionNumber: latestVersion.version_number, noChanges: true }
  }
  }
  
  const nextVersionNumber = (latestVersion?.version_number || 0) + 1
  
  // Calculate semantic version
  const currentVersionLabel = latestVersion?.version_label || (latestVersion ? `${latestVersion.version_number}.0` : "1.0")
  const versionChange = calculateVersionChange(
    latestVersion?.snapshot as Parameters<typeof calculateVersionChange>[0],
    snapshot as Parameters<typeof calculateVersionChange>[1],
    currentVersionLabel,
    false // Not a regeneration
  )
  
  // Create the version record with semantic versioning
  const { error } = await supabase
  .from("journey_versions")
  .insert({
  journey_id: journeyId,
  version_number: nextVersionNumber,
  version_label: versionChange.nextVersionLabel,
  change_type: versionChange.changeType,
  snapshot,
  created_by: user.id,
  changes_summary: changesSummary,
  })
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
  revalidatePath(`/journeys`)
  return { versionNumber: nextVersionNumber, versionLabel: versionChange.nextVersionLabel, changeType: versionChange.changeType }
}

export async function restoreJourneyVersion(journeyId: string, versionId: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  // First, save current state as a new version
  try {
    await createAutoJourneyVersion(journeyId, "Auto-save before restore")
  } catch {
    // If auto-save fails (e.g., no stages exist), continue with restore
  }
  
  // Get the version to restore
  const { data: version } = await supabase
    .from("journey_versions")
    .select("snapshot")
    .eq("id", versionId)
    .single()
  
  if (!version?.snapshot) throw new Error("Version not found")
  
  const snapshot = version.snapshot as { 
    journey: Record<string, unknown>
    stages: Array<Record<string, unknown> & { 
      steps: Array<Record<string, unknown> & { 
        touchPoints: Array<Record<string, unknown> & {
          painPoints: Record<string, unknown>[]
          highlights: Record<string, unknown>[]
          evidence: Record<string, unknown>[]
        }>
      }>
    }>
  }
  
  // Delete current data - cascades will handle children
  await supabase.from("stages").delete().eq("journey_id", journeyId)
  
  // Restore stages with NEW UUIDs to avoid conflicts
  for (const stage of snapshot.stages) {
    const { steps, ...stageData } = stage
    
    // Insert stage with new ID
    const { data: newStage, error: stageError } = await supabase.from("stages").insert({
      journey_id: journeyId,
      name: stageData.name as string,
      order: stageData.order as number,
    }).select("id").single()
    
    if (stageError || !newStage) continue
    
    // Restore steps
    for (const step of steps) {
      const { touchPoints, ...stepData } = step
      
      const { data: newStep, error: stepError } = await supabase.from("steps").insert({
        stage_id: newStage.id,
        name: stepData.name as string,
        description: stepData.description as string | null,
        order: stepData.order as number,
      }).select("id").single()
      
      if (stepError || !newStep) continue
      
      // Restore touchpoints
      for (const tp of touchPoints) {
        const { painPoints, highlights, evidence, ...tpData } = tp
        
        const { data: newTp, error: tpError } = await supabase.from("touch_points").insert({
          step_id: newStep.id,
          channel: tpData.channel as string,
          description: tpData.description as string | null,
          emotional_score: tpData.emotional_score as number,
        }).select("id").single()
        
        if (tpError || !newTp) continue
        
        // Restore pain points
        for (const pp of painPoints) {
          await supabase.from("pain_points").insert({
            touch_point_id: newTp.id,
            description: pp.description as string,
            severity: pp.severity as string,
            emotional_score: pp.emotional_score as number | null,
          })
        }
        
        // Restore highlights
        for (const h of highlights) {
          await supabase.from("highlights").insert({
            touch_point_id: newTp.id,
            description: h.description as string,
            impact: h.impact as string,
            emotional_score: h.emotional_score as number | null,
          })
        }
        
        // Restore evidence
        for (const e of evidence) {
          await supabase.from("evidence").insert({
            touch_point_id: newTp.id,
            type: e.type as string,
            label: e.label as string | null,
            url: e.url as string | null,
          })
        }
      }
    }
  }
  
  revalidatePath(`/journeys/${journeyId}`)
}

export async function duplicateJourneyFromVersion(journeyId: string, versionId: string): Promise<{ journeyId: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  // Get user profile for org
  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id")
    .eq("id", user.id)
    .single()
  
  if (!profile?.organization_id) throw new Error("No organization found")
  
  // Get the original journey
  const { data: originalJourney } = await supabase
    .from("journeys")
    .select("title, description, type, category")
    .eq("id", journeyId)
    .single()
  
  if (!originalJourney) throw new Error("Journey not found")
  
  // Get the version to duplicate from
  const { data: version } = await supabase
    .from("journey_versions")
    .select("snapshot, version_number")
    .eq("id", versionId)
    .single()
  
  if (!version?.snapshot) throw new Error("Version not found")
  
  // Create new journey
  const { data: newJourney, error: journeyError } = await supabase
    .from("journeys")
    .insert({
      title: `${originalJourney.title} (v${version.version_number} copy)`,
      description: originalJourney.description,
      type: originalJourney.type,
      category: originalJourney.category,
      status: "draft",
      organization_id: profile.organization_id,
      created_by: user.id,
    })
    .select("id")
    .single()
  
  if (journeyError || !newJourney) throw new Error(journeyError?.message || "Failed to create journey")
  
  const snapshot = version.snapshot as { 
    journey?: Record<string, unknown>
    stages?: Array<Record<string, unknown> & { 
      steps?: Array<Record<string, unknown> & { 
        touchPoints?: Array<Record<string, unknown> & {
          painPoints?: Record<string, unknown>[]
          highlights?: Record<string, unknown>[]
          evidence?: Record<string, unknown>[]
        }>
      }>
    }>
  }
  
  // Copy all stages, steps, touchpoints from snapshot to new journey
  const stages = snapshot.stages || []
  for (const stage of stages) {
    const { steps, ...stageData } = stage
    
    const { data: newStage, error: stageError } = await supabase.from("stages").insert({
      journey_id: newJourney.id,
      name: stageData.name as string,
      order: stageData.order as number,
    }).select("id").single()
    
    if (stageError || !newStage) continue
    
    const stepsArray = steps || []
    for (const step of stepsArray) {
      const { touchPoints, ...stepData } = step
      
      const { data: newStep, error: stepError } = await supabase.from("steps").insert({
        stage_id: newStage.id,
        name: stepData.name as string,
        description: stepData.description as string | null,
        order: stepData.order as number,
      }).select("id").single()
      
      if (stepError || !newStep) continue
      
      const tpArray = touchPoints || []
      for (const tp of tpArray) {
        const { painPoints, highlights, evidence, ...tpData } = tp
        
        const { data: newTp, error: tpError } = await supabase.from("touch_points").insert({
          step_id: newStep.id,
          channel: tpData.channel as string,
          description: tpData.description as string | null,
          emotional_score: tpData.emotional_score as number,
        }).select("id").single()
        
        if (tpError || !newTp) continue
        
        const ppArray = painPoints || []
        for (const pp of ppArray) {
          await supabase.from("pain_points").insert({
            touch_point_id: newTp.id,
            description: pp.description as string,
            severity: pp.severity as string,
            emotional_score: pp.emotional_score as number | null,
          })
        }
        
        const hArray = highlights || []
        for (const h of hArray) {
          await supabase.from("highlights").insert({
            touch_point_id: newTp.id,
            description: h.description as string,
            impact: h.impact as string,
            emotional_score: h.emotional_score as number | null,
          })
        }
        
        const eArray = evidence || []
        for (const e of eArray) {
          await supabase.from("evidence").insert({
            touch_point_id: newTp.id,
            type: e.type as string,
            label: e.label as string | null,
            url: e.url as string | null,
          })
        }
      }
    }
  }
  
  revalidatePath("/journeys")
  return { journeyId: newJourney.id }
}

export async function upvoteJourney(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Check if already upvoted
  const { data: existing } = await supabase
    .from("journey_upvotes")
    .select("id")
    .eq("journey_id", journeyId)
    .eq("user_id", user.id)
    .maybeSingle()

  let upvoted = false
  if (existing) {
    await supabase.from("journey_upvotes").delete().eq("id", existing.id)
    upvoted = false
  } else {
    await supabase.from("journey_upvotes").insert({ journey_id: journeyId, user_id: user.id })
    upvoted = true
  }

  // Get total count
  const { count } = await supabase
    .from("journey_upvotes")
    .select("*", { count: "exact", head: true })
    .eq("journey_id", journeyId)

  revalidatePath(`/journeys/${journeyId}`)
  return { upvoted, count: count || 0 }
}

export async function deleteSolution(solutionId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  // Only allow deleting solutions the user created
  const { data: solution } = await supabase
    .from("solutions")
    .select("created_by")
    .eq("id", solutionId)
    .single()

  if (!solution) throw new Error("Solution not found")
  if (solution.created_by !== user.id) throw new Error("You can only delete your own solutions")

  const { error } = await supabase.from("solutions").delete().eq("id", solutionId)
  if (error) throw new Error(error.message)
  revalidatePath("/solutions")
}

export async function updateSolution(solutionId: string, data: {
  title?: string
  description?: string
  category?: string
  tags?: string[]
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: solution } = await supabase
    .from("solutions")
    .select("created_by")
    .eq("id", solutionId)
    .single()

  if (!solution) throw new Error("Solution not found")
  if (solution.created_by !== user.id) throw new Error("You can only edit your own solutions")

  const { error } = await supabase.from("solutions").update(data).eq("id", solutionId)
  if (error) throw new Error(error.message)
  revalidatePath("/solutions")
}

export async function deleteEvidence(evidenceId: string, journeyId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("evidence").delete().eq("id", evidenceId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function updateProfile(data: { name?: string; email?: string; avatar?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { error } = await supabase.from("profiles").update(data).eq("id", user.id)
  if (error) throw new Error(error.message)
  revalidatePath("/settings")
}

export async function updateWorkspace(data: { name?: string; logo?: string }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: profile } = await supabase.from("profiles").select("organization_id").eq("id", user.id).single()
  if (!profile?.organization_id) throw new Error("No organization found")

  const updateData: Record<string, string> = {}
  if (data.name) updateData.name = data.name
  if (data.logo) updateData.logo = data.logo

  const { error } = await supabase.from("organizations").update(updateData).eq("id", profile.organization_id)
  if (error) throw new Error(error.message)
  revalidatePath("/settings/workspace")
}

export async function renameJourney(journeyId: string, title: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { error } = await supabase.from("journeys").update({ title }).eq("id", journeyId)
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
}

export async function renameArchetype(archetypeId: string, name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  const { error } = await supabase.from("archetypes").update({ name }).eq("id", archetypeId)
  if (error) throw new Error(error.message)
  revalidatePath(`/archetypes/${archetypeId}`)
}

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient()
  await supabase.from("notifications").update({ read: true }).eq("id", notificationId)
}

export async function markAllNotificationsRead() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false)
}

export async function addPainPoint(touchPointId: string, journeyId: string, description: string, severity: string, emotionalScore: number = -3) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { data, error } = await supabase
    .from("pain_points")
    .insert({ touch_point_id: touchPointId, description, severity, emotional_score: emotionalScore })
    .select("id")
    .single()
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
  return data
}

export async function addHighlight(touchPointId: string, journeyId: string, description: string, impact: string, emotionalScore: number = 3) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { data, error } = await supabase
    .from("highlights")
    .insert({ touch_point_id: touchPointId, description, impact, emotional_score: emotionalScore })
    .select("id")
    .single()
  
  if (error) throw new Error(error.message)
  revalidatePath(`/journeys/${journeyId}`)
  return data
}

// B6: Archive journey - soft delete by setting status to archived
export async function archiveJourney(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  // Store the original type before archiving for potential restore
  const { data: journey } = await supabase
    .from("journeys")
    .select("type, title")
    .eq("id", journeyId)
    .single()
  
  if (!journey) throw new Error("Journey not found")
  
  const { error } = await supabase
    .from("journeys")
    .update({ 
      status: "archived",
      // Store original type in a metadata field for restore
      archived_original_type: journey.type,
      archived_at: new Date().toISOString()
    })
    .eq("id", journeyId)
  
  if (error) throw new Error(error.message)
  
  await logActivity(supabase, user.id, "status_change", `Archived journey "${journey.title}"`, journeyId)
  
  revalidatePath("/journeys")
  revalidatePath(`/journeys/${journeyId}`)
  return { success: true }
}

// B6: Restore archived journey
export async function restoreArchivedJourney(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { data: journey } = await supabase
    .from("journeys")
    .select("archived_original_type, title, status")
    .eq("id", journeyId)
    .single()
  
  if (!journey) throw new Error("Journey not found")
  if (journey.status !== "archived") throw new Error("Journey is not archived")
  
  // Restore to original type, defaulting to "current" if not stored
  const originalType = journey.archived_original_type || "current"
  
  const { error } = await supabase
    .from("journeys")
    .update({ 
      status: "draft",
      type: originalType,
      archived_original_type: null,
      archived_at: null
    })
    .eq("id", journeyId)
  
  if (error) throw new Error(error.message)
  
  await logActivity(supabase, user.id, "status_change", `Restored journey "${journey.title}" from archive`, journeyId)
  
  revalidatePath("/journeys")
  revalidatePath(`/journeys/${journeyId}`)
  return { success: true }
}

// B6: Permanently delete a journey and all its data
export async function permanentlyDeleteJourney(journeyId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")
  
  const { data: journey } = await supabase
    .from("journeys")
    .select("status, title")
    .eq("id", journeyId)
    .single()
  
  if (!journey) throw new Error("Journey not found")
  if (journey.status !== "archived") throw new Error("Only archived journeys can be permanently deleted")
  
  // Delete all related data (cascades should handle most, but being explicit)
  // Get all stages
  const { data: stages } = await supabase
    .from("stages")
    .select("id")
    .eq("journey_id", journeyId)
  
  const stageIds = stages?.map(s => s.id) || []
  
  if (stageIds.length > 0) {
    // Get all steps
    const { data: steps } = await supabase
      .from("steps")
      .select("id")
      .in("stage_id", stageIds)
    
    const stepIds = steps?.map(s => s.id) || []
    
    if (stepIds.length > 0) {
      // Get all touchpoints
      const { data: touchpoints } = await supabase
        .from("touch_points")
        .select("id")
        .in("step_id", stepIds)
      
      const tpIds = touchpoints?.map(tp => tp.id) || []
      
      if (tpIds.length > 0) {
        // Delete evidence, pain_points, highlights
        await supabase.from("evidence").delete().in("touch_point_id", tpIds)
        await supabase.from("pain_points").delete().in("touch_point_id", tpIds)
        await supabase.from("highlights").delete().in("touch_point_id", tpIds)
        // Delete touchpoints
        await supabase.from("touch_points").delete().in("step_id", stepIds)
      }
      
      // Delete steps
      await supabase.from("steps").delete().in("stage_id", stageIds)
    }
    
    // Delete stages
    await supabase.from("stages").delete().eq("journey_id", journeyId)
  }
  
  // Delete archetypes
  await supabase.from("archetypes").delete().eq("journey_id", journeyId)
  
  // Delete versions
  await supabase.from("journey_versions").delete().eq("journey_id", journeyId)
  
  // Delete collaborators
  await supabase.from("collaborators").delete().eq("journey_id", journeyId)
  
  // Delete upvotes
  await supabase.from("journey_upvotes").delete().eq("journey_id", journeyId)
  
  // Delete comments
  await supabase.from("comments").delete().eq("journey_id", journeyId)
  
  // Finally delete the journey
  const { error } = await supabase
    .from("journeys")
    .delete()
    .eq("id", journeyId)
  
  if (error) throw new Error(error.message)
  
  revalidatePath("/journeys")
  return { success: true }
}
