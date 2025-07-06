'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  Save, 
  ArrowLeft,
  Eye,
  Send,
  Code,
  FileText,
  Clock,
  Variable
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { EmailTemplateEditor } from '@/components/admin/email-template-editor'
import { EmailTemplatePreview } from '@/components/admin/email-template-preview'
import { EmailTemplateVariables } from '@/components/admin/email-template-variables'
import { EmailTemplateHistory } from '@/components/admin/email-template-history'
import { sanitizeEmailTemplate, sanitizePlainText } from '@/lib/sanitization'

interface EmailTemplate {
  id: string
  name: string
  description?: string
  template_type: string
  subject: string
  body_html: string
  body_text?: string
  variables?: any[]
  is_active: boolean
  created_at: string
  updated_at: string
}

interface EmailTemplateVersion {
  id: string
  version_number: number
  subject: string
  body_html: string
  body_text?: string
  variables?: any[]
  change_notes?: string
  created_at: string
}

const templateTypeOptions = [
  { value: 'welcome', label: 'Welcome' },
  { value: 'email_verification', label: 'Email Verification' },
  { value: 'password_reset', label: 'Password Reset' },
  { value: 'professional_approved', label: 'Professional Approved' },
  { value: 'professional_rejected', label: 'Professional Rejected' },
  { value: 'article_published', label: 'Article Published' },
  { value: 'appointment_reminder', label: 'Appointment Reminder' },
  { value: 'newsletter', label: 'Newsletter' },
  { value: 'custom', label: 'Custom' }
]

export default function EmailTemplateEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [versions, setVersions] = useState<EmailTemplateVersion[]>([])
  const [activeTab, setActiveTab] = useState('editor')
  const [changeNotes, setChangeNotes] = useState('')

  const isNew = params.id === 'new'

  useEffect(() => {
    if (!isNew) {
      fetchTemplate()
    } else {
      // Initialize new template
      setTemplate({
        id: '',
        name: '',
        description: '',
        template_type: 'custom',
        subject: '',
        body_html: '',
        body_text: '',
        variables: [],
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      setLoading(false)
    }
  }, [params.id])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/admin/email-templates/${params.id}`)
      if (!response.ok) throw new Error('Failed to fetch template')
      
      const data = await response.json()
      setTemplate(data.template)
      setVersions(data.versions || [])
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load email template',
        variant: 'destructive'
      })
      router.push('/admin/email-templates')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!template) return
    
    setSaving(true)
    try {
      const url = isNew 
        ? '/api/admin/email-templates'
        : `/api/admin/email-templates/${params.id}`
      
      // Sanitize template content before saving
      const sanitizedTemplate = {
        ...template,
        name: sanitizePlainText(template.name),
        description: template.description ? sanitizePlainText(template.description) : undefined,
        subject: sanitizePlainText(template.subject),
        body_html: sanitizeEmailTemplate(template.body_html),
        body_text: template.body_text ? sanitizePlainText(template.body_text) : undefined,
      }
      
      const response = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...sanitizedTemplate,
          change_notes: changeNotes ? sanitizePlainText(changeNotes) : undefined
        })
      })

      if (!response.ok) throw new Error('Failed to save template')

      toast({
        title: 'Success',
        description: `Email template ${isNew ? 'created' : 'updated'} successfully`
      })

      if (isNew) {
        const data = await response.json()
        router.push(`/admin/email-templates/${data.template.id}`)
      } else {
        fetchTemplate()
        setChangeNotes('')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save email template',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!template) return null

  return (
    <div>
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push('/admin/email-templates')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Templates
        </Button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'New Email Template' : 'Edit Email Template'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isNew ? 'Create a new email template' : 'Modify email template settings and content'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && (
              <>
                <Button variant="outline" asChild>
                  <a href={`/admin/email-templates/${params.id}/preview`} target="_blank">
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={`/admin/email-templates/${params.id}/test`} target="_blank">
                    <Send className="w-4 h-4 mr-2" />
                    Send Test
                  </a>
                </Button>
              </>
            )}
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Saving...' : 'Save Template'}
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="editor">
            <FileText className="w-4 h-4 mr-2" />
            Editor
          </TabsTrigger>
          <TabsTrigger value="variables">
            <Variable className="w-4 h-4 mr-2" />
            Variables
          </TabsTrigger>
          {!isNew && (
            <TabsTrigger value="history">
              <Clock className="w-4 h-4 mr-2" />
              History
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="editor">
          <div className="grid gap-6">
            {/* Template Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Template Settings</CardTitle>
                <CardDescription>Basic template configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name</Label>
                    <Input
                      id="name"
                      value={template.name}
                      onChange={(e) => setTemplate({ ...template, name: e.target.value })}
                      placeholder="e.g., Welcome Email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Template Type</Label>
                    <Select
                      value={template.template_type}
                      onValueChange={(value) => setTemplate({ ...template, template_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateTypeOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={template.description || ''}
                    onChange={(e) => setTemplate({ ...template, description: e.target.value })}
                    placeholder="Brief description of when this template is used"
                    rows={2}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={template.is_active}
                    onCheckedChange={(checked) => setTemplate({ ...template, is_active: checked })}
                  />
                  <Label htmlFor="active">Template is active</Label>
                </div>
              </CardContent>
            </Card>

            {/* Email Content */}
            <EmailTemplateEditor
              template={template}
              onChange={setTemplate}
            />

            {/* Change Notes */}
            {!isNew && (
              <Card>
                <CardHeader>
                  <CardTitle>Change Notes</CardTitle>
                  <CardDescription>Optional notes about this update</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="Describe what changed in this version..."
                    rows={3}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="variables">
          <EmailTemplateVariables
            variables={template.variables || []}
            onChange={(variables) => setTemplate({ ...template, variables })}
            templateContent={template.body_html + template.subject}
          />
        </TabsContent>

        {!isNew && (
          <TabsContent value="history">
            <EmailTemplateHistory
              versions={versions}
              currentTemplate={template}
              onRestore={(version) => {
                setTemplate({
                  ...template,
                  subject: version.subject,
                  body_html: version.body_html,
                  body_text: version.body_text || '',
                  variables: version.variables || []
                })
                setActiveTab('editor')
                toast({
                  title: 'Version restored',
                  description: 'Template content has been restored from the selected version'
                })
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}