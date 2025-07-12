/**
 * Moderation Aggregator
 * 
 * Main entry point that coordinates all moderation components
 */

import { ContentItem, ModerationResult, ModerationFlag } from './types'
import { ToxicityDetector } from './ai-moderation/toxicity-detector'
import { SpamClassifier } from './ai-moderation/spam-classifier'
import { ContentAnalyzer } from './ai-moderation/content-analyzer'
import { WordFilter } from './filters/word-filter'
import { PatternMatcher } from './filters/pattern-matcher'
import { LinkValidator } from './filters/link-validator'
import { WorkflowManager } from './workflows/workflow-manager'
import { UserReputation } from './reputation/user-reputation'
import { cacheManager } from '@/lib/cache'
import { getSettings } from '@/lib/settings'

export class ModerationAggregator {
  private static readonly CACHE_PREFIX = 'moderation:aggregate:'
  private static readonly CACHE_TTL = 3600 // 1 hour

  /**
   * Main moderation method - analyzes content through all systems
   */
  static async moderate(content: ContentItem): Promise<ModerationResult> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${this.hashContent(content)}`
    const cached = await cacheManager.get<ModerationResult>(cacheKey)
    if (cached) {
      return cached
    }

    const startTime = Date.now()
    const flags: ModerationFlag[] = []
    const scores: Record<string, number> = {}

    try {
      // Get user reputation for context
      const userRep = await UserReputation.getReputation(content.authorId)
      const trustBonus = this.calculateTrustBonus(userRep.level)

      // Run all moderation checks in parallel
      const [
        toxicityResult,
        spamResult,
        contentAnalysis,
        wordFilterResult,
        patternResult,
        linkResult
      ] = await Promise.all([
        ToxicityDetector.analyze(content),
        SpamClassifier.classify(content.content),
        ContentAnalyzer.analyze(content),
        WordFilter.check(content.content),
        PatternMatcher.match(content.content),
        LinkValidator.validate(content.content)
      ])

      // Aggregate toxicity results
      if (toxicityResult.scores) {
        scores.toxicity = toxicityResult.scores.toxicity || 0
        scores.threat = toxicityResult.scores.threat || 0
        scores.profanity = toxicityResult.scores.profanity || 0
        scores.sexuallyExplicit = toxicityResult.scores.sexually_explicit || 0
        flags.push(...toxicityResult.flags)
      }

      // Add spam results
      if (spamResult.isSpam) {
        scores.spam = spamResult.confidence
        flags.push({
          type: 'spam',
          reason: spamResult.reason || 'Content appears to be spam',
          confidence: spamResult.confidence,
          details: spamResult.factors
        })
      }

      // Add content analysis results
      flags.push(...contentAnalysis.flags)
      scores.quality = contentAnalysis.qualityScore

      // Add word filter results
      if (wordFilterResult.found) {
        const maxSeverity = Math.max(...wordFilterResult.matches.map(m => 
          WordFilter.getSeverityScore(m.severity)
        ))
        scores.profanity = Math.max(scores.profanity || 0, maxSeverity)
        
        flags.push({
          type: 'inappropriate_content',
          reason: 'Banned words detected',
          confidence: 0.95,
          details: { matches: wordFilterResult.matches }
        })
      }

      // Add pattern matcher results
      flags.push(...patternResult.flags)

      // Add link validation results
      flags.push(...linkResult.flags)

      // Calculate overall confidence and severity
      const { confidence, severity } = this.calculateOverallScores(scores, flags, trustBonus)

      // Determine suggested action
      const suggestedAction = this.determineSuggestedAction(
        confidence,
        severity,
        flags,
        userRep.level
      )

      // Build result
      const result: ModerationResult = {
        passed: flags.length === 0 || (confidence < 0.5 && trustBonus > 0.3),
        confidence,
        severity,
        flags,
        scores,
        suggestedAction,
        reason: this.generateReason(flags),
        processingTime: Date.now() - startTime,
        metadata: {
          userReputation: userRep.level,
          trustBonus,
          checksPerformed: [
            'toxicity',
            'spam',
            'content_analysis',
            'word_filter',
            'pattern_matcher',
            'link_validator'
          ]
        }
      }

      // Generate edit suggestions if needed
      if (suggestedAction === 'edit') {
        result.editSuggestions = this.generateEditSuggestions(flags, wordFilterResult)
      }

      // Process through workflows
      const workflowResult = await WorkflowManager.processContent(content, result)
      result.workflowAction = workflowResult.action
      result.autoApproved = workflowResult.autoApproved

      // Cache result
      await cacheManager.set(cacheKey, result, {
        ttl: this.CACHE_TTL,
        tags: ['moderation', `user:${content.authorId}`]
      })

      // Update user stats based on result
      if (!result.passed) {
        await this.updateUserStats(content.authorId, result)
      }

      return result

    } catch (error) {
      console.error('Moderation error:', error)
      
      // Return safe default on error
      return {
        passed: false,
        confidence: 0,
        severity: 'medium',
        flags: [{
          type: 'error',
          reason: 'Moderation system error',
          confidence: 1,
          details: { error: error.message }
        }],
        scores: {},
        suggestedAction: 'review',
        reason: 'Content requires manual review due to system error',
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Calculate trust bonus based on reputation level
   */
  private static calculateTrustBonus(level: string): number {
    const bonuses: Record<string, number> = {
      'new': 0,
      'member': 0.1,
      'contributor': 0.2,
      'regular': 0.3,
      'trusted': 0.4,
      'expert': 0.5,
      'elite': 0.6
    }
    return bonuses[level] || 0
  }

  /**
   * Calculate overall confidence and severity
   */
  private static calculateOverallScores(
    scores: Record<string, number>,
    flags: ModerationFlag[],
    trustBonus: number
  ): {
    confidence: number
    severity: 'low' | 'medium' | 'high' | 'critical'
  } {
    // Calculate weighted confidence
    let totalWeight = 0
    let weightedSum = 0

    const weights = {
      toxicity: 2.0,
      threat: 3.0,
      profanity: 1.5,
      sexuallyExplicit: 2.0,
      spam: 1.5,
      quality: 0.5
    }

    for (const [key, score] of Object.entries(scores)) {
      const weight = weights[key as keyof typeof weights] || 1.0
      weightedSum += score * weight
      totalWeight += weight
    }

    let confidence = totalWeight > 0 ? weightedSum / totalWeight : 0
    
    // Apply trust bonus (reduces confidence in violations)
    confidence = Math.max(0, confidence - trustBonus)

    // Determine severity based on flags and scores
    let severity: ModerationResult['severity'] = 'low'
    
    if (flags.some(f => f.type === 'hate_speech' || f.type === 'threat')) {
      severity = 'critical'
    } else if (flags.some(f => f.type === 'medical_misinformation')) {
      severity = 'high'
    } else if (confidence > 0.7) {
      severity = 'high'
    } else if (confidence > 0.5) {
      severity = 'medium'
    }

    return { confidence, severity }
  }

  /**
   * Determine suggested action
   */
  private static determineSuggestedAction(
    confidence: number,
    severity: ModerationResult['severity'],
    flags: ModerationFlag[],
    userLevel: string
  ): ModerationResult['suggestedAction'] {
    // Critical violations always rejected
    if (severity === 'critical') {
      return 'reject'
    }

    // Trusted users get more lenient treatment
    if (['trusted', 'expert', 'elite'].includes(userLevel)) {
      if (confidence < 0.8) return 'approve'
      if (severity === 'low') return 'edit'
    }

    // High confidence violations
    if (confidence > 0.9) {
      return severity === 'high' ? 'reject' : 'warn'
    }

    // Medium confidence
    if (confidence > 0.7) {
      if (severity === 'high') return 'review'
      return 'edit'
    }

    // Low confidence
    if (confidence > 0.5) {
      return 'review'
    }

    // Very low confidence - approve
    return 'approve'
  }

  /**
   * Generate reason from flags
   */
  private static generateReason(flags: ModerationFlag[]): string {
    if (flags.length === 0) return 'Content passed all checks'

    const reasons = flags
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3)
      .map(f => f.reason)

    return reasons.join('; ')
  }

  /**
   * Generate edit suggestions
   */
  private static generateEditSuggestions(
    flags: ModerationFlag[],
    wordFilterResult: any
  ): string[] {
    const suggestions: string[] = []

    // Word filter suggestions
    if (wordFilterResult.found) {
      suggestions.push('Remove or replace inappropriate language')
      if (wordFilterResult.censored) {
        suggestions.push(`Suggested edit: "${wordFilterResult.censored}"`)
      }
    }

    // Link suggestions
    const linkFlags = flags.filter(f => f.type === 'spam' && f.details?.url)
    if (linkFlags.length > 0) {
      suggestions.push('Remove suspicious or shortened URLs')
    }

    // Personal info suggestions
    const piFlags = flags.filter(f => f.type === 'personal_info')
    if (piFlags.length > 0) {
      suggestions.push('Remove personal information (emails, phone numbers, addresses)')
    }

    // Medical claim suggestions
    const medFlags = flags.filter(f => f.type === 'medical_misinformation')
    if (medFlags.length > 0) {
      suggestions.push('Remove or qualify medical claims with proper citations')
      suggestions.push('Avoid absolute statements about treatments or cures')
    }

    return suggestions
  }

  /**
   * Update user violation stats
   */
  private static async updateUserStats(
    userId: string,
    result: ModerationResult
  ): Promise<void> {
    // Update violation count
    await UserReputation.updateReputation(
      userId,
      result.suggestedAction === 'reject' ? 'content_rejected' : 'content_needs_edit',
      { moderationResult: result }
    )
  }

  /**
   * Hash content for caching
   */
  private static hashContent(content: ContentItem): string {
    const str = `${content.type}:${content.content}:${content.authorId}`
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Bulk moderate multiple items
   */
  static async moderateBulk(
    items: ContentItem[]
  ): Promise<ModerationResult[]> {
    // Process in batches to avoid overwhelming the system
    const batchSize = 10
    const results: ModerationResult[] = []

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(item => this.moderate(item))
      )
      results.push(...batchResults)
    }

    return results
  }

  /**
   * Get moderation statistics
   */
  static async getStats(timeframe: 'hour' | 'day' | 'week' | 'month' = 'day'): Promise<{
    total: number
    passed: number
    rejected: number
    reviewed: number
    avgProcessingTime: number
    topFlags: Array<{ type: string, count: number }>
    severityBreakdown: Record<string, number>
  }> {
    // This would query from a stats table
    // For now, return mock data
    return {
      total: 1000,
      passed: 850,
      rejected: 50,
      reviewed: 100,
      avgProcessingTime: 245,
      topFlags: [
        { type: 'spam', count: 45 },
        { type: 'inappropriate_content', count: 30 },
        { type: 'personal_info', count: 15 }
      ],
      severityBreakdown: {
        low: 700,
        medium: 200,
        high: 75,
        critical: 25
      }
    }
  }
}