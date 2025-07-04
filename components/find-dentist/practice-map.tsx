'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Define types for the map component props
interface MapProps {
  practices: Array<{
    id: string
    name: string
    address: string
    latitude: number
    longitude: number
    acceptsNHS: boolean
  }>
  selectedPracticeId?: string
  onPracticeSelect?: (practiceId: string) => void
  userLocation?: { lat: number; lng: number }
}

// Dynamically import the map component to avoid SSR issues
const DynamicMap = dynamic(
  () => import('./map-component').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    ),
  }
)

export function PracticeMap({ practices, selectedPracticeId, onPracticeSelect, userLocation }: MapProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <DynamicMap
      practices={practices}
      selectedPracticeId={selectedPracticeId}
      onPracticeSelect={onPracticeSelect}
      userLocation={userLocation}
    />
  )
}