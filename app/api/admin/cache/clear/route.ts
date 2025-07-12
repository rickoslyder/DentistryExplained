import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheManager, cacheInvalidator } from '@/lib/cache'
import { ApiErrors } from '@/lib/api-errors'

export async function POST(request: NextRequest) {
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
    
    const body = await request.json()
    const { provider, tags, pattern } = body
    
    let result
    
    if (tags && tags.length > 0) {
      // Clear by tags
      result = await cacheInvalidator.invalidateByTags(tags)
      return NextResponse.json({ 
        success: true, 
        message: `Invalidated ${result.keysInvalidated} items with tags: ${tags.join(', ')}`,
        details: result
      })
    } else if (pattern) {
      // Clear by pattern
      result = await cacheInvalidator.invalidateByPattern(pattern)
      return NextResponse.json({ 
        success: true, 
        message: `Invalidated ${result.keysInvalidated} items matching pattern: ${pattern}`,
        details: result
      })
    } else if (provider) {
      // Clear specific provider
      const specificProvider = cacheManager.getProvider(provider)
      if (!specificProvider) {
        return ApiErrors.badRequest('Invalid cache provider')
      }
      await specificProvider.clear()
      return NextResponse.json({ 
        success: true, 
        message: `Cleared ${provider} cache`
      })
    } else {
      // Clear all caches
      await cacheManager.clear()
      return NextResponse.json({ 
        success: true, 
        message: 'All caches cleared successfully' 
      })
    }
  } catch (error) {
    console.error('Error clearing cache:', error)
    return ApiErrors.internalError('cache-clear', error)
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    }
  })
}