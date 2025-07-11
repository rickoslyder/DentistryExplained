'use client'

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

const alertVariants = cva(
  "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive:
          "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        success:
          "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-50 [&>svg]:text-green-600 dark:[&>svg]:text-green-400",
        warning:
          "bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-950 dark:border-yellow-800 dark:text-yellow-50 [&>svg]:text-yellow-600 dark:[&>svg]:text-yellow-400",
        info:
          "bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-50 [&>svg]:text-blue-600 dark:[&>svg]:text-blue-400",
        tip:
          "bg-purple-50 border-purple-200 text-purple-900 dark:bg-purple-950 dark:border-purple-800 dark:text-purple-50 [&>svg]:text-purple-600 dark:[&>svg]:text-purple-400",
        note:
          "bg-gray-50 border-gray-200 text-gray-900 dark:bg-gray-950 dark:border-gray-800 dark:text-gray-50 [&>svg]:text-gray-600 dark:[&>svg]:text-gray-400",
        emergency:
          "bg-red-50 border-red-300 text-red-900 dark:bg-red-950 dark:border-red-700 dark:text-red-50 [&>svg]:text-red-600 dark:[&>svg]:text-red-400 font-semibold",
        "clinical-note":
          "bg-teal-50 border-teal-200 text-teal-900 dark:bg-teal-950 dark:border-teal-800 dark:text-teal-50 [&>svg]:text-teal-600 dark:[&>svg]:text-teal-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface AlertEnhancedProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  collapsible?: boolean
  defaultCollapsed?: boolean
  timestamp?: Date | string
  timestampFormat?: 'relative' | 'absolute'
  onCollapsedChange?: (collapsed: boolean) => void
}

const AlertEnhanced = React.forwardRef<HTMLDivElement, AlertEnhancedProps>(
  ({ 
    className, 
    variant, 
    children,
    collapsible = false,
    defaultCollapsed = false,
    timestamp,
    timestampFormat = 'relative',
    onCollapsedChange,
    ...props 
  }, ref) => {
    const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed)
    const [mounted, setMounted] = React.useState(false)

    // Load collapsed state from localStorage
    React.useEffect(() => {
      setMounted(true)
      if (collapsible && props.id) {
        const savedState = localStorage.getItem(`alert-collapsed-${props.id}`)
        if (savedState !== null) {
          setIsCollapsed(savedState === 'true')
        }
      }
    }, [collapsible, props.id])

    // Save collapsed state to localStorage
    React.useEffect(() => {
      if (mounted && collapsible && props.id) {
        localStorage.setItem(`alert-collapsed-${props.id}`, String(isCollapsed))
      }
    }, [isCollapsed, collapsible, props.id, mounted])

    const handleToggleCollapse = () => {
      const newState = !isCollapsed
      setIsCollapsed(newState)
      onCollapsedChange?.(newState)
    }

    const formatTimestamp = (ts: Date | string) => {
      const date = typeof ts === 'string' ? new Date(ts) : ts
      
      if (timestampFormat === 'relative') {
        return formatDistanceToNow(date, { addSuffix: true })
      } else {
        return format(date, 'PPp')
      }
    }

    // Update timestamp periodically for relative format
    const [, forceUpdate] = React.useReducer(x => x + 1, 0)
    React.useEffect(() => {
      if (timestamp && timestampFormat === 'relative') {
        const interval = setInterval(() => {
          forceUpdate()
        }, 60000) // Update every minute
        
        return () => clearInterval(interval)
      }
    }, [timestamp, timestampFormat])

    const childrenArray = React.Children.toArray(children)
    const titleElement = childrenArray.find(
      child => React.isValidElement(child) && child.type === AlertTitle
    )
    const otherChildren = childrenArray.filter(
      child => !(React.isValidElement(child) && child.type === AlertTitle)
    )

    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        {titleElement}
        
        {(collapsible || timestamp) && (
          <div className="flex items-center justify-between mt-1 mb-2">
            {timestamp && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{formatTimestamp(timestamp)}</span>
              </div>
            )}
            
            {collapsible && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleToggleCollapse}
              >
                {isCollapsed ? (
                  <>
                    Show details
                    <ChevronDown className="ml-1 h-3 w-3" />
                  </>
                ) : (
                  <>
                    Hide details
                    <ChevronUp className="ml-1 h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}
        
        {(!collapsible || !isCollapsed) && (
          <div className={cn(
            collapsible && "animate-in slide-in-from-top-2 duration-200"
          )}>
            {otherChildren}
          </div>
        )}
      </div>
    )
  }
)
AlertEnhanced.displayName = "AlertEnhanced"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { AlertEnhanced, AlertTitle, AlertDescription }