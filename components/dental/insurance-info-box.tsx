'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CreditCard, 
  FileText, 
  Phone, 
  Globe, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  DollarSign,
  Download,
  Info,
  ChevronRight
} from 'lucide-react'

export interface InsuranceInfo {
  provider: string
  planName?: string
  policyNumber?: string
  groupNumber?: string
  coverageType: 'NHS' | 'Private' | 'Mixed'
  coverageDetails?: {
    preventive?: number // percentage covered
    basic?: number
    major?: number
    orthodontic?: number
    annual_maximum?: number
    deductible?: number
    deductible_met?: number
  }
  claimProcess?: {
    steps: string[]
    processingTime?: string
    directBilling?: boolean
  }
  requiredDocuments?: string[]
  contactInfo?: {
    phone?: string
    email?: string
    website?: string
    claimsPhone?: string
  }
  importantDates?: {
    policyStart?: string
    policyEnd?: string
    benefitReset?: string
  }
}

interface InsuranceInfoBoxProps {
  insurance: InsuranceInfo
  className?: string
  showClaimGuide?: boolean
  onDownloadInfo?: () => void
}

export function InsuranceInfoBox({ 
  insurance, 
  className,
  showClaimGuide = true,
  onDownloadInfo
}: InsuranceInfoBoxProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  const getCoverageColor = (percentage?: number) => {
    if (!percentage) return 'text-gray-500'
    if (percentage >= 80) return 'text-green-600'
    if (percentage >= 50) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount)
  }

  const defaultDocuments = [
    'Completed claim form',
    'Itemized treatment invoice',
    'Proof of payment (if applicable)',
    'Pre-authorization (for major procedures)',
    'X-rays or diagnostic images (if required)'
  ]

  const documents = insurance.requiredDocuments || defaultDocuments

  const deductibleProgress = insurance.coverageDetails?.deductible && insurance.coverageDetails?.deductible_met
    ? (insurance.coverageDetails.deductible_met / insurance.coverageDetails.deductible) * 100
    : 0

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <div>
              <CardTitle>{insurance.provider}</CardTitle>
              {insurance.planName && (
                <CardDescription>{insurance.planName}</CardDescription>
              )}
            </div>
          </div>
          <Badge variant={insurance.coverageType === 'NHS' ? 'default' : 'secondary'}>
            {insurance.coverageType}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Policy Information */}
        <div className="space-y-2">
          {insurance.policyNumber && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Policy Number:</span>
              <code className="bg-muted px-2 py-0.5 rounded">{insurance.policyNumber}</code>
            </div>
          )}
          {insurance.groupNumber && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Group Number:</span>
              <code className="bg-muted px-2 py-0.5 rounded">{insurance.groupNumber}</code>
            </div>
          )}
        </div>

        <Separator />

        {/* Coverage Details */}
        {insurance.coverageDetails && (
          <div className="space-y-3">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => toggleSection('coverage')}
            >
              <h4 className="font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Coverage Details
              </h4>
              <ChevronRight className={cn(
                "h-4 w-4 transition-transform",
                expandedSection === 'coverage' && "rotate-90"
              )} />
            </Button>
            
            {expandedSection === 'coverage' && (
              <div className="space-y-3 pl-6">
                {insurance.coverageDetails.preventive !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Preventive Care</span>
                    <span className={cn("font-medium", getCoverageColor(insurance.coverageDetails.preventive))}>
                      {insurance.coverageDetails.preventive}%
                    </span>
                  </div>
                )}
                
                {insurance.coverageDetails.basic !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Basic Procedures</span>
                    <span className={cn("font-medium", getCoverageColor(insurance.coverageDetails.basic))}>
                      {insurance.coverageDetails.basic}%
                    </span>
                  </div>
                )}
                
                {insurance.coverageDetails.major !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Major Procedures</span>
                    <span className={cn("font-medium", getCoverageColor(insurance.coverageDetails.major))}>
                      {insurance.coverageDetails.major}%
                    </span>
                  </div>
                )}
                
                {insurance.coverageDetails.orthodontic !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Orthodontic</span>
                    <span className={cn("font-medium", getCoverageColor(insurance.coverageDetails.orthodontic))}>
                      {insurance.coverageDetails.orthodontic}%
                    </span>
                  </div>
                )}
                
                <Separator />
                
                {insurance.coverageDetails.annual_maximum !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Annual Maximum</span>
                    <span className="font-medium">
                      {formatCurrency(insurance.coverageDetails.annual_maximum)}
                    </span>
                  </div>
                )}
                
                {insurance.coverageDetails.deductible !== undefined && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Annual Deductible</span>
                      <span className="font-medium">
                        {formatCurrency(insurance.coverageDetails.deductible)}
                      </span>
                    </div>
                    {insurance.coverageDetails.deductible_met !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span>Deductible Met</span>
                          <span>{formatCurrency(insurance.coverageDetails.deductible_met)}</span>
                        </div>
                        <Progress value={deductibleProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <Separator />

        {/* Claim Process */}
        {showClaimGuide && insurance.claimProcess && (
          <>
            <div className="space-y-3">
              <Button
                variant="ghost"
                className="w-full justify-between p-0 h-auto"
                onClick={() => toggleSection('claims')}
              >
                <h4 className="font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  How to File a Claim
                </h4>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  expandedSection === 'claims' && "rotate-90"
                )} />
              </Button>
              
              {expandedSection === 'claims' && (
                <div className="space-y-3 pl-6">
                  {insurance.claimProcess.directBilling && (
                    <Alert className="bg-green-50 border-green-200">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        This practice offers direct billing - we'll submit claims for you!
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <ol className="space-y-2">
                    {insurance.claimProcess.steps.map((step, index) => (
                      <li key={index} className="flex gap-3 text-sm">
                        <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-medium">
                          {index + 1}
                        </span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                  
                  {insurance.claimProcess.processingTime && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Processing time: {insurance.claimProcess.processingTime}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Separator />
          </>
        )}

        {/* Required Documents */}
        <div className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-between p-0 h-auto"
            onClick={() => toggleSection('documents')}
          >
            <h4 className="font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Required Documents
            </h4>
            <ChevronRight className={cn(
              "h-4 w-4 transition-transform",
              expandedSection === 'documents' && "rotate-90"
            )} />
          </Button>
          
          {expandedSection === 'documents' && (
            <div className="pl-6">
              <ul className="space-y-2">
                {documents.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Separator />

        {/* Contact Information */}
        {insurance.contactInfo && (
          <>
            <div className="space-y-3">
              <h4 className="font-medium">Contact Information</h4>
              <div className="space-y-2">
                {insurance.contactInfo.phone && (
                  <a
                    href={`tel:${insurance.contactInfo.phone}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {insurance.contactInfo.phone}
                  </a>
                )}
                
                {insurance.contactInfo.claimsPhone && (
                  <a
                    href={`tel:${insurance.contactInfo.claimsPhone}`}
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Claims: {insurance.contactInfo.claimsPhone}
                  </a>
                )}
                
                {insurance.contactInfo.website && (
                  <a
                    href={insurance.contactInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm hover:underline"
                  >
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Important Dates */}
        {insurance.importantDates && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Important Dates
            </h4>
            <div className="space-y-1 text-sm">
              {insurance.importantDates.policyStart && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Policy Start:</span>
                  <span>{insurance.importantDates.policyStart}</span>
                </div>
              )}
              {insurance.importantDates.policyEnd && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Policy End:</span>
                  <span>{insurance.importantDates.policyEnd}</span>
                </div>
              )}
              {insurance.importantDates.benefitReset && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Benefits Reset:</span>
                  <span>{insurance.importantDates.benefitReset}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Button */}
        {onDownloadInfo && (
          <Button 
            variant="outline" 
            className="w-full"
            onClick={onDownloadInfo}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Insurance Information
          </Button>
        )}

        {/* NHS Notice */}
        {insurance.coverageType === 'NHS' && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">NHS Dental Charges</p>
              <p className="text-sm mt-1">
                NHS dental treatment is subsidized but not free. 
                Current band charges apply. Emergency treatment is Band 1.
              </p>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}