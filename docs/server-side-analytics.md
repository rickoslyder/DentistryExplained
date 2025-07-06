# Server-Side Analytics Implementation

This document describes the server-side analytics tracking implementation using GA4 Measurement Protocol.

## Overview

Server-side analytics complements client-side tracking by capturing events that occur on the server, such as:
- API calls and their performance
- Background jobs and scheduled tasks
- Server-side validations and errors
- Events that might be blocked by ad blockers on the client

## Configuration

### Environment Variables

```env
# GA4 Measurement Protocol (for server-side tracking)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Your GA4 Measurement ID
GA4_API_SECRET=your_api_secret   # Generate in GA4 Admin > Data Streams
```

### How to Get Your API Secret

1. Go to Google Analytics 4
2. Navigate to Admin > Data Streams
3. Select your web data stream
4. Scroll to "Measurement Protocol API secrets"
5. Create a new secret and copy it

## Implementation

### Core Library: `lib/analytics-server.ts`

The server analytics library provides:
- Automatic client ID generation
- Event batching for performance
- Built-in error handling
- Type-safe event tracking methods

### Available Tracking Methods

```typescript
// Track API calls
serverAnalytics.trackApiCall(
  endpoint: string,
  method: string,
  statusCode: number,
  duration: number,
  userId?: string,
  error?: string
)

// Track professional verification
serverAnalytics.trackProfessionalVerification(
  action: 'started' | 'submitted' | 'approved' | 'rejected',
  userId: string,
  gdcNumber?: string,
  verificationId?: string
)

// Track chat sessions
serverAnalytics.trackChatSession(
  action: 'created' | 'message_sent' | 'exported' | 'deleted',
  sessionId: string,
  userId?: string,
  messageCount?: number
)

// Track content versions
serverAnalytics.trackContentVersion(
  action: 'created' | 'restored' | 'compared',
  articleId: string,
  versionId: string,
  userId: string
)

// Track searches
serverAnalytics.trackSearch(
  query: string,
  resultCount: number,
  searchType: 'article' | 'glossary' | 'web',
  userId?: string
)

// Track email events
serverAnalytics.trackEmail(
  action: 'sent' | 'opened' | 'clicked' | 'bounced',
  emailType: string,
  recipientId?: string,
  emailId?: string
)

// Track scheduled jobs
serverAnalytics.trackScheduledJob(
  jobName: string,
  status: 'started' | 'completed' | 'failed',
  duration?: number,
  error?: string
)

// Track custom events
serverAnalytics.trackEvent(
  eventName: string,
  parameters?: object,
  userProperties?: object,
  clientId?: string,
  userId?: string
)
```

## Integration Examples

### API Route Integration

```typescript
import { serverAnalytics } from '@/lib/analytics-server'

// In your API route
export async function POST(request: NextRequest) {
  // Your API logic...
  
  // Track server-side event (non-blocking)
  serverAnalytics.trackProfessionalVerification(
    'submitted',
    userId,
    gdcNumber,
    verificationId
  ).catch(err => console.error('[Analytics] Failed to track:', err))
  
  return response
}
```

### Middleware Integration

Use the analytics middleware to automatically track all API calls:

```typescript
import { withAnalytics } from '@/lib/api-analytics-middleware'
import { compose } from '@/lib/api-middleware'

const handler = compose(
  withAnalytics,  // Automatically tracks API performance
  withAuth,
  withRateLimit
)(async (request, context) => {
  // Your handler logic
})
```

## Testing

### Test Endpoints

1. **Configuration Test**: `GET /api/analytics/server/test`
   - Checks if server analytics is configured
   - Sends test events to GA4

2. **Custom Event Test**: `POST /api/analytics/server/test`
   ```json
   {
     "eventName": "custom_test_event",
     "parameters": {
       "test_param": "value"
     },
     "userId": "test-user-123"
   }
   ```

### Verifying Events in GA4

1. Go to GA4 > Reports > Real-time
2. Look for your events (may take 1-2 minutes to appear)
3. Check DebugView for detailed event parameters

## Best Practices

1. **Non-Blocking Tracking**: Always use `.catch()` to prevent tracking errors from affecting your application:
   ```typescript
   serverAnalytics.trackEvent(...)
     .catch(err => console.error('[Analytics] Error:', err))
   ```

2. **User Privacy**: 
   - Hash sensitive data (e.g., email addresses, GDC numbers)
   - Don't track personally identifiable information
   - Respect user consent preferences

3. **Event Naming**: Follow GA4 conventions:
   - Use snake_case for event names
   - Keep names under 40 characters
   - Use descriptive, action-oriented names

4. **Batching**: Events are automatically batched for performance
   - Batch size: 25 events (GA4 limit)
   - Batch delay: 1 second
   - Force flush with `serverAnalytics.flush()`

5. **Error Handling**: The library handles errors gracefully
   - Failed events are retried
   - Network errors don't crash your application
   - Debug mode available for development

## Limitations

- GA4 Measurement Protocol is meant to **augment** client-side tracking, not replace it
- Some GA4 features require client-side data (e.g., sessions, engagement metrics)
- Real-time reporting may have a 1-2 minute delay
- Maximum 25 events per batch request

## Debugging

Enable debug mode by setting `NODE_ENV=development`. This will:
- Use the GA4 debug endpoint
- Log validation messages
- Show detailed error information

## Future Enhancements

- [ ] Implement event deduplication
- [ ] Add retry logic with exponential backoff
- [ ] Create dashboard for server-side metrics
- [ ] Add support for user properties persistence
- [ ] Implement offline event queuing