import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createGA4Client } from '@/lib/ga4-api'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get GA4 client
    const ga4Client = createGA4Client()
    
    if (!ga4Client) {
      // Return mock data if GA4 is not configured
      return NextResponse.json(getMockRealtimeData())
    }

    // Fetch real-time data from GA4
    const realtimeData = await ga4Client.getRealtimeData()
    
    return NextResponse.json(realtimeData)
  } catch (error) {
    console.error('Failed to fetch realtime analytics:', error)
    
    // Return mock data on error
    return NextResponse.json(getMockRealtimeData())
  }
}

function getMockRealtimeData() {
  return {
    activeUsers: Math.floor(Math.random() * 50) + 10,
    usersByPage: [
      { page: '/', users: Math.floor(Math.random() * 20) + 5 },
      { page: '/articles/dental-health-basics', users: Math.floor(Math.random() * 15) + 3 },
      { page: '/emergency', users: Math.floor(Math.random() * 10) + 2 },
      { page: '/find-dentist', users: Math.floor(Math.random() * 8) + 1 },
      { page: '/glossary', users: Math.floor(Math.random() * 5) + 1 }
    ].sort((a, b) => b.users - a.users),
    usersBySource: [
      { source: 'Organic Search', users: Math.floor(Math.random() * 30) + 10 },
      { source: 'Direct', users: Math.floor(Math.random() * 20) + 5 },
      { source: 'Social', users: Math.floor(Math.random() * 10) + 2 },
      { source: 'Referral', users: Math.floor(Math.random() * 5) + 1 }
    ].sort((a, b) => b.users - a.users),
    recentEvents: [
      { eventName: 'page_view', count: Math.floor(Math.random() * 100) + 50, page: '/' },
      { eventName: 'article_view', count: Math.floor(Math.random() * 50) + 20, page: '/articles/dental-health-basics' },
      { eventName: 'search', count: Math.floor(Math.random() * 30) + 10 },
      { eventName: 'chat_session_start', count: Math.floor(Math.random() * 20) + 5 },
      { eventName: 'sign_up', count: Math.floor(Math.random() * 10) + 1 }
    ]
  }
}