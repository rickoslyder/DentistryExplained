'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Code, FileText, Eye } from 'lucide-react'
import { sanitizeEmailTemplate, sanitizePlainText } from '@/lib/sanitization'

interface EmailTemplate {
  subject: string
  body_html: string
  body_text?: string
}

interface EmailTemplateEditorProps {
  template: EmailTemplate
  onChange: (template: EmailTemplate) => void
}

export function EmailTemplateEditor({ template, onChange }: EmailTemplateEditorProps) {
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')

  const commonVariables = [
    { name: 'userName', description: 'User\'s display name' },
    { name: 'userEmail', description: 'User\'s email address' },
    { name: 'professionalName', description: 'Professional\'s name' },
    { name: 'gdcNumber', description: 'GDC registration number' },
    { name: 'articleTitle', description: 'Article title' },
    { name: 'articleUrl', description: 'Article URL' },
    { name: 'articleCategory', description: 'Article category' }
  ]

  const insertVariable = (variable: string, field: 'subject' | 'body_html' | 'body_text') => {
    const insertion = `{{${variable}}}`
    if (field === 'subject') {
      onChange({ ...template, subject: template.subject + insertion })
    } else if (field === 'body_html') {
      onChange({ ...template, body_html: template.body_html + insertion })
    } else if (field === 'body_text') {
      onChange({ ...template, body_text: (template.body_text || '') + insertion })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Email Content</CardTitle>
        <CardDescription>Edit the email subject and body content</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Subject */}
        <div className="space-y-2 mb-6">
          <Label htmlFor="subject">Subject Line</Label>
          <div className="flex gap-2">
            <Input
              id="subject"
              value={template.subject}
              onChange={(e) => onChange({ ...template, subject: e.target.value })}
              placeholder="Email subject..."
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => insertVariable('userName', 'subject')}
            >
              + Variable
            </Button>
          </div>
          <p className="text-sm text-gray-500">
            Use variables like {'{{userName}}'} to personalize the subject
          </p>
        </div>

        {/* Body Content */}
        <Tabs defaultValue="html">
          <TabsList className="mb-4">
            <TabsTrigger value="html">
              <Code className="w-4 h-4 mr-2" />
              HTML
            </TabsTrigger>
            <TabsTrigger value="text">
              <FileText className="w-4 h-4 mr-2" />
              Plain Text
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="html" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-sm text-gray-500">Quick insert:</span>
              {commonVariables.map(variable => (
                <Badge
                  key={variable.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => insertVariable(variable.name, 'body_html')}
                >
                  {variable.name}
                </Badge>
              ))}
            </div>
            <Textarea
              value={template.body_html}
              onChange={(e) => onChange({ ...template, body_html: e.target.value })}
              placeholder="HTML email content..."
              rows={15}
              className="font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="text" className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="text-sm text-gray-500">Quick insert:</span>
              {commonVariables.map(variable => (
                <Badge
                  key={variable.name}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => insertVariable(variable.name, 'body_text')}
                >
                  {variable.name}
                </Badge>
              ))}
            </div>
            <Textarea
              value={template.body_text || ''}
              onChange={(e) => onChange({ ...template, body_text: e.target.value })}
              placeholder="Plain text email content (optional - will be auto-generated from HTML if not provided)..."
              rows={15}
              className="font-mono text-sm"
            />
          </TabsContent>

          <TabsContent value="preview">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Preview with sample data</span>
                <div className="flex gap-2">
                  <Button
                    variant={previewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('desktop')}
                  >
                    Desktop
                  </Button>
                  <Button
                    variant={previewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('mobile')}
                  >
                    Mobile
                  </Button>
                </div>
              </div>
              
              <div 
                className={`border rounded-lg p-4 bg-white ${
                  previewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}
              >
                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-500">Subject:</p>
                  <p className="font-medium">
                    {template.subject.replace(/{{(\w+)}}/g, (match, key) => {
                      const sampleData: Record<string, string> = {
                        userName: 'John Doe',
                        userEmail: 'john.doe@example.com',
                        professionalName: 'Dr. Sarah Smith',
                        gdcNumber: '123456'
                      }
                      return sampleData[key] || match
                    })}
                  </p>
                </div>
                <div 
                  dangerouslySetInnerHTML={{
                    __html: template.body_html.replace(/{{(\w+)}}/g, (match, key) => {
                      const sampleData: Record<string, string> = {
                        userName: 'John Doe',
                        userEmail: 'john.doe@example.com',
                        professionalName: 'Dr. Sarah Smith',
                        gdcNumber: '123456',
                        articleTitle: 'Understanding Tooth Decay',
                        articleUrl: 'https://dentistry-explained.com/articles/tooth-decay',
                        articleCategory: 'Dental Problems'
                      }
                      return sampleData[key] || match
                    })
                  }}
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}