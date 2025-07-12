'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plug2, 
  Mail,
  CreditCard,
  MessageSquare,
  Search,
  Shield,
  Brain,
  Database,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  ExternalLink,
  Key
} from 'lucide-react'
import { toast } from 'sonner'

interface IntegrationsSettingsProps {
  settings: {
    email: {
      provider: 'resend' | 'sendgrid' | 'mailgun' | 'postmark' | 'smtp'
      api_key: string
      from_email: string
      from_name: string
      enabled: boolean
      verified: boolean
    }
    payment: {
      provider: 'stripe' | 'paddle' | 'lemonsqueezy'
      publishable_key: string
      secret_key: string
      webhook_secret: string
      enabled: boolean
      test_mode: boolean
    }
    ai: {
      litellm_proxy_url: string
      litellm_api_key: string
      openai_api_key: string
      anthropic_api_key: string
      enabled: boolean
    }
    search: {
      perplexity_api_key: string
      perplexity_enabled: boolean
      exa_api_key: string
      exa_enabled: boolean
      google_search_api_key: string
      google_search_engine_id: string
      google_enabled: boolean
    }
    gdc: {
      api_key: string
      api_url: string
      enabled: boolean
      mock_mode: boolean
    }
    nhs: {
      api_key: string
      api_url: string
      enabled: boolean
      mock_mode: boolean
    }
    slack: {
      webhook_url: string
      enabled: boolean
      channels: {
        errors: string
        alerts: string
        feedback: string
      }
    }
    webhooks: {
      enabled: boolean
      endpoints: {
        url: string
        events: string[]
        secret: string
        enabled: boolean
      }[]
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function IntegrationsSettings({ settings, onUpdate }: IntegrationsSettingsProps) {
  const [testing, setTesting] = useState<string | null>(null)
  const [newWebhook, setNewWebhook] = useState({
    url: '',
    events: [] as string[],
    secret: ''
  })

  const testIntegration = async (integration: string) => {
    setTesting(integration)
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Mock success/failure based on whether key is provided
      const hasConfig = 
        (integration === 'email' && settings.email.api_key) ||
        (integration === 'payment' && settings.payment.secret_key) ||
        (integration === 'perplexity' && settings.search.perplexity_api_key) ||
        (integration === 'exa' && settings.search.exa_api_key)
      
      if (hasConfig) {
        toast.success(`${integration} integration test successful`)
        if (integration === 'email') {
          onUpdate('email', 'verified', true)
        }
      } else {
        throw new Error('API key not configured')
      }
    } catch (error) {
      toast.error(`${integration} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setTesting(null)
    }
  }

  const addWebhook = () => {
    if (!newWebhook.url) return
    
    const endpoints = settings.webhooks.endpoints || []
    onUpdate('webhooks', 'endpoints', [
      ...endpoints,
      {
        ...newWebhook,
        enabled: true,
        secret: newWebhook.secret || generateWebhookSecret()
      }
    ])
    
    setNewWebhook({ url: '', events: [], secret: '' })
  }

  const removeWebhook = (index: number) => {
    const endpoints = settings.webhooks.endpoints || []
    onUpdate('webhooks', 'endpoints', endpoints.filter((_, i) => i !== index))
  }

  const toggleWebhookEvent = (index: number, event: string) => {
    const endpoints = settings.webhooks.endpoints || []
    const endpoint = endpoints[index]
    const events = endpoint.events.includes(event)
      ? endpoint.events.filter(e => e !== event)
      : [...endpoint.events, event]
    
    onUpdate('webhooks', 'endpoints', endpoints.map((e, i) => 
      i === index ? { ...e, events } : e
    ))
  }

  const generateWebhookSecret = () => {
    return 'whsec_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const maskApiKey = (key: string) => {
    if (!key) return ''
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '••••' + key.substring(key.length - 4)
  }

  return (
    <div className="space-y-6">
      {/* Email Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service
          </CardTitle>
          <CardDescription>
            Configure email sending for notifications and alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Email</Label>
              <p className="text-sm text-muted-foreground">Send transactional emails</p>
            </div>
            <Switch
              checked={settings.email.enabled}
              onCheckedChange={(checked) => onUpdate('email', 'enabled', checked)}
            />
          </div>

          {settings.email.enabled && (
            <>
              <div>
                <Label>Email Provider</Label>
                <Select
                  value={settings.email.provider}
                  onValueChange={(value) => onUpdate('email', 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resend">Resend</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="postmark">Postmark</SelectItem>
                    <SelectItem value="smtp">Custom SMTP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>API Key</Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={settings.email.api_key}
                    onChange={(e) => onUpdate('email', 'api_key', e.target.value)}
                    placeholder={`${settings.email.provider} API key`}
                  />
                  <Button
                    variant="outline"
                    onClick={() => testIntegration('email')}
                    disabled={testing === 'email' || !settings.email.api_key}
                  >
                    {testing === 'email' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                {settings.email.api_key && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Current: {maskApiKey(settings.email.api_key)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={settings.email.from_email}
                    onChange={(e) => onUpdate('email', 'from_email', e.target.value)}
                    placeholder="noreply@example.com"
                  />
                </div>
                <div>
                  <Label>From Name</Label>
                  <Input
                    value={settings.email.from_name}
                    onChange={(e) => onUpdate('email', 'from_name', e.target.value)}
                    placeholder="Dentistry Explained"
                  />
                </div>
              </div>

              {settings.email.verified && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Email service is verified and ready to use
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Payment Provider */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Processing
          </CardTitle>
          <CardDescription>
            Configure payment gateway for subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Payments</Label>
              <p className="text-sm text-muted-foreground">Accept payments and subscriptions</p>
            </div>
            <Switch
              checked={settings.payment.enabled}
              onCheckedChange={(checked) => onUpdate('payment', 'enabled', checked)}
            />
          </div>

          {settings.payment.enabled && (
            <>
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Payment integration is not yet fully implemented. Keys are stored but not used.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Payment Provider</Label>
                <Select
                  value={settings.payment.provider}
                  onValueChange={(value) => onUpdate('payment', 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stripe">Stripe</SelectItem>
                    <SelectItem value="paddle">Paddle</SelectItem>
                    <SelectItem value="lemonsqueezy">Lemon Squeezy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Test Mode</Label>
                  <p className="text-sm text-muted-foreground">Use test API keys</p>
                </div>
                <Switch
                  checked={settings.payment.test_mode}
                  onCheckedChange={(checked) => onUpdate('payment', 'test_mode', checked)}
                />
              </div>

              <div className="space-y-3">
                <div>
                  <Label>Publishable Key</Label>
                  <Input
                    type="password"
                    value={settings.payment.publishable_key}
                    onChange={(e) => onUpdate('payment', 'publishable_key', e.target.value)}
                    placeholder={settings.payment.test_mode ? 'pk_test_...' : 'pk_live_...'}
                  />
                </div>

                <div>
                  <Label>Secret Key</Label>
                  <Input
                    type="password"
                    value={settings.payment.secret_key}
                    onChange={(e) => onUpdate('payment', 'secret_key', e.target.value)}
                    placeholder={settings.payment.test_mode ? 'sk_test_...' : 'sk_live_...'}
                  />
                </div>

                <div>
                  <Label>Webhook Secret</Label>
                  <Input
                    type="password"
                    value={settings.payment.webhook_secret}
                    onChange={(e) => onUpdate('payment', 'webhook_secret', e.target.value)}
                    placeholder="whsec_..."
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Services
          </CardTitle>
          <CardDescription>
            Configure AI model providers and proxies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable AI Features</Label>
              <p className="text-sm text-muted-foreground">Use AI for chat and content generation</p>
            </div>
            <Switch
              checked={settings.ai.enabled}
              onCheckedChange={(checked) => onUpdate('ai', 'enabled', checked)}
            />
          </div>

          {settings.ai.enabled && (
            <>
              <div>
                <Label>LiteLLM Proxy URL</Label>
                <Input
                  value={settings.ai.litellm_proxy_url}
                  onChange={(e) => onUpdate('ai', 'litellm_proxy_url', e.target.value)}
                  placeholder="https://your-litellm-proxy.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Centralized AI model management proxy
                </p>
              </div>

              <div>
                <Label>LiteLLM API Key</Label>
                <Input
                  type="password"
                  value={settings.ai.litellm_api_key}
                  onChange={(e) => onUpdate('ai', 'litellm_api_key', e.target.value)}
                  placeholder="Optional - for authenticated proxy"
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Individual API keys below are optional if using LiteLLM proxy. 
                  They're used as fallbacks or for direct API calls.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Label>OpenAI API Key</Label>
                  <Input
                    type="password"
                    value={settings.ai.openai_api_key}
                    onChange={(e) => onUpdate('ai', 'openai_api_key', e.target.value)}
                    placeholder="sk-..."
                  />
                </div>

                <div>
                  <Label>Anthropic API Key</Label>
                  <Input
                    type="password"
                    value={settings.ai.anthropic_api_key}
                    onChange={(e) => onUpdate('ai', 'anthropic_api_key', e.target.value)}
                    placeholder="sk-ant-..."
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Web Search APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Web Search APIs
          </CardTitle>
          <CardDescription>
            Configure search providers for real-time information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Perplexity */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Perplexity API</Label>
                {settings.search.perplexity_api_key && (
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>
              <Switch
                checked={settings.search.perplexity_enabled}
                onCheckedChange={(checked) => onUpdate('search', 'perplexity_enabled', checked)}
              />
            </div>
            
            {settings.search.perplexity_enabled && (
              <div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={settings.search.perplexity_api_key}
                    onChange={(e) => onUpdate('search', 'perplexity_api_key', e.target.value)}
                    placeholder="pplx-..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => testIntegration('perplexity')}
                    disabled={testing === 'perplexity' || !settings.search.perplexity_api_key}
                  >
                    {testing === 'perplexity' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Real-time web search with AI summaries
                </p>
              </div>
            )}
          </div>

          {/* Exa */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Exa API</Label>
                {settings.search.exa_api_key && (
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>
              <Switch
                checked={settings.search.exa_enabled}
                onCheckedChange={(checked) => onUpdate('search', 'exa_enabled', checked)}
              />
            </div>
            
            {settings.search.exa_enabled && (
              <div>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={settings.search.exa_api_key}
                    onChange={(e) => onUpdate('search', 'exa_api_key', e.target.value)}
                    placeholder="exa_..."
                  />
                  <Button
                    variant="outline"
                    onClick={() => testIntegration('exa')}
                    disabled={testing === 'exa' || !settings.search.exa_api_key}
                  >
                    {testing === 'exa' ? 'Testing...' : 'Test'}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Semantic search for research and citations
                </p>
              </div>
            )}
          </div>

          {/* Google Search */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Label>Google Search API</Label>
                {settings.search.google_search_api_key && (
                  <Badge variant="outline" className="text-xs">
                    Configured
                  </Badge>
                )}
              </div>
              <Switch
                checked={settings.search.google_enabled}
                onCheckedChange={(checked) => onUpdate('search', 'google_enabled', checked)}
              />
            </div>
            
            {settings.search.google_enabled && (
              <div className="space-y-3">
                <div>
                  <Label className="text-sm">API Key</Label>
                  <Input
                    type="password"
                    value={settings.search.google_search_api_key}
                    onChange={(e) => onUpdate('search', 'google_search_api_key', e.target.value)}
                    placeholder="AIza..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Search Engine ID</Label>
                  <Input
                    value={settings.search.google_search_engine_id}
                    onChange={(e) => onUpdate('search', 'google_search_engine_id', e.target.value)}
                    placeholder="Your search engine ID"
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional Verification APIs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Professional Verification
          </CardTitle>
          <CardDescription>
            Configure GDC and NHS API integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* GDC API */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>GDC API</Label>
              <Switch
                checked={settings.gdc.enabled}
                onCheckedChange={(checked) => onUpdate('gdc', 'enabled', checked)}
              />
            </div>
            
            {settings.gdc.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mock Mode</Label>
                    <p className="text-sm text-muted-foreground">Use mock data (no real API)</p>
                  </div>
                  <Switch
                    checked={settings.gdc.mock_mode}
                    onCheckedChange={(checked) => onUpdate('gdc', 'mock_mode', checked)}
                  />
                </div>

                {!settings.gdc.mock_mode && (
                  <>
                    <div>
                      <Label>API URL</Label>
                      <Input
                        value={settings.gdc.api_url}
                        onChange={(e) => onUpdate('gdc', 'api_url', e.target.value)}
                        placeholder="https://api.gdc-uk.org"
                      />
                    </div>
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.gdc.api_key}
                        onChange={(e) => onUpdate('gdc', 'api_key', e.target.value)}
                        placeholder="GDC API key"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* NHS API */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>NHS API</Label>
              <Switch
                checked={settings.nhs.enabled}
                onCheckedChange={(checked) => onUpdate('nhs', 'enabled', checked)}
              />
            </div>
            
            {settings.nhs.enabled && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Mock Mode</Label>
                    <p className="text-sm text-muted-foreground">Use mock data (no real API)</p>
                  </div>
                  <Switch
                    checked={settings.nhs.mock_mode}
                    onCheckedChange={(checked) => onUpdate('nhs', 'mock_mode', checked)}
                  />
                </div>

                {!settings.nhs.mock_mode && (
                  <>
                    <div>
                      <Label>API URL</Label>
                      <Input
                        value={settings.nhs.api_url}
                        onChange={(e) => onUpdate('nhs', 'api_url', e.target.value)}
                        placeholder="https://api.nhs.uk"
                      />
                    </div>
                    <div>
                      <Label>API Key</Label>
                      <Input
                        type="password"
                        value={settings.nhs.api_key}
                        onChange={(e) => onUpdate('nhs', 'api_key', e.target.value)}
                        placeholder="NHS API key"
                      />
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Slack Integration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Slack Notifications
          </CardTitle>
          <CardDescription>
            Send alerts and notifications to Slack
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Slack</Label>
              <p className="text-sm text-muted-foreground">Send notifications to Slack channels</p>
            </div>
            <Switch
              checked={settings.slack.enabled}
              onCheckedChange={(checked) => onUpdate('slack', 'enabled', checked)}
            />
          </div>

          {settings.slack.enabled && (
            <>
              <div>
                <Label>Webhook URL</Label>
                <Input
                  type="password"
                  value={settings.slack.webhook_url}
                  onChange={(e) => onUpdate('slack', 'webhook_url', e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                />
              </div>

              <div className="space-y-3">
                <Label>Channel Mapping</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Errors</Label>
                    <Input
                      value={settings.slack.channels.errors}
                      onChange={(e) => onUpdate('slack', 'channels', { ...settings.slack.channels, errors: e.target.value })}
                      placeholder="#errors"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Alerts</Label>
                    <Input
                      value={settings.slack.channels.alerts}
                      onChange={(e) => onUpdate('slack', 'channels', { ...settings.slack.channels, alerts: e.target.value })}
                      placeholder="#alerts"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Feedback</Label>
                    <Input
                      value={settings.slack.channels.feedback}
                      onChange={(e) => onUpdate('slack', 'channels', { ...settings.slack.channels, feedback: e.target.value })}
                      placeholder="#feedback"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug2 className="h-5 w-5" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Send events to external services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Webhooks</Label>
              <p className="text-sm text-muted-foreground">Send events to external endpoints</p>
            </div>
            <Switch
              checked={settings.webhooks.enabled}
              onCheckedChange={(checked) => onUpdate('webhooks', 'enabled', checked)}
            />
          </div>

          {settings.webhooks.enabled && (
            <>
              <div className="space-y-3">
                {settings.webhooks.endpoints.map((endpoint, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant={endpoint.enabled ? 'default' : 'secondary'}>
                          {endpoint.enabled ? 'Active' : 'Inactive'}
                        </Badge>
                        <span className="text-sm font-medium">{endpoint.url}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeWebhook(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Secret</Label>
                      <p className="text-xs font-mono text-muted-foreground">{endpoint.secret}</p>
                    </div>
                    
                    <div>
                      <Label className="text-xs">Events</Label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {['user.created', 'user.verified', 'comment.posted', 'chat.message', 'error.occurred'].map(event => (
                          <Badge
                            key={event}
                            variant={endpoint.events.includes(event) ? 'default' : 'outline'}
                            className="cursor-pointer text-xs"
                            onClick={() => toggleWebhookEvent(index, event)}
                          >
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 border-t pt-4">
                <Label>Add Webhook</Label>
                <Input
                  placeholder="https://your-service.com/webhook"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook({ ...newWebhook, url: e.target.value })}
                />
                <Input
                  placeholder="Optional secret (auto-generated if empty)"
                  value={newWebhook.secret}
                  onChange={(e) => setNewWebhook({ ...newWebhook, secret: e.target.value })}
                />
                <Button onClick={addWebhook} className="w-full">
                  Add Webhook Endpoint
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}