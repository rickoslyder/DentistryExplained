'use client'

import { useState, useRef, useCallback } from 'react'
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
  XCircle,
  ChevronDown,
  Command,
  Keyboard,
  BookOpen,
  FileText
} from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts'
import { MDXCommandPalette } from '@/components/admin/mdx-command-palette'
import { ReferenceDialog } from '@/components/admin/reference-dialog'
import { toast } from 'sonner'
import type { MedicalReference } from '@/lib/doi-validator'

interface MDXEditorProps {
  value: string
  onChange: (value: string) => void
  references?: MedicalReference[]
  onReferencesChange?: (references: MedicalReference[]) => void
}

export default function MDXEditor({ value, onChange, references = [], onReferencesChange }: MDXEditorProps) {
  const [activeTab, setActiveTab] = useState('write')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)
  const [referenceDialogOpen, setReferenceDialogOpen] = useState(false)
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
  const insertComponent = (componentType: string, alertType?: string) => {
    const templates: Record<string, string> = {
      alert: `<Alert type="${alertType || 'info'}">
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
      symptomScale: `<SymptomSeverityScale 
  title="Rate Your Pain"
  description="Click on the scale to indicate your current level of pain"
  showGuide={true}
/>`,
      treatmentComparison: `<TreatmentComparisonTable 
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
/>`,
      toothChart: `<InteractiveToothChart 
  title="Your Dental Chart"
  teeth={[
    { id: 16, condition: "filling" },
    { id: 25, condition: "crown" },
    { id: 31, condition: "missing" }
  ]}
  showLegend={true}
/>`,
    }
    
    if (templates[componentType]) {
      insertAtCursor('\n' + templates[componentType] + '\n', '')
    }
  }
  
  // Alert types configuration
  const alertTypes = [
    { value: 'info', label: 'Info', icon: Info, description: 'General information' },
    { value: 'warning', label: 'Warning', icon: AlertCircle, description: 'Important caution' },
    { value: 'success', label: 'Success', icon: CheckCircle, description: 'Positive outcome' },
    { value: 'error', label: 'Error', icon: XCircle, description: 'Error or danger' },
    { value: 'tip', label: 'Tip', icon: Info, description: 'Helpful suggestion' },
    { value: 'note', label: 'Note', icon: Info, description: 'Additional context' },
    { value: 'emergency', label: 'Emergency', icon: AlertCircle, description: 'Urgent medical attention' },
    { value: 'clinical-note', label: 'Clinical Note', icon: Info, description: 'Professional guidance' }
  ]

  // Handle command palette commands
  const handleCommand = useCallback((command: string, value?: any) => {
    switch (command) {
      // Text formatting
      case 'bold':
        insertAtCursor('**', '**')
        break
      case 'italic':
        insertAtCursor('*', '*')
        break
      case 'link':
        insertAtCursor('[', '](url)')
        break
      case 'code':
        insertAtCursor('`', '`')
        break
      case 'quote':
        insertAtCursor('> ', '')
        break
      
      // Headings
      case 'h1':
        insertAtCursor('# ', '')
        break
      case 'h2':
        insertAtCursor('## ', '')
        break
      case 'h3':
        insertAtCursor('### ', '')
        break
      
      // Lists
      case 'bullet-list':
        insertAtCursor('- ', '')
        break
      case 'numbered-list':
        insertAtCursor('1. ', '')
        break
      case 'checklist':
        insertAtCursor('- [ ] ', '')
        break
      
      // Components
      case 'alert':
        insertComponent('alert')
        break
      case 'alert-enhanced':
        insertAtCursor('\n<AlertEnhanced variant="info" collapsible={true} timestamp={new Date().toISOString()}>\n  Your message here\n</AlertEnhanced>\n', '')
        break
      case 'medication-card':
        insertAtCursor('\n<MedicationCard medication={{\n  name: "Amoxicillin",\n  genericName: "Amoxicillin",\n  dosage: "500mg",\n  frequency: "3 times daily",\n  duration: "7 days",\n  withFood: true,\n  sideEffects: ["Nausea", "Diarrhea"],\n  warnings: ["Complete full course", "Avoid alcohol"],\n  prescribedFor: "Dental infection"\n}} />\n', '')
        break
      case 'before-after':
        insertAtCursor('\n<BeforeAfterGallery\n  images={[\n    {\n      id: "1",\n      beforeUrl: "/images/before.jpg",\n      afterUrl: "/images/after.jpg",\n      procedure: "Teeth Whitening",\n      duration: "1 hour"\n    }\n  ]}\n/>\n', '')
        break
      case 'checklist-appointment':
        insertAtCursor('\n<AppointmentChecklist\n  appointmentType="Root Canal"\n  appointmentDate="January 15, 2025"\n  items={[\n    { id: "1", text: "Avoid eating 2 hours before", category: "before" },\n    { id: "2", text: "Take prescribed antibiotics", category: "before", priority: "high" },\n    { id: "3", text: "Arrange transportation", category: "during" },\n    { id: "4", text: "Rest for 24 hours", category: "after" }\n  ]}\n/>\n', '')
        break
      case 'smart-faq':
        insertAtCursor('\n<SmartFAQ\n  items={[\n    {\n      id: "1",\n      question: "How long will the treatment take?",\n      answer: "Treatment typically takes 30-60 minutes.",\n      category: "General",\n      tags: ["duration", "timing"]\n    },\n    {\n      id: "2",\n      question: "Will it hurt?",\n      answer: "Modern techniques ensure minimal discomfort.",\n      category: "Pain Management",\n      tags: ["pain", "comfort"]\n    }\n  ]}\n/>\n', '')
        break
      case 'symptom-scale':
        insertComponent('symptomScale')
        break
      case 'treatment-comparison':
        insertComponent('treatmentComparison')
        break
      case 'tooth-chart':
        insertComponent('toothChart')
        break
      case 'table':
        insertAtCursor('| Column 1 | Column 2 |\n|----------|----------|\n| Cell 1   | Cell 2   |', '')
        break
      case 'cost-table':
        insertAtCursor('\n<EnhancedCostTable\n  costs={[\n    { item: "Consultation", cost: "£50-100", nhs: true },\n    { item: "X-Ray", cost: "£25-50", nhs: true },\n    { item: "Treatment", cost: "£200-500", nhs: false }\n  ]}\n  showPaymentCalculator={true}\n  showInsuranceEstimator={true}\n/>\n', '')
        break
      case 'timeline':
        insertAtCursor('\n<BranchingTimeline\n  title="Treatment Timeline"\n  items={[\n    {\n      id: "1",\n      title: "Initial Consultation",\n      date: "Day 1",\n      description: "Examination and diagnosis",\n      type: "milestone"\n    },\n    {\n      id: "2",\n      title: "Treatment Options",\n      date: "Day 3",\n      description: "Choose your treatment path",\n      type: "decision",\n      branches: [\n        {\n          id: "branch-1",\n          condition: "Conservative Treatment",\n          items: [\n            {\n              id: "3a",\n              title: "Filling",\n              date: "Day 7",\n              description: "Simple restoration"\n            }\n          ]\n        },\n        {\n          id: "branch-2",\n          condition: "Advanced Treatment",\n          items: [\n            {\n              id: "3b",\n              title: "Root Canal",\n              date: "Day 7-14",\n              description: "Complete root treatment"\n            }\n          ]\n        }\n      ]\n    }\n  ]}\n/>\n', '')
        break
      case 'code-block':
        insertAtCursor('```\n', '\n```')
        break
      case 'video':
        insertComponent('video')
        break
      case 'faq':
        insertComponent('faq')
        break
      case 'procedure-steps':
        insertComponent('procedureSteps')
        break
      case 'calculator':
        insertAtCursor('\n<ClinicalCalculator />\n', '')
        break
      case 'video-consultation':
        insertAtCursor('\n<VideoConsultationCard\n  consultation={{\n    platform: "zoom",\n    meetingLink: "https://zoom.us/j/123456789",\n    scheduledTime: "January 15, 2025 at 2:00 PM",\n    duration: "30 minutes",\n    dentistName: "Dr. Smith"\n  }}\n/>\n', '')
        break
      case 'insurance-info':
        insertAtCursor('\n<InsuranceInfoBox\n  insurance={{\n    provider: "Dental Insurance Co",\n    planName: "Premium Dental",\n    policyNumber: "POL123456",\n    coverageType: "Private",\n    coverageDetails: {\n      preventive: 100,\n      basic: 80,\n      major: 50,\n      annual_maximum: 1500,\n      deductible: 100,\n      deductible_met: 50\n    },\n    claimProcess: {\n      steps: [\n        "Get treatment from your dentist",\n        "Obtain itemized invoice",\n        "Submit claim form within 90 days",\n        "Receive reimbursement"\n      ],\n      processingTime: "10-15 business days",\n      directBilling: true\n    }\n  }}\n/>\n', '')
        break
      
      case 'branching-timeline':
        insertAtCursor('\n<BranchingTimeline\n  title="Treatment Timeline"\n  items={[\n    {\n      id: "1",\n      title: "Initial Consultation",\n      date: "Day 1",\n      description: "Examination and diagnosis",\n      type: "milestone"\n    },\n    {\n      id: "2",\n      title: "Treatment Options",\n      date: "Day 3",\n      description: "Choose your treatment path",\n      type: "decision",\n      branches: [\n        {\n          id: "branch-1",\n          condition: "Conservative Treatment",\n          items: [\n            {\n              id: "3a",\n              title: "Filling",\n              date: "Day 7",\n              description: "Simple restoration"\n            }\n          ]\n        },\n        {\n          id: "branch-2",\n          condition: "Advanced Treatment",\n          items: [\n            {\n              id: "3b",\n              title: "Root Canal",\n              date: "Day 7-14",\n              description: "Complete root treatment"\n            }\n          ]\n        }\n      ]\n    }\n  ]}\n/>\n', '')
        break
      
      case 'enhanced-cost-table':
        insertAtCursor('\n<EnhancedCostTable\n  costs={[\n    { item: "Consultation", cost: "£50-100", nhs: true },\n    { item: "X-Ray", cost: "£25-50", nhs: true },\n    { item: "Treatment", cost: "£200-500", nhs: false }\n  ]}\n  showPaymentCalculator={true}\n  showInsuranceEstimator={true}\n/>\n', '')
        break
      
      case 'reference':
        setReferenceDialogOpen(true)
        break
      
      default:
        toast.error(`Unknown command: ${command}`)
    }
  }, [insertAtCursor, insertComponent])

  // Handle reference citation insertion
  const handleInsertCitation = useCallback((citation: string) => {
    insertAtCursor(citation, '')
  }, [insertAtCursor])

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: '/', ctrl: true, action: () => setCommandPaletteOpen(true), description: 'Open command palette' },
    { key: 'b', ctrl: true, action: () => insertAtCursor('**', '**'), description: 'Bold' },
    { key: 'i', ctrl: true, action: () => insertAtCursor('*', '*'), description: 'Italic' },
    { key: 'k', ctrl: true, action: () => insertAtCursor('[', '](url)'), description: 'Link' },
    { key: 'e', ctrl: true, action: () => insertAtCursor('`', '`'), description: 'Code' },
    { key: '1', ctrl: true, action: () => insertAtCursor('# ', ''), description: 'Heading 1' },
    { key: '2', ctrl: true, action: () => insertAtCursor('## ', ''), description: 'Heading 2' },
    { key: '3', ctrl: true, action: () => insertAtCursor('### ', ''), description: 'Heading 3' },
    { key: 's', ctrl: true, action: () => toast.info('Auto-save enabled'), description: 'Save (auto-saves)' },
    { key: 'Enter', ctrl: true, shift: true, action: () => insertAtCursor('\n<br />\n', ''), description: 'Line break' },
  ], activeTab === 'write')
  
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
                <div className="ml-2 border-l pl-2 flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCommandPaletteOpen(true)}
                    title="Command Palette (Ctrl+/)"
                    className="h-8 px-2 gap-1"
                  >
                    <Command className="w-4 h-4" />
                    <span className="text-xs text-muted-foreground">⌘/</span>
                  </Button>
                  {references.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setReferenceDialogOpen(true)}
                      title="Insert Reference"
                      className="h-8 px-2"
                    >
                      <BookOpen className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50 relative">
                  <div className="absolute top-2 right-2">
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </div>
                  <AlertCircle className="w-6 h-6 text-blue-600 mb-2" />
                  <h4 className="font-medium">Alert Box</h4>
                  <p className="text-sm text-gray-600">Multiple alert types available</p>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64">
                <DropdownMenuLabel>Select Alert Type</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {alertTypes.map((alertType) => (
                  <DropdownMenuItem
                    key={alertType.value}
                    onClick={() => insertComponent('alert', alertType.value)}
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
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('symptomScale')}
            >
              <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
              <h4 className="font-medium">Pain Scale</h4>
              <p className="text-sm text-gray-600">Interactive pain severity scale</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('treatmentComparison')}
            >
              <Table className="w-6 h-6 text-teal-600 mb-2" />
              <h4 className="font-medium">Treatment Compare</h4>
              <p className="text-sm text-gray-600">Compare treatment options</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => insertComponent('toothChart')}
            >
              <CheckCircle className="w-6 h-6 text-emerald-600 mb-2" />
              <h4 className="font-medium">Tooth Chart</h4>
              <p className="text-sm text-gray-600">Interactive dental chart</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('medication-card')}
            >
              <AlertCircle className="w-6 h-6 text-blue-600 mb-2" />
              <h4 className="font-medium">Medication Card</h4>
              <p className="text-sm text-gray-600">Prescription information</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('before-after')}
            >
              <Image className="w-6 h-6 text-purple-600 mb-2" />
              <h4 className="font-medium">Before/After Gallery</h4>
              <p className="text-sm text-gray-600">Treatment result photos</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('checklist-appointment')}
            >
              <CheckCircle className="w-6 h-6 text-green-600 mb-2" />
              <h4 className="font-medium">Appointment Checklist</h4>
              <p className="text-sm text-gray-600">Pre/post appointment tasks</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('smart-faq')}
            >
              <Info className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="font-medium">Smart FAQ</h4>
              <p className="text-sm text-gray-600">Searchable FAQ section</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('alert-enhanced')}
            >
              <AlertCircle className="w-6 h-6 text-amber-600 mb-2" />
              <h4 className="font-medium">Enhanced Alert</h4>
              <p className="text-sm text-gray-600">Collapsible alert with timestamp</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('calculator')}
            >
              <Table className="w-6 h-6 text-cyan-600 mb-2" />
              <h4 className="font-medium">Clinical Calculator</h4>
              <p className="text-sm text-gray-600">BMI and dosage calculations</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('video-consultation')}
            >
              <Image className="w-6 h-6 text-pink-600 mb-2" />
              <h4 className="font-medium">Video Consultation</h4>
              <p className="text-sm text-gray-600">Telemedicine appointment info</p>
            </div>
            
            <div
              className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
              onClick={() => handleCommand('insurance-info')}
            >
              <Info className="w-6 h-6 text-orange-600 mb-2" />
              <h4 className="font-medium">Insurance Info</h4>
              <p className="text-sm text-gray-600">Coverage and claim details</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <MDXCommandPalette 
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
        onCommand={handleCommand}
      />
      
      <ReferenceDialog
        open={referenceDialogOpen}
        onOpenChange={setReferenceDialogOpen}
        references={references}
        onInsert={handleInsertCitation}
      />
    </div>
  )
}