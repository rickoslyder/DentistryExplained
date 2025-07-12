# Google Analytics 4 (GA4) Setup Guide

## Overview
The application is configured to use Google Analytics 4 for tracking user behavior and generating analytics reports. However, GA4 requires proper authentication setup to work correctly.

## Current Error
The server logs show:
```
GA4 Analytics Error - Error: 7 INVALID_ARGUMENT: Request contains an invalid argument.
```

This error occurs because the GA4 API client is not properly authenticated.

## Required Environment Variables

### Option 1: Service Account Key (Recommended)
Add these to your `.env.local`:

```bash
# GA4 Property ID (required)
GA4_PROPERTY_ID=123456789  # Replace with your actual property ID

# Service Account Key (required for API access)
GA4_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@...iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}'
```

**Important**: The `GA4_SERVICE_ACCOUNT_KEY` must be a stringified JSON object (wrapped in single quotes).

### Option 2: Default Application Credentials
If running on Google Cloud Platform, you can use Application Default Credentials:

```bash
# Only the property ID is needed
GA4_PROPERTY_ID=123456789
```

## How to Get These Values

### 1. GA4 Property ID
1. Go to [Google Analytics](https://analytics.google.com/)
2. Select your property
3. Go to Admin (gear icon)
4. Under "Property", click "Property details"
5. Copy the "Property ID" (numeric value)

### 2. Service Account Key
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create one)
3. Go to "IAM & Admin" > "Service Accounts"
4. Click "Create Service Account"
   - Name: `ga4-api-access`
   - Description: `Service account for GA4 API access`
5. Click "Create and Continue"
6. Skip the optional steps and click "Done"
7. Click on the created service account
8. Go to "Keys" tab
9. Click "Add Key" > "Create new key"
10. Choose "JSON" format
11. Download the key file
12. Copy the entire contents and stringify it (escape quotes, newlines)

### 3. Grant GA4 Access
1. In Google Analytics, go to Admin
2. Under "Property", click "Property Access Management"
3. Click the "+" button to add user
4. Enter the service account email (from the JSON key)
5. Grant "Viewer" role (minimum required)
6. Click "Add"

## Verifying the Setup

After adding the environment variables:

1. Restart your development server
2. Check the logs - you should no longer see GA4 errors
3. Visit `/api/analytics/realtime` - it should return real data instead of mock data

## Fallback Behavior

If GA4 is not configured or encounters errors:
- The application will gracefully fall back to mock data
- No user-facing errors will occur
- Analytics dashboards will still function with simulated data

## Troubleshooting

### Common Issues

1. **Invalid JSON format**
   - Ensure the service account key is properly stringified
   - Use single quotes to wrap the entire JSON string
   - Escape any internal quotes

2. **Permission denied**
   - Verify the service account has "Viewer" access in GA4
   - Check that the property ID matches your GA4 property

3. **API not enabled**
   - Go to Google Cloud Console
   - Enable "Google Analytics Data API"
   - Wait a few minutes for propagation

### Debug Mode

To enable detailed logging, set:
```bash
DEBUG=ga4:*
```

This will output detailed information about API calls and errors.

## Security Notes

- Never commit the service account key to version control
- Keep the `.env.local` file in `.gitignore`
- Consider using a secrets management service in production
- Rotate service account keys periodically