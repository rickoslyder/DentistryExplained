/**
 * Engagement Score Calculator
 * Combines existing tracking data into actionable insights
 */

export interface EngagementMetrics {
  scrollDepth: number // 0-100
  timeOnPage: number // seconds
  interactions: {
    bookmarks: number
    shares: number
    prints: number
    chatMessages: number
    ctaClicks: number
  }
  contentViewed: {
    sections: number
    videos: number
    images: number
  }
}

export interface EngagementScore {
  score: number // 0-100
  level: 'low' | 'medium' | 'high' | 'very_high'
  factors: {
    depth: number
    time: number
    interaction: number
    content: number
  }
}

export class EngagementScoreCalculator {
  /**
   * Calculate unified engagement score from existing metrics
   */
  static calculate(metrics: EngagementMetrics): EngagementScore {
    // Weight factors based on importance
    const weights = {
      depth: 0.25,      // 25% - How much they read
      time: 0.25,       // 25% - How long they stayed
      interaction: 0.30, // 30% - What they did
      content: 0.20,    // 20% - What they viewed
    }

    // Calculate individual factor scores (0-100)
    const factors = {
      depth: this.calculateDepthScore(metrics.scrollDepth),
      time: this.calculateTimeScore(metrics.timeOnPage),
      interaction: this.calculateInteractionScore(metrics.interactions),
      content: this.calculateContentScore(metrics.contentViewed),
    }

    // Calculate weighted total
    const score = Math.round(
      factors.depth * weights.depth +
      factors.time * weights.time +
      factors.interaction * weights.interaction +
      factors.content * weights.content
    )

    // Determine engagement level
    const level = 
      score >= 80 ? 'very_high' :
      score >= 60 ? 'high' :
      score >= 40 ? 'medium' :
      'low'

    return { score, level, factors }
  }

  private static calculateDepthScore(scrollDepth: number): number {
    // Non-linear scoring - rewards completion
    if (scrollDepth >= 90) return 100
    if (scrollDepth >= 75) return 85
    if (scrollDepth >= 50) return 65
    if (scrollDepth >= 25) return 40
    return Math.round(scrollDepth * 1.5)
  }

  private static calculateTimeScore(timeOnPage: number): number {
    // Based on average reading speed and article length
    // Assumes ~3-5 minute articles
    const optimalTime = 180 // 3 minutes
    
    if (timeOnPage >= optimalTime * 2) return 100 // 6+ minutes
    if (timeOnPage >= optimalTime) return 85     // 3+ minutes
    if (timeOnPage >= optimalTime * 0.5) return 60 // 1.5+ minutes
    
    return Math.round((timeOnPage / optimalTime) * 60)
  }

  private static calculateInteractionScore(interactions: EngagementMetrics['interactions']): number {
    // High-value interactions weighted differently
    const points = 
      (interactions.bookmarks * 25) +      // Bookmarking = high intent
      (interactions.shares * 30) +         // Sharing = advocacy
      (interactions.prints * 20) +         // Printing = offline use
      (interactions.chatMessages * 10) +   // Chat = seeking help
      (interactions.ctaClicks * 15)        // CTA = conversion intent

    // Cap at 100
    return Math.min(100, points)
  }

  private static calculateContentScore(content: EngagementMetrics['contentViewed']): number {
    // Reward diverse content consumption
    const totalEngagement = 
      content.sections +
      (content.videos * 2) +    // Videos weighted higher
      (content.images * 0.5)    // Images weighted lower

    // Normalize to 100
    return Math.min(100, totalEngagement * 10)
  }

  /**
   * Get recommendations based on engagement score
   */
  static getRecommendations(score: EngagementScore): string[] {
    const recommendations: string[] = []

    if (score.factors.depth < 50) {
      recommendations.push('Consider adding a table of contents for easier navigation')
    }

    if (score.factors.time < 50) {
      recommendations.push('Content may be too long or complex - consider breaking into sections')
    }

    if (score.factors.interaction < 30) {
      recommendations.push('Add more interactive elements like FAQs or calculators')
    }

    if (score.factors.content < 40) {
      recommendations.push('Include more visual content like diagrams or videos')
    }

    if (score.level === 'very_high') {
      recommendations.push('This content resonates well - create similar topics')
    }

    return recommendations
  }
}

/**
 * Hook to track and calculate engagement score
 */
export function useEngagementScore(metrics: EngagementMetrics) {
  return EngagementScoreCalculator.calculate(metrics)
}