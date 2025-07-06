# GTM Server Container Configuration Guide

## Overview

This guide provides step-by-step instructions for configuring the server-side Google Tag Manager container for Dentistry Explained, leveraging Stape's infrastructure and power-ups for enhanced tracking capabilities.

## Current Server Container Setup

- **Container ID**: GTM-T2L7R29T
- **Server URL**: https://server-side-tagging-zlmkxmxrqq-uc.a.run.app
- **Custom Domain**: xtnpqrnt.eue.stape.net
- **Hosting**: Google Cloud Run via Stape

## Server Container Configuration

### 1. GA4 Client Configuration

The GA4 client is already configured with optimal settings:

```javascript
{
  "activateDefaultPaths": true,
  "cookieManagement": "server",
  "cookieName": "FPID",
  "cookieDomain": "auto",
  "cookiePath": "/",
  "cookieMaxAgeInSec": 63072000  // 2 years
}
```

### 2. User Enrichment Variables

Create these variables in the server container to leverage Stape power-ups:

#### Variable: Stape User ID
```javascript
// Name: v_stape_user_id
// Type: Request Header
// Header Name: x-stape-user-id
```

#### Variable: User Country
```javascript
// Name: v_user_country
// Type: Request Header
// Header Name: x-appengine-country
```

#### Variable: User Region
```javascript
// Name: v_user_region
// Type: Request Header
// Header Name: x-appengine-region
```

#### Variable: User City
```javascript
// Name: v_user_city
// Type: Request Header
// Header Name: x-appengine-city
```

#### Variable: Device Category
```javascript
// Name: v_device_category
// Type: Request Header
// Header Name: x-device-category
```

#### Variable: Device OS
```javascript
// Name: v_device_os
// Type: Request Header
// Header Name: x-device-os
```

#### Variable: Device Browser
```javascript
// Name: v_device_browser
// Type: Request Header
// Header Name: x-device-browser
```

### 3. Event Data Enrichment

Create a variable transformation to enrich all events:

#### Variable: Enriched Event Data
```javascript
// Name: v_enriched_event_data
// Type: Custom JavaScript

function() {
  const eventData = require('getAllEventData');
  const getCookieValues = require('getCookieValues');
  const getRequestHeader = require('getRequestHeader');
  const sha256Sync = require('sha256Sync');
  
  // Get original event data
  let enrichedData = eventData();
  
  // Add Stape User ID
  const stapeUserId = getRequestHeader('x-stape-user-id');
  if (stapeUserId) {
    enrichedData.user_properties = enrichedData.user_properties || {};
    enrichedData.user_properties.stape_user_id = stapeUserId;
    
    // Use for cross-device tracking
    if (!enrichedData.user_id && stapeUserId) {
      enrichedData.user_id = sha256Sync(stapeUserId);
    }
  }
  
  // Add geo enrichment
  enrichedData.geo = {
    country: getRequestHeader('x-appengine-country'),
    region: getRequestHeader('x-appengine-region'), 
    city: getRequestHeader('x-appengine-city'),
    postal_code: getRequestHeader('x-geo-postal-code')
  };
  
  // Add device enrichment
  enrichedData.device = {
    category: getRequestHeader('x-device-category'),
    os: getRequestHeader('x-device-os'),
    browser: getRequestHeader('x-device-browser'),
    browser_version: getRequestHeader('x-device-browser-version')
  };
  
  // Add server processing timestamp
  enrichedData.server_event_time = Math.floor(Date.now() / 1000);
  
  return enrichedData;
}
```

### 4. Healthcare Data Sanitization

Create a transformation to sanitize healthcare data:

#### Variable: Sanitized Event Data
```javascript
// Name: v_sanitized_event_data
// Type: Custom JavaScript

function() {
  const eventData = require('getAllEventData');
  const log = require('logToConsole');
  
  let data = eventData();
  const healthTerms = [
    'dental', 'tooth', 'teeth', 'gum', 'oral', 'cavity',
    'pain', 'emergency', 'bleeding', 'swelling', 'infection',
    'symptom', 'treatment', 'diagnosis'
  ];
  
  // Function to sanitize strings
  function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    
    let sanitized = str.toLowerCase();
    healthTerms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      sanitized = sanitized.replace(regex, 'health_content');
    });
    
    return sanitized;
  }
  
  // Sanitize event name
  if (data.event_name) {
    data.event_name = sanitizeString(data.event_name);
  }
  
  // Sanitize common parameters
  const paramsToSanitize = [
    'page_title', 'page_location', 'content_name',
    'search_term', 'item_name', 'content_category'
  ];
  
  paramsToSanitize.forEach(param => {
    if (data[param]) {
      data[param] = sanitizeString(data[param]);
    }
  });
  
  // Log sanitization for debugging
  log('Event sanitized for healthcare compliance');
  
  return data;
}
```

### 5. Enhanced GA4 Tag

Update the GA4 tag to use enriched data:

```javascript
// Tag Name: GA4 - Enhanced Server Event
// Tag Type: Google Analytics: GA4

// Configuration:
{
  measurementId: "G-PC5CJTZ95B",
  eventName: "{{Event Name}}",
  eventParameters: "{{v_enriched_event_data}}",
  userProperties: {
    stape_user_id: "{{v_stape_user_id}}",
    user_country: "{{v_user_country}}",
    device_category: "{{v_device_category}}"
  }
}

// Trigger: All Events
```

### 6. Enhanced Meta Conversions API Tag

Configure the Meta CAPI tag with advanced matching:

```javascript
// Tag Name: Meta CAPI - Enhanced
// Tag Type: Facebook Conversions API

// Configuration:
{
  pixelId: "1483701746395033",
  apiAccessToken: "{{META_CAPI_TOKEN}}",
  eventName: "{{Event Name}}",
  eventId: "{{Event ID}}",
  
  // Server Event Data
  eventTime: "{{Server Event Time}}",
  eventSourceUrl: "{{Page Location}}",
  actionSource: "website",
  
  // User Data (hashed)
  userData: {
    em: "{{User Email Hash}}",
    external_id: "{{User ID Hash}}",
    client_user_agent: "{{User Agent}}",
    fbc: "{{Facebook Click ID}}",
    fbp: "{{Facebook Browser ID}}"
  },
  
  // Custom Data
  customData: {
    currency: "GBP",
    value: "{{Event Value}}",
    content_name: "{{v_sanitized_event_data.content_name}}",
    content_category: "{{Event Category}}",
    content_ids: "{{Content IDs}}"
  },
  
  // Advanced Matching
  dataProcessingOptions: [],
  testEventCode: "{{Debug Mode}}"
}

// Trigger: Events matching Meta standard events
```

### 7. Consent-Based Event Routing

Create triggers for consent-based routing:

#### Trigger: Has Analytics Consent
```javascript
// Trigger Name: Has Analytics Consent
// Trigger Type: Custom

// Conditions:
// consent_status.analytics equals granted
// OR
// consent_granted equals true
```

#### Trigger: Has Marketing Consent
```javascript
// Trigger Name: Has Marketing Consent
// Trigger Type: Custom

// Conditions:
// consent_status.marketing equals granted
// AND
// geo.country does not equal US (for healthcare compliance)
```

### 8. Server-Side Cookie Extension

Create a tag to extend marketing cookies:

```javascript
// Tag Name: Cookie Extension - Marketing
// Tag Type: Cookie Setter

// Configuration:
{
  cookies: [
    {
      name: "_fbp",
      value: "{{Facebook Browser ID}}",
      domain: "auto",
      path: "/",
      maxAge: 63072000, // 2 years
      secure: true,
      sameSite: "Lax"
    },
    {
      name: "_fbc",
      value: "{{Facebook Click ID}}",
      domain: "auto",
      path: "/",
      maxAge: 63072000, // 2 years
      secure: true,
      sameSite: "Lax"
    }
  ]
}

// Trigger: Has Marketing Consent
```

### 9. Error Logging and Monitoring

Create a tag for error logging:

```javascript
// Tag Name: Error Logger
// Tag Type: Custom HTML

const logToConsole = require('logToConsole');
const getEventData = require('getAllEventData');
const getTimestamp = require('getTimestamp');

const eventData = getEventData();

// Log errors and warnings
if (eventData.event_name === 'error' || eventData.error_message) {
  const errorLog = {
    timestamp: getTimestamp(),
    event_name: eventData.event_name,
    error_message: eventData.error_message,
    error_context: eventData.error_context,
    user_id: eventData.user_id,
    page_location: eventData.page_location
  };
  
  logToConsole('ERROR:', errorLog);
  
  // Send to monitoring service
  // sendHttpRequest(...)
}

// Trigger: Error Events
```

### 10. Performance Monitoring

Create variables to track server performance:

```javascript
// Variable: Processing Time
// Type: Custom JavaScript

function() {
  const getTimestamp = require('getTimestamp');
  const eventData = require('getAllEventData');
  
  const startTime = eventData().gtm.start || getTimestamp();
  const endTime = getTimestamp();
  
  return endTime - startTime;
}
```

## Testing the Server Container

### 1. Use Server Container Preview
1. Open GTM Server Container
2. Click "Preview"
3. Send test events from web container
4. Verify enrichment and routing

### 2. Check Stape Headers
In preview mode, verify these headers are present:
- `x-stape-user-id`
- `x-appengine-country`
- `x-device-category`

### 3. Validate Event Transformation
1. Send healthcare-related event
2. Verify sanitization applied
3. Check Meta CAPI receives clean data

### 4. Test Cookie Extension
1. Clear browser cookies
2. Trigger pageview
3. Check cookie expiration (2 years)

## Monitoring and Maintenance

### Daily Checks
- Server container uptime
- Error rate in logs
- Event processing time

### Weekly Reviews
- Cookie extension effectiveness
- Geo-enrichment accuracy
- Consent compliance

### Monthly Audits
- Tag performance optimization
- Variable usage cleanup
- Cost analysis in Stape dashboard

## Troubleshooting

### Common Issues

1. **Missing Stape Headers**
   - Verify Stape power-ups enabled
   - Check custom domain configuration
   - Ensure requests routed through Stape

2. **Events Not Processing**
   - Check trigger conditions
   - Verify consent status
   - Review error logs

3. **Cookie Extension Not Working**
   - Confirm server-side cookies enabled
   - Check domain configuration
   - Verify cookie consent granted

4. **Geo Data Missing**
   - Enable GEO Headers power-up
   - Check IP anonymization settings
   - Verify Stape plan includes feature

## Best Practices

1. **Always Test in Preview Mode** before publishing changes
2. **Use Version Control** with descriptive notes
3. **Monitor Performance** to avoid latency
4. **Document Custom Code** for team members
5. **Regular Audits** of tags and variables
6. **Backup Configurations** before major changes

## Security Considerations

1. **API Keys**: Store in server-side variables only
2. **PII Handling**: Hash before sending to vendors
3. **Access Control**: Limit container permissions
4. **Audit Logs**: Review monthly for anomalies
5. **Data Retention**: Configure based on privacy policy

This configuration maximizes the benefits of server-side tracking while maintaining privacy compliance and healthcare data protection standards.