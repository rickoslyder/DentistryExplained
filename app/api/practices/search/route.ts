import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { z } from 'zod'

const searchSchema = z.object({
  query: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  radius: z.number().default(10),
  nhsOnly: z.boolean().optional(),
  privateOnly: z.boolean().optional(),
  services: z.array(z.string()).optional(),
  wheelchairAccess: z.boolean().optional(),
  emergencyAppointments: z.boolean().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
})

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Parse search params
    const searchParams = Object.fromEntries(request.nextUrl.searchParams)
    const params = searchSchema.parse({
      ...searchParams,
      latitude: searchParams.latitude ? parseFloat(searchParams.latitude) : undefined,
      longitude: searchParams.longitude ? parseFloat(searchParams.longitude) : undefined,
      radius: searchParams.radius ? parseFloat(searchParams.radius) : 10,
      nhsOnly: searchParams.nhsOnly === 'true',
      privateOnly: searchParams.privateOnly === 'true',
      services: searchParams.services ? searchParams.services.split(',') : undefined,
      wheelchairAccess: searchParams.wheelchairAccess === 'true',
      emergencyAppointments: searchParams.emergencyAppointments === 'true',
      limit: searchParams.limit ? parseInt(searchParams.limit) : 50,
      offset: searchParams.offset ? parseInt(searchParams.offset) : 0,
    })
    
    // Build query
    let query = supabase.from('practice_listings').select('*')
    
    // Text search
    if (params.query) {
      query = query.textSearch('search_vector', params.query)
    }
    
    // Payment type filters
    if (params.nhsOnly) {
      query = query.eq('nhs_accepted', true)
    }
    if (params.privateOnly) {
      query = query.eq('private_accepted', true)
    }
    
    // Services filter
    if (params.services && params.services.length > 0) {
      query = query.contains('services', params.services)
    }
    
    // Accessibility filter
    if (params.wheelchairAccess) {
      query = query.contains('accessibility_features', ['wheelchair_access'])
    }
    
    // Location-based search
    let results = []
    if (params.latitude && params.longitude) {
      // For now, we'll fetch all and filter in memory
      // In production, you'd want to use PostGIS extension for proper geospatial queries
      const { data: allPractices, error } = await query
      
      if (error) {
        console.error('Error fetching practices:', error)
        return NextResponse.json({ error: 'Failed to fetch practices' }, { status: 500 })
      }
      
      // Calculate distances and filter
      results = (allPractices || [])
        .map(practice => {
          if (!practice.latitude || !practice.longitude) {
            return { ...practice, distance: null }
          }
          
          // Haversine formula for distance calculation
          const R = 3959 // Earth's radius in miles
          const lat1 = params.latitude! * Math.PI / 180
          const lat2 = practice.latitude * Math.PI / 180
          const deltaLat = (practice.latitude - params.latitude!) * Math.PI / 180
          const deltaLon = (practice.longitude - params.longitude!) * Math.PI / 180
          
          const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
                   Math.cos(lat1) * Math.cos(lat2) *
                   Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2)
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = R * c
          
          return { ...practice, distance }
        })
        .filter(practice => practice.distance === null || practice.distance <= params.radius)
        .sort((a, b) => {
          if (a.distance === null) return 1
          if (b.distance === null) return -1
          return a.distance - b.distance
        })
        .slice(params.offset, params.offset + params.limit)
    } else {
      // No location provided, just return practices
      const { data, error } = await query
        .limit(params.limit)
        .range(params.offset, params.offset + params.limit - 1)
      
      if (error) {
        console.error('Error fetching practices:', error)
        return NextResponse.json({ error: 'Failed to fetch practices' }, { status: 500 })
      }
      
      results = data || []
    }
    
    // Format response
    const formattedResults = results.map(practice => ({
      id: practice.id,
      name: practice.name,
      address: practice.address,
      phone: practice.contact?.phone,
      email: practice.contact?.email,
      website: practice.website_url,
      latitude: practice.latitude,
      longitude: practice.longitude,
      distance: practice.distance,
      services: practice.services || [],
      nhsAccepted: practice.nhs_accepted,
      privateAccepted: practice.private_accepted,
      openingHours: practice.opening_hours,
      accessibilityFeatures: practice.accessibility_features || [],
      claimStatus: practice.claim_status,
    }))
    
    return NextResponse.json({
      practices: formattedResults,
      total: formattedResults.length,
      offset: params.offset,
      limit: params.limit,
    })
    
  } catch (error) {
    console.error('Practice search error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid search parameters', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}