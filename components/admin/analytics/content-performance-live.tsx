'use client'

import { useState, useEffect } from 'react'
import { ContentPerformance } from './content-performance'

interface ContentPerformanceLiveProps {
  initialData?: any
  days: number
  limit?: number
}

export function ContentPerformanceLive({ initialData, days, limit = 10 }: ContentPerformanceLiveProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchContentData()
  }, [days, limit])

  const fetchContentData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/content-performance?days=${days}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch content performance')
      }
      const data = await response.json()
      setData(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  if (loading && !data) {
    return (
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg" />
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load content performance: {error}
      </div>
    )
  }

  return <ContentPerformance data={data} />
}