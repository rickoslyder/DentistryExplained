'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Settings2, 
  Code, 
  Eye,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { toast } from 'sonner'

// Component property definitions
const componentProperties = {
  Alert: {
    props: {
      type: { type: 'select', options: ['info', 'warning', 'success', 'error', 'tip', 'note', 'emergency', 'clinical-note'], default: 'info' },
      title: { type: 'text', required: false },
      message: { type: 'textarea', required: true }
    }
  },
  MedicationCard: {
    props: {
      name: { type: 'text', required: true },
      genericName: { type: 'text', required: false },
      dosage: { type: 'text', required: true },
      frequency: { type: 'text', required: true },
      duration: { type: 'text', required: true },
      withFood: { type: 'boolean', default: false },
      prescribedFor: { type: 'text', required: false },
      warnings: { type: 'array', itemType: 'text' },
      sideEffects: { type: 'array', itemType: 'text' },
      interactions: { type: 'array', itemType: 'text' }
    }
  },
  BeforeAfterGallery: {
    props: {
      title: { type: 'text', default: 'Treatment Results' },
      defaultBlurred: { type: 'boolean', default: true },
      images: { 
        type: 'array', 
        itemType: 'object',
        itemProps: {
          beforeUrl: { type: 'text', required: true },
          afterUrl: { type: 'text', required: true },
          procedure: { type: 'text' },
          duration: { type: 'text' },
          caption: { type: 'text' }
        }
      }
    }
  },
  SmartFAQ: {
    props: {
      title: { type: 'text', default: 'Frequently Asked Questions' },
      showViewCounts: { type: 'boolean', default: true },
      items: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          question: { type: 'text', required: true },
          answer: { type: 'textarea', required: true },
          category: { type: 'text', default: 'General' },
          tags: { type: 'array', itemType: 'text' }
        }
      }
    }
  },
  CostTable: {
    props: {
      costs: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          item: { type: 'text', required: true },
          cost: { type: 'text', required: true },
          nhs: { type: 'boolean', default: false }
        }
      }
    }
  },
  Timeline: {
    props: {
      items: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          date: { type: 'text', required: true },
          title: { type: 'text', required: true },
          description: { type: 'textarea', required: true }
        }
      }
    }
  },
  ToothDiagram: {
    props: {
      teeth: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          number: { type: 'text', required: true },
          status: { type: 'select', options: ['healthy', 'cavity', 'filled', 'crown', 'missing'], default: 'healthy' },
          label: { type: 'text', required: true }
        }
      },
      interactive: { type: 'boolean', default: true }
    }
  },
  SymptomSeverityScale: {
    props: {
      title: { type: 'text', default: 'Rate Your Current Symptoms' },
      description: { type: 'text', default: 'Use this scale to help your dentist understand your pain level' },
      showGuide: { type: 'boolean', default: true }
    }
  },
  TreatmentComparisonTable: {
    props: {
      title: { type: 'text', default: 'Treatment Options' },
      description: { type: 'text', default: 'Compare the available treatments' },
      treatments: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          name: { type: 'text', required: true },
          duration: { type: 'text', required: true },
          cost: { type: 'text', required: true },
          successRate: { type: 'text', required: true },
          nhsAvailable: { type: 'boolean', default: false },
          painLevel: { type: 'select', options: ['low', 'medium', 'high'], default: 'medium' },
          recoveryTime: { type: 'text', required: true }
        }
      }
    }
  },
  InteractiveToothChart: {
    props: {
      title: { type: 'text', default: 'Dental Examination Results' },
      description: { type: 'text', default: 'Click on any tooth to see details' },
      showLegend: { type: 'boolean', default: true },
      teeth: {
        type: 'array',
        itemType: 'object',
        itemProps: {
          id: { type: 'text', required: true },
          condition: { type: 'select', options: ['healthy', 'cavity', 'filling', 'crown', 'missing'], default: 'healthy' },
          notes: { type: 'text' }
        }
      }
    }
  }
}

interface PropertyEditorProps {
  componentType: string
  initialProps?: Record<string, any>
  onGenerate: (code: string) => void
  className?: string
}

export function MDXPropertyEditor({ 
  componentType, 
  initialProps = {},
  onGenerate,
  className 
}: PropertyEditorProps) {
  const [props, setProps] = useState<Record<string, any>>(initialProps)
  const [arrayItems, setArrayItems] = useState<Record<string, any[]>>({})
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState('properties')

  const componentDef = componentProperties[componentType as keyof typeof componentProperties]
  
  useEffect(() => {
    // Initialize array items
    const arrays: Record<string, any[]> = {}
    if (componentDef) {
      Object.entries(componentDef.props).forEach(([key, def]) => {
        if (def.type === 'array') {
          arrays[key] = props[key] || []
        }
      })
    }
    setArrayItems(arrays)
  }, [componentType, componentDef, props])

  if (!componentDef) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2" />
            <p>No property editor available for {componentType}</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handlePropChange = (key: string, value: any) => {
    setProps(prev => ({ ...prev, [key]: value }))
  }

  const handleArrayItemAdd = (key: string) => {
    const def = componentDef.props[key]
    if (def.type !== 'array') return

    let newItem: any
    if (def.itemType === 'text') {
      newItem = ''
    } else if (def.itemType === 'object' && def.itemProps) {
      newItem = {}
      Object.entries(def.itemProps).forEach(([propKey, propDef]: [string, any]) => {
        if (propDef.default !== undefined) {
          newItem[propKey] = propDef.default
        } else if (propDef.type === 'boolean') {
          newItem[propKey] = false
        } else {
          newItem[propKey] = ''
        }
      })
    }

    setArrayItems(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newItem]
    }))
    setProps(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), newItem]
    }))
  }

  const handleArrayItemChange = (key: string, index: number, value: any) => {
    setArrayItems(prev => ({
      ...prev,
      [key]: prev[key].map((item, i) => i === index ? value : item)
    }))
    setProps(prev => ({
      ...prev,
      [key]: prev[key].map((item: any, i: number) => i === index ? value : item)
    }))
  }

  const handleArrayItemRemove = (key: string, index: number) => {
    setArrayItems(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index)
    }))
    setProps(prev => ({
      ...prev,
      [key]: prev[key].filter((_: any, i: number) => i !== index)
    }))
  }

  const generateCode = () => {
    const filteredProps = Object.entries(props).reduce((acc, [key, value]) => {
      // Only include non-empty values
      if (value !== '' && value !== undefined && value !== null && 
          !(Array.isArray(value) && value.length === 0)) {
        acc[key] = value
      }
      return acc
    }, {} as Record<string, any>)

    let code = `<${componentType}`
    
    // Handle simple props
    Object.entries(filteredProps).forEach(([key, value]) => {
      const def = componentDef.props[key]
      if (!def) return

      if (def.type === 'boolean') {
        if (value) {
          code += `\n  ${key}={${value}}`
        }
      } else if (def.type === 'array') {
        // Skip arrays for inline props
      } else if (typeof value === 'string') {
        code += `\n  ${key}="${value}"`
      } else {
        code += `\n  ${key}={${JSON.stringify(value)}}`
      }
    })

    // Handle array props
    const hasArrayProps = Object.entries(filteredProps).some(([key, value]) => {
      const def = componentDef.props[key]
      return def?.type === 'array' && Array.isArray(value) && value.length > 0
    })

    if (hasArrayProps) {
      code += '\n'
      Object.entries(filteredProps).forEach(([key, value]) => {
        const def = componentDef.props[key]
        if (def?.type === 'array' && Array.isArray(value) && value.length > 0) {
          code += `  ${key}={${JSON.stringify(value, null, 2).split('\n').map((line, i) => i === 0 ? line : '  ' + line).join('\n')}}\n`
        }
      })
      code += '/>'
    } else {
      code += '\n/>'
    }

    return code
  }

  const handleCopy = () => {
    const code = generateCode()
    navigator.clipboard.writeText(code)
    setCopied(true)
    toast.success('Code copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleGenerate = () => {
    const code = generateCode()
    onGenerate(code)
  }

  const renderPropertyInput = (key: string, def: any, value: any) => {
    switch (def.type) {
      case 'text':
        return (
          <Input
            value={value || ''}
            onChange={(e) => handlePropChange(key, e.target.value)}
            placeholder={def.placeholder || `Enter ${key}`}
          />
        )
      
      case 'textarea':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handlePropChange(key, e.target.value)}
            placeholder={def.placeholder || `Enter ${key}`}
            rows={3}
          />
        )
      
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={key}
              checked={value || false}
              onCheckedChange={(checked) => handlePropChange(key, checked)}
            />
            <Label htmlFor={key}>{value ? 'Yes' : 'No'}</Label>
          </div>
        )
      
      case 'select':
        return (
          <Select value={value || def.default} onValueChange={(v) => handlePropChange(key, v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {def.options.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      case 'array':
        return (
          <div className="space-y-2">
            {arrayItems[key]?.map((item, index) => (
              <div key={index} className="flex gap-2">
                {def.itemType === 'text' ? (
                  <Input
                    value={item}
                    onChange={(e) => handleArrayItemChange(key, index, e.target.value)}
                    placeholder={`Item ${index + 1}`}
                  />
                ) : def.itemType === 'object' && def.itemProps ? (
                  <div className="flex-1 space-y-2 p-3 border rounded">
                    {Object.entries(def.itemProps).map(([propKey, propDef]: [string, any]) => (
                      <div key={propKey}>
                        <Label className="text-xs">{propKey}</Label>
                        {renderPropertyInput(propKey, propDef, item[propKey])}
                      </div>
                    ))}
                  </div>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleArrayItemRemove(key, index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleArrayItemAdd(key)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add {key}
            </Button>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          {componentType} Properties
        </CardTitle>
        <CardDescription>
          Configure the component properties and generate MDX code
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="properties">
              <Settings2 className="h-4 w-4 mr-2" />
              Properties
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Code Preview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="properties" className="space-y-4">
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {Object.entries(componentDef.props).map(([key, def]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>
                        {key}
                        {def.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      {def.type && (
                        <Badge variant="outline" className="text-xs">
                          {def.type}
                        </Badge>
                      )}
                    </div>
                    {renderPropertyInput(key, def, props[key])}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <ScrollArea className="h-[400px] w-full rounded border bg-muted p-4">
              <pre className="text-sm">
                <code>{generateCode()}</code>
              </pre>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Button onClick={handleGenerate} className="flex-1">
                <Code className="h-4 w-4 mr-2" />
                Insert Component
              </Button>
              <Button variant="outline" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}