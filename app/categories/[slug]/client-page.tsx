'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, FileText, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { LoadMore } from '@/components/ui/load-more'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string
  read_time: number
  views: number
  is_featured: boolean
  published_at: string
  tags: string[]
}

interface CategoryClientPageProps {
  category: {
    id: string
    name: string
    slug: string
    description: string
  }
  initialArticles: Article[]
  totalCount: number
}

const ITEMS_PER_PAGE = 12

export function CategoryClientPage({ category, initialArticles, totalCount }: CategoryClientPageProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [isLoading, setIsLoading] = useState(false)
  const [hasMore, setHasMore] = useState(initialArticles.length === ITEMS_PER_PAGE && articles.length < totalCount)

  const loadMoreArticles = async () => {
    if (isLoading || !hasMore) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/categories/${category.slug}/articles?offset=${articles.length}&limit=${ITEMS_PER_PAGE}`)
      const data = await response.json()
      
      if (data.articles && data.articles.length > 0) {
        setArticles(prev => [...prev, ...data.articles])
        setHasMore(data.articles.length === ITEMS_PER_PAGE && articles.length + data.articles.length < totalCount)
      } else {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to load more articles:', error)
      setHasMore(false)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Articles Grid */}
      {articles.length === 0 ? (
        <Card className="col-span-full">
          <CardContent className="py-12 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No articles in this category yet.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <Link key={article.id} href={`/categories/${category.slug}/${article.slug}`}>
                <Card className="h-full hover:shadow-lg transition-shadow">
                  {article.is_featured && (
                    <div className="bg-primary text-white px-3 py-1 text-xs font-medium">
                      Featured
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{article.title}</CardTitle>
                    <CardDescription className="line-clamp-3">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{article.read_time} min read</span>
                      </div>
                      {article.views > 0 && (
                        <div className="flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          <span>{article.views} views</span>
                        </div>
                      )}
                    </div>
                    {article.tags && article.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {article.tags.slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Load More */}
          <LoadMore
            isLoading={isLoading}
            hasMore={hasMore}
            onLoadMore={loadMoreArticles}
            className="mt-8"
          />
        </>
      )}
    </>
  )
}