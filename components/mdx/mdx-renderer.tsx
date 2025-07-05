'use client'

import { MDXRemoteSerializeResult } from 'next-mdx-remote'
import { MDXWithGlossary } from '@/components/mdx/mdx-with-glossary'
import { mdxComponents } from '@/lib/mdx'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { 
  Clock, 
  Calendar, 
  User, 
  Tag, 
  Share2, 
  Bookmark, 
  MessageSquare,
  ChevronRight,
  Home
} from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useBookmarks } from '@/hooks/use-bookmarks'
import { toast } from 'sonner'

interface MDXRendererProps {
  content: MDXRemoteSerializeResult
  frontmatter: {
    title: string
    excerpt?: string
    category?: string
    author?: string
    date?: string
    tags?: string[]
    featuredImage?: string
  }
  slug: string
  readTime: number
  toc?: Array<{
    id: string
    title: string
    level: number
  }>
  relatedArticles?: Array<{
    slug: string
    title: string
    excerpt: string
    readTime: number
  }>
}

export function MDXRenderer({
  content,
  frontmatter,
  slug,
  readTime,
  toc = [],
  relatedArticles = []
}: MDXRendererProps) {
  const { addBookmark, removeBookmark, isBookmarked } = useBookmarks()
  const [isSharing, setIsSharing] = useState(false)
  const bookmarked = isBookmarked(slug)
  
  const handleShare = async () => {
    setIsSharing(true)
    try {
      if (navigator.share) {
        await navigator.share({
          title: frontmatter.title,
          text: frontmatter.excerpt || '',
          url: window.location.href,
        })
      } else {
        await navigator.clipboard.writeText(window.location.href)
        toast.success('Link copied to clipboard!')
      }
    } catch (error) {
      toast.error('Failed to share')
    } finally {
      setIsSharing(false)
    }
  }
  
  const handleBookmark = () => {
    if (bookmarked) {
      removeBookmark(slug)
    } else {
      addBookmark({
        articleSlug: slug,
        title: frontmatter.title,
        category: frontmatter.category || 'General',
        readTime: `${readTime} min`,
      })
    }
  }
  
  // Format date
  const formattedDate = frontmatter.date 
    ? new Date(frontmatter.date).toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : null

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <ol className="flex items-center space-x-2 text-sm text-gray-600">
          <li>
            <Link href="/" className="hover:text-primary">
              <Home className="w-4 h-4" />
            </Link>
          </li>
          <ChevronRight className="w-4 h-4" />
          {frontmatter.category && (
            <>
              <li>
                <Link 
                  href={`/category/${frontmatter.category.toLowerCase().replace(/\s+/g, '-')}`}
                  className="hover:text-primary"
                >
                  {frontmatter.category}
                </Link>
              </li>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
          <li className="text-gray-900 font-medium truncate max-w-xs">
            {frontmatter.title}
          </li>
        </ol>
      </nav>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Content */}
        <article className="lg:col-span-3">
          {/* Article Header */}
          <header className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              {frontmatter.title}
            </h1>
            
            {frontmatter.excerpt && (
              <p className="text-xl text-gray-600 mb-6">
                {frontmatter.excerpt}
              </p>
            )}
            
            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
              {frontmatter.author && (
                <div className="flex items-center">
                  <User className="w-4 h-4 mr-1" />
                  {frontmatter.author}
                </div>
              )}
              {formattedDate && (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formattedDate}
                </div>
              )}
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {readTime} min read
              </div>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-2 mb-6">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                disabled={isSharing}
                className="bg-transparent"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBookmark}
                className="bg-transparent"
              >
                <Bookmark className={`w-4 h-4 mr-2 ${bookmarked ? 'fill-current' : ''}`} />
                {bookmarked ? 'Saved' : 'Save'}
              </Button>
            </div>
            
            {/* Tags */}
            {frontmatter.tags && frontmatter.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {frontmatter.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    <Tag className="w-3 h-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </header>
          
          {/* Featured Image */}
          {frontmatter.featuredImage && (
            <div className="mb-8 rounded-lg overflow-hidden">
              <img
                src={frontmatter.featuredImage}
                alt={frontmatter.title}
                className="w-full h-auto"
              />
            </div>
          )}
          
          {/* MDX Content */}
          <div className="prose prose-lg max-w-none">
            <MDXWithGlossary content={content} components={mdxComponents} />
          </div>
          
          {/* Related Articles */}
          {relatedArticles.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Articles
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedArticles.map((article) => (
                  <Link key={article.slug} href={`/${article.slug}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <div className="p-6">
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="w-4 h-4 mr-1" />
                          {article.readTime} min read
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
        
        {/* Sidebar */}
        <aside className="lg:col-span-1">
          {/* Table of Contents */}
          {toc.length > 0 && (
            <Card className="mb-6 sticky top-4">
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Table of Contents
                </h3>
                <ScrollArea className="h-[400px]">
                  <nav className="space-y-2">
                    {toc.map((item) => (
                      <a
                        key={item.id}
                        href={`#${item.id}`}
                        className={`block text-sm hover:text-primary transition-colors
                          ${item.level === 2 ? 'pl-4' : ''}
                          ${item.level === 3 ? 'pl-8' : ''}
                          ${item.level > 3 ? 'pl-12' : ''}
                        `}
                      >
                        {item.title}
                      </a>
                    ))}
                  </nav>
                </ScrollArea>
              </div>
            </Card>
          )}
          
          {/* Call to Action */}
          <Card className="mb-6">
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Need Professional Help?
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Find qualified dental professionals in your area.
              </p>
              <Link href="/find-dentist">
                <Button className="w-full">
                  Find a Dentist
                </Button>
              </Link>
            </div>
          </Card>
          
          {/* Newsletter */}
          <Card>
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Stay Informed
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Get the latest dental health tips and news delivered to your inbox.
              </p>
              <Link href="/newsletter">
                <Button variant="outline" className="w-full bg-transparent">
                  Subscribe
                </Button>
              </Link>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  )
}