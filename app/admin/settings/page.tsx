import { createServerSupabaseClient } from '@/lib/supabase-auth'
import { SettingsManager } from '@/components/admin/settings-manager'

export const dynamic = 'force-dynamic'

// Define settings structure
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
  email: {
    from_name: string
    from_email: string
    reply_to: string
  }
  ai: {
    model: string
    temperature: number
    max_tokens: number
    system_prompt: string
  }
}

// Default settings
const defaultSettings: SiteSettings = {
  site: {
    name: 'Dentistry Explained',
    description: 'The UK\'s premier dental education platform',
    url: 'https://dentistry-explained.vercel.app',
    contact_email: 'info@dentistryexplained.co.uk'
  },
  seo: {
    default_title_suffix: ' | Dentistry Explained',
    default_description: 'Evidence-based dental information for patients and professionals',
    default_keywords: ['dentistry', 'dental health', 'oral health', 'dental education', 'UK dentist']
  },
  features: {
    chat_enabled: true,
    chat_rate_limit: 50, // messages per day
    web_search_enabled: true,
    professional_verification_enabled: true,
    glossary_quiz_enabled: true
  },
  email: {
    from_name: 'Dentistry Explained',
    from_email: 'noreply@dentistryexplained.co.uk',
    reply_to: 'support@dentistryexplained.co.uk'
  },
  ai: {
    model: 'o4-mini',
    temperature: 0.7,
    max_tokens: 2000,
    system_prompt: 'You are a helpful dental assistant providing evidence-based information about oral health.'
  }
}

async function getSettings(): Promise<SiteSettings> {
  const supabase = await createServerSupabaseClient()
  
  // In a real implementation, these would be stored in a settings table
  // For now, we'll return the default settings
  // const { data: settings } = await supabase
  //   .from('settings')
  //   .select('*')
  //   .single()
  
  return defaultSettings
}

export default async function SettingsPage() {
  const settings = await getSettings()
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Configure your platform settings</p>
      </div>
      
      <SettingsManager settings={settings} />
    </div>
  )
}