'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  GitBranch,
  FileText,
  Tag,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'sonner'
import { diffWords, diffLines } from 'diff'

interface VersionInfo {
  id: string
  revision_number: number
  created_at: string
  author: {
    id: string
    full_name?: string
    email?: string
  }
  change_summary?: string
}

interface VersionComparison {
  from: VersionInfo
  to: VersionInfo
  changes: Record<string, { from: any; to: any }>
  hasChanges: boolean
}

interface VersionDiffViewerProps {
  articleId: string
}

export function VersionDiffViewer({ articleId }: VersionDiffViewerProps) {
  const searchParams = useSearchParams()
  const [comparison, setComparison] = useState<VersionComparison | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('content')
  
  const fromId = searchParams.get('from')
  const toId = searchParams.get('to')

  useEffect(() => {
    if (fromId && toId) {
      fetchComparison()
    }
  }, [fromId, toId, articleId])

  const fetchComparison = async () => {
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/versions/compare?from=${fromId}&to=${toId}`
      )
      if (!response.ok) throw new Error('Failed to fetch comparison')
      const data = await response.json()
      setComparison(data)
    } catch (error) {
      toast.error('Failed to load version comparison')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const renderDiff = (from: string, to: string, type: 'words' | 'lines' = 'words') => {
    const diff = type === 'words' ? diffWords(from || '', to || '') : diffLines(from || '', to || '')
    
    return (
      <div className="font-mono text-sm">
        {diff.map((part, index) => {
          if (part.added) {
            return (
              <span key={index} className="bg-green-100 text-green-800 dark:bg-green-800/30 dark:text-green-300">
                {part.value}
              </span>
            )
          }
          if (part.removed) {
            return (
              <span key={index} className="bg-red-100 text-red-800 dark:bg-red-800/30 dark:text-red-300 line-through">
                {part.value}
              </span>
            )
          }
          return <span key={index}>{part.value}</span>
        })}
      </div>
    )
  }

  const renderFieldDiff = (fieldName: string, change: { from: any; to: any }) => {
    // Special handling for different field types
    switch (fieldName) {
      case 'status':
        return (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-red-50">
              {change.from}
            </Badge>
            <span>→</span>
            <Badge variant="outline" className="bg-green-50">
              {change.to}
            </Badge>
          </div>
        )
      
      case 'is_featured':
      case 'allow_comments':
        return (
          <div className="flex items-center gap-2">
            <span className={change.from ? 'text-green-600' : 'text-gray-400'}>
              {change.from ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {change.from ? 'Yes' : 'No'}
            </span>
            <span>→</span>
            <span className={change.to ? 'text-green-600' : 'text-gray-400'}>
              {change.to ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {change.to ? 'Yes' : 'No'}
            </span>
          </div>
        )
      
      case 'tags':
      case 'meta_keywords':
        const fromArray = change.from || []
        const toArray = change.to || []
        const removed = fromArray.filter((item: string) => !toArray.includes(item))
        const added = toArray.filter((item: string) => !fromArray.includes(item))
        
        return (
          <div className="space-y-2">
            {removed.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-red-600">Removed:</span>
                {removed.map((item: string) => (
                  <Badge key={item} variant="outline" className="bg-red-50 text-red-700">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
            {added.length > 0 && (
              <div className="flex flex-wrap gap-1">
                <span className="text-sm text-green-600">Added:</span>
                {added.map((item: string) => (
                  <Badge key={item} variant="outline" className="bg-green-50 text-green-700">
                    {item}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )
      
      default:
        if (typeof change.from === 'string' && typeof change.to === 'string') {
          return renderDiff(change.from, change.to)
        }
        return (
          <div className="space-y-2">
            <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
              <span className="text-xs font-medium text-red-600">From:</span>
              <div className="mt-1">{JSON.stringify(change.from, null, 2)}</div>
            </div>
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
              <span className="text-xs font-medium text-green-600">To:</span>
              <div className="mt-1">{JSON.stringify(change.to, null, 2)}</div>
            </div>
          </div>
        )
    }
  }

  const getAuthorDisplay = (author: VersionInfo['author']) => {
    const name = author.full_name || author.email || 'Unknown'
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return { name, initials }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading comparison...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!comparison) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No comparison data available. Please select two versions to compare.
        </AlertDescription>
      </Alert>
    )
  }

  const contentChanges = ['title', 'content', 'excerpt']
  const metadataChanges = ['category_id', 'status', 'tags', 'is_featured', 'allow_comments', 'featured_image']
  const seoChanges = ['meta_title', 'meta_description', 'meta_keywords']

  const hasContentChanges = contentChanges.some(key => key in comparison.changes)
  const hasMetadataChanges = metadataChanges.some(key => key in comparison.changes)
  const hasSeoChanges = seoChanges.some(key => key in comparison.changes)

  return (
    <div className="space-y-6">
      {/* Version info cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">v{comparison.from.revision_number}</Badge>
              <span className="text-sm text-muted-foreground">From</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {getAuthorDisplay(comparison.from.author).initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{getAuthorDisplay(comparison.from.author).name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(comparison.from.created_at), 'PPp')}
              </p>
              {comparison.from.change_summary && (
                <p className="text-sm italic">{comparison.from.change_summary}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Badge variant="outline">v{comparison.to.revision_number}</Badge>
              <span className="text-sm text-muted-foreground">To</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs">
                    {getAuthorDisplay(comparison.to.author).initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{getAuthorDisplay(comparison.to.author).name}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {format(new Date(comparison.to.created_at), 'PPp')}
              </p>
              {comparison.to.change_summary && (
                <p className="text-sm italic">{comparison.to.change_summary}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Changes */}
      {!comparison.hasChanges ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No changes detected between these versions.
          </AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Changes</CardTitle>
            <CardDescription>
              {Object.keys(comparison.changes).length} field{Object.keys(comparison.changes).length !== 1 ? 's' : ''} changed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content" disabled={!hasContentChanges}>
                  <FileText className="w-4 h-4 mr-2" />
                  Content {hasContentChanges && `(${contentChanges.filter(k => k in comparison.changes).length})`}
                </TabsTrigger>
                <TabsTrigger value="metadata" disabled={!hasMetadataChanges}>
                  <Tag className="w-4 h-4 mr-2" />
                  Metadata {hasMetadataChanges && `(${metadataChanges.filter(k => k in comparison.changes).length})`}
                </TabsTrigger>
                <TabsTrigger value="seo" disabled={!hasSeoChanges}>
                  <Settings className="w-4 h-4 mr-2" />
                  SEO {hasSeoChanges && `(${seoChanges.filter(k => k in comparison.changes).length})`}
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[600px] mt-4">
                <TabsContent value="content" className="space-y-6">
                  {contentChanges.map(key => {
                    if (!(key in comparison.changes)) return null
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="font-medium capitalize">{key.replace('_', ' ')}</h4>
                        {key === 'content' ? (
                          <div className="border rounded-lg p-4 bg-muted/20">
                            {renderDiff(
                              comparison.changes[key].from,
                              comparison.changes[key].to,
                              'lines'
                            )}
                          </div>
                        ) : (
                          renderFieldDiff(key, comparison.changes[key])
                        )}
                      </div>
                    )
                  })}
                </TabsContent>

                <TabsContent value="metadata" className="space-y-6">
                  {metadataChanges.map(key => {
                    if (!(key in comparison.changes)) return null
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="font-medium capitalize">{key.replace('_', ' ')}</h4>
                        {renderFieldDiff(key, comparison.changes[key])}
                      </div>
                    )
                  })}
                </TabsContent>

                <TabsContent value="seo" className="space-y-6">
                  {seoChanges.map(key => {
                    if (!(key in comparison.changes)) return null
                    return (
                      <div key={key} className="space-y-2">
                        <h4 className="font-medium capitalize">{key.replace('_', ' ')}</h4>
                        {renderFieldDiff(key, comparison.changes[key])}
                      </div>
                    )
                  })}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}