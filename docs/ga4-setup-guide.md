# Google Analytics 4 Setup Guide

## Overview
This guide will help you set up Google Analytics 4 (GA4) for the Dentistry Explained platform. The integration provides comprehensive analytics tracking with both client-side and server-side capabilities.

## Prerequisites
- Google account with access to Google Analytics
- Google Cloud Platform account (for API access)
- Admin access to Dentistry Explained deployment

## Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Click Admin (gear icon) → Create Property
3. Enter property details:
   - Property name: "Dentistry Explained"
   - Time zone: GMT (London)
   - Currency: GBP
4. Select "Web" as platform
5. Enter website details:
   - Website URL: https://dentistry-explained.vercel.app
   - Stream name: "Production"

## Step 2: Configure Data Streams

1. In your GA4 property, go to Admin → Data Streams
2. Click on your web stream
3. Enable Enhanced Measurement for:
   - Page views
   - Scrolls
   - Outbound clicks
   - Site search
   - Form interactions
   - File downloads

## Step 3: Get Measurement ID

1. In Data Streams, copy your Measurement ID (format: G-XXXXXXXXXX)
2. This will be used for `GA4_MEASUREMENT_ID` environment variable

## Step 4: Set Up Measurement Protocol

1. In Admin → Data Streams → Your Stream
2. Click "Measurement Protocol API secrets"
3. Create a new secret:
   - Nickname: "Server-side tracking"
   - Copy the generated secret
4. This will be used for `GA4_API_SECRET` environment variable

## Step 5: Enable Google Analytics Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable the Google Analytics Data API:
   - Go to APIs & Services → Library
   - Search for "Google Analytics Data API"
   - Click Enable

## Step 6: Create Service Account

1. In Google Cloud Console, go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Enter details:
   - Name: "Dentistry Explained Analytics"
   - ID: "dentistry-explained-analytics"
4. Grant role: "Viewer"
5. Create and download JSON key

## Step 7: Grant GA4 Access to Service Account

1. Copy the service account email (format: xxx@project-id.iam.gserviceaccount.com)
2. In GA4, go to Admin → Property Access Management
3. Click the + button → Add users
4. Enter the service account email
5. Grant "Viewer" role

## Step 8: Configure Environment Variables

Add to your `.env.local` file:

```bash
# GA4 Configuration
GA4_PROPERTY_ID=123456789  # Your property ID (found in Property Settings)
GA4_MEASUREMENT_ID=G-XXXXXXXXXX  # Your measurement ID
GA4_API_SECRET=your-api-secret  # From Measurement Protocol setup

# GA4 Service Account (stringified JSON)
GA4_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

## Step 9: Configure Google Tag Manager (Already Set Up)

The following are already configured in the codebase:
- GTM Web Container: GTM-MVDNCWGV
- GTM Server Container: GTM-T2L7R29T
- Server endpoint: https://xtnpqrnt.eue.stape.net

## Step 10: Verify Installation

1. Check real-time reports in GA4
2. Use Google Tag Assistant to verify tags
3. Test custom events in DebugView
4. Monitor the Admin dashboard analytics page

## Custom Events Tracked

The platform tracks these custom events:
- `article_view` - Article page views
- `article_bookmark` - Bookmark actions
- `chat_session_start` - AI chat initiated
- `chat_message_sent` - Chat interactions
- `emergency_guide_view` - Emergency page usage
- `glossary_term_view` - Glossary interactions
- `quiz_attempt` - Quiz completions
- `professional_verification` - Verification process
- `web_search_performed` - Search usage

## Privacy Considerations

1. **User Consent**: All tracking respects user consent preferences
2. **Data Anonymization**: IP addresses are anonymized
3. **Healthcare Compliance**: Sensitive health terms are sanitized
4. **GDPR Compliance**: Users can request data deletion

## Troubleshooting

### No data appearing in GA4
1. Check environment variables are set correctly
2. Verify measurement ID format (G-XXXXXXXXXX)
3. Check browser console for errors
4. Ensure not blocked by ad blockers

### API errors
1. Verify service account has correct permissions
2. Check API is enabled in Google Cloud
3. Ensure JSON key is properly stringified
4. Verify property ID is numeric only

### Real-time data not working
1. Check GA4_API_SECRET is set
2. Verify Measurement Protocol is enabled
3. Test with GA4 DebugView

## Support

For additional help:
- [GA4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [Measurement Protocol](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Google Analytics Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)