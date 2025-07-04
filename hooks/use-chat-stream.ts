"use client"

import { useState, useCallback, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface PageContext {
  title?: string
  category?: string
  content?: string
  url?: string
}

interface UseChatStreamOptions {
  initialMessages?: ChatMessage[]
  pageContext?: PageContext
  onError?: (error: Error) => void
}

export function useChatStream(options: UseChatStreamOptions = {}) {
  const { user } = useUser()
  const [messages, setMessages] = useState<ChatMessage[]>(options.initialMessages || [])
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const sendMessage = useCallback(async (content: string, useStreaming = true) => {
    if (!content.trim() || isLoading) return
    
    if (!user) {
      toast.error('Please sign in to use the chat')
      return
    }

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    // Add user message
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)

    // Prepare assistant message placeholder
    const assistantMessageId = crypto.randomUUID()
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    }
    
    setMessages(prev => [...prev, assistantMessage])

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          sessionId,
          pageContext: options.pageContext,
          stream: useStreaming,
        }),
        signal: abortControllerRef.current.signal,
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status}`)
      }

      // Handle streaming response
      if (useStreaming && response.body) {
        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let accumulatedContent = ''

        // Get session ID from headers if available
        const newSessionId = response.headers.get('X-Session-Id')
        if (newSessionId) {
          setSessionId(newSessionId)
        }

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) break
          
          const text = decoder.decode(value, { stream: true })
          accumulatedContent += text
          
          // Update the assistant message content
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: accumulatedContent }
                : msg
            )
          )
        }
        
        // Save the assistant message to the database after streaming completes
        if (sessionId && accumulatedContent) {
          try {
            await fetch('/api/chat/messages', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId,
                content: accumulatedContent,
                role: 'assistant',
              }),
            })
          } catch (saveError) {
            console.error('Failed to save assistant message:', saveError)
          }
        }
      } else {
        // Handle non-streaming response
        const responseText = await response.text()
        console.log('Raw response:', responseText) // Debug log
        
        try {
          const data = JSON.parse(responseText)
          console.log('Parsed data:', data) // Debug log
          
          // Extract the response content
          const responseContent = typeof data === 'string' ? data : (data.response || data)
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: responseContent }
                : msg
            )
          )
          
          if (data.sessionId) {
            setSessionId(data.sessionId)
          }
        } catch (parseError) {
          console.error('Failed to parse response:', parseError)
          // If parsing fails, use the raw text
          setMessages(prev => 
            prev.map(msg => 
              msg.id === assistantMessageId 
                ? { ...msg, content: responseText }
                : msg
            )
          )
        }
      }
    } catch (error) {
      // Remove the empty assistant message on error
      setMessages(prev => prev.filter(msg => msg.id !== assistantMessageId))
      
      if (error.name === 'AbortError') {
        console.log('Chat request was cancelled')
      } else {
        console.error('Chat error:', error)
        toast.error('Failed to send message. Please try again.')
        options.onError?.(error as Error)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
    }
  }, [user, sessionId, isLoading, options])

  const clearMessages = useCallback(() => {
    setMessages([])
    setSessionId(null)
  }, [])

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  const exportChat = useCallback(() => {
    const chatText = messages
      .map(msg => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join('\n\n')
    
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `chat-export-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success('Chat exported successfully')
  }, [messages])

  const loadChatHistory = useCallback(async (sessionIdToLoad: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionIdToLoad}`)
      
      if (!response.ok) {
        throw new Error('Failed to load chat history')
      }
      
      const data = await response.json()
      
      const loadedMessages: ChatMessage[] = data.messages.map((msg: any) => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at),
      }))
      
      setMessages(loadedMessages)
      setSessionId(sessionIdToLoad)
    } catch (error) {
      console.error('Failed to load chat history:', error)
      toast.error('Failed to load chat history')
    }
  }, [])

  return {
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearMessages,
    cancelStream,
    exportChat,
    loadChatHistory,
  }
}