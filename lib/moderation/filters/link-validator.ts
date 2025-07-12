/**
 * Link Validator
 * 
 * Validates and checks URLs for safety
 */

import { ModerationFlag } from '../types'
import { cacheManager } from '@/lib/cache'

export class LinkValidator {
  private static readonly CACHE_PREFIX = 'moderation:links:'
  private static readonly CACHE_TTL = 86400 // 24 hours
  
  // Known safe domains
  private static readonly SAFE_DOMAINS = new Set([
    'nhs.uk',
    'nice.org.uk',
    'bda.org',
    'gdc-uk.org',
    'dentalhealth.org',
    'dentistry-explained.vercel.app',
    'dentistryexplained.com'
  ])

  // Known malicious patterns
  private static readonly MALICIOUS_PATTERNS = [
    /phishing/i,
    /malware/i,
    /virus/i,
    /\.tk$/i,
    /\.ml$/i,
    /\.ga$/i,
    /\.cf$/i
  ]

  // URL shorteners that could hide malicious links
  private static readonly URL_SHORTENERS = new Set([
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    't.co',
    'short.link',
    'ow.ly',
    'is.gd',
    'buff.ly',
    'adf.ly',
    'shorte.st'
  ])

  /**
   * Validate links in content
   */
  static async validate(content: string): Promise<{
    links: LinkInfo[]
    flags: ModerationFlag[]
  }> {
    const links: LinkInfo[] = []
    const flags: ModerationFlag[] = []

    // Extract URLs
    const urlPattern = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi
    const matches = content.match(urlPattern) || []

    for (const url of matches) {
      try {
        const linkInfo = await this.analyzeLink(url)
        links.push(linkInfo)

        if (linkInfo.suspicious) {
          flags.push({
            type: 'spam',
            reason: linkInfo.reason || 'Suspicious link detected',
            confidence: linkInfo.riskScore,
            details: { url, analysis: linkInfo }
          })
        }
      } catch (error) {
        // If we can't analyze, consider it suspicious
        links.push({
          url,
          domain: 'unknown',
          suspicious: true,
          riskScore: 0.7,
          reason: 'Failed to analyze link'
        })
      }
    }

    return { links, flags }
  }

  /**
   * Analyze a single link
   */
  static async analyzeLink(url: string): Promise<LinkInfo> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${this.hashUrl(url)}`
    const cached = await cacheManager.get<LinkInfo>(cacheKey)
    if (cached) {
      return cached
    }

    const info: LinkInfo = {
      url,
      domain: '',
      suspicious: false,
      riskScore: 0
    }

    try {
      const urlObj = new URL(url)
      info.domain = urlObj.hostname

      // Check if it's a safe domain
      if (this.isSafeDomain(info.domain)) {
        info.riskScore = 0
        info.safe = true
      } else {
        // Perform various checks
        const checks = await Promise.all([
          this.checkMaliciousPatterns(url),
          this.checkUrlShortener(info.domain),
          this.checkSuspiciousTLD(info.domain),
          this.checkPhishingPatterns(url)
        ])

        // Calculate risk score
        info.riskScore = Math.max(...checks.map(c => c.score))
        info.suspicious = info.riskScore > 0.5

        if (info.suspicious) {
          info.reason = checks
            .filter(c => c.score > 0)
            .map(c => c.reason)
            .join('; ')
        }
      }

      // Check if link is affiliate/tracking
      if (this.isAffiliateLink(url)) {
        info.affiliate = true
        info.riskScore = Math.max(info.riskScore, 0.3)
      }

    } catch (error) {
      info.suspicious = true
      info.riskScore = 0.8
      info.reason = 'Invalid URL format'
    }

    // Cache the result
    await cacheManager.set(cacheKey, info, { 
      ttl: this.CACHE_TTL,
      tags: ['moderation', 'links']
    })

    return info
  }

  /**
   * Check if domain is in safe list
   */
  private static isSafeDomain(domain: string): boolean {
    // Check exact match
    if (this.SAFE_DOMAINS.has(domain)) {
      return true
    }

    // Check subdomains of safe domains
    for (const safeDomain of this.SAFE_DOMAINS) {
      if (domain.endsWith(`.${safeDomain}`)) {
        return true
      }
    }

    return false
  }

  /**
   * Check for malicious patterns
   */
  private static async checkMaliciousPatterns(url: string): Promise<CheckResult> {
    for (const pattern of this.MALICIOUS_PATTERNS) {
      if (pattern.test(url)) {
        return {
          score: 0.9,
          reason: 'URL contains malicious pattern'
        }
      }
    }

    return { score: 0, reason: '' }
  }

  /**
   * Check if URL shortener
   */
  private static async checkUrlShortener(domain: string): Promise<CheckResult> {
    if (this.URL_SHORTENERS.has(domain)) {
      return {
        score: 0.7,
        reason: 'URL shortener detected'
      }
    }

    return { score: 0, reason: '' }
  }

  /**
   * Check suspicious TLDs
   */
  private static async checkSuspiciousTLD(domain: string): Promise<CheckResult> {
    const suspiciousTLDs = ['.tk', '.ml', '.ga', '.cf', '.click', '.download']
    
    for (const tld of suspiciousTLDs) {
      if (domain.endsWith(tld)) {
        return {
          score: 0.6,
          reason: 'Suspicious top-level domain'
        }
      }
    }

    return { score: 0, reason: '' }
  }

  /**
   * Check phishing patterns
   */
  private static async checkPhishingPatterns(url: string): Promise<CheckResult> {
    const phishingPatterns = [
      // Typosquatting common dental sites
      /nhs-uk\.|uk-nhs\.|nhsuk\./i,
      /dental-health\.|dentalhealth-org\./i,
      
      // Common phishing keywords
      /verify-account|confirm-identity|update-payment/i,
      /suspended-account|locked-account/i,
      
      // IP addresses instead of domains
      /https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
      
      // Suspicious subdomains
      /^https?:\/\/[^.]+\.(tk|ml|ga|cf)\//i
    ]

    for (const pattern of phishingPatterns) {
      if (pattern.test(url)) {
        return {
          score: 0.8,
          reason: 'Potential phishing URL pattern'
        }
      }
    }

    // Check for deceptive URLs (e.g., google.malicious.com)
    const urlObj = new URL(url)
    const parts = urlObj.hostname.split('.')
    
    if (parts.length > 2) {
      const trustedDomains = ['google', 'facebook', 'paypal', 'nhs', 'gov']
      for (const trusted of trustedDomains) {
        if (parts.includes(trusted) && !this.isSafeDomain(urlObj.hostname)) {
          return {
            score: 0.7,
            reason: 'Deceptive URL structure'
          }
        }
      }
    }

    return { score: 0, reason: '' }
  }

  /**
   * Check if link is affiliate
   */
  private static isAffiliateLink(url: string): boolean {
    const affiliatePatterns = [
      /[?&]ref=/i,
      /[?&]affiliate/i,
      /[?&]utm_/i,
      /[?&]partner/i,
      /amazon\..*\/.*tag=/i,
      /amzn\.to/i,
      /[?&]click_id=/i
    ]

    return affiliatePatterns.some(pattern => pattern.test(url))
  }

  /**
   * Hash URL for caching
   */
  private static hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Check URL accessibility (optional)
   */
  static async checkAccessibility(url: string): Promise<{
    accessible: boolean
    statusCode?: number
    error?: string
  }> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      })

      return {
        accessible: response.ok,
        statusCode: response.status
      }
    } catch (error) {
      return {
        accessible: false,
        error: error.message
      }
    }
  }
}

interface LinkInfo {
  url: string
  domain: string
  suspicious: boolean
  riskScore: number
  reason?: string
  safe?: boolean
  affiliate?: boolean
}

interface CheckResult {
  score: number
  reason: string
}