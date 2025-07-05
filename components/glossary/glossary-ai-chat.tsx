'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { MessageSquare, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

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
  const [isStarting, setIsStarting] = useState(false)
  const router = useRouter()

  const startChatWithContext = async () => {
    setIsStarting(true)
    
    try {
      // Create initial message with glossary context
      const contextMessage = `I'd like to learn more about "${term.term}". ${term.definition}`
      
      // Create a new chat session with glossary context
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: contextMessage,
          glossaryContext: {
            term: term.term,
            definition: term.definition,
            pronunciation: term.pronunciation,
            alsoKnownAs: term.also_known_as,
            relatedTerms: term.related_terms,
            category: term.category,
            difficulty: term.difficulty,
            example: term.example
          },
          pageContext: {
            title: `Glossary: ${term.term}`,
            url: `/glossary#${term.term.toLowerCase().replace(/\s+/g, '-')}`,
            category: 'glossary'
          }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start chat')
      }

      const data = await response.json()
      
      // Store the session ID and initial context in sessionStorage
      if (data.sessionId) {
        sessionStorage.setItem('currentChatSession', data.sessionId)
        sessionStorage.setItem('chatGlossaryContext', JSON.stringify(term))
      }

      // Navigate to chat page
      router.push('/chat?glossary=' + encodeURIComponent(term.term))
      
      toast.success('Starting AI chat about ' + term.term, {
        description: 'Loading your personalized learning session...'
      })
      
    } catch (error) {
      console.error('Failed to start chat:', error)
      toast.error('Failed to start chat', {
        description: 'Please try again'
      })
    } finally {
      setIsStarting(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={startChatWithContext}
      disabled={isStarting}
      className={className}
      title={`Ask AI about ${term.term}`}
    >
      {isStarting ? (
        <>
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          Starting...
        </>
      ) : (
        <>
          <MessageSquare className="h-4 w-4 mr-1.5" />
          Ask AI
        </>
      )}
    </Button>
  )
}