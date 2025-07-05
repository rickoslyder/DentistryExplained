import { supabaseAdmin } from '@/lib/supabase'
import { WebSearchResponse } from './web-search'

interface CacheEntry {
  cache_key: string
  query: string
  search_type: string
  provider: string
  results: any // JSONB field
  results_count: number
  processing_time: number
  created_at: string
  expires_at: string
}

/**
 * Get cached search results from database
 */
export async function getCachedSearch(cacheKey: string): Promise<WebSearchResponse | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('web_search_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single()

    if (error || !data) {
      return null
    }

    // Reconstruct WebSearchResponse from cache
    return {
      query: data.query,
      results: data.results,
      totalResults: data.results_count,
      searchType: data.search_type as any,
      processingTime: data.processing_time
    }
  } catch (error) {
    console.error('Error reading from cache:', error)
    return null
  }
}

/**
 * Store search results in database cache
 */
export async function setCachedSearch(
  cacheKey: string,
  response: WebSearchResponse,
  provider: 'perplexity' | 'exa',
  ttlHours: number = 24
): Promise<void> {
  try {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + ttlHours)

    const { error } = await supabaseAdmin
      .from('web_search_cache')
      .upsert({
        cache_key: cacheKey,
        query: response.query,
        search_type: response.searchType,
        provider,
        results: response.results,
        results_count: response.totalResults,
        processing_time: response.processingTime,
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      })

    if (error) {
      console.error('Error writing to cache:', error)
    }
  } catch (error) {
    console.error('Failed to cache search results:', error)
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .rpc('clean_expired_web_search_cache')

    if (error) {
      console.error('Error cleaning cache:', error)
      return 0
    }

    return data || 0
  } catch (error) {
    console.error('Failed to clean cache:', error)
    return 0
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(): Promise<{
  totalEntries: number
  totalSize: number
  oldestEntry: Date | null
  newestEntry: Date | null
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('web_search_cache')
      .select('created_at')
      .order('created_at', { ascending: true })

    if (error || !data) {
      return {
        totalEntries: 0,
        totalSize: 0,
        oldestEntry: null,
        newestEntry: null
      }
    }

    return {
      totalEntries: data.length,
      totalSize: 0, // Would need to calculate JSONB size
      oldestEntry: data.length > 0 ? new Date(data[0].created_at) : null,
      newestEntry: data.length > 0 ? new Date(data[data.length - 1].created_at) : null
    }
  } catch (error) {
    console.error('Failed to get cache stats:', error)
    return {
      totalEntries: 0,
      totalSize: 0,
      oldestEntry: null,
      newestEntry: null
    }
  }
}

/**
 * Clear all cache entries (for maintenance)
 */
export async function clearAllCache(): Promise<void> {
  try {
    const { error } = await supabaseAdmin
      .from('web_search_cache')
      .delete()
      .not('cache_key', 'is', null) // Delete all rows

    if (error) {
      console.error('Error clearing cache:', error)
    }
  } catch (error) {
    console.error('Failed to clear cache:', error)
  }
}