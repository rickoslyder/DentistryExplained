/**
 * Progressive Challenge System
 * 
 * Implements various challenges to verify legitimate users
 */

import { ChallengeType } from '../types'
import { cacheManager } from '@/lib/cache'
import { randomBytes } from 'crypto'

export interface Challenge {
  id: string
  type: ChallengeType
  data: any
  createdAt: Date
  expiresAt: Date
  attempts: number
  maxAttempts: number
}

export interface ChallengeResult {
  success: boolean
  challenge?: Challenge
  error?: string
}

export class ChallengeSystem {
  private static readonly CHALLENGE_TTL = 300 // 5 minutes
  private static readonly MAX_ATTEMPTS = 3

  /**
   * Create a new challenge
   */
  static async create(
    ip: string,
    type: ChallengeType,
    threatScore: number
  ): Promise<Challenge> {
    const challengeId = randomBytes(16).toString('hex')
    const now = new Date()
    
    let challengeData: any = {}
    
    switch (type) {
      case 'jsChallenge':
        challengeData = this.createJSChallenge()
        break
      case 'captcha':
        challengeData = this.createCaptchaChallenge()
        break
      case 'rateLimit':
        challengeData = this.createRateLimitChallenge(threatScore)
        break
      case 'block':
        challengeData = { duration: this.calculateBlockDuration(threatScore) }
        break
    }

    const challenge: Challenge = {
      id: challengeId,
      type,
      data: challengeData,
      createdAt: now,
      expiresAt: new Date(now.getTime() + this.CHALLENGE_TTL * 1000),
      attempts: 0,
      maxAttempts: this.MAX_ATTEMPTS
    }

    // Store challenge
    const key = `challenge:${ip}:${challengeId}`
    await cacheManager.set(key, challenge, { ttl: this.CHALLENGE_TTL })

    // Track active challenges for IP
    const activeKey = `challenge:active:${ip}`
    const activeChallenges = await cacheManager.get<string[]>(activeKey) || []
    activeChallenges.push(challengeId)
    await cacheManager.set(activeKey, activeChallenges, { ttl: this.CHALLENGE_TTL })

    return challenge
  }

  /**
   * Verify a challenge response
   */
  static async verify(
    ip: string,
    challengeId: string,
    response: any
  ): Promise<ChallengeResult> {
    const key = `challenge:${ip}:${challengeId}`
    const challenge = await cacheManager.get<Challenge>(key)

    if (!challenge) {
      return {
        success: false,
        error: 'Challenge not found or expired'
      }
    }

    // Check if challenge expired
    if (new Date() > new Date(challenge.expiresAt)) {
      await cacheManager.delete(key)
      return {
        success: false,
        error: 'Challenge expired'
      }
    }

    // Check attempts
    challenge.attempts++
    if (challenge.attempts > challenge.maxAttempts) {
      await cacheManager.delete(key)
      return {
        success: false,
        error: 'Maximum attempts exceeded'
      }
    }

    // Update challenge with new attempt count
    await cacheManager.set(key, challenge, { ttl: this.CHALLENGE_TTL })

    // Verify based on challenge type
    let success = false
    switch (challenge.type) {
      case 'jsChallenge':
        success = this.verifyJSChallenge(challenge.data, response)
        break
      case 'captcha':
        success = await this.verifyCaptcha(challenge.data, response)
        break
      case 'rateLimit':
        success = true // Rate limit challenge just requires waiting
        break
      default:
        success = false
    }

    if (success) {
      // Clean up challenge
      await cacheManager.delete(key)
      
      // Mark IP as verified
      await this.markVerified(ip)
      
      return { success: true }
    }

    return {
      success: false,
      challenge,
      error: 'Invalid response'
    }
  }

  /**
   * Check if IP is currently challenged
   */
  static async isChallenged(ip: string): Promise<boolean> {
    const activeKey = `challenge:active:${ip}`
    const activeChallenges = await cacheManager.get<string[]>(activeKey)
    return (activeChallenges?.length || 0) > 0
  }

  /**
   * Check if IP is verified
   */
  static async isVerified(ip: string): Promise<boolean> {
    const key = `challenge:verified:${ip}`
    const verified = await cacheManager.get<boolean>(key)
    return verified === true
  }

  /**
   * Mark IP as verified
   */
  private static async markVerified(ip: string): Promise<void> {
    const key = `challenge:verified:${ip}`
    await cacheManager.set(key, true, { ttl: 3600 }) // 1 hour
    
    // Clear active challenges
    const activeKey = `challenge:active:${ip}`
    await cacheManager.delete(activeKey)
  }

  /**
   * Create JavaScript challenge
   */
  private static createJSChallenge(): any {
    // Generate a simple math problem
    const a = Math.floor(Math.random() * 50) + 1
    const b = Math.floor(Math.random() * 50) + 1
    const operation = Math.random() > 0.5 ? '+' : '*'
    const answer = operation === '+' ? a + b : a * b

    return {
      problem: `${a} ${operation} ${b}`,
      expectedHash: this.hashAnswer(answer.toString())
    }
  }

  /**
   * Verify JavaScript challenge
   */
  private static verifyJSChallenge(challengeData: any, response: any): boolean {
    if (!response?.answer) return false
    return this.hashAnswer(response.answer) === challengeData.expectedHash
  }

  /**
   * Create CAPTCHA challenge
   */
  private static createCaptchaChallenge(): any {
    // In production, this would integrate with a CAPTCHA service
    // For now, return a simple placeholder
    return {
      siteKey: process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || 'dummy-site-key',
      challengeId: randomBytes(16).toString('hex')
    }
  }

  /**
   * Verify CAPTCHA
   */
  private static async verifyCaptcha(challengeData: any, response: any): Promise<boolean> {
    // In production, verify with CAPTCHA service
    // For now, check if response token exists
    return !!response?.token
  }

  /**
   * Create rate limit challenge
   */
  private static createRateLimitChallenge(threatScore: number): any {
    // Calculate wait time based on threat score
    const waitTime = Math.min(300, Math.floor(threatScore * 3)) // Max 5 minutes
    
    return {
      waitTime,
      message: `Please wait ${waitTime} seconds before trying again`
    }
  }

  /**
   * Calculate block duration based on threat score
   */
  private static calculateBlockDuration(threatScore: number): number {
    // Exponential backoff based on threat score
    const baseMinutes = 5
    const multiplier = Math.floor(threatScore / 20)
    return baseMinutes * Math.pow(2, multiplier) * 60 // Convert to seconds
  }

  /**
   * Hash answer for verification
   */
  private static hashAnswer(answer: string): string {
    // Simple hash for demonstration - in production use proper hashing
    return Buffer.from(answer).toString('base64')
  }

  /**
   * Get challenge HTML for rendering
   */
  static getChallengeHTML(challenge: Challenge): string {
    switch (challenge.type) {
      case 'jsChallenge':
        return `
          <div class="challenge-container">
            <h2>Security Check</h2>
            <p>Please solve this simple math problem to continue:</p>
            <p class="challenge-problem">${challenge.data.problem} = ?</p>
            <form id="challenge-form">
              <input type="text" name="answer" required autofocus />
              <button type="submit">Submit</button>
            </form>
            <script>
              document.getElementById('challenge-form').onsubmit = async (e) => {
                e.preventDefault();
                const answer = e.target.answer.value;
                const response = await fetch(window.location.href, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    challengeId: '${challenge.id}',
                    answer: answer 
                  })
                });
                if (response.ok) {
                  window.location.reload();
                } else {
                  alert('Incorrect answer. Please try again.');
                }
              };
            </script>
          </div>
        `

      case 'captcha':
        return `
          <div class="challenge-container">
            <h2>Security Check</h2>
            <p>Please complete the CAPTCHA to continue:</p>
            <div id="recaptcha-container"></div>
            <script src="https://www.google.com/recaptcha/api.js?render=${challenge.data.siteKey}"></script>
            <script>
              grecaptcha.ready(() => {
                grecaptcha.execute('${challenge.data.siteKey}', {action: 'submit'})
                  .then(async (token) => {
                    const response = await fetch(window.location.href, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ 
                        challengeId: '${challenge.id}',
                        token: token 
                      })
                    });
                    if (response.ok) {
                      window.location.reload();
                    }
                  });
              });
            </script>
          </div>
        `

      case 'rateLimit':
        return `
          <div class="challenge-container">
            <h2>Rate Limit</h2>
            <p>${challenge.data.message}</p>
            <p>This page will automatically refresh when the wait time is over.</p>
            <script>
              setTimeout(() => window.location.reload(), ${challenge.data.waitTime * 1000});
            </script>
          </div>
        `

      case 'block':
        return `
          <div class="challenge-container">
            <h2>Access Blocked</h2>
            <p>Your access has been temporarily blocked due to suspicious activity.</p>
            <p>Please try again later.</p>
          </div>
        `

      default:
        return '<div>Unknown challenge type</div>'
    }
  }
}