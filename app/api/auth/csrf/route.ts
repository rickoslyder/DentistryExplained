import { NextRequest, NextResponse } from 'next/server'
import { ensureCSRFToken } from '@/lib/csrf'

/**
 * GET /api/auth/csrf
 * Returns a CSRF token for the current session
 */
export async function GET(request: NextRequest) {
  try {
    const token = await ensureCSRFToken()
    
    return NextResponse.json({
      token,
      expiresIn: 86400 // 24 hours in seconds
    })
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { status: 500 }
    )
  }
}