/**
 * Pattern Matcher
 * 
 * Matches content against regex patterns for various violations
 */

import { ContentPattern, PatternType, ModerationFlag } from '../types'
import { getSettings } from '@/lib/settings'

export class PatternMatcher {
  private static patterns: Map<string, ContentPattern> = new Map()
  private static initialized = false

  /**
   * Initialize pattern matcher
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load default patterns
      this.loadDefaultPatterns()

      // Load custom patterns from settings
      const settings = await getSettings()
      const customPatterns = settings.moderation?.patterns?.customPatterns || []
      
      for (const pattern of customPatterns) {
        if (pattern.enabled) {
          this.addPattern(pattern)
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize pattern matcher:', error)
    }
  }

  /**
   * Match content against patterns
   */
  static async match(content: string): Promise<{
    matches: PatternMatch[]
    flags: ModerationFlag[]
  }> {
    await this.initialize()

    const matches: PatternMatch[] = []
    const flags: ModerationFlag[] = []

    for (const [id, pattern] of this.patterns) {
      if (!pattern.enabled) continue

      try {
        const regex = new RegExp(pattern.pattern, pattern.flags || 'gi')
        let match: RegExpExecArray | null

        while ((match = regex.exec(content)) !== null) {
          matches.push({
            patternId: id,
            patternName: pattern.name,
            type: pattern.type,
            matched: match[0],
            position: match.index,
            groups: match.slice(1)
          })

          flags.push({
            type: this.mapPatternTypeToFlag(pattern.type),
            reason: pattern.description || `Matched pattern: ${pattern.name}`,
            confidence: 0.9,
            details: {
              pattern: pattern.name,
              matched: match[0]
            }
          })
        }
      } catch (error) {
        console.error(`Invalid regex pattern ${id}:`, error)
      }
    }

    return { matches, flags }
  }

  /**
   * Add a pattern
   */
  static addPattern(pattern: ContentPattern): void {
    this.patterns.set(pattern.id, pattern)
  }

  /**
   * Remove a pattern
   */
  static removePattern(id: string): void {
    this.patterns.delete(id)
  }

  /**
   * Load default patterns
   */
  private static loadDefaultPatterns(): void {
    const defaultPatterns: ContentPattern[] = [
      // Email patterns
      {
        id: 'email_basic',
        name: 'Email Address',
        pattern: '[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}',
        type: 'email',
        severity: 'medium',
        action: 'flag',
        description: 'Email address detected',
        enabled: true
      },
      
      // Phone patterns
      {
        id: 'phone_uk',
        name: 'UK Phone Number',
        pattern: '(?:(?:\\+44\\s?|0)(?:1\\d{3}|2\\d|3\\d{2}|7(?:[1-9]\\d{2}|624))\\s?\\d{3}\\s?\\d{3,4})',
        type: 'phone',
        severity: 'medium',
        action: 'flag',
        description: 'UK phone number detected',
        enabled: true
      },
      
      // URL patterns
      {
        id: 'url_basic',
        name: 'URL',
        pattern: 'https?:\\/\\/[^\\s]+',
        type: 'url',
        severity: 'low',
        action: 'flag',
        description: 'URL detected',
        enabled: true
      },
      
      // Shortened URL patterns (potential phishing)
      {
        id: 'url_shortened',
        name: 'Shortened URL',
        pattern: 'https?:\\/\\/(bit\\.ly|tinyurl\\.com|goo\\.gl|t\\.co|short\\.link|ow\\.ly|is\\.gd|buff\\.ly)\\/[^\\s]+',
        type: 'url',
        severity: 'high',
        action: 'flag',
        description: 'Shortened URL detected - potential security risk',
        enabled: true
      },
      
      // Personal info patterns
      {
        id: 'nhs_number',
        name: 'NHS Number',
        pattern: '\\b\\d{3}\\s?\\d{3}\\s?\\d{4}\\b',
        type: 'personal_info',
        severity: 'high',
        action: 'reject',
        description: 'Potential NHS number detected',
        enabled: true
      },
      
      {
        id: 'ni_number',
        name: 'National Insurance Number',
        pattern: '\\b[A-Z]{2}\\s?\\d{2}\\s?\\d{2}\\s?\\d{2}\\s?[A-Z]\\b',
        type: 'personal_info',
        severity: 'high',
        action: 'reject',
        description: 'National Insurance number detected',
        enabled: true
      },
      
      // Medical misinformation patterns
      {
        id: 'miracle_cure',
        name: 'Miracle Cure Claims',
        pattern: '\\b(miracle|revolutionary|breakthrough)\\s+(cure|treatment|remedy)\\b',
        type: 'medical_claim',
        severity: 'high',
        action: 'flag',
        description: 'Potentially misleading medical claim',
        enabled: true
      },
      
      {
        id: 'guarantee_claim',
        name: 'Guarantee Claims',
        pattern: '\\b(100%|guaranteed|proven)\\s+(cure|effective|results|success)\\b',
        type: 'medical_claim',
        severity: 'high',
        action: 'flag',
        description: 'Unrealistic guarantee claim',
        enabled: true
      },
      
      // Spam patterns
      {
        id: 'spam_cta',
        name: 'Spam Call-to-Action',
        pattern: '\\b(click here|buy now|order today|limited time|act now|don\'t wait)\\b',
        flags: 'i',
        type: 'spam_pattern',
        severity: 'medium',
        action: 'flag',
        description: 'Spam-like call to action',
        enabled: true
      },
      
      {
        id: 'spam_money',
        name: 'Money Spam',
        pattern: '\\b(earn|make|win)\\s+\\$?\\d+\\s*(dollars?|pounds?|£|\\$|€)\\s*(per|a)\\s*(day|week|month|hour)\\b',
        flags: 'i',
        type: 'spam_pattern',
        severity: 'high',
        action: 'reject',
        description: 'Money-making spam pattern',
        enabled: true
      },
      
      // Dental-specific patterns
      {
        id: 'fake_credentials',
        name: 'Fake Dental Credentials',
        pattern: '\\b(dr|doctor|dentist)\\s+[a-z]{2,}\\s+(dds|bds|dmd)\\b(?!\\s+\\d{6})',
        flags: 'i',
        type: 'custom',
        severity: 'medium',
        action: 'flag',
        description: 'Potential fake dental credentials (no GDC number)',
        enabled: true
      },
      
      {
        id: 'dangerous_advice',
        name: 'Dangerous DIY Dental',
        pattern: '\\b(pull|extract|remove)\\s+(your\\s+)?own\\s+tooth\\b',
        flags: 'i',
        type: 'medical_claim',
        severity: 'critical',
        action: 'reject',
        description: 'Dangerous DIY dental advice',
        enabled: true
      }
    ]

    for (const pattern of defaultPatterns) {
      this.addPattern(pattern)
    }
  }

  /**
   * Map pattern type to flag type
   */
  private static mapPatternTypeToFlag(type: PatternType): ModerationFlag['type'] {
    const mapping: Record<PatternType, ModerationFlag['type']> = {
      'email': 'personal_info',
      'phone': 'personal_info',
      'url': 'spam',
      'personal_info': 'personal_info',
      'medical_claim': 'medical_misinformation',
      'spam_pattern': 'spam',
      'custom': 'inappropriate_content'
    }

    return mapping[type] || 'inappropriate_content'
  }

  /**
   * Test a pattern
   */
  static testPattern(pattern: string, flags: string, testContent: string): {
    valid: boolean
    matches: string[]
    error?: string
  } {
    try {
      const regex = new RegExp(pattern, flags)
      const matches = testContent.match(regex) || []
      
      return {
        valid: true,
        matches: Array.from(matches)
      }
    } catch (error) {
      return {
        valid: false,
        matches: [],
        error: error.message
      }
    }
  }
}

interface PatternMatch {
  patternId: string
  patternName: string
  type: PatternType
  matched: string
  position: number
  groups: string[]
}