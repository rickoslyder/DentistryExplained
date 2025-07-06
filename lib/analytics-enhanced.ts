// Enhanced Analytics utility with server-side tracking support
// Handles both client-side and server-side events with Stape enrichment

interface WindowWithDataLayer extends Window {
  dataLayer: any[];
  fbq?: (track: string, event: string, parameters?: any) => void;
  gtag?: (...args: any[]) => void;
  consentManager?: {
    hasConsent: (type: string) => boolean;
  };
}

declare const window: WindowWithDataLayer;

export type UserType = 'patient' | 'professional' | 'guest';

export interface AnalyticsUser {
  id?: string;
  type: UserType;
  isVerified?: boolean;
  email?: string; // Will be hashed before sending
}

export interface EnhancedEventData {
  // Standard event data
  event_name: string;
  event_parameters?: Record<string, any>;
  
  // Server-side enrichment
  server_enrichment?: {
    stape_user_id?: string;
    geo?: {
      country?: string;
      region?: string;
      city?: string;
      postal_code?: string;
    };
    device?: {
      category?: string;
      os?: string;
      browser?: string;
      browser_version?: string;
    };
  };
  
  // Consent and privacy
  consent_status?: {
    analytics: boolean;
    marketing: boolean;
  };
  
  // Healthcare compliance
  sanitized?: boolean;
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

class EnhancedAnalytics {
  private static instance: EnhancedAnalytics;
  private user: AnalyticsUser = { type: 'guest' };
  private sessionId: string;
  private serverEndpoint = 'https://server-side-tagging-zlmkxmxrqq-uc.a.run.app';

  private constructor() {
    // Initialize dataLayer if it doesn't exist
    if (typeof window !== 'undefined') {
      window.dataLayer = window.dataLayer || [];
      this.sessionId = this.generateSessionId();
    }
  }

  static getInstance(): EnhancedAnalytics {
    if (!EnhancedAnalytics.instance) {
      EnhancedAnalytics.instance = new EnhancedAnalytics();
    }
    return EnhancedAnalytics.instance;
  }

  // Set user context for all events
  setUser(user: AnalyticsUser) {
    this.user = user;
    
    // Push user context to dataLayer with server-side flag
    if (typeof window !== 'undefined') {
      window.dataLayer.push({
        event: 'user_set',
        user_id: user.id ? this.hashUserId(user.id) : undefined,
        user_type: user.type,
        user_verified: user.isVerified,
        user_email_hash: user.email ? this.hashEmail(user.email) : undefined,
        enable_server_processing: true,
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

  // Enhanced track method with server-side support
  track(eventName: CustomEvent | string, parameters?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    const eventId = this.generateEventId();
    const enhancedEventData: EnhancedEventData = {
      event_name: eventName,
      event_parameters: {
        ...parameters,
        event_id: eventId,
        user_type: this.user.type,
        session_id: this.sessionId,
        timestamp: new Date().toISOString(),
      },
      consent_status: this.getConsentStatus(),
      sanitized: false,
    };

    // Client-side tracking (immediate) with enhanced data
    window.dataLayer.push({
      event: eventName,
      ...enhancedEventData.event_parameters,
      user_properties: {
        user_type: this.user.type,
        user_id: this.user.id ? this.hashUserId(this.user.id) : undefined,
        is_verified: this.user.isVerified || false,
        email_hash: this.user.email ? this.hashEmail(this.user.email) : undefined,
      },
      ecommerce: this.getEcommerceData(eventName, parameters),
      server_container_endpoint: this.serverEndpoint,
      send_to_server: true,
    });

    // Also send to GA4 if available
    if (window.gtag) {
      window.gtag('event', eventName, enhancedEventData.event_parameters);
    }

    // Queue for server-side enrichment
    this.queueServerEnrichment(enhancedEventData);
  }

  // Track Meta standard events with server-side processing
  trackMetaEvent(event: MetaStandardEvent, parameters?: Record<string, any>) {
    if (typeof window === 'undefined') return;

    // Check for marketing consent
    if (!this.hasMarketingConsent()) return;

    // Sanitize parameters for healthcare compliance
    const sanitizedParams = this.sanitizeHealthcareData(parameters);

    // Generate event ID for deduplication
    const eventId = this.generateEventId();

    // Client-side Meta pixel (if available)
    if (window.fbq) {
      window.fbq('track', event, {
        ...sanitizedParams,
        eventID: eventId,
      });
    }

    // Push to dataLayer for server-side processing
    window.dataLayer.push({
      event: 'meta_' + event.toLowerCase(),
      ...sanitizedParams,
      event_id: eventId,
      server_side_only: !window.fbq, // Send server-side only if pixel blocked
    });
  }

  // Specific tracking methods with server enrichment

  trackArticleView(article: {
    id: string;
    title: string;
    category: string;
    author?: string;
    readingLevel?: 'basic' | 'advanced';
  }) {
    const eventData = {
      article_id: article.id,
      article_title: article.title,
      article_category: article.category,
      article_author: article.author,
      reading_level: article.readingLevel,
      content_group: this.categorizeContent(article.category),
    };

    this.track('article_view', eventData);

    this.trackMetaEvent(MetaStandardEvent.VIEW_CONTENT, {
      content_name: article.title,
      content_category: article.category,
      content_type: 'article',
      content_ids: [article.id],
      value: this.calculateContentValue(article),
      currency: 'GBP',
    });
  }

  trackSearch(query: string, resultsCount: number, searchType: 'site' | 'web' = 'site') {
    const eventData = {
      search_term: query,
      search_type: searchType,
      results_count: resultsCount,
      search_category: 'all',
    };

    this.track('search', eventData);

    this.trackMetaEvent(MetaStandardEvent.SEARCH, {
      search_string: query,
      content_category: searchType,
      value: 0.25,
      currency: 'GBP',
    });
  }

  trackRegistration(userType: UserType, method: 'email' | 'google' = 'email') {
    const eventData = {
      method: method,
      user_type: userType,
      registration_source: this.getRegistrationSource(),
    };

    this.track('sign_up', eventData);

    this.trackMetaEvent(MetaStandardEvent.COMPLETE_REGISTRATION, {
      content_name: `${userType} Account`,
      status: true,
      value: userType === 'professional' ? 50.0 : 10.0,
      currency: 'GBP',
      predicted_ltv: userType === 'professional' ? 500.0 : 50.0,
    });
  }

  trackChatInteraction(action: 'start' | 'message' | 'export', sessionId: string, metadata?: any) {
    const eventMap = {
      start: CustomEvent.CHAT_SESSION_START,
      message: CustomEvent.CHAT_MESSAGE_SENT,
      export: CustomEvent.CHAT_EXPORT,
    };

    const eventData = {
      session_id: sessionId,
      action: action,
      entry_page: window.location.pathname,
      ...metadata,
    };

    this.track(eventMap[action], eventData);

    if (action === 'start') {
      this.trackMetaEvent(MetaStandardEvent.CONTACT, {
        content_name: 'AI Chat Assistant',
        content_category: 'support',
        fb_content_type: 'customer_service',
      });
    }
  }

  trackProfessionalVerification(action: 'submit' | 'success' | 'failure', verificationType: string) {
    const eventData = {
      action: action,
      verification_type: verificationType,
      attempt_number: this.getVerificationAttempt(),
    };

    this.track('professional_verification', eventData);

    if (action === 'submit') {
      this.trackMetaEvent(MetaStandardEvent.SUBMIT_APPLICATION, {
        content_name: 'Professional Verification',
        content_type: verificationType,
        value: 100.0,
        currency: 'GBP',
      });
    }
  }

  trackEmergencyGuide(action: string, severity?: string) {
    // Don't send specific health data to third parties
    const sanitizedData = {
      emergency_action: action,
      severity_level: severity ? this.sanitizeSeverity(severity) : undefined,
      user_location_available: this.hasLocationPermission(),
    };

    this.track(CustomEvent.EMERGENCY_GUIDE_VIEW, sanitizedData);
  }

  // Server-side enrichment queue
  private queueServerEnrichment(eventData: EnhancedEventData) {
    // In production, this would send to your server endpoint
    // The server would then:
    // 1. Add Stape User ID from headers
    // 2. Add GEO data from headers
    // 3. Parse User Agent for device info
    // 4. Apply additional privacy rules
    // 5. Route to appropriate analytics platforms
    
    if (this.shouldSendServerSide()) {
      // Queue for batch processing
      this.addToServerQueue(eventData);
    }
  }

  // Utility methods

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateEventId(): string {
    return `${this.sessionId}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
  }

  private hashUserId(userId: string): string {
    // Simple hash for privacy - in production, use SHA256
    return btoa(userId).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
  }

  private hashEmail(email: string): string {
    // SHA256 hash for Meta advanced matching
    // In production, use proper SHA256 implementation
    return btoa(email.toLowerCase().trim()).replace(/[^a-zA-Z0-9]/g, '');
  }

  private getConsentStatus() {
    if (typeof window !== 'undefined' && window.consentManager) {
      return {
        analytics: window.consentManager.hasConsent('analytics'),
        marketing: window.consentManager.hasConsent('marketing'),
      };
    }
    return { analytics: true, marketing: true };
  }

  private hasMarketingConsent(): boolean {
    return this.getConsentStatus().marketing;
  }

  private sanitizeHealthcareData(data: any): any {
    if (!data) return data;

    // Healthcare compliance: remove or genericize health-specific terms
    const healthTerms = ['dental', 'tooth', 'teeth', 'gum', 'oral', 'cavity', 'pain', 'emergency', 'bleeding', 'swelling', 'infection'];
    const sanitized = { ...data };

    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        let value = sanitized[key].toLowerCase();
        healthTerms.forEach(term => {
          if (value.includes(term)) {
            // Replace with generic terms
            value = value.replace(new RegExp(term, 'gi'), 'health_content');
          }
        });
        sanitized[key] = value;
      }
    });

    return sanitized;
  }

  private categorizeContent(category: string): string {
    const categoryMap: Record<string, string> = {
      'dental-problems': 'problems',
      'treatments': 'treatments',
      'prevention': 'prevention',
      'the-mouth': 'education',
    };
    return categoryMap[category] || 'other';
  }

  private calculateContentValue(article: any): number {
    // Dynamic value based on content type and user engagement
    const baseValues: Record<string, number> = {
      'problems': 0.75,
      'treatments': 1.00,
      'prevention': 0.50,
      'education': 0.25,
    };
    
    const categoryValue = baseValues[this.categorizeContent(article.category)] || 0.50;
    const userMultiplier = this.user.type === 'professional' ? 2.0 : 1.0;
    
    return categoryValue * userMultiplier;
  }

  private getRegistrationSource(): string {
    const referrer = document.referrer;
    const utmSource = new URLSearchParams(window.location.search).get('utm_source');
    
    if (utmSource) return utmSource;
    if (referrer.includes('google')) return 'organic_search';
    if (referrer.includes('facebook') || referrer.includes('instagram')) return 'social_media';
    if (!referrer) return 'direct';
    return 'referral';
  }

  private getVerificationAttempt(): number {
    // Get from session storage or cookie
    const attempts = parseInt(sessionStorage.getItem('verification_attempts') || '0');
    sessionStorage.setItem('verification_attempts', (attempts + 1).toString());
    return attempts + 1;
  }

  private getEcommerceData(eventName: string, parameters?: Record<string, any>): any {
    // Map events to ecommerce actions for future monetization tracking
    const ecommerceEvents: Record<string, any> = {
      'article_view': {
        currency: 'GBP',
        value: parameters?.value || 0.50,
        items: [{
          item_id: parameters?.article_id,
          item_name: parameters?.article_title,
          item_category: parameters?.article_category,
          item_brand: 'Dentistry Explained',
          price: parameters?.value || 0.50,
          quantity: 1
        }]
      },
      'professional_verification_submit': {
        currency: 'GBP',
        value: 100.00,
        items: [{
          item_id: 'prof_verification',
          item_name: 'Professional Verification',
          item_category: 'subscription',
          item_brand: 'Dentistry Explained',
          price: 100.00,
          quantity: 1
        }]
      },
      'consent_form_download': {
        currency: 'GBP',
        value: 5.00,
        items: [{
          item_id: parameters?.form_id,
          item_name: parameters?.form_title,
          item_category: 'professional_resource',
          item_brand: 'Dentistry Explained',
          price: 5.00,
          quantity: 1
        }]
      },
      'sign_up': {
        currency: 'GBP',
        value: parameters?.user_type === 'professional' ? 50.00 : 10.00,
        items: [{
          item_id: `${parameters?.user_type}_account`,
          item_name: `${parameters?.user_type} Account`,
          item_category: 'registration',
          item_brand: 'Dentistry Explained',
          price: parameters?.user_type === 'professional' ? 50.00 : 10.00,
          quantity: 1
        }]
      }
    };

    return ecommerceEvents[eventName] || null;
  }

  private sanitizeSeverity(severity: string): string {
    // Generic severity levels without health details
    const severityMap: Record<string, string> = {
      'emergency': 'high',
      'urgent': 'medium',
      'routine': 'low',
    };
    return severityMap[severity.toLowerCase()] || 'medium';
  }

  private hasLocationPermission(): boolean {
    if (typeof window !== 'undefined' && 'permissions' in navigator) {
      // Check but don't request permission
      return false; // Default to false for privacy
    }
    return false;
  }

  private shouldSendServerSide(): boolean {
    // Determine if event should be processed server-side
    return true; // Enable for all events with Stape
  }

  private serverQueue: EnhancedEventData[] = [];
  private serverQueueTimer: NodeJS.Timeout | null = null;

  private addToServerQueue(eventData: EnhancedEventData) {
    this.serverQueue.push(eventData);
    
    // Batch send every 5 seconds or when queue reaches 10 events
    if (this.serverQueue.length >= 10) {
      this.flushServerQueue();
    } else if (!this.serverQueueTimer) {
      this.serverQueueTimer = setTimeout(() => this.flushServerQueue(), 5000);
    }
  }

  private async flushServerQueue() {
    if (this.serverQueue.length === 0) return;
    
    const events = [...this.serverQueue];
    this.serverQueue = [];
    
    if (this.serverQueueTimer) {
      clearTimeout(this.serverQueueTimer);
      this.serverQueueTimer = null;
    }
    
    try {
      // In production, send to your server endpoint
      // await fetch(`${this.serverEndpoint}/collect`, {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify({ events }),
      // });
    } catch (error) {
      console.error('Failed to send server-side events:', error);
      // Re-queue failed events
      this.serverQueue.unshift(...events);
    }
  }

  // Page timing metrics with server enrichment
  trackPageTiming() {
    if (typeof window === 'undefined' || !window.performance) return;

    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;

    this.track('page_timing', {
      page_load_time: pageLoadTime,
      connect_time: connectTime,
      page_path: window.location.pathname,
      connection_type: (navigator as any).connection?.effectiveType,
    });
  }

  // Enhanced error tracking
  trackError(error: Error, context?: any) {
    const errorData = {
      error_message: error.message,
      error_stack: error.stack,
      error_context: context,
      page_path: typeof window !== 'undefined' ? window.location.pathname : undefined,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.track('error', errorData);
    
    // Send critical errors immediately
    if (context?.severity === 'critical') {
      this.flushServerQueue();
    }
  }
}

// Export singleton instance
export const analytics = EnhancedAnalytics.getInstance();

// Export types for use in components
export type { EnhancedAnalytics, EnhancedEventData };