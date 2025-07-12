/**
 * Security Dashboard
 * 
 * Real-time security metrics and monitoring
 */

import { 
  SecurityMetrics, 
  SecurityEvent, 
  SecurityEventType,
  SecurityAlert,
  SecurityAlertType,
  SecuritySeverity
} from '../types'
import { cacheManager } from '@/lib/cache'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { getRateLimitStats } from '@/lib/rate-limiter'
import { DDoSProtection } from '../ddos-protection'
import { ContentSecurity } from '../content-security'

export class SecurityDashboard {
  private static readonly METRICS_CACHE_TTL = 60 // 1 minute
  private static readonly EVENTS_CACHE_TTL = 300 // 5 minutes

  /**
   * Get comprehensive security metrics
   */
  static async getMetrics(timeRange: {
    start: Date
    end: Date
  }): Promise<SecurityMetrics> {
    // Try cache first
    const cacheKey = `security:metrics:${timeRange.start.getTime()}-${timeRange.end.getTime()}`
    const cached = await cacheManager.get<SecurityMetrics>(cacheKey)
    if (cached) {
      return cached
    }

    // Gather metrics from various sources
    const [
      rateLimitStats,
      ddosStats,
      contentSecurityStats,
      events
    ] = await Promise.all([
      getRateLimitStats(),
      DDoSProtection.getStats(),
      ContentSecurity.getStats(),
      this.getRecentEvents(100)
    ])

    // Calculate threat metrics
    const threatsByType = events.reduce((acc, event) => {
      acc[event.type] = (acc[event.type] || 0) + 1
      return acc
    }, {} as Record<SecurityEventType, number>)

    // Calculate average threat score
    const threatScores = events
      .filter(e => e.details?.threatScore)
      .map(e => e.details.threatScore as number)
    
    const averageThreatScore = threatScores.length > 0
      ? threatScores.reduce((a, b) => a + b, 0) / threatScores.length
      : 0

    // Get top paths and IPs
    const pathCounts = new Map<string, number>()
    const ipCounts = new Map<string, number>()
    
    events.forEach(event => {
      if (event.path) {
        pathCounts.set(event.path, (pathCounts.get(event.path) || 0) + 1)
      }
      if (event.ip) {
        ipCounts.set(event.ip, (ipCounts.get(event.ip) || 0) + 1)
      }
    })

    const topPaths = Array.from(pathCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }))

    const topIPs = Array.from(ipCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    const metrics: SecurityMetrics = {
      totalRequests: rateLimitStats.totalRequests,
      blockedRequests: rateLimitStats.blockedRequests,
      challengedRequests: events.filter(e => 
        ['challenge_issued', 'challenge_passed', 'challenge_failed'].includes(e.type)
      ).length,
      rateLimitHits: rateLimitStats.blockedRequests,
      uniqueIPs: rateLimitStats.uniqueClients,
      topPaths,
      topIPs,
      threatsByType,
      averageThreatScore,
      timeRange
    }

    // Cache the results
    await cacheManager.set(cacheKey, metrics, {
      ttl: this.METRICS_CACHE_TTL,
      tags: ['security-metrics']
    })

    return metrics
  }

  /**
   * Get recent security events
   */
  static async getRecentEvents(limit: number = 50): Promise<SecurityEvent[]> {
    const recentKey = 'security:events:recent'
    const eventIds = await cacheManager.get<string[]>(recentKey) || []
    
    const events = await Promise.all(
      eventIds.slice(0, limit).map(async id => {
        const key = `security:events:${id}`
        return await cacheManager.get<SecurityEvent>(key)
      })
    )

    return events.filter(Boolean) as SecurityEvent[]
  }

  /**
   * Get security events by type
   */
  static async getEventsByType(
    type: SecurityEventType,
    limit: number = 50
  ): Promise<SecurityEvent[]> {
    const events = await this.getRecentEvents(limit * 2) // Get more to filter
    return events
      .filter(e => e.type === type)
      .slice(0, limit)
  }

  /**
   * Get active alerts
   */
  static async getActiveAlerts(): Promise<SecurityAlert[]> {
    const supabase = await createServerSupabaseClient()
    
    const { data, error } = await supabase
      .from('security_alerts')
      .select('*')
      .eq('acknowledged', false)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error('Failed to get security alerts:', error)
      return []
    }

    return data.map(alert => ({
      id: alert.id,
      type: alert.type as SecurityAlertType,
      severity: alert.severity as SecuritySeverity,
      title: alert.title,
      description: alert.description,
      metadata: alert.metadata,
      timestamp: new Date(alert.created_at),
      acknowledged: alert.acknowledged,
      acknowledgedBy: alert.acknowledged_by,
      acknowledgedAt: alert.acknowledged_at ? new Date(alert.acknowledged_at) : undefined
    }))
  }

  /**
   * Create a security alert
   */
  static async createAlert(
    type: SecurityAlertType,
    severity: SecuritySeverity,
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<SecurityAlert> {
    const alert: SecurityAlert = {
      id: crypto.randomUUID(),
      type,
      severity,
      title,
      description,
      metadata: metadata || {},
      timestamp: new Date(),
      acknowledged: false
    }

    // Store in database
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('security_alerts')
      .insert({
        id: alert.id,
        type: alert.type,
        severity: alert.severity,
        title: alert.title,
        description: alert.description,
        metadata: alert.metadata,
        created_at: alert.timestamp.toISOString()
      })

    if (error) {
      console.error('Failed to create security alert:', error)
    }

    // Trigger notifications (would implement based on settings)
    await this.sendAlertNotifications(alert)

    return alert
  }

  /**
   * Acknowledge an alert
   */
  static async acknowledgeAlert(
    alertId: string,
    userId: string
  ): Promise<void> {
    const supabase = await createServerSupabaseClient()
    
    const { error } = await supabase
      .from('security_alerts')
      .update({
        acknowledged: true,
        acknowledged_by: userId,
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId)

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`)
    }
  }

  /**
   * Send alert notifications
   */
  private static async sendAlertNotifications(alert: SecurityAlert): Promise<void> {
    // Get notification settings
    const settings = await this.getNotificationSettings()
    
    for (const channel of settings.channels) {
      if (!channel.enabled) continue
      if (!channel.events.includes(alert.type as any)) continue

      try {
        switch (channel.type) {
          case 'email':
            // Would implement email notification
            console.log('Would send email notification:', alert)
            break
          case 'webhook':
            await this.sendWebhookNotification(channel.config, alert)
            break
          case 'slack':
            // Would implement Slack notification
            console.log('Would send Slack notification:', alert)
            break
        }
      } catch (error) {
        console.error(`Failed to send ${channel.type} notification:`, error)
      }
    }
  }

  /**
   * Send webhook notification
   */
  private static async sendWebhookNotification(
    config: Record<string, any>,
    alert: SecurityAlert
  ): Promise<void> {
    if (!config.url) return

    await fetch(config.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(config.headers || {})
      },
      body: JSON.stringify({
        type: 'security_alert',
        alert,
        timestamp: new Date().toISOString()
      })
    })
  }

  /**
   * Get notification settings
   */
  private static async getNotificationSettings(): Promise<{
    channels: Array<{
      type: 'email' | 'webhook' | 'slack'
      config: Record<string, any>
      events: string[]
      enabled: boolean
    }>
  }> {
    // Would get from settings
    return {
      channels: []
    }
  }

  /**
   * Check security thresholds and create alerts
   */
  static async checkThresholds(): Promise<void> {
    const metrics = await this.getMetrics({
      start: new Date(Date.now() - 3600000), // Last hour
      end: new Date()
    })

    // Check for DDoS attack
    if (metrics.averageThreatScore > 70) {
      await this.createAlert(
        'ddos_attack',
        'critical',
        'Potential DDoS Attack Detected',
        `Average threat score is ${metrics.averageThreatScore.toFixed(1)}`,
        { metrics }
      )
    }

    // Check for high rate limit violations
    const rateLimitRate = metrics.totalRequests > 0
      ? (metrics.rateLimitHits / metrics.totalRequests) * 100
      : 0

    if (rateLimitRate > 10) {
      await this.createAlert(
        'api_abuse',
        'high',
        'High Rate Limit Violations',
        `${rateLimitRate.toFixed(1)}% of requests are hitting rate limits`,
        { metrics }
      )
    }

    // Check for suspicious activity patterns
    const suspiciousEvents = metrics.threatsByType.suspicious_pattern || 0
    if (suspiciousEvents > 100) {
      await this.createAlert(
        'suspicious_activity',
        'medium',
        'Increased Suspicious Activity',
        `${suspiciousEvents} suspicious patterns detected in the last hour`,
        { metrics }
      )
    }
  }

  /**
   * Get security summary
   */
  static async getSummary(): Promise<{
    status: 'healthy' | 'warning' | 'critical'
    metrics: SecurityMetrics
    alerts: SecurityAlert[]
    recommendations: string[]
  }> {
    const [metrics, alerts] = await Promise.all([
      this.getMetrics({
        start: new Date(Date.now() - 3600000), // Last hour
        end: new Date()
      }),
      this.getActiveAlerts()
    ])

    // Determine overall status
    let status: 'healthy' | 'warning' | 'critical' = 'healthy'
    const recommendations: string[] = []

    if (alerts.some(a => a.severity === 'critical')) {
      status = 'critical'
    } else if (alerts.some(a => a.severity === 'high') || metrics.averageThreatScore > 50) {
      status = 'warning'
    }

    // Generate recommendations
    if (metrics.averageThreatScore > 70) {
      recommendations.push('Consider enabling stricter DDoS protection rules')
    }

    if ((metrics.rateLimitHits / metrics.totalRequests) > 0.1) {
      recommendations.push('Review rate limiting rules - high violation rate detected')
    }

    if (metrics.uniqueIPs < 10 && metrics.totalRequests > 1000) {
      recommendations.push('Low IP diversity - possible bot activity')
    }

    return {
      status,
      metrics,
      alerts,
      recommendations
    }
  }
}