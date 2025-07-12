/**
 * Intersection Observer Hook
 * For tracking element visibility
 */

import { useEffect, useRef, useState } from 'react'

interface UseIntersectionObserverOptions {
  threshold?: number | number[]
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
  onIntersect?: () => void
}

export function useIntersectionObserver(
  elementRef: React.RefObject<Element>,
  {
    threshold = 0,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    onIntersect,
  }: UseIntersectionObserverOptions = {}
) {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const frozen = useRef(false)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    if (frozen.current && freezeOnceVisible) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const isElementIntersecting = entry.isIntersecting

          if (isElementIntersecting && !frozen.current) {
            if (onIntersect) {
              onIntersect()
            }
            if (freezeOnceVisible) {
              frozen.current = true
            }
          }

          setIsIntersecting(isElementIntersecting)
        })
      },
      { threshold, root, rootMargin }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [elementRef, threshold, root, rootMargin, freezeOnceVisible, onIntersect])

  return isIntersecting
}