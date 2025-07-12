'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Save, Plus, Trash2, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ModerationSettings {
  enabled: boolean
  providers: {
    openai: { enabled: boolean }
    perspective: { enabled: boolean }
  }
  thresholds: {
    autoApprove: number
    autoReject: number
    reviewRequired: number
  }
  wordFilter: {
    enabled: boolean
    customWords: Array<{
      id: string
      word: string
      severity: string
      enabled: boolean
    }>
  }
  patterns: {
    enabled: boolean
    customPatterns: Array<{
      id: string
      name: string
      pattern: string
      type: string
      enabled: boolean
    }>
  }
  workflows: {
    enabled: boolean
    customRules: Array<{
      id: string
      name: string
      conditions: any
      actions: any
      enabled: boolean
    }>
  }
}

export function ModerationSettings() {
  const [settings, setSettings] = useState<ModerationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testContent, setTestContent] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings')
      if (!response.ok) throw new Error('Failed to fetch settings')
      const data = await response.json()
      setSettings(data.moderation || getDefaultSettings())
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      })
      setSettings(getDefaultSettings())
    } finally {
      setLoading(false)
    }
  }

  const getDefaultSettings = (): ModerationSettings => ({
    enabled: true,
    providers: {
      openai: { enabled: true },
      perspective: { enabled: false }
    },
    thresholds: {
      autoApprove: 0.2,
      autoReject: 0.9,
      reviewRequired: 0.5
    },
    wordFilter: {
      enabled: true,
      customWords: []
    },
    patterns: {
      enabled: true,
      customPatterns: []
    },
    workflows: {
      enabled: true,
      customRules: []
    }
  })

  const saveSettings = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moderation: settings })
      })

      if (!response.ok) throw new Error('Failed to save settings')

      toast({
        title: 'Success',
        description: 'Settings saved successfully'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  const testModeration = async () => {
    if (!testContent.trim()) return

    try {
      const response = await fetch('/api/admin/moderation/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: testContent })
      })

      if (!response.ok) throw new Error('Test failed')
      const result = await response.json()
      setTestResult(result)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to test moderation',
        variant: 'destructive'
      })
    }
  }

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
          <TabsTrigger value="words">Word Filter</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="test">Test</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Configure moderation system behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="enabled">Enable Moderation</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn content moderation on or off
                  </p>
                </div>
                <Switch
                  id="enabled"
                  checked={settings.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({ ...settings, enabled: checked })
                  }
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium">AI Providers</h4>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="openai">OpenAI Moderation</Label>
                    <p className="text-sm text-muted-foreground">
                      Use OpenAI's moderation API
                    </p>
                  </div>
                  <Switch
                    id="openai"
                    checked={settings.providers.openai.enabled}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        providers: {
                          ...settings.providers,
                          openai: { enabled: checked }
                        }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="perspective">Google Perspective</Label>
                    <p className="text-sm text-muted-foreground">
                      Use Google's Perspective API
                    </p>
                  </div>
                  <Switch
                    id="perspective"
                    checked={settings.providers.perspective.enabled}
                    onCheckedChange={(checked) => 
                      setSettings({
                        ...settings,
                        providers: {
                          ...settings.providers,
                          perspective: { enabled: checked }
                        }
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Threshold Settings */}
        <TabsContent value="thresholds">
          <Card>
            <CardHeader>
              <CardTitle>Confidence Thresholds</CardTitle>
              <CardDescription>
                Set thresholds for automated moderation actions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Auto-Approve Threshold</Label>
                  <span className="text-sm font-medium">
                    {(settings.thresholds.autoApprove * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.autoApprove * 100]}
                  onValueChange={([value]) => 
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        autoApprove: value / 100
                      }
                    })
                  }
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Content below this confidence level is automatically approved
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Review Required Threshold</Label>
                  <span className="text-sm font-medium">
                    {(settings.thresholds.reviewRequired * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.reviewRequired * 100]}
                  onValueChange={([value]) => 
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        reviewRequired: value / 100
                      }
                    })
                  }
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Content above this level requires manual review
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label>Auto-Reject Threshold</Label>
                  <span className="text-sm font-medium">
                    {(settings.thresholds.autoReject * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[settings.thresholds.autoReject * 100]}
                  onValueChange={([value]) => 
                    setSettings({
                      ...settings,
                      thresholds: {
                        ...settings.thresholds,
                        autoReject: value / 100
                      }
                    })
                  }
                  max={100}
                  step={5}
                />
                <p className="text-xs text-muted-foreground">
                  Content above this confidence level is automatically rejected
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg">
                <div className="flex gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-900">Threshold Guidelines</p>
                    <p className="text-yellow-700 mt-1">
                      Auto-approve should be lower than review required, which should be lower than auto-reject.
                      Current order: {settings.thresholds.autoApprove < settings.thresholds.reviewRequired && 
                      settings.thresholds.reviewRequired < settings.thresholds.autoReject ? 
                      '✓ Valid' : '✗ Invalid'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Word Filter Settings */}
        <TabsContent value="words">
          <Card>
            <CardHeader>
              <CardTitle>Word Filter</CardTitle>
              <CardDescription>
                Manage banned words and phrases
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Word Filter</Label>
                <Switch
                  checked={settings.wordFilter.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      wordFilter: {
                        ...settings.wordFilter,
                        enabled: checked
                      }
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Custom Banned Words</Label>
                <div className="space-y-2">
                  {settings.wordFilter.customWords.map((word, index) => (
                    <div key={word.id} className="flex items-center gap-2">
                      <Input value={word.word} readOnly />
                      <Badge variant={
                        word.severity === 'critical' ? 'destructive' :
                        word.severity === 'high' ? 'default' :
                        'secondary'
                      }>
                        {word.severity}
                      </Badge>
                      <Switch checked={word.enabled} />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newWords = [...settings.wordFilter.customWords]
                          newWords.splice(index, 1)
                          setSettings({
                            ...settings,
                            wordFilter: {
                              ...settings.wordFilter,
                              customWords: newWords
                            }
                          })
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-2">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Word
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pattern Settings */}
        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Content Patterns</CardTitle>
              <CardDescription>
                Configure regex patterns for content detection
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Enable Pattern Matching</Label>
                <Switch
                  checked={settings.patterns.enabled}
                  onCheckedChange={(checked) => 
                    setSettings({
                      ...settings,
                      patterns: {
                        ...settings.patterns,
                        enabled: checked
                      }
                    })
                  }
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Custom pattern configuration coming soon...
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Test Moderation */}
        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>Test Moderation</CardTitle>
              <CardDescription>
                Test content against current moderation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Test Content</Label>
                <Textarea
                  value={testContent}
                  onChange={(e) => setTestContent(e.target.value)}
                  placeholder="Enter content to test..."
                  rows={4}
                />
              </div>

              <Button onClick={testModeration}>
                Run Test
              </Button>

              {testResult && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Test Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-sm overflow-auto">
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}