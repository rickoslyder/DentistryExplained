/**
 * Request Validation and Sanitization
 * 
 * Validates and sanitizes incoming requests
 */

import { NextRequest } from 'next/server'
import { z } from 'zod'
import DOMPurify from 'isomorphic-dompurify'
import { SecurityError } from '../types'
import { logSecurityEvent } from '../monitoring'

export interface ValidationRule {
  path?: string | RegExp
  method?: string | string[]
  headers?: Record<string, z.ZodSchema>
  query?: Record<string, z.ZodSchema>
  body?: z.ZodSchema
  maxBodySize?: number
  allowedContentTypes?: string[]
  customValidator?: (req: NextRequest) => Promise<boolean> | boolean
}

export class RequestValidator {
  private static rules: ValidationRule[] = []
  private static initialized = false

  /**
   * Initialize with default rules
   */
  static initialize(): void {
    if (this.initialized) return

    // Add default validation rules
    this.addRule({
      path: /^\/api\//,
      maxBodySize: 10 * 1024 * 1024, // 10MB
      allowedContentTypes: [
        'application/json',
        'application/x-www-form-urlencoded',
        'multipart/form-data'
      ]
    })

    // API key validation for protected routes
    this.addRule({
      path: /^\/api\/admin\//,
      headers: {
        authorization: z.string().regex(/^Bearer\s+.+$/)
      }
    })

    // File upload validation
    this.addRule({
      path: /^\/api\/upload/,
      method: 'POST',
      maxBodySize: 50 * 1024 * 1024, // 50MB
      allowedContentTypes: ['multipart/form-data']
    })

    this.initialized = true
  }

  /**
   * Add validation rule
   */
  static addRule(rule: ValidationRule): void {
    this.rules.push(rule)
  }

  /**
   * Validate request
   */
  static async validate(req: NextRequest): Promise<{
    valid: boolean
    errors?: string[]
    sanitized?: any
  }> {
    this.initialize()

    const errors: string[] = []
    const url = new URL(req.url)
    const method = req.method

    // Find matching rules
    const matchingRules = this.rules.filter(rule => {
      // Check path
      if (rule.path) {
        if (typeof rule.path === 'string') {
          if (!url.pathname.startsWith(rule.path)) return false
        } else {
          if (!rule.path.test(url.pathname)) return false
        }
      }

      // Check method
      if (rule.method) {
        const methods = Array.isArray(rule.method) ? rule.method : [rule.method]
        if (!methods.includes(method)) return false
      }

      return true
    })

    // Apply all matching rules
    for (const rule of matchingRules) {
      try {
        // Validate headers
        if (rule.headers) {
          for (const [header, schema] of Object.entries(rule.headers)) {
            const value = req.headers.get(header)
            const result = schema.safeParse(value)
            if (!result.success) {
              errors.push(`Invalid header ${header}: ${result.error.message}`)
            }
          }
        }

        // Validate query parameters
        if (rule.query) {
          const searchParams = Object.fromEntries(url.searchParams.entries())
          for (const [param, schema] of Object.entries(rule.query)) {
            const result = schema.safeParse(searchParams[param])
            if (!result.success) {
              errors.push(`Invalid query parameter ${param}: ${result.error.message}`)
            }
          }
        }

        // Validate content type
        if (rule.allowedContentTypes) {
          const contentType = req.headers.get('content-type')
          if (contentType) {
            const baseType = contentType.split(';')[0].trim()
            if (!rule.allowedContentTypes.includes(baseType)) {
              errors.push(`Invalid content type: ${baseType}`)
            }
          }
        }

        // Validate body size
        if (rule.maxBodySize && req.body) {
          const contentLength = parseInt(req.headers.get('content-length') || '0')
          if (contentLength > rule.maxBodySize) {
            errors.push(`Request body too large: ${contentLength} bytes`)
          }
        }

        // Validate body content
        if (rule.body && req.body) {
          try {
            const body = await req.json()
            const result = rule.body.safeParse(body)
            if (!result.success) {
              errors.push(`Invalid body: ${result.error.message}`)
            }
          } catch (error) {
            errors.push('Invalid JSON body')
          }
        }

        // Custom validation
        if (rule.customValidator) {
          const isValid = await rule.customValidator(req)
          if (!isValid) {
            errors.push('Custom validation failed')
          }
        }
      } catch (error) {
        errors.push(`Validation error: ${error.message}`)
      }
    }

    // Log validation failures
    if (errors.length > 0) {
      await logSecurityEvent(
        'malicious_payload',
        'medium',
        {
          path: url.pathname,
          method,
          errors,
          ip: req.headers.get('x-forwarded-for') || 'unknown'
        }
      )
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    }
  }

  /**
   * Sanitize data
   */
  static sanitize(data: any, options?: {
    allowHtml?: boolean
    maxLength?: number
    allowedTags?: string[]
  }): any {
    if (data === null || data === undefined) {
      return data
    }

    if (typeof data === 'string') {
      // Trim and limit length
      let sanitized = data.trim()
      if (options?.maxLength) {
        sanitized = sanitized.slice(0, options.maxLength)
      }

      // Sanitize HTML if needed
      if (!options?.allowHtml) {
        // Remove all HTML
        sanitized = DOMPurify.sanitize(sanitized, { 
          ALLOWED_TAGS: [],
          ALLOWED_ATTR: []
        })
      } else if (options?.allowedTags) {
        // Allow specific tags
        sanitized = DOMPurify.sanitize(sanitized, {
          ALLOWED_TAGS: options.allowedTags,
          ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'class']
        })
      }

      return sanitized
    }

    if (Array.isArray(data)) {
      return data.map(item => this.sanitize(item, options))
    }

    if (typeof data === 'object') {
      const sanitized: any = {}
      for (const [key, value] of Object.entries(data)) {
        // Sanitize key (remove special characters)
        const sanitizedKey = key.replace(/[^\w.-]/g, '_')
        sanitized[sanitizedKey] = this.sanitize(value, options)
      }
      return sanitized
    }

    return data
  }

  /**
   * Create validation schemas for common patterns
   */
  static schemas = {
    // Email validation
    email: z.string().email().max(255),

    // UUID validation
    uuid: z.string().uuid(),

    // URL validation
    url: z.string().url().max(2048),

    // Phone number validation (UK format)
    phone: z.string().regex(/^(\+44|0)[1-9]\d{9,10}$/),

    // Postcode validation (UK format)
    postcode: z.string().regex(/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i),

    // GDC number validation
    gdcNumber: z.string().regex(/^\d{6}$/),

    // Date validation
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),

    // Time validation
    time: z.string().regex(/^\d{2}:\d{2}$/),

    // Safe string (alphanumeric + basic punctuation)
    safeString: z.string().regex(/^[\w\s.,!?-]+$/),

    // Pagination
    pagination: z.object({
      page: z.coerce.number().int().positive().default(1),
      limit: z.coerce.number().int().min(1).max(100).default(20),
      sort: z.string().optional(),
      order: z.enum(['asc', 'desc']).optional()
    })
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File, options: {
    maxSize?: number
    allowedTypes?: string[]
    allowedExtensions?: string[]
  }): { valid: boolean; error?: string } {
    // Check file size
    if (options.maxSize && file.size > options.maxSize) {
      return {
        valid: false,
        error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      }
    }

    // Check file type
    if (options.allowedTypes && !options.allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.type}`
      }
    }

    // Check file extension
    if (options.allowedExtensions) {
      const extension = file.name.split('.').pop()?.toLowerCase()
      if (!extension || !options.allowedExtensions.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file extension: ${extension}`
        }
      }
    }

    // Additional security checks
    const dangerousExtensions = ['exe', 'dll', 'bat', 'cmd', 'sh', 'app']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && dangerousExtensions.includes(extension)) {
      return {
        valid: false,
        error: 'Potentially dangerous file type'
      }
    }

    return { valid: true }
  }
}

// Export convenience functions
export function sanitizeInput(data: any, options?: Parameters<typeof RequestValidator.sanitize>[1]): any {
  return RequestValidator.sanitize(data, options)
}

export async function validateRequest(req: NextRequest): Promise<ReturnType<typeof RequestValidator.validate>> {
  return RequestValidator.validate(req)
}

export const validationSchemas = RequestValidator.schemas