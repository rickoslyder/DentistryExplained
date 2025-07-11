'use client'

import { useRef, useState, useCallback, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
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
  ChevronDown,
  CheckCircle2,
  XCircle,
  Lightbulb,
  AlertTriangle,
  Stethoscope
} from 'lucide-react'
import { toast } from 'sonner'
import MDXContent from '@/components/mdx-content'
import { processMDXContent } from '@/lib/mdx-utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

type ViewMode = 'editor' | 'preview' | 'split'
type DeviceType = 'desktop' | 'tablet' | 'mobile'

interface MDXEditorAdvancedProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export default function MDXEditorAdvanced({ 
  value, 
  onChange, 
  className,
  placeholder = "Write your article in MDX format..."
}: MDXEditorAdvancedProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const [deviceType, setDeviceType] = useState<DeviceType>('desktop')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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

  // Process MDX content for preview
  const processedContent = useMemo(() => {
    try {
      setPreviewError(null)
      const { content, frontmatter, readTime } = processMDXContent(value)
      return { content, frontmatter, readTime, error: null }
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to process MDX')
      return { content: null, frontmatter: {}, readTime: 0, error }
    }
  }, [value])

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

  // Insert text at cursor position
  const insertAtCursor = useCallback((text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + text + value.substring(end)
    
    onChange(newValue)
    
    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
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

  // Alert types configuration
  const alertTypes = [
    { value: 'info', label: 'Info', icon: Info, description: 'General information' },
    { value: 'warning', label: 'Warning', icon: AlertTriangle, description: 'Important caution' },
    { value: 'success', label: 'Success', icon: CheckCircle2, description: 'Positive outcome' },
    { value: 'error', label: 'Error', icon: XCircle, description: 'Error or danger' },
    { value: 'tip', label: 'Tip', icon: Lightbulb, description: 'Helpful suggestion' },
    { value: 'note', label: 'Note', icon: FileText, description: 'Additional context' },
    { value: 'emergency', label: 'Emergency', icon: AlertCircle, description: 'Urgent medical attention' },
    { value: 'clinical-note', label: 'Clinical Note', icon: Stethoscope, description: 'Professional guidance' }
  ]

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
    },
    {
      name: 'Pain Scale',
      icon: <AlertCircle className="w-4 h-4" />,
      template: `
<SymptomSeverityScale 
  title="Rate Your Pain"
  description="Click on the scale to indicate your current level of pain"
  showGuide={true}
/>
`
    },
    {
      name: 'Treatment Compare',
      icon: <TableIcon className="w-4 h-4" />,
      template: `
<TreatmentComparisonTable 
  treatments={[
    {
      name: "Filling",
      duration: "30-60 min",
      cost: "£50-300",
      successRate: "95%",
      nhsAvailable: true,
      pros: ["Quick procedure", "Preserves tooth", "Long lasting"],
      cons: ["May need replacement", "Temporary sensitivity"],
      painLevel: "low",
      recoveryTime: "1-2 days"
    },
    {
      name: "Crown",
      duration: "2 visits",
      cost: "£300-800",
      successRate: "90%",
      nhsAvailable: true,
      pros: ["Very durable", "Natural appearance", "Protects tooth"],
      cons: ["More expensive", "Requires tooth reduction"],
      painLevel: "medium",
      recoveryTime: "1 week"
    }
  ]}
/>
`
    },
    {
      name: 'Tooth Chart',
      icon: <FileText className="w-4 h-4" />,
      template: `
<InteractiveToothChart 
  title="Your Dental Chart"
  teeth={[
    { id: 16, condition: "filling" },
    { id: 25, condition: "crown" },
    { id: 31, condition: "missing" }
  ]}
  showLegend={true}
/>
`
    }
  ]

  // Function to insert alert with type
  const insertAlert = (type: string) => {
    const template = `\n<Alert type="${type}">\n  Your alert message here\n</Alert>\n`
    insertAtCursor(template)
  }

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
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const replacement = before + selectedText + after
    const newValue = value.substring(0, start) + replacement + value.substring(end)
    
    onChange(newValue)
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const EditorView = () => (
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
          >
            Code Block
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={() => insertAtCursor('| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |')}
          >
            Table
          </Button>
        </div>
      </div>
      
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onSelectionChange={(e) => setCursorPosition(e.currentTarget.selectionStart)}
        className="flex-1 rounded-none border-0 p-4 font-mono text-sm resize-none focus-visible:ring-0"
        placeholder={placeholder}
      />
      
      {/* Status bar */}
      <div className="border-t bg-gray-50 px-4 py-1 text-xs text-gray-600">
        Line {value.substring(0, cursorPosition).split('\n').length} • 
        Column {cursorPosition - value.lastIndexOf('\n', cursorPosition - 1)} • 
        {value.length} characters
      </div>
    </div>
  )

  const PreviewView = () => (
    <div className="h-full overflow-auto p-4">
      {previewError ? (
        <Alert variant="destructive">
          <AlertDescription>
            <strong>Preview Error:</strong> {previewError}
          </AlertDescription>
        </Alert>
      ) : (
        <div className={cn("mx-auto transition-all", getDeviceWidth())}>
          <div className="prose prose-gray dark:prose-invert max-w-none">
            {processedContent.content && (
              <MDXContent content={processedContent.content} />
            )}
          </div>
        </div>
      )}
    </div>
  )

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
            >
              <Code className="w-4 h-4 mr-2" />
              Editor
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'split' ? 'default' : 'outline'}
              onClick={() => setViewMode('split')}
            >
              <Split className="w-4 h-4 mr-2" />
              Split
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'preview' ? 'default' : 'outline'}
              onClick={() => setViewMode('preview')}
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
                >
                  <Monitor className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceType === 'tablet' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('tablet')}
                  title="Tablet view"
                >
                  <Tablet className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={deviceType === 'mobile' ? 'default' : 'outline'}
                  onClick={() => setDeviceType('mobile')}
                  title="Mobile view"
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
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleLoadDraft}
              title="Load draft from browser"
            >
              <Upload className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsFullscreen(!isFullscreen)}
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
            
            {/* Alert Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span className="ml-2">Alert</span>
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Select Alert Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alertTypes.map((alertType) => (
                  <DropdownMenuItem
                    key={alertType.value}
                    onClick={() => insertAlert(alertType.value)}
                    className="cursor-pointer"
                  >
                    <div className="flex items-start gap-3 py-1">
                      <alertType.icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="font-medium">{alertType.label}</div>
                        <div className="text-xs text-muted-foreground">{alertType.description}</div>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Other Components */}
            {componentTemplates.map((component) => (
              <Button
                key={component.name}
                size="sm"
                variant="outline"
                className="h-8"
                onClick={() => insertAtCursor(component.template)}
              >
                {component.icon}
                <span className="ml-2">{component.name}</span>
              </Button>
            ))}
          </div>
        </div>
      )}
      
      {/* Content area */}
      <div className={cn(
        "overflow-hidden",
        isFullscreen ? "h-[calc(100vh-160px)]" : "h-[600px]"
      )}>
        {viewMode === 'editor' && <EditorView />}
        
        {viewMode === 'preview' && <PreviewView />}
        
        {viewMode === 'split' && (
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={50} minSize={30}>
              <EditorView />
            </ResizablePanel>
            
            <ResizableHandle withHandle />
            
            <ResizablePanel defaultSize={50} minSize={30}>
              <PreviewView />
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
            {processedContent.readTime > 0 && (
              <span>Read time: {processedContent.readTime} min</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {localStorage.getItem('article-draft-timestamp') && (
              <span className="text-xs">
                Auto-saved: {new Date(localStorage.getItem('article-draft-timestamp')!).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}