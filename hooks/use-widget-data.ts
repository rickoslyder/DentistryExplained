import { useState, useEffect, useCallback, useRef } from 'react'
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
  const fetchFnRef = useRef(fetchFn)
  
  // Keep ref updated with latest fetchFn
  useEffect(() => {
    fetchFnRef.current = fetchFn
  }, [fetchFn])

  const fetchData = useCallback(async () => {
    if (!enabled) return

    try {
      setIsLoading(true)
      const result = await fetchFnRef.current()
      setData(result)
      setError(undefined)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch data'))
      // Don't clear data on error - keep showing stale data
    } finally {
      setIsLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    // Initial fetch
    let mounted = true
    
    const initialFetch = async () => {
      if (mounted) {
        await fetchData()
      }
    }
    
    initialFetch()

    // Set up interval if needed
    let interval: NodeJS.Timeout | undefined
    if (refreshInterval && enabled) {
      interval = setInterval(() => {
        if (mounted && !isLoading) {
          fetchData()
        }
      }, refreshInterval)
    }
    
    return () => {
      mounted = false
      if (interval) {
        clearInterval(interval)
      }
    }
  }, [fetchData, refreshInterval, enabled])

  return {
    data,
    error,
    isLoading,
    refetch: fetchData,
  }
}