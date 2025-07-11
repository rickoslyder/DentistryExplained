'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { diffLines, diffWords, Change } from 'diff'
import { formatDistanceToNow } from 'date-fns'
import {
  FileText,
  Plus,
  Minus,
  GitBranch,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Code,
  Eye,
} from 'lucide-react'

interface Revision {
  id: string
  revision_number: number
  title: string
  content: string
  excerpt?: string
  status: string
  change_summary: string
  created_at: string
  author?: {
    name: string
    email: string
    image_url?: string
  }
}

interface MDXDiffViewerProps {
  revisions: Revision[]
  currentContent: string
  onRevert?: (revision: Revision) => void
}

export function MDXDiffViewer({ revisions, currentContent, onRevert }: MDXDiffViewerProps) {
  const [selectedRevision, setSelectedRevision] = useState<string | null>(
    revisions[0]?.id || null
  )
  const [viewMode, setViewMode] = useState<'side-by-side' | 'inline'>('inline')
  const [showFullDiff, setShowFullDiff] = useState(false)

  const selectedRev = revisions.find(r => r.id === selectedRevision)
  
  const diff = useMemo(() => {
    if (!selectedRev) return []
    
    const baseContent = selectedRev.content
    const compareContent = currentContent
    
    return diffLines(baseContent, compareContent, { ignoreWhitespace: false })
  }, [selectedRev, currentContent])

  const stats = useMemo(() => {
    let additions = 0
    let deletions = 0
    
    diff.forEach(part => {
      if (part.added) {
        additions += part.count || 0
      } else if (part.removed) {
        deletions += part.count || 0
      }
    })
    
    return { additions, deletions }
  }, [diff])

  const renderInlineDiff = () => {
    const visibleDiff = showFullDiff ? diff : diff.slice(0, 10)
    const hasMore = diff.length > 10
    
    return (
      <div className="space-y-2">
        {visibleDiff.map((part, index) => {
          const lines = part.value.split('\n').filter(line => line !== '')
          
          if (part.added) {
            return (
              <div key={index} className="space-y-1">
                {lines.map((line, lineIndex) => (
                  <div
                    key={`${index}-${lineIndex}`}
                    className="flex items-start gap-2 bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded"
                  >
                    <Plus className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <pre className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap flex-1">
                      {line}
                    </pre>
                  </div>
                ))}
              </div>
            )
          } else if (part.removed) {
            return (
              <div key={index} className="space-y-1">
                {lines.map((line, lineIndex) => (
                  <div
                    key={`${index}-${lineIndex}`}
                    className="flex items-start gap-2 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded"
                  >
                    <Minus className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <pre className="text-sm text-red-900 dark:text-red-100 whitespace-pre-wrap flex-1 line-through opacity-75">
                      {line}
                    </pre>
                  </div>
                ))}
              </div>
            )
          }
          
          return (
            <div key={index} className="space-y-1">
              {lines.map((line, lineIndex) => (
                <div
                  key={`${index}-${lineIndex}`}
                  className="flex items-start gap-2 px-2 py-1"
                >
                  <div className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap flex-1">
                    {line}
                  </pre>
                </div>
              ))}
            </div>
          )
        })}
        
        {hasMore && !showFullDiff && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullDiff(true)}
            className="w-full"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show {diff.length - 10} more changes
          </Button>
        )}
        
        {hasMore && showFullDiff && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullDiff(false)}
            className="w-full"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Show less
          </Button>
        )}
      </div>
    )
  }

  const renderSideBySideDiff = () => {
    const oldLines: string[] = []
    const newLines: string[] = []
    
    diff.forEach(part => {
      const lines = part.value.split('\n').filter(line => line !== '')
      
      if (part.removed) {
        oldLines.push(...lines)
        newLines.push(...new Array(lines.length).fill(''))
      } else if (part.added) {
        oldLines.push(...new Array(lines.length).fill(''))
        newLines.push(...lines)
      } else {
        oldLines.push(...lines)
        newLines.push(...lines)
      }
    })
    
    const maxLines = showFullDiff ? oldLines.length : Math.min(20, oldLines.length)
    const hasMore = oldLines.length > 20
    
    return (
      <>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Revision {selectedRev?.revision_number}
            </div>
            {oldLines.slice(0, maxLines).map((line, index) => (
              <div
                key={index}
                className={`px-2 py-1 text-sm font-mono ${
                  line ? 'bg-red-50 dark:bg-red-950/20' : ''
                }`}
              >
                <pre className={`whitespace-pre-wrap ${
                  line ? 'text-red-900 dark:text-red-100' : 'text-transparent'
                }`}>
                  {line || '.'}
                </pre>
              </div>
            ))}
          </div>
          
          <div className="space-y-1">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Current Version
            </div>
            {newLines.slice(0, maxLines).map((line, index) => (
              <div
                key={index}
                className={`px-2 py-1 text-sm font-mono ${
                  line && !oldLines[index] ? 'bg-green-50 dark:bg-green-950/20' : ''
                }`}
              >
                <pre className={`whitespace-pre-wrap ${
                  line && !oldLines[index] ? 'text-green-900 dark:text-green-100' : 
                  line ? 'text-foreground' : 'text-transparent'
                }`}>
                  {line || '.'}
                </pre>
              </div>
            ))}
          </div>
        </div>
        
        {hasMore && !showFullDiff && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullDiff(true)}
            className="w-full mt-4"
          >
            <ChevronDown className="w-4 h-4 mr-2" />
            Show all changes
          </Button>
        )}
        
        {hasMore && showFullDiff && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFullDiff(false)}
            className="w-full mt-4"
          >
            <ChevronUp className="w-4 h-4 mr-2" />
            Show less
          </Button>
        )}
      </>
    )
  }

  if (revisions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Version History</CardTitle>
          <CardDescription>No previous versions available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No revision history yet</p>
            <p className="text-sm mt-2">Changes will appear here after saving</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Version History</CardTitle>
            <CardDescription>
              Compare changes across different versions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inline">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Inline View
                  </div>
                </SelectItem>
                <SelectItem value="side-by-side">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    Side by Side
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Revision selector */}
          <div className="space-y-2">
            <Label>Compare with revision:</Label>
            <Select
              value={selectedRevision}
              onValueChange={setSelectedRevision}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a revision" />
              </SelectTrigger>
              <SelectContent>
                {revisions.map(rev => (
                  <SelectItem key={rev.id} value={rev.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>
                        #{rev.revision_number} - {rev.change_summary}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        {formatDistanceToNow(new Date(rev.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Revision details */}
          {selectedRev && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={selectedRev.author?.image_url} />
                  <AvatarFallback>
                    {selectedRev.author?.name?.charAt(0) || <User className="h-4 w-4" />}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedRev.author?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(selectedRev.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  <Plus className="w-3 h-3 mr-1" />
                  {stats.additions}
                </Badge>
                <Badge variant="outline">
                  <Minus className="w-3 h-3 mr-1" />
                  {stats.deletions}
                </Badge>
                {onRevert && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRevert(selectedRev)}
                  >
                    Revert to this version
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Diff view */}
          <ScrollArea className="h-[500px] border rounded-lg p-4">
            {viewMode === 'inline' ? renderInlineDiff() : renderSideBySideDiff()}
          </ScrollArea>
        </div>
      </CardContent>
    </Card>
  )
}

// Add missing imports
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'