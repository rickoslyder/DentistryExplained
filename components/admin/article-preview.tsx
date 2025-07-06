'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, 
  Eye, 
  Monitor, 
  Smartphone,
  Tablet,
  Info,
  Calendar,
  Clock,
  User,
  Tag,
  FileText,
  CheckCircle
} from 'lucide-react'
import { format } from 'date-fns'
import { processMDXContent } from '@/lib/mdx-utils'
import MDXContent from '@/components/mdx-content'
import { cn } from '@/lib/utils'

interface ArticlePreviewProps {
  article: {
    id: string
    title: string
    slug: string
    content: string
    excerpt?: string
    status: string
    tags?: string[]
    meta_title?: string
    meta_description?: string
    meta_keywords?: string[]
    is_featured: boolean
    allow_comments: boolean
    created_at: string
    updated_at: string
    published_at?: string
    scheduled_at?: string
    categories?: {
      id: string
      name: string
      slug: string
    }
  }
}

type DeviceType = 'desktop' | 'tablet' | 'mobile'

export default function ArticlePreview({ article }: ArticlePreviewProps) {
  const router = useRouter()
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [showMetadata, setShowMetadata] = useState(false)
  
  // Process MDX content
  const { content: processedContent, frontmatter, readTime } = processMDXContent(article.content)
  
  const getDeviceWidth = () => {
    switch (deviceType) {
      case 'mobile':
        return 'max-w-[375px]'
      case 'tablet':
        return 'max-w-[768px]'
      case 'desktop':
      default:
        return 'max-w-full'
    }
  }
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'success'
      case 'draft':
        return 'secondary'
      case 'archived':
        return 'outline'
      default:
        return 'default'
    }
  }
  
  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Article Preview</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowMetadata(!showMetadata)}
          >
            <Info className="h-4 w-4 mr-2" />
            {showMetadata ? 'Hide' : 'Show'} Metadata
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => router.push(`/admin/articles/${article.id}/edit`)}
          >
            Edit Article
          </Button>
        </div>
      </div>
      
      {/* Article Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{article.title}</CardTitle>
            <Badge variant={getStatusColor(article.status) as any}>
              {article.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Category:</span>
              <span>{article.categories?.name || 'Uncategorized'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Read time:</span>
              <span>{readTime} min</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Updated:</span>
              <span>{format(new Date(article.updated_at), 'MMM d, yyyy')}</span>
            </div>
          </div>
          
          {article.tags && article.tags.length > 0 && (
            <div className="flex items-center gap-2 mt-4">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          {article.scheduled_at && (
            <Alert className="mt-4">
              <Calendar className="h-4 w-4" />
              <AlertDescription>
                Scheduled for publication on {format(new Date(article.scheduled_at), 'MMMM d, yyyy \'at\' h:mm a')}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Metadata Preview */}
      {showMetadata && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">SEO Metadata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-1">Meta Title</p>
              <p className="text-sm text-muted-foreground">
                {article.meta_title || article.title}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1">Meta Description</p>
              <p className="text-sm text-muted-foreground">
                {article.meta_description || article.excerpt || 'No description provided'}
              </p>
            </div>
            {article.meta_keywords && article.meta_keywords.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-1">Meta Keywords</p>
                <div className="flex flex-wrap gap-2">
                  {article.meta_keywords.map((keyword) => (
                    <Badge key={keyword} variant="outline">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2">
                <CheckCircle className={cn(
                  "h-4 w-4",
                  article.is_featured ? "text-green-600" : "text-muted-foreground"
                )} />
                <span className="text-sm">
                  {article.is_featured ? 'Featured Article' : 'Not Featured'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className={cn(
                  "h-4 w-4",
                  article.allow_comments ? "text-green-600" : "text-muted-foreground"
                )} />
                <span className="text-sm">
                  {article.allow_comments ? 'Comments Enabled' : 'Comments Disabled'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Device Preview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Content Preview</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={deviceType === 'desktop' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceType('desktop')}
              >
                <Monitor className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceType === 'tablet' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceType('tablet')}
              >
                <Tablet className="h-4 w-4" />
              </Button>
              <Button
                variant={deviceType === 'mobile' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setDeviceType('mobile')}
              >
                <Smartphone className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "mx-auto transition-all duration-300 ease-in-out",
            getDeviceWidth()
          )}>
            {/* Article Header */}
            <div className="mb-8">
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {article.title}
              </h1>
              {article.excerpt && (
                <p className="text-lg text-muted-foreground mb-6">
                  {article.excerpt}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span>{article.categories?.name || 'Uncategorized'}</span>
                <span>•</span>
                <span>{readTime} min read</span>
                <span>•</span>
                <span>{format(new Date(article.updated_at), 'MMM d, yyyy')}</span>
              </div>
            </div>
            
            <Separator className="mb-8" />
            
            {/* Article Content */}
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <MDXContent content={processedContent} />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Articles
        </Button>
        <div className="flex items-center gap-2">
          <Link href={`/articles/${article.categories?.slug}/${article.slug}`} target="_blank">
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              View Live
            </Button>
          </Link>
          <Button
            onClick={() => router.push(`/admin/articles/${article.id}/edit`)}
          >
            <FileText className="h-4 w-4 mr-2" />
            Edit Article
          </Button>
        </div>
      </div>
    </div>
  )
}