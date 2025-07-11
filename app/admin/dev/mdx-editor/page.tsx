'use client'

import { useState } from 'react'
import { MDXRichTextEditor } from '@/components/admin/mdx-rich-text-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Copy, FileText, AlertCircle } from 'lucide-react'
import { EditorErrorBoundary } from '@/components/admin/editor-error-boundary'

const testCases = {
  basic: `# Basic Test
This is a simple paragraph with **bold** and *italic* text.

<Alert type="info">Basic alert component</Alert>`,
  
  expressions: `# MDX Expressions
The year is {new Date().getFullYear()}.
Math: {2 + 2} = 4`,
  
  nested: `<Alert type="warning">
  <FAQ question="Can this be nested?">
    Yes, it can!
  </FAQ>
</Alert>`,
  
  malformed: `<Alert type="error">
This alert is not closed properly`,
  
  complex: `---
title: Complex MDX Test
description: Testing various MDX features
---

# Complex MDX Test

## Mixed Components and Markdown

<Alert type="info">
  This alert contains **bold**, *italic*, and \`code\`.
  
  Even multiple paragraphs!
</Alert>

### Nested Components
<CostTable 
  costs={[
    { item: "**Initial Consultation**", cost: "£50", nhs: true },
    { item: "*Follow-up Visit*", cost: "£30", nhs: false }
  ]} 
/>

## Expressions
Current year: {new Date().getFullYear()}
Math: {5 * 10} = 50

## Special Characters
Unicode: café, naïve, résumé
Symbols: < > & " ' @ # $ % ^ * ( ) { } [ ] | \\ / ? ! ~
Emojis: 🦷 😊 ⚕️ 💊 🏥`,
  
  unicode: `# Unicode & Special Characters
Café, naïve, résumé
Emojis: 🦷 😊 ⚕️ 💊
Math: ∑ ∏ ∫ ∂ ∇ ∞`,
  
  empty: ''
}

export default function TestEditorPage() {
  const [content, setContent] = useState(testCases.basic)
  const [selectedTest, setSelectedTest] = useState('basic')
  const [error, setError] = useState<string | null>(null)

  const loadTestCase = (testCase: keyof typeof testCases) => {
    setSelectedTest(testCase)
    setContent(testCases[testCase])
    setError(null)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Failed to copy:', err))
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <Card>
        <CardHeader>
          <CardTitle>MDX Rich Text Editor Test Suite</CardTitle>
          <CardDescription>
            Test various edge cases and MDX expressions to ensure the editor handles them properly
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Case Selector */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Load Test Case:</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(testCases).map((key) => (
                <Button
                  key={key}
                  variant={selectedTest === key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => loadTestCase(key as keyof typeof testCases)}
                >
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Editor Tabs */}
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="editor">Rich Text Editor</TabsTrigger>
              <TabsTrigger value="source">Source MDX</TabsTrigger>
              <TabsTrigger value="output">Output Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">MDX Rich Text Editor</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setError('Manual error test triggered!')}
                  >
                    Trigger Error
                  </Button>
                </div>
                <EditorErrorBoundary>
                  <MDXRichTextEditor
                    value={content}
                    onChange={setContent}
                    placeholder="Enter your MDX content..."
                  />
                </EditorErrorBoundary>
              </div>
            </TabsContent>

            <TabsContent value="source" className="mt-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">Raw MDX Source</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="font-mono text-sm min-h-[500px]"
                  placeholder="MDX source code..."
                />
              </div>
            </TabsContent>

            <TabsContent value="output" className="mt-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Processed Output</h3>
                <Card className="p-4 bg-muted">
                  <pre className="text-sm whitespace-pre-wrap break-words">
                    {JSON.stringify({ content }, null, 2)}
                  </pre>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Test Results */}
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h3 className="font-medium mb-2">Test Information</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Content Length:</dt>
                <dd>{content.length} characters</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Line Count:</dt>
                <dd>{content.split('\n').length} lines</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Has MDX Components:</dt>
                <dd>{content.includes('<') && content.includes('>') ? 'Yes' : 'No'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Has Expressions:</dt>
                <dd>{content.includes('{') && content.includes('}') ? 'Yes' : 'No'}</dd>
              </div>
            </dl>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}