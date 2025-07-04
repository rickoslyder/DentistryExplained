"use client"

import { useState } from "react"
import { AlertTriangle, Phone, Clock, MapPin, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"

interface EmergencyScenario {
  id: string
  title: string
  severity: "high" | "medium" | "low"
  symptoms: string[]
  immediateAction: string
  timeframe: string
}

export function EmergencyGuideWidget() {
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null)
  const router = useRouter()

  const emergencyScenarios: EmergencyScenario[] = [
    {
      id: "severe-pain",
      title: "Severe Tooth Pain",
      severity: "high",
      symptoms: ["Intense, throbbing pain", "Swelling", "Fever", "Difficulty swallowing"],
      immediateAction: "Take pain relief, apply cold compress, see dentist immediately",
      timeframe: "Within 2-4 hours",
    },
    {
      id: "knocked-out-tooth",
      title: "Knocked Out Tooth",
      severity: "high",
      symptoms: ["Tooth completely out of socket", "Bleeding", "Pain"],
      immediateAction: "Keep tooth moist, handle by crown only, see dentist immediately",
      timeframe: "Within 30 minutes",
    },
    {
      id: "broken-tooth",
      title: "Broken/Chipped Tooth",
      severity: "medium",
      symptoms: ["Visible crack or chip", "Sharp edges", "Pain when biting"],
      immediateAction: "Rinse mouth, save any pieces, cover sharp edges",
      timeframe: "Within 24 hours",
    },
    {
      id: "lost-filling",
      title: "Lost Filling/Crown",
      severity: "low",
      symptoms: ["Missing filling", "Sensitivity", "Food getting stuck"],
      immediateAction: "Keep area clean, temporary filling material if available",
      timeframe: "Within 1-2 days",
    },
  ]

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const selectedScenarioData = emergencyScenarios.find((s) => s.id === selectedScenario)

  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader>
        <CardTitle className="flex items-center text-red-800">
          <AlertTriangle className="w-6 h-6 mr-3" />
          Dental Emergency Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!selectedScenario ? (
          <>
            <p className="text-red-700">
              Having a dental emergency? Select your situation below for immediate guidance.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {emergencyScenarios.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant="outline"
                  className="h-auto p-4 justify-between bg-white hover:bg-red-50 border-red-200 text-left"
                  onClick={() => setSelectedScenario(scenario.id)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 mb-1 pr-2">{scenario.title}</div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className={`${getSeverityColor(scenario.severity)} text-xs`}>
                        {scenario.severity}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </div>
                </Button>
              ))}
            </div>
            <Alert className="border-red-200 bg-red-100">
              <Phone className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                <strong>Emergency Hotline:</strong> Call 111 for urgent dental advice or 999 for life-threatening
                situations.
              </AlertDescription>
            </Alert>
          </>
        ) : (
          selectedScenarioData && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-red-800">{selectedScenarioData.title}</h3>
                <Badge variant="outline" className={getSeverityColor(selectedScenarioData.severity)}>
                  {selectedScenarioData.severity} priority
                </Badge>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-gray-900 mb-2">Immediate Action:</h4>
                <p className="text-gray-700 mb-3">{selectedScenarioData.immediateAction}</p>
                <div className="flex items-center text-sm text-red-600">
                  <Clock className="w-4 h-4 mr-1" />
                  <span className="font-medium">Seek care: {selectedScenarioData.timeframe}</span>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-red-200">
                <h4 className="font-medium text-gray-900 mb-2">Common Symptoms:</h4>
                <ul className="space-y-1">
                  {selectedScenarioData.symptoms.map((symptom, index) => (
                    <li key={index} className="text-gray-700 text-sm">
                      • {symptom}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={() => setSelectedScenario(null)} variant="outline" className="bg-white">
                  ← Back to Options
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={() => router.push('/find-dentist?emergency=true')}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Find Emergency Dentist
                </Button>
              </div>
            </div>
          )
        )}
      </CardContent>
    </Card>
  )
}
