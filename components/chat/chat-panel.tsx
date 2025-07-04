"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { X, Send, Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useUser } from "@clerk/nextjs"
import { ChatMessage } from "./chat-message"
import { SuggestedQuestions } from "./suggested-questions"
import { Bot } from "lucide-react" // Declare the Bot variable

interface ChatPanelProps {
  isOpen: boolean
  onClose: () => void
  pageContext?: {
    title: string
    category: string
    content: string
  }
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

export function ChatPanel({ isOpen, onClose, pageContext }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { user } = useUser()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Initialize chat session and load history
  useEffect(() => {
    if (isOpen && user && !sessionId) {
      // Check localStorage for existing session
      const storedSessionId = localStorage.getItem(`chat_session_${user.id}`)
      if (storedSessionId) {
        setSessionId(storedSessionId)
        loadChatHistory(storedSessionId)
      } else {
        // Add welcome message for new session
        setMessages([
          {
            id: "1",
            role: "assistant",
            content: `Hello! I'm your dental AI assistant. I can help answer questions about dental health, treatments, and oral care. ${pageContext ? `I can see you're reading about "${pageContext.title}". Feel free to ask me anything related to this topic or any other dental questions you might have.` : "What would you like to know?"}`,
            timestamp: new Date(),
          },
        ])
      }
    }
  }, [isOpen, user])

  // Load chat history
  const loadChatHistory = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        const formattedMessages = data.messages.map((msg: any) => ({
          id: msg.id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.created_at),
        }))
        setMessages(formattedMessages)
      }
    } catch (error) {
      console.error("Error loading chat history:", error)
    }
  }

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          sessionId: sessionId,
          pageContext: pageContext,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        
        // Store session ID for future use
        if (data.sessionId && !sessionId) {
          setSessionId(data.sessionId)
          localStorage.setItem(`chat_session_${user?.id}`, data.sessionId)
        }

        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.response,
          timestamp: new Date(),
        }

        setMessages((prev) => [...prev, aiResponse])
      } else if (response.status === 404) {
        throw new Error("Please complete your profile first")
      } else {
        throw new Error("Failed to send message")
      }
    } catch (error) {
      console.error("Failed to send message:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: error instanceof Error && error.message === "Please complete your profile first" 
          ? "Please complete your profile setup to use the AI assistant. You can do this in your dashboard."
          : "I apologize, but I encountered an error. Please try again or contact support if the problem persists.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const exportChat = () => {
    // Create a text version of the chat
    const chatText = messages
      .map((msg) => `${msg.role === 'user' ? 'You' : 'AI Assistant'}: ${msg.content}`)
      .join('\n\n')
    
    // Create a blob and download
    const blob = new Blob([chatText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `dental-ai-chat-${new Date().toISOString().split('T')[0]}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  const handleSuggestedQuestion = (question: string) => {
    setInput(question)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="flex-1 bg-black/20 backdrop-blur-sm" onClick={onClose} />

      {/* Chat Panel */}
      <div className="w-full max-w-md bg-white shadow-2xl chat-slide-in flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-primary text-white">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">AI Dental Assistant</h3>
              <p className="text-xs opacity-90">Ask me anything about dental health</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={exportChat}
              className="text-white hover:bg-white/20"
              disabled={messages.length <= 1}
            >
              <Download className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex items-center space-x-2 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">AI is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Suggested Questions */}
        {messages.length === 1 && (
          <div className="p-4 border-t bg-gray-50">
            <SuggestedQuestions pageContext={pageContext} onQuestionClick={handleSuggestedQuestion} />
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about dental health..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button onClick={sendMessage} disabled={!input.trim() || isLoading} size="icon">
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  )
}
