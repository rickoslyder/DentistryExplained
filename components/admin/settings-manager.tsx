'use client'

import { useState } from 'react'
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
  X
} from 'lucide-react'

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

interface SettingsManagerProps {
  settings: SiteSettings
}

export function SettingsManager({ settings: initialSettings }: SettingsManagerProps) {
  const [settings, setSettings] = useState(initialSettings)
  const [saving, setSaving] = useState(false)
  const [newKeyword, setNewKeyword] = useState('')
  
  const updateSettings = (section: keyof SiteSettings, field: string, value: any) => {
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
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      
      if (!response.ok) {
        throw new Error('Failed to save settings')
      }
      
      toast({
        title: 'Settings saved',
        description: 'Your changes have been saved successfully',
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="ai">AI Settings</TabsTrigger>
        </TabsList>
        
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Configuration
              </CardTitle>
              <CardDescription>
                Configure AI model settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="ai-model">Model</Label>
                <Input
                  id="ai-model"
                  value={settings.ai.model}
                  onChange={(e) => updateSettings('ai', 'model', e.target.value)}
                />
              </div>
              <div>
                <Label>Temperature: {settings.ai.temperature}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Controls randomness (0 = focused, 1 = creative)
                </p>
                <Slider
                  value={[settings.ai.temperature]}
                  onValueChange={([value]) => updateSettings('ai', 'temperature', value)}
                  min={0}
                  max={1}
                  step={0.1}
                />
              </div>
              <div>
                <Label>Max Tokens: {settings.ai.max_tokens}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Maximum response length
                </p>
                <Slider
                  value={[settings.ai.max_tokens]}
                  onValueChange={([value]) => updateSettings('ai', 'max_tokens', value)}
                  min={500}
                  max={4000}
                  step={100}
                />
              </div>
              <div>
                <Label htmlFor="system-prompt">System Prompt</Label>
                <Textarea
                  id="system-prompt"
                  value={settings.ai.system_prompt}
                  onChange={(e) => updateSettings('ai', 'system_prompt', e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </div>
  )
}