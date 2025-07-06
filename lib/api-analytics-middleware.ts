import { NextRequest, NextResponse } from 'next/server';
import { serverAnalytics } from './analytics-server';
import { getRequestId } from './api-errors';

/**
 * Middleware to automatically track API calls with server-side analytics
 */
export async function withAnalytics(
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const pathname = url.pathname;
    const requestId = getRequestId(request);

    // Skip analytics endpoints to avoid loops
    if (pathname.includes('/api/analytics')) {
      return handler(request, context);
    }

    let response: NextResponse;
    let statusCode = 500;
    let error: string | undefined;

    try {
      // Execute the handler
      response = await handler(request, context);
      statusCode = response.status;

      // Extract error message if response has error
      if (statusCode >= 400) {
        try {
          const body = await response.clone().json();
          error = body.error || body.message || `HTTP ${statusCode}`;
        } catch {
          error = `HTTP ${statusCode}`;
        }
      }

      return response;
    } catch (err) {
      // Handler threw an error
      error = err instanceof Error ? err.message : 'Unknown error';
      statusCode = 500;
      
      // Re-throw to let error handlers deal with it
      throw err;
    } finally {
      const duration = Date.now() - startTime;

      // Track the API call (non-blocking)
      serverAnalytics.trackApiCall(
        pathname,
        request.method,
        statusCode,
        duration,
        context.userId,
        error
      ).catch(err => {
        console.error(`[Analytics ${requestId}] Failed to track API call:`, err);
      });
    }
  };
}

/**
 * Compose analytics tracking with other middleware
 */
export function withAnalyticsTracking(middleware: any) {
  return async (request: NextRequest, context: any) => {
    return withAnalytics(middleware)(request, context);
  };
}