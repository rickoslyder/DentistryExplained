'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Search,
  FileText,
  Heart,
  Stethoscope,
  GraduationCap,
  MessageSquare,
  Sparkles,
  Copy,
  Check,
  Info,
  Eye,
  Plus,
  ChevronRight,
  Settings2,
  Library
} from 'lucide-react'
import { 
  smartTemplates, 
  getSuggestedTemplates,
  getTemplatesByCategory,
  searchTemplates
} from '@/lib/mdx-smart-templates'
import type { SmartTemplate } from '@/lib/mdx-smart-templates'
import dynamic from 'next/dynamic'

// Dynamically import property editor to avoid SSR issues
const MDXPropertyEditor = dynamic(() => 
  import('@/components/admin/mdx-property-editor').then(mod => ({ 
    default: mod.MDXPropertyEditor 
  })), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

// Dynamically import snippets library to avoid SSR issues
const MDXSnippetsLibrary = dynamic(() => 
  import('@/components/admin/mdx-snippets-library').then(mod => ({ 
    default: mod.MDXSnippetsLibrary 
  })), {
  ssr: false,
  loading: () => <div className="h-full bg-gray-50 animate-pulse rounded-lg" />
})

interface SmartTemplatesPanelProps {
  content: string
  onInsert: (template: string) => void
  activeTab?: 'browse' | 'suggested' | 'preview' | 'properties' | 'snippets'
  onTabChange?: (tab: 'browse' | 'suggested' | 'preview' | 'properties' | 'snippets') => void
}

// Component to render template preview
function TemplatePreview({ template }: { template: SmartTemplate }) {
  // Render preview based on actual template IDs
  const renderPreview = () => {
    switch (template.id) {
      case 'emergency-alert':
        return (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              <strong>Dental Emergency</strong><br />
              If you're experiencing severe pain, facial swelling, or uncontrolled bleeding, seek immediate medical attention.
            </AlertDescription>
          </Alert>
        )
      
      case 'symptom-assessment':
        return (
          <div className="space-y-3 p-4 border rounded-lg">
            <h4 className="font-semibold">Rate Your Current Symptoms</h4>
            <p className="text-sm text-muted-foreground">Use this scale to help your dentist understand your pain level</p>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                <button 
                  key={num} 
                  className={`w-7 h-7 rounded text-xs font-medium ${
                    num <= 3 ? 'bg-green-500' : 
                    num <= 7 ? 'bg-yellow-500' : 
                    'bg-red-500'
                  } text-white`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )
      
      case 'treatment-options':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Treatment</th>
                  <th className="px-3 py-2 text-left font-medium">Duration</th>
                  <th className="px-3 py-2 text-left font-medium">Cost</th>
                  <th className="px-3 py-2 text-left font-medium">Success Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2">Conservative</td>
                  <td className="px-3 py-2">1 visit</td>
                  <td className="px-3 py-2">£50-150</td>
                  <td className="px-3 py-2">85%</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Advanced</td>
                  <td className="px-3 py-2">2-3 visits</td>
                  <td className="px-3 py-2">£300-600</td>
                  <td className="px-3 py-2">95%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      
      case 'procedure-timeline':
        return (
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Consultation</p>
                <p className="text-xs text-muted-foreground">Initial Assessment</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Week 1</p>
                <p className="text-xs text-muted-foreground">Treatment Planning</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 mt-1.5 bg-blue-500 rounded-full"></div>
              <div>
                <p className="font-medium text-sm">Week 2-3</p>
                <p className="text-xs text-muted-foreground">Active Treatment</p>
              </div>
            </div>
          </div>
        )
      
      case 'cost-breakdown':
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Item</th>
                  <th className="px-3 py-2 text-left font-medium">Cost</th>
                  <th className="px-3 py-2 text-left font-medium">NHS</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="px-3 py-2">Initial Consultation</td>
                  <td className="px-3 py-2">£50-80</td>
                  <td className="px-3 py-2 text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Basic Treatment</td>
                  <td className="px-3 py-2">£65.20</td>
                  <td className="px-3 py-2 text-green-600">✓</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Private Alternative</td>
                  <td className="px-3 py-2">£300-500</td>
                  <td className="px-3 py-2 text-red-600">✗</td>
                </tr>
              </tbody>
            </table>
          </div>
        )
      
      case 'procedure-steps':
        return (
          <div className="space-y-2">
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              <li>Initial preparation and local anaesthetic</li>
              <li>Removal of decay or damaged tissue</li>
              <li>Cleaning and shaping the area</li>
              <li>Placement of filling or restoration</li>
              <li>Final adjustments and polishing</li>
            </ol>
          </div>
        )
      
      case 'clinical-note':
        return (
          <Alert className="border-blue-200 bg-blue-50">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <strong>Clinical Note:</strong> This information is based on current clinical guidelines and evidence-based practice.
            </AlertDescription>
          </Alert>
        )
      
      case 'prevention-tips':
        return (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              <strong>Prevention Tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Brush twice daily with fluoride toothpaste</li>
                <li>Floss daily to remove plaque between teeth</li>
                <li>Visit your dentist regularly for check-ups</li>
                <li>Limit sugary foods and drinks</li>
              </ul>
            </AlertDescription>
          </Alert>
        )
      
      case 'dental-chart':
        return (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium mb-3">Interactive Dental Chart</h4>
            <div className="grid grid-cols-8 gap-1">
              {[18, 17, 16, 15, 14, 13, 12, 11].map(tooth => (
                <div key={tooth} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                  {tooth}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-8 gap-1 mt-1">
              {[48, 47, 46, 45, 44, 43, 42, 41].map(tooth => (
                <div key={tooth} className="aspect-square bg-gray-200 rounded flex items-center justify-center text-xs font-medium">
                  {tooth}
                </div>
              ))}
            </div>
            <div className="flex gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Healthy</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Filling</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Cavity</span>
              </div>
            </div>
          </div>
        )
      
      case 'faq-section':
        return (
          <div className="space-y-3">
            <div className="border rounded-lg p-3">
              <h5 className="font-medium text-sm mb-1">How long will the treatment take?</h5>
              <p className="text-xs text-muted-foreground">
                Treatment duration varies depending on the complexity, but typically takes 30-60 minutes per appointment.
              </p>
            </div>
            <div className="border rounded-lg p-3">
              <h5 className="font-medium text-sm mb-1">Will it hurt?</h5>
              <p className="text-xs text-muted-foreground">
                Modern dental techniques and anaesthetics ensure minimal discomfort. Most patients experience little to no pain during treatment.
              </p>
            </div>
          </div>
        )
      
      case 'branching-timeline':
        return (
          <div className="space-y-3">
            <div className="relative">
              <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-blue-200"></div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 bg-blue-500 rounded-full z-10 ring-4 ring-white"></div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Initial Consultation</h5>
                    <p className="text-xs text-muted-foreground mt-1">Comprehensive oral examination</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Proceed</Badge>
                      <Badge variant="outline" className="text-xs">Second opinion</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 relative">
                  <div className="w-4 h-4 bg-blue-300 rounded-full z-10 ring-4 ring-white"></div>
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">Treatment Planning</h5>
                    <p className="text-xs text-muted-foreground mt-1">Discuss options</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'medication-card':
        return (
          <Card className="border-blue-200 bg-blue-50/50">
            <CardContent className="p-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Rx</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm">Amoxicillin</h5>
                    <p className="text-xs text-muted-foreground">500mg</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <p className="font-medium">Three times daily</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duration:</span>
                    <p className="font-medium">7 days</p>
                  </div>
                </div>
                <Alert className="p-2">
                  <AlertDescription className="text-xs">
                    Take with food. Complete the full course.
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>
        )
      
      case 'enhanced-cost-table':
        return (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Treatment</th>
                    <th className="px-3 py-2 text-left font-medium">Cost</th>
                    <th className="px-3 py-2 text-left font-medium">NHS</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="px-3 py-2">Consultation</td>
                    <td className="px-3 py-2">£50-80</td>
                    <td className="px-3 py-2 text-green-600">✓</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2">Simple Filling</td>
                    <td className="px-3 py-2">£70-150</td>
                    <td className="px-3 py-2 text-green-600">✓</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="bg-muted p-3 rounded text-sm">
              <p className="font-medium mb-1">Cost Calculator</p>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-7 text-xs">Add items</Button>
                <span className="text-xs text-muted-foreground">Total: £0</span>
              </div>
            </div>
          </div>
        )
      
      case 'smart-faq':
        return (
          <div className="space-y-2">
            <div className="border rounded-lg">
              <button className="w-full p-3 text-left flex items-center justify-between">
                <span className="text-sm font-medium">What is the cost?</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="border rounded-lg">
              <button className="w-full p-3 text-left flex items-center justify-between">
                <span className="text-sm font-medium">How often should I visit?</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge variant="outline" className="text-xs">Cost</Badge>
              <Badge variant="outline" className="text-xs">General</Badge>
              <Badge variant="outline" className="text-xs">Emergency</Badge>
            </div>
          </div>
        )
      
      default:
        return (
          <div className="p-4 bg-gray-50 rounded text-sm text-muted-foreground">
            Preview not available for this template type
          </div>
        )
    }
  }

  return renderPreview()
}

export function MDXSmartTemplatesPanel({ 
  content, 
  onInsert,
  activeTab: externalActiveTab,
  onTabChange 
}: SmartTemplatesPanelProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'medical' | 'educational' | 'interactive' | 'general'>('all')
  const [suggestedTemplates, setSuggestedTemplates] = useState<SmartTemplate[]>([])
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<SmartTemplate | null>(null)
  const [internalActiveTab, setInternalActiveTab] = useState<'browse' | 'suggested' | 'preview' | 'properties' | 'snippets'>('browse')
  const [selectedComponentType, setSelectedComponentType] = useState<string>('Alert')
  const [componentProps, setComponentProps] = useState<Record<string, any>>({})
  const [detectedComponents, setDetectedComponents] = useState<string[]>([])
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false)

  // Use external tab if provided, otherwise use internal state
  const activeTab = externalActiveTab || internalActiveTab
  const setActiveTab = (tab: 'browse' | 'suggested' | 'preview' | 'properties' | 'snippets') => {
    if (onTabChange) {
      onTabChange(tab)
    } else {
      setInternalActiveTab(tab)
    }
  }

  // Update suggestions when content changes
  useEffect(() => {
    if (content.length > 50) {
      setIsLoadingSuggestions(true)
      // Simulate async load for better UX
      const timer = setTimeout(() => {
        const suggestions = getSuggestedTemplates(content, 3)
        setSuggestedTemplates(suggestions)
        setIsLoadingSuggestions(false)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [content])

  // Detect MDX components in content
  useEffect(() => {
    const componentPattern = /<(\w+)\s*[^>]*\/?>|<(\w+)\s*[^>]*>[\s\S]*?<\/\2>/g
    const matches = content.matchAll(componentPattern)
    const foundComponents = new Set<string>()
    
    for (const match of matches) {
      const componentName = match[1] || match[2]
      // Check if it's one of our known MDX components
      const knownComponents = [
        'Alert', 'MedicationCard', 'BeforeAfterGallery', 'SmartFAQ', 
        'CostTable', 'Timeline', 'ToothDiagram', 'SymptomSeverityScale',
        'TreatmentComparisonTable', 'ProcedureSteps', 'FAQ', 'InteractiveToothChart',
        'AppointmentChecklist', 'ClinicalCalculator', 'VideoConsultationCard',
        'InsuranceInfoBox', 'EnhancedCostTable', 'BranchingTimeline'
      ]
      
      if (knownComponents.includes(componentName)) {
        foundComponents.add(componentName)
      }
    }
    
    setDetectedComponents(Array.from(foundComponents))
  }, [content])

  // Get filtered templates
  const getFilteredTemplates = () => {
    if (searchQuery) {
      return searchTemplates(searchQuery)
    }
    if (selectedCategory === 'all') {
      return smartTemplates
    }
    return getTemplatesByCategory(selectedCategory)
  }

  const filteredTemplates = getFilteredTemplates()

  const handleCopy = (template: SmartTemplate) => {
    navigator.clipboard.writeText(template.template)
    setCopiedId(template.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handlePreview = (template: SmartTemplate) => {
    setSelectedTemplate(template)
    setActiveTab('preview')
  }

  const categoryIcons = {
    medical: Stethoscope,
    educational: GraduationCap,
    interactive: MessageSquare,
    general: FileText
  }

  const categoryColors = {
    medical: 'text-red-600',
    educational: 'text-blue-600',
    interactive: 'text-purple-600',
    general: 'text-gray-600'
  }

  return (
    <Card className="h-full flex flex-col overflow-hidden" role="region" aria-label="Smart Templates Panel">
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Smart Templates
        </CardTitle>
        <CardDescription>
          Pre-built templates for common dental content patterns
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col p-3">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
          <TabsList className="grid w-full grid-cols-5 px-1">
            <TabsTrigger value="browse" className="px-0.5 text-[10px]">Browse</TabsTrigger>
            <TabsTrigger value="suggested" className="px-0.5 text-[10px] relative overflow-hidden">
              <span className="truncate">Sugg.</span>
              {suggestedTemplates.length > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-0.5 h-3 px-1 text-[9px] min-w-[16px] flex items-center justify-center transition-all duration-200"
                >
                  {suggestedTemplates.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preview" className="px-0.5 text-[10px] gap-0.5">
              <span className="truncate">Preview</span>
              {selectedTemplate && (
                <Eye className="w-2.5 h-2.5 flex-shrink-0" />
              )}
            </TabsTrigger>
            <TabsTrigger value="properties" className="px-0.5 text-[10px] gap-0.5">
              <Settings2 className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">Props</span>
            </TabsTrigger>
            <TabsTrigger value="snippets" className="px-0.5 text-[10px] gap-0.5">
              <Library className="w-2.5 h-2.5 flex-shrink-0" />
              <span className="truncate">Snip.</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="flex flex-col flex-1 space-y-4 mt-4 min-h-0">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search templates"
              />
            </div>

            {/* Category Filter */}
            <div className="flex gap-2 flex-wrap">
              <Badge
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('all')}
              >
                All ({smartTemplates.length})
              </Badge>
              <Badge
                variant={selectedCategory === 'medical' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('medical')}
              >
                <Stethoscope className="w-3 h-3 mr-1" />
                Medical
              </Badge>
              <Badge
                variant={selectedCategory === 'educational' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('educational')}
              >
                <GraduationCap className="w-3 h-3 mr-1" />
                Educational
              </Badge>
              <Badge
                variant={selectedCategory === 'interactive' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('interactive')}
              >
                <MessageSquare className="w-3 h-3 mr-1" />
                Interactive
              </Badge>
              <Badge
                variant={selectedCategory === 'general' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('general')}
              >
                <FileText className="w-3 h-3 mr-1" />
                General
              </Badge>
              <Badge
                variant={selectedCategory === 'clinical' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedCategory('clinical')}
              >
                <Stethoscope className="w-3 h-3 mr-1" />
                Clinical
              </Badge>
            </div>

            {/* Templates List */}
            {filteredTemplates.length === 0 ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center p-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">No templates found</p>
                  <p className="text-sm mt-2">Try adjusting your search or filters</p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 min-h-0 pr-4">
                <div className="space-y-3">
                  {filteredTemplates.map((template) => {
                    const Icon = categoryIcons[template.category]
                    const colorClass = categoryColors[template.category]
                    
                    return (
                      <Card key={template.id} className="p-3 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/20">
                        <div className="space-y-3">
                          {/* Header */}
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className={`w-4 h-4 ${colorClass}`} />
                              <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          
                          {/* Keywords */}
                          <div className="flex gap-1 flex-wrap">
                            {template.keywords.slice(0, 2).map((keyword) => (
                              <Badge key={keyword} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                            {template.keywords.length > 2 && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="secondary" className="text-xs">
                                      +{template.keywords.length - 2}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{template.keywords.slice(2).join(', ')}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          
                          {/* Actions */}
                          <TooltipProvider>
                            <div className="flex gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handlePreview(template)}
                                    aria-label={`Preview ${template.name} template`}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Preview template</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleCopy(template)}
                                    aria-label={`Copy ${template.name} template code`}
                                  >
                                    {copiedId === template.id ? (
                                      <Check className="w-4 h-4" />
                                    ) : (
                                      <Copy className="w-4 h-4" />
                                    )}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy template code</p>
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => onInsert('\n' + template.template + '\n')}
                                    aria-label={`Insert ${template.name} template`}
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span className="ml-1">Insert</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Insert template into editor</p>
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>
                      </Card>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="suggested" className="flex flex-col flex-1 mt-4 min-h-0">
            {isLoadingSuggestions ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-3">
                    <div className="space-y-3 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-8 bg-gray-200 rounded w-20"></div>
                        <div className="h-8 bg-gray-200 rounded flex-1"></div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : suggestedTemplates.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50 animate-pulse" />
                <p className="font-medium">No suggestions yet</p>
                <p className="text-sm mt-2">
                  Start writing to get contextual template suggestions
                </p>
                <p className="text-xs mt-4 text-muted-foreground/60">
                  Templates are suggested when you write about costs, procedures, timelines, or FAQs
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Info className="w-4 h-4" />
                  <span>Based on your content, these templates might be helpful:</span>
                </div>
                
                <ScrollArea className="flex-1 min-h-0 pr-4">
                  <div className="space-y-3">
                    {suggestedTemplates.map((template) => {
                      const Icon = categoryIcons[template.category]
                      const colorClass = categoryColors[template.category]
                      
                      return (
                        <Card key={template.id} className="p-3 border-primary/20 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/40">
                          <div className="space-y-3">
                            {/* Header */}
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <Icon className={`w-4 h-4 ${colorClass}`} />
                                <h4 className="font-medium text-sm line-clamp-1">{template.name}</h4>
                                <Badge variant="secondary" className="text-xs">
                                  <Sparkles className="w-3 h-3 mr-1" />
                                  Suggested
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {template.description}
                              </p>
                              <div className="text-xs text-muted-foreground mt-1">
                                <span className="font-medium">Why suggested: </span>
                                Contains keywords matching your content
                              </div>
                            </div>
                            
                            {/* Actions */}
                            <TooltipProvider>
                              <div className="flex gap-1">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handlePreview(template)}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Preview template</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="sm"
                                      className="flex-1"
                                      onClick={() => onInsert('\n' + template.template + '\n')}
                                    >
                                      <Plus className="w-4 h-4" />
                                      <span className="ml-1">Insert</span>
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Insert template into editor</p>
                                  </TooltipContent>
                                </Tooltip>
                              </div>
                            </TooltipProvider>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                </ScrollArea>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="flex flex-col flex-1 mt-4 min-h-0">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-lg">{selectedTemplate.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{selectedTemplate.description}</p>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium">Template Code</Label>
                    <div className="h-[120px] w-full rounded border bg-muted mt-2 overflow-hidden">
                      <ScrollArea className="h-full w-full">
                        <pre className="p-3 text-xs">
                          <code className="whitespace-pre">{selectedTemplate.template}</code>
                        </pre>
                      </ScrollArea>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Rendered Preview</Label>
                    <div className="border rounded-lg p-4 mt-2 bg-background">
                      <div className="prose prose-sm max-w-none">
                        <TemplatePreview template={selectedTemplate} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Props Documentation */}
                  {selectedTemplate.props && selectedTemplate.props.length > 0 && (
                    <div>
                      <Label className="text-sm font-medium">Component Props</Label>
                      <div className="border rounded-lg mt-2 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead className="bg-muted">
                            <tr>
                              <th className="px-3 py-2 text-left font-medium">Prop</th>
                              <th className="px-3 py-2 text-left font-medium">Type</th>
                              <th className="px-3 py-2 text-left font-medium">Required</th>
                              <th className="px-3 py-2 text-left font-medium">Description</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {selectedTemplate.props.map((prop, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 font-mono text-xs">{prop.name}</td>
                                <td className="px-3 py-2">
                                  <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                    {prop.type}
                                  </code>
                                </td>
                                <td className="px-3 py-2">
                                  {prop.required ? (
                                    <Badge variant="destructive" className="text-xs">Yes</Badge>
                                  ) : (
                                    <Badge variant="secondary" className="text-xs">No</Badge>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-xs">
                                  {prop.description}
                                  {prop.example && (
                                    <div className="mt-1">
                                      <span className="text-muted-foreground">Example: </span>
                                      <code className="bg-muted px-1 py-0.5 rounded">{prop.example}</code>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => onInsert('\n' + selectedTemplate.template + '\n')}
                      className="flex-1"
                    >
                      Insert Template
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleCopy(selectedTemplate)}
                    >
                      {copiedId === selectedTemplate.id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Select a template to preview</p>
                <p className="text-sm mt-2">Click the preview button on any template to see how it will look</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="properties" className="flex flex-col flex-1 mt-4 min-h-0">
            <div className="space-y-4 h-full flex flex-col">
              {/* Detected Components Alert */}
              {detectedComponents.length > 0 && (
                <Alert className="py-2">
                  <Info className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    Found {detectedComponents.length} component{detectedComponents.length > 1 ? 's' : ''} in your content: {detectedComponents.join(', ')}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* Component Type Selector */}
              <div>
                <Label htmlFor="component-type" className="text-sm font-medium mb-2 block">
                  {detectedComponents.length > 0 ? 'Edit Component' : 'Insert Component'}
                </Label>
                <Select value={selectedComponentType} onValueChange={setSelectedComponentType}>
                  <SelectTrigger id="component-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Alert">Alert</SelectItem>
                    <SelectItem value="MedicationCard">Medication Card</SelectItem>
                    <SelectItem value="BeforeAfterGallery">Before/After Gallery</SelectItem>
                    <SelectItem value="SmartFAQ">Smart FAQ</SelectItem>
                    <SelectItem value="CostTable">Cost Table</SelectItem>
                    <SelectItem value="Timeline">Timeline</SelectItem>
                    <SelectItem value="ToothDiagram">Tooth Diagram</SelectItem>
                    <SelectItem value="SymptomSeverityScale">Symptom Severity Scale</SelectItem>
                    <SelectItem value="TreatmentComparisonTable">Treatment Comparison</SelectItem>
                    <SelectItem value="InteractiveToothChart">Interactive Tooth Chart</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Property Editor */}
              <div className="flex-1 overflow-auto">
                <MDXPropertyEditor
                  componentType={selectedComponentType}
                  initialProps={componentProps[selectedComponentType] || {}}
                  onGenerate={(code) => {
                    onInsert('\n' + code + '\n')
                    // Store the props for this component type
                    setComponentProps(prev => ({
                      ...prev,
                      [selectedComponentType]: prev
                    }))
                  }}
                  className="h-full"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="snippets" className="flex flex-col flex-1 mt-4 min-h-0">
            <div className="h-full">
              <MDXSnippetsLibrary
                onInsert={(content) => onInsert('\n' + content + '\n')}
                className="h-full border-0 shadow-none"
              />
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}