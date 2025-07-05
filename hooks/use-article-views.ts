'use client'

import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'

interface ArticleViewStats {
  totalViews: number
  uniqueVisitors: number
  recentViews: number
  currentReaders: number
}

export function useArticleViews(articleSlug: string) {
  const [stats, setStats] = useState<ArticleViewStats>({
    totalViews: 0,
    uniqueVisitors: 0,
    recentViews: 0,
    currentReaders: 1,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Generate a session ID for this browser session
  const [sessionId] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('article-session-id')
      if (stored) return stored
      
      const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('article-session-id', newId)
      return newId
    }
    return null
  })

  // Debounce the slug to avoid multiple API calls during navigation
  const [debouncedSlug] = useDebounce(articleSlug, 500)

  // Track the view
  useEffect(() => {
    if (!debouncedSlug || !sessionId) return

    const trackView = async () => {
      try {
        await fetch('/api/article-views', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId,
          },
          body: JSON.stringify({ slug: debouncedSlug, sessionId }),
        })
      } catch (err) {
        console.error('Failed to track article view:', err)
      }
    }

    trackView()
  }, [debouncedSlug, sessionId])

  // Fetch view statistics
  useEffect(() => {
    if (!debouncedSlug) return

    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/article-views?slug=${encodeURIComponent(debouncedSlug)}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch view statistics')
        }

        const data = await response.json()
        setStats({
          totalViews: data.totalViews || 0,
          uniqueVisitors: data.uniqueVisitors || 0,
          recentViews: data.recentViews || 0,
          currentReaders: Math.max(1, Math.floor(data.recentViews / 100) + 1), // Estimate
        })
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load statistics')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()

    // Poll for updates every 30 seconds
    const interval = setInterval(fetchStats, 30000)
    return () => clearInterval(interval)
  }, [debouncedSlug])

  return { stats, loading, error }
}