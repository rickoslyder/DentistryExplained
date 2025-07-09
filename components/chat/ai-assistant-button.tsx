"use client"

import { useState, useEffect, useContext } from "react"
import { Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChatPanel } from "./chat-panel"
import { ChatHistorySidebar } from "./chat-history-sidebar"
import { ChatContext } from "./chat-provider"
import { usePathname } from "next/navigation"

export function AIAssistantButton() {
  const pathname = usePathname()
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false)
  const [localChatOpen, setLocalChatOpen] = useState(false)
  
  // Use context safely
  const chatContext = useContext(ChatContext)
  
  const isChatOpen = chatContext?.isChatOpen ?? localChatOpen
  const setIsChatOpen = chatContext?.setIsChatOpen ?? setLocalChatOpen
  
  // Set page context when pathname changes
  useEffect(() => {
    if (chatContext?.setPageContext) {
      // Extract page info from pathname
      const parts = pathname.split('/')
      const category = parts[1] || 'general'
      const title = parts[parts.length - 1]?.replace(/-/g, ' ') || 'Home'
      
      chatContext.setPageContext({
        url: pathname,
        category,
        title,
      })
    }
  }, [pathname, chatContext?.setPageContext]) // Only depend on setPageContext function

  // Listen for custom events to load chat sessions
  useEffect(() => {
    const handleLoadSession = (event: CustomEvent) => {
      if (chatContext?.loadSession && event.detail?.sessionId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        const legacyIdRegex = /^[a-z0-9]{20,30}$/i
        
        if (uuidRegex.test(event.detail.sessionId) || legacyIdRegex.test(event.detail.sessionId)) {
          chatContext.loadSession(event.detail.sessionId)
        }
      }
    }

    window.addEventListener('loadChatSession', handleLoadSession as EventListener)
    return () => {
      window.removeEventListener('loadChatSession', handleLoadSession as EventListener)
    }
  }, [chatContext?.loadSession]) // Only depend on loadSession function

  return (
    <>
      <Button
        onClick={() => setIsChatOpen(true)}
        className="relative bg-primary hover:bg-primary/90 text-white"
        size="default"
        aria-label="Open AI Assistant"
      >
        <Bot className="w-5 h-5" />
        <span className="hidden sm:inline-block ml-2">Ask AI</span>
        <span className="sr-only">Open AI Assistant</span>

        {/* Pulse animation - pointer-events-none so it doesn't block clicks */}
        <span className="absolute -inset-1 rounded-full bg-primary/20 pulse-ring pointer-events-none"></span>
      </Button>

      {chatContext && isChatOpen && (
        <ChatHistorySidebar
          sessions={chatContext.sessions}
          currentSessionId={chatContext.sessionId}
          onSelectSession={chatContext.loadSession}
          onNewChat={chatContext.createNewSession}
          onDeleteSession={chatContext.deleteSession}
          isExpanded={isHistoryExpanded}
          onToggleExpanded={() => setIsHistoryExpanded(!isHistoryExpanded)}
        />
      )}

      <ChatPanel 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        pageContext={chatContext?.pageContext}
      />
    </>
  )
}
