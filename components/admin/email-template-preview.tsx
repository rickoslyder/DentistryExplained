'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Send, Eye } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplatePreviewProps {
  templateId: string
  templateName: string
}

export function EmailTemplatePreview({ templateId, templateName }: EmailTemplatePreviewProps) {
  const [previewLoading, setPreviewLoading] = useState(false)
  const [testEmail, setTestEmail] = useState('')
  const [sendingTest, setSendingTest] = useState(false)
  const { toast } = useToast()

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
        body: JSON.stringify({ to: testEmail })
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

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => window.open(`/admin/email-templates/${templateId}/preview`, '_blank')}
      >
        <Eye className="w-4 h-4 mr-2" />
        Preview
      </Button>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">
            <Send className="w-4 h-4 mr-2" />
            Send Test
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test version of "{templateName}" to an email address
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
              />
            </div>
            <Button
              onClick={handleSendTest}
              disabled={sendingTest || !testEmail}
              className="w-full"
            >
              {sendingTest ? 'Sending...' : 'Send Test Email'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}