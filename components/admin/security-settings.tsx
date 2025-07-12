'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
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
  Shield, 
  Lock, 
  Globe,
  AlertTriangle,
  Info,
  Plus,
  X,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface SecuritySettingsProps {
  settings: {
    rate_limiting: {
      enabled: boolean
      requests_per_minute: number
      requests_per_hour: number
      burst_limit: number
      block_duration_minutes: number
    }
    cors: {
      enabled: boolean
      allowed_origins: string[]
      allowed_methods: string[]
      allowed_headers: string[]
      credentials: boolean
      max_age_seconds: number
    }
    csp: {
      enabled: boolean
      directives: {
        default_src: string[]
        script_src: string[]
        style_src: string[]
        img_src: string[]
        font_src: string[]
        connect_src: string[]
        frame_src: string[]
      }
      report_uri: string | null
    }
    session: {
      timeout_minutes: number
      refresh_enabled: boolean
      concurrent_sessions_limit: number
      secure_cookies: boolean
    }
    authentication: {
      two_factor_required: boolean
      password_min_length: number
      password_require_uppercase: boolean
      password_require_numbers: boolean
      password_require_symbols: boolean
      failed_login_attempts_limit: number
      lockout_duration_minutes: number
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function SecuritySettings({ settings, onUpdate }: SecuritySettingsProps) {
  const [newOrigin, setNewOrigin] = useState('')
  const [newMethod, setNewMethod] = useState('')
  const [newHeader, setNewHeader] = useState('')
  const [newCSPDirective, setNewCSPDirective] = useState({ directive: 'default_src', value: '' })

  const updateNestedSettings = (section: string, subsection: string, field: string, value: any) => {
    const currentSubsection = settings[section as keyof typeof settings]
    onUpdate(section, subsection, {
      ...currentSubsection,
      [field]: value
    })
  }

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

  const addCSPDirective = (directive: string, value: string) => {
    if (!value.trim()) return
    const current = settings.csp.directives[directive as keyof typeof settings.csp.directives] || []
    if (!current.includes(value)) {
      onUpdate('csp', 'directives', {
        ...settings.csp.directives,
        [directive]: [...current, value]
      })
    }
    setNewCSPDirective({ directive: 'default_src', value: '' })
  }

  const removeCSPDirective = (directive: string, index: number) => {
    const current = settings.csp.directives[directive as keyof typeof settings.csp.directives] || []
    onUpdate('csp', 'directives', {
      ...settings.csp.directives,
      [directive]: current.filter((_, i) => i !== index)
    })
  }

  return (
    <div className="space-y-6">
      {/* Rate Limiting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Rate Limiting
          </CardTitle>
          <CardDescription>
            Protect your API from abuse and ensure fair usage
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">Limit requests per user/IP</p>
            </div>
            <Switch
              checked={settings.rate_limiting.enabled}
              onCheckedChange={(checked) => onUpdate('rate_limiting', 'enabled', checked)}
            />
          </div>

          {settings.rate_limiting.enabled && (
            <>
              <div>
                <Label>Requests per Minute</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.rate_limiting.requests_per_minute]}
                    onValueChange={([value]) => onUpdate('rate_limiting', 'requests_per_minute', value)}
                    min={10}
                    max={200}
                    step={10}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{settings.rate_limiting.requests_per_minute}</span>
                </div>
              </div>

              <div>
                <Label>Requests per Hour</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.rate_limiting.requests_per_hour]}
                    onValueChange={([value]) => onUpdate('rate_limiting', 'requests_per_hour', value)}
                    min={100}
                    max={5000}
                    step={100}
                    className="flex-1"
                  />
                  <span className="w-16 text-sm font-medium">{settings.rate_limiting.requests_per_hour}</span>
                </div>
              </div>

              <div>
                <Label>Burst Limit</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.rate_limiting.burst_limit]}
                    onValueChange={([value]) => onUpdate('rate_limiting', 'burst_limit', value)}
                    min={5}
                    max={50}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{settings.rate_limiting.burst_limit}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Maximum requests allowed in a short burst
                </p>
              </div>

              <div>
                <Label>Block Duration (minutes)</Label>
                <Input
                  type="number"
                  value={settings.rate_limiting.block_duration_minutes}
                  onChange={(e) => onUpdate('rate_limiting', 'block_duration_minutes', parseInt(e.target.value) || 0)}
                  className="w-32"
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* CORS Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            CORS Configuration
          </CardTitle>
          <CardDescription>
            Configure Cross-Origin Resource Sharing policies
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable CORS</Label>
              <p className="text-sm text-muted-foreground">Allow cross-origin requests</p>
            </div>
            <Switch
              checked={settings.cors.enabled}
              onCheckedChange={(checked) => onUpdate('cors', 'enabled', checked)}
            />
          </div>

          {settings.cors.enabled && (
            <>
              <div>
                <Label>Allowed Origins</Label>
                <div className="space-y-2 mt-2">
                  {settings.cors.allowed_origins.map((origin, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Badge variant="secondary" className="flex-1 justify-between">
                        {origin}
                        <button
                          onClick={() => removeFromArray('cors', 'allowed_origins', index)}
                          className="ml-2 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Input
                      value={newOrigin}
                      onChange={(e) => setNewOrigin(e.target.value)}
                      placeholder="https://example.com"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addToArray('cors', 'allowed_origins', newOrigin)
                          setNewOrigin('')
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        addToArray('cors', 'allowed_origins', newOrigin)
                        setNewOrigin('')
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Allowed Methods</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'].map((method) => (
                    <Badge
                      key={method}
                      variant={settings.cors.allowed_methods.includes(method) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const methods = settings.cors.allowed_methods
                        if (methods.includes(method)) {
                          onUpdate('cors', 'allowed_methods', methods.filter(m => m !== method))
                        } else {
                          onUpdate('cors', 'allowed_methods', [...methods, method])
                        }
                      }}
                    >
                      {method}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Allow Credentials</Label>
                  <p className="text-sm text-muted-foreground">Include cookies in CORS requests</p>
                </div>
                <Switch
                  checked={settings.cors.credentials}
                  onCheckedChange={(checked) => onUpdate('cors', 'credentials', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Content Security Policy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Content Security Policy
          </CardTitle>
          <CardDescription>
            Configure CSP headers to prevent XSS attacks
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable CSP</Label>
              <p className="text-sm text-muted-foreground">Add Content-Security-Policy headers</p>
            </div>
            <Switch
              checked={settings.csp.enabled}
              onCheckedChange={(checked) => onUpdate('csp', 'enabled', checked)}
            />
          </div>

          {settings.csp.enabled && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  CSP helps prevent XSS attacks by controlling which resources can be loaded. 
                  Be careful when modifying these settings as they can break functionality.
                </AlertDescription>
              </Alert>

              {Object.entries(settings.csp.directives).map(([directive, values]) => (
                <div key={directive}>
                  <Label>{directive.replace(/_/g, '-')}</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex flex-wrap gap-2">
                      {(values as string[]).map((value, index) => (
                        <Badge key={index} variant="secondary">
                          {value}
                          <button
                            onClick={() => removeCSPDirective(directive, index)}
                            className="ml-1 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}

              <div>
                <Label>Add CSP Directive</Label>
                <div className="flex gap-2 mt-2">
                  <Select
                    value={newCSPDirective.directive}
                    onValueChange={(value) => setNewCSPDirective({ ...newCSPDirective, directive: value })}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(settings.csp.directives).map((directive) => (
                        <SelectItem key={directive} value={directive}>
                          {directive.replace(/_/g, '-')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={newCSPDirective.value}
                    onChange={(e) => setNewCSPDirective({ ...newCSPDirective, value: e.target.value })}
                    placeholder="'self' or https://example.com"
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        addCSPDirective(newCSPDirective.directive, newCSPDirective.value)
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    onClick={() => addCSPDirective(newCSPDirective.directive, newCSPDirective.value)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Session Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Session Security
          </CardTitle>
          <CardDescription>
            Configure session timeout and security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Session Timeout (minutes)</Label>
            <div className="flex items-center gap-4 mt-2">
              <Slider
                value={[settings.session.timeout_minutes]}
                onValueChange={([value]) => onUpdate('session', 'timeout_minutes', value)}
                min={5}
                max={1440}
                step={5}
                className="flex-1"
              />
              <span className="w-16 text-sm font-medium">{settings.session.timeout_minutes} min</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Session Refresh</Label>
              <p className="text-sm text-muted-foreground">Automatically refresh sessions</p>
            </div>
            <Switch
              checked={settings.session.refresh_enabled}
              onCheckedChange={(checked) => onUpdate('session', 'refresh_enabled', checked)}
            />
          </div>

          <div>
            <Label>Concurrent Sessions Limit</Label>
            <Input
              type="number"
              value={settings.session.concurrent_sessions_limit}
              onChange={(e) => onUpdate('session', 'concurrent_sessions_limit', parseInt(e.target.value) || 1)}
              className="w-32"
              min={1}
              max={10}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum active sessions per user
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Secure Cookies</Label>
              <p className="text-sm text-muted-foreground">Use secure flag for cookies (HTTPS only)</p>
            </div>
            <Switch
              checked={settings.session.secure_cookies}
              onCheckedChange={(checked) => onUpdate('session', 'secure_cookies', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}