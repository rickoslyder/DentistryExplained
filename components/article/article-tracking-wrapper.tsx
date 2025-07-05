'use client'

import { ViewCounter } from './view-counter'
import { RealtimePresence } from './realtime-presence'
import { BookmarkButton } from './bookmark-button'
import { useArticleReadingTracker } from '@/hooks/use-reading-history'
import { Clock, Calendar } from 'lucide-react'

interface ArticleTrackingWrapperProps {
  article: {
    slug: string
    title: string
    category: string
    readTime?: string
    publishedAt?: string
    excerpt?: string
  }
  fullSlug: string
  children: React.ReactNode
}

export function ArticleTrackingWrapper({ 
  article, 
  fullSlug, 
  children 
}: ArticleTrackingWrapperProps) {
  // Track reading progress
  useArticleReadingTracker({
    slug: fullSlug,
    title: article.title,
    category: article.category,
  })

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