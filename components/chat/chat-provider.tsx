"use client"

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useUser } from '@clerk/nextjs'
import { useChatStream } from '@/hooks/use-chat-stream'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface ChatSession {
  id: string
  title?: string
  createdAt: Date
  lastActivity: Date
  messageCount: number
}

interface ChatContextType {
  // Current chat state
  messages: ChatMessage[]
  isLoading: boolean
  sessionId: string | null
  
  // Chat actions
  sendMessage: (content: string) => void
  clearMessages: () => void
  cancelStream: () => void
  exportChat: () => void
  
  // Session management
  currentSession: ChatSession | null
  sessions: ChatSession[]
  loadSession: (sessionId: string) => void
  createNewSession: () => void
  deleteSession: (sessionId: string) => void
  
  // UI state
  isChatOpen: boolean
  setIsChatOpen: (open: boolean) => void
  isHistoryOpen: boolean
  setIsHistoryOpen: (open: boolean) => void
  
  // Page context (for contextual responses)
  pageContext: any
  setPageContext: (context: any) => void
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChatContext() {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider')
  }
  return context
}

interface ChatProviderProps {
  children: React.ReactNode
}

export function ChatProvider({ children }: ChatProviderProps) {
  const { user } = useUser()
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [pageContext, setPageContext] = useState<any>(null)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null)
  const sessionsRef = useRef<ChatSession[]>([])
  
  const {
    messages,
    isLoading,
    sessionId,
    sendMessage: streamSendMessage,
    clearMessages: streamClearMessages,
    cancelStream,
    exportChat,
    loadChatHistory,
  } = useChatStream({ pageContext })
  
  // Load sessions from localStorage and API
  useEffect(() => {
    if (!user) return
    
    // Load sessions from localStorage
    const storedSessions = localStorage.getItem(`chat_sessions_list_${user.id}`)
    if (storedSessions) {
      try {
        const parsed = JSON.parse(storedSessions)
        // Accept both UUID and legacy session IDs
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const legacyIdRegex = /^[a-z0-9]{20,30}$/i
        const validSessions = parsed.filter((session: ChatSession) => {
          if (!uuidRegex.test(session.id) && !legacyIdRegex.test(session.id)) {
            console.warn('Filtering out session with invalid ID:', session.id)
            return false
          }
          return true
        })
        setSessions(validSessions)
      } catch (e) {
        console.error('Failed to parse stored sessions:', e)
      }
    }
    
    // Fetch sessions from API
    fetchUserSessions()
  }, [user])
  
  // Keep sessionsRef in sync
  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  // Update current session when sessionId changes
  useEffect(() => {
    if (sessionId) {
      // Find existing session
      const existingSession = sessionsRef.current.find(s => s.id === sessionId)
      if (existingSession) {
        setCurrentSession(existingSession)
      } else {
        // Create new session
        const newSession: ChatSession = {
          id: sessionId,
          title: 'New conversation',
          createdAt: new Date(),
          lastActivity: new Date(),
          messageCount: 0
        }
        
        setCurrentSession(newSession)
        
        // Add to sessions list only once
        setSessions(prevSessions => {
          if (prevSessions.find(s => s.id === sessionId)) {
            return prevSessions
          }
          return [newSession, ...prevSessions]
        })
      }
    }
  }, [sessionId]) // Only depend on sessionId
  
  // Persist sessions to localStorage
  useEffect(() => {
    if (user && sessions.length > 0) {
      localStorage.setItem(`chat_sessions_list_${user.id}`, JSON.stringify(sessions))
    }
  }, [sessions, user])
  
  const fetchUserSessions = async () => {
    try {
      const response = await fetch('/api/chat/sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      }
    } catch (error) {
      console.error('Failed to fetch chat sessions:', error)
    }
  }
  
  const sendMessage = useCallback((content: string) => {
    streamSendMessage(content)
    
    // Update last activity
    if (currentSession) {
      setSessions(prev => 
        prev.map(s => 
          s.id === currentSession.id 
            ? { ...s, lastActivity: new Date(), messageCount: s.messageCount + 1 }
            : s
        )
      )
    }
  }, [streamSendMessage, currentSession])
  
  const clearMessages = useCallback(() => {
    streamClearMessages()
    setCurrentSession(null)
  }, [streamClearMessages])
  
  const loadSession = useCallback(async (sessionId: string) => {
    await loadChatHistory(sessionId)
    const session = sessionsRef.current.find(s => s.id === sessionId)
    if (session) {
      setCurrentSession(session)
    }
  }, [loadChatHistory])
  
  const createNewSession = useCallback(() => {
    clearMessages()
    setCurrentSession(null)
  }, [clearMessages])
  
  const deleteSession = useCallback(async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId))
        if (currentSession?.id === sessionId) {
          createNewSession()
        }
      }
    } catch (error) {
      console.error('Failed to delete session:', error)
    }
  }, [currentSession, createNewSession])
  
  const value: ChatContextType = useMemo(() => ({
    // Current chat state
    messages,
    isLoading,
    sessionId,
    
    // Chat actions
    sendMessage,
    clearMessages,
    cancelStream,
    exportChat,
    
    // Session management
    currentSession,
    sessions,
    loadSession,
    createNewSession,
    deleteSession,
    
    // UI state
    isChatOpen,
    setIsChatOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    
    // Page context
    pageContext,
    setPageContext,
  }), [
    messages,
    isLoading,
    sessionId,
    sendMessage,
    clearMessages,
    cancelStream,
    exportChat,
    currentSession,
    sessions,
    loadSession,
    createNewSession,
    deleteSession,
    isChatOpen,
    setIsChatOpen,
    isHistoryOpen,
    setIsHistoryOpen,
    pageContext,
    setPageContext,
  ])
  
  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}