/**
 * Hook for tracking high-value CTA interactions
 * Only tracks meaningful conversion-driving actions
 */

import { analytics } from '@/lib/analytics-unified'
import { useCallback } from 'react'

interface CTATrackingOptions {
  category: 'primary' | 'secondary' | 'navigation' | 'conversion'
  location: string // e.g., 'hero', 'article_footer', 'sidebar'
  variant?: string // e.g., 'button', 'link', 'banner'
}

export function useCTATracking() {
  const trackCTA = useCallback((
    action: string,
    label: string,
    options: CTATrackingOptions,
    metadata?: Record<string, any>
  ) => {
    // Only track high-value CTAs
    const highValueActions = [
      'sign_up_start',
      'professional_verify_start',
      'book_appointment',
      'download_resource',
      'contact_practice',
      'claim_practice',
      'upgrade_account',
      'start_chat',
      'emergency_call',
      'find_dentist',
    ]

    if (!highValueActions.includes(action)) {
      return // Skip low-value interactions
    }

    analytics.track('cta_interaction', {
      cta_action: action,
      cta_label: label,
      cta_category: options.category,
      cta_location: options.location,
      cta_variant: options.variant || 'button',
      page_path: window.location.pathname,
      ...metadata,
    })

    // Also track as conversion event for high-value actions
    if (options.category === 'conversion') {
      analytics.track('conversion_intent', {
        conversion_type: action,
        conversion_location: options.location,
        ...metadata,
      })
    }
  }, [])

  return { trackCTA }
}

// Pre-configured tracking functions for common CTAs
export function useCommonCTAs() {
  const { trackCTA } = useCTATracking()

  return {
    trackSignUpStart: (location: string) => 
      trackCTA('sign_up_start', 'Get Started', { category: 'conversion', location }),
    
    trackProfessionalVerify: (location: string) =>
      trackCTA('professional_verify_start', 'Verify Professional Status', { category: 'conversion', location }),
    
    trackBookAppointment: (practiceId: string, location: string) =>
      trackCTA('book_appointment', 'Book Appointment', { 
        category: 'conversion', 
        location 
      }, { practice_id: practiceId }),
    
    trackResourceDownload: (resourceType: string, resourceId: string, location: string) =>
      trackCTA('download_resource', `Download ${resourceType}`, {
        category: 'primary',
        location,
      }, { resource_type: resourceType, resource_id: resourceId }),
    
    trackFindDentist: (location: string) =>
      trackCTA('find_dentist', 'Find a Dentist', { category: 'primary', location }),
  }
}