'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ArrowRight, Users, UserCheck, FileCheck, CheckCircle2, Activity } from 'lucide-react'

interface FunnelStage {
  name: string
  count: number
  percentage: number
  icon: React.ReactNode
  color: string
}

interface ProfessionalFunnelProps {
  data: {
    visitors: number
    signups: number
    verificationStarted: number
    verificationSubmitted: number
    verified: number
    activeSubscribers: number
  }
}

export function ProfessionalFunnel({ data }: ProfessionalFunnelProps) {
  const stages: FunnelStage[] = [
    {
      name: 'Visitors',
      count: data.visitors,
      percentage: 100,
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
    },
    {
      name: 'Professional Signups',
      count: data.signups,
      percentage: (data.signups / data.visitors) * 100,
      icon: <UserCheck className="w-5 h-5" />,
      color: 'bg-indigo-500',
    },
    {
      name: 'Verification Started',
      count: data.verificationStarted,
      percentage: (data.verificationStarted / data.signups) * 100,
      icon: <FileCheck className="w-5 h-5" />,
      color: 'bg-purple-500',
    },
    {
      name: 'Verification Submitted',
      count: data.verificationSubmitted,
      percentage: (data.verificationSubmitted / data.verificationStarted) * 100,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-green-500',
    },
    {
      name: 'Verified Professionals',
      count: data.verified,
      percentage: (data.verified / data.verificationSubmitted) * 100,
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'bg-emerald-500',
    },
    {
      name: 'Active Subscribers',
      count: data.activeSubscribers,
      percentage: (data.activeSubscribers / data.verified) * 100,
      icon: <Activity className="w-5 h-5" />,
      color: 'bg-teal-500',
    },
  ]

  const calculateDropOff = (currentStage: number, previousStage: number) => {
    if (previousStage === 0) return 0
    return ((previousStage - currentStage) / previousStage * 100).toFixed(1)
  }

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Professional Conversion Funnel</CardTitle>
        <CardDescription>
          Track the journey from visitor to paying professional subscriber
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {stages.map((stage, index) => {
            const previousCount = index > 0 ? stages[index - 1].count : stage.count
            const dropOff = index > 0 ? calculateDropOff(stage.count, previousCount) : 0

            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${stage.color} bg-opacity-10`}>
                      <div className={`${stage.color.replace('bg-', 'text-')}`}>
                        {stage.icon}
                      </div>
                    </div>
                    <div>
                      <p className="font-medium">{stage.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {stage.count.toLocaleString()} users
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{stage.percentage.toFixed(1)}%</p>
                    {index > 0 && parseFloat(dropOff) > 0 && (
                      <p className="text-sm text-red-500">
                        -{dropOff}% drop-off
                      </p>
                    )}
                  </div>
                </div>
                <Progress 
                  value={stage.percentage} 
                  className="h-2"
                />
                {index < stages.length - 1 && (
                  <div className="flex justify-center mt-2 mb-4">
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-6 pt-6 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">
                {((data.verified / data.visitors) * 100).toFixed(2)}%
              </p>
              <p className="text-sm text-muted-foreground">
                Overall Conversion Rate
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                £{(data.activeSubscribers * 29.99).toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Monthly Recurring Revenue
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                £{((data.activeSubscribers * 29.99 * 12) / data.activeSubscribers).toFixed(0)}
              </p>
              <p className="text-sm text-muted-foreground">
                Avg. Annual Value
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}