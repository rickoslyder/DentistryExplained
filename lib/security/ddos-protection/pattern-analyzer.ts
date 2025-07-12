/**
 * Request Pattern Analyzer
 * 
 * Analyzes request patterns to detect potential DDoS attacks
 */

import { RequestPattern, ThreatScore, ThreatFactor } from '../types'
import { cacheManager } from '@/lib/cache'

export class PatternAnalyzer {
  private static readonly WINDOW_SIZE = 60000 // 1 minute
  private static readonly PATTERN_CACHE_TTL = 300 // 5 minutes

  /**
   * Analyze request pattern and calculate threat score
   */
  static async analyze(pattern: RequestPattern): Promise<ThreatScore> {
    const factors: ThreatFactor[] = []
    let totalScore = 0

    // Check request frequency
    const frequencyScore = await this.analyzeFrequency(pattern.ip)
    if (frequencyScore.weight > 0) {
      factors.push(frequencyScore)
      totalScore += frequencyScore.weight
    }

    // Check for suspicious user agents
    const userAgentScore = this.analyzeUserAgent(pattern.userAgent)
    if (userAgentScore.weight > 0) {
      factors.push(userAgentScore)
      totalScore += userAgentScore.weight
    }

    // Check for path scanning patterns
    const pathScore = await this.analyzePathPattern(pattern.ip, pattern.path)
    if (pathScore.weight > 0) {
      factors.push(pathScore)
      totalScore += pathScore.weight
    }

    // Check for header anomalies
    const headerScore = this.analyzeHeaders(pattern.headers)
    if (headerScore.weight > 0) {
      factors.push(headerScore)
      totalScore += headerScore.weight
    }

    // Check for method patterns
    const methodScore = await this.analyzeMethodPattern(pattern.ip, pattern.method)
    if (methodScore.weight > 0) {
      factors.push(methodScore)
      totalScore += methodScore.weight
    }

    // Determine recommendation based on score
    let recommendation: 'allow' | 'challenge' | 'block'
    if (totalScore >= 80) {
      recommendation = 'block'
    } else if (totalScore >= 50) {
      recommendation = 'challenge'
    } else {
      recommendation = 'allow'
    }

    return {
      score: Math.min(100, totalScore),
      factors,
      recommendation
    }
  }

  /**
   * Analyze request frequency from IP
   */
  private static async analyzeFrequency(ip: string): Promise<ThreatFactor> {
    const key = `pattern:freq:${ip}`
    const now = Date.now()
    
    // Get recent requests
    const recentRequests = await cacheManager.get<number[]>(key) || []
    
    // Add current request
    recentRequests.push(now)
    
    // Filter to window size
    const windowStart = now - this.WINDOW_SIZE
    const requestsInWindow = recentRequests.filter(ts => ts > windowStart)
    
    // Update cache
    await cacheManager.set(key, requestsInWindow, { ttl: this.PATTERN_CACHE_TTL })
    
    // Calculate score based on request rate
    const requestsPerSecond = requestsInWindow.length / (this.WINDOW_SIZE / 1000)
    let weight = 0
    let description = ''
    
    if (requestsPerSecond > 10) {
      weight = 40
      description = `Very high request rate: ${requestsPerSecond.toFixed(1)} req/s`
    } else if (requestsPerSecond > 5) {
      weight = 20
      description = `High request rate: ${requestsPerSecond.toFixed(1)} req/s`
    } else if (requestsPerSecond > 2) {
      weight = 10
      description = `Elevated request rate: ${requestsPerSecond.toFixed(1)} req/s`
    }
    
    return {
      name: 'request_frequency',
      weight,
      description
    }
  }

  /**
   * Analyze user agent for suspicious patterns
   */
  private static analyzeUserAgent(userAgent: string): ThreatFactor {
    let weight = 0
    let description = ''
    
    // Check for empty or missing user agent
    if (!userAgent || userAgent.trim() === '') {
      weight = 30
      description = 'Missing user agent'
    }
    // Check for known bad user agents
    else if (this.isSuspiciousUserAgent(userAgent)) {
      weight = 40
      description = 'Suspicious user agent detected'
    }
    // Check for bot patterns
    else if (this.isBotUserAgent(userAgent)) {
      weight = 20
      description = 'Bot user agent detected'
    }
    
    return {
      name: 'user_agent',
      weight,
      description
    }
  }

  /**
   * Analyze path access patterns
   */
  private static async analyzePathPattern(ip: string, path: string): Promise<ThreatFactor> {
    const key = `pattern:paths:${ip}`
    
    // Get recent paths accessed
    const recentPaths = await cacheManager.get<string[]>(key) || []
    recentPaths.push(path)
    
    // Keep last 100 paths
    const pathsToKeep = recentPaths.slice(-100)
    await cacheManager.set(key, pathsToKeep, { ttl: this.PATTERN_CACHE_TTL })
    
    let weight = 0
    let description = ''
    
    // Check for path scanning
    const uniquePaths = new Set(pathsToKeep)
    if (uniquePaths.size > 50) {
      weight = 30
      description = `Path scanning detected: ${uniquePaths.size} unique paths`
    }
    
    // Check for admin/sensitive path attempts
    const sensitivePathPatterns = [
      /\/admin/i,
      /\/api\/internal/i,
      /\/.env/i,
      /\/config/i,
      /\/\.git/i,
      /\/wp-admin/i,
      /\/phpmyadmin/i
    ]
    
    const sensitivePaths = pathsToKeep.filter(p => 
      sensitivePathPatterns.some(pattern => pattern.test(p))
    )
    
    if (sensitivePaths.length > 5) {
      weight += 40
      description = `Multiple sensitive path attempts: ${sensitivePaths.length}`
    }
    
    return {
      name: 'path_pattern',
      weight,
      description
    }
  }

  /**
   * Analyze request headers for anomalies
   */
  private static analyzeHeaders(headers: Record<string, string>): ThreatFactor {
    let weight = 0
    let description = ''
    const issues: string[] = []
    
    // Check for missing standard headers
    const expectedHeaders = ['host', 'accept', 'accept-language']
    const missingHeaders = expectedHeaders.filter(h => !headers[h])
    
    if (missingHeaders.length > 0) {
      weight += 10 * missingHeaders.length
      issues.push(`Missing headers: ${missingHeaders.join(', ')}`)
    }
    
    // Check for suspicious header values
    if (headers['x-forwarded-for']?.split(',').length > 5) {
      weight += 20
      issues.push('Excessive proxy chain')
    }
    
    // Check for injection attempts in headers
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /SELECT.*FROM/i,
      /UNION.*SELECT/i
    ]
    
    for (const [key, value] of Object.entries(headers)) {
      if (injectionPatterns.some(pattern => pattern.test(value))) {
        weight += 50
        issues.push(`Injection attempt in header: ${key}`)
        break
      }
    }
    
    if (issues.length > 0) {
      description = issues.join('; ')
    }
    
    return {
      name: 'header_analysis',
      weight,
      description
    }
  }

  /**
   * Analyze HTTP method patterns
   */
  private static async analyzeMethodPattern(ip: string, method: string): Promise<ThreatFactor> {
    const key = `pattern:methods:${ip}`
    
    // Get recent methods
    const recentMethods = await cacheManager.get<string[]>(key) || []
    recentMethods.push(method)
    
    // Keep last 50 methods
    const methodsToKeep = recentMethods.slice(-50)
    await cacheManager.set(key, methodsToKeep, { ttl: this.PATTERN_CACHE_TTL })
    
    let weight = 0
    let description = ''
    
    // Check for unusual method patterns
    const methodCounts = methodsToKeep.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    // Excessive non-GET/POST methods
    const unusualMethods = Object.entries(methodCounts)
      .filter(([m, _]) => !['GET', 'POST'].includes(m))
      .reduce((sum, [_, count]) => sum + count, 0)
    
    if (unusualMethods > 10) {
      weight = 30
      description = `Excessive unusual HTTP methods: ${unusualMethods}`
    }
    
    return {
      name: 'method_pattern',
      weight,
      description
    }
  }

  /**
   * Check if user agent is suspicious
   */
  private static isSuspiciousUserAgent(userAgent: string): boolean {
    const suspiciousPatterns = [
      /sqlmap/i,
      /nikto/i,
      /havij/i,
      /commix/i,
      /metasploit/i,
      /arachni/i,
      /joomla/i,
      /libwww-perl/i,
      /masscan/i,
      /nmap/i
    ]
    
    return suspiciousPatterns.some(pattern => pattern.test(userAgent))
  }

  /**
   * Check if user agent is a bot
   */
  private static isBotUserAgent(userAgent: string): boolean {
    const botPatterns = [
      /bot/i,
      /crawler/i,
      /spider/i,
      /scraper/i,
      /curl/i,
      /wget/i,
      /python/i,
      /java/i,
      /ruby/i,
      /go-http-client/i
    ]
    
    return botPatterns.some(pattern => pattern.test(userAgent))
  }
}