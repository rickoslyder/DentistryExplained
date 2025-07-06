# Testing Analytics on Port 3456

Since port 3000 is already in use, the app is now running on port **3456**.

## Quick Access Links

- **Main App**: http://localhost:3456
- **Admin Analytics Dashboard**: http://localhost:3456/admin/analytics
- **Analytics Test Dashboard**: http://localhost:3456/admin/analytics/test-dashboard
- **Professional Verification**: http://localhost:3456/professional/verify
- **Search Page**: http://localhost:3456/search
- **AI Chat**: Available on any page (bottom right corner)

## Test URLs for API Endpoints

```bash
# Test GA4 Configuration
curl http://localhost:3456/api/analytics/ga4/test

# Test Server Analytics
curl http://localhost:3456/api/analytics/server/test

# Send Custom Event
curl -X POST http://localhost:3456/api/analytics/server/test \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "test_event",
    "parameters": {"test": true},
    "userId": "test-user"
  }'
```

## Run Test Script

The test script has been updated to use port 3456:

```bash
node scripts/test-analytics.js
```

## Alternative: Use Environment Variable

You can also override the port using an environment variable:

```bash
BASE_URL=http://localhost:3456 node scripts/test-analytics.js
```

## Tips

1. Make sure the dev server is running on port 3456 before testing
2. All the test features work exactly the same, just with the new port
3. In GA4, you'll see the events coming from localhost:3456

## If Port 3456 is Also Taken

You can start the server on any available port:

```bash
npm run dev -- -p 4567
# or
npm run dev -- -p 5678
# or any port you prefer
```

Just remember to update the test script's BASE_URL accordingly.