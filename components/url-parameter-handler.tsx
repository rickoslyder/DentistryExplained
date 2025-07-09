"use client"

import { useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useChatContext } from "@/components/chat/chat-provider"

export function URLParameterHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const hasProcessed = useRef(false)
  
  // Try to use chat context if available
  let chatContext
  try {
    chatContext = useChatContext()
  } catch (e) {
    // Context not available
    chatContext = null
  }

  useEffect(() => {
    // Prevent processing multiple times
    if (hasProcessed.current) return
    
    const openChat = searchParams.get("openChat")
    const sessionId = searchParams.get("sessionId")
    
    if (openChat === "true" && chatContext) {
      hasProcessed.current = true
      
      // Open the chat
      chatContext.setIsChatOpen(true)
      
      // Load specific session if provided
      if (sessionId && chatContext.loadSession) {
        // Validate UUID format before loading
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (uuidRegex.test(sessionId)) {
          chatContext.loadSession(sessionId)
        }
      }
      
      // Clean up URL to prevent re-triggering
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete("openChat")
      newSearchParams.delete("sessionId")
      
      const newUrl = newSearchParams.toString() 
        ? `${window.location.pathname}?${newSearchParams.toString()}`
        : window.location.pathname
        
      // Replace the URL without triggering a navigation
      window.history.replaceState({}, "", newUrl)
    }
  }, [searchParams]) // Remove chatContext and router from dependencies

  return null
}