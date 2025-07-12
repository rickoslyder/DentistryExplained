/**
 * Security System Type Definitions
 */

// Rate Limiting Types
export interface RateLimitConfig {
  windowMs: number
  max: number
  message?: string
  standardHeaders?: boolean
  legacyHeaders?: boolean
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (req: any) => string
  handler?: (req: any, res: any) => void
  skip?: (req: any) => boolean | Promise<boolean>
  requestPropertyName?: string
  store?: RateLimitStore
}

export interface RateLimitStore {
  increment(key: string): Promise<RateLimitInfo>
  decrement(key: string): Promise<void>
  resetKey(key: string): Promise<void>
  resetAll(): Promise<void>
}

export interface RateLimitInfo {
  totalHits: number
  resetTime: Date | null
}

export interface RateLimitRule {
  id: string
  name: string
  windowMs: number
  max: number
  paths?: string[]
  methods?: string[]
  roles?: string[]
  apiKeys?: string[]
  ips?: string[]
  enabled: boolean
  priority: number
}

// DDoS Protection Types
export interface DDoSProtectionConfig {
  enabled: boolean
  maxRequestsPerSecond: number
  maxConcurrentConnections: number
  suspiciousPatternThreshold: number
  blockDuration: number
  whitelistedIPs: string[]
  blacklistedIPs: string[]
  geoBlocking: {
    enabled: boolean
    allowedCountries?: string[]
    blockedCountries?: string[]
  }
  challenges: {
    enabled: boolean
    types: ChallengeType[]
    threshold: number
  }
}

export type ChallengeType = 'captcha' | 'jsChallenge' | 'rateLimit' | 'block'

export interface RequestPattern {
  ip: string
  userAgent: string
  path: string
  method: string
  timestamp: number
  headers: Record<string, string>
}

export interface ThreatScore {
  score: number
  factors: ThreatFactor[]
  recommendation: 'allow' | 'challenge' | 'block'
}

export interface ThreatFactor {
  name: string
  weight: number
  description: string
}

// Content Security Policy Types
export interface CSPConfig {
  directives: CSPDirectives
  reportOnly: boolean
  reportUri?: string
  nonce?: {
    enabled: boolean
    scriptSrc?: boolean
    styleSrc?: boolean
  }
}

export interface CSPDirectives {
  'default-src'?: string[]
  'script-src'?: string[]
  'style-src'?: string[]
  'img-src'?: string[]
  'font-src'?: string[]
  'connect-src'?: string[]
  'media-src'?: string[]
  'object-src'?: string[]
  'frame-src'?: string[]
  'frame-ancestors'?: string[]
  'base-uri'?: string[]
  'form-action'?: string[]
  'manifest-src'?: string[]
  'worker-src'?: string[]
  'report-uri'?: string[]
  'report-to'?: string[]
  'upgrade-insecure-requests'?: boolean
  'block-all-mixed-content'?: boolean
}

// API Key Management Types
export interface APIKey {
  id: string
  keyHash: string
  name: string
  userId?: string
  scopes: string[]
  rateLimitOverride?: Partial<RateLimitConfig>
  expiresAt?: Date
  lastUsedAt?: Date
  createdAt: Date
  metadata?: Record<string, any>
}

export interface APIKeyCreateInput {
  name: string
  scopes?: string[]
  expiresIn?: number // seconds
  rateLimitOverride?: Partial<RateLimitConfig>
  metadata?: Record<string, any>
}

export interface APIKeyValidationResult {
  valid: boolean
  key?: APIKey
  error?: string
}

// Security Event Types
export interface SecurityEvent {
  id: string
  type: SecurityEventType
  severity: SecuritySeverity
  userId?: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  details: Record<string, any>
  timestamp: Date
  handled: boolean
  resolution?: SecurityResolution
}

export type SecurityEventType = 
  | 'rate_limit_exceeded'
  | 'ddos_attack_detected'
  | 'suspicious_pattern'
  | 'api_key_invalid'
  | 'api_key_expired'
  | 'csp_violation'
  | 'cors_violation'
  | 'ip_blocked'
  | 'geo_blocked'
  | 'malicious_payload'
  | 'authentication_failed'
  | 'authorization_failed'

export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SecurityResolution {
  action: 'allowed' | 'challenged' | 'blocked' | 'logged'
  reason: string
  details?: Record<string, any>
}

// Security Monitoring Types
export interface SecurityMetrics {
  totalRequests: number
  blockedRequests: number
  challengedRequests: number
  rateLimitHits: number
  uniqueIPs: number
  topPaths: Array<{ path: string; count: number }>
  topIPs: Array<{ ip: string; count: number }>
  threatsByType: Record<SecurityEventType, number>
  averageThreatScore: number
  timeRange: {
    start: Date
    end: Date
  }
}

export interface SecurityAlert {
  id: string
  type: SecurityAlertType
  severity: SecuritySeverity
  title: string
  description: string
  metadata: Record<string, any>
  timestamp: Date
  acknowledged: boolean
  acknowledgedBy?: string
  acknowledgedAt?: Date
}

export type SecurityAlertType = 
  | 'ddos_attack'
  | 'brute_force'
  | 'api_abuse'
  | 'suspicious_activity'
  | 'security_misconfiguration'
  | 'data_breach_attempt'

// Security Settings from Database
export interface SecuritySettings {
  rateLimiting: {
    enabled: boolean
    rules: RateLimitRule[]
    globalLimit: number
    globalWindowMs: number
  }
  ddosProtection: DDoSProtectionConfig
  contentSecurity: {
    csp: CSPConfig
    cors: CORSConfig
    headers: SecurityHeaders
  }
  apiSecurity: {
    enabled: boolean
    requireApiKey: boolean
    allowedScopes: string[]
    keyRotationDays: number
  }
  monitoring: {
    enabled: boolean
    alertThresholds: AlertThresholds
    notificationChannels: NotificationChannel[]
  }
}

export interface CORSConfig {
  enabled: boolean
  origins: string[]
  methods: string[]
  headers: string[]
  credentials: boolean
  maxAge: number
}

export interface SecurityHeaders {
  'X-Frame-Options'?: string
  'X-Content-Type-Options'?: string
  'X-XSS-Protection'?: string
  'Strict-Transport-Security'?: string
  'Referrer-Policy'?: string
  'Permissions-Policy'?: string
  [key: string]: string | undefined
}

export interface AlertThresholds {
  rateLimitExceeded: number
  ddosAttackScore: number
  failedAuthAttempts: number
  apiAbuseScore: number
}

export interface NotificationChannel {
  type: 'email' | 'webhook' | 'slack'
  config: Record<string, any>
  events: SecurityEventType[]
  enabled: boolean
}

// Middleware Types
export interface SecurityMiddleware {
  name: string
  priority: number
  enabled: boolean
  handler: (req: any, res: any, next: any) => Promise<void> | void
}

export interface SecurityContext {
  requestId: string
  ip: string
  userAgent?: string
  userId?: string
  apiKeyId?: string
  threatScore: number
  rateLimitInfo?: RateLimitInfo
  geoInfo?: GeoInfo
  flags: Set<SecurityFlag>
}

export interface GeoInfo {
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

export type SecurityFlag = 
  | 'suspicious_pattern'
  | 'rate_limited'
  | 'geo_blocked'
  | 'api_key_used'
  | 'challenge_passed'
  | 'whitelist'
  | 'blacklist'

// Error Types
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 403,
    public details?: any
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}