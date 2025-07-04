"use client"

import { useState } from "react"
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Phone, AlertCircle, Clock, MapPin, ExternalLink, Stethoscope, Navigation } from "lucide-react"
import Link from "next/link"
import { SymptomChecker } from "@/components/emergency/symptom-checker"
import { EmergencyTimeline } from "@/components/emergency/emergency-timeline"
import { NearestServices } from "@/components/emergency/nearest-services"
import { NHS111Widget } from "@/components/emergency/nhs-111-widget"

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

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Emergency Banner */}
        <Alert className="mb-8 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800">Emergency Dental Care</AlertTitle>
          <AlertDescription className="text-red-700">
            If you're experiencing severe pain, facial swelling, or have suffered dental trauma, 
            seek immediate professional help.
          </AlertDescription>
        </Alert>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Dental Emergency Guide</h1>
          <p className="text-xl text-gray-600">
            Quick guidance for common dental emergencies and when to seek immediate care.
          </p>
        </div>

        {/* Emergency Contact Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="flex items-center text-primary">
                <Phone className="w-5 h-5 mr-2" />
                NHS 111
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                For urgent dental advice when your dentist is closed
              </p>
              <Button className="w-full" asChild>
                <a href="tel:111">
                  Call NHS 111
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Find Emergency Dentist
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Locate nearest emergency dental services
              </p>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/find-dentist?emergency=true">
                  Find Dentist
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                A&E Department
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                For severe facial swelling or uncontrolled bleeding
              </p>
              <Button variant="outline" className="w-full" asChild>
                <a href="https://www.nhs.uk/service-search/accident-and-emergency-services/locationsearch/428" target="_blank" rel="noopener noreferrer">
                  Find A&E <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Emergency Tools */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Emergency Assessment Tools</h2>
          
          <Tabs defaultValue="checker" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checker">
                <Stethoscope className="w-4 h-4 mr-2" />
                Symptom Checker
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="w-4 h-4 mr-2" />
                Emergency Timeline
              </TabsTrigger>
              <TabsTrigger value="services">
                <Navigation className="w-4 h-4 mr-2" />
                Find Services
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

        {/* Emergency Conditions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Common Dental Emergencies</h2>
          
          <div className="grid gap-6">
            {emergencyConditions.map((condition, index) => (
              <Card 
                key={index}
                className={
                  condition.urgency === 'critical' 
                    ? 'border-red-200' 
                    : condition.urgency === 'high'
                    ? 'border-orange-200'
                    : 'border-gray-200'
                }
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl">{condition.title}</CardTitle>
                    <span className={`
                      px-3 py-1 rounded-full text-sm font-medium
                      ${condition.urgency === 'critical' 
                        ? 'bg-red-100 text-red-800' 
                        : condition.urgency === 'high'
                        ? 'bg-orange-100 text-orange-800'
                        : 'bg-yellow-100 text-yellow-800'}
                    `}>
                      {condition.urgency === 'critical' ? 'Seek Immediate Care' : 
                       condition.urgency === 'high' ? 'Urgent' : 'Soon'}
                    </span>
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
      </div>
      
      <Footer />
    </div>
  )
}