'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Trophy, Medal, Award, Crown, Star, Shield } from 'lucide-react'

interface LeaderboardEntry {
  id: string
  username: string
  reputation_score: number
  reputation_level: string
  reputation_badges: Array<{
    id: string
    name: string
    description: string
    icon: string
  }>
  avatar_url?: string
}

export function ReputationLeaderboard() {
  const [users, setUsers] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [timeframe, setTimeframe] = useState('all')
  const [selectedUser, setSelectedUser] = useState<LeaderboardEntry | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchLeaderboard()
  }, [timeframe])

  const fetchLeaderboard = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/moderation/leaderboard?timeframe=${timeframe}`)
      if (!response.ok) throw new Error('Failed to fetch leaderboard')
      const data = await response.json()
      setUsers(data.users)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load leaderboard',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'elite': return <Crown className="h-5 w-5 text-purple-600" />
      case 'expert': return <Star className="h-5 w-5 text-yellow-600" />
      case 'trusted': return <Shield className="h-5 w-5 text-blue-600" />
      case 'regular': return <Award className="h-5 w-5 text-green-600" />
      case 'contributor': return <Medal className="h-5 w-5 text-orange-600" />
      case 'member': return <Trophy className="h-5 w-5 text-gray-600" />
      default: return null
    }
  }

  const getLevelColor = (level: string): string => {
    switch (level) {
      case 'elite': return 'bg-purple-100 text-purple-800'
      case 'expert': return 'bg-yellow-100 text-yellow-800'
      case 'trusted': return 'bg-blue-100 text-blue-800'
      case 'regular': return 'bg-green-100 text-green-800'
      case 'contributor': return 'bg-orange-100 text-orange-800'
      case 'member': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">User Reputation Rankings</h3>
        <Select value={timeframe} onValueChange={setTimeframe}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leaderboard */}
      <div className="space-y-2">
        {users.map((user, index) => (
          <Card key={user.id} className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedUser(user)}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                {/* Rank */}
                <div className="w-12 flex justify-center">
                  {getRankIcon(index + 1)}
                </div>

                {/* User Info */}
                <Avatar>
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{user.username}</h4>
                    {getLevelIcon(user.reputation_level)}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className={getLevelColor(user.reputation_level)}>
                      {user.reputation_level}
                    </Badge>
                    {user.reputation_badges.length > 0 && (
                      <span className="text-sm text-muted-foreground">
                        {user.reputation_badges.length} badges
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Score */}
              <div className="text-right">
                <div className="text-2xl font-bold">{user.reputation_score}</div>
                <div className="text-sm text-muted-foreground">points</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected User Details */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>User Details: {selectedUser.username}</CardTitle>
            <CardDescription>
              Reputation score: {selectedUser.reputation_score} • Level: {selectedUser.reputation_level}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Badges */}
              <div>
                <h4 className="font-medium mb-2">Badges Earned</h4>
                {selectedUser.reputation_badges.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No badges earned yet</p>
                ) : (
                  <div className="grid gap-2 md:grid-cols-2">
                    {selectedUser.reputation_badges.map((badge) => (
                      <div key={badge.id} className="flex items-center gap-2 p-2 rounded-lg border">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="font-medium">{badge.name}</p>
                          <p className="text-xs text-muted-foreground">{badge.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Profile
                </Button>
                <Button variant="outline" size="sm">
                  View Activity
                </Button>
                <Button variant="outline" size="sm">
                  Adjust Reputation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}