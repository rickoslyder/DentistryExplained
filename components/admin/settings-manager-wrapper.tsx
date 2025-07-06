'use client'

import { useState, useEffect } from 'react'
import { SettingsManager } from './settings-manager'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

interface SiteSettings {
  site: {
    name: string
    description: string
    url: string
    contact_email: string
  }
  seo: {
    default_title_suffix: string
    default_description: string
    default_keywords: string[]
  }
  features: {
    chat_enabled: boolean
    chat_rate_limit: number
    web_search_enabled: boolean
    professional_verification_enabled: boolean
    glossary_quiz_enabled: boolean
  }
  ai: {
    model: string
    temperature: number
    max_tokens: number
    system_prompt: string
  }
}

export function SettingsManagerWrapper() {
  const [settings, setSettings] = useState<SiteSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    fetchSettings()
  }, [])
  
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      
      const { settings: dbSettings } = await response.json()
      
      // Map database settings to component state
      const mappedSettings: SiteSettings = {
        site: {
          name: dbSettings.general?.find((s: any) => s.key === 'site_maintenance')?.value?.site_name || 'Dentistry Explained',
          description: dbSettings.general?.find((s: any) => s.key === 'site_maintenance')?.value?.site_description || 'UK\'s premier dental education platform',
          url: dbSettings.general?.find((s: any) => s.key === 'site_maintenance')?.value?.site_url || 'https://dentistryexplained.co.uk',
          contact_email: dbSettings.email?.find((s: any) => s.key === 'email_config')?.value?.from_email || 'hello@dentistryexplained.co.uk'
        },
        seo: {
          default_title_suffix: dbSettings.seo?.find((s: any) => s.key === 'seo_defaults')?.value?.title_suffix || ' | Dentistry Explained',
          default_description: dbSettings.seo?.find((s: any) => s.key === 'seo_defaults')?.value?.default_description || 'Learn about dental health with evidence-based information from UK dental professionals.',
          default_keywords: dbSettings.seo?.find((s: any) => s.key === 'seo_defaults')?.value?.default_keywords || ['dentistry', 'dental health', 'oral care', 'UK dentist']
        },
        features: {
          chat_enabled: dbSettings.chat?.find((s: any) => s.key === 'chat_config')?.value?.enabled !== false,
          chat_rate_limit: dbSettings.chat?.find((s: any) => s.key === 'chat_config')?.value?.rate_limit_per_hour || 50,
          web_search_enabled: dbSettings.general?.find((s: any) => s.key === 'features_config')?.value?.web_search_enabled !== false,
          professional_verification_enabled: dbSettings.verification?.find((s: any) => s.key === 'professional_verification')?.value?.enabled !== false,
          glossary_quiz_enabled: dbSettings.general?.find((s: any) => s.key === 'features_config')?.value?.glossary_quiz_enabled !== false
        },
        ai: {
          model: dbSettings.ai?.find((s: any) => s.key === 'ai_config')?.value?.model || 'o4-mini',
          temperature: dbSettings.ai?.find((s: any) => s.key === 'ai_config')?.value?.temperature || 0.7,
          max_tokens: dbSettings.ai?.find((s: any) => s.key === 'ai_config')?.value?.max_tokens || 4096,
          system_prompt: dbSettings.ai?.find((s: any) => s.key === 'ai_config')?.value?.system_prompt || 'You are a helpful dental assistant. Provide accurate, evidence-based dental information.'
        }
      }
      
      setSettings(mappedSettings)
    } catch (error) {
      console.error('Failed to fetch settings:', error)
      setError('Failed to load settings. Please refresh the page.')
      
      // Use default settings as fallback
      setSettings({
        site: {
          name: 'Dentistry Explained',
          description: 'UK\'s premier dental education platform',
          url: 'https://dentistryexplained.co.uk',
          contact_email: 'hello@dentistryexplained.co.uk'
        },
        seo: {
          default_title_suffix: ' | Dentistry Explained',
          default_description: 'Learn about dental health with evidence-based information from UK dental professionals.',
          default_keywords: ['dentistry', 'dental health', 'oral care', 'UK dentist']
        },
        features: {
          chat_enabled: true,
          chat_rate_limit: 50,
          web_search_enabled: true,
          professional_verification_enabled: true,
          glossary_quiz_enabled: true
        },
        ai: {
          model: 'o4-mini',
          temperature: 0.7,
          max_tokens: 4096,
          system_prompt: 'You are a helpful dental assistant. Provide accurate, evidence-based dental information.'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  if (!settings) {
    return null
  }
  
  return <SettingsManager settings={settings} />
}