"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame } from "lucide-react"
import { useEffect, useState } from "react"

interface ReadingStreakProps {
  userId: string
}

export function ReadingStreak({ userId }: ReadingStreakProps) {
  const [streak, setStreak] = useState(0)
  const [todayRead, setTodayRead] = useState(false)
  const [weekActivity, setWeekActivity] = useState<boolean[]>([])

  useEffect(() => {
    // In a real implementation, this would fetch from the database
    // For now, we'll use mock data
    const mockStreak = 7
    const mockTodayRead = true
    const mockWeekActivity = [true, true, false, true, true, true, true] // Last 7 days
    
    setStreak(mockStreak)
    setTodayRead(mockTodayRead)
    setWeekActivity(mockWeekActivity)
  }, [userId])

  const getDayName = (daysAgo: number) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    const date = new Date()
    date.setDate(date.getDate() - daysAgo)
    return days[date.getDay()]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Reading Streak</span>
          <div className="flex items-center text-orange-500">
            <Flame className="w-5 h-5 mr-1" />
            <span className="text-2xl font-bold">{streak}</span>
          </div>
        </CardTitle>
        <CardDescription>
          {todayRead ? "Great job! You've read today" : "Read an article to continue your streak"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekActivity.map((active, index) => {
            const daysAgo = weekActivity.length - 1 - index
            return (
              <div key={index} className="text-center">
                <div className="text-xs text-gray-500 mb-1">
                  {getDayName(daysAgo)}
                </div>
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center ${
                    active
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {active && <Flame className="w-4 h-4" />}
                </div>
                {daysAgo === 0 && (
                  <div className="text-xs font-medium mt-1">Today</div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}