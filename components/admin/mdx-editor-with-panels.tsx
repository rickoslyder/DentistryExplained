'use client'

import { useState, useRef } from 'react'
import dynamic from 'next/dynamic'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'
import { Button } from '@/components/ui/button'
import { 
  Sparkles, 
  Brain, 
  FileText, 
  Eye,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelRightClose
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { MedicalReference } from '@/lib/doi-validator'

// Dynamically import components to avoid SSR issues
const MDXEditor = dynamic(() => import('@/components/admin/mdx-editor'), {
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

const MDXComponentPreview = dynamic(() => 
  import('@/components/admin/mdx-component-preview').then(mod => ({ 
    default: mod.MDXComponentPreview 
  })), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

interface MDXEditorWithPanelsProps {
  value: string
  onChange: (value: string) => void
  references?: MedicalReference[]
  onReferencesChange?: (references: MedicalReference[]) => void
  apiEndpoint?: string
  apiKey?: string
}

export function MDXEditorWithPanels({
  value,
  onChange,
  references = [],
  onReferencesChange,
  apiEndpoint,
  apiKey
}: MDXEditorWithPanelsProps) {
  const [leftPanelOpen, setLeftPanelOpen] = useState(true)
  const [rightPanelOpen, setRightPanelOpen] = useState(true)
  const [leftPanelContent, setLeftPanelContent] = useState<'templates' | 'preview'>('templates')
  const [rightPanelContent, setRightPanelContent] = useState<'ai'>('ai')
  const [previewComponent, setPreviewComponent] = useState<string | null>(null)
  const [cursorPosition, setCursorPosition] = useState<number | undefined>(undefined)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleInsertTemplate = (template: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      // If no direct textarea ref, just append
      onChange(value + template)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.substring(0, start) + template + value.substring(end)
    onChange(newValue)

    // Focus and set cursor after inserted text
    setTimeout(() => {
      textarea.focus()
      const newPos = start + template.length
      textarea.setSelectionRange(newPos, newPos)
    }, 0)
  }

  const handleApplySuggestion = (suggestion: string) => {
    // For now, just append the suggestion
    // In a real implementation, this would be more context-aware
    onChange(value + '\n' + suggestion)
  }

  const handlePreviewComponent = (componentType: string) => {
    setPreviewComponent(componentType)
    setLeftPanelContent('preview')
    if (!leftPanelOpen) setLeftPanelOpen(true)
  }

  return (
    <div className="h-full relative">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Left Panel */}
        {leftPanelOpen && (
          <>
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full flex flex-col border-r">
                {/* Panel Header */}
                <div className="border-b p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={leftPanelContent === 'templates' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanelContent('templates')}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Templates
                    </Button>
                    <Button
                      variant={leftPanelContent === 'preview' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setLeftPanelContent('preview')}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setLeftPanelOpen(false)}
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  {leftPanelContent === 'templates' && (
                    <MDXSmartTemplatesPanel
                      content={value}
                      onInsert={handleInsertTemplate}
                    />
                  )}
                  {leftPanelContent === 'preview' && previewComponent && (
                    <MDXComponentPreview
                      componentType={previewComponent}
                      onInsert={handleInsertTemplate}
                    />
                  )}
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle />
          </>
        )}

        {/* Main Editor */}
        <ResizablePanel defaultSize={leftPanelOpen && rightPanelOpen ? 50 : leftPanelOpen || rightPanelOpen ? 75 : 100}>
          <div className="h-full flex flex-col">
            {/* Editor Toolbar */}
            <div className="border-b p-2 flex items-center justify-between">
              {!leftPanelOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setLeftPanelOpen(true)}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              )}
              <div className="flex-1" />
              {!rightPanelOpen && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelOpen(true)}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {/* Editor */}
            <div className="flex-1 overflow-hidden">
              <MDXEditor
                value={value}
                onChange={onChange}
                references={references}
                onReferencesChange={onReferencesChange}
              />
            </div>
          </div>
        </ResizablePanel>

        {/* Right Panel */}
        {rightPanelOpen && (
          <>
            <ResizableHandle />
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
              <div className="h-full flex flex-col border-l">
                {/* Panel Header */}
                <div className="border-b p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant={rightPanelContent === 'ai' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setRightPanelContent('ai')}
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      AI Assist
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setRightPanelOpen(false)}
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Panel Content */}
                <div className="flex-1 overflow-hidden">
                  <MDXAISuggestionsPanel
                    content={value}
                    cursorPosition={cursorPosition}
                    onApplySuggestion={handleApplySuggestion}
                    apiEndpoint={apiEndpoint}
                    apiKey={apiKey}
                  />
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Component Preview Handler */}
      <div className="hidden">
        <input
          type="hidden"
          id="mdx-preview-component"
          onChange={(e) => handlePreviewComponent(e.target.value)}
        />
      </div>
    </div>
  )
}