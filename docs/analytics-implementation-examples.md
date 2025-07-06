# Analytics Implementation Examples

This guide shows how to implement the enhanced analytics with server-side tracking in key components of Dentistry Explained.

## 1. Article Page Tracking

### File: `app/[category]/[slug]/page.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export default function ArticlePage({ article }: { article: Article }) {
  useEffect(() => {
    // Track article view with server enrichment
    analytics.trackArticleView({
      id: article.id,
      title: article.title,
      category: article.category,
      author: article.author?.name,
      readingLevel: article.readingLevel
    });
    
    // Track scroll depth
    const handleScroll = () => {
      const scrollPercentage = 
        (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
      
      // Track milestones
      if (scrollPercentage >= 90 && !tracked90) {
        analytics.track('article_read_complete', {
          article_id: article.id,
          time_spent: Date.now() - startTime,
          scroll_percentage: 90
        });
        setTracked90(true);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [article]);
  
  return <ArticleContent article={article} />;
}
```

## 2. Search Implementation

### File: `components/search/search-dialog.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export function SearchDialog() {
  const handleSearch = async (query: string) => {
    const results = await searchArticles(query);
    
    // Track search with geo enrichment from server
    analytics.trackSearch(
      query,
      results.length,
      'site' // or 'web' for external search
    );
  };
  
  const handleResultClick = (result: SearchResult, position: number) => {
    // Track search result interaction
    analytics.track('search_result_click', {
      search_query: currentQuery,
      result_title: result.title,
      result_position: position,
      result_type: result.type
    });
    
    router.push(result.url);
  };
  
  return (
    <Dialog>
      <SearchInput onSearch={handleSearch} />
      <SearchResults onResultClick={handleResultClick} />
    </Dialog>
  );
}
```

## 3. User Registration

### File: `app/sign-up/[[...sign-up]]/page.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';
import { useSignUp } from '@clerk/nextjs';

export function SignUpForm() {
  const { signUp } = useSignUp();
  
  const handleSignUp = async (formData: SignUpData) => {
    try {
      const result = await signUp.create({
        emailAddress: formData.email,
        password: formData.password,
      });
      
      if (result.status === 'complete') {
        // Set user context for all future events
        analytics.setUser({
          id: result.createdUserId,
          type: formData.userType as UserType,
          email: formData.email, // Will be hashed
          isVerified: false
        });
        
        // Track registration with server-side enrichment
        analytics.trackRegistration(
          formData.userType as UserType,
          'email'
        );
        
        // Navigate to onboarding
        router.push('/onboarding');
      }
    } catch (error) {
      analytics.trackError(error as Error, {
        context: 'sign_up',
        severity: 'medium'
      });
    }
  };
  
  return <SignUpFormComponent onSubmit={handleSignUp} />;
}
```

## 4. AI Chat Tracking

### File: `components/chat/chat-interface.tsx`

```typescript
import { analytics, CustomEvent } from '@/lib/analytics-enhanced';

export function ChatInterface() {
  const [sessionId] = useState(() => generateSessionId());
  const [messageCount, setMessageCount] = useState(0);
  
  const handleChatStart = () => {
    analytics.trackChatInteraction('start', sessionId, {
      entry_context: getCurrentArticle()?.title,
      user_logged_in: !!user
    });
  };
  
  const handleMessageSent = async (message: string) => {
    setMessageCount(prev => prev + 1);
    
    // Track message with context
    analytics.trackChatInteraction('message', sessionId, {
      message_number: messageCount + 1,
      message_length: message.length,
      has_medical_terms: containsMedicalTerms(message)
    });
    
    // Get AI response
    const response = await sendChatMessage(message);
    
    // Track AI response quality
    if (response.confidence > 0.8) {
      analytics.track('chat_high_quality_response', {
        session_id: sessionId,
        confidence: response.confidence
      });
    }
  };
  
  const handleExport = (format: 'pdf' | 'text') => {
    analytics.trackChatInteraction('export', sessionId, {
      export_format: format,
      message_count: messageCount,
      session_duration: Date.now() - sessionStartTime
    });
    
    exportChat(format);
  };
  
  return <ChatUI onStart={handleChatStart} onMessage={handleMessageSent} />;
}
```

## 5. Professional Verification

### File: `app/professional/verify/page.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export function ProfessionalVerification() {
  const handleVerificationSubmit = async (data: VerificationData) => {
    // Track submission (sanitized for healthcare compliance)
    analytics.trackProfessionalVerification(
      'submit',
      data.verificationType
    );
    
    try {
      const result = await submitVerification(data);
      
      if (result.success) {
        // Update user context
        analytics.setUser({
          ...currentUser,
          isVerified: true
        });
        
        // Track success
        analytics.trackProfessionalVerification(
          'success',
          data.verificationType
        );
        
        // Track conversion value
        analytics.track('high_value_conversion', {
          conversion_type: 'professional_verified',
          lifetime_value_estimate: 500
        });
      }
    } catch (error) {
      analytics.trackProfessionalVerification(
        'failure',
        data.verificationType
      );
    }
  };
  
  return <VerificationForm onSubmit={handleVerificationSubmit} />;
}
```

## 6. Emergency Guide Tracking

### File: `app/emergency/page.tsx`

```typescript
import { analytics, CustomEvent } from '@/lib/analytics-enhanced';

export function EmergencyGuide() {
  // Track page view without health details
  useEffect(() => {
    analytics.trackEmergencyGuide('view');
  }, []);
  
  const handleSymptomCheck = (symptom: string, severity: string) => {
    // Sanitized tracking - no specific symptoms sent
    analytics.trackEmergencyGuide('symptom_check', severity);
    
    // Store locally for user benefit
    localStorage.setItem('emergency_symptom', JSON.stringify({
      timestamp: Date.now(),
      severity
    }));
  };
  
  const handleEmergencyAction = (action: 'call_111' | 'find_dentist' | 'self_care') => {
    analytics.track(CustomEvent.EMERGENCY_GUIDE_VIEW, {
      emergency_action: action,
      time_to_action: Date.now() - pageLoadTime,
      has_location: !!userLocation
    });
    
    // Route to appropriate resource
    switch(action) {
      case 'call_111':
        window.location.href = 'tel:111';
        break;
      case 'find_dentist':
        router.push('/find-dentist?emergency=true');
        break;
    }
  };
  
  return <EmergencyGuideComponent onAction={handleEmergencyAction} />;
}
```

## 7. Form Submissions

### File: `components/forms/newsletter-form.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export function NewsletterForm() {
  const handleSubmit = async (data: NewsletterData) => {
    // Track form interaction
    analytics.track('form_start', {
      form_type: 'newsletter',
      form_location: 'footer'
    });
    
    try {
      await subscribeToNewsletter(data);
      
      // Track successful submission
      analytics.trackFormSubmission('newsletter', {
        topics_selected: data.topics,
        frequency: data.frequency
      });
      
      // Show success message
      toast.success('Successfully subscribed!');
    } catch (error) {
      analytics.trackError(error as Error, {
        context: 'newsletter_form',
        form_data: { topics: data.topics }
      });
    }
  };
  
  return <Form onSubmit={handleSubmit} />;
}
```

## 8. Consent Management Integration

### File: `components/consent/consent-manager.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export function ConsentManager() {
  const [consent, setConsent] = useState<ConsentState>({
    analytics: false,
    marketing: false
  });
  
  const handleConsentUpdate = (newConsent: ConsentState) => {
    // Update consent in window for immediate effect
    window.consentManager = {
      hasConsent: (type: string) => newConsent[type] || false
    };
    
    // Track consent change
    analytics.track('consent_updated', {
      analytics_consent: newConsent.analytics,
      marketing_consent: newConsent.marketing,
      consent_method: 'banner'
    });
    
    // Update GTM consent mode
    if (window.gtag) {
      window.gtag('consent', 'update', {
        analytics_storage: newConsent.analytics ? 'granted' : 'denied',
        ad_storage: newConsent.marketing ? 'granted' : 'denied',
        ad_user_data: newConsent.marketing ? 'granted' : 'denied',
        ad_personalization: newConsent.marketing ? 'granted' : 'denied'
      });
    }
    
    // Store consent
    localStorage.setItem('consent_preferences', JSON.stringify(newConsent));
    setConsent(newConsent);
  };
  
  return <ConsentBanner onUpdate={handleConsentUpdate} />;
}
```

## 9. Enhanced Error Tracking

### File: `app/error.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Track error with enhanced context
    analytics.trackError(error, {
      error_boundary: true,
      digest: error.digest,
      page_path: window.location.pathname,
      user_action: 'viewing_page',
      severity: 'high'
    });
  }, [error]);
  
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 10. Performance Monitoring

### File: `app/layout.tsx`

```typescript
import { analytics } from '@/lib/analytics-enhanced';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Track page timing after load
    if (window.performance && window.performance.timing) {
      const onLoad = () => {
        setTimeout(() => {
          analytics.trackPageTiming();
        }, 0);
      };
      
      if (document.readyState === 'complete') {
        onLoad();
      } else {
        window.addEventListener('load', onLoad);
      }
    }
    
    // Track Web Vitals
    if ('web-vital' in window) {
      const reportWebVital = ({ name, value }: any) => {
        analytics.track('web_vitals', {
          metric_name: name,
          metric_value: value,
          metric_rating: getRating(name, value)
        });
      };
      
      // Report CLS, FID, LCP, etc.
      window.addEventListener('web-vital', reportWebVital);
    }
  }, []);
  
  return children;
}
```

## Implementation Best Practices

### 1. Always Set User Context Early
```typescript
// In your auth callback or user load
analytics.setUser({
  id: user.id,
  type: user.role,
  email: user.email,
  isVerified: user.verified
});
```

### 2. Use Constants for Event Names
```typescript
const EVENTS = {
  ARTICLE_VIEW: 'article_view',
  SEARCH: 'search',
  BOOKMARK_ADD: 'bookmark_add'
} as const;

analytics.track(EVENTS.ARTICLE_VIEW, data);
```

### 3. Batch Related Events
```typescript
// Good - single dataLayer push
analytics.track('form_complete', {
  form_type: 'contact',
  fields_filled: 5,
  time_to_complete: 120
});

// Avoid - multiple pushes
analytics.track('form_field_filled', { field: 'email' });
analytics.track('form_field_filled', { field: 'name' });
```

### 4. Handle Errors Gracefully
```typescript
try {
  await riskyOperation();
  analytics.track('operation_success', data);
} catch (error) {
  analytics.trackError(error as Error, {
    context: 'operation_name',
    recovery_action: 'retry'
  });
}
```

### 5. Test Server Enrichment
```typescript
// In development, log enriched data
if (process.env.NODE_ENV === 'development') {
  window.addEventListener('dataLayer.push', (e: any) => {
    console.log('Analytics Event:', e.detail);
  });
}
```

## Testing Your Implementation

1. **Use GTM Preview Mode** to see events in real-time
2. **Check Network Tab** for requests to your server endpoint
3. **Verify Stape Headers** in server container debug
4. **Test Consent Flows** with different scenarios
5. **Monitor Performance** impact of tracking

## Common Pitfalls to Avoid

1. **Don't Track PII** - Always hash sensitive data
2. **Avoid Over-Tracking** - Focus on meaningful events
3. **Test Consent** - Ensure tracking respects user choice
4. **Monitor Costs** - Server-side tracking has infrastructure costs
5. **Document Events** - Maintain an event dictionary

This implementation leverages server-side tracking for better data quality while maintaining privacy compliance and healthcare data protection.