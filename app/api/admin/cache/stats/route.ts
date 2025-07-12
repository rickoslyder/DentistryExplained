import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheManager } from '@/lib/cache'

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    
    const supabase = await createServerSupabaseClient()
    
    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('clerk_id', userId)
      .single()
    
    if (!profile || profile.role !== 'admin') {
      return new NextResponse('Forbidden', { status: 403 })
    }
    
    // Get stats from our new cache system
    const cacheStats = await cacheManager.stats()
    
    // Get web search cache stats from database
    const { data: webSearchCache } = await supabase
      .from('web_search_cache')
      .select('*')
    
    const webSearchCacheSize = webSearchCache?.length || 0
    const webSearchCacheSizeBytes = JSON.stringify(webSearchCache || []).length
    
    // Format bytes to human readable
    const formatBytes = (bytes: number) => {
      if (bytes === 0) return '0 MB'
      const k = 1024
      const sizes = ['B', 'KB', 'MB', 'GB']
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }
    
    // Aggregate stats from all cache providers
    let totalSize = 0
    let totalItems = 0
    let totalHits = 0
    let totalMisses = 0
    let providerStats: any = {}
    
    for (const [provider, stats] of Object.entries(cacheStats)) {
      totalSize += stats.size || 0
      totalHits += stats.hits || 0
      totalMisses += stats.misses || 0
      
      // Count items for memory provider (size represents item count)
      if (provider === 'memory') {
        totalItems += stats.size || 0
        providerStats[provider] = {
          items: stats.size,
          hits: stats.hits,
          misses: stats.misses,
          hitRate: stats.hitRate,
          avgResponseTime: stats.avgResponseTime
        }
      } else {
        // For other providers, we'd need to implement proper size tracking
        providerStats[provider] = stats
      }
    }
    
    const overallHitRate = (totalHits + totalMisses) > 0 
      ? Math.round((totalHits / (totalHits + totalMisses)) * 100) 
      : 0
    
    return NextResponse.json({
      overview: {
        totalProviders: Object.keys(cacheStats).length,
        totalItems,
        totalHits,
        totalMisses,
        overallHitRate,
        health: await cacheManager.isHealthy()
      },
      providers: providerStats,
      browser: {
        size: '0 MB', // Browser cache is client-side, can't measure from server
        items: 0
      },
      server: {
        size: formatBytes(totalSize * 1024), // Assuming size is in KB
        items: totalItems,
        hitRate: overallHitRate
      },
      database: {
        size: formatBytes(webSearchCacheSizeBytes),
        items: webSearchCacheSize,
        hitRate: 0 // Database cache doesn't track hit rate
      },
      cdn: {
        bandwidth: '0 GB', // Would need CDN API integration
        requests: 0,
        hitRate: 0
      }
    })
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}