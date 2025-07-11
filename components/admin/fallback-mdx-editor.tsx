'use client'

import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FallbackMDXEditorProps {
  value: string
  onChange: (value: string) => void
  error?: string
  className?: string
}

export function FallbackMDXEditor({
  value,
  onChange,
  error,
  className
}: FallbackMDXEditorProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Editor Error</AlertTitle>
          <AlertDescription>
            {error}
            <br />
            <span className="text-sm">
              You can continue editing in plain text mode below.
            </span>
          </AlertDescription>
        </Alert>
      )}
      
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/50 px-4 py-2 border-b">
          <p className="text-sm text-muted-foreground">
            Plain Text MDX Editor (Fallback Mode)
          </p>
        </div>
        
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[400px] font-mono text-sm rounded-none border-0 focus-visible:ring-0"
          placeholder="Enter your MDX content here..."
        />
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>
          <strong>Tips:</strong> You can use Markdown syntax and MDX components.
        </p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>Headers: # H1, ## H2, ### H3</li>
          <li>Bold: **text** | Italic: *text*</li>
          <li>Links: [text](url)</li>
          <li>Images: ![alt](url)</li>
          <li>MDX Components: &lt;Alert type="info"&gt;Content&lt;/Alert&gt;</li>
        </ul>
      </div>
    </div>
  )
}