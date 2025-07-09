"use client"

import { useState, useEffect } from "react"
import { X, Download, FileText, Users, Shield, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { analytics } from "@/lib/analytics-enhanced"
import Link from "next/link"

interface PreviewModalProps {
  isOpen: boolean
  onClose: () => void
  resourceType: string
  resourceTitle: string
}

// Mock preview data - in production this would come from an API
const previewData = {
  "treatment_consent_forms": {
    title: "Treatment Consent Forms",
    description: "Professional consent forms for all dental procedures",
    samples: [
      {
        id: "root-canal",
        title: "Root Canal Treatment Consent",
        preview: `PATIENT CONSENT FORM - ROOT CANAL TREATMENT

I, _________________, understand that I require root canal treatment for tooth number ____.

NATURE OF THE PROCEDURE:
Root canal treatment involves removing infected or damaged tissue from inside the tooth...

RISKS AND COMPLICATIONS:
• Instrument separation (rare)
• Post-operative discomfort
• Potential need for retreatment
• Crown requirement after treatment

ALTERNATIVES:
• Tooth extraction
• No treatment (risks explained)

CONSENT:
I have been informed of the risks, benefits, and alternatives...`,
        pages: 3
      },
      {
        id: "implant",
        title: "Dental Implant Consent",
        preview: `DENTAL IMPLANT CONSENT FORM

Patient Name: _________________
Date: _________________

PROCEDURE DESCRIPTION:
Dental implant placement involves surgically inserting a titanium post...

SUCCESS RATES:
• Upper jaw: 95-98%
• Lower jaw: 95-99%

POST-OPERATIVE CARE:
• Avoid smoking
• Maintain excellent oral hygiene
• Regular follow-up appointments...`,
        pages: 4
      }
    ],
    features: [
      "Legally compliant with UK standards",
      "Easy to customize for your practice",
      "Digital signature ready",
      "Patient-friendly language"
    ]
  },
  "patient_information_leaflets": {
    title: "Patient Information Leaflets",
    description: "Educational materials to help patients understand their treatment",
    samples: [
      {
        id: "post-op",
        title: "Post-Operative Care Instructions",
        preview: `POST-OPERATIVE CARE INSTRUCTIONS

After Your Dental Procedure:

IMMEDIATE CARE (First 24 Hours):
✓ Bite on gauze for 30-45 minutes
✓ Apply ice pack (20 min on/off)
✓ Rest and avoid strenuous activity
✓ Take prescribed medications

WHAT TO EXPECT:
• Some bleeding is normal
• Swelling peaks at 48-72 hours
• Mild to moderate discomfort

DIET:
• Soft foods only
• Avoid hot beverages
• No straws or smoking...`,
        pages: 2
      },
      {
        id: "hygiene",
        title: "Oral Hygiene Guide",
        preview: `YOUR GUIDE TO EXCELLENT ORAL HEALTH

Daily Routine:
1. BRUSHING (2x daily, 2 minutes)
   • Use fluoride toothpaste
   • 45-degree angle to gums
   • Gentle circular motions

2. FLOSSING (1x daily)
   • 18 inches of floss
   • C-shape around tooth
   • Below gumline

3. MOUTHWASH (Optional)
   • Antimicrobial rinse
   • 30 seconds swishing...`,
        pages: 3
      }
    ],
    features: [
      "Visual diagrams included",
      "Multiple language versions available",
      "QR codes for video tutorials",
      "Printable and digital formats"
    ]
  },
  "clinical_guidelines": {
    title: "Clinical Guidelines",
    description: "Evidence-based guidelines and best practices",
    samples: [
      {
        id: "infection",
        title: "Infection Control Protocol",
        preview: `INFECTION CONTROL GUIDELINES

STANDARD PRECAUTIONS:
1. Hand Hygiene
   • Before patient contact
   • After glove removal
   • Between procedures

2. Personal Protective Equipment
   • Gloves for all procedures
   • Masks and eye protection
   • Gowns when splashing likely

3. Instrument Processing
   • Clean → Disinfect → Sterilize
   • Biological indicators weekly...`,
        pages: 5
      },
      {
        id: "emergency",
        title: "Medical Emergency Protocols",
        preview: `MEDICAL EMERGENCY PROTOCOLS

ANAPHYLAXIS:
1. Stop procedure immediately
2. Call 999
3. Administer adrenaline (0.5mg IM)
4. High flow oxygen
5. Monitor vital signs

SYNCOPE (FAINTING):
1. Lower chair to supine
2. Elevate legs
3. Check airway/breathing
4. Monitor pulse
5. Glucose if diabetic...`,
        pages: 6
      }
    ],
    features: [
      "Updated quarterly",
      "Evidence-based recommendations",
      "Quick reference cards included",
      "CPD points available"
    ]
  }
}

export function PreviewModal({ isOpen, onClose, resourceType, resourceTitle }: PreviewModalProps) {
  const [currentSampleIndex, setCurrentSampleIndex] = useState(0)
  const [selectedTab, setSelectedTab] = useState("preview")
  
  const data = previewData[resourceType as keyof typeof previewData] || previewData["treatment_consent_forms"]
  const currentSample = data.samples[currentSampleIndex]

  useEffect(() => {
    if (isOpen) {
      analytics.track('professional_resource_preview_opened', {
        resource_type: resourceType,
        resource_title: resourceTitle,
      })
    }
  }, [isOpen, resourceType, resourceTitle])

  const handleDownloadSample = () => {
    analytics.track('professional_resource_sample_downloaded', {
      resource_type: resourceType,
      sample_id: currentSample.id,
      sample_title: currentSample.title,
    })
    
    // In production, this would trigger an actual download
    alert(`Sample download would start for: ${currentSample.title}`)
  }

  const nextSample = () => {
    setCurrentSampleIndex((prev) => (prev + 1) % data.samples.length)
  }

  const prevSample = () => {
    setCurrentSampleIndex((prev) => (prev - 1 + data.samples.length) % data.samples.length)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center justify-between">
            {data.title}
            <Badge variant="outline" className="ml-4">Preview Mode</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="preview">Document Preview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="pricing">Get Full Access</TabsTrigger>
          </TabsList>

          <TabsContent value="preview" className="flex-1 overflow-hidden">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={prevSample}
                    disabled={data.samples.length <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h3 className="font-semibold">{currentSample.title}</h3>
                    <p className="text-sm text-gray-500">
                      Sample {currentSampleIndex + 1} of {data.samples.length} • {currentSample.pages} pages
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextSample}
                    disabled={data.samples.length <= 1}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                <Button variant="outline" size="sm" onClick={handleDownloadSample}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Sample
                </Button>
              </div>

              <div className="flex-1 overflow-auto">
                <Card className="h-full">
                  <CardContent className="p-6">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {currentSample.preview}
                    </pre>
                    <div className="mt-8 p-4 bg-gray-100 rounded-lg text-center">
                      <p className="text-gray-600 mb-2">This is a preview. Full document includes:</p>
                      <ul className="text-sm text-gray-500 space-y-1">
                        <li>• Complete {currentSample.pages}-page document</li>
                        <li>• Editable format (Word/PDF)</li>
                        <li>• Your practice branding</li>
                        <li>• Regular updates</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>What's Included</CardTitle>
                <CardDescription>{data.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {data.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Shield className="w-3 h-3 text-green-600" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Why Choose Our Resources?</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Professionally Designed</p>
                    <p className="text-sm text-gray-600">Created by dental professionals for dental professionals</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Legally Compliant</p>
                    <p className="text-sm text-gray-600">Reviewed by legal experts to ensure UK compliance</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-semibold">Trusted by 2000+ Professionals</p>
                    <p className="text-sm text-gray-600">Join thousands of UK dental professionals</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-4">
            <div className="text-center py-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Access All Resources?</h3>
              <p className="text-gray-600 mb-8">
                Get instant access to our complete library of professional resources
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
                <Card className="hover-lift">
                  <CardHeader>
                    <CardTitle>Professional</CardTitle>
                    <div className="text-3xl font-bold">£9.99<span className="text-base font-normal text-gray-500">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">Perfect for individual practitioners</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        All consent forms
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Patient education materials
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Monthly updates
                      </li>
                    </ul>
                    <Link href="/sign-up?userType=professional&plan=professional">
                      <Button className="w-full mt-4">Start Free Trial</Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="hover-lift ring-2 ring-primary">
                  <CardHeader>
                    <Badge className="w-fit mb-2">Most Popular</Badge>
                    <CardTitle>Practice</CardTitle>
                    <div className="text-3xl font-bold">£29.99<span className="text-base font-normal text-gray-500">/month</span></div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-gray-600">Ideal for dental practices</p>
                    <ul className="text-sm space-y-2">
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Everything in Professional
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Up to 5 team members
                      </li>
                      <li className="flex items-center">
                        <Shield className="w-4 h-4 text-green-500 mr-2" />
                        Custom branding
                      </li>
                    </ul>
                    <Link href="/sign-up?userType=professional&plan=practice">
                      <Button className="w-full mt-4">Start Free Trial</Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                14-day free trial • No credit card required • Cancel anytime
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}