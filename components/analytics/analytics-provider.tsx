'use client';

import { useEffect, ReactNode } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { analytics, UserType } from '@/lib/analytics-enhanced';
import { useConsent } from '@/components/consent/consent-provider';

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const { hasConsent } = useConsent();

  // Initialize analytics with user context
  useEffect(() => {
    if (!isLoaded) return;

    if (user) {
      // Determine user type from metadata or database
      const userType: UserType = user.publicMetadata?.userType as UserType || 'patient';
      const isVerified = user.publicMetadata?.professionalVerified === true;

      // Set user context for all analytics events
      analytics.setUser({
        id: user.id,
        type: userType,
        email: user.primaryEmailAddress?.emailAddress,
        isVerified,
      });
    } else {
      // Guest user
      analytics.setUser({
        type: 'guest',
        isVerified: false,
      });
    }
  }, [user, isLoaded]);

  // Track page views
  useEffect(() => {
    // Only track if analytics consent is granted
    if (!hasConsent('analytics')) return;

    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;

    // Track page view with enhanced data
    const trackPageView = () => {
      analytics.track('page_view', {
        page_path: pathname,
        page_title: document.title,
        page_referrer: document.referrer,
      });
    };

    // Small delay to ensure page title is set
    const timer = setTimeout(trackPageView, 100);

    return () => clearTimeout(timer);
  }, [pathname, hasConsent]);

  // Track performance metrics
  useEffect(() => {
    if (!hasConsent('analytics')) return;

    // Track page timing after load
    const handleLoad = () => {
      // Use requestIdleCallback if available
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => {
          analytics.trackPageTiming();
        });
      } else {
        setTimeout(() => {
          analytics.trackPageTiming();
        }, 0);
      }
    };

    if (document.readyState === 'complete') {
      handleLoad();
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, [hasConsent]);

  // Track Web Vitals
  useEffect(() => {
    if (!hasConsent('analytics')) return;

    // Import web-vitals dynamically
    import('web-vitals').then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      const reportWebVital = ({ name, value, rating }: any) => {
        analytics.track('web_vitals', {
          metric_name: name,
          metric_value: Math.round(value),
          metric_rating: rating,
          page_path: pathname,
        });
      };

      onCLS(reportWebVital);
      onFCP(reportWebVital);
      onLCP(reportWebVital);
      onTTFB(reportWebVital);
      onINP(reportWebVital);
    });
  }, [pathname, hasConsent]);

  // Global error tracking
  useEffect(() => {
    if (!hasConsent('analytics')) return;

    const handleError = (event: ErrorEvent) => {
      analytics.trackError(event.error || new Error(event.message), {
        error_type: 'uncaught_error',
        error_filename: event.filename,
        error_line: event.lineno,
        error_column: event.colno,
        page_path: pathname,
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      analytics.trackError(
        new Error(`Unhandled Promise Rejection: ${event.reason}`),
        {
          error_type: 'unhandled_rejection',
          page_path: pathname,
        }
      );
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [pathname, hasConsent]);

  return <>{children}</>;
}