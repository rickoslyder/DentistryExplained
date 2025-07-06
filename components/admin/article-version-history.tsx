'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Clock,
  RotateCcw,
  Eye,
  GitCompare,
  AlertCircle,
  CheckCircle2
} from 'lucide-react'
import { toast } from 'sonner'

interface Version {
  id: string
  revision_number: number
  title: string
  excerpt?: string
  status: string
  change_summary?: string
  created_at: string
  author: {
    id: string
    full_name?: string
    email?: string
    image_url?: string
  }
}

interface ArticleVersionHistoryProps {
  articleId: string
  currentVersion?: {
    title: string
    updated_at: string
  }
}

export function ArticleVersionHistory({ articleId, currentVersion }: ArticleVersionHistoryProps) {
  const router = useRouter()
  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null)
  const [compareVersions, setCompareVersions] = useState<[string, string] | null>(null)
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    fetchVersions()
  }, [articleId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/admin/articles/${articleId}/versions`)
      if (!response.ok) throw new Error('Failed to fetch versions')
      const data = await response.json()
      setVersions(data.versions || [])
    } catch (error) {
      toast.error('Failed to load version history')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!selectedVersion) return
    
    setRestoring(true)
    try {
      const response = await fetch(
        `/api/admin/articles/${articleId}/versions/${selectedVersion.id}/restore`,
        { method: 'POST' }
      )
      
      if (!response.ok) throw new Error('Failed to restore version')
      
      const data = await response.json()
      toast.success(data.message)
      setShowRestoreDialog(false)
      
      // Refresh the page to show restored content
      router.refresh()
      fetchVersions()
    } catch (error) {
      toast.error('Failed to restore version')
      console.error(error)
    } finally {
      setRestoring(false)
    }
  }

  const handleCompare = (versionId: string) => {
    if (!compareVersions) {
      setCompareVersions([versionId, ''])
    } else if (compareVersions[0] === versionId) {
      setCompareVersions(null)
    } else {
      setCompareVersions([compareVersions[0], versionId])
      // Navigate to comparison view
      router.push(
        `/admin/articles/${articleId}/versions/compare?from=${compareVersions[0]}&to=${versionId}`
      )
    }
  }

  const getAuthorDisplay = (author: Version['author']) => {
    const name = author.full_name || author.email || 'Unknown'
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
    
    return { name, initials, image: author.image_url }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>
            {versions.length} version{versions.length !== 1 ? 's' : ''} saved
          </CardDescription>
        </CardHeader>
        <CardContent>
          {versions.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No version history available yet. Versions are saved automatically when you update the article.
              </AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-4">
                {/* Current version indicator */}
                {currentVersion && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      Current Version
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Last updated {format(new Date(currentVersion.updated_at), 'PPp')}
                    </p>
                  </div>
                )}

                {/* Version list */}
                {versions.map((version) => {
                  const author = getAuthorDisplay(version.author)
                  const isComparing = compareVersions?.includes(version.id)
                  
                  return (
                    <div
                      key={version.id}
                      className={`p-4 rounded-lg border transition-colors ${
                        isComparing ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">
                              v{version.revision_number}
                            </Badge>
                            <div className="flex items-center gap-2">
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={author.image} />
                                <AvatarFallback className="text-xs">
                                  {author.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium">
                                {author.name}
                              </span>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {format(new Date(version.created_at), 'PP p')}
                            </span>
                          </div>
                          
                          {version.change_summary && (
                            <p className="text-sm text-muted-foreground mt-2">
                              {version.change_summary}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant={
                              version.status === 'published' ? 'default' :
                              version.status === 'draft' ? 'secondary' : 'outline'
                            }>
                              {version.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {version.title}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => 
                                    router.push(`/admin/articles/${articleId}/versions/${version.id}/preview`)
                                  }
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Preview this version</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant={isComparing ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => handleCompare(version.id)}
                                >
                                  <GitCompare className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {!compareVersions ? 'Compare with another version' :
                                 isComparing ? 'Cancel comparison' :
                                 'Compare with selected version'}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedVersion(version)
                                    setShowRestoreDialog(true)
                                  }}
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restore this version</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Restore confirmation dialog */}
      <Dialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Version</DialogTitle>
            <DialogDescription>
              Are you sure you want to restore to version {selectedVersion?.revision_number}?
              The current content will be saved as a new version before restoring.
            </DialogDescription>
          </DialogHeader>
          {selectedVersion && (
            <div className="space-y-2 py-4">
              <div className="text-sm">
                <span className="font-medium">Version:</span> {selectedVersion.revision_number}
              </div>
              <div className="text-sm">
                <span className="font-medium">Created:</span>{' '}
                {format(new Date(selectedVersion.created_at), 'PPp')}
              </div>
              <div className="text-sm">
                <span className="font-medium">Author:</span>{' '}
                {getAuthorDisplay(selectedVersion.author).name}
              </div>
              {selectedVersion.change_summary && (
                <div className="text-sm">
                  <span className="font-medium">Summary:</span>{' '}
                  {selectedVersion.change_summary}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
              disabled={restoring}
            >
              Cancel
            </Button>
            <Button onClick={handleRestore} disabled={restoring}>
              {restoring ? 'Restoring...' : 'Restore Version'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}