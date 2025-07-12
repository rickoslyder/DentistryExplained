/**
 * Threat Detection System
 * 
 * Anomaly detection and threat analysis
 */

import { 
  SecurityEvent, 
  SecurityEventType,
  RequestPattern,
  ThreatScore
} from '../types'
import { cacheManager } from '@/lib/cache'
import { SecurityDashboard } from './security-dashboard'
import { PatternAnalyzer } from '../ddos-protection/pattern-analyzer'

export interface ThreatIndicator {
  type: string
  confidence: number
  description: string
  metadata?: Record<string, any>
}

export interface ThreatAnalysis {
  threatLevel: 'low' | 'medium' | 'high' | 'critical'
  indicators: ThreatIndicator[]
  recommendations: string[]
  shouldBlock: boolean
  shouldChallenge: boolean
  shouldAlert: boolean
}

export class ThreatDetector {
  private static readonly BASELINE_WINDOW = 3600000 // 1 hour
  private static readonly ANOMALY_THRESHOLD = 3 // Standard deviations

  /**
   * Analyze request for threats
   */
  static async analyzeRequest(pattern: RequestPattern): Promise<ThreatAnalysis> {
    const indicators: ThreatIndicator[] = []

    // Get pattern analysis
    const patternScore = await PatternAnalyzer.analyze(pattern)
    
    // Check for known attack patterns
    const attackIndicators = await this.detectAttackPatterns(pattern)
    indicators.push(...attackIndicators)

    // Check for anomalies
    const anomalyIndicators = await this.detectAnomalies(pattern)
    indicators.push(...anomalyIndicators)

    // Check reputation
    const reputationIndicators = await this.checkReputation(pattern.ip)
    indicators.push(...reputationIndicators)

    // Calculate overall threat level
    const maxConfidence = Math.max(
      ...indicators.map(i => i.confidence),
      patternScore.score / 100
    )

    let threatLevel: ThreatAnalysis['threatLevel']
    if (maxConfidence >= 0.9) {
      threatLevel = 'critical'
    } else if (maxConfidence >= 0.7) {
      threatLevel = 'high'
    } else if (maxConfidence >= 0.5) {
      threatLevel = 'medium'
    } else {
      threatLevel = 'low'
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(indicators, threatLevel)

    return {
      threatLevel,
      indicators,
      recommendations,
      shouldBlock: threatLevel === 'critical' || maxConfidence >= 0.9,
      shouldChallenge: threatLevel === 'high' || maxConfidence >= 0.7,
      shouldAlert: threatLevel === 'high' || threatLevel === 'critical'
    }
  }

  /**
   * Detect known attack patterns
   */
  private static async detectAttackPatterns(
    pattern: RequestPattern
  ): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    // SQL Injection patterns
    const sqlPatterns = [
      /(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|into|where|table)\b)/i,
      /(\b(or|and)\b\s*\d+\s*=\s*\d+)/i,
      /(\'|\")\s*(or|and)\s*(\'|\")\s*=\s*(\'|\")/i
    ]

    for (const regex of sqlPatterns) {
      if (regex.test(pattern.path) || 
          Object.values(pattern.headers).some(h => regex.test(h))) {
        indicators.push({
          type: 'sql_injection',
          confidence: 0.8,
          description: 'SQL injection pattern detected',
          metadata: { pattern: regex.source }
        })
      }
    }

    // XSS patterns
    const xssPatterns = [
      /<script[^>]*>[\s\S]*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi
    ]

    for (const regex of xssPatterns) {
      if (regex.test(pattern.path) || 
          Object.values(pattern.headers).some(h => regex.test(h))) {
        indicators.push({
          type: 'xss_attempt',
          confidence: 0.7,
          description: 'Cross-site scripting pattern detected',
          metadata: { pattern: regex.source }
        })
      }
    }

    // Path traversal
    if (/\.\.[\/\\]/.test(pattern.path)) {
      indicators.push({
        type: 'path_traversal',
        confidence: 0.8,
        description: 'Path traversal attempt detected'
      })
    }

    // Command injection
    const cmdPatterns = [
      /[;&|]\s*\w+/,
      /\$\(.+\)/,
      /`.+`/
    ]

    for (const regex of cmdPatterns) {
      if (regex.test(pattern.path) || 
          Object.values(pattern.headers).some(h => regex.test(h))) {
        indicators.push({
          type: 'command_injection',
          confidence: 0.7,
          description: 'Command injection pattern detected'
        })
      }
    }

    return indicators
  }

  /**
   * Detect anomalies based on baseline
   */
  private static async detectAnomalies(
    pattern: RequestPattern
  ): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    // Get baseline statistics
    const baseline = await this.getBaseline()
    
    // Check request rate anomaly
    const requestRate = await this.getRequestRate(pattern.ip)
    if (requestRate > baseline.avgRequestRate + (baseline.stdRequestRate * this.ANOMALY_THRESHOLD)) {
      indicators.push({
        type: 'rate_anomaly',
        confidence: 0.6,
        description: `Request rate ${requestRate.toFixed(1)} req/s is anomalous`,
        metadata: { 
          rate: requestRate,
          baseline: baseline.avgRequestRate,
          threshold: baseline.avgRequestRate + (baseline.stdRequestRate * this.ANOMALY_THRESHOLD)
        }
      })
    }

    // Check path diversity anomaly
    const pathDiversity = await this.getPathDiversity(pattern.ip)
    if (pathDiversity > baseline.avgPathDiversity + (baseline.stdPathDiversity * this.ANOMALY_THRESHOLD)) {
      indicators.push({
        type: 'path_scanning',
        confidence: 0.7,
        description: 'Abnormal path diversity detected',
        metadata: { 
          diversity: pathDiversity,
          baseline: baseline.avgPathDiversity
        }
      })
    }

    // Check user agent anomaly
    if (!pattern.userAgent || pattern.userAgent.length < 10) {
      indicators.push({
        type: 'user_agent_anomaly',
        confidence: 0.5,
        description: 'Missing or suspicious user agent'
      })
    }

    return indicators
  }

  /**
   * Check IP reputation
   */
  private static async checkReputation(ip: string): Promise<ThreatIndicator[]> {
    const indicators: ThreatIndicator[] = []

    // Check if IP is in recent security events
    const recentEvents = await SecurityDashboard.getRecentEvents(1000)
    const ipEvents = recentEvents.filter(e => e.ip === ip)
    
    if (ipEvents.length > 10) {
      const badEvents = ipEvents.filter(e => 
        ['rate_limit_exceeded', 'ddos_attack_detected', 'suspicious_pattern'].includes(e.type)
      )
      
      if (badEvents.length > 5) {
        indicators.push({
          type: 'bad_reputation',
          confidence: Math.min(0.9, badEvents.length / 10),
          description: `IP has ${badEvents.length} recent security violations`,
          metadata: { 
            totalEvents: ipEvents.length,
            badEvents: badEvents.length
          }
        })
      }
    }

    // Check if IP is from known bad ASN/country
    // This would integrate with threat intelligence feeds
    // For now, just a placeholder

    return indicators
  }

  /**
   * Get baseline statistics
   */
  private static async getBaseline(): Promise<{
    avgRequestRate: number
    stdRequestRate: number
    avgPathDiversity: number
    stdPathDiversity: number
  }> {
    // This would calculate from historical data
    // For now, return reasonable defaults
    return {
      avgRequestRate: 1, // 1 request per second average
      stdRequestRate: 0.5,
      avgPathDiversity: 5, // 5 unique paths per IP average
      stdPathDiversity: 2
    }
  }

  /**
   * Get request rate for IP
   */
  private static async getRequestRate(ip: string): Promise<number> {
    const key = `threat:rate:${ip}`
    const timestamps = await cacheManager.get<number[]>(key) || []
    
    const now = Date.now()
    const recentTimestamps = timestamps.filter(ts => 
      ts > now - 60000 // Last minute
    )
    
    return recentTimestamps.length / 60 // Requests per second
  }

  /**
   * Get path diversity for IP
   */
  private static async getPathDiversity(ip: string): Promise<number> {
    const key = `threat:paths:${ip}`
    const paths = await cacheManager.get<string[]>(key) || []
    return new Set(paths).size
  }

  /**
   * Generate recommendations based on indicators
   */
  private static generateRecommendations(
    indicators: ThreatIndicator[],
    threatLevel: ThreatAnalysis['threatLevel']
  ): string[] {
    const recommendations: string[] = []

    // Check for specific attack types
    const attackTypes = new Set(indicators.map(i => i.type))

    if (attackTypes.has('sql_injection')) {
      recommendations.push('Enable SQL injection protection in WAF')
      recommendations.push('Review and parameterize all SQL queries')
    }

    if (attackTypes.has('xss_attempt')) {
      recommendations.push('Enable XSS protection headers')
      recommendations.push('Implement content security policy')
    }

    if (attackTypes.has('rate_anomaly')) {
      recommendations.push('Consider stricter rate limiting for this IP')
    }

    if (attackTypes.has('bad_reputation')) {
      recommendations.push('Consider blocking this IP permanently')
    }

    // General recommendations based on threat level
    if (threatLevel === 'critical') {
      recommendations.push('Immediate action required - consider emergency response')
      recommendations.push('Enable maximum security measures')
    } else if (threatLevel === 'high') {
      recommendations.push('Monitor closely and prepare incident response')
      recommendations.push('Consider enabling additional security challenges')
    }

    return [...new Set(recommendations)] // Remove duplicates
  }

  /**
   * Learn from security events
   */
  static async learn(event: SecurityEvent): Promise<void> {
    // Update threat models based on confirmed attacks
    // This would implement machine learning in production
    
    // For now, just track patterns
    if (event.ip) {
      const rateKey = `threat:rate:${event.ip}`
      const pathKey = `threat:paths:${event.ip}`
      
      const timestamps = await cacheManager.get<number[]>(rateKey) || []
      timestamps.push(event.timestamp.getTime())
      await cacheManager.set(rateKey, timestamps.slice(-1000), { ttl: 3600 })
      
      if (event.path) {
        const paths = await cacheManager.get<string[]>(pathKey) || []
        paths.push(event.path)
        await cacheManager.set(pathKey, paths.slice(-100), { ttl: 3600 })
      }
    }
  }
}