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
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': 'true',
      }
    })
  } catch (error) {
    console.error('Failed to generate CSRF token:', error)
    return NextResponse.json(
      { error: 'Failed to generate CSRF token' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    )
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