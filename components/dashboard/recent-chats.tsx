"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"

interface Chat {
  id: string
  preview: string
  lastMessage: Date
  messageCount: number
  topic?: string
}

interface RecentChatsProps {
  userId: string
}

export function RecentChats({ userId }: RecentChatsProps) {
  const [recentChats, setRecentChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRecentChats = async () => {
      try {
        // In production, this would fetch from the API
        // For now, we'll use mock data
        const mockChats: Chat[] = [
          {
            id: "1",
            preview: "How often should I visit the dentist?",
            lastMessage: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            messageCount: 5,
            topic: "Dental Visits"
          },
          {
            id: "2",
            preview: "What causes tooth sensitivity?",
            lastMessage: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
            messageCount: 8,
            topic: "Tooth Sensitivity"
          },
          {
            id: "3",
            preview: "Tell me about teeth whitening options",
            lastMessage: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            messageCount: 12,
            topic: "Cosmetic Dentistry"
          }
        ]
        
        setRecentChats(mockChats)
      } catch (error) {
        console.error("Failed to fetch recent chats:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRecentChats()
  }, [userId])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Conversations</CardTitle>
          <CardDescription>Loading your chat history...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Conversations</span>
          <MessageSquare className="w-5 h-5 text-gray-400" />
        </CardTitle>
        <CardDescription>
          Continue where you left off
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentChats.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No conversations yet</p>
            <Button variant="outline" size="sm" className="mt-4" asChild>
              <Link href="/?openChat=true">
                Start a conversation
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {recentChats.map((chat) => (
              <Link
                key={chat.id}
                href={`/?openChat=true&sessionId=${chat.id}`}
                className="block group"
              >
                <div className="p-3 rounded-lg border hover:border-primary/50 hover:bg-gray-50 transition-all">
                  <div className="flex items-start justify-between mb-1">
                    <h4 className="text-sm font-medium line-clamp-1 group-hover:text-primary">
                      {chat.preview}
                    </h4>
                    <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatDistanceToNow(chat.lastMessage, { addSuffix: true })}
                    <span className="mx-2">•</span>
                    {chat.messageCount} messages
                    {chat.topic && (
                      <>
                        <span className="mx-2">•</span>
                        {chat.topic}
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            
            <Button variant="ghost" size="sm" className="w-full mt-2" asChild>
              <Link href="/chat/history">
                View all conversations
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}