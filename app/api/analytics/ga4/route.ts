import { NextRequest, NextResponse } from 'next/server';
import { createGA4Client } from '@/lib/ga4-api';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const reportType = searchParams.get('type') || 'realtime';
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Create GA4 client
    const ga4Client = createGA4Client();
    if (!ga4Client) {
      return NextResponse.json(
        { error: 'GA4 not configured' },
        { status: 500 }
      );
    }

    let data;

    switch (reportType) {
      case 'realtime':
        data = await ga4Client.getRealtimeData();
        break;
      
      case 'engagement':
        data = await ga4Client.getEngagementMetrics(days);
        break;
      
      case 'acquisition':
        data = await ga4Client.getUserAcquisition(days);
        break;
      
      case 'conversions':
        data = await ga4Client.getConversionEvents(days);
        break;
      
      case 'demographics':
        data = await ga4Client.getUserDemographics(days);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type' },
          { status: 400 }
        );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('GA4 API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}