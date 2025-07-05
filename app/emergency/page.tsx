"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, AlertCircle, Clock, MapPin, ExternalLink, Stethoscope, Navigation } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { SymptomChecker } from "@/components/emergency/symptom-checker"
import { EmergencyTimeline } from "@/components/emergency/emergency-timeline"
import { NearestServices } from "@/components/emergency/nearest-services"
import { NHS111Widget } from "@/components/emergency/nhs-111-widget"
import { EmergencyDisclaimer } from "@/components/emergency/emergency-disclaimer"
import { EmergencyLogger } from "@/lib/emergency-audit"
import { EmergencyActionToolbar } from "@/components/emergency/emergency-action-toolbar"
import { SeverityBadge } from "@/components/emergency/severity-badge"
import { EmergencyDecisionTree } from "@/components/emergency/emergency-decision-tree"
import { AccessibilityControls } from "@/components/emergency/accessibility-controls"
import { OfflineIndicator } from "@/components/emergency/offline-indicator"
import { VisualInstructions } from "@/components/emergency/visual-instructions"

const emergencyConditions = [
  {
    title: "Severe Toothache",
    symptoms: [
      "Throbbing pain that won't subside",
      "Pain when biting or chewing",
      "Swelling around the tooth",
      "Fever or headache"
    ],
    firstAid: [
      "Rinse mouth with warm salt water",
      "Use dental floss to remove any trapped food",
      "Take over-the-counter pain medication",
      "Apply a cold compress to the outside of your cheek"
    ],
    urgency: "high"
  },
  {
    title: "Knocked-Out Tooth",
    symptoms: [
      "Tooth completely dislodged from socket",
      "Bleeding from the socket",
      "Pain and shock"
    ],
    firstAid: [
      "Handle tooth by the crown only",
      "Rinse gently with water if dirty",
      "Try to reinsert into socket if possible",
      "Keep moist in milk or saliva",
      "Seek immediate dental care (within 30 minutes)"
    ],
    urgency: "critical"
  },
  {
    title: "Broken or Chipped Tooth",
    symptoms: [
      "Visible crack or missing piece",
      "Sharp edge cutting tongue/cheek",
      "Pain when biting",
      "Sensitivity to temperature"
    ],
    firstAid: [
      "Rinse mouth with warm water",
      "Save any broken pieces",
      "Apply gauze if bleeding",
      "Use dental wax to cover sharp edges",
      "Avoid chewing on affected side"
    ],
    urgency: "high"
  },
  {
    title: "Dental Abscess",
    symptoms: [
      "Severe, persistent toothache",
      "Facial swelling",
      "Fever",
      "Bad taste in mouth",
      "Swollen lymph nodes"
    ],
    firstAid: [
      "Rinse with warm salt water",
      "Take pain medication as directed",
      "Do NOT apply heat to the area",
      "Seek immediate dental care"
    ],
    urgency: "critical"
  },
  {
    title: "Lost Filling or Crown",
    symptoms: [
      "Visible hole in tooth",
      "Sensitivity to temperature",
      "Pain when biting",
      "Rough edge felt with tongue"
    ],
    firstAid: [
      "Keep the area clean",
      "Use temporary filling material from pharmacy",
      "Avoid chewing on affected side",
      "Save the crown if found",
      "See dentist as soon as possible"
    ],
    urgency: "medium"
  },
  {
    title: "Bleeding Gums",
    symptoms: [
      "Persistent bleeding after brushing",
      "Spontaneous bleeding",
      "Swollen, red gums",
      "Bad breath"
    ],
    firstAid: [
      "Rinse with salt water",
      "Apply pressure with gauze",
      "Avoid aspirin",
      "Continue gentle oral hygiene",
      "See dentist if persistent"
    ],
    urgency: "medium"
  }
]

export default function EmergencyPage() {
  const [selectedEmergency, setSelectedEmergency] = useState<'knocked-out-tooth' | 'severe-pain' | 'bleeding' | 'general'>('general')

  useEffect(() => {
    // Log emergency page view
    EmergencyLogger.pageView('emergency-guide')
  }, [])

  const handleEmergencyCall = (type: '999' | '111' | 'dentist', reason?: string) => {
    EmergencyLogger.emergencyContact(type, reason)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Skip to main content link for screen readers */}
      <a href="#main-content" className="skip-link">
        Skip to main emergency content
      </a>
      
      <Header />
      
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Prominent Emergency Disclaimer */}
        <EmergencyDisclaimer variant="prominent" showEmergencyNumber={true} />

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dental Emergency Guide</h1>
          <p className="text-xl text-gray-600">
            Quick guidance for common dental emergencies and when to seek immediate care.
          </p>
        </div>

        {/* Emergency Decision Tree - Prominent Position */}
        <div className="mb-12">
          <EmergencyDecisionTree />
        </div>

        {/* Emergency Contact Options - Mobile Optimized */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-12">
          <Card className="border-2 border-primary shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center text-primary text-lg md:text-xl">
                <Phone className="w-6 h-6 md:w-5 md:h-5 mr-2" />
                NHS 111
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                For urgent dental advice when your dentist is closed
              </p>
              <Button 
                className="w-full h-12 md:h-10 text-base md:text-sm font-semibold" 
                onClick={() => handleEmergencyCall('111', 'urgent-dental-advice')}
                asChild
              >
                <a href="tel:111">
                  <Phone className="w-5 h-5 mr-2" />
                  Call NHS 111
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center text-lg md:text-xl">
                <MapPin className="w-6 h-6 md:w-5 md:h-5 mr-2" />
                Find Emergency Dentist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                Locate nearest emergency dental services
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 md:h-10 text-base md:text-sm font-semibold border-2" 
                asChild
              >
                <Link href="/find-dentist?emergency=true">
                  <MapPin className="w-5 h-5 mr-2" />
                  Find Dentist
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-200 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3 md:pb-6">
              <CardTitle className="flex items-center text-lg md:text-xl text-red-700">
                <AlertCircle className="w-6 h-6 md:w-5 md:h-5 mr-2" />
                A&E Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4 text-sm md:text-base">
                For severe facial swelling or uncontrolled bleeding
              </p>
              <Button 
                variant="outline" 
                className="w-full h-12 md:h-10 text-base md:text-sm font-semibold border-2 border-red-200 text-red-700 hover:bg-red-50" 
                asChild
              >
                <a href="https://www.nhs.uk/service-search/accident-and-emergency-services/locationsearch/428" target="_blank" rel="noopener noreferrer">
                  Find A&E 
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Emergency Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Assessment Tools</h2>
          
          <Tabs defaultValue="checker" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto p-1">
              <TabsTrigger value="checker" className="flex flex-col md:flex-row gap-1 py-3 px-2 text-xs md:text-sm">
                <Stethoscope className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Symptom Checker</span>
                <span className="md:hidden">Symptoms</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex flex-col md:flex-row gap-1 py-3 px-2 text-xs md:text-sm">
                <Clock className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Emergency Timeline</span>
                <span className="md:hidden">Timeline</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex flex-col md:flex-row gap-1 py-3 px-2 text-xs md:text-sm">
                <Navigation className="w-5 h-5 md:w-4 md:h-4" />
                <span className="hidden md:inline">Find Services</span>
                <span className="md:hidden">Services</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="checker" className="mt-6">
              <SymptomChecker />
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-6">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={selectedEmergency === 'knocked-out-tooth' ? 'default' : 'outline'}
                    onClick={() => setSelectedEmergency('knocked-out-tooth')}
                  >
                    Knocked-Out Tooth
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEmergency === 'severe-pain' ? 'default' : 'outline'}
                    onClick={() => setSelectedEmergency('severe-pain')}
                  >
                    Severe Pain
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEmergency === 'bleeding' ? 'default' : 'outline'}
                    onClick={() => setSelectedEmergency('bleeding')}
                  >
                    Bleeding
                  </Button>
                  <Button
                    size="sm"
                    variant={selectedEmergency === 'general' ? 'default' : 'outline'}
                    onClick={() => setSelectedEmergency('general')}
                  >
                    General Emergency
                  </Button>
                </div>
                <EmergencyTimeline emergencyType={selectedEmergency} />
              </div>
            </TabsContent>
            
            <TabsContent value="services" className="mt-6">
              <NearestServices />
            </TabsContent>
          </Tabs>
        </div>

        {/* Visual First Aid Instructions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Visual First Aid Instructions</h2>
          
          <Tabs defaultValue="knocked-out-tooth" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="knocked-out-tooth" className="flex flex-col gap-1 py-3">
                <span className="font-semibold">Knocked-Out Tooth</span>
                <span className="text-xs text-muted-foreground">Tooth preservation guide</span>
              </TabsTrigger>
              <TabsTrigger value="bleeding-control" className="flex flex-col gap-1 py-3">
                <span className="font-semibold">Bleeding Control</span>
                <span className="text-xs text-muted-foreground">Stop dental bleeding</span>
              </TabsTrigger>
              <TabsTrigger value="cold-compress" className="flex flex-col gap-1 py-3">
                <span className="font-semibold">Cold Compress</span>
                <span className="text-xs text-muted-foreground">Reduce swelling & pain</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="knocked-out-tooth" className="mt-6">
              <div className="space-y-4">
                <Alert className="border-orange-200 bg-orange-50">
                  <Clock className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-900">Time is Critical!</AlertTitle>
                  <AlertDescription className="text-orange-700">
                    A knocked-out tooth can often be saved if you act within 30 minutes. Follow these steps immediately.
                  </AlertDescription>
                </Alert>
                <VisualInstructions emergencyType="knocked-out-tooth" />
              </div>
            </TabsContent>
            
            <TabsContent value="bleeding-control" className="mt-6">
              <div className="space-y-4">
                <Alert className="border-blue-200 bg-blue-50">
                  <AlertCircle className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-900">Bleeding Control</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Follow these steps to control dental bleeding. If bleeding persists for more than 20 minutes, seek immediate medical attention.
                  </AlertDescription>
                </Alert>
                <VisualInstructions emergencyType="bleeding-control" />
              </div>
            </TabsContent>
            
            <TabsContent value="cold-compress" className="mt-6">
              <div className="space-y-4">
                <Alert className="border-green-200 bg-green-50">
                  <AlertCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-900">Pain & Swelling Relief</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Use a cold compress to reduce pain and swelling. Never apply ice directly to skin or teeth.
                  </AlertDescription>
                </Alert>
                <VisualInstructions emergencyType="cold-compress" />
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Emergency Conditions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Dental Emergencies</h2>
          
          <div className="grid gap-6">
            {emergencyConditions.map((condition, index) => (
              <Card 
                key={index}
                className={cn(
                  "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
                  condition.urgency === 'critical' 
                    ? 'border-red-300 bg-red-50/30' 
                    : condition.urgency === 'high'
                    ? 'border-orange-300 bg-orange-50/30'
                    : 'border-gray-200'
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{condition.title}</CardTitle>
                    <SeverityBadge 
                      severity={condition.urgency as 'critical' | 'high' | 'medium'} 
                      showPulse={condition.urgency === 'critical'}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Symptoms</h4>
                      <ul className="list-disc pl-5 space-y-1">
                        {condition.symptoms.map((symptom, idx) => (
                          <li key={idx} className="text-gray-600">{symptom}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">First Aid Steps</h4>
                      <ol className="list-decimal pl-5 space-y-1">
                        {condition.firstAid.map((step, idx) => (
                          <li key={idx} className="text-gray-600">{step}</li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* General First Aid Kit */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Dental Emergency Kit</CardTitle>
            <CardDescription>
              Keep these items handy for dental emergencies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Gauze pads for bleeding control</li>
                <li>Salt for mouth rinses</li>
                <li>Cold compress or ice pack</li>
                <li>Over-the-counter pain medication</li>
                <li>Dental floss</li>
              </ul>
              <ul className="list-disc pl-5 space-y-2 text-gray-600">
                <li>Temporary filling material</li>
                <li>Dental wax for sharp edges</li>
                <li>Small container with lid</li>
                <li>Milk (for storing knocked-out teeth)</li>
                <li>Your dentist's emergency number</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* NHS 111 Integration */}
        <div className="mb-12">
          <NHS111Widget />
        </div>

        {/* Important Notes */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Important Reminders</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <p>• This guide is for information only and doesn't replace professional dental care</p>
            <p>• Always seek professional help for dental emergencies</p>
            <p>• If experiencing difficulty breathing or swallowing, call 999 immediately</p>
            <p>• Keep your regular dentist's emergency contact information handy</p>
          </AlertDescription>
        </Alert>
      </main>
      
      <Footer />
      
      {/* Floating Emergency Action Toolbar */}
      <EmergencyActionToolbar />
      
      {/* Accessibility Controls */}
      <AccessibilityControls />
    </div>
  )
}