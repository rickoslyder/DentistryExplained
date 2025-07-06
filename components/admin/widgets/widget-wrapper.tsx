'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { MoreVertical, Settings, X, Maximize2, Minimize2 } from 'lucide-react'
import type { WidgetComponentProps } from '@/lib/widgets/types'

interface WidgetWrapperProps {
  title: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
  isEditing?: boolean
  onRemove?: () => void
  onSettings?: () => void
  onFullscreen?: () => void
  isFullscreen?: boolean
  isLoading?: boolean
  error?: Error | null
}

export function WidgetWrapper({
  title,
  children,
  className,
  headerAction,
  isEditing = false,
  onRemove,
  onSettings,
  onFullscreen,
  isFullscreen = false,
  isLoading = false,
  error = null,
}: WidgetWrapperProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <Card className={cn(
      'h-full flex flex-col',
      isEditing && 'ring-2 ring-primary ring-offset-2',
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {headerAction}
          {(onRemove || onSettings || onFullscreen) && (
            <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onSettings && (
                  <DropdownMenuItem onClick={onSettings}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                )}
                {onFullscreen && (
                  <DropdownMenuItem onClick={onFullscreen}>
                    {isFullscreen ? (
                      <>
                        <Minimize2 className="mr-2 h-4 w-4" />
                        Exit Fullscreen
                      </>
                    ) : (
                      <>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Fullscreen
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                {onRemove && isEditing && (
                  <DropdownMenuItem
                    onClick={onRemove}
                    className="text-destructive"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-sm text-muted-foreground">
              <p>Error loading widget</p>
              <p className="text-xs mt-1">{error.message}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </CardContent>
    </Card>
  )
}