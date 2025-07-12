/**
 * Hook for tracking quality content interactions
 * Focuses on understanding what content resonates with users
 */

import { useEffect, useRef, useCallback } from 'react'
import { analytics } from '@/lib/analytics-unified'
import { useIntersectionObserver } from '@/hooks/use-intersection-observer'

interface ContentSection {
  id: string
  type: 'heading' | 'procedure' | 'warning' | 'cost_table' | 'faq' | 'video'
  title: string
}

export function useContentInteraction(sections: ContentSection[]) {
  const viewedSections = useRef(new Set<string>())
  const interactionCounts = useRef<Record<string, number>>({})

  // Track section visibility
  const trackSectionView = useCallback((sectionId: string) => {
    if (viewedSections.current.has(sectionId)) return

    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    viewedSections.current.add(sectionId)

    // Only track high-value content sections
    const trackableSections = ['procedure', 'warning', 'cost_table', 'faq', 'video']
    if (trackableSections.includes(section.type)) {
      analytics.track('content_section_viewed', {
        section_id: sectionId,
        section_type: section.type,
        section_title: section.title,
        page_path: window.location.pathname,
      })
    }
  }, [sections])

  // Track meaningful interactions within sections
  const trackSectionInteraction = useCallback((
    sectionId: string,
    interactionType: 'expand' | 'copy' | 'share' | 'print'
  ) => {
    const section = sections.find(s => s.id === sectionId)
    if (!section) return

    // Increment interaction count
    const key = `${sectionId}-${interactionType}`
    interactionCounts.current[key] = (interactionCounts.current[key] || 0) + 1

    analytics.track('content_interaction', {
      section_id: sectionId,
      section_type: section.type,
      interaction_type: interactionType,
      interaction_count: interactionCounts.current[key],
      page_path: window.location.pathname,
    })
  }, [sections])

  return {
    trackSectionView,
    trackSectionInteraction,
  }
}

/**
 * Component to wrap content sections for automatic visibility tracking
 */
interface TrackedSectionProps {
  section: ContentSection
  onView: (sectionId: string) => void
  children: React.ReactNode
}

export function TrackedSection({ section, onView, children }: TrackedSectionProps) {
  const ref = useRef<HTMLElement>(null)
  
  useIntersectionObserver(ref, {
    threshold: 0.5, // 50% visible
    rootMargin: '0px',
    onIntersect: () => onView(section.id),
  })

  return (
    <section ref={ref} data-section-id={section.id}>
      {children}
    </section>
  )
}