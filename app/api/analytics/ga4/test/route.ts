import { NextResponse } from 'next/server';
import { createGA4Client } from '@/lib/ga4-api';

export async function GET() {
  try {
    // Check if GA4 is configured
    if (!process.env.GA4_PROPERTY_ID) {
      return NextResponse.json({ 
        configured: false,
        message: 'GA4_PROPERTY_ID environment variable not set'
      });
    }

    // Try to create client
    const ga4Client = createGA4Client();
    if (!ga4Client) {
      return NextResponse.json({ 
        configured: false,
        message: 'Failed to create GA4 client'
      });
    }

    // Try to fetch real-time data
    const realtimeData = await ga4Client.getRealtimeData();
    
    return NextResponse.json({
      configured: true,
      propertyId: process.env.GA4_PROPERTY_ID,
      hasServiceAccount: !!process.env.GA4_SERVICE_ACCOUNT_KEY,
      data: {
        activeUsers: realtimeData.activeUsers,
        topPages: realtimeData.usersByPage.slice(0, 3),
        topSources: realtimeData.usersBySource.slice(0, 3),
        eventSummary: realtimeData.recentEvents.slice(0, 3),
      }
    });
  } catch (error) {
    console.error('GA4 test error:', error);
    return NextResponse.json({
      configured: process.env.GA4_PROPERTY_ID ? true : false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tip: 'Make sure GA4_PROPERTY_ID is set and optionally GA4_SERVICE_ACCOUNT_KEY for API access'
    }, { status: 500 });
  }
}