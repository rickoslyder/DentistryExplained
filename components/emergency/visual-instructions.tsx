"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, Eye, Printer } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface InstructionStep {
  title: string
  description: string
  illustration: React.ReactNode
  tips?: string[]
}

interface VisualInstructionsProps {
  emergencyType: 'knocked-out-tooth' | 'bleeding-control' | 'cold-compress'
  className?: string
}

const instructionSets: Record<string, InstructionStep[]> = {
  'knocked-out-tooth': [
    {
      title: "Step 1: Find and Handle the Tooth",
      description: "Pick up the tooth by the crown (top part) only. Never touch the root.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Hand holding tooth by crown */}
          <path d="M50 100 Q50 80 70 80 L130 80 Q150 80 150 100 L150 120 Q150 140 130 140 L70 140 Q50 140 50 120 Z" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
          {/* Tooth */}
          <path d="M90 60 Q90 40 100 40 Q110 40 110 60 L110 80 L90 80 Z" fill="white" stroke="#333" strokeWidth="2"/>
          <path d="M85 80 L115 80 L110 100 L105 120 L95 120 L90 100 Z" fill="white" stroke="#333" strokeWidth="2"/>
          {/* Crown label */}
          <text x="100" y="30" textAnchor="middle" fontSize="12" fill="#0066cc">CROWN</text>
          {/* Root label with X */}
          <text x="100" y="135" textAnchor="middle" fontSize="12" fill="#dc2626">ROOT ✗</text>
          {/* Check mark on crown */}
          <path d="M120 50 L125 55 L135 45" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tips: [
        "Handle gently to avoid damage",
        "Do not scrub or clean aggressively",
        "Time is critical - act quickly"
      ]
    },
    {
      title: "Step 2: Rinse if Necessary",
      description: "If the tooth is dirty, rinse it gently with milk or saline solution for 10 seconds.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Container with milk */}
          <rect x="60" y="80" width="80" height="100" fill="#f0f0f0" stroke="#333" strokeWidth="2" rx="5"/>
          <rect x="60" y="80" width="80" height="70" fill="#ffffff" stroke="none"/>
          <text x="100" y="120" textAnchor="middle" fontSize="14" fill="#333">MILK</text>
          {/* Tooth being rinsed */}
          <path d="M90 40 Q90 20 100 20 Q110 20 110 40 L110 60 L90 60 Z" fill="white" stroke="#333" strokeWidth="2"/>
          <path d="M85 60 L115 60 L110 80 L100 80 L90 80 Z" fill="white" stroke="#333" strokeWidth="2"/>
          {/* Water drops */}
          <circle cx="95" cy="90" r="3" fill="#60a5fa"/>
          <circle cx="105" cy="95" r="3" fill="#60a5fa"/>
          <circle cx="100" cy="100" r="3" fill="#60a5fa"/>
        </svg>
      ),
      tips: [
        "Use milk first choice, saline second",
        "Never use tap water",
        "Do not use soap or chemicals"
      ]
    },
    {
      title: "Step 3: Try to Reinsert",
      description: "Gently push the tooth back into its socket if possible. Have the person bite on gauze to hold it.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Jaw outline */}
          <path d="M40 100 Q40 60 100 60 Q160 60 160 100 L160 140 Q160 160 100 160 Q40 160 40 140 Z" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
          {/* Socket */}
          <rect x="95" y="80" width="10" height="20" fill="#ef5350" stroke="#333" strokeWidth="1"/>
          {/* Tooth with arrow */}
          <path d="M90 40 Q90 20 100 20 Q110 20 110 40 L110 60 L90 60 Z" fill="white" stroke="#333" strokeWidth="2"/>
          <path d="M85 60 L115 60 L110 75 L100 75 L90 75 Z" fill="white" stroke="#333" strokeWidth="2"/>
          {/* Arrow pointing down */}
          <path d="M100 65 L100 85 M95 80 L100 85 L105 80" stroke="#0066cc" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tips: [
        "Push gently, don't force",
        "Hold in place with clean gauze",
        "Seek dental care immediately"
      ]
    },
    {
      title: "Step 4: Store if Reinsertion Fails",
      description: "If you can't reinsert, store the tooth in milk or between cheek and gum.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Option 1: Milk container */}
          <g transform="translate(50, 50)">
            <rect x="0" y="20" width="40" height="50" fill="#f0f0f0" stroke="#333" strokeWidth="2" rx="3"/>
            <rect x="0" y="20" width="40" height="35" fill="#ffffff" stroke="none"/>
            <text x="20" y="50" textAnchor="middle" fontSize="10" fill="#333">MILK</text>
            {/* Tooth in milk */}
            <path d="M15 25 Q15 20 20 20 Q25 20 25 25 L25 30 L15 30 Z" fill="white" stroke="#333" strokeWidth="1"/>
          </g>
          {/* OR text */}
          <text x="100" y="80" textAnchor="middle" fontSize="14" fill="#666">OR</text>
          {/* Option 2: Mouth storage */}
          <g transform="translate(110, 50)">
            <ellipse cx="30" cy="40" rx="35" ry="25" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
            <path d="M10 40 Q30 35 50 40" fill="none" stroke="#333" strokeWidth="1"/>
            {/* Tooth between cheek and gum */}
            <circle cx="15" cy="45" r="5" fill="white" stroke="#333" strokeWidth="1"/>
            <text x="30" y="10" textAnchor="middle" fontSize="10" fill="#333">CHEEK</text>
          </g>
        </svg>
      ),
      tips: [
        "Keep tooth moist at all times",
        "Get to dentist within 30 minutes",
        "Do not store in water"
      ]
    }
  ],
  'bleeding-control': [
    {
      title: "Step 1: Apply Direct Pressure",
      description: "Use clean gauze or cloth and apply firm, continuous pressure to the bleeding area.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Mouth outline */}
          <ellipse cx="100" cy="100" rx="60" ry="40" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
          {/* Bleeding area */}
          <circle cx="100" cy="100" r="15" fill="#ef5350" opacity="0.6"/>
          {/* Gauze */}
          <rect x="85" y="85" width="30" height="30" fill="white" stroke="#333" strokeWidth="2" rx="2"/>
          <line x1="90" y1="100" x2="110" y2="100" stroke="#e0e0e0" strokeWidth="1"/>
          <line x1="100" y1="90" x2="100" y2="110" stroke="#e0e0e0" strokeWidth="1"/>
          {/* Hand applying pressure */}
          <path d="M70 80 Q70 70 80 70 L120 70 Q130 70 130 80 L130 90 L115 90 L115 100 L100 100 L100 90 L85 90 L85 100 L70 100 Z" fill="#fdbcb4" stroke="#333" strokeWidth="2"/>
          {/* Pressure arrows */}
          <path d="M100 60 L100 75 M95 70 L100 75 L105 70" stroke="#0066cc" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
      tips: [
        "Maintain pressure for 10-15 minutes",
        "Don't keep checking - be patient",
        "Use clean material only"
      ]
    },
    {
      title: "Step 2: Bite Down on Gauze",
      description: "Fold gauze into a thick pad and bite down firmly to maintain pressure.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Upper jaw */}
          <path d="M40 80 Q40 60 100 60 Q160 60 160 80 L160 90 L40 90 Z" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
          {/* Lower jaw */}
          <path d="M40 110 L160 110 L160 120 Q160 140 100 140 Q40 140 40 120 Z" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
          {/* Gauze between teeth */}
          <rect x="70" y="85" width="60" height="30" fill="white" stroke="#333" strokeWidth="2" rx="5"/>
          <line x1="80" y1="100" x2="120" y2="100" stroke="#e0e0e0" strokeWidth="1"/>
          <line x1="90" y1="90" x2="90" y2="110" stroke="#e0e0e0" strokeWidth="1"/>
          <line x1="110" y1="90" x2="110" y2="110" stroke="#e0e0e0" strokeWidth="1"/>
          {/* Bite force arrows */}
          <path d="M100 70 L100 80" stroke="#0066cc" strokeWidth="3" markerEnd="url(#arrowhead)"/>
          <path d="M100 130 L100 120" stroke="#0066cc" strokeWidth="3" markerEnd="url(#arrowhead)"/>
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#0066cc"/>
            </marker>
          </defs>
        </svg>
      ),
      tips: [
        "Bite firmly but don't grind",
        "Replace gauze if soaked",
        "Keep head elevated"
      ]
    }
  ],
  'cold-compress': [
    {
      title: "Step 1: Prepare Cold Compress",
      description: "Wrap ice or frozen vegetables in a thin towel. Never apply ice directly to skin.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Ice cubes */}
          <rect x="70" y="60" width="25" height="25" fill="#e3f2fd" stroke="#333" strokeWidth="2"/>
          <rect x="85" y="55" width="25" height="25" fill="#e3f2fd" stroke="#333" strokeWidth="2"/>
          <rect x="75" y="75" width="25" height="25" fill="#e3f2fd" stroke="#333" strokeWidth="2"/>
          <rect x="90" y="70" width="25" height="25" fill="#e3f2fd" stroke="#333" strokeWidth="2"/>
          {/* Towel wrapping */}
          <path d="M50 50 Q50 40 60 40 L140 40 Q150 40 150 50 L150 110 Q150 120 140 120 L60 120 Q50 120 50 110 Z" fill="none" stroke="#4caf50" strokeWidth="3" strokeDasharray="5,5"/>
          <text x="100" y="140" textAnchor="middle" fontSize="12" fill="#333">Wrapped in towel</text>
          {/* Warning */}
          <circle cx="160" cy="60" r="15" fill="#ff9800" stroke="#333" strokeWidth="2"/>
          <text x="160" y="65" textAnchor="middle" fontSize="16" fill="white">!</text>
          <text x="160" y="85" textAnchor="middle" fontSize="10" fill="#333">Not directly</text>
          <text x="160" y="95" textAnchor="middle" fontSize="10" fill="#333">on skin</text>
        </svg>
      ),
      tips: [
        "Always use a barrier",
        "Check skin every few minutes",
        "Use for 15-20 minutes at a time"
      ]
    },
    {
      title: "Step 2: Apply to Affected Area",
      description: "Hold compress gently against the outside of your cheek over the painful area.",
      illustration: (
        <svg viewBox="0 0 200 200" className="w-full h-auto">
          <rect width="200" height="200" fill="#f8f9fa"/>
          {/* Face profile */}
          <ellipse cx="100" cy="100" rx="50" ry="60" fill="#fce4ec" stroke="#333" strokeWidth="2"/>
          {/* Eye */}
          <circle cx="85" cy="85" r="5" fill="#333"/>
          {/* Mouth */}
          <path d="M80 115 Q90 120 100 115" fill="none" stroke="#333" strokeWidth="2"/>
          {/* Swollen area */}
          <circle cx="120" cy="110" r="20" fill="#ffcdd2" stroke="#ef5350" strokeWidth="2" strokeDasharray="3,3"/>
          {/* Cold compress */}
          <rect x="130" y="95" width="40" height="30" fill="#e3f2fd" stroke="#333" strokeWidth="2" rx="5"/>
          <path d="M135 105 L165 105 M135 115 L165 115" stroke="#90caf9" strokeWidth="1"/>
          {/* Timer */}
          <circle cx="50" cy="150" r="20" fill="white" stroke="#333" strokeWidth="2"/>
          <text x="50" y="155" textAnchor="middle" fontSize="12" fill="#333">15-20</text>
          <text x="50" y="180" textAnchor="middle" fontSize="10" fill="#666">minutes</text>
        </svg>
      ),
      tips: [
        "Apply gentle pressure only",
        "Take breaks between applications",
        "Monitor for skin irritation"
      ]
    }
  ]
}

export function VisualInstructions({ emergencyType, className }: VisualInstructionsProps) {
  const [currentStep, setCurrentStep] = useState(0)
  const [showEnlarged, setShowEnlarged] = useState(false)
  
  const steps = instructionSets[emergencyType] || []
  const currentInstruction = steps[currentStep]

  const handlePrint = () => {
    window.print()
  }

  if (!currentInstruction) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Visual First Aid Guide</CardTitle>
            <CardDescription>
              Step-by-step illustrated instructions
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Progress indicator */}
          <div className="flex items-center justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-8 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Current step */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">{currentInstruction.title}</h3>
            <p className="text-gray-600">{currentInstruction.description}</p>

            {/* Illustration */}
            <div 
              className="relative bg-gray-50 rounded-lg p-4 cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => setShowEnlarged(true)}
            >
              <div className="max-w-sm mx-auto">
                {currentInstruction.illustration}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2"
              >
                <Eye className="h-4 w-4 mr-1" />
                Enlarge
              </Button>
            </div>

            {/* Tips */}
            {currentInstruction.tips && currentInstruction.tips.length > 0 && (
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Important Tips:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {currentInstruction.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-blue-800">{tip}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <span className="text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </span>
            
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === steps.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </div>
      </CardContent>

      {/* Enlarged view dialog */}
      <Dialog open={showEnlarged} onOpenChange={setShowEnlarged}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>{currentInstruction.title}</DialogTitle>
          </DialogHeader>
          <div className="p-8">
            {currentInstruction.illustration}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  )
}