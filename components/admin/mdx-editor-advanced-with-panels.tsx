'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Brain, 
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose,
  Info
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import type { MedicalReference } from '@/lib/doi-validator'

// Dynamically import components to avoid SSR issues
const MDXEditorAdvanced = dynamic(() => import('@/components/admin/mdx-editor-advanced-v2'), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

const MDXSmartTemplatesPanel = dynamic(() => 
  import('@/components/admin/mdx-smart-templates-panel').then(mod => ({ 
    default: mod.MDXSmartTemplatesPanel 
  })), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

const MDXAISuggestionsPanel = dynamic(() => 
  import('@/components/admin/mdx-ai-suggestions-panel').then(mod => ({ 
    default: mod.MDXAISuggestionsPanel 
  })), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

interface MDXEditorAdvancedWithPanelsProps {
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
  references?: MedicalReference[]
  onReferencesChange?: (references: MedicalReference[]) => void
}

function MDXEditorAdvancedWithPanels({
  value,
  onChange,
  className,
  placeholder,
  references = [],
  onReferencesChange,
}: MDXEditorAdvancedWithPanelsProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined)
  const [activeLeftTab, setActiveLeftTab] = useState<'templates' | 'properties' | 'snippets'>('templates')
  const [leftPanelSize, setLeftPanelSize] = useState(25)
  const [rightPanelSize, setRightPanelSize] = useState(25)
  const [isAnimating, setIsAnimating] = useState(false)
  
  // Load panel states and sizes from localStorage
  useEffect(() => {
    const savedLeftPanel = localStorage.getItem('mdx-editor-left-panel')
    const savedRightPanel = localStorage.getItem('mdx-editor-right-panel')
    const savedLeftSize = localStorage.getItem('mdx-editor-left-panel-size')
    const savedRightSize = localStorage.getItem('mdx-editor-right-panel-size')
    const savedActiveTab = localStorage.getItem('mdx-editor-active-tab')
    
    if (savedLeftPanel !== null) {
      setLeftPanelOpen(savedLeftPanel === 'true')
    }
    if (savedRightPanel !== null) {
      setRightPanelOpen(savedRightPanel === 'true')
    }
    if (savedLeftSize !== null) {
      setLeftPanelSize(parseInt(savedLeftSize))
    }
    if (savedRightSize !== null) {
      setRightPanelSize(parseInt(savedRightSize))
    }
    if (savedActiveTab !== null) {
      setActiveLeftTab(savedActiveTab as 'templates' | 'properties' | 'snippets')
    }
  }, [])
  
  // Save panel states to localStorage
  useEffect(() => {
    localStorage.setItem('mdx-editor-left-panel', leftPanelOpen.toString())
  }, [leftPanelOpen])
  
  useEffect(() => {
    localStorage.setItem('mdx-editor-right-panel', rightPanelOpen.toString())
  }, [rightPanelOpen])
  
  useEffect(() => {
    localStorage.setItem('mdx-editor-left-panel-size', leftPanelSize.toString())
  }, [leftPanelSize])
  
  useEffect(() => {
    localStorage.setItem('mdx-editor-right-panel-size', rightPanelSize.toString())
  }, [rightPanelSize])
  
  useEffect(() => {
    localStorage.setItem('mdx-editor-active-tab', activeLeftTab)
  }, [activeLeftTab])
  
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + T: Toggle Smart Templates
      if ((e.ctrlKey || e.metaKey) && e.key === 't' && !e.shiftKey) {
        e.preventDefault()
        setIsAnimating(true)
        setLeftPanelOpen(prev => !prev)
        setTimeout(() => setIsAnimating(false), 300)
      }
      // Ctrl/Cmd + I: Toggle AI Suggestions
      if ((e.ctrlKey || e.metaKey) && e.key === 'i' && !e.shiftKey) {
        e.preventDefault()
        setIsAnimating(true)
        setRightPanelOpen(prev => !prev)
        setTimeout(() => setIsAnimating(false), 300)
      }
      // Ctrl/Cmd + Shift + T: Toggle both panels
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        setIsAnimating(true)
        if (leftPanelOpen || rightPanelOpen) {
          setLeftPanelOpen(false)
          setRightPanelOpen(false)
        } else {
          setLeftPanelOpen(true)
          setRightPanelOpen(true)
        }
        setTimeout(() => setIsAnimating(false), 300)
      }
      // Ctrl/Cmd + 1: Switch to Templates tab
      if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault()
        if (!leftPanelOpen) setLeftPanelOpen(true)
        setActiveLeftTab('templates')
      }
      // Ctrl/Cmd + 2: Switch to Properties tab
      if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault()
        if (!leftPanelOpen) setLeftPanelOpen(true)
        setActiveLeftTab('properties')
      }
      // Ctrl/Cmd + 3: Switch to Snippets tab
      if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault()
        if (!leftPanelOpen) setLeftPanelOpen(true)
        setActiveLeftTab('snippets')
      }
      // Ctrl/Cmd + /: Show keyboard shortcuts
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        // This will be implemented in the future
        console.log('Keyboard shortcuts:')
        console.log('Ctrl+T: Toggle Templates Panel')
        console.log('Ctrl+I: Toggle AI Panel')
        console.log('Ctrl+Shift+T: Toggle Both Panels')
        console.log('Ctrl+1/2/3: Switch Template Tabs')
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [leftPanelOpen, rightPanelOpen])

  const handleInsertTemplate = (template: string) => {
    // Insert at current position or append
    if (cursorPosition !== undefined) {
      const before = value.substring(0, cursorPosition)
      const after = value.substring(cursorPosition)
      onChange(before + template + after)
      // Update cursor position after insertion
      setCursorPosition(cursorPosition + template.length)
    } else {
      onChange(value + template)
    }
  }

  const handleApplySuggestion = (suggestion: string) => {
    // For now, append the suggestion
    // In the future, this could be more context-aware
    onChange(value + '\n' + suggestion)
  }

  return (
    <div className={cn("h-full relative", className, isAnimating && "transition-all duration-300")}>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel - Smart Templates */}
        {leftPanelOpen && (
          <>
            <ResizablePanel 
              defaultSize={leftPanelSize} 
              minSize={15} 
              maxSize={40}
              order={1}
              onResize={(size) => setLeftPanelSize(size)}
            >
              <div className="h-full flex flex-col border-r">
                {/* Panel Header */}
                <div className="border-b p-2 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">Smart Templates</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Pre-built dental content templates with keyword matching</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setLeftPanelOpen(false)}
                        >
                          <PanelLeftClose className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Close panel</p>
                        <p className="text-xs text-muted-foreground mt-1">Ctrl+T</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  <MDXSmartTemplatesPanel
                    content={value}
                    onInsert={handleInsertTemplate}
                    activeTab={activeLeftTab === 'properties' ? 'properties' : activeLeftTab === 'snippets' ? 'snippets' : undefined}
                    onTabChange={(tab) => {
                      if (tab === 'properties') {
                        setActiveLeftTab('properties')
                      } else if (tab === 'snippets') {
                        setActiveLeftTab('snippets')
                      } else {
                        setActiveLeftTab('templates')
                      }
                    }}
                  />
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* Main Editor */}
        <ResizablePanel 
          defaultSize={leftPanelOpen && rightPanelOpen ? 50 : leftPanelOpen || rightPanelOpen ? 75 : 100}
          minSize={30}
          order={2}
        >
          <div className="h-full flex flex-col">
            {/* Panel control buttons bar */}
            {(!leftPanelOpen || !rightPanelOpen) && (
              <div className="flex items-center justify-between p-2 border-b bg-gray-50/50">
                {!leftPanelOpen ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLeftPanelOpen(true)}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Smart Templates
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open smart templates panel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div />
                )}
                
                {!rightPanelOpen ? (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setRightPanelOpen(true)}
                        >
                          <Brain className="w-4 h-4 mr-2" />
                          AI Suggestions
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Open AI suggestions panel</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <div />
                )}
              </div>
            )}
            
            {/* Advanced Editor */}
            <MDXEditorAdvanced
              value={value}
              onChange={onChange}
              className="flex-1"
              placeholder={placeholder}
              onOpenPropertyEditor={() => {
                setLeftPanelOpen(true)
                setActiveLeftTab('properties')
              }}
            />
          </div>
        </ResizablePanel>

        {/* Right Panel - AI Suggestions */}
        {rightPanelOpen && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel 
              defaultSize={rightPanelSize} 
              minSize={15} 
              maxSize={40}
              order={3}
              onResize={(size) => setRightPanelSize(size)}
            >
              <div className="h-full flex flex-col border-l">
                {/* Panel Header */}
                <div className="border-b p-2 flex items-center justify-between bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">AI Suggestions</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-3 h-3 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Real-time AI analysis powered by Gemini 2.5 Flash Lite</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setRightPanelOpen(false)}
                        >
                          <PanelRightClose className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Close panel</p>
                        <p className="text-xs text-muted-foreground mt-1">Ctrl+I</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  <MDXAISuggestionsPanel
                    content={value}
                    cursorPosition={cursorPosition}
                    onApplySuggestion={handleApplySuggestion}
                    apiEndpoint="/api/admin/ai/mdx-suggestions"
                    apiKey={typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_LITELLM_API_KEY : undefined}
                  />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}

export { MDXEditorAdvancedWithPanels }
