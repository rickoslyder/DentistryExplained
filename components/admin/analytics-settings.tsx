'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
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
  BarChart, 
  Activity,
  Eye,
  Bell,
  Zap,
  Database,
  Plus,
  X,
  Info,
  FileText,
  AlertTriangle
} from 'lucide-react'

interface AnalyticsSettingsProps {
  settings: {
    tracking: {
      enabled: boolean
      provider: 'posthog' | 'google' | 'plausible' | 'custom'
      tracking_id: string | null
      track_page_views: boolean
      track_user_interactions: boolean
      track_performance_metrics: boolean
      anonymize_ip: boolean
      respect_dnt: boolean
      cookie_consent_required: boolean
    }
    metrics: {
      enabled: boolean
      collection_interval_seconds: number
      retention_days: number
      tracked_endpoints: string[]
      sample_rate: number
      exclude_patterns: string[]
      aggregate_by: ('endpoint' | 'user' | 'hour' | 'day')[]
    }
    alerts: {
      enabled: boolean
      channels: ('email' | 'slack' | 'webhook')[]
      rules: {
        id: string
        name: string
        metric: string
        condition: 'above' | 'below' | 'equals'
        threshold: number
        window_minutes: number
        enabled: boolean
      }[]
    }
    custom_events: {
      enabled: boolean
      events: {
        name: string
        description: string
        properties: string[]
      }[]
    }
    privacy: {
      gdpr_compliant: boolean
      data_retention_days: number
      allow_data_export: boolean
      allow_data_deletion: boolean
      mask_sensitive_data: boolean
      excluded_fields: string[]
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function AnalyticsSettings({ settings, onUpdate }: AnalyticsSettingsProps) {
  const [newEndpoint, setNewEndpoint] = useState('')
  const [newExcludePattern, setNewExcludePattern] = useState('')
  const [newExcludedField, setNewExcludedField] = useState('')
  const [newEvent, setNewEvent] = useState({ name: '', description: '', properties: '' })
  const [newAlert, setNewAlert] = useState({
    name: '',
    metric: 'response_time',
    condition: 'above' as const,
    threshold: 1000,
    window_minutes: 5
  })

  const addToArray = (section: string, field: string, value: string) => {
    if (!value.trim()) return
    const current = settings[section as keyof typeof settings] as any
    const array = current[field] || []
    if (!array.includes(value)) {
      onUpdate(section, field, [...array, value])
    }
  }

  const removeFromArray = (section: string, field: string, index: number) => {
    const current = settings[section as keyof typeof settings] as any
    const array = current[field] || []
    onUpdate(section, field, array.filter((_: any, i: number) => i !== index))
  }

  const addCustomEvent = () => {
    if (!newEvent.name.trim()) return
    const events = settings.custom_events.events || []
    onUpdate('custom_events', 'events', [
      ...events,
      {
        name: newEvent.name,
        description: newEvent.description,
        properties: newEvent.properties.split(',').map(p => p.trim()).filter(Boolean)
      }
    ])
    setNewEvent({ name: '', description: '', properties: '' })
  }

  const removeCustomEvent = (index: number) => {
    const events = settings.custom_events.events || []
    onUpdate('custom_events', 'events', events.filter((_, i) => i !== index))
  }

  const addAlert = () => {
    if (!newAlert.name.trim()) return
    const rules = settings.alerts.rules || []
    onUpdate('alerts', 'rules', [
      ...rules,
      {
        id: Date.now().toString(),
        ...newAlert,
        enabled: true
      }
    ])
    setNewAlert({
      name: '',
      metric: 'response_time',
      condition: 'above',
      threshold: 1000,
      window_minutes: 5
    })
  }

  const removeAlert = (id: string) => {
    const rules = settings.alerts.rules || []
    onUpdate('alerts', 'rules', rules.filter(r => r.id !== id))
  }

  const toggleAlertEnabled = (id: string) => {
    const rules = settings.alerts.rules || []
    onUpdate('alerts', 'rules', rules.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ))
  }

  return (
    <div className="space-y-6">
      {/* Analytics Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Analytics Tracking
          </CardTitle>
          <CardDescription>
            Configure analytics providers and tracking settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Analytics</Label>
              <p className="text-sm text-muted-foreground">Track user behavior and site usage</p>
            </div>
            <Switch
              checked={settings.tracking.enabled}
              onCheckedChange={(checked) => onUpdate('tracking', 'enabled', checked)}
            />
          </div>

          {settings.tracking.enabled && (
            <>
              <div>
                <Label>Analytics Provider</Label>
                <Select
                  value={settings.tracking.provider}
                  onValueChange={(value) => onUpdate('tracking', 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="posthog">PostHog</SelectItem>
                    <SelectItem value="google">Google Analytics</SelectItem>
                    <SelectItem value="plausible">Plausible</SelectItem>
                    <SelectItem value="custom">Custom Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tracking ID / API Key</Label>
                <Input
                  value={settings.tracking.tracking_id || ''}
                  onChange={(e) => onUpdate('tracking', 'tracking_id', e.target.value)}
                  placeholder={
                    settings.tracking.provider === 'google' ? 'G-XXXXXXXXXX' :
                    settings.tracking.provider === 'posthog' ? 'phc_xxxxxxxxxx' :
                    'Your tracking ID'
                  }
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Page Views</Label>
                    <p className="text-sm text-muted-foreground">Record page visit data</p>
                  </div>
                  <Switch
                    checked={settings.tracking.track_page_views}
                    onCheckedChange={(checked) => onUpdate('tracking', 'track_page_views', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track User Interactions</Label>
                    <p className="text-sm text-muted-foreground">Record clicks, forms, and actions</p>
                  </div>
                  <Switch
                    checked={settings.tracking.track_user_interactions}
                    onCheckedChange={(checked) => onUpdate('tracking', 'track_user_interactions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Track Performance Metrics</Label>
                    <p className="text-sm text-muted-foreground">Core Web Vitals and load times</p>
                  </div>
                  <Switch
                    checked={settings.tracking.track_performance_metrics}
                    onCheckedChange={(checked) => onUpdate('tracking', 'track_performance_metrics', checked)}
                  />
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t">
                <Label>Privacy Settings</Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Anonymize IP Addresses</Label>
                      <p className="text-sm text-muted-foreground">Remove last octet from IPs</p>
                    </div>
                    <Switch
                      checked={settings.tracking.anonymize_ip}
                      onCheckedChange={(checked) => onUpdate('tracking', 'anonymize_ip', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Respect Do Not Track</Label>
                      <p className="text-sm text-muted-foreground">Honor browser DNT settings</p>
                    </div>
                    <Switch
                      checked={settings.tracking.respect_dnt}
                      onCheckedChange={(checked) => onUpdate('tracking', 'respect_dnt', checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Cookie Consent</Label>
                      <p className="text-sm text-muted-foreground">Show consent banner before tracking</p>
                    </div>
                    <Switch
                      checked={settings.tracking.cookie_consent_required}
                      onCheckedChange={(checked) => onUpdate('tracking', 'cookie_consent_required', checked)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Configure API and performance monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Metrics Collection</Label>
              <p className="text-sm text-muted-foreground">Track API performance and errors</p>
            </div>
            <Switch
              checked={settings.metrics.enabled}
              onCheckedChange={(checked) => onUpdate('metrics', 'enabled', checked)}
            />
          </div>

          {settings.metrics.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Collection Interval (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.metrics.collection_interval_seconds}
                    onChange={(e) => onUpdate('metrics', 'collection_interval_seconds', parseInt(e.target.value) || 60)}
                    min={10}
                    max={3600}
                  />
                </div>
                <div>
                  <Label>Retention Days</Label>
                  <Input
                    type="number"
                    value={settings.metrics.retention_days}
                    onChange={(e) => onUpdate('metrics', 'retention_days', parseInt(e.target.value) || 30)}
                    min={1}
                    max={365}
                  />
                </div>
              </div>

              <div>
                <Label>Sample Rate (%)</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Input
                    type="number"
                    value={settings.metrics.sample_rate}
                    onChange={(e) => onUpdate('metrics', 'sample_rate', Math.min(100, Math.max(0, parseInt(e.target.value) || 100)))}
                    min={0}
                    max={100}
                    className="w-24"
                  />
                  <span className="text-sm text-muted-foreground">
                    {settings.metrics.sample_rate === 100 ? 'All requests' : `${settings.metrics.sample_rate}% of requests`}
                  </span>
                </div>
              </div>

              <div>
                <Label>Tracked Endpoints</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {settings.metrics.tracked_endpoints.map((endpoint, index) => (
                      <Badge key={index} variant="secondary">
                        {endpoint}
                        <button
                          onClick={() => removeFromArray('metrics', 'tracked_endpoints', index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newEndpoint}
                      onChange={(e) => setNewEndpoint(e.target.value)}
                      placeholder="/api/endpoint"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addToArray('metrics', 'tracked_endpoints', newEndpoint)
                          setNewEndpoint('')
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        addToArray('metrics', 'tracked_endpoints', newEndpoint)
                        setNewEndpoint('')
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Aggregate By</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['endpoint', 'user', 'hour', 'day'].map((option) => (
                    <Badge
                      key={option}
                      variant={settings.metrics.aggregate_by.includes(option as any) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = settings.metrics.aggregate_by
                        if (current.includes(option as any)) {
                          onUpdate('metrics', 'aggregate_by', current.filter(o => o !== option))
                        } else {
                          onUpdate('metrics', 'aggregate_by', [...current, option])
                        }
                      }}
                    >
                      {option}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alerts & Monitoring */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts & Monitoring
          </CardTitle>
          <CardDescription>
            Set up alerts for critical metrics and errors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Alerts</Label>
              <p className="text-sm text-muted-foreground">Get notified about issues</p>
            </div>
            <Switch
              checked={settings.alerts.enabled}
              onCheckedChange={(checked) => onUpdate('alerts', 'enabled', checked)}
            />
          </div>

          {settings.alerts.enabled && (
            <>
              <div>
                <Label>Alert Channels</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['email', 'slack', 'webhook'].map((channel) => (
                    <Badge
                      key={channel}
                      variant={settings.alerts.channels.includes(channel as any) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const channels = settings.alerts.channels
                        if (channels.includes(channel as any)) {
                          onUpdate('alerts', 'channels', channels.filter(c => c !== channel))
                        } else {
                          onUpdate('alerts', 'channels', [...channels, channel])
                        }
                      }}
                    >
                      {channel}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label>Alert Rules</Label>
                <div className="space-y-2 mt-2">
                  {settings.alerts.rules.map((rule) => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rule.name}</span>
                          <Badge variant={rule.enabled ? 'default' : 'secondary'} className="text-xs">
                            {rule.enabled ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rule.metric} {rule.condition} {rule.threshold} (window: {rule.window_minutes}min)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => toggleAlertEnabled(rule.id)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAlert(rule.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <div className="space-y-2 border-t pt-4">
                    <Label>Add New Alert</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Alert name"
                        value={newAlert.name}
                        onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                      />
                      <Select
                        value={newAlert.metric}
                        onValueChange={(value) => setNewAlert({ ...newAlert, metric: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="response_time">Response Time</SelectItem>
                          <SelectItem value="error_rate">Error Rate</SelectItem>
                          <SelectItem value="request_count">Request Count</SelectItem>
                          <SelectItem value="cpu_usage">CPU Usage</SelectItem>
                          <SelectItem value="memory_usage">Memory Usage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        value={newAlert.condition}
                        onValueChange={(value: any) => setNewAlert({ ...newAlert, condition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="above">Above</SelectItem>
                          <SelectItem value="below">Below</SelectItem>
                          <SelectItem value="equals">Equals</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder="Threshold"
                        value={newAlert.threshold}
                        onChange={(e) => setNewAlert({ ...newAlert, threshold: parseInt(e.target.value) || 0 })}
                      />
                      <Input
                        type="number"
                        placeholder="Window (min)"
                        value={newAlert.window_minutes}
                        onChange={(e) => setNewAlert({ ...newAlert, window_minutes: parseInt(e.target.value) || 5 })}
                      />
                    </div>
                    <Button onClick={addAlert} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Alert Rule
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy & Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Privacy & Compliance
          </CardTitle>
          <CardDescription>
            Data privacy and GDPR compliance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              These settings ensure compliance with privacy regulations like GDPR. 
              Consult legal counsel for your specific requirements.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between">
            <div>
              <Label>GDPR Compliant Mode</Label>
              <p className="text-sm text-muted-foreground">Enforce strict privacy controls</p>
            </div>
            <Switch
              checked={settings.privacy.gdpr_compliant}
              onCheckedChange={(checked) => onUpdate('privacy', 'gdpr_compliant', checked)}
            />
          </div>

          <div>
            <Label>Data Retention Period (days)</Label>
            <Input
              type="number"
              value={settings.privacy.data_retention_days}
              onChange={(e) => onUpdate('privacy', 'data_retention_days', parseInt(e.target.value) || 30)}
              min={1}
              max={1825}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Automatically delete data older than this period
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Data Export</Label>
                <p className="text-sm text-muted-foreground">Users can export their data</p>
              </div>
              <Switch
                checked={settings.privacy.allow_data_export}
                onCheckedChange={(checked) => onUpdate('privacy', 'allow_data_export', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Data Deletion</Label>
                <p className="text-sm text-muted-foreground">Users can request data deletion</p>
              </div>
              <Switch
                checked={settings.privacy.allow_data_deletion}
                onCheckedChange={(checked) => onUpdate('privacy', 'allow_data_deletion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Mask Sensitive Data</Label>
                <p className="text-sm text-muted-foreground">Automatically redact PII in logs</p>
              </div>
              <Switch
                checked={settings.privacy.mask_sensitive_data}
                onCheckedChange={(checked) => onUpdate('privacy', 'mask_sensitive_data', checked)}
              />
            </div>
          </div>

          <div>
            <Label>Excluded Fields</Label>
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-2">
                {settings.privacy.excluded_fields.map((field, index) => (
                  <Badge key={index} variant="secondary">
                    {field}
                    <button
                      onClick={() => removeFromArray('privacy', 'excluded_fields', index)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newExcludedField}
                  onChange={(e) => setNewExcludedField(e.target.value)}
                  placeholder="email, password, ssn..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addToArray('privacy', 'excluded_fields', newExcludedField)
                      setNewExcludedField('')
                    }
                  }}
                />
                <Button
                  size="icon"
                  onClick={() => {
                    addToArray('privacy', 'excluded_fields', newExcludedField)
                    setNewExcludedField('')
                  }}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}