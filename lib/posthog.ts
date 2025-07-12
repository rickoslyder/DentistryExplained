import posthog from 'posthog-js';
import { PostHogConfig } from 'posthog-js';

export const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || '';
export const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com';

// PostHog configuration with privacy-first settings
const posthogConfig: Partial<PostHogConfig> = {
  api_host: POSTHOG_HOST,
  // Privacy settings
  autocapture: false, // Disable automatic event capture for GDPR compliance
  capture_pageview: false, // We'll manually track page views with consent
  capture_pageleave: false, // Disable automatic page leave tracking
  disable_session_recording: true, // No session recordings for healthcare privacy
  
  // Performance settings
  loaded: (posthog) => {
    // Check for user consent before enabling features
    if (typeof window !== 'undefined') {
      const hasAnalyticsConsent = window.localStorage.getItem('consent_analytics') === 'true';
      const hasMarketingConsent = window.localStorage.getItem('consent_marketing') === 'true';
      
      if (hasAnalyticsConsent) {
        // Enable basic analytics features
        posthog.opt_in_capturing();
      } else {
        posthog.opt_out_capturing();
      }
      
      // Set user properties based on consent
      posthog.register({
        analytics_consent: hasAnalyticsConsent,
        marketing_consent: hasMarketingConsent,
        environment: process.env.NODE_ENV,
      });
    }
  },
  
  // Feature flags
  bootstrap: {
    featureFlags: {},
  },
  
  // Other settings
  sanitize_properties: (properties) => {
    // Remove any PHI or sensitive health data
    const sanitized = { ...properties };
    const sensitiveKeys = ['diagnosis', 'condition', 'symptom', 'medication', 'treatment'];
    
    Object.keys(sanitized).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        delete sanitized[key];
      }
    });
    
    return sanitized;
  },
};

// Initialize PostHog
export function initPostHog() {
  if (typeof window !== 'undefined' && POSTHOG_KEY) {
    if (!window.posthog) {
      posthog.init(POSTHOG_KEY, posthogConfig);
      window.posthog = posthog;
    }
    return window.posthog;
  }
  return null;
}

// Type-safe PostHog instance
declare global {
  interface Window {
    posthog?: typeof posthog;
  }
}

// Export configured instance
export { posthog };