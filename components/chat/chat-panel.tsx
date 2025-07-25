"use client"

import type React from "react"

import { useState, useEffect, useRef, useContext } from "react"
import { X, Send, Download, Loader2, StopCircle, Bot, AlertCircle, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@clerk/nextjs"
import { ChatMessage } from "./chat-message"
import { SuggestedQuestions } from "./suggested-questions"
import { useChatStream } from "@/hooks/use-chat-stream"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { isLiteLLMConfigured } from "@/lib/config/litellm"
import { analytics } from "@/lib/analytics-enhanced"
import { ChatContext } from "./chat-provider"

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  pageContext?: {
    title: string
    category: string
    content: string
    url?: string
  }
}

export function ChatPanel({ isOpen, onClose, pageContext }: ChatPanelProps) {
  const [input, setInput] = useState("")
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasInitialized = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const hasGeneratedTitle = useRef(false)
  
  // Use context if available, otherwise fall back to local hook
  const chatContext = useContext(ChatContext)
  
  // Use context values if available, otherwise use local hook
  const localChatStream = useChatStream({
    pageContext,
    onError: (error) => {
      console.error("Chat error:", error)
    },
  })
  
  const messages = chatContext?.messages ?? localChatStream.messages
  const isLoading = chatContext?.isLoading ?? localChatStream.isLoading
  const sessionId = chatContext?.sessionId ?? localChatStream.sessionId
  const sendMessage = chatContext?.sendMessage ?? localChatStream.sendMessage
  const clearMessages = chatContext?.clearMessages ?? localChatStream.clearMessages
  const cancelStream = chatContext?.cancelStream ?? localChatStream.cancelStream
  const exportChat = chatContext?.exportChat ?? localChatStream.exportChat

  const isConfigured = isLiteLLMConfigured()

  // Initialize chat session
  useEffect(() => {
    if (isOpen && user && !hasInitialized.current) {
      hasInitialized.current = true
      
      // Track chat panel opened and session start
      analytics.track('chat_panel_opened', {
        has_page_context: !!pageContext,
        page_context_title: pageContext?.title,
        page_context_category: pageContext?.category,
        ai_configured: isConfigured,
      })
      
      // Track chat session start
      const currentSessionId = sessionId || localStorage.getItem(`chat_session_${user.id}`) || crypto.randomUUID()
      analytics.trackChatInteraction('start', currentSessionId, {
        has_page_context: !!pageContext,
        page_context_title: pageContext?.title,
        page_context_category: pageContext?.category,
        user_type: user.publicMetadata?.userType || 'patient',
      })
      
      // Check localStorage for existing session
      const storedSessionId = localStorage.getItem(`chat_session_${user.id}`)
      if (storedSessionId && chatContext?.loadSession) {
        chatContext.loadSession(storedSessionId)
      } else if (storedSessionId && localChatStream.loadChatHistory) {
        localChatStream.loadChatHistory(storedSessionId)
      }
    }
  }, [isOpen, user, pageContext, isConfigured, chatContext?.loadSession, localChatStream.loadChatHistory])
  
  // Generate title after first exchange
  useEffect(() => {
    if (!hasGeneratedTitle.current && messages.length >= 2 && sessionId) {
      const userMessage = messages.find(m => m.role === 'user')
      const assistantMessage = messages.find(m => m.role === 'assistant')
      
      if (userMessage && assistantMessage) {
        hasGeneratedTitle.current = true
        
        // Generate title in background
        fetch('/api/chat/generate-title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            messages: [
              { role: 'user', content: userMessage.content },
              { role: 'assistant', content: assistantMessage.content }
            ]
          })
        }).catch(err => console.error('Failed to generate title:', err))
      }
    }
  }, [messages, sessionId])

  // Store session ID when it changes
  useEffect(() => {
    if (sessionId && user) {
      localStorage.setItem(`chat_session_${user.id}`, sessionId)
    }
  }, [sessionId, user])

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
      // Cmd/Ctrl + K to clear chat
      if ((e.metaKey || e.ctrlKey) && e.key === 'k' && isOpen) {
        e.preventDefault()
        if (messages.length > 0 && window.confirm('Clear chat history?')) {
          clearMessages()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, messages.length, onClose, clearMessages])

  const handleSendMessage = () => {
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput("")
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
    // Focus input field after setting the question
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
    
    // Track suggested question click
    analytics.track('chat_suggested_question_clicked', {
      question,
      has_page_context: !!pageContext,
      page_context_title: pageContext?.title,
    })
  }

  const handleQuickAction = (action: any, originalMessage: string) => {
    // Construct the modified message based on the action
    const modifiedMessage = `${action.prompt}${originalMessage}`
    sendMessage(modifiedMessage)
  }

  if (!isOpen) return null

  return (
    <>
      {/* Chat Panel - No backdrop, positioned to the right */}
      <div 
        className="fixed right-0 top-0 h-full w-full sm:max-w-md bg-white shadow-2xl chat-slide-in flex flex-col z-50"
        role="dialog"
        aria-modal="true"
        aria-label="AI Dental Assistant"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Dental Assistant</h3>
              <p className="text-xs opacity-90">
                {isConfigured ? "Ask me anything about dental health" : "Limited mode - AI not configured"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (chatContext?.createNewSession) {
                  chatContext.createNewSession()
                } else {
                  clearMessages()
                }
                hasGeneratedTitle.current = false
              }}
              className="text-white hover:bg-white/20 text-xs"
              title="New chat"
              aria-label="Start new chat"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={exportChat}
                className="text-white hover:bg-white/20"
                title="Export chat as text file"
                aria-label="Export chat as text file"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose} 
              className="text-white hover:bg-white/20 text-xs"
              title="Close chat panel"
              aria-label="Close chat panel"
            >
              <X className="w-4 h-4 mr-1" />
              Close
            </Button>
          </div>
        </div>

        {/* Configuration Warning */}
        {!isConfigured && (
          <Alert className="m-4 mb-0 border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800 text-sm">
              AI is running in limited mode. Responses use pre-programmed knowledge only.
            </AlertDescription>
          </Alert>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8">
                <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Hello! I'm your dental AI assistant
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  I can help answer questions about dental health, treatments, and oral care.
                  {pageContext && pageContext.title !== 'Home' && (
                    <span className="block mt-2">
                      I see you're reading about "{pageContext.title}". Feel free to ask me anything!
                    </span>
                  )}
                </p>
              </div>
            )}
            {messages.map((message, index) => {
              // Find the last user message before this message
              const lastUserMsg = messages
                .slice(0, index)
                .reverse()
                .find(m => m.role === 'user')
              
              return (
                <ChatMessage 
                  key={message.id} 
                  message={message}
                  onQuickAction={handleQuickAction}
                  onFollowUpQuestion={handleSuggestedQuestion}
                  isLoading={isLoading}
                  showFollowUp={user?.unsafeMetadata?.settings?.aiAssistant?.autoSuggestFollowUp !== false}
                  lastUserMessage={lastUserMsg?.content}
                />
              )
            })}
            {isLoading && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelStream}
                  className="text-xs"
                >
                  <StopCircle className="w-3 h-3 mr-1" />
                  Stop
                </Button>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 0 && (
          <div className="p-4 border-t bg-gray-50">
            <SuggestedQuestions pageContext={pageContext} onQuestionClick={handleSuggestedQuestion} />
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about dental health..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!input.trim() || isLoading} 
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send • Esc to close • {typeof window !== 'undefined' && navigator.platform.includes('Mac') ? 'Cmd' : 'Ctrl'}+K to clear
          </p>
        </div>
      </div>
    </>
  )
}
