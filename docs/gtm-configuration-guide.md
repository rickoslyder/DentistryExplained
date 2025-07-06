# GTM Configuration Guide for Dentistry Explained

## What to Configure in GTM UI vs Code

### Configure in GTM UI (No Code Changes Needed)

#### 1. Basic Page Tracking
**Already Working - Just Verify:**
- GA4 Page Views (automatic with GA4 Config tag)
- Meta PageView (add to GTM)

**GTM Configuration:**
```
Tag: Meta Pixel - PageView
Type: Custom HTML
Trigger: All Pages
HTML: <script>fbq('track', 'PageView');</script>
```

#### 2. Scroll Depth Tracking
**GTM Configuration:**
```
Trigger Name: Scroll Milestones
Type: Scroll Depth
Vertical Scroll Depths: 25, 50, 75, 90
Trigger on: All Pages

Tag: GA4 - Scroll Tracking
Event Name: scroll
Parameters:
  percent_scrolled: {{Scroll Depth Threshold}}
```

#### 3. Outbound Link Clicks
**GTM Configuration:**
```
Trigger: Outbound Links
Type: Click - Just Links
Enable when: Page URL matches RegEx .*
Trigger when: Click URL does not contain dentistry-explained.vercel.app

Tag: GA4 - Outbound Link
Event Name: click
Parameters:
  link_domain: {{Click URL Hostname}}
  link_url: {{Click URL}}
  outbound: true
```

#### 4. File Downloads (PDFs, Consent Forms)
**GTM Configuration:**
```
Trigger: PDF Downloads
Type: Click - Just Links
Enable when: Page URL matches RegEx .*
Trigger when: Click URL matches RegEx \.(pdf|doc|docx)$

Tag: GA4 - File Download
Event Name: file_download
Parameters:
  file_name: {{Click Text}}
  file_extension: pdf
  link_url: {{Click URL}}
```

#### 5. YouTube Video Engagement
**GTM Configuration:**
```
Built-in Variable: Enable all Video variables
Trigger: YouTube Video
Type: YouTube Video
Enable on: All YouTube Videos
Progress: Start, 25%, 50%, 75%, Complete

Tag: GA4 - Video Engagement
Event Name: video_{{Video Status}}
Parameters:
  video_title: {{Video Title}}
  video_percent: {{Video Percent}}
```

#### 6. Form Submissions (Generic)
**GTM Configuration:**
```
Trigger: Form Submit Success
Type: Form Submission
Check Validation: Yes
Enable when: Page URL matches RegEx .*

Tag: GA4 - Form Submit
Event Name: form_submit
Parameters:
  form_id: {{Form ID}}
  form_classes: {{Form Classes}}
```

#### 7. Site Search Tracking
**GTM Configuration:**
```
Trigger: Search Results Loaded
Type: Element Visibility
Selection Method: CSS Selector
Element Selector: [data-search-results]

Variable: Search Query
Type: Data Layer Variable
Name: search_query

Tag: GA4 - Site Search
Event Name: search
Parameters:
  search_term: {{Search Query}}
```

### Implement in Code (Push to dataLayer)

#### 1. User Authentication Events
```javascript
// In your auth callback/component
window.dataLayer.push({
  event: 'login',
  method: 'email', // or 'google'
  user_type: 'patient' // or 'professional'
});

window.dataLayer.push({
  event: 'sign_up',
  method: 'email',
  user_type: 'patient'
});
```

#### 2. Enhanced Article Tracking
```javascript
// In article page component
window.dataLayer.push({
  event: 'article_view',
  article_title: 'Understanding Tooth Decay',
  article_category: 'dental-problems',
  article_id: 'article_123',
  author: 'Dr. Smith',
  word_count: 1500,
  reading_time: 5
});
```

#### 3. AI Chat Events
```javascript
// In chat component
window.dataLayer.push({
  event: 'chat_start',
  session_id: 'abc123',
  entry_page: '/dental-problems/tooth-decay'
});

window.dataLayer.push({
  event: 'chat_message',
  session_id: 'abc123',
  message_count: 3,
  is_ai_response: false
});
```

#### 4. Professional Features
```javascript
// Professional verification
window.dataLayer.push({
  event: 'professional_verification_submit',
  verification_type: 'gdc_number',
  document_uploaded: true
});

// Consent form generation
window.dataLayer.push({
  event: 'consent_form_created',
  template_type: 'extraction',
  customized: true
});
```

#### 5. E-commerce/Conversion Events
```javascript
// Future implementation
window.dataLayer.push({
  event: 'begin_checkout',
  currency: 'GBP',
  value: 29.99,
  items: [{
    item_name: 'Professional Monthly',
    item_category: 'subscription',
    price: 29.99,
    quantity: 1
  }]
});
```

## GTM Container Setup Steps

### 1. Create Container Structure
```
📁 Tags
  ├── 📁 Analytics
  │   ├── GA4 Configuration
  │   ├── GA4 Events
  │   └── GA4 Conversions
  ├── 📁 Meta
  │   ├── Meta Pixel Base
  │   ├── Meta Standard Events
  │   └── Meta Custom Events
  └── 📁 Other
      └── Hotjar/Clarity

📁 Triggers
  ├── 📁 Page Views
  │   ├── All Pages
  │   ├── Article Pages
  │   └── Category Pages
  ├── 📁 Clicks
  │   ├── Outbound Links
  │   ├── Downloads
  │   └── CTA Buttons
  └── 📁 Engagement
      ├── Scroll Depth
      ├── Time on Page
      └── Video Progress

📁 Variables
  ├── 📁 User
  │   ├── User Type
  │   └── User ID (hashed)
  ├── 📁 Content
  │   ├── Article Title
  │   ├── Article Category
  │   └── Page Type
  └── 📁 Custom
      ├── Consent Status
      └── Environment
```

### 2. Essential Variables to Create

#### Data Layer Variables
```
Name: dlv - Article Title
Type: Data Layer Variable
Variable Name: article_title

Name: dlv - User Type  
Type: Data Layer Variable
Variable Name: user_type

Name: dlv - Search Query
Type: Data Layer Variable
Variable Name: search_query
```

#### Custom JavaScript Variables
```javascript
// Variable: Page Category
function() {
  var path = {{Page Path}};
  var parts = path.split('/');
  return parts[1] || 'home';
}

// Variable: Is Article Page
function() {
  var path = {{Page Path}};
  return /^\/[^\/]+\/[^\/]+$/.test(path);
}

// Variable: Consent Status
function() {
  if (window.consentManager) {
    return window.consentManager.hasConsent('marketing') ? 'granted' : 'denied';
  }
  return 'not_set';
}
```

### 3. Meta Pixel Configuration in GTM

#### Base Pixel (All Pages)
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

// Only initialize if consent granted
if ({{Consent Status}} === 'granted') {
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
}
</script>
```

#### ViewContent (Article Pages)
```html
<script>
if (window.fbq && {{Consent Status}} === 'granted') {
  fbq('track', 'ViewContent', {
    content_name: {{dlv - Article Title}},
    content_category: {{Page Category}},
    content_type: 'article',
    value: 0.50,
    currency: 'GBP'
  });
}
</script>
```

### 4. Testing in GTM

1. **Preview Mode Testing Checklist:**
   - [ ] All pages trigger base tags
   - [ ] Article pages fire ViewContent
   - [ ] Forms trigger on submission
   - [ ] Scroll tracking works
   - [ ] Search pushes to dataLayer

2. **Debug Using:**
   - GTM Preview Mode
   - Browser Console: `dataLayer`
   - GA4 DebugView
   - Meta Pixel Helper

### 5. Advanced GTM Features to Use

#### Trigger Groups
Group related triggers for cleaner organization and sequential firing.

#### Tag Sequencing
Ensure Meta Pixel base fires before event tags.

#### Custom Templates
Create reusable templates for common tracking patterns.

#### Folder Organization
Use folders to organize tags, triggers, and variables by feature.

## Performance Considerations

### GTM Best Practices:
1. **Minimize Custom HTML Tags** - Use built-in tags when possible
2. **Async Loading** - All tags should load asynchronously
3. **Tag Firing Priority** - Set critical tags to high priority
4. **Use Tag Sequencing** - Ensure proper order for dependent tags
5. **Limit DOM Observers** - Minimize element visibility triggers

### Container Size Management:
- Regular audits to remove unused tags
- Consolidate similar tags where possible
- Use lookup tables instead of multiple tags
- Archive old versions regularly

## Consent Mode Configuration

```javascript
// In GTM, create Consent Mode tags
Tag: Update Consent - Marketing
Tag Type: Consent Mode
Consent Command: Update
Analytics Storage: {{Consent Status}}
Ad Storage: {{Consent Status}}
Ad User Data: {{Consent Status}}
Ad Personalization: {{Consent Status}}
```

This ensures all tags respect user consent preferences.