"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Phone, AlertTriangle, MapPin, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { EmergencyLogger } from '@/lib/emergency-audit'

interface EmergencyActionToolbarProps {
  className?: string
}

export function EmergencyActionToolbar({ className }: EmergencyActionToolbarProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    // Show toolbar when user scrolls down
    let lastScrollY = window.scrollY
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > 100) {
        setIsVisible(true)
      }
      lastScrollY = currentScrollY
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleEmergencyCall = (type: '999' | '111', reason: string) => {
    EmergencyLogger.emergencyContact(type, reason)
  }

  const handleFindAE = () => {
    EmergencyLogger.emergencyContact('999', 'finding-ae-department')
    window.open('https://www.nhs.uk/service-search/accident-and-emergency-services/locationsearch/428', '_blank')
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-red-500 shadow-lg transition-all duration-300 md:bottom-6 md:left-auto md:right-6 md:w-auto md:rounded-lg md:border-2",
        isMinimized && "md:w-auto",
        className
      )}
    >
      {/* Mobile full-width toolbar */}
      <div className="block md:hidden">
        <div className="grid grid-cols-3 divide-x divide-gray-200">
          <Button
            variant="ghost"
            size="lg"
            className="rounded-none h-16 flex-col gap-1 text-red-600 hover:bg-red-50"
            onClick={() => handleEmergencyCall('999', 'emergency-toolbar')}
            asChild
          >
            <a href="tel:999">
              <AlertTriangle className="h-5 w-5" />
              <span className="text-xs font-semibold">999</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-none h-16 flex-col gap-1 text-blue-600 hover:bg-blue-50"
            onClick={() => handleEmergencyCall('111', 'emergency-toolbar')}
            asChild
          >
            <a href="tel:111">
              <Phone className="h-5 w-5" />
              <span className="text-xs font-semibold">NHS 111</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="rounded-none h-16 flex-col gap-1 text-green-600 hover:bg-green-50"
            onClick={handleFindAE}
          >
            <MapPin className="h-5 w-5" />
            <span className="text-xs font-semibold">Find A&E</span>
          </Button>
        </div>
      </div>

      {/* Desktop floating toolbar */}
      <div className="hidden md:block">
        {isMinimized ? (
          <Button
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white rounded-full w-14 h-14 p-0"
            onClick={() => setIsMinimized(false)}
          >
            <Phone className="h-6 w-6" />
          </Button>
        ) : (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-sm text-gray-700">Emergency Contacts</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsMinimized(true)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <Button
              size="lg"
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold"
              onClick={() => handleEmergencyCall('999', 'emergency-toolbar-desktop')}
              asChild
            >
              <a href="tel:999">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Call 999 - Emergency
              </a>
            </Button>
            
            <Button
              size="lg"
              variant="secondary"
              className="w-full font-semibold"
              onClick={() => handleEmergencyCall('111', 'emergency-toolbar-desktop')}
              asChild
            >
              <a href="tel:111">
                <Phone className="h-5 w-5 mr-2" />
                Call NHS 111
              </a>
            </Button>
            
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={handleFindAE}
            >
              <MapPin className="h-5 w-5 mr-2" />
              Find Nearest A&E
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Available 24/7 for emergencies
            </p>
          </div>
        )}
      </div>
    </div>
  )
}