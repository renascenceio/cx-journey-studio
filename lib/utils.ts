import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get initials from a name string, safely handling undefined/null values
 */
export function getInitials(name: string | undefined | null): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// --- Version Utilities ---

export type VersionChangeType = "minor" | "medium" | "major"

export interface VersionChangeResult {
  changeType: VersionChangeType
  changePercentage: number
  nextVersionLabel: string
  isRegeneration: boolean
}

/**
 * Calculate the change percentage between two journey snapshots
 */
export function calculateChangePercentage(
  oldSnapshot: { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null,
  newSnapshot: { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null
): number {
  if (!oldSnapshot?.stages || !newSnapshot?.stages) return 100
  
  const oldStages = oldSnapshot.stages
  const newStages = newSnapshot.stages
  
  // Count total elements in old snapshot
  let oldTotal = oldStages.length
  let newTotal = newStages.length
  
  const oldStageIds = new Set(oldStages.map(s => s.id))
  const newStageIds = new Set(newStages.map(s => s.id))
  
  // Count steps and touchpoints
  const oldStepIds = new Set<string>()
  const newStepIds = new Set<string>()
  const oldTouchpointIds = new Set<string>()
  const newTouchpointIds = new Set<string>()
  
  for (const stage of oldStages) {
    for (const step of stage.steps || []) {
      oldStepIds.add(step.id)
      oldTotal++
      for (const tp of step.touchPoints || []) {
        oldTouchpointIds.add(tp.id)
        oldTotal++
      }
    }
  }
  
  for (const stage of newStages) {
    for (const step of stage.steps || []) {
      newStepIds.add(step.id)
      newTotal++
      for (const tp of step.touchPoints || []) {
        newTouchpointIds.add(tp.id)
        newTotal++
      }
    }
  }
  
  // Calculate changes
  let changedCount = 0
  
  // Stages added/removed
  for (const id of oldStageIds) if (!newStageIds.has(id)) changedCount++
  for (const id of newStageIds) if (!oldStageIds.has(id)) changedCount++
  
  // Steps added/removed
  for (const id of oldStepIds) if (!newStepIds.has(id)) changedCount++
  for (const id of newStepIds) if (!oldStepIds.has(id)) changedCount++
  
  // Touchpoints added/removed
  for (const id of oldTouchpointIds) if (!newTouchpointIds.has(id)) changedCount++
  for (const id of newTouchpointIds) if (!oldTouchpointIds.has(id)) changedCount++
  
  const maxTotal = Math.max(oldTotal, newTotal, 1)
  return Math.round((changedCount / maxTotal) * 100)
}

/**
 * Determine the change type based on percentage and context
 */
export function determineChangeType(
  changePercentage: number,
  isRegeneration: boolean = false
): VersionChangeType {
  if (isRegeneration || changePercentage >= 80) return "major"
  if (changePercentage >= 30) return "medium"
  return "minor"
}

/**
 * Parse a semantic version label like "1.2" into major and minor parts
 */
export function parseVersionLabel(label: string | undefined): { major: number; minor: number } {
  if (!label) return { major: 1, minor: 0 }
  const parts = label.split(".")
  return {
    major: parseInt(parts[0]) || 1,
    minor: parseInt(parts[1]) || 0,
  }
}

/**
 * Generate the next semantic version based on change type
 */
export function getNextVersionLabel(
  currentLabel: string | undefined,
  changeType: VersionChangeType
): string {
  const { major, minor } = parseVersionLabel(currentLabel)
  
  if (changeType === "major" || changeType === "medium") {
    return `${major + 1}.0`
  }
  return `${major}.${minor + 1}`
}

/**
 * Calculate full version change result
 */
export function calculateVersionChange(
  oldSnapshot: { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null,
  newSnapshot: { stages?: Array<{ id: string; steps?: Array<{ id: string; touchPoints?: Array<{ id: string }> }> }> } | null,
  currentVersionLabel: string | undefined,
  isRegeneration: boolean = false
): VersionChangeResult {
  const changePercentage = calculateChangePercentage(oldSnapshot, newSnapshot)
  const changeType = determineChangeType(changePercentage, isRegeneration)
  const nextVersionLabel = getNextVersionLabel(currentVersionLabel, changeType)
  
  return {
    changeType,
    changePercentage,
    nextVersionLabel,
    isRegeneration,
  }
}
