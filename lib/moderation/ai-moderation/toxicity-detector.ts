/**
 * AI Toxicity Detection
 * 
 * Detects toxic content using multiple AI providers
 */

import { 
  ContentItem, 
  ModerationResult, 
  ModerationScores,
  ModerationFlag,
  OpenAIModerationResponse,
  PerspectiveAPIResponse,
  ModerationCategory
} from '../types'
import { getSettings } from '@/lib/settings'
import { cacheManager } from '@/lib/cache'

export class ToxicityDetector {
  private static readonly CACHE_PREFIX = 'moderation:toxicity:'
  private static readonly CACHE_TTL = 86400 // 24 hours

  /**
   * Analyze content for toxicity
   */
  static async analyze(content: ContentItem): Promise<{
    scores: ModerationScores
    flags: ModerationFlag[]
    categories: ModerationCategory[]
  }> {
    // Check cache first
    const cacheKey = `${this.CACHE_PREFIX}${this.hashContent(content.content)}`
    const cached = await cacheManager.get<any>(cacheKey)
    if (cached) {
      return cached
    }

    const settings = await getSettings()
    const moderationSettings = settings.moderation?.aiProviders

    let scores: ModerationScores = this.getDefaultScores()
    let flags: ModerationFlag[] = []
    let categories: ModerationCategory[] = []

    // Use OpenAI Moderation if enabled
    if (moderationSettings?.openai?.enabled) {
      try {
        const openAIResult = await this.analyzeWithOpenAI(content.content)
        const openAIScores = this.parseOpenAIScores(openAIResult)
        scores = this.mergeScores(scores, openAIScores.scores)
        flags.push(...openAIScores.flags)
        categories.push(...openAIScores.categories)
      } catch (error) {
        console.error('OpenAI moderation error:', error)
      }
    }

    // Use Perspective API if enabled
    if (moderationSettings?.perspective?.enabled) {
      try {
        const perspectiveResult = await this.analyzeWithPerspective(content.content)
        const perspectiveScores = this.parsePerspectiveScores(perspectiveResult)
        scores = this.mergeScores(scores, perspectiveScores.scores)
        flags.push(...perspectiveScores.flags)
      } catch (error) {
        console.error('Perspective API error:', error)
      }
    }

    // Use custom AI if configured
    if (moderationSettings?.custom?.enabled) {
      try {
        const customResult = await this.analyzeWithCustom(
          content.content,
          moderationSettings.custom.endpoint,
          moderationSettings.custom.apiKey
        )
        scores = this.mergeScores(scores, customResult.scores)
        flags.push(...customResult.flags)
      } catch (error) {
        console.error('Custom AI moderation error:', error)
      }
    }

    // Calculate overall score
    scores.overall = this.calculateOverallScore(scores)

    // Deduplicate flags
    flags = this.deduplicateFlags(flags)

    const result = { scores, flags, categories }

    // Cache the result
    await cacheManager.set(cacheKey, result, { 
      ttl: this.CACHE_TTL,
      tags: ['moderation', 'toxicity']
    })

    return result
  }

  /**
   * Analyze with OpenAI Moderation API
   */
  private static async analyzeWithOpenAI(content: string): Promise<OpenAIModerationResponse> {
    const settings = await getSettings()
    const apiKey = settings.moderation?.aiProviders?.openai?.apiKey

    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    const response = await fetch('https://api.openai.com/v1/moderations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        input: content
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Parse OpenAI moderation scores
   */
  private static parseOpenAIScores(response: OpenAIModerationResponse): {
    scores: ModerationScores
    flags: ModerationFlag[]
    categories: ModerationCategory[]
  } {
    const result = response.results[0]
    const scores: ModerationScores = this.getDefaultScores()
    const flags: ModerationFlag[] = []
    const categories: ModerationCategory[] = []

    // Map OpenAI categories to our scores
    const categoryMapping = {
      'hate': { field: 'identityAttack', name: 'Hate Speech' },
      'hate/threatening': { field: 'threat', name: 'Threatening Hate' },
      'self-harm': { field: 'threat', name: 'Self Harm' },
      'sexual': { field: 'inappropriate', name: 'Sexual Content' },
      'sexual/minors': { field: 'inappropriate', name: 'Sexual Content (Minors)' },
      'violence': { field: 'threat', name: 'Violence' },
      'violence/graphic': { field: 'threat', name: 'Graphic Violence' }
    }

    for (const [category, score] of Object.entries(result.category_scores)) {
      const mapping = categoryMapping[category as keyof typeof categoryMapping]
      if (mapping) {
        scores[mapping.field as keyof ModerationScores] = Math.max(
          scores[mapping.field as keyof ModerationScores] as number || 0,
          score
        )

        categories.push({
          name: mapping.name,
          score: score,
          flagged: result.categories[category]
        })

        if (result.categories[category]) {
          flags.push({
            type: this.mapToFlagType(category),
            reason: `OpenAI flagged: ${mapping.name}`,
            confidence: score,
            details: { provider: 'openai', category }
          })
        }
      }
    }

    return { scores, flags, categories }
  }

  /**
   * Analyze with Perspective API
   */
  private static async analyzeWithPerspective(content: string): Promise<PerspectiveAPIResponse> {
    const settings = await getSettings()
    const apiKey = settings.moderation?.aiProviders?.perspective?.apiKey
    const attributes = settings.moderation?.aiProviders?.perspective?.attributes || [
      'TOXICITY',
      'SEVERE_TOXICITY',
      'IDENTITY_ATTACK',
      'INSULT',
      'PROFANITY',
      'THREAT'
    ]

    if (!apiKey) {
      throw new Error('Perspective API key not configured')
    }

    const response = await fetch(
      `https://commentanalyzer.googleapis.com/v1alpha1/comments:analyze?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          comment: { text: content },
          requestedAttributes: attributes.reduce((acc, attr) => {
            acc[attr] = {}
            return acc
          }, {} as Record<string, any>)
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Perspective API error: ${response.status}`)
    }

    return await response.json()
  }

  /**
   * Parse Perspective API scores
   */
  private static parsePerspectiveScores(response: PerspectiveAPIResponse): {
    scores: ModerationScores
    flags: ModerationFlag[]
  } {
    const scores: ModerationScores = this.getDefaultScores()
    const flags: ModerationFlag[] = []

    const scoreMapping = {
      'TOXICITY': 'toxicity',
      'SEVERE_TOXICITY': 'severeToxicity',
      'IDENTITY_ATTACK': 'identityAttack',
      'INSULT': 'insult',
      'PROFANITY': 'obscene',
      'THREAT': 'threat'
    }

    for (const [attribute, data] of Object.entries(response.attributeScores)) {
      const field = scoreMapping[attribute as keyof typeof scoreMapping]
      if (field && data.summaryScore) {
        const score = data.summaryScore.value
        scores[field as keyof ModerationScores] = score

        if (score > 0.7) {
          flags.push({
            type: this.mapAttributeToFlagType(attribute),
            reason: `Perspective API: High ${attribute.toLowerCase()} score`,
            confidence: score,
            details: { provider: 'perspective', attribute }
          })
        }
      }
    }

    return { scores, flags }
  }

  /**
   * Analyze with custom AI endpoint
   */
  private static async analyzeWithCustom(
    content: string,
    endpoint: string,
    apiKey?: string
  ): Promise<{ scores: ModerationScores; flags: ModerationFlag[] }> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    }

    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content })
    })

    if (!response.ok) {
      throw new Error(`Custom AI error: ${response.status}`)
    }

    const result = await response.json()

    // Parse custom format (should be documented)
    return {
      scores: result.scores || this.getDefaultScores(),
      flags: result.flags || []
    }
  }

  /**
   * Get default scores
   */
  private static getDefaultScores(): ModerationScores {
    return {
      toxicity: 0,
      severeToxicity: 0,
      obscene: 0,
      threat: 0,
      insult: 0,
      identityAttack: 0,
      spam: 0,
      medicalMisinformation: 0,
      inappropriate: 0,
      overall: 0
    }
  }

  /**
   * Merge scores from multiple providers
   */
  private static mergeScores(
    existing: ModerationScores,
    newScores: ModerationScores
  ): ModerationScores {
    const merged: ModerationScores = { ...existing }

    for (const [key, value] of Object.entries(newScores)) {
      if (typeof value === 'number' && key !== 'overall') {
        merged[key as keyof ModerationScores] = Math.max(
          merged[key as keyof ModerationScores] as number || 0,
          value
        )
      }
    }

    return merged
  }

  /**
   * Calculate overall score
   */
  private static calculateOverallScore(scores: ModerationScores): number {
    const weights = {
      toxicity: 1.0,
      severeToxicity: 2.0,
      obscene: 0.8,
      threat: 1.5,
      insult: 0.7,
      identityAttack: 1.2,
      spam: 0.5,
      medicalMisinformation: 1.5,
      inappropriate: 0.8
    }

    let weightedSum = 0
    let totalWeight = 0

    for (const [key, weight] of Object.entries(weights)) {
      const score = scores[key as keyof ModerationScores] as number || 0
      weightedSum += score * weight
      totalWeight += weight
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0
  }

  /**
   * Deduplicate flags
   */
  private static deduplicateFlags(flags: ModerationFlag[]): ModerationFlag[] {
    const seen = new Set<string>()
    return flags.filter(flag => {
      const key = `${flag.type}:${flag.reason}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  /**
   * Map OpenAI category to flag type
   */
  private static mapToFlagType(category: string): ModerationFlag['type'] {
    const mapping: Record<string, ModerationFlag['type']> = {
      'hate': 'hate_speech',
      'hate/threatening': 'threat',
      'self-harm': 'self_harm',
      'sexual': 'sexual_content',
      'sexual/minors': 'sexual_content',
      'violence': 'violence',
      'violence/graphic': 'violence'
    }

    return mapping[category] || 'inappropriate_content'
  }

  /**
   * Map Perspective attribute to flag type
   */
  private static mapAttributeToFlagType(attribute: string): ModerationFlag['type'] {
    const mapping: Record<string, ModerationFlag['type']> = {
      'TOXICITY': 'toxicity',
      'SEVERE_TOXICITY': 'toxicity',
      'IDENTITY_ATTACK': 'hate_speech',
      'INSULT': 'inappropriate_content',
      'PROFANITY': 'inappropriate_content',
      'THREAT': 'threat'
    }

    return mapping[attribute] || 'inappropriate_content'
  }

  /**
   * Hash content for caching
   */
  private static hashContent(content: string): string {
    // Simple hash for demonstration
    let hash = 0
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }
}