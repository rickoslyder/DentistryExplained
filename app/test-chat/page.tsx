"use client"

import { useState } from 'react'
import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useChatStream } from '@/hooks/use-chat-stream'
import { Send, Loader2, Download, Trash2, AlertCircle } from 'lucide-react'
import { isLiteLLMConfigured } from '@/lib/config/litellm'

export default function TestChatPage() {
  const [input, setInput] = useState('')
  const { messages, isLoading, sendMessage, clearMessages, exportChat, sessionId } = useChatStream({
    pageContext: {
      title: 'Test Chat Page',
      category: 'Testing',
      url: '/test-chat',
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim()) {
      sendMessage(input)
      setInput('')
    }
  }

  const isConfigured = isLiteLLMConfigured()

  return (
    <div className="min-h-screen bg-white">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">AI Chat Test Page</h1>
        
        {!isConfigured && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>LiteLLM not configured:</strong> The chat will use fallback responses. 
              To enable AI responses, set LITELLM_PROXY_URL and LITELLM_API_KEY in your environment variables.
              See docs/LITELLM_SETUP.md for instructions.
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Configuration Status</CardTitle>
            <CardDescription>Current AI chat configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">LiteLLM Configured:</span>
                <span className={isConfigured ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                  {isConfigured ? '✓ Yes' : '✗ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Session ID:</span>
                <span className="font-mono text-xs">{sessionId || 'Not started'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span>{messages.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Chat Interface</CardTitle>
                <CardDescription>Test the AI dental assistant</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportChat}
                  disabled={messages.length === 0}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearMessages}
                  disabled={messages.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96 mb-4 p-4 border rounded-lg">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-4">No messages yet. Start a conversation!</p>
                  <div className="text-sm space-y-2">
                    <p>Try asking:</p>
                    <button
                      onClick={() => sendMessage("What causes tooth decay?")}
                      className="block w-full text-blue-600 hover:underline"
                    >
                      "What causes tooth decay?"
                    </button>
                    <button
                      onClick={() => sendMessage("How much does a filling cost on the NHS?")}
                      className="block w-full text-blue-600 hover:underline"
                    >
                      "How much does a filling cost on the NHS?"
                    </button>
                    <button
                      onClick={() => sendMessage("I have severe tooth pain, what should I do?")}
                      className="block w-full text-blue-600 hover:underline"
                    >
                      "I have severe tooth pain, what should I do?"
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-50 ml-auto max-w-[80%]'
                          : 'bg-gray-50 mr-auto max-w-[80%]'
                      }`}
                    >
                      <div className="text-xs text-gray-500 mb-1">
                        {message.role === 'user' ? 'You' : 'AI Assistant'}
                      </div>
                      <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm">AI is thinking...</span>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
            
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about dental health..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !input.trim()}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 prose prose-sm max-w-none">
          <h2>Test Scenarios</h2>
          <p>Use these test cases to verify the AI assistant is working correctly:</p>
          
          <h3>1. General Questions</h3>
          <ul>
            <li>Basic dental hygiene advice</li>
            <li>Information about specific conditions</li>
            <li>Treatment explanations</li>
          </ul>
          
          <h3>2. Emergency Detection</h3>
          <p>The AI should recognize emergency keywords and provide urgent care advice for:</p>
          <ul>
            <li>Facial swelling</li>
            <li>Difficulty swallowing</li>
            <li>Uncontrolled bleeding</li>
          </ul>
          
          <h3>3. Context Awareness</h3>
          <p>The AI knows you're on the "Test Chat Page" and should reference this context when relevant.</p>
          
          <h3>4. UK/NHS Specific</h3>
          <p>Ask about NHS charges, UK dental practices, or 2025 specific information.</p>
        </div>
      </div>
      
      <Footer />
    </div>
  )
}