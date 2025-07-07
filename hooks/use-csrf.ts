'use client'

import { useState, useEffect } from 'react'

export function useCSRF() {
  const [csrfToken, setCSRFToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCSRFToken()
  }, [])

  const fetchCSRFToken = async () => {
    try {
      const response = await fetch('/api/auth/csrf', {
        credentials: 'include', // Include cookies for authentication
      })
      if (response.ok) {
        const data = await response.json()
        setCSRFToken(data.token)
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error)
    } finally {
      setLoading(false)
    }
  }

  const getHeaders = (additionalHeaders?: HeadersInit): HeadersInit => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...Object.fromEntries(
        additionalHeaders instanceof Headers
          ? additionalHeaders.entries()
          : Object.entries(additionalHeaders || {})
      )
    }

    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken
    }

    return headers
  }

  const secureRequest = async (
    url: string,
    options: RequestInit = {}
  ): Promise<Response> => {
    const headers = getHeaders(options.headers)
    
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Include cookies for authentication
    })

    // If CSRF token expired, try to refresh
    if (response.status === 403) {
      const data = await response.json()
      if (data.error?.includes('CSRF')) {
        await fetchCSRFToken()
        // Retry request with new token
        return fetch(url, {
          ...options,
          headers: getHeaders(options.headers),
          credentials: 'include', // Include cookies for authentication
        })
      }
    }

    return response
  }

  return {
    csrfToken,
    loading,
    getHeaders,
    secureRequest,
    refreshToken: fetchCSRFToken
  }
}