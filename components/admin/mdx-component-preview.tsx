'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Copy, 
  Check, 
  Info,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Lightbulb,
  FileText,
  AlertTriangle,
  Stethoscope
} from 'lucide-react'
import { SymptomSeverityScale } from '@/components/dental/symptom-severity-scale'
import { TreatmentComparisonTable } from '@/components/dental/treatment-comparison-table'
import { InteractiveToothChart } from '@/components/dental/interactive-tooth-chart'
import { MedicationCard } from '@/components/dental/medication-card'
import { BeforeAfterGallery } from '@/components/dental/before-after-gallery'
import { AppointmentChecklist } from '@/components/dental/appointment-checklist'
import { SmartFAQ } from '@/components/dental/smart-faq'
import { ClinicalCalculator } from '@/components/dental/clinical-calculator'
import { VideoConsultationCard } from '@/components/dental/video-consultation-card'
import { InsuranceInfoBox } from '@/components/dental/insurance-info-box'
import { EnhancedCostTable } from '@/components/dental/enhanced-cost-table'
import { BranchingTimeline } from '@/components/dental/branching-timeline'
// Basic components that might not exist yet - we'll show placeholder previews
const CostTable = ({ costs }: any) => (
  <div className="border rounded-lg p-4">
    <p className="text-sm text-muted-foreground">Cost Table Component</p>
  </div>
)

const Timeline = ({ children }: any) => (
  <div className="border rounded-lg p-4">
    <p className="text-sm text-muted-foreground">Timeline Component</p>
    {children}
  </div>
)

const TimelineItem = ({ date, title, children }: any) => (
  <div className="pl-4 border-l-2 border-gray-200 ml-2">
    <p className="text-sm font-medium">{date}: {title}</p>
    <p className="text-sm text-muted-foreground">{children}</p>
  </div>
)

const FAQ = ({ question, children }: any) => (
  <div className="border rounded-lg p-4">
    <p className="font-medium">{question}</p>
    <p className="text-sm text-muted-foreground mt-2">{children}</p>
  </div>
)

const ProcedureSteps = ({ children }: any) => (
  <div className="border rounded-lg p-4">
    <p className="text-sm font-medium mb-2">Procedure Steps:</p>
    <ol className="list-decimal list-inside space-y-1 text-sm">
      {children}
    </ol>
  </div>
)

interface ComponentPreviewProps {
  componentType: string
  onInsert: (template: string) => void
  className?: string
}

export function MDXComponentPreview({ componentType, onInsert, className }: ComponentPreviewProps) {
  const [copied, setCopied] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<string>('info')

  const handleCopy = (template: string) => {
    navigator.clipboard.writeText(template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const alertVariants = [
    { value: 'info', label: 'Info', icon: Info },
    { value: 'warning', label: 'Warning', icon: AlertTriangle },
    { value: 'success', label: 'Success', icon: CheckCircle2 },
    { value: 'error', label: 'Error', icon: XCircle },
    { value: 'tip', label: 'Tip', icon: Lightbulb },
    { value: 'note', label: 'Note', icon: FileText },
    { value: 'emergency', label: 'Emergency', icon: AlertCircle },
    { value: 'clinical-note', label: 'Clinical Note', icon: Stethoscope }
  ]

  const componentExamples = {
    alert: {
      title: 'Alert Component',
      description: 'Display important messages with various styles',
      template: (variant: string) => `<Alert type="${variant}">
  Your alert message here
</Alert>`,
      preview: (variant: string) => {
        const variantConfig = alertVariants.find(v => v.value === variant)!
        const Icon = variantConfig.icon
        return (
          <Alert variant={variant as any}>
            <Icon className="h-4 w-4" />
            <AlertTitle>Alert Title</AlertTitle>
            <AlertDescription>
              This is an example {variantConfig.label.toLowerCase()} alert message.
            </AlertDescription>
          </Alert>
        )
      },
      variants: true
    },
    symptomScale: {
      title: 'Symptom Severity Scale',
      description: 'Interactive scale for patients to rate pain or discomfort',
      template: () => `<SymptomSeverityScale 
  title="Rate Your Pain"
  description="Click on the scale to indicate your current level of pain"
  showGuide={true}
/>`,
      preview: () => (
        <SymptomSeverityScale 
          title="Rate Your Pain"
          description="Click on the scale to indicate your current level of pain"
          showGuide={true}
        />
      )
    },
    treatmentComparison: {
      title: 'Treatment Comparison Table',
      description: 'Compare multiple treatment options side by side',
      template: () => `<TreatmentComparisonTable 
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
      preview: () => (
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
      )
    },
    toothChart: {
      title: 'Interactive Tooth Chart',
      description: 'Visual dental chart with condition indicators',
      template: () => `<InteractiveToothChart 
  title="Your Dental Chart"
  teeth={[
    { id: 16, condition: "filling" },
    { id: 25, condition: "crown" },
    { id: 31, condition: "missing" }
  ]}
  showLegend={true}
/>`,
      preview: () => (
        <InteractiveToothChart 
          title="Your Dental Chart"
          teeth={[
            { id: 16, condition: "filling" },
            { id: 25, condition: "crown" },
            { id: 31, condition: "missing" }
          ]}
          showLegend={true}
        />
      )
    },
    medicationCard: {
      title: 'Medication Card',
      description: 'Display prescription information clearly',
      template: () => `<MedicationCard medication={{
  name: "Amoxicillin",
  genericName: "Amoxicillin",
  dosage: "500mg",
  frequency: "3 times daily",
  duration: "7 days",
  withFood: true,
  sideEffects: ["Nausea", "Diarrhea", "Rash"],
  warnings: ["Complete full course", "Avoid alcohol"],
  prescribedFor: "Dental infection"
}} />`,
      preview: () => (
        <MedicationCard medication={{
          name: "Amoxicillin",
          genericName: "Amoxicillin",
          dosage: "500mg",
          frequency: "3 times daily",
          duration: "7 days",
          withFood: true,
          sideEffects: ["Nausea", "Diarrhea", "Rash"],
          warnings: ["Complete full course", "Avoid alcohol"],
          prescribedFor: "Dental infection"
        }} />
      )
    },
    beforeAfter: {
      title: 'Before/After Gallery',
      description: 'Show treatment results with privacy options',
      template: () => `<BeforeAfterGallery
  images={[
    {
      id: "1",
      beforeUrl: "/images/before.jpg",
      afterUrl: "/images/after.jpg",
      procedure: "Teeth Whitening",
      duration: "1 hour",
      description: "Professional whitening treatment"
    }
  ]}
  defaultBlurred={true}
/>`,
      preview: () => (
        <div className="text-center p-8 text-muted-foreground">
          <p>Before/After Gallery Preview</p>
          <p className="text-sm mt-2">Component requires actual images</p>
        </div>
      )
    },
    appointmentChecklist: {
      title: 'Appointment Checklist',
      description: 'Interactive checklist for appointments',
      template: () => `<AppointmentChecklist
  appointmentType="Root Canal Treatment"
  appointmentDate="January 15, 2025"
  items={[
    { id: "1", text: "Avoid eating 2 hours before", category: "before", priority: "high" },
    { id: "2", text: "Take prescribed antibiotics", category: "before" },
    { id: "3", text: "Arrange transportation", category: "during" },
    { id: "4", text: "Rest for 24 hours", category: "after" }
  ]}
/>`,
      preview: () => (
        <AppointmentChecklist
          appointmentType="Root Canal Treatment"
          appointmentDate="January 15, 2025"
          items={[
            { id: "1", text: "Avoid eating 2 hours before", category: "before", priority: "high" },
            { id: "2", text: "Take prescribed antibiotics", category: "before" },
            { id: "3", text: "Arrange transportation", category: "during" },
            { id: "4", text: "Rest for 24 hours", category: "after" }
          ]}
        />
      )
    },
    smartFAQ: {
      title: 'Smart FAQ',
      description: 'Searchable FAQ with analytics',
      template: () => `<SmartFAQ
  items={[
    {
      id: "1",
      question: "How long will the treatment take?",
      answer: "Treatment typically takes 30-60 minutes.",
      category: "General",
      tags: ["duration", "timing"]
    },
    {
      id: "2",
      question: "Will it hurt?",
      answer: "Modern techniques ensure minimal discomfort.",
      category: "Pain Management",
      tags: ["pain", "comfort"]
    }
  ]}
/>`,
      preview: () => (
        <SmartFAQ
          items={[
            {
              id: "1",
              question: "How long will the treatment take?",
              answer: "Treatment typically takes 30-60 minutes.",
              category: "General",
              tags: ["duration", "timing"]
            },
            {
              id: "2",
              question: "Will it hurt?",
              answer: "Modern techniques ensure minimal discomfort.",
              category: "Pain Management",
              tags: ["pain", "comfort"]
            }
          ]}
        />
      )
    },
    clinicalCalculator: {
      title: 'Clinical Calculator',
      description: 'Medical calculations like BMI and dosage',
      template: () => `<ClinicalCalculator showHistory={true} />`,
      preview: () => (
        <ClinicalCalculator showHistory={false} />
      )
    },
    videoConsultation: {
      title: 'Video Consultation Card',
      description: 'Telemedicine appointment information',
      template: () => `<VideoConsultationCard
  consultation={{
    platform: "zoom",
    meetingLink: "https://zoom.us/j/123456789",
    meetingId: "123 456 789",
    password: "abc123",
    scheduledTime: "January 15, 2025 at 2:00 PM",
    duration: "30 minutes",
    dentistName: "Dr. Sarah Johnson",
    dentistEmail: "dr.johnson@dentalclinic.com"
  }}
/>`,
      preview: () => (
        <VideoConsultationCard
          consultation={{
            platform: "zoom",
            meetingLink: "https://zoom.us/j/123456789",
            meetingId: "123 456 789",
            password: "abc123",
            scheduledTime: "January 15, 2025 at 2:00 PM",
            duration: "30 minutes",
            dentistName: "Dr. Sarah Johnson",
            dentistEmail: "dr.johnson@dentalclinic.com"
          }}
        />
      )
    },
    insuranceInfo: {
      title: 'Insurance Information Box',
      description: 'Display insurance coverage details',
      template: () => `<InsuranceInfoBox
  insurance={{
    provider: "Dental Insurance Co",
    planName: "Premium Dental Plan",
    policyNumber: "POL123456",
    groupNumber: "GRP789",
    coverageType: "Private",
    coverageDetails: {
      preventive: 100,
      basic: 80,
      major: 50,
      orthodontic: 50,
      annual_maximum: 1500,
      deductible: 100,
      deductible_met: 50
    }
  }}
/>`,
      preview: () => (
        <InsuranceInfoBox
          insurance={{
            provider: "Dental Insurance Co",
            planName: "Premium Dental Plan",
            policyNumber: "POL123456",
            groupNumber: "GRP789",
            coverageType: "Private",
            coverageDetails: {
              preventive: 100,
              basic: 80,
              major: 50,
              orthodontic: 50,
              annual_maximum: 1500,
              deductible: 100,
              deductible_met: 50
            }
          }}
        />
      )
    },
    enhancedCostTable: {
      title: 'Enhanced Cost Table',
      description: 'Cost breakdown with payment calculator',
      template: () => `<EnhancedCostTable
  costs={[
    { item: "Consultation", cost: "£50-100", nhs: true },
    { item: "X-Ray", cost: "£25-50", nhs: true },
    { item: "Filling", cost: "£65.20", nhs: true },
    { item: "Crown", cost: "£282.80", nhs: true }
  ]}
  showPaymentCalculator={true}
  showInsuranceEstimator={true}
/>`,
      preview: () => (
        <EnhancedCostTable
          costs={[
            { item: "Consultation", cost: "£50-100", nhs: true },
            { item: "X-Ray", cost: "£25-50", nhs: true },
            { item: "Filling", cost: "£65.20", nhs: true },
            { item: "Crown", cost: "£282.80", nhs: true }
          ]}
          showPaymentCalculator={false}
          showInsuranceEstimator={false}
        />
      )
    },
    branchingTimeline: {
      title: 'Branching Timeline',
      description: 'Timeline with decision points',
      template: () => `<BranchingTimeline
  title="Treatment Journey"
  items={[
    {
      id: "1",
      title: "Initial Consultation",
      date: "Day 1",
      description: "Examination and diagnosis",
      type: "milestone"
    },
    {
      id: "2",
      title: "Treatment Decision",
      date: "Day 3",
      description: "Choose your treatment path",
      type: "decision",
      branches: [
        {
          id: "branch-1",
          condition: "Conservative Treatment",
          items: [{
            id: "3a",
            title: "Filling",
            date: "Day 7",
            description: "Simple restoration"
          }]
        },
        {
          id: "branch-2",
          condition: "Advanced Treatment",
          items: [{
            id: "3b",
            title: "Root Canal",
            date: "Day 7-14",
            description: "Complete treatment"
          }]
        }
      ]
    }
  ]}
/>`,
      preview: () => (
        <BranchingTimeline
          title="Treatment Journey"
          items={[
            {
              id: "1",
              title: "Initial Consultation",
              date: "Day 1",
              description: "Examination and diagnosis",
              type: "milestone"
            },
            {
              id: "2",
              title: "Treatment Decision",
              date: "Day 3",
              description: "Choose your treatment path",
              type: "decision",
              branches: [
                {
                  id: "branch-1",
                  condition: "Conservative Treatment",
                  items: [{
                    id: "3a",
                    title: "Filling",
                    date: "Day 7",
                    description: "Simple restoration"
                  }]
                }
              ]
            }
          ]}
        />
      )
    },
    costTable: {
      title: 'Basic Cost Table',
      description: 'Simple cost breakdown table',
      template: () => `<CostTable costs={[
  { item: "Consultation", cost: "£50-100", nhs: true },
  { item: "Treatment", cost: "£200-500", nhs: false }
]} />`,
      preview: () => (
        <CostTable costs={[
          { item: "Consultation", cost: "£50-100", nhs: true },
          { item: "Treatment", cost: "£200-500", nhs: false }
        ]} />
      )
    },
    timeline: {
      title: 'Basic Timeline',
      description: 'Simple timeline component',
      template: () => `<Timeline>
  <TimelineItem date="Week 1" title="Initial Visit">
    First examination and diagnosis
  </TimelineItem>
  <TimelineItem date="Week 2" title="Treatment">
    Main treatment procedure
  </TimelineItem>
  <TimelineItem date="Week 4" title="Follow-up">
    Check healing progress
  </TimelineItem>
</Timeline>`,
      preview: () => (
        <Timeline>
          <TimelineItem date="Week 1" title="Initial Visit">
            First examination and diagnosis
          </TimelineItem>
          <TimelineItem date="Week 2" title="Treatment">
            Main treatment procedure
          </TimelineItem>
          <TimelineItem date="Week 4" title="Follow-up">
            Check healing progress
          </TimelineItem>
        </Timeline>
      )
    },
    faq: {
      title: 'Basic FAQ',
      description: 'Question and answer component',
      template: () => `<FAQ question="Is the treatment painful?">
  We use modern anesthetics to ensure your comfort throughout the procedure.
</FAQ>`,
      preview: () => (
        <FAQ question="Is the treatment painful?">
          We use modern anesthetics to ensure your comfort throughout the procedure.
        </FAQ>
      )
    },
    procedureSteps: {
      title: 'Procedure Steps',
      description: 'Step-by-step instructions',
      template: () => `<ProcedureSteps>
  <li>Numb the area with local anesthetic</li>
  <li>Remove decay or damaged tissue</li>
  <li>Clean and prepare the tooth</li>
  <li>Place the filling material</li>
  <li>Shape and polish the restoration</li>
</ProcedureSteps>`,
      preview: () => (
        <ProcedureSteps>
          <li>Numb the area with local anesthetic</li>
          <li>Remove decay or damaged tissue</li>
          <li>Clean and prepare the tooth</li>
          <li>Place the filling material</li>
          <li>Shape and polish the restoration</li>
        </ProcedureSteps>
      )
    }
  }

  const component = componentExamples[componentType as keyof typeof componentExamples]
  if (!component) return null

  const currentTemplate = component.variants 
    ? component.template(selectedVariant) 
    : component.template()

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{component.title}</CardTitle>
        <CardDescription>{component.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="preview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="code">Code</TabsTrigger>
          </TabsList>
          
          <TabsContent value="preview" className="space-y-4">
            {component.variants && (
              <div className="flex flex-wrap gap-2 mb-4">
                {alertVariants.map((variant) => (
                  <Badge
                    key={variant.value}
                    variant={selectedVariant === variant.value ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setSelectedVariant(variant.value)}
                  >
                    <variant.icon className="w-3 h-3 mr-1" />
                    {variant.label}
                  </Badge>
                ))}
              </div>
            )}
            
            <div className="p-4 border rounded-lg bg-background">
              {component.variants ? component.preview(selectedVariant) : component.preview()}
            </div>
          </TabsContent>
          
          <TabsContent value="code" className="space-y-4">
            <ScrollArea className="h-[200px] w-full rounded border bg-muted p-4">
              <pre className="text-sm">
                <code>{currentTemplate}</code>
              </pre>
            </ScrollArea>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => onInsert('\n' + currentTemplate + '\n')}
                className="flex-1"
              >
                Insert Component
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleCopy(currentTemplate)}
              >
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