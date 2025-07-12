/**
 * Spam Classification
 * 
 * Detects spam content using various heuristics and AI
 */

import { ContentItem, ModerationFlag } from '../types'
import { cacheManager } from '@/lib/cache'

export class SpamClassifier {
  private static readonly CACHE_PREFIX = 'moderation:spam:'
  private static readonly CACHE_TTL = 3600 // 1 hour

  /**
   * Classify content as spam or not
   */
  static async classify(content: ContentItem): Promise<{
    isSpam: boolean
    confidence: number
    flags: ModerationFlag[]
    score: number
  }> {
    // Check cache
    const cacheKey = `${this.CACHE_PREFIX}${this.hashContent(content.content)}`
    const cached = await cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    const flags: ModerationFlag[] = []
    let spamScore = 0

    // Check for common spam patterns
    const patternScore = this.checkSpamPatterns(content.content)
    spamScore += patternScore.score
    flags.push(...patternScore.flags)

    // Check for link density
    const linkScore = this.checkLinkDensity(content.content)
    spamScore += linkScore.score
    flags.push(...linkScore.flags)

    // Check for repetition
    const repetitionScore = this.checkRepetition(content.content)
    spamScore += repetitionScore.score
    flags.push(...repetitionScore.flags)

    // Check for ALL CAPS abuse
    const capsScore = this.checkCapsAbuse(content.content)
    spamScore += capsScore.score
    flags.push(...capsScore.flags)

    // Check for keyword stuffing
    const keywordScore = this.checkKeywordStuffing(content.content)
    spamScore += keywordScore.score
    flags.push(...keywordScore.flags)

    // Check author history
    const historyScore = await this.checkAuthorHistory(content.authorId)
    spamScore += historyScore.score
    flags.push(...historyScore.flags)

    // Normalize score to 0-1 range
    const normalizedScore = Math.min(1, spamScore / 10)
    const isSpam = normalizedScore > 0.6
    
    const result = {
      isSpam,
      confidence: isSpam ? normalizedScore : 1 - normalizedScore,
      flags,
      score: normalizedScore
    }

    // Cache result
    await cacheManager.set(cacheKey, result, { 
      ttl: this.CACHE_TTL,
      tags: ['moderation', 'spam']
    })

    return result
  }

  /**
   * Check for common spam patterns
   */
  private static checkSpamPatterns(content: string): {
    score: number
    flags: ModerationFlag[]
  } {
    const flags: ModerationFlag[] = []
    let score = 0

    const spamPatterns = [
      {
        pattern: /\b(buy|cheap|discount|offer|deal|price)\b.*\b(now|today|limited|hurry)\b/gi,
        score: 2,
        reason: 'Promotional language detected'
      },
      {
        pattern: /\b(click here|visit|check out)\s+(my|our)?\s*(website|site|link)/gi,
        score: 3,
        reason: 'Call-to-action spam pattern'
      },
      {
        pattern: /\b(congratulations|winner|won|prize|lottery|million)\b/gi,
        score: 3,
        reason: 'Prize/lottery spam pattern'
      },
      {
        pattern: /\b(viagra|cialis|pharmacy|pills|medication)\b/gi,
        score: 4,
        reason: 'Pharmaceutical spam'
      },
      {
        pattern: /\b(casino|poker|gambling|bet)\b/gi,
        score: 3,
        reason: 'Gambling spam'
      },
      {
        pattern: /\$\d+\.\d{2}/g,
        score: 1,
        reason: 'Multiple price mentions'
      },
      {
        pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi,
        score: 2,
        reason: 'Email address in content'
      },
      {
        pattern: /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/g,
        score: 1,
        reason: 'Multiple URLs'
      }
    ]

    for (const { pattern, score: patternScore, reason } of spamPatterns) {
      const matches = content.match(pattern)
      if (matches && matches.length > 0) {
        score += patternScore * Math.min(3, matches.length)
        flags.push({
          type: 'spam',
          reason,
          confidence: Math.min(1, patternScore / 4),
          details: { matches: matches.length }
        })
      }
    }

    return { score, flags }
  }

  /**
   * Check link density
   */
  private static checkLinkDensity(content: string): {
    score: number
    flags: ModerationFlag[]
  } {
    const flags: ModerationFlag[] = []
    let score = 0

    // Count URLs
    const urlPattern = /https?:\/\/[^\s]+/g
    const urls = content.match(urlPattern) || []
    
    // Count words
    const words = content.split(/\s+/).filter(w => w.length > 0)
    
    if (words.length > 0) {
      const linkDensity = urls.length / words.length
      
      if (linkDensity > 0.2) {
        score = 4
        flags.push({
          type: 'spam',
          reason: 'High link density',
          confidence: 0.8,
          details: { 
            urls: urls.length, 
            words: words.length,
            density: linkDensity 
          }
        })
      } else if (linkDensity > 0.1) {
        score = 2
        flags.push({
          type: 'spam',
          reason: 'Moderate link density',
          confidence: 0.5,
          details: { 
            urls: urls.length, 
            words: words.length,
            density: linkDensity 
          }
        })
      }
    }

    return { score, flags }
  }

  /**
   * Check for repetition
   */
  private static checkRepetition(content: string): {
    score: number
    flags: ModerationFlag[]
  } {
    const flags: ModerationFlag[] = []
    let score = 0

    // Check for repeated words
    const words = content.toLowerCase().split(/\s+/)
    const wordCounts = new Map<string, number>()
    
    for (const word of words) {
      if (word.length > 3) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
      }
    }

    // Find excessively repeated words
    const repeatedWords = Array.from(wordCounts.entries())
      .filter(([_, count]) => count > 3)
      .sort((a, b) => b[1] - a[1])

    if (repeatedWords.length > 0) {
      const maxRepetition = repeatedWords[0][1]
      if (maxRepetition > 10) {
        score = 4
        flags.push({
          type: 'spam',
          reason: 'Excessive word repetition',
          confidence: 0.9,
          details: { 
            word: repeatedWords[0][0],
            count: maxRepetition 
          }
        })
      } else if (maxRepetition > 5) {
        score = 2
        flags.push({
          type: 'spam',
          reason: 'Word repetition detected',
          confidence: 0.6,
          details: { 
            word: repeatedWords[0][0],
            count: maxRepetition 
          }
        })
      }
    }

    // Check for repeated lines
    const lines = content.split('\n').filter(l => l.trim().length > 0)
    const lineCounts = new Map<string, number>()
    
    for (const line of lines) {
      lineCounts.set(line, (lineCounts.get(line) || 0) + 1)
    }

    const repeatedLines = Array.from(lineCounts.values()).filter(count => count > 1)
    if (repeatedLines.length > 0) {
      score += 2
      flags.push({
        type: 'spam',
        reason: 'Repeated lines detected',
        confidence: 0.7,
        details: { repeatedLines: repeatedLines.length }
      })
    }

    return { score, flags }
  }

  /**
   * Check for ALL CAPS abuse
   */
  private static checkCapsAbuse(content: string): {
    score: number
    flags: ModerationFlag[]
  } {
    const flags: ModerationFlag[] = []
    let score = 0

    // Remove URLs and email addresses first
    const cleanContent = content
      .replace(/https?:\/\/[^\s]+/g, '')
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '')

    const words = cleanContent.split(/\s+/).filter(w => w.length > 2)
    const capsWords = words.filter(w => w === w.toUpperCase() && /[A-Z]/.test(w))
    
    if (words.length > 0) {
      const capsRatio = capsWords.length / words.length
      
      if (capsRatio > 0.5) {
        score = 3
        flags.push({
          type: 'spam',
          reason: 'Excessive use of CAPS',
          confidence: 0.8,
          details: { 
            capsWords: capsWords.length,
            totalWords: words.length,
            ratio: capsRatio 
          }
        })
      } else if (capsRatio > 0.3) {
        score = 1
        flags.push({
          type: 'spam',
          reason: 'High use of CAPS',
          confidence: 0.5,
          details: { 
            capsWords: capsWords.length,
            totalWords: words.length,
            ratio: capsRatio 
          }
        })
      }
    }

    return { score, flags }
  }

  /**
   * Check for keyword stuffing
   */
  private static checkKeywordStuffing(content: string): {
    score: number
    flags: ModerationFlag[]
  } {
    const flags: ModerationFlag[] = []
    let score = 0

    // Common spam keywords for dental/medical context
    const spamKeywords = [
      'dentist', 'dental', 'teeth', 'tooth', 'whitening',
      'implant', 'crown', 'best', 'cheap', 'affordable',
      'clinic', 'treatment', 'offer', 'discount', 'free'
    ]

    const contentLower = content.toLowerCase()
    const totalWords = contentLower.split(/\s+/).length

    let keywordCount = 0
    for (const keyword of spamKeywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi')
      const matches = contentLower.match(regex)
      if (matches) {
        keywordCount += matches.length
      }
    }

    const keywordDensity = totalWords > 0 ? keywordCount / totalWords : 0

    if (keywordDensity > 0.15) {
      score = 3
      flags.push({
        type: 'spam',
        reason: 'Keyword stuffing detected',
        confidence: 0.8,
        details: { 
          keywordCount,
          totalWords,
          density: keywordDensity 
        }
      })
    } else if (keywordDensity > 0.1) {
      score = 1
      flags.push({
        type: 'spam',
        reason: 'High keyword density',
        confidence: 0.5,
        details: { 
          keywordCount,
          totalWords,
          density: keywordDensity 
        }
      })
    }

    return { score, flags }
  }

  /**
   * Check author spam history
   */
  private static async checkAuthorHistory(authorId: string): Promise<{
    score: number
    flags: ModerationFlag[]
  }> {
    const flags: ModerationFlag[] = []
    let score = 0

    // Get author's spam history from cache
    const historyKey = `spam:history:${authorId}`
    const history = await cacheManager.get<{
      spamCount: number
      totalPosts: number
      lastSpamAt?: Date
    }>(historyKey)

    if (history && history.totalPosts > 0) {
      const spamRatio = history.spamCount / history.totalPosts
      
      if (spamRatio > 0.5) {
        score = 4
        flags.push({
          type: 'spam',
          reason: 'Author has high spam history',
          confidence: 0.9,
          details: { 
            spamCount: history.spamCount,
            totalPosts: history.totalPosts,
            ratio: spamRatio 
          }
        })
      } else if (spamRatio > 0.2) {
        score = 2
        flags.push({
          type: 'spam',
          reason: 'Author has moderate spam history',
          confidence: 0.6,
          details: { 
            spamCount: history.spamCount,
            totalPosts: history.totalPosts,
            ratio: spamRatio 
          }
        })
      }

      // Recent spam activity
      if (history.lastSpamAt) {
        const daysSinceLastSpam = (Date.now() - new Date(history.lastSpamAt).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSinceLastSpam < 7) {
          score += 1
          flags.push({
            type: 'spam',
            reason: 'Recent spam activity',
            confidence: 0.7,
            details: { daysSinceLastSpam }
          })
        }
      }
    }

    return { score, flags }
  }

  /**
   * Update author spam history
   */
  static async updateAuthorHistory(
    authorId: string, 
    isSpam: boolean
  ): Promise<void> {
    const historyKey = `spam:history:${authorId}`
    const history = await cacheManager.get<{
      spamCount: number
      totalPosts: number
      lastSpamAt?: Date
    }>(historyKey) || { spamCount: 0, totalPosts: 0 }

    history.totalPosts++
    if (isSpam) {
      history.spamCount++
      history.lastSpamAt = new Date()
    }

    await cacheManager.set(historyKey, history, { 
      ttl: 30 * 24 * 60 * 60 // 30 days
    })
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