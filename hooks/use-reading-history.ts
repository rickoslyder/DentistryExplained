'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { usePathname } from 'next/navigation'
import { useDebounce } from 'use-debounce'

interface ReadingHistoryEntry {
  id: string
  article_slug: string
  article_title: string
  article_category?: string
  last_read_at: string
  read_duration_seconds: number
  scroll_percentage: number
  completed: boolean
}

interface ReadingStats {
  total_articles_read: number
  total_reading_time_minutes: number
  articles_completed: number
  current_streak_days: number
}

export function useReadingHistory() {
  const { user, isLoaded } = useUser()
  const [history, setHistory] = useState<ReadingHistoryEntry[]>([])
  const [stats, setStats] = useState<ReadingStats>({
    total_articles_read: 0,
    total_reading_time_minutes: 0,
    articles_completed: 0,
    current_streak_days: 0,
  })
  const [loading, setLoading] = useState(true)

  const fetchHistory = useCallback(async () => {
    if (!isLoaded || !user) {
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/reading-history')
      if (!response.ok) throw new Error('Failed to fetch reading history')
      
      const data = await response.json()
      setHistory(data.history || [])
      setStats(data.stats || {
        total_articles_read: 0,
        total_reading_time_minutes: 0,
        articles_completed: 0,
        current_streak_days: 0,
      })
    } catch (error) {
      console.error('Error fetching reading history:', error)
    } finally {
      setLoading(false)
    }
  }, [user, isLoaded])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return {
    history,
    stats,
    loading,
    refetch: fetchHistory,
  }
}

// Hook to track reading progress on article pages
export function useArticleReadingTracker(article: {
  slug: string
  title: string
  category?: string
}) {
  const { user } = useUser()
  const pathname = usePathname()
  const startTimeRef = useRef<number>(Date.now())
  const lastUpdateRef = useRef<number>(Date.now())
  const totalReadTimeRef = useRef<number>(0)
  const [debouncedScrollPercentage] = useDebounce(0, 2000)

  // Track scroll percentage
  const updateScrollPercentage = useCallback(() => {
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight - windowHeight
    const scrollTop = window.scrollY
    const percentage = Math.min(100, Math.round((scrollTop / documentHeight) * 100))
    return percentage
  }, [])

  // Update reading history
  const updateReadingHistory = useCallback(async (
    scrollPercentage: number,
    completed: boolean = false
  ) => {
    if (!user || !article.slug) return

    const currentTime = Date.now()
    const sessionDuration = Math.floor((currentTime - lastUpdateRef.current) / 1000)
    totalReadTimeRef.current += sessionDuration
    lastUpdateRef.current = currentTime

    try {
      await fetch('/api/reading-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleSlug: article.slug,
          articleTitle: article.title,
          articleCategory: article.category,
          durationSeconds: sessionDuration,
          scrollPercentage,
          completed,
        }),
      })
    } catch (error) {
      console.error('Failed to update reading history:', error)
    }
  }, [user, article])

  // Track page visibility
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, update reading time
        const scrollPercentage = updateScrollPercentage()
        updateReadingHistory(scrollPercentage)
      } else {
        // Page is visible again, reset last update time
        lastUpdateRef.current = Date.now()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [updateReadingHistory, updateScrollPercentage])

  // Track scroll and update periodically
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout
    let updateInterval: NodeJS.Timeout

    const handleScroll = () => {
      clearTimeout(scrollTimeout)
      scrollTimeout = setTimeout(() => {
        const percentage = updateScrollPercentage()
        const completed = percentage >= 90
        updateReadingHistory(percentage, completed)
      }, 2000)
    }

    // Update every 30 seconds while reading
    updateInterval = setInterval(() => {
      if (!document.hidden) {
        const percentage = updateScrollPercentage()
        updateReadingHistory(percentage)
      }
    }, 30000)

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(scrollTimeout)
      clearInterval(updateInterval)
      
      // Final update when leaving the page
      const percentage = updateScrollPercentage()
      updateReadingHistory(percentage)
    }
  }, [updateReadingHistory, updateScrollPercentage])

  // Update when pathname changes (navigating away)
  useEffect(() => {
    return () => {
      const percentage = updateScrollPercentage()
      updateReadingHistory(percentage)
    }
  }, [pathname, updateReadingHistory, updateScrollPercentage])
}