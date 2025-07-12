import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { UserReputation } from '@/lib/moderation'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user has admin/moderator permissions

    const searchParams = request.nextUrl.searchParams
    const timeframe = searchParams.get('timeframe') || 'all'
    const limit = parseInt(searchParams.get('limit') || '10')

    const result = await UserReputation.getLeaderboard({
      limit,
      timeframe: timeframe as any
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to get leaderboard:', error)
    return NextResponse.json(
      { error: 'Failed to get leaderboard' },
      { status: 500 }
    )
  }
}