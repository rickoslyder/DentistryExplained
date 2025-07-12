'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  Bot, 
  BrainCircuit,
  Zap,
  DollarSign,
  Eye,
  Code,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
  Send,
  Hash,
  Settings2,
  Sparkles,
  Info
} from 'lucide-react'
import { toast } from 'sonner'
import { useDebounce } from 'use-debounce'

interface AISettings {
  model: string
  temperature: number
  max_tokens: number
  system_prompt: string
}

interface ModelInfo {
  id: string
  name: string
  displayName: string
  provider: string
  capabilities: {
    contextWindow: number
    supportsVision: boolean
    supportsFunctions: boolean
    maxOutputTokens: number
  }
}

interface AISettingsEnhancedProps {
  settings: AISettings
  onUpdate: (field: keyof AISettings, value: any) => void
}

export function AISettingsEnhanced({ settings, onUpdate }: AISettingsEnhancedProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [loadingModels, setLoadingModels] = useState(false)
  const [selectedModelInfo, setSelectedModelInfo] = useState<any>(null)
  const [loadingModelInfo, setLoadingModelInfo] = useState(false)
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testing, setTesting] = useState(false)
  const [testMessage, setTestMessage] = useState('What are the main causes of tooth decay?')
  const [tokenCount, setTokenCount] = useState<number | null>(null)
  const [countingTokens, setCountingTokens] = useState(false)
  
  const [debouncedPrompt] = useDebounce(settings.system_prompt, 500)

  // Fetch available models
  const fetchModels = useCallback(async () => {
    setLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai/models')
      if (!response.ok) throw new Error('Failed to fetch models')
      
      const data = await response.json()
      setModels(data.models)
    } catch (error) {
      console.error('Error fetching models:', error)
      toast.error('Failed to load available models')
    } finally {
      setLoadingModels(false)
    }
  }, [])

  // Fetch model info when model changes
  const fetchModelInfo = useCallback(async (modelId: string) => {
    setLoadingModelInfo(true)
    try {
      const response = await fetch(`/api/admin/ai/model-info?model=${modelId}`)
      if (!response.ok) throw new Error('Failed to fetch model info')
      
      const data = await response.json()
      setSelectedModelInfo(data)
      
      // Update settings with recommendations
      if (data.recommendations) {
        onUpdate('temperature', data.recommendations.temperature)
        onUpdate('max_tokens', data.recommendations.maxTokens)
        onUpdate('system_prompt', data.recommendations.systemPrompt)
      }
    } catch (error) {
      console.error('Error fetching model info:', error)
      toast.error('Failed to load model information')
    } finally {
      setLoadingModelInfo(false)
    }
  }, [onUpdate])

  // Count tokens for system prompt
  const countTokens = useCallback(async (text: string) => {
    if (!text) {
      setTokenCount(0)
      return
    }
    
    setCountingTokens(true)
    try {
      const response = await fetch('/api/admin/ai/token-count', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, model: settings.model }),
      })
      
      if (!response.ok) throw new Error('Failed to count tokens')
      
      const data = await response.json()
      setTokenCount(data.tokenCount)
    } catch (error) {
      console.error('Error counting tokens:', error)
    } finally {
      setCountingTokens(false)
    }
  }, [settings.model])

  // Test the model configuration
  const testModel = async () => {
    setTesting(true)
    setTestResponse(null)
    
    try {
      const response = await fetch('/api/admin/ai/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: settings.model,
          temperature: settings.temperature,
          maxTokens: settings.max_tokens,
          systemPrompt: settings.system_prompt,
          testMessage,
        }),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Test failed')
      }
      
      setTestResponse(data)
      toast.success('Model test completed successfully')
    } catch (error) {
      console.error('Error testing model:', error)
      toast.error(`Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      setTestResponse({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    } finally {
      setTesting(false)
    }
  }

  // Load models on mount
  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  // Fetch model info when model changes
  useEffect(() => {
    if (settings.model) {
      fetchModelInfo(settings.model)
    }
  }, [settings.model, fetchModelInfo])

  // Count tokens when prompt changes
  useEffect(() => {
    if (debouncedPrompt) {
      countTokens(debouncedPrompt)
    } else {
      setTokenCount(0)
    }
  }, [debouncedPrompt, countTokens])

  const selectedModel = models.find(m => m.id === settings.model)
  
  // Get unique providers from models
  const providers = Array.from(new Set(models.map(m => m.provider))).sort()
  
  // Filter models by selected provider
  const filteredModels = selectedProvider === 'all' 
    ? models 
    : models.filter(m => m.provider === selectedProvider)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          AI Configuration
        </CardTitle>
        <CardDescription>
          Configure AI model settings using LiteLLM proxy
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs defaultValue="model" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="model">Model Selection</TabsTrigger>
            <TabsTrigger value="parameters">Parameters</TabsTrigger>
            <TabsTrigger value="test">Test & Debug</TabsTrigger>
          </TabsList>
          
          <TabsContent value="model" className="space-y-4">
            <div>
              <Label htmlFor="ai-model">AI Model</Label>
              <div className="space-y-2 mt-2">
                <div className="flex gap-2">
                  <Select
                    value={selectedProvider}
                    onValueChange={setSelectedProvider}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Providers</SelectItem>
                      {providers.map((provider) => (
                        <SelectItem key={provider} value={provider}>
                          {provider.charAt(0).toUpperCase() + provider.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={settings.model}
                    onValueChange={(value) => onUpdate('model', value)}
                    disabled={loadingModels}
                  >
                    <SelectTrigger id="ai-model" className="flex-1">
                      <SelectValue placeholder={loadingModels ? "Loading models..." : "Select a model"} />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredModels.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          <div className="flex items-center gap-2">
                            <span>{model.displayName}</span>
                            <Badge variant="outline" className="text-xs">
                              {model.provider}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={fetchModels}
                    disabled={loadingModels}
                  >
                    <RefreshCw className={`h-4 w-4 ${loadingModels ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
            
            {selectedModel && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <BrainCircuit className="h-4 w-4" />
                        Context Window
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedModel.capabilities.contextWindow.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        Max Output
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">
                        {selectedModel.capabilities.maxOutputTokens.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground">tokens</p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {selectedModel.capabilities.supportsVision && (
                    <Badge variant="secondary">
                      <Eye className="h-3 w-3 mr-1" />
                      Vision Support
                    </Badge>
                  )}
                  {selectedModel.capabilities.supportsFunctions && (
                    <Badge variant="secondary">
                      <Code className="h-3 w-3 mr-1" />
                      Function Calling
                    </Badge>
                  )}
                  <Badge variant="outline">
                    Provider: {selectedModel.provider}
                  </Badge>
                </div>
                
                {loadingModelInfo && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading model details...
                  </div>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="parameters" className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Temperature: {settings.temperature}</Label>
                <span className="text-sm text-muted-foreground">
                  {settings.temperature < 0.3 ? 'Focused' : settings.temperature < 0.7 ? 'Balanced' : 'Creative'}
                </span>
              </div>
              <Slider
                value={[settings.temperature]}
                onValueChange={([value]) => onUpdate('temperature', value)}
                min={0}
                max={1}
                step={0.1}
                className="mb-1"
              />
              <p className="text-xs text-muted-foreground">
                Controls randomness (0 = focused, 1 = creative)
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Max Tokens: {settings.max_tokens}</Label>
                {selectedModel && (
                  <span className="text-sm text-muted-foreground">
                    Max: {selectedModel.capabilities.maxOutputTokens.toLocaleString()}
                  </span>
                )}
              </div>
              <Slider
                value={[settings.max_tokens]}
                onValueChange={([value]) => onUpdate('max_tokens', value)}
                min={100}
                max={selectedModel?.capabilities.maxOutputTokens || 4000}
                step={100}
                className="mb-1"
              />
              <p className="text-xs text-muted-foreground">
                Maximum response length in tokens
              </p>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="system-prompt">System Prompt</Label>
                <div className="flex items-center gap-2 text-sm">
                  {countingTokens ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : tokenCount !== null ? (
                    <>
                      <Hash className="h-3 w-3" />
                      <span>{tokenCount} tokens</span>
                    </>
                  ) : null}
                </div>
              </div>
              <Textarea
                id="system-prompt"
                value={settings.system_prompt}
                onChange={(e) => onUpdate('system_prompt', e.target.value)}
                rows={6}
                className="font-mono text-sm"
                placeholder="Define the AI assistant's behavior and guidelines..."
              />
              {selectedModel && tokenCount !== null && tokenCount > selectedModel.capabilities.contextWindow * 0.5 && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    System prompt uses {Math.round((tokenCount / selectedModel.capabilities.contextWindow) * 100)}% of context window
                  </AlertDescription>
                </Alert>
              )}
            </div>
            
            {selectedModelInfo?.supportedParams && Object.keys(selectedModelInfo.supportedParams).length > 0 && (
              <div>
                <Label className="text-sm text-muted-foreground">Advanced Parameters</Label>
                <div className="mt-2 space-y-2">
                  {Object.entries(selectedModelInfo.supportedParams).map(([param, supported]) => (
                    <div key={param} className="flex items-center gap-2">
                      {supported ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="text-sm">{param.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {(!selectedModelInfo?.supportedParams || Object.keys(selectedModelInfo.supportedParams).length === 0) && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Advanced parameter information is not available for this model.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="test" className="space-y-4">
            <div>
              <Label htmlFor="test-message">Test Message</Label>
              <Textarea
                id="test-message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
                placeholder="Enter a test message to send to the AI..."
                className="mt-2"
              />
            </div>
            
            <Button 
              onClick={testModel} 
              disabled={testing || !settings.model}
              className="w-full"
            >
              {testing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing Model...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Test Configuration
                </>
              )}
            </Button>
            
            {testResponse && (
              <div className="space-y-3">
                <Separator />
                
                {testResponse.success ? (
                  <>
                    <Alert>
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertDescription>
                        Model responded successfully in {testResponse.responseTime}ms
                      </AlertDescription>
                    </Alert>
                    
                    <div>
                      <Label className="text-sm">Response</Label>
                      <div className="mt-1 p-3 bg-muted rounded-md">
                        <p className="text-sm whitespace-pre-wrap">{testResponse.response}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            Input Tokens
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">
                            {testResponse.usage?.prompt_tokens || 0}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <Sparkles className="h-3 w-3" />
                            Output Tokens
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">
                            {testResponse.usage?.completion_tokens || 0}
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-xs flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Cost
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-lg font-semibold">
                            ${testResponse.costs?.totalCost.toFixed(4) || '0.0000'}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </>
                ) : (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {testResponse.error || 'Test failed'}
                      {testResponse.details && (
                        <pre className="mt-2 text-xs overflow-x-auto">
                          {JSON.stringify(testResponse.details, null, 2)}
                        </pre>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}