'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Zap, 
  HardDrive,
  RefreshCw,
  Gauge,
  Server,
  Database,
  Plus,
  X,
  Info,
  Trash2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface CacheSettingsProps {
  settings: {
    browser_cache: {
      enabled: boolean
      static_assets_max_age: number
      html_max_age: number
      api_max_age: number
      service_worker_enabled: boolean
      offline_mode_enabled: boolean
    }
    server_cache: {
      enabled: boolean
      provider: 'redis' | 'memcached' | 'memory' | 'cloudflare'
      ttl_seconds: number
      max_size_mb: number
      eviction_policy: 'lru' | 'lfu' | 'fifo' | 'random'
      warm_cache_on_start: boolean
    }
    database_cache: {
      enabled: boolean
      query_cache_enabled: boolean
      query_cache_size_mb: number
      result_cache_ttl: number
      cached_queries: string[]
    }
    cdn: {
      enabled: boolean
      provider: 'cloudflare' | 'fastly' | 'aws' | 'custom'
      purge_on_deploy: boolean
      image_optimization: boolean
      auto_webp: boolean
      lazy_loading: boolean
    }
    performance: {
      minify_assets: boolean
      compress_responses: boolean
      bundle_splitting: boolean
      preload_critical_assets: boolean
      prefetch_links: boolean
      resource_hints: string[]
    }
    web_search_cache: {
      enabled: boolean
      ttl_hours: number
      max_entries: number
      cache_perplexity: boolean
      cache_exa: boolean
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function CacheSettings({ settings, onUpdate }: CacheSettingsProps) {
  const [clearing, setClearing] = useState<string | null>(null)
  const [newQuery, setNewQuery] = useState('')
  const [newResourceHint, setNewResourceHint] = useState({ type: 'dns-prefetch', url: '' })
  const [cacheStats, setCacheStats] = useState({
    browser: { size: '0 MB', items: 0 },
    server: { size: '0 MB', items: 0, hitRate: 0 },
    database: { size: '0 MB', items: 0, hitRate: 0 },
    cdn: { bandwidth: '0 GB', requests: 0, hitRate: 0 }
  })
  const [loadingStats, setLoadingStats] = useState(true)
  
  // Fetch cache statistics
  useEffect(() => {
    fetchCacheStats()
  }, [])
  
  const fetchCacheStats = async () => {
    setLoadingStats(true)
    try {
      const response = await fetch('/api/admin/cache/stats')
      if (!response.ok) throw new Error('Failed to fetch cache stats')
      
      const data = await response.json()
      setCacheStats(data)
    } catch (error) {
      console.error('Error fetching cache stats:', error)
      // Keep default empty stats on error
    } finally {
      setLoadingStats(false)
    }
  }

  const clearCache = async (type: string) => {
    setClearing(type)
    try {
      const response = await fetch(`/api/admin/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type })
      })
      
      if (!response.ok) throw new Error('Failed to clear cache')
      
      toast.success(`${type} cache cleared successfully`)
      
      // Refresh stats
      fetchCacheStats()
    } catch (error) {
      toast.error(`Failed to clear ${type} cache`)
    } finally {
      setClearing(null)
    }
  }

  const addCachedQuery = () => {
    if (!newQuery.trim()) return
    const queries = settings.database_cache.cached_queries || []
    if (!queries.includes(newQuery)) {
      onUpdate('database_cache', 'cached_queries', [...queries, newQuery])
    }
    setNewQuery('')
  }

  const removeCachedQuery = (index: number) => {
    const queries = settings.database_cache.cached_queries || []
    onUpdate('database_cache', 'cached_queries', queries.filter((_, i) => i !== index))
  }

  const addResourceHint = () => {
    if (!newResourceHint.url.trim()) return
    const hints = settings.performance.resource_hints || []
    const hint = `${newResourceHint.type}:${newResourceHint.url}`
    if (!hints.includes(hint)) {
      onUpdate('performance', 'resource_hints', [...hints, hint])
    }
    setNewResourceHint({ type: 'dns-prefetch', url: '' })
  }

  const removeResourceHint = (index: number) => {
    const hints = settings.performance.resource_hints || []
    onUpdate('performance', 'resource_hints', hints.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Cache Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Browser Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : cacheStats.browser.size}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? '...' : `${cacheStats.browser.items} items`}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => clearCache('browser')}
              disabled={clearing === 'browser'}
            >
              {clearing === 'browser' ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Clear
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Server Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : cacheStats.server.size}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? '...' : `${cacheStats.server.hitRate}% hit rate`}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => clearCache('server')}
              disabled={clearing === 'server'}
            >
              {clearing === 'server' ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Clear
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Database Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : cacheStats.database.size}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? '...' : `${cacheStats.database.hitRate}% hit rate`}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => clearCache('database')}
              disabled={clearing === 'database'}
            >
              {clearing === 'database' ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Clear
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">CDN Cache</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loadingStats ? '...' : cacheStats.cdn.bandwidth}</div>
            <p className="text-xs text-muted-foreground">{loadingStats ? '...' : `${cacheStats.cdn.hitRate}% hit rate`}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-full"
              onClick={() => clearCache('cdn')}
              disabled={clearing === 'cdn'}
            >
              {clearing === 'cdn' ? (
                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 mr-1" />
              )}
              Purge
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Browser Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Browser Cache
          </CardTitle>
          <CardDescription>
            Configure client-side caching for better performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Browser Caching</Label>
              <p className="text-sm text-muted-foreground">Set cache headers for assets</p>
            </div>
            <Switch
              checked={settings.browser_cache.enabled}
              onCheckedChange={(checked) => onUpdate('browser_cache', 'enabled', checked)}
            />
          </div>

          {settings.browser_cache.enabled && (
            <>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Static Assets (days)</Label>
                  <Input
                    type="number"
                    value={settings.browser_cache.static_assets_max_age / 86400}
                    onChange={(e) => onUpdate('browser_cache', 'static_assets_max_age', parseInt(e.target.value) * 86400 || 0)}
                    min={0}
                    max={365}
                  />
                </div>
                <div>
                  <Label>HTML (minutes)</Label>
                  <Input
                    type="number"
                    value={settings.browser_cache.html_max_age / 60}
                    onChange={(e) => onUpdate('browser_cache', 'html_max_age', parseInt(e.target.value) * 60 || 0)}
                    min={0}
                    max={1440}
                  />
                </div>
                <div>
                  <Label>API (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.browser_cache.api_max_age}
                    onChange={(e) => onUpdate('browser_cache', 'api_max_age', parseInt(e.target.value) || 0)}
                    min={0}
                    max={3600}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Service Worker</Label>
                    <p className="text-sm text-muted-foreground">Enable advanced caching strategies</p>
                  </div>
                  <Switch
                    checked={settings.browser_cache.service_worker_enabled}
                    onCheckedChange={(checked) => onUpdate('browser_cache', 'service_worker_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">Allow offline access to cached content</p>
                  </div>
                  <Switch
                    checked={settings.browser_cache.offline_mode_enabled}
                    onCheckedChange={(checked) => onUpdate('browser_cache', 'offline_mode_enabled', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Server Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Server Cache
          </CardTitle>
          <CardDescription>
            Configure server-side caching for API responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Server Cache</Label>
              <p className="text-sm text-muted-foreground">Cache frequently accessed data</p>
            </div>
            <Switch
              checked={settings.server_cache.enabled}
              onCheckedChange={(checked) => onUpdate('server_cache', 'enabled', checked)}
            />
          </div>

          {settings.server_cache.enabled && (
            <>
              <div>
                <Label>Cache Provider</Label>
                <Select
                  value={settings.server_cache.provider}
                  onValueChange={(value) => onUpdate('server_cache', 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="redis">Redis</SelectItem>
                    <SelectItem value="memcached">Memcached</SelectItem>
                    <SelectItem value="memory">In-Memory</SelectItem>
                    <SelectItem value="cloudflare">Cloudflare Workers KV</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>TTL (seconds)</Label>
                  <Input
                    type="number"
                    value={settings.server_cache.ttl_seconds}
                    onChange={(e) => onUpdate('server_cache', 'ttl_seconds', parseInt(e.target.value) || 0)}
                    min={0}
                    max={86400}
                  />
                </div>
                <div>
                  <Label>Max Size (MB)</Label>
                  <Input
                    type="number"
                    value={settings.server_cache.max_size_mb}
                    onChange={(e) => onUpdate('server_cache', 'max_size_mb', parseInt(e.target.value) || 0)}
                    min={1}
                    max={10240}
                  />
                </div>
              </div>

              <div>
                <Label>Eviction Policy</Label>
                <Select
                  value={settings.server_cache.eviction_policy}
                  onValueChange={(value) => onUpdate('server_cache', 'eviction_policy', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="lru">Least Recently Used (LRU)</SelectItem>
                    <SelectItem value="lfu">Least Frequently Used (LFU)</SelectItem>
                    <SelectItem value="fifo">First In First Out (FIFO)</SelectItem>
                    <SelectItem value="random">Random</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Warm Cache on Start</Label>
                  <p className="text-sm text-muted-foreground">Pre-populate cache with common queries</p>
                </div>
                <Switch
                  checked={settings.server_cache.warm_cache_on_start}
                  onCheckedChange={(checked) => onUpdate('server_cache', 'warm_cache_on_start', checked)}
                />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Database Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Cache
          </CardTitle>
          <CardDescription>
            Optimize database query performance
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Database Cache</Label>
              <p className="text-sm text-muted-foreground">Cache query results</p>
            </div>
            <Switch
              checked={settings.database_cache.enabled}
              onCheckedChange={(checked) => onUpdate('database_cache', 'enabled', checked)}
            />
          </div>

          {settings.database_cache.enabled && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Query Cache</Label>
                  <p className="text-sm text-muted-foreground">Cache SELECT query results</p>
                </div>
                <Switch
                  checked={settings.database_cache.query_cache_enabled}
                  onCheckedChange={(checked) => onUpdate('database_cache', 'query_cache_enabled', checked)}
                />
              </div>

              {settings.database_cache.query_cache_enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cache Size (MB)</Label>
                      <Input
                        type="number"
                        value={settings.database_cache.query_cache_size_mb}
                        onChange={(e) => onUpdate('database_cache', 'query_cache_size_mb', parseInt(e.target.value) || 0)}
                        min={1}
                        max={1024}
                      />
                    </div>
                    <div>
                      <Label>Result TTL (seconds)</Label>
                      <Input
                        type="number"
                        value={settings.database_cache.result_cache_ttl}
                        onChange={(e) => onUpdate('database_cache', 'result_cache_ttl', parseInt(e.target.value) || 0)}
                        min={0}
                        max={3600}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Cached Queries</Label>
                    <div className="space-y-2 mt-2">
                      <div className="flex flex-wrap gap-2">
                        {settings.database_cache.cached_queries.map((query, index) => (
                          <Badge key={index} variant="secondary" className="font-mono text-xs">
                            {query}
                            <button
                              onClick={() => removeCachedQuery(index)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          value={newQuery}
                          onChange={(e) => setNewQuery(e.target.value)}
                          placeholder="SELECT * FROM articles WHERE..."
                          className="font-mono text-sm"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              addCachedQuery()
                            }
                          }}
                        />
                        <Button size="icon" onClick={addCachedQuery}>
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* CDN Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            CDN Configuration
          </CardTitle>
          <CardDescription>
            Content delivery network settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable CDN</Label>
              <p className="text-sm text-muted-foreground">Serve assets from edge locations</p>
            </div>
            <Switch
              checked={settings.cdn.enabled}
              onCheckedChange={(checked) => onUpdate('cdn', 'enabled', checked)}
            />
          </div>

          {settings.cdn.enabled && (
            <>
              <div>
                <Label>CDN Provider</Label>
                <Select
                  value={settings.cdn.provider}
                  onValueChange={(value) => onUpdate('cdn', 'provider', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cloudflare">Cloudflare</SelectItem>
                    <SelectItem value="fastly">Fastly</SelectItem>
                    <SelectItem value="aws">AWS CloudFront</SelectItem>
                    <SelectItem value="custom">Custom CDN</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Purge on Deploy</Label>
                    <p className="text-sm text-muted-foreground">Clear CDN cache on deployment</p>
                  </div>
                  <Switch
                    checked={settings.cdn.purge_on_deploy}
                    onCheckedChange={(checked) => onUpdate('cdn', 'purge_on_deploy', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Image Optimization</Label>
                    <p className="text-sm text-muted-foreground">Automatically optimize images</p>
                  </div>
                  <Switch
                    checked={settings.cdn.image_optimization}
                    onCheckedChange={(checked) => onUpdate('cdn', 'image_optimization', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto WebP</Label>
                    <p className="text-sm text-muted-foreground">Convert images to WebP format</p>
                  </div>
                  <Switch
                    checked={settings.cdn.auto_webp}
                    onCheckedChange={(checked) => onUpdate('cdn', 'auto_webp', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Lazy Loading</Label>
                    <p className="text-sm text-muted-foreground">Load images only when visible</p>
                  </div>
                  <Switch
                    checked={settings.cdn.lazy_loading}
                    onCheckedChange={(checked) => onUpdate('cdn', 'lazy_loading', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Web Search Cache */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Web Search Cache
          </CardTitle>
          <CardDescription>
            Cache external API search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Web Search Cache</Label>
              <p className="text-sm text-muted-foreground">Cache Perplexity and Exa API results</p>
            </div>
            <Switch
              checked={settings.web_search_cache.enabled}
              onCheckedChange={(checked) => onUpdate('web_search_cache', 'enabled', checked)}
            />
          </div>

          {settings.web_search_cache.enabled && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Caching search results reduces API costs and improves response times for repeated searches.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Cache TTL (hours)</Label>
                  <Input
                    type="number"
                    value={settings.web_search_cache.ttl_hours}
                    onChange={(e) => onUpdate('web_search_cache', 'ttl_hours', parseInt(e.target.value) || 24)}
                    min={1}
                    max={168}
                  />
                </div>
                <div>
                  <Label>Max Entries</Label>
                  <Input
                    type="number"
                    value={settings.web_search_cache.max_entries}
                    onChange={(e) => onUpdate('web_search_cache', 'max_entries', parseInt(e.target.value) || 1000)}
                    min={100}
                    max={10000}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Perplexity Results</Label>
                    <p className="text-sm text-muted-foreground">Store real-time search results</p>
                  </div>
                  <Switch
                    checked={settings.web_search_cache.cache_perplexity}
                    onCheckedChange={(checked) => onUpdate('web_search_cache', 'cache_perplexity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Exa Results</Label>
                    <p className="text-sm text-muted-foreground">Store semantic search results</p>
                  </div>
                  <Switch
                    checked={settings.web_search_cache.cache_exa}
                    onCheckedChange={(checked) => onUpdate('web_search_cache', 'cache_exa', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Performance Optimization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Performance Optimization
          </CardTitle>
          <CardDescription>
            Advanced performance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label>Minify Assets</Label>
                <p className="text-sm text-muted-foreground">Compress JS, CSS, and HTML</p>
              </div>
              <Switch
                checked={settings.performance.minify_assets}
                onCheckedChange={(checked) => onUpdate('performance', 'minify_assets', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Compress Responses</Label>
                <p className="text-sm text-muted-foreground">Enable gzip/brotli compression</p>
              </div>
              <Switch
                checked={settings.performance.compress_responses}
                onCheckedChange={(checked) => onUpdate('performance', 'compress_responses', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Bundle Splitting</Label>
                <p className="text-sm text-muted-foreground">Split code into smaller chunks</p>
              </div>
              <Switch
                checked={settings.performance.bundle_splitting}
                onCheckedChange={(checked) => onUpdate('performance', 'bundle_splitting', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Preload Critical Assets</Label>
                <p className="text-sm text-muted-foreground">Load important resources early</p>
              </div>
              <Switch
                checked={settings.performance.preload_critical_assets}
                onCheckedChange={(checked) => onUpdate('performance', 'preload_critical_assets', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Prefetch Links</Label>
                <p className="text-sm text-muted-foreground">Preload linked pages on hover</p>
              </div>
              <Switch
                checked={settings.performance.prefetch_links}
                onCheckedChange={(checked) => onUpdate('performance', 'prefetch_links', checked)}
              />
            </div>
          </div>

          <div>
            <Label>Resource Hints</Label>
            <div className="space-y-2 mt-2">
              <div className="flex flex-wrap gap-2">
                {settings.performance.resource_hints.map((hint, index) => {
                  const [type, url] = hint.split(':')
                  return (
                    <Badge key={index} variant="secondary" className="text-xs">
                      <span className="font-medium">{type}:</span> {url}
                      <button
                        onClick={() => removeResourceHint(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
              <div className="flex gap-2">
                <Select
                  value={newResourceHint.type}
                  onValueChange={(value) => setNewResourceHint({ ...newResourceHint, type: value })}
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dns-prefetch">DNS Prefetch</SelectItem>
                    <SelectItem value="preconnect">Preconnect</SelectItem>
                    <SelectItem value="prefetch">Prefetch</SelectItem>
                    <SelectItem value="preload">Preload</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={newResourceHint.url}
                  onChange={(e) => setNewResourceHint({ ...newResourceHint, url: e.target.value })}
                  placeholder="https://example.com"
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addResourceHint()
                    }
                  }}
                />
                <Button size="icon" onClick={addResourceHint}>
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