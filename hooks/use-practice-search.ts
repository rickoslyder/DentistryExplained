import { useState, useEffect } from 'react'
import { useDebounce } from 'use-debounce'

export interface PracticeSearchParams {
  query?: string
  latitude?: number
  longitude?: number
  radius?: number
  nhsOnly?: boolean
  privateOnly?: boolean
  services?: string[]
  wheelchairAccess?: boolean
  emergencyAppointments?: boolean
  limit?: number
  offset?: number
}

export interface Practice {
  id: string
  name: string
  address: {
    line1?: string
    line2?: string
    city?: string
    postcode?: string
    [key: string]: any
  }
  phone?: string
  email?: string
  website?: string
  latitude?: number
  longitude?: number
  distance?: number | null
  services: string[]
  nhsAccepted?: boolean
  privateAccepted?: boolean
  openingHours?: any
  accessibilityFeatures: string[]
  claimStatus?: string
}

export interface PracticeSearchResult {
  practices: Practice[]
  total: number
  offset: number
  limit: number
}

export function usePracticeSearch(params: PracticeSearchParams) {
  const [data, setData] = useState<PracticeSearchResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const [debouncedQuery] = useDebounce(params.query, 500)
  
  useEffect(() => {
    const fetchPractices = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const searchParams = new URLSearchParams()
        
        if (debouncedQuery) searchParams.set('query', debouncedQuery)
        if (params.latitude) searchParams.set('latitude', params.latitude.toString())
        if (params.longitude) searchParams.set('longitude', params.longitude.toString())
        if (params.radius) searchParams.set('radius', params.radius.toString())
        if (params.nhsOnly) searchParams.set('nhsOnly', 'true')
        if (params.privateOnly) searchParams.set('privateOnly', 'true')
        if (params.services?.length) searchParams.set('services', params.services.join(','))
        if (params.wheelchairAccess) searchParams.set('wheelchairAccess', 'true')
        if (params.emergencyAppointments) searchParams.set('emergencyAppointments', 'true')
        if (params.limit) searchParams.set('limit', params.limit.toString())
        if (params.offset) searchParams.set('offset', params.offset.toString())
        
        const response = await fetch(`/api/practices/search?${searchParams}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch practices')
        }
        
        const result = await response.json()
        setData(result)
      } catch (err) {
        setError(err as Error)
        console.error('Error fetching practices:', err)
      } finally {
        setLoading(false)
      }
    }
    
    fetchPractices()
  }, [
    debouncedQuery,
    params.latitude,
    params.longitude,
    params.radius,
    params.nhsOnly,
    params.privateOnly,
    params.services?.join(','),
    params.wheelchairAccess,
    params.emergencyAppointments,
    params.limit,
    params.offset,
  ])
  
  return { data, loading, error }
}

// Hook to get user's location
export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const requestLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }
    
    setLoading(true)
    setError(null)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setLoading(false)
      },
      (err) => {
        setError(err.message)
        setLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }
  
  return { location, loading, error, requestLocation }
}