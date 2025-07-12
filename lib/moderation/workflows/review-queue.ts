/**
 * Review Queue
 * 
 * Manages content review queue and moderation workflows
 */

import { ContentItem, ModerationResult, ReviewItem, ReviewAction, ReviewStatus } from '../types'
import { supabase } from '@/lib/supabase'
import { cacheManager } from '@/lib/cache'
import { getSettings } from '@/lib/settings'

export class ReviewQueue {
  private static readonly CACHE_PREFIX = 'moderation:queue:'
  private static readonly CACHE_TTL = 300 // 5 minutes

  /**
   * Add item to review queue
   */
  static async addToQueue(
    content: ContentItem,
    result: ModerationResult,
    priority: 'low' | 'medium' | 'high' | 'critical' = 'medium'
  ): Promise<ReviewItem> {
    const settings = await getSettings()
    const autoReviewThreshold = settings.moderation?.autoReview?.threshold || 0.7

    // Skip queue if confidence is high enough for auto-action
    if (result.confidence > autoReviewThreshold && result.suggestedAction !== 'review') {
      return this.createAutoReviewItem(content, result)
    }

    const reviewItem: Omit<ReviewItem, 'id' | 'createdAt' | 'updatedAt'> = {
      contentId: content.id,
      contentType: content.type,
      content: content.content,
      authorId: content.authorId,
      moderationResult: result,
      status: 'pending',
      priority,
      assignedTo: null,
      reviewedAt: null,
      reviewedBy: null,
      decision: null,
      notes: null,
      metadata: {
        source: content.source,
        context: content.context,
        reports: []
      }
    }

    // Insert into database
    const { data, error } = await supabase
      .from('moderation_queue')
      .insert(reviewItem)
      .select()
      .single()

    if (error) {
      console.error('Failed to add to review queue:', error)
      throw new Error('Failed to add to review queue')
    }

    // Invalidate cache
    await this.invalidateCache()

    // Trigger webhook if configured
    await this.triggerWebhook('item_added', data)

    return data
  }

  /**
   * Get pending items from queue
   */
  static async getPendingItems(options: {
    limit?: number
    offset?: number
    priority?: 'low' | 'medium' | 'high' | 'critical'
    contentType?: ContentItem['type']
    assignedTo?: string | null
  } = {}): Promise<{
    items: ReviewItem[]
    total: number
  }> {
    const cacheKey = `${this.CACHE_PREFIX}pending:${JSON.stringify(options)}`
    const cached = await cacheManager.get<{ items: ReviewItem[], total: number }>(cacheKey)
    if (cached) {
      return cached
    }

    let query = supabase
      .from('moderation_queue')
      .select('*', { count: 'exact' })
      .eq('status', 'pending')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })

    if (options.priority) {
      query = query.eq('priority', options.priority)
    }

    if (options.contentType) {
      query = query.eq('content_type', options.contentType)
    }

    if (options.assignedTo !== undefined) {
      query = query.eq('assigned_to', options.assignedTo)
    }

    if (options.limit) {
      query = query.limit(options.limit)
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to get pending items:', error)
      throw new Error('Failed to get pending items')
    }

    const result = {
      items: data || [],
      total: count || 0
    }

    await cacheManager.set(cacheKey, result, { 
      ttl: this.CACHE_TTL,
      tags: ['moderation', 'review-queue']
    })

    return result
  }

  /**
   * Assign item to moderator
   */
  static async assignItem(
    itemId: string,
    moderatorId: string
  ): Promise<ReviewItem> {
    const { data, error } = await supabase
      .from('moderation_queue')
      .update({
        assigned_to: moderatorId,
        status: 'in_review',
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .eq('status', 'pending')
      .select()
      .single()

    if (error) {
      console.error('Failed to assign item:', error)
      throw new Error('Failed to assign item')
    }

    await this.invalidateCache()
    await this.triggerWebhook('item_assigned', data)

    return data
  }

  /**
   * Review an item
   */
  static async reviewItem(
    itemId: string,
    moderatorId: string,
    decision: ReviewAction,
    notes?: string
  ): Promise<ReviewItem> {
    const { data: item, error: fetchError } = await supabase
      .from('moderation_queue')
      .select('*')
      .eq('id', itemId)
      .single()

    if (fetchError || !item) {
      throw new Error('Review item not found')
    }

    // Update review item
    const { data, error } = await supabase
      .from('moderation_queue')
      .update({
        status: 'reviewed' as ReviewStatus,
        reviewed_by: moderatorId,
        reviewed_at: new Date().toISOString(),
        decision,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId)
      .select()
      .single()

    if (error) {
      console.error('Failed to review item:', error)
      throw new Error('Failed to review item')
    }

    // Apply the decision
    await this.applyDecision(data, decision)

    // Update user reputation
    await this.updateUserReputation(item.authorId, decision)

    await this.invalidateCache()
    await this.triggerWebhook('item_reviewed', data)

    return data
  }

  /**
   * Apply moderation decision
   */
  private static async applyDecision(
    item: ReviewItem,
    decision: ReviewAction
  ): Promise<void> {
    switch (decision) {
      case 'approve':
        await this.approveContent(item)
        break
      case 'reject':
        await this.rejectContent(item)
        break
      case 'edit':
        await this.flagForEdit(item)
        break
      case 'warn':
        await this.warnUser(item)
        break
      case 'ban':
        await this.banUser(item)
        break
      case 'shadowban':
        await this.shadowbanUser(item)
        break
    }
  }

  /**
   * Approve content
   */
  private static async approveContent(item: ReviewItem): Promise<void> {
    // Update content status based on type
    const tableName = this.getContentTable(item.contentType)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'approved',
          moderated_at: new Date().toISOString()
        })
        .eq('id', item.contentId)
    }

    // Log approval
    await this.logModerationAction('approve', item)
  }

  /**
   * Reject content
   */
  private static async rejectContent(item: ReviewItem): Promise<void> {
    const tableName = this.getContentTable(item.contentType)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'rejected',
          moderated_at: new Date().toISOString(),
          is_deleted: true
        })
        .eq('id', item.contentId)
    }

    await this.logModerationAction('reject', item)
  }

  /**
   * Flag content for edit
   */
  private static async flagForEdit(item: ReviewItem): Promise<void> {
    const tableName = this.getContentTable(item.contentType)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'needs_edit',
          moderated_at: new Date().toISOString()
        })
        .eq('id', item.contentId)
    }

    // Notify user
    await this.notifyUser(item.authorId, {
      type: 'content_needs_edit',
      contentId: item.contentId,
      reason: item.notes || 'Your content needs editing before it can be published.'
    })

    await this.logModerationAction('edit', item)
  }

  /**
   * Warn user
   */
  private static async warnUser(item: ReviewItem): Promise<void> {
    // Record warning
    await supabase
      .from('user_warnings')
      .insert({
        user_id: item.authorId,
        reason: item.notes || 'Content violation',
        content_id: item.contentId,
        moderator_id: item.reviewedBy,
        created_at: new Date().toISOString()
      })

    // Update user status
    const { data: warnings } = await supabase
      .from('user_warnings')
      .select('id')
      .eq('user_id', item.authorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

    if (warnings && warnings.length >= 3) {
      // Auto-suspend after 3 warnings in 30 days
      await this.suspendUser(item.authorId, '7d')
    }

    await this.notifyUser(item.authorId, {
      type: 'warning',
      reason: item.notes || 'Content violation',
      warningCount: warnings?.length || 1
    })

    await this.logModerationAction('warn', item)
  }

  /**
   * Ban user
   */
  private static async banUser(item: ReviewItem): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: item.notes || 'Content violations'
      })
      .eq('id', item.authorId)

    await this.logModerationAction('ban', item)
  }

  /**
   * Shadowban user
   */
  private static async shadowbanUser(item: ReviewItem): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        is_shadowbanned: true,
        shadowbanned_at: new Date().toISOString()
      })
      .eq('id', item.authorId)

    await this.logModerationAction('shadowban', item)
  }

  /**
   * Suspend user for duration
   */
  private static async suspendUser(userId: string, duration: string): Promise<void> {
    const durationMs = this.parseDuration(duration)
    const suspendedUntil = new Date(Date.now() + durationMs)

    await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_until: suspendedUntil.toISOString()
      })
      .eq('id', userId)
  }

  /**
   * Update user reputation based on moderation action
   */
  private static async updateUserReputation(
    userId: string,
    action: ReviewAction
  ): Promise<void> {
    const reputationChanges: Record<ReviewAction, number> = {
      'approve': 5,
      'reject': -10,
      'edit': -5,
      'warn': -15,
      'ban': -100,
      'shadowban': -50
    }

    const change = reputationChanges[action]
    if (change) {
      await supabase.rpc('update_user_reputation', {
        user_id: userId,
        change: change
      })
    }
  }

  /**
   * Create auto-review item (bypassed queue)
   */
  private static createAutoReviewItem(
    content: ContentItem,
    result: ModerationResult
  ): ReviewItem {
    return {
      id: `auto-${content.id}`,
      contentId: content.id,
      contentType: content.type,
      content: content.content,
      authorId: content.authorId,
      moderationResult: result,
      status: 'reviewed',
      priority: 'low',
      assignedTo: 'system',
      reviewedAt: new Date(),
      reviewedBy: 'system',
      decision: result.suggestedAction as ReviewAction,
      notes: 'Auto-moderated based on high confidence',
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        source: content.source,
        context: content.context,
        reports: []
      }
    }
  }

  /**
   * Get content table name by type
   */
  private static getContentTable(type: ContentItem['type']): string | null {
    const tables: Record<ContentItem['type'], string> = {
      'comment': 'comments',
      'article': 'articles',
      'chat_message': 'chat_messages',
      'review': 'reviews',
      'question': 'questions',
      'answer': 'answers'
    }
    return tables[type] || null
  }

  /**
   * Parse duration string (e.g., '7d', '24h')
   */
  private static parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([dhm])$/)
    if (!match) return 0

    const [, value, unit] = match
    const multipliers = {
      'm': 60 * 1000,
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000
    }

    return parseInt(value) * (multipliers[unit as keyof typeof multipliers] || 0)
  }

  /**
   * Log moderation action
   */
  private static async logModerationAction(
    action: string,
    item: ReviewItem
  ): Promise<void> {
    await supabase
      .from('moderation_logs')
      .insert({
        action,
        content_id: item.contentId,
        content_type: item.contentType,
        user_id: item.authorId,
        moderator_id: item.reviewedBy,
        details: {
          decision: item.decision,
          notes: item.notes,
          moderation_result: item.moderationResult
        },
        created_at: new Date().toISOString()
      })
  }

  /**
   * Notify user
   */
  private static async notifyUser(
    userId: string,
    notification: any
  ): Promise<void> {
    // Implementation depends on notification system
    // For now, just log
    console.log('User notification:', { userId, notification })
  }

  /**
   * Trigger webhook
   */
  private static async triggerWebhook(
    event: string,
    data: any
  ): Promise<void> {
    const settings = await getSettings()
    const webhookUrl = settings.moderation?.webhooks?.[event]

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Event-Type': event
          },
          body: JSON.stringify({ event, data, timestamp: new Date() })
        })
      } catch (error) {
        console.error('Webhook failed:', error)
      }
    }
  }

  /**
   * Invalidate cache
   */
  private static async invalidateCache(): Promise<void> {
    await cacheManager.invalidateTag('review-queue')
  }

  /**
   * Get queue statistics
   */
  static async getQueueStats(): Promise<{
    total: number
    pending: number
    inReview: number
    reviewed: number
    byPriority: Record<string, number>
    byType: Record<string, number>
    avgReviewTime: number
  }> {
    const { data, error } = await supabase
      .from('moderation_queue')
      .select('status, priority, content_type, created_at, reviewed_at')

    if (error) {
      console.error('Failed to get queue stats:', error)
      return {
        total: 0,
        pending: 0,
        inReview: 0,
        reviewed: 0,
        byPriority: {},
        byType: {},
        avgReviewTime: 0
      }
    }

    const stats = {
      total: data.length,
      pending: 0,
      inReview: 0,
      reviewed: 0,
      byPriority: {} as Record<string, number>,
      byType: {} as Record<string, number>,
      avgReviewTime: 0
    }

    let totalReviewTime = 0
    let reviewCount = 0

    for (const item of data) {
      // Status counts
      if (item.status === 'pending') stats.pending++
      else if (item.status === 'in_review') stats.inReview++
      else if (item.status === 'reviewed') stats.reviewed++

      // Priority counts
      stats.byPriority[item.priority] = (stats.byPriority[item.priority] || 0) + 1

      // Type counts
      stats.byType[item.content_type] = (stats.byType[item.content_type] || 0) + 1

      // Review time
      if (item.reviewed_at && item.created_at) {
        const reviewTime = new Date(item.reviewed_at).getTime() - new Date(item.created_at).getTime()
        totalReviewTime += reviewTime
        reviewCount++
      }
    }

    stats.avgReviewTime = reviewCount > 0 ? totalReviewTime / reviewCount : 0

    return stats
  }
}