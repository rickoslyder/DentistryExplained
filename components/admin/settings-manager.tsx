'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'
import { 
  Globe, 
  Search, 
  Mail, 
  Bot, 
  ToggleLeft,
  Save,
  Plus,
  X,
  Shield,
  MessageSquare,
  BarChart,
  Zap,
  Plug2,
  Archive
} from 'lucide-react'

// Dynamically import settings components to avoid SSR issues
const AISettingsEnhanced = dynamic(() => import('@/components/admin/ai-settings-enhanced').then(mod => ({ default: mod.AISettingsEnhanced })), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
})

const SecuritySettings = dynamic(
  () => import('@/components/admin/security-settings').then(mod => mod.SecuritySettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

const ContentModerationSettings = dynamic(
  () => import('@/components/admin/content-moderation-settings').then(mod => mod.ContentModerationSettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

const AnalyticsSettings = dynamic(
  () => import('@/components/admin/analytics-settings').then(mod => mod.AnalyticsSettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

const CacheSettings = dynamic(
  () => import('@/components/admin/cache-settings').then(mod => mod.CacheSettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

const IntegrationsSettings = dynamic(
  () => import('@/components/admin/integrations-settings').then(mod => mod.IntegrationsSettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

const BackupSettings = dynamic(
  () => import('@/components/admin/backup-settings').then(mod => mod.BackupSettings),
  {
    ssr: false,
    loading: () => <div className="h-96 bg-gray-50 animate-pulse rounded-lg" />
  }
)

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
  // Security settings
  security?: any
  // Content moderation settings
  content_moderation?: any
  // Analytics settings
  analytics?: any
  // Cache settings
  cache?: any
  // Integrations settings
  integrations?: any
  // Backup settings
  backup?: any
}

interface SettingsManagerProps {
  settings: SiteSettings
}

// Default settings getters
function getDefaultSecuritySettings() {
  return {
    rate_limiting: {
      enabled: true,
      requests_per_minute: 60,
      requests_per_hour: 1000,
      burst_limit: 10,
      block_duration_minutes: 15
    },
    cors: {
      enabled: true,
      allowed_origins: ['https://dentistry-explained.vercel.app'],
      allowed_methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowed_headers: ['Content-Type', 'Authorization'],
      credentials: true,
      max_age_seconds: 86400
    },
    csp: {
      enabled: true,
      directives: {
        default_src: ["'self'"],
        script_src: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        style_src: ["'self'", "'unsafe-inline'"],
        img_src: ["'self'", "data:", "https:"],
        font_src: ["'self'"],
        connect_src: ["'self'"],
        frame_src: ["'self'"]
      },
      report_uri: null
    },
    session: {
      timeout_minutes: 60,
      refresh_enabled: true,
      concurrent_sessions_limit: 3,
      secure_cookies: true
    },
    authentication: {
      two_factor_required: false,
      password_min_length: 8,
      password_require_uppercase: true,
      password_require_numbers: true,
      password_require_symbols: true,
      failed_login_attempts_limit: 5,
      lockout_duration_minutes: 30
    }
  }
}

function getDefaultModerationSettings() {
  return {
    comments: {
      enabled: true,
      auto_approve_threshold: 50,
      require_approval_for_new_users: true,
      new_user_comment_limit: 3,
      spam_detection_enabled: true,
      profanity_filter_enabled: true,
      max_length: 1000,
      min_length: 10,
      allow_links: false,
      moderation_queue_size_limit: 100
    },
    banned_words: {
      enabled: true,
      words: [],
      action: 'flag' as const,
      replacement_character: '*'
    },
    user_reputation: {
      enabled: true,
      auto_trust_threshold: 100,
      flag_threshold: -50,
      ban_threshold: -100,
      points_for_approved_comment: 5,
      points_for_flagged_comment: -10,
      points_for_helpful_vote: 1
    },
    ai_moderation: {
      enabled: false,
      toxicity_threshold: 0.7,
      spam_threshold: 0.8,
      use_for_auto_approval: false,
      review_flagged_content: true
    },
    content_reporting: {
      enabled: true,
      reasons: ['spam', 'inappropriate', 'harassment', 'misinformation', 'other'],
      auto_hide_threshold: 3,
      notify_moderators: true,
      allow_anonymous_reports: false
    }
  }
}

function getDefaultAnalyticsSettings() {
  return {
    tracking: {
      enabled: false,
      provider: 'posthog' as const,
      tracking_id: null,
      track_page_views: true,
      track_user_interactions: true,
      track_performance_metrics: true,
      anonymize_ip: true,
      respect_dnt: true,
      cookie_consent_required: true
    },
    metrics: {
      enabled: true,
      collection_interval_seconds: 60,
      retention_days: 30,
      tracked_endpoints: ['/api/chat', '/api/search'],
      sample_rate: 100,
      exclude_patterns: [],
      aggregate_by: ['endpoint', 'hour'] as any
    },
    alerts: {
      enabled: false,
      channels: ['email'] as any,
      rules: []
    },
    custom_events: {
      enabled: false,
      events: []
    },
    privacy: {
      gdpr_compliant: true,
      data_retention_days: 180,
      allow_data_export: true,
      allow_data_deletion: true,
      mask_sensitive_data: true,
      excluded_fields: ['email', 'password', 'ip_address']
    }
  }
}

function getDefaultCacheSettings() {
  return {
    browser_cache: {
      enabled: true,
      static_assets_max_age: 86400 * 30, // 30 days
      html_max_age: 600, // 10 minutes
      api_max_age: 0,
      service_worker_enabled: false,
      offline_mode_enabled: false
    },
    server_cache: {
      enabled: true,
      provider: 'memory' as const,
      ttl_seconds: 300,
      max_size_mb: 128,
      eviction_policy: 'lru' as const,
      warm_cache_on_start: false
    },
    database_cache: {
      enabled: true,
      query_cache_enabled: true,
      query_cache_size_mb: 64,
      result_cache_ttl: 300,
      cached_queries: []
    },
    cdn: {
      enabled: false,
      provider: 'cloudflare' as const,
      purge_on_deploy: true,
      image_optimization: true,
      auto_webp: true,
      lazy_loading: true
    },
    performance: {
      minify_assets: true,
      compress_responses: true,
      bundle_splitting: true,
      preload_critical_assets: true,
      prefetch_links: false,
      resource_hints: []
    },
    web_search_cache: {
      enabled: true,
      ttl_hours: 24,
      max_entries: 1000,
      cache_perplexity: true,
      cache_exa: true
    }
  }
}

function getDefaultIntegrationsSettings() {
  return {
    email: {
      provider: 'resend' as const,
      api_key: '',
      from_email: 'noreply@dentistry-explained.com',
      from_name: 'Dentistry Explained',
      enabled: false,
      verified: false
    },
    payment: {
      provider: 'stripe' as const,
      publishable_key: '',
      secret_key: '',
      webhook_secret: '',
      enabled: false,
      test_mode: true
    },
    ai: {
      litellm_proxy_url: 'https://llm.rbnk.uk',
      litellm_api_key: '',
      openai_api_key: '',
      anthropic_api_key: '',
      enabled: true
    },
    search: {
      perplexity_api_key: '',
      perplexity_enabled: false,
      exa_api_key: '',
      exa_enabled: false,
      google_search_api_key: '',
      google_search_engine_id: '',
      google_enabled: false
    },
    gdc: {
      api_key: '',
      api_url: '',
      enabled: true,
      mock_mode: true
    },
    nhs: {
      api_key: '',
      api_url: '',
      enabled: true,
      mock_mode: true
    },
    slack: {
      webhook_url: '',
      enabled: false,
      channels: {
        errors: '#errors',
        alerts: '#alerts',
        feedback: '#feedback'
      }
    },
    webhooks: {
      enabled: false,
      endpoints: []
    }
  }
}

function getDefaultBackupSettings() {
  return {
    automatic_backups: {
      enabled: false,
      frequency: 'daily' as const,
      time: '03:00',
      retention_count: 7,
      include_uploads: true,
      compress: true,
      encrypt: false
    },
    backup_destinations: {
      local: {
        enabled: true,
        path: '/var/backups/dentistry'
      },
      s3: {
        enabled: false,
        bucket: '',
        region: 'us-east-1',
        access_key: '',
        secret_key: ''
      },
      supabase: {
        enabled: false,
        use_storage: true
      }
    },
    data_retention: {
      enabled: true,
      policies: [
        {
          type: 'api_logs',
          retention_days: 30,
          action: 'delete' as const,
          enabled: true
        },
        {
          type: 'chat_messages',
          retention_days: 180,
          action: 'delete' as const,
          enabled: true
        }
      ]
    },
    gdpr: {
      enabled: true,
      auto_delete_on_request: false,
      anonymize_after_days: 730,
      export_format: 'json' as const,
      include_in_export: ['profile', 'comments', 'chat_history', 'bookmarks']
    },
    disaster_recovery: {
      enabled: false,
      test_restore_frequency_days: 30,
      last_test_date: null,
      notification_email: ''
    }
  }
}

export function SettingsManager({ settings: initialSettings }: SettingsManagerProps) {
  // Ensure all settings have default values
  const [settings, setSettings] = useState({
    ...initialSettings,
    security: initialSettings.security || getDefaultSecuritySettings(),
    content_moderation: initialSettings.content_moderation || getDefaultModerationSettings(),
    analytics: initialSettings.analytics || getDefaultAnalyticsSettings(),
    cache: initialSettings.cache || getDefaultCacheSettings(),
    integrations: initialSettings.integrations || getDefaultIntegrationsSettings(),
    backup: initialSettings.backup || getDefaultBackupSettings()
  })
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  const [activeTab, setActiveTab] = useState('general')
  
  // Tab descriptions for better UX
  const tabDescriptions: Record<string, string> = {
    general: 'Basic site information and configuration',
    seo: 'Search engine optimization and metadata',
    features: 'Enable or disable platform features',
    email: 'Email service configuration',
    ai: 'AI model and behavior settings',
    security: 'Security policies and access control',
    moderation: 'Content moderation and user management',
    analytics: 'Tracking and performance monitoring',
    cache: 'Performance and caching configuration',
    integrations: 'Third-party service connections',
    backup: 'Backup and data retention policies'
  }
  
  const updateSettings = (section: keyof SiteSettings, field: string, value: any) => {
    // Validate specific fields
    if (section === 'site' && field === 'url') {
      // Validate URL
      try {
        new URL(value)
      } catch {
        toast({
          title: 'Invalid URL',
          description: 'Please enter a valid URL starting with http:// or https://',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (section === 'site' && field === 'contact_email' || 
        section === 'email' && (field === 'from_email' || field === 'reply_to')) {
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(value)) {
        toast({
          title: 'Invalid Email',
          description: 'Please enter a valid email address',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (section === 'features' && field === 'chat_rate_limit') {
      // Validate rate limit
      if (value < 1 || value > 1000) {
        toast({
          title: 'Invalid Rate Limit',
          description: 'Rate limit must be between 1 and 1000',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (section === 'ai' && field === 'temperature') {
      // Validate temperature
      if (value < 0 || value > 2) {
        toast({
          title: 'Invalid Temperature',
          description: 'Temperature must be between 0 and 2',
          variant: 'destructive'
        })
        return
      }
    }
    
    if (section === 'ai' && field === 'max_tokens') {
      // Validate max tokens
      if (value < 100 || value > 32000) {
        toast({
          title: 'Invalid Max Tokens',
          description: 'Max tokens must be between 100 and 32000',
          variant: 'destructive'
        })
        return
      }
    }
    
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
  }
  
  const addKeyword = () => {
    if (newKeyword.trim()) {
      updateSettings('seo', 'default_keywords', [...settings.seo.default_keywords, newKeyword.trim()])
      setNewKeyword('')
    }
  }
  
  const removeKeyword = (index: number) => {
    updateSettings(
      'seo', 
      'default_keywords', 
      settings.seo.default_keywords.filter((_, i) => i !== index)
    )
  }
  
  const handleSave = async () => {
    setSaving(true)
    
    try {
      // Prepare settings for database storage
      const settingsToSave = [
        {
          key: 'seo_defaults',
          value: {
            title_suffix: settings.seo.default_title_suffix,
            default_description: settings.seo.default_description,
            default_keywords: settings.seo.default_keywords
          }
        },
        {
          key: 'email_config',
          value: {
            notifications_enabled: true,
            from_name: 'Dentistry Explained',
            from_email: settings.site.contact_email
          }
        },
        {
          key: 'chat_config',
          value: {
            enabled: settings.features.chat_enabled,
            retention_days: 180,
            max_messages_per_session: 100,
            rate_limit_per_hour: settings.features.chat_rate_limit
          }
        },
        {
          key: 'professional_verification',
          value: {
            enabled: settings.features.professional_verification_enabled,
            auto_approve: false,
            gdc_api_enabled: false,
            verification_email_template: 'professional_verification'
          }
        },
        {
          key: 'site_maintenance',
          value: {
            enabled: false,
            message: '',
            site_name: settings.site.name,
            site_description: settings.site.description,
            site_url: settings.site.url
          }
        },
        {
          key: 'features_config',
          value: {
            web_search_enabled: settings.features.web_search_enabled,
            glossary_quiz_enabled: settings.features.glossary_quiz_enabled
          }
        },
        {
          key: 'ai_config',
          value: {
            model: settings.ai.model,
            temperature: settings.ai.temperature,
            max_tokens: settings.ai.max_tokens,
            system_prompt: settings.ai.system_prompt
          }
        },
        // Advanced settings
        {
          key: 'security_config',
          value: settings.security
        },
        {
          key: 'moderation_config',
          value: settings.content_moderation
        },
        {
          key: 'analytics_config',
          value: settings.analytics
        },
        {
          key: 'cache_config',
          value: settings.cache
        },
        {
          key: 'integrations_config',
          value: settings.integrations
        },
        {
          key: 'backup_config',
          value: settings.backup
        }
      ]
      
      // Make API call to save settings
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsToSave }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      const result = await response.json()
      
      if (result.errors && result.errors.length > 0) {
        throw new Error(`Failed to save some settings: ${result.errors.map((e: any) => e.key).join(', ')}`)
      }
      
      toast({
        title: '✅ Settings saved',
        description: `Successfully updated ${result.results?.length || settingsToSave.length} settings`,
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">
            {tabDescriptions[activeTab] || 'Configure your platform settings'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            Last saved: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </div>
      
      <Tabs defaultValue="general" className="space-y-6" onValueChange={setActiveTab}>
        <div className="space-y-4">
          {/* Main Settings Tabs */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Core Settings</h3>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto p-1">
              <TabsTrigger value="general" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">General</span>
              </TabsTrigger>
              <TabsTrigger value="seo" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">SEO</span>
              </TabsTrigger>
              <TabsTrigger value="features" className="flex items-center gap-2">
                <ToggleLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Features</span>
              </TabsTrigger>
              <TabsTrigger value="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
              </TabsTrigger>
              <TabsTrigger value="ai" className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">AI</span>
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Advanced Settings Tabs */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Advanced Settings</h3>
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6 h-auto p-1">
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Security</span>
              </TabsTrigger>
              <TabsTrigger value="moderation" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Moderation</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Analytics</span>
              </TabsTrigger>
              <TabsTrigger value="cache" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span className="hidden sm:inline">Cache</span>
              </TabsTrigger>
              <TabsTrigger value="integrations" className="flex items-center gap-2">
                <Plug2 className="h-4 w-4" />
                <span className="hidden sm:inline">Integrations</span>
              </TabsTrigger>
              <TabsTrigger value="backup" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Backup</span>
              </TabsTrigger>
            </TabsList>
          </div>
        </div>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Site Information
              </CardTitle>
              <CardDescription>
                Basic information about your website
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input
                  id="site-name"
                  value={settings.site.name}
                  onChange={(e) => updateSettings('site', 'name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea
                  id="site-description"
                  value={settings.site.description}
                  onChange={(e) => updateSettings('site', 'description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="site-url">Site URL</Label>
                <Input
                  id="site-url"
                  type="url"
                  value={settings.site.url}
                  onChange={(e) => updateSettings('site', 'url', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.site.contact_email}
                  onChange={(e) => updateSettings('site', 'contact_email', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                SEO Settings
              </CardTitle>
              <CardDescription>
                Default SEO metadata for your pages
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title-suffix">Default Title Suffix</Label>
                <Input
                  id="title-suffix"
                  value={settings.seo.default_title_suffix}
                  onChange={(e) => updateSettings('seo', 'default_title_suffix', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="default-description">Default Meta Description</Label>
                <Textarea
                  id="default-description"
                  value={settings.seo.default_description}
                  onChange={(e) => updateSettings('seo', 'default_description', e.target.value)}
                  rows={3}
                />
              </div>
              <div>
                <Label>Default Keywords</Label>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {settings.seo.default_keywords.map((keyword, index) => (
                    <Badge key={index} variant="secondary">
                      {keyword}
                      <button
                        onClick={() => removeKeyword(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                    placeholder="Add keyword..."
                  />
                  <Button onClick={addKeyword} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="features" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ToggleLeft className="h-5 w-5" />
                Feature Toggles
              </CardTitle>
              <CardDescription>
                Enable or disable platform features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label>AI Chat</Label>
                  <p className="text-sm text-muted-foreground">Enable AI dental assistant</p>
                </div>
                <Switch
                  checked={settings.features.chat_enabled}
                  onCheckedChange={(checked) => updateSettings('features', 'chat_enabled', checked)}
                />
              </div>
              
              {settings.features.chat_enabled && (
                <div>
                  <Label>Chat Rate Limit</Label>
                  <p className="text-sm text-muted-foreground mb-2">
                    Messages per day: {settings.features.chat_rate_limit}
                  </p>
                  <Slider
                    value={[settings.features.chat_rate_limit]}
                    onValueChange={([value]) => updateSettings('features', 'chat_rate_limit', value)}
                    min={10}
                    max={200}
                    step={10}
                  />
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Web Search</Label>
                  <p className="text-sm text-muted-foreground">Enable real-time web search</p>
                </div>
                <Switch
                  checked={settings.features.web_search_enabled}
                  onCheckedChange={(checked) => updateSettings('features', 'web_search_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Professional Verification</Label>
                  <p className="text-sm text-muted-foreground">Enable GDC verification for professionals</p>
                </div>
                <Switch
                  checked={settings.features.professional_verification_enabled}
                  onCheckedChange={(checked) => updateSettings('features', 'professional_verification_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Glossary Quiz</Label>
                  <p className="text-sm text-muted-foreground">Enable interactive glossary quiz mode</p>
                </div>
                <Switch
                  checked={settings.features.glossary_quiz_enabled}
                  onCheckedChange={(checked) => updateSettings('features', 'glossary_quiz_enabled', checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="email" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Email Configuration
              </CardTitle>
              <CardDescription>
                Settings for outgoing emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="from-name">From Name</Label>
                <Input
                  id="from-name"
                  value={settings.email.from_name}
                  onChange={(e) => updateSettings('email', 'from_name', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="from-email">From Email</Label>
                <Input
                  id="from-email"
                  type="email"
                  value={settings.email.from_email}
                  onChange={(e) => updateSettings('email', 'from_email', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="reply-to">Reply To Email</Label>
                <Input
                  id="reply-to"
                  type="email"
                  value={settings.email.reply_to}
                  onChange={(e) => updateSettings('email', 'reply_to', e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="ai" className="space-y-4">
          <AISettingsEnhanced
            settings={settings.ai}
            onUpdate={(field, value) => updateSettings('ai', field, value)}
          />
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <SecuritySettings
            settings={settings.security}
            onUpdate={(section, field, value) => {
              const currentSecurity = settings.security || getDefaultSecuritySettings()
              const currentSection = currentSecurity[section as keyof typeof currentSecurity] || {}
              setSettings(prev => ({
                ...prev,
                security: {
                  ...currentSecurity,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
        
        <TabsContent value="moderation" className="space-y-4">
          <ContentModerationSettings
            settings={settings.content_moderation}
            onUpdate={(section, field, value) => {
              const currentModeration = settings.content_moderation || getDefaultModerationSettings()
              const currentSection = currentModeration[section as keyof typeof currentModeration] || {}
              setSettings(prev => ({
                ...prev,
                content_moderation: {
                  ...currentModeration,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsSettings
            settings={settings.analytics}
            onUpdate={(section, field, value) => {
              const currentAnalytics = settings.analytics || getDefaultAnalyticsSettings()
              const currentSection = currentAnalytics[section as keyof typeof currentAnalytics] || {}
              setSettings(prev => ({
                ...prev,
                analytics: {
                  ...currentAnalytics,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
        
        <TabsContent value="cache" className="space-y-4">
          <CacheSettings
            settings={settings.cache}
            onUpdate={(section, field, value) => {
              const currentCache = settings.cache || getDefaultCacheSettings()
              const currentSection = currentCache[section as keyof typeof currentCache] || {}
              setSettings(prev => ({
                ...prev,
                cache: {
                  ...currentCache,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
        
        <TabsContent value="integrations" className="space-y-4">
          <IntegrationsSettings
            settings={settings.integrations}
            onUpdate={(section, field, value) => {
              const currentIntegrations = settings.integrations || getDefaultIntegrationsSettings()
              const currentSection = currentIntegrations[section as keyof typeof currentIntegrations] || {}
              setSettings(prev => ({
                ...prev,
                integrations: {
                  ...currentIntegrations,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
        
        <TabsContent value="backup" className="space-y-4">
          <BackupSettings
            settings={settings.backup}
            onUpdate={(section, field, value) => {
              const currentBackup = settings.backup || getDefaultBackupSettings()
              const currentSection = currentBackup[section as keyof typeof currentBackup] || {}
              setSettings(prev => ({
                ...prev,
                backup: {
                  ...currentBackup,
                  [section]: {
                    ...currentSection,
                    [field]: value
                  }
                }
              }))
            }}
          />
        </TabsContent>
      </Tabs>
      
      {/* Floating save button */}
      <div className="fixed bottom-6 right-6 z-10">
        <Button 
          onClick={handleSave} 
          disabled={saving}
          size="lg"
          className="shadow-lg"
        >
          {saving ? (
            <>
              <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save All Settings
            </>
          )}
        </Button>
      </div>
    </div>
  )
}