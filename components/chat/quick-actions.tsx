"use client"

import { Button } from "@/components/ui/button"
import { MessageSquarePlus, Lightbulb, Zap, List } from "lucide-react"

interface QuickActionsProps {
  onAction: (action: QuickAction) => void
  isLoading?: boolean
  messageContent: string
}

export type QuickAction = 
  | { type: 'more'; prompt: 'Tell me more about: ' }
  | { type: 'simpler'; prompt: 'Explain in simpler terms: ' }
  | { type: 'shorter'; prompt: 'Give me a shorter answer about: ' }
  | { type: 'examples'; prompt: 'Give me practical examples for: ' }

const actionButtons: Array<{
  action: QuickAction
  icon: React.ElementType
  label: string
  className?: string
}> = [
  {
    action: { type: 'more', prompt: 'Tell me more about: ' },
    icon: MessageSquarePlus,
    label: 'Tell me more',
  },
  {
    action: { type: 'simpler', prompt: 'Explain in simpler terms: ' },
    icon: Lightbulb,
    label: 'Simpler please',
  },
  {
    action: { type: 'shorter', prompt: 'Give me a shorter answer about: ' },
    icon: Zap,
    label: 'Too long',
  },
  {
    action: { type: 'examples', prompt: 'Give me practical examples for: ' },
    icon: List,
    label: 'Examples?',
  },
]

export function QuickActions({ onAction, isLoading, messageContent }: QuickActionsProps) {
  // Don't show quick actions for very short responses
  if (messageContent.length < 100) return null

  return (
    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
      <p className="text-xs text-gray-500 w-full mb-1">Quick adjustments:</p>
      {actionButtons.map((button) => {
        const Icon = button.icon
        return (
          <Button
            key={button.action.type}
            variant="outline"
            size="sm"
            onClick={() => onAction(button.action)}
            disabled={isLoading}
            className={`text-xs h-7 ${button.className || ''}`}
          >
            <Icon className="w-3 h-3 mr-1" />
            {button.label}
          </Button>
        )
      })}
    </div>
  )
}