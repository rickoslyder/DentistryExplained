"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MapPin, Navigation, Phone, Clock, ExternalLink, Loader2 } from 'lucide-react'

interface EmergencyService {
  id: string
  name: string
  type: 'dental' | 'hospital' | 'pharmacy'
  distance: number
  address: string
  phone?: string
  openNow?: boolean
  openingHours?: string
  latitude: number
  longitude: number
}

export function NearestServices() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [services, setServices] = useState<EmergencyService[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Mock data for demonstration - in production, this would call a real API
  const mockServices: EmergencyService[] = [
    {
      id: '1',
      name: 'City Emergency Dental Clinic',
      type: 'dental',
      distance: 0.8,
      address: '123 High Street, London, SW1A 1AA',
      phone: '020 7123 4567',
      openNow: true,
      openingHours: '24/7 Emergency Service',
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      id: '2',
      name: 'St Thomas\' Hospital A&E',
      type: 'hospital',
      distance: 1.2,
      address: 'Westminster Bridge Rd, London SE1 7EH',
      phone: '020 7188 7188',
      openNow: true,
      openingHours: '24/7',
      latitude: 51.4982,
      longitude: -0.1177,
    },
    {
      id: '3',
      name: 'Boots Pharmacy',
      type: 'pharmacy',
      distance: 0.3,
      address: '456 Oxford Street, London W1C 1AP',
      phone: '020 7629 6811',
      openNow: true,
      openingHours: 'Mon-Sat: 8am-10pm, Sun: 12pm-6pm',
      latitude: 51.5145,
      longitude: -0.1527,
    },
    {
      id: '4',
      name: 'Dental Emergency Hotline',
      type: 'dental',
      distance: 2.5,
      address: '789 Baker Street, London NW1 6XE',
      phone: '020 7935 5555',
      openNow: false,
      openingHours: 'Mon-Fri: 8am-8pm, Weekends: 10am-4pm',
      latitude: 51.5238,
      longitude: -0.1586,
    },
  ]

  const getLocation = () => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation(position)
        // Simulate API call with mock data
        setTimeout(() => {
          setServices(mockServices)
          setIsLoading(false)
        }, 1000)
      },
      (error) => {
        setError('Unable to retrieve your location. Please enable location services.')
        setIsLoading(false)
        // Still show services without distance calculation
        setServices(mockServices)
      }
    )
  }

  const openDirections = (service: EmergencyService) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${service.latitude},${service.longitude}`
    window.open(url, '_blank')
  }

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'dental':
        return '🦷'
      case 'hospital':
        return '🏥'
      case 'pharmacy':
        return '💊'
      default:
        return '📍'
    }
  }

  useEffect(() => {
    // Auto-detect location on component mount
    getLocation()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nearest Emergency Services</CardTitle>
        <CardDescription>
          Find the closest dental emergency services, hospitals, and pharmacies
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!location && !isLoading && !error && (
          <div className="text-center py-8">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">
              Enable location to find nearest services
            </p>
            <Button onClick={getLocation}>
              <Navigation className="w-4 h-4 mr-2" />
              Enable Location
            </Button>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-600">Finding nearest services...</p>
          </div>
        )}

        {services.length > 0 && (
          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.id}
                className={`p-4 rounded-lg border ${
                  service.openNow ? 'border-green-200 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{getServiceIcon(service.type)}</span>
                      <h3 className="font-semibold text-lg">{service.name}</h3>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{service.address}</span>
                      </div>
                      
                      {service.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a 
                            href={`tel:${service.phone}`}
                            className="text-primary hover:underline"
                          >
                            {service.phone}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className={service.openNow ? 'text-green-600 font-medium' : ''}>
                          {service.openNow ? 'Open Now' : 'Closed'} • {service.openingHours}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    {location && (
                      <div className="text-lg font-semibold text-primary mb-2">
                        {service.distance} mi
                      </div>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => openDirections(service)}
                    >
                      <Navigation className="w-4 h-4 mr-1" />
                      Directions
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">
            Can't find what you need?
          </h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <a href="tel:111">
                <Phone className="w-4 h-4 mr-2" />
                Call NHS 111 for advice
              </a>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <a 
                href="https://111.nhs.uk" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                NHS 111 Online Service
              </a>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}