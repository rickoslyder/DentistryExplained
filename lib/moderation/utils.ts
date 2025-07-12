/**
 * Moderation System Utilities
 * 
 * Helper functions for the moderation system
 */

import { WordFilter } from './filters/word-filter'
import { PatternMatcher } from './filters/pattern-matcher'
import { WorkflowManager } from './workflows/workflow-manager'
import { supabase } from '@/lib/supabase'

/**
 * Initialize the moderation system
 */
export async function initializeModeration(): Promise<void> {
  console.log('Initializing moderation system...')
  
  try {
    // Initialize all components
    await Promise.all([
      WordFilter.initialize(),
      PatternMatcher.initialize(),
      WorkflowManager.initialize()
    ])
    
    console.log('Moderation system initialized successfully')
  } catch (error) {
    console.error('Failed to initialize moderation system:', error)
    throw error
  }
}

/**
 * Cleanup moderation system resources
 */
export async function cleanupModeration(): Promise<void> {
  console.log('Cleaning up moderation system...')
  
  // Any cleanup tasks here
  // For now, just log
  
  console.log('Moderation system cleanup complete')
}

/**
 * Export moderation report
 */
export async function exportModerationReport(
  startDate: Date,
  endDate: Date
): Promise<{
  summary: any
  details: any[]
  csv: string
}> {
  // Fetch moderation logs
  const { data: logs, error } = await supabase
    .from('moderation_logs')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .lte('created_at', endDate.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error('Failed to fetch moderation logs')
  }

  // Generate summary
  const summary = {
    totalActions: logs?.length || 0,
    byAction: {} as Record<string, number>,
    byContentType: {} as Record<string, number>,
    byModerator: {} as Record<string, number>
  }

  // Process logs
  for (const log of logs || []) {
    // By action
    summary.byAction[log.action] = (summary.byAction[log.action] || 0) + 1
    
    // By content type
    summary.byContentType[log.content_type] = (summary.byContentType[log.content_type] || 0) + 1
    
    // By moderator
    if (log.moderator_id) {
      summary.byModerator[log.moderator_id] = (summary.byModerator[log.moderator_id] || 0) + 1
    }
  }

  // Generate CSV
  const csv = generateCSV(logs || [])

  return {
    summary,
    details: logs || [],
    csv
  }
}

/**
 * Generate CSV from logs
 */
function generateCSV(logs: any[]): string {
  const headers = [
    'Date',
    'Action',
    'Content Type',
    'Content ID',
    'User ID',
    'Moderator ID',
    'Details'
  ]

  const rows = logs.map(log => [
    new Date(log.created_at).toLocaleString(),
    log.action,
    log.content_type,
    log.content_id,
    log.user_id,
    log.moderator_id || 'System',
    JSON.stringify(log.details || {})
  ])

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')
}

/**
 * Test moderation on sample content
 */
export async function testModeration(content: string): Promise<{
  wordFilter: any
  patternMatcher: any
  links: any
}> {
  const [wordFilter, patternMatcher, links] = await Promise.all([
    WordFilter.check(content),
    PatternMatcher.match(content),
    (async () => {
      const { LinkValidator } = await import('./filters/link-validator')
      return LinkValidator.validate(content)
    })()
  ])

  return {
    wordFilter,
    patternMatcher,
    links
  }
}

/**
 * Sanitize content for display
 */
export function sanitizeContent(content: string, censorWords = true): string {
  let sanitized = content

  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '')

  // Escape special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')

  return sanitized
}

/**
 * Calculate content hash for deduplication
 */
export function hashContent(content: string): string {
  let hash = 0
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

/**
 * Check if user is rate limited
 */
export async function checkRateLimit(
  userId: string,
  action: string,
  limit: number = 10,
  window: number = 3600000 // 1 hour
): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const now = Date.now()
  const windowStart = new Date(now - window)

  // Count recent actions
  const { count, error } = await supabase
    .from('user_actions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', action)
    .gte('created_at', windowStart.toISOString())

  if (error) {
    console.error('Failed to check rate limit:', error)
    return { allowed: true, remaining: limit, resetAt: new Date(now + window) }
  }

  const used = count || 0
  const remaining = Math.max(0, limit - used)
  const allowed = remaining > 0

  return {
    allowed,
    remaining,
    resetAt: new Date(now + window)
  }
}

/**
 * Format moderation result for display
 */
export function formatModerationResult(result: any): string {
  const lines = []

  lines.push(`Status: ${result.passed ? 'PASSED ✓' : 'FAILED ✗'}`)
  lines.push(`Confidence: ${(result.confidence * 100).toFixed(1)}%`)
  lines.push(`Severity: ${result.severity || 'N/A'}`)
  
  if (result.flags && result.flags.length > 0) {
    lines.push('\nFlags:')
    for (const flag of result.flags) {
      lines.push(`  - ${flag.type}: ${flag.reason}`)
    }
  }

  if (result.suggestedAction) {
    lines.push(`\nSuggested Action: ${result.suggestedAction}`)
  }

  if (result.editSuggestions && result.editSuggestions.length > 0) {
    lines.push('\nEdit Suggestions:')
    for (const suggestion of result.editSuggestions) {
      lines.push(`  - ${suggestion}`)
    }
  }

  return lines.join('\n')
}