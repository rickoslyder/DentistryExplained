# Testing New Features Locally

This guide helps you test all the newly implemented features: Enhanced Analytics, GA4 Integration, and Server-side Tracking.

## Prerequisites
- Ensure all environment variables are set in `.env.local`:
  - `GA4_PROPERTY_ID`
  - `GA4_SERVICE_ACCOUNT_KEY` (optional, but recommended)
  - `GA4_MEASUREMENT_ID`
  - `GA4_API_SECRET`

## 1. Test GA4 Configuration

### Step 1: Check GA4 API Configuration
```bash
# Start the dev server
npm run dev

# In a new terminal, test GA4 API configuration
curl http://localhost:3000/api/analytics/ga4/test
```

**Expected Result**: You should see:
```json
{
  "configured": true,
  "propertyId": "YOUR_PROPERTY_ID",
  "hasServiceAccount": true,
  "data": {
    "activeUsers": 0,
    "topPages": [],
    "topSources": [],
    "eventSummary": []
  }
}
```

### Step 2: Test Server-side Analytics Configuration
```bash
curl http://localhost:3000/api/analytics/server/test
```

**Expected Result**: You should see test events being sent to GA4.

## 2. Test Enhanced Analytics Dashboard

### Step 1: Access the Admin Analytics Page
1. Navigate to http://localhost:3000/admin/analytics
2. You should see the enhanced analytics dashboard with:
   - Revenue Metrics cards
   - Real-time Analytics (now pulling from GA4)
   - Professional Funnel visualization
   - Content Performance metrics

### Step 2: Test Real-time Updates
1. Click the "Refresh" button in the Real-time Analytics section
2. Data should update from GA4
3. Check for:
   - Active users count
   - Top pages being viewed
   - Traffic sources
   - Recent events

## 3. Test Server-side Event Tracking

### Step 1: Test Professional Verification Tracking
1. Navigate to http://localhost:3000/professional/verify
2. Fill out the verification form with test data:
   - GDC Number: 1234567
   - Full Name: Test Professional
   - Practice Name: Test Practice
3. Submit the form
4. Check GA4 Real-time reports for the `professional_verification` event

### Step 2: Test Chat Session Tracking
1. Open the AI chat assistant (bottom right chat icon)
2. Send a message: "What is a dental implant?"
3. Check GA4 Real-time reports for:
   - `chat_session` event (with action: created)
   - `chat_interaction` event

### Step 3: Test Search Tracking
1. Navigate to http://localhost:3000/search
2. Search for "tooth decay"
3. Click on a search result
4. Check GA4 for:
   - `search` event (server-side)
   - `search_result_click` event (client-side)

### Step 4: Test Custom Event Tracking
```bash
curl -X POST http://localhost:3000/api/analytics/server/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "test_custom_event",
    "parameters": {
      "test_param": "test_value",
      "test_number": 123
    },
    "userId": "test-user-123"
  }'
```

## 4. Verify in Google Analytics 4

### Real-time Reports
1. Open Google Analytics 4
2. Navigate to Reports > Real-time
3. You should see:
   - Active users on your local site
   - Events flowing in real-time
   - Event parameters in event details

### DebugView (Recommended)
1. Navigate to Admin > DebugView
2. Enable debug mode by adding `?_dbg=1` to your local URL
3. You'll see detailed event information including:
   - Event parameters
   - User properties
   - Timing information

## 5. Test Enhanced Event Tracking

### Professional Journey
1. **Track Registration**:
   - Register a new professional account
   - Events: `sign_up`, `registration_complete`

2. **Track Verification Flow**:
   - Start verification: `professional_verification_started`
   - Submit verification: `professional_verification_submitted`
   - View verification status

3. **Track Content Interactions**:
   - View articles
   - Scroll depth tracking
   - Time on page

### Content Management
1. **Create Article with Version Tracking**:
   - Go to http://localhost:3000/admin/articles/new
   - Create and save an article
   - Make edits and save again
   - Check version history tab
   - Restore a previous version
   - Events: `content_version` with action: created/restored

## 6. Test API Performance Tracking

All API calls are now automatically tracked. To see this:

1. Perform various actions (search, chat, etc.)
2. In GA4 DebugView, look for `api_call` events with:
   - `api_endpoint`
   - `api_method`
   - `api_status_code`
   - `api_duration_ms`
   - `api_success`

## 7. Debugging Tips

### Check Browser Console
```javascript
// In browser console, check if dataLayer is working
window.dataLayer

// See recent events
window.dataLayer.filter(item => item.event)
```

### Check Server Logs
Look for analytics-related logs:
- `[Analytics] Failed to track...` - Tracking errors
- `[GA4 API error]` - GA4 API issues
- `GA4 validation messages` - In debug mode

### Common Issues and Solutions

1. **"GA4 not configured"**
   - Check that all GA4 environment variables are set
   - Restart the dev server after adding env vars

2. **No events in GA4**
   - Check that your GA4 property ID is correct
   - Verify API secret is valid
   - Events can take 1-2 minutes to appear
   - Use DebugView for immediate feedback

3. **Authentication errors**
   - For GA4 API: Check service account JSON is properly formatted
   - For Measurement Protocol: Verify API secret

## 8. Test Checklist

- [ ] GA4 API test endpoint returns success
- [ ] Server analytics test endpoint sends events
- [ ] Real-time analytics dashboard shows data
- [ ] Professional verification tracks events
- [ ] Chat sessions track events
- [ ] Search queries track events
- [ ] API calls are automatically tracked
- [ ] Events appear in GA4 Real-time reports
- [ ] Revenue metrics calculate correctly
- [ ] Professional funnel shows conversion data
- [ ] Content performance ranks articles

## Next Steps

Once all tests pass:
1. Monitor GA4 for 24 hours to see data accumulation
2. Set up GA4 audiences for remarketing
3. Create custom reports for business KPIs
4. Configure GA4 alerts for anomalies
5. Set up BigQuery export for advanced analysis