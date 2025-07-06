# Dentistry Explained - Pixel Tracking Opportunities Analysis

## Current GTM Implementation

**Location**: `/dentistry-explained/app/layout.tsx` and `/dentistry-explained/components/analytics/google-tag-manager.tsx`

- GTM ID: `GTM-MVDNCWGV`
- GA4 ID: `G-PC5CJTZ95B`
- Basic GTM and GA4 scripts are loaded, but no custom events are being tracked

## Key Tracking Opportunities

### 1. Search & Discovery Events

#### Search Dialog (`/components/search/search-dialog.tsx`)
```javascript
// Line 134-152: Track search result clicks
const handleResultClick = async (result: SearchResult) => {
  // PIXEL OPPORTUNITY: Track search result click
  window.dataLayer?.push({
    event: 'search_result_click',
    search_query: query,
    result_title: result.title,
    result_type: result.type,
    result_category: result.category,
    result_position: results.findIndex(r => r.id === result.id) + 1
  });
  
  // Existing tracking code...
}

// Line 23-31: Track search initiated
const performSearch = useDebouncedCallback(async (searchQuery: string) => {
  // PIXEL OPPORTUNITY: Track search initiated
  window.dataLayer?.push({
    event: 'search_initiated',
    search_query: searchQuery,
    search_location: 'header_search'
  });
  // Rest of function...
})

// Line 154-157: Track suggestion clicks
const handleSuggestionClick = (suggestion: string) => {
  // PIXEL OPPORTUNITY: Track suggestion click
  window.dataLayer?.push({
    event: 'search_suggestion_click',
    suggestion_text: suggestion,
    original_query: query
  });
}

// Line 191-192: Track trending search clicks
onClick={() => {
  // PIXEL OPPORTUNITY: Track trending search click
  window.dataLayer?.push({
    event: 'trending_search_click',
    trending_query: item.query,
    search_count: item.search_count
  });
  setQuery(item.query)
}}
```

### 2. AI Chat Events

#### Chat Panel (`/components/chat/chat-panel.tsx`)
```javascript
// Line 98-102: Track message sent
const handleSendMessage = () => {
  if (!input.trim() || isLoading) return
  // PIXEL OPPORTUNITY: Track chat message sent
  window.dataLayer?.push({
    event: 'ai_chat_message_sent',
    message_length: input.length,
    session_id: sessionId,
    has_page_context: !!pageContext
  });
  sendMessage(input)
  setInput("")
}

// Line 168-174: Track chat export
onClick={exportChat}
// PIXEL OPPORTUNITY: Add tracking
window.dataLayer?.push({
  event: 'chat_exported',
  message_count: messages.length,
  session_id: sessionId
});

// Line 88-91: Track chat cleared
if (messages.length > 0 && window.confirm('Clear chat history?')) {
  // PIXEL OPPORTUNITY: Track chat cleared
  window.dataLayer?.push({
    event: 'chat_cleared',
    message_count: messages.length
  });
  clearMessages()
}

// Line 111-117: Track suggested question usage
const handleSuggestedQuestion = (question: string) => {
  // PIXEL OPPORTUNITY: Track suggested question click
  window.dataLayer?.push({
    event: 'suggested_question_click',
    question_text: question,
    page_context: pageContext?.title
  });
  setInput(question)
}
```

### 3. Article Engagement Events

#### Bookmark Button (`/components/article/bookmark-button.tsx`)
```javascript
// Line 42-52: Track bookmark toggle
const handleClick = async (e: React.MouseEvent) => {
  e.preventDefault()
  e.stopPropagation()

  if (!user) {
    // PIXEL OPPORTUNITY: Track bookmark attempt without login
    window.dataLayer?.push({
      event: 'bookmark_attempt_no_auth',
      article_slug: article.slug,
      article_title: article.title
    });
    router.push(`/sign-in?redirect_url=${window.location.pathname}`)
    return
  }

  // PIXEL OPPORTUNITY: Track bookmark toggle
  window.dataLayer?.push({
    event: bookmarked ? 'bookmark_removed' : 'bookmark_added',
    article_slug: article.slug,
    article_title: article.title,
    article_category: article.category
  });

  await toggleBookmark(article)
}
```

### 4. Emergency Page Events

#### Symptom Checker (`/components/emergency/symptom-checker.tsx`)
```javascript
// Line 168-184: Track symptom checker progression
const handleNext = () => {
  if (!selectedValue) return
  
  const selectedOption = question.options.find(opt => opt.value === selectedValue)
  if (!selectedOption) return

  // PIXEL OPPORTUNITY: Track symptom checker step
  window.dataLayer?.push({
    event: 'symptom_checker_step',
    question_id: currentQuestion,
    selected_answer: selectedValue,
    step_number: Object.keys(answers).length + 1
  });

  // Store answer
  setAnswers(prev => ({ ...prev, [currentQuestion]: selectedValue }))

  // Check if we have a severity result
  if (selectedOption.severity) {
    // PIXEL OPPORTUNITY: Track symptom checker result
    window.dataLayer?.push({
      event: 'symptom_checker_result',
      severity_level: selectedOption.severity,
      total_steps: Object.keys(answers).length + 1,
      symptom_path: Object.entries(answers).map(([q, a]) => `${q}:${a}`).join('>')
    });
    setSeverity(selectedOption.severity)
  }
}

// Line 210-224: Track emergency action clicks
onClick={() => {
  // PIXEL OPPORTUNITY: Track emergency action
  window.dataLayer?.push({
    event: 'emergency_action_click',
    action_label: action.label,
    action_type: action.urgent ? 'urgent' : 'routine',
    severity_level: severity,
    action_href: action.href
  });
}}
```

### 5. Professional Verification Events

#### Professional Verify Page (`/app/professional/verify/page.tsx`)
```javascript
// Line 97-138: Track verification submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  
  // PIXEL OPPORTUNITY: Track verification attempt
  window.dataLayer?.push({
    event: 'professional_verification_submitted',
    has_gdc_number: !!formData.gdc_number,
    practice_type: formData.practice_type,
    document_count: documents.length
  });

  // ... rest of submission logic

  if (response.ok) {
    // PIXEL OPPORTUNITY: Track verification success
    window.dataLayer?.push({
      event: 'professional_verification_success',
      verification_id: data.verification.id
    });
  } else {
    // PIXEL OPPORTUNITY: Track verification error
    window.dataLayer?.push({
      event: 'professional_verification_error',
      error_message: error.message
    });
  }
}

// Line 140-185: Track document upload
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0]
  if (!file) return

  // PIXEL OPPORTUNITY: Track document upload attempt
  window.dataLayer?.push({
    event: 'verification_document_upload',
    document_type: selectedDocumentType,
    file_size: file.size,
    file_type: file.type
  });

  // ... upload logic
}
```

### 6. Form Submissions

#### Contact Form (`/app/contact/page.tsx`)
```javascript
// Line 25-41: Track contact form submission
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setIsSubmitting(true)

  // PIXEL OPPORTUNITY: Track contact form submission
  window.dataLayer?.push({
    event: 'contact_form_submitted',
    contact_category: formData.category,
    has_subject: !!formData.subject,
    message_length: formData.message.length
  });

  // ... rest of submission
}
```

#### Newsletter Widget (`/components/widgets/newsletter-widget.tsx`)
```javascript
// Line 23-32: Track newsletter signup
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (!email) return

  // PIXEL OPPORTUNITY: Track newsletter signup
  window.dataLayer?.push({
    event: 'newsletter_signup',
    signup_location: 'widget',
    preferences: {
      weekly_tips: preferences.weeklyTips,
      new_articles: preferences.newArticles,
      professional_updates: preferences.professionalUpdates
    }
  });

  setIsLoading(true)
  // ... rest of submission
}
```

### 7. User Onboarding Events

#### Onboarding Page (`/app/onboarding/page.tsx`)
```javascript
// Line 77-84: Track onboarding step progression
const handleNext = () => {
  // PIXEL OPPORTUNITY: Track onboarding step
  window.dataLayer?.push({
    event: 'onboarding_step_completed',
    step_number: currentStep,
    total_steps: totalSteps,
    user_type: userType
  });

  if (currentStep < totalSteps) {
    setCurrentStep(currentStep + 1)
  } else {
    handleComplete()
  }
}

// Line 85-120: Track onboarding completion
const handleComplete = async () => {
  // PIXEL OPPORTUNITY: Track onboarding completion
  window.dataLayer?.push({
    event: 'onboarding_completed',
    user_type: userType,
    interests_count: formData.interests.length,
    has_location: !!formData.location,
    notifications_enabled: formData.notifications.email,
    ...(userType === 'professional' && {
      has_gdc_number: !!formData.gdcNumber,
      practice_type: formData.practiceType,
      specializations_count: formData.specializations.length
    })
  });

  // ... rest of completion logic
}
```

### 8. Content Interactions

#### Glossary Enhanced (`/components/glossary/glossary-enhanced.tsx`)
```javascript
// Track glossary term views, searches, and interactions
// Already has some tracking via /api/glossary/track endpoint
// Add GTM events for:
- Glossary term click
- Glossary search
- Glossary quiz start/complete
- AI definition generation
```

### 9. Navigation & Page Views

#### Enhanced Page View Tracking
```javascript
// Add to layout or use a custom hook
useEffect(() => {
  window.dataLayer?.push({
    event: 'enhanced_page_view',
    page_category: pageCategory, // e.g., 'article', 'professional', 'emergency'
    user_type: user?.unsafeMetadata?.userType || 'visitor',
    is_authenticated: !!user,
    content_title: pageTitle
  });
}, [pathname]);
```

### 10. E-commerce/Monetization Events (Future)

#### Professional Resources Download
```javascript
// Track resource downloads
window.dataLayer?.push({
  event: 'resource_download',
  resource_type: 'consent_form' | 'patient_education',
  resource_name: resourceName,
  is_premium: isPremiumResource
});
```

## Implementation Recommendations

1. **Create a centralized tracking utility**: `/lib/analytics.ts`
```typescript
export const trackEvent = (eventName: string, parameters: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.dataLayer) {
    window.dataLayer.push({
      event: eventName,
      ...parameters
    });
  }
};
```

2. **Add User Properties**:
```typescript
// Set user properties when user logs in
window.dataLayer?.push({
  user_id: user.id,
  user_type: user.unsafeMetadata?.userType,
  professional_verified: user.unsafeMetadata?.verificationStatus === 'verified'
});
```

3. **Track Core Web Vitals**:
- Integrate with existing SpeedInsights component
- Track CLS, FID, LCP events

4. **Track Errors**:
```typescript
// Global error tracking
window.addEventListener('error', (e) => {
  window.dataLayer?.push({
    event: 'javascript_error',
    error_message: e.message,
    error_source: e.filename,
    error_line: e.lineno
  });
});
```

## Priority Implementation Order

1. **High Priority** (Immediate user value insights):
   - Search events
   - AI chat interactions
   - Emergency symptom checker
   - Professional verification flow

2. **Medium Priority** (Engagement metrics):
   - Article bookmarks
   - Newsletter signups
   - Onboarding completion
   - Contact form submissions

3. **Low Priority** (Nice to have):
   - Glossary interactions
   - Enhanced page views
   - Scroll depth tracking
   - Time on page

## Testing Recommendations

1. Use Google Tag Manager Preview mode
2. Install Google Analytics Debugger Chrome extension
3. Create a test property in GA4 for development
4. Document all custom events in a tracking plan
5. Set up automated tests for critical conversion events