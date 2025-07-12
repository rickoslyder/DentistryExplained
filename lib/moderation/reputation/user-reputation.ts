/**
 * User Reputation System
 * 
 * Tracks and manages user reputation scores
 */

import { supabase } from '@/lib/supabase'
import { cacheManager } from '@/lib/cache'

export class UserReputation {
  private static readonly CACHE_PREFIX = 'reputation:'
  private static readonly CACHE_TTL = 3600 // 1 hour

  /**
   * Reputation action weights
   */
  private static readonly ACTIONS = {
    // Positive actions
    content_approved: 5,
    helpful_flag: 3,
    quality_content: 10,
    professional_verified: 50,
    admin_endorsed: 100,
    
    // Negative actions
    content_rejected: -10,
    content_needs_edit: -5,
    spam_flag: -15,
    warning_received: -20,
    suspension_received: -50,
    ban_received: -100,
    
    // Engagement actions
    comment_posted: 1,
    question_asked: 2,
    answer_provided: 3,
    article_published: 15,
    
    // Time-based decay
    daily_decay: -1,
    inactive_penalty: -5
  }

  /**
   * Get user reputation
   */
  static async getReputation(userId: string): Promise<{
    score: number
    level: ReputationLevel
    badges: ReputationBadge[]
    history: ReputationHistory[]
  }> {
    const cacheKey = `${this.CACHE_PREFIX}${userId}`
    const cached = await cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    // Get current reputation
    const { data: profile } = await supabase
      .from('profiles')
      .select('reputation_score, reputation_level, reputation_badges')
      .eq('id', userId)
      .single()

    if (!profile) {
      return {
        score: 0,
        level: 'new',
        badges: [],
        history: []
      }
    }

    // Get reputation history
    const { data: history } = await supabase
      .from('reputation_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)

    const result = {
      score: profile.reputation_score || 0,
      level: profile.reputation_level || 'new',
      badges: profile.reputation_badges || [],
      history: history || []
    }

    await cacheManager.set(cacheKey, result, {
      ttl: this.CACHE_TTL,
      tags: ['reputation', `user:${userId}`]
    })

    return result
  }

  /**
   * Update user reputation
   */
  static async updateReputation(
    userId: string,
    action: keyof typeof UserReputation.ACTIONS,
    metadata?: any
  ): Promise<{
    oldScore: number
    newScore: number
    levelChanged: boolean
    newBadges: ReputationBadge[]
  }> {
    const weight = this.ACTIONS[action] || 0
    if (weight === 0) return { oldScore: 0, newScore: 0, levelChanged: false, newBadges: [] }

    // Get current reputation
    const current = await this.getReputation(userId)
    const oldScore = current.score
    const newScore = Math.max(0, oldScore + weight) // Never go below 0

    // Determine new level
    const oldLevel = current.level
    const newLevel = this.calculateLevel(newScore)
    const levelChanged = oldLevel !== newLevel

    // Check for new badges
    const newBadges = await this.checkBadges(userId, newScore, action, metadata)

    // Update database
    const { error } = await supabase
      .from('profiles')
      .update({
        reputation_score: newScore,
        reputation_level: newLevel,
        reputation_badges: [...current.badges, ...newBadges],
        reputation_updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update reputation:', error)
      throw new Error('Failed to update reputation')
    }

    // Record history
    await supabase
      .from('reputation_history')
      .insert({
        user_id: userId,
        action,
        weight,
        old_score: oldScore,
        new_score: newScore,
        metadata,
        created_at: new Date().toISOString()
      })

    // Invalidate cache
    await cacheManager.invalidateTag(`user:${userId}`)

    // Trigger achievements if level changed
    if (levelChanged) {
      await this.triggerLevelAchievement(userId, newLevel)
    }

    return { oldScore, newScore, levelChanged, newBadges }
  }

  /**
   * Calculate reputation level
   */
  private static calculateLevel(score: number): ReputationLevel {
    if (score < 10) return 'new'
    if (score < 50) return 'member'
    if (score < 100) return 'contributor'
    if (score < 250) return 'regular'
    if (score < 500) return 'trusted'
    if (score < 1000) return 'expert'
    return 'elite'
  }

  /**
   * Check for new badges
   */
  private static async checkBadges(
    userId: string,
    score: number,
    action: string,
    metadata?: any
  ): Promise<ReputationBadge[]> {
    const newBadges: ReputationBadge[] = []
    const current = await this.getReputation(userId)
    const existingBadgeIds = current.badges.map(b => b.id)

    // Score-based badges
    const scoreBadges: Array<[number, ReputationBadge]> = [
      [100, { id: 'century', name: 'Century', description: 'Reached 100 reputation', icon: '💯' }],
      [500, { id: 'half_k', name: 'Half K', description: 'Reached 500 reputation', icon: '🌟' }],
      [1000, { id: 'kilostar', name: 'Kilostar', description: 'Reached 1000 reputation', icon: '⭐' }]
    ]

    for (const [threshold, badge] of scoreBadges) {
      if (score >= threshold && !existingBadgeIds.includes(badge.id)) {
        newBadges.push(badge)
      }
    }

    // Action-based badges
    const { data: stats } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (stats) {
      // First post badge
      if (stats.total_posts === 1 && !existingBadgeIds.includes('first_post')) {
        newBadges.push({
          id: 'first_post',
          name: 'First Post',
          description: 'Made your first post',
          icon: '✍️'
        })
      }

      // Helpful member badge
      if (stats.helpful_flags >= 10 && !existingBadgeIds.includes('helpful')) {
        newBadges.push({
          id: 'helpful',
          name: 'Helpful Member',
          description: 'Flagged 10 inappropriate posts',
          icon: '🛡️'
        })
      }

      // Quality contributor badge
      if (stats.quality_content >= 5 && !existingBadgeIds.includes('quality')) {
        newBadges.push({
          id: 'quality',
          name: 'Quality Contributor',
          description: '5 posts marked as high quality',
          icon: '✨'
        })
      }
    }

    // Professional badges
    if (action === 'professional_verified' && !existingBadgeIds.includes('verified_pro')) {
      newBadges.push({
        id: 'verified_pro',
        name: 'Verified Professional',
        description: 'GDC verified dental professional',
        icon: '🦷'
      })
    }

    return newBadges
  }

  /**
   * Trigger level achievement
   */
  private static async triggerLevelAchievement(
    userId: string,
    level: ReputationLevel
  ): Promise<void> {
    // Notify user of level change
    await this.notifyUser(userId, {
      type: 'level_up',
      newLevel: level,
      benefits: this.getLevelBenefits(level)
    })

    // Grant level-specific permissions
    await this.grantLevelPermissions(userId, level)
  }

  /**
   * Get level benefits
   */
  private static getLevelBenefits(level: ReputationLevel): string[] {
    const benefits: Record<ReputationLevel, string[]> = {
      'new': ['Basic posting privileges'],
      'member': ['Reduced moderation', 'Can flag content'],
      'contributor': ['Edit own posts without approval', 'Access to beta features'],
      'regular': ['Skip most moderation', 'Can suggest edits to others'],
      'trusted': ['Full editing privileges', 'Access to moderation tools'],
      'expert': ['Content highlighted', 'Can moderate content'],
      'elite': ['Admin panel access', 'Shape community guidelines']
    }

    return benefits[level] || []
  }

  /**
   * Grant level permissions
   */
  private static async grantLevelPermissions(
    userId: string,
    level: ReputationLevel
  ): Promise<void> {
    const permissions: Record<ReputationLevel, string[]> = {
      'new': ['post_comment'],
      'member': ['post_comment', 'flag_content'],
      'contributor': ['post_comment', 'flag_content', 'edit_own'],
      'regular': ['post_comment', 'flag_content', 'edit_own', 'suggest_edits'],
      'trusted': ['post_comment', 'flag_content', 'edit_any', 'moderate_basic'],
      'expert': ['post_comment', 'flag_content', 'edit_any', 'moderate_full'],
      'elite': ['admin_access']
    }

    const userPermissions = permissions[level] || []
    
    // Update user permissions in database
    await supabase
      .from('user_permissions')
      .upsert({
        user_id: userId,
        permissions: userPermissions,
        updated_at: new Date().toISOString()
      })
  }

  /**
   * Apply reputation decay
   */
  static async applyDecay(): Promise<void> {
    // Get inactive users (no activity in 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const { data: inactiveUsers } = await supabase
      .from('profiles')
      .select('id, reputation_score')
      .lt('last_activity_at', thirtyDaysAgo.toISOString())
      .gt('reputation_score', 0)

    if (!inactiveUsers) return

    // Apply decay
    for (const user of inactiveUsers) {
      await this.updateReputation(user.id, 'inactive_penalty')
    }
  }

  /**
   * Get reputation leaderboard
   */
  static async getLeaderboard(options: {
    limit?: number
    timeframe?: 'all' | 'month' | 'week'
  } = {}): Promise<{
    users: LeaderboardEntry[]
    total: number
  }> {
    let query = supabase
      .from('profiles')
      .select('id, username, reputation_score, reputation_level, reputation_badges, avatar_url', { count: 'exact' })
      .gt('reputation_score', 0)
      .order('reputation_score', { ascending: false })
      .limit(options.limit || 10)

    // Filter by timeframe if specified
    if (options.timeframe && options.timeframe !== 'all') {
      const cutoff = options.timeframe === 'week' 
        ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      
      query = query.gte('reputation_updated_at', cutoff.toISOString())
    }

    const { data, count, error } = await query

    if (error) {
      console.error('Failed to get leaderboard:', error)
      return { users: [], total: 0 }
    }

    return {
      users: data || [],
      total: count || 0
    }
  }

  /**
   * Notify user
   */
  private static async notifyUser(userId: string, notification: any): Promise<void> {
    // Implementation depends on notification system
    console.log('User notification:', { userId, notification })
  }
}

// Types
export type ReputationLevel = 'new' | 'member' | 'contributor' | 'regular' | 'trusted' | 'expert' | 'elite'

export interface ReputationBadge {
  id: string
  name: string
  description: string
  icon: string
  earnedAt?: Date
}

export interface ReputationHistory {
  id: string
  user_id: string
  action: string
  weight: number
  old_score: number
  new_score: number
  metadata?: any
  created_at: Date
}

export interface LeaderboardEntry {
  id: string
  username: string
  reputation_score: number
  reputation_level: ReputationLevel
  reputation_badges: ReputationBadge[]
  avatar_url?: string
}