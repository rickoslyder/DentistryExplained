# Analytics Implementation Guide

## Overview

Dentistry Explained uses a multi-layered analytics approach combining Google Analytics 4 (GA4), Meta Pixel, and PostHog for comprehensive tracking and insights.

## Current Implementation

### 1. Google Tag Manager (GTM)
- **Web Container**: `GTM-MVDNCWGV`
- **Server Container**: `GTM-T2L7R29T`
- **Server-side endpoint**: `https://server-side-tagging-zlmkxmxrqq-uc.a.run.app`

### 2. Google Analytics 4 (GA4)
- **Measurement ID**: `G-PC5CJTZ95B`
- Configured for both client-side and server-side tracking
- Enhanced ecommerce ready but not active

### 3. Meta Pixel
- **Pixel ID**: `1483701746395033`
- Integrated with Conversions API
- Event mapping between GA4 and Meta events

### 4. PostHog (New)
- Product analytics and feature flags
- Session recordings disabled for privacy
- Requires environment variables:
  - `NEXT_PUBLIC_POSTHOG_KEY`
  - `NEXT_PUBLIC_POSTHOG_HOST` (defaults to https://app.posthog.com)

## Analytics Architecture

### Client-Side Tracking
```typescript
// Unified analytics instance
import { unifiedAnalytics } from '@/lib/analytics-unified'

// Track events across all platforms
unifiedAnalytics.track({
  name: 'event_name',
  properties: { ... },
  revenue: 10.00, // Optional
  ga4: true,      // Send to GA4
  meta: true,     // Send to Meta
  posthog: true   // Send to PostHog
})
```

### React Hook
```typescript
import { useAnalytics } from '@/hooks/use-analytics'

const { 
  track, 
  trackClick, 
  trackFormSubmit, 
  trackSearch,
  trackEngagement,
  trackGoal,
  trackError,
  isFeatureEnabled 
} = useAnalytics()
```

## Events Being Tracked

### Standard Events
- `page_view` - All page views with user context
- `sign_up` - User registration
- `search` - Site and web searches
- `error` - JavaScript errors and exceptions

### Custom Events
- `article_view` - Article page views with metadata
- `article_bookmark` - Bookmark actions
- `chat_session_start` - AI chat initiated
- `chat_message_sent` - Chat interactions
- `emergency_guide_view` - Emergency page usage
- `glossary_term_view` - Glossary interactions
- `professional_verification` - Verification flow
- `web_search_performed` - External search usage

### Ecommerce Events (Future)
- `purchase` - Subscription purchases
- `add_to_cart` - Feature selection
- `begin_checkout` - Payment flow start

## Privacy & Compliance

### Data Sanitization
- Healthcare terms are automatically sanitized
- No PHI (Protected Health Information) is sent to third parties
- User emails are hashed before transmission

### Consent Management
- Analytics only tracks with explicit consent
- Consent status is checked before each event
- Users can opt-out at any time

### GDPR Compliance
- User data is anonymized where possible
- IP addresses are anonymized in GA4
- No session recordings in PostHog
- 180-day data retention policy

## Database Tables

### Analytics Storage
- `article_views` - Page view events
- `content_analytics` - Aggregated daily metrics
- `web_searches` - Search query tracking
- `chat_sessions` - Chat interaction data
- `glossary_interactions` - Glossary usage

## Server-Side Tracking

### Stape Configuration
The server container runs on Google Cloud Run and provides:
- Enhanced data collection
- IP anonymization
- Geographic enrichment
- Device detection
- Cookie-less tracking support

### Measurement Protocol
Server-side events can be sent directly to GA4:
```typescript
// Environment variables needed:
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your-api-secret
```

## Performance Tracking

### Web Vitals
Automatically tracked metrics:
- FCP (First Contentful Paint)
- LCP (Largest Contentful Paint)
- CLS (Cumulative Layout Shift)
- INP (Interaction to Next Paint)
- TTFB (Time to First Byte)

### Custom Metrics
- Page load time
- Time to interactive
- API response times
- Search query performance

## Feature Flags (PostHog)

```typescript
// Check if feature is enabled
const showNewFeature = isFeatureEnabled('new-feature-flag')

// Get feature flag variant
const variant = unifiedAnalytics.getFeatureFlag('experiment-name')
```

## Revenue Attribution

### Current Implementation
- Page view value: £0.002 per view (£2 CPM)
- Professional account value: £50 lifetime value
- Verified professional: £500 predicted LTV

### Attribution Channels
- UTM parameters automatically tracked
- Referrer analysis
- First-touch and last-touch attribution

## Testing Analytics

### Debug Mode
In development, analytics events are logged to console:
```bash
# Enable debug mode
localStorage.setItem('analytics_debug', 'true')
```

### GTM Preview Mode
1. Go to GTM workspace
2. Click "Preview" button
3. Enter your site URL
4. Debug tags in real-time

### PostHog Debug
```javascript
// Enable PostHog debug mode
posthog.debug()
```

## Common Implementation Patterns

### Track Article Engagement
```typescript
unifiedAnalytics.trackArticleView({
  id: article.id,
  title: article.title,
  category: article.category,
  author: article.author,
  readingLevel: 'basic'
})
```

### Track Conversion Funnel
```typescript
// Step 1: Landing page
trackFunnelStep('professional_signup', 1, 'landing_page_view')

// Step 2: Registration
trackFunnelStep('professional_signup', 2, 'account_created')

// Step 3: Verification
trackFunnelStep('professional_signup', 3, 'verification_submitted')

// Step 4: Approval
trackFunnelStep('professional_signup', 4, 'verification_approved')
```

### Track Goals
```typescript
// Track high-value conversions
trackGoal('professional_verified', 100.00, {
  verification_type: 'gdc',
  time_to_verify: '2 days'
})
```

## Future Enhancements

1. **Enhanced Ecommerce**
   - Product impressions
   - Cart abandonment tracking
   - Checkout funnel optimization

2. **Advanced Attribution**
   - Multi-touch attribution models
   - Cross-device tracking
   - Offline conversion import

3. **Predictive Analytics**
   - Churn prediction
   - LTV modeling
   - Content recommendation engine

4. **Real-time Dashboards**
   - Live user monitoring
   - Anomaly detection
   - Alert system

## Troubleshooting

### Events Not Appearing
1. Check consent status
2. Verify environment variables
3. Check GTM container publishing
4. Review browser console for errors

### Data Discrepancies
1. Server-side events may have delay
2. Check timezone settings
3. Verify filter configurations
4. Review sampling settings

### PostHog Issues
1. Ensure API key is set
2. Check network requests
3. Verify consent status
4. Review PostHog dashboard

## Resources

- [GTM Dashboard](https://tagmanager.google.com)
- [GA4 Dashboard](https://analytics.google.com)
- [Meta Events Manager](https://business.facebook.com/events_manager)
- [PostHog Dashboard](https://app.posthog.com)
- [Stape.io Dashboard](https://app.stape.io)