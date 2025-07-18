'use client'

import { useMemo } from 'react'
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote'
import Image from 'next/image'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
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
import { AlertEnhanced } from '@/components/ui/alert-enhanced'
import { ClinicalCalculator } from '@/components/dental/clinical-calculator'
import { VideoConsultationCard } from '@/components/dental/video-consultation-card'
import { InsuranceInfoBox } from '@/components/dental/insurance-info-box'
import { EnhancedCostTable } from '@/components/dental/enhanced-cost-table'
import { BranchingTimeline } from '@/components/dental/branching-timeline'

// Custom MDX components
const components = {
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
  
  // Custom components
  Alert: ({ type = 'info', title, children, ...props }: any) => {
    const icons = {
      info: <Info className="h-4 w-4" />,
      warning: <AlertTriangle className="h-4 w-4" />,
      success: <CheckCircle2 className="h-4 w-4" />,
      error: <XCircle className="h-4 w-4" />,
      tip: <Lightbulb className="h-4 w-4" />,
      note: <FileText className="h-4 w-4" />,
      emergency: <AlertCircle className="h-4 w-4" />,
      'clinical-note': <Stethoscope className="h-4 w-4" />
    }
    
    const variants = {
      info: 'info',
      warning: 'warning',
      success: 'success',
      error: 'destructive',
      tip: 'tip',
      note: 'note',
      emergency: 'emergency',
      'clinical-note': 'clinical-note'
    }
    
    return (
      <Alert variant={variants[type as keyof typeof variants] as any} className="my-4" {...props}>
        {icons[type as keyof typeof icons]}
        {title && <AlertTitle>{title}</AlertTitle>}
        <AlertDescription>{children}</AlertDescription>
      </Alert>
    )
  },
  
  Card: ({ title, description, children, ...props }: any) => (
    <Card className="my-4" {...props}>
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle>{title}</CardTitle>}
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  ),
  
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
  
  Badge,
  Button,
  ChevronRight,
  
  // New dental-specific components
  SymptomSeverityScale,
  TreatmentComparisonTable,
  InteractiveToothChart,
  MedicationCard,
  BeforeAfterGallery,
  AppointmentChecklist,
  SmartFAQ,
  ClinicalCalculator,
  VideoConsultationCard,
  InsuranceInfoBox,
  EnhancedCostTable,
  BranchingTimeline,
  
  // Enhanced Alert with collapsible and timestamp support
  AlertEnhanced
}

interface MDXContentProps {
  content: string | MDXRemoteSerializeResult
  components?: Record<string, any>
}

export default function MDXContent({ content, components: customComponents }: MDXContentProps) {
  // If content is already serialized MDX, render it directly
  if (typeof content === 'object' && 'compiledSource' in content) {
    return (
      <MDXRemote 
        {...content}
        components={{ ...components, ...customComponents }} 
      />
    )
  }
  
  // Otherwise, render as plain HTML (for preview purposes)
  // Note: In production, you should serialize MDX on the server
  return (
    <div 
      className="mdx-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}