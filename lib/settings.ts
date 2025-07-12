import { supabaseAdmin } from '@/lib/supabase'

// Types for settings
export interface SiteSettings {
  // General settings
  site_name: string
  site_description: string
  site_url: string
  maintenance_mode: boolean
  maintenance_message: string
  
  // SEO settings
  seo_title_suffix: string
  seo_default_description: string
  seo_default_keywords: string[]
  
  // Feature toggles
  chat_enabled: boolean
  chat_rate_limit: number
  chat_retention_days: number
  web_search_enabled: boolean
  professional_verification_enabled: boolean
  glossary_quiz_enabled: boolean
  
  // Email settings
  email_from_name: string
  email_from_address: string
  email_reply_to: string
  email_notifications_enabled: boolean
  
  // AI settings
  ai_model: string
  ai_temperature: number
  ai_max_tokens: number
  ai_system_prompt: string
  
  // Professional verification
  verification_auto_approve: boolean
  verification_gdc_api_enabled: boolean
  
  // Security settings
  security?: {
    rateLimiting?: {
      enabled: boolean
      windowMs?: number
      maxRequests?: number
    }
    ddosProtection?: {
      enabled: boolean
      maxRequestsPerIp?: number
      blockDurationMs?: number
      geoBlocking?: {
        enabled: boolean
        blockedCountries?: string[]
        allowedCountries?: string[]
      }
    }
    contentSecurity?: {
      csp?: {
        enabled: boolean
        reportOnly?: boolean
        directives?: Record<string, string[]>
      }
      cors?: {
        enabled: boolean
        origins?: string[]
        credentials?: boolean
      }
      headers?: Record<string, string>
    }
  }
}

// Default settings
const DEFAULT_SETTINGS: SiteSettings = {
  // General
  site_name: 'Dentistry Explained',
  site_description: 'UK\'s premier dental education platform',
  site_url: 'https://dentistry-explained.vercel.app',
  maintenance_mode: false,
  maintenance_message: '',
  
  // SEO
  seo_title_suffix: ' | Dentistry Explained',
  seo_default_description: 'Learn about dental health with evidence-based information from UK dental professionals.',
  seo_default_keywords: ['dentistry', 'dental health', 'oral care', 'UK dentist'],
  
  // Features
  chat_enabled: true,
  chat_rate_limit: 50,
  chat_retention_days: 180,
  web_search_enabled: true,
  professional_verification_enabled: true,
  glossary_quiz_enabled: true,
  
  // Email
  email_from_name: 'Dentistry Explained',
  email_from_address: 'hello@dentistryexplained.co.uk',
  email_reply_to: 'support@dentistryexplained.co.uk',
  email_notifications_enabled: true,
  
  // AI
  ai_model: 'o4-mini',
  ai_temperature: 0.7,
  ai_max_tokens: 4096,
  ai_system_prompt: 'You are a helpful dental assistant. Provide accurate, evidence-based dental information.',
  
  // Professional verification
  verification_auto_approve: false,
  verification_gdc_api_enabled: false,
  
  // Security settings
  security: {
    rateLimiting: {
      enabled: true,
      windowMs: 60000, // 1 minute
      maxRequests: 60  // 60 requests per minute
    },
    ddosProtection: {
      enabled: true,
      maxRequestsPerIp: 100,
      blockDurationMs: 3600000, // 1 hour
      geoBlocking: {
        enabled: false,
        blockedCountries: [],
        allowedCountries: []
      }
    },
    contentSecurity: {
      csp: {
        enabled: true,
        reportOnly: false
      },
      cors: {
        enabled: true,
        origins: ['https://dentistry-explained.vercel.app'],
        credentials: true
      }
    }
  }
}

// In-memory cache for settings
let settingsCache: SiteSettings | null = null
let cacheTimestamp: number | null = null
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

// Fetch settings from database
async function fetchSettings(): Promise<SiteSettings> {
  try {
    const { data: dbSettings, error } = await supabaseAdmin
      .from('settings')
      .select('key, value')
    
    if (error) {
      console.error('Error fetching settings:', error)
      return DEFAULT_SETTINGS
    }
    
    // Map database settings to our settings object
    const settings: SiteSettings = { ...DEFAULT_SETTINGS }
    
    for (const setting of dbSettings || []) {
      const key = setting.key
      const value = setting.value
      
      // Map database keys to our settings structure
      switch (key) {
        // General settings
        case 'site_maintenance':
          if (value?.enabled !== undefined) settings.maintenance_mode = value.enabled
          if (value?.message !== undefined) settings.maintenance_message = value.message
          if (value?.site_name !== undefined) settings.site_name = value.site_name
          if (value?.site_description !== undefined) settings.site_description = value.site_description
          if (value?.site_url !== undefined) settings.site_url = value.site_url
          break
          
        // SEO settings
        case 'seo_defaults':
          if (value?.title_suffix !== undefined) settings.seo_title_suffix = value.title_suffix
          if (value?.default_description !== undefined) settings.seo_default_description = value.default_description
          if (value?.default_keywords !== undefined) settings.seo_default_keywords = value.default_keywords
          break
          
        // Feature settings
        case 'features_config':
          if (value?.web_search_enabled !== undefined) settings.web_search_enabled = value.web_search_enabled
          if (value?.glossary_quiz_enabled !== undefined) settings.glossary_quiz_enabled = value.glossary_quiz_enabled
          break
          
        // Chat settings
        case 'chat_config':
          if (value?.enabled !== undefined) settings.chat_enabled = value.enabled
          if (value?.rate_limit_per_hour !== undefined) settings.chat_rate_limit = value.rate_limit_per_hour
          if (value?.retention_days !== undefined) settings.chat_retention_days = value.retention_days
          break
          
        // Email settings
        case 'email_config':
          if (value?.from_name !== undefined) settings.email_from_name = value.from_name
          if (value?.from_email !== undefined) settings.email_from_address = value.from_email
          if (value?.reply_to !== undefined) settings.email_reply_to = value.reply_to
          if (value?.notifications_enabled !== undefined) settings.email_notifications_enabled = value.notifications_enabled
          break
          
        // AI settings
        case 'ai_config':
          if (value?.model !== undefined) settings.ai_model = value.model
          if (value?.temperature !== undefined) settings.ai_temperature = value.temperature
          if (value?.max_tokens !== undefined) settings.ai_max_tokens = value.max_tokens
          if (value?.system_prompt !== undefined) settings.ai_system_prompt = value.system_prompt
          break
          
        // Professional verification
        case 'professional_verification':
          if (value?.enabled !== undefined) settings.professional_verification_enabled = value.enabled
          if (value?.auto_approve !== undefined) settings.verification_auto_approve = value.auto_approve
          if (value?.gdc_api_enabled !== undefined) settings.verification_gdc_api_enabled = value.gdc_api_enabled
          break
          
        // Advanced settings - these are stored as complete objects
        case 'security_config':
        case 'moderation_config':
        case 'analytics_config':
        case 'cache_config':
        case 'integrations_config':
        case 'backup_config':
          // These are handled by the settings manager component
          // and not used in the core settings service
          break
          
        // Legacy format (e.g., "general.site_name")
        default:
          if (key.startsWith('general.')) {
            const subKey = key.replace('general.', '')
            if (subKey === 'site_name' && value?.value) settings.site_name = value.value
            if (subKey === 'site_description' && value?.value) settings.site_description = value.value
          }
          break
      }
    }
    
    return settings
  } catch (error) {
    console.error('Error in fetchSettings:', error)
    return DEFAULT_SETTINGS
  }
}

// Get settings with caching
export async function getSettings(): Promise<SiteSettings> {
  // Check if cache is valid
  if (settingsCache && cacheTimestamp && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return settingsCache
  }
  
  // Fetch fresh settings
  const settings = await fetchSettings()
  
  // Update cache
  settingsCache = settings
  cacheTimestamp = Date.now()
  
  return settings
}

// Get a specific setting
export async function getSetting<K extends keyof SiteSettings>(key: K): Promise<SiteSettings[K]> {
  const settings = await getSettings()
  return settings[key]
}

// Clear settings cache (useful after updates)
export function clearSettingsCache() {
  settingsCache = null
  cacheTimestamp = null
}

// Note: React cache removed due to build issues
// Settings are already cached in-memory for 5 minutes