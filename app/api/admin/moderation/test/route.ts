import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { testModeration } from '@/lib/moderation/utils'
import { ModerationAggregator } from '@/lib/moderation'
import { z } from 'zod'

const testSchema = z.object({
  content: z.string().min(1).max(5000)
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user has admin/moderator permissions

    const body = await request.json()
    const validation = testSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { content } = validation.data

    // Run basic tests
    const basicTests = await testModeration(content)

    // Run full moderation
    const fullResult = await ModerationAggregator.moderate({
      id: 'test-' + Date.now(),
      type: 'comment',
      content,
      authorId: userId,
      source: 'test',
      createdAt: new Date()
    })

    return NextResponse.json({
      basicTests,
      fullResult
    })
  } catch (error) {
    console.error('Failed to test moderation:', error)
    return NextResponse.json(
      { error: 'Failed to test moderation' },
      { status: 500 }
    )
  }
}