'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { MessageSquare, Send, Loader2, Globe, FileText, Newspaper, Search } from 'lucide-react'
import { ChatSearchToggle } from '@/components/chat/chat-search-toggle'
import { SearchResults } from '@/components/chat/search-results'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  searchResults?: {
    results: any[]
    provider: 'perplexity' | 'exa'
    searchType: 'smart' | 'news' | 'research' | 'nhs'
    isCached: boolean
    searchTime?: number
    query: string
  }
}

export default function ChatPage() {
  const searchParams = useSearchParams()
  const glossaryTerm = searchParams.get('glossary')
  
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [webSearchEnabled, setWebSearchEnabled] = useState(false)
  const [webSearchType, setWebSearchType] = useState<'smart' | 'news' | 'research' | 'nhs'>('smart')

  // Load glossary context on mount
  useEffect(() => {
    if (glossaryTerm) {
      const storedContext = sessionStorage.getItem('chatGlossaryContext')
      const storedSessionId = sessionStorage.getItem('currentChatSession')
      
      if (storedContext) {
        const context = JSON.parse(storedContext)
        setMessages([{
          role: 'assistant',
          content: `I'll help you learn more about "${context.term}". ${context.definition}\n\nWhat would you like to know about this term?`,
          timestamp: new Date()
        }])
      }
      
      if (storedSessionId) {
        setSessionId(storedSessionId)
      }
    }
  }, [glossaryTerm])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      const glossaryContext = glossaryTerm ? JSON.parse(sessionStorage.getItem('chatGlossaryContext') || '{}') : undefined

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId,
          glossaryContext,
          webSearchEnabled,
          webSearchType
        })
      })

      if (!response.ok) {
        throw new Error('Failed to get response')
      }

      const data = await response.json()
      
      if (data.sessionId && !sessionId) {
        setSessionId(data.sessionId)
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response || data.content,
        timestamp: new Date(),
        searchResults: data.searchResults
      }

      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Chat error:', error)
      toast.error('Failed to send message')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Card className="h-[70vh] flex flex-col">
          <div className="p-4 border-b">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="h-6 w-6" />
              AI Dental Assistant
              {glossaryTerm && (
                <span className="text-sm font-normal text-gray-600">
                  - Learning about "{glossaryTerm}"
                </span>
              )}
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => {
              // Check if this is an assistant message that might have web search results
              const hasCitations = message.content.includes('[http') || message.content.includes('Source:')
              
              return (
                <div key={index} className="space-y-2">
                  {/* Show search results if available (before the message) */}
                  {message.searchResults && (
                    <SearchResults
                      results={message.searchResults.results}
                      provider={message.searchResults.provider}
                      searchType={message.searchResults.searchType}
                      isCached={message.searchResults.isCached}
                      searchTime={message.searchResults.searchTime}
                      query={message.searchResults.query}
                    />
                  )}
                  
                  {/* Message bubble */}
                  <div className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                    <div
                      className={cn(
                        'max-w-[80%] rounded-lg p-4',
                        message.role === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      )}
                    >
                      {/* Message content with proper formatting */}
                      <div className="whitespace-pre-wrap">
                        {message.content.split('\n').map((line, i) => {
                          // Format citations as links
                          if (line.includes('Source:') && line.includes('http')) {
                            const urlMatch = line.match(/https?:\/\/[^\s]+/)
                            if (urlMatch) {
                              return (
                                <div key={i} className="text-xs mt-1">
                                  <a 
                                    href={urlMatch[0]} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline"
                                  >
                                    {line}
                                  </a>
                                </div>
                              )
                            }
                          }
                          return <div key={i}>{line}</div>
                        })}
                      </div>
                      
                      <p className="text-xs mt-2 opacity-70">
                        {message.timestamp.toLocaleTimeString()}
                        {hasCitations && ' • Includes web sources'}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-4">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t space-y-3">
            <ChatSearchToggle
              webSearchEnabled={webSearchEnabled}
              onToggle={setWebSearchEnabled}
              searchType={webSearchType}
              onSearchTypeChange={setWebSearchType}
            />
            
            <div className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder="Ask me anything about dental health..."
                className="flex-1 resize-none"
                rows={2}
              />
              <Button
                onClick={sendMessage}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-full"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  )
}