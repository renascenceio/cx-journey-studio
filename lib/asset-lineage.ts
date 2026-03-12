"use server"

import { v4 as uuidv4 } from "uuid"

/**
 * Asset Lineage System (B3)
 * 
 * This system provides:
 * 1. Immutable content_uuid: A unique ID that stays constant across copies/duplicates
 * 2. IP tracking: Source attribution for asset provenance  
 * 3. Lineage chain: parent_uuid for tracking derivation history
 * 
 * Use cases:
 * - Track original creator even when asset is copied
 * - Maintain attribution for AI-generated content
 * - Build a provenance chain for audit/compliance
 * - Prevent unauthorized claiming of content
 */

// Asset types that can have lineage tracking
export type TrackableAssetType = 
  | "journey"
  | "archetype"
  | "stage"
  | "step"
  | "touchpoint"
  | "pain_point"
  | "highlight"
  | "solution"
  | "template"

export interface AssetLineage {
  /** Primary database ID */
  id: string
  /** Immutable content UUID - never changes, even on copy/duplicate */
  content_uuid: string
  /** Parent content UUID if this is a derivative */
  parent_uuid?: string | null
  /** Original creator user ID */
  original_creator_id: string
  /** Original creator email (for attribution display) */
  original_creator_email?: string
  /** Original creation timestamp */
  original_created_at: string
  /** Source type for IP tracking */
  source_type: "original" | "ai_generated" | "imported" | "template" | "duplicated"
  /** If AI generated, store the generation params */
  ai_generation_context?: {
    model?: string
    prompt_hash?: string
    language?: string
    timestamp: string
  }
  /** Chain depth - how many generations from original (0 = original) */
  lineage_depth: number
}

/**
 * Generate a new content UUID for original assets
 */
export async function generateContentUuid(): Promise<string> {
  return uuidv4()
}

/**
 * Create lineage metadata for a new original asset
 */
export async function createOriginalLineage(
  creatorId: string,
  creatorEmail?: string,
  sourceType: "original" | "ai_generated" | "imported" | "template" = "original",
  aiContext?: AssetLineage["ai_generation_context"]
): Promise<Omit<AssetLineage, "id">> {
  const contentUuid = await generateContentUuid()
  
  return {
    content_uuid: contentUuid,
    parent_uuid: null,
    original_creator_id: creatorId,
    original_creator_email: creatorEmail,
    original_created_at: new Date().toISOString(),
    source_type: sourceType,
    ai_generation_context: aiContext,
    lineage_depth: 0
  }
}

/**
 * Create lineage metadata for a duplicated/copied asset
 * Preserves the original content_uuid but creates new derivation link
 */
export async function createDerivedLineage(
  parentLineage: AssetLineage,
  newCreatorId: string,
  newCreatorEmail?: string
): Promise<Omit<AssetLineage, "id">> {
  return {
    content_uuid: parentLineage.content_uuid, // Keep same content UUID
    parent_uuid: parentLineage.content_uuid, // Link to parent
    original_creator_id: parentLineage.original_creator_id, // Preserve original creator
    original_creator_email: parentLineage.original_creator_email,
    original_created_at: parentLineage.original_created_at, // Preserve original date
    source_type: "duplicated",
    ai_generation_context: parentLineage.ai_generation_context,
    lineage_depth: parentLineage.lineage_depth + 1
  }
}

/**
 * Get attribution display for an asset
 */
export function getAssetAttribution(lineage: AssetLineage): {
  originalCreator: string
  sourceType: string
  isDerivative: boolean
  derivationDepth: number
} {
  return {
    originalCreator: lineage.original_creator_email || lineage.original_creator_id,
    sourceType: lineage.source_type,
    isDerivative: lineage.lineage_depth > 0,
    derivationDepth: lineage.lineage_depth
  }
}

/**
 * Format source type for display
 */
export function formatSourceType(sourceType: AssetLineage["source_type"]): string {
  const labels: Record<AssetLineage["source_type"], string> = {
    original: "Original",
    ai_generated: "AI Generated",
    imported: "Imported",
    template: "From Template",
    duplicated: "Duplicated"
  }
  return labels[sourceType] || sourceType
}

/**
 * Check if current user is the original creator
 */
export function isOriginalCreator(lineage: AssetLineage, userId: string): boolean {
  return lineage.original_creator_id === userId
}

/**
 * Generate a hash for AI generation context (for deduplication)
 */
export async function hashAIContext(prompt: string, model: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(`${model}:${prompt}`)
  const hashBuffer = await crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
}
