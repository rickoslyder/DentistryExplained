'use client'

import { useEffect, useMemo } from 'react'
import L from 'leaflet'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Clock } from 'lucide-react'

// Fix Leaflet icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface Practice {
  id: string
  name: string
  address: string
  latitude: number
  longitude: number
  acceptsNHS: boolean
  phone?: string
  openingHours?: string
}

interface MapComponentProps {
  practices: Practice[]
  selectedPracticeId?: string
  onPracticeSelect?: (practiceId: string) => void
  userLocation?: { lat: number; lng: number }
}

// Component to handle map view updates
function MapViewController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  
  return null
}

// Component to add user location marker
function UserLocationMarker({ position }: { position: [number, number] }) {
  const userIcon = new L.Icon({
    iconUrl: 'data:image/svg+xml;base64,' + btoa(`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="8" fill="#3B82F6" fill-opacity="0.3" stroke="#3B82F6" stroke-width="2"/>
        <circle cx="12" cy="12" r="3" fill="#3B82F6"/>
      </svg>
    `),
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })

  return (
    <Marker position={position} icon={userIcon}>
      <Popup>Your location</Popup>
    </Marker>
  )
}

export function MapComponent({ 
  practices, 
  selectedPracticeId, 
  onPracticeSelect,
  userLocation 
}: MapComponentProps) {
  // Calculate map center based on practices or user location
  const mapCenter = useMemo<[number, number]>(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng]
    }
    
    if (practices.length > 0) {
      const avgLat = practices.reduce((sum, p) => sum + p.latitude, 0) / practices.length
      const avgLng = practices.reduce((sum, p) => sum + p.longitude, 0) / practices.length
      return [avgLat, avgLng]
    }
    
    // Default to London
    return [51.5074, -0.1278]
  }, [practices, userLocation])

  // Create custom icons for practices
  const createPracticeIcon = (isNHS: boolean, isSelected: boolean) => {
    const color = isNHS ? '#16A34A' : '#3B82F6' // Green for NHS, blue for private
    const size = isSelected ? 36 : 30
    
    return new L.Icon({
      iconUrl: 'data:image/svg+xml;base64,' + btoa(`
        <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M${size/2} ${size-2}L${size/2} ${size-2}" stroke="${color}" stroke-width="2"/>
          <circle cx="${size/2}" cy="${size/2}" r="${size/2-2}" fill="${color}" stroke="white" stroke-width="2"/>
          <path d="M${size/2} ${size/4}C${size/2} ${size/4} ${size/4} ${size/4} ${size/4} ${size/2}C${size/4} ${size*0.75} ${size/2} ${size*0.85} ${size/2} ${size*0.85}C${size/2} ${size*0.85} ${size*0.75} ${size*0.75} ${size*0.75} ${size/2}C${size*0.75} ${size/4} ${size/2} ${size/4} ${size/2} ${size/4}Z" fill="white"/>
          <text x="${size/2}" y="${size/2 + 2}" text-anchor="middle" fill="${color}" font-size="${size/3}" font-weight="bold" font-family="Arial">${isNHS ? 'NHS' : 'P'}</text>
        </svg>
      `),
      iconSize: [size, size],
      iconAnchor: [size/2, size-2],
      popupAnchor: [0, -size+2],
    })
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={mapCenter}
        zoom={13}
        className="h-full w-full rounded-lg"
        style={{ minHeight: '400px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <MapViewController center={mapCenter} zoom={13} />
        
        {/* User location marker */}
        {userLocation && (
          <UserLocationMarker position={[userLocation.lat, userLocation.lng]} />
        )}
        
        {/* Practice markers */}
        {practices.map((practice) => (
          <Marker
            key={practice.id}
            position={[practice.latitude, practice.longitude]}
            icon={createPracticeIcon(practice.acceptsNHS, practice.id === selectedPracticeId)}
            eventHandlers={{
              click: () => onPracticeSelect?.(practice.id),
            }}
          >
            <Popup>
              <Card className="border-0 shadow-none p-2 min-w-[200px]">
                <div className="space-y-2">
                  <div>
                    <h3 className="font-semibold text-sm">{practice.name}</h3>
                    {practice.acceptsNHS && (
                      <Badge variant="success" className="mt-1">NHS</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{practice.address}</span>
                    </div>
                    
                    {practice.phone && (
                      <div className="flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{practice.phone}</span>
                      </div>
                    )}
                    
                    {practice.openingHours && (
                      <div className="flex items-start gap-1">
                        <Clock className="w-3 h-3 mt-0.5" />
                        <span>{practice.openingHours}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 z-[1000]">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            <span>NHS Practice</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
            <span>Private Practice</span>
          </div>
        </div>
      </div>
    </div>
  )
}