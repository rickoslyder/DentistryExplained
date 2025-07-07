'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface DiffViewerProps {
  oldContent: string
  newContent: string
  oldTitle?: string
  newTitle?: string
  className?: string
}

export function DiffViewer({
  oldContent,
  newContent,
  oldTitle = 'Previous',
  newTitle = 'Current',
  className
}: DiffViewerProps) {
  const [viewMode, setViewMode] = useState<'side-by-side' | 'unified'>('side-by-side')

  // Simple line-by-line diff
  const oldLines = oldContent.split('\n')
  const newLines = newContent.split('\n')
  
  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">View mode:</span>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'side-by-side' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('side-by-side')}
            >
              Side by side
            </Button>
            <Button
              variant={viewMode === 'unified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('unified')}
            >
              Unified
            </Button>
          </div>
        </div>
      </div>

      {viewMode === 'side-by-side' ? (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">{oldTitle}</h3>
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
              {oldContent}
            </pre>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">{newTitle}</h3>
            <pre className="text-sm whitespace-pre-wrap overflow-x-auto">
              {newContent}
            </pre>
          </Card>
        </div>
      ) : (
        <Card className="p-4">
          <div className="space-y-2">
            <div className="border-l-4 border-red-500 pl-4 bg-red-50 dark:bg-red-950/20">
              <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">{oldTitle}</h3>
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto text-red-700 dark:text-red-400">
                {oldContent}
              </pre>
            </div>
            <div className="border-l-4 border-green-500 pl-4 bg-green-50 dark:bg-green-950/20">
              <h3 className="font-semibold text-green-700 dark:text-green-400 mb-2">{newTitle}</h3>
              <pre className="text-sm whitespace-pre-wrap overflow-x-auto text-green-700 dark:text-green-400">
                {newContent}
              </pre>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}