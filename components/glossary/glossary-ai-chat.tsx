'use client'

import React, { useState, useContext } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { ChatContext } from '@/components/chat/chat-provider'

interface GlossaryTerm {
  term: string
  definition: string
  pronunciation?: string | null
  also_known_as?: string[] | null
  related_terms?: string[] | null
  category?: string | null
  difficulty?: string | null
  example?: string | null
}

interface GlossaryAIChatProps {
  term: GlossaryTerm
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function GlossaryAIChat({ 
  term, 
  variant = 'ghost', 
  size = 'sm',
  className = ''
}: GlossaryAIChatProps) {
  const chatContext = useContext(ChatContext)
  
  const handleAskAI = () => {
    if (!chatContext) {
      toast.error('Chat system is not available')
      return
    }

    // Open the chat sidebar
    chatContext.setIsChatOpen(true)
    
    // Create a new session or clear current messages
    chatContext.createNewSession()
    
    // Set page context for the glossary term
    chatContext.setPageContext({
      title: `Glossary: ${term.term}`,
      url: `/glossary#${term.term.toLowerCase().replace(/\s+/g, '-')}`,
      category: 'glossary',
      glossaryTerm: {
        term: term.term,
        definition: term.definition,
        pronunciation: term.pronunciation,
        alsoKnownAs: term.also_known_as,
        relatedTerms: term.related_terms,
        category: term.category,
        difficulty: term.difficulty,
        example: term.example
      }
    })
    
    // Send initial message with context
    const contextMessage = `I'd like to learn more about the dental term "${term.term}". ${term.definition}${term.pronunciation ? ` (pronounced: ${term.pronunciation})` : ''}`
    
    // Delay slightly to ensure chat is open
    setTimeout(() => {
      chatContext.sendMessage(contextMessage)
    }, 100)
    
    toast.success(`Ask AI about ${term.term}`, {
      description: 'Chat panel opened with context'
    })
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleAskAI}
      disabled={!chatContext}
      className={className}
      title={`Ask AI about ${term.term}`}
    >
      <MessageSquare className="h-4 w-4 mr-1.5" />
      Ask AI
    </Button>
  )
}