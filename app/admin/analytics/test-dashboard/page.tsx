'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  RefreshCw, 
  Send,
  Activity,
  BarChart3,
  Users,
  Search,
  MessageSquare,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

interface TestResult {
  name: string
  status: 'pending' | 'success' | 'error'
  message: string
  data?: any
}

export default function AnalyticsTestDashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(t => t.name === name)
      if (existing) {
        return prev.map(t => t.name === name ? { ...t, status, message, data } : t)
      }
      return [...prev, { name, status, message, data }]
    })
  }

  const runTests = async () => {
    setIsRunning(true)
    setTestResults([])

    // Test 1: GA4 API Configuration
    updateTest('GA4 API Configuration', 'pending', 'Checking GA4 API setup...')
    try {
      const ga4Response = await fetch('/api/analytics/ga4/test')
      const ga4Data = await ga4Response.json()
      
      if (ga4Data.configured) {
        updateTest('GA4 API Configuration', 'success', 'GA4 API is configured and working', ga4Data)
      } else {
        updateTest('GA4 API Configuration', 'error', ga4Data.message || 'GA4 API not configured', ga4Data)
      }
    } catch (error) {
      updateTest('GA4 API Configuration', 'error', 'Failed to test GA4 API')
    }

    // Test 2: Server Analytics Configuration
    updateTest('Server Analytics', 'pending', 'Checking server-side analytics...')
    try {
      const serverResponse = await fetch('/api/analytics/server/test')
      const serverData = await serverResponse.json()
      
      if (serverData.configured) {
        updateTest('Server Analytics', 'success', 'Server analytics configured and events sent', serverData)
      } else {
        updateTest('Server Analytics', 'error', serverData.message || 'Server analytics not configured', serverData)
      }
    } catch (error) {
      updateTest('Server Analytics', 'error', 'Failed to test server analytics')
    }

    // Test 3: Real-time Data
    updateTest('Real-time Data', 'pending', 'Fetching real-time analytics...')
    try {
      const realtimeResponse = await fetch('/api/analytics/ga4?type=realtime')
      const realtimeData = await realtimeResponse.json()
      
      updateTest('Real-time Data', 'success', `Active users: ${realtimeData.activeUsers || 0}`, realtimeData)
    } catch (error) {
      updateTest('Real-time Data', 'error', 'Failed to fetch real-time data')
    }

    setIsRunning(false)
    toast.success('All tests completed!')
  }

  const sendTestEvent = async (eventType: string) => {
    try {
      const events = {
        search: {
          eventName: 'search',
          parameters: {
            search_term: 'test dental implants',
            search_results_count: 10,
            search_type: 'article'
          }
        },
        chat: {
          eventName: 'chat_session',
          parameters: {
            chat_action: 'created',
            chat_session_id: `test-session-${Date.now()}`
          }
        },
        verification: {
          eventName: 'professional_verification',
          parameters: {
            verification_action: 'started',
            gdc_number_hash: 'test-hash-123'
          }
        },
        pageView: {
          eventName: 'page_view',
          parameters: {
            page_title: 'Test Page',
            page_location: '/test',
            page_category: 'test'
          }
        }
      }

      const event = events[eventType as keyof typeof events]
      
      const response = await fetch('/api/analytics/server/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          userId: `test-user-${Date.now()}`
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(`${eventType} event sent successfully!`)
      } else {
        toast.error(`Failed to send ${eventType} event`)
      }
    } catch (error) {
      toast.error(`Error sending ${eventType} event`)
    }
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500 animate-pulse" />
    }
  }

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800'
      case 'error':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Test Dashboard</h1>
          <p className="text-muted-foreground">Test and verify analytics implementation</p>
        </div>
        <Button onClick={runTests} disabled={isRunning}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          Run All Tests
        </Button>
      </div>

      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Make sure you have all required environment variables set in your .env.local file.
          Check the test results below for any configuration issues.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="tests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tests">Configuration Tests</TabsTrigger>
          <TabsTrigger value="events">Send Test Events</TabsTrigger>
          <TabsTrigger value="guide">Setup Guide</TabsTrigger>
        </TabsList>

        <TabsContent value="tests" className="space-y-4">
          {testResults.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Click "Run All Tests" to verify your analytics configuration
              </CardContent>
            </Card>
          ) : (
            testResults.map((test) => (
              <Card key={test.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(test.status)}
                      <CardTitle className="text-lg">{test.name}</CardTitle>
                    </div>
                    <Badge className={getStatusColor(test.status)}>
                      {test.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-2">{test.message}</p>
                  {test.data && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium">View Details</summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                        {JSON.stringify(test.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Send Test Events</CardTitle>
              <CardDescription>
                Send test events to verify they appear in Google Analytics 4
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" onClick={() => sendTestEvent('search')}>
                <Search className="w-4 h-4 mr-2" />
                Test Search Event
              </Button>
              <Button variant="outline" onClick={() => sendTestEvent('chat')}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Test Chat Event
              </Button>
              <Button variant="outline" onClick={() => sendTestEvent('verification')}>
                <Users className="w-4 h-4 mr-2" />
                Test Verification Event
              </Button>
              <Button variant="outline" onClick={() => sendTestEvent('pageView')}>
                <FileText className="w-4 h-4 mr-2" />
                Test Page View Event
              </Button>
            </CardContent>
          </Card>

          <Alert>
            <Activity className="w-4 h-4" />
            <AlertDescription>
              After sending events, check Google Analytics 4 Real-time reports or DebugView.
              Events may take 1-2 minutes to appear.
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="guide" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quick Setup Guide</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">1. Environment Variables</h3>
                <p className="text-sm text-muted-foreground mb-2">Add these to your .env.local file:</p>
                <pre className="p-3 bg-gray-100 rounded text-sm">
{`# GA4 Reporting API
GA4_PROPERTY_ID=123456789
GA4_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# GA4 Measurement Protocol
GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_API_SECRET=your_api_secret`}
                </pre>
              </div>

              <div>
                <h3 className="font-semibold mb-2">2. Get GA4 API Secret</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Google Analytics 4</li>
                  <li>Navigate to Admin → Data Streams</li>
                  <li>Select your web data stream</li>
                  <li>Scroll to "Measurement Protocol API secrets"</li>
                  <li>Create a new secret and copy it</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold mb-2">3. Service Account (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  For GA4 Reporting API access, create a service account in Google Cloud Console
                  and grant it Viewer access to your GA4 property.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-2">4. Verify in GA4</h3>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Open GA4 → Reports → Real-time</li>
                  <li>Or use DebugView for detailed event inspection</li>
                  <li>Look for your test events</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}