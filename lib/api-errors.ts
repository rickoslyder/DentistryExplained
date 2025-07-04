import { NextResponse } from 'next/server'

export interface ApiError {
  error: string
  code: string
  details?: any
  requestId?: string
  timestamp: string
}

export class ApiErrors {
  static createError(
    message: string,
    code: string,
    status: number,
    details?: any,
    requestId?: string
  ): NextResponse<ApiError> {
    const error: ApiError = {
      error: message,
      code,
      timestamp: new Date().toISOString(),
      ...(details && { details }),
      ...(requestId && { requestId })
    }

    // Log error for monitoring
    console.error(`[API Error] ${code}: ${message}`, {
      status,
      details,
      requestId,
      timestamp: error.timestamp
    })

    return NextResponse.json(error, { status })
  }

  // 400 Bad Request
  static badRequest(message: string = 'Bad request', details?: any, requestId?: string) {
    return this.createError(message, 'BAD_REQUEST', 400, details, requestId)
  }

  // 400 Invalid Input
  static invalidInput(message: string = 'Invalid input', details?: any, requestId?: string) {
    return this.createError(message, 'INVALID_INPUT', 400, details, requestId)
  }

  // 401 Unauthorized
  static unauthorized(message: string = 'Unauthorized', requestId?: string) {
    return this.createError(message, 'UNAUTHORIZED', 401, undefined, requestId)
  }

  // 403 Forbidden
  static forbidden(message: string = 'Forbidden', requestId?: string) {
    return this.createError(message, 'FORBIDDEN', 403, undefined, requestId)
  }

  // 404 Not Found
  static notFound(resource: string = 'Resource', requestId?: string) {
    return this.createError(`${resource} not found`, 'NOT_FOUND', 404, undefined, requestId)
  }

  // 409 Conflict
  static conflict(message: string = 'Conflict', details?: any, requestId?: string) {
    return this.createError(message, 'CONFLICT', 409, details, requestId)
  }

  // 413 Payload Too Large
  static payloadTooLarge(maxSize: number, requestId?: string) {
    return this.createError(
      `Request payload too large. Maximum size: ${maxSize} bytes`,
      'PAYLOAD_TOO_LARGE',
      413,
      { maxSize },
      requestId
    )
  }

  // 422 Unprocessable Entity
  static unprocessableEntity(message: string = 'Unprocessable entity', details?: any, requestId?: string) {
    return this.createError(message, 'UNPROCESSABLE_ENTITY', 422, details, requestId)
  }

  // 429 Too Many Requests
  static rateLimit(retryAfterSeconds: number, requestId?: string) {
    const response = this.createError(
      'Too many requests',
      'RATE_LIMIT_EXCEEDED',
      429,
      { retryAfter: retryAfterSeconds },
      requestId
    )
    response.headers.set('Retry-After', retryAfterSeconds.toString())
    return response
  }

  // 500 Internal Server Error
  static internal(error: any, context?: string, requestId?: string) {
    const message = process.env.NODE_ENV === 'development' 
      ? error?.message || 'Internal server error'
      : 'Internal server error'
    
    const details = process.env.NODE_ENV === 'development' 
      ? { 
          error: error?.message,
          stack: error?.stack,
          context 
        }
      : undefined

    return this.createError(message, 'INTERNAL_ERROR', 500, details, requestId)
  }

  // 502 Bad Gateway
  static badGateway(service: string = 'External service', requestId?: string) {
    return this.createError(
      `${service} is temporarily unavailable`,
      'BAD_GATEWAY',
      502,
      undefined,
      requestId
    )
  }

  // 503 Service Unavailable
  static serviceUnavailable(reason: string = 'Service temporarily unavailable', requestId?: string) {
    return this.createError(reason, 'SERVICE_UNAVAILABLE', 503, undefined, requestId)
  }

  // Database error handler
  static fromDatabaseError(error: any, operation: string, requestId?: string): NextResponse<ApiError> {
    console.error(`Database error during ${operation}:`, error)

    // Handle specific Supabase/PostgreSQL errors
    if (error?.code) {
      switch (error.code) {
        case '23505': // Unique violation
          return this.conflict('Resource already exists', { field: error.detail }, requestId)
        case '23503': // Foreign key violation
          return this.badRequest('Invalid reference', { field: error.detail }, requestId)
        case '23502': // Not null violation
          return this.badRequest('Missing required field', { field: error.column }, requestId)
        case '22P02': // Invalid text representation
          return this.badRequest('Invalid data format', undefined, requestId)
        case 'PGRST116': // Supabase RLS violation
          return this.forbidden('Access denied by security policy', requestId)
        case '42P01': // Undefined table
        case '42703': // Undefined column
          return this.internal(error, `Database schema error: ${operation}`, requestId)
        default:
          return this.internal(error, `Database operation failed: ${operation}`, requestId)
      }
    }

    return this.internal(error, `Database operation failed: ${operation}`, requestId)
  }

  // Validation error handler
  static fromValidationError(error: any, requestId?: string): NextResponse<ApiError> {
    // Handle Zod validation errors
    if (error?.issues) {
      const details = error.issues.map((issue: any) => ({
        field: issue.path.join('.'),
        message: issue.message
      }))
      return this.invalidInput('Validation failed', details, requestId)
    }

    return this.invalidInput('Invalid request data', error, requestId)
  }

  // External service error handler
  static fromExternalError(service: string, error: any, requestId?: string): NextResponse<ApiError> {
    console.error(`External service error from ${service}:`, error)

    // Check if it's a network error
    if (error?.code === 'ECONNREFUSED' || error?.code === 'ETIMEDOUT') {
      return this.badGateway(service, requestId)
    }

    // Check for specific HTTP status codes
    if (error?.status) {
      switch (error.status) {
        case 401:
          return this.unauthorized(`${service} authentication failed`, requestId)
        case 403:
          return this.forbidden(`${service} access denied`, requestId)
        case 404:
          return this.notFound(`${service} resource`, requestId)
        case 429:
          const retryAfter = error.headers?.['retry-after'] || 60
          return this.rateLimit(parseInt(retryAfter), requestId)
        case 502:
        case 503:
        case 504:
          return this.badGateway(service, requestId)
        default:
          return this.internal(error, `${service} request failed`, requestId)
      }
    }

    return this.internal(error, `${service} request failed`, requestId)
  }
}

// Helper function to extract request ID from headers or generate one
export function getRequestId(request: Request): string {
  return request.headers.get('x-request-id') || 
         `req_${Date.now()}_${Math.random().toString(36).substring(7)}`
}