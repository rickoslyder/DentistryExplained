'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Send, Smartphone, Monitor } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/hooks/use-toast'

interface PreviewData {
  subject: string
  body_html: string
  body_text: string
  variables_used: string[]
}

export default function EmailTemplatePreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [variables, setVariables] = useState<Record<string, string>>({})
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const [templateId, setTemplateId] = useState<string | null>(null)

  useEffect(() => {
    params.then(p => setTemplateId(p.id))
  }, [params])

  useEffect(() => {
    if (templateId) {
      fetchPreview()
    }
  }, [templateId, variables])

  const fetchPreview = async () => {
    if (!templateId) return
    
    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variables })
      })

      if (!response.ok) throw new Error('Failed to fetch preview')
      
      const data = await response.json()
      setPreview(data.preview)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load preview',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail) {
      toast({
        title: 'Error',
        description: 'Please enter an email address',
        variant: 'destructive'
      })
      return
    }

    setSendingTest(true)
    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: testEmail, variables })
      })

      if (!response.ok) throw new Error('Failed to send test email')

      toast({
        title: 'Success',
        description: `Test email sent to ${testEmail}`
      })
      setTestEmail('')
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test email',
        variant: 'destructive'
      })
    } finally {
      setSendingTest(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Button
        variant="ghost"
        onClick={() => router.push(`/admin/email-templates/${templateId}`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Editor
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Variables Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Test Variables</CardTitle>
              <CardDescription>Customize preview data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {preview?.variables_used.map(varName => (
                <div key={varName} className="space-y-2">
                  <Label htmlFor={varName}>{varName}</Label>
                  <Input
                    id={varName}
                    value={variables[varName] || ''}
                    onChange={(e) => setVariables({ ...variables, [varName]: e.target.value })}
                    placeholder={`Enter ${varName}...`}
                  />
                </div>
              ))}
              
              <div className="pt-4 border-t space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Send Test To</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="test@example.com"
                  />
                </div>
                <Button
                  onClick={handleSendTest}
                  disabled={sendingTest || !testEmail}
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendingTest ? 'Sending...' : 'Send Test Email'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Email Preview</CardTitle>
                  <CardDescription>See how your email will look</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'desktop' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('desktop')}
                  >
                    <Monitor className="w-4 h-4 mr-2" />
                    Desktop
                  </Button>
                  <Button
                    variant={viewMode === 'mobile' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('mobile')}
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Mobile
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className={`border rounded-lg overflow-hidden ${
                  viewMode === 'mobile' ? 'max-w-sm mx-auto' : ''
                }`}
              >
                {/* Email Header */}
                <div className="bg-gray-50 p-4 border-b">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">From:</span>
                      <span className="text-sm">Dentistry Explained</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-600">To:</span>
                      <span className="text-sm">{testEmail || 'recipient@example.com'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-gray-600">Subject:</span>
                      <span className="text-sm font-medium flex-1">{preview?.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Email Body */}
                <div className="bg-white">
                  <div 
                    className="p-6"
                    dangerouslySetInnerHTML={{ __html: preview?.body_html || '' }}
                  />
                </div>
              </div>

              {/* Plain Text Version */}
              {preview?.body_text && (
                <div className="mt-6">
                  <h3 className="font-medium mb-2">Plain Text Version</h3>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {preview.body_text}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}