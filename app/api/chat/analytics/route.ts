import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createRouteSupabaseClient, getCurrentUserProfile } from '@/lib/supabase-auth'

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the user's profile to get their database ID
    const userProfile = await getCurrentUserProfile()
    if (!userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 })
    }

    // Create authenticated Supabase client
    const supabase = await createRouteSupabaseClient()

    // Get all sessions and messages for analytics
    const { data: sessions } = await supabase
      .from('chat_sessions')
      .select(`
        id,
        created_at,
        last_activity,
        chat_messages (
          id,
          role,
          content,
          created_at
        )
      `)
      .eq('user_id', userProfile.id)

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({
        totalSessions: 0,
        totalMessages: 0,
        averageMessagesPerSession: 0,
        mostActiveTime: 'N/A',
        topTopics: [],
        responseTime: {
          average: 0,
          fastest: 0,
        },
      })
    }

    // Calculate basic stats
    const totalSessions = sessions.length
    const totalMessages = sessions.reduce((sum, session) => sum + (session.chat_messages?.length || 0), 0)
    const averageMessagesPerSession = totalMessages / totalSessions

    // Calculate most active time of day
    const hourCounts: Record<number, number> = {}
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours()
      hourCounts[hour] = (hourCounts[hour] || 0) + 1
    })
    const mostActiveHour = Object.entries(hourCounts).sort(([,a], [,b]) => b - a)[0]
    const mostActiveTime = mostActiveHour 
      ? `${mostActiveHour[0]}:00 - ${(parseInt(mostActiveHour[0]) + 1) % 24}:00`
      : 'N/A'

    // Analyze topics from user messages
    const topicKeywords = {
      'Tooth Pain': ['pain', 'hurt', 'ache', 'sensitive', 'toothache'],
      'Gum Health': ['gum', 'bleeding', 'gingivitis', 'periodontal'],
      'Dental Hygiene': ['brush', 'floss', 'clean', 'hygiene', 'toothpaste'],
      'Treatment Costs': ['cost', 'price', 'NHS', 'charge', 'fee', 'payment'],
      'Dental Anxiety': ['scared', 'nervous', 'anxious', 'fear', 'phobia'],
      'Emergency Care': ['emergency', 'urgent', 'immediately', 'severe'],
      'Children\'s Dental': ['child', 'kid', 'baby', 'toddler'],
      'Cosmetic Dentistry': ['whiten', 'cosmetic', 'veneers', 'smile'],
    }

    const topicCounts: Record<string, number> = {}
    
    sessions.forEach(session => {
      session.chat_messages?.forEach((message: any) => {
        if (message.role === 'user') {
          const lowerContent = message.content.toLowerCase()
          Object.entries(topicKeywords).forEach(([topic, keywords]) => {
            if (keywords.some(keyword => lowerContent.includes(keyword))) {
              topicCounts[topic] = (topicCounts[topic] || 0) + 1
            }
          })
        }
      })
    })

    const topTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, count]) => ({ topic, count }))

    // Calculate response times (mock data for now as we'd need to track actual response times)
    const responseTime = {
      average: 2.3,
      fastest: 0.8,
    }

    return NextResponse.json({
      totalSessions,
      totalMessages,
      averageMessagesPerSession,
      mostActiveTime,
      topTopics,
      responseTime,
    })
  } catch (error) {
    console.error('Chat analytics API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}