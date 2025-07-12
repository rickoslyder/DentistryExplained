/**
 * Content Security Policy Manager
 * 
 * Dynamic CSP generation and management
 */

import { CSPConfig, CSPDirectives } from '../types'
import { getSettings } from '@/lib/settings'
import { randomBytes } from 'crypto'
import { cacheManager } from '@/lib/cache'

export class CSPManager {
  private static config: CSPConfig | null = null
  private static initialized = false

  /**
   * Initialize CSP configuration
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      const settings = await getSettings()
      this.config = settings.security?.contentSecurity?.csp || this.getDefaultConfig()
      this.initialized = true
    } catch (error) {
      console.error('Failed to initialize CSP:', error)
      this.config = this.getDefaultConfig()
    }
  }

  /**
   * Get default CSP configuration
   */
  private static getDefaultConfig(): CSPConfig {
    return {
      directives: {
        'default-src': ["'self'", 'https:', 'data:', 'blob:'],
        'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https:', 'blob:'],
        'style-src': ["'self'", "'unsafe-inline'", 'https:'],
        'img-src': ["'self'", 'data:', 'https:', 'blob:'],
        'font-src': ["'self'", 'data:', 'https:'],
        'connect-src': [
          "'self'",
          'https:',
          'wss:',
          'blob:',
          'https://*.clerk.accounts.dev',
          'https://clerk.accounts.dev',
          'https://actual-feline-35.accounts.dev',
          'https://llm.rbnk.uk',
          'https://*.supabase.co',
          'https://api.resend.com',
          'https://api.perplexity.ai',
          'https://api.exa.ai'
        ],
        'media-src': ["'self'", 'https:', 'blob:'],
        'object-src': ["'none'"],
        'worker-src': ["'self'", 'blob:'],
        'frame-src': [
          "'self'",
          'https:',
          'https://*.clerk.accounts.dev',
          'https://clerk.accounts.dev',
          'https://actual-feline-35.accounts.dev'
        ],
        'base-uri': ["'self'"],
        'form-action': [
          "'self'",
          'https:',
          'https://*.clerk.accounts.dev',
          'https://clerk.accounts.dev',
          'https://actual-feline-35.accounts.dev'
        ],
        'frame-ancestors': ["'none'"],
        'upgrade-insecure-requests': true
      },
      reportOnly: false,
      nonce: {
        enabled: true,
        scriptSrc: true,
        styleSrc: true
      }
    }
  }

  /**
   * Generate CSP header
   */
  static async generateHeader(options?: {
    nonce?: string
    reportOnly?: boolean
    additionalDirectives?: Partial<CSPDirectives>
  }): Promise<string> {
    // Ensure initialized
    if (!this.initialized) {
      await this.initialize()
    }

    const config = this.config!
    const nonce = options?.nonce || (config.nonce?.enabled ? this.generateNonce() : undefined)
    const reportOnly = options?.reportOnly ?? config.reportOnly
    const directives = this.mergeDirectives(config.directives, options?.additionalDirectives)

    // Build CSP string
    const parts: string[] = []

    for (const [directive, values] of Object.entries(directives)) {
      if (directive === 'upgrade-insecure-requests' && values === true) {
        parts.push('upgrade-insecure-requests')
        continue
      }

      if (directive === 'block-all-mixed-content' && values === true) {
        parts.push('block-all-mixed-content')
        continue
      }

      if (Array.isArray(values) && values.length > 0) {
        let directiveValues = [...values]

        // Add nonce if enabled
        if (nonce) {
          if (directive === 'script-src' && config.nonce?.scriptSrc) {
            directiveValues.push(`'nonce-${nonce}'`)
          }
          if (directive === 'style-src' && config.nonce?.styleSrc) {
            directiveValues.push(`'nonce-${nonce}'`)
          }
        }

        parts.push(`${directive} ${directiveValues.join(' ')}`)
      }
    }

    // Add report-uri if configured
    if (config.reportUri) {
      parts.push(`report-uri ${config.reportUri}`)
    }

    return parts.join('; ')
  }

  /**
   * Generate nonce
   */
  static generateNonce(): string {
    return randomBytes(16).toString('base64')
  }

  /**
   * Store nonce for validation
   */
  static async storeNonce(nonce: string, requestId: string): Promise<void> {
    const key = `csp:nonce:${nonce}`
    await cacheManager.set(key, requestId, { ttl: 300 }) // 5 minutes
  }

  /**
   * Validate nonce
   */
  static async validateNonce(nonce: string): Promise<boolean> {
    const key = `csp:nonce:${nonce}`
    const exists = await cacheManager.get(key)
    return exists !== null
  }

  /**
   * Merge directives
   */
  private static mergeDirectives(
    base: CSPDirectives,
    additional?: Partial<CSPDirectives>
  ): CSPDirectives {
    if (!additional) return base

    const merged = { ...base }

    for (const [directive, values] of Object.entries(additional)) {
      if (Array.isArray(values)) {
        const existing = merged[directive as keyof CSPDirectives]
        if (Array.isArray(existing)) {
          // Merge arrays, removing duplicates
          merged[directive as keyof CSPDirectives] = [...new Set([...existing, ...values])] as any
        } else {
          merged[directive as keyof CSPDirectives] = values as any
        }
      } else {
        merged[directive as keyof CSPDirectives] = values as any
      }
    }

    return merged
  }

  /**
   * Add trusted host
   */
  static async addTrustedHost(host: string, directives: string[]): Promise<void> {
    if (!this.config) {
      await this.initialize()
    }

    for (const directive of directives) {
      const current = this.config!.directives[directive as keyof CSPDirectives]
      if (Array.isArray(current) && !current.includes(host)) {
        current.push(host)
      }
    }

    // Clear CSP cache to force regeneration
    await cacheManager.invalidateByTags(['csp'])
  }

  /**
   * Remove trusted host
   */
  static async removeTrustedHost(host: string, directives?: string[]): Promise<void> {
    if (!this.config) {
      await this.initialize()
    }

    const targetDirectives = directives || Object.keys(this.config!.directives)

    for (const directive of targetDirectives) {
      const current = this.config!.directives[directive as keyof CSPDirectives]
      if (Array.isArray(current)) {
        const index = current.indexOf(host)
        if (index > -1) {
          current.splice(index, 1)
        }
      }
    }

    // Clear CSP cache
    await cacheManager.invalidateByTags(['csp'])
  }

  /**
   * Get current configuration
   */
  static async getConfig(): Promise<CSPConfig> {
    if (!this.initialized) {
      await this.initialize()
    }
    return this.config!
  }

  /**
   * Update configuration
   */
  static async updateConfig(updates: Partial<CSPConfig>): Promise<void> {
    if (!this.initialized) {
      await this.initialize()
    }

    this.config = {
      ...this.config!,
      ...updates,
      directives: updates.directives 
        ? this.mergeDirectives(this.config!.directives, updates.directives)
        : this.config!.directives
    }

    // Clear CSP cache
    await cacheManager.invalidateByTags(['csp'])
  }

  /**
   * Parse CSP violations report
   */
  static parseViolationReport(report: any): {
    directive: string
    blockedUri: string
    documentUri: string
    lineNumber?: number
    columnNumber?: number
    sourceFile?: string
    sample?: string
  } {
    const cspReport = report['csp-report'] || report

    return {
      directive: cspReport['violated-directive'] || cspReport['effective-directive'],
      blockedUri: cspReport['blocked-uri'],
      documentUri: cspReport['document-uri'],
      lineNumber: cspReport['line-number'],
      columnNumber: cspReport['column-number'],
      sourceFile: cspReport['source-file'],
      sample: cspReport['script-sample']
    }
  }

  /**
   * Handle CSP violation
   */
  static async handleViolation(report: any): Promise<void> {
    const violation = this.parseViolationReport(report)

    // Log violation
    console.warn('CSP Violation:', violation)

    // Store violation for analysis
    const key = `csp:violations:${Date.now()}`
    await cacheManager.set(key, violation, { ttl: 86400 }) // 24 hours

    // Track violation stats
    const statsKey = `csp:stats:${violation.directive}`
    const stats = await cacheManager.get<number>(statsKey) || 0
    await cacheManager.set(statsKey, stats + 1, { ttl: 86400 })
  }

  /**
   * Get violation statistics
   */
  static async getViolationStats(): Promise<Record<string, number>> {
    const directives = [
      'default-src',
      'script-src',
      'style-src',
      'img-src',
      'connect-src',
      'font-src',
      'media-src',
      'object-src',
      'frame-src'
    ]

    const stats: Record<string, number> = {}

    for (const directive of directives) {
      const key = `csp:stats:${directive}`
      stats[directive] = await cacheManager.get<number>(key) || 0
    }

    return stats
  }
}