// ========================================
// CX Journey Mapping Studio - Domain Types
// ========================================

// --- Organization & Users ---

export type UserRole = "admin" | "project_manager" | "journey_master" | "contributor" | "viewer" | "external"

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: UserRole
  teamIds: string[]
  organizationId: string
  createdAt: string
}

export interface Team {
  id: string
  name: string
  description?: string
  organizationId: string
  memberIds: string[]
  createdAt: string
}

export type SubscriptionStatus = 
  | "trialing" 
  | "active" 
  | "past_due" 
  | "canceled" 
  | "unpaid" 
  | "incomplete" 
  | "incomplete_expired" 
  | "paused" 
  | "inactive"

export interface Organization {
  id: string
  name: string
  slug: string
  logo?: string
  plan: "free" | "starter" | "business" | "enterprise" | "pro"
  plan_id?: string
  teamIds: string[]
  createdAt: string
  // Stripe integration
  stripe_customer_id?: string
  stripe_subscription_id?: string
  subscription_status?: SubscriptionStatus
  // Trial tracking
  trial_started_at?: string
  trial_ends_at?: string
}

// --- Journey Architecture ---

export type JourneyType = "template" | "current" | "future" | "deployed"

export type JourneyStatus =
  | "draft"
  | "in_progress"
  | "review"
  | "approved"
  | "deployed"
  | "archived"

export type Severity = "low" | "medium" | "high" | "critical"
export type Impact = "low" | "medium" | "high"

export type EvidenceType =
  | "screenshot"
  | "recording"
  | "survey"
  | "analytics"
  | "document"

export type HealthStatus = "healthy" | "warning" | "critical" | "unknown"

export interface PainPoint {
  id: string
  description: string
  severity: Severity
  emotionalScore?: number
  isAiGenerated?: boolean
  hideAiBadge?: boolean // PRO feature (B8)
}

export interface Highlight {
  id: string
  description: string
  impact: Impact
  emotionalScore?: number
  isAiGenerated?: boolean
  hideAiBadge?: boolean // PRO feature (B8)
}

export interface Evidence {
  id: string
  type: EvidenceType
  url: string
  label: string
}

export interface TouchPoint {
  id: string
  channel: string
  description: string
  emotionalScore: number // -5 to +5
  painPoints: PainPoint[]
  highlights: Highlight[]
  evidence: Evidence[]
}

export interface Step {
  id: string
  name: string
  description?: string
  order: number
  touchPoints: TouchPoint[]
}

export interface Stage {
  id: string
  name: string
  order: number
  steps: Step[]
}

export type ArchetypeCategory =
  // Financial Services
  | "banking"
  | "insurance"
  | "wealth_management"
  | "fintech"
  // Retail & Commerce
  | "e-commerce"
  | "retail"
  | "luxury"
  | "grocery"
  // Real Estate & Property
  | "real_estate"
  | "property_management"
  // Healthcare & Wellness
  | "healthcare"
  | "pharma"
  | "fitness"
  // Technology
  | "saas"
  | "telecommunications"
  | "media"
  // Travel & Hospitality
  | "hospitality"
  | "travel"
  | "airlines"
  // Automotive & Transport
  | "automotive"
  | "logistics"
  // Education & Public
  | "education"
  | "government"
  | "utilities"

export interface PillarRating {
  name: string
  score: number // 0-10
  group: "higher_order" | "basic_order"
}

export interface RadarChartData {
  label: string
  dimensions: { axis: string; value: number }[] // value 0-100
}

/** Alias for backward compat with data.ts */
export type RadarChart = RadarChartData

export type ArchetypeVisibility = "private" | "public" | "studio"

export interface Archetype {
  id: string
  journeyId?: string
  name: string
  role: string
  subtitle?: string // e.g. "Familia Ante Omnia (Family Over All)"
  category: ArchetypeCategory
  visibility?: ArchetypeVisibility
  avatar?: string
  isAiGenerated?: boolean
  hideAiBadge?: boolean // PRO feature (B8)
  // Narrative paragraphs
  description: string // "I am"
  goalsNarrative: string // "I want" - paragraph form
  needsNarrative: string // "I do" - paragraph form
  touchpointsNarrative: string // "I use" - paragraph form
  // Lists
  goals: string[]
  frustrations: string[]
  behaviors: string[]
  expectations: string[]
  barriers: string[]
  drivers: string[]
  importantSteps: string[]
  triggers: string[]
  mindset: string[]
  solutionPrinciples: string[]
  // Metrics
  valueMetric?: string // e.g. "50bn"
  basePercentage?: string // e.g. "50%"
  // Pillar ratings
  pillarRatings: PillarRating[]
  // Radar chart data
  radarCharts: RadarChartData[]
  // Tags
  tags: string[]
}

export interface Collaborator {
  id: string
  userId: string
  name?: string
  email?: string
  avatar?: string
  role: UserRole
  addedAt?: string
}

export interface Journey {
  id: string
  title: string
  description?: string
  type: JourneyType
  category?: string
  status: JourneyStatus
  archetypes: Archetype[]
  stages: Stage[]
  collaborators: Collaborator[]
  ownerId: string
  organizationId: string
  teamId: string
  tags: string[]
  createdAt: string
  updatedAt: string
  // Deployed-only fields
  healthStatus?: HealthStatus
  lastHealthCheck?: string
  // Future-only fields
  linkedCurrentJourneyId?: string
  // Visibility & engagement (JDS-043)
  is_public?: boolean
  upvotes?: number
}

// --- Versioning ---

export type VersionChangeType = "minor" | "medium" | "major"

export interface JourneyVersion {
  id: string
  journeyId: string
  versionNumber: number
  versionLabel?: string // Semantic version like "1.0", "1.1", "2.0"
  changeType?: VersionChangeType
  label?: string
  snapshot: Journey
  createdBy: string
  createdByName?: string
  createdAt: string
  changesSummary: string
}

// --- Workspace (extends Organization) ---

export interface WorkspaceCredits {
  used: number
  total: number
  purchased: number
}

export interface WorkspacePaymentStatus {
  paymentFailed: boolean
  paymentFailedAt?: string
  gracePeriodEndsAt?: string
  previousPlan?: string
}

export interface Workspace extends Organization {
  memberCount: number
  journeyCount: number
  archetypeCount: number
  // Workspace-scoped credits
  credits?: WorkspaceCredits
  // AI settings (set by workspace owner)
  preferredAiModel?: string
  aiSettings?: Record<string, unknown>
  // Payment status
  paymentStatus?: WorkspacePaymentStatus
}

// --- Emotional Arc ---

export interface EmotionalArcPoint {
  stageName: string
  score: number // average emotional score for the stage
}

// --- Comments & Activity ---

export interface Comment {
  id: string
  journeyId: string
  content: string
  authorId: string
  authorName?: string
  authorAvatar?: string
  mentions: string[]
  resolved: boolean
  createdAt: string
  parentId?: string
  stageId?: string
  stepId?: string
  touchpointId?: string
  reactions?: { emoji: string; userIds: string[] }[]
  editedAt?: string
}

export type ActivityAction =
  | "created"
  | "edited"
  | "commented"
  | "status_changed"
  | "deployed"
  | "shared"
  | "archived"
  | "mentioned_you"

export interface ActivityLogEntry {
  id: string
  action: ActivityAction
  actorId: string
  actorName?: string
  actorAvatar?: string
  journeyId?: string
  timestamp: string
  details: string
  stageId?: string
  stepId?: string
  commentPreview?: string
}

// --- Notifications ---

export type NotificationType =
  | "comment"
  | "mention"
  | "status_change"
  | "share"
  | "health_alert"
  | "system"

export interface Notification {
  id: string
  type: NotificationType
  message: string
  read: boolean
  createdAt: string
  link?: string
}

// --- Solutions (formerly Trends) ---

export type SolutionCategory =
  | "behavioral"
  | "rituals"
  | "industrial"
  | "technological"
  | "social"
  | "environmental"
  | "archetype"
  | "custom"

export interface Solution {
  id: string
  title: string
  category: SolutionCategory
  description: string
  source: string
  tags: string[]
  relevance: number // 0-100
  upvotes: number
  saved: boolean
  publishedAt: string
  isCrowd: boolean // false = platform, true = crowd-sourced
  isPublic?: boolean // user-created solutions can be made public
  createdBy?: string // user ID of creator (for user-created solutions)
  creatorName?: string // display name of creator
  creatorCompany?: string // company/organization of creator
  industry?: string
  applicableStage?: string
  contributorOrg?: string // anonymized org name for crowd solutions
  impact_score?: number // numerical impact percentage (e.g., 15 = +15% improvement)
  impact_verified?: boolean // whether the impact has been verified through testing
  impact?: "high" | "medium" | "low" // qualitative impact rating
  effort?: "high" | "medium" | "low" // implementation effort rating
}

// --- Journey View Mode ---

export type JourneyViewMode = "comprehensive" | "simple"

// --- Health Indicators (Deployed) ---

export interface HealthIndicator {
  id: string
  metric: string
  value: number
  threshold: number
  status: HealthStatus
  unit: string
  lastUpdated: string
}

// --- AI Opportunities (Future) ---

export interface Opportunity {
  id: string
  title: string
  description: string
  impact: Impact
  effort: "low" | "medium" | "high"
  affectedTouchPointIds: string[]
  projectedScoreImprovement: number
}

// --- Gap Analysis ---

export interface GapAnalysisEntry {
  touchPointName: string
  stageName: string
  currentScore: number
  futureScore: number
  gap: number
  opportunityCount: number
}

// --- Dashboard Stats ---

export interface DashboardStats {
  totalJourneys: number
  activeCollaborators: number
  avgEmotionalScore: number
  avgEmotionalScoreTrend: number // percentage change
  deployedJourneys: number
  healthyDeployed: number
}
