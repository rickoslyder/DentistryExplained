'use client'

import { useState, useEffect } from 'react'
import { ProfessionalFunnel } from './professional-funnel'

interface ProfessionalFunnelLiveProps {
  initialData?: any
  days: number
}

export function ProfessionalFunnelLive({ initialData, days }: ProfessionalFunnelLiveProps) {
  const [data, setData] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFunnelData()
  }, [days])

  const fetchFunnelData = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/analytics/funnel?days=${days}`)
      if (!response.ok) {
        throw new Error('Failed to fetch funnel data')
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
        Failed to load funnel data: {error}
      </div>
    )
  }

  return <ProfessionalFunnel data={data} />
}