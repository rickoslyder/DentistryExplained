'use client'

import { useEffect, useState, useRef } from 'react'
import { ViewCounter } from './view-counter'
import { RealtimePresence } from './realtime-presence'
import { BookmarkButton } from './bookmark-button'
import { useArticleReadingTracker } from '@/hooks/use-reading-history'
import { Clock, Calendar } from 'lucide-react'
import { analytics } from '@/lib/analytics-enhanced'
import { useConsent } from '@/components/consent/consent-provider'

interface ArticleTrackingWrapperProps {
  article: {
    id?: string
    slug: string
    title: string
    category: string
    readTime?: string
    publishedAt?: string
    excerpt?: string
    author?: { full_name: string } | string
    readingLevel?: 'basic' | 'advanced'
  }
  fullSlug: string
  children: React.ReactNode
}

export function ArticleTrackingWrapper({ 
  article, 
  fullSlug, 
  children 
}: ArticleTrackingWrapperProps) {
  const { hasConsent } = useConsent()
  const [startTime] = useState(Date.now())
  const [tracked25, setTracked25] = useState(false)
  const [tracked50, setTracked50] = useState(false)
  const [tracked75, setTracked75] = useState(false)
  const [tracked90, setTracked90] = useState(false)
  const scrollTimeoutRef = useRef<NodeJS.Timeout>()

  // Track reading progress for logged-in users
  useArticleReadingTracker({
    slug: fullSlug,
    title: article.title,
    category: article.category,
  })

  // Track article view on mount
  useEffect(() => {
    if (!hasConsent('analytics')) return

    // Track article view with enhanced data
    analytics.trackArticleView({
      id: article.id || fullSlug,
      title: article.title,
      category: article.category,
      author: typeof article.author === 'object' ? article.author?.full_name : article.author,
      readingLevel: article.readingLevel,
    })
  }, [article, fullSlug, hasConsent])

  // Track scroll depth
  useEffect(() => {
    if (!hasConsent('analytics')) return

    const handleScroll = () => {
      // Clear previous timeout
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }

      // Debounce scroll tracking
      scrollTimeoutRef.current = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight
        const scrollPercentage = (window.scrollY / scrollHeight) * 100

        // Track scroll milestones
        if (scrollPercentage >= 25 && !tracked25) {
          analytics.track('article_scroll_depth', {
            article_id: article.id || fullSlug,
            scroll_percentage: 25,
            time_elapsed: Date.now() - startTime,
          })
          setTracked25(true)
        }

        if (scrollPercentage >= 50 && !tracked50) {
          analytics.track('article_scroll_depth', {
            article_id: article.id || fullSlug,
            scroll_percentage: 50,
            time_elapsed: Date.now() - startTime,
          })
          setTracked50(true)
        }

        if (scrollPercentage >= 75 && !tracked75) {
          analytics.track('article_scroll_depth', {
            article_id: article.id || fullSlug,
            scroll_percentage: 75,
            time_elapsed: Date.now() - startTime,
          })
          setTracked75(true)
        }

        if (scrollPercentage >= 90 && !tracked90) {
          analytics.track('article_read_complete', {
            article_id: article.id || fullSlug,
            article_title: article.title,
            time_spent: Date.now() - startTime,
            scroll_percentage: 90,
          })
          setTracked90(true)
        }
      }, 500) // Debounce by 500ms
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [article, fullSlug, startTime, tracked25, tracked50, tracked75, tracked90, hasConsent])

  return (
    <div>
      {/* Article Header with Tracking Components */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{article.excerpt}</p>
          )}

          {/* Meta Information with Tracking */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            {article.publishedAt && (
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(article.publishedAt).toLocaleDateString('en-GB', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            )}
            
            {article.readTime && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                {article.readTime}
              </div>
            )}
            
            <ViewCounter articleSlug={fullSlug} showCurrentReaders={false} />
          </div>

          {/* Actions Bar */}
          <div className="flex items-center justify-between border-t border-b py-4">
            <div className="flex items-center gap-4">
              <RealtimePresence articleSlug={fullSlug} />
            </div>
            
            <div className="flex items-center gap-2">
              <BookmarkButton
                article={{
                  slug: fullSlug,
                  title: article.title,
                  category: article.category,
                  readTime: article.readTime,
                }}
                variant="outline"
                showText
              />
            </div>
          </div>
        </div>
      </div>

      {/* Article Content */}
      {children}
    </div>
  )
}