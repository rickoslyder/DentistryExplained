/**
 * Moderation System Exports
 * 
 * Central export point for all moderation components
 */

// Main aggregator
export { ModerationAggregator } from './moderation-aggregator'

// AI Moderation
export { ToxicityDetector } from './ai-moderation/toxicity-detector'
export { SpamClassifier } from './ai-moderation/spam-classifier'
export { ContentAnalyzer } from './ai-moderation/content-analyzer'

// Filters
export { WordFilter } from './filters/word-filter'
export { PatternMatcher } from './filters/pattern-matcher'
export { LinkValidator } from './filters/link-validator'

// Workflows
export { ReviewQueue } from './workflows/review-queue'
export { WorkflowManager } from './workflows/workflow-manager'

// Reputation
export { UserReputation } from './reputation/user-reputation'
export type { ReputationLevel, ReputationBadge, ReputationHistory } from './reputation/user-reputation'

// Types
export * from './types'

// Utility functions
export { initializeModeration, cleanupModeration } from './utils'

// Constants
export const MODERATION_CONFIG = {
  // AI providers
  providers: {
    openai: {
      enabled: true,
      model: 'text-moderation-latest'
    },
    perspective: {
      enabled: true,
      attributes: ['TOXICITY', 'SEVERE_TOXICITY', 'THREAT', 'PROFANITY', 'SEXUALLY_EXPLICIT']
    }
  },
  
  // Thresholds
  thresholds: {
    autoApprove: 0.2,
    autoReject: 0.9,
    reviewRequired: 0.5
  },
  
  // Cache settings
  cache: {
    ttl: 3600, // 1 hour
    maxSize: 1000
  },
  
  // Rate limits
  rateLimits: {
    perUser: {
      window: 3600000, // 1 hour
      max: 100
    },
    perIP: {
      window: 3600000,
      max: 500
    }
  }
}