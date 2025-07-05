"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { 
  Settings2, 
  Contrast, 
  Type, 
  Volume2, 
  Minus,
  Equal,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccessibilitySettings {
  highContrast: boolean
  textSize: 'normal' | 'large' | 'extra-large'
  reducedMotion: boolean
  voiceGuidance: boolean
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  highContrast: false,
  textSize: 'normal',
  reducedMotion: false,
  voiceGuidance: false,
}

export function AccessibilityControls() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS)
  const [isOpen, setIsOpen] = useState(false)

  // Load settings from localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('emergencyAccessibility')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
        applySettings(parsed)
      } catch (e) {
        console.error('Failed to load accessibility settings')
      }
    }

    // Check system preferences
    if (window.matchMedia('(prefers-contrast: high)').matches) {
      updateSetting('highContrast', true)
    }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      updateSetting('reducedMotion', true)
    }
  }, [])

  const applySettings = (newSettings: AccessibilitySettings) => {
    const root = document.documentElement

    // High contrast mode
    if (newSettings.highContrast) {
      root.classList.add('high-contrast')
    } else {
      root.classList.remove('high-contrast')
    }

    // Text size
    root.classList.remove('text-normal', 'text-large', 'text-extra-large')
    root.classList.add(`text-${newSettings.textSize}`)

    // Reduced motion
    if (newSettings.reducedMotion) {
      root.classList.add('reduce-motion')
    } else {
      root.classList.remove('reduce-motion')
    }

    // Save to localStorage
    localStorage.setItem('emergencyAccessibility', JSON.stringify(newSettings))
  }

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    applySettings(newSettings)
  }

  const speak = (text: string) => {
    if (!settings.voiceGuidance || !('speechSynthesis' in window)) return
    
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 1
    speechSynthesis.speak(utterance)
  }

  const getTextSizeIcon = () => {
    switch (settings.textSize) {
      case 'large':
        return <Equal className="h-4 w-4" />
      case 'extra-large':
        return <Plus className="h-4 w-4" />
      default:
        return <Minus className="h-4 w-4" />
    }
  }

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "fixed bottom-20 right-6 z-40 shadow-lg",
              "md:bottom-auto md:top-4 md:right-4",
              settings.highContrast && "border-2 border-black"
            )}
            aria-label="Accessibility settings"
          >
            <Settings2 className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Accessibility</span>
            <span className="sm:hidden">A11y</span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">Accessibility Settings</h3>
              <p className="text-sm text-gray-600">
                Customize your viewing experience
              </p>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="high-contrast" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <Contrast className="h-4 w-4" />
                High Contrast
              </Label>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => {
                  updateSetting('highContrast', checked)
                  speak(checked ? 'High contrast enabled' : 'High contrast disabled')
                }}
              />
            </div>

            {/* Text Size */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Text Size
              </Label>
              <RadioGroup
                value={settings.textSize}
                onValueChange={(value) => {
                  updateSetting('textSize', value as AccessibilitySettings['textSize'])
                  speak(`Text size set to ${value}`)
                }}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="normal" id="text-normal" />
                  <Label htmlFor="text-normal" className="cursor-pointer">
                    Normal
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="text-large" />
                  <Label htmlFor="text-large" className="cursor-pointer">
                    Large (1.5x)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="extra-large" id="text-extra-large" />
                  <Label htmlFor="text-extra-large" className="cursor-pointer">
                    Extra Large (2x)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Voice Guidance */}
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="voice-guidance" 
                className="flex items-center gap-2 cursor-pointer"
              >
                <Volume2 className="h-4 w-4" />
                Voice Guidance
              </Label>
              <Switch
                id="voice-guidance"
                checked={settings.voiceGuidance}
                onCheckedChange={(checked) => {
                  updateSetting('voiceGuidance', checked)
                  if (checked) {
                    speak('Voice guidance enabled. I will read important information aloud.')
                  }
                }}
              />
            </div>

            {/* Reduced Motion */}
            <div className="flex items-center justify-between">
              <Label 
                htmlFor="reduced-motion" 
                className="flex items-center gap-2 cursor-pointer"
              >
                Reduced Motion
              </Label>
              <Switch
                id="reduced-motion"
                checked={settings.reducedMotion}
                onCheckedChange={(checked) => {
                  updateSetting('reducedMotion', checked)
                  speak(checked ? 'Animations reduced' : 'Animations enabled')
                }}
              />
            </div>

            {/* Reset Button */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setSettings(DEFAULT_SETTINGS)
                applySettings(DEFAULT_SETTINGS)
                speak('Settings reset to default')
              }}
            >
              Reset to Default
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Quick access text size buttons */}
      <div className="fixed bottom-20 right-20 z-40 flex gap-2 md:hidden">
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "shadow-lg h-10 w-10",
            settings.highContrast && "border-2 border-black"
          )}
          aria-label="Decrease text size"
          onClick={() => {
            const sizes: AccessibilitySettings['textSize'][] = ['normal', 'large', 'extra-large']
            const currentIndex = sizes.indexOf(settings.textSize)
            if (currentIndex > 0) {
              updateSetting('textSize', sizes[currentIndex - 1])
            }
          }}
        >
          <Minus className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "shadow-lg h-10 w-10",
            settings.highContrast && "border-2 border-black"
          )}
          aria-label="Increase text size"
          onClick={() => {
            const sizes: AccessibilitySettings['textSize'][] = ['normal', 'large', 'extra-large']
            const currentIndex = sizes.indexOf(settings.textSize)
            if (currentIndex < sizes.length - 1) {
              updateSetting('textSize', sizes[currentIndex + 1])
            }
          }}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </>
  )
}

// Export hook for components to access settings
export function useAccessibilitySettings() {
  const [settings, setSettings] = useState<AccessibilitySettings>(DEFAULT_SETTINGS)

  useEffect(() => {
    const savedSettings = localStorage.getItem('emergencyAccessibility')
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings))
      } catch (e) {
        console.error('Failed to load accessibility settings')
      }
    }

    // Listen for changes
    const handleStorageChange = () => {
      const savedSettings = localStorage.getItem('emergencyAccessibility')
      if (savedSettings) {
        try {
          setSettings(JSON.parse(savedSettings))
        } catch (e) {
          console.error('Failed to load accessibility settings')
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  return settings
}