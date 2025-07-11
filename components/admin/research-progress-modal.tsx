'use client'

import React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export interface ResearchStage {
  id: string
  name: string
  status: 'pending' | 'active' | 'completed' | 'error'
  message?: string
}

interface ResearchProgressModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  topic: string
  stages: ResearchStage[]
  error?: string
}

export function ResearchProgressModal({ 
  open, 
  onOpenChange, 
  topic,
  stages,
  error
}: ResearchProgressModalProps) {
  const completedStages = stages.filter(s => s.status === 'completed').length
  const totalStages = stages.length || 1
  const progress = (completedStages / totalStages) * 100

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Researching: {topic}</DialogTitle>
          <DialogDescription>
            AI is conducting comprehensive research on your topic. This may take a few minutes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Progress bar */}
          <div>
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stages */}
          <div className="space-y-3">
            {stages.map((stage) => (
              <div key={stage.id} className="flex items-start gap-3">
                <div className="mt-0.5">
                  {stage.status === 'completed' && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                  {stage.status === 'active' && (
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  )}
                  {stage.status === 'pending' && (
                    <Circle className="w-5 h-5 text-gray-400" />
                  )}
                  {stage.status === 'error' && (
                    <Circle className="w-5 h-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    stage.status === 'active' ? 'text-blue-600' :
                    stage.status === 'completed' ? 'text-green-600' :
                    stage.status === 'error' ? 'text-red-600' :
                    'text-gray-500'
                  }`}>
                    {stage.name}
                  </p>
                  {stage.message && (
                    <p className="text-sm text-gray-500 mt-0.5">{stage.message}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Error state */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}