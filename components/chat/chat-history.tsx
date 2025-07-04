"use client"

import { useState, useEffect } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageSquare, Calendar, Download, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'

interface ChatSession {
  id: string
  session_id: string
  created_at: string
  last_activity: string
  page_context?: {
    title?: string
    category?: string
  }
  message_count: number
  preview?: string
}

export function ChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      loadChatSessions()
    }
  }, [user])

  const loadChatSessions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/chat/sessions')
      
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
      } else {
        console.error('Failed to load chat sessions')
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      toast.error('Failed to load chat history')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.session_id !== sessionId))
        toast.success('Chat session deleted')
      } else {
        throw new Error('Failed to delete session')
      }
    } catch (error) {
      console.error('Error deleting session:', error)
      toast.error('Failed to delete chat session')
    }
  }

  const exportSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat?sessionId=${sessionId}`)
      
      if (response.ok) {
        const data = await response.json()
        
        // Format messages for export
        const chatText = data.messages
          .map((msg: any) => `${msg.role.toUpperCase()}: ${msg.content}`)
          .join('\n\n')
        
        // Create and download file
        const blob = new Blob([chatText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `chat-session-${sessionId.slice(0, 8)}.txt`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        
        toast.success('Chat exported successfully')
      } else {
        throw new Error('Failed to export session')
      }
    } catch (error) {
      console.error('Error exporting session:', error)
      toast.error('Failed to export chat session')
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading chat history...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Chat History</CardTitle>
        <CardDescription>
          Your previous conversations with the AI assistant
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No chat history yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Start a conversation with the AI assistant
            </p>
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {sessions.map((session) => (
                <div
                  key={session.session_id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">
                          {session.message_count} messages
                        </span>
                        {session.page_context?.title && (
                          <span className="text-xs text-gray-500">
                            • {session.page_context.title}
                          </span>
                        )}
                      </div>
                      {session.preview && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                          {session.preview}
                        </p>
                      )}
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {formatDistanceToNow(new Date(session.last_activity), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportSession(session.session_id)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSession(session.session_id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}