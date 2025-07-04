'use client'

import { useState, useRef } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Quote, 
  Code, 
  Link2, 
  Image,
  Table,
  Heading1,
  Heading2,
  Heading3,
  AlertCircle,
  CheckCircle,
  Info,
  XCircle
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
}

export default function MDXEditor({ value, onChange }: MDXEditorProps) {
  const [activeTab, setActiveTab] = useState('write')
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // Insert text at cursor position
  const insertAtCursor = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return
    
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const newText = value.substring(0, start) + before + selectedText + after + value.substring(end)
    
    onChange(newText)
    
    // Set cursor position
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }
  
  // Toolbar actions
  const toolbarActions = [
    { icon: Bold, label: 'Bold', action: () => insertAtCursor('**', '**') },
    { icon: Italic, label: 'Italic', action: () => insertAtCursor('*', '*') },
    { icon: Link2, label: 'Link', action: () => insertAtCursor('[', '](url)') },
    { icon: Code, label: 'Code', action: () => insertAtCursor('`', '`') },
    { icon: Quote, label: 'Quote', action: () => insertAtCursor('> ', '') },
    { icon: List, label: 'Bullet List', action: () => insertAtCursor('- ', '') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertAtCursor('1. ', '') },
    { icon: Heading1, label: 'Heading 1', action: () => insertAtCursor('# ', '') },
    { icon: Heading2, label: 'Heading 2', action: () => insertAtCursor('## ', '') },
    { icon: Heading3, label: 'Heading 3', action: () => insertAtCursor('### ', '') },
  ]
  
  // Insert component templates
  const insertComponent = (componentType: string) => {
    const templates: Record<string, string> = {
      alert: `<Alert type="info">
  Your alert message here
</Alert>`,
      toothDiagram: `<ToothDiagram teeth={[1, 2, 3]} />`,
      timeline: `<Timeline>
  <TimelineItem date="Day 1" title="Initial Consultation">
    Description of the first step
  </TimelineItem>
  <TimelineItem date="Day 7" title="Follow-up">
    Description of the follow-up
  </TimelineItem>
</Timeline>`,
      costTable: `<CostTable costs={[
  { item: "Consultation", cost: "£50-100", nhs: true },
  { item: "X-Ray", cost: "£25-50", nhs: true },
  { item: "Treatment", cost: "£200-500", nhs: false }
]} />`,
      faq: `<FAQ question="Your question here?">
  Your answer here
</FAQ>`,
      procedureSteps: `<ProcedureSteps>
  <li>First step of the procedure</li>
  <li>Second step of the procedure</li>
  <li>Third step of the procedure</li>
</ProcedureSteps>`,
      video: `<VideoEmbed url="https://youtube.com/embed/VIDEO_ID" title="Video Title" />`,
    }
    
    if (templates[componentType]) {
      insertAtCursor('\n' + templates[componentType] + '\n', '')
    }
  }
  
  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="border-b bg-gray-50 px-4">
          <div className="flex items-center justify-between">
            <TabsList className="bg-transparent border-0 h-auto p-0">
              <TabsTrigger value="write" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Write
              </TabsTrigger>
              <TabsTrigger value="preview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Preview
              </TabsTrigger>
              <TabsTrigger value="components" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary">
                Components
              </TabsTrigger>
            </TabsList>
            
            {activeTab === 'write' && (
              <div className="flex items-center gap-1 py-2">
                {toolbarActions.map((action, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={action.action}
                    title={action.label}
                    className="h-8 w-8 p-0"
                  >
                    <action.icon className="w-4 h-4" />
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <TabsContent value="write" className="m-0">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="min-h-[500px] rounded-none border-0 p-4 font-mono text-sm focus-visible:ring-0"
            placeholder="Write your article in MDX format..."
          />
        </TabsContent>
        
        <TabsContent value="preview" className="m-0 p-4">
          <div className="prose prose-sm max-w-none min-h-[500px]">
            <p className="text-gray-500">
              Preview functionality requires the article to be saved first.
              The full MDX preview will be available after saving.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="components" className="m-0 p-4">
          <div className="grid grid-cols-2 gap-4">
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('alert')}
            >
              <AlertCircle className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-medium">Alert Box</h4>
              <p className="text-sm text-gray-600">Info, warning, success, or error alerts</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('toothDiagram')}
            >
              <Table className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-medium">Tooth Diagram</h4>
              <p className="text-sm text-gray-600">Visual tooth numbering diagram</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('timeline')}
            >
              <List className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-medium">Timeline</h4>
              <p className="text-sm text-gray-600">Treatment timeline with steps</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('costTable')}
            >
              <Table className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-medium">Cost Table</h4>
              <p className="text-sm text-gray-600">Treatment costs breakdown</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('faq')}
            >
              <Info className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="font-medium">FAQ</h4>
              <p className="text-sm text-gray-600">Question and answer format</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('procedureSteps')}
            >
              <ListOrdered className="w-6 h-6 text-pink-600 mb-2" />
              <h4 className="font-medium">Procedure Steps</h4>
              <p className="text-sm text-gray-600">Numbered procedure steps</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('video')}
            >
              <Image className="w-6 h-6 text-red-600 mb-2" />
              <h4 className="font-medium">Video Embed</h4>
              <p className="text-sm text-gray-600">Embed YouTube videos</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}