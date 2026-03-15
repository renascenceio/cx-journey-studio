"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { TransferAction, TransferAssetType, TransferResult } from "@/lib/types"
import { v4 as uuid } from "uuid"

// === JOURNEY TRANSFER ===

export async function transferJourney(
  journeyId: string,
  action: TransferAction,
  targetWorkspaceId: string
): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Fetch the journey with full data
    const { data: journey, error: journeyError } = await supabase
      .from("journeys")
      .select(`
        *,
        stages:stages(
          *,
          steps:steps(
            *,
            touchPoints:touch_points(
              *,
              painPoints:pain_points(*),
              highlights:highlights(*)
            )
          )
        ),
        archetypes:archetypes(*)
      `)
      .eq("id", journeyId)
      .single()

    if (journeyError || !journey) {
      return { success: false, error: "Journey not found" }
    }

    // Check permission - must be owner or admin of source workspace
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", journey.organization_id)
      .eq("user_id", user.id)
      .single()

    const isOwner = journey.owner_id === user.id
    const isAdmin = membership?.role === "admin" || membership?.role === "owner"
    
    if (!isOwner && !isAdmin) {
      return { success: false, error: "You don't have permission to transfer this journey" }
    }

    // Verify target workspace exists and user has access
    const { data: targetMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .single()

    if (!targetMembership) {
      return { success: false, error: "You don't have access to the target workspace" }
    }

    if (action === "move") {
      // Update journey's organization_id
      const { error: updateError } = await supabase
        .from("journeys")
        .update({ 
          organization_id: targetWorkspaceId,
          owner_id: user.id, // Transfer ownership to current user
          updated_at: new Date().toISOString(),
        })
        .eq("id", journeyId)

      if (updateError) {
        return { success: false, error: "Failed to move journey" }
      }

      // Update archetypes
      await supabase
        .from("archetypes")
        .update({ organization_id: targetWorkspaceId })
        .eq("journey_id", journeyId)

      revalidatePath(`/journeys/${journeyId}`)
      revalidatePath("/journeys")
      
      return { success: true }
    } else {
      // Copy journey
      const newJourneyId = uuid()
      
      // Create new journey record
      const { error: insertError } = await supabase
        .from("journeys")
        .insert({
          id: newJourneyId,
          title: `${journey.title} (Copy)`,
          description: journey.description,
          type: journey.type,
          category: journey.category,
          status: "draft",
          organization_id: targetWorkspaceId,
          team_id: targetWorkspaceId, // Use workspace as team
          owner_id: user.id,
          tags: journey.tags,
          is_public: false,
        })

      if (insertError) {
        console.error("Failed to copy journey:", insertError)
        return { success: false, error: "Failed to copy journey" }
      }

      // Copy stages, steps, touchpoints, etc.
      for (const stage of journey.stages || []) {
        const newStageId = uuid()
        
        await supabase.from("stages").insert({
          id: newStageId,
          journey_id: newJourneyId,
          name: stage.name,
          order: stage.order,
        })

        for (const step of stage.steps || []) {
          const newStepId = uuid()
          
          await supabase.from("steps").insert({
            id: newStepId,
            stage_id: newStageId,
            name: step.name,
            description: step.description,
            order: step.order,
          })

          for (const tp of step.touchPoints || []) {
            const newTpId = uuid()
            
            await supabase.from("touch_points").insert({
              id: newTpId,
              step_id: newStepId,
              channel: tp.channel,
              description: tp.description,
              emotional_score: tp.emotional_score,
            })

            // Copy pain points
            for (const pp of tp.painPoints || []) {
              await supabase.from("pain_points").insert({
                id: uuid(),
                touch_point_id: newTpId,
                description: pp.description,
                severity: pp.severity,
                emotional_score: pp.emotional_score,
                is_ai_generated: pp.is_ai_generated,
              })
            }

            // Copy highlights
            for (const hl of tp.highlights || []) {
              await supabase.from("highlights").insert({
                id: uuid(),
                touch_point_id: newTpId,
                description: hl.description,
                impact: hl.impact,
                emotional_score: hl.emotional_score,
                is_ai_generated: hl.is_ai_generated,
              })
            }
          }
        }
      }

      // Copy archetypes
      for (const archetype of journey.archetypes || []) {
        await supabase.from("archetypes").insert({
          id: uuid(),
          journey_id: newJourneyId,
          organization_id: targetWorkspaceId,
          name: archetype.name,
          role: archetype.role,
          subtitle: archetype.subtitle,
          category: archetype.category,
          visibility: "private",
          avatar: archetype.avatar,
          description: archetype.description,
          goals_narrative: archetype.goals_narrative,
          needs_narrative: archetype.needs_narrative,
          touchpoints_narrative: archetype.touchpoints_narrative,
          goals: archetype.goals,
          frustrations: archetype.frustrations,
          behaviors: archetype.behaviors,
          expectations: archetype.expectations,
          barriers: archetype.barriers,
          drivers: archetype.drivers,
          important_steps: archetype.important_steps,
          triggers: archetype.triggers,
          mindset: archetype.mindset,
          solution_principles: archetype.solution_principles,
          pillar_ratings: archetype.pillar_ratings,
          radar_charts: archetype.radar_charts,
          tags: archetype.tags,
          is_ai_generated: archetype.is_ai_generated,
        })
      }

      revalidatePath("/journeys")
      
      return { success: true, newAssetId: newJourneyId }
    }
  } catch (error) {
    console.error("Transfer journey error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// === ARCHETYPE TRANSFER ===

export async function transferArchetype(
  archetypeId: string,
  action: TransferAction,
  targetWorkspaceId: string
): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Fetch the archetype
    const { data: archetype, error: archetypeError } = await supabase
      .from("archetypes")
      .select("*")
      .eq("id", archetypeId)
      .single()

    if (archetypeError || !archetype) {
      return { success: false, error: "Archetype not found" }
    }

    // Check permission
    const { data: membership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", archetype.organization_id)
      .eq("user_id", user.id)
      .single()

    const isAdmin = membership?.role === "admin" || membership?.role === "owner"
    
    // For move, require admin. For copy, just need access
    if (action === "move" && !isAdmin) {
      return { success: false, error: "You need admin access to move archetypes" }
    }

    // Verify target workspace access
    const { data: targetMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", targetWorkspaceId)
      .eq("user_id", user.id)
      .single()

    if (!targetMembership) {
      return { success: false, error: "You don't have access to the target workspace" }
    }

    if (action === "move") {
      // Unlink from journey if moving
      const { error: updateError } = await supabase
        .from("archetypes")
        .update({ 
          organization_id: targetWorkspaceId,
          journey_id: null, // Unlink from journey
        })
        .eq("id", archetypeId)

      if (updateError) {
        return { success: false, error: "Failed to move archetype" }
      }

      revalidatePath(`/archetypes/${archetypeId}`)
      revalidatePath("/archetypes")
      
      return { success: true }
    } else {
      // Copy archetype
      const newArchetypeId = uuid()
      
      const { error: insertError } = await supabase
        .from("archetypes")
        .insert({
          id: newArchetypeId,
          organization_id: targetWorkspaceId,
          journey_id: null, // Don't link copy to original journey
          name: `${archetype.name} (Copy)`,
          role: archetype.role,
          subtitle: archetype.subtitle,
          category: archetype.category,
          visibility: "private",
          avatar: archetype.avatar,
          description: archetype.description,
          goals_narrative: archetype.goals_narrative,
          needs_narrative: archetype.needs_narrative,
          touchpoints_narrative: archetype.touchpoints_narrative,
          goals: archetype.goals,
          frustrations: archetype.frustrations,
          behaviors: archetype.behaviors,
          expectations: archetype.expectations,
          barriers: archetype.barriers,
          drivers: archetype.drivers,
          important_steps: archetype.important_steps,
          triggers: archetype.triggers,
          mindset: archetype.mindset,
          solution_principles: archetype.solution_principles,
          pillar_ratings: archetype.pillar_ratings,
          radar_charts: archetype.radar_charts,
          tags: archetype.tags,
          is_ai_generated: archetype.is_ai_generated,
        })

      if (insertError) {
        return { success: false, error: "Failed to copy archetype" }
      }

      revalidatePath("/archetypes")
      
      return { success: true, newAssetId: newArchetypeId }
    }
  } catch (error) {
    console.error("Transfer archetype error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

// === WORKSPACE OWNERSHIP TRANSFER ===

export async function transferWorkspaceOwnership(
  workspaceId: string,
  newOwnerId: string
): Promise<TransferResult> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    // Check if current user is workspace owner
    const { data: currentMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .single()

    if (currentMembership?.role !== "owner") {
      return { success: false, error: "Only the workspace owner can transfer ownership" }
    }

    // Check if new owner is a member
    const { data: newOwnerMembership } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", newOwnerId)
      .single()

    if (!newOwnerMembership) {
      return { success: false, error: "The new owner must be a member of the workspace" }
    }

    // Update new owner role to owner
    const { error: updateNewOwnerError } = await supabase
      .from("workspace_members")
      .update({ role: "owner" })
      .eq("workspace_id", workspaceId)
      .eq("user_id", newOwnerId)

    if (updateNewOwnerError) {
      return { success: false, error: "Failed to update new owner role" }
    }

    // Demote current owner to admin
    const { error: updateCurrentOwnerError } = await supabase
      .from("workspace_members")
      .update({ role: "admin" })
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)

    if (updateCurrentOwnerError) {
      // Rollback
      await supabase
        .from("workspace_members")
        .update({ role: newOwnerMembership.role })
        .eq("workspace_id", workspaceId)
        .eq("user_id", newOwnerId)
      
      return { success: false, error: "Failed to update ownership" }
    }

    revalidatePath("/settings/workspace")
    revalidatePath(`/`)
    
    return { success: true }
  } catch (error) {
    console.error("Transfer workspace ownership error:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}
