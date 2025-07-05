"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { MapPin, Shield, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface LocationConsentProps {
  onConsent: () => void
  onDecline: () => void
}

export function LocationConsent({ onConsent, onDecline }: LocationConsentProps) {
  const [agreed, setAgreed] = useState(false)
  const [showMoreInfo, setShowMoreInfo] = useState(false)

  const handleConsent = () => {
    if (agreed) {
      // Store consent in localStorage for future visits
      localStorage.setItem('emergencyLocationConsent', JSON.stringify({
        granted: true,
        timestamp: new Date().toISOString(),
        version: '1.0'
      }))
      onConsent()
    }
  }

  const handleDecline = () => {
    localStorage.setItem('emergencyLocationConsent', JSON.stringify({
      granted: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }))
    onDecline()
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 rounded-full p-2">
            <MapPin className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Location Access for Emergency Services</CardTitle>
            <CardDescription>
              Help us find the nearest emergency dental services for you
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            To show you the nearest emergency dental services, A&E departments, and pharmacies, 
            we need access to your location. This helps us provide:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
            <li>Distance to nearest emergency services</li>
            <li>Accurate directions and travel times</li>
            <li>Services currently open in your area</li>
            <li>Emergency contact numbers for your region</li>
          </ul>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Shield className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            <strong>Your Privacy Matters:</strong> Your location is used only to find nearby services 
            and is never stored or shared. You can enter a postcode instead if you prefer.
          </AlertDescription>
        </Alert>

        {showMoreInfo && (
          <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-2">
            <h4 className="font-medium">How we use your location:</h4>
            <ul className="list-disc pl-5 space-y-1 text-gray-600">
              <li>Location data is processed locally in your browser</li>
              <li>We do not store or track your location history</li>
              <li>Location is only used when you're viewing emergency services</li>
              <li>You can revoke access at any time in your browser settings</li>
              <li>We comply with GDPR and UK data protection laws</li>
            </ul>
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMoreInfo(!showMoreInfo)}
          className="text-primary"
        >
          <Info className="w-4 h-4 mr-2" />
          {showMoreInfo ? 'Show less' : 'Learn more about privacy'}
        </Button>

        <div className="flex items-start space-x-2 pt-4">
          <Checkbox
            id="consent"
            checked={agreed}
            onCheckedChange={(checked) => setAgreed(checked as boolean)}
          />
          <label
            htmlFor="consent"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            I consent to share my location to find nearest emergency services
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            onClick={handleConsent}
            disabled={!agreed}
            className="flex-1"
          >
            <MapPin className="w-4 h-4 mr-2" />
            Allow Location Access
          </Button>
          <Button
            variant="outline"
            onClick={handleDecline}
            className="flex-1"
          >
            Enter Postcode Instead
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 pt-2">
          You can change this preference at any time. Read our{' '}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          {' '}for more information.
        </p>
      </CardContent>
    </Card>
  )
}

// Helper function to check if consent has been given
export function hasLocationConsent(): boolean {
  if (typeof window === 'undefined') return false
  
  const consent = localStorage.getItem('emergencyLocationConsent')
  if (!consent) return false
  
  try {
    const consentData = JSON.parse(consent)
    // Check if consent is still valid (e.g., not older than 1 year)
    const consentDate = new Date(consentData.timestamp)
    const oneYearAgo = new Date()
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)
    
    return consentData.granted && consentDate > oneYearAgo
  } catch {
    return false
  }
}

// Helper function to clear consent
export function clearLocationConsent(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('emergencyLocationConsent')
  }
}