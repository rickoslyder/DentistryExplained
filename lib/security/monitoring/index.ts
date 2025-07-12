/**
 * Security Monitoring Module
 * 
 * Main entry point for security monitoring and threat detection
 */

import { NextRequest } from 'next/server'
import { SecurityDashboard } from './security-dashboard'
import { ThreatDetector } from './threat-detector'
import { 
  SecurityEvent, 
  SecurityEventType,
  SecuritySeverity,
  RequestPattern 
} from '../types'
import { getSecurityContext } from '../context'
import { cacheManager } from '@/lib/cache'

export class SecurityMonitoring {
  private static monitoringInterval: NodeJS.Timeout | null = null
  private static initialized = false

  /**
   * Initialize security monitoring
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    // Start periodic monitoring
    this.startMonitoring()
    
    this.initialized = true
  }

  /**
   * Start periodic monitoring tasks
   */
  private static startMonitoring(): void {
    if (this.monitoringInterval) return

    // Run monitoring tasks every 5 minutes
    this.monitoringInterval = setInterval(async () => {
      try {
        await SecurityDashboard.checkThresholds()
      } catch (error) {
        console.error('Security monitoring error:', error)
      }
    }, 300000) // 5 minutes
  }

  /**
   * Stop monitoring
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  /**
   * Log security event
   */
  static async logEvent(
    type: SecurityEventType,
    severity: SecuritySeverity,
    details: Record<string, any>,
    resolution?: {
      action: 'allowed' | 'challenged' | 'blocked' | 'logged'
      reason: string
      details?: Record<string, any>
    }
  ): Promise<void> {
    const context = getSecurityContext()
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      userId: context.userId,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date(),
      handled: true,
      details,
      resolution
    }

    // Store event
    const key = `security:events:${event.id}`
    await cacheManager.set(key, event, { ttl: 86400 }) // 24 hours

    // Update recent events list
    const recentKey = 'security:events:recent'
    const recent = await cacheManager.get<string[]>(recentKey) || []
    recent.unshift(event.id)
    await cacheManager.set(recentKey, recent.slice(0, 1000), { ttl: 86400 })

    // Let threat detector learn from event
    await ThreatDetector.learn(event)

    // Check if we need to create an alert
    if (severity === 'critical' || (severity === 'high' && type === 'ddos_attack_detected')) {
      await SecurityDashboard.createAlert(
        this.mapEventToAlertType(type),
        severity,
        `Security Event: ${type}`,
        `${type} detected from IP ${context.ip}`,
        { event }
      )
    }
  }

  /**
   * Analyze request for threats
   */
  static async analyzeRequest(req: NextRequest): Promise<{
    allowed: boolean
    challenge?: string
    reason?: string
  }> {
    const context = getSecurityContext()
    const url = new URL(req.url)
    
    // Create request pattern
    const pattern: RequestPattern = {
      ip: context.ip,
      userAgent: context.userAgent || '',
      path: url.pathname,
      method: req.method,
      timestamp: Date.now(),
      headers: Object.fromEntries(req.headers.entries())
    }

    // Analyze for threats
    const analysis = await ThreatDetector.analyzeRequest(pattern)

    // Log the analysis
    if (analysis.indicators.length > 0) {
      await this.logEvent(
        'suspicious_pattern',
        analysis.threatLevel === 'critical' ? 'critical' : 
        analysis.threatLevel === 'high' ? 'high' : 'medium',
        {
          analysis,
          pattern
        }
      )
    }

    // Take action based on analysis
    if (analysis.shouldBlock) {
      return {
        allowed: false,
        reason: 'Threat detected: ' + analysis.indicators[0].description
      }
    }

    if (analysis.shouldChallenge) {
      return {
        allowed: false,
        challenge: 'captcha', // Or other challenge type
        reason: 'Suspicious activity detected'
      }
    }

    return { allowed: true }
  }

  /**
   * Get monitoring dashboard data
   */
  static async getDashboard(): Promise<{
    summary: any
    metrics: any
    events: any[]
    alerts: any[]
  }> {
    const [summary, events, alerts] = await Promise.all([
      SecurityDashboard.getSummary(),
      SecurityDashboard.getRecentEvents(50),
      SecurityDashboard.getActiveAlerts()
    ])

    return {
      summary,
      metrics: summary.metrics,
      events,
      alerts
    }
  }

  /**
   * Map event type to alert type
   */
  private static mapEventToAlertType(eventType: SecurityEventType): any {
    const mapping: Record<string, string> = {
      'ddos_attack_detected': 'ddos_attack',
      'malicious_payload': 'data_breach_attempt',
      'authentication_failed': 'brute_force',
      'api_key_invalid': 'api_abuse',
      'suspicious_pattern': 'suspicious_activity'
    }

    return mapping[eventType] || 'suspicious_activity'
  }
}

// Export sub-modules
export { SecurityDashboard, ThreatDetector }

// Convenience functions
export async function logSecurityEvent(
  type: SecurityEventType,
  severity: SecuritySeverity,
  details: Record<string, any>
): Promise<void> {
  return SecurityMonitoring.logEvent(type, severity, details)
}

export async function analyzeSecurityThreat(
  req: NextRequest
): Promise<ReturnType<typeof SecurityMonitoring.analyzeRequest>> {
  return SecurityMonitoring.analyzeRequest(req)
}