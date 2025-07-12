/**
 * Word Filter
 * 
 * Filters banned words and inappropriate language
 */

import { BannedWord, WordFilterResult, ModerationSeverity } from '../types'
import { getSettings } from '@/lib/settings'
import { cacheManager } from '@/lib/cache'

export class WordFilter {
  private static bannedWords: Map<string, BannedWord> = new Map()
  private static initialized = false
  private static readonly CACHE_PREFIX = 'moderation:words:'

  /**
   * Initialize word filter
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // Load default banned words
      this.loadDefaultWords()

      // Load custom words from settings
      const settings = await getSettings()
      const customWords = settings.moderation?.wordFilter?.customWords || []
      
      for (const word of customWords) {
        if (word.enabled) {
          this.addWord(word)
        }
      }

      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize word filter:', error)
    }
  }

  /**
   * Check content for banned words
   */
  static async check(content: string): Promise<WordFilterResult> {
    await this.initialize()

    const contentLower = content.toLowerCase()
    const matches: WordFilterResult['matches'] = []
    let censored = content

    // Check each banned word
    for (const [key, bannedWord] of this.bannedWords) {
      if (!bannedWord.enabled) continue

      const patterns = this.createPatterns(bannedWord)
      
      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'gi')
        let match: RegExpExecArray | null

        while ((match = regex.exec(content)) !== null) {
          // Check context exceptions
          if (this.isException(content, match.index, bannedWord)) {
            continue
          }

          matches.push({
            word: match[0],
            position: match.index,
            severity: bannedWord.severity,
            category: bannedWord.category
          })

          // Censor the word
          const replacement = '*'.repeat(match[0].length)
          censored = censored.substring(0, match.index) + 
                    replacement + 
                    censored.substring(match.index + match[0].length)
        }
      }
    }

    return {
      found: matches.length > 0,
      matches,
      censored: matches.length > 0 ? censored : undefined
    }
  }

  /**
   * Add a banned word
   */
  static addWord(word: BannedWord): void {
    this.bannedWords.set(word.word.toLowerCase(), word)
    
    // Also add variations
    if (word.variations) {
      for (const variation of word.variations) {
        this.bannedWords.set(variation.toLowerCase(), {
          ...word,
          word: variation
        })
      }
    }
  }

  /**
   * Remove a banned word
   */
  static removeWord(word: string): void {
    this.bannedWords.delete(word.toLowerCase())
  }

  /**
   * Create regex patterns for a word
   */
  private static createPatterns(word: BannedWord): string[] {
    const patterns: string[] = []
    const baseWord = word.word.toLowerCase()

    // Exact match pattern
    patterns.push(`\\b${this.escapeRegex(baseWord)}\\b`)

    // Common obfuscation patterns
    const obfuscations = this.generateObfuscations(baseWord)
    for (const obfuscation of obfuscations) {
      patterns.push(`\\b${this.escapeRegex(obfuscation)}\\b`)
    }

    // Add variations
    if (word.variations) {
      for (const variation of word.variations) {
        patterns.push(`\\b${this.escapeRegex(variation.toLowerCase())}\\b`)
      }
    }

    return patterns
  }

  /**
   * Generate common obfuscations of a word
   */
  private static generateObfuscations(word: string): string[] {
    const obfuscations: string[] = []

    // Letter substitutions
    const substitutions: Record<string, string[]> = {
      'a': ['@', '4'],
      'e': ['3'],
      'i': ['1', '!'],
      'o': ['0'],
      's': ['5', '$'],
      'l': ['1'],
      'g': ['9']
    }

    // Generate single substitutions
    for (let i = 0; i < word.length; i++) {
      const char = word[i]
      const subs = substitutions[char]
      
      if (subs) {
        for (const sub of subs) {
          const obfuscated = word.substring(0, i) + sub + word.substring(i + 1)
          obfuscations.push(obfuscated)
        }
      }
    }

    // Spacing variations (f u c k)
    if (word.length <= 6) {
      const spaced = word.split('').join('\\s*')
      obfuscations.push(spaced)
    }

    // Repeated characters (fuuuck)
    const repeated = word.replace(/(.)/g, '$1+')
    obfuscations.push(repeated)

    return obfuscations
  }

  /**
   * Check if match is an exception
   */
  private static isException(
    content: string,
    position: number,
    word: BannedWord
  ): boolean {
    if (!word.contextExceptions || word.contextExceptions.length === 0) {
      return false
    }

    // Get surrounding context (50 chars before and after)
    const contextStart = Math.max(0, position - 50)
    const contextEnd = Math.min(content.length, position + word.word.length + 50)
    const context = content.substring(contextStart, contextEnd).toLowerCase()

    // Check each exception pattern
    for (const exception of word.contextExceptions) {
      if (context.includes(exception.toLowerCase())) {
        return true
      }
    }

    return false
  }

  /**
   * Escape regex special characters
   */
  private static escapeRegex(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  /**
   * Load default banned words
   */
  private static loadDefaultWords(): void {
    // Common profanity (dental context appropriate filtering)
    const defaultWords: BannedWord[] = [
      {
        id: 'prof_1',
        word: 'fuck',
        severity: 'high',
        category: 'profanity',
        variations: ['f*ck', 'fck', 'fuk'],
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'prof_2',
        word: 'shit',
        severity: 'medium',
        category: 'profanity',
        variations: ['sh*t', 'sh1t'],
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'prof_3',
        word: 'ass',
        severity: 'low',
        category: 'profanity',
        contextExceptions: ['class', 'pass', 'mass', 'assist', 'assess'],
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      // Slurs and hate speech
      {
        id: 'hate_1',
        word: 'nigger',
        severity: 'critical',
        category: 'hate_speech',
        variations: ['n*gger', 'n1gger', 'n!gger'],
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'hate_2',
        word: 'faggot',
        severity: 'critical',
        category: 'hate_speech',
        variations: ['f*ggot', 'fag'],
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      // Medical misinformation keywords
      {
        id: 'misinfo_1',
        word: 'cure-all',
        severity: 'medium',
        category: 'medical_misinformation',
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      },
      {
        id: 'misinfo_2',
        word: 'miracle cure',
        severity: 'high',
        category: 'medical_misinformation',
        enabled: true,
        createdAt: new Date(),
        createdBy: 'system'
      }
    ]

    for (const word of defaultWords) {
      this.addWord(word)
    }
  }

  /**
   * Get severity score
   */
  static getSeverityScore(severity: ModerationSeverity): number {
    const scores = {
      'low': 0.25,
      'medium': 0.5,
      'high': 0.75,
      'critical': 1.0
    }
    return scores[severity]
  }

  /**
   * Update word list from database
   */
  static async updateFromDatabase(): Promise<void> {
    this.initialized = false
    await this.initialize()
  }
}