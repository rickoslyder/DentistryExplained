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
  MessageSquare, 
  Shield,
  AlertTriangle,
  Filter,
  Bot,
  UserCheck,
  Plus,
  X,
  Info
} from 'lucide-react'

interface ContentModerationSettingsProps {
  settings: {
    comments: {
      enabled: boolean
      auto_approve_threshold: number
      require_approval_for_new_users: boolean
      new_user_comment_limit: number
      spam_detection_enabled: boolean
      profanity_filter_enabled: boolean
      max_length: number
      min_length: number
      allow_links: boolean
      moderation_queue_size_limit: number
    }
    banned_words: {
      enabled: boolean
      words: string[]
      action: 'block' | 'flag' | 'replace'
      replacement_character: string
    }
    user_reputation: {
      enabled: boolean
      auto_trust_threshold: number
      flag_threshold: number
      ban_threshold: number
      points_for_approved_comment: number
      points_for_flagged_comment: number
      points_for_helpful_vote: number
    }
    ai_moderation: {
      enabled: boolean
      toxicity_threshold: number
      spam_threshold: number
      use_for_auto_approval: boolean
      review_flagged_content: boolean
    }
    content_reporting: {
      enabled: boolean
      reasons: string[]
      auto_hide_threshold: number
      notify_moderators: boolean
      allow_anonymous_reports: boolean
    }
  }
  onUpdate: (section: string, field: string, value: any) => void
}

export function ContentModerationSettings({ settings, onUpdate }: ContentModerationSettingsProps) {
  const [newBannedWord, setNewBannedWord] = useState('')
  const [newReportReason, setNewReportReason] = useState('')

  const addToArray = (section: string, field: string, value: string) => {
    if (!value.trim()) return
    const current = settings[section as keyof typeof settings] as any
    const array = current[field] || []
    if (!array.includes(value.toLowerCase())) {
      onUpdate(section, field, [...array, value.toLowerCase()])
    }
  }

  const removeFromArray = (section: string, field: string, index: number) => {
    const current = settings[section as keyof typeof settings] as any
    const array = current[field] || []
    onUpdate(section, field, array.filter((_: any, i: number) => i !== index))
  }

  return (
    <div className="space-y-6">
      {/* Comment Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Comment Moderation
          </CardTitle>
          <CardDescription>
            Configure how comments are moderated and approved
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Comments</Label>
              <p className="text-sm text-muted-foreground">Allow users to post comments</p>
            </div>
            <Switch
              checked={settings.comments.enabled}
              onCheckedChange={(checked) => onUpdate('comments', 'enabled', checked)}
            />
          </div>

          {settings.comments.enabled && (
            <>
              <div>
                <Label>Auto-Approval Score Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.comments.auto_approve_threshold]}
                    onValueChange={([value]) => onUpdate('comments', 'auto_approve_threshold', value)}
                    min={0}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{settings.comments.auto_approve_threshold}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Comments with reputation score above this are auto-approved
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>Require Approval for New Users</Label>
                  <p className="text-sm text-muted-foreground">Manual review for first-time commenters</p>
                </div>
                <Switch
                  checked={settings.comments.require_approval_for_new_users}
                  onCheckedChange={(checked) => onUpdate('comments', 'require_approval_for_new_users', checked)}
                />
              </div>

              {settings.comments.require_approval_for_new_users && (
                <div>
                  <Label>New User Comment Limit</Label>
                  <Input
                    type="number"
                    value={settings.comments.new_user_comment_limit}
                    onChange={(e) => onUpdate('comments', 'new_user_comment_limit', parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Number of comments requiring approval for new users
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Minimum Length</Label>
                  <Input
                    type="number"
                    value={settings.comments.min_length}
                    onChange={(e) => onUpdate('comments', 'min_length', parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label>Maximum Length</Label>
                  <Input
                    type="number"
                    value={settings.comments.max_length}
                    onChange={(e) => onUpdate('comments', 'max_length', parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Spam Detection</Label>
                    <p className="text-sm text-muted-foreground">Automatically detect spam comments</p>
                  </div>
                  <Switch
                    checked={settings.comments.spam_detection_enabled}
                    onCheckedChange={(checked) => onUpdate('comments', 'spam_detection_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Profanity Filter</Label>
                    <p className="text-sm text-muted-foreground">Filter inappropriate language</p>
                  </div>
                  <Switch
                    checked={settings.comments.profanity_filter_enabled}
                    onCheckedChange={(checked) => onUpdate('comments', 'profanity_filter_enabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Allow Links</Label>
                    <p className="text-sm text-muted-foreground">Permit URLs in comments</p>
                  </div>
                  <Switch
                    checked={settings.comments.allow_links}
                    onCheckedChange={(checked) => onUpdate('comments', 'allow_links', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Banned Words */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Banned Words Filter
          </CardTitle>
          <CardDescription>
            Manage list of prohibited words and phrases
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Word Filter</Label>
              <p className="text-sm text-muted-foreground">Check content for banned words</p>
            </div>
            <Switch
              checked={settings.banned_words.enabled}
              onCheckedChange={(checked) => onUpdate('banned_words', 'enabled', checked)}
            />
          </div>

          {settings.banned_words.enabled && (
            <>
              <div>
                <Label>Filter Action</Label>
                <Select
                  value={settings.banned_words.action}
                  onValueChange={(value) => onUpdate('banned_words', 'action', value)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="block">Block submission</SelectItem>
                    <SelectItem value="flag">Flag for review</SelectItem>
                    <SelectItem value="replace">Replace with characters</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.banned_words.action === 'replace' && (
                <div>
                  <Label>Replacement Character</Label>
                  <Input
                    value={settings.banned_words.replacement_character}
                    onChange={(e) => onUpdate('banned_words', 'replacement_character', e.target.value.slice(0, 1))}
                    className="w-20"
                    maxLength={1}
                  />
                </div>
              )}

              <div>
                <Label>Banned Words</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {settings.banned_words.words.map((word, index) => (
                      <Badge key={index} variant="destructive">
                        {word}
                        <button
                          onClick={() => removeFromArray('banned_words', 'words', index)}
                          className="ml-1 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={newBannedWord}
                      onChange={(e) => setNewBannedWord(e.target.value)}
                      placeholder="Add banned word..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addToArray('banned_words', 'words', newBannedWord)
                          setNewBannedWord('')
                        }
                      }}
                    />
                    <Button
                      size="icon"
                      onClick={() => {
                        addToArray('banned_words', 'words', newBannedWord)
                        setNewBannedWord('')
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Reputation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            User Reputation System
          </CardTitle>
          <CardDescription>
            Track and manage user reputation scores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Reputation System</Label>
              <p className="text-sm text-muted-foreground">Track user behavior and trust levels</p>
            </div>
            <Switch
              checked={settings.user_reputation.enabled}
              onCheckedChange={(checked) => onUpdate('user_reputation', 'enabled', checked)}
            />
          </div>

          {settings.user_reputation.enabled && (
            <>
              <div className="space-y-3">
                <div>
                  <Label>Auto-Trust Threshold</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[settings.user_reputation.auto_trust_threshold]}
                      onValueChange={([value]) => onUpdate('user_reputation', 'auto_trust_threshold', value)}
                      min={0}
                      max={1000}
                      step={50}
                      className="flex-1"
                    />
                    <span className="w-16 text-sm font-medium">{settings.user_reputation.auto_trust_threshold}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Users above this score are automatically trusted
                  </p>
                </div>

                <div>
                  <Label>Flag Warning Threshold</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[settings.user_reputation.flag_threshold]}
                      onValueChange={([value]) => onUpdate('user_reputation', 'flag_threshold', value)}
                      min={-500}
                      max={0}
                      step={50}
                      className="flex-1"
                    />
                    <span className="w-16 text-sm font-medium">{settings.user_reputation.flag_threshold}</span>
                  </div>
                </div>

                <div>
                  <Label>Auto-Ban Threshold</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Slider
                      value={[settings.user_reputation.ban_threshold]}
                      onValueChange={([value]) => onUpdate('user_reputation', 'ban_threshold', value)}
                      min={-1000}
                      max={-100}
                      step={50}
                      className="flex-1"
                    />
                    <span className="w-16 text-sm font-medium">{settings.user_reputation.ban_threshold}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Reputation Points</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Approved Comment</Label>
                    <Input
                      type="number"
                      value={settings.user_reputation.points_for_approved_comment}
                      onChange={(e) => onUpdate('user_reputation', 'points_for_approved_comment', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Flagged Comment</Label>
                    <Input
                      type="number"
                      value={settings.user_reputation.points_for_flagged_comment}
                      onChange={(e) => onUpdate('user_reputation', 'points_for_flagged_comment', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Helpful Vote</Label>
                    <Input
                      type="number"
                      value={settings.user_reputation.points_for_helpful_vote}
                      onChange={(e) => onUpdate('user_reputation', 'points_for_helpful_vote', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* AI Moderation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            AI-Powered Moderation
          </CardTitle>
          <CardDescription>
            Use AI to automatically moderate content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable AI Moderation</Label>
              <p className="text-sm text-muted-foreground">Use AI to analyze content</p>
            </div>
            <Switch
              checked={settings.ai_moderation.enabled}
              onCheckedChange={(checked) => onUpdate('ai_moderation', 'enabled', checked)}
            />
          </div>

          {settings.ai_moderation.enabled && (
            <>
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  AI moderation uses machine learning to detect toxic content, spam, and other issues.
                  Results should be reviewed by human moderators for accuracy.
                </AlertDescription>
              </Alert>

              <div>
                <Label>Toxicity Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.ai_moderation.toxicity_threshold]}
                    onValueChange={([value]) => onUpdate('ai_moderation', 'toxicity_threshold', value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{settings.ai_moderation.toxicity_threshold}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Content above this score is flagged as toxic (0-1)
                </p>
              </div>

              <div>
                <Label>Spam Threshold</Label>
                <div className="flex items-center gap-4 mt-2">
                  <Slider
                    value={[settings.ai_moderation.spam_threshold]}
                    onValueChange={([value]) => onUpdate('ai_moderation', 'spam_threshold', value)}
                    min={0}
                    max={1}
                    step={0.05}
                    className="flex-1"
                  />
                  <span className="w-12 text-sm font-medium">{settings.ai_moderation.spam_threshold}</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use for Auto-Approval</Label>
                    <p className="text-sm text-muted-foreground">Auto-approve content passing AI checks</p>
                  </div>
                  <Switch
                    checked={settings.ai_moderation.use_for_auto_approval}
                    onCheckedChange={(checked) => onUpdate('ai_moderation', 'use_for_auto_approval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Review Flagged Content</Label>
                    <p className="text-sm text-muted-foreground">Send AI-flagged content for manual review</p>
                  </div>
                  <Switch
                    checked={settings.ai_moderation.review_flagged_content}
                    onCheckedChange={(checked) => onUpdate('ai_moderation', 'review_flagged_content', checked)}
                  />
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}