import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const CSRF_SECRET = process.env.CSRF_SECRET || 'csrf-secret-key-change-in-production'
const CSRF_COOKIE_NAME = 'csrf-token'
const CSRF_HEADER_NAME = 'x-csrf-token'
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000 // 24 hours

const secret = new TextEncoder().encode(CSRF_SECRET)

/**
 * Generate a CSRF token
 */
export async function generateCSRFToken(): Promise<string> {
  const token = await new SignJWT({ 
    purpose: 'csrf',
    iat: Date.now()
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .setIssuedAt()
    .sign(secret)
  
  return token
}

/**
 * Verify a CSRF token
 */
export async function verifyCSRFToken(token: string): Promise<boolean> {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload.purpose === 'csrf'
  } catch {
    return false
  }
}

/**
 * Get CSRF token from request (header or body)
 */
export function getCSRFTokenFromRequest(request: NextRequest): string | null {
  // Check header first
  const headerToken = request.headers.get(CSRF_HEADER_NAME)
  if (headerToken) return headerToken

  // Check body for form submissions
  const contentType = request.headers.get('content-type')
  if (contentType?.includes('application/json')) {
    // For JSON requests, the token should be in headers
    return null
  }

  return null
}

/**
 * Set CSRF cookie
 */
export async function setCSRFCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY / 1000,
    path: '/'
  })
}

/**
 * Get CSRF cookie
 */
export async function getCSRFCookie(): Promise<string | null> {
  const cookieStore = await cookies()
  const cookie = cookieStore.get(CSRF_COOKIE_NAME)
  return cookie?.value || null
}

/**
 * CSRF protection middleware for API routes
 */
export async function validateCSRF(request: NextRequest): Promise<{ valid: boolean; error?: string }> {
  // Skip CSRF for GET requests
  if (request.method === 'GET') {
    return { valid: true }
  }

  // Get token from cookie
  const cookieToken = await getCSRFCookie()
  if (!cookieToken) {
    return { valid: false, error: 'No CSRF cookie found' }
  }

  // Get token from request
  const requestToken = getCSRFTokenFromRequest(request)
  if (!requestToken) {
    return { valid: false, error: 'No CSRF token in request' }
  }

  // Verify both tokens are valid and match
  const [cookieValid, requestValid] = await Promise.all([
    verifyCSRFToken(cookieToken),
    verifyCSRFToken(requestToken)
  ])

  if (!cookieValid || !requestValid) {
    return { valid: false, error: 'Invalid CSRF token' }
  }

  if (cookieToken !== requestToken) {
    return { valid: false, error: 'CSRF token mismatch' }
  }

  return { valid: true }
}

/**
 * Generate and set a new CSRF token if needed
 */
export async function ensureCSRFToken(): Promise<string> {
  let token = await getCSRFCookie()
  
  if (!token || !(await verifyCSRFToken(token))) {
    token = await generateCSRFToken()
    await setCSRFCookie(token)
  }
  
  return token
}