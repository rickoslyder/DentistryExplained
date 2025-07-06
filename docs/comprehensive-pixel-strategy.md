# Comprehensive Pixel Tagging Strategy for Dentistry Explained

## Executive Summary

This document outlines a complete pixel tracking implementation strategy for Dentistry Explained, incorporating Google Analytics 4, Google Tag Manager, and Meta Pixel events. The strategy ensures GDPR compliance, healthcare data privacy, and comprehensive user journey tracking.

## Current Analytics Infrastructure

### Existing Implementation
- **Web Container (GTM)**: ID `GTM-MVDNCWGV` 
- **Server Container (sGTM)**: ID `GTM-T2L7R29T`
- **Google Analytics 4 (GA4)**: ID `G-PC5CJTZ95B`
- **Stape Custom Domain**: `xtnpqrnt.eue.stape.net`
- **Meta Pixel**: ID `1483701746395033`
- **Database Tracking**: Multiple tables for interaction tracking

### Server-Side Infrastructure
- **Hosting**: Google Cloud Run via Stape
- **Server URL**: `server-side-tagging-zlmkxmxrqq-uc.a.run.app`
- **Stape Power-Ups**:
  - Custom Loader (bypass ad blockers)
  - User ID (persistent identification)
  - GEO Headers (location enrichment)
  - User Agent Info (device parsing)

### Key Tracking Tables
- `article_views` - Content engagement
- `chat_sessions` & `chat_messages` - AI assistant usage
- `glossary_interactions` - Term lookups and quiz attempts
- `emergency_audit_logs` - Emergency guide usage
- `web_searches` - Search behavior
- `professional_downloads` - Resource access

## Comprehensive Event Taxonomy

### 1. Content Engagement Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `page_view` | All pages | GTM (automatic) | PageView |
| `article_view` | Article pages | Code + GTM | ViewContent |
| `scroll_depth` | 25/50/75/90% | GTM | - |
| `article_bookmark` | Bookmark button | Code | - |
| `article_share` | Share buttons | GTM | - |
| `article_print` | Print action | GTM | - |
| `reading_complete` | 90% scroll + time | GTM | - |

### 2. Search & Discovery Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `site_search` | Search submission | Code | Search |
| `search_result_click` | Result selection | Code | - |
| `trending_search_click` | Trending term | Code | - |
| `web_search_performed` | Perplexity/Exa | Code | Search |
| `category_browse` | Category nav | GTM | - |
| `glossary_term_view` | Term click | Code | - |

### 3. User Journey Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `sign_up_start` | Registration begin | Code | - |
| `sign_up` | Account created | Code | CompleteRegistration |
| `login` | User login | Code | - |
| `onboarding_step` | Step completion | Code | - |
| `onboarding_complete` | Finish onboarding | Code | - |
| `user_type_selected` | Patient/Pro choice | Code | - |

### 4. AI Assistant Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `chat_session_start` | Chat opened | Code | Contact |
| `chat_message_sent` | User message | Code | - |
| `chat_ai_response` | AI reply | Code | - |
| `chat_export` | Export chat | Code | - |
| `chat_quality_rating` | Rate conversation | Code | - |
| `suggested_question_click` | Use suggestion | Code | - |

### 5. Professional Features

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `professional_verification_start` | Begin verify | Code | - |
| `professional_verification_submit` | Submit docs | Code | SubmitApplication |
| `professional_verification_success` | Approved | Code | - |
| `consent_form_generate` | Create form | Code | - |
| `patient_material_download` | Download PDF | Code + GTM | - |
| `practice_claim_start` | Claim listing | Code | - |

### 6. Emergency & Health Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `emergency_page_view` | Page load | Code | - |
| `symptom_checker_start` | Begin checker | Code | - |
| `symptom_checker_complete` | Get result | Code | - |
| `emergency_action` | NHS 111, etc | Code | - |
| `find_dentist_search` | Location search | Code | FindLocation |

### 7. Conversion Events

| Event Name | Trigger | Implementation | Meta Event |
|------------|---------|----------------|------------|
| `newsletter_signup` | Form submit | GTM | Lead |
| `contact_form_submit` | Inquiry sent | GTM | Contact |
| `professional_interest` | Pro inquiry | GTM | Lead |
| `download_resource` | PDF download | GTM | - |
| `external_referral` | Outbound click | GTM | - |

## Implementation Architecture

### 1. Analytics Utility (`/lib/analytics.ts`)

```typescript
// Core tracking functions
analytics.setUser({ id, type, isVerified });
analytics.track(eventName, parameters);
analytics.trackMetaEvent(MetaStandardEvent, parameters);

// Specific tracking methods
analytics.trackArticleView(article);
analytics.trackSearch(query, results);
analytics.trackRegistration(userType);
analytics.trackChatInteraction(action, sessionId);
analytics.trackBookmark(articleId, action);
analytics.trackFormSubmission(formType);
analytics.trackProfessionalVerification(action);
analytics.trackEmergencyGuide(action);
analytics.trackFindDentist(location);
```

### 2. GTM Configuration Structure

```
Tags (25 total)
├── Analytics (10)
│   ├── GA4 Configuration
│   ├── GA4 Event - Scroll Depth
│   ├── GA4 Event - Outbound Links
│   ├── GA4 Event - File Downloads
│   └── GA4 Event - Form Submissions
├── Meta Pixel (8)
│   ├── Meta Base Code
│   ├── Meta PageView
│   ├── Meta ViewContent
│   ├── Meta Search
│   ├── Meta Lead
│   └── Meta Custom Events
└── Utilities (7)
    ├── Consent Mode Update
    ├── User Properties Set
    └── Error Tracking

Triggers (20 total)
├── Page Views (4)
├── User Engagement (8)
├── Forms & CTAs (4)
└── Technical (4)

Variables (30 total)
├── Data Layer (15)
├── Custom JavaScript (10)
└── Built-in Enhanced (5)
```

## Meta Pixel Implementation

### Standard Events Mapping

```javascript
// ViewContent - Article Reading
fbq('track', 'ViewContent', {
  content_name: article.title,        // Sanitized
  content_category: article.category, // Generic category
  content_type: 'article',
  content_ids: [article.id],
  value: 0.50,
  currency: 'GBP'
});

// Search - Site/Web Search
fbq('track', 'Search', {
  search_string: query,              // Sanitized query
  content_category: 'all',
  value: 0.25,
  currency: 'GBP'
});

// Lead - Newsletter/Professional Interest
fbq('track', 'Lead', {
  content_name: 'Newsletter Signup',
  content_category: 'email_marketing',
  value: 5.00,
  currency: 'GBP'
});

// CompleteRegistration - Account Creation
fbq('track', 'CompleteRegistration', {
  content_name: userType + ' Account',
  status: true,
  value: userType === 'professional' ? 50.00 : 10.00,
  currency: 'GBP'
});

// SubmitApplication - Professional Verification
fbq('track', 'SubmitApplication', {
  content_name: 'Professional Verification',
  content_type: 'verification',
  value: 100.00,
  currency: 'GBP'
});

// FindLocation - Dentist Search
fbq('track', 'FindLocation', {
  search_string: location,
  content_type: 'practice_search'
});
```

### Healthcare Compliance

```javascript
// Sanitization function for Meta events
function sanitizeHealthcareData(data) {
  const healthTerms = [
    'dental', 'tooth', 'teeth', 'gum', 'oral', 
    'cavity', 'pain', 'emergency', 'bleeding'
  ];
  
  // Replace health terms with generic ones
  let sanitized = JSON.parse(JSON.stringify(data));
  
  Object.keys(sanitized).forEach(key => {
    if (typeof sanitized[key] === 'string') {
      healthTerms.forEach(term => {
        sanitized[key] = sanitized[key]
          .replace(new RegExp(term, 'gi'), 'content');
      });
    }
  });
  
  return sanitized;
}
```

## Privacy & Compliance

### Consent Management

```javascript
// Check consent before firing pixels
if (window.consentManager?.hasConsent('marketing')) {
  fbq('track', eventName, parameters);
}

// GTM Consent Mode
gtag('consent', 'update', {
  analytics_storage: userConsent ? 'granted' : 'denied',
  ad_storage: userConsent ? 'granted' : 'denied',
  ad_user_data: userConsent ? 'granted' : 'denied',
  ad_personalization: userConsent ? 'granted' : 'denied'
});
```

### Data Minimization Principles

1. **No Health Conditions**: Never track specific symptoms or conditions
2. **Generic Event Names**: Use neutral naming for sensitive actions
3. **Hashed User IDs**: Always hash before sending to third parties
4. **Limited PII**: Only collect essential user information
5. **Retention Limits**: 180-day maximum for chat history

## Server-Side Tracking Enhancement

### Benefits of Server-Side Implementation

1. **40% More Accurate Data**
   - Bypass ad blockers completely
   - Avoid iOS 14.5+ tracking prevention
   - Capture users with privacy extensions

2. **Extended Cookie Lifetime**
   - GA4: 2 years (vs 7 days client-side)
   - Meta: Persistent tracking cookies
   - Custom cookies: No browser restrictions

3. **Enhanced Privacy Compliance**
   - Process data before sending to vendors
   - Remove PII server-side
   - Apply consent at server level
   - Healthcare data filtering

4. **Better Performance**
   - Reduced client-side scripts
   - Faster page load times
   - Single tracking request
   - Optimized mobile experience

### Server Container Configuration

```javascript
// Server Client: GA4
{
  cookieName: "FPID",
  cookieDomain: "auto",
  cookiePath: "/",
  cookieMaxAge: 63072000, // 2 years
  cookieManagement: "server"
}

// Server Tag: Meta Conversions API
{
  pixelId: "1483701746395033",
  apiAccessToken: "{{META_API_TOKEN}}",
  testEventCode: "{{TEST_EVENT_CODE}}"
}
```

### Stape Power-Up Utilization

#### 1. Custom Loader
```javascript
// Changes tracking scripts from:
// https://www.googletagmanager.com/gtm.js
// To:
// https://xtnpqrnt.eue.stape.net/8m4gzxtnpqrnt.js

// Result: Invisible to ad blockers
```

#### 2. User ID Power-Up
```javascript
// Server-side enrichment
event.user_id = request.headers['x-stape-user-id'];
event.user_properties = {
  stape_user_id: event.user_id,
  cross_device_id: hashUserId(event.user_id)
};
```

#### 3. GEO Headers Enhancement
```javascript
// Automatic geo-enrichment
event.geo = {
  country: request.headers['x-appengine-country'],
  region: request.headers['x-appengine-region'],
  city: request.headers['x-appengine-city'],
  postal_code: request.headers['x-geo-postal-code']
};

// Use for consent management
if (event.geo.country === 'GB') {
  applyGDPRRules(event);
}
```

#### 4. User Agent Parsing
```javascript
// Device enrichment
event.device = {
  category: request.headers['x-device-category'], // mobile/tablet/desktop
  os: request.headers['x-device-os'],
  browser: request.headers['x-device-browser'],
  browser_version: request.headers['x-device-browser-version']
};
```

### Server-Side Event Processing

```javascript
// Server Container Tag Template
const processHealthcareEvent = (event) => {
  // 1. Remove healthcare terms
  event = sanitizeHealthcareData(event);
  
  // 2. Apply consent
  if (!hasConsent(event.client_id)) {
    return null;
  }
  
  // 3. Enrich with server data
  event.server_data = {
    ip_override: anonymizeIP(event.ip_address),
    user_agent: event.user_agent,
    geo_override: event.geo,
    event_time: Math.floor(Date.now() / 1000)
  };
  
  // 4. Hash PII
  if (event.user_data?.email) {
    event.user_data.email = hashEmail(event.user_data.email);
  }
  
  return event;
};
```

### Dual Tracking Strategy

```javascript
// Client-side (immediate, less accurate)
analytics.track('article_view', {
  article_id: '123',
  article_title: 'Tooth Decay Guide'
});

// Server-side (delayed, more accurate)
// Automatically enriched with:
// - Persistent User ID
// - Accurate geo-location
// - Device information
// - Consent status
// - Sanitized data
```

### Healthcare-Specific Server Rules

1. **PHI Filtering**
   ```javascript
   // Server-side transformation
   if (event.event_name.includes('symptom')) {
     event.event_name = 'health_content_interaction';
     delete event.symptom_details;
   }
   ```

2. **Consent-Based Routing**
   ```javascript
   // Route events based on consent
   if (consent.analytics_only) {
     sendToGA4(event);
   } else if (consent.full_tracking) {
     sendToGA4(event);
     sendToMeta(event);
   }
   ```

3. **Value Assignment**
   ```javascript
   // Server-side value calculation
   event.value = calculateEventValue({
     user_type: event.user_properties.user_type,
     event_name: event.event_name,
     engagement_score: event.user_properties.engagement_score
   });
   ```

## Implementation Timeline

### Phase 1: Foundation (Week 1)
- [x] Install GTM and GA4 base configuration
- [x] Configure server-side container
- [x] Implement Stape Custom Loader
- [ ] Create enhanced analytics utility with server support
- [ ] Set up consent management with server sync

### Phase 2: Server-Side Enhancement (Week 2)
- [ ] Configure GA4 server client with 2-year cookies
- [ ] Implement Meta Conversions API with deduplication
- [ ] Add User ID power-up integration
- [ ] Set up GEO headers enrichment
- [ ] Configure healthcare data sanitization

### Phase 3: User Actions & Conversions (Week 3)
- [ ] Implement dual tracking (client + server)
- [ ] Add search tracking with geo enrichment
- [ ] Set up form submissions with server validation
- [ ] Configure professional verification events
- [ ] Implement value optimization server-side

### Phase 4: Advanced Features (Week 4)
- [ ] Set up advanced audience segmentation
- [ ] Configure cross-device tracking
- [ ] Implement predictive analytics
- [ ] Add server-side A/B testing
- [ ] Set up real-time monitoring

## Testing & Validation

### Testing Tools
1. **GTM Preview Mode** - Test tag firing
2. **GA4 DebugView** - Verify event parameters
3. **Meta Pixel Helper** - Validate Meta events
4. **Browser Console** - Check dataLayer
5. **Charles/Fiddler** - Network inspection

### Testing Checklist
- [ ] All page types fire base events
- [ ] User journey events track correctly
- [ ] Form submissions capture data
- [ ] Meta events pass validation
- [ ] Consent mode blocks when needed
- [ ] No health data in parameters
- [ ] Server-side events deduplicate

## Performance Optimization

### Best Practices
1. **Batch Events**: Group related events in single dataLayer push
2. **Debounce Scroll**: Limit scroll tracking frequency
3. **Lazy Load**: Non-critical tags load after interaction
4. **Cache User Data**: Store user properties locally
5. **Minimize DOM Queries**: Use data attributes efficiently

### Container Management
- Regular tag audits (monthly)
- Remove unused tags and triggers
- Consolidate similar events
- Use lookup tables for mappings
- Archive old container versions

## Success Metrics

### Key Performance Indicators
1. **Engagement Metrics**
   - Pages per session by user type
   - Article completion rate
   - Chat adoption rate
   - Search usage patterns

2. **Conversion Metrics**
   - Registration conversion rate
   - Newsletter signup rate
   - Professional verification completion
   - Lead quality score

3. **Technical Metrics**
   - Tag load time
   - Data collection rate
   - Error rate
   - Consent acceptance rate

### Reporting Dashboards
1. **Executive Dashboard** - High-level KPIs
2. **Content Performance** - Article engagement
3. **User Journey** - Funnel analysis
4. **Technical Health** - Tag performance
5. **Privacy Compliance** - Consent metrics

## Troubleshooting Guide

### Common Issues

1. **Events Not Firing**
   - Check consent status
   - Verify trigger conditions
   - Look for JavaScript errors
   - Validate dataLayer structure

2. **Missing Parameters**
   - Ensure variables populate before event
   - Check timing of dataLayer push
   - Verify data attribute presence

3. **Duplicate Events**
   - Check for multiple tag instances
   - Verify trigger conditions
   - Implement deduplication

4. **Performance Issues**
   - Reduce DOM observers
   - Optimize custom JavaScript
   - Use tag sequencing
   - Enable tag pausing

## Future Enhancements

### Planned Features
1. **Enhanced E-commerce** - Subscription tracking
2. **Offline Tracking** - Service worker events
3. **Cross-Domain** - Multi-property tracking
4. **Advanced Attribution** - Multi-touch modeling
5. **Predictive Analytics** - ML-based insights

### Integration Roadmap
- Q1 2025: Core implementation
- Q2 2025: Advanced features
- Q3 2025: Mobile app tracking
- Q4 2025: Full attribution model

## Appendix

### Resources
- [GA4 Documentation](https://developers.google.com/analytics)
- [GTM Templates Gallery](https://tagmanager.google.com/gallery/)
- [Meta Pixel Guide](https://developers.facebook.com/docs/meta-pixel)
- [Healthcare Compliance](https://www.facebook.com/business/help/1634705130161165)

### Contact
For implementation support or questions, contact the development team.

---

*Last Updated: January 2025*
*Version: 1.0*