/**
 * Workflow Manager
 * 
 * Orchestrates moderation workflows and automated actions
 */

import { ContentItem, ModerationResult, WorkflowRule, WorkflowAction } from '../types'
import { ReviewQueue } from './review-queue'
import { getSettings } from '@/lib/settings'
import { supabase } from '@/lib/supabase'

export class WorkflowManager {
  private static workflows: Map<string, WorkflowRule> = new Map()
  private static initialized = false

  /**
   * Initialize workflow manager
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load default workflows
      this.loadDefaultWorkflows()

      // Load custom workflows from settings
      const settings = await getSettings()
      const customWorkflows = settings.moderation?.workflows?.customRules || []
      
      for (const workflow of customWorkflows) {
        if (workflow.enabled) {
          this.addWorkflow(workflow)
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize workflow manager:', error)
    }
  }

  /**
   * Process content through workflows
   */
  static async processContent(
    content: ContentItem,
    result: ModerationResult
  ): Promise<{
    action: WorkflowAction
    appliedRules: string[]
    autoApproved: boolean
  }> {
    await this.initialize()

    const appliedRules: string[] = []
    let finalAction: WorkflowAction = 'none'
    let autoApproved = false

    // Check each workflow rule
    for (const [id, workflow] of this.workflows) {
      if (!workflow.enabled) continue

      if (this.matchesConditions(content, result, workflow)) {
        appliedRules.push(id)
        
        // Apply actions in order of severity
        const action = this.determineAction(workflow, result)
        if (this.isMoreSevere(action, finalAction)) {
          finalAction = action
        }

        // Check for auto-approval
        if (workflow.autoApprove && result.confidence > (workflow.confidenceThreshold || 0.9)) {
          autoApproved = true
        }
      }
    }

    // Execute the final action
    if (finalAction !== 'none') {
      await this.executeAction(content, result, finalAction, autoApproved)
    }

    return { action: finalAction, appliedRules, autoApproved }
  }

  /**
   * Check if content matches workflow conditions
   */
  private static matchesConditions(
    content: ContentItem,
    result: ModerationResult,
    workflow: WorkflowRule
  ): boolean {
    // Check content type
    if (workflow.conditions.contentTypes && 
        !workflow.conditions.contentTypes.includes(content.type)) {
      return false
    }

    // Check user type
    if (workflow.conditions.userTypes && content.authorId) {
      // Would need to fetch user type from profiles
      // For now, skip this check
    }

    // Check confidence threshold
    if (workflow.conditions.minConfidence && 
        result.confidence < workflow.conditions.minConfidence) {
      return false
    }

    // Check flag types
    if (workflow.conditions.flagTypes && workflow.conditions.flagTypes.length > 0) {
      const hasRequiredFlag = workflow.conditions.flagTypes.some(type =>
        result.flags.some(flag => flag.type === type)
      )
      if (!hasRequiredFlag) return false
    }

    // Check severity levels
    if (workflow.conditions.severityLevels && workflow.conditions.severityLevels.length > 0) {
      const hasSeverity = workflow.conditions.severityLevels.includes(
        result.severity || 'low'
      )
      if (!hasSeverity) return false
    }

    // Check reputation threshold
    if (workflow.conditions.userReputation) {
      // Would need to fetch user reputation
      // For now, skip this check
    }

    return true
  }

  /**
   * Determine action based on workflow and result
   */
  private static determineAction(
    workflow: WorkflowRule,
    result: ModerationResult
  ): WorkflowAction {
    // Use workflow action or fall back to suggested action
    if (workflow.actions.primary) {
      return workflow.actions.primary
    }

    // Map moderation result to workflow action
    const actionMap: Record<string, WorkflowAction> = {
      'approve': 'approve',
      'reject': 'reject',
      'review': 'queue_review',
      'edit': 'require_edit',
      'warn': 'warn_user',
      'ban': 'ban_user',
      'shadowban': 'shadowban_user'
    }

    return actionMap[result.suggestedAction] || 'queue_review'
  }

  /**
   * Execute workflow action
   */
  private static async executeAction(
    content: ContentItem,
    result: ModerationResult,
    action: WorkflowAction,
    autoApproved: boolean
  ): Promise<void> {
    switch (action) {
      case 'approve':
        await this.approveContent(content, result, autoApproved)
        break
      
      case 'reject':
        await this.rejectContent(content, result)
        break
      
      case 'queue_review':
        await ReviewQueue.addToQueue(content, result, this.getPriority(result))
        break
      
      case 'require_edit':
        await this.requireEdit(content, result)
        break
      
      case 'warn_user':
        await this.warnUser(content, result)
        break
      
      case 'suspend_user':
        await this.suspendUser(content, result)
        break
      
      case 'ban_user':
        await this.banUser(content, result)
        break
      
      case 'shadowban_user':
        await this.shadowbanUser(content, result)
        break
      
      case 'escalate':
        await this.escalateToAdmin(content, result)
        break
    }

    // Log action
    await this.logWorkflowAction(content, result, action)
  }

  /**
   * Approve content
   */
  private static async approveContent(
    content: ContentItem,
    result: ModerationResult,
    autoApproved: boolean
  ): Promise<void> {
    const tableName = this.getContentTable(content.type)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'approved',
          moderated_at: new Date().toISOString(),
          auto_approved: autoApproved
        })
        .eq('id', content.id)
    }
  }

  /**
   * Reject content
   */
  private static async rejectContent(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    const tableName = this.getContentTable(content.type)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'rejected',
          moderated_at: new Date().toISOString(),
          rejection_reason: result.reason || 'Content violates community guidelines'
        })
        .eq('id', content.id)
    }

    // Notify user
    await this.notifyUser(content.authorId, {
      type: 'content_rejected',
      contentId: content.id,
      reason: result.reason
    })
  }

  /**
   * Require content edit
   */
  private static async requireEdit(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    const tableName = this.getContentTable(content.type)
    if (tableName) {
      await supabase
        .from(tableName)
        .update({
          moderation_status: 'needs_edit',
          moderated_at: new Date().toISOString(),
          edit_suggestions: result.editSuggestions || []
        })
        .eq('id', content.id)
    }

    await this.notifyUser(content.authorId, {
      type: 'content_needs_edit',
      contentId: content.id,
      suggestions: result.editSuggestions
    })
  }

  /**
   * Warn user
   */
  private static async warnUser(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    await supabase
      .from('user_warnings')
      .insert({
        user_id: content.authorId,
        content_id: content.id,
        reason: result.reason || 'Content violation',
        severity: result.severity || 'medium',
        created_at: new Date().toISOString()
      })

    await this.notifyUser(content.authorId, {
      type: 'warning',
      reason: result.reason,
      severity: result.severity
    })
  }

  /**
   * Suspend user
   */
  private static async suspendUser(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    const duration = this.getSuspensionDuration(result.severity)
    const suspendedUntil = new Date(Date.now() + duration)

    await supabase
      .from('profiles')
      .update({
        is_suspended: true,
        suspended_until: suspendedUntil.toISOString(),
        suspension_reason: result.reason
      })
      .eq('id', content.authorId)

    await this.notifyUser(content.authorId, {
      type: 'suspension',
      until: suspendedUntil,
      reason: result.reason
    })
  }

  /**
   * Ban user
   */
  private static async banUser(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        is_banned: true,
        banned_at: new Date().toISOString(),
        ban_reason: result.reason
      })
      .eq('id', content.authorId)
  }

  /**
   * Shadowban user
   */
  private static async shadowbanUser(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    await supabase
      .from('profiles')
      .update({
        is_shadowbanned: true,
        shadowbanned_at: new Date().toISOString()
      })
      .eq('id', content.authorId)
  }

  /**
   * Escalate to admin
   */
  private static async escalateToAdmin(
    content: ContentItem,
    result: ModerationResult
  ): Promise<void> {
    await ReviewQueue.addToQueue(content, result, 'critical')
    
    // Send admin notification
    await this.notifyAdmins({
      type: 'escalation',
      contentId: content.id,
      reason: result.reason,
      severity: 'critical'
    })
  }

  /**
   * Get priority based on result
   */
  private static getPriority(result: ModerationResult): 'low' | 'medium' | 'high' | 'critical' {
    if (result.severity === 'critical') return 'critical'
    if (result.confidence > 0.8) return 'high'
    if (result.confidence > 0.6) return 'medium'
    return 'low'
  }

  /**
   * Get suspension duration based on severity
   */
  private static getSuspensionDuration(severity?: string): number {
    const durations = {
      'low': 24 * 60 * 60 * 1000, // 1 day
      'medium': 7 * 24 * 60 * 60 * 1000, // 7 days
      'high': 30 * 24 * 60 * 60 * 1000, // 30 days
      'critical': 90 * 24 * 60 * 60 * 1000 // 90 days
    }
    return durations[severity as keyof typeof durations] || durations.medium
  }

  /**
   * Check if action is more severe
   */
  private static isMoreSevere(action1: WorkflowAction, action2: WorkflowAction): boolean {
    const severityOrder: WorkflowAction[] = [
      'none',
      'approve',
      'queue_review',
      'require_edit',
      'warn_user',
      'suspend_user',
      'shadowban_user',
      'ban_user',
      'reject',
      'escalate'
    ]

    const index1 = severityOrder.indexOf(action1)
    const index2 = severityOrder.indexOf(action2)
    
    return index1 > index2
  }

  /**
   * Get content table name
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
   * Add workflow rule
   */
  static addWorkflow(workflow: WorkflowRule): void {
    this.workflows.set(workflow.id, workflow)
  }

  /**
   * Remove workflow rule
   */
  static removeWorkflow(id: string): void {
    this.workflows.delete(id)
  }

  /**
   * Load default workflows
   */
  private static loadDefaultWorkflows(): void {
    const defaultWorkflows: WorkflowRule[] = [
      {
        id: 'auto_approve_trusted',
        name: 'Auto-approve trusted users',
        description: 'Automatically approve content from users with high reputation',
        conditions: {
          userReputation: { min: 100 },
          minConfidence: 0.8
        },
        actions: {
          primary: 'approve'
        },
        priority: 1,
        enabled: true,
        autoApprove: true,
        confidenceThreshold: 0.8
      },
      {
        id: 'reject_hate_speech',
        name: 'Reject hate speech',
        description: 'Automatically reject content with hate speech',
        conditions: {
          flagTypes: ['hate_speech'],
          minConfidence: 0.9
        },
        actions: {
          primary: 'reject',
          secondary: 'warn_user'
        },
        priority: 10,
        enabled: true
      },
      {
        id: 'escalate_medical_misinfo',
        name: 'Escalate medical misinformation',
        description: 'Escalate potential medical misinformation to admins',
        conditions: {
          flagTypes: ['medical_misinformation'],
          minConfidence: 0.7
        },
        actions: {
          primary: 'escalate'
        },
        priority: 9,
        enabled: true
      },
      {
        id: 'shadowban_spammers',
        name: 'Shadowban repeat spammers',
        description: 'Shadowban users with multiple spam violations',
        conditions: {
          flagTypes: ['spam'],
          userViolationCount: { min: 3 }
        },
        actions: {
          primary: 'shadowban_user'
        },
        priority: 8,
        enabled: true
      },
      {
        id: 'queue_low_confidence',
        name: 'Queue low confidence',
        description: 'Queue content with low confidence scores for manual review',
        conditions: {
          maxConfidence: 0.5
        },
        actions: {
          primary: 'queue_review'
        },
        priority: 2,
        enabled: true
      }
    ]

    for (const workflow of defaultWorkflows) {
      this.addWorkflow(workflow)
    }
  }

  /**
   * Notify user
   */
  private static async notifyUser(userId: string, notification: any): Promise<void> {
    // Implementation depends on notification system
    console.log('User notification:', { userId, notification })
  }

  /**
   * Notify admins
   */
  private static async notifyAdmins(notification: any): Promise<void> {
    // Implementation depends on notification system
    console.log('Admin notification:', notification)
  }

  /**
   * Log workflow action
   */
  private static async logWorkflowAction(
    content: ContentItem,
    result: ModerationResult,
    action: WorkflowAction
  ): Promise<void> {
    await supabase
      .from('workflow_logs')
      .insert({
        content_id: content.id,
        content_type: content.type,
        user_id: content.authorId,
        action,
        moderation_result: result,
        created_at: new Date().toISOString()
      })
  }
}