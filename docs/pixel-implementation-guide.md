# Comprehensive Pixel Implementation Guide for Dentistry Explained

## Overview
This guide provides specific implementation details for pixel tracking, including what should be configured in GTM vs code, Meta standard events mapping, and exact implementation steps.

## 1. GTM Configuration vs Code Implementation

### Configure in GTM (Tag Manager)
These events can be captured using GTM's built-in triggers and variables without code changes:

#### Basic Tracking
- **Page Views** (GA4 + Meta PageView)
  - Trigger: All Pages
  - Already implemented via default configuration

#### Content Engagement
- **Scroll Tracking** (GA4 + Custom Events)
  - Trigger: Scroll Depth (25%, 50%, 75%, 90%)
  - Variables: Page URL, Page Title

- **Article Views** (Meta ViewContent)
  - Trigger: Page View on `/*/[article-slug]`
  - Variables: Article Title, Category, Author

- **External Link Clicks**
  - Trigger: Click - Just Links
  - Filter: Click URL starts with "http" and doesn't contain your domain

- **File Downloads** (PDFs, consent forms)
  - Trigger: Click - Just Links
  - Filter: Click URL contains ".pdf"

#### Search Tracking
- **Site Search** (Meta Search + GA4)
  - Trigger: Element Visibility on `.search-results`
  - Variables: Search Term from URL parameter or data attribute

#### Form Tracking
- **Newsletter Signup** (Meta Lead)
  - Trigger: Form Submit on newsletter form
  - Variables: Form ID, Preferences

- **Contact Form** (Meta Contact)
  - Trigger: Form Submit Success
  - Variables: Inquiry Category

### Implement in Code
These events require server-side data or complex logic:

#### Authentication Events
```javascript
// After successful Clerk authentication
window.dataLayer = window.dataLayer || [];
window.dataLayer.push({
  event: 'complete_registration',
  user_type: 'patient', // or 'professional'
  user_id: user.id, // hashed
  registration_method: 'email' // or 'google'
});

// Meta Pixel
fbq('track', 'CompleteRegistration', {
  content_name: 'Patient Account',
  status: true,
  value: 10.00,
  currency: 'GBP'
});
```

#### Professional Verification
```javascript
// After verification submission
window.dataLayer.push({
  event: 'professional_verification_submit',
  verification_type: 'gdc_number',
  attempt_number: attemptCount
});

// Meta Pixel
fbq('track', 'SubmitApplication', {
  content_name: 'Professional Verification',
  content_type: 'gdc_verification'
});
```

#### AI Chat Events
```javascript
// Chat session start
window.dataLayer.push({
  event: 'chat_session_start',
  session_id: sessionId,
  user_type: userType,
  entry_page: currentPage
});

// Meta Pixel
fbq('track', 'Contact', {
  content_name: 'AI Chat Assistant',
  content_category: 'support'
});
```

## 2. Meta Standard Events Mapping

### High Priority Events

#### ViewContent (Article Reading)
**When**: User views an article for >3 seconds
**GTM Trigger**: Timer trigger after page load
**Parameters**:
```javascript
{
  content_name: '{{Article Title}}',
  content_category: '{{Article Category}}',
  content_type: 'article',
  content_ids: ['{{Article ID}}'],
  value: 0.50,
  currency: 'GBP'
}
```

#### Search
**When**: User performs site search
**GTM Trigger**: Element visibility on search results
**Parameters**:
```javascript
{
  search_string: '{{Search Query}}',
  content_category: 'all',
  value: 0.25,
  currency: 'GBP'
}
```

#### Lead (Newsletter/Professional Interest)
**When**: Newsletter signup or professional inquiry
**GTM Trigger**: Form submission success
**Parameters**:
```javascript
{
  content_name: 'Newsletter Signup',
  content_category: 'email_marketing',
  value: 5.00,
  currency: 'GBP'
}
```

### Medium Priority Events

#### Contact (Chat/Support)
**When**: User initiates chat or submits contact form
**Implementation**: Code-based for chat, GTM for forms
**Parameters**:
```javascript
{
  content_name: 'AI Chat Support',
  content_category: 'customer_service'
}
```

#### SubmitApplication
**When**: Professional verification submission
**Implementation**: Code-based (needs backend data)
**Parameters**:
```javascript
{
  content_name: 'GDC Verification',
  value: 50.00,
  currency: 'GBP'
}
```

#### FindLocation
**When**: User searches for dentist
**GTM Trigger**: Click on "Find Dentist" or search submission
**Parameters**:
```javascript
{
  search_string: '{{Location Search}}',
  content_type: 'dental_practice'
}
```

## 3. GTM Container Setup

### Data Layer Variables to Create

1. **User Variables**
   - `dlv_user_type`: patient/professional/guest
   - `dlv_user_id`: hashed user ID
   - `dlv_user_verified`: boolean for professionals

2. **Content Variables**
   - `dlv_content_title`: Article/page title
   - `dlv_content_category`: Category slug
   - `dlv_content_author`: Article author
   - `dlv_content_id`: Unique content ID

3. **Interaction Variables**
   - `dlv_search_query`: Search term
   - `dlv_search_results_count`: Number of results
   - `dlv_form_type`: Form identifier
   - `dlv_download_type`: PDF/resource type

### Tags to Create

1. **GA4 Configuration Tag**
   - Tag Type: Google Analytics: GA4 Configuration
   - Measurement ID: G-PC5CJTZ95B
   - Fields to Set:
     - user_id: {{dlv_user_id}}
     - user_type: {{dlv_user_type}}

2. **Meta Pixel Base Code**
   - Tag Type: Custom HTML
   - HTML:
   ```html
   <script>
   !function(f,b,e,v,n,t,s)
   {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
   n.callMethod.apply(n,arguments):n.queue.push(arguments)};
   if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
   n.queue=[];t=b.createElement(e);t.async=!0;
   t.src=v;s=b.getElementsByTagName(e)[0];
   s.parentNode.insertBefore(t,s)}(window, document,'script',
   'https://connect.facebook.net/en_US/fbevents.js');
   fbq('init', 'YOUR_PIXEL_ID');
   fbq('track', 'PageView');
   </script>
   ```
   - Trigger: All Pages

3. **Meta ViewContent Tag**
   - Tag Type: Custom HTML
   - Trigger: Article pages only
   - HTML:
   ```html
   <script>
   fbq('track', 'ViewContent', {
     content_name: '{{dlv_content_title}}',
     content_category: '{{dlv_content_category}}',
     content_type: 'article',
     value: 0.50,
     currency: 'GBP'
   });
   </script>
   ```

### Triggers to Create

1. **Article Page View**
   - Type: Page View
   - Conditions: Page Path matches RegEx `^/[^/]+/[^/]+$`

2. **Search Results Visible**
   - Type: Element Visibility
   - Selection: CSS Selector `.search-results`
   - When: Once per page

3. **Newsletter Form Submit**
   - Type: Form Submission
   - Conditions: Form ID equals "newsletter-form"

4. **Scroll Milestones**
   - Type: Scroll Depth
   - Percentages: 25, 50, 75, 90
   - Enable: Vertical Scroll Depths

## 4. Privacy-Compliant Implementation

### Cookie Consent Integration
```javascript
// Check consent before firing pixels
if (window.consentManager && window.consentManager.hasConsent('marketing')) {
  // Fire Meta Pixel events
  fbq('track', 'ViewContent', {...});
}
```

### Data Minimization for Healthcare
```javascript
// Sanitize event names for healthcare compliance
function sanitizeHealthEvent(eventName) {
  const healthTerms = ['dental', 'tooth', 'gum', 'oral', 'cavity'];
  let sanitized = eventName.toLowerCase();
  healthTerms.forEach(term => {
    sanitized = sanitized.replace(term, 'content');
  });
  return sanitized;
}
```

## 5. Testing Checklist

### GTM Testing
1. [ ] Enable GTM Preview Mode
2. [ ] Test all page types for correct triggers
3. [ ] Verify data layer variables populate correctly
4. [ ] Check tag firing sequence
5. [ ] Test form submissions and interactions

### Meta Pixel Testing
1. [ ] Install Meta Pixel Helper Chrome extension
2. [ ] Verify PageView fires on all pages
3. [ ] Test ViewContent on articles
4. [ ] Verify Search events capture query
5. [ ] Test Lead events on forms
6. [ ] Check Events Manager for data flow

### GA4 Testing
1. [ ] Use GA4 DebugView
2. [ ] Verify user properties set correctly
3. [ ] Test custom events and parameters
4. [ ] Check real-time reports
5. [ ] Validate conversions tracking

## 6. Implementation Timeline

### Week 1: Foundation
- [ ] Set up Meta Pixel base code in GTM
- [ ] Create all data layer variables
- [ ] Implement PageView and ViewContent
- [ ] Set up scroll tracking

### Week 2: User Actions
- [ ] Implement search tracking
- [ ] Add form submission tracking
- [ ] Set up download tracking
- [ ] Configure chat event tracking

### Week 3: Conversions
- [ ] Add CompleteRegistration events
- [ ] Implement Lead tracking
- [ ] Set up professional verification events
- [ ] Configure value tracking

### Week 4: Optimization
- [ ] Implement Conversions API
- [ ] Set up custom audiences
- [ ] Configure remarketing
- [ ] Add advanced segments

## 7. Monitoring & Optimization

### Daily Checks
- Tag firing rates in GTM
- Meta Pixel event volume
- GA4 real-time data

### Weekly Reviews
- Conversion rates by source
- Event parameter accuracy
- Data quality issues

### Monthly Analysis
- ROI by pixel/campaign
- Audience performance
- Attribution modeling

## 8. Troubleshooting Common Issues

### Meta Pixel Not Firing
1. Check browser ad blockers
2. Verify consent granted
3. Check for JavaScript errors
4. Validate pixel ID

### Missing Event Parameters
1. Ensure data layer populated before tag fires
2. Check variable naming in GTM
3. Verify trigger timing

### Data Discrepancies
1. Check for duplicate tags
2. Verify deduplication setup
3. Review sampling in GA4
4. Check time zone settings