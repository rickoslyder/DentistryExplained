import { useState, useEffect, useCallback } from 'react'
import type { WidgetDataResult } from '@/lib/widgets/types'

interface UseWidgetDataOptions<T> {
  fetchFn: () => Promise<T>
  refreshInterval?: number
  enabled?: boolean
}

export function useWidgetData<T = any>({
  fetchFn,
  refreshInterval,
  enabled = true,
}: UseWidgetDataOptions<T>): WidgetDataResult<T> {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<Error | undefined>()
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      const result = await fetchFn()
      setData(result)
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      setData(undefined)
    } finally {
      setIsLoading(false)
    }
  }, [fetchFn, enabled])

  useEffect(() => {
    fetchData()

    if (refreshInterval && enabled) {
      const interval = setInterval(fetchData, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [fetchData, refreshInterval, enabled])

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  }
}