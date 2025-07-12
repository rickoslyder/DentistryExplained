import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { cacheWarmer } from '@/lib/cache'
import { ApiErrors } from '@/lib/api-errors'
import { z } from 'zod'

const warmCacheSchema = z.object({
  strategy: z.enum(['popular', 'recent', 'manual']).optional().default('popular'),
  items: z.array(z.object({
    key: z.string(),
    fetcher: z.string(),
    params: z.any().optional()
  })).optional()
})

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
    const validation = warmCacheSchema.safeParse(body)
    
    if (!validation.success) {
      return ApiErrors.fromValidationError(validation.error)
    }
    
    const { strategy, items } = validation.data
    
    if (strategy === 'manual' && items) {
      // Warm specific items
      const results = await Promise.allSettled(
        items.map(item => cacheWarmer.warmItem(item))
      )
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return NextResponse.json({
        success: true,
        message: `Warmed ${succeeded} items successfully`,
        details: {
          succeeded,
          failed,
          total: items.length
        }
      })
    } else {
      // Use predefined strategy
      const result = await cacheWarmer.warm(strategy)
      
      return NextResponse.json({
        success: true,
        message: `Cache warming completed using ${strategy} strategy`,
        details: result
      })
    }
  } catch (error) {
    console.error('Error warming cache:', error)
    return ApiErrors.internalError('cache-warm', error)
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