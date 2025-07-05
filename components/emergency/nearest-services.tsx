"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Input } from '@/components/ui/input'
import { MapPin, Navigation, Phone, Clock, ExternalLink, Loader2, AlertCircle } from 'lucide-react'
import { LocationConsent, hasLocationConsent } from '@/components/emergency/location-consent'
import { EmergencyDisclaimer } from '@/components/emergency/emergency-disclaimer'
import { EmergencyLogger } from '@/lib/emergency-audit'

interface EmergencyService {
  id: string
  name: string
  type: 'dental' | 'hospital' | 'pharmacy' | 'urgent-care'
  distance?: number
  address: string
  postcode: string
  phone?: string
  openNow?: boolean
  openingHours?: string
  latitude: number
  longitude: number
  nhsService?: boolean
  acceptsEmergencyDental?: boolean
  waitTime?: string
}

export function NearestServices() {
  const [location, setLocation] = useState<GeolocationPosition | null>(null)
  const [services, setServices] = useState<EmergencyService[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualPostcode, setManualPostcode] = useState('')
  const [showManualEntry, setShowManualEntry] = useState(false)
  const [dataSource, setDataSource] = useState<'location' | 'fallback' | 'manual'>('location')
  const [showConsent, setShowConsent] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)

  // Default coordinates for major UK cities
  const DEFAULT_LOCATIONS = {
    london: { lat: 51.5074, lng: -0.1278 },
    manchester: { lat: 53.4808, lng: -2.2426 },
    birmingham: { lat: 52.4862, lng: -1.8904 },
  }

  const fetchEmergencyServices = async (lat: number, lng: number, isManualPostcode = false) => {
    try {
      const response = await fetch(`/api/emergency/services?lat=${lat}&lng=${lng}&type=all&radius=20&emergency=true`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch emergency services')
      }
      
      const data = await response.json()
      const services = data.data.services
      
      // Log the search
      EmergencyLogger.serviceSearch(
        isManualPostcode ? { postcode: manualPostcode } : { lat, lng },
        services.length
      )
      
      return services
    } catch (error) {
      console.error('Error fetching emergency services:', error)
      throw error
    }
  }

  const getLocation = () => {
    // Check if we have consent
    if (!hasLocationConsent()) {
      setShowConsent(true)
      return
    }

    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      setShowManualEntry(true)
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocation(position)
        setDataSource('location')
        try {
          const services = await fetchEmergencyServices(
            position.coords.latitude,
            position.coords.longitude
          )
          setServices(services)
        } catch (err) {
          setError('Unable to fetch emergency services. Showing nearest known services.')
          // Fallback to London services
          const services = await fetchEmergencyServices(
            DEFAULT_LOCATIONS.london.lat,
            DEFAULT_LOCATIONS.london.lng
          )
          setServices(services)
          setDataSource('fallback')
        }
        setIsLoading(false)
      },
      async (error) => {
        console.error('Geolocation error:', error)
        setError('Unable to retrieve your location. Showing services for London.')
        setShowManualEntry(true)
        setDataSource('fallback')
        
        // Use London as default
        try {
          const services = await fetchEmergencyServices(
            DEFAULT_LOCATIONS.london.lat,
            DEFAULT_LOCATIONS.london.lng
          )
          setServices(services)
        } catch (err) {
          setError('Unable to load emergency services. Please try again later.')
        }
        setIsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  const handleManualPostcode = async () => {
    if (!manualPostcode.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    // In production, this would geocode the postcode
    // For now, we'll use a simple mapping
    const postcodePrefix = manualPostcode.toUpperCase().slice(0, 2)
    let coords = DEFAULT_LOCATIONS.london
    
    if (postcodePrefix.startsWith('M')) {
      coords = DEFAULT_LOCATIONS.manchester
    } else if (postcodePrefix.startsWith('B')) {
      coords = DEFAULT_LOCATIONS.birmingham
    }
    
    try {
      const services = await fetchEmergencyServices(coords.lat, coords.lng, true)
      setServices(services)
      setDataSource('manual')
      setShowManualEntry(false)
    } catch (err) {
      setError('Unable to find services for this postcode')
    }
    setIsLoading(false)
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
      case 'urgent-care':
        return '🚑'
      default:
        return '📍'
    }
  }

  const getServiceTypeLabel = (type: string) => {
    switch (type) {
      case 'dental':
        return 'Emergency Dental'
      case 'hospital':
        return 'A&E Department'
      case 'pharmacy':
        return 'Pharmacy'
      case 'urgent-care':
        return 'Urgent Care'
      default:
        return 'Healthcare'
    }
  }

  const handleConsentGranted = () => {
    setShowConsent(false)
    setHasConsent(true)
    getLocation()
  }

  const handleConsentDeclined = () => {
    setShowConsent(false)
    setShowManualEntry(true)
    setError('Please enter your postcode to find nearby services')
  }

  useEffect(() => {
    // Check consent status on mount
    const consentGranted = hasLocationConsent()
    setHasConsent(consentGranted)
    
    // Auto-detect location on component mount if consent exists
    if (consentGranted) {
      getLocation()
    } else {
      setShowManualEntry(true)
    }
  }, [])

  // Show consent dialog if needed
  if (showConsent) {
    return (
      <LocationConsent 
        onConsent={handleConsentGranted}
        onDecline={handleConsentDeclined}
      />
    )
  }

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
          <Alert className="mb-4 border-orange-200 bg-orange-50">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Manual postcode entry */}
        {showManualEntry && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-3">
              Or enter your postcode to find nearby services:
            </p>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter postcode (e.g., SW1A 1AA)"
                value={manualPostcode}
                onChange={(e) => setManualPostcode(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleManualPostcode()}
                className="flex-1"
              />
              <Button onClick={handleManualPostcode} disabled={isLoading}>
                Search
              </Button>
            </div>
          </div>
        )}

        {!location && !isLoading && !error && !services.length && hasConsent && (
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
            {/* Data source notification */}
            {dataSource === 'fallback' && (
              <Alert className="mb-4">
                <AlertDescription className="text-sm">
                  Showing services for London. Enable location or enter your postcode for more accurate results.
                </AlertDescription>
              </Alert>
            )}
            
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
                      <div>
                        <h3 className="font-semibold text-lg">{service.name}</h3>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-500">{getServiceTypeLabel(service.type)}</span>
                          {service.nhsService && (
                            <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                              NHS Service
                            </span>
                          )}
                          {service.acceptsEmergencyDental && (
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                              Emergency Dental
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm text-gray-600 mt-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{service.address}, {service.postcode}</span>
                      </div>
                      
                      {service.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          <a 
                            href={`tel:${service.phone}`}
                            className="text-primary hover:underline font-medium"
                          >
                            {service.phone}
                          </a>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span className={service.openNow ? 'text-green-600 font-medium' : 'text-red-600'}>
                          {service.openNow ? 'Open Now' : 'Closed'} • {service.openingHours}
                        </span>
                      </div>
                      
                      {service.waitTime && (
                        <div className="flex items-center gap-2 text-orange-600">
                          <Clock className="w-4 h-4" />
                          <span>Estimated wait: {service.waitTime}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right ml-4">
                    {service.distance !== undefined && (
                      <div className="text-lg font-semibold text-primary mb-2">
                        {service.distance.toFixed(1)} mi
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

        {/* Medical Disclaimer */}
        <div className="mt-6">
          <EmergencyDisclaimer variant="compact" showEmergencyNumber={false} />
        </div>
      </CardContent>
    </Card>
  )
}