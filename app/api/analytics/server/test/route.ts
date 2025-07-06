import { NextRequest, NextResponse } from 'next/server';
import { serverAnalytics } from '@/lib/analytics-server';

export async function GET(request: NextRequest) {
  try {
    // Check if server analytics is configured
    const isConfigured = serverAnalytics.isConfigured();
    
    if (!isConfigured) {
      return NextResponse.json({
        configured: false,
        message: 'Server analytics not configured. Please set GA4_MEASUREMENT_ID and GA4_API_SECRET environment variables.',
        required: {
          GA4_MEASUREMENT_ID: 'Your GA4 Measurement ID (e.g., G-XXXXXXXXXX)',
          GA4_API_SECRET: 'Generate in GA4 > Admin > Data Streams > Your Stream > Measurement Protocol API secrets'
        }
      });
    }

    // Test tracking various events
    const testUserId = 'test-user-' + Date.now();
    const testSessionId = 'test-session-' + Date.now();

    // Test 1: Track a search event
    await serverAnalytics.trackSearch(
      'test dental implants',
      10,
      'article',
      testUserId
    );

    // Test 2: Track a chat session
    await serverAnalytics.trackChatSession(
      'created',
      testSessionId,
      testUserId,
      5
    );

    // Test 3: Track professional verification
    await serverAnalytics.trackProfessionalVerification(
      'started',
      testUserId,
      '1234567'
    );

    // Test 4: Track an API call
    await serverAnalytics.trackApiCall(
      '/api/test',
      'GET',
      200,
      123,
      testUserId
    );

    // Force flush to send events immediately
    await serverAnalytics.flush();

    return NextResponse.json({
      configured: true,
      message: 'Test events sent to GA4',
      events: [
        {
          type: 'search',
          details: 'Tracked search for "test dental implants" with 10 results'
        },
        {
          type: 'chat_session',
          details: 'Tracked chat session creation with 5 messages'
        },
        {
          type: 'professional_verification',
          details: 'Tracked verification start for GDC number (hashed)'
        },
        {
          type: 'api_call',
          details: 'Tracked API call to /api/test with 200 status'
        }
      ],
      userId: testUserId,
      sessionId: testSessionId,
      note: 'Events may take a few minutes to appear in GA4 Real-Time reports'
    });
  } catch (error) {
    console.error('Server analytics test error:', error);
    return NextResponse.json({
      configured: serverAnalytics.isConfigured(),
      error: error instanceof Error ? error.message : 'Unknown error',
      tip: 'Check console for detailed error messages'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { eventName, parameters, userId } = body;

    if (!eventName) {
      return NextResponse.json({
        error: 'eventName is required'
      }, { status: 400 });
    }

    // Track custom event
    await serverAnalytics.trackEvent(
      eventName,
      parameters || {},
      userId ? { user_id: userId } : undefined,
      undefined,
      userId
    );

    await serverAnalytics.flush();

    return NextResponse.json({
      success: true,
      message: `Event "${eventName}" tracked successfully`,
      event: {
        name: eventName,
        parameters,
        userId
      }
    });
  } catch (error) {
    console.error('Server analytics custom event error:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}