import { useCallback } from 'react';
import { unifiedAnalytics } from '@/lib/analytics-unified';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export function useAnalytics() {
  const { user } = useUser();
  const pathname = usePathname();

  // Track event with user context
  const track = useCallback((
    eventName: string,
    properties?: Record<string, any>
  ) => {
    unifiedAnalytics.track({
      name: eventName,
      properties: {
        ...properties,
        page_path: pathname,
        user_type: user?.publicMetadata?.userType || 'guest',
        is_authenticated: !!user,
      },
    });
  }, [pathname, user]);

  // Track click events with element context
  const trackClick = useCallback((
    elementName: string,
    properties?: Record<string, any>
  ) => {
    track('element_clicked', {
      element_name: elementName,
      ...properties,
    });
  }, [track]);

  // Track form submissions
  const trackFormSubmit = useCallback((
    formName: string,
    properties?: Record<string, any>
  ) => {
    track('form_submitted', {
      form_name: formName,
      ...properties,
    });
  }, [track]);

  // Track search queries
  const trackSearch = useCallback((
    query: string,
    resultsCount: number,
    searchType: 'site' | 'web' = 'site'
  ) => {
    unifiedAnalytics.trackSearch(query, resultsCount, searchType);
  }, []);

  // Track content engagement
  const trackEngagement = useCallback((
    contentType: 'article' | 'video' | 'guide' | 'tool',
    contentId: string,
    action: 'view' | 'share' | 'bookmark' | 'complete',
    properties?: Record<string, any>
  ) => {
    track('content_engagement', {
      content_type: contentType,
      content_id: contentId,
      engagement_action: action,
      ...properties,
    });
  }, [track]);

  // Track conversion goals
  const trackGoal = useCallback((
    goalName: string,
    value?: number,
    properties?: Record<string, any>
  ) => {
    unifiedAnalytics.trackGoal(goalName, value, properties);
  }, []);

  // Track funnel steps
  const trackFunnelStep = useCallback((
    funnelName: string,
    step: number,
    stepName: string,
    properties?: Record<string, any>
  ) => {
    unifiedAnalytics.trackFunnelStep(funnelName, step, stepName, properties);
  }, []);

  // Track A/B test variants
  const trackExperiment = useCallback((
    experimentName: string,
    variant: string,
    properties?: Record<string, any>
  ) => {
    unifiedAnalytics.trackExperiment(experimentName, variant, properties);
  }, []);

  // Track errors
  const trackError = useCallback((
    error: Error | string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    context?: any
  ) => {
    unifiedAnalytics.trackError(error, severity, {
      ...context,
      page_path: pathname,
      user_id: user?.id,
    });
  }, [pathname, user]);

  // Check feature flags
  const isFeatureEnabled = useCallback((flagName: string): boolean => {
    return unifiedAnalytics.isFeatureEnabled(flagName);
  }, []);

  return {
    track,
    trackClick,
    trackFormSubmit,
    trackSearch,
    trackEngagement,
    trackGoal,
    trackFunnelStep,
    trackExperiment,
    trackError,
    isFeatureEnabled,
  };
}