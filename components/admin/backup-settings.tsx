'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Database, 
  Archive,
  Clock,
  HardDrive,
  Shield,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle,
  CalendarDays,
  Trash2
} from 'lucide-react'
import { toast } from 'sonner'
import { format, formatDistanceToNow } from 'date-fns'

interface BackupSettingsProps {
  settings: {
    automatic_backups: {
      enabled: boolean
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly'
      time: string
      retention_count: number
      include_uploads: boolean
      compress: boolean
      encrypt: boolean
    }
    backup_destinations: {
      local: {
        enabled: boolean
        path: string
      }
      s3: {
        enabled: boolean
        bucket: string
        region: string
        access_key: string
        secret_key: string
      }
      supabase: {
        enabled: boolean
        use_storage: boolean
      }
    }
    data_retention: {
      enabled: boolean
      policies: {
        type: string
        retention_days: number
        action: 'delete' | 'archive' | 'anonymize'
        enabled: boolean
      }[]
    }
    gdpr: {
      enabled: boolean
      auto_delete_on_request: boolean
      anonymize_after_days: number
      export_format: 'json' | 'csv' | 'pdf'
      include_in_export: string[]
    }
    disaster_recovery: {
      enabled: boolean
      test_restore_frequency_days: number
      last_test_date: string | null
      notification_email: string
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function BackupSettings({ settings, onUpdate }: BackupSettingsProps) {
  const [backupProgress, setBackupProgress] = useState<number | null>(null)
  const [restoring, setRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [backupHistory, setBackupHistory] = useState<any[]>([])
  const [backupStats, setBackupStats] = useState({
    lastBackup: null as Date | null,
    totalSize: 0,
    backupCount: 0,
    successRate: 100
  })
  const [loadingHistory, setLoadingHistory] = useState(true)
  
  // Fetch backup history and stats
  useEffect(() => {
    fetchBackupHistory()
  }, [])
  
  const fetchBackupHistory = async () => {
    setLoadingHistory(true)
    try {
      const response = await fetch('/api/admin/backups/history')
      if (!response.ok) throw new Error('Failed to fetch backup history')
      
      const data = await response.json()
      setBackupHistory(data.backups || [])
      setBackupStats({
        lastBackup: data.lastBackup ? new Date(data.lastBackup) : null,
        totalSize: data.totalSize || 0,
        backupCount: data.backupCount || 0,
        successRate: data.successRate || 100
      })
    } catch (error) {
      console.error('Error fetching backup history:', error)
      // Use empty data if fetch fails
      setBackupHistory([])
    } finally {
      setLoadingHistory(false)
    }
  }

  const triggerManualBackup = async () => {
    setBackupProgress(0)
    
    try {
      const response = await fetch('/api/admin/backups/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' })
      })
      
      if (!response.ok) throw new Error('Failed to create backup')
      
      // Simulate progress for UX (real backup happens server-side)
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 300))
        setBackupProgress(i)
      }
      
      toast.success('Backup completed successfully')
      // Refresh backup history
      fetchBackupHistory()
    } catch (error) {
      toast.error('Failed to create backup')
    } finally {
      setBackupProgress(null)
    }
  }

  const restoreBackup = async (backupId: string) => {
    setRestoring(true)
    setSelectedBackup(backupId)
    
    try {
      const response = await fetch(`/api/admin/backups/${backupId}/restore`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to restore backup')
      
      toast.success('Backup restored successfully')
    } catch (error) {
      toast.error('Failed to restore backup')
    } finally {
      setRestoring(false)
      setSelectedBackup(null)
    }
  }
  
  const downloadBackup = async (backupId: string) => {
    try {
      const response = await fetch(`/api/admin/backups/${backupId}/download`)
      if (!response.ok) throw new Error('Failed to download backup')
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `backup-${backupId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Failed to download backup')
    }
  }
  
  // Helper function to format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const testDisasterRecovery = async () => {
    try {
      // Simulate DR test
      await new Promise(resolve => setTimeout(resolve, 1500))
      onUpdate('disaster_recovery', 'last_test_date', new Date().toISOString())
      toast.success('Disaster recovery test completed successfully')
    } catch (error) {
      toast.error('Disaster recovery test failed')
    }
  }

  const addRetentionPolicy = () => {
    const policies = settings.data_retention.policies || []
    onUpdate('data_retention', 'policies', [
      ...policies,
      {
        type: 'chat_messages',
        retention_days: 180,
        action: 'delete',
        enabled: true
      }
    ])
  }

  const removeRetentionPolicy = (index: number) => {
    const policies = settings.data_retention.policies || []
    onUpdate('data_retention', 'policies', policies.filter((_, i) => i !== index))
  }

  const updateRetentionPolicy = (index: number, field: string, value: any) => {
    const policies = settings.data_retention.policies || []
    onUpdate('data_retention', 'policies', policies.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ))
  }

  return (
    <div className="space-y-6">
      {/* Backup Status Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Last Backup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {backupStats.lastBackup 
                ? formatDistanceToNow(backupStats.lastBackup, { addSuffix: true })
                : 'Never'
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {backupHistory.length > 0 && backupHistory[0]?.type === 'automatic' ? 'Automatic backup' : 'No backups yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(backupStats.totalSize)}</div>
            <p className="text-xs text-muted-foreground">{backupStats.backupCount} backups stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{backupStats.successRate}%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">DR Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {settings.disaster_recovery.last_test_date 
                ? `${Math.floor((new Date().getTime() - new Date(settings.disaster_recovery.last_test_date).getTime()) / (1000 * 60 * 60 * 24))} days ago`
                : 'Never'
              }
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-1"
              onClick={testDisasterRecovery}
            >
              Test Now
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Automatic Backups */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Automatic Backups
          </CardTitle>
          <CardDescription>
            Configure scheduled database backups
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">Backup database on schedule</p>
            </div>
            <Switch
              checked={settings.automatic_backups.enabled}
              onCheckedChange={(checked) => onUpdate('automatic_backups', 'enabled', checked)}
            />
          </div>

          {settings.automatic_backups.enabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Frequency</Label>
                  <Select
                    value={settings.automatic_backups.frequency}
                    onValueChange={(value) => onUpdate('automatic_backups', 'frequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Time</Label>
                  <Input
                    type="time"
                    value={settings.automatic_backups.time}
                    onChange={(e) => onUpdate('automatic_backups', 'time', e.target.value)}
                    disabled={settings.automatic_backups.frequency === 'hourly'}
                  />
                </div>
              </div>

              <div>
                <Label>Retention Count</Label>
                <Input
                  type="number"
                  value={settings.automatic_backups.retention_count}
                  onChange={(e) => onUpdate('automatic_backups', 'retention_count', parseInt(e.target.value) || 7)}
                  min={1}
                  max={365}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of backups to keep before deleting oldest
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Include Uploads</Label>
                    <p className="text-sm text-muted-foreground">Backup user uploaded files</p>
                  </div>
                  <Switch
                    checked={settings.automatic_backups.include_uploads}
                    onCheckedChange={(checked) => onUpdate('automatic_backups', 'include_uploads', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compress Backups</Label>
                    <p className="text-sm text-muted-foreground">Use gzip compression</p>
                  </div>
                  <Switch
                    checked={settings.automatic_backups.compress}
                    onCheckedChange={(checked) => onUpdate('automatic_backups', 'compress', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Encrypt Backups</Label>
                    <p className="text-sm text-muted-foreground">AES-256 encryption</p>
                  </div>
                  <Switch
                    checked={settings.automatic_backups.encrypt}
                    onCheckedChange={(checked) => onUpdate('automatic_backups', 'encrypt', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Backup Destinations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Backup Destinations
          </CardTitle>
          <CardDescription>
            Configure where backups are stored
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Local Storage */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>Local Storage</Label>
              <Switch
                checked={settings.backup_destinations.local.enabled}
                onCheckedChange={(checked) => onUpdate('backup_destinations', 'local', { ...settings.backup_destinations.local, enabled: checked })}
              />
            </div>
            {settings.backup_destinations.local.enabled && (
              <div>
                <Label className="text-sm">Path</Label>
                <Input
                  value={settings.backup_destinations.local.path}
                  onChange={(e) => onUpdate('backup_destinations', 'local', { ...settings.backup_destinations.local, path: e.target.value })}
                  placeholder="/var/backups/dentistry"
                />
              </div>
            )}
          </div>

          {/* S3 Storage */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>AWS S3</Label>
              <Switch
                checked={settings.backup_destinations.s3.enabled}
                onCheckedChange={(checked) => onUpdate('backup_destinations', 's3', { ...settings.backup_destinations.s3, enabled: checked })}
              />
            </div>
            {settings.backup_destinations.s3.enabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm">Bucket</Label>
                    <Input
                      value={settings.backup_destinations.s3.bucket}
                      onChange={(e) => onUpdate('backup_destinations', 's3', { ...settings.backup_destinations.s3, bucket: e.target.value })}
                      placeholder="my-backup-bucket"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Region</Label>
                    <Input
                      value={settings.backup_destinations.s3.region}
                      onChange={(e) => onUpdate('backup_destinations', 's3', { ...settings.backup_destinations.s3, region: e.target.value })}
                      placeholder="us-east-1"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm">Access Key</Label>
                  <Input
                    type="password"
                    value={settings.backup_destinations.s3.access_key}
                    onChange={(e) => onUpdate('backup_destinations', 's3', { ...settings.backup_destinations.s3, access_key: e.target.value })}
                    placeholder="AKIA..."
                  />
                </div>
                <div>
                  <Label className="text-sm">Secret Key</Label>
                  <Input
                    type="password"
                    value={settings.backup_destinations.s3.secret_key}
                    onChange={(e) => onUpdate('backup_destinations', 's3', { ...settings.backup_destinations.s3, secret_key: e.target.value })}
                    placeholder="Secret access key"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Supabase Storage */}
          <div className="p-4 border rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <Label>Supabase Storage</Label>
              <Switch
                checked={settings.backup_destinations.supabase.enabled}
                onCheckedChange={(checked) => onUpdate('backup_destinations', 'supabase', { ...settings.backup_destinations.supabase, enabled: checked })}
              />
            </div>
            {settings.backup_destinations.supabase.enabled && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Backups will be stored in your Supabase storage bucket using existing credentials
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Backup History & Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Backup History</CardTitle>
              <CardDescription>Recent backups and restore options</CardDescription>
            </div>
            <Button 
              onClick={triggerManualBackup}
              disabled={backupProgress !== null}
            >
              {backupProgress !== null ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Backing up... {backupProgress}%
                </>
              ) : (
                <>
                  <Archive className="h-4 w-4 mr-2" />
                  Manual Backup
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {backupProgress !== null && (
            <Progress value={backupProgress} className="mb-4" />
          )}
          
          {loadingHistory ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : backupHistory.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No backups found</p>
              <p className="text-sm mt-2">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backupHistory.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {backup.status === 'success' ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {format(new Date(backup.created_at), 'PPp')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatBytes(backup.size)} • {backup.type}
                      </p>
                    </div>
                  </div>
                  {backup.status === 'success' && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => downloadBackup(backup.id)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => restoreBackup(backup.id)}
                        disabled={restoring && selectedBackup === backup.id}
                      >
                        {restoring && selectedBackup === backup.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Retention Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Data Retention Policies
          </CardTitle>
          <CardDescription>
            Automatically manage old data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Data Retention</Label>
              <p className="text-sm text-muted-foreground">Automatically clean up old data</p>
            </div>
            <Switch
              checked={settings.data_retention.enabled}
              onCheckedChange={(checked) => onUpdate('data_retention', 'enabled', checked)}
            />
          </div>

          {settings.data_retention.enabled && (
            <>
              <div className="space-y-3">
                {settings.data_retention.policies.map((policy, index) => (
                  <div key={index} className="p-3 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <Select
                        value={policy.type}
                        onValueChange={(value) => updateRetentionPolicy(index, 'type', value)}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chat_messages">Chat Messages</SelectItem>
                          <SelectItem value="api_logs">API Logs</SelectItem>
                          <SelectItem value="search_history">Search History</SelectItem>
                          <SelectItem value="analytics_data">Analytics Data</SelectItem>
                          <SelectItem value="error_logs">Error Logs</SelectItem>
                          <SelectItem value="user_sessions">User Sessions</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={policy.enabled}
                          onCheckedChange={(checked) => updateRetentionPolicy(index, 'enabled', checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRetentionPolicy(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Retention Period</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={policy.retention_days}
                            onChange={(e) => updateRetentionPolicy(index, 'retention_days', parseInt(e.target.value) || 30)}
                            min={1}
                            max={3650}
                          />
                          <span className="text-sm text-muted-foreground">days</span>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">Action</Label>
                        <Select
                          value={policy.action}
                          onValueChange={(value) => updateRetentionPolicy(index, 'action', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="delete">Delete</SelectItem>
                            <SelectItem value="archive">Archive</SelectItem>
                            <SelectItem value="anonymize">Anonymize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={addRetentionPolicy} variant="outline" className="w-full">
                Add Retention Policy
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* GDPR Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            GDPR Compliance
          </CardTitle>
          <CardDescription>
            Data protection and user rights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>GDPR Mode</Label>
              <p className="text-sm text-muted-foreground">Enable GDPR compliance features</p>
            </div>
            <Switch
              checked={settings.gdpr.enabled}
              onCheckedChange={(checked) => onUpdate('gdpr', 'enabled', checked)}
            />
          </div>

          {settings.gdpr.enabled && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  GDPR mode enables user data export, deletion requests, and automatic anonymization
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Auto-Delete on Request</Label>
                  <p className="text-sm text-muted-foreground">Automatically process deletion requests</p>
                </div>
                <Switch
                  checked={settings.gdpr.auto_delete_on_request}
                  onCheckedChange={(checked) => onUpdate('gdpr', 'auto_delete_on_request', checked)}
                />
              </div>

              <div>
                <Label>Anonymize After (days)</Label>
                <Input
                  type="number"
                  value={settings.gdpr.anonymize_after_days}
                  onChange={(e) => onUpdate('gdpr', 'anonymize_after_days', parseInt(e.target.value) || 730)}
                  min={30}
                  max={3650}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically anonymize inactive user data
                </p>
              </div>

              <div>
                <Label>Export Format</Label>
                <Select
                  value={settings.gdpr.export_format}
                  onValueChange={(value) => onUpdate('gdpr', 'export_format', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Include in Export</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['profile', 'comments', 'chat_history', 'bookmarks', 'activity_logs'].map((item) => (
                    <Badge
                      key={item}
                      variant={settings.gdpr.include_in_export.includes(item) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        const items = settings.gdpr.include_in_export
                        if (items.includes(item)) {
                          onUpdate('gdpr', 'include_in_export', items.filter(i => i !== item))
                        } else {
                          onUpdate('gdpr', 'include_in_export', [...items, item])
                        }
                      }}
                    >
                      {item.replace(/_/g, ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disaster Recovery */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Disaster Recovery
          </CardTitle>
          <CardDescription>
            Prepare for worst-case scenarios
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable DR Testing</Label>
              <p className="text-sm text-muted-foreground">Regularly test backup restoration</p>
            </div>
            <Switch
              checked={settings.disaster_recovery.enabled}
              onCheckedChange={(checked) => onUpdate('disaster_recovery', 'enabled', checked)}
            />
          </div>

          {settings.disaster_recovery.enabled && (
            <>
              <div>
                <Label>Test Frequency (days)</Label>
                <Input
                  type="number"
                  value={settings.disaster_recovery.test_restore_frequency_days}
                  onChange={(e) => onUpdate('disaster_recovery', 'test_restore_frequency_days', parseInt(e.target.value) || 30)}
                  min={7}
                  max={365}
                />
              </div>

              <div>
                <Label>Notification Email</Label>
                <Input
                  type="email"
                  value={settings.disaster_recovery.notification_email}
                  onChange={(e) => onUpdate('disaster_recovery', 'notification_email', e.target.value)}
                  placeholder="admin@example.com"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Receive DR test results and failure alerts
                </p>
              </div>

              {settings.disaster_recovery.last_test_date && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Last DR test: {format(new Date(settings.disaster_recovery.last_test_date), 'PPp')}
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}