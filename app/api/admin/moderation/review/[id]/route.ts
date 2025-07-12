import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { ReviewQueue } from '@/lib/moderation'
import { z } from 'zod'

const reviewSchema = z.object({
  decision: z.enum(['approve', 'reject', 'edit', 'warn', 'ban', 'shadowban']),
  notes: z.string().optional()
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Check if user has admin/moderator permissions

    const body = await request.json()
    const validation = reviewSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { decision, notes } = validation.data

    const result = await ReviewQueue.reviewItem(
      params.id,
      userId,
      decision as any,
      notes
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to submit review:', error)
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    )
  }
}