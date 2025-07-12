'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { initPostHog, posthog } from '@/lib/posthog';
import { useConsent } from '@/components/consent/consent-provider';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();
  const pathname = usePathname();
  const { hasConsent } = useConsent();

  // Initialize PostHog
  useEffect(() => {
    initPostHog();
  }, []);

  // Update user identification when user changes
  useEffect(() => {
    if (!isLoaded || !posthog) return;

    if (user) {
      // Identify user with privacy-safe properties
      posthog.identify(user.id, {
        email_domain: user.primaryEmailAddress?.emailAddress?.split('@')[1], // Only domain, not full email
        user_type: user.publicMetadata?.userType || 'patient',
        is_verified: user.publicMetadata?.professionalVerified === true,
        created_at: user.createdAt,
      });

      // Set user groups for organization tracking
      if (user.publicMetadata?.userType === 'professional' && user.publicMetadata?.practiceId) {
        posthog.group('practice', user.publicMetadata.practiceId as string);
      }
    } else {
      // Reset identification for logged out users
      posthog.reset();
    }
  }, [user, isLoaded]);

  // Track page views with consent check
  useEffect(() => {
    if (!posthog || !hasConsent('analytics')) return;

    // Don't track admin pages
    if (pathname.startsWith('/admin')) return;

    // Manual page view tracking with metadata
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      $pathname: pathname,
      $referrer: document.referrer,
    });
  }, [pathname, hasConsent]);

  // Set feature flags based on user type
  useEffect(() => {
    if (!posthog || !user) return;

    const userType = user.publicMetadata?.userType || 'patient';
    const isVerified = user.publicMetadata?.professionalVerified === true;

    // Override feature flags based on user properties
    posthog.setPersonPropertiesForFlags({
      user_type: userType,
      is_verified: isVerified,
      has_premium: false, // Will be updated when payments are implemented
    });
  }, [user]);

  // Track consent changes
  useEffect(() => {
    if (!posthog) return;

    const analyticsConsent = hasConsent('analytics');
    const marketingConsent = hasConsent('marketing');

    // Update PostHog based on consent
    if (analyticsConsent) {
      posthog.opt_in_capturing();
    } else {
      posthog.opt_out_capturing();
    }

    // Track consent change event
    if (posthog.has_opted_in_capturing()) {
      posthog.capture('consent_updated', {
        analytics_consent: analyticsConsent,
        marketing_consent: marketingConsent,
      });
    }
  }, [hasConsent]);

  return <>{children}</>;
}