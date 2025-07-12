/**
 * Content Moderation Type Definitions
 */

// Content Types
export type ContentType = 'comment' | 'chat_message' | 'article' | 'review' | 'profile' | 'practice_listing'

export interface ContentItem {
  id: string
  type: ContentType
  content: string
  metadata?: Record<string, any>
  authorId: string
  authorName?: string
  createdAt: Date
  updatedAt?: Date
  parentId?: string // For replies/nested content
}

// Moderation Results
export interface ModerationResult {
  id: string
  contentId: string
  contentType: ContentType
  status: ModerationStatus
  severity: ModerationSeverity
  categories: ModerationCategory[]
  scores: ModerationScores
  flags: ModerationFlag[]
  aiProvider?: string
  confidence: number
  timestamp: Date
  reviewedBy?: string
  reviewedAt?: Date
  decision?: ModerationDecision
  notes?: string
}

export type ModerationStatus = 
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'flagged'
  | 'requires_review'
  | 'auto_approved'
  | 'auto_rejected'

export type ModerationSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface ModerationCategory {
  name: string
  score: number
  flagged: boolean
}

export interface ModerationScores {
  toxicity?: number
  severeToxicity?: number
  obscene?: number
  threat?: number
  insult?: number
  identityAttack?: number
  spam?: number
  medicalMisinformation?: number
  inappropriate?: number
  overall: number
}

export interface ModerationFlag {
  type: FlagType
  reason: string
  confidence: number
  details?: any
}

export type FlagType = 
  | 'toxicity'
  | 'spam'
  | 'medical_misinformation'
  | 'personal_info'
  | 'inappropriate_content'
  | 'hate_speech'
  | 'threat'
  | 'self_harm'
  | 'sexual_content'
  | 'violence'
  | 'illegal_content'
  | 'copyright'
  | 'off_topic'

export interface ModerationDecision {
  action: ModerationAction
  reason: string
  moderatorId: string
  timestamp: Date
  autoAction: boolean
}

export type ModerationAction = 
  | 'approve'
  | 'reject'
  | 'edit'
  | 'hide'
  | 'delete'
  | 'warn'
  | 'ban'
  | 'escalate'
  | 'require_edit'

// Moderation Rules
export interface ModerationRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  conditions: RuleCondition[]
  actions: RuleAction[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface RuleCondition {
  type: 'score' | 'flag' | 'pattern' | 'user' | 'content_type'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'matches' | 'in'
  field: string
  value: any
}

export interface RuleAction {
  type: ModerationAction
  parameters?: Record<string, any>
  notification?: NotificationConfig
}

export interface NotificationConfig {
  targets: ('author' | 'moderators' | 'admins')[]
  template: string
  channels: ('email' | 'in_app' | 'webhook')[]
}

// Word Filter
export interface BannedWord {
  id: string
  word: string
  severity: ModerationSeverity
  category: string
  variations?: string[]
  contextExceptions?: string[]
  enabled: boolean
  createdAt: Date
  createdBy: string
}

export interface WordFilterResult {
  found: boolean
  matches: Array<{
    word: string
    position: number
    severity: ModerationSeverity
    category: string
  }>
  censored?: string
}

// Pattern Matching
export interface ContentPattern {
  id: string
  name: string
  pattern: string // Regex pattern
  flags?: string
  type: PatternType
  severity: ModerationSeverity
  action: ModerationAction
  description?: string
  enabled: boolean
}

export type PatternType = 
  | 'email'
  | 'phone'
  | 'url'
  | 'personal_info'
  | 'medical_claim'
  | 'spam_pattern'
  | 'custom'

// User Reputation
export interface UserReputation {
  userId: string
  score: number
  level: TrustLevel
  totalContent: number
  approvedContent: number
  rejectedContent: number
  flaggedContent: number
  reports: number
  warnings: number
  bans: number
  lastActivityAt: Date
  factors: ReputationFactor[]
}

export type TrustLevel = 
  | 'new_user'
  | 'basic'
  | 'trusted'
  | 'verified'
  | 'moderator'
  | 'admin'

export interface ReputationFactor {
  type: string
  value: number
  weight: number
  timestamp: Date
}

export interface ReputationAction {
  type: 'increase' | 'decrease' | 'set'
  amount: number
  reason: string
  factorType: string
}

// Review Queue
export interface ReviewQueueItem {
  id: string
  contentId: string
  contentType: ContentType
  content: ContentItem
  moderationResult: ModerationResult
  priority: number
  assignedTo?: string
  status: 'pending' | 'in_review' | 'completed' | 'escalated'
  createdAt: Date
  claimedAt?: Date
  completedAt?: Date
  tags: string[]
  context?: ReviewContext
}

export interface ReviewContext {
  previousViolations: number
  userReputation: UserReputation
  relatedContent?: ContentItem[]
  reportedBy?: ReportInfo[]
}

export interface ReportInfo {
  reporterId: string
  reason: string
  timestamp: Date
  details?: string
}

// Moderation Settings
export interface ModerationSettings {
  enabled: boolean
  autoModeration: {
    enabled: boolean
    threshold: number
    actions: Record<ModerationSeverity, ModerationAction>
    exemptRoles: string[]
  }
  aiProviders: {
    openai?: {
      enabled: boolean
      apiKey?: string // Encrypted
      model?: string
    }
    perspective?: {
      enabled: boolean
      apiKey?: string // Encrypted
      attributes: string[]
    }
    custom?: {
      enabled: boolean
      endpoint: string
      apiKey?: string // Encrypted
    }
  }
  wordFilter: {
    enabled: boolean
    strictMode: boolean
    customWords: BannedWord[]
  }
  patterns: {
    enabled: boolean
    detectPersonalInfo: boolean
    detectMedicalClaims: boolean
    customPatterns: ContentPattern[]
  }
  reputation: {
    enabled: boolean
    autoApproveThreshold: number
    requireReviewThreshold: number
    banThreshold: number
  }
  notifications: {
    alertModerators: boolean
    alertAdmins: boolean
    userNotifications: boolean
    webhooks: WebhookConfig[]
  }
}

export interface WebhookConfig {
  url: string
  events: string[]
  secret?: string // For signature validation
  enabled: boolean
}

// Moderation API Responses
export interface OpenAIModerationResponse {
  id: string
  model: string
  results: Array<{
    flagged: boolean
    categories: Record<string, boolean>
    category_scores: Record<string, number>
  }>
}

export interface PerspectiveAPIResponse {
  attributeScores: Record<string, {
    spanScores: Array<{
      begin: number
      end: number
      score: { value: number; type: string }
    }>
    summaryScore: { value: number; type: string }
  }>
  languages?: string[]
  detectedLanguages?: string[]
}

// Moderation Events
export interface ModerationEvent {
  id: string
  type: ModerationEventType
  contentId: string
  contentType: ContentType
  userId: string
  moderatorId?: string
  action?: ModerationAction
  details: Record<string, any>
  timestamp: Date
}

export type ModerationEventType = 
  | 'content_submitted'
  | 'content_flagged'
  | 'content_approved'
  | 'content_rejected'
  | 'content_edited'
  | 'user_warned'
  | 'user_banned'
  | 'user_unbanned'
  | 'report_submitted'
  | 'review_completed'

// Bulk Moderation
export interface BulkModerationRequest {
  contentIds: string[]
  action: ModerationAction
  reason: string
  notifyUsers?: boolean
}

export interface BulkModerationResult {
  successful: string[]
  failed: Array<{
    contentId: string
    error: string
  }>
  summary: {
    total: number
    succeeded: number
    failed: number
  }
}