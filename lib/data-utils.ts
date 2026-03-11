import type {
  Journey,
  TouchPoint,
  PainPoint,
  Highlight,
  HealthIndicator,
  Opportunity,
  GapAnalysisEntry,
} from "@/lib/types"

// ---- Pure utility functions (safe for client components) ----

/**
 * Calculate a touchpoint's emotional score from its pain points and highlights.
 * If explicit pain points/highlights have scores, use those.
 * Otherwise fall back to the touchpoint's own score.
 */
export function calculateTouchPointScore(tp: TouchPoint): number {
  const painScores = tp.painPoints
    .filter(pp => pp.emotionalScore !== undefined)
    .map(pp => pp.emotionalScore!)
  const highlightScores = tp.highlights
    .filter(h => h.emotionalScore !== undefined)
    .map(h => h.emotionalScore!)
  
  // If we have explicit scores from pains/highlights, calculate from those
  if (painScores.length > 0 || highlightScores.length > 0) {
    const total = [...painScores, ...highlightScores].reduce((a, b) => a + b, 0)
    // Average the scores, clamped to -5 to +5
    const count = painScores.length + highlightScores.length
    return Math.max(-5, Math.min(5, Math.round((total / count) * 10) / 10))
  }
  
  // Fallback to touchpoint's own score
  return tp.emotionalScore
}

export function getEmotionalArc(journey: Journey): { stageName: string; score: number }[] {
  const arc: { stageName: string; score: number }[] = []
  const stages = journey.stages || []
  for (const stage of stages) {
    let total = 0
    let count = 0
    const steps = stage.steps || []
    for (const step of steps) {
      const touchPoints = step.touchPoints || []
      for (const tp of touchPoints) {
        total += calculateTouchPointScore(tp)
        count++
      }
    }
    arc.push({ stageName: stage.name, score: count > 0 ? Math.round((total / count) * 10) / 10 : 0 })
  }
  return arc
}

export function getAllTouchPoints(journey: Journey): Array<TouchPoint & { stageName: string; stepName: string }> {
  const result: Array<TouchPoint & { stageName: string; stepName: string }> = []
  const stages = journey.stages || []
  for (const stage of stages) {
    const steps = stage.steps || []
    for (const step of steps) {
      const touchPoints = step.touchPoints || []
      for (const tp of touchPoints) {
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

/**
 * Get pain points from a touchpoint.
 * Returns explicit pain points from the database only (including AI-generated ones).
 */
export function getEffectivePainPoints(tp: TouchPoint): PainPoint[] {
  return tp.painPoints || []
}

/**
 * Get highlights from a touchpoint.
 * Returns explicit highlights from the database only (including AI-generated ones).
 */
export function getEffectiveHighlights(tp: TouchPoint): Highlight[] {
  return tp.highlights || []
}

// ---- Static data constants ----

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
