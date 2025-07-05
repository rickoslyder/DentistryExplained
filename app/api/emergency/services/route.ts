import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { ApiErrors, getRequestId, validateQueryParams } from '@/lib/api-errors'

// Types for emergency services
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

// Schema for query validation
const emergencyServicesSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  type: z.enum(['all', 'dental', 'hospital', 'pharmacy', 'urgent-care']).optional().default('all'),
  radius: z.coerce.number().min(1).max(50).optional().default(10), // miles
  emergency: z.coerce.boolean().optional().default(true),
})

// Fallback emergency services for major UK cities
const FALLBACK_SERVICES: Record<string, EmergencyService[]> = {
  london: [
    {
      id: 'guys-dental-emergency',
      name: "Guy's Dental Hospital Emergency Department",
      type: 'dental',
      address: "Floor 23, Tower Wing, Guy's Hospital, Great Maze Pond",
      postcode: 'SE1 9RT',
      phone: '020 7188 7188',
      latitude: 51.5031,
      longitude: -0.0886,
      nhsService: true,
      acceptsEmergencyDental: true,
      openingHours: 'Mon-Fri: 8:30am-3:30pm',
    },
    {
      id: 'stthomas-ae',
      name: "St Thomas' Hospital A&E",
      type: 'hospital',
      address: 'Westminster Bridge Road',
      postcode: 'SE1 7EH',
      phone: '020 7188 7188',
      latitude: 51.4982,
      longitude: -0.1177,
      nhsService: true,
      openingHours: '24/7',
    },
    {
      id: 'boots-piccadilly',
      name: 'Boots Pharmacy - Piccadilly Circus',
      type: 'pharmacy',
      address: '44-46 Regent Street',
      postcode: 'W1B 5RA',
      phone: '020 7734 6126',
      latitude: 51.5097,
      longitude: -0.1341,
      openingHours: 'Mon-Fri: 8am-11pm, Sat: 9am-11pm, Sun: 12pm-6pm',
    },
  ],
  manchester: [
    {
      id: 'manchester-dental-hospital',
      name: 'Manchester Dental Hospital',
      type: 'dental',
      address: 'Higher Cambridge Street',
      postcode: 'M15 6FH',
      phone: '0161 393 7730',
      latitude: 53.4636,
      longitude: -2.2335,
      nhsService: true,
      acceptsEmergencyDental: true,
      openingHours: 'Mon-Fri: 8am-5pm',
    },
    {
      id: 'mri-ae',
      name: 'Manchester Royal Infirmary A&E',
      type: 'hospital',
      address: 'Oxford Road',
      postcode: 'M13 9WL',
      phone: '0161 276 1234',
      latitude: 53.4631,
      longitude: -2.2256,
      nhsService: true,
      openingHours: '24/7',
    },
  ],
  birmingham: [
    {
      id: 'birmingham-dental-hospital',
      name: 'Birmingham Dental Hospital',
      type: 'dental',
      address: '5 Mill Pool Way',
      postcode: 'B5 7EG',
      phone: '0121 466 9000',
      latitude: 52.4654,
      longitude: -1.9169,
      nhsService: true,
      acceptsEmergencyDental: true,
      openingHours: 'Mon-Fri: 8:30am-5pm',
    },
  ],
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Determine nearest city based on coordinates
function getNearestCity(lat: number, lng: number): string {
  const cities = {
    london: { lat: 51.5074, lng: -0.1278 },
    manchester: { lat: 53.4808, lng: -2.2426 },
    birmingham: { lat: 52.4862, lng: -1.8904 },
  }
  
  let nearestCity = 'london'
  let minDistance = Infinity
  
  for (const [city, coords] of Object.entries(cities)) {
    const distance = calculateDistance(lat, lng, coords.lat, coords.lng)
    if (distance < minDistance) {
      minDistance = distance
      nearestCity = city
    }
  }
  
  return nearestCity
}

// Check if service is currently open (simplified - in production would use proper timezone handling)
function isServiceOpen(openingHours?: string): boolean {
  if (!openingHours || openingHours === '24/7') return true
  
  const now = new Date()
  const day = now.getDay()
  const hour = now.getHours()
  
  // Simplified logic - in production would parse actual hours
  if (openingHours.includes('24/7')) return true
  if (day === 0 || day === 6) return hour >= 10 && hour <= 16 // Weekend hours
  return hour >= 8 && hour <= 20 // Weekday hours
}

// Main API handler
export async function GET(request: NextRequest) {
  const requestId = getRequestId(request)
  
  try {
    // Validate query parameters
    const searchParams = request.nextUrl.searchParams
    const validation = validateQueryParams(searchParams, emergencyServicesSchema, requestId)
    
    if (validation.error) {
      return validation.error
    }
    
    const { lat, lng, type, radius, emergency } = validation.data
    
    // Try to fetch from NHS API (when available)
    // For now, we'll simulate an API call failure to demonstrate fallback
    const useRealApi = false // Toggle this when real API is available
    
    if (useRealApi) {
      try {
        // In production, this would call the real NHS Service Search API
        // const response = await fetch(`https://api.nhs.uk/service-search/...`)
        // const data = await response.json()
        throw new Error('NHS API not yet integrated')
      } catch (error) {
        console.error('NHS API error, falling back to static data:', error)
      }
    }
    
    // Use fallback data
    const nearestCity = getNearestCity(lat, lng)
    let services = FALLBACK_SERVICES[nearestCity] || FALLBACK_SERVICES.london
    
    // Filter by type if specified
    if (type !== 'all') {
      services = services.filter(service => service.type === type)
    }
    
    // Calculate distances and filter by radius
    services = services
      .map(service => ({
        ...service,
        distance: calculateDistance(lat, lng, service.latitude, service.longitude),
        openNow: isServiceOpen(service.openingHours),
      }))
      .filter(service => service.distance! <= radius)
      .sort((a, b) => a.distance! - b.distance!)
    
    // Add estimated wait times for emergency services (mock data)
    if (emergency) {
      services = services.map(service => ({
        ...service,
        waitTime: service.type === 'hospital' ? '2-4 hours' : 
                  service.type === 'dental' ? '1-2 hours' : 
                  undefined
      }))
    }
    
    // Return response with metadata
    return NextResponse.json({
      success: true,
      data: {
        services,
        metadata: {
          location: { lat, lng },
          radius,
          count: services.length,
          dataSource: useRealApi ? 'nhs-api' : 'fallback',
          lastUpdated: new Date().toISOString(),
        }
      },
      requestId,
    })
    
  } catch (error) {
    return ApiErrors.internal(error, 'Failed to fetch emergency services', requestId)
  }
}

// POST endpoint for submitting new emergency service data (admin only)
export async function POST(request: NextRequest) {
  const requestId = getRequestId(request)
  
  // In production, check admin authentication here
  // const user = await currentUser()
  // if (!user || !isAdmin(user)) {
  //   return ApiErrors.forbidden('Admin access required', requestId)
  // }
  
  return ApiErrors.forbidden('Service submission not yet implemented', requestId)
}