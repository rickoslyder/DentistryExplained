'use client'

import { useState, useEffect } from 'react'
import { RevenueMetrics } from './revenue-metrics'

interface RevenueMetricsLiveProps {
  initialData?: any
  days: number
}

export function RevenueMetricsLive({ initialData, days }: RevenueMetricsLiveProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRevenueData()
  }, [days])

  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/revenue?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch revenue data')
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg" />
          </div>
        ))}
      </div>
    )
  }

  if (error && !data) {
    return (
      <div className="text-center py-8 text-red-600">
        Failed to load revenue metrics: {error}
      </div>
    )
  }

  return <RevenueMetrics data={data} />
}