'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Users } from 'lucide-react'
import { useUser } from '@clerk/nextjs'

interface RealtimePresenceProps {
  articleSlug: string
  className?: string
}

interface PresenceState {
  userId?: string
  userEmail?: string
  joinedAt: string
}

export function RealtimePresence({ articleSlug, className = '' }: RealtimePresenceProps) {
  const { user } = useUser()
  const [onlineCount, setOnlineCount] = useState(1)
  const [channel, setChannel] = useState<any>(null)

  useEffect(() => {
    if (!articleSlug) return

    // Create a unique presence key
    const presenceKey = user?.id || `anon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // Subscribe to presence channel for this article
    const articleChannel = supabase.channel(`article:${articleSlug}`)
    
    articleChannel
      .on('presence', { event: 'sync' }, () => {
        const state = articleChannel.presenceState()
        setOnlineCount(Object.keys(state).length || 1)
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track presence
          const presenceState: PresenceState = {
            userId: user?.id,
            userEmail: user?.emailAddresses[0]?.emailAddress,
            joinedAt: new Date().toISOString(),
          }
          
          await articleChannel.track(presenceState)
        }
      })

    setChannel(articleChannel)

    // Cleanup on unmount
    return () => {
      if (articleChannel) {
        articleChannel.untrack()
        articleChannel.unsubscribe()
      }
    }
  }, [articleSlug, user])

  if (onlineCount <= 1) {
    return null
  }

  return (
    <div className={`flex items-center gap-1.5 text-sm ${className}`}>
      <div className="relative">
        <Users className="w-4 h-4 text-green-600" />
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-green-600 rounded-full animate-pulse" />
      </div>
      <span className="text-green-600 font-medium">
        {onlineCount} {onlineCount === 1 ? 'person' : 'people'} reading now
      </span>
    </div>
  )
}