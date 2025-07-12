/**
 * DDoS Protection Middleware
 * 
 * Main entry point for DDoS protection system
 */

import { NextRequest, NextResponse } from 'next/server'
import { 
  DDoSProtectionConfig, 
  RequestPattern, 
  SecurityEvent,
  SecurityEventType,
  SecurityError 
} from '../types'
import { SecurityContextManager, getSecurityContext } from '../context'
import { PatternAnalyzer } from './pattern-analyzer'
import { ChallengeSystem } from './challenge-system'
import { GeoBlockingService } from './geo-blocking'
import { getSettings } from '@/lib/settings'
import { cacheManager } from '@/lib/cache'

export class DDoSProtection {
  private static config: DDoSProtectionConfig | null = null
  private static initialized = false

  /**
   * Initialize DDoS protection
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await getSettings()
      this.config = settings.security?.ddosProtection || null
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize DDoS protection:', error)
    }
  }

  /**
   * Main protection middleware
   */
  static async protect(req: NextRequest): Promise<NextResponse | null> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize()
    }

    // Skip if not enabled
    if (!this.config?.enabled) {
      return null
    }

    const context = getSecurityContext()
    const headers = Object.fromEntries(req.headers.entries())

    // Extract geo info from headers
    const geoInfo = SecurityContextManager.extractGeoInfo(req.headers)
    if (geoInfo) {
      context.geoInfo = geoInfo
    }

    // Check geo-blocking first
    if (await GeoBlockingService.shouldBlock(geoInfo)) {
      SecurityContextManager.addFlag('geo_blocked')
      await this.logSecurityEvent('geo_blocked', 'high', {
        country: geoInfo?.country,
        ip: context.ip
      })
      
      return new NextResponse('Access denied from your location', { 
        status: 403,
        headers: {
          'X-Block-Reason': 'geo-blocked'
        }
      })
    }

    // Check IP blacklist
    if (this.config.blacklistedIPs.includes(context.ip)) {
      SecurityContextManager.addFlag('blacklist')
      await this.logSecurityEvent('ip_blocked', 'high', {
        ip: context.ip,
        reason: 'blacklisted'
      })
      
      return new NextResponse('Access denied', { 
        status: 403,
        headers: {
          'X-Block-Reason': 'ip-blocked'
        }
      })
    }

    // Check IP whitelist
    if (this.config.whitelistedIPs.includes(context.ip)) {
      SecurityContextManager.addFlag('whitelist')
      return null // Allow through
    }

    // Check if already verified
    if (await ChallengeSystem.isVerified(context.ip)) {
      return null // Allow through
    }

    // Check if currently challenged
    if (await ChallengeSystem.isChallenged(context.ip)) {
      // Handle challenge response if this is a POST request
      if (req.method === 'POST') {
        try {
          const body = await req.json()
          const result = await ChallengeSystem.verify(
            context.ip,
            body.challengeId,
            body
          )
          
          if (result.success) {
            return NextResponse.json({ success: true })
          } else {
            return NextResponse.json({ 
              success: false, 
              error: result.error 
            }, { status: 400 })
          }
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: 'Invalid request' 
          }, { status: 400 })
        }
      }
      
      // Return challenge page
      return this.getChallengeResponse(context.ip)
    }

    // Create request pattern
    const pattern: RequestPattern = {
      ip: context.ip,
      userAgent: context.userAgent || '',
      path: new URL(req.url).pathname,
      method: req.method,
      timestamp: Date.now(),
      headers
    }

    // Analyze pattern
    const threatScore = await PatternAnalyzer.analyze(pattern)
    context.threatScore = threatScore.score

    // Check concurrent connections
    const connections = await this.getActiveConnections(context.ip)
    if (connections > this.config.maxConcurrentConnections) {
      await this.logSecurityEvent('ddos_attack_detected', 'critical', {
        ip: context.ip,
        connections,
        threatScore: threatScore.score
      })
      
      // Issue challenge
      const challenge = await ChallengeSystem.create(
        context.ip,
        'rateLimit',
        threatScore.score
      )
      
      return this.getChallengeResponse(context.ip, challenge.id)
    }

    // Check threat score and take action
    if (threatScore.recommendation === 'block') {
      await this.logSecurityEvent('suspicious_pattern', 'high', {
        ip: context.ip,
        threatScore: threatScore.score,
        factors: threatScore.factors
      })
      
      // Issue block challenge
      const challenge = await ChallengeSystem.create(
        context.ip,
        'block',
        threatScore.score
      )
      
      return this.getChallengeResponse(context.ip, challenge.id)
    } else if (threatScore.recommendation === 'challenge') {
      // Determine challenge type based on configuration
      const challengeType = this.selectChallengeType(threatScore.score)
      const challenge = await ChallengeSystem.create(
        context.ip,
        challengeType,
        threatScore.score
      )
      
      return this.getChallengeResponse(context.ip, challenge.id)
    }

    // Track connection
    await this.trackConnection(context.ip)

    // Allow request through
    return null
  }

  /**
   * Get active connections for IP
   */
  private static async getActiveConnections(ip: string): Promise<number> {
    const key = `ddos:connections:${ip}`
    const connections = await cacheManager.get<number>(key) || 0
    return connections
  }

  /**
   * Track connection
   */
  private static async trackConnection(ip: string): Promise<void> {
    const key = `ddos:connections:${ip}`
    const current = await cacheManager.get<number>(key) || 0
    await cacheManager.set(key, current + 1, { ttl: 60 }) // 1 minute TTL
  }

  /**
   * Select challenge type based on threat score
   */
  private static selectChallengeType(threatScore: number): ChallengeType {
    if (!this.config?.challenges.enabled) {
      return 'rateLimit'
    }

    const types = this.config.challenges.types
    
    if (threatScore > 70 && types.includes('captcha')) {
      return 'captcha'
    } else if (threatScore > 50 && types.includes('jsChallenge')) {
      return 'jsChallenge'
    } else if (types.includes('rateLimit')) {
      return 'rateLimit'
    }
    
    return 'block'
  }

  /**
   * Get challenge response
   */
  private static async getChallengeResponse(
    ip: string, 
    challengeId?: string
  ): Promise<NextResponse> {
    // Get active challenge for IP
    let challenge
    if (challengeId) {
      const key = `challenge:${ip}:${challengeId}`
      challenge = await cacheManager.get(key)
    } else {
      // Get first active challenge
      const activeKey = `challenge:active:${ip}`
      const activeChallenges = await cacheManager.get<string[]>(activeKey) || []
      if (activeChallenges.length > 0) {
        const key = `challenge:${ip}:${activeChallenges[0]}`
        challenge = await cacheManager.get(key)
      }
    }

    if (!challenge) {
      return new NextResponse('No active challenge', { status: 404 })
    }

    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Security Check - Dentistry Explained</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
          }
          .challenge-container {
            background: white;
            padding: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            max-width: 400px;
            width: 100%;
            text-align: center;
          }
          h2 {
            color: #333;
            margin-bottom: 1rem;
          }
          p {
            color: #666;
            margin-bottom: 1.5rem;
          }
          .challenge-problem {
            font-size: 1.5rem;
            font-weight: bold;
            color: #333;
            margin: 1.5rem 0;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            border: 1px solid #ddd;
            border-radius: 4px;
            margin-bottom: 1rem;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            font-size: 1rem;
            background-color: #0066cc;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          }
          button:hover {
            background-color: #0052a3;
          }
        </style>
      </head>
      <body>
        ${ChallengeSystem.getChallengeHTML(challenge)}
      </body>
      </html>
    `

    return new NextResponse(html, {
      status: 403,
      headers: {
        'Content-Type': 'text/html',
        'X-Challenge-ID': challenge.id
      }
    })
  }

  /**
   * Log security event
   */
  private static async logSecurityEvent(
    type: SecurityEventType,
    severity: SecurityEvent['severity'],
    details: Record<string, any>
  ): Promise<void> {
    const context = getSecurityContext()
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      type,
      severity,
      ip: context.ip,
      userAgent: context.userAgent,
      timestamp: new Date(),
      handled: true,
      details
    }

    // Store in cache for monitoring
    const key = `security:events:${event.id}`
    await cacheManager.set(key, event, { ttl: 86400 }) // 24 hours

    // Also add to recent events list
    const recentKey = 'security:events:recent'
    const recent = await cacheManager.get<string[]>(recentKey) || []
    recent.unshift(event.id)
    await cacheManager.set(recentKey, recent.slice(0, 100), { ttl: 86400 })

    // Log to console (in production, send to monitoring service)
    console.warn(`[Security Event] ${type}:`, details)
  }

  /**
   * Get protection statistics
   */
  static async getStats(): Promise<any> {
    const recentKey = 'security:events:recent'
    const recentEventIds = await cacheManager.get<string[]>(recentKey) || []
    
    const events = await Promise.all(
      recentEventIds.slice(0, 10).map(async id => {
        const key = `security:events:${id}`
        return await cacheManager.get<SecurityEvent>(key)
      })
    )

    return {
      recentEvents: events.filter(Boolean),
      config: this.config
    }
  }
}

// Export convenience function for middleware
export async function ddosProtection(req: NextRequest): Promise<NextResponse | null> {
  return await DDoSProtection.protect(req)
}