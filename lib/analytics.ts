// Analytics utility for consistent event tracking across the platform
// Handles both Google Analytics and Meta Pixel events

interface WindowWithDataLayer extends Window {
  dataLayer: any[];
  fbq?: (track: string, event: string, parameters?: any) => void;
  gtag?: (...args: any[]) => void;
}

declare const window: WindowWithDataLayer;

export type UserType = 'patient' | 'professional' | 'guest';

export interface AnalyticsUser {
  id?: string;
  type: UserType;
  isVerified?: boolean;
}

// Standard Meta events that map to user actions
export enum MetaStandardEvent {
  VIEW_CONTENT = 'ViewContent',
  SEARCH = 'Search',
  LEAD = 'Lead',
  COMPLETE_REGISTRATION = 'CompleteRegistration',
  CONTACT = 'Contact',
  SUBMIT_APPLICATION = 'SubmitApplication',
  FIND_LOCATION = 'FindLocation',
  SCHEDULE = 'Schedule',
  SUBSCRIBE = 'Subscribe',
}

// Custom events for platform-specific actions
export enum CustomEvent {
  ARTICLE_BOOKMARK = 'article_bookmark',
  CHAT_SESSION_START = 'chat_session_start',
  CHAT_MESSAGE_SENT = 'chat_message_sent',
  CHAT_EXPORT = 'chat_export',
  EMERGENCY_GUIDE_VIEW = 'emergency_guide_view',
  SYMPTOM_CHECKER_COMPLETE = 'symptom_checker_complete',
  GLOSSARY_TERM_VIEW = 'glossary_term_view',
  QUIZ_ATTEMPT = 'quiz_attempt',
  PROFESSIONAL_DOWNLOAD = 'professional_download',
  PRACTICE_CLAIM = 'practice_claim',
  WEB_SEARCH_PERFORMED = 'web_search_performed',
}

class Analytics {
  private static instance: Analytics;
  private user: AnalyticsUser = { type: 'guest' };

  private constructor() {
    // Initialize dataLayer if it doesn't exist
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
    }
  }

  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  // Set user context for all events
  setUser(user: AnalyticsUser) {
    this.user = user;
    
    // Push user context to dataLayer
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'user_set',
        user_id: user.id ? this.hashUserId(user.id) : undefined,
        user_type: user.type,
        user_verified: user.isVerified,
      });

      // Set user properties in GA4
      if (window.gtag) {
        window.gtag('set', {
          user_id: user.id ? this.hashUserId(user.id) : undefined,
          user_properties: {
            user_type: user.type,
            is_verified: user.isVerified || false,
          },
        });
      }
    }
  }

  // Track custom events
  track(eventName: CustomEvent | string, parameters?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    const eventData = {
      event: eventName,
      ...parameters,
      user_type: this.user.type,
      timestamp: new Date().toISOString(),
    };

    window.dataLayer.push(eventData);

    // Also send to GA4 if available
    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }
  }

  // Track Meta standard events
  trackMetaEvent(event: MetaStandardEvent, parameters?: Record<string, any>) {
    if (typeof window === 'undefined' || !window.fbq) return;

    // Check for marketing consent
    if (!this.hasMarketingConsent()) return;

    // Sanitize parameters for healthcare compliance
    const sanitizedParams = this.sanitizeHealthcareData(parameters);

    window.fbq('track', event, sanitizedParams);

    // Also push to dataLayer for GTM
    window.dataLayer.push({
      event: 'meta_' + event.toLowerCase(),
      ...sanitizedParams,
    });
  }

  // Specific tracking methods for common actions

  trackArticleView(article: {
    id: string;
    title: string;
    category: string;
    author?: string;
    readingLevel?: 'basic' | 'advanced';
  }) {
    this.track(CustomEvent.ARTICLE_BOOKMARK, {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      article_author: article.author,
      reading_level: article.readingLevel,
    });

    this.trackMetaEvent(MetaStandardEvent.VIEW_CONTENT, {
      content_name: article.title,
      content_category: article.category,
      content_type: 'article',
      content_ids: [article.id],
      value: 0.5,
      currency: 'GBP',
    });
  }

  trackSearch(query: string, resultsCount: number, searchType: 'site' | 'web' = 'site') {
    this.track('search', {
      search_term: query,
      search_type: searchType,
      results_count: resultsCount,
    });

    this.trackMetaEvent(MetaStandardEvent.SEARCH, {
      search_string: query,
      content_category: searchType,
      value: 0.25,
      currency: 'GBP',
    });
  }

  trackRegistration(userType: UserType, method: 'email' | 'google' = 'email') {
    this.track('sign_up', {
      method: method,
      user_type: userType,
    });

    this.trackMetaEvent(MetaStandardEvent.COMPLETE_REGISTRATION, {
      content_name: `${userType} Account`,
      status: true,
      value: userType === 'professional' ? 50.0 : 10.0,
      currency: 'GBP',
    });
  }

  trackChatInteraction(action: 'start' | 'message' | 'export', sessionId: string) {
    const eventMap = {
      start: CustomEvent.CHAT_SESSION_START,
      message: CustomEvent.CHAT_MESSAGE_SENT,
      export: CustomEvent.CHAT_EXPORT,
    };

    this.track(eventMap[action], {
      session_id: sessionId,
      action: action,
    });

    if (action === 'start') {
      this.trackMetaEvent(MetaStandardEvent.CONTACT, {
        content_name: 'AI Chat Assistant',
        content_category: 'support',
      });
    }
  }

  trackBookmark(articleId: string, action: 'add' | 'remove') {
    this.track(CustomEvent.ARTICLE_BOOKMARK, {
      article_id: articleId,
      bookmark_action: action,
    });
  }

  trackFormSubmission(formType: 'newsletter' | 'contact' | 'professional_interest', data?: any) {
    this.track('form_submit', {
      form_type: formType,
      ...data,
    });

    if (formType === 'newsletter' || formType === 'professional_interest') {
      this.trackMetaEvent(MetaStandardEvent.LEAD, {
        content_name: formType === 'newsletter' ? 'Newsletter Signup' : 'Professional Interest',
        content_category: 'lead_generation',
        value: formType === 'professional_interest' ? 25.0 : 5.0,
        currency: 'GBP',
      });
    }
  }

  trackProfessionalVerification(action: 'submit' | 'success' | 'failure', verificationType: string) {
    this.track('professional_verification', {
      action: action,
      verification_type: verificationType,
    });

    if (action === 'submit') {
      this.trackMetaEvent(MetaStandardEvent.SUBMIT_APPLICATION, {
        content_name: 'Professional Verification',
        content_type: verificationType,
        value: 100.0,
        currency: 'GBP',
      });
    }
  }

  trackEmergencyGuide(action: string, data?: any) {
    this.track(CustomEvent.EMERGENCY_GUIDE_VIEW, {
      emergency_action: action,
      ...data,
    });
  }

  trackFindDentist(location: string, filters?: any) {
    this.track('find_dentist_search', {
      search_location: location,
      ...filters,
    });

    this.trackMetaEvent(MetaStandardEvent.FIND_LOCATION, {
      search_string: location,
      content_type: 'dental_practice',
    });
  }

  // Utility methods

  private hashUserId(userId: string): string {
    // Simple hash for privacy - in production, use proper hashing
    return btoa(userId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private hasMarketingConsent(): boolean {
    // Check for marketing consent
    // This should integrate with your consent management platform
    if (typeof window !== 'undefined' && (window as any).consentManager) {
      return (window as any).consentManager.hasConsent('marketing');
    }
    // Default to true if no consent manager (for development)
    return true;
  }

  private sanitizeHealthcareData(data: any): any {
    if (!data) return data;

    // Healthcare compliance: remove or genericize health-specific terms
    const healthTerms = ['dental', 'tooth', 'teeth', 'gum', 'oral', 'cavity', 'pain', 'emergency'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        let value = sanitized[key].toLowerCase();
        healthTerms.forEach(term => {
          if (value.includes(term)) {
            // Replace with generic terms
            value = value.replace(new RegExp(term, 'gi'), 'content');
          }
        });
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  // Page timing metrics
  trackPageTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;

    this.track('page_timing', {
      page_load_time: pageLoadTime,
      connect_time: connectTime,
      page_path: window.location.pathname,
    });
  }

  // Error tracking
  trackError(error: Error, context?: any) {
    this.track('error', {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
    });
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Export types for use in components
export type { Analytics };