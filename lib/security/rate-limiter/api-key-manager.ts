/**
 * API Key Management
 * 
 * Secure API key generation, validation, and rate limiting
 */

import { createHash, randomBytes } from 'crypto'
import { 
  APIKey, 
  APIKeyCreateInput, 
  APIKeyValidationResult,
  RateLimitConfig 
} from '../types'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheManager } from '@/lib/cache'
import { SecurityContextManager } from '../context'

export class APIKeyManager {
  private static readonly CACHE_PREFIX = 'apikey:'
  private static readonly CACHE_TTL = 300 // 5 minutes

  /**
   * Generate a new API key
   */
  static generateKey(): string {
    // Generate 32 bytes of random data
    const buffer = randomBytes(32)
    
    // Format as: de_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    const prefix = process.env.NODE_ENV === 'production' ? 'de_live_' : 'de_test_'
    const key = prefix + buffer.toString('base64url')
    
    return key
  }

  /**
   * Hash an API key for storage
   */
  static hashKey(key: string): string {
    return createHash('sha256').update(key).digest('hex')
  }

  /**
   * Create a new API key
   */
  static async create(
    userId: string,
    input: APIKeyCreateInput
  ): Promise<{ key: string; apiKey: APIKey }> {
    const supabase = await createServerSupabaseClient()
    
    // Generate key and hash
    const key = this.generateKey()
    const keyHash = this.hashKey(key)
    
    // Calculate expiration
    const expiresAt = input.expiresIn
      ? new Date(Date.now() + input.expiresIn * 1000)
      : undefined

    // Create API key record
    const { data, error } = await supabase
      .from('api_keys')
      .insert({
        key_hash: keyHash,
        name: input.name,
        user_id: userId,
        scopes: input.scopes || [],
        rate_limit_override: input.rateLimitOverride,
        expires_at: expiresAt,
        metadata: input.metadata || {}
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create API key: ${error.message}`)
    }

    const apiKey: APIKey = {
      id: data.id,
      keyHash: data.key_hash,
      name: data.name,
      userId: data.user_id,
      scopes: data.scopes,
      rateLimitOverride: data.rate_limit_override,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      createdAt: new Date(data.created_at),
      metadata: data.metadata
    }

    // Clear user's API key cache
    await this.clearCache(userId)

    return { key, apiKey }
  }

  /**
   * Validate an API key
   */
  static async validate(key: string): Promise<APIKeyValidationResult> {
    // Check cache first
    const cached = await this.getFromCache(key)
    if (cached) {
      return cached
    }

    const keyHash = this.hashKey(key)
    const supabase = await createServerSupabaseClient()

    // Fetch API key from database
    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('key_hash', keyHash)
      .single()

    if (error || !data) {
      return {
        valid: false,
        error: 'Invalid API key'
      }
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return {
        valid: false,
        error: 'API key expired'
      }
    }

    const apiKey: APIKey = {
      id: data.id,
      keyHash: data.key_hash,
      name: data.name,
      userId: data.user_id,
      scopes: data.scopes,
      rateLimitOverride: data.rate_limit_override,
      expiresAt: data.expires_at ? new Date(data.expires_at) : undefined,
      lastUsedAt: data.last_used_at ? new Date(data.last_used_at) : undefined,
      createdAt: new Date(data.created_at),
      metadata: data.metadata
    }

    const result: APIKeyValidationResult = {
      valid: true,
      key: apiKey
    }

    // Cache the result
    await this.cacheResult(key, result)

    // Update last used timestamp (non-blocking)
    this.updateLastUsed(data.id).catch(console.error)

    // Update security context
    const context = SecurityContextManager.get()
    if (context) {
      context.apiKeyId = apiKey.id
      SecurityContextManager.addFlag('api_key_used')
    }

    return result
  }

  /**
   * List API keys for a user
   */
  static async list(userId: string): Promise<APIKey[]> {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to list API keys: ${error.message}`)
    }

    return data.map(item => ({
      id: item.id,
      keyHash: item.key_hash,
      name: item.name,
      userId: item.user_id,
      scopes: item.scopes,
      rateLimitOverride: item.rate_limit_override,
      expiresAt: item.expires_at ? new Date(item.expires_at) : undefined,
      lastUsedAt: item.last_used_at ? new Date(item.last_used_at) : undefined,
      createdAt: new Date(item.created_at),
      metadata: item.metadata
    }))
  }

  /**
   * Revoke an API key
   */
  static async revoke(userId: string, keyId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()

    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', keyId)
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to revoke API key: ${error.message}`)
    }

    // Clear cache
    await this.clearCache(userId)
  }

  /**
   * Check if API key has required scope
   */
  static hasScope(apiKey: APIKey, requiredScope: string): boolean {
    if (apiKey.scopes.includes('*')) {
      return true // Wildcard scope
    }

    // Check exact match or prefix match (e.g., 'read:*' matches 'read:articles')
    return apiKey.scopes.some(scope => {
      if (scope === requiredScope) return true
      if (scope.endsWith(':*')) {
        const prefix = scope.slice(0, -1)
        return requiredScope.startsWith(prefix)
      }
      return false
    })
  }

  /**
   * Get rate limit config for API key
   */
  static getRateLimitConfig(apiKey: APIKey, defaultConfig: RateLimitConfig): RateLimitConfig {
    if (!apiKey.rateLimitOverride) {
      return defaultConfig
    }

    return {
      ...defaultConfig,
      ...apiKey.rateLimitOverride
    }
  }

  /**
   * Cache API key validation result
   */
  private static async cacheResult(key: string, result: APIKeyValidationResult): Promise<void> {
    const cacheKey = `${this.CACHE_PREFIX}${this.hashKey(key)}`
    await cacheManager.set(cacheKey, result, {
      ttl: this.CACHE_TTL,
      tags: ['api-keys', result.key?.userId ? `user:${result.key.userId}` : undefined].filter(Boolean) as string[]
    })
  }

  /**
   * Get API key from cache
   */
  private static async getFromCache(key: string): Promise<APIKeyValidationResult | null> {
    const cacheKey = `${this.CACHE_PREFIX}${this.hashKey(key)}`
    return await cacheManager.get<APIKeyValidationResult>(cacheKey)
  }

  /**
   * Clear API key cache for a user
   */
  private static async clearCache(userId: string): Promise<void> {
    await cacheManager.invalidateByTags([`user:${userId}`])
  }

  /**
   * Update last used timestamp
   */
  private static async updateLastUsed(keyId: string): Promise<void> {
    const supabase = await createServerSupabaseClient()
    
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId)
  }
}

// Middleware to validate API key from request
export async function validateAPIKey(req: Request): Promise<APIKeyValidationResult | null> {
  // Check Authorization header
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null

  // Extract API key (Bearer token format)
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  if (!match) return null

  const apiKey = match[1]
  
  // Check if it looks like our API key format
  if (!apiKey.startsWith('de_live_') && !apiKey.startsWith('de_test_')) {
    return null
  }

  return await APIKeyManager.validate(apiKey)
}