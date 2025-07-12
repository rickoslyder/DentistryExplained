import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ReviewQueue } from '@/lib/moderation'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user has admin/moderator permissions

    const searchParams = request.nextUrl.searchParams
    const contentType = searchParams.get('contentType')
    const priority = searchParams.get('priority')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    const options: any = {
      limit,
      offset
    }

    if (contentType && contentType !== 'all') {
      options.contentType = contentType
    }

    if (priority && priority !== 'all') {
      options.priority = priority
    }

    const result = await ReviewQueue.getPendingItems(options)

    // Enrich with author information
    const enrichedItems = await Promise.all(
      result.items.map(async (item) => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('username, reputation_score, reputation_level')
          .eq('id', item.authorId)
          .single()

        return {
          ...item,
          authorName: profile?.username || 'Unknown',
          authorReputation: profile?.reputation_level || 'new'
        }
      })
    )

    return NextResponse.json({
      items: enrichedItems,
      total: result.total
    })
  } catch (error) {
    console.error('Failed to get review queue:', error)
    return NextResponse.json(
      { error: 'Failed to get review queue' },
      { status: 500 }
    )
  }
}