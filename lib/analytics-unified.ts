import { analytics as enhancedAnalytics, CustomEvent, MetaStandardEvent, UserType } from './analytics-enhanced';
import { posthog } from './posthog';

interface UnifiedEvent {
  name: string;
  properties?: Record<string, any>;
  revenue?: number;
  ga4?: boolean;
  meta?: boolean;
  posthog?: boolean;
}

class UnifiedAnalytics {
  private static instance: UnifiedAnalytics;
  
  private constructor() {}
  
  static getInstance(): UnifiedAnalytics {
    if (!UnifiedAnalytics.instance) {
      UnifiedAnalytics.instance = new UnifiedAnalytics();
    }
    return UnifiedAnalytics.instance;
  }

  // Track event across all platforms
  track(event: UnifiedEvent) {
    const { name, properties = {}, revenue, ga4 = true, meta = true, posthog: enablePostHog = true } = event;

    // Enhanced Analytics (GA4 + Meta via dataLayer)
    if (ga4 || meta) {
      enhancedAnalytics.track(name as CustomEvent, {
        ...properties,
        ...(revenue ? { value: revenue, currency: 'GBP' } : {}),
      });
    }

    // PostHog
    if (enablePostHog && typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(name, {
        ...properties,
        ...(revenue ? { revenue, currency: 'GBP' } : {}),
      });
    }
  }

  // User identification across platforms
  identify(userId: string, traits: Record<string, any>) {
    // Enhanced Analytics
    enhancedAnalytics.setUser({
      id: userId,
      type: traits.user_type || 'patient',
      isVerified: traits.is_verified || false,
      email: traits.email,
    });

    // PostHog
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.identify(userId, traits);
    }
  }

  // Track page view with enhanced data
  pageView(data?: { title?: string; category?: string; referrer?: string }) {
    const pageData = {
      page_path: window.location.pathname,
      page_title: data?.title || document.title,
      page_referrer: data?.referrer || document.referrer,
      page_category: data?.category,
    };

    this.track({
      name: 'page_view',
      properties: pageData,
    });
  }

  // E-commerce tracking
  trackPurchase(data: {
    orderId: string;
    revenue: number;
    items: Array<{
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    paymentMethod?: string;
    coupon?: string;
  }) {
    // GA4 Enhanced Ecommerce
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'purchase', {
        transaction_id: data.orderId,
        value: data.revenue,
        currency: 'GBP',
        items: data.items,
        payment_type: data.paymentMethod,
        coupon: data.coupon,
      });
    }

    // Meta Purchase Event
    enhancedAnalytics.trackMetaEvent(MetaStandardEvent.LEAD, {
      value: data.revenue,
      currency: 'GBP',
      order_id: data.orderId,
      contents: data.items,
    });

    // PostHog Revenue Tracking
    this.track({
      name: 'purchase_completed',
      properties: {
        order_id: data.orderId,
        payment_method: data.paymentMethod,
        coupon: data.coupon,
        items: data.items,
      },
      revenue: data.revenue,
    });
  }

  // Conversion funnel tracking
  trackFunnelStep(funnel: string, step: number, stepName: string, metadata?: any) {
    this.track({
      name: 'funnel_step_completed',
      properties: {
        funnel_name: funnel,
        funnel_step: step,
        step_name: stepName,
        ...metadata,
      },
    });

    // PostHog specific funnel tracking
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.capture(`${funnel}_${stepName}`, metadata);
    }
  }

  // A/B Test tracking
  trackExperiment(experimentName: string, variant: string, metadata?: any) {
    this.track({
      name: 'experiment_viewed',
      properties: {
        experiment_name: experimentName,
        variant,
        ...metadata,
      },
    });

    // Set PostHog feature flag override
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.featureFlags.override({
        [experimentName]: variant,
      });
    }
  }

  // Custom goal tracking
  trackGoal(goalName: string, value?: number, metadata?: any) {
    this.track({
      name: 'goal_completed',
      properties: {
        goal_name: goalName,
        goal_value: value,
        ...metadata,
      },
      revenue: value,
    });

    // GA4 Custom Conversion
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: 'G-PC5CJTZ95B',
        value: value,
        currency: 'GBP',
        conversion_label: goalName,
      });
    }
  }

  // Enhanced error tracking
  trackError(error: Error | string, severity: 'low' | 'medium' | 'high' | 'critical', context?: any) {
    const errorData = {
      error_message: typeof error === 'string' ? error : error.message,
      error_stack: typeof error === 'object' ? error.stack : undefined,
      error_severity: severity,
      error_context: context,
      page_url: window.location.href,
      user_agent: navigator.userAgent,
    };

    this.track({
      name: 'error_occurred',
      properties: errorData,
      ga4: severity === 'critical',
      meta: false, // Don't send errors to Meta
      posthog: true,
    });

    // Send critical errors to monitoring
    if (severity === 'critical') {
      // Future: Send to Sentry or other error monitoring
    }
  }

  // Performance tracking
  trackPerformance(metrics: {
    metric: 'FCP' | 'LCP' | 'CLS' | 'INP' | 'TTFB';
    value: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  }) {
    this.track({
      name: 'web_vital',
      properties: {
        metric_name: metrics.metric,
        metric_value: Math.round(metrics.value),
        metric_rating: metrics.rating,
        connection_type: (navigator as any).connection?.effectiveType,
      },
      ga4: true,
      meta: false,
      posthog: true,
    });
  }

  // Session recording control (PostHog specific)
  startSessionRecording() {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.startSessionRecording();
    }
  }

  stopSessionRecording() {
    if (typeof window !== 'undefined' && window.posthog) {
      window.posthog.stopSessionRecording();
    }
  }

  // Feature flag evaluation
  isFeatureEnabled(flagName: string): boolean {
    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.isFeatureEnabled(flagName) || false;
    }
    return false;
  }

  // Get feature flag variant
  getFeatureFlag(flagName: string): string | boolean | undefined {
    if (typeof window !== 'undefined' && window.posthog) {
      return window.posthog.getFeatureFlag(flagName);
    }
    return undefined;
  }

  // Revenue attribution
  trackRevenue(source: 'subscription' | 'one-time' | 'affiliate', amount: number, metadata?: any) {
    this.track({
      name: 'revenue_generated',
      properties: {
        revenue_source: source,
        attribution_channel: this.getAttributionChannel(),
        lifetime_value: this.calculateLTV(source, amount),
        ...metadata,
      },
      revenue: amount,
    });
  }

  // Helper methods
  private getAttributionChannel(): string {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    const utmMedium = urlParams.get('utm_medium');
    
    if (utmSource) {
      return `${utmSource}/${utmMedium || 'unknown'}`;
    }
    
    const referrer = document.referrer;
    if (!referrer) return 'direct';
    if (referrer.includes('google')) return 'organic/search';
    if (referrer.includes('facebook') || referrer.includes('instagram')) return 'social/meta';
    if (referrer.includes('linkedin')) return 'social/linkedin';
    return 'referral/other';
  }

  private calculateLTV(source: string, amount: number): number {
    // Simple LTV calculation - would be more sophisticated in production
    const multipliers = {
      'subscription': 12, // Assume 12 month average retention
      'one-time': 1.5, // Assume 50% chance of repeat purchase
      'affiliate': 0.3, // Lower margin on affiliate sales
    };
    return amount * (multipliers[source] || 1);
  }
}

// Export singleton instance
export const unifiedAnalytics = UnifiedAnalytics.getInstance();

// Export types
export type { UnifiedEvent };