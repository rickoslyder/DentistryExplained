import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmergencyDisclaimerProps {
  variant?: 'default' | 'compact' | 'prominent'
  showEmergencyNumber?: boolean
}

export function EmergencyDisclaimer({ 
  variant = 'default',
  showEmergencyNumber = true 
}: EmergencyDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700 text-sm">
          <strong>Medical Emergency Disclaimer:</strong> This information is for guidance only and does not replace professional medical advice. 
          In a life-threatening emergency, call 999 immediately.
        </AlertDescription>
      </Alert>
    )
  }

  if (variant === 'prominent') {
    return (
      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="bg-red-100 rounded-full p-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-900 mb-2">
              Important Medical Disclaimer
            </h3>
            <div className="space-y-2 text-red-800">
              <p>
                The information provided on this page is for educational purposes only and should not be used 
                as a substitute for professional medical advice, diagnosis, or treatment.
              </p>
              <p>
                <strong>In case of a medical emergency:</strong>
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>If you have difficulty breathing or swallowing, call 999 immediately</li>
                <li>For severe facial swelling extending to the eye or neck, call 999</li>
                <li>For uncontrolled bleeding lasting more than 20 minutes, seek immediate medical attention</li>
                <li>Always err on the side of caution - if unsure, seek professional help</li>
              </ul>
            </div>
            {showEmergencyNumber && (
              <div className="mt-4 flex gap-3">
                <Button 
                  variant="destructive" 
                  size="sm"
                  asChild
                >
                  <a href="tel:999">
                    <Phone className="w-4 h-4 mr-2" />
                    Call 999
                  </a>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  asChild
                >
                  <a href="tel:111">
                    <Phone className="w-4 h-4 mr-2" />
                    Call NHS 111
                  </a>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <Alert className="border-red-200 bg-red-50 mb-6">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="text-red-800">Medical Disclaimer</AlertTitle>
      <AlertDescription className="text-red-700 mt-2">
        <p className="mb-2">
          This information is for educational purposes only and does not constitute medical advice. 
          It should not replace consultation with a qualified dental or medical professional.
        </p>
        <p>
          <strong>If you are experiencing a life-threatening emergency, call 999 immediately.</strong> 
          {' '}For urgent dental advice when your dentist is unavailable, call NHS 111.
        </p>
      </AlertDescription>
    </Alert>
  )
}