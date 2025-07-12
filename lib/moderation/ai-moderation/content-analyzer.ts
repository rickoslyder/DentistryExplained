/**
 * Content Analyzer
 * 
 * Analyzes content for dental-specific issues and medical misinformation
 */

import { ContentItem, ModerationFlag } from '../types'
import { cacheManager } from '@/lib/cache'

export class ContentAnalyzer {
  private static readonly CACHE_PREFIX = 'moderation:analysis:'
  private static readonly CACHE_TTL = 7200 // 2 hours

  /**
   * Analyze content for various issues
   */
  static async analyze(content: ContentItem): Promise<{
    flags: ModerationFlag[]
    medicalClaims: MedicalClaim[]
    personalInfo: PersonalInfo[]
    qualityScore: number
  }> {
    // Check cache
    const cacheKey = `${this.CACHE_PREFIX}${this.hashContent(content.content)}`
    const cached = await cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    const flags: ModerationFlag[] = []
    
    // Check for medical misinformation
    const medicalClaims = this.detectMedicalClaims(content.content)
    if (medicalClaims.some(c => c.suspicious)) {
      flags.push({
        type: 'medical_misinformation',
        reason: 'Potentially misleading medical claims detected',
        confidence: 0.7,
        details: { claims: medicalClaims.filter(c => c.suspicious) }
      })
    }

    // Check for personal information
    const personalInfo = this.detectPersonalInfo(content.content)
    if (personalInfo.length > 0) {
      flags.push({
        type: 'personal_info',
        reason: 'Personal information detected',
        confidence: 0.9,
        details: { found: personalInfo }
      })
    }

    // Check content quality
    const qualityScore = this.assessContentQuality(content.content)
    if (qualityScore < 0.3) {
      flags.push({
        type: 'inappropriate_content',
        reason: 'Low quality content',
        confidence: 0.6,
        details: { qualityScore }
      })
    }

    // Check for off-topic content
    if (content.type === 'comment' || content.type === 'chat_message') {
      const isOffTopic = this.checkOffTopic(content.content)
      if (isOffTopic) {
        flags.push({
          type: 'off_topic',
          reason: 'Content appears to be off-topic for dental discussion',
          confidence: 0.6,
          details: {}
        })
      }
    }

    const result = {
      flags,
      medicalClaims,
      personalInfo,
      qualityScore
    }

    // Cache result
    await cacheManager.set(cacheKey, result, { 
      ttl: this.CACHE_TTL,
      tags: ['moderation', 'content-analysis']
    })

    return result
  }

  /**
   * Detect medical claims in content
   */
  private static detectMedicalClaims(content: string): MedicalClaim[] {
    const claims: MedicalClaim[] = []
    
    // Patterns for medical claims
    const claimPatterns = [
      {
        pattern: /\b(cure|treat|heal|fix|eliminate)\s+([\w\s]+)(\s+in\s+\d+\s+(days?|weeks?|months?))?/gi,
        type: 'treatment_claim'
      },
      {
        pattern: /\b(prevent|stop|avoid)\s+([\w\s]+disease|decay|infection|cancer)/gi,
        type: 'prevention_claim'
      },
      {
        pattern: /\b(guaranteed|proven|clinically proven|scientifically proven)\s+to\b/gi,
        type: 'guarantee_claim'
      },
      {
        pattern: /\b(only|best|most effective|superior)\s+(treatment|method|solution)/gi,
        type: 'superlative_claim'
      },
      {
        pattern: /\b\d+%\s+(effective|success rate|improvement|reduction)/gi,
        type: 'statistical_claim'
      }
    ]

    for (const { pattern, type } of claimPatterns) {
      const matches = Array.from(content.matchAll(pattern))
      for (const match of matches) {
        const claim: MedicalClaim = {
          text: match[0],
          type,
          position: match.index || 0,
          suspicious: this.isClaimSuspicious(match[0], type)
        }
        claims.push(claim)
      }
    }

    // Check for specific misleading claims
    const misleadingPatterns = [
      /\b(fluoride|toothpaste)\s+is\s+(toxic|poison|dangerous)/gi,
      /\b(root canal|filling)s?\s+cause\s+(cancer|disease)/gi,
      /\b(oil pulling|charcoal)\s+(whitens?|removes?)\s+cavities/gi,
      /\bdentists?\s+(lie|scam|conspiracy)/gi
    ]

    for (const pattern of misleadingPatterns) {
      const matches = Array.from(content.matchAll(pattern))
      for (const match of matches) {
        claims.push({
          text: match[0],
          type: 'misleading_claim',
          position: match.index || 0,
          suspicious: true
        })
      }
    }

    return claims
  }

  /**
   * Check if a medical claim is suspicious
   */
  private static isClaimSuspicious(claim: string, type: string): boolean {
    // Claims that guarantee results are often suspicious
    if (type === 'guarantee_claim') return true
    
    // Check for extreme language
    const extremeWords = ['miracle', 'revolutionary', 'breakthrough', 'secret']
    const claimLower = claim.toLowerCase()
    
    return extremeWords.some(word => claimLower.includes(word))
  }

  /**
   * Detect personal information
   */
  private static detectPersonalInfo(content: string): PersonalInfo[] {
    const personalInfo: PersonalInfo[] = []

    // Email addresses
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
    const emails = content.match(emailPattern) || []
    emails.forEach(email => {
      personalInfo.push({
        type: 'email',
        value: email,
        position: content.indexOf(email)
      })
    })

    // Phone numbers (UK format)
    const phonePatterns = [
      /\b0[1-9]\d{9,10}\b/g, // UK landline/mobile
      /\b\+44\s?\d{10}\b/g, // International UK
      /\b07\d{9}\b/g // UK mobile
    ]
    
    for (const pattern of phonePatterns) {
      const phones = content.match(pattern) || []
      phones.forEach(phone => {
        personalInfo.push({
          type: 'phone',
          value: phone,
          position: content.indexOf(phone)
        })
      })
    }

    // NHS numbers (format: 123 456 7890)
    const nhsPattern = /\b\d{3}\s?\d{3}\s?\d{4}\b/g
    const potentialNHS = content.match(nhsPattern) || []
    potentialNHS.forEach(nhs => {
      if (this.isLikelyNHSNumber(nhs)) {
        personalInfo.push({
          type: 'nhs_number',
          value: nhs,
          position: content.indexOf(nhs)
        })
      }
    })

    // Addresses (simplified detection)
    const addressPattern = /\b\d+\s+[A-Z][a-z]+\s+(Street|St|Road|Rd|Avenue|Ave|Lane|Ln|Drive|Dr)\b/gi
    const addresses = content.match(addressPattern) || []
    addresses.forEach(address => {
      personalInfo.push({
        type: 'address',
        value: address,
        position: content.indexOf(address)
      })
    })

    // Full names (heuristic - two or more capitalized words)
    const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+(\s+[A-Z][a-z]+)?\b/g
    const potentialNames = content.match(namePattern) || []
    potentialNames.forEach(name => {
      if (this.isLikelyPersonName(name)) {
        personalInfo.push({
          type: 'name',
          value: name,
          position: content.indexOf(name)
        })
      }
    })

    return personalInfo
  }

  /**
   * Check if a number sequence is likely an NHS number
   */
  private static isLikelyNHSNumber(text: string): boolean {
    const digits = text.replace(/\s/g, '')
    return digits.length === 10 && /^\d+$/.test(digits)
  }

  /**
   * Check if text is likely a person's name
   */
  private static isLikelyPersonName(text: string): boolean {
    // Common title prefixes
    const titles = ['Dr', 'Mr', 'Mrs', 'Ms', 'Miss', 'Prof']
    const words = text.split(' ')
    
    // Check if starts with title
    if (titles.includes(words[0])) return true
    
    // Check against common non-name words
    const nonNames = ['The', 'This', 'That', 'These', 'Those', 'Very', 'Much']
    if (nonNames.some(word => text.includes(word))) return false
    
    // Basic heuristic: 2-3 capitalized words
    return words.length >= 2 && words.length <= 3 && 
           words.every(w => /^[A-Z][a-z]+$/.test(w))
  }

  /**
   * Assess content quality
   */
  private static assessContentQuality(content: string): number {
    let score = 1.0

    // Check length
    const words = content.split(/\s+/).filter(w => w.length > 0)
    if (words.length < 5) {
      score -= 0.3 // Too short
    } else if (words.length > 1000) {
      score -= 0.1 // Too long for typical comment
    }

    // Check for coherence (basic)
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)
    if (sentences.length === 0 || (words.length > 20 && sentences.length === 1)) {
      score -= 0.2 // No proper sentences
    }

    // Check for random characters
    const randomCharPattern = /[^\w\s.,!?;:'"()-]/g
    const randomChars = content.match(randomCharPattern) || []
    if (randomChars.length > content.length * 0.1) {
      score -= 0.3 // Too many special characters
    }

    // Check for gibberish (repeated characters)
    const gibberishPattern = /(.)\1{4,}/g
    if (gibberishPattern.test(content)) {
      score -= 0.4
    }

    // Check for meaningful words (basic vocabulary check)
    const meaninglessPattern = /\b[bcdfghjklmnpqrstvwxyz]{5,}\b/gi
    const meaninglessWords = content.match(meaninglessPattern) || []
    if (meaninglessWords.length > words.length * 0.2) {
      score -= 0.3 // Too many consonant clusters
    }

    return Math.max(0, score)
  }

  /**
   * Check if content is off-topic
   */
  private static checkOffTopic(content: string): boolean {
    const contentLower = content.toLowerCase()
    
    // Dental-related keywords
    const dentalKeywords = [
      'tooth', 'teeth', 'dental', 'dentist', 'cavity', 'filling',
      'crown', 'implant', 'gum', 'oral', 'mouth', 'hygiene',
      'brush', 'floss', 'extraction', 'orthodontic', 'braces'
    ]

    // Check if content contains any dental keywords
    const hasDentalContent = dentalKeywords.some(keyword => 
      contentLower.includes(keyword)
    )

    // If no dental keywords and content is substantial, might be off-topic
    const words = content.split(/\s+/).filter(w => w.length > 0)
    if (!hasDentalContent && words.length > 20) {
      // Check for common off-topic patterns
      const offTopicPatterns = [
        /\b(politics|election|government|president|minister)\b/gi,
        /\b(cryptocurrency|bitcoin|forex|trading|invest)\b/gi,
        /\b(casino|gambling|lottery|bet)\b/gi,
        /\b(diet|weight loss|fitness|gym)\b/gi
      ]

      return offTopicPatterns.some(pattern => pattern.test(content))
    }

    return false
  }

  /**
   * Hash content for caching
   */
  private static hashContent(content: string): string {
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(36)
  }
}

interface MedicalClaim {
  text: string
  type: string
  position: number
  suspicious: boolean
}

interface PersonalInfo {
  type: 'email' | 'phone' | 'nhs_number' | 'address' | 'name'
  value: string
  position: number
}