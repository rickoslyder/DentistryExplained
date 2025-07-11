'use client'

import React, { useRef, useState, useCallback, useMemo, useEffect, memo } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { 
  Eye, 
  Code, 
  Split, 
  Monitor,
  Smartphone,
  Tablet,
  Save,
  Upload,
  Maximize2,
  Minimize2,
  FileText,
  AlertCircle,
  List,
  Table as TableIcon,
  DollarSign,
  Info,
  Clock,
  Settings2
} from 'lucide-react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { serialize } from 'next-mdx-remote/serialize'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import remarkGfm from 'remark-gfm'
import matter from 'gray-matter'
import { useDebouncedCallback } from 'use-debounce'

// Import MDX components from central registry
import { MDX_COMPONENTS } from '@/lib/mdx-components-registry'
import Link from 'next/link'
import Image from 'next/image'
import { htmlToMdx, extractTextFromHtml } from '@/lib/html-to-mdx'

type ViewMode = 'editor' | 'preview' | 'split'
type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface MDXEditorAdvancedProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  onOpenPropertyEditor?: () => void
}

// Define MDX components separately to avoid recreation
// Use components from central registry and add base MDX overrides
const mdxComponents = {
  // Base MDX element overrides
  // Headings
  h1: ({ children, ...props }: any) => (
    <h1 className="text-3xl font-bold mt-8 mb-4" {...props}>{children}</h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2 className="text-2xl font-semibold mt-6 mb-3" {...props}>{children}</h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3 className="text-xl font-medium mt-4 mb-2" {...props}>{children}</h3>
  ),
  
  // Paragraphs and text
  p: ({ children, ...props }: any) => (
    <p className="mb-4 leading-7" {...props}>{children}</p>
  ),
  strong: ({ children, ...props }: any) => (
    <strong className="font-semibold" {...props}>{children}</strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic" {...props}>{children}</em>
  ),
  
  // Links
  a: ({ href, children, ...props }: any) => {
    const isInternal = href?.startsWith('/') || href?.startsWith('#')
    return isInternal ? (
      <Link href={href} className="text-primary underline-offset-4 hover:underline" {...props}>
        {children}
      </Link>
    ) : (
      <a 
        href={href} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-primary underline-offset-4 hover:underline"
        {...props}
      >
        {children}
      </a>
    )
  },
  
  // Lists
  ul: ({ children, ...props }: any) => (
    <ul className="list-disc list-inside mb-4 space-y-1" {...props}>{children}</ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol className="list-decimal list-inside mb-4 space-y-1" {...props}>{children}</ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="ml-4" {...props}>{children}</li>
  ),
  
  // Code
  code: ({ children, ...props }: any) => (
    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  ),
  pre: ({ children, ...props }: any) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4" {...props}>
      {children}
    </pre>
  ),
  
  // Blockquote
  blockquote: ({ children, ...props }: any) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic" {...props}>
      {children}
    </blockquote>
  ),
  
  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto mb-4">
      <table className="min-w-full divide-y divide-border" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }: any) => (
    <th className="px-4 py-2 text-left font-medium" {...props}>{children}</th>
  ),
  td: ({ children, ...props }: any) => (
    <td className="px-4 py-2 border-t" {...props}>{children}</td>
  ),
  
  // Images
  img: ({ src, alt, ...props }: any) => (
    <div className="my-4">
      <Image
        src={src}
        alt={alt || ''}
        width={800}
        height={400}
        className="rounded-lg w-full h-auto"
        {...props}
      />
    </div>
  ),
  
  // Horizontal rule
  hr: (props: any) => <Separator className="my-8" {...props} />,
  
  
  // Merge with all components from central registry
  ...MDX_COMPONENTS
}

// Editor View Component - memoized to prevent re-renders
const EditorView = memo(({ 
  value, 
  onChange, 
  textareaRef, 
  cursorPositionRef,
  insertAtCursor,
  placeholder
}: {
  value: string
  onChange: (value: string) => void
  textareaRef: React.RefObject<HTMLTextAreaElement>
  cursorPositionRef: React.MutableRefObject<number>
  insertAtCursor: (text: string) => void
  placeholder?: string
}) => {
  // Markdown shortcuts
  const markdownShortcuts = [
    { label: 'Bold', before: '**', after: '**' },
    { label: 'Italic', before: '*', after: '*' },
    { label: 'Link', before: '[', after: '](url)' },
    { label: 'Code', before: '`', after: '`' },
    { label: 'H1', before: '# ', after: '' },
    { label: 'H2', before: '## ', after: '' },
    { label: 'H3', before: '### ', after: '' },
    { label: 'Quote', before: '> ', after: '' },
    { label: 'List', before: '- ', after: '' },
  ]

  const applyMarkdown = (before: string, after: string) => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    textarea.focus()
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = before + selectedText + after
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    
    onChange(newValue)
    
    // Set cursor position
    setTimeout(() => {
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      cursorPositionRef.current = newCursorPos
    }, 0)
  }

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    // Get HTML data from clipboard
    const html = e.clipboardData.getData('text/html')
    
    if (html) {
      e.preventDefault() // Prevent default paste
      
      // Convert HTML to MDX
      const mdxContent = htmlToMdx(html)
      
      // Insert the converted content
      insertAtCursor(mdxContent)
      
      // Show notification about conversion
      const textPreview = extractTextFromHtml(html).slice(0, 50)
      toast.success(`Converted content from rich text format`, {
        description: textPreview.length > 47 ? `${textPreview}...` : textPreview
      })
    }
    // If no HTML, let default paste behavior handle plain text
  }, [insertAtCursor])

  return (
    <div className="h-full flex flex-col">
      {/* Markdown toolbar */}
      <div className="border-b bg-gray-50 p-2">
        <div className="flex items-center gap-1 flex-wrap">
          {markdownShortcuts.map((shortcut) => (
            <Button
              key={shortcut.label}
              size="sm"
              variant="ghost"
              className="h-7 px-2"
              onClick={() => applyMarkdown(shortcut.before, shortcut.after)}
              type="button"
            >
              {shortcut.label}
            </Button>
          ))}
          <div className="border-l mx-2 h-6" />
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => insertAtCursor('```\n\n```')}
            type="button"
          >
            Code Block
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => insertAtCursor('| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |')}
            type="button"
          >
            Table
          </Button>
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          cursorPositionRef.current = e.target.selectionStart
        }}
        onSelect={(e) => {
          cursorPositionRef.current = e.currentTarget.selectionStart
        }}
        onPaste={handlePaste}
        className="flex-1 rounded-none border-0 p-4 font-mono text-sm resize-none focus-visible:ring-0"
        placeholder={placeholder}
      />
      
      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-1 text-xs text-gray-600">
        Line {value.substring(0, cursorPositionRef.current).split('\n').length} • 
        Column {cursorPositionRef.current - value.lastIndexOf('\n', cursorPositionRef.current - 1)} • 
        {value.length} characters
      </div>
    </div>
  )
})

EditorView.displayName = 'EditorView'

// Preview View Component - memoized to prevent re-renders
const PreviewView = memo(({ 
  serializedContent, 
  error,
  deviceType 
}: {
  serializedContent: MDXRemoteSerializeResult | null
  error: string | null
  deviceType: DeviceType
}) => {
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

  return (
    <div className="h-full overflow-auto p-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Preview Error:</strong> {error}
          </AlertDescription>
        </Alert>
      ) : serializedContent ? (
        <div className={cn("mx-auto transition-all", getDeviceWidth())}>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            <MDXRemote {...serializedContent} components={mdxComponents} />
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-500">
          Start typing to see the preview...
        </div>
      )}
    </div>
  )
})

PreviewView.displayName = 'PreviewView'

export default function MDXEditorAdvanced({ 
  value, 
  onChange, 
  className,
  placeholder = "Write your article in MDX format...",
  onOpenPropertyEditor
}: MDXEditorAdvancedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [serializedContent, setSerializedContent] = useState<MDXRemoteSerializeResult | null>(null)
  const [previewError, setPreviewError] = useState<string | null>(null)
  
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const cursorPositionRef = useRef(0)

  // Debounced MDX serialization
  const debouncedSerialize = useDebouncedCallback(
    async (content: string) => {
      try {
        setPreviewError(null)
        
        // Parse frontmatter
        const { content: mdxContent } = matter(content)
        
        // Serialize MDX
        const serialized = await serialize(mdxContent, {
          mdxOptions: {
            remarkPlugins: [remarkGfm],
            development: process.env.NODE_ENV === 'development'
          }
        })
        
        setSerializedContent(serialized)
      } catch (error) {
        setPreviewError(error instanceof Error ? error.message : 'Failed to process MDX')
        setSerializedContent(null)
      }
    },
    500 // 500ms debounce
  )

  // Update preview when value changes
  useEffect(() => {
    if (value) {
      debouncedSerialize(value)
    } else {
      setSerializedContent(null)
    }
  }, [value, debouncedSerialize])

  // Auto-save to localStorage every 30 seconds
  useEffect(() => {
    const autoSaveInterval = setInterval(() => {
      if (value) {
        localStorage.setItem('article-draft', value)
        localStorage.setItem('article-draft-timestamp', new Date().toISOString())
      }
    }, 30000) // 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [value])

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    textarea.focus()
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + text + value.substring(end)
    
    onChange(newValue)
    
    // Set cursor position after insertion
    setTimeout(() => {
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      cursorPositionRef.current = newCursorPos
    }, 0)
  }, [value, onChange])

  // Handle save to localStorage
  const handleSaveDraft = () => {
    localStorage.setItem('article-draft', value)
    localStorage.setItem('article-draft-timestamp', new Date().toISOString())
    toast.success('Draft saved to browser')
  }

  // Handle load from localStorage
  const handleLoadDraft = () => {
    const draft = localStorage.getItem('article-draft')
    const timestamp = localStorage.getItem('article-draft-timestamp')
    
    if (draft) {
      onChange(draft)
      const date = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown'
      toast.success(`Draft loaded from ${date}`)
    } else {
      toast.error('No saved draft found')
    }
  }

  // Dental component templates
  const componentTemplates = [
    {
      name: 'Tooth Diagram',
      icon: <FileText className="w-4 h-4" />,
      template: '\n<ToothDiagram teeth={[1, 2, 3]} />\n'
    },
    {
      name: 'Timeline',
      icon: <Clock className="w-4 h-4" />,
      template: `
<Timeline>
  <TimelineItem date="Day 1" title="Initial Consultation">
    Description of the first step
  </TimelineItem>
  <TimelineItem date="Day 7" title="Follow-up">
    Description of the follow-up
  </TimelineItem>
</Timeline>
`
    },
    {
      name: 'Alert',
      icon: <AlertCircle className="w-4 h-4" />,
      template: '\n<Alert type="info">\n  Your alert message here\n</Alert>\n'
    },
    {
      name: 'Cost Table',
      icon: <DollarSign className="w-4 h-4" />,
      template: `
<CostTable costs={[
  { item: "Consultation", cost: "£50-100", nhs: true },
  { item: "X-Ray", cost: "£25-50", nhs: true },
  { item: "Treatment", cost: "£200-500", nhs: false }
]} />
`
    },
    {
      name: 'FAQ',
      icon: <Info className="w-4 h-4" />,
      template: `
<FAQ question="Your question here?">
  Your answer here
</FAQ>
`
    },
    {
      name: 'Procedure Steps',
      icon: <List className="w-4 h-4" />,
      template: `
<ProcedureSteps>
  <li>First step of the procedure</li>
  <li>Second step of the procedure</li>
  <li>Third step of the procedure</li>
</ProcedureSteps>
`
    }
  ]

  const autoSaveTimestamp = typeof window !== 'undefined' ? localStorage.getItem('article-draft-timestamp') : null

  return (
    <div className={cn(
      "border rounded-lg overflow-hidden bg-background",
      isFullscreen && "fixed inset-0 z-50",
      className
    )}>
      {/* Main toolbar */}
      <div className="border-b bg-gray-50 p-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'editor' ? 'default' : 'outline'}
              onClick={() => setViewMode('editor')}
              type="button"
            >
              <Code className="w-4 h-4 mr-2" />
              Editor
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'split' ? 'default' : 'outline'}
              onClick={() => setViewMode('split')}
              type="button"
            >
              <Split className="w-4 h-4 mr-2" />
              Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setViewMode('preview')}
              type="button"
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </Button>
            
            <div className="border-l mx-2 h-6" />
            
            {viewMode !== 'editor' && (
              <>
                <Button
                  size="sm"
                  variant={deviceType === 'desktop' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('desktop')}
                  title="Desktop view"
                  type="button"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceType === 'tablet' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('tablet')}
                  title="Tablet view"
                  type="button"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceType === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('mobile')}
                  title="Mobile view"
                  type="button"
                >
                  <Smartphone className="w-4 h-4" />
                </Button>
                
                <div className="border-l mx-2 h-6" />
              </>
            )}
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleSaveDraft}
              title="Save draft to browser"
              type="button"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadDraft}
              title="Load draft from browser"
              type="button"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      
      {/* Components toolbar */}
      {viewMode !== 'preview' && (
        <div className="border-b bg-gray-50 p-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Insert:</span>
            {componentTemplates.map((component) => (
              <Button
                key={component.name}
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => insertAtCursor(component.template)}
                type="button"
              >
                {component.icon}
                <span className="ml-2">{component.name}</span>
              </Button>
            ))}
            {onOpenPropertyEditor && (
              <>
                <div className="border-l mx-2 h-6" />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={onOpenPropertyEditor}
                  type="button"
                >
                  <Settings2 className="w-4 h-4" />
                  <span className="ml-2">Component Editor</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Content area */}
      <div className={cn(
        "overflow-hidden",
        isFullscreen ? "h-[calc(100vh-160px)]" : "h-[600px]"
      )}>
        {viewMode === 'editor' && (
          <EditorView
            value={value}
            onChange={onChange}
            textareaRef={textareaRef}
            cursorPositionRef={cursorPositionRef}
            insertAtCursor={insertAtCursor}
            placeholder={placeholder}
          />
        )}
        
        {viewMode === 'preview' && (
          <PreviewView
            serializedContent={serializedContent}
            error={previewError}
            deviceType={deviceType}
          />
        )}
        
        {viewMode === 'split' && (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <EditorView
                value={value}
                onChange={onChange}
                textareaRef={textareaRef}
                cursorPositionRef={cursorPositionRef}
                insertAtCursor={insertAtCursor}
                placeholder={placeholder}
              />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <PreviewView
                serializedContent={serializedContent}
                error={previewError}
                deviceType={deviceType}
              />
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
      
      {/* Global status bar */}
      <div className="border-t bg-gray-50 px-4 py-2 text-sm text-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span>Words: {value.split(/\s+/).filter(Boolean).length}</span>
            <span>Characters: {value.length}</span>
            {serializedContent && (
              <span>Read time: ~{Math.max(1, Math.round(value.split(/\s+/).length / 200))} min</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {autoSaveTimestamp && (
              <span className="text-xs">
                Auto-saved: {new Date(autoSaveTimestamp).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}