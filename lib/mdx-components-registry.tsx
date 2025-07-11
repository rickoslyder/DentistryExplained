/**
 * Central registry of all MDX components available in the editor
 * This ensures consistency between smart templates, AI suggestions, and the actual editor
 */

import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { cn } from '@/lib/utils'

// UI Components
import { Alert as CustomAlert, AlertDescription as CustomAlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { 
  AlertCircle, 
  Info, 
  CheckCircle2, 
  XCircle, 
  ChevronRight,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Pill,
  Shield,
  Video,
  Calculator,
  TrendingUp
} from 'lucide-react'

// Component type definitions
interface ComponentDefinition {
  name: string
  description: string
  category: 'content' | 'medical' | 'interactive' | 'utility'
  example: string
}

// Export component definitions for use in templates and AI
export const MDX_COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  // Content Components
  {
    name: 'Alert',
    category: 'content',
    description: 'Display important information with various types',
    example: '<Alert type="warning">Important information here</Alert>'
  },
  {
    name: 'FAQ',
    category: 'content',
    description: 'Frequently asked question with answer',
    example: '<FAQ question="How long does it take?">It typically takes 30-60 minutes.</FAQ>'
  },
  {
    name: 'ProcedureSteps',
    category: 'content',
    description: 'Numbered list of procedure steps',
    example: '<ProcedureSteps>\n  <li>First step</li>\n  <li>Second step</li>\n</ProcedureSteps>'
  },
  
  // Medical Components
  {
    name: 'SymptomSeverityScale',
    category: 'medical',
    description: 'Interactive pain rating scale 1-10',
    example: '<SymptomSeverityScale title="Rate Your Pain" description="Click to select" showGuide={true} />'
  },
  {
    name: 'TreatmentComparisonTable',
    category: 'medical',
    description: 'Compare multiple treatment options',
    example: '<TreatmentComparisonTable title="Treatment Options" treatments={[...]} />'
  },
  {
    name: 'InteractiveToothChart',
    category: 'medical',
    description: 'Visual dental chart with tooth conditions',
    example: '<InteractiveToothChart title="Dental Examination" teeth={[...]} showLegend={true} />'
  },
  {
    name: 'MedicationCard',
    category: 'medical',
    description: 'Display medication information',
    example: '<MedicationCard name="Amoxicillin" dosage="500mg" frequency="3x daily" duration="7 days" />'
  },
  
  // Interactive Components
  {
    name: 'BeforeAfterGallery',
    category: 'interactive',
    description: 'Show treatment results with slider',
    example: '<BeforeAfterGallery before="/before.jpg" after="/after.jpg" caption="Treatment results" />'
  },
  {
    name: 'AppointmentChecklist',
    category: 'interactive',
    description: 'Interactive checklist for appointments',
    example: '<AppointmentChecklist title="Before Your Visit" items={["Brush teeth", "Arrive early"]} />'
  },
  {
    name: 'SmartFAQ',
    category: 'interactive',
    description: 'Searchable FAQ section',
    example: '<SmartFAQ faqs={[{question: "...", answer: "...", category: "general"}]} />'
  },
  {
    name: 'ClinicalCalculator',
    category: 'interactive',
    description: 'Medical calculations tool',
    example: '<ClinicalCalculator type="bmi" title="BMI Calculator" />'
  },
  
  // Utility Components
  {
    name: 'Timeline',
    category: 'utility',
    description: 'Display events in chronological order',
    example: '<Timeline>\n  <TimelineItem date="Day 1" title="Consultation">Initial assessment</TimelineItem>\n</Timeline>'
  },
  {
    name: 'CostTable',
    category: 'utility',
    description: 'Display treatment costs',
    example: '<CostTable costs={[{item: "Exam", cost: "£50", nhs: true}]} />'
  },
  {
    name: 'VideoEmbed',
    category: 'utility',
    description: 'Embed educational videos',
    example: '<VideoEmbed url="https://youtube.com/..." title="How to brush properly" />'
  },
  {
    name: 'EnhancedCostTable',
    category: 'utility',
    description: 'Advanced cost breakdown with calculator',
    example: '<EnhancedCostTable items={[...]} showCalculator={true} />'
  },
  {
    name: 'BranchingTimeline',
    category: 'utility',
    description: 'Treatment journey with decision points',
    example: '<BranchingTimeline stages={[...]} />'
  },
  {
    name: 'VideoConsultationCard',
    category: 'utility',
    description: 'Telemedicine appointment information',
    example: '<VideoConsultationCard provider="Dr. Smith" datetime="2024-01-15 10:00" platform="Zoom" />'
  },
  {
    name: 'InsuranceInfoBox',
    category: 'utility',
    description: 'Insurance coverage details',
    example: '<InsuranceInfoBox provider="NHS" coverage="Band 2" cost="£65.20" />'
  },
]

// The actual component implementations
export const MDX_COMPONENTS = {
  // Next.js components
  Image,
  Link,
  
  // Basic formatting
  Alert: ({ type = 'info', children }: any) => {
    const variants = {
      info: { icon: Info, className: 'border-blue-200 bg-blue-50' },
      warning: { icon: AlertCircle, className: 'border-yellow-200 bg-yellow-50' },
      success: { icon: CheckCircle2, className: 'border-green-200 bg-green-50' },
      error: { icon: XCircle, className: 'border-red-200 bg-red-50' },
      tip: { icon: CheckCircle2, className: 'border-green-200 bg-green-50' },
      note: { icon: Info, className: 'border-blue-200 bg-blue-50' },
      emergency: { icon: AlertCircle, className: 'border-red-200 bg-red-50' },
      'clinical-note': { icon: Info, className: 'border-blue-200 bg-blue-50' },
    }
    
    const variant = variants[type as keyof typeof variants] || variants.info
    const Icon = variant.icon
    
    return (
      <CustomAlert className={cn('my-4', variant.className)}>
        <Icon className="h-4 w-4" />
        <CustomAlertDescription className="[&>strong]:font-semibold">
          {children}
        </CustomAlertDescription>
      </CustomAlert>
    )
  },
  
  // Medical components
  SymptomSeverityScale: ({ title, description, showGuide }: any) => (
    <div className="symptom-severity-scale my-4 p-4 border rounded-lg">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
      <div className="flex gap-2 items-center">
        <span className="text-sm font-medium">No Pain</span>
        <div className="flex gap-1 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <button 
              key={num} 
              className={cn(
                "flex-1 h-10 rounded text-sm font-medium transition-colors",
                num <= 3 ? 'bg-green-500 hover:bg-green-600 text-white' : 
                num <= 7 ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 
                'bg-red-500 hover:bg-red-600 text-white'
              )}
            >
              {num}
            </button>
          ))}
        </div>
        <span className="text-sm font-medium">Severe Pain</span>
      </div>
      {showGuide && (
        <div className="mt-3 text-xs text-gray-500">
          <p>1-3: Mild discomfort • 4-7: Moderate pain • 8-10: Severe pain requiring immediate attention</p>
        </div>
      )}
    </div>
  ),
  
  TreatmentComparisonTable: ({ title, description, treatments = [] }: any) => (
    <div className="treatment-comparison my-4">
      {title && <h3 className="font-semibold mb-2">{title}</h3>}
      {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Treatment</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">NHS</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pain Level</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recovery</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pros</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cons</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {treatments.map((treatment: any, index: number) => (
              <tr key={index}>
                <td className="px-4 py-3 text-sm font-medium">{treatment.name}</td>
                <td className="px-4 py-3 text-sm">{treatment.duration}</td>
                <td className="px-4 py-3 text-sm">{treatment.cost}</td>
                <td className="px-4 py-3 text-sm">{treatment.successRate}</td>
                <td className="px-4 py-3 text-sm">{treatment.nhsAvailable ? '✓' : '✗'}</td>
                <td className="px-4 py-3 text-sm">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs",
                    treatment.painLevel === 'low' ? 'bg-green-100 text-green-800' :
                    treatment.painLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  )}>
                    {treatment.painLevel}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">{treatment.recoveryTime}</td>
                <td className="px-4 py-3 text-sm">
                  {treatment.pros && (
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {treatment.pros.map((pro: string, i: number) => (
                        <li key={i} className="text-green-700">{pro}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td className="px-4 py-3 text-sm">
                  {treatment.cons && (
                    <ul className="list-disc list-inside text-xs space-y-1">
                      {treatment.cons.map((con: string, i: number) => (
                        <li key={i} className="text-red-700">{con}</li>
                      ))}
                    </ul>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  ),
  
  InteractiveToothChart: ({ title, description, teeth: initialTeeth = [], showLegend = true, onToothClick }: any) => {
    const [teeth, setTeeth] = React.useState(initialTeeth)
    const [selectedTooth, setSelectedTooth] = React.useState<number | null>(null)
    const conditions = ['healthy', 'filling', 'cavity', 'missing', 'crown', 'root-canal']
    
    const handleToothClick = (toothNum: number) => {
      setSelectedTooth(toothNum)
      const currentTooth = teeth.find((t: any) => t.id === toothNum)
      const currentCondition = currentTooth?.condition || 'healthy'
      const currentIndex = conditions.indexOf(currentCondition)
      const nextCondition = conditions[(currentIndex + 1) % conditions.length]
      
      setTeeth((prev: any[]) => {
        const existing = prev.findIndex(t => t.id === toothNum)
        if (existing >= 0) {
          const updated = [...prev]
          updated[existing] = { ...updated[existing], condition: nextCondition }
          return updated
        } else {
          return [...prev, { id: toothNum, condition: nextCondition }]
        }
      })
      
      if (onToothClick) {
        onToothClick(toothNum, nextCondition)
      }
    }
    
    const getToothColor = (condition: string) => {
      switch (condition) {
        case 'healthy': return 'bg-green-500 text-white hover:bg-green-600'
        case 'filling': return 'bg-yellow-500 text-white hover:bg-yellow-600'
        case 'cavity': return 'bg-red-500 text-white hover:bg-red-600'
        case 'missing': return 'bg-gray-300 hover:bg-gray-400'
        case 'crown': return 'bg-purple-500 text-white hover:bg-purple-600'
        case 'root-canal': return 'bg-orange-500 text-white hover:bg-orange-600'
        default: return 'bg-gray-200 hover:bg-gray-300'
      }
    }
    
    return (
      <div className="interactive-tooth-chart my-4 p-4 border rounded-lg">
        {title && <h3 className="font-semibold mb-2">{title}</h3>}
        {description && <p className="text-sm text-gray-600 mb-3">{description}</p>}
        
        <div className="space-y-4">
          {/* Upper teeth */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Upper Teeth</p>
            <div className="grid grid-cols-16 gap-1">
              {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map(toothNum => {
                const tooth = teeth.find((t: any) => t.id === toothNum)
                return (
                  <div
                    key={toothNum}
                    onClick={() => handleToothClick(toothNum)}
                    className={cn(
                      "aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200",
                      getToothColor(tooth?.condition || 'healthy'),
                      selectedTooth === toothNum && 'ring-2 ring-blue-600 ring-offset-1'
                    )}
                    title={`Tooth ${toothNum}: ${tooth?.condition || 'healthy'} - Click to change`}
                  >
                    {toothNum}
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Lower teeth */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Lower Teeth</p>
            <div className="grid grid-cols-16 gap-1">
              {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map(toothNum => {
                const tooth = teeth.find((t: any) => t.id === toothNum)
                return (
                  <div
                    key={toothNum}
                    onClick={() => handleToothClick(toothNum)}
                    className={cn(
                      "aspect-square rounded flex items-center justify-center text-xs font-medium cursor-pointer transition-all duration-200",
                      getToothColor(tooth?.condition || 'healthy'),
                      selectedTooth === toothNum && 'ring-2 ring-blue-600 ring-offset-1'
                    )}
                    title={`Tooth ${toothNum}: ${tooth?.condition || 'healthy'} - Click to change`}
                  >
                    {toothNum}
                  </div>
                )
              })}
            </div>
          </div>
          
          {showLegend && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Legend (click teeth to change condition):</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Healthy</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span>Filling</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span>Cavity</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-gray-300 rounded"></div>
                  <span>Missing</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-purple-500 rounded"></div>
                  <span>Crown</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span>Root Canal</span>
                </div>
              </div>
            </div>
          )}
          
          {selectedTooth && (
            <div className="mt-4 p-3 bg-blue-50 rounded text-sm">
              <p className="font-medium">Selected: Tooth {selectedTooth}</p>
              <p className="text-xs text-gray-600 mt-1">Click any tooth to cycle through conditions</p>
            </div>
          )}
        </div>
      </div>
    )
  },
  
  MedicationCard: ({ name, dosage, frequency, duration, instructions }: any) => (
    <Card className="my-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Pill className="w-5 h-5" />
          {name}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Dosage</p>
            <p className="font-medium">{dosage}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Frequency</p>
            <p className="font-medium">{frequency}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Duration</p>
            <p className="font-medium">{duration}</p>
          </div>
        </div>
        {instructions && (
          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground">Instructions</p>
            <p className="text-sm">{instructions}</p>
          </div>
        )}
      </CardContent>
    </Card>
  ),
  
  // Interactive components
  BeforeAfterGallery: ({ before, after, caption }: any) => (
    <div className="before-after-gallery my-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm font-medium mb-2">Before</p>
          <img src={before} alt="Before treatment" className="w-full rounded-lg" />
        </div>
        <div>
          <p className="text-sm font-medium mb-2">After</p>
          <img src={after} alt="After treatment" className="w-full rounded-lg" />
        </div>
      </div>
      {caption && <p className="text-sm text-center text-gray-600 mt-2">{caption}</p>}
    </div>
  ),
  
  AppointmentChecklist: ({ title, items = [] }: any) => (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {items.map((item: string, index: number) => (
            <li key={index} className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm">{item}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  ),
  
  SmartFAQ: ({ faqs = [] }: any) => (
    <div className="smart-faq my-4 space-y-2">
      {faqs.map((faq: any, index: number) => (
        <details key={index} className="group">
          <summary className="cursor-pointer list-none p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
            <div className="flex items-center justify-between">
              <span className="font-medium">{faq.question}</span>
              <ChevronRight className="w-4 h-4 transition-transform group-open:rotate-90" />
            </div>
          </summary>
          <div className="p-3 pt-0">
            <p className="text-sm text-gray-700">{faq.answer}</p>
            {faq.category && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {faq.category}
              </Badge>
            )}
          </div>
        </details>
      ))}
    </div>
  ),
  
  ClinicalCalculator: ({ type, title }: any) => {
    const [inputs, setInputs] = React.useState<Record<string, number>>({})
    const [result, setResult] = React.useState<string | null>(null)
    
    const calculators = {
      'bmi': {
        title: 'BMI Calculator',
        fields: [
          { name: 'weight', label: 'Weight (kg)', min: 20, max: 300 },
          { name: 'height', label: 'Height (cm)', min: 100, max: 250 }
        ],
        calculate: (values: Record<string, number>) => {
          const heightM = values.height / 100
          const bmi = values.weight / (heightM * heightM)
          const category = bmi < 18.5 ? 'Underweight' :
                          bmi < 25 ? 'Normal weight' :
                          bmi < 30 ? 'Overweight' : 'Obese'
          return `BMI: ${bmi.toFixed(1)} (${category})`
        }
      },
      'fluoride': {
        title: 'Fluoride Dosage Calculator',
        fields: [
          { name: 'age', label: 'Age (years)', min: 0, max: 18 },
          { name: 'weight', label: 'Weight (kg)', min: 5, max: 100 }
        ],
        calculate: (values: Record<string, number>) => {
          const dosage = values.age < 3 ? 0 :
                        values.age < 6 ? 0.25 :
                        values.age < 16 ? 0.5 : 1.0
          return `Recommended fluoride dosage: ${dosage}mg daily`
        }
      },
      'dmft': {
        title: 'DMFT Score Calculator',
        fields: [
          { name: 'decayed', label: 'Decayed teeth', min: 0, max: 32 },
          { name: 'missing', label: 'Missing teeth', min: 0, max: 32 },
          { name: 'filled', label: 'Filled teeth', min: 0, max: 32 }
        ],
        calculate: (values: Record<string, number>) => {
          const total = values.decayed + values.missing + values.filled
          const risk = total === 0 ? 'Low' :
                      total <= 3 ? 'Moderate' :
                      total <= 7 ? 'High' : 'Very High'
          return `DMFT Score: ${total} (${risk} caries risk)`
        }
      },
      'anesthetic': {
        title: 'Local Anesthetic Dosage',
        fields: [
          { name: 'weight', label: 'Patient weight (kg)', min: 10, max: 150 },
          { name: 'concentration', label: 'Lidocaine concentration (%)', min: 0.5, max: 2, step: 0.5 }
        ],
        calculate: (values: Record<string, number>) => {
          const maxDose = 4.4 // mg/kg for lidocaine with epinephrine
          const totalMg = values.weight * maxDose
          const mlNeeded = totalMg / (values.concentration * 10)
          return `Maximum safe dose: ${totalMg.toFixed(0)}mg (${mlNeeded.toFixed(1)}ml of ${values.concentration}% solution)`
        }
      }
    }
    
    const calc = calculators[type as keyof typeof calculators] || calculators.bmi
    
    const handleCalculate = () => {
      const allFieldsFilled = calc.fields.every(field => inputs[field.name] !== undefined)
      if (allFieldsFilled) {
        setResult(calc.calculate(inputs))
      }
    }
    
    React.useEffect(() => {
      handleCalculate()
    }, [inputs])
    
    return (
      <Card className="my-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            {title || calc.title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {calc.fields.map(field => (
            <div key={field.name} className="space-y-2">
              <label className="text-sm font-medium">{field.label}</label>
              <input
                type="number"
                min={field.min}
                max={field.max}
                step={field.step || 1}
                value={inputs[field.name] || ''}
                onChange={(e) => setInputs(prev => ({
                  ...prev,
                  [field.name]: parseFloat(e.target.value)
                }))}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder={`${field.min} - ${field.max}`}
              />
            </div>
          ))}
          
          {result && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="font-medium text-blue-900">{result}</p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>* This calculator is for educational purposes only.</p>
            <p>Always consult with a dental professional for clinical decisions.</p>
          </div>
        </CardContent>
      </Card>
    )
  },
  
  // Utility components
  Timeline: ({ children }: any) => (
    <div className="timeline border-l-2 border-primary ml-4 pl-8 space-y-6 my-4">
      {children}
    </div>
  ),
  
  TimelineItem: ({ date, title, children }: any) => (
    <div className="relative">
      <div className="absolute -left-10 w-4 h-4 bg-primary rounded-full"></div>
      <div className="text-sm text-gray-500 mb-1">{date}</div>
      <h4 className="font-semibold mb-2">{title}</h4>
      <div className="text-gray-700">{children}</div>
    </div>
  ),
  
  CostTable: ({ costs = [] }: { costs?: Array<{ item: string; cost: string; nhs?: boolean }> }) => (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Treatment
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cost
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              NHS Available
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {costs.map((item, index) => (
            <tr key={index}>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {item.item}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.cost}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {item.nhs ? '✓' : '✗'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ),
  
  FAQ: ({ question, children }: any) => (
    <div className="faq mb-4 p-4 bg-gray-50 rounded-lg">
      <h4 className="font-semibold mb-2">Q: {question}</h4>
      <div className="text-gray-700">A: {children}</div>
    </div>
  ),
  
  ProcedureSteps: ({ children }: any) => (
    <ol className="procedure-steps space-y-4 list-decimal list-inside my-4">
      {children}
    </ol>
  ),
  
  VideoEmbed: ({ url, title }: any) => (
    <div className="video-embed mb-6">
      <div className="relative pb-[56.25%] h-0">
        <iframe
          src={url}
          title={title || 'Video'}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute top-0 left-0 w-full h-full rounded-lg"
        />
      </div>
      {title && <p className="text-sm text-gray-600 mt-2 text-center">{title}</p>}
    </div>
  ),
  
  // Enhanced components mentioned in AI suggestions
  EnhancedCostTable: ({ items = [], showCalculator = false, title }: any) => (
    <Card className="my-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-5 h-5" />
          {title || 'Cost Breakdown'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center py-2 border-b">
              <div>
                <p className="font-medium">{item.name}</p>
                {item.description && (
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-semibold">{item.cost}</p>
                {item.nhs !== undefined && (
                  <Badge variant={item.nhs ? "success" : "secondary"} className="text-xs">
                    {item.nhs ? 'NHS' : 'Private'}
                  </Badge>
                )}
              </div>
            </div>
          ))}
          {showCalculator && (
            <div className="pt-3 border-t">
              <div className="flex justify-between font-semibold">
                <span>Total Estimate:</span>
                <span>
                  £{items.reduce((sum: number, item: any) => {
                    const cost = parseFloat(item.cost.replace(/[£,]/g, ''))
                    return sum + (isNaN(cost) ? 0 : cost)
                  }, 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ),
  
  BranchingTimeline: ({ stages = [] }: any) => (
    <div className="branching-timeline my-4 space-y-4">
      {stages.map((stage: any, index: number) => (
        <div key={index} className="relative">
          {index < stages.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-300"></div>
          )}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold">{stage.title}</h4>
              <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
              {stage.options && (
                <div className="mt-2 space-y-1">
                  {stage.options.map((option: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <ChevronRight className="w-3 h-3" />
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              )}
              {stage.duration && (
                <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{stage.duration}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  ),
  
  VideoConsultationCard: ({ provider, datetime, platform, meetingLink }: any) => (
    <Card className="my-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Video Consultation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Provider</p>
            <p className="font-medium">{provider}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Date & Time</p>
            <p className="font-medium">{datetime}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Platform</p>
            <p className="font-medium">{platform}</p>
          </div>
        </div>
        {meetingLink && (
          <Button className="w-full" asChild>
            <a href={meetingLink} target="_blank" rel="noopener noreferrer">
              Join Meeting
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  ),
  
  InsuranceInfoBox: ({ provider, coverage, cost, details }: any) => (
    <Card className="my-4">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Insurance Coverage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Provider:</span>
            <span className="font-medium">{provider}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Coverage:</span>
            <span className="font-medium">{coverage}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Your Cost:</span>
            <span className="font-medium">{cost}</span>
          </div>
          {details && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">{details}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  ),
  
  // UI Components passthrough
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
  Separator,
  ChevronRight,
  
  // Dental-specific components
  ToothDiagram: ({ teeth = [] }: { teeth?: number[] }) => (
    <div className="tooth-diagram p-4 bg-gray-50 rounded-lg my-4">
      <div className="grid grid-cols-8 gap-2">
        {Array.from({ length: 32 }, (_, i) => (
          <div
            key={i + 1}
            className={`tooth ${teeth.includes(i + 1) ? 'bg-red-500' : 'bg-gray-300'} w-8 h-8 rounded text-center text-white text-xs flex items-center justify-center`}
          >
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  ),
}

// Export component names for validation
export const MDX_COMPONENT_NAMES = Object.keys(MDX_COMPONENTS)